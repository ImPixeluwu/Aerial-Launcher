import type {
  FriendsActionType,
  FriendsEntry,
  FriendsListType,
  FriendsSummary,
} from '../../../types/friends-list'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { useTranslation } from 'react-i18next'

import {
  friendsBulkDelay,
  friendsSearchDelay,
} from '../../../config/constants/friends'

import { useGetSelectedAccount } from '../../../hooks/accounts'

import { applyFriendsAction, filterFriends } from '../../../lib/parsers/friends'
import { toast } from '../../../lib/notifications'

export type FriendsBulkType = Extract<
  FriendsActionType,
  'remove' | 'accept' | 'reject' | 'cancel'
>

export type FriendsBulkState = {
  type: FriendsBulkType
  current: number
  total: number
  failed: number
  stopping: boolean
}

/**
 * List each bulk action runs on.
 */
export const friendsBulkListType: Record<FriendsBulkType, FriendsListType> = {
  remove: 'friends',
  accept: 'incoming',
  reject: 'incoming',
  cancel: 'outgoing',
}

function wait(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

export function useFriendsData() {
  const { t } = useTranslation(['account-management'])
  const { selected } = useGetSelectedAccount()

  const [summary, setSummary] = useState<FriendsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tab, setTabState] = useState<FriendsListType>('friends')
  const [searchValue, setSearchValue] = useState('')
  const [addValue, setAddValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [busyAccountId, setBusyAccountId] = useState<string | null>(null)
  const [bulk, setBulk] = useState<FriendsBulkState | null>(null)

  const loadRequest = useRef(0)
  // Changes with the account: late responses of the previous one are dropped
  const generation = useRef(0)
  const stopBulkRequested = useRef(false)

  const debouncedSearchValue = useDebounce(searchValue, friendsSearchDelay)

  const playerName = (entry: Pick<FriendsEntry, 'displayName'>) =>
    entry.displayName ?? t('friends.player')

  const loadSummary = async () => {
    if (!selected) {
      return
    }

    const current = ++loadRequest.current

    setIsLoading(true)

    const result = await window.electronAPI.getFriendsSummary(selected)

    if (current !== loadRequest.current) {
      return
    }

    setSummary(result)
    setIsLoading(false)
  }

  useEffect(() => {
    generation.current += 1
    loadRequest.current += 1
    stopBulkRequested.current = true

    setSummary(null)
    setSearchValue('')
    setBusyAccountId(null)
    setBulk(null)
    setIsAdding(false)
    setIsLoading(false)

    loadSummary()
  }, [selected?.accountId])

  const setTab = (value: FriendsListType) => {
    setTabState(value)
    setSearchValue('')
  }

  const runAction = async (type: FriendsActionType, entry: FriendsEntry) => {
    if (!selected || busyAccountId !== null || bulk !== null) {
      return
    }

    const currentGeneration = generation.current

    setBusyAccountId(entry.accountId)

    const response = await window.electronAPI.friendsAction(
      selected,
      type,
      entry.accountId,
    )

    if (currentGeneration !== generation.current) {
      return
    }

    setBusyAccountId(null)

    if (!response.success) {
      toast(t('friends.results.error', { error: response.error }))

      return
    }

    if (type !== 'add') {
      setSummary((current) =>
        current
          ? { ...current, ...applyFriendsAction(current, type, entry.accountId) }
          : current,
      )
    }

    toast(t(`friends.results.${type}`, { name: playerName(entry) }))
  }

  const addFriend = async () => {
    const value = addValue.trim()

    if (!selected || value === '' || isAdding || bulk !== null) {
      return
    }

    const currentGeneration = generation.current

    setIsAdding(true)

    const response = await window.electronAPI.friendsAction(
      selected,
      'add',
      value,
    )

    if (currentGeneration !== generation.current) {
      return
    }

    setIsAdding(false)

    if (!response.success) {
      toast(t('friends.results.error', { error: response.error }))

      return
    }

    setAddValue('')
    toast(
      t('friends.add.success', {
        name: response.displayName ?? value,
      }),
    )
    loadSummary()
  }

  /**
   * One request per player, a second apart, on a snapshot of the list.
   */
  const runBulk = async (type: FriendsBulkType) => {
    if (!selected || !summary || busyAccountId !== null || bulk !== null) {
      return
    }

    const entries = summary[friendsBulkListType[type]]
    const currentGeneration = generation.current
    const isCurrent = () =>
      currentGeneration === generation.current && !stopBulkRequested.current
    let done = 0
    let failed = 0

    if (entries.length === 0) {
      return
    }

    stopBulkRequested.current = false
    setBulk({
      type,
      current: 0,
      total: entries.length,
      failed: 0,
      stopping: false,
    })

    for (const [index, entry] of entries.entries()) {
      if (index > 0) {
        await wait(friendsBulkDelay)
      }

      if (!isCurrent()) {
        break
      }

      const response = await window.electronAPI.friendsAction(
        selected,
        type,
        entry.accountId,
      )

      if (currentGeneration !== generation.current) {
        return
      }

      if (response.success) {
        done += 1
      } else {
        failed += 1
      }

      setBulk((current) =>
        current ? { ...current, current: index + 1, failed } : current,
      )
    }

    if (currentGeneration !== generation.current) {
      return
    }

    setBulk(null)
    toast(
      t(failed > 0 ? 'friends.bulk.done-with-errors' : 'friends.bulk.done', {
        done,
        failed,
        total: entries.length,
      }),
    )
    loadSummary()
  }

  const stopBulk = () => {
    stopBulkRequested.current = true
    setBulk((current) => (current ? { ...current, stopping: true } : current))
  }

  const tabEntries = summary?.[tab] ?? []
  const filteredEntries = useMemo(
    () => filterFriends(tabEntries, debouncedSearchValue),
    [tabEntries, debouncedSearchValue],
  )
  const deferredEntries = useDeferredValue(filteredEntries)

  return {
    addValue,
    bulk,
    busyAccountId,
    filteredEntries: deferredEntries,
    isAdding,
    isFiltering:
      deferredEntries !== filteredEntries ||
      searchValue !== debouncedSearchValue,
    isLoading,
    searchValue,
    selected,
    summary,
    tab,
    tabEntries,

    addFriend,
    loadSummary,
    playerName,
    runAction,
    runBulk,
    setAddValue,
    setSearchValue,
    setTab,
    stopBulk,
  }
}
