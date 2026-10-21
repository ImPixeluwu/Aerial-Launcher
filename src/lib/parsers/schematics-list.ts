import type {
  SchematicItem,
  SchematicSortDirection,
  SchematicSortField,
  SchematicsFilters,
  SchematicsOverview,
} from '../../types/schematics'

import { schematicRarityRank } from '../../config/constants/schematics'

/*
 * Catalog helpers shared with the renderer. Keep this file free of game
 * data imports: the game data is only loaded in the main process.
 */

export function createEmptySchematicsOverview(): SchematicsOverview {
  return {
    success: true,
    items: [],
    groupCounts: {
      ranged: 0,
      melee: 0,
      traps: 0,
    },
    typeCounts: {},
    rarityCounts: {},
    sourceCounts: {
      campaign: 0,
      'collection-book': 0,
    },
  }
}

export function filterSchematics(
  items: Array<SchematicItem>,
  { groups, rarities, search, sources, types }: SchematicsFilters,
) {
  const needle = search.trim().toLowerCase()

  return items.filter((item) => {
    if (sources.length > 0 && !sources.includes(item.source)) {
      return false
    }

    if (groups.length > 0 && !groups.includes(item.group)) {
      return false
    }

    if (
      types.length > 0 &&
      (!item.filterType || !types.includes(item.filterType))
    ) {
      return false
    }

    if (
      rarities.length > 0 &&
      (!item.rarity || !rarities.includes(item.rarity))
    ) {
      return false
    }

    return (
      !needle ||
      `${item.name} ${item.templateId}`.toLowerCase().includes(needle)
    )
  })
}

type Comparator = (itemA: SchematicItem, itemB: SchematicItem) => number

const byPower: Comparator = (itemA, itemB) =>
  (itemA.powerLevel ?? 0) - (itemB.powerLevel ?? 0)
const byLevel: Comparator = (itemA, itemB) =>
  (itemA.level ?? 0) - (itemB.level ?? 0)
const byRarity: Comparator = (itemA, itemB) =>
  (itemA.rarity ? schematicRarityRank[itemA.rarity] : 0) -
  (itemB.rarity ? schematicRarityRank[itemB.rarity] : 0)
const byName: Comparator = (itemA, itemB) =>
  itemA.name.localeCompare(itemB.name, undefined, { sensitivity: 'base' })

function descending(comparator: Comparator): Comparator {
  return (itemA, itemB) => comparator(itemB, itemA)
}

/**
 * The field picks the main order; ties always fall back to the highest
 * values first, then the name.
 */
const comparators: Record<SchematicSortField, Array<Comparator>> = {
  power: [byPower, descending(byRarity), descending(byLevel)],
  level: [byLevel, descending(byRarity), descending(byPower)],
  rarity: [byRarity, descending(byPower), descending(byLevel)],
  name: [byName],
}

export function sortSchematics(
  items: Array<SchematicItem>,
  field: SchematicSortField,
  direction: SchematicSortDirection,
) {
  const [main, ...ties] = comparators[field]
  const sortComparators = [
    direction === 'desc' ? descending(main) : main,
    ...ties,
    byName,
  ]

  return items.toSorted((itemA, itemB) => {
    for (const comparator of sortComparators) {
      const result = comparator(itemA, itemB)

      if (result !== 0) {
        return result
      }
    }

    return 0
  })
}
