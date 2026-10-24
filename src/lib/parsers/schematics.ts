import type { InventoryFilterType } from '../../types/inventory'
import type {
  SchematicCategory,
  SchematicGroup,
  SchematicItem,
  SchematicSource,
  SchematicsOverview,
} from '../../types/schematics'
import type { MCPQueryProfileStorageItem } from '../../types/services/mcp'

import { RarityType } from '../../config/constants/resources'

import {
  schematicDefaultSortDirections,
  schematicDefaultSortField,
} from '../../config/constants/schematics'

import {
  describeInventoryItem,
  parseInventoryFilterType,
  parseInventoryMaterial,
  parseInventoryRarity,
  parseInventoryTier,
  readAlterationIds,
} from './inventory'
import {
  createEmptySchematicsOverview,
  sortSchematics,
} from './schematics-list'
import {
  calculateStwPowerLevel,
  calculateStwStats,
  findStwAlteration,
  findStwItem,
  resolveStwSchematic,
  stwLevelBonus,
  stwMaxLevel,
} from './stw-items'

type ProfileItems = Record<string, MCPQueryProfileStorageItem>

// Used to tell traps from weapons when the schematic is not in the game data
const trapIdPattern =
  /_floor_|_wall_|_ceiling_|_launch_|_campfire|_pad_|_lights_|_trap/

const rarityNames: Record<string, RarityType> = {
  common: RarityType.Common,
  uncommon: RarityType.Uncommon,
  rare: RarityType.Rare,
  epic: RarityType.Epic,
  legendary: RarityType.Legendary,
  mythic: RarityType.Mythic,
}

export function schematicGroup(
  category: SchematicCategory,
  filterType: InventoryFilterType | null,
): SchematicGroup {
  if (category === 'trap') {
    return 'traps'
  }

  return filterType?.startsWith('melee_') ? 'melee' : 'ranged'
}

/**
 * Each supercharge raises the level cap by 2, from 50 up to 60.
 */
export function schematicSuperchargeLevel(level: number | null) {
  return level !== null && level > 50
    ? Math.min(Math.floor((level - 50) / 2), 5)
    : 0
}

function tierFromLevel(level: number | null) {
  if (level === null) {
    return null
  }

  return level <= 10
    ? 1
    : level <= 20
      ? 2
      : level <= 30
        ? 3
        : level <= 40
          ? 4
          : 5
}

/**
 * attributes.starting_rarity, either a rarity code or a rarity name.
 */
function parseStartingRarity(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const token = value.toLowerCase().split('::').pop() ?? ''

  return rarityNames[token] ?? parseInventoryRarity(token)
}

function createSchematicItem(
  source: SchematicSource,
  itemKey: string,
  profileItem: MCPQueryProfileStorageItem,
  alterationIds: Array<string>,
  level: number | null,
  quantity: number,
): SchematicItem | null {
  const schematicId = (profileItem.templateId.split(':')[1] ?? '').toLowerCase()
  const itemTemplateId = resolveStwSchematic(profileItem.templateId)

  // Ammo and ingredient schematics are not weapons or traps
  if (!itemTemplateId && !schematicId.startsWith('sid_')) {
    return null
  }

  const gameItem = itemTemplateId ? findStwItem(itemTemplateId) : null
  const category: SchematicCategory = gameItem
    ? gameItem.kind === 'trap'
      ? 'trap'
      : 'weapon'
    : trapIdPattern.test(schematicId)
      ? 'trap'
      : 'weapon'
  const id =
    itemTemplateId?.split(':')[1] ??
    schematicId.replace(/^sid_/, category === 'trap' ? 'tid_' : 'wid_')
  const inventoryCategory = category === 'trap' ? 'traps' : 'ranged'
  const attributes = profileItem.attributes as
    | (MCPQueryProfileStorageItem['attributes'] & { starting_rarity?: unknown })
    | undefined
  const maxLevelBonus =
    typeof attributes?.max_level_bonus === 'number'
      ? attributes.max_level_bonus
      : 0

  const rarity =
    gameItem?.rarity ??
    parseStartingRarity(attributes?.starting_rarity) ??
    parseInventoryRarity(id)
  const tier = gameItem?.tier ?? parseInventoryTier(id) ?? tierFromLevel(level)
  const filterType =
    gameItem?.filterType ?? parseInventoryFilterType(inventoryCategory, id)
  const fallback = describeInventoryItem(
    inventoryCategory,
    id,
    rarity,
    filterType,
  )
  const levelBonus = stwLevelBonus({ level, maxLevelBonus, tier })
  const alterations = alterationIds.map(findStwAlteration)
  // Aerial ships the mythic vouchers with the "er" suffix
  const iconRarity =
    rarity === RarityType.Mythic ? 'er' : rarity ?? RarityType.Common

  return {
    itemKey,
    templateId: profileItem.templateId,
    itemTemplateId,
    source,
    name: gameItem?.name ?? fallback.name,
    description: gameItem?.description ?? null,
    category,
    subType: gameItem?.subType ?? null,
    filterType,
    group: schematicGroup(category, filterType),
    rarity,
    tier,
    material: parseInventoryMaterial(id),
    level,
    maxLevel: tier ? stwMaxLevel(tier, levelBonus) : null,
    superchargeLevel: schematicSuperchargeLevel(level),
    powerLevel: calculateStwPowerLevel({
      level,
      maxLevelBonus: levelBonus,
      rarity,
      tier,
    }),
    quantity,
    stacks: 1,
    alterations,
    stats: calculateStwStats({
      alterations,
      baseStats: gameItem?.baseStats ?? null,
      level,
      scaling: gameItem?.scaling ?? null,
    }),
    iconKey: `voucher_generic_schematic_${iconRarity}`,
    imageUrl: gameItem?.imageUrl ?? null,
  }
}

export function parseSchematicsProfiles({
  campaign,
  collectionBook,
}: {
  campaign: ProfileItems
  collectionBook: ProfileItems | null
}): SchematicsOverview {
  const overview = createEmptySchematicsOverview()
  const groups = new Map<string, SchematicItem>()
  const sources: Array<[SchematicSource, ProfileItems | null]> = [
    ['campaign', campaign],
    ['collection-book', collectionBook],
  ]

  sources.forEach(([source, profileItems]) => {
    Object.values(profileItems ?? {}).forEach((profileItem) => {
      if (
        typeof profileItem?.templateId !== 'string' ||
        !/^schematic:/i.test(profileItem.templateId)
      ) {
        return
      }

      const level =
        typeof profileItem.attributes?.level === 'number'
          ? profileItem.attributes.level
          : null
      const alterationIds = readAlterationIds(profileItem.attributes)
      const quantity =
        typeof profileItem.quantity === 'number' ? profileItem.quantity : 1
      const itemKey = [
        source,
        profileItem.templateId.toLowerCase(),
        level ?? '',
        alterationIds.join(','),
      ].join('|')
      const current = groups.get(itemKey)

      if (current) {
        current.quantity += quantity
        current.stacks += 1

        return
      }

      const item = createSchematicItem(
        source,
        itemKey,
        profileItem,
        alterationIds,
        level,
        quantity,
      )

      if (item) {
        groups.set(itemKey, item)
      }
    })
  })

  overview.items = sortSchematics(
    [...groups.values()],
    schematicDefaultSortField,
    schematicDefaultSortDirections[schematicDefaultSortField],
  )

  overview.items.forEach((item) => {
    overview.sourceCounts[item.source] += 1

    overview.groupCounts[item.group] += 1

    if (item.filterType) {
      overview.typeCounts[item.filterType] =
        (overview.typeCounts[item.filterType] ?? 0) + 1
    }

    if (item.rarity) {
      overview.rarityCounts[item.rarity] =
        (overview.rarityCounts[item.rarity] ?? 0) + 1
    }
  })

  return overview
}
