import type { AccountData } from '../../types/accounts'
import type { HomebaseOverview } from '../../types/homebase'

import { Authentication } from './authentication'

import { findUsersByAccountIds } from '../../services/endpoints/lookup'
import { getQueryProfileMetadata } from '../../services/endpoints/mcp'

import {
  applyHomebaseDisplayNames,
  chunkAccountIds,
  createEmptyHomebaseOverview,
  getHomebaseEditorIds,
  parseHomebaseProfile,
} from '../../lib/parsers/homebase'

export class Homebase {
  static async getOverview(account: AccountData): Promise<HomebaseOverview> {
    const failed = (error: string): HomebaseOverview => ({
      ...createEmptyHomebaseOverview(),
      success: false,
      error,
    })

    try {
      const accessToken = await Authentication.verifyAccessToken(account)

      if (!accessToken) {
        return failed('Could not authenticate the account')
      }

      const response = await getQueryProfileMetadata({
        accessToken,
        accountId: account.accountId,
      })
      const overview = parseHomebaseProfile(
        response.data.profileChanges?.[0]?.profile?.items ?? {},
      )
      const displayNames = await Homebase.getDisplayNames(
        accessToken,
        getHomebaseEditorIds(overview),
      )

      return applyHomebaseDisplayNames(overview, displayNames)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return failed(error?.response?.data?.errorMessage ?? 'Unknown Error')
    }
  }

  /**
   * A failed lookup only hides the names; the ids are still shown.
   */
  private static async getDisplayNames(
    accessToken: string,
    accountIds: Array<string>,
  ) {
    const displayNames = new Map<string, string>()

    await Promise.all(
      chunkAccountIds(accountIds).map(async (chunk) => {
        try {
          const response = await findUsersByAccountIds({
            accessToken,
            accountIds: chunk,
          })

          response.data.forEach((user) => {
            if (user?.id && user.displayName) {
              displayNames.set(user.id, user.displayName)
            }
          })
        } catch {
          // Keep the ids without names.
        }
      }),
    )

    return displayNames
  }
}
