/**
 * Builds the compact Save the World item data used by the inventory viewer.
 *
 * Sources:
 * - PegLegFN/PegLegResources (https://github.com/PegLegFN/PegLegResources)
 * - archeruwu/STW-Datatables (https://github.com/archeruwu/STW-Datatables),
 *   for MigrationMapping.json: the game's own table that maps legacy perks
 *   to the current ones
 *
 * Usage:
 *   git clone --depth 1 -b major https://github.com/PegLegFN/PegLegResources <pegleg>
 *   git clone --depth 1 https://github.com/archeruwu/STW-Datatables <datatables>
 *   node scripts/generate-stw-data.mjs <pegleg> <datatables>
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const sourceDir = process.argv[2]
const datatablesDir = process.argv[3]

if (!sourceDir || !datatablesDir) {
  console.error(
    'Usage: node scripts/generate-stw-data.mjs <PegLegResources dir> <STW-Datatables dir>',
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

// Legacy perk id -> [current perk id, additional perk id?], all lower-case
const legacyAlterations = Object.fromEntries(
  Object.entries(
    readJson(path.join(datatablesDir, 'MigrationMapping.json'))[0].Rows,
  ).map(([legacyId, row]) => [
    legacyId.toLowerCase(),
    [row.NewAlteration, row.AdditionalAlteration]
      .filter(Boolean)
      .map((alterationId) => alterationId.toLowerCase()),
  ]),
)

Object.entries(legacyAlterations).forEach(([legacyId, targets]) => {
  targets.forEach((target) => {
    if (!alterations[target]) {
      throw new Error(`${legacyId} maps to unknown perk ${target}`)
    }
  })
})

function gitInfo(dir) {
  const git = (...args) =>
    execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).trim()

  return {
    commit: git('rev-parse', 'HEAD'),
    commitDate: git('log', '-1', '--format=%cI'),
  }
}

const { commit, commitDate } = gitInfo(sourceDir)

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
  path.join(outputDir, 'legacy-alterations.json'),
  `${JSON.stringify(legacyAlterations)}\n`,
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
      legacyAlterations: {
        repository: 'https://github.com/archeruwu/STW-Datatables',
        file: 'MigrationMapping.json',
        ...gitInfo(datatablesDir),
      },
    },
    null,
    2,
  )}\n`,
)

console.log(
  `items: ${Object.keys(items).length}, alterations: ${Object.keys(alterations).length}, legacy alterations: ${Object.keys(legacyAlterations).length}, descriptions: ${descriptions.length}, commit: ${commit}`,
)
