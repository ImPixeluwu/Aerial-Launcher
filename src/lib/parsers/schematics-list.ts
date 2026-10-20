import type {
  SchematicItem,
  SchematicSortKey,
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
    typeCounts: {
      assault: 0,
      pistol: 0,
      sniper: 0,
      shotgun: 0,
      smg: 0,
      explosive: 0,
      melee: 0,
      trap_floor: 0,
      trap_wall: 0,
      trap_ceiling: 0,
    },
    rarityCounts: {},
    sourceCounts: {
      campaign: 0,
      'collection-book': 0,
    },
  }
}

/**
 * Width (%) of the level bar: progress within the current tier of 10
 * levels, never below 8% so the bar stays visible.
 */
export function schematicLevelProgress(level: number | null) {
  return level === null ? 8 : Math.max((((level - 1) % 10) + 1) * 10, 8)
}

export function filterSchematics(
  items: Array<SchematicItem>,
  { rarities, search, sources, typeGroups }: SchematicsFilters,
) {
  const needle = search.trim().toLowerCase()

  return items.filter((item) => {
    if (sources.length > 0 && !sources.includes(item.source)) {
      return false
    }

    if (
      typeGroups.length > 0 &&
      (!item.typeGroup || !typeGroups.includes(item.typeGroup))
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
 * The sort key picks the main order and its direction; ties always fall
 * back to the highest values first, then the name.
 */
const comparators: Record<SchematicSortKey, Array<Comparator>> = {
  'power-desc': [
    descending(byPower),
    descending(byRarity),
    descending(byLevel),
  ],
  'power-asc': [byPower, descending(byRarity), descending(byLevel)],
  'level-desc': [
    descending(byLevel),
    descending(byRarity),
    descending(byPower),
  ],
  'level-asc': [byLevel, descending(byRarity), descending(byPower)],
  'rarity-desc': [
    descending(byRarity),
    descending(byPower),
    descending(byLevel),
  ],
  'rarity-asc': [byRarity, descending(byPower), descending(byLevel)],
  'name-asc': [],
  'name-desc': [descending(byName)],
}

export function sortSchematics(
  items: Array<SchematicItem>,
  sortKey: SchematicSortKey,
) {
  const sortComparators = [...comparators[sortKey], byName]

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
