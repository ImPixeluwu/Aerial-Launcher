import type {
  InventoryFilters,
  InventoryGroup,
  InventoryItem,
  InventoryItemType,
} from '../../types/inventory'

/*
 * Inventory filter helpers shared with the renderer. Keep this file free
 * of game data imports: the game data is only loaded in the main process.
 */

export function inventoryItemGroup(item: InventoryItem): InventoryGroup {
  return item.category === 'ingredients' || item.category === 'materials'
    ? 'materials'
    : item.category
}

export function inventoryItemType(
  item: InventoryItem,
): InventoryItemType | null {
  if (item.category === 'ingredients') {
    return 'ingredients'
  }

  if (item.category === 'materials') {
    return 'building-mats'
  }

  return item.filterType
}

/**
 * Number of items (groups of identical entries) per category and type.
 */
export function countInventoryItems(items: Array<InventoryItem>) {
  const groupCounts: Record<InventoryGroup, number> = {
    ranged: 0,
    melee: 0,
    traps: 0,
    materials: 0,
  }
  const typeCounts: Partial<Record<InventoryItemType, number>> = {}

  items.forEach((item) => {
    const type = inventoryItemType(item)

    groupCounts[inventoryItemGroup(item)] += 1

    if (type) {
      typeCounts[type] = (typeCounts[type] ?? 0) + 1
    }
  })

  return { groupCounts, typeCounts }
}

export function filterInventoryItems(
  items: Array<InventoryItem>,
  { groups, rarities, search, types }: InventoryFilters,
) {
  const needle = search.trim().toLowerCase()

  return items.filter((item) => {
    if (groups.length > 0 && !groups.includes(inventoryItemGroup(item))) {
      return false
    }

    if (types.length > 0) {
      const type = inventoryItemType(item)

      if (!type || !types.includes(type)) {
        return false
      }
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
