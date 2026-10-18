import type { InventoryItem } from '../../../types/inventory'

import { createRoute } from '@tanstack/react-router'
import { UpdateIcon } from '@radix-ui/react-icons'
import { Search, Star, X } from 'lucide-react'
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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Input } from '../../../components/ui/input'
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
} from '../../../lib/parsers/inventory'
import { compactNumber } from '../../../lib/parsers/numbers'
import { assets } from '../../../lib/repository'
import { cn, parseCustomDisplayName } from '../../../lib/utils'

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

function itemIcon(item: InventoryItem) {
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
        <span className="text-sm text-muted-foreground">
          {t('inventory.account', {
            name: parseCustomDisplayName(selected),
          })}
        </span>
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

function rarityStyle(item: InventoryItem) {
  const color = raritiesColor[item.rarity ?? RarityType.Common]

  return {
    borderColor: color,
    background: `linear-gradient(180deg, ${color}33 0%, transparent 70%)`,
  }
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
        <img
          src={itemIcon(item)}
          alt=""
          className="mx-auto size-16 object-contain"
          draggable={false}
        />
        {item.quantity > 1 && (
          <span className="absolute bottom-0 right-0 rounded bg-black/70 px-1 text-xs">
            x{formatQuantity(item.quantity)}
          </span>
        )}
        {item.level !== null && (
          <span className="absolute top-0 left-0 rounded bg-black/70 px-1 text-xs">
            {t('inventory.level-short', { level: item.level })}
          </span>
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

function ItemDetail({
  item,
  onClose,
}: {
  item: InventoryItem | null
  onClose: () => void
}) {
  const { t } = useTranslation(['stw-operations'])

  const rows = item
    ? [
        [
          t('inventory.prop.category'),
          t(`inventory.category.${item.category}`),
        ],
        [
          t('inventory.prop.rarity'),
          item.rarity ? t(`inventory.rarity.${item.rarity}`) : '—',
        ],
        [t('inventory.prop.quantity'), item.quantity.toLocaleString()],
        [t('inventory.prop.stacks'), String(item.stacks)],
        [
          t('inventory.prop.level'),
          item.level === null ? '—' : String(item.level),
        ],
        [
          t('inventory.prop.tier'),
          item.tier === null ? '—' : String(item.tier),
        ],
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
      <DialogContent className="max-w-md">
        {item && (
          <>
            <DialogHeader>
              <div
                className="mb-2 flex justify-center rounded-md border-2 p-3"
                style={rarityStyle(item)}
              >
                <img
                  src={itemIcon(item)}
                  alt=""
                  className="size-24 object-contain"
                  draggable={false}
                />
              </div>
              <DialogTitle>{item.name}</DialogTitle>
              <DialogDescription>
                {t(`inventory.category.${item.category}`)}
              </DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
              {rows.map(([label, value]) => (
                <div
                  key={label}
                  className="contents"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="break-all">{value}</dd>
                </div>
              ))}
            </dl>

            {item.alterations.length > 0 && (
              <div className="text-sm">
                <h3 className="mb-1 font-semibold">
                  {t('inventory.alterations')}
                </h3>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {item.alterations.map((alteration) => (
                    <li
                      key={alteration}
                      className="break-all"
                    >
                      {alteration.replace(/^Alteration:/i, '')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
