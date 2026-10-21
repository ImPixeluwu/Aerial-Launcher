import type {
  LookupFindManyByDisplayNameResponse,
  LookupFindOneByDisplayNameResponse,
} from '../../types/services/lookup'

import { publicAccountService } from '../config/public-account'

import { buildAccountIdsQuery } from '../../lib/parsers/friends'

export function findUserByAccountId({
  accessToken,
  accountId,
}: {
  accessToken: string
  accountId: string
}) {
  return publicAccountService.get<LookupFindOneByDisplayNameResponse>(
    `/${accountId}`,
    {
      headers: {
        Authorization: `bearer ${accessToken}`,
      },
    }
  )
}

export function findUserByDisplayName({
  accessToken,
  displayName,
}: {
  accessToken: string
  displayName: string
}) {
  return publicAccountService.get<LookupFindOneByDisplayNameResponse>(
    `/displayName/${displayName}`,
    {
      headers: {
        Authorization: `bearer ${accessToken}`,
      },
    }
  )
}

export function findUserByExternalDisplayName({
  accessToken,
  displayName,
  externalAuthType,
}: {
  accessToken: string
  displayName: string
  externalAuthType: 'psn' | 'xbl'
}) {
  return publicAccountService.get<LookupFindManyByDisplayNameResponse>(
    `/lookup/externalAuth/${externalAuthType}/displayName/${displayName}?caseInsensitive=true`,
    {
      headers: {
        Authorization: `bearer ${accessToken}`,
      },
    }
  )
}

/**
 * Up to 100 accounts per request. The URL is absolute: joined to the base
 * URL, axios would add a slash before the query.
 */
export function findUsersByAccountIds({
  accessToken,
  accountIds,
}: {
  accessToken: string
  accountIds: Array<string>
}) {
  return publicAccountService.get<
    Array<LookupFindOneByDisplayNameResponse>
  >(`${publicAccountService.defaults.baseURL}?${buildAccountIdsQuery(accountIds)}`, {
    headers: {
      Authorization: `bearer ${accessToken}`,
    },
  })
}
