export type HomebaseZoneId = 'pve_01' | 'pve_02' | 'pve_03' | 'pve_04'

export type HomebaseEditPermission = {
  accountId: string
  displayName: string | null
}

export type HomebaseZone = {
  zoneId: HomebaseZoneId
  unlocked: boolean
  level: number | null
  highestEnduranceWave: number
  amplifierCount: number
  editPermissions: Array<HomebaseEditPermission>
  saveFile: string | null
}

export type HomebaseOverview = {
  success: boolean
  error?: string
  zones: Array<HomebaseZone>
}
