import type { AccountData } from '../../types/accounts'
import type { SchematicsOverview } from '../../types/schematics'

import { Authentication } from './authentication'

import { getQueryProfileInventory } from '../../services/endpoints/mcp'

import { parseSchematicsProfiles } from '../../lib/parsers/schematics'
import { createEmptySchematicsOverview } from '../../lib/parsers/schematics-list'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function errorMessage(error: any) {
  return error?.response?.data?.errorMessage ?? 'Unknown Error'
}

export class Schematics {
  /**
   * Weapon and trap schematics from the campaign profile and the
   * collection book. If only the collection book fails, the campaign
   * schematics are still returned.
   */
  static async getOverview(account: AccountData): Promise<SchematicsOverview> {
    const failed = (error: string): SchematicsOverview => ({
      ...createEmptySchematicsOverview(),
      success: false,
      error,
    })

    try {
      const accessToken = await Authentication.verifyAccessToken(account)

      if (!accessToken) {
        return failed('Could not authenticate the account')
      }

      const query = (profileId: 'campaign' | 'collection_book_schematics0') =>
        getQueryProfileInventory({
          accessToken,
          accountId: account.accountId,
          profileId,
        })
      const [campaign, collectionBook] = await Promise.allSettled([
        query('campaign'),
        query('collection_book_schematics0'),
      ])

      if (campaign.status === 'rejected') {
        return failed(errorMessage(campaign.reason))
      }

      const overview = parseSchematicsProfiles({
        campaign: campaign.value.data.profileChanges?.[0]?.profile?.items ?? {},
        collectionBook:
          collectionBook.status === 'fulfilled'
            ? collectionBook.value.data.profileChanges?.[0]?.profile?.items ??
              {}
            : null,
      })

      if (collectionBook.status === 'rejected') {
        overview.collectionBookError = errorMessage(collectionBook.reason)
      }

      return overview
    } catch (error) {
      return failed(errorMessage(error))
    }
  }
}
