# Mensajes para abrir cada función en un chat nuevo

Copia el bloque entero de la función en un chat nuevo de Claude Code con el
repositorio `ImPixeluwu/aerial-launcher`.

**Requisito:** el visor de inventario tiene que estar fusionado en `main`
antes de empezar. Las cuatro funciones reutilizan su código
(`src/lib/parsers/inventory.ts`, `stw-items.ts` y `src/data/stw/`).

Orden sugerido:

1. **Catálogo de esquemas:** es el que más reutiliza del inventario.
2. **Libro de colección.**
3. **Amigos y grupo.**
4. **Visor de Homebase:** necesita datos de tu cuenta para la parte del
   escaneo.

---

## Catálogo de esquemas

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
7. Commits en inglés, sin línea Co-Authored-By. No abras PR hasta que te lo
   pida.

Respóndeme en español.
```

---

## Libro de colección

```
Vamos a añadir a Aerial Launcher el libro de colección de Salvar el Mundo.

Antes de nada:
1. Descarga la rama `notes/features` (git fetch origin notes/features) y lee
   `docs/features/README.md` y `docs/features/collection-book/NOTES.md`. Ahí
   están las reglas del proyecto, la plantilla del inventario y lo que se sabe
   de la función. Si ya existe `docs/features/schematics/SPEC.md`, léelo
   también, porque comparten el mapeo de esquemas.
2. Comprueba que `src/lib/parsers/inventory.ts` existe en `main`. Si no existe,
   para y avísame: falta fusionar el inventario.

Después:
3. Resuelve conmigo las decisiones de la §4 de NOTES antes de escribir nada.
4. Escribe `docs/features/collection-book/SPEC.md` siguiendo el modelo
   `docs/features/inventory/SPEC.md`. Haz commit y push **solo a la rama
   `notes/features`** (tienes permiso para esa rama).
5. Implementa en tu rama de trabajo, creada desde `main`. Esa rama no debe
   llevar la carpeta `docs/features` ni ninguna mención a GLOW en código,
   comentarios, commits o PR.
   - Si hace falta ampliar `scripts/generate-stw-data.mjs` con héroes,
     supervivientes o defensores, clona PegLegResources y STW-Datatables en
     el scratchpad, en los commits de `src/data/stw/source.json`.
6. Verifica como dice la §6 de la guía: npm test, npm run lint, el recuento
   de tsc (base 410) y npx electron-forge package.
7. Commits en inglés, sin línea Co-Authored-By. No abras PR hasta que te lo
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
2. Comprueba si `src/lib/parsers/inventory.ts` existe en `main`. Esta función
   no depende del inventario, pero si no está fusionado, avísame.

Después:
3. Resuelve conmigo las decisiones de la §5 de NOTES antes de escribir nada.
   Una de ellas es si se reactivan los flags `partyKick` y `partyLeave` de
   `src/config/constants/feature-availability.ts`. Antes de proponerlo, mira
   en el historial de FIZZCD por qué se desactivaron.
4. Escribe `docs/features/friends-party/SPEC.md` siguiendo el modelo
   `docs/features/inventory/SPEC.md`. Haz commit y push **solo a la rama
   `notes/features`** (tienes permiso para esa rama).
5. Implementa en tu rama de trabajo, creada desde `main`. Esa rama no debe
   llevar la carpeta `docs/features` ni ninguna mención a GLOW en código,
   comentarios, commits o PR. No rompas lo que ya funciona en
   `src/routes/stw-operations/party/`.
6. Verifica como dice la §6 de la guía: npm test, npm run lint, el recuento
   de tsc (base 410) y npx electron-forge package.
7. Commits en inglés, sin línea Co-Authored-By. No abras PR hasta que te lo
   pida.

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
2. Comprueba que `src/lib/parsers/inventory.ts` existe en `main`. Si no existe,
   para y avísame: falta fusionar el inventario.

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
7. Commits en inglés, sin línea Co-Authored-By. No abras PR hasta que te lo
   pida.

Respóndeme en español.
```
