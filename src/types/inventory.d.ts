import type { RarityType } from '../config/constants/resources'

export type InventoryProfileId = 'theater0' | 'theater2' | 'outpost0'

export type InventoryCategory =
  | 'weapons'
  | 'traps'
  | 'ingredients'
  | 'materials'

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
}>

export type InventoryElement =
  | 'Energy'
  | 'Fire'
  | 'Nature'
  | 'Physical'
  | 'Water'

export type InventoryAlteration = {
  id: string
  // Perk id exactly as it comes in the profile
  rawId: string
  // Not in the current game data (old perk system)
  legacy: boolean
  name: string
  tier: number | null
  rarity: RarityType | null
  element: InventoryElement | null
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
  powerLevel: number | null
  quantity: number
  stacks: number
  alterations: Array<InventoryAlteration>
  hasLegacyPerks: boolean
  baseStats: InventoryItemBaseStats | null
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
