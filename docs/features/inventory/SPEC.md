# SPEC — Visor de inventario de Salvar el Mundo

Estado: v3 · Alcance: solo lectura (no modifica el perfil del jugador).

Este documento describe **comportamiento**, no código. Se elaboró observando la
interfaz del visor de inventario de GLOW Launcher 5.0.4 (análisis estático, sin
ejecutar el binario) y la API de perfiles MCP de Epic que Aerial ya usa. No se
copia código ni datos de GLOW. Cada afirmación lleva su origen:

- **[CONFIRMADO]**: visto en el frontend de GLOW o en código de Aerial que ya
  funciona contra Epic.
- **[INFERIDO]**: deducido; GLOW lo calcula en su lado Rust, que no se pudo
  decompilar.
- **[DECISIÓN]**: elección propia de esta implementación.
- **[DATOS]**: comprobado contra los datos del juego de PegLegResources (§6) y,
  cuando se indica, contra una captura del juego.

## 1. Qué hace

Muestra, para **una** cuenta, los objetos que el jugador lleva encima en Salvar
el Mundo, con filtros y una ficha de detalle por objeto.

## 2. Origen de los datos

| Inventario | `profileId` | Etiqueta | Origen |
|---|---|---|---|
| Mochila de Campaña | `theater0` | Campaña | [CONFIRMADO] GLOW `PROFILE_ORDER`, i18n `profile.theater0` |
| Mochila de Ventures | `theater2` | Ventures | [CONFIRMADO] GLOW `PROFILE_ORDER`, i18n `profile.theater2` |
| Almacén | `outpost0` | Almacén | [CONFIRMADO] GLOW; Aerial ya lo consulta (`getQueryProfileStorageProfile`) |

Petición (misma forma que las consultas MCP existentes de Aerial) [CONFIRMADO]:

```
POST {baseGame}/profile/{accountId}/client/QueryProfile?profileId={profileId}&rvn=-1
Authorization: bearer {accessToken}
Body: {}
```

Los objetos están en `profileChanges[0].profile.items`, un mapa
`itemId → { templateId, quantity, attributes }`.

Seguridad [DECISIÓN]: la petición se hace desde el proceso principal de Aerial
con el token de la cuenta; el visor no envía nada a terceros.

## 3. Clasificación de objetos

Cinco categorías, en este orden: `ranged`, `melee`, `traps`, `ingredients`,
`materials`. GLOW usa una sola `weapons` (`CATEGORY_ORDER`); Aerial la
separa en armas a distancia y cuerpo a cuerpo según el tipo de arma.

Asignación por prefijo de `templateId` [INFERIDO]:

| Prefijo | Categoría |
|---|---|
| `Weapon:` | ranged, o melee si el tipo es `melee_*` |
| `Trap:` | traps |
| `Ingredient:` | ingredients |
| `WorldItem:` | materials |
| cualquier otro (p. ej. `Ammo:`) | se ignora |

Objetos ocultos siempre [DECISIÓN del usuario]: `Weapon:buildingitemdata_floor`,
`Weapon:buildingitemdata_roofs`, `Weapon:buildingitemdata_stair_w`,
`Weapon:buildingitemdata_wall` y `Weapon:edittool` (piezas de construcción y
herramienta de edición). Lista en `src/config/constants/inventory.ts`.

### 3.1 Rareza
Se toma de los datos del juego (§6) [DATOS]; si el objeto no está, se extrae del `templateId` por el token `_c_`, `_uc_`, `_r_`, `_vr_`, `_sr_`,
`_ur_`/`_er_` (o el mismo token al final). Orden de los filtros:
`sr, er, vr, r, uc, c` en GLOW [CONFIRMADO]. Aerial usa `ur` para Mítico; en
esta implementación `er` y `ur` se muestran ambos como Mítico [DECISIÓN].
Objetos sin token de rareza no tienen rareza (filtrarlos por rareza los oculta)
[CONFIRMADO, `getFilteredItems`].

### 3.2 Tier (estrellas) y material
- Tier: campo `Tier` de los datos del juego [DATOS]; si falta, sufijo
  `_t01`…`_t05` → 1…5 [INFERIDO].
- Material: `_ore_` (mineral) o `_crystal_` (cristal) [INFERIDO].

### 3.3 Tipo de arma/trampa (`filterType`)
Valores que usa GLOW [CONFIRMADO, `WEAPON_TYPE_ICONS` / `TRAP_TYPE_ICONS`]:
`assault, pistol, shotgun, sniper, smg, explosive, melee_sword, melee_axe,
melee_scythe, melee_spear, melee_hammer, melee_bat, trap_floor, trap_wall,
trap_ceiling`.

Si el objeto existe en los datos del juego (§6), el tipo sale de su `SubType`
[DATOS]: Assault, Pistol, Shotgun, Sniper, SMG, Explosive, Sword, Axe, Scythe,
Spear, Hardware → `melee_hammer`, Club → `melee_bat`. Si no, se usa el
`templateId` [INFERIDO]:

| Patrón (sin prefijo) | filterType |
|---|---|
| contiene `smg` | smg |
| `wid_assault_` | assault |
| `wid_pistol_` | pistol |
| `wid_shotgun_` | shotgun |
| `wid_sniper_` | sniper |
| `wid_launcher_` o `wid_explosive_` | explosive |
| `wid_edged_sword` | melee_sword |
| `wid_edged_axe` | melee_axe |
| `wid_edged_scythe` | melee_scythe |
| `wid_piercing_spear` | melee_spear |
| `wid_blunt_hammer` | melee_hammer |
| otro `wid_blunt_` | melee_bat |
| `tid_floor_` / `tid_wall_` / `tid_ceiling_` | trap_floor / trap_wall / trap_ceiling |

## 4. Agrupación

GLOW muestra por objeto `quantity` y `stacks` [CONFIRMADO]. Regla de esta
implementación [INFERIDO + DECISIÓN]: se agrupan las entradas con el mismo
`templateId`, el mismo `attributes.level` y la misma lista de
`attributes.alterations`. En cada grupo:
- `quantity` = suma de `quantity` (por defecto 1),
- `stacks` = número de entradas,
- `itemKey` = id estable del grupo (la clave de agrupación).

## 5. Modelo de datos que devuelve el proceso principal

```
InventoryOverview {
  success: boolean
  error?: string
  profileId: 'theater0' | 'theater2' | 'outpost0'
  items: InventoryItem[]
  categoryCounts: Record<Category, number>   // nº de grupos por categoría
  rarityCounts: Record<Rarity, number>       // nº de grupos por rareza
}

InventoryItem {
  itemKey, templateId
  name                 // nombre del juego (§6) o derivado del templateId
  description          // texto del juego o null
  category, subType, filterType, rarity, tier, material
  level                // attributes.level
  maxLevel             // tier × 10 + bonus de nivel (§6.2)
  superchargeLevel     // 0–5 (§6.2); 0 en ingredientes y materiales
  powerLevel           // PL (§6.2); solo armas y trampas
  quantity, stacks
  alterations: { id, name, tier, rarity, element }[]   // perks, en orden
  properties: { key, value }[]   // atributos del perfil en bruto (no se muestran)
  baseStats            // estadísticas base (§6.3) o null
  imageUrl             // imagen del juego (§6.1) o null
  iconKey              // icono de respaldo de Aerial
}
```

## 6. Datos del juego

Fuente [DECISIÓN del usuario]: **PegLegFN/PegLegResources**
(<https://github.com/PegLegFN/PegLegResources>, rama `major`), que publica
datos extraídos de los archivos del juego. Se fija un commit para que nombres,
imágenes y números sean coherentes entre sí; `src/data/stw/source.json` guarda
el repositorio, el commit y su fecha.

Licencia: el repositorio **no tiene archivo de licencia**. Los datos describen
contenido de Epic Games. Se usa un subconjunto mínimo (nombres, rareza, tier,
descripción, nombre de imagen, estadísticas base, perks y tabla de PL), y las
imágenes **no se copian**: se cargan desde `raw.githubusercontent.com`, que la
CSP de Aerial ya permitía.

Generación: `node scripts/generate-stw-data.mjs <copia de PegLegResources> <copia de STW-Datatables>`
lee `GameAssets/NamedItems/{Weapon,Trap,Ingredient,WorldItem,Alteration}.json`
y `GameAssets/ItemRatings.json`, más `MigrationMapping.json` de
archeruwu/STW-Datatables (<https://github.com/archeruwu/STW-Datatables>, sin
archivo de licencia, datatables extraídas del juego), y escribe
`src/data/stw/`. Para actualizar
los datos tras un parche, se vuelve a ejecutar con una copia nueva.

Los datos solo se cargan en el proceso principal; el renderer no los incluye.

### 6.1 Nombres e imágenes

- Nombre = `DisplayTier` + `DisplayName` cuando hay `DisplayTier` (p. ej.
  "Sunbeam" + "Stormblade" = "Sunbeam Stormblade") [DATOS, igual que la captura
  del juego].
- Imagen = `ImagePaths.SmallPreview` servida desde el commit fijado. Si no
  carga, se usa el icono de respaldo de Aerial (vales genéricos, trampas,
  ingredientes y materiales que ya traía).
- Si el `templateId` no está en los datos, se usa el método de la v1: nombre
  derivado del id e icono genérico.

### 6.2 Poder (PL)

[DATOS] Tabla `ItemRatings.Default.Tiers`, clave `{RAREZA}_T0{tier}`
(`C, UC, R, VR, SR, UR`), con `FirstLevel` y una lista `Ratings`:

```
bonus = max(max_level_bonus, level − tier × 10)
nivelEfectivo = min(level, tier × 10 + bonus)
PL = floor(Ratings[nivelEfectivo − FirstLevel])
```

Si el índice es negativo → sin PL; si supera la lista → último valor.
Comprobado: Legendary T5 a nivel 50 → **130**, como en la captura del juego.
Solo se calcula para armas y trampas.

**Supercarga** [v3, DECISIÓN del usuario; misma regla que
`schematics/SPEC.md` §6.2]. La supercarga sube el nivel máximo de 50 a 60
de 2 en 2. Hay objetos supercargados que no traen `max_level_bonus` en el
perfil (comprobado por el usuario: un arma a nivel 60 se veía "NV 60 / 50"
con PL 130). Por eso el tope es el mayor de `tier × 10 + max_level_bonus`
y el propio `level`: a nivel 60, "NV 60 / 60" y **PL 144** (`SR_T05` llega
a 144 en el nivel 60) [DATOS].
`superchargeLevel = min(floor((level − 50) / 2), 5)` si `level > 50`; si no,
0. Implementado en `stwLevelBonus` y `stwSuperchargeLevel`
(`src/lib/parsers/stw-items.ts`), compartidos con el catálogo de esquemas.

### 6.3 Estadísticas

La API de Epic solo devuelve `templateId`, `level`, `max_level_bonus` y los ids
de perks; el juego calcula las estadísticas en el cliente. Aquí se calculan
con las tablas del juego de archeruwu/STW-Datatables [DATOS]:

- Fila de estadísticas del objeto: `RangedWeapons`, `MeleeWeapons` o `Traps`
  (fila `RawWeaponStatRow` de PegLeg; trampas: `Trap_<id sin tid_>`). Las 12
  armas sin fila usan los valores de PegLeg.
- Escala por nivel: `valor × (1 + (nivel − BaseLevel) × escala)`. Solo escalan
  el daño (`DmgScale`) y el impacto (`ImpactDmgScale`), 0,05 en todas las armas;
  nivel 50 → ×3,45.
- Durabilidad: `WeaponDurabilityRarity[DurabilityRowName][rareza]`.
- Cadencia: `BurstFiringRate / CartridgePerFire` en armas de ráfaga, si no
  `FiringRate`. Velocidad de ataque cuerpo a cuerpo: `SwingTime / SwingPlaySpeed`.
- Perks: modificadores de `Alteration.json` de las perks `aid_att_*` y
  `aid_ele_*` (las legacy, vía su perk migrada). Varias perks sobre la misma
  estadística se suman (+10 % y +15 % = +25 %) [INFERIDO: agregación estándar
  de Unreal]. Daño, impacto, cadencia, cargador, recarga y durabilidad se
  multiplican; el daño crítico se suma.

Comprobado contra el juego (Legendary T5, nivel 50):

| Arma | Estadística | Calculado | Juego |
|---|---|---|---|
| Sunbeam Stormblade | Impacto | 741,75 | 741,7 |
| Sunbeam Stormblade | Durabilidad | 300 | 300 |
| Sunbeam Stormblade | Velocidad de ataque | 0,52 s | 0,52 s |
| Brightcore Vacuum Tube Launcher | Impacto | 9.704,85 | 9.704,9 |
| Brightcore Vacuum Tube Launcher | Durabilidad | 150 | 150 |
| Brightcore Vacuum Tube Launcher | Cadencia | 2,33 | 2,33 |
| Brightcore Vacuum Tube Launcher | Daño crítico | 140 % | 140 % |
| Brightcore Vacuum Tube Launcher | Cargador / recarga / munición | 90 / 3,0 / 10 | 90 / 3,0 / 10 |

Lo que no coincide (desconocido o fuera del objeto):

- **Daño**: el juego multiplica además por la bonificación de Ataque del
  F.O.R.T. de la cuenta, que no forma parte del objeto. La ficha muestra el daño
  del arma con nivel y perks, con una nota que lo indica.
- **Probabilidad de crítico con perks**: las perks dan "Critical Rating"; la
  curva `Item.All.CritRatingToCritChance` no reproduce el valor del juego
  (+45 de rating → +35,5 % frente a +63 % en el juego). Como aproximación,
  cada punto de rating se suma como +1 % a la probabilidad base.
- DPS: depende del daño final, no se muestra.

### 6.4 Perks

- Ids: `attributes.alterations`; si no trae ninguno, `attributes.alterationDefinitions`
  [INFERIDO: el tipo previo de Aerial nombraba ese campo].
- Texto: `DisplayName` de `Alteration.json`.
- Tier = sufijo `_t01`…`_t05`. Rareza y color según el tier, como en el juego:
  t01 gris, t02 verde, t03 azul, t04 morado, t05 dorado [DATOS, captura del
  juego]. Las perks sin tier usan la rareza de los datos.
- Presentación como en el juego: un bloque con cinco barras apiladas,
  rellenas desde abajo hasta el tier y del color de la rareza; las perks de
  juego sin tier ocupan la fila entera sin marcador.
- Perks de elemento ("Element: X…") [DATOS, captura del juego]: conservan las
  barras de tier a la izquierda y llevan el icono del elemento de Aerial
  junto al texto. Las perks de elemento **legacy** (id fuera de los datos
  actuales, p. ej. `aid_g_ranged_energyaffliction`) no tienen barras: el
  icono ocupa su lugar. El campo `legacy` de cada perk lo indica.
- Perks legacy [DATOS]: las armas antiguas guardan ids del sistema de perks
  anterior (`aid_att_ranged_damage`, `…_alt1`, `aid_g_ranged_energyaffliction`…),
  que ya no están en los datos actuales. Se traducen con la tabla del propio
  juego `MigrationMapping` (118 filas: perk legacy → perk actual, a veces con
  una perk adicional), tomada de archeruwu/STW-Datatables. Ejemplos:
  `aid_att_ranged_damage` → `aid_att_damage_t01` (+10% Damage),
  `aid_att_ranged_clipsize_alt1` → `aid_att_magazinesize_t02`,
  `aid_att_trap_coredamage_t05` → `aid_att_damage_t03`,
  `aid_g_ranged_energyaffliction` → `aid_ele_energy_t03` +
  `aid_g_affliction_v2` (se muestra como una sola fila con ambos textos y el
  icono del elemento). El tier y el color salen de la perk actual.
  Respaldo [INFERIDO] para ids que no estén en la tabla: sin sufijo = tier 1,
  `_altN` = tier N + 1, con el texto de la perk actual equivalente; si no hay
  equivalente, un nombre legible derivado del id.
- Si un arma no trae perks, la ficha lo indica.

## 7. Interfaz

- Ruta `/stw-operations/inventory`, con entrada en la barra lateral bajo
  "Operaciones STW" y opción en el menú personalizable [DECISIÓN].
- Usa la cuenta activa de Aerial (la de la cabecera); no hay selector propio
  [DECISIÓN, igual que GLOW].
- Disposición [v3, DECISIÓN del usuario; como el catálogo de esquemas]:
  - Arriba, solo la búsqueda de texto (sin distinguir mayúsculas) sobre
    `name` + `templateId`, con espera de 200 ms tras teclear.
  - Debajo, en una fila: perfil (selector de 3 opciones; cambiarlo recarga
    los datos), orden, botón de dirección y recargar.
  - Después, una fila por filtro con su etiqueta. Cada fila se ajusta solo
    por dentro y los contadores usan cifras de ancho fijo.
- Filtros:
  - **Categoría** [v3, DECISIÓN del usuario]: A distancia, Cuerpo a cuerpo,
    Trampas y Materiales (multiselección, con contador). Al marcar una,
    aparece una fila con sus tipos:

    | Categoría | Tipos |
    |---|---|
    | A distancia | assault, pistol, sniper, shotgun, smg, explosive |
    | Cuerpo a cuerpo | los seis `melee_*` |
    | Trampas | trap_floor, trap_wall, trap_ceiling |
    | Materiales | Ingredientes (`Ingredient:`) y Materiales de construcción (`WorldItem:`) |

    Solo aparecen los tipos con objetos. Al desmarcar una categoría se
    quitan sus tipos de la selección. En v2 había cinco categorías planas
    (ranged, melee, traps, ingredients, materials).
  - **Rareza** (multiselección; solo aparecen las rarezas con algún objeto)
    [CONFIRMADO].
  - Categoría, tipo y rareza se combinan con AND (OR dentro de cada uno).
  - "Limpiar filtros", desactivado si no hay filtros activos; no cambia el
    orden ni el perfil.
- **Orden** [v3, DECISIÓN del usuario]: poder (por defecto), nivel, nombre,
  rareza o cantidad, con un botón ascendente/descendente. Al cambiar de
  campo, la dirección vuelve a la suya: descendente, salvo nombre. Los
  empates van de mayor a menor y después por nombre; los objetos sin PL
  quedan al final al ordenar por poder. Lógica compartida con el catálogo
  de esquemas (`src/lib/parsers/item-sort.ts`).
- Contador "N objetos mostrados" y "Limpiar filtros" en la misma línea
  [CONFIRMADO para el contador].
- Cuadrícula de tarjetas virtualizada (§12), coloreadas por rareza, con
  nombre, imagen, PL, cantidad abreviada (≥10 000 → `12.3k`, ≥1 000 000 →
  `1.2M`) y cinco estrellas: las primeras `tier` encendidas y las primeras
  `superchargeLevel` en azul, como en el catálogo de esquemas [v3;
  CONFIRMADO para el formato de cantidad]. Ingredientes y materiales no
  llevan estrellas.
- Botón "Ir hasta arriba" cuando la barra de búsqueda sale de la vista, como
  en otras páginas de Aerial [DECISIÓN del usuario].
- Al pulsar una tarjeta, ficha de detalle al estilo del juego [DECISIÓN]:
  cabecera con rareza | categoría | subtipo, nombre, PL, estrellas y
  "NV x / máx"; estadísticas al nivel del objeto (§6.3); perks (§6.4); descripción;
  cantidad, stacks, supercarga (si la hay), material y `templateId`. Los
  atributos en bruto del perfil
  no se muestran.
- Flechas anterior/siguiente en la ficha (y teclas ← →) para recorrer los
  objetos de la lista filtrada, con la posición "N / total" [DECISIÓN]. Escape o clic fuera la cierra
  [CONFIRMADO].
- Estados: cargando, error (con el mensaje), vacío ("Ningún objeto coincide")
  [CONFIRMADO].
- Cambiar de cuenta reinicia los filtros y recarga [CONFIRMADO,
  `onAccountChanged`].

## 8. Diferencias con GLOW y lo que no se sabe

- **Estadísticas escaladas**: ver §6.3. GLOW tampoco las muestra en su visor
  (solo PL y nivel de juego).
- **Nombres traducidos**: los datos del juego están en inglés; GLOW tiene un
  catálogo propio traducido. Pendiente.
- **Regla exacta de agrupación de GLOW**: desconocida; la de §4 es propia.

## 9. Casos límite

- Cuenta sin acceso a STW o perfil vacío → lista vacía, sin error.
- Token caducado → se renueva con `Authentication.verifyAccessToken`; si falla,
  error "No se pudo autenticar la cuenta".
- Error de red o de Epic → `success: false` con el `errorMessage` de Epic si
  existe.
- `quantity` ausente → 1. `level` ausente → null.
- `templateId` en mayúsculas o minúsculas → la clasificación ignora mayúsculas.

## 10. Pruebas de aceptación

1. Dos stacks de `WorldItem:wooditemdata` (300 y 500) → un objeto "Wood" con
   `quantity = 800` y `stacks = 2`.
2. `Weapon:wid_edged_sword_medium_laser_sr_crystal_t05` a nivel 50 →
   "Sunbeam Stormblade", `Sword`, `sr`, tier 5, PL **130**, NV 50/50, velocidad
   de ataque 0,5185 s, categoría `melee`; con +45 de Critical Rating en perks,
   probabilidad de crítico 60 % (aproximación de §6.3; el juego muestra 78 %).
3. Las perks del perfil se resuelven a su texto y tier
   (`aid_att_damage_t01` → "+10% Damage", tier 1).
4. `Trap:tid_floor_spikes_r_t03` → "Retractable Floor Spikes", `trap_floor`,
   `r`, tier 3, con PL.
5. `Ingredient:ingredient_duct_tape` → "Duct Tape".
6. Un `templateId` que no está en los datos → nombre derivado e icono genérico.
7. `Ammo:ammodatashells` → no aparece.
8. Dos armas iguales con distinto `level` → dos objetos.
9. Supercarga: `Weapon:wid_edged_sword_medium_laser_sr_crystal_t05` a nivel
   60 sin `max_level_bonus` → NV 60/60, PL **144**, `superchargeLevel` 5.
   (Hasta v2, el nivel se limitaba a `tier × 10` y daba PL 130.)
10. Perks: `aid_att_critchance_t05` → tier 5, dorado; `aid_ele_energy_t03` →
    tier 3, azul, elemento Energía.
11. Perks en `alterationDefinitions` se leen si falta `alterations`.
12. Las cinco plantillas ocultas no aparecen.
13. Filtro: la categoría Materiales incluye ingredientes y materiales de
    construcción; dentro de ella, el tipo "Materiales de construcción" deja
    solo los `WorldItem:`. Categoría + rareza + búsqueda se combinan con AND.
14. Orden por cantidad: de mayor a menor por defecto; en empate, la rareza
    mayor y después el nombre.

## 11. Implementación en Aerial

| Pieza | Archivo |
|---|---|
| Petición MCP | `src/services/endpoints/mcp.ts` → `getQueryProfileInventory` |
| Clasificación y agrupación (§3–§4, puro) | `src/lib/parsers/inventory.ts` |
| Datos del juego y PL (§6) | `src/lib/parsers/stw-items.ts`, `src/data/stw/`, `scripts/generate-stw-data.mjs` |
| Constantes compartidas con la página | `src/config/constants/inventory.ts` |
| Filtros por categoría y tipo (§7, puro, sin datos del juego) | `src/lib/parsers/inventory-list.ts` |
| Orden (compartido con esquemas) | `src/lib/parsers/item-sort.ts` |
| Pruebas de §10 | `src/lib/parsers/inventory.test.ts`, `inventory-list.test.ts`, `item-sort.test.ts` (`npm test`) |
| Proceso principal | `src/kernel/core/inventory.ts`, `ipcMain.handle('inventory:get-overview')` en `src/kernel/main.ts` |
| Puente al renderer | `src/kernel/preload-actions/inventory.ts` → `window.electronAPI.getInventoryOverview` |
| Página | `src/routes/stw-operations/inventory/` |
| Cuadrícula virtual, filtros, estrellas y ficha (compartidos con esquemas) | `src/components/stw-items/` |
| Menú | barra lateral, menú personalizable (`inventory`), `routeTree.gen.ts` |
| Textos | `src/locales/{en-US,es-419}/stw-operations/inventory.json`; el resto de idiomas cae a inglés |

La cuenta mostrada es la cuenta activa de Aerial (la de la cabecera), igual
que en GLOW; al cambiarla se reinician los filtros y se recargan los datos.

## 12. Cuadrícula virtualizada

[v3, DECISIÓN del usuario] Hecho en ImPixeluwu/Aerial-Launcher#6 (antes
quedó pendiente al hacer el catálogo de esquemas).

- Componente común `VirtualItemGrid`
  (`src/components/stw-items/virtual-item-grid.tsx`), que también usa el
  catálogo de esquemas, sobre `@tanstack/react-virtual`.
- El scroll es el viewport del layout (`.main-wrapper-content`); las
  columnas salen del ancho (mínimo 7,5 rem) y las tarjetas tienen altura
  fija (136 px en el inventario).
- Tarjetas con `memo`; la lista filtrada se pinta en diferido
  (`useDeferredValue`) para que los botones respondan al momento.
- Al cambiar filtros, orden o perfil se vuelve al principio de la lista, y
  al recorrer la ficha con ← → la lista sigue al objeto abierto.
- Medido en el preview con 2.000 objetos a 800×600: ~24 tarjetas en el DOM
  y ~20–30 ms por clic en un filtro, frente a pintar las 2.000.
