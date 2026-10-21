import type { PartyInfoData } from '../../types/party-info'
import type { PartyData, PartyPatchBody } from '../../types/services/party'

import { PartyRole } from '../../config/constants/fortnite/party'

import { getFriendDisplayName } from './friends'

/**
 * Pure helpers of the party status card.
 */

export const partyMemberNameKey = 'urn:epic:member:dn_s'
const privacySettingsKey = 'Default:PrivacySettings_j'

export function isPartyPrivate(party: Pick<PartyData, 'config'>) {
  return party.config.joinability !== 'OPEN'
}

/**
 * Members without a name in their party meta, to resolve them.
 */
export function getPartyMembersWithoutName(party: PartyData) {
  return party.members
    .filter(
      (member) =>
        getFriendDisplayName(
          member.account_id,
          member.meta?.[partyMemberNameKey] as string | undefined,
        ) === null,
    )
    .map((member) => member.account_id)
}

/**
 * Leader first, then the others in the order they joined.
 */
export function parsePartyInfo(
  party: PartyData,
  names: Record<string, string> = {},
): PartyInfoData {
  const members = party.members
    .map((member) => ({
      accountId: member.account_id,
      displayName:
        getFriendDisplayName(
          member.account_id,
          member.meta?.[partyMemberNameKey] as string | undefined,
        ) ?? getFriendDisplayName(member.account_id, names[member.account_id]),
      isLeader: member.role === PartyRole.CAPTAIN,
      joinedAt: member.joined_at ?? null,
    }))
    .toSorted((memberA, memberB) => {
      if (memberA.isLeader !== memberB.isLeader) {
        return memberA.isLeader ? -1 : 1
      }

      return (memberA.joinedAt ?? '').localeCompare(memberB.joinedAt ?? '')
    })

  return {
    partyId: party.id,
    size: members.length,
    maxSize: party.config.max_size,
    isPrivate: isPartyPrivate(party),
    members,
  }
}

export function getPartyLeaderId(party: PartyData) {
  return (
    party.members.find((member) => member.role === PartyRole.CAPTAIN)
      ?.account_id ?? null
  )
}

/**
 * Body of the party PATCH that changes its privacy, the same fields the
 * game client sends for the public and private presets.
 */
export function buildPartyPrivacyPatch(
  party: PartyData,
  makePrivate: boolean,
): PartyPatchBody {
  const update: Record<string, string> = {}
  const remove: Array<string> = []
  const currentPrivacy = party.meta?.[privacySettingsKey]

  if (currentPrivacy !== undefined) {
    let parsed: { PrivacySettings?: Record<string, unknown> } = {}

    try {
      parsed = JSON.parse(currentPrivacy) ?? {}

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      //
    }

    update[privacySettingsKey] = JSON.stringify({
      ...parsed,
      PrivacySettings: {
        ...(parsed.PrivacySettings ?? {}),
        partyType: makePrivate ? 'Private' : 'Public',
        bOnlyLeaderFriendsCanJoin: makePrivate,
        partyInviteRestriction: makePrivate ? 'LeaderOnly' : 'AnyMember',
      },
    })
  }

  update['urn:epic:cfg:presence-perm_s'] = makePrivate ? 'Noone' : 'Anyone'
  update['urn:epic:cfg:accepting-members_b'] = makePrivate ? 'false' : 'true'
  update['urn:epic:cfg:invite-perm_s'] = makePrivate ? 'Leader' : 'Anyone'

  if (makePrivate) {
    remove.push('urn:epic:cfg:not-accepting-members')
    update['urn:epic:cfg:not-accepting-members-reason_i'] = '7'
  } else {
    remove.push('urn:epic:cfg:not-accepting-members-reason_i')
  }

  const joinability = makePrivate ? 'INVITE_AND_FORMER' : 'OPEN'

  return {
    config: {
      join_confirmation: party.config.join_confirmation,
      joinability,
      max_size: party.config.max_size,
      discoverability: makePrivate ? 'INVITED_ONLY' : 'ALL',
    },
    meta: {
      delete: remove,
      update,
    },
    party_state_overridden: {},
    party_privacy_type: joinability,
    party_type: party.config.type,
    party_sub_type: party.config.sub_type,
    max_number_of_members: party.config.max_size,
    invite_ttl_seconds: party.config.invite_ttl,
    revision: party.revision,
  }
}
