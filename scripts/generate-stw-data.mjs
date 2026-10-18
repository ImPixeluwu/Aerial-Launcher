/**
 * Builds the compact Save the World item data used by the inventory viewer.
 *
 * Source: PegLegFN/PegLegResources (https://github.com/PegLegFN/PegLegResources)
 *
 * Usage:
 *   git clone --depth 1 -b major https://github.com/PegLegFN/PegLegResources <dir>
 *   node scripts/generate-stw-data.mjs <dir>
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const sourceDir = process.argv[2]

if (!sourceDir) {
  console.error(
    'Usage: node scripts/generate-stw-data.mjs <PegLegResources dir>',
  )
  process.exit(1)
}

const outputDir = path.join(import.meta.dirname, '..', 'src', 'data', 'stw')
const namedItemsDir = path.join(sourceDir, 'GameAssets', 'NamedItems')

const rarityCodes = {
  Common: 'c',
  Uncommon: 'uc',
  Rare: 'r',
  Epic: 'vr',
  Legendary: 'sr',
  Mythic: 'ur',
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'))
}

function round(value, digits = 4) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined
  }

  const factor = 10 ** digits

  return Math.round(value * factor) / factor
}

function imageFile(imagePath) {
  return typeof imagePath === 'string'
    ? imagePath.split(/[\\/]/).pop()
    : undefined
}

function compact(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined),
  )
}

const descriptions = []
const descriptionIndex = new Map()

function describe(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return undefined
  }

  if (!descriptionIndex.has(text)) {
    descriptionIndex.set(text, descriptions.length)
    descriptions.push(text)
  }

  return descriptionIndex.get(text)
}

function displayName(entry) {
  const tier = entry.DisplayTier

  return tier && tier !== 'Invalid' && tier !== 'None'
    ? `${tier} ${entry.DisplayName}`
    : entry.DisplayName
}

function meleeStats(entry) {
  const stats = entry.MeleeWeaponStats
  const swingPlaySpeed = entry.RawWeaponStats?.SwingPlaySpeed || 1

  return compact({
    damage: round(stats.Damage),
    impact: round(stats.ImpactDamage),
    critChance: round(stats.BaseCritChance),
    critDamage: round(stats.BaseCritDamage),
    attackTime: round(stats.SwingTime / swingPlaySpeed),
    durability: round(stats.Durability),
  })
}

function rangedStats(entry) {
  const stats = entry.RangedWeaponStats

  return compact({
    damage: round(stats.PointBlank?.Damage),
    impact: round(stats.PointBlank?.ImpactDamage),
    critChance: round(stats.BaseCritChance),
    critDamage: round(stats.BaseCritDamage),
    fireRate: round(stats.FiringRate),
    clipSize: round(stats.Reload?.ClipSize),
    reloadTime: round(stats.Reload?.ReloadTime),
    durability: round(stats.Durability),
  })
}

function trapStats(entry) {
  const stats = entry.TrapStats

  return compact({
    damage: round(stats.Damage),
    impact: round(stats.ImpactDamage) || undefined,
    critChance: round(stats.BaseCritChance),
    critDamage: round(stats.BaseCritDamage),
    fireDelay: round(stats.FireDelay),
    reloadTime: round(stats.ReloadTime),
    durability: round(stats.Durability),
  })
}

function itemRecord(entry, kind, stats) {
  return compact({
    n: displayName(entry),
    r: rarityCodes[entry.Rarity],
    t:
      typeof entry.Tier === 'number' && entry.Tier > 0 ? entry.Tier : undefined,
    k: kind,
    s: entry.SubType ?? undefined,
    d: describe(entry.Description),
    i: imageFile(entry.ImagePaths?.SmallPreview),
    l: imageFile(entry.ImagePaths?.LargePreview),
    b: stats,
  })
}

const items = {}

Object.entries(readJson(path.join(namedItemsDir, 'Weapon.json'))).forEach(
  ([templateId, entry]) => {
    if (entry.MeleeWeaponStats) {
      items[templateId.toLowerCase()] = itemRecord(
        entry,
        'melee',
        meleeStats(entry),
      )
    } else if (entry.RangedWeaponStats) {
      items[templateId.toLowerCase()] = itemRecord(
        entry,
        'ranged',
        rangedStats(entry),
      )
    }
  },
)

Object.entries(readJson(path.join(namedItemsDir, 'Trap.json'))).forEach(
  ([templateId, entry]) => {
    items[templateId.toLowerCase()] = itemRecord(
      entry,
      'trap',
      entry.TrapStats ? trapStats(entry) : undefined,
    )
  },
)

const simpleKinds = [
  ['Ingredient.json', 'ingredient'],
  ['WorldItem.json', 'material'],
]

simpleKinds.forEach(([file, kind]) => {
  Object.entries(readJson(path.join(namedItemsDir, file))).forEach(
    ([templateId, entry]) => {
      items[templateId.toLowerCase()] = itemRecord(entry, kind)
    },
  )
})

const alterations = Object.fromEntries(
  Object.entries(readJson(path.join(namedItemsDir, 'Alteration.json'))).map(
    ([alterationId, entry]) => [
      alterationId.toLowerCase(),
      compact({
        n: entry.DisplayName,
        r: rarityCodes[entry.Rarity],
      }),
    ],
  ),
)

const itemRatings = readJson(
  path.join(sourceDir, 'GameAssets', 'ItemRatings.json'),
).Default.Tiers

const commit = execFileSync('git', ['-C', sourceDir, 'rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim()
const commitDate = execFileSync(
  'git',
  ['-C', sourceDir, 'log', '-1', '--format=%cI'],
  { encoding: 'utf8' },
).trim()

mkdirSync(outputDir, { recursive: true })

writeFileSync(
  path.join(outputDir, 'items.json'),
  `${JSON.stringify({ descriptions, items })}\n`,
)
writeFileSync(
  path.join(outputDir, 'alterations.json'),
  `${JSON.stringify(alterations)}\n`,
)
writeFileSync(
  path.join(outputDir, 'item-ratings.json'),
  `${JSON.stringify(itemRatings)}\n`,
)
writeFileSync(
  path.join(outputDir, 'source.json'),
  `${JSON.stringify(
    {
      repository: 'https://github.com/PegLegFN/PegLegResources',
      commit,
      commitDate,
      imageBaseUrl: `https://raw.githubusercontent.com/PegLegFN/PegLegResources/${commit}/GameAssets/ExportedImages/`,
    },
    null,
    2,
  )}\n`,
)

console.log(
  `items: ${Object.keys(items).length}, alterations: ${Object.keys(alterations).length}, descriptions: ${descriptions.length}, commit: ${commit}`,
)
