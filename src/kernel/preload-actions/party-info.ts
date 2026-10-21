import type { AccountData } from '../../types/accounts'
import type {
  PartyActionResponse,
  PartyInfo,
  PartyMemberActionType,
} from '../../types/party-info'

import { ipcRenderer } from 'electron'

import { ElectronAPIEventKeys } from '../../config/constants/main-process'

export function getPartyInfo(account: AccountData): Promise<PartyInfo> {
  return ipcRenderer.invoke(ElectronAPIEventKeys.PartyGetInfo, account)
}

export function partyMemberAction(
  account: AccountData,
  type: PartyMemberActionType,
  memberId: string,
): Promise<PartyActionResponse> {
  return ipcRenderer.invoke(
    ElectronAPIEventKeys.PartyMemberAction,
    account,
    type,
    memberId,
  )
}

export function partySetPrivacy(
  account: AccountData,
  makePrivate: boolean,
): Promise<PartyActionResponse> {
  return ipcRenderer.invoke(
    ElectronAPIEventKeys.PartySetPrivacy,
    account,
    makePrivate,
  )
}

export function partyFixInvite(
  account: AccountData,
): Promise<PartyActionResponse> {
  return ipcRenderer.invoke(ElectronAPIEventKeys.PartyFixInvite, account)
}
