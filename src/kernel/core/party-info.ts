import type { AccountData } from '../../types/accounts'
import type {
  PartyActionResponse,
  PartyInfo,
  PartyMemberActionType,
} from '../../types/party-info'
import type { PartyData } from '../../types/services/party'

import { stwFeatureAvailability } from '../../config/constants/feature-availability'
import { partyFixInviteDelay } from '../../config/constants/friends'

import { Authentication } from './authentication'
import { FriendsManager } from './friends'

import {
  fetchParty,
  kick,
  promote,
  updateParty,
} from '../../services/endpoints/party'

import {
  buildPartyPrivacyPatch,
  getPartyLeaderId,
  getPartyMembersWithoutName,
  isPartyPrivate,
  parsePartyInfo,
} from '../../lib/parsers/party-info'

const staleRevisionErrorCode =
  'errors.com.epicgames.social.party.stale_revision'
const changeForbiddenErrorCode =
  'errors.com.epicgames.social.party.party_change_forbidden'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFailure(error: any): PartyActionResponse {
  const data = error?.response?.data
  const errorCode: string | undefined = data?.errorCode

  if (errorCode === changeForbiddenErrorCode) {
    return {
      success: false,
      error: 'Only the party leader can do this',
      errorCode,
    }
  }

  return {
    success: false,
    error: data?.errorMessage ?? error?.message ?? 'Unknown Error',
    errorCode,
  }
}

/**
 * Status of the selected account's party and the leader actions on it. The
 * multi-account kick, leave and invite actions are in `Party`.
 */
export class PartyInfoManager {
  static async getInfo(account: AccountData): Promise<PartyInfo> {
    try {
      const accessToken = await Authentication.verifyAccessToken(account)

      if (!accessToken) {
        return {
          success: false,
          error: 'Could not authenticate the account',
          party: null,
          isLeader: false,
        }
      }

      const party = await PartyInfoManager.fetchCurrent(
        accessToken,
        account.accountId,
      )

      if (!party) {
        return { success: true, party: null, isLeader: false }
      }

      const missingNames = getPartyMembersWithoutName(party)
      const names =
        missingNames.length > 0
          ? await FriendsManager.resolveNames(accessToken, missingNames)
          : {}

      return {
        success: true,
        party: parsePartyInfo(party, names),
        isLeader: getPartyLeaderId(party) === account.accountId,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return { ...toFailure(error), party: null, isLeader: false }
    }
  }

  static async memberAction(
    account: AccountData,
    type: PartyMemberActionType,
    memberId: string,
  ): Promise<PartyActionResponse> {
    if (type !== 'kick' && type !== 'promote') {
      return { success: false, error: 'Invalid action' }
    }

    // Kicking uses the same request as the disabled "kick all"
    if (type === 'kick' && !stwFeatureAvailability.partyKick) {
      return { success: false, error: 'Temporarily unavailable' }
    }

    if (!memberId || memberId === account.accountId) {
      return { success: false, error: 'Select another party member' }
    }

    return PartyInfoManager.asLeader(account, async (accessToken, party) => {
      if (!party.members.some(({ account_id }) => account_id === memberId)) {
        return { success: false, error: 'The player is not in the party' }
      }

      const config = { accessToken, accountId: memberId, partyId: party.id }

      if (type === 'kick') {
        await kick(config)
      } else {
        await promote(config)
      }

      return { success: true }
    })
  }

  static async setPrivacy(
    account: AccountData,
    makePrivate: boolean,
  ): Promise<PartyActionResponse> {
    return PartyInfoManager.asLeader(account, async (accessToken, party) => {
      if (isPartyPrivate(party) !== makePrivate) {
        await PartyInfoManager.patchPrivacy(accessToken, party, makePrivate)
      }

      return { success: true }
    })
  }

  /**
   * Switches to the opposite privacy for a few seconds and restores it,
   * which refreshes the party so invites work again.
   */
  static async fixInvite(account: AccountData): Promise<PartyActionResponse> {
    return PartyInfoManager.asLeader(account, async (accessToken, party) => {
      const wasPrivate = isPartyPrivate(party)

      await PartyInfoManager.patchPrivacy(accessToken, party, !wasPrivate)
      await new Promise((resolve) => setTimeout(resolve, partyFixInviteDelay))

      // The token may have been renewed, and the party has a new revision
      const newAccessToken =
        (await Authentication.verifyAccessToken(account)) ?? accessToken
      const current = await PartyInfoManager.fetchCurrent(
        newAccessToken,
        account.accountId,
      )

      if (!current || current.id !== party.id) {
        return { success: false, error: 'The party changed' }
      }

      if (isPartyPrivate(current) !== wasPrivate) {
        await PartyInfoManager.patchPrivacy(
          newAccessToken,
          current,
          wasPrivate,
        )
      }

      return { success: true }
    })
  }

  private static async fetchCurrent(accessToken: string, accountId: string) {
    const response = await fetchParty({ accessToken, accountId })

    return (response.data?.current?.[0] as PartyData | undefined) ?? null
  }

  /**
   * Runs a leader action on the account's current party.
   */
  private static async asLeader(
    account: AccountData,
    callback: (
      accessToken: string,
      party: PartyData,
    ) => Promise<PartyActionResponse>,
  ): Promise<PartyActionResponse> {
    try {
      const accessToken = await Authentication.verifyAccessToken(account)

      if (!accessToken) {
        return { success: false, error: 'Could not authenticate the account' }
      }

      const party = await PartyInfoManager.fetchCurrent(
        accessToken,
        account.accountId,
      )

      if (!party) {
        return { success: false, error: 'You are not in a party' }
      }

      if (getPartyLeaderId(party) !== account.accountId) {
        return {
          success: false,
          error: 'Only the party leader can do this',
          errorCode: changeForbiddenErrorCode,
        }
      }

      return await callback(accessToken, party)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return toFailure(error)
    }
  }

  /**
   * Retries once with the revision Epic reports when ours is stale.
   */
  private static async patchPrivacy(
    accessToken: string,
    party: PartyData,
    makePrivate: boolean,
  ) {
    const send = (revision: number) =>
      updateParty({
        accessToken,
        partyId: party.id,
        body: buildPartyPrivacyPatch({ ...party, revision }, makePrivate),
      })

    try {
      await send(party.revision)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const data = error?.response?.data
      const revision = Number.parseInt(data?.messageVars?.[1], 10)

      if (data?.errorCode !== staleRevisionErrorCode || Number.isNaN(revision)) {
        throw error
      }

      await send(revision)
    }
  }
}
