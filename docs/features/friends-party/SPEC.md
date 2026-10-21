# SPEC: Amigos de Epic y ampliación de Grupo

Estado: v1 · Alcance: **modifica la cuenta** (amistades, bloqueos y grupo).

Este documento describe **comportamiento**, no código. Parte de las notas
de `friends-party/NOTES.md`, que salen de leer de forma estática la interfaz
de GLOW Launcher 5.0.4, de los endpoints que Aerial ya usa y de la librería
`fnbr`, que ya es dependencia de Aerial y habla con los mismos servicios de
Epic. No se copia código ni datos de GLOW. Cada afirmación lleva su origen:

- **[CONFIRMADO]:** visto en el frontend de GLOW, en código de Aerial que ya
  funciona contra Epic o en `fnbr` (`node_modules/fnbr/dist`).
- **[INFERIDO]:** deducido. GLOW lo hace en su lado Rust, que no se pudo
  decompilar.
- **[DECISIÓN]:** elección de esta implementación. "del usuario" indica que
  la tomó el usuario (§5 de NOTES).

## 1. Qué hace

1. **Amigos:** una página nueva que muestra, para la cuenta activa, las
   amistades de Epic, las solicitudes recibidas y enviadas y los bloqueados.
   Permite añadir, aceptar, rechazar, cancelar, quitar, bloquear y
   desbloquear, una a una o en bloque.
2. **Grupo:** la página actual (`/stw-operations/party`) gana una tarjeta de
   estado del grupo de la cuenta activa con miembros, líder y privacidad, y
   acciones de líder: expulsar a un miembro, promover, alternar privacidad y
   arreglar invitación.

**No es** la lista de "friends" del grupo actual: esa es una **lista local de
invitados** (`DataDirectory.getFriendsFile`) y no se toca [CONFIRMADO].

## 2. Decisiones del usuario

| # | Decisión |
|---|---|
| 1 | Amigos es una página nueva en "Gestión de cuenta": `/account-management/friends`. |
| 2 | El código nuevo usa IPC `invoke`/`handle` con respuesta `{ success, error?, … }`, como el inventario. Los canales `send` + notificación del grupo actual no se tocan. |
| 3 | `partyKick` y `partyLeave` **siguen en `false`** (§7). Expulsar a un miembro desde la tarjeta nueva también depende de `partyKick`. |
| 4 | En Grupo se añade: estado del grupo con reintento, expulsar uno y promover, y privacidad (alternar y arreglar invitación). **No** se añade "unirse con autocompletado". |

## 3. Endpoints de Epic

Todas las peticiones salen del proceso principal con el token de la cuenta
activa, renovado con `Authentication.verifyAccessToken` [CONFIRMADO, patrón
del inventario].

### 3.1 Amigos

Base `friends-public-service-prod.ol.epicgames.com`.

| Uso | Petición | Origen |
|---|---|---|
| Resumen | `GET /friends/api/v1/{me}/summary` | [CONFIRMADO] `fnbr` `Client.js` |
| Añadir o aceptar | `POST /friends/api/v1/{me}/friends/{id}` | [CONFIRMADO] Aerial `addFriend` |
| Quitar, rechazar o cancelar | `DELETE /friends/api/v1/{me}/friends/{id}` | [CONFIRMADO] Aerial `removeFriend`, `fnbr` `FRIEND_DELETE` |
| Bloquear | `POST /friends/api/public/blocklist/{me}/{id}` | [CONFIRMADO] `fnbr` `FRIEND_BLOCK` |
| Desbloquear | `DELETE /friends/api/public/blocklist/{me}/{id}` | [CONFIRMADO] `fnbr` `FRIEND_BLOCK` |

Respuesta del resumen [CONFIRMADO para los campos que se usan, que también
lee `fnbr`]:

```
{
  friends:   [{ accountId, alias?, created?, favorite?, mutual? }],
  incoming:  [{ accountId, created?, mutual? }],
  outgoing:  [{ accountId, created? }],
  blocklist: [{ accountId }],
  …
}
```

El resumen no trae nombres. Se piden a account-public-service en lotes de
**100** [CONFIRMADO, `fnbr` `UserManager.js`]:

```
GET /account/api/public/account?accountId=a&accountId=b…
```

La query se construye a mano. Axios, por defecto, serializaría un array
como `accountId[]=` [DECISIÓN].

**Quitar todos los amigos**: GLOW usa una llamada masiva
(`DELETE /friends/api/v1/{me}/friends`) [INFERIDO]. Esta implementación
**no** la usa porque no está confirmada. Hace lo mismo que con rechazar y
cancelar todos: un bucle por ID [DECISIÓN].

### 3.2 Grupo

Base `party-service-prod.ol.epicgames.com/party/api/v1/Fortnite`.

| Uso | Petición | Origen |
|---|---|---|
| Grupo actual | `GET /user/{me}` → `current[0]` | [CONFIRMADO] Aerial `fetchParty` |
| Expulsar | `DELETE /parties/{pid}/members/{id}` | [CONFIRMADO] Aerial `kick` |
| Promover | `POST /parties/{pid}/members/{id}/promote` | [CONFIRMADO] `fnbr` `ClientParty.promote` |
| Privacidad | `PATCH /parties/{pid}` | [CONFIRMADO] `fnbr` `ClientParty.sendPatch` |

Cuerpo del `PATCH` de privacidad [CONFIRMADO, `fnbr` `sendPatch` y
`setPrivacy` con `PartyPrivacy.PUBLIC` / `PRIVATE`]:

```
{
  config: { join_confirmation, joinability, max_size, discoverability },
  meta: { delete: [...], update: { ... } },
  party_state_overridden: {},
  party_privacy_type: joinability,
  party_type: config.type,
  party_sub_type: config.sub_type,
  max_number_of_members: config.max_size,
  invite_ttl_seconds: config.invite_ttl,
  revision: party.revision
}
```

| Campo | Público | Privado |
|---|---|---|
| `config.joinability` | `OPEN` | `INVITE_AND_FORMER` |
| `config.discoverability` | `ALL` | `INVITED_ONLY` |
| `Default:PrivacySettings_j` (JSON en texto; se conservan los demás campos) | `partyType: Public`, `partyInviteRestriction: AnyMember`, `bOnlyLeaderFriendsCanJoin: false` | `partyType: Private`, `partyInviteRestriction: LeaderOnly`, `bOnlyLeaderFriendsCanJoin: true` |
| `urn:epic:cfg:presence-perm_s` | `Anyone` | `Noone` |
| `urn:epic:cfg:accepting-members_b` | `true` | `false` |
| `urn:epic:cfg:invite-perm_s` | `Anyone` | `Leader` |
| `urn:epic:cfg:not-accepting-members-reason_i` | se borra (`meta.delete`) | `7` |
| `meta.delete` | `urn:epic:cfg:not-accepting-members-reason_i` | `urn:epic:cfg:not-accepting-members` |

- Todos los valores de `meta.update` van como texto [CONFIRMADO, `fnbr`
  `Meta.set`].
- Si Epic responde `errors.com.epicgames.social.party.stale_revision`, se
  toma la revisión de `messageVars[1]` y se reintenta **una** vez
  [CONFIRMADO, `fnbr`].
- `party_change_forbidden` se traduce como "no eres el líder".
- La privacidad actual se lee de `config.joinability`: `OPEN` es público y
  cualquier otro valor es privado [CONFIRMADO, NOTES §2].

**Nombres de los miembros**: se usa `meta['urn:epic:member:dn_s']` de cada
miembro [CONFIRMADO, `fnbr`]. Los que no lo traen se piden en lote como en
§3.1.

## 4. Modelo de datos (proceso principal → renderer)

```
FriendsEntry { accountId, displayName, created: string | null, mutual: number | null }

FriendsSummary {
  success, error?
  friends: FriendsEntry[]
  incoming: FriendsEntry[]
  outgoing: FriendsEntry[]
  blocked: FriendsEntry[]
}

FriendsActionType = 'add' | 'accept' | 'reject' | 'cancel' | 'remove' | 'block' | 'unblock'
FriendsActionResponse { success, error?, accountId?, displayName? }

PartyMemberInfo { accountId, displayName, isLeader, joinedAt }
PartyInfo {
  success, error?
  party: null | { partyId, size, maxSize, isPrivate, members: PartyMemberInfo[] }
  isLeader          // la cuenta activa es líder
}
PartyActionResponse { success, error? }
```

- `party: null` con `success: true` significa que la cuenta no está en ningún
  grupo [DECISIÓN].
- Las listas vienen ordenadas por nombre, sin distinguir mayúsculas
  (`localeCompareForSorting`) [DECISIÓN]. Los miembros del grupo, con el líder
  primero y después por fecha de entrada.

## 5. Lógica pura (`src/lib/parsers/friends.ts`, `party-info.ts`)

- `normalizeFriendsSummary(summary, names)` → `FriendsSummary`.
  - Quita duplicados por `accountId` dentro de cada lista y descarta las
    entradas sin `accountId`.
- `getFriendDisplayName(accountId, displayName)` → "Player" si el nombre está
  vacío, es igual al ID o es un hex de 32 caracteres [CONFIRMADO, regla de
  GLOW]. "Player" se traduce en la interfaz.
- `chunk(ids, 100)` para los lotes de nombres.
- `filterFriends(entries, query)` → filtro por nombre o ID sin distinguir
  mayúsculas. Se recorta el texto, y si queda vacío devuelve la lista
  [CONFIRMADO].
- `parsePartyInfo(party, me, names)` → `PartyInfo['party']`.
- `buildPartyPrivacyPatch(party, makePrivate)` → cuerpo del §3.2.
- `isFriendsAccountId(value)` → `/^[0-9a-f]{32}$/i`.

## 6. Interfaz

### 6.1 Amigos (`/account-management/friends`)

- Entrada en la barra lateral bajo "Gestión de cuenta" y opción en el menú
  personalizable (`friends`) [DECISIÓN, igual que el inventario].
- Usa la cuenta activa de la cabecera. Al cambiarla se vacía la búsqueda y se
  recarga [CONFIRMADO].
- **Pestañas** con contador: Amigos, Recibidas, Enviadas y Bloqueados. La de
  Bloqueados es una [DECISIÓN] propia; GLOW no la tiene. Sin ella, quien
  bloquea desde Aerial no podría deshacerlo. Al cambiar de pestaña se vacía
  la búsqueda [CONFIRMADO].
- **Búsqueda** local por nombre o ID con 150 ms de espera y botón para
  limpiarla [CONFIRMADO]. Contador "N de M".
- **Lista virtualizada** con `@tanstack/react-virtual`, con filas de altura
  fija y el scroll en `.main-wrapper-content`, como en la cuadrícula de
  esquemas [DECISIÓN].
- Las filas muestran el nombre, el ID (seleccionable) y un botón para copiarlo.
  **No hay avatares** en esta versión: necesitarían avatar-service y abrir su
  CDN en la CSP [DECISIÓN].
- **Acciones por fila** [CONFIRMADO salvo lo indicado]:

  | Pestaña | Acciones | Confirmación [DECISIÓN] |
  |---|---|---|
  | Amigos | Quitar, Bloquear | Las dos |
  | Recibidas | Aceptar, Rechazar | Rechazar |
  | Enviadas | Cancelar | Sí |
  | Bloqueados | Desbloquear | No |

  GLOW no pide confirmación para quitar. Aquí sí, porque es destructiva
  [DECISIÓN].
- Mientras se ejecuta una acción, la fila muestra un spinner y no se admite
  otra acción a la vez [CONFIRMADO]. Si va bien, la entrada se mueve o se
  quita de la lista **sin recargar** [CONFIRMADO]:
  - Aceptar pasa la entrada de Recibidas a Amigos.
  - Bloquear la quita de Amigos, Recibidas y Enviadas y la pone en
    Bloqueados.
  - El resto la quitan de su lista.
- **Añadir amigo**: campo "nombre o ID de cuenta" que se envía con Enter o con
  el botón [CONFIRMADO]. El proceso principal resuelve el texto con
  `LookupManager.searchUserByDisplayName`, que ya acepta ID, nombre de Epic
  o nombre de PSN/Xbox [CONFIRMADO, Aerial]. Si va bien: "Solicitud enviada a
  X", se vacía el campo y se recarga [CONFIRMADO]. Si es tu propia cuenta,
  da error sin llamar a Epic [DECISIÓN].
- **Acciones masivas**: todas piden confirmación con el número de entradas
  [DECISIÓN del usuario: confirmar las masivas].

  | Acción | Pestaña | Cómo |
  |---|---|---|
  | Quitar todos | Amigos | Bucle por ID (§3.1) |
  | Aceptar todas | Recibidas | Bucle por ID |
  | Rechazar todas | Recibidas | Bucle por ID |
  | Cancelar todas | Enviadas | Bucle por ID |

  - El bucle lo lleva el renderer, con una llamada `invoke` por ID y **1 s
    entre llamadas** [CONFIRMADO para rechazar y cancelar].
  - Se aplica a la lista completa de la pestaña, no al resultado de la
    búsqueda [DECISIÓN]. El diálogo lo dice.
  - Barra de progreso `actual/total` con botón **Detener**, que termina
    después de la llamada en curso [DECISIÓN].
  - Al acabar: "N de M hechas" con el número de fallos [DECISIÓN; GLOW los
    ignora]. Después se recarga el resumen.
  - Mientras dura el bucle, las demás acciones, el cambio de pestaña y la
    recarga quedan desactivados. Si se cambia de cuenta, el bucle se detiene
    [DECISIÓN].
- **Mensajes**: aviso de éxito o error con el mensaje de Epic
  (`errorMessage`), mediante los toasts de Aerial (`sonner`) [DECISIÓN].
- **Estados**: cargando, error con botón de reintentar, lista vacía con un
  mensaje distinto por pestaña y "sin resultados" de búsqueda [CONFIRMADO].
- No hay polling; se recarga a mano y después de cada acción masiva
  [CONFIRMADO].

### 6.2 Grupo (`/stw-operations/party`, tarjeta nueva arriba)

- Las tarjetas actuales (expulsar a todos, reclamar, salir e invitar) **no se
  modifican** [DECISIÓN del usuario].
- La tarjeta nueva usa la cuenta activa de la cabecera, no los selectores
  multicuenta de las demás tarjetas, y se relee al cambiarla [CONFIRMADO].
- **Estado**: cargando, sin grupo, error y listo [CONFIRMADO].
  - En listo: "Grupo · N/max miembro(s) · Privado/Público", botón de
    refrescar y un chip por miembro. El chip del líder lleva corona y la
    cuenta activa va marcada como "tú".
  - Sin grupo o con error: se reintenta cada **10 s** con una cuenta atrás
    visible y se para al encontrar un grupo o al salir de la página
    [CONFIRMADO]. El error `party not found` se traduce [CONFIRMADO].
- **Acciones de líder**. Si la cuenta activa no es líder, quedan desactivadas
  con el texto "Solo el líder puede…" [DECISIÓN].
  - **Miembro**: un desplegable con los miembros salvo uno mismo. Si no hay
    miembros, muestra "No hay otros miembros" [CONFIRMADO].
  - **Promover**: pide confirmación porque pierdes el liderazgo [DECISIÓN].
  - **Expulsar**: pide confirmación. Mientras `partyKick` sea `false`, el
    botón se muestra desactivado con "Temporalmente no disponible" (el texto
    existente `general:feature-unavailable`), y el proceso principal también
    lo rechaza [DECISIÓN del usuario].
  - **Privacidad**: un interruptor Público/Privado [CONFIRMADO].
  - **Arreglar invitación**: cambia a la privacidad contraria, espera 5 s y
    restaura la original, leyendo antes la revisión nueva [CONFIRMADO texto,
    INFERIDO implementación]. El botón queda ocupado durante los 5 s.
  - Cada acción muestra su propio spinner, y el resultado sale en un toast.
    Después se relee el grupo [CONFIRMADO].
- Salir del grupo no aparece en la tarjeta nueva: ya está en "Salir del
  grupo", controlado por `partyLeave` [DECISIÓN].

## 7. Flags `partyKick` y `partyLeave`

Por qué están en `false` [CONFIRMADO, historial de `FIZZCD/Aerial-Launcher`]:

- Los añadió el commit `85c89da` ("Release 1.12.4 community maintenance
  update", 2026-09-12). Ese mismo commit crea
  `feature-availability.ts`, con `partyKick`, `partyLeave` y `taxiService`
  en `false`, y aplica el bloqueo en la interfaz y en el proceso principal,
  auto-kick incluido.
- Ni el `CHANGELOG.md` ni la release v1.12.4 dan un motivo. Solo dicen:
  "Temporarily disabled Kick, Taxi Service, Kick All Party, Leave Party, and
  related claim-after-leaving options, including saved background settings".
- FIZZCD no tiene issues y su página de discussions da 404. En
  `Ciensprog/Aerial-Launcher` no hay ninguna issue de 2026 sobre estas
  funciones. La más cercana, la #26 (2025), trata del comportamiento
  esperado del auto-kick.
- La validación de la release se hizo con "mocked authentication and
  background-operation checks", así que no se probó contra Epic.

Conclusión: el motivo es desconocido. Lo más prudente es suponer un cambio
de Epic o un riesgo para la cuenta. Expulsar a un miembro usa el mismo
`DELETE /parties/{pid}/members/{id}`, así que [DECISIÓN del usuario]:

- Los dos flags siguen en `false` y la expulsión individual también depende
  de `partyKick`.
- Para probarlo, el usuario cambia el flag en su equipo. Si funciona, se
  reactiva en un commit aparte.
- Promover y la privacidad no usan ese endpoint y no dependen de ningún flag.

## 8. IPC (`invoke`/`handle`)

| Canal | Argumentos | Respuesta |
|---|---|---|
| `friends:get-summary` | `account` | `FriendsSummary` |
| `friends:action` | `account, type, target` (ID; en `add`, nombre o ID) | `FriendsActionResponse` |
| `party:get-info` | `account` | `PartyInfo` |
| `party:member-action` | `account, 'kick' \| 'promote', memberId` | `PartyActionResponse` |
| `party:set-privacy` | `account, isPrivate` | `PartyActionResponse` |
| `party:fix-invite` | `account` | `PartyActionResponse` |

## 9. Casos límite

- Token caducado: se renueva. Si falla, "No se pudo autenticar la cuenta".
- Error de Epic: `success: false` con `errorMessage` de Epic si existe, y si
  no, "Unknown Error".
- Si falla la petición de nombres, las entradas se muestran como "Player" y
  la lista sigue funcionando [DECISIÓN].
- `accountId` repetido en el resumen: una sola entrada.
- Sin grupo: `party: null`, sin error, y empieza el reintento.
- Acción de líder sin ser líder: el proceso principal la rechaza antes de
  llamar a Epic, aunque la interfaz ya la desactiva.
- Expulsarse o promoverse a uno mismo: rechazado.
- Si cambias de cuenta mientras llega una respuesta, se descarta, igual que
  en el inventario con `requestId`.

## 10. Pruebas de aceptación (vitest)

1. Un resumen con 2 amigos, 1 recibida, 1 enviada y 1 bloqueado, más un mapa
   de nombres, da cuatro listas ordenadas con sus nombres.
2. Un nombre vacío, igual al ID o hex de 32 caracteres da "Player"
   (marcador); un nombre normal se conserva.
3. Un `accountId` duplicado en `friends` da una sola entrada; las entradas
   sin `accountId` se descartan.
4. `chunk` de 250 IDs da lotes de 100, 100 y 50.
5. `filterFriends` encuentra por parte del nombre y del ID sin distinguir
   mayúsculas, y con un texto vacío o de espacios devuelve la lista.
6. `parsePartyInfo` pone al líder primero, lee `dn_s`, marca `isPrivate`
   según `joinability` y calcula `size`.
7. `buildPartyPrivacyPatch(party, true)` produce exactamente los campos de
   la tabla del §3.2 para privado, conserva los campos ajenos de
   `PrivacySettings_j` y usa la `revision` del grupo.
8. `buildPartyPrivacyPatch(party, false)` hace lo mismo para público.
9. `isFriendsAccountId` acepta 32 hex en cualquier caja y rechaza el resto.
10. La consulta de nombres se construye como `accountId=a&accountId=b`.

## 11. Implementación en Aerial

| Pieza | Archivo |
|---|---|
| Endpoints | `src/services/endpoints/friends.ts` (resumen, bloqueo), `party.ts` (promover, patch), `lookup.ts` (nombres en lote) |
| Lógica pura y tests | `src/lib/parsers/friends.ts`, `party-info.ts` y sus `.test.ts` |
| Tipos | `src/types/friends-list.d.ts`, `src/types/services/friends.d.ts`, `party.d.ts` |
| Constantes | `src/config/constants/friends.ts` |
| Proceso principal | `src/kernel/core/friends.ts`, `src/kernel/core/party-info.ts`; `ipcMain.handle` en `src/kernel/main.ts` |
| Puente | `src/kernel/preload-actions/friends.ts`, `party-info.ts` |
| Página de amigos | `src/routes/account-management/friends/` |
| Tarjeta de grupo | `src/routes/stw-operations/party/-party-status.tsx` |
| Menú | barra lateral, menú personalizable (`friends`), `routeTree.gen.ts` |
| Textos | `en-US` y `es-419`: `account-management/friends.json` y claves nuevas en `stw-operations/party.json` |

## 12. Fuera de alcance

- Unirse a un grupo con autocompletado (user-search-service) [DECISIÓN del
  usuario].
- Avatares, presencia, alias y notas.
- Auto-aceptar y auto-purgar amigos: en GLOW son funciones de pago que van
  por su servidor.
- Reactivar `partyKick`, `partyLeave` o `taxiService` (§7).
