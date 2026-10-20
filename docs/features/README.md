# Funciones de GLOW en Aerial: guía para continuar

Este documento sirve para retomar el trabajo desde una sesión nueva. Cada
función se desarrolla en su propia sesión; empieza leyendo esto y luego el
`NOTES.md` de la función que toque.

## 1. Contexto

- Repositorio: `ImPixeluwu/aerial-launcher`, fork de `FIZZCD/Aerial-Launcher`
  (base 1.12.4). Remotos: `origin` (el fork) y `fizzcd` (upstream).
- **Documentación (esta rama):** `notes/features`. Nunca se fusiona en
  `main`, para que el código público no contenga notas sobre GLOW.
- **Código:**
  - Cada función va en su propia rama, creada desde `main`.
  - Cada rama se cierra con un PR que solo incluye código.
  - Se fusiona con "Squash and merge".
- **Inventario:** PR ImPixeluwu/Aerial-Launcher#1.
- Objetivo: reimplementar en Aerial funciones que tiene GLOW Launcher 5.0.4
  (código cerrado, app Tauri) a partir de su **comportamiento**.

## 2. Reglas que no cambian

1. **No copiar código ni datos de GLOW.** Solo se documenta comportamiento,
   endpoints y formatos. Tampoco se reutilizan sus imágenes
   (`assets/stw-catalog/...`) ni sus datos de zonas o geometría de outpost.
2. **GLOW nunca se ejecuta.** Si hace falta mirar algo más, solo análisis
   estático (ver §7).
3. **Spec primero.** Cada función tiene `docs/features/<función>/SPEC.md`,
   escrito y subido **a esta rama** antes del código, con cada afirmación marcada como
   [CONFIRMADO], [INFERIDO], [DECISIÓN] o [DATOS]. Modelo:
   `docs/features/inventory/SPEC.md`.
4. Imágenes y datos del juego: solo de fuentes públicas (§5), con el commit
   fijado y el crédito en `src/routes/information/credits/route.tsx`.
5. Textos de interfaz en `en-US` y `es-419`; el resto de idiomas cae a inglés.
6. Las respuestas al usuario van en español.
7. Mensajes de commit en inglés, **sin líneas `Co-Authored-By` ni `Claude-Session`**. No se abre PR
   salvo que el usuario lo pida.
8. PR solo de código, sin mencionar a GLOW, fusionado con "Squash and merge".
   Al hacer squash, GitHub añade líneas `Co-authored-by` al mensaje; bórralas
   antes de confirmar.

## 3. Estado

| Función | Estado | Documentos |
|---|---|---|
| Visor de inventario | Hecho; PR ImPixeluwu/Aerial-Launcher#3 (squash) | `inventory/SPEC.md` |
| Catálogo de esquemas | Pendiente | `schematics/NOTES.md` |
| Visor de Homebase | Pendiente | `homebase/NOTES.md` |
| Libro de colección | Pendiente | `collection-book/NOTES.md` |
| Amigos y grupo | Pendiente | `friends-party/NOTES.md` |

Los `NOTES.md` recogen lo que se vio en la interfaz de GLOW mientras los
fragmentos extraídos estaban disponibles, más lo que Aerial ya tiene. Son la
materia prima del SPEC, no el SPEC.

## 4. Cómo se añade una página (plantilla: inventario)

| Pieza | Archivo del inventario |
|---|---|
| Petición MCP a Epic | `src/services/endpoints/mcp.ts` (`getQueryProfileInventory`) |
| Lógica pura (parseo, agrupación) | `src/lib/parsers/inventory.ts` |
| Datos del juego y cálculos | `src/lib/parsers/stw-items.ts`, `src/data/stw/` |
| Tests | `src/lib/parsers/inventory.test.ts` (vitest) |
| Tipos | `src/types/inventory.d.ts` |
| Constantes compartidas | `src/config/constants/inventory.ts` |
| Proceso principal | `src/kernel/core/inventory.ts` |
| Canal IPC | `ElectronAPIEventKeys` en `src/config/constants/main-process.ts`; `ipcMain.handle` en `src/kernel/main.ts` |
| Puente al renderer | `src/kernel/preload-actions/inventory.ts`, registrado en `src/kernel/preload.ts` |
| Página | `src/routes/stw-operations/inventory/route.tsx` y `-hooks.ts` |
| Ruta generada | `src/routeTree.gen.ts`, que se edita a mano porque el proyecto no usa el plugin de Vite del router |
| Barra lateral | `src/components/menu/sidebar.tsx` y `src/locales/*/sidebar.json` |
| Menú personalizable | `src/lib/validations/schemas/settings.ts`, `src/state/settings/customizable-menu.ts` y `src/routes/settings/-customizable-menu/-index.tsx` |
| Textos | `src/locales/{en-US,es-419}/stw-operations/<función>.json`, registrados en `src/locales/resources.ts` |

Pautas de la implementación del inventario:

- Las peticiones a Epic salen del proceso principal con el token de la cuenta.
  Si el token caduca, se renueva con `Authentication.verifyAccessToken`.
- Los datos del juego solo se cargan en el proceso principal; el renderer no
  los incluye.
- Se usa la cuenta activa de la cabecera, y al cambiarla se recarga.
- Toda la lógica que se pueda probar va en funciones puras de `src/lib/parsers/`.

**Aerial ya trae varias funciones relacionadas:** grupo (`stw-operations/party`),
nombre de la Homebase (`homebase-name`), almacén y XP boosts. Revisa lo que
hay antes de duplicarlo; `friends-party/NOTES.md` incluye una tabla de huecos.

## 5. Datos del juego

- **PegLegFN/PegLegResources**, rama `major`: nombres, imágenes, perks, rareza,
  tier y la tabla de PL.
- **archeruwu/STW-Datatables**: datatables extraídas del juego, como
  `MigrationMapping`, `RangedWeapons`, `MeleeWeapons`, `Traps` y
  `WeaponDurabilityRarity`.
- Ninguno de los dos repositorios tiene archivo de licencia. Se toma el
  subconjunto mínimo y las imágenes no se copian: se cargan desde
  `raw.githubusercontent.com` en el commit fijado, que la CSP ya permite.
- Los commits fijados están en `src/data/stw/source.json`.
- Regenerar los datos: clona los dos repositorios en el scratchpad y ejecuta
  `node scripts/generate-stw-data.mjs <PegLegResources> <STW-Datatables>`.
  Si una función nueva necesita más tablas, se amplía este script en vez de
  crear otro.
- Tablas de STW-Datatables que pueden servir:
  - `CraftingRecipes_New`, `DisassembleRecipes`: costes de fabricación y
    reciclaje (esquemas).
  - `SlotLoadouts`, `AlterationGroups`, `SlotDefs`: qué perks admite cada
    arma (esquemas).
  - `SurvivorItemRating`, `HeroData`, `HomebaseRatingMapping`: supervivientes,
    héroes y poder de la base (libro de colección, Homebase).

## 6. Verificación antes de cada push

```
npm ci                      # Node 22
npm test                    # vitest; ahora pasan 20 tests
npm run lint
npx tsc --noEmit -p tsconfig.json 2>&1 | grep -c 'error TS'   # base: 410
npx electron-forge package  # comprueba que compilan los tres bundles
```

- **`tsc`:** la base de FIZZCD ya trae 410 errores en 20 archivos. La regla es
  no añadir ninguno: compara el recuento y que no aparezca ningún archivo
  nuevo.
- **Vite por separado:** `vite build -c vite.renderer.config.ts` falla con
  "reading 'name'", también en la base. Usa `electron-forge package`.
- **Cuenta y Electron:** en la nube no hay cuenta de Epic ni sesión de Electron
  con la que probar. Las funciones se verifican con tests y build, y el
  usuario las prueba en su equipo.
- **Capturas de la interfaz:** se puede levantar Vite con un `preview.html`
  propio que monte la página con datos de ejemplo y fotografiarlo con el
  Chromium preinstalado (`/opt/pw-browsers/chromium`). Ese HTML y el script
  van en el scratchpad, nunca en el repositorio. `VITE_DEV_PORT` en
  `vite.renderer.config.ts` permite fijar el puerto.

## 7. Cómo volver a mirar GLOW (solo si los NOTES no bastan)

Una sesión nueva **no tiene** el instalador de GLOW ni los fragmentos
extraídos; habría que pedirle al usuario el instalador otra vez. Datos de la
muestra analizada:

- Instalador: SHA-256 `8840eff6e7b257c01997fde5dce657666b730c245df4ed6fa3c0734a6e599c4b`.
- Ejecutable: `GLOW Launcher.exe`, SHA-256 `a18f9b57145ce2a7e9eb3201ce759bc5360437686e620e2f5cbe37fd1ce78d47`.

Método, sin ejecutar nada de la muestra:

1. Desempaquetar con `7z x` las capas del instalador. El NSIS contiene
   `app-64.7z` y, dentro, el ejecutable.
2. La interfaz va dentro del `.exe` como JavaScript sin minificar, con
   comentarios `// src/...` por archivo fuente: son 111 fragmentos.
3. Para extraerlos, un script de Python (`python3 -I`) busca en los bytes del
   `.exe` el patrón `<nombre>.js` seguido del inicio de un módulo (`import `,
   `var `, `//`…). Cada fragmento va desde ahí hasta el siguiente byte NUL.
4. Escribir los fragmentos en un directorio propio del scratchpad y leerlos
   solo como texto.
5. El lado Rust (`crates/glow-*`) no se pudo decompilar: Ghidra se quedó sin
   memoria. Lo que hace solo se puede inferir de los nombres de los canales
   IPC y de los endpoints públicos de Epic.

**No replicar** nada que dependa del servidor de GLOW (`glowhaven.site`). Por
ejemplo, el visor remoto de la Homebase (`/api/glow/homebase-viewer/v1/*`) o
los loadouts de la comunidad (`/api/glow/community-loadouts`).

## 8. Mensaje para abrir una sesión nueva

Los mensajes completos de cada función están en `docs/features/PROMPTS.md`.
