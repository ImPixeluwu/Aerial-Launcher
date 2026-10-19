# NOTAS: Amigos y grupo (party)

Este documento es materia prima para escribir el SPEC; no es el SPEC. Lee
antes `docs/features/README.md`.

**Origen:** lectura estática de la interfaz de GLOW 5.0.4 (ver §7 de la guía).
Etiquetas:

- **[CONFIRMADO]:** visto en su JavaScript.
- **[INFERIDO]:** deducido. Normalmente es lógica del lado Rust o un endpoint
  de Epic.

**Secciones de GLOW consultadas:** `src/renderer/pages/friends.ts`,
`pages/party.ts`, `pages/eosEgs.ts`, `pages/loadout.ts`,
`i18n/pages/{friends,party}.json` y el preload (`glowAPI.friends`,
`glowAPI.party`).

## 1. Amigos en GLOW

### Ubicación y pestañas

- No tiene ruta propia. Es la primera pestaña de la página "EOS/EGS", junto a
  auth, security, redeem codes, lookup, EULA y Epic status. [CONFIRMADO]
- Tiene tres pestañas, `friends`, `incoming` y `outgoing`, cada una con su
  contador. No hay pestaña de bloqueados. Al cambiar de pestaña se vacía la
  búsqueda. [CONFIRMADO]

### Filas

- Cada fila muestra `accountId`, `displayName` y avatar. No hay presencia,
  plataforma, alias, nota, favorito ni fecha. [CONFIRMADO]
- Si el `displayName` está vacío, es igual al accountId o es un hex de 32
  caracteres, se muestra "Player". [CONFIRMADO]
- Los avatares se cargan en diferido para las filas visibles, en lotes de 120;
  el segundo lote va 400 ms después, y se vuelven a cargar tras cada búsqueda.
  [CONFIRMADO]
- El endpoint de avatares probablemente es avatar-service
  `/v1/avatar/fortnite/ids`. [INFERIDO]

### Búsqueda

- Filtro local por nombre o ID, sin distinguir mayúsculas, con 150 ms de
  espera y botón de limpiar. [CONFIRMADO]
- Hay un mensaje de lista vacía distinto por pestaña y otro para cuando la
  búsqueda no da resultados.

### Acciones por fila [CONFIRMADO]

| Pestaña | Acciones |
|---|---|
| friends | `remove`, sin confirmación; `block`, con confirmación |
| incoming | `accept`, `reject` |
| outgoing | `cancel` |

- Si la acción va bien, la fila se quita de la lista sin recargar.
- Mientras se ejecuta, la fila queda ocupada y solo se admite una acción a la
  vez.

### Añadir amigo

- Barra inferior con un campo "nombre o ID de cuenta" que se envía con Enter o
  con un botón. [CONFIRMADO]
- Si va bien, muestra "solicitud enviada", vacía el campo y recarga.
  [CONFIRMADO]
- El texto se envía tal cual; la conversión de nombre a ID la hace el backend.
  [INFERIDO]

### Acciones masivas [CONFIRMADO]

| Acción | Pestaña | Confirmación | Cómo se ejecuta |
|---|---|---|---|
| Quitar todos | friends | Sí | Una sola llamada (`clearAll`), luego recarga |
| Aceptar todos | incoming | No | Una sola llamada (`acceptAll`) |
| Rechazar todos | incoming | Sí, con el número | Bucle en el cliente: `reject` por ID con 1 s entre llamadas |
| Cancelar todos | outgoing | Sí, con el número | Igual que rechazar, con `cancel` |

En los dos bucles hay barra de progreso `actual/total` y un mensaje final; los
errores individuales se ignoran.

### Estado

- Una barra de éxito o error con el mensaje del backend, que se oculta a los
  5 s. [CONFIRMADO]
- Funciona con la cuenta activa. Al cambiar de cuenta se vacía y recarga. No
  hay polling; se recarga a mano y después de cada acción. [CONFIRMADO]

### IPC de GLOW [CONFIRMADO]

- Métodos: `getSummary`, `add(v)`, `remove(id)`, `accept(id)`, `reject(id)`,
  `cancel(id)`, `block(id)`, `removeAll()`, `clearAll()` y `acceptAll()`.
- Respuesta: `{ success, message?, error? }`.
- `getSummary` devuelve `{ friends[], incoming[], outgoing[] }`, con
  `{ accountId, displayName }` por entrada.

### Endpoints de Epic [INFERIDO; están en el lado Rust]

| Uso | Petición |
|---|---|
| Resumen (friends, incoming, outgoing, blocklist) | `GET friends-public-service /friends/api/v1/{me}/summary` |
| Nombres | `GET account-public-service /account/api/public/account?accountId=…`, en lotes de hasta 100 |
| Añadir o aceptar | `POST /friends/api/v1/{me}/friends/{id}` |
| Quitar, rechazar o cancelar | `DELETE /friends/api/v1/{me}/friends/{id}` |
| Bloquear | `POST /friends/api/v1/{me}/blocklist/{id}` |
| Quitar todos | `DELETE /friends/api/v1/{me}/friends`, masivo |

Fuera de alcance: las páginas "auto-accept friends" y "auto-purge friends" de
GLOW son funciones de pago que van por su servidor.

## 2. Grupo en GLOW

### Ubicación

Es la pestaña por defecto de la página "loadout"; la ruta antigua `party`
redirige allí. [CONFIRMADO]

### Banner de estado [CONFIRMADO]

- Estados: cargando, sin grupo, error y listo.
- En listo muestra "Party · N miembro(s) · Privado/Público", un botón de
  refrescar y un chip por miembro, con "· Leader" en el líder.
- Datos que recibe: `members[{ accountId, displayName, isLeader }]`,
  `partyId`, `size` e `isPrivate`.

### Secciones y acciones

**Ajustes**

- Arreglar invitación: según el texto, cambia la privacidad para arreglar las
  invitaciones en juego en la nube y la restaura a los 5 s. [CONFIRMADO texto,
  INFERIDO implementación]
- Alternar entre público y privado. [CONFIRMADO]

**Jugadores**

- Invitar: la tarjeta sale deshabilitada como "temporalmente desactivada",
  aunque el handler existe. [CONFIRMADO]
- Unirse: campo con autocompletado [CONFIRMADO]:
  - Busca a partir de 2 caracteres, con 350 ms de espera, mediante
    `party.search(q)`.
  - Las sugerencias muestran el nombre y, si existe, la plataforma; al pulsar
    una se rellena el campo.
  - Después se llama a `join(name)`. Con el campo vacío da error.

**Miembros**

- Expulsar y promover: un desplegable con los miembros que no son líder. Sin
  selección da error; sin miembros muestra "miembros pendientes".
  [CONFIRMADO]

**Ocultas**

- `leave`, `kickCollect(true)` y `kickCollectExpulse(true)` existen en el
  código y en los textos, pero hoy no tienen botón. [CONFIRMADO]
- Por sus textos (sección "Advanced"):
  - "recoge recompensas STW y sale"
  - "expulsa a todos, recoge recompensas y sale"
- Tras cualquiera de las tres se vuelve a leer el grupo.

### Comportamiento [CONFIRMADO]

- Cada tarjeta muestra su propio estado (spinner y mensaje), que se borra a
  los 6 s.
- El error "party not found" se traduce.
- Solo usa la cuenta activa y relee el grupo al cambiar de cuenta.
- Mientras no encuentra un grupo, reintenta cada 10 s con una cuenta atrás
  visible; cuando lo encuentra, deja de reintentar.

### IPC de GLOW [CONFIRMADO]

`info`, `leave`, `kick(id)`, `kickCollect(b)`, `kickCollectExpulse(b)`,
`invite(name)`, `join(name)`, `promote(id)`, `togglePrivacy`, `fixInvite` y
`search(q)`.

### Endpoints de Epic [INFERIDO]

Base: `party-service-prod…/party/api/v1/Fortnite`.

| Uso | Petición |
|---|---|
| Info | `GET /user/{me}`, más resolución de nombres |
| Expulsar o salir | `DELETE /parties/{pid}/members/{id}` |
| Promover | `POST /parties/{pid}/members/{id}/promote` |
| Privacidad | `PATCH /parties/{pid}`, ver nota |
| Invitar | `POST /parties/{pid}/invites/{id}` |
| Unirse | nombre → ID, grupo del objetivo, `POST /parties/{pid}/members/{me}/join` |
| Buscar | user-search-service `/api/v1/search/{me}?prefix=`, que devuelve la plataforma |

El `PATCH` de privacidad envía `config.joinability` (`OPEN` o
`INVITE_AND_FORMER`), `discoverability`, la meta
`Default:PrivacySettings_j` y la `revision` actual.

## 3. Lo que Aerial ya tiene

### Endpoints

- `src/services/endpoints/friends.ts`: `getFriend`, `addFriend` (POST) y
  `removeFriend` (DELETE) sobre `/{me}/friends/{id}`. Solo usa v1.
  - No hay: summary, blocklist ni quitar todos.
- `src/services/endpoints/party.ts`: `fetchParty` (`GET /user/{id}`), `kick`,
  `invite` (`?sendPing=true`) y `removeInvite`.
  - No hay: promover, PATCH de privacidad ni unirse.
- `src/services/endpoints/lookup.ts`: `findUserByAccountId`,
  `findUserByDisplayName` y `findUserByExternalDisplayName`. La búsqueda es
  exacta, sin prefijo.

### Core: `src/kernel/core/party.ts`

- `kickPartyMembers` ("kick all"):
  - Como líder expulsa a todos y después a sí mismo; si no es líder, saca a
    las cuentas propias.
  - Puede recoger recompensas (`ClaimRewards.core`) y transferir materiales.
- `leaveParty`, multicuenta.
- `invite`: si no hay amistad, envía solicitud; si la invitación existe, la
  reenvía.
- `addNewFriend`, `removeFriend` y `loadFriends`.

**Ojo:** estos "friends" son una **lista local de invitados**, guardada con
`DataDirectory.getFriendsFile` en `src/kernel/startup/data-directory.ts`. No
son la lista de amigos de Epic, así que no hay que mezclarlas.

### IPC

- Canales en `src/config/constants/main-process.ts`: `party:claim`,
  `party:kick`, `party:leave`, `party:load:friends`, `party:friend:add`,
  `party:friend:remove` y `party:invite`, más sus `:notification`.
- Usan el patrón `send` + evento de notificación. El inventario usa
  `invoke`/`handle`.

### Interfaz y textos

- Página: `src/routes/stw-operations/party/` (`-kick-all-party.tsx`,
  `-leave-party.tsx`, `-claim-rewards.tsx`, `-invite.tsx`) y
  `src/hooks/stw-operations/party.ts`. Usa selectores multicuenta.
- `src/config/constants/feature-availability.ts`: `partyKick: false` y
  `partyLeave: false`, así que hoy expulsar y salir están **desactivados**.
- Automatización: `src/kernel/startup/automation.ts` y
  `src/kernel/core/automation/account-processes.ts` hacen auto-kick y claim al
  terminar una misión. El XMPP (`stanza`) está en `account-service.ts`.
- Textos: `src/locales/*/stw-operations/party.json` en 7 idiomas. No hay
  namespace `friends` ni ruta de amigos; `src/routes/account-management/` no
  la tiene.

## 4. Huecos

| Función de GLOW | Aerial | Dónde |
|---|---|---|
| Página de amigos (3 pestañas, contadores, búsqueda) | Falta | nuevo, p. ej. `src/routes/account-management/friends/` |
| Resumen friends/incoming/outgoing | Falta el endpoint summary | `services/endpoints/friends.ts` |
| Nombres en lote | Parcial: lookup individual | `services/endpoints/lookup.ts` |
| Avatares | Falta | — |
| Añadir por nombre o ID | Parcial: `addFriend` + `findUserByDisplayName` | `endpoints/friends.ts`, `core/party.ts` |
| Quitar, rechazar, cancelar o aceptar | El endpoint existe, falta la interfaz | `endpoints/friends.ts` |
| Bloquear | Falta | — |
| Quitar todos, aceptar todos, rechazar o cancelar todos | Falta | — |
| Info de grupo (miembros, líder, privacidad) | Parcial: `fetchParty`, sin interfaz | `endpoints/party.ts`, `types/services/party.d.ts` |
| Reintento cada 10 s sin grupo | Falta | — |
| Expulsar a un miembro | Parcial: endpoint; solo hay interfaz de "kick all" | `endpoints/party.ts` |
| Expulsar a todos y recoger, salir y recoger | Existe, desactivado por flag | `core/party.ts`, `-kick-all-party.tsx`, `-leave-party.tsx` |
| Promover | Falta | — |
| Alternar privacidad, arreglar invitación | Falta (sin PATCH) | — |
| Invitar por nombre | Existe, más completo que GLOW | `-invite.tsx`, `core/party.ts` |
| Unirse por nombre con autocompletado | Falta | — |
| Búsqueda por prefijo con plataforma | Falta | `endpoints/lookup.ts` |

## 5. Decisiones para el SPEC (preguntar al usuario)

1. **Ubicación de Amigos:** página nueva en "Gestión de cuenta"
   (recomendado) o pestaña dentro de Grupo.
2. **Patrón de IPC:** `invoke` con respuesta `{ success, … }`, como el
   inventario (recomendado para código nuevo), o `send` + notificación, como
   el grupo actual.
3. **Expulsar y salir:** ¿reactivar los flags `partyKick` y `partyLeave`? Hay
   que preguntar por qué FIZZCD los desactivó; puede ser un cambio de Epic.
4. **Ámbito de Grupo:** ampliar la página actual con estado, expulsar uno,
   promover, privacidad y unirse, sin rehacer lo que ya funciona.
