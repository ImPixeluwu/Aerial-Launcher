/**
 * Epic Games friends of an account. Not the same as `FriendRecord`, the
 * local list of players to invite from the party page.
 */

export type FriendsListType = 'friends' | 'incoming' | 'outgoing' | 'blocked'

export type FriendsEntry = {
  accountId: string
  /**
   * null when Epic has no usable name: the page shows a placeholder
   */
  displayName: string | null
  created: string | null
  mutual: number | null
}

export type FriendsLists = Record<FriendsListType, Array<FriendsEntry>>

export type FriendsSummary = FriendsLists & {
  success: boolean
  error?: string
}

export type FriendsActionType =
  | 'add'
  | 'accept'
  | 'reject'
  | 'cancel'
  | 'remove'
  | 'block'
  | 'unblock'

export type FriendsActionResponse = {
  success: boolean
  error?: string
  accountId?: string
  displayName?: string | null
}
