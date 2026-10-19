# Reproducir narrativa GIF y galería desde un checkout limpio

Estos pasos conservan los packs comprometidos y escriben cualquier salida nueva
en `out/` o en una carpeta temporal.

## Requisitos

- Node.js **22 o superior**.
- Corepack y pnpm **11.18.0**, fijado en `package.json` como `packageManager`.
- `ffprobe` es opcional: si está disponible, el manifiesto incluye una segunda
  comprobación del GIF. La verificación LZW interna no depende de él.
- Playwright es opcional. La prueba de navegador se omite si no encuentra el
  paquete indicado por `BEAUTY_PLAYWRIGHT_ROOT` o la ubicación compartida de
  `open-civic-signal-os`.

## Instalación y compilación

En PowerShell, desde la raíz del repositorio:

```powershell
node --version
corepack enable
corepack prepare pnpm@11.18.0 --activate
pnpm --version
pnpm install --frozen-lockfile
pnpm build
```

Confirma `node --version` como `v22` o superior y `pnpm --version` como
`11.18.0`. La compilación crea `dist/cli.js` y `dist/mcp/server.js`.

## Reproducir los 28 packs canónicos

La prueba siguiente vuelve a renderizar cada brief de `gallery/` y `pilots/`
en una carpeta temporal, decodifica los GIF y compara GIF, PNG y hoja de
contacto byte a byte. No reemplaza los packs de `docs/narrative-gif/`:

```powershell
pnpm exec tsx --test test/narrative-gallery-repro.test.ts
```

Renderiza también las 13 recetas de producto en una carpeta temporal y comprueba
sus expectativas a partir del GIF decodificado:

```powershell
pnpm narrative:recipes
```

Una receta individual produce el pack en la ruta elegida:

```powershell
node dist/cli.js narrative --style papercraft --brief examples/recipes/papercraft/narrative.json --out out/narrative/papercraft
```

Cada brief mantiene las fases **Antes**, **Cambio** y **Resultado esperado**
con `status: in-review`: el resultado se expresa como expectativa y no añade
métricas ni afirma publicación.

## Generar y validar la galería

El comando recorre los manifiestos bajo `docs/narrative-gif`, escribe una sola
página y conserva enlaces relativos a los GIF, PNG, contactos y manifiestos:

```powershell
node dist/cli.js gallery docs/narrative-gif --out docs/narrative-gif/GALLERY.html --title "Revisión de Sprint"
node dist/cli.js validate docs/narrative-gif/GALLERY.html --style papercraft --visual
```

La galería inicia con posters PNG estáticos, sin scripts, fuentes ni solicitudes
de red externas. El navegador solo solicita cada GIF después de pulsar
**Reproducir**. Para guardar capturas de validación, usa una ruta fuera del
repositorio, por ejemplo:

```powershell
node dist/cli.js validate docs/narrative-gif/GALLERY.html --style papercraft --visual --shots "$env:TEMP\beauty-gallery"
```

## Pruebas de cierre

```powershell
pnpm check:all
pnpm coverage:matrix
pnpm visual:matrix
```

Playwright puede cargarse desde su instalación compartida. Si está en otra
ubicación, define la ruta del paquete antes de ejecutar la prueba de navegador:

```powershell
$env:BEAUTY_PLAYWRIGHT_ROOT = "C:\Users\jdsal\Documents\Programming-personal\open-civic-signal-os\node_modules\playwright"
pnpm exec tsx --test test/narrative-gallery.browser.test.ts
```

Sin ese paquete, la prueba browser se marca `skipped`; las demás pruebas y los
comandos de reproducción no requieren Playwright. `ffprobe` también es opcional.

## Nota de migración

La galería, el CLI y su herramienta MCP son aditivos. No cambian firmas,
nombres ni exports existentes; `createNarrativeGallery` añade un export nuevo.
Las recetas anteriores siguen en sus rutas y no se reescriben. Los manifiestos
se resuelven desde los archivos que viven junto a ellos, aunque sus rutas
históricas apunten a otro checkout.
