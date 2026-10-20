import type {
  SchematicSortKey,
  SchematicSource,
  SchematicTypeGroup,
} from '../../types/schematics'

import { RarityType } from './resources'

export const schematicSources: Array<SchematicSource> = [
  'campaign',
  'collection-book',
]

export const schematicTypeGroups: Array<SchematicTypeGroup> = [
  'assault',
  'pistol',
  'sniper',
  'shotgun',
  'smg',
  'explosive',
  'melee',
  'trap_floor',
  'trap_wall',
  'trap_ceiling',
]

export const schematicSortKeys: Array<SchematicSortKey> = [
  'power-desc',
  'power-asc',
  'level-desc',
  'level-asc',
  'name-asc',
  'name-desc',
  'rarity-desc',
  'rarity-asc',
]

export const schematicDefaultSortKey: SchematicSortKey = 'power-desc'

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
export const schematicTypeIcons: Record<SchematicTypeGroup, string> = {
  assault: 'gm_player_assaultrifle_damage_buff',
  pistol: 'gm_player_pistol_damagebuff',
  sniper: 'gm_player_sniperrifle_damagebuff',
  shotgun: 'gm_player_shotgun_damagebuff',
  smg: 'gm_player_smg_damage_buff',
  explosive: 'gm_player_explosive_damagebuff',
  melee: 'gm_player_meleeknockback_buff',
  trap_floor: 'gm_trap_buff',
  trap_wall: 'gm_trap_buff',
  trap_ceiling: 'gm_trap_buff',
}
