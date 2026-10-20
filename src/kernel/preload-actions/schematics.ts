import type { AccountData } from '../../types/accounts'
import type { SchematicsOverview } from '../../types/schematics'

import { ipcRenderer } from 'electron'

import { ElectronAPIEventKeys } from '../../config/constants/main-process'

export function getSchematicsOverview(
  account: AccountData,
): Promise<SchematicsOverview> {
  return ipcRenderer.invoke(ElectronAPIEventKeys.SchematicsGetOverview, account)
}
