import type { InventoryItem } from "../../../types/inventory";

import { memo } from "react";

import { createRoute } from "@tanstack/react-router";
import { UpdateIcon } from "@radix-ui/react-icons";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Search,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { raritiesColor } from "../../../config/constants/resources";

import { Route as RootRoute } from "../../__root";

import { GoToTop } from "../../../components/go-to-top";
import { HomeBreadcrumb } from "../../../components/navigations/breadcrumb/home";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../components/ui/breadcrumb";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  FilterCount,
  FilterLabel,
} from "../../../components/stw-items/filter-parts";
import { ItemDetailDialog } from "../../../components/stw-items/item-detail-dialog";
import {
  ItemImage,
  ItemStars,
  PowerBadge,
  formatQuantity,
  rarityStyle,
} from "../../../components/stw-items/item-parts";
import { VirtualItemGrid } from "../../../components/stw-items/virtual-item-grid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../../components/ui/toggle-group";

import { useInventoryData } from "./-hooks";

import {
  inventoryGroups,
  inventoryProfileIds,
  inventoryRarityOrder,
  inventorySortFields,
  inventoryTypesByGroup,
} from "../../../config/constants/inventory";
import { cn } from "../../../lib/utils";

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/stw-operations/inventory",
  component: () => {
    const { t } = useTranslation(["sidebar"]);

    return (
      <>
        <Breadcrumb>
          <BreadcrumbList>
            <HomeBreadcrumb />
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("stw-operations.title")}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {t("stw-operations.options.inventory")}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Content />
      </>
    );
  },
});

function Content() {
  const { t } = useTranslation(["stw-operations"]);

  const {
    counts,
    filteredItems,
    groups,
    hasActiveFilters,
    isFiltering,
    isLoading,
    overview,
    profileId,
    rarities,
    searchValue,
    selected,
    selectedItem,
    sortDirection,
    sortField,
    types,

    loadOverview,
    resetFilters,
    setGroups,
    setProfileId,
    setRarities,
    setSearchValue,
    setSelectedItemKey,
    setSortField,
    setTypes,
    toggleSortDirection,
  } = useInventoryData();

  if (!selected) {
    return (
      <div className="flex flex-grow items-center justify-center text-muted-foreground">
        {t("inventory.no-account")}
      </div>
    );
  }

  const selectedIndex = selectedItem
    ? filteredItems.findIndex((item) => item.itemKey === selectedItem.itemKey)
    : -1;
  const selectItemAt = (index: number) => {
    const next = filteredItems[index];

    if (next) {
      setSelectedItemKey(next.itemKey);
    }
  };

  const availableTypes = groups
    .flatMap((group) => inventoryTypesByGroup[group])
    .filter((type) => (counts.typeCounts[type] ?? 0) > 0);
  const sortDirectionLabel = t(`inventory.sort.${sortDirection}`);
  const availableRarities = inventoryRarityOrder.filter(
    (rarity) => (overview?.rarityCounts[rarity] ?? 0) > 0,
  );

  return (
    <div className="flex flex-col flex-grow gap-4">
      <div id="inventory-toolbar" className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={t("inventory.search-placeholder")}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            spellCheck={false}
          />
        </div>
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
                <SelectItem key={id} value={id}>
                  {t(`inventory.profile.${id}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sortField}
            onValueChange={(value) => setSortField(value as typeof sortField)}
          >
            <SelectTrigger
              className="w-40"
              aria-label={t("inventory.sort.label")}
              title={t("inventory.sort.label")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {inventorySortFields.map((field) => (
                <SelectItem key={field} value={field}>
                  {t(`inventory.sort.${field}`)}
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
            {sortDirection === "desc" ? (
              <ArrowDownWideNarrow className="size-4" />
            ) : (
              <ArrowUpNarrowWide className="size-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={loadOverview}
            disabled={isLoading}
            title={t("inventory.reload")}
          >
            <UpdateIcon className={cn({ "animate-spin": isLoading })} />
          </Button>
        </div>
      </div>

      {/* One row per filter, so a wider counter only wraps its own row */}
      <div className="grid grid-cols-[auto,1fr] items-center gap-x-3 gap-y-2">
        <FilterLabel>{t("inventory.filter.category")}</FilterLabel>
        <ToggleGroup
          type="multiple"
          variant="outline"
          className="flex-wrap justify-start"
          value={groups}
          onValueChange={(value) => setGroups(value as typeof groups)}
        >
          {inventoryGroups.map((group) => (
            <ToggleGroupItem key={group} value={group}>
              {t(`inventory.group.${group}`)}
              <FilterCount value={counts.groupCounts[group]} />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {availableTypes.length > 0 && (
          <ToggleGroup
            type="multiple"
            variant="outline"
            className="col-start-2 flex-wrap justify-start"
            value={types}
            onValueChange={(value) => setTypes(value as typeof types)}
          >
            {availableTypes.map((type) => (
              <ToggleGroupItem key={type} value={type}>
                {t(`inventory.type.${type}`)}
                <FilterCount value={counts.typeCounts[type]} />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}

        {availableRarities.length > 0 && (
          <>
            <FilterLabel>{t("inventory.filter.rarity")}</FilterLabel>
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
          {t("inventory.items-shown", { count: filteredItems.length })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
        >
          <X className="size-4 mr-1" />
          {t("inventory.clear-filters")}
        </Button>
      </div>

      {overview && !overview.success ? (
        <div className="border-l-4 border-red-400 ml-2 pl-2 text-red-400">
          {t("inventory.load-failed")}: {overview.error}
        </div>
      ) : isLoading && !overview ? (
        <div className="flex flex-grow items-center justify-center">
          <UpdateIcon className="animate-spin size-6" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col flex-grow items-center justify-center text-muted-foreground">
          <p>{t("inventory.no-matches")}</p>
        </div>
      ) : (
        <VirtualItemGrid
          cardHeight={cardHeight}
          items={filteredItems}
          isStale={isLoading || isFiltering}
          selectedIndex={selectedIndex}
          getKey={(item) => item.itemKey}
          renderItem={(item) => (
            <ItemCard item={item} onSelect={setSelectedItemKey} />
          )}
        />
      )}

      <GoToTop containerId="inventory-toolbar" />

      <ItemDetail
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
  );
}

// Fixed card height: every row of the virtual grid has the same size
const cardHeight = 136;

const ItemCard = memo(function ItemCard({
  item,
  onSelect,
}: {
  item: InventoryItem;
  onSelect: (itemKey: string) => void;
}) {
  const { t } = useTranslation(["stw-operations"]);

  return (
    <button
      type="button"
      className="flex w-full flex-col items-center gap-1 overflow-hidden rounded-md border-2 p-2 text-left hover:brightness-125 transition"
      style={{ ...rarityStyle(item.rarity), height: cardHeight }}
      onClick={() => onSelect(item.itemKey)}
      title={t("inventory.view-details")}
    >
      <div className="relative w-full">
        <ItemImage
          iconKey={item.iconKey}
          imageUrl={item.imageUrl}
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
      {item.tier !== null && (
        <ItemStars tier={item.tier} superchargeLevel={item.superchargeLevel} />
      )}
      <span className="w-full text-center text-xs leading-tight line-clamp-2">
        {item.name}
      </span>
    </button>
  );
});

function ItemDetail({
  item,
  position,
  onClose,
  onNext,
  onPrevious,
}: {
  item: InventoryItem | null;
  position: { index: number; total: number } | null;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const { t } = useTranslation(["stw-operations"]);

  return (
    <ItemDetailDialog
      detail={
        item && {
          key: item.itemKey,
          name: item.name,
          iconKey: item.iconKey,
          imageUrl: item.imageUrl,
          rarity: item.rarity,
          labels: [
            item.rarity ? t(`inventory.rarity.${item.rarity}`) : null,
            t(`inventory.category.${item.category}`),
            item.subType,
          ].filter((label): label is string => Boolean(label)),
          powerLevel: item.powerLevel,
          stars: item.tier !== null && (
            <ItemStars
              tier={item.tier}
              superchargeLevel={item.superchargeLevel}
            />
          ),
          levelText:
            item.level === null
              ? null
              : item.maxLevel !== null
                ? t("inventory.level-of", {
                    level: item.level,
                    max: item.maxLevel,
                  })
                : t("inventory.level-short", { level: item.level }),
          level: item.level,
          stats: item.stats,
          alterations: item.alterations,
          showNoPerks: item.category === "ranged" || item.category === "melee",
          description: item.description,
          rows: [
            [t("inventory.prop.quantity"), item.quantity.toLocaleString()],
            [t("inventory.prop.stacks"), String(item.stacks)],
            ...(item.superchargeLevel > 0
              ? [
                  [
                    t("inventory.prop.supercharge"),
                    t("inventory.supercharged", {
                      count: item.superchargeLevel,
                    }),
                  ] as [string, string],
                ]
              : []),
            [
              t("inventory.prop.material"),
              item.material ? t(`inventory.material.${item.material}`) : "—",
            ],
            [t("inventory.prop.template"), item.templateId],
          ],
        }
      }
      position={position}
      onClose={onClose}
      onNext={onNext}
      onPrevious={onPrevious}
    />
  );
}
