import type { FriendsListType } from '../../types/friends-list'

export const friendsListTypes: Array<FriendsListType> = [
  'friends',
  'incoming',
  'outgoing',
  'blocked',
]

export const friendsSearchDelay = 150

/**
 * Wait between the calls of a bulk action, so Epic does not rate limit it.
 */
export const friendsBulkDelay = 1_000

/**
 * Most account ids the account service resolves in one request.
 */
export const friendsNamesBatchSize = 100

/**
 * Name requests sent at the same time.
 */
export const friendsNamesConcurrency = 4

/**
 * Seconds between retries while the account is not in a party.
 */
export const partyRetrySeconds = 10

/**
 * How long "fix invite" keeps the opposite privacy before restoring it.
 */
export const partyFixInviteDelay = 5_000
