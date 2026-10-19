import type { RarityType } from '../../../config/constants/resources'
import type {
  InventoryCategory,
  InventoryOverview,
  InventoryProfileId,
} from '../../../types/inventory'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'

import { useGetSelectedAccount } from '../../../hooks/accounts'

export function useInventoryData() {
  const { selected } = useGetSelectedAccount()

  const [profileId, setProfileId] = useState<InventoryProfileId>('theater0')
  const [overview, setOverview] = useState<InventoryOverview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Array<InventoryCategory>>([])
  const [rarities, setRarities] = useState<Array<RarityType>>([])
  const [searchValue, setSearchValue] = useState('')
  const [selectedItemKey, setSelectedItemKey] = useState<string | null>(null)
  const requestId = useRef(0)

  const debouncedSearchValue = useDebounce(searchValue, 200)

  const resetFilters = () => {
    setCategories([])
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
              weapons: 0,
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

  const filteredItems = useMemo(() => {
    const items = overview?.items ?? []
    const needle = debouncedSearchValue.trim().toLowerCase()

    return items.filter((item) => {
      if (categories.length > 0 && !categories.includes(item.category)) {
        return false
      }

      if (
        rarities.length > 0 &&
        (!item.rarity || !rarities.includes(item.rarity))
      ) {
        return false
      }

      if (
        needle &&
        !`${item.name} ${item.templateId}`.toLowerCase().includes(needle)
      ) {
        return false
      }

      return true
    })
  }, [overview, categories, rarities, debouncedSearchValue])

  const selectedItem =
    overview?.items.find((item) => item.itemKey === selectedItemKey) ?? null
  const hasActiveFilters =
    categories.length > 0 ||
    rarities.length > 0 ||
    searchValue.trim().length > 0

  return {
    categories,
    filteredItems,
    hasActiveFilters,
    isLoading,
    overview,
    profileId,
    rarities,
    searchValue,
    selected,
    selectedItem,

    loadOverview,
    resetFilters,
    setCategories,
    setProfileId,
    setRarities,
    setSearchValue,
    setSelectedItemKey,
  }
}
