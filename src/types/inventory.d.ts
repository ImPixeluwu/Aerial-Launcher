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

export type InventoryItem = {
  itemKey: string
  templateId: string
  name: string
  category: InventoryCategory
  filterType: InventoryFilterType | null
  rarity: RarityType | null
  tier: number | null
  material: 'ore' | 'crystal' | null
  level: number | null
  quantity: number
  stacks: number
  alterations: Array<string>
  iconKey: string
}

export type InventoryOverview = {
  success: boolean
  error?: string
  profileId: InventoryProfileId
  items: Array<InventoryItem>
  categoryCounts: Record<InventoryCategory, number>
  rarityCounts: Partial<Record<RarityType, number>>
}
