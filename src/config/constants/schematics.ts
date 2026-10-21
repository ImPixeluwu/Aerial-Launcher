import type { InventoryFilterType } from '../../types/inventory'
import type {
  SchematicGroup,
  SchematicSortDirection,
  SchematicSortField,
  SchematicSource,
} from '../../types/schematics'

import { RarityType } from './resources'

export const schematicSources: Array<SchematicSource> = [
  'campaign',
  'collection-book',
]

export const schematicGroups: Array<SchematicGroup> = [
  'ranged',
  'melee',
  'traps',
]

/**
 * Types shown once their category is selected, in this order.
 */
export const schematicTypesByGroup: Record<
  SchematicGroup,
  Array<InventoryFilterType>
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
}

export const schematicSortFields: Array<SchematicSortField> = [
  'power',
  'level',
  'name',
  'rarity',
]

export const schematicDefaultSortField: SchematicSortField = 'power'

/**
 * Highest first, except names, which go from A to Z.
 */
export const schematicDefaultSortDirections: Record<
  SchematicSortField,
  SchematicSortDirection
> = {
  power: 'desc',
  level: 'desc',
  name: 'asc',
  rarity: 'desc',
}

export const schematicRarityRank: Record<RarityType, number> = {
  [RarityType.Common]: 1,
  [RarityType.Uncommon]: 2,
  [RarityType.Rare]: 3,
  [RarityType.Epic]: 4,
  [RarityType.Legendary]: 5,
  [RarityType.Mythic]: 6,
}

/**
 * Overviews are reused for this long when coming back to the page.
 */
export const schematicsCacheTime = 120_000

export const schematicsSearchDelay = 280

/**
 * Aerial images used as the type badge of each schematic.
 */
export const schematicTypeIcons: Record<InventoryFilterType, string> = {
  assault: 'gm_player_assaultrifle_damage_buff',
  pistol: 'gm_player_pistol_damagebuff',
  sniper: 'gm_player_sniperrifle_damagebuff',
  shotgun: 'gm_player_shotgun_damagebuff',
  smg: 'gm_player_smg_damage_buff',
  explosive: 'gm_player_explosive_damagebuff',
  melee_sword: 'gm_player_meleeknockback_buff',
  melee_axe: 'gm_player_meleeknockback_buff',
  melee_scythe: 'gm_player_meleeknockback_buff',
  melee_spear: 'gm_player_meleeknockback_buff',
  melee_hammer: 'gm_player_meleeknockback_buff',
  melee_bat: 'gm_player_meleeknockback_buff',
  trap_floor: 'gm_trap_buff',
  trap_wall: 'gm_trap_buff',
  trap_ceiling: 'gm_trap_buff',
}
