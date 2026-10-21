import type { AccountData } from '../../types/accounts'
import type {
  FriendsActionResponse,
  FriendsActionType,
  FriendsSummary,
} from '../../types/friends-list'

import {
  friendsNamesBatchSize,
  friendsNamesConcurrency,
} from '../../config/constants/friends'

import { Authentication } from './authentication'
import { LookupManager } from './lookup'

import {
  addFriend,
  blockUser,
  getFriendsSummary,
  removeFriend,
  unblockUser,
} from '../../services/endpoints/friends'
import { findUsersByAccountIds } from '../../services/endpoints/lookup'

import {
  chunk,
  createEmptyFriendsSummary,
  getFriendsSummaryAccountIds,
  isEpicAccountId,
  normalizeFriendsSummary,
} from '../../lib/parsers/friends'

const friendsActionTypes: Array<FriendsActionType> = [
  'add',
  'accept',
  'reject',
  'cancel',
  'remove',
  'block',
  'unblock',
]

/**
 * Epic Games friends of an account. The local list of players to invite
 * from the party page is handled by `Party`.
 */
export class FriendsManager {
  static async getSummary(account: AccountData): Promise<FriendsSummary> {
    const failed = (error: string): FriendsSummary => ({
      ...createEmptyFriendsSummary(),
      success: false,
      error,
    })

    try {
      const accessToken = await Authentication.verifyAccessToken(account)

      if (!accessToken) {
        return failed('Could not authenticate the account')
      }

      const response = await getFriendsSummary({
        accessToken,
        accountId: account.accountId,
      })
      const names = await FriendsManager.resolveNames(
        accessToken,
        getFriendsSummaryAccountIds(response.data ?? {}),
      )

      return normalizeFriendsSummary(response.data ?? {}, names)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return failed(error?.response?.data?.errorMessage ?? 'Unknown Error')
    }
  }

  static async action(
    account: AccountData,
    type: FriendsActionType,
    target: string,
  ): Promise<FriendsActionResponse> {
    const value = `${target ?? ''}`.trim()

    if (!friendsActionTypes.includes(type)) {
      return { success: false, error: 'Invalid action' }
    }

    if (value === '') {
      return { success: false, error: 'Type a display name or account id' }
    }

    if (type !== 'add' && !isEpicAccountId(value)) {
      return { success: false, error: 'Invalid account id' }
    }

    try {
      const accessToken = await Authentication.verifyAccessToken(account)

      if (!accessToken) {
        return { success: false, error: 'Could not authenticate the account' }
      }

      const config = {
        accessToken,
        accountId: account.accountId,
      }

      if (type === 'add') {
        const user = await LookupManager.searchUserByDisplayName({
          account,
          displayName: value,
        })

        if (!user.success) {
          return {
            success: false,
            error: `${user.errorMessage ?? 'Player not found'}`,
          }
        }

        if (user.data.id === account.accountId) {
          return {
            success: false,
            error: 'You cannot add your own account',
          }
        }

        await addFriend({ ...config, friendId: user.data.id })

        return {
          success: true,
          accountId: user.data.id,
          displayName: user.data.displayName,
        }
      }

      switch (type) {
        case 'accept':
          await addFriend({ ...config, friendId: value })
          break

        case 'reject':
        case 'cancel':
        case 'remove':
          await removeFriend({ ...config, friendId: value })
          break

        case 'block':
          await blockUser({ ...config, userId: value })
          break

        case 'unblock':
          await unblockUser({ ...config, userId: value })
          break
      }

      return { success: true, accountId: value }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return {
        success: false,
        error: error?.response?.data?.errorMessage ?? 'Unknown Error',
      }
    }
  }

  /**
   * Names by account id. A batch that fails leaves its accounts unnamed
   * instead of failing the whole list.
   */
  static async resolveNames(accessToken: string, accountIds: Array<string>) {
    const names: Record<string, string> = {}
    const batches = chunk(accountIds, friendsNamesBatchSize)

    // A few requests at a time: accounts can have thousands of friends
    for (const group of chunk(batches, friendsNamesConcurrency)) {
      const responses = await Promise.allSettled(
        group.map((batch) =>
          findUsersByAccountIds({ accessToken, accountIds: batch }),
        ),
      )

      responses.forEach((response) => {
        if (response.status !== 'fulfilled') {
          return
        }

        const users = response.value.data ?? []

        users.forEach((user) => {
          // Console accounts may only have their platform name
          const externalName = Object.values(user?.externalAuths ?? {})
            .map(
              (auth) =>
                (auth as { externalDisplayName?: string } | undefined)
                  ?.externalDisplayName,
            )
            .find(Boolean)
          const name = user?.displayName || externalName

          if (user?.id && name) {
            names[user.id] = name
          }
        })
      })
    }

    return names
  }
}
