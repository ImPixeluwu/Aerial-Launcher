# Amigos y grupo: implementación archivada

El usuario descartó la función el 2026-10-24 y borró la rama de código. La
implementación completa se conserva en `implementation.patch`, en esta misma
carpeta, por si se retoma.

## Qué contiene

Es el commit `586a8ac` ("Add Epic Games friends page and party status card"),
creado sobre `main` en `96a46d8` y exportado con `git format-patch`. Hace lo
que describe `SPEC.md`:

- Una página de amigos de Epic en Gestión de cuenta, con cuatro pestañas,
  búsqueda, acciones por fila y acciones masivas con confirmación. La lista
  está virtualizada.
- Una tarjeta de estado del grupo en `/stw-operations/party` con estado,
  reintento cada 10 s, promover, expulsar (detrás de `partyKick`),
  privacidad y "arreglar invitación".
- 20 tests en `src/lib/parsers/friends.test.ts` y `party-info.test.ts`.

El parche no menciona a GLOW ni incluye `docs/features`.

## Estado al archivarlo

- Verificado: `npm test` (62 tests), `npm run lint`, `tsc` (410 errores en
  los mismos 20 archivos que la base), `npx electron-forge package` y el
  preview de Vite con Chromium y 5.000 amigos generados (14–19 filas en el
  DOM y unos 90 ms por cambio de pestaña).
- **Sin probar contra Epic.** Los endpoints del resumen de amigos, bloquear
  y desbloquear, promover y el PATCH de privacidad salen de `fnbr`, no de
  código de Aerial que ya funcione.
- El 2026-10-24, el parche aplicaba sin conflictos sobre `main` (`af0ea86`).

## Cómo recuperarlo

```
git fetch origin main notes/features
git checkout -b <rama> origin/main
git show origin/notes/features:docs/features/friends-party/implementation.patch > /tmp/friends-party.patch
git am --3way /tmp/friends-party.patch
```

Si `git am` encuentra conflictos, resuélvelos y continúa con
`git am --continue`. Después repite la verificación de la §6 de
`docs/features/README.md`. Antes de abrir el PR, cambia el autor del commit
si hace falta.
