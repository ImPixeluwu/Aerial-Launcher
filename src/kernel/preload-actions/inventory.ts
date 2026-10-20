import type { AccountData } from '../../types/accounts'
import type {
  InventoryOverview,
  InventoryProfileId,
} from '../../types/inventory'

import { ipcRenderer } from 'electron'

import { ElectronAPIEventKeys } from '../../config/constants/main-process'

export function getInventoryOverview(
  account: AccountData,
  profileId: InventoryProfileId,
): Promise<InventoryOverview> {
  return ipcRenderer.invoke(
    ElectronAPIEventKeys.InventoryGetOverview,
    account,
    profileId,
  )
}
