export type PartyMemberInfo = {
  accountId: string
  /**
   * null when the name is unknown: the page shows a placeholder
   */
  displayName: string | null
  isLeader: boolean
  joinedAt: string | null
}

export type PartyInfoData = {
  partyId: string
  size: number
  maxSize: number
  isPrivate: boolean
  members: Array<PartyMemberInfo>
}

export type PartyInfo = {
  success: boolean
  error?: string
  errorCode?: string
  /**
   * null when the account is not in a party
   */
  party: PartyInfoData | null
  isLeader: boolean
}

export type PartyMemberActionType = 'kick' | 'promote'

export type PartyActionResponse = {
  success: boolean
  error?: string
  errorCode?: string
}
