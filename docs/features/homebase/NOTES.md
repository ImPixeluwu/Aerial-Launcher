# NOTAS: Visor de Homebase ("Outpost Info")

Este documento es materia prima para el SPEC, no el SPEC. Lee antes
`docs/features/README.md`.

**Origen:** lectura estática de la interfaz de GLOW 5.0.4 y de las cadenas del
binario.

- **[CONFIRMADO]:** visto en su JavaScript o en sus cadenas.
- **[INFERIDO]:** deducido.

**Secciones de GLOW consultadas:**

- `src/renderer/pages/outpost.ts`, `outpostBlueprint3d.ts`,
  `outpostBuildMeshes.ts`, `outpostBuildShapes.ts`,
  `outpostBlueprintGeometry.ts`, `outpostTwineTerrain.ts` y
  `outpostZoneTerrainLoader.ts`.
- `src/shared/outpostLayoutCoerce.ts` e `i18n/pages/outpost.json`.
- Cadenas de `crates/glow-stw/src/outpost*.rs` y `hbv_window.rs`.

## Lo más importante

La página tiene dos partes:

1. **Información de cada zona.** Sale solo del perfil de Epic y de la API
   pública de cuentas, así que es replicable tal cual.
2. **Escaneo de la base y visor 3D.**
   - El escaneo descarga el archivo de guardado del jugador desde el
     cloudstorage de Epic y lo interpreta en el lado Rust. Ese parser habría
     que hacerlo desde cero, a partir de un archivo real.
   - En la versión actual, el botón "3D base" abre el **visor remoto del
     servidor de GLOW**, no el three.js local. Ese visor queda fuera.
     [CONFIRMADO]

## 1. Información por zona

**Pestañas** [CONFIRMADO]

- En orden fijo: `pve_04` (Twine), `pve_03` (Canny), `pve_02` (Plankerton) y
  `pve_01` (Stonewood).
- Cada pestaña lleva un icono de dificultad y un punto verde si la zona ya se
  escaneó sin avisos.

**Panel de zona** [CONFIRMADO]

- Nombre e id de la zona.
- Nivel del Escudo Antitormentas: `level`/10, dibujado como 10 casillas.
- Oleada máxima de resistencia: `highestEnduranceWave`/30, como 30 casillas.
- Amplificadores colocados: `amplifierCount`.
- "Permisos de edición (n)": nombre e id de cada cuenta, con un botón de copiar
  para cada uno; al copiar muestra ✓ durante 1,2 s.

**Datos**

- Canal IPC: `outpost:info`, que devuelve `{ success, zones[], error }`.
  [CONFIRMADO]
- Campos de cada zona: `zoneId`, `zoneName`, `level`, `highestEnduranceWave`,
  `amplifierCount`, `editPermissions[{ displayName, accountId }]` y
  `saveFile`. [CONFIRMADO]
- Cómo los obtiene el backend:
  - Hace `QueryProfile` y busca los objetos `Outpost:outpostcore_pve_01`…`04`.
    [CONFIRMADO]
  - El perfil es `metadata`, según su subtítulo ("from your metadata
    profile"). [INFERIDO]
  - Atributos que lee [CONFIRMADO]:
    - `outpost_core_info.placedBuildings`
    - `outpost_core_info.accountsWithEditPermission`
    - `outpost_core_info.highestEnduranceWaveReached`
    - `cloud_save_info.savedRecords[].recordFilename`, que da el `saveFile`.
  - `level` = atributo `level` del objeto. [INFERIDO]
  - `amplifierCount` sale de `placedBuildings`; falta ver si filtra por tipo.
    [INFERIDO]
  - `zoneId` = el templateId sin `outpostcore_`, validado con `^pve_\d{2}$`.
- Los nombres de los editores se resuelven en lote con
  `account-public-service …/account/api/public/account?accountId=…`.
  [CONFIRMADO]
- No usa `campaign` ni `outpost0`; `outpost0` es el almacén. [CONFIRMADO]

## 2. Escaneo de la base

**Canal IPC** [CONFIRMADO]

- `outpost:base-data(saveFile)` devuelve:
  - `structures`: `walls`, `floors`, `stairs`, `cones`, `other` y `total`,
    más `materials` opcional, con `wood`, `stone` y `metal`.
  - `traps`: lista de `{ displayName, iconFile, count }`.
  - `totalTraps`, `warning` y `layout`.

**Origen del archivo**

- El backend descarga el guardado de
  `…/fortnite/api/cloudstorage/user`. [CONFIRMADO]
- Ruta exacta, probablemente `/user/{accountId}/{recordFilename}`.
  [INFERIDO]
- Mensajes de error que usa: "No save file" y "No save file available for
  this zone".

**Formato del archivo**

- El aviso habla de una "database" sin datos de estructuras. Puede ser SQLite
  u otro formato. [INFERIDO]
- **Hay que confirmarlo con un archivo real del usuario** antes de escribir
  el SPEC de esta parte.

**Interfaz** [CONFIRMADO]

- Estados por zona:
  - Escaneando.
  - Error, con "Reintentar".
  - Sin `saveFile`.
  - Sin escanear, con "Escanear base".
  - Con aviso, con "Volver a escanear".
  - Escaneada.
- Vista escaneada:
  - Cuadrícula de trampas con icono y cantidad.
  - Panel plegable de estructuras, que se abre solo tras un escaneo correcto.
  - Botón 3D si hay `layout`.
- "Escanear todas": recorre una a una las zonas que tienen guardado. Solo se
  muestra si queda alguna sin escanear.
- Las cachés están en memoria y no se guardan.
- Al cambiar de cuenta, se limpian, se cierra el 3D y se recarga.

## 3. Formato `layout` y escena 3D (referencia para uno propio)

**Formato `layout`** [CONFIRMADO]

- `cell`: tamaño de celda, 512 por defecto.
- `bounds`: `{ minX, minY, minZ, maxX, maxY, maxZ }`, en celdas.
- `shapes[]`, `trapNames[]` y `propNames[]`: tablas de texto a las que apuntan
  los índices.
- `structures`: `[x, y, z, material, kind, yaw, shapeIndex, upgradeTier]`.
  - `kind`: 0 suelo, 1 pared, 2 escalera, 3 techo.
  - `yaw`: en cuartos de vuelta.
- `traps`: `[x, y, z, category, trapNameIndex, yaw]`.
  - `category`: 1 pared, 2 techo, resto suelo.
- `props`: se normalizan pero no se dibujan.

**Escena** [CONFIRMADO]

- Motor: three.js con OrbitControls.
  - Instancias agrupadas por forma, tipo, material y tier.
  - Trampas como planos con su icono, orientados según la categoría.
- Medidas y ejes:
  - Altura por piso: 0,75 unidades.
  - Ejes: escena = (y − cy, z − minZ, −(x − cx)).
- Controles:
  - Orbitar, zoom y desplazar con Mayús.
  - Botón para reiniciar la cámara.
  - Control deslizante por pisos; la última posición muestra todos.
  - Pantalla completa.
- Si no hay aceleración por GPU, muestra un aviso.

**Fuera de alcance: depende de GLOW o son datos suyos**

- Visor remoto: `outpost:open-remote-viewer` y
  `glowhaven.site/api/glow/homebase-viewer/v1/*`, firmado con HMAC.
- Bóveda cifrada de terreno: `outpost:prepare-homebase-assets`,
  `homebase-vault-status`, `read-homebase-asset` y `get-zone-terrain`.
- Sus datos de terreno y colisión: `outpost-zones/*.json`, `twine/terrain.json`,
  `build-collision.json` y los colores de bioma.

Para Aerial, si se hace 3D:

- Terreno plano y geometría propia sencilla (cajas para suelos, paredes y
  escaleras).
- Añadir `three` como dependencia.

## 4. Lo que Aerial ya tiene

- `src/services/endpoints/mcp.ts`:
  - Ya hay `getQueryProfile*`.
  - Falta un `QueryProfile` con `profileId: 'metadata'`, con el mismo patrón
    sobre `baseGameService`.
- `src/services/endpoints/lookup.ts`:
  - `findUserByAccountId` es individual.
  - Falta la variante en lote (`?accountId=a&accountId=b`, hasta 100).
- **No existe** cliente de cloudstorage.
- Página relacionada: `src/routes/stw-operations/homebase-name/` (nombre de la
  Homebase), con `src/hooks/stw-operations/homebase-name.ts` y
  `src/types/services/mcp/homebase-name.d.ts`.
- Datos: `Traps` de STW-Datatables y `items.json` sirven para dar nombre e
  imagen a las trampas del guardado. No hay tablas públicas de outpost ni del
  Escudo Antitormentas.

## 5. Decisiones para el SPEC (preguntar al usuario)

**Fases**

1. Información de zona: nivel, oleada, amplificadores y permisos.
   Recomendado hacerla primero; es solo lectura y no tiene incógnitas.
2. Escaneo del guardado (recuento de estructuras y trampas). Requiere que el
   usuario aporte un archivo de guardado real, o un volcado de `metadata`,
   para estudiar el formato.
3. Visor 3D propio, opcional, con terreno plano.

**Ubicación:** página nueva en Operaciones STW, o integrada con "Nombre de la
Homebase".

**Datos de prueba:** pedir al usuario la respuesta de `QueryProfile metadata`
de su cuenta, sin tokens. Con ella se confirma la forma de `placedBuildings`,
`level` y `cloud_save_info`.
