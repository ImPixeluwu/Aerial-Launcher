import type { SchematicItem } from '../../types/schematics'
import type { MCPQueryProfileStorageItem } from '../../types/services/mcp'

import { describe, expect, it } from 'vitest'

import { RarityType } from '../../config/constants/resources'

import { parseSchematicsProfiles } from './schematics'
import {
  filterSchematics,
  schematicLevelProgress,
  sortSchematics,
} from './schematics-list'
import { resolveStwSchematic } from './stw-items'

function item(
  templateId: string,
  attributes: MCPQueryProfileStorageItem['attributes'] = {},
  quantity = 1,
): MCPQueryProfileStorageItem {
  return { templateId, quantity, attributes }
}

function parse(
  campaign: Record<string, MCPQueryProfileStorageItem>,
  collectionBook: Record<string, MCPQueryProfileStorageItem> | null = null,
) {
  return parseSchematicsProfiles({ campaign, collectionBook })
}

function parseOne(
  templateId: string,
  attributes: MCPQueryProfileStorageItem['attributes'] = {},
) {
  return parse({ a: item(templateId, attributes) }).items[0]
}

describe('resolveStwSchematic', () => {
  it('maps a schematic to the weapon or trap it crafts', () => {
    expect(
      resolveStwSchematic(
        'Schematic:SID_Edged_Sword_Medium_Laser_SR_Crystal_T05',
      ),
    ).toBe('weapon:wid_edged_sword_medium_laser_sr_crystal_t05')
    expect(resolveStwSchematic('Schematic:sid_floor_spikes_r_t03')).toBe(
      'trap:tid_floor_spikes_r_t03',
    )
  })

  it('uses the game data for schematics with a different result', () => {
    expect(
      resolveStwSchematic('Schematic:sid_pistol_vacuumtube_auto_sr_ore_t05'),
    ).toBe('weapon:wid_pistol_auto_vacuumtube_sr_ore_t05')
  })

  it('returns null for items that are not in the game data', () => {
    expect(resolveStwSchematic('Schematic:ammo_energycell')).toBeNull()
    expect(resolveStwSchematic('Schematic:sid_wall_madeup_vr_t02')).toBeNull()
  })
})

describe('parseSchematicsProfiles', () => {
  it('describes a weapon schematic with the item it crafts', () => {
    expect(
      parseOne('Schematic:sid_edged_sword_medium_laser_sr_crystal_t05', {
        level: 50,
      }),
    ).toMatchObject({
      itemTemplateId: 'weapon:wid_edged_sword_medium_laser_sr_crystal_t05',
      source: 'campaign',
      name: 'Sunbeam Stormblade',
      category: 'weapon',
      filterType: 'melee_sword',
      typeGroup: 'melee',
      rarity: RarityType.Legendary,
      tier: 5,
      material: 'crystal',
      level: 50,
      maxLevel: 50,
      powerLevel: 130,
      superchargeLevel: 0,
    })
  })

  it('describes a trap schematic', () => {
    const schematic = parseOne('Schematic:sid_floor_spikes_r_t03', {
      level: 30,
    })

    expect(schematic).toMatchObject({
      name: 'Retractable Floor Spikes',
      category: 'trap',
      filterType: 'trap_floor',
      typeGroup: 'trap_floor',
      rarity: RarityType.Rare,
      tier: 3,
    })
    expect(schematic.powerLevel).toBeGreaterThan(0)
    expect(schematic.imageUrl).toMatch(/\.png$/)
  })

  it('ignores ammo, ingredient and non-schematic items', () => {
    const overview = parse({
      a: item('Schematic:ammo_energycell'),
      b: item('Schematic:ingredient_blastpowder'),
      c: item('Weapon:wid_edged_sword_medium_laser_sr_crystal_t05'),
      d: item('AccountResource:schematicxp', {}, 5000),
    })

    expect(overview.items).toHaveLength(0)
  })

  it('falls back to the template id for unknown schematics', () => {
    expect(parseOne('Schematic:sid_wall_madeup_vr_t02')).toMatchObject({
      itemTemplateId: null,
      category: 'trap',
      filterType: 'trap_wall',
      rarity: RarityType.Epic,
      tier: 2,
      iconKey: 'voucher_generic_schematic_vr',
      imageUrl: null,
    })
  })

  it('takes the tier from the level when the template id has none', () => {
    expect(
      parseOne('Schematic:sid_assault_madeup_r', { level: 25 }),
    ).toMatchObject({ tier: 3, maxLevel: 30 })
  })

  it('handles supercharged schematics', () => {
    const templateId = 'Schematic:sid_edged_sword_medium_laser_sr_crystal_t05'

    expect(
      parseOne(templateId, { level: 60, max_level_bonus: 10 }),
    ).toMatchObject({
      powerLevel: 144,
      maxLevel: 60,
      superchargeLevel: 5,
    })
    expect(parseOne(templateId, { level: 54 })).toMatchObject({
      powerLevel: 136,
      superchargeLevel: 2,
    })
  })

  it('keeps campaign and collection book schematics apart', () => {
    const templateId = 'Schematic:sid_floor_spikes_r_t03'
    const overview = parse(
      { a: item(templateId, { level: 30 }) },
      { b: item(templateId, { level: 30 }) },
    )

    expect(overview.items.map((schematic) => schematic.source)).toEqual(
      expect.arrayContaining(['campaign', 'collection-book']),
    )
    expect(overview.sourceCounts).toEqual({
      campaign: 1,
      'collection-book': 1,
    })
  })

  it('groups identical schematics', () => {
    const overview = parse({
      a: item('Schematic:sid_floor_spikes_r_t03', { level: 30 }),
      b: item('Schematic:sid_floor_spikes_r_t03', { level: 30 }),
    })

    expect(overview.items).toHaveLength(1)
    expect(overview.items[0]).toMatchObject({ quantity: 2, stacks: 2 })
  })

  it('resolves perks like the inventory', () => {
    const [perk] = parseOne(
      'Schematic:sid_edged_sword_medium_laser_sr_crystal_t05',
      { level: 50, alterations: ['Alteration:aid_att_damage_t01'] },
    ).alterations

    expect(perk).toMatchObject({ name: '+10% Damage', tier: 1 })
  })

  it('counts groups by type and rarity', () => {
    const overview = parse({
      a: item('Schematic:sid_edged_sword_medium_laser_sr_crystal_t05'),
      b: item('Schematic:sid_floor_spikes_r_t03'),
      c: item('Schematic:sid_floor_spikes_r_t03', { level: 12 }),
    })

    expect(overview.typeCounts).toMatchObject({
      melee: 1,
      trap_floor: 2,
      assault: 0,
    })
    expect(overview.rarityCounts).toEqual({
      [RarityType.Legendary]: 1,
      [RarityType.Rare]: 2,
    })
  })
})

function schematic(values: Partial<SchematicItem>) {
  return { ...parseOne('Schematic:sid_floor_spikes_r_t03'), ...values }
}

describe('sortSchematics', () => {
  it('breaks power ties by rarity, then level, then name', () => {
    const items = [
      schematic({ name: 'B', powerLevel: 100, rarity: RarityType.Epic }),
      schematic({ name: 'A', powerLevel: 100, rarity: RarityType.Epic }),
      schematic({
        name: 'C',
        powerLevel: 100,
        rarity: RarityType.Epic,
        level: 40,
      }),
      schematic({ name: 'D', powerLevel: 100, rarity: RarityType.Legendary }),
      schematic({ name: 'E', powerLevel: 120, rarity: RarityType.Common }),
    ]

    expect(sortSchematics(items, 'power-desc').map(({ name }) => name)).toEqual(
      ['E', 'D', 'C', 'A', 'B'],
    )
    expect(sortSchematics(items, 'power-asc').map(({ name }) => name)).toEqual([
      'D',
      'C',
      'A',
      'B',
      'E',
    ])
  })

  it('sorts names ignoring case and accents', () => {
    const items = [
      schematic({ name: 'b' }),
      schematic({ name: 'Á' }),
      schematic({ name: 'c' }),
    ]

    expect(sortSchematics(items, 'name-asc').map(({ name }) => name)).toEqual([
      'Á',
      'b',
      'c',
    ])
    expect(sortSchematics(items, 'name-desc').map(({ name }) => name)).toEqual([
      'c',
      'b',
      'Á',
    ])
  })

  it('sorts by rarity with Mythic on top', () => {
    const items = [
      schematic({ name: 'A', rarity: RarityType.Rare }),
      schematic({ name: 'B', rarity: RarityType.Mythic }),
      schematic({ name: 'C', rarity: null }),
    ]

    expect(
      sortSchematics(items, 'rarity-desc').map(({ name }) => name),
    ).toEqual(['B', 'A', 'C'])
  })
})

describe('filterSchematics', () => {
  const items = [
    schematic({ name: 'Sword', typeGroup: 'melee', rarity: RarityType.Epic }),
    schematic({ name: 'Axe', typeGroup: 'melee', rarity: RarityType.Rare }),
    schematic({
      name: 'Spikes',
      typeGroup: 'trap_floor',
      rarity: RarityType.Epic,
      source: 'collection-book',
    }),
  ]
  const noFilters = { sources: [], typeGroups: [], rarities: [], search: '' }
  const names = (filtered: Array<SchematicItem>) =>
    filtered.map(({ name }) => name)

  it('combines type and rarity with AND', () => {
    expect(
      names(
        filterSchematics(items, {
          ...noFilters,
          typeGroups: ['melee'],
          rarities: [RarityType.Epic],
        }),
      ),
    ).toEqual(['Sword'])
  })

  it('filters by source and searches name and template id', () => {
    expect(
      names(
        filterSchematics(items, { ...noFilters, sources: ['collection-book'] }),
      ),
    ).toEqual(['Spikes'])
    expect(
      names(filterSchematics(items, { ...noFilters, search: 'AXE' })),
    ).toEqual(['Axe'])
    expect(
      filterSchematics(items, { ...noFilters, search: 'sid_floor_spikes' }),
    ).toHaveLength(3)
  })
})

describe('schematicLevelProgress', () => {
  it('shows the progress within the current tier', () => {
    expect(schematicLevelProgress(1)).toBe(10)
    expect(schematicLevelProgress(15)).toBe(50)
    expect(schematicLevelProgress(50)).toBe(100)
    expect(schematicLevelProgress(null)).toBe(8)
  })
})
