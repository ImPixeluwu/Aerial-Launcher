import type { HomebaseOverview, HomebaseZoneId } from '../../../types/homebase'

import { useEffect, useRef, useState } from 'react'

import { homebaseZoneIds } from '../../../config/constants/homebase'

import { useGetSelectedAccount } from '../../../hooks/accounts'

export function useHomebaseData() {
  const { selected } = useGetSelectedAccount()

  const [overview, setOverview] = useState<HomebaseOverview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [zoneId, setZoneId] = useState<HomebaseZoneId>(homebaseZoneIds[0])
  const requestId = useRef(0)

  const loadOverview = () => {
    if (!selected) {
      setOverview(null)

      return
    }

    const currentRequest = ++requestId.current

    setIsLoading(true)

    window.electronAPI
      .getHomebaseOverview(selected)
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
            zones: [],
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
    setOverview(null)
    setZoneId(homebaseZoneIds[0])
    loadOverview()
  }, [selected?.accountId])

  const zone = overview?.zones.find((item) => item.zoneId === zoneId) ?? null

  return {
    isLoading,
    overview,
    selected,
    zone,
    zoneId,

    loadOverview,
    setZoneId,
  }
}
