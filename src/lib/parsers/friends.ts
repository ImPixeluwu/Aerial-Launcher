import type {
  FriendsActionType,
  FriendsEntry,
  FriendsLists,
  FriendsListType,
  FriendsSummary,
} from '../../types/friends-list'
import type {
  FriendsSummaryEntry,
  FriendsSummaryResponse,
} from '../../types/services/friends'

import { friendsListTypes } from '../../config/constants/friends'

/**
 * Pure helpers of the Epic friends page, shared by the main process and the
 * renderer.
 */

const accountIdPattern = /^[0-9a-f]{32}$/i

export function isEpicAccountId(value: string) {
  return accountIdPattern.test(value.trim())
}

/**
 * Epic sometimes returns no name, or the account id as the name: those show
 * a placeholder instead (null).
 */
export function getFriendDisplayName(
  accountId: string,
  displayName?: string | null,
) {
  const name = displayName?.trim() ?? ''

  if (
    name === '' ||
    name.toLowerCase() === accountId.toLowerCase() ||
    accountIdPattern.test(name)
  ) {
    return null
  }

  return name
}

export function chunk<T>(list: Array<T>, size: number) {
  const result: Array<Array<T>> = []

  for (let index = 0; index < list.length; index += size) {
    result.push(list.slice(index, index + size))
  }

  return result
}

/**
 * `accountId=a&accountId=b`: the account service wants the key repeated,
 * not the `accountId[]=` that axios builds from an array.
 */
export function buildAccountIdsQuery(accountIds: Array<string>) {
  return accountIds
    .map((accountId) => `accountId=${encodeURIComponent(accountId)}`)
    .join('&')
}

export function compareFriendsEntries(
  entryA: FriendsEntry,
  entryB: FriendsEntry,
) {
  // Unnamed entries go last
  if (entryA.displayName === null || entryB.displayName === null) {
    if (entryA.displayName === entryB.displayName) {
      return entryA.accountId.localeCompare(entryB.accountId)
    }

    return entryA.displayName === null ? 1 : -1
  }

  return (
    entryA.displayName.localeCompare(entryB.displayName, undefined, {
      sensitivity: 'base',
    }) || entryA.accountId.localeCompare(entryB.accountId)
  )
}

export function createEmptyFriendsLists(): FriendsLists {
  return {
    friends: [],
    incoming: [],
    outgoing: [],
    blocked: [],
  }
}

export function createEmptyFriendsSummary(): FriendsSummary {
  return {
    success: true,
    ...createEmptyFriendsLists(),
  }
}

function summaryLists(
  summary: FriendsSummaryResponse,
): Record<FriendsListType, Array<Partial<FriendsSummaryEntry>>> {
  return {
    friends: summary.friends ?? [],
    incoming: summary.incoming ?? [],
    outgoing: summary.outgoing ?? [],
    blocked: summary.blocklist ?? [],
  }
}

/**
 * Every account id of the summary, once, to resolve their names.
 */
export function getFriendsSummaryAccountIds(
  summary: FriendsSummaryResponse,
) {
  const accountIds = new Set<string>()

  Object.values(summaryLists(summary)).forEach((list) =>
    list.forEach((entry) => {
      if (entry?.accountId) {
        accountIds.add(entry.accountId)
      }
    }),
  )

  return [...accountIds]
}

export function normalizeFriendsSummary(
  summary: FriendsSummaryResponse,
  names: Record<string, string>,
): FriendsSummary {
  const result = createEmptyFriendsSummary()
  const lists = summaryLists(summary)

  friendsListTypes.forEach((type) => {
    const seen = new Set<string>()

    result[type] = lists[type]
      .filter((entry) => {
        if (!entry?.accountId || seen.has(entry.accountId)) {
          return false
        }

        seen.add(entry.accountId)

        return true
      })
      .map((entry) => {
        const accountId = entry.accountId as string

        return {
          accountId,
          displayName: getFriendDisplayName(accountId, names[accountId]),
          created: entry.created ?? null,
          mutual: typeof entry.mutual === 'number' ? entry.mutual : null,
        }
      })
      .toSorted(compareFriendsEntries)
  })

  return result
}

export function filterFriends(entries: Array<FriendsEntry>, query: string) {
  const value = query.trim().toLowerCase()

  if (value === '') {
    return entries
  }

  return entries.filter(
    (entry) =>
      entry.accountId.toLowerCase().includes(value) ||
      (entry.displayName?.toLowerCase().includes(value) ?? false),
  )
}

/**
 * The list a successful action leaves, without reloading the summary.
 * `add` is not handled here: the page reloads to show the new request.
 */
export function applyFriendsAction(
  lists: FriendsLists,
  type: Exclude<FriendsActionType, 'add'>,
  accountId: string,
): FriendsLists {
  const without = (list: Array<FriendsEntry>) =>
    list.filter((entry) => entry.accountId !== accountId)
  const find = () =>
    friendsListTypes
      .map((listType) => lists[listType])
      .flat()
      .find((entry) => entry.accountId === accountId) ?? {
      accountId,
      displayName: null,
      created: null,
      mutual: null,
    }

  switch (type) {
    case 'accept': {
      const entry = lists.incoming.find(
        (current) => current.accountId === accountId,
      )

      return {
        ...lists,
        incoming: without(lists.incoming),
        friends: entry
          ? [...without(lists.friends), entry].toSorted(compareFriendsEntries)
          : lists.friends,
      }
    }

    case 'block': {
      const entry = find()

      return {
        friends: without(lists.friends),
        incoming: without(lists.incoming),
        outgoing: without(lists.outgoing),
        blocked: [...without(lists.blocked), entry].toSorted(
          compareFriendsEntries,
        ),
      }
    }

    case 'remove':
      return { ...lists, friends: without(lists.friends) }

    case 'reject':
      return { ...lists, incoming: without(lists.incoming) }

    case 'cancel':
      return { ...lists, outgoing: without(lists.outgoing) }

    case 'unblock':
      return { ...lists, blocked: without(lists.blocked) }
  }
}
