export type MCPQueryProfileMetadata = {
  profileRevision: number
  profileId: 'metadata'
  profileChangesBaseRevision: number
  profileChanges?: Array<{
    changeType: string
    profile?: {
      accountId: string
      profileId: 'metadata'
      items?: Record<string, MCPMetadataProfileItem>
    }
  }>
  profileCommandRevision: number
  serverTime: string
  responseVersion: number
}

export type MCPMetadataProfileItem = {
  templateId: string
  quantity?: number
  attributes?: {
    level?: number
    cloud_save_info?: {
      saveCount?: number
      savedRecords?: Array<{
        recordFilename?: string
        recordIndex?: number
        archiveNumber?: number
      }>
    }
    outpost_core_info?: {
      accountsWithEditPermission?: Array<string>
      highestEnduranceWaveReached?: number
      placedBuildings?: Array<{
        buildingTag?: string
        placedTag?: string
      }>
    }
  }
}
