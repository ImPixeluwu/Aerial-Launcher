# NOTAS: Catálogo de esquemas

Este documento es materia prima para el SPEC; no es el SPEC. Lee antes
`docs/features/README.md`.

**Origen:** lectura estática de la interfaz de GLOW 5.0.4. [CONFIRMADO] = visto
en su JavaScript; [INFERIDO] = deducido, normalmente lado Rust.

**Secciones de GLOW consultadas:**

- `src/renderer/pages/schematics.ts` y `pages/stwProfile.ts`.
- `src/shared/stwCatalogPaths.ts`, `stwCollectionCardMeta.ts`,
  `stwCollectionSort.ts` y `stwCardStars.ts`.
- `src/renderer/utils/stwCollectionSortUi.ts`, `stwGameCardRender.ts`,
  `stwItemUpgradeLogic.ts`, `stwItemUpgradePanel.ts`, `stwOverviewSession.ts`
  y `stwPowerLevel.ts`.
- `i18n/pages/schematics.json`.

## 1. Qué muestra y de dónde salen los datos

- Muestra una cuadrícula de cartas con los esquemas de armas y trampas de la
  cuenta. [CONFIRMADO]
- El subtítulo dice "Unslotted weapon and trap schematics from your campaign
  profile". Es decir:
  - Perfil `campaign`, objetos `Schematic:`. [INFERIDO]
  - Excluye los registrados en el libro de colección. [INFERIDO]
- También aparece como pestaña de una página "STW Profile", con las pestañas
  inventory, schematics, heroes, survivors y defenders. Cuando va incrustada
  oculta su cabecera. [CONFIRMADO]
- Datos:
  - Llamada: `schematics:get-overview(language)`.
  - Respuesta: `{ success, error?, items[], typeCounts{}, rarityCounts{} }`.
    [CONFIRMADO]
- Campos que usa la interfaz [CONFIRMADO]:
  - `itemKey`: el itemId; cambia tras una mejora.
  - `templateId` y `name` (localizado).
  - `icon`, `stwRarity`, `powerLevel` y `gameLevel` (`attributes.level`).
  - `quantity`, `starTier`, `filterType` y `category` (`weapon` o `trap`).
  - `alterations[]`, cada una `{ templateId, name, levelIcon }`.
- Nombres de perks siempre en inglés; la página muestra un aviso para
  indicarlo. [CONFIRMADO]
- No hay favorito, `item_seen`, reciclar ni bloquear. Solo subir nivel y
  evolucionar rareza (§3). [CONFIRMADO]
- Caché de sesión [CONFIRMADO]:
  - Clave `página:idioma`, con 120 s de vida.
  - Con caché válida, la página no llama a Epic.

## 2. Filtros, orden y cartas

**Tipo** (multiselección, OR entre opciones) [CONFIRMADO]

- Orden: assault, pistol, sniper, shotgun, smg, explosive, melee, trap,
  trap_floor, trap_wall, trap_ceiling.
- `melee` agrupa todos los `melee_*`, y `trap` agrupa las tres trampas.
- Se ocultan las opciones sin objetos.

**Rareza** (multiselección) [CONFIRMADO]

- Orden: mítico, legendario, épico, raro, poco común, común.
- Mítico = `ur` o `er`.
- Solo aparecen las rarezas que tienen algún objeto.

**Combinación y búsqueda** [CONFIRMADO]

- Tipo y rareza se combinan con AND.
- Búsqueda: subcadena sin distinguir mayúsculas sobre `name + templateId`,
  con 280 ms de espera.
- Cada filtro tiene su "Limpiar", y hay un "Limpiar filtros" general que no
  borra el orden.

**Orden** [CONFIRMADO]

Claves: `power-desc` (por defecto), `power-asc`, `level-desc`, `level-asc`,
`name-asc`, `name-desc`, `rarity-desc` y `rarity-asc`.

- Rango de rareza: c1 < uc2 < r3 < vr4 < sr5 < er6 < ur7.
- Desempates:
  - power: rareza ↓ → nivel ↓ → nombre.
  - level: rareza ↓ → power ↓ → nombre.
  - rarity: power ↓ → nivel ↓ → nombre.
  - name: `localeCompare` con sensibilidad base.

**Lista** [CONFIRMADO]

- "{count} esquemas mostrados", sin agrupar.
- Cuadrícula virtualizada.

**Carta** [CONFIRMADO]

- Color según la rareza.
- Insignia PL si es mayor que 0.
- Cantidad si es mayor que 1, abreviada como `k`/`M`, como en el inventario.
- Insignia del tipo.
- Barra de XP: `((nivel−1) % 10 + 1) × 10 %`, con un mínimo de 8 %.
- 5 estrellas:
  - Tier de evolución = `starTier`, limitado a 1–5.
  - Por encima del nivel 50, `min(floor((nivel−50)/2), 5, tier)` estrellas se
    pintan como "supercargadas".

**Detalle** (modal; se cierra con Escape o con clic fuera) [CONFIRMADO]

- Icono y PL.
- Tipo, subtipo y rareza.
- Categoría, subtipo, rareza, cantidad, PL, nivel y templateId.
- Perks, con icono de tier.
- Panel de mejora (§3).

## 3. Mejoras (escriben en el perfil)

Todas las operaciones son MCP sobre `campaign`. [CONFIRMADO]

**Cuenta**

- GLOW usa la cuenta marcada como principal, que **puede no ser la que se
  está viendo**.
- Para Aerial, usar la cuenta activa. [DECISIÓN pendiente]

**Saldos**

- Al abrir el detalle se hace `QueryProfile campaign`.
- XP = suma de `AccountResource:schematicxp`.
- Flux = `AccountResource:reagent_evolverarity_r` o `_vr`.

**Subir nivel**

1. Se elige el nivel objetivo, hasta el máximo por rareza: c 20, uc 30, r 40,
   vr/sr/ur/er 50.
2. En un bucle de hasta 14 pasos:
   - `UpgradeItemBulk { targetItemId, desiredLevel, desiredTier }` hasta el
     tope del tier (T1 = 10 … T5 = 50, T6 = 60).
   - Luego `ConvertItem { targetItemId, conversionIndex }` para pasar al
     siguiente tier.
3. `desiredTier`:
   - `"no_tier"` en trampas o con tier ≤ 1.
   - En otro caso, número romano en minúscula (`ii`…`vi`).
4. Arma legendaria que cruza el nivel 30: se pide al usuario obsidiana (0) o
   fragmento de sombra (1) y se envía como `conversionRecipeIndexChoice`.

**Evolucionar rareza**

- `UpgradeItemRarity { targetItemId }`, solo de r a vr y de vr a sr.

**Tras cada operación**

- Se localiza el objeto nuevo en `profileChanges`, o con un `QueryProfile`.
- El emparejamiento se hace por la "clave de evolución": el templateId sin
  `_t0N` ni sufijo de material. Sufijos: ore, crystal, obsidian, shadowshard,
  sunbeam, brightcore, malachite, silver, copper.
- Al cerrar, la caché se invalida y se recarga.

**Errores**

- `errorMessage` o `errorCode`.
- Los patrones not_enough, insufficient, item_consumption_failed y
  upgrade_not_allowed se muestran como "recursos insuficientes".

**Recomendación:** hacer primero el catálogo de solo lectura y dejar las
mejoras para una segunda fase, porque modifican la cuenta. Esto se pregunta al
usuario.

## 4. Datos y parseo

**Tier** [CONFIRMADO]

- `_t0(\d)` en el templateId, de 1 a 6.
- Si no aparece, sale del nivel: ≤10 → 1, ≤20 → 2, ≤30 → 3, ≤40 → 4, resto 5.

**Trampa** [CONFIRMADO]

- El templateId contiene `_floor_`, `_wall_`, `_ceiling_`, `_launch_`,
  `_campfire`, `_pad_`, `_lights_` o `_trap`.

**Rareza**

- `attributes.starting_rarity` [CONFIRMADO]; si falta, el token del
  templateId [INFERIDO].

**Iconos**

- GLOW los sirve desde sus propios assets, con nombre
  `SID_<Familia>_<Rareza>_<Material>_T0N`, o `TID_` para trampas.
- **No reutilizarlos.**
- En Aerial: la imagen de PegLeg del arma o trampa equivalente (§5).

**PL**

- Misma tabla por rareza y nivel que el inventario.
- GLOW usa la tabla de sr para er, ssr y ur.

## 5. Lo que Aerial ya tiene

- `src/lib/parsers/inventory.ts`: `splitTemplateId`, `parseInventoryRarity`,
  `parseInventoryTier`, `parseInventoryMaterial` y `parseInventoryFilterType`.
  - Trabajan sobre `wid_`/`tid_`.
  - Para esquemas hay que traducir el prefijo `sid_`.
- `src/lib/parsers/stw-items.ts`: `findStwItem`, `findStwAlteration`,
  `calculateStwPowerLevel`, `stwMaxLevel` y `calculateStwStats`.
  - Las estadísticas y las perks de la ficha de inventario sirven tal cual.
- `src/data/stw/items.json`:
  - Tiene unas 4.191 claves `weapon:`/`trap:` y **ninguna `schematic:`**.
  - Mapeo previsto: `Schematic:sid_X` → `Weapon:wid_X` o `Trap:tid_X`.
    [INFERIDO; comprobar con PegLeg, que puede tener la relación
    esquema→objeto, y si no, ampliar `scripts/generate-stw-data.mjs`]
- `src/services/endpoints/mcp.ts`:
  - Ya existen `getQueryProfile` y `getQueryProfileMainProfile` (campaign).
  - Faltan `UpgradeItemBulk`, `ConvertItem` y `UpgradeItemRarity`.
- `src/lib/parsers/resources.ts`: ya reconoce `Schematic:` (icono
  `voucher_generic_schematic_<rareza>`).
- `images.ts`: tiene `schematicxp` y `reagent_schematic`.
- La página de inventario sirve de plantilla de interfaz: filtros, tarjetas,
  ficha con flechas.

**Datos del juego**

- PegLeg `NamedItems/Weapon.json` y `Trap.json`:
  - Nombre, subtipo, rareza, tier, material (`EvoType`) y estadísticas.
  - `DismantleResults`, lo que da al reciclar.
- STW-Datatables: `CraftingRecipes_New`, `DisassembleRecipes`, `SlotLoadouts`
  y `AlterationGroups`.
  - Las recetas de fabricación solo están aquí; en PegLeg no.

## 6. Decisiones para el SPEC (preguntar al usuario)

1. **Mejoras:** solo lectura primero (recomendado) o con mejoras desde el
   principio.
2. **Ubicación:**
   - Página propia en Operaciones STW (recomendado).
   - O pestaña dentro de Inventario, ya que comparten casi todo.
3. **Coste de fabricación:** mostrarlo o no en la ficha (a partir de
   `CraftingRecipes_New`).
4. **Esquemas del libro de colección:** incluirlos o no, con un filtro.
