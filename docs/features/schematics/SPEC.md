# SPEC — Catálogo de esquemas de Salvar el Mundo

Estado: v2 · Alcance: solo lectura (no modifica el perfil del jugador).

Este documento describe **comportamiento**, no código. Parte de
`schematics/NOTES.md` (lectura estática del catálogo de esquemas de GLOW
Launcher 5.0.4, sin ejecutar el binario), de la API de perfiles MCP de Epic que
Aerial ya usa y del visor de inventario (`inventory/SPEC.md`), cuyo código
reutiliza. No se copia código, datos ni imágenes de GLOW. Cada afirmación lleva
su origen:

- **[CONFIRMADO]**: visto en el frontend de GLOW o en código de Aerial que ya
  funciona contra Epic.
- **[INFERIDO]**: deducido; GLOW lo calcula en su lado Rust, que no se pudo
  decompilar.
- **[DECISIÓN]**: elección propia de esta implementación (las del usuario se
  indican).
- **[DATOS]**: comprobado contra los datos del juego de PegLegResources en el
  commit fijado (§6).

## 0. Decisiones del usuario

| # | Pregunta (NOTES §6) | Respuesta |
|---|---|---|
| 1 | Mejoras | **Solo lectura.** Subir nivel y evolucionar rareza quedan para una segunda fase con su propio SPEC (NOTES §3). |
| 2 | Ubicación | **Página propia** en Operaciones STW. |
| 3 | Coste de fabricación | **No se muestra** por ahora. |
| 4 | Esquemas del libro de colección | **Se incluyen, con un filtro** de origen. |

## 1. Qué hace

Muestra, para **una** cuenta, los esquemas de armas y trampas que tiene en
Salvar el Mundo, tanto los del perfil de campaña como los registrados en el
libro de colección, en una cuadrícula con filtros, orden y una ficha de detalle
por esquema. [CONFIRMADO en GLOW solo los de campaña; el libro es DECISIÓN del
usuario]

## 2. Origen de los datos

| Origen | `profileId` | Etiqueta | Fuente |
|---|---|---|---|
| Campaña | `campaign` | Campaña | [CONFIRMADO] subtítulo de GLOW "…from your campaign profile"; Aerial ya consulta `campaign` (`getQueryProfile`) |
| Libro de colección | `collection_book_schematics0` | Libro de colección | [CONFIRMADO en cadenas de GLOW, `collection-book/NOTES.md`]; DECISIÓN del usuario incluirlo |

Petición, igual que la del inventario [CONFIRMADO]:

```
POST {baseGame}/profile/{accountId}/client/QueryProfile?profileId={profileId}&rvn=-1
Authorization: bearer {accessToken}
Body: {}
```

- Las dos peticiones se lanzan en paralelo desde el proceso principal con el
  token de la cuenta [DECISIÓN]. El catálogo no envía nada a terceros.
- Los objetos están en `profileChanges[0].profile.items`, como en el
  inventario. Solo se usan los que empiezan por `Schematic:`.
- Si falla `campaign`, la carga falla entera (`success: false`). Si solo falla
  el libro, se muestran los de campaña y la página avisa de que no se pudo
  leer el libro (`collectionBookError`) [DECISIÓN].

## 3. Clasificación

### 3.1 Esquema → objeto que fabrica

La API solo devuelve el `templateId` del esquema (`Schematic:sid_…`). Nombre,
rareza, tier, tipo, imagen y estadísticas salen del **objeto que fabrica**
(`Weapon:wid_…` o `Trap:tid_…`), que ya está en los datos del inventario.

[DATOS] `NamedItems/Schematic.json` de PegLeg trae `CraftingResult` en cada
esquema: 4.082 esquemas de armas y trampas, y todos apuntan a un objeto que
existe en `Weapon.json` o `Trap.json`. Comprobado en el commit fijado:

- 4.062 siguen la regla `sid_X` → `Weapon:wid_X` y, si no existe,
  `Trap:tid_X`.
- 20 no la siguen, por ejemplo
  `sid_launcher_grenade_winter_sr_ore_t01` → `wid_launcher_wintergrenade_sr_ore_t01`,
  `sid_pistol_vacuumtube_auto_sr_ore_t05` → `wid_pistol_auto_vacuumtube_sr_ore_t05`
  o `sid_ob_assault_auto_t03` → `wid_assault_auto_c_ore_t01`. Esas 20 se
  guardan como tabla de excepciones (§6).
- Rareza, `DisplayName`, `DisplayTier` e imagen coinciden siempre entre el
  esquema y su objeto. El tier difiere en 5 (esquemas `ob_` antiguos); manda el
  del objeto.
- Los esquemas de munición e ingredientes (`Schematic:ammo_*`,
  `Schematic:ingredient_*`) no son armas ni trampas y **se ignoran**
  [DECISIÓN, igual que GLOW: "weapon and trap schematics"].

Resolución [DECISIÓN]: tabla de excepciones → regla → si no hay objeto en los
datos, se clasifica por el `templateId` (§3.2) y se usa el método de respaldo
del inventario (nombre derivado del id, icono genérico).

### 3.2 Arma o trampa (`category`)

- Con objeto en los datos: `Weapon:` → `weapon`, `Trap:` → `trap` [DATOS].
- Sin objeto: es trampa si el id contiene `_floor_`, `_wall_`, `_ceiling_`,
  `_launch_`, `_campfire`, `_pad_`, `_lights_` o `_trap`; si no, arma
  [CONFIRMADO, NOTES §4].

### 3.3 Rareza, tier, material y tipo

Mismas reglas que el inventario (`inventory/SPEC.md` §3.1–3.3), aplicadas al
objeto resuelto [DATOS], y si no está, al id del esquema con `sid_` traducido a
`wid_`/`tid_` [INFERIDO]:

- Rareza: `er` y `ur` son Mítico [DECISIÓN heredada del inventario; GLOW igual,
  CONFIRMADO]. Si falta en los datos, `attributes.starting_rarity`
  [CONFIRMADO en NOTES] y después el token del id.
- Tier: de los datos, si no `_t0N` (1–6), y si no, del nivel: ≤10 → 1, ≤20 → 2,
  ≤30 → 3, ≤40 → 4, resto 5 [CONFIRMADO, NOTES §4].
- Material: `ore` o `crystal`.
- `filterType`: el del inventario (`assault`, …, `melee_bat`, `trap_floor`,
  `trap_wall`, `trap_ceiling`).

### 3.4 Categoría y tipo para el filtro (`group`, `filterType`)

[DECISIÓN del usuario, v2] El filtro tiene dos niveles:

| Categoría (`group`) | Tipos (`filterType`), en este orden |
|---|---|
| `ranged` | `assault, pistol, sniper, shotgun, smg, explosive` |
| `melee` | `melee_sword, melee_axe, melee_scythe, melee_spear, melee_hammer, melee_bat` |
| `traps` | `trap_floor, trap_wall, trap_ceiling` |

- `group`: `traps` si es trampa; `melee` si el tipo es `melee_*`; si no,
  `ranged` (también las armas sin tipo reconocido).
- GLOW usa una sola lista de tipos con `melee` y `trap` como opciones que
  agrupan [CONFIRMADO, NOTES §2]; aquí la agrupación es el primer nivel y los
  tipos de melee aparecen por separado. Los 338 esquemas de trampa de los
  datos son `floor`, `wall` o `ceiling` [DATOS].
- Un esquema sin tipo reconocido no tiene `filterType`; filtrar por tipo lo
  oculta, pero sí aparece al filtrar solo por su categoría.

## 4. Agrupación

Como en el inventario (`inventory/SPEC.md` §4), con el origen en la clave
[DECISIÓN]: se agrupan las entradas con el mismo `templateId`, `level`, perks
(`attributes.alterations`) y origen. `quantity` = suma, `stacks` = nº de
entradas, `itemKey` = clave del grupo. Lo normal es `quantity = 1`; GLOW muestra
la cantidad cuando es mayor que 1 [CONFIRMADO].

## 5. Modelo de datos que devuelve el proceso principal

```
SchematicsOverview {
  success: boolean
  error?: string
  collectionBookError?: string      // el libro no se pudo leer (§2)
  items: SchematicItem[]
  groupCounts: Record<Group, number>        // nº de grupos por categoría
  typeCounts: Record<FilterType, number>    // nº de grupos por tipo
  rarityCounts: Record<Rarity, number>      // nº de grupos por rareza
  sourceCounts: Record<Source, number>      // nº de grupos por origen
}

SchematicItem {
  itemKey, templateId          // templateId del esquema
  itemTemplateId               // objeto que fabrica (§3.1) o null
  source                       // 'campaign' | 'collection-book'
  name, description
  category                     // 'weapon' | 'trap'
  subType, filterType, group, rarity, tier, material
  level, maxLevel              // maxLevel = tier × 10 + max_level_bonus
  superchargeLevel             // 0–5 (§6.2)
  powerLevel
  quantity, stacks
  alterations[]                // perks, igual que en el inventario
  stats                        // estadísticas al nivel con perks, o null
  imageUrl, iconKey
}
```

Los nombres de campos de GLOW (`itemKey`, `stwRarity`, `starTier`,
`gameLevel`…) solo sirven de referencia; este modelo sigue el del inventario.

## 6. Datos del juego

Fuente: la misma del inventario, **PegLegFN/PegLegResources** en el commit
fijado de `src/data/stw/source.json` (`inventory/SPEC.md` §6).

`scripts/generate-stw-data.mjs` se amplía para leer
`GameAssets/NamedItems/Schematic.json` y escribir
`src/data/stw/schematics.json`: **solo las excepciones** a la regla de §3.1
(`schematic:sid_… → weapon:wid_…`, en minúsculas). El script comprueba que la
regla resuelve bien el resto y falla si un `CraftingResult` apunta a un objeto
que no está en los datos [DECISIÓN: así el archivo pesa unos pocos KB en lugar
de ~400 KB con las 4.082 filas]. Se sigue cargando solo en el proceso
principal.

No se usan `CraftingCost`, `RecycleRecipe`, `PromotionCosts`, `TierUpRecipe`
ni `RarityUpRecipe` (decisión 3 y alcance de solo lectura).

### 6.1 Nombres, imágenes, perks y estadísticas

Los del objeto resuelto, con las mismas reglas que el inventario
(`inventory/SPEC.md` §6.1, §6.3 y §6.4) [DATOS]. GLOW usa sus propios iconos
(`SID_…`/`TID_…`); **no se reutilizan** [regla del proyecto].

Las perks se pintan como en el inventario: barras de tier a la izquierda y,
en las de elemento, el icono del elemento junto al texto; las perks legacy
de elemento muestran solo el icono, sin barras.

Los nombres de objetos y perks vienen de los datos del juego en inglés; la
página lo indica con una nota [CONFIRMADO: GLOW muestra el mismo aviso para
las perks].

### 6.2 Poder (PL) y supercarga

- Misma tabla y fórmula que el inventario (`inventory/SPEC.md` §6.2) [DATOS].
  `er` usa la tabla de Mítico (`UR_T0N`); GLOW usa la de `sr` para er/ur
  [CONFIRMADO en NOTES], pero las tablas `SR_T05` y `UR_T05` de los datos son
  idénticas (40 → 60, último valor 144) [DATOS], así que el resultado es el
  mismo.
- La supercarga sube el nivel máximo de 50 a 60 de 2 en 2
  (`max_level_bonus` = 2, 4 … 10) [INFERIDO]. Para no infravalorar el PL si el
  perfil no trae `max_level_bonus`, el tope del nivel efectivo es el mayor de
  `tier × 10 + max_level_bonus` y el propio `level` [DECISIÓN].
- `superchargeLevel = min(floor((level − 50) / 2), 5)` si `level > 50`; si no,
  0 [CONFIRMADO, NOTES §2, sin el límite por tier porque el tier es 5 por
  encima de 50].

## 7. Interfaz

- Ruta `/stw-operations/schematics`, con entrada "Esquemas" en la barra
  lateral bajo "Operaciones STW", justo después de "Inventario", y opción en el
  menú personalizable [DECISIÓN del usuario: página propia].
- Usa la cuenta activa de Aerial (la de la cabecera); no hay selector propio
  [DECISIÓN, como el inventario; GLOW usa la cuenta principal].
- Caché [CONFIRMADO, NOTES §1]: el resultado se guarda 120 s por cuenta en la
  sesión del renderer; volver a la página dentro de ese tiempo no llama a Epic.
  El botón de recargar la ignora. La clave no incluye el idioma porque los
  nombres no se traducen [DECISIÓN].
- Filtros [CONFIRMADO salvo origen]:
  - **Origen** (multiselección: Campaña, Libro de colección, con contador).
    Sin nada marcado se ven los dos [DECISIÓN del usuario].
  - **Categoría** (multiselección: A distancia, Cuerpo a cuerpo, Trampas, con
    contador; §3.4). Se ocultan las que no tienen objetos [DECISIÓN del
    usuario, v2].
  - **Tipo**: al marcar categorías aparece una fila con los tipos de esas
    categorías que tienen objetos (multiselección, con contador). Al
    desmarcar una categoría se quitan sus tipos de la selección.
  - **Rareza** (multiselección: mítico, legendario, épico, raro, poco común,
    común). Solo aparecen las que tienen algún objeto.
  - Origen, categoría, tipo y rareza se combinan con AND (OR dentro de cada
    uno).
  - **Búsqueda**: subcadena sin distinguir mayúsculas sobre `name` +
    `templateId`, con 280 ms de espera.
  - "Limpiar filtros", desactivado si no hay filtros activos; **no** cambia el
    orden.
- **Orden**: campo (`power` por defecto, `level`, `name`, `rarity`) más un
  botón que alterna ascendente/descendente [DECISIÓN del usuario, v2; GLOW
  tiene las 8 combinaciones como opciones de una lista, CONFIRMADO]. Al
  cambiar de campo la dirección vuelve a la suya por defecto: descendente,
  salvo `name`, que es ascendente.
  - Rango de rareza: c 1 < uc 2 < r 3 < vr 4 < sr 5 < Mítico 6 (GLOW distingue
    er 6 < ur 7; aquí son la misma rareza) [DECISIÓN].
  - Desempates: power → rareza ↓, nivel ↓, nombre; level → rareza ↓, power ↓,
    nombre; rarity → power ↓, nivel ↓, nombre; name → `localeCompare` con
    sensibilidad base. Los valores ausentes cuentan como 0.
  - El orden se conserva al cambiar de cuenta; los filtros se reinician
    [DECISIÓN].
- Contador "N esquemas mostrados", lista sin agrupar [CONFIRMADO].
- La cuadrícula no se virtualiza [DECISIÓN: una cuenta tiene del orden de
  cientos de esquemas y las imágenes cargan en diferido, como en el
  inventario].
- **Carta** [CONFIRMADO salvo origen]: color según la rareza; imagen; PL si es
  mayor que 0; cantidad si es mayor que 1 (formato del inventario); insignia
  del tipo; marca de libro de colección si viene de ahí [DECISIÓN]; cinco
  estrellas con las primeras `tier` (1–5) encendidas y las primeras
  `superchargeLevel` pintadas como supercargadas; "NV x / máx" bajo las
  estrellas (GLOW usa una barra de XP, CONFIRMADO; aquí se sustituye por el
  texto, DECISIÓN del usuario, v2); nombre.
- **Ficha** (modal; Escape o clic fuera la cierran) [CONFIRMADO]: la del
  inventario (cabecera con rareza | categoría | subtipo, nombre, PL, estrellas,
  "NV x / máx", estadísticas, perks con su tier, descripción) más el origen,
  la supercarga y el `templateId` del esquema y del objeto. Flechas
  anterior/siguiente y teclas ← → como en el inventario [DECISIÓN].
- Estados: sin cuenta, cargando, error (con el mensaje), aviso si falló el
  libro, vacío ("Ningún esquema coincide").
- Cambiar de cuenta reinicia los filtros y recarga (o usa la caché).

## 8. Diferencias con GLOW y lo que no se sabe

- **Mejoras**: fuera de alcance (decisión 1). GLOW permite subir nivel y
  evolucionar rareza (NOTES §3); no hay botones ni saldos de XP/flux.
- **Libro de colección**: GLOW no lo incluye; aquí sí, con filtro.
- **Página "STW Profile" con pestañas**: no se replica; el catálogo es una
  página propia.
- **Nombres traducidos**: GLOW los pide localizados a su backend; aquí están en
  inglés (como el inventario).
- **Iconos**: los de PegLeg del objeto que fabrica, no los de GLOW.
- **Cuadrícula virtualizada**: no (§7).
- **Forma de los objetos del libro**: se asume que guardan `templateId`,
  `attributes.level` y `attributes.alterations` como los de campaña
  [INFERIDO]; si faltan, se ven sin nivel ni perks.

## 9. Casos límite

- Cuenta sin acceso a STW o perfil vacío → lista vacía, sin error.
- Libro de colección vacío o inexistente → solo los de campaña; si Epic
  devuelve error, aviso (`collectionBookError`), no error de página.
- Token caducado → se renueva con `Authentication.verifyAccessToken`; si falla,
  error "No se pudo autenticar la cuenta".
- Error de red o de Epic en `campaign` → `success: false` con el
  `errorMessage` de Epic si existe.
- `quantity` ausente → 1. `level` ausente → sin nivel ni PL; la carta no
  muestra "NV".
- `templateId` en mayúsculas o minúsculas → la resolución ignora mayúsculas.

## 10. Pruebas de aceptación

1. `Schematic:sid_edged_sword_medium_laser_sr_crystal_t05` nivel 50 →
   objeto `Weapon:wid_edged_sword_medium_laser_sr_crystal_t05`,
   "Sunbeam Stormblade", `weapon`, `melee_sword`, grupo `melee`, `sr`, tier 5,
   PL **130**, NV 50/50.
2. Excepción: `Schematic:sid_pistol_vacuumtube_auto_sr_ore_t05` → objeto
   `Weapon:wid_pistol_auto_vacuumtube_sr_ore_t05` (no por la regla).
3. `Schematic:sid_floor_spikes_r_t03` → `Trap:tid_floor_spikes_r_t03`,
   "Retractable Floor Spikes", `trap`, `trap_floor`, `r`, tier 3, con PL.
4. `Schematic:ammo_energycell` y `Schematic:ingredient_blastpowder` → no
   aparecen. Objetos que no son `Schematic:` → no aparecen.
5. Esquema que no está en los datos (`Schematic:sid_wall_madeup_vr_t02`) →
   `trap`, nombre derivado, icono genérico, rareza `vr`, tier 2.
6. Supercarga: `sr` tier 5 nivel 60 con `max_level_bonus` 10 → PL 144,
   `superchargeLevel` 5, NV 60/60; nivel 54 sin `max_level_bonus` → PL de nivel
   54 (no se recorta a 50), `superchargeLevel` 2.
7. El mismo esquema en campaña y en el libro → dos objetos con distinto
   `source`; `sourceCounts` = 1 y 1.
8. Dos entradas iguales en campaña → un objeto con `quantity = 2`,
   `stacks = 2`.
9. Las perks se resuelven como en el inventario (`aid_att_damage_t01` →
   "+10% Damage", tier 1).
10. Orden `power` descendente con empate de PL → gana la rareza mayor; con
    empate de rareza, el nivel mayor; después, el nombre. En ascendente solo
    se invierte el PL; los desempates no cambian.
11. Orden `name` ascendente ignora mayúsculas y acentos (`localeCompare`,
    base); descendente lo invierte.
12. Categoría `melee` incluye espadas y hachas; dentro de ella, el tipo
    `melee_axe` deja solo las hachas; categoría + rareza se combinan con AND.
13. `groupCounts`, `typeCounts` y `rarityCounts` cuentan grupos; las
    categorías, tipos y rarezas sin objetos no se ofrecen.
14. Tier por nivel cuando el id no lo trae: nivel 25 → 3.

## 11. Implementación en Aerial

| Pieza | Archivo |
|---|---|
| Petición MCP | `src/services/endpoints/mcp.ts` → `getQueryProfileInventory`, con el tipo de `profileId` ampliado a `campaign` y `collection_book_schematics0` |
| Resolución esquema → objeto (§3.1, reutilizable por el libro de colección) | `src/lib/parsers/stw-items.ts` → `resolveStwSchematic` |
| Clasificación, agrupación, filtros y orden (§3–§4, §7, puro) | `src/lib/parsers/schematics.ts` |
| Datos del juego (§6) | `src/data/stw/schematics.json`, `scripts/generate-stw-data.mjs` |
| Tipos | `src/types/schematics.d.ts` |
| Constantes compartidas | `src/config/constants/schematics.ts` |
| Pruebas de §10 | `src/lib/parsers/schematics.test.ts` (`npm test`) |
| Proceso principal | `src/kernel/core/schematics.ts`, `ipcMain.handle('schematics:get-overview')` en `src/kernel/main.ts` |
| Puente al renderer | `src/kernel/preload-actions/schematics.ts` → `window.electronAPI.getSchematicsOverview` |
| Componentes de carta y ficha comunes con el inventario | `src/components/stw-items/` (se extraen de la página de inventario sin cambiar su comportamiento) |
| Página | `src/routes/stw-operations/schematics/` |
| Menú | barra lateral, menú personalizable (`schematics`), `routeTree.gen.ts` |
| Textos | `src/locales/{en-US,es-419}/stw-operations/schematics.json`; el resto de idiomas cae a inglés |
| Créditos | `src/routes/information/credits/route.tsx`: PegLegResources también da los esquemas |
