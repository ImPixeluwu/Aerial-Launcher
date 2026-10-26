import { RarityType } from '../../config/constants/resources'

export type StwSortField = 'power' | 'level' | 'name' | 'rarity' | 'quantity'

export type StwSortDirection = 'asc' | 'desc'

/**
 * The fields shared by inventory items and schematics that can be sorted.
 */
type SortableItem = {
  name: string
  powerLevel: number | null
  level: number | null
  rarity: RarityType | null
  quantity: number
}

const rarityRank: Record<RarityType, number> = {
  [RarityType.Common]: 1,
  [RarityType.Uncommon]: 2,
  [RarityType.Rare]: 3,
  [RarityType.Epic]: 4,
  [RarityType.Legendary]: 5,
  [RarityType.Mythic]: 6,
}

type Comparator = (itemA: SortableItem, itemB: SortableItem) => number

const byPower: Comparator = (itemA, itemB) =>
  (itemA.powerLevel ?? 0) - (itemB.powerLevel ?? 0)
const byLevel: Comparator = (itemA, itemB) =>
  (itemA.level ?? 0) - (itemB.level ?? 0)
const byRarity: Comparator = (itemA, itemB) =>
  (itemA.rarity ? rarityRank[itemA.rarity] : 0) -
  (itemB.rarity ? rarityRank[itemB.rarity] : 0)
const byQuantity: Comparator = (itemA, itemB) => itemA.quantity - itemB.quantity
const byName: Comparator = (itemA, itemB) =>
  itemA.name.localeCompare(itemB.name, undefined, { sensitivity: 'base' })

function descending(comparator: Comparator): Comparator {
  return (itemA, itemB) => comparator(itemB, itemA)
}

/**
 * The field picks the main order; ties always fall back to the highest
 * values first, then the name.
 */
const comparators: Record<StwSortField, Array<Comparator>> = {
  power: [byPower, descending(byRarity), descending(byLevel)],
  level: [byLevel, descending(byRarity), descending(byPower)],
  rarity: [byRarity, descending(byPower), descending(byLevel)],
  quantity: [byQuantity, descending(byRarity), descending(byPower)],
  name: [byName],
}

/**
 * Highest first, except names, which go from A to Z.
 */
export const stwDefaultSortDirections: Record<StwSortField, StwSortDirection> =
  {
    power: 'desc',
    level: 'desc',
    name: 'asc',
    rarity: 'desc',
    quantity: 'desc',
  }

export function sortStwItems<Item extends SortableItem>(
  items: Array<Item>,
  field: StwSortField,
  direction: StwSortDirection,
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
