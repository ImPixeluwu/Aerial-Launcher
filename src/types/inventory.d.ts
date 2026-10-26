import type { RarityType } from '../config/constants/resources'

export type InventoryProfileId = 'theater0' | 'theater2' | 'outpost0'

export type InventoryCategory =
  | 'ranged'
  | 'melee'
  | 'traps'
  | 'ingredients'
  | 'materials'

/**
 * Category buttons of the inventory filter; each one lists its own types.
 */
export type InventoryGroup = 'ranged' | 'melee' | 'traps' | 'materials'

export type InventoryFilterType =
  | 'assault'
  | 'pistol'
  | 'shotgun'
  | 'sniper'
  | 'smg'
  | 'explosive'
  | 'melee_sword'
  | 'melee_axe'
  | 'melee_scythe'
  | 'melee_spear'
  | 'melee_hammer'
  | 'melee_bat'
  | 'trap_floor'
  | 'trap_wall'
  | 'trap_ceiling'

/**
 * Base stats from the item definition (level 1, no perks).
 */
export type InventoryItemBaseStats = Partial<{
  damage: number
  impact: number
  critChance: number
  critDamage: number
  attackTime: number
  fireRate: number
  fireDelay: number
  clipSize: number
  reloadTime: number
  durability: number
  ammoCost: number
}>

/**
 * Stats at the item level with its perks applied. Damage does not include
 * the player's F.O.R.T. bonus, which depends on the account.
 */
export type InventoryItemStats = InventoryItemBaseStats

/**
 * [attribute, 'a' (additive) | 'm' (multiplicative), value]
 */
export type InventoryStatModifier = [string, 'a' | 'm', number]

export type InventoryElement =
  | 'Energy'
  | 'Fire'
  | 'Nature'
  | 'Physical'
  | 'Water'

export type InventoryAlteration = {
  id: string
  name: string
  tier: number | null
  rarity: RarityType | null
  element: InventoryElement | null
  /** Perk id from the old perk system, resolved through MigrationMapping */
  legacy: boolean
  modifiers: Array<InventoryStatModifier>
}

export type InventoryItem = {
  itemKey: string
  templateId: string
  name: string
  description: string | null
  category: InventoryCategory
  subType: string | null
  filterType: InventoryFilterType | null
  rarity: RarityType | null
  tier: number | null
  material: 'ore' | 'crystal' | null
  level: number | null
  maxLevel: number | null
  superchargeLevel: number
  powerLevel: number | null
  quantity: number
  stacks: number
  alterations: Array<InventoryAlteration>
  baseStats: InventoryItemBaseStats | null
  stats: InventoryItemStats | null
  properties: Array<{ key: string; value: string }>
  iconKey: string
  imageUrl: string | null
}

export type InventoryOverview = {
  success: boolean
  error?: string
  profileId: InventoryProfileId
  items: Array<InventoryItem>
  categoryCounts: Record<InventoryCategory, number>
  rarityCounts: Partial<Record<RarityType, number>>
}

/**
 * Types shown once a category is selected: weapon and trap types, plus
 * ingredients and building materials inside "materials".
 */
export type InventoryItemType =
  | InventoryFilterType
  | 'ingredients'
  | 'building-mats'

export type InventoryFilters = {
  groups: Array<InventoryGroup>
  types: Array<InventoryItemType>
  rarities: Array<RarityType>
  search: string
}
