import type {
  InventoryCategory,
  InventoryFilterType,
  InventoryItem,
  InventoryOverview,
  InventoryProfileId,
} from '../../types/inventory'
import type { MCPQueryProfileStorageItem } from '../../types/services/mcp'

import {
  RarityType,
  ingredientsJson,
  rarities,
  resourcesJson,
  trapsJson,
} from '../../config/constants/resources'

import {
  inventoryCategories,
  inventoryHiddenTemplateIds,
  inventoryRarityOrder,
} from '../../config/constants/inventory'

import {
  calculateStwPowerLevel,
  calculateStwStats,
  findStwAlteration,
  findStwItem,
  stwMaxLevel,
} from './stw-items'

const categoryByPrefix: Record<string, InventoryCategory> = {
  // Melee weapons are moved to their own category once the type is known
  weapon: 'ranged',
  trap: 'traps',
  ingredient: 'ingredients',
  worlditem: 'materials',
}

const rarityTokens: Record<string, RarityType> = {
  c: RarityType.Common,
  uc: RarityType.Uncommon,
  r: RarityType.Rare,
  vr: RarityType.Epic,
  sr: RarityType.Legendary,
  ur: RarityType.Mythic,
  er: RarityType.Mythic,
}

const weaponTypePatterns: Array<[RegExp, InventoryFilterType]> = [
  [/smg/, 'smg'],
  [/^wid_assault_/, 'assault'],
  [/^wid_pistol_/, 'pistol'],
  [/^wid_shotgun_/, 'shotgun'],
  [/^wid_sniper_/, 'sniper'],
  [/^wid_(launcher|explosive)_/, 'explosive'],
  [/^wid_edged_sword/, 'melee_sword'],
  [/^wid_edged_axe/, 'melee_axe'],
  [/^wid_edged_scythe/, 'melee_scythe'],
  [/^wid_piercing_spear/, 'melee_spear'],
  [/^wid_blunt_hammer/, 'melee_hammer'],
  [/^wid_blunt_/, 'melee_bat'],
]

const trapTypePatterns: Array<[RegExp, InventoryFilterType]> = [
  [/^tid_floor_/, 'trap_floor'],
  [/^tid_wall_/, 'trap_wall'],
  [/^tid_ceiling_/, 'trap_ceiling'],
]

const meleeFilterTypes: Array<InventoryFilterType> = [
  'melee_sword',
  'melee_axe',
  'melee_scythe',
  'melee_spear',
  'melee_hammer',
  'melee_bat',
]

/**
 * Splits "Weapon:wid_sniper_boltaction_sr_ore_t05" into its category
 * and the lower-case id after the colon.
 */
export function splitTemplateId(templateId: string) {
  const [prefix, ...rest] = templateId.split(':')
  const id = (rest.length > 0 ? rest.join(':') : prefix).toLowerCase()
  const category =
    rest.length > 0 ? categoryByPrefix[prefix.toLowerCase()] ?? null : null

  return { category, id }
}

export function parseInventoryRarity(id: string) {
  const tokens = id.split('_')

  for (let index = tokens.length - 1; index >= 0; index--) {
    const rarity = rarityTokens[tokens[index]]

    if (rarity) {
      return rarity
    }
  }

  return null
}

export function parseInventoryTier(id: string) {
  const match = id.match(/_t0?([1-9])(?:_|$)/)

  return match ? Number(match[1]) : null
}

export function parseInventoryMaterial(id: string) {
  const tokens = id.split('_')

  if (tokens.includes('crystal')) {
    return 'crystal' as const
  }

  if (tokens.includes('ore')) {
    return 'ore' as const
  }

  return null
}

export function parseInventoryFilterType(
  category: InventoryCategory,
  id: string,
) {
  const patterns =
    category === 'ranged' || category === 'melee'
      ? weaponTypePatterns
      : category === 'traps'
        ? trapTypePatterns
        : []

  return patterns.find(([pattern]) => pattern.test(id))?.[1] ?? null
}

/**
 * Picks the longest data key contained in the id, so "floor_spikes_wood"
 * wins over "floor_spikes".
 */
function findLongestKey<Data>(id: string, data: Record<string, Data>) {
  return (
    Object.keys(data)
      .filter((key) => id.includes(key))
      .toSorted((keyA, keyB) => keyB.length - keyA.length)[0] ?? null
  )
}

function humanizeWeaponId(id: string) {
  const ignored = new Set([
    'wid',
    'ore',
    'crystal',
    ...Object.keys(rarityTokens),
  ])
  const words = id
    .split('_')
    .filter((token) => !ignored.has(token) && !/^t0?[1-9]$/.test(token))
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))

  return words.join(' ') || id
}

function iconRarity(rarity: RarityType | null) {
  if (!rarity) {
    return RarityType.Common
  }

  // Aerial ships the mythic vouchers with the "er" suffix
  return rarity === RarityType.Mythic ? 'er' : rarity
}

export function describeInventoryItem(
  category: InventoryCategory,
  id: string,
  rarity: RarityType | null,
  filterType: InventoryFilterType | null,
) {
  const rarityPrefix = rarity ? `${rarities[rarity]} ` : ''

  if (category === 'traps') {
    const trapKey = findLongestKey(id, trapsJson)

    if (trapKey) {
      return {
        name: `${rarityPrefix}${trapsJson[trapKey].name}`,
        iconKey: trapKey,
      }
    }

    return {
      name: `${rarityPrefix}${humanizeWeaponId(id.replace(/^tid_/, ''))}`,
      iconKey: `voucher_generic_trap_${iconRarity(rarity)}`,
    }
  }

  if (category === 'ingredients') {
    const ingredientKey = findLongestKey(id, ingredientsJson)

    return {
      name: ingredientKey
        ? ingredientsJson[ingredientKey].name
        : humanizeWeaponId(id.replace(/^ingredient_/, '')),
      iconKey: ingredientKey ?? 'question',
    }
  }

  if (category === 'materials') {
    const resource = resourcesJson[id]

    return {
      name: resource?.name ?? humanizeWeaponId(id),
      iconKey: resource ? id : 'question',
    }
  }

  const isMelee = filterType !== null && meleeFilterTypes.includes(filterType)

  return {
    name: `${rarityPrefix}${humanizeWeaponId(id)}`,
    iconKey: `voucher_generic_${isMelee ? 'melee' : 'ranged'}_${iconRarity(rarity)}`,
  }
}

/**
 * Perk ids usually come in attributes.alterations; some profiles use
 * attributes.alterationDefinitions instead.
 */
export function readAlterationIds(
  attributes: MCPQueryProfileStorageItem['attributes'] | undefined,
) {
  const source = [attributes?.alterations, attributes?.alterationDefinitions]
    .filter(Array.isArray)
    .find((list: Array<unknown>) =>
      list.some((value) => typeof value === 'string' && value.length > 0),
    ) as Array<unknown> | undefined

  return (source ?? []).filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  )
}

const hiddenPropertyKeys = new Set(['level', 'max_level_bonus'])

/**
 * Raw profile attributes, shown as-is in the detail dialog.
 */
function readProperties(
  attributes: MCPQueryProfileStorageItem['attributes'] | undefined,
) {
  return Object.entries(attributes ?? {})
    .filter(([key]) => !hiddenPropertyKeys.has(key))
    .map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    }))
    .toSorted((propertyA, propertyB) =>
      propertyA.key.localeCompare(propertyB.key),
    )
}

export function createEmptyInventoryOverview(
  profileId: InventoryProfileId,
): InventoryOverview {
  return {
    success: true,
    profileId,
    items: [],
    categoryCounts: {
      ranged: 0,
      melee: 0,
      traps: 0,
      ingredients: 0,
      materials: 0,
    },
    rarityCounts: {},
  }
}

export function parseInventoryProfile(
  profileId: InventoryProfileId,
  profileItems: Record<string, MCPQueryProfileStorageItem>,
): InventoryOverview {
  const overview = createEmptyInventoryOverview(profileId)
  const groups = new Map<string, InventoryItem>()

  Object.values(profileItems).forEach((profileItem) => {
    if (
      typeof profileItem?.templateId !== 'string' ||
      inventoryHiddenTemplateIds.has(profileItem.templateId.toLowerCase())
    ) {
      return
    }

    const { category: templateCategory, id } = splitTemplateId(
      profileItem.templateId,
    )

    if (!templateCategory) {
      return
    }

    const level =
      typeof profileItem.attributes?.level === 'number'
        ? profileItem.attributes.level
        : null
    const alterationIds = readAlterationIds(profileItem.attributes)
    const maxLevelBonus =
      typeof profileItem.attributes?.max_level_bonus === 'number'
        ? profileItem.attributes.max_level_bonus
        : 0
    const quantity =
      typeof profileItem.quantity === 'number' ? profileItem.quantity : 1
    const itemKey = [
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

    const gameItem = findStwItem(profileItem.templateId)
    const alterations = alterationIds.map(findStwAlteration)
    const rarity = gameItem?.rarity ?? parseInventoryRarity(id)
    const tier = gameItem?.tier ?? parseInventoryTier(id)
    const filterType =
      gameItem?.filterType ?? parseInventoryFilterType(templateCategory, id)
    const category =
      templateCategory === 'ranged' &&
      filterType !== null &&
      meleeFilterTypes.includes(filterType)
        ? 'melee'
        : templateCategory
    const fallback = describeInventoryItem(category, id, rarity, filterType)
    const hasPowerLevel = category !== 'ingredients' && category !== 'materials'

    groups.set(itemKey, {
      itemKey,
      templateId: profileItem.templateId,
      name: gameItem?.name ?? fallback.name,
      description: gameItem?.description ?? null,
      category,
      subType: gameItem?.subType ?? null,
      filterType,
      rarity,
      tier,
      material: parseInventoryMaterial(id),
      level,
      maxLevel: hasPowerLevel && tier ? stwMaxLevel(tier, maxLevelBonus) : null,
      powerLevel: hasPowerLevel
        ? calculateStwPowerLevel({ level, maxLevelBonus, rarity, tier })
        : null,
      quantity,
      stacks: 1,
      alterations,
      baseStats: gameItem?.baseStats ?? null,
      stats: calculateStwStats({
        alterations,
        baseStats: gameItem?.baseStats ?? null,
        level,
        scaling: gameItem?.scaling ?? null,
      }),
      properties: readProperties(profileItem.attributes),
      iconKey: fallback.iconKey,
      imageUrl: gameItem?.imageUrl ?? null,
    })
  })

  overview.items = [...groups.values()].toSorted((itemA, itemB) => {
    const categoryDiff =
      inventoryCategories.indexOf(itemA.category) -
      inventoryCategories.indexOf(itemB.category)

    if (categoryDiff !== 0) {
      return categoryDiff
    }

    const rarityDiff =
      (itemA.rarity ? inventoryRarityOrder.indexOf(itemA.rarity) : 99) -
      (itemB.rarity ? inventoryRarityOrder.indexOf(itemB.rarity) : 99)

    if (rarityDiff !== 0) {
      return rarityDiff
    }

    return itemA.name.localeCompare(itemB.name)
  })

  overview.items.forEach((item) => {
    overview.categoryCounts[item.category] += 1

    if (item.rarity) {
      overview.rarityCounts[item.rarity] =
        (overview.rarityCounts[item.rarity] ?? 0) + 1
    }
  })

  return overview
}
