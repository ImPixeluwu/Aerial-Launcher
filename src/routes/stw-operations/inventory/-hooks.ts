import type { RarityType } from '../../../config/constants/resources'
import type {
  InventoryGroup,
  InventoryItemType,
  InventoryOverview,
  InventoryProfileId,
} from '../../../types/inventory'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'

import type {
  StwSortDirection,
  StwSortField,
} from '../../../lib/parsers/item-sort'

import {
  inventoryDefaultSortField,
  inventoryTypesByGroup,
} from '../../../config/constants/inventory'

import { useGetSelectedAccount } from '../../../hooks/accounts'

import {
  countInventoryItems,
  filterInventoryItems,
} from '../../../lib/parsers/inventory-list'
import {
  sortStwItems,
  stwDefaultSortDirections,
} from '../../../lib/parsers/item-sort'

export function useInventoryData() {
  const { selected } = useGetSelectedAccount()

  const [profileId, setProfileId] = useState<InventoryProfileId>('theater0')
  const [overview, setOverview] = useState<InventoryOverview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [groups, setGroupsState] = useState<Array<InventoryGroup>>([])
  const [types, setTypes] = useState<Array<InventoryItemType>>([])
  const [rarities, setRarities] = useState<Array<RarityType>>([])
  const [searchValue, setSearchValue] = useState('')
  const [sortField, setSortFieldState] = useState<StwSortField>(
    inventoryDefaultSortField,
  )
  const [sortDirection, setSortDirection] = useState<StwSortDirection>(
    stwDefaultSortDirections[inventoryDefaultSortField],
  )
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null)
  const requestId = useRef(0)

  const debouncedSearchValue = useDebounce(searchValue, 200)

  // Unselecting a category also drops its types
  const setGroups = (value: Array<InventoryGroup>) => {
    const allowedTypes = value.flatMap((group) => inventoryTypesByGroup[group])

    setGroupsState(value)
    setTypes((current) => current.filter((type) => allowedTypes.includes(type)))
  }

  // Each field starts in its natural direction
  const setSortField = (value: StwSortField) => {
    setSortFieldState(value)
    setSortDirection(stwDefaultSortDirections[value])
  }

  const toggleSortDirection = () => {
    setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
  }

  const resetFilters = () => {
    setGroupsState([])
    setTypes([])
    setRarities([])
    setSearchValue('')
  }

  const loadOverview = () => {
    if (!selected) {
      setOverview(null)

      return
    }

    const currentRequest = ++requestId.current

    setIsLoading(true)
    setSelectedItemKey(null)

    window.electronAPI
      .getInventoryOverview(selected, profileId)
      .then((response) => {
        if (currentRequest === requestId.current) {
          setOverview(response)
        }
      })
      .catch((error: Error) => {
        if (currentRequest === requestId.current) {
          setOverview({
            success: false,
            error: error?.message,
            profileId,
            items: [],
            categoryCounts: {
              ranged: 0,
              melee: 0,
              traps: 0,
              ingredients: 0,
              materials: 0,
            },
            rarityCounts: {},
          })
        }
      })
      .finally(() => {
        if (currentRequest === requestId.current) {
          setIsLoading(false)
        }
      })
  }

  useEffect(() => {
    resetFilters()
  }, [selected?.accountId])

  useEffect(() => {
    loadOverview()
  }, [selected?.accountId, profileId])

  const filteredItems = useMemo(
    () =>
      sortStwItems(
        filterInventoryItems(overview?.items ?? [], {
          groups,
          types,
          rarities,
          search: debouncedSearchValue,
        }),
        sortField,
        sortDirection,
      ),
    [
      overview,
      groups,
      types,
      rarities,
      debouncedSearchValue,
      sortField,
      sortDirection,
    ],
  )
  const counts = useMemo(
    () => countInventoryItems(overview?.items ?? []),
    [overview],
  )

  // The grid renders in the background, so filter buttons respond at once
  const deferredItems = useDeferredValue(filteredItems)

  const selectedItem =
    overview?.items.find((item) => item.itemKey === selectedItemKey) ?? null
  const hasActiveFilters =
    groups.length > 0 ||
    types.length > 0 ||
    rarities.length > 0 ||
    searchValue.trim().length > 0

  return {
    counts,
    filteredItems: deferredItems,
    groups,
    hasActiveFilters,
    isFiltering: deferredItems !== filteredItems,
    isLoading,
    overview,
    profileId,
    rarities,
    searchValue,
    selected,
    selectedItem,
    sortDirection,
    sortField,
    types,

    loadOverview,
    resetFilters,
    setGroups,
    setProfileId,
    setRarities,
    setSearchValue,
    setSelectedItemKey,
    setSortField,
    setTypes,
    toggleSortDirection,
  }
}
