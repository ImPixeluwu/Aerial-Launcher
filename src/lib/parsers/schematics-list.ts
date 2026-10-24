import type {
  SchematicItem,
  SchematicSortDirection,
  SchematicSortField,
  SchematicsFilters,
  SchematicsOverview,
} from '../../types/schematics'

import { sortStwItems } from './item-sort'

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

export function sortSchematics(
  items: Array<SchematicItem>,
  field: SchematicSortField,
  direction: SchematicSortDirection,
) {
  return sortStwItems(items, field, direction)
}
