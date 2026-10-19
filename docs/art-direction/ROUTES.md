# Rutas reales de dirección de arte: web, decks y GIF narrativo

Base analizada: `33335064e2c752278adf6a685074457be4d5b297` (rama `colmena/cd54edc6`).
Método: lectura del código actual y reproducciones con `tsx`; no se modificó `src/` ni `test/`.
No se ejecutó `pnpm check:all` (el brief lo prohíbe); los timeouts se investigaron por código y por el informe histórico.

## 1. Mapa de rutas

### (a) Páginas web

| Etapa | Qué pasa de verdad | Evidencia |
|---|---|---|
| Brief | Entrada directa `createPage({style,brief})` o ruta corta `makeArtifact({kind:'page'})`. | `src/generate.ts:44`, `src/make.ts:485` |
| Planificación | `normalizeBrief` fija idioma, límites y secciones; el estilo se resuelve con `getStyle`. En `make`, `deriveCopy` + `pageBrief` + `styleVoice` inventan la estructura. | `src/page/common.ts:80`, `src/styles/presets.ts:314`, `src/make.ts:101`, `src/make.ts:160`, `src/scaffolds/index.ts:14` |
| Composición | `renderPage` despacha a uno de 13 renderers por estilo; cada uno compone su propio HTML/CSS. | `src/page/index.ts:11`, `src/page/index.ts:48` |
| Renderer | Ejemplo: papercraft usa `renderPapercraft`, `heroArt()` y tarjetas de sección; `shell` aporta head, fuentes y CSS compartido. | `src/page/papercraft.ts:110`, `src/page/papercraft.ts:22`, `src/page/papercraft.ts:134`, `src/page/common.ts:311` |
| Exportación | `createPage` escribe un HTML único o lo devuelve en memoria. | `src/generate.ts:48`, `src/generate.ts:52` |
| Evaluación | `validateHtml` valida tokens, fuentes, contraste, estructura y texto; `auditArtifact` añade Chromium si se pide `--visual`. | `src/generate.ts:46`, `src/validate.ts:770`, `src/visual.ts:799` |
| Revisión | CLI `beauty validate/fix`; `criticReport` produce una lectura editorial. No hay ledger hash-bound para web. | `src/cli.ts:941`, `src/fix.ts:313`, `src/critic.ts:352` |

### (b) Decks

| Etapa | Qué pasa de verdad | Evidencia |
|---|---|---|
| Brief | `createDeck({style,brief})` o `makeArtifact({kind:'deck'})`. | `src/generate.ts:166`, `src/make.ts:504` |
| Planificación | `normalizeBrief` limpia campos de página y `normalizeSlides` infiere layout (`figure/quote/stats/points/statement`) y valida topes. | `src/deck.ts:181`, `src/deck.ts:68`, `src/deck.ts:101` |
| Composición | Un único `renderDeck` arma portada, contenido y cierre; **no hay 13 renderers de deck**. El estilo entra por CSS, `subfamily` y `motifFor`. | `src/deck.ts:180`, `src/deck.ts:133`, `src/deck.ts:310`, `src/deck-motifs.ts:41` |
| Renderer de figuras | Solo papercraft usa `papercutScene`; el resto usa `sceneArt(..., 'house')`. | `src/deck.ts:135`, `src/deck.ts:137`, `src/art.ts:37` |
| Exportación | `createDeck` escribe el HTML. | `src/generate.ts:172` |
| Evaluación | `validateDeck` reutiliza `validateHtml` y añade topes/palabras por slide. | `src/generate.ts:168`, `src/validate.ts:916`, `src/types/deck.ts:10` |
| Revisión | Igual que web: `beauty validate --visual`; no existe ledger de deck. | `src/cli.ts:941`, `src/visual.ts:799` |

#### Biblioteca de composiciones por propósito (estado actual)

`src/deck-compositions.ts` elige la composición por `slide.purpose`, no por azar:
`cover`, `problem`, `comparison` (dos columnas antes/después con divisor y lado en foco),
`process` (3–5 pasos sobre una línea de recorrido, no tarjetas), `example` (un objeto
grande con caption), `result` (una afirmación + línea de apoyo + tabla opcional),
`next-steps` (lista ordenada con responsable/cuándo en texto plano) y `table`
(tabla semántica de hasta 6 filas × 4 columnas con `<caption>`, `scope` y scroll
horizontal propio). `slide.purpose` es opcional: sin él se conserva el comportamiento
de `layout` (`statement/points/stats/quote/figure`).

Regla de ritmo determinista: el propósito fija composición y escala base; el índice
alterna posición y reduce la escala un 8 % en las láminas impares; la semilla solo
invierte el eje cuando el estilo admite asimetría (nunca cambia contenido ni tipo de
composición). Campos de `src/styles/art-direction.ts` que la biblioteca consume de
verdad: `composition.density` (texto → aireado/regular/denso) y
`composition.allowedAsymmetry` (permite o no espejar el eje). El resto entra por los
tokens del preset (paleta, fuentes, reglas, motivos).

Texto: los límites de `DECK_TEXT_LIMITS` siguen lanzando `DECK_TEXT_TOO_LONG`; las
tablas validan forma con `DECK_TABLE_SHAPE`; una lámina por encima de
`DECK_WORD_LIMIT` recibe `deck-word-count` con la sugerencia de dividirla o mover el
detalle a un resumen separado, sin tocar el original. La auditoría por lámina
(`auditDeckSlidesBatch` en `src/visual.ts`, 1280×720) recorre cada slide con la
navegación real del deck y aplica overflow, texto recortado, texto diminuto y oclusión.

### (c) GIF narrativos

| Etapa | Qué pasa de verdad | Evidencia |
|---|---|---|
| Brief | `createNarrative(input)` normaliza y hashea un contrato Zod de 3–5 fases. | `src/narrative/create.ts:30`, `src/narrative/brief.ts:175`, `src/narrative/brief.ts:48` |
| Planificación | `layoutNarrative` calcula área de texto/arte y `buildNarrativeTimeline` separa holds, transiciones y loop. | `src/narrative/layout.ts:134`, `src/narrative/timeline.ts:75` |
| Composición | `resolveNarrativeScene` elige uno de 13 renderers; la geometría compartida deja texto a la izquierda y arte a la derecha. | `src/narrative/scene.ts:17`, `src/narrative/scene.ts:41`, `src/narrative/layout.ts:143`, `src/narrative/encode.ts:146` |
| Renderer | `encodeNarrative` crea objeto persistente, dibuja frames y decodifica; cada escena decide su patrón `comparison/checklist`. | `src/narrative/encode.ts:342`, `src/narrative/encode.ts:369`, `src/narrative/composition.ts:78` |
| Exportación | Escribe GIF real, PNG de portada, contact sheet y manifest con hashes. | `src/narrative/encode.ts:433`, `src/narrative/encode.ts:439`, `src/narrative/manifest.ts:94`, `src/narrative/manifest.ts:171` |
| Evaluación | `evaluateNarrative` separa integridad técnica, conformidad de estilo, legibilidad renderizada, narrativa y revisión visual. | `src/narrative/create.ts:45`, `src/narrative/evaluate.ts:250`, `src/narrative/evaluate.ts:460` |
| Revisión | `reviewNarrativeArtifact` escribe ledger; los hashes invalidan la aprobación y `rerenderNarrativePack` solo fija feedback si cambian píxeles de la región. | `src/narrative/review.ts:213`, `src/narrative/review.ts:80`, `src/narrative/review.ts:124`, `src/narrative/rerender.ts:99` |
| Galería | `createNarrativeGallery` lee manifests; `createNarrativeCompareGallery` arma la comparación antes/después. | `src/narrative/gallery.ts:490`, `src/narrative/gallery.ts:628` |

### (d) Rutas legacy: GIF y secuencia

| Etapa | Qué pasa de verdad | Evidencia |
|---|---|---|
| Brief/planificación | `makeArtifact({kind:'gif'})` deriva título y opciones; no usa el contrato narrativo. | `src/make.ts:423`, `src/make.ts:312` |
| Renderer | `createGif` dibuja con `@napi-rs/canvas` y `drawGifFrame`, eligiendo `RENDERERS[style]`; plantillas `title/loop/poster`. | `src/generate.ts:63`, `src/gif.ts:1523`, `src/gif.ts:1385`, `src/gif.ts:1324` |
| Exportación | gifenc escribe el GIF; no hay PNG/contact/manifest. | `src/gif.ts:1560`, `src/gif.ts:1583` |
| Evaluación | Solo comprobaciones locales de cabecera, frames, tamaño y bytes en `beauty make`. | `src/make.ts:427` |
| Revisión | No hay ledger ni galería de revisión para esta ruta. | `src/make.ts:442` |
| Secuencia | `createSequence` → `renderSequence`: SVG por frames, rasteriza y encodea GIF; checks propios. | `src/generate.ts:78`, `src/sequence.ts:83`, `src/sequence.ts:120`, `src/sequence.ts:176` |

`createMotion` y `createCanvas` son rutas abiertas adyacentes, no los GIF narrativos: `src/generate.ts:109`, `src/generate.ts:135`.

## 2. Qué comparten y qué no

Compartir `getStyle` no demuestra paridad: comparten **datos de estilo**, no composición, ilustración ni movimiento.

| Capa | Web | Deck | GIF narrativo | ¿Compartido? |
|---|---|---|---|---|
| Presets/paleta/tipo/reglas | `getStyle` | `getStyle` | `getStyle` en escenas y `typeSystem` en fuentes | Sí, datos (`src/styles/presets.ts:282`, `:298`, `:314`) |
| Tipografía | Nombres del preset vía Google Fonts en el shell | Nombres del preset en CSS inline | Caras OFL empaquetadas y roles de raster propios | No en entrega; solo coinciden nombres (`src/narrative/fonts.ts:198`) |
| Retícula/composición | 13 renderers con estructuras propias | 1 renderer con layouts y motifs | 1 layout compartido + 13 escenas | No |
| Ilustración | `heroArt` fijo y `sceneArt`/papercut | `sceneArt`/`papercutScene` | Objetos semánticos por escena | No |
| Validador | `validateHtml`/`validateDeck` | `validateDeck` | `evaluateNarrative` + `verifyNarrativeGif` | No; solo web/deck comparten validador (`src/validate.ts:770`, `:916`, `src/narrative/verify-gif.ts:180`) |
| Accesibilidad | `src/a11y.ts` | `src/a11y.ts` | Métricas propias de legibilidad; no importa `a11y.ts` | Solo web/deck (`src/a11y.ts:22`, `src/deck.ts:5`, `src/page/common.ts:2`) |
| Galería | No hay galería de revisión de páginas | No | `GALLERY.html` desde manifests | Solo narrativa (`src/narrative/gallery.ts:490`) |
| Revisión | CLI/Chromium, sin ledger | CLI/Chromium, sin ledger | Ledger con hashes y feedback | Solo narrativa (`src/narrative/review.ts:213`) |

Consecuencia: la matriz de 13 estilos no tiene paridad entre formatos. En web hay 13 composiciones; en deck hay una composición parametrizada; en GIF hay 13 escenas sobre una retícula común. La galería de 39 familias del issue no existe en el código actual.

## 3. Verificación de las afirmaciones del issue

### 3.1 `deck.ts` pasa `'house'` e ignora la escena del brief — CONFIRMADO

`renderSlideContent` calcula `slide.figure.scene` (con default `meadow/rabbit`), pero la rama no papercraft llama `sceneArt(style, index+2, kicker, 'house')`; `sceneArt` agrega el marcador de casa. `scene` solo se usa en `papercutScene` para papercraft.

Evidencia: `src/deck.ts:135-137`, `src/art.ts:9`, `src/art.ts:24`, `src/art.ts:37`.
Reproducción:

```bash
pnpm exec tsx -e "import {renderDeck} from './src/deck.ts'; import {getStyle} from './src/styles/presets.ts'; const h=renderDeck({style:getStyle('nature'),brief:{title:'x',slides:[{layout:'figure',title:'y',figure:{scene:{kind:'meadow',characters:['rabbit']}}}]}}).html; console.log(JSON.stringify({house:h.includes('M-105 90V-40L0-125 105-40V90Z'),meadow:h.includes('meadow'),rabbit:h.includes('rabbit')}))"
```

Salida observada: `{"house":true,"meadow":false,"rabbit":false}`.

### 3.2 `papercraft.ts` `heroArt()` sin tema/escena y collage fijo — CONFIRMADO

`heroArt()` no recibe parámetros (`src/page/papercraft.ts:22`), el SVG está fijado en líneas 24–98 y la llamada es `${heroArt()}` (`src/page/papercraft.ts:169`). Los colores sí llegan por variables CSS del preset, pero la geometría y los objetos no dependen del brief ni de una escena.

Reproducción con dos briefs opuestos:

```bash
pnpm exec tsx -e "import {renderPapercraft} from './src/page/papercraft.ts'; import {getStyle} from './src/styles/presets.ts'; const p=getStyle('papercraft'); const hero=(h:string)=>h.match(/<div class=\"hero-art[^>]*>[\\s\\S]*?<\\/svg>\\s*<\\/div>/)?.[0]??''; const a=hero(renderPapercraft({title:'Panadería',sections:[{title:'Horno',body:'Pan'}]},p)); const b=hero(renderPapercraft({title:'API',sections:[{title:'Descarga',body:'Archivo'}]},p)); console.log(JSON.stringify({equal:a===b,length:a.length}))"
```

Salida observada: `{"equal":true,"length":4350}`.

### 3.3 Los GIF repiten “texto a un lado, objeto al otro” — CONFIRMADO

Las 13 escenas usan la misma decisión `comparison/checklist` (regex sobre `phases[0].visual.kind`). Además, todas dibujan el texto en `layout.textArea` (izquierda) y el arte en `layout.reservedArtArea` (derecha) (`src/narrative/encode.ts:146-148`, `src/narrative/layout.ts:143-149`). Bestiary, Memphis, Psychedelic y Ukiyoe ni siquiera usan `reservedArtArea`: hardcodean `x=0.5w, width=0.47w` (`src/narrative/scenes/bestiary.ts:35`, `memphis.ts:37`, `psychedelic.ts:36`, `ukiyoe.ts:38`), que es prácticamente la misma columna derecha.

| Estilo | `compositionFor` | Rama de render | Geometría |
|---|---|---|---|
| artdeco | compartida `stage-c-common.ts:7`; `artdeco.ts:134` | `drawComparison`/`drawChecklist` `artdeco.ts:117-118` | G-C |
| bestiary | local `bestiary.ts:14` | `drawComparisonNotes`/`drawChecklistNotes` `bestiary.ts:252-254` | G-A (artField fijo) |
| brutalist | local `brutalist.ts:18` | semántica / poster / checklist / comparison `brutalist.ts:303-310` | G-B (semántica G-A) |
| galactic | local `galactic.ts:18` | `drawComparisonPath`/`drawChecklistPath` `galactic.ts:214-215` | G-A |
| isotype | compartida `stage-c-common.ts:7`; `isotype.ts:130` | semántica / comparison / checklist `isotype.ts:114-116` | G-A |
| memphis | local `memphis.ts:16` | `drawComparisonCard`/`drawChecklistCard` `memphis.ts:214-215` | G-A (artField fijo) |
| nature | local `nature.ts:16` | `drawComparisonNotes`/`drawChecklistNotes` `nature.ts:202-203` | G-A |
| opart | compartida `stage-c-common.ts:7`; `opart.ts:100` | semántica / comparison / checklist `opart.ts:80-85` | G-C |
| papercraft | local `papercraft.ts:24` | semántica / checklist / comparison `papercraft.ts:305-307` | G-B (semántica G-A) |
| psychedelic | local `psychedelic.ts:15` | `drawChecklistBands`/`drawRibbons` `psychedelic.ts:171-172` | G-A (artField fijo) |
| renaissance | compartida `stage-c-common.ts:7`; `renaissance.ts:317` | semántica / comparison / checklist `renaissance.ts:291-302` | G-A |
| ukiyoe | local `ukiyoe.ts:16` | semántica / checklist / comparison `ukiyoe.ts:513-539` | G-A (artField fijo) |
| vaporwave | local `vaporwave.ts:16` | misma ventana; comparison añade borde `vaporwave.ts:234-239` | G-A |

Grupos de geometría (`textWidthRatio/artGapRatio/artWidthRatio/artY/artHeight`):

| Grupo | Ratios | Estilos |
|---|---|---|
| G-A | `0.43/0.02/0.45/0.05/0.90` | renaissance, isotype, ukiyoe, bestiary, psychedelic, memphis, vaporwave, galactic, nature (9). Papercraft y brutalist se suman en modo semántico |
| G-B | `0.57/0.02/0.31/0.08/0.84` | brutalist, papercraft (2) |
| G-C | `0.41/0.02/0.47/0.05/0.90` | artdeco, opart (2) |

Reproducción:

```bash
pnpm exec tsx -e "import {narrativeCompositionFor} from './src/narrative/composition.ts'; import {styleSlugs} from './src/styles/presets.ts'; const g:Record<string,string[]>={}; for(const s of styleSlugs){const c=narrativeCompositionFor(s); const k=[c.textWidthRatio,c.artGapRatio,c.artWidthRatio,c.artY,c.artHeight].join('/'); (g[k]??=[]).push(s)} console.log(JSON.stringify(g,null,2))"
```

Salida observada: los tres grupos de la tabla, con 9/2/2 estilos. No hay composición a sangre, texto sobre imagen ni eje vertical alternativo: cambia el dibujo interno, no la retícula.

### 3.4 8 de 14 pares históricos idénticos — CONFIRMADO

El informe lo afirma en `docs/narrative-gif/ISSUE-7-REPORT.md:50` y lo repite en `:79` y `:85`. El índice actual conserva el mismo asset GIF antes/después en 8 pares.

```bash
node -e "const j=require('./docs/narrative-gif/compare/index.json'); const s=j.pairs.filter(x=>x.before.assets.gif===x.after.assets.gif); console.log(JSON.stringify({pairs:j.pairs.length,identicalGifPath:s.length,same:s.map(x=>x.style+'/'+x.composition+'/'+x.seed)},null,2))"
```

Salida observada: `{"pairs":14,"identicalGifPath":8,...}` con isotype (2), renaissance (2), brutalist (2) y papercraft (2).

### 3.5 Timeouts de `pnpm check:all` — PARTIAL

No se corrió la suite completa (prohibido). El informe registra dos timeouts de navegación (`docs/narrative-gif/ISSUE-7-REPORT.md:65-67`, `:83`) y `check:all` fallido (`:67`). El código actual no fija timeout de test; el único timeout explícito de navegación es `15000` ms en `src/visual.ts:573`, usado por todas las auditorías. Las pruebas de geometría, deck y galerías usan `page.goto`/`waitFor` sin timeout explícito (default de Playwright: 30 s).

Reproducción: `grep -rn "setDefaultTimeout\|timeout:" test/*.ts src/visual.ts` no devuelve `setDefaultTimeout`; solo aparecen timeouts de proceso y el `15000` de `src/visual.ts:573`.

| Test / entrada Chromium | Línea | Timeout efectivo |
|---|---|---|
| `test/visual.test.ts` fixtures (7) | `test/visual.test.ts:68` | 15 s por `auditArtifact` → `src/visual.ts:573` |
| `test/visual.test.ts` score/repair | `test/visual.test.ts:85`, `:112` | 15 s por auditoría |
| `test/min-text-visual.test.ts` (52 auditorías) | `test/min-text-visual.test.ts:44`, `:54` | 15 s por página |
| `test/visual-matrix.test.ts` (91 artefactos, concurrencia 4) | `test/visual-matrix.test.ts:49`, `:54` | 15 s por página |
| `test/page-geometry.test.ts` (156 navegaciones secuenciales) | `test/page-geometry.test.ts:61`, `:69`, `:88`, `:98` | default 30 s por `goto` |
| `test/deck-capture.test.ts` | `test/deck-capture.test.ts:86`, `:95`, `:115`, `:124` | default 30 s por `goto` |
| `test/narrative-compare.browser.test.ts` | `test/narrative-compare.browser.test.ts:18`, `:33-54` | default 30 s por `waitFor` |
| `test/narrative-gallery.browser.test.ts` | `test/narrative-gallery.browser.test.ts:22`, `:37-61` | default 30 s por `waitFor` |

También hay timeouts de proceso, no de Chromium: `test/narrative-gallery-repro.test.ts:169`, `:214` (120 s) y `test/capabilities-matrix.test.ts:11` (30 s). El riesgo estructural está en page-geometry y visual-matrix (serialización y navegación), que son justamente las dos fallas históricas. Veredicto: PARTIAL, porque el fallo histórico está documentado y el riesgo se confirma por código, pero no se reprodujo con una corrida integral.

### 3.6 `.slice(` sobre texto del usuario — pérdida silenciosa mayoritaria

Convención: **SL** = SILENT LOSS (no se rechaza ni se informa); **EL** = EXPLICIT LIMIT (se lanza error o se informa al llamador). Se excluyen ids, hashes, rutas, colores y slices de parser.

```bash
pnpm exec tsx -e "import {renderDeck} from './src/deck.ts'; import {renderPage} from './src/page/index.ts'; import {renderExperience} from './src/page/experience.ts'; import {renderStory} from './src/page/story.ts'; import {getStyle} from './src/styles/presets.ts'; const s=getStyle('nature'); const d=renderDeck({style:s,brief:{title:'d',slides:[{layout:'statement',title:'T'.repeat(125)+'END'}]}}).html; const p=renderPage('nature',{title:'T'.repeat(95)+'END'}); const e=renderExperience({title:'e',rooms:Array.from({length:9},(_,i)=>({title:i===8?'NINTH-END':'r'+i}))},s); const st=renderStory({title:'s',chapters:Array.from({length:9},(_,i)=>({title:i===8?'NINTH-END':'c'+i}))},s); console.log(JSON.stringify({deckEnd:d.includes('END'),pageEnd:p.includes('END'),experienceNinth:e.includes('NINTH-END'),storyNinth:st.includes('NINTH-END')}))"
```

Salida observada: `{"deckEnd":false,"pageEnd":false,"experienceNinth":false,"storyNinth":false}`. La tabla siguiente repite el patrón por cada campo.

| Archivo:línea | Campo / límite | Clase | Ejemplo de entrada | Salida observada |
|---|---|---|---|---|
| `src/deck.ts:48` | point.title, 80 | SL | `'P'*85+'POINT-TITLE-END'` | marcador ausente |
| `src/deck.ts:49` | point.body, 180 | SL | `'b'*185+'POINT-BODY-END'` | ausente |
| `src/deck.ts:63` | stat.value, 18 | SL | `'V'*20+'STAT-VALUE-END'` | ausente |
| `src/deck.ts:64` | stat.label, 48 | SL | `'L'*50+'STAT-LABEL-END'` | ausente |
| `src/deck.ts:82` | sections de fallback, 3 | SL | 4 secciones | 4.ª (`SECCION-CUATRO-END`) ausente |
| `src/deck.ts:97` | slides de contenido, 14 | EL | 15 slides | lanza `DECK_TOO_MANY_SLIDES` |
| `src/deck.ts:98` | label de error, 80 | N/A | solo diagnóstico | no se renderiza; el título tiene su propio tope |
| `src/deck.ts:106` | kicker, 40 | SL | `'K'*45+'KICKER-END'` | ausente |
| `src/deck.ts:107` | title, 120 | SL | `'T'*125+'TITLE-END'` | ausente |
| `src/deck.ts:108` | body, 300 | SL | `'B'*305+'BODY-END'` | ausente |
| `src/deck.ts:112` | quote.text/author, 240/60 | SL | `'Q'*245+'QUOTE-END'` | texto y autor ausentes |
| `src/page/common.ts:33` | `clampText` (helper) | SL | `'T'*95+'PAGE-TITLE-END'` | recorta a 90 y pierde el final |
| `src/page/common.ts:88` | sections, 6 | SL | 7 secciones | 7.ª (`SEC-7-END`) ausente |
| `src/page/common.ts:145-146` | `splitAccent` | N/A | palabras | reparte, no pierde |
| `src/page/common.ts:155` | `brandInitial` | N/A | marca | iniciales derivadas |
| `src/page/experience.ts:18` | kicker, 42 | SL | kicker largo | recortado |
| `src/page/experience.ts:19` | title, 92 | SL | título largo | recortado |
| `src/page/experience.ts:20` | body, 700 | SL | `'E'*705+'EXP-BODY-END'` | ausente |
| `src/page/experience.ts:22` | items, 6 | SL | 7 items | 7.º (`ITEM-SIETE-END`) ausente |
| `src/page/experience.ts:23` | item.label, 80 | SL | `'L'*85+'ITEM-LABEL-END'` | ausente |
| `src/page/experience.ts:24` | item.detail, 180 | SL | `'D'*185+'ITEM-DETAIL-END'` | ausente |
| `src/page/experience.ts:25` | item.value, 24 | SL | valor largo | recortado |
| `src/page/experience.ts:28` | quote.text/author, 260/60 | SL | cita larga | recortada |
| `src/page/experience.ts:30` | note, 180 | SL | nota larga | recortada |
| `src/page/experience.ts:52` | rooms, 8 | SL | 9 salas | 9.ª (`SALA-NUEVE-END`) ausente |
| `src/page/experience.ts:70-73` | hours/address/source/closing | SL | 140/140/240/220 | recortados |
| `src/page/story.ts:9-15` | kicker/title/body/quote/fact | SL | body 5005 | `STORY-BODY-END` ausente |
| `src/page/story.ts:27` | chapters, 8 | SL | 9 capítulos | 9.º (`CAPITULO-NUEVE-END`) ausente |
| `src/page/story.ts:30` | sections de relleno, 2 | SL | 3 secciones sin chapters | 3.ª (`SEC-TRES-END`) ausente |
| `src/page/story.ts:47` | source/readingTime, 300/40 | SL | `'F'*305+'SOURCE-END'` | ausente |
| `src/page/brutalist.ts:76` | brand del coord, 30 | SL (local) | `'N'*26+'BRUT-END'` | coord pierde el final; el logo conserva la marca |
| `src/page/showcase-a.ts:93` | brand del censo, 40 | SL (local) | 41 chars | `EN` visible, `D` perdida |
| `src/page/showcase-a.ts:94` | sections del censo, 3 | SL (local) | 4 secciones | la 4.ª no entra al censo; sí al resto de la página |
| `src/page/showcase-a.ts:96` | título del censo, 18 | SL (local) | título de 26 | label recortado |
| `src/page/showcase-b.ts:29` | título del bestiario, 44 | SL (local) | 48 chars | caption SVG recortado; el h1 conserva el título |
| `src/page/showcase-b.ts:179` | brand del tag Memphis, 14 | SL (local) | 19 chars | tag recortado; el header conserva la marca |
| `src/page/showcase-b.ts:239` | nombre de ventana vaporwave, 16 | SL (local) | 19 chars | ventana recortada |
| `src/page/showcase-b.ts:240` | sections de archivos, 3 | SL (local) | 4 secciones | la 4.ª no aparece como archivo |
| `src/page/showcase-b.ts:244` | nombre de archivo, 18 | SL (local) | título largo | nombre de archivo recortado |
| `src/page/showcase-b.ts:377` | coord galactic, 24 | SL (local) | 27 chars | coord recortada |
| `src/page/min-text.ts:89,155,269,270,309,311,374` | parser CSS | N/A | CSS generado | no corta texto de usuario |
| `src/validate.ts:21-22` | hex | N/A | color | normaliza, no es texto |
| `src/validate.ts:226` | CSS en diagnóstico | EL | declaración larga | mensaje con fragmento visible |
| `src/validate.ts:609` | análisis de párrafos, 200 | SL (cobertura) | 201 párrafos | el 201 no se analiza |
| `src/validate.ts:652` | muestra de diagnóstico, 64 | EL | párrafo largo | mensaje con `…` |
| `src/validate.ts:913` | heading de diagnóstico, 60 | EL | h2 largo | mensaje con `…` |
| `src/make.ts:40` | `truncate` (helper) | SL | idea de 807 chars | sale de 599; no se informa |
| `src/make.ts:92` | título a 5 palabras | SL | frase de 12 palabras | título `uno dos tres cuatro cinco` |
| `src/make.ts:110` | `quoted.slice(1)` | N/A | array de grupos | no corta texto |
| `src/make.ts:121` | corte por puntuación | N/A | frase | separa tagline/intro |
| `src/make.ts:122` | intro, 760 | SL | intro larga | recortada |
| `src/make.ts:314` | título a 6 palabras | N/A | título ya limitado a 5 | sin efecto |
| `src/make.ts:315` | texto de GIF, 40 | SL | título de 52 chars | `...larguísim` (40) |
| `src/generate.ts:35` | slug, 56 | N/A | título | id de archivo |
| `src/generate.ts:81` | ruta `.svg` | N/A | output | ruta |
| `src/scaffolds/*.ts` | — | N/A | — | no hay `.slice(` en scaffolds |

Los topes de listas que sí se rechazan son `DECK_TOO_MANY_SLIDES`, `DECK_TOO_MANY_POINTS` y `DECK_TOO_MANY_STATS` (`src/deck.ts:40`, `:55`, `:89`); se observaron con 15 slides, 5 points y 7 stats. En cambio, los recortes de texto de deck, página, experiencia y story no se informan. El GIF narrativo no participa de esta tabla: su contrato rechaza labels/títulos fuera de máximo y `fitText` lanza `TEXT_OVERFLOW` en vez de truncar (`src/narrative/brief.ts:24`, `src/narrative/brief.ts:54`, `src/narrative/layout.ts:87`).

## 4. Síntesis

| # | Afirmación | Veredicto |
|---|---|---|
| 1 | deck no papercraft pasa `'house'` e ignora la escena del brief | CONFIRMADO |
| 2 | `heroArt()` no recibe tema/escena y el collage es fijo | CONFIRMADO (color por CSS vars; geometría fija) |
| 3 | los GIF repiten texto a un lado/objeto al otro; varios estilos comparten geometría | CONFIRMADO |
| 4 | 8/14 pares históricos con GIF idéntico | CONFIRMADO |
| 5 | `pnpm check:all` falla por timeouts | PARTIAL (documentado; no se corrió la suite) |
| 6 | hay pérdida silenciosa de texto por `.slice(` | CONFIRMADO; mayoría SL, topes de deck y diagnósticos son EL |

No hay paridad web/deck/GIF: comparten presets, nombres de fuentes y algunos validadores, pero cada motor tiene su propia retícula, su propio renderer y su propio nivel de revisión. La galería y el ledger actuales son narrativos; las páginas y decks se revisan con CLI/Chromium y no tienen invalidación por hash.
