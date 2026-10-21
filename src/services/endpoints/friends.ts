import type {
  FetchFriendResponse,
  FriendsSummaryResponse,
} from '../../types/services/friends'

import { friendsService } from '../config/friends'

export function getFriend({
  accessToken,
  accountId,
  friendId,
}: {
  accessToken: string
  accountId: string
  friendId: string
}) {
  return friendsService.get<FetchFriendResponse>(
    `/${accountId}/friends/${friendId}`,
    {
      headers: {
        Authorization: `bearer ${accessToken}`,
      },
    },
  )
}

export function addFriend({
  accessToken,
  accountId,
  friendId,
}: {
  accessToken: string
  accountId: string
  friendId: string
}) {
  return friendsService.post(
    `/${accountId}/friends/${friendId}`,
    {},
    {
      headers: {
        Authorization: `bearer ${accessToken}`,
      },
    },
  )
}

export function removeFriend({
  accessToken,
  accountId,
  friendId,
}: {
  accessToken: string
  accountId: string
  friendId: string
}) {
  return friendsService.delete(`/${accountId}/friends/${friendId}`, {
    headers: {
      Authorization: `bearer ${accessToken}`,
    },
  })
}

export function getFriendsSummary({
  accessToken,
  accountId,
}: {
  accessToken: string
  accountId: string
}) {
  return friendsService.get<FriendsSummaryResponse>(`/${accountId}/summary`, {
    headers: {
      Authorization: `bearer ${accessToken}`,
    },
  })
}

/**
 * The block list lives in the public API, outside the v1 base URL.
 */
const blocklistURL =
  'https://friends-public-service-prod.ol.epicgames.com/friends/api/public/blocklist'

export function blockUser({
  accessToken,
  accountId,
  userId,
}: {
  accessToken: string
  accountId: string
  userId: string
}) {
  return friendsService.post(
    `${blocklistURL}/${accountId}/${userId}`,
    {},
    {
      headers: {
        Authorization: `bearer ${accessToken}`,
      },
    },
  )
}

export function unblockUser({
  accessToken,
  accountId,
  userId,
}: {
  accessToken: string
  accountId: string
  userId: string
}) {
  return friendsService.delete(`${blocklistURL}/${accountId}/${userId}`, {
    headers: {
      Authorization: `bearer ${accessToken}`,
    },
  })
}
