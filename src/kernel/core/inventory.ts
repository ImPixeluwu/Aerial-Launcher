import type { AccountData } from '../../types/accounts'
import type {
  InventoryOverview,
  InventoryProfileId,
} from '../../types/inventory'

import { Authentication } from './authentication'

import { getQueryProfileInventory } from '../../services/endpoints/mcp'

import { inventoryProfileIds } from '../../config/constants/inventory'

import {
  createEmptyInventoryOverview,
  parseInventoryProfile,
} from '../../lib/parsers/inventory'

export class Inventory {
  static async getOverview(
    account: AccountData,
    profileId: InventoryProfileId,
  ): Promise<InventoryOverview> {
    const failed = (error: string): InventoryOverview => ({
      ...createEmptyInventoryOverview(profileId),
      success: false,
      error,
    })

    if (!inventoryProfileIds.includes(profileId)) {
      return failed('Invalid profile')
    }

    try {
      const accessToken = await Authentication.verifyAccessToken(account)

      if (!accessToken) {
        return failed('Could not authenticate the account')
      }

      const response = await getQueryProfileInventory({
        accessToken,
        accountId: account.accountId,
        profileId,
      })

      return parseInventoryProfile(
        profileId,
        response.data.profileChanges?.[0]?.profile?.items ?? {},
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      return failed(error?.response?.data?.errorMessage ?? 'Unknown Error')
    }
  }
}
