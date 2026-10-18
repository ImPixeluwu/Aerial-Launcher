# SPEC — Visor de inventario de Salvar el Mundo

Estado: borrador v1 · Alcance: solo lectura (no modifica el perfil del jugador).

Este documento describe **comportamiento**, no código. Se elaboró observando la
interfaz del visor de inventario de GLOW Launcher 5.0.4 (análisis estático, sin
ejecutar el binario) y la API de perfiles MCP de Epic que Aerial ya usa. No se
copia código ni datos de GLOW. Cada afirmación lleva su origen:

- **[CONFIRMADO]**: visto en el frontend de GLOW o en código de Aerial que ya
  funciona contra Epic.
- **[INFERIDO]**: deducido; GLOW lo calcula en su lado Rust, que no se pudo
  decompilar.
- **[DECISIÓN]**: elección propia de esta implementación.

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
Se extrae del `templateId` por el token `_c_`, `_uc_`, `_r_`, `_vr_`, `_sr_`,
`_ur_`/`_er_` (o el mismo token al final). Orden de los filtros:
`sr, er, vr, r, uc, c` en GLOW [CONFIRMADO]. Aerial usa `ur` para Mítico; en
esta implementación `er` y `ur` se muestran ambos como Mítico [DECISIÓN].
Objetos sin token de rareza no tienen rareza (filtrarlos por rareza los oculta)
[CONFIRMADO, `getFilteredItems`].

### 3.2 Tier (estrellas) y material
- Tier: sufijo `_t01`…`_t05` → 1…5 [INFERIDO; GLOW muestra `starTier`].
- Material: `_ore_` (mineral) o `_crystal_` (cristal) [INFERIDO].

### 3.3 Tipo de arma/trampa (`filterType`)
Valores que usa GLOW [CONFIRMADO, `WEAPON_TYPE_ICONS` / `TRAP_TYPE_ICONS`]:
`assault, pistol, shotgun, sniper, smg, explosive, melee_sword, melee_axe,
melee_scythe, melee_spear, melee_hammer, melee_bat, trap_floor, trap_wall,
trap_ceiling`.

Asignación a partir del `templateId` [INFERIDO]:

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
  itemKey: string
  templateId: string
  name: string
  category: 'weapons' | 'traps' | 'ingredients' | 'materials'
  filterType: string | null
  rarity: Rarity | null
  tier: number | null
  material: 'ore' | 'crystal' | null
  level: number | null
  quantity: number
  stacks: number
  alterations: string[]   // ids de alteración tal cual vienen del perfil
}
```

Equivale a la forma que consume la interfaz de GLOW [CONFIRMADO], salvo que
`powerLevel`/`gameLevel`, `icon` y `properties` no se calculan en el proceso
principal (ver §8 y §6).

## 6. Nombres e iconos (assets)

Regla [DECISIÓN]: **no se toma ningún asset ni texto de GLOW.** Solo se usan
los recursos que Aerial ya distribuye en `assets/images` y `src/data`.

| Categoría | Nombre | Icono |
|---|---|---|
| traps | `src/data/traps.json` por clave base (`floor_spikes`…) + rareza | `assets/images/traps/<clave>.png` |
| ingredients | `src/data/ingredients.json` | `assets/images/ingredients/<clave>.png` |
| materials | `src/data/resources.json` (`wooditemdata`…) | `assets/images/resources/<clave>.png` |
| weapons | nombre legible derivado del `templateId` (tipo + variante) | vale genérico `voucher_generic_{melee\|ranged}_{rareza}` |

Si falta un icono se usa el vale genérico de la categoría o `question`.

Por qué no hay iconos de cada arma: no existe un repositorio público con
licencia clara para ese arte; todo es propiedad de Epic, venga de donde venga.
Opción futura: que el usuario los exporte de su propia instalación del juego
con FModel. Así son idénticos al juego y no dependen de lo que distribuya GLOW.

## 7. Interfaz

- Ruta `/stw-operations/inventory`, con entrada en la barra lateral bajo
  "Operaciones STW" y opción en el menú personalizable [DECISIÓN].
- Selector de **una** cuenta (por defecto la principal) [DECISIÓN; GLOW usa la
  cuenta activa].
- Filtros [CONFIRMADO]:
  - Perfil (radio, 3 opciones). Cambiarlo recarga los datos.
  - Categoría (multi-selección; muestra el contador por categoría).
  - Rareza (multi-selección; solo aparecen las rarezas con algún objeto).
  - Búsqueda de texto (sin distinguir mayúsculas) sobre `name` + `templateId`,
    con espera de 200 ms tras teclear.
  - "Limpiar filtros", desactivado si no hay filtros activos.
- Contador "N objetos mostrados" [CONFIRMADO].
- Cuadrícula de tarjetas, coloreadas por rareza, con nombre, icono, cantidad
  abreviada (≥10 000 → `12.3k`, ≥1 000 000 → `1.2M`) y estrellas de tier
  [CONFIRMADO para el formato de cantidad].
- Al pulsar una tarjeta, ficha de detalle con categoría, rareza, cantidad,
  stacks, nivel, tier, material, `templateId` y alteraciones [CONFIRMADO para
  los campos; el nivel sustituye al poder, ver §8]. Escape o clic fuera la
  cierra [CONFIRMADO].
- Estados: cargando, error (con el mensaje), vacío ("Ningún objeto coincide")
  [CONFIRMADO].
- Cambiar de cuenta reinicia los filtros y recarga [CONFIRMADO,
  `onAccountChanged`].

## 8. Diferencias con GLOW y lo que no se sabe

- **Poder (PL / "Power level")**: GLOW lo calcula en Rust (`glow-stw/power.rs`)
  a partir del nivel, el tier y la rareza con tablas del juego que no están
  disponibles. **Desconocido.** Esta versión muestra el **nivel**
  (`attributes.level`) y las estrellas de tier.
- **Nombres localizados de armas y de alteraciones**: GLOW usa un catálogo
  propio (`item_i18n.rs`). Aquí se usan nombres legibles derivados del
  `templateId`, solo en inglés. Pendiente.
- **Iconos individuales de armas**: ver §6.
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

1. Un perfil con dos stacks de `WorldItem:wooditemdata` (300 y 500) da un solo
   objeto de materiales con `quantity = 800` y `stacks = 2`.
2. `Weapon:wid_sniper_boltaction_scope_sr_ore_t05` → weapons, `sniper`, `sr`,
   tier 5, `ore`.
3. `Trap:tid_floor_spikes_vr_ore_t03` → traps, `trap_floor`, `vr`, tier 3,
   nombre "Epic Retractable Floor Spikes" (según `traps.json`).
4. `Ingredient:ingredient_duct_tape` → ingredients, nombre "Duct Tape".
5. `Ammo:ammodatashells` → no aparece.
6. Filtrar por rareza `sr` oculta los ingredientes sin rareza.
7. Dos armas con el mismo `templateId` pero distinto `level` → dos objetos.
