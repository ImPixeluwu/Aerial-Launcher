# Mensajes para abrir cada función en un chat nuevo

Copia el bloque entero de la función en un chat nuevo de Claude Code con el
repositorio `ImPixeluwu/aerial-launcher`.

**Estado:** el visor de inventario (PR ImPixeluwu/Aerial-Launcher#3) y el
catálogo de esquemas (PR ImPixeluwu/Aerial-Launcher#4) ya están en `main`. El
libro de colección se descartó: el catálogo de esquemas ya lo cubre.

Orden sugerido para lo que queda:

1. **Amigos y grupo.**
2. **Visor de Homebase:** necesita datos de tu cuenta para la parte del
   escaneo.

---

## Catálogo de esquemas (hecho, PR ImPixeluwu/Aerial-Launcher#4)

Se conserva como ejemplo.

```
Vamos a añadir a Aerial Launcher un catálogo de esquemas de Salvar el Mundo.

Antes de nada:
1. Descarga la rama `notes/features` (git fetch origin notes/features) y lee
   `docs/features/README.md` y `docs/features/schematics/NOTES.md`. Ahí están
   las reglas del proyecto, la plantilla del inventario y lo que se sabe de la
   función.
2. Comprueba que `src/lib/parsers/inventory.ts` existe en `main`. Si no existe,
   para y avísame: falta fusionar el inventario.

Después:
3. Resuelve conmigo las decisiones de la §6 de NOTES antes de escribir nada.
4. Escribe `docs/features/schematics/SPEC.md` siguiendo el modelo
   `docs/features/inventory/SPEC.md`. Haz commit y push **solo a la rama
   `notes/features`** (tienes permiso para esa rama).
5. Implementa en tu rama de trabajo, creada desde `main`. Esa rama no debe
   llevar la carpeta `docs/features` ni ninguna mención a GLOW en código,
   comentarios, commits o PR.
6. Verifica como dice la §6 de la guía: npm test, npm run lint, el recuento
   de tsc (base 410) y npx electron-forge package.
7. Commits en inglés, sin líneas Co-Authored-By ni Claude-Session. No abras PR hasta que te lo
   pida.

Respóndeme en español.
```

---

## Amigos y grupo

```
Vamos a añadir a Aerial Launcher la gestión de amigos de Epic y ampliar la
página de grupo (party).

Antes de nada:
1. Descarga la rama `notes/features` (git fetch origin notes/features) y lee
   `docs/features/README.md` y `docs/features/friends-party/NOTES.md`.
   - Ahí están las reglas del proyecto, la tabla de lo que Aerial ya tiene y
     lo que falta.
   - Ojo: la lista de "friends" de la página de grupo actual es una lista
     local de invitados, no la de Epic.
2. Crea tu rama de trabajo desde `main` actualizado. El inventario y el
   catálogo de esquemas ya están fusionados: reutiliza sus patrones (IPC con
   invoke/handle, cuenta activa, funciones puras con tests en
   `src/lib/parsers/`).

Después:
3. Resuelve conmigo las decisiones de la §5 de NOTES antes de escribir nada.
   Una de ellas es si se reactivan los flags `partyKick` y `partyLeave` de
   `src/config/constants/feature-availability.ts`. Antes de proponerlo, mira
   por qué se desactivaron en el repositorio original: este fork no tiene ese
   historial. Tráelo con
   `git fetch https://github.com/FIZZCD/Aerial-Launcher.git` y busca con
   `git log -S partyKick FETCH_HEAD` (y sus issues o releases si hace falta).
4. Escribe `docs/features/friends-party/SPEC.md` siguiendo el modelo
   `docs/features/inventory/SPEC.md`. Haz commit y push **solo a la rama
   `notes/features`** (tienes permiso para esa rama).
5. Implementa en tu rama de trabajo. Esa rama no debe llevar la carpeta
   `docs/features` ni ninguna mención a GLOW en código, comentarios, commits
   o PR. No rompas lo que ya funciona en `src/routes/stw-operations/party/`.
   - Las listas de amigos y solicitudes pueden tener cientos o miles de
     entradas: virtualízalas con `@tanstack/react-virtual` (ya es
     dependencia), como la cuadrícula de `src/routes/stw-operations/schematics/`.
   - Las acciones modifican la cuenta: pide confirmación en las destructivas
     y masivas, y nunca las ejecutes contra una cuenta real. Las pruebo yo.
6. Verifica como dice la §6 de la guía: npm test, npm run lint, el recuento
   de tsc (base 410) y npx electron-forge package. Comprueba la interfaz con
   el preview de Vite y Chromium (§6), incluida una lista grande generada.
7. Commits en inglés, sin líneas Co-Authored-By ni Claude-Session. No abras
   PR hasta que te lo pida.

Respóndeme en español.
```

---

## Visor de Homebase

```
Vamos a añadir a Aerial Launcher un visor de la Homebase (Escudo
Antitormentas) de Salvar el Mundo.

Antes de nada:
1. Descarga la rama `notes/features` (git fetch origin notes/features) y lee
   `docs/features/README.md` y `docs/features/homebase/NOTES.md`. Ahí están
   las reglas del proyecto y lo que se sabe de la función. El visor remoto y
   los datos de terreno de GLOW quedan fuera.
2. Crea tu rama de trabajo desde `main` actualizado. El inventario y el
   catálogo de esquemas ya están fusionados: reutiliza sus patrones y datos
   (`src/lib/parsers/stw-items.ts`, `src/data/stw/`).

Después:
3. Resuelve conmigo las decisiones de la §5 de NOTES antes de escribir nada.
   - Empezamos por la fase 1: información de cada zona desde el perfil
     `metadata`.
   - Para confirmar la forma de los datos, te pasaré la respuesta de
     QueryProfile metadata de mi cuenta. Dime cómo obtenerla sin exponer mis
     tokens.
4. Escribe `docs/features/homebase/SPEC.md` siguiendo el modelo
   `docs/features/inventory/SPEC.md`. Haz commit y push **solo a la rama
   `notes/features`** (tienes permiso para esa rama).
5. Implementa en tu rama de trabajo, creada desde `main`. Esa rama no debe
   llevar la carpeta `docs/features` ni ninguna mención a GLOW en código,
   comentarios, commits o PR.
6. Verifica como dice la §6 de la guía: npm test, npm run lint, el recuento
   de tsc (base 410) y npx electron-forge package.
7. Commits en inglés, sin líneas Co-Authored-By ni Claude-Session. No abras PR hasta que te lo
   pida.

Respóndeme en español.
```
