# NOTAS: Libro de colección

Esto es materia prima para el SPEC, no el SPEC. Lee antes
`docs/features/README.md`.

**Origen:** lectura estática de la interfaz de GLOW 5.0.4 y de las cadenas del
binario. Etiquetas:

- **[CONFIRMADO]:** visto en su JavaScript o en las cadenas.
- **[INFERIDO]:** deducido.

**Secciones de GLOW consultadas:** `src/renderer/pages/collectionBook.ts`,
`pages/createStwCollectionPage.ts`, `src/shared/stwCollectionSort.ts`,
`stwCollectionCardMeta.ts`, `utils/stwItemUpgradeLogic.ts`,
`i18n/pages/collectionBook.json` y las cadenas de `crates/glow-stw/src/collection_book.rs`.

## Lo más importante

En GLOW **no es un libro** con páginas, secciones y recompensas. Es un
**listado plano** de los objetos registrados en el libro, con filtros,
paginación y un botón "Improve All", que sube cada objeto hasta el tope de su
rareza. [CONFIRMADO]

`createStwCollectionPage.ts` **no** se usa aquí. Es la cuadrícula genérica de
Héroes, Supervivientes y Defensores. [CONFIRMADO]

## 1. Datos

**Canales IPC** [CONFIRMADO]

- `collectionbook:get-overview(lang)`.
- `collectionbook:upgrade-all(lang)`.

**Respuesta de `get-overview`** [CONFIRMADO]

- Campos generales: `success`, `error`, `bookLevel`, `totalItems`,
  `upgradableCount`, `typeCounts` y `rarityCounts`.
- `items[]`, con estos campos por objeto: `templateId`, `name` (localizado),
  `type`, `rarity`, `rarityLabel`, `icon`, `level`, `maxLevel?`, `tier` y
  `upgradable`.

**Perfiles MCP**

- `collection_book_people0` y `collection_book_schematics0`. [CONFIRMADO en
  cadenas]
- El backend hace `QueryProfile` de los dos y une los objetos. [INFERIDO]

**Nivel del libro**

- Se lee de
  `profileChanges[0].profile.stats.attributes.collection_book.maxBookXpLevelAchieved`.
  [CONFIRMADO]
- Seguramente del perfil `campaign`. [INFERIDO] Aerial ya lo tipa en
  `src/types/services/mcp/query-profile.d.ts`.

**Tipo del objeto**

Se deduce del prefijo del templateId [INFERIDO]:

| Prefijo | Tipo |
|---|---|
| `Hero:` | Hero |
| `Worker:Manager…` | Manager (se muestra como "Leads") |
| resto de `Worker:` | Survivor |
| `Defender:` | Defender |
| `Schematic:` | Weapon o Trap |

**Otros campos** [INFERIDO]

- `maxLevel`: tope por rareza.
- `upgradable`: `level < maxLevel`.

**Cuenta**

GLOW usa la cuenta principal ("Main account: {name}"). [CONFIRMADO]

**Fuera de alcance de GLOW**

- No hay catálogo de páginas, secciones ni recompensas del libro.
  [CONFIRMADO]
- La página no llama a `ClaimCollectionBookRewards`,
  `ResearchItemFromCollectionBook`, `SlotItemInCollectionBook` ni
  `UnslotItemFromCollectionBook`. Solo aparecen en su explorador genérico de
  operaciones MCP. [CONFIRMADO]

## 2. Interfaz [CONFIRMADO]

**Cabecera**

- Título y subtítulo.
- Botones "Refresh" e "Improve All". Mientras mejora, el segundo dice
  "Improving…".
- "Improve All" está desactivado si `upgradableCount` es 0.

**Métricas**

- Nivel del libro ("—" si falta).
- Total de objetos.
- Mejorables (resaltada).
- Filtrados.

**Filtros**

- Búsqueda: subcadena sin distinguir mayúsculas sobre `name + templateId`.
- Casilla "solo mejorables".
- "Limpiar filtros", desactivado si no hay filtros.
- Pastillas de tipo, de selección única y con contador, en este orden: Hero,
  Survivor, Manager, Defender, Weapon, Trap.
- Pastillas de rareza, de selección única, en el orden `er, sr, vr, r, uc, c`.
  Solo aparecen las que tienen algún objeto.
- Pulsar la pastilla activa la desactiva.
- Cualquier cambio de filtro vuelve a la página 1.

**Orden y paginación**

- No hay selector de orden: se usa el orden del backend.
- Paginación de 24 objetos, con Anterior y Siguiente y el texto "Página N / M".
- Contador "N objetos coinciden".

**Tarjeta**

- Icono, tipo, rareza con color y nombre.
- "Nv X/Máx" y "Tier N".
- Barra `nivel/máx`.
- Insignia "Mejorable" o "Al máximo".
- El templateId aparece en el tooltip.
- No hay ficha de detalle.

**Improve All**

1. Pide confirmación.
2. Llama a `upgrade-all`.
3. Muestra un aviso con "mejorados · ya al máximo · fallidos · detenido por
   falta de recursos", o "nada que mejorar".
4. Recarga.

**Resultado de `upgrade-all`**

- `totalCandidates`, `upgradedCount`, `alreadyMaxCount`, `failedCount`,
  `stoppedEarly` y `upgradedByType`.

**Operaciones MCP del backend**

- `UpgradeSlottedItem { targetItemId, desiredLevel }` en
  `collection_book_people0` o `collection_book_schematics0`, según el tipo.
  [CONFIRMADO]
- `ConvertSlottedItem { targetItemId, conversionIndex }` para cruzar de tier.
  [INFERIDO]
- El proceso se detiene en cuanto un error indica falta de recursos.
  [INFERIDO]

**Topes**

- Por tier: T1 = 10 … T5 = 50, y 60 a partir de ahí.
- Por rareza: 50 por defecto (`stwItemUpgradeLogic.ts`).
- El tope que usa el libro lo calcula Rust con la misma idea. [INFERIDO]

**Estados**

- Cargando.
- Error sin datos, con botón Reintentar.
- Error con datos, como aviso sobre el contenido.
- Durante la mejora se desactivan los botones.

**Recargas**

- Al cambiar de cuenta, limpia filtros, página y resultado, y recarga.
- Al cambiar de idioma, recarga, porque los nombres vienen localizados.
- No usa caché.

## 3. Lo que Aerial ya tiene

**Peticiones MCP** (`src/services/endpoints/mcp.ts`)

- `getQueryProfileInventory({ profileId })` ya recibe un `profileId`.
- Para usarla aquí, hay que ampliar el tipo con `collection_book_people0` y
  `collection_book_schematics0`. El tipo está en
  `src/config/constants/inventory.ts` y `src/types/inventory.d.ts`.
- Faltan `UpgradeSlottedItem` y `ConvertSlottedItem`. Se pueden copiar del
  patrón de `setStorageTransfer`.

**Parseo** (`src/lib/parsers/inventory.ts`)

- Rareza, tier, material y tipo.
- Agrupación y conteos.

**Datos de objetos** (`src/lib/parsers/stw-items.ts` y `src/data/stw/`)

- `items.json` solo cubre `Weapon`, `Trap`, `Ingredient` y `WorldItem`.
- No tiene héroes, supervivientes ni defensores. Para ellos hay que ampliar
  `scripts/generate-stw-data.mjs` con `NamedItems/{Hero,Worker,Defender}.json`
  de PegLeg (comprobar los nombres exactos de archivo).
- Los esquemas necesitan el mismo mapeo `sid_` → `wid_`/`tid_` que el catálogo
  de esquemas.

**Interfaz de referencia**

- La página de inventario.

## 4. Decisiones para el SPEC (preguntar al usuario)

1. **Ámbito:** copiar el alcance de GLOW (listado + "mejorar todo") o hacer un
   libro de verdad, con páginas y recompensas. Para eso último no hay
   catálogo público de páginas ni recompensas en PegLeg ni en
   STW-Datatables; habría que buscar otra fuente.
2. **"Mejorar todo":** gasta recursos de la cuenta. Opciones: solo lectura
   primero (recomendado) o incluirlo con confirmación.
3. **Orden y paginación:**
   - Orden: añadir selector de orden (power, nivel, nombre, rareza, como en
     esquemas) o mantener el del backend.
   - Navegación: paginación como GLOW, o una cuadrícula con desplazamiento
     como el inventario (recomendado, por coherencia).
4. **Datos de héroes y supervivientes:** ampliar el generador con estos tipos
   para tener nombres e imágenes.
