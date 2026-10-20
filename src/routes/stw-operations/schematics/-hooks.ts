import type { RarityType } from '../../../config/constants/resources'
import type { InventoryFilterType } from '../../../types/inventory'
import type {
  SchematicGroup,
  SchematicSortDirection,
  SchematicSortField,
  SchematicSource,
  SchematicsOverview,
} from '../../../types/schematics'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'

import {
  schematicDefaultSortDirections,
  schematicDefaultSortField,
  schematicTypesByGroup,
  schematicsCacheTime,
  schematicsSearchDelay,
} from '../../../config/constants/schematics'

import { useGetSelectedAccount } from '../../../hooks/accounts'

import {
  createEmptySchematicsOverview,
  filterSchematics,
  sortSchematics,
} from '../../../lib/parsers/schematics-list'

/**
 * Overviews by account, so coming back to the page shortly after does not
 * query the profiles again.
 */
const overviewCache = new Map<
  string,
  { overview: SchematicsOverview; time: number }
>()

export function useSchematicsData() {
  const { selected } = useGetSelectedAccount()

  const [overview, setOverview] = useState<SchematicsOverview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sources, setSources] = useState<Array<SchematicSource>>([])
  const [groups, setGroupsState] = useState<Array<SchematicGroup>>([])
  const [types, setTypes] = useState<Array<InventoryFilterType>>([])
  const [rarities, setRarities] = useState<Array<RarityType>>([])
  const [searchValue, setSearchValue] = useState('')
  const [sortField, setSortFieldState] = useState<SchematicSortField>(
    schematicDefaultSortField,
  )
  const [sortDirection, setSortDirection] = useState<SchematicSortDirection>(
    schematicDefaultSortDirections[schematicDefaultSortField],
  )
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null)
  const requestId = useRef(0)

  const debouncedSearchValue = useDebounce(searchValue, schematicsSearchDelay)

  // Unselecting a category also drops its types
  const setGroups = (value: Array<SchematicGroup>) => {
    const allowedTypes = value.flatMap((group) => schematicTypesByGroup[group])

    setGroupsState(value)
    setTypes((current) => current.filter((type) => allowedTypes.includes(type)))
  }

  // Each field starts in its natural direction
  const setSortField = (value: SchematicSortField) => {
    setSortFieldState(value)
    setSortDirection(schematicDefaultSortDirections[value])
  }

  const toggleSortDirection = () => {
    setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
  }

  const resetFilters = () => {
    setSources([])
    setGroupsState([])
    setTypes([])
    setRarities([])
    setSearchValue('')
  }

  const loadOverview = (force = true) => {
    const currentRequest = ++requestId.current

    setSelectedItemKey(null)

    if (!selected) {
      setOverview(null)
      setIsLoading(false)

      return
    }

    const accountId = selected.accountId
    const cached = overviewCache.get(accountId)

    if (!force && cached && Date.now() - cached.time < schematicsCacheTime) {
      setOverview(cached.overview)
      setIsLoading(false)

      return
    }

    setIsLoading(true)

    window.electronAPI
      .getSchematicsOverview(selected)
      .then((response) => {
        if (response.success) {
          overviewCache.set(accountId, {
            overview: response,
            time: Date.now(),
          })
        }

        if (currentRequest === requestId.current) {
          setOverview(response)
        }
      })
      .catch((error: Error) => {
        if (currentRequest === requestId.current) {
          setOverview({
            ...createEmptySchematicsOverview(),
            success: false,
            error: error?.message,
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
    setOverview(null)
    loadOverview(false)
  }, [selected?.accountId])

  const filteredItems = useMemo(
    () =>
      sortSchematics(
        filterSchematics(overview?.items ?? [], {
          sources,
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
      sources,
      groups,
      types,
      rarities,
      debouncedSearchValue,
      sortField,
      sortDirection,
    ],
  )

  const selectedItem =
    overview?.items.find((item) => item.itemKey === selectedItemKey) ?? null
  const hasActiveFilters =
    sources.length > 0 ||
    groups.length > 0 ||
    types.length > 0 ||
    rarities.length > 0 ||
    searchValue.trim().length > 0

  return {
    filteredItems,
    groups,
    hasActiveFilters,
    isLoading,
    overview,
    rarities,
    searchValue,
    selected,
    selectedItem,
    sortDirection,
    sortField,
    sources,
    types,

    loadOverview,
    resetFilters,
    setRarities,
    setSearchValue,
    setSelectedItemKey,
    setGroups,
    setSortField,
    setSources,
    setTypes,
    toggleSortDirection,
  }
}
