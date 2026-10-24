import type { MCPMetadataProfileItem } from '../../types/services/mcp/metadata-profile'

import { describe, expect, it } from 'vitest'

import {
  applyHomebaseDisplayNames,
  chunkAccountIds,
  getHomebaseEditorIds,
  parseHomebaseProfile,
} from './homebase'

const editorId = '00000000000000000000000000000001'

function core(
  zone: string,
  itemId: string,
  level: number,
  archiveNumber: number,
): MCPMetadataProfileItem {
  return {
    templateId: `Outpost:outpostcore_${zone}`,
    attributes: {
      cloud_save_info: {
        saveCount: 1,
        savedRecords: [
          {
            recordFilename: `${itemId}_r0_a${archiveNumber}.sav`,
            recordIndex: 0,
            archiveNumber,
          },
        ],
      },
      level,
      outpost_core_info: {
        accountsWithEditPermission: [editorId],
        highestEnduranceWaveReached: 0,
        placedBuildings: [0, 1, 2].map((index) => ({
          buildingTag: `Outpost.BuildingActor.Building.0${index}`,
          placedTag: `Outpost.PlacementActor.Placement.0${index}`,
        })),
      },
    },
    quantity: 1,
  }
}

// Shape of a real metadata profile (two unlocked zones), with ids replaced.
const realProfileItems: Record<string, MCPMetadataProfileItem> = {
  'item-a': core('pve_01', 'item-a', 6, 0),
  'item-b': core('pve_02', 'item-b', 4, 1),
}

describe('parseHomebaseProfile', () => {
  const overview = parseHomebaseProfile(realProfileItems)

  it('always returns the four zones in order', () => {
    expect(overview.success).toBe(true)
    expect(overview.zones.map((zone) => zone.zoneId)).toEqual([
      'pve_01',
      'pve_02',
      'pve_03',
      'pve_04',
    ])
  })

  it('reads the unlocked zones', () => {
    expect(overview.zones[0]).toEqual({
      zoneId: 'pve_01',
      unlocked: true,
      level: 6,
      highestEnduranceWave: 0,
      amplifierCount: 3,
      editPermissions: [{ accountId: editorId, displayName: null }],
      saveFile: 'item-a_r0_a0.sav',
    })
    expect(overview.zones[1].level).toBe(4)
    expect(overview.zones[1].saveFile).toBe('item-b_r0_a1.sav')
  })

  it('marks zones without a core as locked', () => {
    for (const zone of overview.zones.slice(2)) {
      expect(zone).toEqual({
        zoneId: zone.zoneId,
        unlocked: false,
        level: null,
        highestEnduranceWave: 0,
        amplifierCount: 0,
        editPermissions: [],
        saveFile: null,
      })
    }
  })

  it('matches template ids case-insensitively and ignores others', () => {
    const result = parseHomebaseProfile({
      a: { templateId: 'OUTPOST:OUTPOSTCORE_PVE_03' },
      b: { templateId: 'Outpost:outpostcore_pve_5' },
      c: { templateId: 'Outpost:outpostcore_pve_05' },
      d: { templateId: 'Outpost:other' },
    })

    expect(result.zones.map((zone) => zone.unlocked)).toEqual([
      false,
      false,
      true,
      false,
    ])
  })

  it('uses defaults when attributes are missing', () => {
    const zone = parseHomebaseProfile({
      a: { templateId: 'Outpost:outpostcore_pve_01' },
    }).zones[0]

    expect(zone).toEqual({
      zoneId: 'pve_01',
      unlocked: true,
      level: null,
      highestEnduranceWave: 0,
      amplifierCount: 0,
      editPermissions: [],
      saveFile: null,
    })
  })

  it('picks the save record with the lowest index', () => {
    const zone = parseHomebaseProfile({
      a: {
        templateId: 'Outpost:outpostcore_pve_01',
        attributes: {
          cloud_save_info: {
            savedRecords: [
              { recordFilename: 'second.sav', recordIndex: 1 },
              { recordFilename: 'first.sav', recordIndex: 0 },
            ],
          },
        },
      },
    }).zones[0]

    expect(zone.saveFile).toBe('first.sav')
  })

  it('removes repeated edit permissions', () => {
    const zone = parseHomebaseProfile({
      a: {
        templateId: 'Outpost:outpostcore_pve_01',
        attributes: {
          outpost_core_info: {
            accountsWithEditPermission: [editorId, editorId, 'other'],
          },
        },
      },
    }).zones[0]

    expect(zone.editPermissions.map(({ accountId }) => accountId)).toEqual([
      editorId,
      'other',
    ])
  })
})

describe('display names', () => {
  it('assigns resolved names by id and leaves the rest empty', () => {
    const overview = parseHomebaseProfile({
      a: {
        templateId: 'Outpost:outpostcore_pve_01',
        attributes: {
          outpost_core_info: {
            accountsWithEditPermission: [editorId, 'unknown'],
          },
        },
      },
      b: {
        templateId: 'Outpost:outpostcore_pve_02',
        attributes: {
          outpost_core_info: { accountsWithEditPermission: [editorId] },
        },
      },
    })

    expect(getHomebaseEditorIds(overview)).toEqual([editorId, 'unknown'])

    const named = applyHomebaseDisplayNames(
      overview,
      new Map([[editorId, 'Friend']]),
    )

    expect(named.zones[0].editPermissions).toEqual([
      { accountId: editorId, displayName: 'Friend' },
      { accountId: 'unknown', displayName: null },
    ])
    expect(named.zones[1].editPermissions[0].displayName).toBe('Friend')
  })

  it('splits lookups into batches of 100', () => {
    const ids = Array.from({ length: 150 }, (_, index) => `${index}`)
    const chunks = chunkAccountIds(ids)

    expect(chunks.map((chunk) => chunk.length)).toEqual([100, 50])
  })
})
