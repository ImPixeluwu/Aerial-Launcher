import type { InventoryItem } from "../../../types/inventory";

import { createRoute } from "@tanstack/react-router";
import { UpdateIcon } from "@radix-ui/react-icons";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { raritiesColor } from "../../../config/constants/resources";

import { Route as RootRoute } from "../../__root";

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
import { ItemDetailDialog } from "../../../components/stw-items/item-detail-dialog";
import {
  ItemImage,
  PowerBadge,
  TierStars,
  formatQuantity,
  rarityStyle,
} from "../../../components/stw-items/item-parts";
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
  inventoryCategories,
  inventoryProfileIds,
  inventoryRarityOrder,
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

  const availableRarities = inventoryRarityOrder.filter(
    (rarity) => (overview?.rarityCounts[rarity] ?? 0) > 0,
  );

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
              <SelectItem key={id} value={id}>
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
          title={t("inventory.reload")}
        >
          <UpdateIcon className={cn({ "animate-spin": isLoading })} />
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
            <ToggleGroupItem key={category} value={category}>
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
            placeholder={t("inventory.search-placeholder")}
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
          {t("inventory.clear-filters")}
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {t("inventory.items-shown", { count: filteredItems.length })}
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
        <div
          className={cn(
            "grid gap-3 grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))]",
            { "opacity-60": isLoading },
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

function ItemCard({
  item,
  onSelect,
}: {
  item: InventoryItem;
  onSelect: () => void;
}) {
  const { t } = useTranslation(["stw-operations"]);

  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1 rounded-md border-2 p-2 text-left hover:brightness-125 transition"
      style={rarityStyle(item.rarity)}
      onClick={onSelect}
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
      {item.tier !== null && <TierStars tier={item.tier} />}
      <span className="w-full text-center text-xs leading-tight line-clamp-2">
        {item.name}
      </span>
    </button>
  );
}

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
          stars: item.tier !== null && <TierStars tier={item.tier} />,
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
