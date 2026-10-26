# Changelog

## 1.13.0 — 2026-10-26

Community release maintained by [Pixel](https://github.com/ImPixeluwu), based on
the 1.12.4 community release by [Xpert420](https://github.com/FIZZCD). Release
checks, downloads, and support now point to
[ImPixeluwu/Aerial-Launcher](https://github.com/ImPixeluwu/Aerial-Launcher).

### New: Inventory (STW Operations → Inventory)

- Read-only viewer for the campaign backpack, the Ventures backpack, and storage
  of the active account.
- In-game names and images, rarity, power level, tier stars, and quantities.
  Identical entries are grouped.
- Item details: stats at the item's level with perks applied, and perk rows
  styled like the game (tier bars, element icons). Legacy perks are mapped to
  current ones with the game's migration table. Arrows and the ← → keys move
  between items.
- Filters by category (ranged, melee, traps, materials) and type, rarity, and
  text search; sorting by power, level, name, rarity, or quantity.
- Supercharged items show their real level cap and power level (for example,
  LV 60 / 60 and PL 144) and highlighted stars.

### New: Schematics (STW Operations → Schematics)

- Read-only catalog of weapon and trap schematics from the campaign profile and
  the collection book, with a source filter.
- Filters by category and type, rarity, and text search; sorting by power,
  level, name, or rarity.
- Supercharged schematics show their level cap, power level, and highlighted
  stars.

### Improvements

- Inventory and Schematics stay responsive with thousands of items: only the
  visible cards are rendered.
- Both pages have a "Go to top" button.
- New pages are translated to English and Latin American Spanish; other
  languages fall back to English.

### Game data and credits

- Item names, images, perks, power level tables, and schematic data come from
  [PegLegFN/PegLegResources](https://github.com/PegLegFN/PegLegResources), and
  the legacy perk table and stat tables from
  [archeruwu/STW-Datatables](https://github.com/archeruwu/STW-Datatables), at
  pinned commits. Images load from GitHub and are not bundled. Both projects
  are credited on the Credits page.

Known limitations: damage does not include the account's F.O.R.T. bonus, crit
chance from Critical Rating is approximate, and item and perk names are shown in
English.

Validation: `npm test` (51 tests), lint, and packaging pass; the new pages were
checked with sample data and on a live account. The original repository's 410
TypeScript diagnostics are unchanged.

## 1.12.4 — 2026-09-12

First community release maintained by [Xpert420](https://github.com/FIZZCD),
based on [Ciensprog/Aerial-Launcher](https://github.com/Ciensprog/Aerial-Launcher)
version 1.12.3. This is a modified version, maintained independently of the
original project.

- Fixed alerts authentication: `/world/info` uses a saved account's user access
  token through the existing validation and renewal flow. At least one account
  must be added to the launcher.
- Marked Kick, Taxi Service, Kick All Party, Leave Party, and the related
  claim-after-leaving options as temporarily unavailable.
- Prevented saved Kick and Taxi settings from starting unavailable operations.
- Kept Claim, Transfer mats, and manual Claim Rewards available.
- Made disabled account selectors also disable their clear button.
- Pointed release checks, downloads, and support to the community fork.
- Retained the original author credits, license, history, and account data path.

Validation: lint, browser interaction checks with sample accounts, and mocked
authentication and background-operation checks pass. The original repository's
410 TypeScript diagnostics are not addressed by this maintenance release.
