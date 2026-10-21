import type {
  FriendsActionType,
  FriendsEntry,
  FriendsListType,
} from '../../../types/friends-list'
import type { FriendsBulkType } from './-hooks'

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { createRoute } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { UpdateIcon } from '@radix-ui/react-icons'
import { Copy, Search, UserPlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { friendsListTypes } from '../../../config/constants/friends'

import { Route as RootRoute } from '../../__root'

import { HomeBreadcrumb } from '../../../components/navigations/breadcrumb/home'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../../components/ui/breadcrumb'
import { Button } from '../../../components/ui/button'
import { useConfirmDialog } from '../../../components/ui/extended/confirm-dialog'
import { Input } from '../../../components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs'

import { friendsBulkListType, useFriendsData } from './-hooks'

import { toast } from '../../../lib/notifications'
import { cn, parseCustomDisplayName } from '../../../lib/utils'

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/account-management/friends',
  component: () => {
    const { t } = useTranslation(['sidebar'])

    return (
      <>
        <Breadcrumb>
          <BreadcrumbList>
            <HomeBreadcrumb />
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('account-management.title')}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {t('account-management.options.friends')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Content />
      </>
    )
  },
})

/**
 * Actions of each row, in order.
 */
const rowActions: Record<FriendsListType, Array<FriendsActionType>> = {
  friends: ['remove', 'block'],
  incoming: ['accept', 'reject'],
  outgoing: ['cancel'],
  blocked: ['unblock'],
}

const confirmedActions: Array<FriendsActionType> = [
  'reject',
  'cancel',
  'remove',
  'block',
]

const bulkActions: Record<FriendsListType, Array<FriendsBulkType>> = {
  friends: ['remove'],
  incoming: ['accept', 'reject'],
  outgoing: ['cancel'],
  blocked: [],
}

function Content() {
  const { t } = useTranslation(['account-management'])
  const { confirm, dialog } = useConfirmDialog()

  const {
    addValue,
    bulk,
    busyAccountId,
    filteredEntries,
    isAdding,
    isFiltering,
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
  } = useFriendsData()

  const accountName = parseCustomDisplayName(selected)

  const handleAction = (type: FriendsActionType, entry: FriendsEntry) => {
    if (!confirmedActions.includes(type)) {
      runAction(type, entry)

      return
    }

    confirm({
      title: t(`friends.confirm.${type}.title`),
      description: t(`friends.confirm.${type}.description`, {
        name: playerName(entry),
        account: accountName,
      }),
      confirmLabel: t(`friends.actions.${type}`),
      cancelLabel: t('friends.confirm.keep'),
      destructive: true,
      onConfirm: () => runAction(type, entry),
    })
  }

  // Rows keep the same callback, so they are not drawn again on each render
  const actionRef = useRef(handleAction)
  actionRef.current = handleAction
  const onAction = useCallback(
    (type: FriendsActionType, entry: FriendsEntry) =>
      actionRef.current(type, entry),
    [],
  )

  const handleBulk = (type: FriendsBulkType) => {
    const count = summary?.[friendsBulkListType[type]].length ?? 0

    confirm({
      title: t(`friends.bulk.confirm.${type}.title`),
      description: (
        <>
          <p>
            {t(`friends.bulk.confirm.${type}.description`, {
              count,
              account: accountName,
            })}
          </p>
          <p>{t('friends.bulk.confirm.note')}</p>
        </>
      ),
      confirmLabel: t(`friends.bulk.${type}`),
      cancelLabel: t('friends.confirm.keep'),
      destructive: type !== 'accept',
      onConfirm: () => runBulk(type),
    })
  }

  if (!selected) {
    return (
      <div className="flex flex-grow items-center justify-center text-muted-foreground">
        {t('friends.no-account')}
      </div>
    )
  }

  const isBusy = bulk !== null
  const hasSearch = searchValue.trim() !== ''

  return (
    <div className="flex flex-col flex-grow gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {t('friends.subtitle')}
        </p>
        <Button
          size="icon"
          variant="outline"
          onClick={() => loadSummary()}
          disabled={isLoading || isBusy}
          title={t('friends.reload')}
        >
          <UpdateIcon className={cn({ 'animate-spin': isLoading })} />
        </Button>
      </div>

      <form
        className="flex gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          addFriend()
        }}
      >
        <Input
          className="flex-grow"
          placeholder={t('friends.add.placeholder')}
          value={addValue}
          onChange={(event) => setAddValue(event.target.value)}
          disabled={isAdding || isBusy}
          spellCheck={false}
        />
        <Button
          type="submit"
          className="relative"
          disabled={addValue.trim() === '' || isAdding || isBusy}
        >
          <span className={cn('absolute', { hidden: !isAdding })}>
            <UpdateIcon className="animate-spin" />
          </span>
          <span className={cn('flex items-center', { invisible: isAdding })}>
            <UserPlus className="size-4 mr-2" />
            {t('friends.add.submit')}
          </span>
        </Button>
      </form>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as FriendsListType)}
      >
        <TabsList className="flex-wrap h-auto">
          {friendsListTypes.map((type) => (
            <TabsTrigger
              key={type}
              value={type}
              disabled={isBusy}
            >
              {t(`friends.tabs.${type}`)}
              <span className="ml-1.5 tabular-nums text-muted-foreground">
                {summary?.[type].length ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-grow min-w-48">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8 pr-9"
            placeholder={t('friends.search.placeholder')}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            spellCheck={false}
          />
          {searchValue !== '' && (
            <Button
              className="absolute right-0.5 top-0.5 size-9"
              size="icon"
              variant="ghost"
              onClick={() => setSearchValue('')}
              title={t('friends.search.clear')}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <span className="text-sm tabular-nums text-muted-foreground">
          {t('friends.search.shown', {
            shown: filteredEntries.length,
            total: tabEntries.length,
          })}
        </span>
        {bulkActions[tab].map((type) => (
          <Button
            key={type}
            size="sm"
            variant={type === 'accept' ? 'secondary' : 'outline'}
            onClick={() => handleBulk(type)}
            disabled={
              isBusy || busyAccountId !== null || tabEntries.length === 0
            }
          >
            {t(`friends.bulk.${type}`)}
          </Button>
        ))}
      </div>

      {bulk && (
        <div
          className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
          role="status"
        >
          <UpdateIcon className="animate-spin shrink-0" />
          <span className="shrink-0">{t(`friends.bulk.${bulk.type}`)}</span>
          <div className="h-2 flex-grow overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width]"
              style={{
                width: `${(bulk.current / Math.max(bulk.total, 1)) * 100}%`,
              }}
            />
          </div>
          <span className="shrink-0 tabular-nums">
            {bulk.stopping
              ? t('friends.bulk.stopping')
              : t('friends.bulk.progress', {
                  current: bulk.current,
                  total: bulk.total,
                })}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={stopBulk}
            disabled={bulk.stopping}
          >
            {t('friends.bulk.stop')}
          </Button>
        </div>
      )}

      {summary && !summary.success ? (
        <div className="flex items-center gap-3 border-l-4 border-red-400 ml-2 pl-2 text-red-400">
          <span>
            {t('friends.load-failed')}: {summary.error}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadSummary()}
            disabled={isLoading}
          >
            {t('friends.retry')}
          </Button>
        </div>
      ) : isLoading && !summary ? (
        <div className="flex flex-grow items-center justify-center">
          <UpdateIcon className="animate-spin size-6" />
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="flex flex-col flex-grow items-center justify-center text-muted-foreground">
          <p>
            {hasSearch && tabEntries.length > 0
              ? t('friends.empty.no-matches')
              : t(`friends.empty.${tab}`)}
          </p>
        </div>
      ) : (
        <FriendsList
          entries={filteredEntries}
          isStale={isLoading || isFiltering}
          actions={rowActions[tab]}
          busyAccountId={busyAccountId}
          disabled={isBusy || busyAccountId !== null}
          onAction={onAction}
        />
      )}

      {dialog}
    </div>
  )
}

// Fixed row height, so every row of the virtual list has the same size
const rowHeight = 56

/**
 * Only the visible rows are rendered: accounts can have thousands of
 * friends. The page scrolls in the main layout viewport.
 */
function FriendsList({
  actions,
  busyAccountId,
  disabled,
  entries,
  isStale,
  onAction,
}: {
  actions: Array<FriendsActionType>
  busyAccountId: string | null
  disabled: boolean
  entries: Array<FriendsEntry>
  isStale: boolean
  onAction: (type: FriendsActionType, entry: FriendsEntry) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  const [scrollElement] = useState(() =>
    document.querySelector<HTMLElement>('.main-wrapper-content'),
  )

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => rowHeight,
    overscan: 8,
    scrollMargin,
  })

  // The controls above the list change height as they wrap
  useLayoutEffect(() => {
    const offsetTop = containerRef.current?.offsetTop ?? 0

    if (offsetTop !== scrollMargin) {
      setScrollMargin(offsetTop)
    }
  })

  // A new search or tab starts at the top of the list
  useEffect(() => {
    if (scrollElement && scrollElement.scrollTop > scrollMargin) {
      scrollElement.scrollTop = scrollMargin
    }
  }, [entries])

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full rounded-md border transition-opacity', {
        'opacity-60': isStale,
      })}
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((row) => {
        const entry = entries[row.index]

        return (
          <FriendRow
            key={entry.accountId}
            entry={entry}
            actions={actions}
            isBusy={busyAccountId === entry.accountId}
            disabled={disabled}
            isLast={row.index === entries.length - 1}
            offset={row.start - scrollMargin}
            onAction={onAction}
          />
        )
      })}
    </div>
  )
}

const FriendRow = memo(function FriendRow({
  actions,
  disabled,
  entry,
  isBusy,
  isLast,
  offset,
  onAction,
}: {
  actions: Array<FriendsActionType>
  disabled: boolean
  entry: FriendsEntry
  isBusy: boolean
  isLast: boolean
  offset: number
  onAction: (type: FriendsActionType, entry: FriendsEntry) => void
}) {
  const { t } = useTranslation(['account-management'])

  const copyId = () => {
    navigator.clipboard
      .writeText(entry.accountId)
      .then(() => toast(t('friends.copied')))
      .catch(() => {})
  }

  return (
    <div
      className={cn(
        'absolute left-0 top-0 flex w-full items-center gap-3 px-3',
        { 'border-b': !isLast },
      )}
      style={{ height: rowHeight, transform: `translateY(${offset}px)` }}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium uppercase text-muted-foreground">
        {entry.displayName?.at(0) ?? '?'}
      </div>
      <div className="flex min-w-0 flex-grow flex-col">
        <span
          className={cn('truncate text-sm', {
            'italic text-muted-foreground': entry.displayName === null,
          })}
        >
          {entry.displayName ?? t('friends.player')}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="truncate font-mono select-text">
            {entry.accountId}
          </span>
          <button
            type="button"
            className="shrink-0 rounded p-0.5 hover:text-foreground"
            onClick={copyId}
            title={t('friends.copy-id')}
            aria-label={t('friends.copy-id')}
          >
            <Copy className="size-3" />
          </button>
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isBusy && <UpdateIcon className="animate-spin" />}
        {actions.map((type) => (
          <Button
            key={type}
            size="sm"
            className="h-8"
            variant={
              type === 'accept' || type === 'unblock' ? 'secondary' : 'outline'
            }
            onClick={() => onAction(type, entry)}
            disabled={disabled}
          >
            {t(`friends.actions.${type}`)}
          </Button>
        ))}
      </div>
    </div>
  )
})
