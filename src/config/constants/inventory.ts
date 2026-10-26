import type {
  InventoryCategory,
  InventoryGroup,
  InventoryItemType,
  InventoryProfileId,
} from '../../types/inventory'

import type { StwSortField } from '../../lib/parsers/item-sort'

import { RarityType } from './resources'

export const inventoryProfileIds: Array<InventoryProfileId> = [
  'theater0',
  'theater2',
  'outpost0',
]

export const inventoryCategories: Array<InventoryCategory> = [
  'ranged',
  'melee',
  'traps',
  'ingredients',
  'materials',
]

export const inventoryGroups: Array<InventoryGroup> = [
  'ranged',
  'melee',
  'traps',
  'materials',
]

/**
 * Types shown once their category is selected, in this order.
 */
export const inventoryTypesByGroup: Record<
  InventoryGroup,
  Array<InventoryItemType>
> = {
  ranged: ['assault', 'pistol', 'sniper', 'shotgun', 'smg', 'explosive'],
  melee: [
    'melee_sword',
    'melee_axe',
    'melee_scythe',
    'melee_spear',
    'melee_hammer',
    'melee_bat',
  ],
  traps: ['trap_floor', 'trap_wall', 'trap_ceiling'],
  materials: ['ingredients', 'building-mats'],
}

export const inventorySortFields: Array<StwSortField> = [
  'power',
  'level',
  'name',
  'rarity',
  'quantity',
]

export const inventoryDefaultSortField: StwSortField = 'power'

export const inventoryRarityOrder: Array<RarityType> = [
  RarityType.Mythic,
  RarityType.Legendary,
  RarityType.Epic,
  RarityType.Rare,
  RarityType.Uncommon,
  RarityType.Common,
]

/**
 * Building pieces and the edit tool live in the backpack but are not
 * inventory items for the player.
 */
export const inventoryHiddenTemplateIds = new Set([
  'weapon:buildingitemdata_floor',
  'weapon:buildingitemdata_roofs',
  'weapon:buildingitemdata_stair_w',
  'weapon:buildingitemdata_wall',
  'weapon:edittool',
])
