import type { RarityType } from '../../../config/constants/resources'
import type {
  SchematicSortKey,
  SchematicSource,
  SchematicTypeGroup,
  SchematicsOverview,
} from '../../../types/schematics'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'

import {
  schematicDefaultSortKey,
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
  const [typeGroups, setTypeGroups] = useState<Array<SchematicTypeGroup>>([])
  const [rarities, setRarities] = useState<Array<RarityType>>([])
  const [searchValue, setSearchValue] = useState('')
  const [sortKey, setSortKey] = useState<SchematicSortKey>(
    schematicDefaultSortKey,
  )
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null)
  const requestId = useRef(0)

  const debouncedSearchValue = useDebounce(searchValue, schematicsSearchDelay)

  const resetFilters = () => {
    setSources([])
    setTypeGroups([])
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
          typeGroups,
          rarities,
          search: debouncedSearchValue,
        }),
        sortKey,
      ),
    [overview, sources, typeGroups, rarities, debouncedSearchValue, sortKey],
  )

  const selectedItem =
    overview?.items.find((item) => item.itemKey === selectedItemKey) ?? null
  const hasActiveFilters =
    sources.length > 0 ||
    typeGroups.length > 0 ||
    rarities.length > 0 ||
    searchValue.trim().length > 0

  return {
    filteredItems,
    hasActiveFilters,
    isLoading,
    overview,
    rarities,
    searchValue,
    selected,
    selectedItem,
    sortKey,
    sources,
    typeGroups,

    loadOverview,
    resetFilters,
    setRarities,
    setSearchValue,
    setSelectedItemKey,
    setSortKey,
    setSources,
    setTypeGroups,
  }
}
