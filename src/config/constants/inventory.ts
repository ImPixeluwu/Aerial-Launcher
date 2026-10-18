import type {
  InventoryCategory,
  InventoryProfileId,
} from '../../types/inventory'

import { RarityType } from './resources'

export const inventoryProfileIds: Array<InventoryProfileId> = [
  'theater0',
  'theater2',
  'outpost0',
]

export const inventoryCategories: Array<InventoryCategory> = [
  'weapons',
  'traps',
  'ingredients',
  'materials',
]

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
