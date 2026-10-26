import type { MCPQueryProfileStorageItem } from '../../types/services/mcp'

import { describe, expect, it } from 'vitest'

import { RarityType } from '../../config/constants/resources'

import { parseInventoryProfile } from './inventory'
import {
  countInventoryItems,
  filterInventoryItems,
  inventoryItemGroup,
  inventoryItemType,
} from './inventory-list'

function item(templateId: string, attributes = {}): MCPQueryProfileStorageItem {
  return { templateId, quantity: 1, attributes }
}

const { items } = parseInventoryProfile('theater0', {
  a: item('Weapon:wid_edged_sword_medium_laser_sr_crystal_t05', { level: 50 }),
  b: item('Weapon:wid_edged_axe_medium_c_ore_t01', { level: 5 }),
  c: item('Trap:tid_floor_spikes_r_t03', { level: 30 }),
  d: item('Ingredient:ingredient_duct_tape'),
  e: item('WorldItem:wooditemdata'),
})
const byName = (name: string) => items.find((entry) => entry.name === name)!
const names = (list: typeof items) => list.map(({ name }) => name).sort()
const noFilters = { groups: [], types: [], rarities: [], search: '' }

describe('inventory filter groups', () => {
  it('puts ingredients and building materials under materials', () => {
    expect(inventoryItemGroup(byName('Duct Tape'))).toBe('materials')
    expect(inventoryItemType(byName('Duct Tape'))).toBe('ingredients')
    expect(inventoryItemGroup(byName('Wood'))).toBe('materials')
    expect(inventoryItemType(byName('Wood'))).toBe('building-mats')
  })

  it('uses the weapon and trap types inside their category', () => {
    expect(inventoryItemGroup(byName('Sunbeam Stormblade'))).toBe('melee')
    expect(inventoryItemType(byName('Sunbeam Stormblade'))).toBe('melee_sword')
    expect(inventoryItemType(byName('Retractable Floor Spikes'))).toBe(
      'trap_floor',
    )
  })

  it('counts items per category and type', () => {
    expect(countInventoryItems(items)).toEqual({
      groupCounts: { ranged: 0, melee: 2, traps: 1, materials: 2 },
      typeCounts: {
        melee_sword: 1,
        melee_axe: 1,
        trap_floor: 1,
        ingredients: 1,
        'building-mats': 1,
      },
    })
  })
})

describe('filterInventoryItems', () => {
  it('filters by category, then narrows down to its types', () => {
    expect(
      names(
        filterInventoryItems(items, { ...noFilters, groups: ['materials'] }),
      ),
    ).toEqual(['Duct Tape', 'Wood'])
    expect(
      names(
        filterInventoryItems(items, {
          ...noFilters,
          groups: ['materials', 'melee'],
          types: ['building-mats', 'melee_axe'],
        }),
      ),
    ).toEqual(['Copper Handmade Axe', 'Wood'])
  })

  it('combines category, rarity and search with AND', () => {
    expect(
      names(
        filterInventoryItems(items, {
          ...noFilters,
          groups: ['melee'],
          rarities: [RarityType.Legendary],
        }),
      ),
    ).toEqual(['Sunbeam Stormblade'])
    expect(
      names(filterInventoryItems(items, { ...noFilters, search: 'WOOD' })),
    ).toEqual(['Wood'])
  })
})
