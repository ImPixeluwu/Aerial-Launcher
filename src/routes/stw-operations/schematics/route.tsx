import type { SchematicItem } from '../../../types/schematics'

import { memo } from 'react'

import { createRoute } from '@tanstack/react-router'
import { UpdateIcon } from '@radix-ui/react-icons'
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  BookOpen,
  Search,
  Star,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { raritiesColor } from '../../../config/constants/resources'
import { inventoryRarityOrder } from '../../../config/constants/inventory'
import {
  schematicGroups,
  schematicSortFields,
  schematicSources,
  schematicTypeIcons,
  schematicTypesByGroup,
} from '../../../config/constants/schematics'

import { Route as RootRoute } from '../../__root'

import { GoToTop } from '../../../components/go-to-top'
import {
  FilterCount,
  FilterLabel,
} from '../../../components/stw-items/filter-parts'
import { VirtualItemGrid } from '../../../components/stw-items/virtual-item-grid'
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
    groups,
    hasActiveFilters,
    isFiltering,
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

  const availableGroups = schematicGroups.filter(
    (group) => (overview?.groupCounts[group] ?? 0) > 0,
  )
  const availableTypes = groups
    .flatMap((group) => schematicTypesByGroup[group])
    .filter((type) => (overview?.typeCounts[type] ?? 0) > 0)
  const sortDirectionLabel = t(`schematics.sort.${sortDirection}`)
  const availableRarities = inventoryRarityOrder.filter(
    (rarity) => (overview?.rarityCounts[rarity] ?? 0) > 0,
  )

  return (
    <div className="flex flex-col flex-grow gap-4">
      <div
        id="schematics-toolbar"
        className="flex flex-wrap items-center gap-3"
      >
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
        <Select
          value={sortField}
          onValueChange={(value) => setSortField(value as typeof sortField)}
        >
          <SelectTrigger
            className="w-40"
            aria-label={t('schematics.sort.label')}
            title={t('schematics.sort.label')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {schematicSortFields.map((field) => (
              <SelectItem
                key={field}
                value={field}
              >
                {t(`schematics.sort.${field}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="icon"
          variant="outline"
          onClick={toggleSortDirection}
          aria-label={sortDirectionLabel}
          title={sortDirectionLabel}
        >
          {sortDirection === 'desc' ? (
            <ArrowDownWideNarrow className="size-4" />
          ) : (
            <ArrowUpNarrowWide className="size-4" />
          )}
        </Button>
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

      {/* One row per filter, so a wider counter only wraps its own row */}
      <div className="grid grid-cols-[auto,1fr] items-center gap-x-3 gap-y-2">
        <FilterLabel>{t('schematics.filter.source')}</FilterLabel>
        <ToggleGroup
          type="multiple"
          variant="outline"
          className="flex-wrap justify-start"
          value={sources}
          onValueChange={(value) => setSources(value as typeof sources)}
        >
          {schematicSources.map((source) => (
            <ToggleGroupItem
              key={source}
              value={source}
            >
              {t(`schematics.source.${source}`)}
              <FilterCount value={overview?.sourceCounts[source]} />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {availableGroups.length > 0 && (
          <>
            <FilterLabel>{t('schematics.filter.category')}</FilterLabel>
            <ToggleGroup
              type="multiple"
              variant="outline"
              className="flex-wrap justify-start"
              value={groups}
              onValueChange={(value) => setGroups(value as typeof groups)}
            >
              {availableGroups.map((group) => (
                <ToggleGroupItem
                  key={group}
                  value={group}
                >
                  {t(`schematics.group.${group}`)}
                  <FilterCount value={overview?.groupCounts[group]} />
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </>
        )}

        {availableTypes.length > 0 && (
          <ToggleGroup
            type="multiple"
            variant="outline"
            className="col-start-2 flex-wrap justify-start"
            value={types}
            onValueChange={(value) => setTypes(value as typeof types)}
          >
            {availableTypes.map((type) => (
              <ToggleGroupItem
                key={type}
                value={type}
              >
                {t(`schematics.type.${type}`)}
                <FilterCount value={overview?.typeCounts[type]} />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}

        {availableRarities.length > 0 && (
          <>
            <FilterLabel>{t('schematics.filter.rarity')}</FilterLabel>
            <ToggleGroup
              type="multiple"
              variant="outline"
              className="flex-wrap justify-start"
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
                  <span className="tabular-nums">
                    {overview?.rarityCounts[rarity] ?? 0}
                  </span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <span className="tabular-nums">
          {t('schematics.items-shown', { count: filteredItems.length })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
        >
          <X className="size-4 mr-1" />
          {t('schematics.clear-filters')}
        </Button>
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
        <VirtualItemGrid
          cardHeight={cardHeight}
          items={filteredItems}
          isStale={isLoading || isFiltering}
          selectedIndex={selectedIndex}
          getKey={(item) => item.itemKey}
          renderItem={(item) => (
            <SchematicCard
              item={item}
              onSelect={setSelectedItemKey}
            />
          )}
        />
      )}

      <GoToTop containerId="schematics-toolbar" />

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

// Fixed card height: every row of the virtual grid has the same size
const cardHeight = 156

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

const SchematicCard = memo(function SchematicCard({
  item,
  onSelect,
}: {
  item: SchematicItem
  onSelect: (itemKey: string) => void
}) {
  const { t } = useTranslation(['stw-operations'])
  const typeIcon = item.filterType
    ? assets(schematicTypeIcons[item.filterType])
    : null

  return (
    <button
      type="button"
      className="flex w-full flex-col items-center gap-1 overflow-hidden rounded-md border-2 p-2 text-left hover:brightness-125 transition"
      style={{ ...rarityStyle(item.rarity), height: cardHeight }}
      onClick={() => onSelect(item.itemKey)}
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
        {typeIcon && item.filterType && (
          <img
            src={typeIcon}
            alt={t(`schematics.type.${item.filterType}`)}
            title={t(`schematics.type.${item.filterType}`)}
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
      {item.level !== null && (
        <span className="text-xs text-muted-foreground">
          {item.maxLevel !== null
            ? t('inventory.level-of', { level: item.level, max: item.maxLevel })
            : t('inventory.level-short', { level: item.level })}
        </span>
      )}
      <span className="w-full text-center text-xs leading-tight line-clamp-2">
        {item.name}
      </span>
    </button>
  )
})

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
