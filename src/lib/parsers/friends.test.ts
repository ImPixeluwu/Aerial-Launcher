import type { FriendsLists } from '../../types/friends-list'

import { describe, expect, it } from 'vitest'

import {
  applyFriendsAction,
  buildAccountIdsQuery,
  chunk,
  filterFriends,
  getFriendDisplayName,
  getFriendsSummaryAccountIds,
  isEpicAccountId,
  normalizeFriendsSummary,
} from './friends'

const ids = {
  alpha: 'a'.repeat(32),
  bravo: 'b'.repeat(32),
  charlie: 'c'.repeat(32),
  delta: 'd'.repeat(32),
  echo: 'e'.repeat(32),
}

describe('normalizeFriendsSummary', () => {
  const summary = {
    friends: [
      { accountId: ids.bravo, created: '2024-01-01T00:00:00Z', mutual: 3 },
      { accountId: ids.alpha },
    ],
    incoming: [{ accountId: ids.charlie }],
    outgoing: [{ accountId: ids.delta }],
    blocklist: [{ accountId: ids.echo }],
  }
  const names = {
    [ids.alpha]: 'alpha',
    [ids.bravo]: 'Bravo',
    [ids.charlie]: 'Charlie',
    [ids.delta]: 'Delta',
    [ids.echo]: 'Echo',
  }

  it('returns the four lists sorted by name, with their names', () => {
    const result = normalizeFriendsSummary(summary, names)

    expect(result.success).toBe(true)
    expect(result.friends.map((entry) => entry.displayName)).toEqual([
      'alpha',
      'Bravo',
    ])
    expect(result.friends[1]).toEqual({
      accountId: ids.bravo,
      displayName: 'Bravo',
      created: '2024-01-01T00:00:00Z',
      mutual: 3,
    })
    expect(result.incoming[0].displayName).toBe('Charlie')
    expect(result.outgoing[0].displayName).toBe('Delta')
    expect(result.blocked[0].displayName).toBe('Echo')
  })

  it('drops duplicated ids and entries without an id', () => {
    const result = normalizeFriendsSummary(
      {
        friends: [
          { accountId: ids.alpha },
          { accountId: ids.alpha },
          {} as { accountId: string },
        ],
      },
      names,
    )

    expect(result.friends).toHaveLength(1)
    expect(result.incoming).toEqual([])
    expect(result.blocked).toEqual([])
  })

  it('collects every id once to resolve the names', () => {
    expect(
      getFriendsSummaryAccountIds({
        ...summary,
        incoming: [{ accountId: ids.alpha }],
      }).toSorted(),
    ).toEqual([ids.alpha, ids.bravo, ids.delta, ids.echo])
  })

  it('puts entries without a name last', () => {
    const result = normalizeFriendsSummary(summary, { [ids.bravo]: 'Bravo' })

    expect(result.friends.map((entry) => entry.accountId)).toEqual([
      ids.bravo,
      ids.alpha,
    ])
  })
})

describe('getFriendDisplayName', () => {
  it('uses a placeholder for empty names, the id or a hex id', () => {
    expect(getFriendDisplayName(ids.alpha, '')).toBeNull()
    expect(getFriendDisplayName(ids.alpha, '   ')).toBeNull()
    expect(getFriendDisplayName(ids.alpha, undefined)).toBeNull()
    expect(getFriendDisplayName(ids.alpha, ids.alpha.toUpperCase())).toBeNull()
    expect(getFriendDisplayName(ids.alpha, ids.bravo)).toBeNull()
  })

  it('keeps a normal name', () => {
    expect(getFriendDisplayName(ids.alpha, ' Player One ')).toBe('Player One')
  })
})

describe('helpers', () => {
  it('splits 250 ids into batches of 100', () => {
    const list = Array.from({ length: 250 }, (_, index) => `${index}`)

    expect(chunk(list, 100).map((batch) => batch.length)).toEqual([
      100, 100, 50,
    ])
  })

  it('repeats the accountId key in the names query', () => {
    expect(buildAccountIdsQuery(['a', 'b'])).toBe('accountId=a&accountId=b')
  })

  it('recognises account ids in any case', () => {
    expect(isEpicAccountId('0123456789abcdef0123456789ABCDEF')).toBe(true)
    expect(isEpicAccountId(' 0123456789abcdef0123456789abcdef ')).toBe(true)
    expect(isEpicAccountId('0123456789abcdef')).toBe(false)
    expect(isEpicAccountId('g'.repeat(32))).toBe(false)
    expect(isEpicAccountId('PlayerOne')).toBe(false)
  })
})

describe('filterFriends', () => {
  const entries = normalizeFriendsSummary(
    { friends: [{ accountId: ids.alpha }, { accountId: ids.bravo }] },
    { [ids.alpha]: 'Alpha Wolf', [ids.bravo]: 'Bravo' },
  ).friends

  it('finds by part of the name or the id, ignoring case', () => {
    expect(filterFriends(entries, 'WOLF').map((e) => e.accountId)).toEqual([
      ids.alpha,
    ])
    expect(filterFriends(entries, 'BBB').map((e) => e.accountId)).toEqual([
      ids.bravo,
    ])
  })

  it('returns the whole list for an empty query', () => {
    expect(filterFriends(entries, '')).toBe(entries)
    expect(filterFriends(entries, '   ')).toBe(entries)
  })
})

describe('applyFriendsAction', () => {
  const lists: FriendsLists = normalizeFriendsSummary(
    {
      friends: [{ accountId: ids.alpha }],
      incoming: [{ accountId: ids.bravo }],
      outgoing: [{ accountId: ids.charlie }],
      blocklist: [{ accountId: ids.delta }],
    },
    {
      [ids.alpha]: 'Alpha',
      [ids.bravo]: 'Bravo',
      [ids.charlie]: 'Charlie',
      [ids.delta]: 'Delta',
    },
  )

  it('moves an accepted request to the friends', () => {
    const result = applyFriendsAction(lists, 'accept', ids.bravo)

    expect(result.incoming).toEqual([])
    expect(result.friends.map((entry) => entry.displayName)).toEqual([
      'Alpha',
      'Bravo',
    ])
  })

  it('moves a blocked friend to the blocked list', () => {
    const result = applyFriendsAction(lists, 'block', ids.alpha)

    expect(result.friends).toEqual([])
    expect(result.blocked.map((entry) => entry.displayName)).toEqual([
      'Alpha',
      'Delta',
    ])
  })

  it('removes the entry from its list for the other actions', () => {
    expect(applyFriendsAction(lists, 'remove', ids.alpha).friends).toEqual([])
    expect(applyFriendsAction(lists, 'reject', ids.bravo).incoming).toEqual([])
    expect(applyFriendsAction(lists, 'cancel', ids.charlie).outgoing).toEqual(
      [],
    )
    expect(applyFriendsAction(lists, 'unblock', ids.delta).blocked).toEqual([])
  })
})
