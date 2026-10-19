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

## Reproducir fixtures semánticos y solo arte

Renderiza cada `brief.json` de `semantic/` con el seed del brief y vuelve a
renderizarlo con `--art-only`. Las salidas se escriben bajo `$env:TEMP` y no
reemplazan los packs versionados:

```powershell
$semanticOut = Join-Path $env:TEMP 'beauty-semantic-repro'
Get-ChildItem docs/narrative-gif/semantic -Filter brief.json -Recurse |
  Where-Object { $_.FullName -notmatch '[\\/]art-only[\\/]' } |
  ForEach-Object {
    $brief = Get-Content -Raw $_.FullName | ConvertFrom-Json
    $key = ($brief.style + '-' + $brief.title + '-' + $brief.locale + '-' + $brief.seed) -replace '[^a-zA-Z0-9-]', '-'
    node dist/cli.js narrative --style $brief.style --brief $_.FullName --out (Join-Path $semanticOut "$key/narrative")
    node dist/cli.js narrative --style $brief.style --brief $_.FullName --art-only --out (Join-Path $semanticOut "$key/art-only")
  }
```

## Regenerar la comparación antes/después

`gallery:compare` lee briefs, manifiestos y bytes base con `git show` desde
`09bc6abbe4a9aac02416e7843a8acad12fa06faf`, renderiza tres veces cada brief
actual con su mismo seed, guarda la mediana del tiempo actual y vuelve a generar
`compare/index.json` y `COMPARE.html`. Los assets binarios idénticos a un pack
versionado se enlazan por ruta y no se duplican:

```powershell
pnpm build
pnpm gallery:compare
node dist/cli.js validate docs/narrative-gif/COMPARE.html --style papercraft --visual
```

El render histórico no se midió en la revisión base; `renderMs` del lado Antes
queda vacío. El índice conserva tamaños, cuadros decodificados, duración y holds
de ambos lados, controles, evaluación y el tiempo mediano de tres renders
actuales. La prueba `test/narrative-compare-index.test.ts` verifica referencias,
seed, cantidad de pares y el límite de 6 MiB por GIF.

Para reconstruir solo la página desde un índice ya generado:

```powershell
node dist/cli.js gallery docs/narrative-gif --compare docs/narrative-gif/compare --out docs/narrative-gif/COMPARE.html --title "Issue 7 · Galería comparativa"
```

## Generar la matriz de capacidades

```powershell
pnpm capabilities:matrix
node dist/cli.js capabilities --json
pnpm exec tsx --test test/capabilities-matrix.test.ts
```

El comando genera `CAPABILITIES.md` y `CAPABILITIES.html` desde el mismo registro
que usa `beauty capabilities --json`. La prueba comprueba las 312 celdas, sus
estados/razones, la existencia de cada pack y de cada prueba citada para celdas
`supported`.

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
pnpm narrative:recipes
pnpm fonts:check
pnpm exec tsx --test test/narrative-gallery-repro.test.ts
```

Playwright puede cargarse desde su instalación compartida. Si está en otra
ubicación, define la ruta del paquete antes de ejecutar la prueba de navegador:

```powershell
$env:BEAUTY_PLAYWRIGHT_ROOT = "C:\Users\jdsal\Documents\Programming-personal\open-civic-signal-os\node_modules\playwright"
pnpm exec tsx --test test/narrative-gallery.browser.test.ts test/narrative-compare.browser.test.ts
```

Sin ese paquete, la prueba browser se marca `skipped`; las demás pruebas y los
comandos de reproducción no requieren Playwright. `ffprobe` también es opcional.

## Ciclo de revisión, feedback y rerender

El ejemplo copia un pack a `out/`, registra un problema de muestra contra el
frame 0, extrae el frame y su recorte, y revisa el hash después del rerender. En
una inspección real sustituye problema, fase, frame, región y ajuste permitido
por lo observado en la imagen:

```powershell
$reviewDir = 'out/review-papercraft'
node dist/cli.js narrative --style papercraft --brief docs/narrative-gif/semantic/papercraft/filas-duplicadas/es/brief.json --out $reviewDir
$manifest = Get-ChildItem $reviewDir -Filter '*.manifest.json' | Select-Object -First 1
$feedbackPath = Join-Path $env:TEMP 'beauty-feedback.json'
$feedbackJson = '[{"id":"fila-duplicada-01","phaseId":"repeticion-visible","frameIndex":0,"region":{"x":16,"y":16,"w":80,"h":60},"problem":"Revisar la lectura de la fila repetida","severity":"minor","evidence":{"frameRef":0},"allowedAdjustment":"Ajustar solo la etiqueta dentro de su región","status":"open"}]'
[System.IO.File]::WriteAllText($feedbackPath, $feedbackJson, [System.Text.UTF8Encoding]::new($false))
node dist/cli.js review $manifest.FullName --reviewer reviewer-1:Revisor --criterion styleMaterial=not-evaluated --level visual-review=not-evaluated --feedback $feedbackPath --frames
node dist/cli.js review-state $manifest.FullName
node dist/cli.js rerender $manifest.FullName --apply-feedback
node dist/cli.js review-state $manifest.FullName
```

Una regeneración invalida la aprobación ligada al hash anterior. `review-state`
debe mostrar `stale` o `pending` hasta que alguien revise los bytes nuevos y
registre nuevos criterios. El manifest enlaza cada feedback abierto con el PNG
del frame y su recorte cuando esos archivos se extrajeron.

## Nota de migración

La galería, el CLI y su herramienta MCP son aditivos. No cambian firmas,
nombres ni exports existentes; `createNarrativeGallery` añade un export nuevo.
Las recetas anteriores siguen en sus rutas y no se reescriben. Los manifiestos
se resuelven desde los archivos que viven junto a ellos, aunque sus rutas
históricas apunten a otro checkout.
