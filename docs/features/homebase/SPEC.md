# SPEC — Visor de Homebase (Escudo Antitormentas) de Salvar el Mundo

Estado: v1 · **Descartado** (fase 1 implementada y guardada, §10) · Alcance: solo lectura (no modifica el perfil del
jugador).

Este documento describe **comportamiento**, no código. Parte de
`homebase/NOTES.md` (lectura estática de la página "Outpost Info" de GLOW
Launcher 5.0.4, sin ejecutar el binario), de la API de perfiles MCP de Epic que
Aerial ya usa y de una respuesta real de `QueryProfile metadata` aportada por
el usuario. No se copia código, datos ni imágenes de GLOW. Cada afirmación
lleva su origen:

- **[CONFIRMADO]**: visto en el frontend de GLOW o en código de Aerial que ya
  funciona contra Epic.
- **[INFERIDO]**: deducido; GLOW lo calcula en su lado Rust, que no se pudo
  decompilar.
- **[DECISIÓN]**: elección propia de esta implementación (las del usuario se
  indican).
- **[DATOS]**: comprobado contra la respuesta real de `QueryProfile metadata`
  del usuario (§2.1).

## 0. Decisiones del usuario

| # | Pregunta (NOTES §5) | Respuesta |
|---|---|---|
| 1 | Fases | **Fase 1**: información de cada zona. Escaneo del guardado (fase 2) y visor 3D (fase 3) quedan fuera, con su propio SPEC. |
| 2 | Ubicación | **Página propia** en Operaciones STW, separada de "Nombre de la Homebase". |
| 3 | Cuenta | **Cuenta activa** de la cabecera; al cambiarla se recarga. |
| 4 | Orden de pestañas | **Stonewood → Plankerton → Canny Valley → Twine Peaks** (al revés que GLOW), con los nombres, colores y letras de zona que Aerial ya tiene. Sin iconos nuevos. |
| 5 | Amplificadores | Se decide con el perfil real: ver §3.3. |
| 6 | Permisos de edición | Nombres resueltos en lote; si no se resuelve, solo el id. **Sin botón de copiar.** |
| 7 | `saveFile` | Se lee y se tipa, pero **no se muestra** hasta la fase 2. |

Fuera de alcance siempre: el visor remoto de GLOW y sus datos de terreno
(NOTES §3).

## 1. Qué hace

Muestra, para **una** cuenta, el estado del Escudo Antitormentas de cada una
de las cuatro zonas de la campaña: nivel, oleada máxima de resistencia,
amplificadores colocados y cuentas con permiso de edición.

## 2. Origen de los datos

Petición (misma forma que las consultas MCP existentes de Aerial)
[CONFIRMADO + DATOS]:

```
POST {baseGame}/profile/{accountId}/client/QueryProfile?profileId=metadata&rvn=-1
Authorization: bearer {accessToken}
Body: {}
```

El perfil es `metadata` [DATOS; NOTES lo daba como INFERIDO]. No se usan
`campaign` ni `outpost0` (este último es el almacén) [CONFIRMADO].

Los objetos están en `profileChanges[0].profile.items`, un mapa
`itemId → { templateId, attributes, quantity }`.

### 2.1 Forma real de un núcleo de zona [DATOS]

```
"<itemId>": {
  "templateId": "Outpost:outpostcore_pve_01",
  "attributes": {
    "cloud_save_info": {
      "saveCount": 68,
      "savedRecords": [
        { "recordFilename": "<itemId>_r0_a0.sav", "recordIndex": 0, "archiveNumber": 0 }
      ]
    },
    "level": 6,
    "outpost_core_info": {
      "accountsWithEditPermission": ["<accountId>"],
      "highestEnduranceWaveReached": 0,
      "placedBuildings": [
        { "buildingTag": "Outpost.BuildingActor.Building.00",
          "placedTag":   "Outpost.PlacementActor.Placement.00" },
        …
      ]
    }
  },
  "quantity": 1
}
```

Observado en el perfil del usuario:

- Solo existen `pve_01` y `pve_02`: **una zona sin desbloquear no tiene
  objeto** en el perfil.
- `level` está en `attributes.level` (6 y 4) [DATOS; NOTES: INFERIDO].
- `accountsWithEditPermission` es una lista de ids de cuenta (cadenas).
- `placedBuildings` es una lista de pares `buildingTag`/`placedTag`, sin tipo
  de edificio (§3.3).
- `recordFilename` = `<itemId>_r<recordIndex>_a<archiveNumber>.sav`.

## 3. Interpretación

### 3.1 Zona

- Se toman los objetos cuyo `templateId`, sin distinguir mayúsculas, es
  `Outpost:outpostcore_<zoneId>` con `zoneId` válido según `^pve_\d{2}$`
  [CONFIRMADO]. Solo se muestran `pve_01`…`pve_04`; cualquier otro se ignora
  [DECISIÓN].
- `pve_01` Stonewood, `pve_02` Plankerton, `pve_03` Canny Valley, `pve_04`
  Twine Peaks [CONFIRMADO, NOTES §1].
- Si hubiera dos objetos para la misma zona, se usa el primero [DECISIÓN].
- Las cuatro zonas aparecen siempre; las que no tienen objeto se marcan como
  **sin desbloquear** [DECISIÓN, a partir de los DATOS].

### 3.2 Nivel y oleada

- Nivel del Escudo Antitormentas = `attributes.level`, sobre 10 [DATOS +
  CONFIRMADO]. Si falta → sin dato ("—").
- Oleada máxima de resistencia =
  `outpost_core_info.highestEnduranceWaveReached`, sobre 30 [CONFIRMADO +
  DATOS]. Si falta → 0.
- Las casillas se rellenan con el valor limitado a 0…10 y 0…30; el número
  mostrado es el del perfil [DECISIÓN].

### 3.3 Amplificadores

`placedBuildings` no indica el tipo de edificio: cada entrada es un edificio
(`Building.NN`) colocado en un hueco (`Placement.NN`) [DATOS]. En la Homebase
lo único que se coloca en esos huecos son los amplificadores, así que:

- `amplifierCount` = número de entradas de `placedBuildings` con `buildingTag`
  [INFERIDO + DECISIÓN]. Si falta la lista → 0.
- **Pendiente de comprobar en el juego:** el perfil del usuario da 3 en
  Stonewood y 3 en Plankerton.

### 3.4 Permisos de edición

- Ids de `outpost_core_info.accountsWithEditPermission`, sin repetidos y en
  el orden del perfil [DATOS + DECISIÓN].
- Los nombres se resuelven en una sola pasada para todas las zonas
  [CONFIRMADO, NOTES §1]:

  ```
  GET {accountPublic}/account/api/public/account?accountId=a&accountId=b…
  Authorization: bearer {accessToken}
  ```

  En bloques de 100 ids como máximo [DECISIÓN]. Respuesta: lista de
  `{ id, displayName }`.
- Si la búsqueda falla o una cuenta no aparece, se muestra solo su id; la
  página no da error por ello [DECISIÓN].
- Sin botón de copiar [DECISIÓN del usuario].

### 3.5 Archivo de guardado

`saveFile` = `recordFilename` de la entrada de `cloud_save_info.savedRecords`
con menor `recordIndex`; `null` si no hay [DATOS + DECISIÓN]. No se muestra en
la fase 1 [DECISIÓN del usuario]; lo usará el escaneo de la fase 2.

## 4. Modelo de datos que devuelve el proceso principal

```
HomebaseOverview {
  success: boolean
  error?: string
  zones: HomebaseZone[]        // siempre 4, en el orden de §0.4
}

HomebaseZone {
  zoneId: 'pve_01' | 'pve_02' | 'pve_03' | 'pve_04'
  unlocked: boolean            // hay objeto en el perfil
  level: number | null         // attributes.level
  highestEnduranceWave: number
  amplifierCount: number
  editPermissions: { accountId: string, displayName: string | null }[]
  saveFile: string | null
}
```

Constantes: `homebaseMaxLevel = 10`, `homebaseMaxEnduranceWave = 30`.

## 5. Interfaz

- Ruta `/stw-operations/homebase`, con entrada en la barra lateral bajo
  "Operaciones STW" y opción en el menú personalizable (`homebase`)
  [DECISIÓN]. Etiqueta: "Homebase Overview" / "Resumen de la Homebase".
- Usa la cuenta activa de Aerial; no hay selector propio [DECISIÓN del
  usuario].
- Pestañas, una por zona, en el orden de §0.4, con la letra y el color de la
  zona. Las zonas sin desbloquear tienen la pestaña atenuada [DECISIÓN].
- Panel de zona [CONFIRMADO, NOTES §1, salvo lo indicado]:
  - Nombre de la zona e id (`pve_01`).
  - Nivel del Escudo Antitormentas: `n / 10`, con 10 casillas.
  - Oleada máxima de resistencia: `n / 30`, con 30 casillas.
  - Amplificadores colocados: número.
  - "Permisos de edición (n)": nombre y id de cada cuenta; si no hay,
    "Nadie más puede editar esta base".
  - Zona sin desbloquear: mensaje "Aún no has desbloqueado el Escudo
    Antitormentas de esta zona" [DECISIÓN].
- Botón "Recargar" [DECISIÓN].
- Estados: cargando, error (con el mensaje) [CONFIRMADO].
- Al cambiar de cuenta se recarga y se vuelve a la primera pestaña
  [CONFIRMADO].

## 6. Diferencias con GLOW y lo que no se sabe

- Orden de pestañas invertido (§0.4) y sin botón de copiar (§0.6).
- GLOW solo pinta las zonas que devuelve; aquí aparecen las cuatro (§3.1).
- Punto verde de "escaneada" y todo lo de la fase 2: no aplica.
- Regla exacta de GLOW para `amplifierCount`: desconocida (§3.3).

## 7. Casos límite

- Cuenta sin acceso a STW o perfil vacío → cuatro zonas sin desbloquear, sin
  error.
- Token caducado → se renueva con `Authentication.verifyAccessToken`; si
  falla, error "No se pudo autenticar la cuenta".
- Error de red o de Epic en `QueryProfile` → `success: false` con el
  `errorMessage` de Epic si existe.
- Error en la búsqueda de nombres → se muestran los ids (§3.4).
- Atributos ausentes o de otro tipo → valores por defecto de §3 (nunca
  excepción).

## 8. Pruebas de aceptación

Con el perfil real del usuario, con los ids de cuenta anonimizados:

1. Cuatro zonas en el orden `pve_01`, `pve_02`, `pve_03`, `pve_04`.
2. `pve_01`: desbloqueada, nivel 6, oleada 0, 3 amplificadores, 1 cuenta con
   permiso, `saveFile` `<itemId>_r0_a0.sav`.
3. `pve_02`: nivel 4, `saveFile` `<itemId>_r0_a1.sav`.
4. `pve_03` y `pve_04`: sin desbloquear, nivel `null`, 0 amplificadores, sin
   permisos ni `saveFile`.

Casos sintéticos:

5. `templateId` en mayúsculas → se reconoce; `outpostcore_pve_5`,
   `outpostcore_pve_05` y `Outpost:other` → se ignoran.
6. Atributos ausentes → nivel `null`, oleada 0, 0 amplificadores, sin
   permisos, `saveFile` `null`.
7. Varios `savedRecords` → el de menor `recordIndex`.
8. Ids de permiso repetidos → una sola vez.
9. Nombres: los resueltos se asignan por id; los no encontrados quedan en
   `null`.
10. 150 ids → dos peticiones de nombres (100 + 50).

## 9. Implementación en Aerial

| Pieza | Archivo |
|---|---|
| Petición MCP | `src/services/endpoints/mcp.ts` → `getQueryProfileMetadata` |
| Nombres en lote | `src/services/endpoints/lookup.ts` → `findUsersByAccountIds` |
| Interpretación (§3, puro) | `src/lib/parsers/homebase.ts` |
| Pruebas de §8 | `src/lib/parsers/homebase.test.ts` (`npm test`) |
| Tipos | `src/types/homebase.d.ts` |
| Constantes | `src/config/constants/homebase.ts` |
| Proceso principal | `src/kernel/core/homebase.ts`, `ipcMain.handle('homebase:get-overview')` en `src/kernel/main.ts` |
| Puente al renderer | `src/kernel/preload-actions/homebase.ts` → `window.electronAPI.getHomebaseOverview` |
| Página | `src/routes/stw-operations/homebase/` |
| Menú | barra lateral, menú personalizable (`homebase`), `routeTree.gen.ts` |
| Textos | `src/locales/{en-US,es-419}/stw-operations/homebase.json`; el resto de idiomas cae a inglés |

No hacen falta datos del juego nuevos: nombres y colores de zona ya están en
Aerial (`zones.json`, `world-info.ts`).

## 10. Estado: descartado, implementación guardada

[DECISIÓN del usuario] La función se descartó después de implementar y
verificar la fase 1, y la rama de código se borró. La implementación
completa está guardada en `homebase/phase1-implementation.patch`, generado
con `git format-patch` sobre `main` en `96a46d8` ("Add Save the World
schematics catalog").

Lo que se verificó antes de descartarla:

- `npm test`: 51 tests pasan, 9 de ellos de `homebase.test.ts`.
- `npm run lint`: limpio.
- `tsc`: 410 errores, igual que la base, ninguno en archivos nuevos.
- `npx electron-forge package`: compila los tres bundles.
- Capturas en el preview con datos de ejemplo, en `en-US` y `es-419`.

**No se llegó a probar con una cuenta real.** Lo primero que hay que
comprobar en el juego es el número de amplificadores (§3.3).

**Cómo retomarla:**

```
git fetch origin main
git checkout -b <rama nueva> origin/main
git am docs/features/homebase/phase1-implementation.patch   # desde una copia de notes/features
```

Si `main` ha avanzado y el parche no aplica limpio, usa
`git am -3`. Los conflictos más probables están en los archivos que
comparten todas las páginas: `routeTree.gen.ts`, `sidebar.tsx`,
`resources.ts`, el menú personalizable, `main.ts` y `preload.ts`.
Después, repite la verificación de la §6 de la guía.
