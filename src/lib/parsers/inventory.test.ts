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
      category: 'melee',
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
    expect(overview.items[0].alterations).toMatchObject([
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

  it('translates legacy perk ids like the game does', () => {
    const overview = parse({
      a: item('Weapon:wid_assault_auto_sr_ore_t05', 1, {
        level: 50,
        alterations: [
          'Alteration:aid_att_ranged_damage',
          'Alteration:aid_att_ranged_damage_alt1',
          'Alteration:aid_att_ranged_critdamage_alt2',
          'Alteration:aid_g_ranged_energyaffliction',
          'Alteration:aid_att_ranged_unknownstat_alt3',
        ],
      }),
    })

    expect(overview.items[0].alterations).toMatchObject([
      { name: '+10% Damage', tier: 1, rarity: RarityType.Common },
      { name: '+15% Damage', tier: 2, rarity: RarityType.Uncommon },
      { name: '+90% Crit Damage', tier: 3, rarity: RarityType.Rare },
      {
        name: 'Element: Energy and +10% Damage. Causes Affliction damage for 6 seconds.',
        element: 'Energy',
      },
      { name: 'Ranged unknownstat', tier: 4, rarity: RarityType.Epic },
    ])
  })

  it('uses the game migration table for renamed and trap legacy perks', () => {
    const overview = parse({
      a: item('Trap:tid_floor_spikes_r_t03', 1, {
        level: 30,
        alterations: [
          'Alteration:AID_Att_Trap_CoreDamage_T05',
          'Alteration:AID_G_Trap_Incendiary',
        ],
      }),
      b: item('Weapon:wid_assault_auto_sr_ore_t05', 1, {
        level: 50,
        alterations: [
          'Alteration:aid_att_ranged_clipsize_alt1',
          'Alteration:aid_att_ranged_recoil',
          'Alteration:aid_g_weapon_stun',
        ],
      }),
    })
    const trap = overview.items.find((entry) => entry.category === 'traps')
    const weapon = overview.items.find((entry) => entry.category === 'ranged')

    expect(trap?.alterations).toMatchObject([
      { name: '+20% Damage', tier: 3, rarity: RarityType.Rare },
      { name: 'Element: Fire and +5% Damage', element: 'Fire' },
    ])
    expect(weapon?.alterations).toMatchObject([
      { name: '+38% Magazine Size', tier: 2 },
      { name: '+20% Weapon Stability', tier: 1 },
      { name: 'Stun duration increased by 6s.', tier: null },
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

describe('item stats at level', () => {
  // In-game values from screenshots: Legendary T5 at level 50
  it('matches the game for the Brightcore Vacuum Tube Launcher', () => {
    const overview = parse({
      a: item('Weapon:wid_launcher_vacuumtube_sr_ore_t05', 1, {
        level: 50,
        alterations: [
          'Alteration:aid_att_ranged_damage',
          'Alteration:aid_att_ranged_damage',
          'Alteration:aid_att_ranged_damage_alt1',
          'Alteration:aid_att_ranged_critdamage_alt2',
          'Alteration:aid_g_ranged_energyaffliction',
        ],
      }),
    })
    const stats = overview.items[0].stats

    expect(stats?.impact).toBeCloseTo(9704.85, 1)
    expect(stats?.durability).toBe(150)
    expect(stats?.fireRate).toBeCloseTo(2.33, 2)
    expect(stats?.critChance).toBe(0.1)
    expect(stats?.critDamage).toBeCloseTo(1.4, 5)
    expect(stats?.clipSize).toBe(90)
    expect(stats?.reloadTime).toBe(3)
    expect(stats?.ammoCost).toBe(10)
    // 333 * 3.45 * (1 + 0.1 + 0.1 + 0.15 + 0.1); the game adds F.O.R.T.
    expect(stats?.damage).toBeCloseTo(333 * 3.45 * 1.45, 1)
  })

  it('matches the game for the Sunbeam Stormblade', () => {
    const overview = parse({
      a: item('Weapon:wid_edged_sword_medium_laser_sr_crystal_t05', 1, {
        level: 50,
        alterations: [
          'Alteration:aid_att_damage_t01',
          'Alteration:aid_att_critchance_t01',
          'Alteration:aid_att_critchance_t02',
          'Alteration:aid_att_critchance_t03',
        ],
      }),
    })
    const stats = overview.items[0].stats

    expect(stats?.impact).toBeCloseTo(741.75, 1)
    expect(stats?.durability).toBe(300)
    expect(stats?.attackTime).toBeCloseTo(0.52, 2)
    expect(stats?.critDamage).toBe(0.5)
    // Approximation: 15% base + 45 Critical Rating summed as +45%
    expect(stats?.critChance).toBeCloseTo(0.6, 5)
  })

  it('applies fire rate, magazine, reload and durability perks', () => {
    const overview = parse({
      a: item('Weapon:wid_launcher_vacuumtube_sr_ore_t05', 1, {
        level: 1,
        alterations: [
          'Alteration:aid_att_firerate_ranged_t01',
          'Alteration:aid_att_magazinesize_t01',
          'Alteration:aid_att_reloadspeed_ranged_t01',
          'Alteration:aid_att_maxdurability_t01',
          'Alteration:aid_conditional_afflicted_dmgbonus_t05',
        ],
      }),
    })
    const stats = overview.items[0].stats

    expect(stats?.damage).toBe(333)
    expect(stats?.fireRate).toBeCloseTo((7 / 3) * 1.14, 3)
    expect(stats?.clipSize).toBe(Math.round(90 * 1.25))
    expect(stats?.reloadTime).toBeCloseTo(3 / 1.25, 5)
    expect(stats?.durability).toBe(Math.round(150 * 1.14))
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
