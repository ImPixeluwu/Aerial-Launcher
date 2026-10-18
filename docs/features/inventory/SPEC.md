# SPEC — Visor de inventario de Salvar el Mundo

Estado: v2 · Alcance: solo lectura (no modifica el perfil del jugador).

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

Cuatro categorías, en este orden: `weapons`, `traps`, `ingredients`,
`materials` [CONFIRMADO, `CATEGORY_ORDER` de GLOW].

Asignación por prefijo de `templateId` [INFERIDO]:

| Prefijo | Categoría |
|---|---|
| `Weapon:` | weapons |
| `Trap:` | traps |
| `Ingredient:` | ingredients |
| `WorldItem:` | materials |
| cualquier otro (p. ej. `Ammo:`) | se ignora |

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
  maxLevel             // tier × 10 + attributes.max_level_bonus
  powerLevel           // PL (§6.2); solo armas y trampas
  quantity, stacks
  alterations: { id, name, tier, rarity }[]   // perks, en el orden del perfil
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

Generación: `node scripts/generate-stw-data.mjs <copia de PegLegResources>`
lee `GameAssets/NamedItems/{Weapon,Trap,Ingredient,WorldItem,Alteration}.json`
y `GameAssets/ItemRatings.json`, y escribe `src/data/stw/`. Para actualizar
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
nivelEfectivo = min(level, tier × 10 + max_level_bonus)
PL = floor(Ratings[nivelEfectivo − FirstLevel])
```

Si el índice es negativo → sin PL; si supera la lista → último valor.
Comprobado: Legendary T5 a nivel 50 → **130**, como en la captura del juego.
Solo se calcula para armas y trampas.

### 6.3 Estadísticas

La API de Epic solo devuelve `templateId`, `level`, `max_level_bonus`,
`alterations` (ids de perks) y `durability`; **no devuelve estadísticas**.

Lo que se puede mostrar [DATOS]:

| Dato | Origen | ¿Exacto como en el juego? |
|---|---|---|
| Perks: texto, tier (barras 1–5) y rareza | `Alteration.json` | Sí para el texto de los datos. Las perks de crítico aparecen como "+N Critical Rating"; el juego las muestra como % (ver abajo) |
| Descripción | `Description` | Sí |
| Velocidad de ataque (cuerpo a cuerpo) | `SwingTime / SwingPlaySpeed` | Sí: 0,4667 / 0,9 = 0,52 s (captura) |
| Cadencia, cargador, recarga (a distancia); retardo y recarga (trampas) | `RangedWeaponStats`, `TrapStats` | Sí en valor base, sin perks |
| Probabilidad y daño crítico base | `BaseCritChance`, `BaseCritDamage` | Sí en valor base (15 % / 50 % en la captura) |
| Daño, impacto, durabilidad | valores base | **No**: el juego los escala con el nivel |

Lo que **no** se puede calcular con estos datos (desconocido):

- La curva que escala daño, impacto y durabilidad con el nivel o el PL. En la
  captura: daño 162 → 1.743,8, impacto 215 → 741,7, durabilidad 100 → 300.
  Los campos `DmgScale` e `ImpactDmgScale` (0,05) no reproducen esos valores.
- La conversión de "Critical Rating" a %: en la captura, +10/+15/+20 de rating
  se muestran como +14/+21/+28 %, es decir ×1,4 a ese nivel; con un solo punto
  no se puede saber si el factor depende del nivel.
- Por tanto, tampoco el DPS final.

Por eso la ficha muestra **"Estadísticas base"** con una nota que lo explica.
Para obtener los valores finales harían falta las tablas de curvas del juego,
que no están en PegLegResources (se podrían extraer con FModel de una
instalación propia).

## 7. Interfaz

- Ruta `/stw-operations/inventory`, con entrada en la barra lateral bajo
  "Operaciones STW" y opción en el menú personalizable [DECISIÓN].
- Usa la cuenta activa de Aerial (la de la cabecera); no hay selector propio
  [DECISIÓN, igual que GLOW].
- Filtros [CONFIRMADO]:
  - Perfil (radio, 3 opciones). Cambiarlo recarga los datos.
  - Categoría (multi-selección; muestra el contador por categoría).
  - Rareza (multi-selección; solo aparecen las rarezas con algún objeto).
  - Búsqueda de texto (sin distinguir mayúsculas) sobre `name` + `templateId`,
    con espera de 200 ms tras teclear.
  - "Limpiar filtros", desactivado si no hay filtros activos.
- Contador "N objetos mostrados" [CONFIRMADO].
- Cuadrícula de tarjetas, coloreadas por rareza, con nombre, imagen, PL, cantidad
  abreviada (≥10 000 → `12.3k`, ≥1 000 000 → `1.2M`) y estrellas de tier
  [CONFIRMADO para el formato de cantidad].
- Al pulsar una tarjeta, ficha de detalle al estilo del juego [DECISIÓN]:
  cabecera con rareza | categoría | subtipo, nombre, PL, estrellas y
  "NV x / máx"; estadísticas base (§6.3); perks con barras de tier coloreadas
  (gris, verde, azul, morado, naranja, como en el juego); descripción;
  cantidad, stacks, material y `templateId`. Escape o clic fuera la cierra
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
   de ataque 0,5185 s, crítico base 15 % y 50 % (captura del juego).
3. Las perks del perfil se resuelven a su texto y tier
   (`aid_att_damage_t01` → "+10% Damage", tier 1).
4. `Trap:tid_floor_spikes_r_t03` → "Retractable Floor Spikes", `trap_floor`,
   `r`, tier 3, con PL.
5. `Ingredient:ingredient_duct_tape` → "Duct Tape".
6. Un `templateId` que no está en los datos → nombre derivado e icono genérico.
7. `Ammo:ammodatashells` → no aparece.
8. Dos armas iguales con distinto `level` → dos objetos.
9. PL: nivel por encima del máximo se limita a `tier × 10`, salvo
   `max_level_bonus`.

## 11. Implementación en Aerial

| Pieza | Archivo |
|---|---|
| Petición MCP | `src/services/endpoints/mcp.ts` → `getQueryProfileInventory` |
| Clasificación y agrupación (§3–§4, puro) | `src/lib/parsers/inventory.ts` |
| Datos del juego y PL (§6) | `src/lib/parsers/stw-items.ts`, `src/data/stw/`, `scripts/generate-stw-data.mjs` |
| Constantes compartidas con la página | `src/config/constants/inventory.ts` |
| Pruebas de §10 | `src/lib/parsers/inventory.test.ts` (`npm test`) |
| Proceso principal | `src/kernel/core/inventory.ts`, `ipcMain.handle('inventory:get-overview')` en `src/kernel/main.ts` |
| Puente al renderer | `src/kernel/preload-actions/inventory.ts` → `window.electronAPI.getInventoryOverview` |
| Página | `src/routes/stw-operations/inventory/` |
| Menú | barra lateral, menú personalizable (`inventory`), `routeTree.gen.ts` |
| Textos | `src/locales/{en-US,es-419}/stw-operations/inventory.json`; el resto de idiomas cae a inglés |

La cuenta mostrada es la cuenta activa de Aerial (la de la cabecera), igual
que en GLOW; al cambiarla se reinician los filtros y se recargan los datos.
