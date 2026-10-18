import type { MCPQueryProfileStorageItem } from '../../types/services/mcp'

import { describe, expect, it } from 'vitest'

import { RarityType } from '../../config/constants/resources'

import { parseInventoryProfile } from './inventory'
import { calculateStwPowerLevel } from './stw-items'

function item(
  templateId: string,
  quantity = 1,
  attributes: MCPQueryProfileStorageItem['attributes'] = {},
): MCPQueryProfileStorageItem {
  return { templateId, quantity, attributes }
}

function parse(items: Record<string, MCPQueryProfileStorageItem>) {
  return parseInventoryProfile('theater0', items)
}

describe('parseInventoryProfile', () => {
  it('groups stacks of the same material', () => {
    const overview = parse({
      a: item('WorldItem:wooditemdata', 300),
      b: item('WorldItem:wooditemdata', 500),
    })

    expect(overview.items).toHaveLength(1)
    expect(overview.items[0]).toMatchObject({
      category: 'materials',
      name: 'Wood',
      quantity: 800,
      stacks: 2,
      powerLevel: null,
    })
    expect(overview.items[0].imageUrl).toMatch(/T-Icon-Logs\.png$/)
    expect(overview.categoryCounts.materials).toBe(1)
  })

  it('uses the in-game name, power level and perks of a weapon', () => {
    const overview = parse({
      a: item('Weapon:wid_edged_sword_medium_laser_sr_crystal_t05', 1, {
        level: 50,
        alterations: [
          'Alteration:aid_att_damage_t01',
          'Alteration:aid_att_critchance_t02',
          'Alteration:aid_g_melee_affliction_v2',
        ],
      }),
    })

    expect(overview.items[0]).toMatchObject({
      category: 'weapons',
      name: 'Sunbeam Stormblade',
      subType: 'Sword',
      filterType: 'melee_sword',
      rarity: RarityType.Legendary,
      tier: 5,
      material: 'crystal',
      level: 50,
      maxLevel: 50,
      powerLevel: 130,
      baseStats: {
        damage: 162,
        critChance: 0.15,
        critDamage: 0.5,
        attackTime: 0.5185,
      },
    })
    expect(overview.items[0].alterations).toEqual([
      {
        id: 'aid_att_damage_t01',
        name: '+10% Damage',
        tier: 1,
        rarity: RarityType.Common,
        element: null,
      },
      {
        id: 'aid_att_critchance_t02',
        name: '+15 Critical Rating',
        tier: 2,
        rarity: RarityType.Uncommon,
        element: null,
      },
      {
        id: 'aid_g_melee_affliction_v2',
        name: '+10% Weapon Damage. Causes Affliction damage for 6 seconds.',
        tier: null,
        rarity: RarityType.Common,
        element: null,
      },
    ])
  })

  it('colors perks by tier and detects elements', () => {
    const overview = parse({
      a: item('Weapon:wid_edged_sword_medium_laser_sr_crystal_t05', 1, {
        level: 50,
        alterations: [
          'Alteration:aid_att_critchance_t05',
          'Alteration:aid_ele_energy_t03',
        ],
      }),
    })

    expect(overview.items[0].alterations).toMatchObject([
      { tier: 5, rarity: RarityType.Legendary, element: null },
      { tier: 3, rarity: RarityType.Rare, element: 'Energy' },
    ])
  })

  it('reads perks from alterationDefinitions when alterations is missing', () => {
    const overview = parse({
      a: item('Weapon:wid_assault_auto_sr_ore_t05', 1, {
        level: 50,
        alterationDefinitions: ['Alteration:aid_att_damage_t04'],
      }),
    })

    expect(overview.items[0].alterations.map((perk) => perk.id)).toEqual([
      'aid_att_damage_t04',
    ])
  })

  it('exposes the raw profile attributes', () => {
    const overview = parse({
      a: item('Weapon:wid_assault_auto_sr_ore_t05', 1, {
        level: 50,
        durability: 1,
        itemSource: '',
      }),
    })

    expect(overview.items[0].properties).toEqual([
      { key: 'durability', value: '1' },
      { key: 'itemSource', value: '' },
    ])
  })

  it('hides building pieces and the edit tool', () => {
    const overview = parse({
      a: item('Weapon:buildingitemdata_floor'),
      b: item('Weapon:buildingitemdata_roofs'),
      c: item('Weapon:buildingitemdata_stair_w'),
      d: item('Weapon:buildingitemdata_wall'),
      e: item('Weapon:edittool'),
    })

    expect(overview.items).toHaveLength(0)
  })

  it('names traps from the game data', () => {
    const overview = parse({
      a: item('Trap:tid_floor_spikes_r_t03', 12, { level: 30 }),
    })

    expect(overview.items[0]).toMatchObject({
      category: 'traps',
      filterType: 'trap_floor',
      rarity: RarityType.Rare,
      tier: 3,
      name: 'Retractable Floor Spikes',
      quantity: 12,
    })
    expect(overview.items[0].powerLevel).toBeGreaterThan(0)
  })

  it('names ingredients from the game data', () => {
    const overview = parse({
      a: item('Ingredient:ingredient_duct_tape', 40),
    })

    expect(overview.items[0]).toMatchObject({
      category: 'ingredients',
      name: 'Duct Tape',
      iconKey: 'duct_tape',
    })
  })

  it('falls back to the template id for unknown items', () => {
    const overview = parse({
      a: item('Weapon:wid_pistol_auto_ur_ore_t05'),
    })

    expect(overview.items[0]).toMatchObject({
      name: 'Mythic Pistol Auto',
      rarity: RarityType.Mythic,
      iconKey: 'voucher_generic_ranged_er',
      imageUrl: null,
    })
  })

  it('ignores templates outside the four categories', () => {
    const overview = parse({
      a: item('Ammo:ammodatashells', 999),
    })

    expect(overview.items).toHaveLength(0)
  })

  it('keeps weapons with different levels apart', () => {
    const overview = parse({
      a: item('Weapon:wid_assault_auto_sr_ore_t05', 1, { level: 40 }),
      b: item('Weapon:wid_assault_auto_sr_ore_t05', 1, { level: 50 }),
    })

    expect(overview.items).toHaveLength(2)
  })

  it('defaults quantity to 1', () => {
    const overview = parse({
      a: {
        templateId: 'Weapon:wid_shotgun_standard_r_ore_t02',
        attributes: {},
      } as MCPQueryProfileStorageItem,
    })

    expect(overview.items[0]).toMatchObject({
      name: 'Silver Templar',
      quantity: 1,
    })
  })
})

describe('calculateStwPowerLevel', () => {
  it('reads the item rating table', () => {
    expect(
      calculateStwPowerLevel({
        level: 50,
        rarity: RarityType.Legendary,
        tier: 5,
      }),
    ).toBe(130)
  })

  it('caps the level at the tier maximum plus bonus levels', () => {
    const capped = calculateStwPowerLevel({
      level: 60,
      rarity: RarityType.Legendary,
      tier: 5,
    })
    const withBonus = calculateStwPowerLevel({
      level: 60,
      maxLevelBonus: 10,
      rarity: RarityType.Legendary,
      tier: 5,
    })

    expect(capped).toBe(130)
    expect(withBonus).toBeGreaterThan(130)
  })

  it('returns null without rarity, tier or level', () => {
    expect(
      calculateStwPowerLevel({ level: null, rarity: null, tier: null }),
    ).toBeNull()
  })
})
