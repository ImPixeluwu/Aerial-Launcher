import type { SchematicItem } from '../../../types/schematics'

import { createRoute } from '@tanstack/react-router'
import { UpdateIcon } from '@radix-ui/react-icons'
import { BookOpen, Search, Star, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { raritiesColor } from '../../../config/constants/resources'
import { inventoryRarityOrder } from '../../../config/constants/inventory'
import {
  schematicSortKeys,
  schematicSources,
  schematicTypeGroups,
  schematicTypeIcons,
} from '../../../config/constants/schematics'

import { Route as RootRoute } from '../../__root'

import { HomeBreadcrumb } from '../../../components/navigations/breadcrumb/home'
import {
  ItemDetailDialog,
  type StwItemDetail,
} from '../../../components/stw-items/item-detail-dialog'
import {
  ItemImage,
  PowerBadge,
  formatQuantity,
  rarityStyle,
} from '../../../components/stw-items/item-parts'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../../components/ui/breadcrumb'
import { Button } from '../../../components/ui/button'
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

import { useSchematicsData } from './-hooks'

import { schematicLevelProgress } from '../../../lib/parsers/schematics-list'
import { assets } from '../../../lib/repository'
import { cn } from '../../../lib/utils'

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: '/stw-operations/schematics',
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
                {t('stw-operations.options.schematics')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Content />
      </>
    )
  },
})

function Content() {
  const { t } = useTranslation(['stw-operations'])

  const {
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
  } = useSchematicsData()

  if (!selected) {
    return (
      <div className="flex flex-grow items-center justify-center text-muted-foreground">
        {t('schematics.no-account')}
      </div>
    )
  }

  const selectedIndex = selectedItem
    ? filteredItems.findIndex((item) => item.itemKey === selectedItem.itemKey)
    : -1
  const selectItemAt = (index: number) => {
    const next = filteredItems[index]

    if (next) {
      setSelectedItemKey(next.itemKey)
    }
  }

  const availableTypeGroups = schematicTypeGroups.filter(
    (typeGroup) => (overview?.typeCounts[typeGroup] ?? 0) > 0,
  )
  const availableRarities = inventoryRarityOrder.filter(
    (rarity) => (overview?.rarityCounts[rarity] ?? 0) > 0,
  )

  return (
    <div className="flex flex-col flex-grow gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex-grow text-sm text-muted-foreground">
          {t('schematics.subtitle')}
        </p>
        <Select
          value={sortKey}
          onValueChange={(value) => setSortKey(value as typeof sortKey)}
        >
          <SelectTrigger
            className="w-56"
            aria-label={t('schematics.sort.label')}
            title={t('schematics.sort.label')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {schematicSortKeys.map((key) => (
              <SelectItem
                key={key}
                value={key}
              >
                {t(`schematics.sort.${key}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="icon"
          variant="outline"
          onClick={() => loadOverview()}
          disabled={isLoading}
          title={t('schematics.reload')}
        >
          <UpdateIcon className={cn({ 'animate-spin': isLoading })} />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          type="multiple"
          variant="outline"
          value={sources}
          onValueChange={(value) => setSources(value as typeof sources)}
        >
          {schematicSources.map((source) => (
            <ToggleGroupItem
              key={source}
              value={source}
            >
              {t(`schematics.source.${source}`)}
              <span className="ml-1 text-muted-foreground">
                {overview?.sourceCounts[source] ?? 0}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {availableTypeGroups.length > 0 && (
          <ToggleGroup
            type="multiple"
            variant="outline"
            className="flex-wrap justify-start"
            value={typeGroups}
            onValueChange={(value) => setTypeGroups(value as typeof typeGroups)}
          >
            {availableTypeGroups.map((typeGroup) => (
              <ToggleGroupItem
                key={typeGroup}
                value={typeGroup}
              >
                {t(`schematics.type.${typeGroup}`)}
                <span className="ml-1 text-muted-foreground">
                  {overview?.typeCounts[typeGroup] ?? 0}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}

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
            placeholder={t('schematics.search-placeholder')}
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
          {t('schematics.clear-filters')}
        </Button>
      </div>

      <div className="flex flex-wrap justify-between gap-x-4 text-sm text-muted-foreground">
        <span>
          {t('schematics.items-shown', { count: filteredItems.length })}
        </span>
        <span className="text-xs">{t('schematics.english-note')}</span>
      </div>

      {overview?.collectionBookError && (
        <div className="border-l-4 border-yellow-400 ml-2 pl-2 text-sm text-yellow-400">
          {t('schematics.collection-book-failed')}:{' '}
          {overview.collectionBookError}
        </div>
      )}

      {overview && !overview.success ? (
        <div className="border-l-4 border-red-400 ml-2 pl-2 text-red-400">
          {t('schematics.load-failed')}: {overview.error}
        </div>
      ) : isLoading && !overview ? (
        <div className="flex flex-grow items-center justify-center">
          <UpdateIcon className="animate-spin size-6" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col flex-grow items-center justify-center text-muted-foreground">
          <p>{t('schematics.no-matches')}</p>
        </div>
      ) : (
        <div
          className={cn(
            'grid gap-3 grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))]',
            { 'opacity-60': isLoading },
          )}
        >
          {filteredItems.map((item) => (
            <SchematicCard
              key={item.itemKey}
              item={item}
              onSelect={() => setSelectedItemKey(item.itemKey)}
            />
          ))}
        </div>
      )}

      <SchematicDetail
        item={selectedItem}
        position={
          selectedIndex >= 0
            ? { index: selectedIndex, total: filteredItems.length }
            : null
        }
        onClose={() => setSelectedItemKey(null)}
        onPrevious={() => selectItemAt(selectedIndex - 1)}
        onNext={() => selectItemAt(selectedIndex + 1)}
      />
    </div>
  )
}

/**
 * Five stars: the first "tier" ones are lit and the first supercharges
 * are highlighted.
 */
function SchematicStars({ item }: { item: SchematicItem }) {
  const tier = Math.min(Math.max(item.tier ?? 1, 1), 5)
  const supercharged = Math.min(item.superchargeLevel, tier)

  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(
            'size-3',
            index < supercharged
              ? 'fill-current text-sky-400'
              : index < tier
                ? 'fill-current text-yellow-400'
                : 'text-muted-foreground/40',
          )}
        />
      ))}
    </span>
  )
}

function SchematicCard({
  item,
  onSelect,
}: {
  item: SchematicItem
  onSelect: () => void
}) {
  const { t } = useTranslation(['stw-operations'])
  const typeIcon = item.typeGroup
    ? assets(schematicTypeIcons[item.typeGroup])
    : null

  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1 rounded-md border-2 p-2 text-left hover:brightness-125 transition"
      style={rarityStyle(item.rarity)}
      onClick={onSelect}
      title={t('schematics.view-details')}
    >
      <div className="relative w-full">
        <ItemImage
          iconKey={item.iconKey}
          imageUrl={item.imageUrl}
          className="mx-auto size-16"
        />
        {item.powerLevel !== null && item.powerLevel > 0 && (
          <PowerBadge
            powerLevel={item.powerLevel}
            className="absolute top-0 left-0"
          />
        )}
        {typeIcon && item.typeGroup && (
          <img
            src={typeIcon}
            alt={t(`schematics.type.${item.typeGroup}`)}
            title={t(`schematics.type.${item.typeGroup}`)}
            className="absolute top-0 right-0 size-5 rounded bg-black/70 p-0.5"
            draggable={false}
          />
        )}
        {item.source === 'collection-book' && (
          <span
            className="absolute bottom-0 left-0 rounded bg-black/70 p-0.5"
            title={t('schematics.source.collection-book')}
          >
            <BookOpen className="size-3" />
          </span>
        )}
        {item.quantity > 1 && (
          <span className="absolute bottom-0 right-0 rounded bg-black/70 px-1 text-xs">
            x{formatQuantity(item.quantity)}
          </span>
        )}
      </div>
      <SchematicStars item={item} />
      <span className="h-1 w-full overflow-hidden rounded bg-black/40">
        <span
          className="block h-full bg-sky-400"
          style={{ width: `${schematicLevelProgress(item.level)}%` }}
        />
      </span>
      <span className="w-full text-center text-xs leading-tight line-clamp-2">
        {item.name}
      </span>
    </button>
  )
}

function SchematicDetail({
  item,
  position,
  onClose,
  onNext,
  onPrevious,
}: {
  item: SchematicItem | null
  position: { index: number; total: number } | null
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
}) {
  const { t } = useTranslation(['stw-operations'])

  const detail: StwItemDetail | null = item && {
    key: item.itemKey,
    name: item.name,
    iconKey: item.iconKey,
    imageUrl: item.imageUrl,
    rarity: item.rarity,
    labels: [
      item.rarity ? t(`inventory.rarity.${item.rarity}`) : null,
      t(`schematics.category.${item.category}`),
      item.subType,
    ].filter((label): label is string => Boolean(label)),
    powerLevel: item.powerLevel,
    stars: <SchematicStars item={item} />,
    levelText:
      item.level === null
        ? null
        : item.maxLevel !== null
          ? t('inventory.level-of', { level: item.level, max: item.maxLevel })
          : t('inventory.level-short', { level: item.level }),
    level: item.level,
    stats: item.stats,
    alterations: item.alterations,
    showNoPerks: item.category === 'weapon',
    description: item.description,
    rows: [
      [t('schematics.prop.source'), t(`schematics.source.${item.source}`)],
      ...(item.superchargeLevel > 0
        ? [
            [
              t('schematics.prop.supercharge'),
              t('schematics.supercharged', { count: item.superchargeLevel }),
            ] as [string, string],
          ]
        : []),
      [t('inventory.prop.quantity'), item.quantity.toLocaleString()],
      [
        t('inventory.prop.material'),
        item.material ? t(`inventory.material.${item.material}`) : '—',
      ],
      [t('inventory.prop.template'), item.templateId],
      [t('schematics.prop.item-template'), item.itemTemplateId ?? '—'],
    ],
  }

  return (
    <ItemDetailDialog
      detail={detail}
      position={position}
      onClose={onClose}
      onNext={onNext}
      onPrevious={onPrevious}
    />
  )
}
