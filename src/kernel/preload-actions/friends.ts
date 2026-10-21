import type { AccountData } from '../../types/accounts'
import type {
  FriendsActionResponse,
  FriendsActionType,
  FriendsSummary,
} from '../../types/friends-list'

import { ipcRenderer } from 'electron'

import { ElectronAPIEventKeys } from '../../config/constants/main-process'

export function getFriendsSummary(
  account: AccountData,
): Promise<FriendsSummary> {
  return ipcRenderer.invoke(ElectronAPIEventKeys.FriendsGetSummary, account)
}

export function friendsAction(
  account: AccountData,
  type: FriendsActionType,
  target: string,
): Promise<FriendsActionResponse> {
  return ipcRenderer.invoke(
    ElectronAPIEventKeys.FriendsAction,
    account,
    type,
    target,
  )
}
