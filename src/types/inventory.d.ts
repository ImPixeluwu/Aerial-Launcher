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

export type InventoryAlteration = {
  id: string
  name: string
  tier: number | null
  rarity: RarityType | null
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
  baseStats: InventoryItemBaseStats | null
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
