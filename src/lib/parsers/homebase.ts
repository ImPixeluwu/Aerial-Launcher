import type {
  HomebaseOverview,
  HomebaseZone,
  HomebaseZoneId,
} from '../../types/homebase'
import type { MCPMetadataProfileItem } from '../../types/services/mcp/metadata-profile'

import {
  homebaseLookupBatchSize,
  homebaseZoneIds,
} from '../../config/constants/homebase'

const outpostCorePattern = /^outpost:outpostcore_(pve_\d{2})$/

export function createEmptyHomebaseZone(zoneId: HomebaseZoneId): HomebaseZone {
  return {
    zoneId,
    unlocked: false,
    level: null,
    highestEnduranceWave: 0,
    amplifierCount: 0,
    editPermissions: [],
    saveFile: null,
  }
}

export function createEmptyHomebaseOverview(): HomebaseOverview {
  return {
    success: true,
    zones: homebaseZoneIds.map(createEmptyHomebaseZone),
  }
}

export function getHomebaseZoneId(templateId: unknown): HomebaseZoneId | null {
  if (typeof templateId !== 'string') {
    return null
  }

  const zoneId = templateId.toLowerCase().match(outpostCorePattern)?.[1]

  return zoneId && homebaseZoneIds.includes(zoneId as HomebaseZoneId)
    ? (zoneId as HomebaseZoneId)
    : null
}

function toCount(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function parseSaveFile(item: MCPMetadataProfileItem) {
  const records = item.attributes?.cloud_save_info?.savedRecords

  if (!Array.isArray(records)) {
    return null
  }

  const sorted = records
    .filter(
      (record) =>
        typeof record?.recordFilename === 'string' &&
        record.recordFilename.length > 0,
    )
    .sort((a, b) => toCount(a.recordIndex) - toCount(b.recordIndex))

  return sorted[0]?.recordFilename ?? null
}

export function parseHomebaseZone(
  zoneId: HomebaseZoneId,
  item: MCPMetadataProfileItem,
): HomebaseZone {
  const attributes = item.attributes ?? {}
  const info = attributes.outpost_core_info ?? {}
  const level = attributes.level
  const editors = Array.isArray(info.accountsWithEditPermission)
    ? info.accountsWithEditPermission.filter(
        (accountId): accountId is string =>
          typeof accountId === 'string' && accountId.length > 0,
      )
    : []
  const buildings = Array.isArray(info.placedBuildings)
    ? info.placedBuildings
    : []

  return {
    zoneId,
    unlocked: true,
    level: typeof level === 'number' && Number.isFinite(level) ? level : null,
    highestEnduranceWave: toCount(info.highestEnduranceWaveReached),
    amplifierCount: buildings.filter(
      (building) => typeof building?.buildingTag === 'string',
    ).length,
    editPermissions: [...new Set(editors)].map((accountId) => ({
      accountId,
      displayName: null,
    })),
    saveFile: parseSaveFile(item),
  }
}

export function parseHomebaseProfile(
  items: Record<string, MCPMetadataProfileItem>,
): HomebaseOverview {
  const found = new Map<HomebaseZoneId, HomebaseZone>()

  Object.values(items).forEach((item) => {
    const zoneId = getHomebaseZoneId(item?.templateId)

    if (zoneId && !found.has(zoneId)) {
      found.set(zoneId, parseHomebaseZone(zoneId, item))
    }
  })

  return {
    success: true,
    zones: homebaseZoneIds.map(
      (zoneId) => found.get(zoneId) ?? createEmptyHomebaseZone(zoneId),
    ),
  }
}

export function getHomebaseEditorIds(overview: HomebaseOverview) {
  return [
    ...new Set(
      overview.zones.flatMap((zone) =>
        zone.editPermissions.map(({ accountId }) => accountId),
      ),
    ),
  ]
}

export function chunkAccountIds(
  accountIds: Array<string>,
  size = homebaseLookupBatchSize,
) {
  const chunks: Array<Array<string>> = []

  for (let index = 0; index < accountIds.length; index += size) {
    chunks.push(accountIds.slice(index, index + size))
  }

  return chunks
}

export function applyHomebaseDisplayNames(
  overview: HomebaseOverview,
  displayNames: Map<string, string>,
): HomebaseOverview {
  return {
    ...overview,
    zones: overview.zones.map((zone) => ({
      ...zone,
      editPermissions: zone.editPermissions.map((permission) => ({
        ...permission,
        displayName: displayNames.get(permission.accountId) ?? null,
      })),
    })),
  }
}
