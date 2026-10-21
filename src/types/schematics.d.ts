import type { RarityType } from '../config/constants/resources'
import type {
  InventoryAlteration,
  InventoryFilterType,
  InventoryItemStats,
} from './inventory'

export type SchematicsProfileId = 'campaign' | 'collection_book_schematics0'

export type SchematicSource = 'campaign' | 'collection-book'

export type SchematicCategory = 'weapon' | 'trap'

/**
 * Category buttons of the catalog filter; each one lists its own types.
 */
export type SchematicGroup = 'ranged' | 'melee' | 'traps'

export type SchematicSortField = 'power' | 'level' | 'name' | 'rarity'

export type SchematicSortDirection = 'asc' | 'desc'

export type SchematicItem = {
  itemKey: string
  templateId: string
  itemTemplateId: string | null
  source: SchematicSource
  name: string
  description: string | null
  category: SchematicCategory
  subType: string | null
  filterType: InventoryFilterType | null
  group: SchematicGroup
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
  stats: InventoryItemStats | null
  iconKey: string
  imageUrl: string | null
}

export type SchematicsOverview = {
  success: boolean
  error?: string
  collectionBookError?: string
  items: Array<SchematicItem>
  groupCounts: Record<SchematicGroup, number>
  typeCounts: Partial<Record<InventoryFilterType, number>>
  rarityCounts: Partial<Record<RarityType, number>>
  sourceCounts: Record<SchematicSource, number>
}

export type SchematicsFilters = {
  sources: Array<SchematicSource>
  groups: Array<SchematicGroup>
  types: Array<InventoryFilterType>
  rarities: Array<RarityType>
  search: string
}
