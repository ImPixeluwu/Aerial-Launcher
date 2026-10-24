import type { AccountData } from '../../types/accounts'
import type { HomebaseOverview } from '../../types/homebase'

import { ipcRenderer } from 'electron'

import { ElectronAPIEventKeys } from '../../config/constants/main-process'

export function getHomebaseOverview(
  account: AccountData,
): Promise<HomebaseOverview> {
  return ipcRenderer.invoke(ElectronAPIEventKeys.HomebaseGetOverview, account)
}
