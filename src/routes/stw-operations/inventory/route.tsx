import type {
  InventoryAlteration,
  InventoryItem,
  InventoryItemBaseStats,
} from '../../../types/inventory'

import { useState } from 'react'

import { createRoute } from '@tanstack/react-router'
import { UpdateIcon } from '@radix-ui/react-icons'
import { Search, Star, X, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { RarityType, raritiesColor } from '../../../config/constants/resources'

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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
import { ScrollArea } from '../../../components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '../../../components/ui/toggle-group'

import { useInventoryData } from './-hooks'

import {
  inventoryCategories,
  inventoryProfileIds,
  inventoryRarityOrder,
} from '../../../config/constants/inventory'
import { compactNumber } from '../../../lib/parsers/numbers'
import { assets } from '../../../lib/repository'
import { cn } from '../../../lib/utils'

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/stw-operations/inventory',
  component: () => {
    const { t } = useTranslation(['sidebar'])

    return (
      <>
        <Breadcrumb>
          <BreadcrumbList>
            <HomeBreadcrumb />
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('stw-operations.title')}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {t('stw-operations.options.inventory')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Content />
      </>
    )
  },
})

function fallbackIcon(item: InventoryItem) {
  return assets(item.iconKey) ?? assets('question')
}

function formatQuantity(value: number) {
  return value >= 10_000 ? compactNumber(value) : value.toLocaleString()
}

function Content() {
  const { t } = useTranslation(['stw-operations'])

  const {
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
  } = useInventoryData()

  if (!selected) {
    return (
      <div className="flex flex-grow items-center justify-center text-muted-foreground">
        {t('inventory.no-account')}
      </div>
    )
  }

  const availableRarities = inventoryRarityOrder.filter(
    (rarity) => (overview?.rarityCounts[rarity] ?? 0) > 0,
  )

  return (
    <div className="flex flex-col flex-grow gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={profileId}
          onValueChange={(value) => setProfileId(value as typeof profileId)}
          disabled={isLoading}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {inventoryProfileIds.map((id) => (
              <SelectItem
                key={id}
                value={id}
              >
                {t(`inventory.profile.${id}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="icon"
          variant="outline"
          onClick={loadOverview}
          disabled={isLoading}
          title={t('inventory.reload')}
        >
          <UpdateIcon className={cn({ 'animate-spin': isLoading })} />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={categories}
          onValueChange={(value) => setCategories(value as typeof categories)}
        >
          {inventoryCategories.map((category) => (
            <ToggleGroupItem
              key={category}
              value={category}
            >
              {t(`inventory.category.${category}`)}
              <span className="ml-1 text-muted-foreground">
                {overview?.categoryCounts[category] ?? 0}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {availableRarities.length > 0 && (
          <ToggleGroup
            type="multiple"
            variant="outline"
            value={rarities}
            onValueChange={(value) => setRarities(value as typeof rarities)}
          >
            {availableRarities.map((rarity) => (
              <ToggleGroupItem
                key={rarity}
                value={rarity}
                title={t(`inventory.rarity.${rarity}`)}
              >
                <span
                  className="size-2.5 rounded-full mr-1"
                  style={{ backgroundColor: raritiesColor[rarity] }}
                />
                {overview?.rarityCounts[rarity] ?? 0}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}

        <div className="relative flex-grow min-w-48">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={t('inventory.search-placeholder')}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            spellCheck={false}
          />
        </div>

        <Button
          variant="ghost"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
        >
          <X className="size-4 mr-1" />
          {t('inventory.clear-filters')}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {t('inventory.items-shown', { count: filteredItems.length })}
      </div>

      {overview && !overview.success ? (
        <div className="border-l-4 border-red-400 ml-2 pl-2 text-red-400">
          {t('inventory.load-failed')}: {overview.error}
        </div>
      ) : isLoading && !overview ? (
        <div className="flex flex-grow items-center justify-center">
          <UpdateIcon className="animate-spin size-6" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col flex-grow items-center justify-center text-muted-foreground">
          <p>{t('inventory.no-matches')}</p>
        </div>
      ) : (
        <div
          className={cn(
            'grid gap-3 grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))]',
            { 'opacity-60': isLoading },
          )}
        >
          {filteredItems.map((item) => (
            <ItemCard
              key={item.itemKey}
              item={item}
              onSelect={() => setSelectedItemKey(item.itemKey)}
            />
          ))}
        </div>
      )}

      <ItemDetail
        item={selectedItem}
        onClose={() => setSelectedItemKey(null)}
      />
    </div>
  )
}

// Perk colors as shown in game: grey, green, blue, purple, gold
const perkColors: Record<RarityType, string> = {
  [RarityType.Common]: '#c4c4c4',
  [RarityType.Uncommon]: '#5fc314',
  [RarityType.Rare]: '#2fa3f5',
  [RarityType.Epic]: '#b45cf0',
  [RarityType.Legendary]: '#f5c242',
  [RarityType.Mythic]: '#f5c242',
}

function rarityStyle(item: InventoryItem) {
  const color = raritiesColor[item.rarity ?? RarityType.Common]

  return {
    borderColor: color,
    background: `linear-gradient(180deg, ${color}33 0%, transparent 70%)`,
  }
}

function ItemImage({
  className,
  item,
}: {
  className?: string
  item: InventoryItem
}) {
  const [hasError, setHasError] = useState(false)

  return (
    <img
      src={!hasError && item.imageUrl ? item.imageUrl : fallbackIcon(item)}
      alt=""
      className={cn('object-contain', className)}
      draggable={false}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  )
}

function PowerBadge({
  className,
  powerLevel,
}: {
  className?: string
  powerLevel: number
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded bg-black/70 px-1 text-xs font-semibold',
        className,
      )}
    >
      <Zap className="size-3 fill-current text-yellow-400" />
      {powerLevel}
    </span>
  )
}

function ItemCard({
  item,
  onSelect,
}: {
  item: InventoryItem
  onSelect: () => void
}) {
  const { t } = useTranslation(['stw-operations'])

  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1 rounded-md border-2 p-2 text-left hover:brightness-125 transition"
      style={rarityStyle(item)}
      onClick={onSelect}
      title={t('inventory.view-details')}
    >
      <div className="relative w-full">
        <ItemImage
          item={item}
          className="mx-auto size-16"
        />
        {item.quantity > 1 && (
          <span className="absolute bottom-0 right-0 rounded bg-black/70 px-1 text-xs">
            x{formatQuantity(item.quantity)}
          </span>
        )}
        {item.powerLevel !== null && (
          <PowerBadge
            powerLevel={item.powerLevel}
            className="absolute top-0 left-0"
          />
        )}
      </div>
      {item.tier !== null && <TierStars tier={item.tier} />}
      <span className="w-full text-center text-xs leading-tight line-clamp-2">
        {item.name}
      </span>
    </button>
  )
}

function TierStars({ tier }: { tier: number }) {
  return (
    <span className="flex gap-0.5 text-yellow-400">
      {Array.from({ length: tier }, (_, index) => (
        <Star
          key={index}
          className="size-3 fill-current"
        />
      ))}
    </span>
  )
}

function PerkTierBars({ color, tier }: { color: string; tier: number }) {
  return (
    <span className="flex flex-col-reverse gap-[3px]">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className="h-[5px] w-3 bg-black/40"
          style={index < tier ? { backgroundColor: color } : {}}
        />
      ))}
    </span>
  )
}

function PerkRow({ alteration }: { alteration: InventoryAlteration }) {
  const color = alteration.rarity ? perkColors[alteration.rarity] : undefined
  const elementIcon = alteration.element ? assets(alteration.element) : null
  const hasMarker = alteration.tier !== null || elementIcon

  return (
    <li
      className="flex min-h-10 items-stretch gap-0.5"
      title={alteration.id}
    >
      {hasMarker && (
        <span className="flex w-10 shrink-0 items-center justify-center bg-secondary/80">
          {elementIcon ? (
            <img
              src={elementIcon}
              alt={alteration.element ?? ''}
              className="size-7 object-contain"
              draggable={false}
            />
          ) : (
            <PerkTierBars
              color={color ?? perkColors[RarityType.Common]}
              tier={alteration.tier ?? 0}
            />
          )}
        </span>
      )}
      <span className="flex flex-grow items-center bg-secondary/50 px-2.5 py-1.5">
        {alteration.name}
      </span>
    </li>
  )
}

function formatStat(key: keyof InventoryItemBaseStats, value: number) {
  switch (key) {
    case 'critChance':
    case 'critDamage':
      return `${Math.round(value * 1000) / 10}%`
    case 'attackTime':
    case 'fireDelay':
    case 'reloadTime':
      return `${value.toFixed(2)} s`
    case 'fireRate':
      return value.toFixed(2)
    default:
      return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
  }
}

const statOrder: Array<keyof InventoryItemBaseStats> = [
  'damage',
  'critChance',
  'critDamage',
  'attackTime',
  'fireRate',
  'fireDelay',
  'clipSize',
  'reloadTime',
  'durability',
  'impact',
]

function ItemDetail({
  item,
  onClose,
}: {
  item: InventoryItem | null
  onClose: () => void
}) {
  const { t } = useTranslation(['stw-operations'])

  const stats = item?.baseStats
    ? statOrder.flatMap((key) => {
        const value = item.baseStats?.[key]

        return typeof value === 'number' ? [[key, value] as const] : []
      })
    : []
  const extraRows = item
    ? [
        [t('inventory.prop.quantity'), item.quantity.toLocaleString()],
        [t('inventory.prop.stacks'), String(item.stacks)],
        [
          t('inventory.prop.material'),
          item.material ? t(`inventory.material.${item.material}`) : '—',
        ],
        [t('inventory.prop.template'), item.templateId],
      ]
    : []

  return (
    <Dialog
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent
        className="max-w-3xl gap-0 overflow-hidden p-0"
        hideCloseButton
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogClose
          className="absolute right-2 top-2 z-10 flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t('inventory.close')}
        >
          <X className="size-6" />
        </DialogClose>
        {item && (
          <ScrollArea viewportClassName="max-h-[90vh]">
            <div className="grid gap-4 p-6 pt-14">
              <DialogHeader
                className="rounded-md border-2 p-3"
                style={rarityStyle(item)}
              >
                <div className="flex gap-4">
                  <ItemImage
                    key={item.itemKey}
                    item={item}
                    className="size-24 shrink-0"
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <DialogDescription>
                      {[
                        item.rarity
                          ? t(`inventory.rarity.${item.rarity}`)
                          : null,
                        t(`inventory.category.${item.category}`),
                        item.subType,
                      ]
                        .filter(Boolean)
                        .join(' | ')}
                    </DialogDescription>
                    <DialogTitle className="text-xl">{item.name}</DialogTitle>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {item.powerLevel !== null && (
                        <PowerBadge
                          powerLevel={item.powerLevel}
                          className="text-sm"
                        />
                      )}
                      {item.tier !== null && <TierStars tier={item.tier} />}
                      {item.level !== null && (
                        <span>
                          {item.maxLevel !== null
                            ? t('inventory.level-of', {
                                level: item.level,
                                max: item.maxLevel,
                              })
                            : t('inventory.level-short', { level: item.level })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-4">
                  {stats.length > 0 && (
                    <section className="text-sm">
                      <h3 className="mb-2 font-semibold">
                        {t('inventory.base-stats')}
                      </h3>
                      <dl className="divide-y rounded-md border">
                        {stats.map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between px-3 py-1.5"
                          >
                            <dt className="text-muted-foreground">
                              {t(`inventory.stat.${key}`)}
                            </dt>
                            <dd className="font-semibold">
                              {formatStat(key, value)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  )}

                  <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
                    {extraRows.map(([label, value]) => (
                      <div
                        key={label}
                        className="contents"
                      >
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="break-all">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="flex flex-col gap-4">
                  {item.alterations.length > 0 ? (
                    <section className="text-sm">
                      <h3 className="mb-2 font-semibold">
                        {t('inventory.alterations')}
                      </h3>
                      <ul className="flex flex-col gap-1 overflow-hidden rounded-md">
                        {item.alterations.map((alteration, index) => (
                          <PerkRow
                            key={`${alteration.id}-${index}`}
                            alteration={alteration}
                          />
                        ))}
                      </ul>
                    </section>
                  ) : (
                    item.category === 'weapons' && (
                      <p className="text-sm text-muted-foreground">
                        {t('inventory.no-perks')}
                      </p>
                    )
                  )}

                  {item.description && (
                    <p className="text-sm italic text-muted-foreground">
                      {item.description}
                    </p>
                  )}

                  {item.properties.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer font-semibold">
                        {t('inventory.properties')}
                      </summary>
                      <dl className="mt-2 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-xs">
                        {item.properties.map(({ key, value }) => (
                          <div
                            key={key}
                            className="contents"
                          >
                            <dt className="text-muted-foreground">{key}</dt>
                            <dd className="break-all font-mono">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
