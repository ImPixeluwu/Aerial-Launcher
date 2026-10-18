import type { MCPQueryProfileStorageItem } from '../../types/services/mcp'

import { describe, expect, it } from 'vitest'

import { RarityType } from '../../config/constants/resources'

import { parseInventoryProfile } from './inventory'

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
      iconKey: 'wooditemdata',
    })
    expect(overview.categoryCounts.materials).toBe(1)
  })

  it('classifies a weapon by type, rarity, tier and material', () => {
    const overview = parse({
      a: item('Weapon:wid_sniper_boltaction_scope_sr_ore_t05', 1, {
        level: 50,
      }),
    })

    expect(overview.items[0]).toMatchObject({
      category: 'weapons',
      filterType: 'sniper',
      rarity: RarityType.Legendary,
      tier: 5,
      material: 'ore',
      level: 50,
      name: 'Legendary Sniper Boltaction Scope',
      iconKey: 'voucher_generic_ranged_sr',
    })
    expect(overview.rarityCounts[RarityType.Legendary]).toBe(1)
  })

  it('uses melee vouchers for melee weapons', () => {
    const overview = parse({
      a: item('Weapon:wid_edged_sword_heavy_vr_crystal_t04'),
    })

    expect(overview.items[0]).toMatchObject({
      filterType: 'melee_sword',
      material: 'crystal',
      iconKey: 'voucher_generic_melee_vr',
    })
  })

  it('names traps from the bundled trap data', () => {
    const overview = parse({
      a: item('Trap:tid_floor_spikes_vr_ore_t03', 12),
    })

    expect(overview.items[0]).toMatchObject({
      category: 'traps',
      filterType: 'trap_floor',
      rarity: RarityType.Epic,
      tier: 3,
      name: 'Epic Retractable Floor Spikes',
      iconKey: 'floor_spikes',
      quantity: 12,
    })
  })

  it('prefers the most specific trap key', () => {
    const overview = parse({
      a: item('Trap:tid_floor_spikes_wood_c_ore_t01'),
    })

    expect(overview.items[0].iconKey).toBe('floor_spikes_wood')
  })

  it('names ingredients from the bundled ingredient data', () => {
    const overview = parse({
      a: item('Ingredient:ingredient_duct_tape', 40),
    })

    expect(overview.items[0]).toMatchObject({
      category: 'ingredients',
      name: 'Duct Tape',
      rarity: null,
      iconKey: 'duct_tape',
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

  it('treats er and ur as mythic', () => {
    const overview = parse({
      a: item('Weapon:wid_assault_auto_er_ore_t05'),
      b: item('Weapon:wid_pistol_auto_ur_ore_t05'),
    })

    expect(overview.items.map((entry) => entry.rarity)).toEqual([
      RarityType.Mythic,
      RarityType.Mythic,
    ])
    expect(overview.items[0].iconKey).toBe('voucher_generic_ranged_er')
  })

  it('defaults quantity to 1 and keeps alterations', () => {
    const overview = parse({
      a: {
        templateId: 'Weapon:wid_shotgun_standard_r_ore_t02',
        attributes: { alterations: ['Alteration:aid_att_damage_t02'] },
      } as MCPQueryProfileStorageItem,
    })

    expect(overview.items[0]).toMatchObject({
      quantity: 1,
      alterations: ['Alteration:aid_att_damage_t02'],
    })
  })
})
