import { describe, expect, it } from 'vitest'

import { RarityType } from '../../config/constants/resources'

import { sortStwItems, stwDefaultSortDirections } from './item-sort'

function item(
  name: string,
  values: Partial<{
    powerLevel: number | null
    level: number | null
    rarity: RarityType | null
    quantity: number
  }> = {},
) {
  return {
    name,
    powerLevel: null,
    level: null,
    rarity: null,
    quantity: 1,
    ...values,
  }
}

const names = (items: Array<{ name: string }>) => items.map(({ name }) => name)

describe('sortStwItems', () => {
  it('sorts by quantity and breaks ties by rarity, then name', () => {
    const items = [
      item('Wood', { quantity: 999 }),
      item('Duct Tape', { quantity: 120 }),
      item('Stone', { quantity: 999 }),
      item('Sword', { quantity: 120, rarity: RarityType.Legendary }),
    ]

    expect(names(sortStwItems(items, 'quantity', 'desc'))).toEqual([
      'Stone',
      'Wood',
      'Sword',
      'Duct Tape',
    ])
    expect(names(sortStwItems(items, 'quantity', 'asc'))).toEqual([
      'Sword',
      'Duct Tape',
      'Stone',
      'Wood',
    ])
  })

  it('puts items without power level last when sorting by power', () => {
    const items = [
      item('Wood'),
      item('Sword', { powerLevel: 130 }),
      item('Axe', { powerLevel: 12 }),
    ]

    expect(names(sortStwItems(items, 'power', 'desc'))).toEqual([
      'Sword',
      'Axe',
      'Wood',
    ])
  })

  it('defaults to descending, except names', () => {
    expect(stwDefaultSortDirections).toEqual({
      power: 'desc',
      level: 'desc',
      name: 'asc',
      rarity: 'desc',
      quantity: 'desc',
    })
  })
})
