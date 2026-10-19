# Narrative brief migration: v1 to v3

Contract v3 is used by the CLI, library and MCP. The brief schema is defined once in `src/narrative/brief.ts`; `beauty narrative --help` derives its field list from that schema, and `beauty_create_narrative` exposes the same Zod schema. Query `beauty capabilities [--style <s>] [--json]` or MCP `beauty_get_capabilities` before authoring visual values.

## Field mapping

| v1 field or behavior | v2/v3 field or behavior | Migration |
| --- | --- | --- |
| `status: open\|in-review\|done` | `workflowStatus` | `status` remains an accepted deprecated alias and is normalized to both `workflowStatus` and `status`. If both are supplied, they must match. |
| `status: done` implied an observed result | `outcome: { mode: "expected"\|"observed" }` | `workflowStatus: done` alone maps to `outcome.mode: expected`. A finished task can report an unmeasured expected benefit. |
| final phase label authored by the brief | final label derived from `outcome.mode` | The engine writes `Resultado esperado/observado` or `Expected/Observed result` according to locale. |
| no evidence or scope field | `outcome.evidenceRefs` and `outcome.scopeNote` | `observed` requires at least one ref with a stable `id` and readable `label`, plus a scope note that explicitly says what the evidence does not claim. `source` and `date` are optional metadata. |
| no illustrative marker | `illustrative: boolean` | Missing v1 values default to `true`, preserving example/demo content as illustrative. An evidence-backed observed result must set `illustrative:false`. |
| implicit fixed workflow stamp | `badgePolicy` | Defaults to `workflow` to preserve v1 behavior. `none` suppresses workflow stamps/status marks. `custom` requires `badgeText`. |
| arbitrary `visual.kind/state` strings | style-declared visual vocabulary | Existing `comparison`, `checklist`, and legacy `document`, `process`, `lista`, and `proceso` values remain supported. The current states include `unreviewed`, `before`, `pending`, `flagged`, `signal`, `observation`, `observacion`, `review-ready`, `reviewed`, `ready`, `done`, `verified`, and `list`; unknown values now fail before rendering with valid alternatives. Repeating the same state across phases is allowed. Legacy visual-only briefs have no entity actions; v3 semantic actions are declared under `visual.semantic.actions`. |
| `playback.minReadableHoldMs` only | `playback.preset` and `phases[].holdMs` | `readable` is the default and keeps a 5000ms minimum floor. `product-review` uses the same readable floor, extends holds by the existing text load and defaults to short 320ms transitions when none is supplied; it suggests Problema → Solución → Highlight but accepts 4–8 phases. `concise` allows explicit per-phase holds from 2000ms. Values are numeric milliseconds; units, non-finite values and holds below the selected floor return `BAD_DURATION`. |
| one fixed text-left/object-right frame | optional `phases[].layout` | Values are `object-left`, `object-right`, `object-top` and `object-hero`. Omitted means `object-right`, so committed packs are byte-identical. All styles support the mirrored left/right pair; papercraft and brutalist also render top/hero at 16:9 and 1:1. Unsupported combinations return `UNSUPPORTED_LAYOUT` with alternatives from the capabilities registry. |
| no editorial guard | `product-review` warnings and content lint | Warnings suggest a 3–7-word headline, one short sentence and removal of ticket codes, PR numbers, environment names and Jira states. They are non-destructive: copy is never truncated or rewritten. |
| manifest schema v1 | manifest schema v2 | V2 adds work/outcome/evidence classification and separately reports holds, transitions, loop bridge, entries, total decoded time and per-phase requested/encoded/decoded holds. |
| manifest schema v2 | manifest schema v3 | V3 adds `generatedBy`, `renderRevision`, `reviewState`, `openFeedbackCount`, `feedbackFrames`, a non-binding `publicationRecommendation` and `upgrade` provenance. Existing v2 manifests remain readable; without review metadata the gallery derives pending/none from the prior visual-review status. |
| legacy kind/state-only brief | semantic illustration by default | Six styles upgrade using the table below. Set brief `legacyArt: true`, CLI `--legacy-art`, or MCP `legacyArt: true` to retain the previous illustration. |

## Semantic scenes (v3)

Add `visual.semantic` to each phase to describe a style-neutral object model:

- `primitive`: `table-rows`, `card-collection`, `counter` or `file-download`.
- `entities`: stable `id` and `kind`, with optional brief-authored `label`, `value` or `progress`.
- `relations`: explicit `duplicate-of`, `member-of` or `counts` links.
- `states`: a state keyed by every entity ID; `actions`: events keyed by entity ID with optional target.
- `illustrative`: marks synthetic example data on the scene and, optionally, individual entities. Missing entity flags inherit the scene flag, which inherits the brief flag.

Entity IDs and kinds must match in every phase. Unknown entity references/kinds, states and actions fail before rendering with `UNSUPPORTED_ENTITY`, `UNSUPPORTED_STATE` or `UNSUPPORTED_ACTION`, including phase index, submitted value and valid alternatives. A numeric counter value must match its explicit `counts` links to visible rows/cards; if omitted, the renderer derives it from those links. A count never changes unless the relations or authored counter value change.

### Deterministic legacy upgrade (`legacy-state-v1`)

Only kind/state-only briefs for the six styles below upgrade automatically. The selected primitive is declared by that style's renderer vocabulary and matches its existing semantic scene language.

| Style | Legacy `visual.kind` family | Primitive | Generic illustrative entities in every phase |
| --- | --- | --- | --- |
| papercraft | comparison, document | `table-rows` | one `legacy-records` table and four stable `legacy-record-a`…`legacy-record-d` rows |
| papercraft | checklist, process, lista, proceso | `card-collection` | one `legacy-collection` and four stable `legacy-item-a`…`legacy-item-d` cards |
| brutalist | comparison, document | `table-rows` | one `legacy-records` table and four stable `legacy-record-a`…`legacy-record-d` rows |
| brutalist | checklist, process, lista, proceso | `card-collection` | one `legacy-collection` and four stable `legacy-item-a`…`legacy-item-d` cards |
| isotype | comparison, document | `card-collection` | one `legacy-collection` and four stable `legacy-item-a`…`legacy-item-d` cards |
| isotype | checklist, process, lista, proceso | `card-collection` | one `legacy-collection` and four stable `legacy-item-a`…`legacy-item-d` cards |
| opart | comparison, document | `card-collection` | one `legacy-collection` and four stable `legacy-item-a`…`legacy-item-d` cards |
| opart | checklist, process, lista, proceso | `card-collection` | one `legacy-collection` and four stable `legacy-item-a`…`legacy-item-d` cards |
| renaissance | comparison, document | `card-collection` | one `legacy-collection` and four stable `legacy-item-a`…`legacy-item-d` cards |
| renaissance | checklist, process, lista, proceso | `card-collection` | one `legacy-collection` and four stable `legacy-item-a`…`legacy-item-d` cards |
| ukiyoe | comparison, document | `card-collection` | one `legacy-collection` and four stable `legacy-item-a`…`legacy-item-d` cards |
| ukiyoe | checklist, process, lista, proceso | `card-collection` | one `legacy-collection` and four stable `legacy-item-a`…`legacy-item-d` cards |

Catalog labels are localized to `es` or `en`. Every generated entity and the scene itself are marked `illustrative: true`; IDs and entity kinds stay fixed across phases. The state mapping is `unreviewed`, `before`, `pending`, `list` → `pending`; `flagged`, `signal`, `observation`, `observacion` → `flagged`; and `review-ready`, `reviewed`, `ready`, `done`, `verified` → `ready-for-review`. Unknown states still fail with `UNSUPPORTED_STATE`.

The upgrade creates no values, progress, relations, actions or counts. No item is added or removed between phases. Only the mapped visual state changes, and the brief's narrative text is copied unchanged. `legacyArt: true` keeps the prior `legacy-object` path. The seven styles without semantic scenes (`artdeco`, `bestiary`, `galactic`, `memphis`, `nature`, `psychedelic`, `vaporwave`) keep the previous drawing path. New manifests record `upgrade.applied`, `upgrade.mapping` and `upgrade.reason`; mappings include `legacy-state-v1:<style>:<comparison|checklist>`, `legacy-art-opt-out`, `legacy-renderer` and `native-semantic`.

Papercraft implements all four primitives at 16:9 and 1:1 in es/en. Its 16 `supported` capability cells are covered by decoded object-region tests in `test/narrative-semantic-render.test.ts`. Isotype adds `counter` and `card-collection` in 16:9, 1:1 and 9:16 for es/en; its 12 cells are covered by `test/narrative-semantic-style-render.test.ts`. Op Art adds `card-collection` in all three ratios for es/en; its six cells use the same decoded optical-group tests. The matrix now has 34 `supported`, 182 `fallback` and 96 `unsupported` cells. No style/aspect/locale is marked supported from source inspection alone.

## Isotype gallery migration

The Isotype comparison and checklist briefs now declare six countable pictograms in each phase and explicitly mark the example illustrative. A selected unit moves into a review area while the six-unit total remains visible. The renderer supports only `counter` and `card-collection`; table rows and file downloads keep reasoned fallbacks because those primitives do not map naturally to this pictogram language. Both updated packs have regular and `--art-only` GIF, static PNG, contact sheet and manifest outputs. The previous Isotype exports were removed after the new artifacts were rendered and visually inspected. `test/narrative-gallery-repro.test.ts` checks the regular gallery packs and the Isotype art-only outputs byte-for-byte.

## Op Art gallery migration

The Op Art comparison and checklist briefs now model six illustrative optical motifs as a `card-collection`. The lower group shifts and changes focus/stripe phase while the central reading band remains fixed. No counter, source or product figure is invented. Only `card-collection` is supported; table rows, counters and file downloads retain reasoned fallbacks. Both packs have regular and `--art-only` GIF, static PNG, contact sheet and manifest outputs; their art-only manifests retain the paused holds and entity regions. The previous ring-only exports were removed after three render/inspection rounds. `test/narrative-gallery-repro.test.ts` reproduces all four art-only Isotype and Op Art variants alongside all 28 regular packs.

## Review gallery count and test scheduling

The gallery generator discovers every manifest below `docs/narrative-gif`. The four added art-only manifests (Isotype and Op Art × comparison/checklist) therefore raise the existing gallery count from 40 to 44. The CLI/MCP and library gallery assertions now expect 44, and the checked-in `GALLERY.html` is regenerated from the same manifest tree. This is an additive count change; no visual, contrast, legibility or semantic threshold was lowered.

`pnpm test` sets Node's test-file concurrency to 1 because the full parallel run caused unrelated CLI, Chromium and GIF-rendering workers to exit before their suites completed on this loaded machine. The affected Isotype and papercraft semantic suites, CLI suite and 52-case browser legibility audit all passed when run alone. Serial execution retains every test and assertion; it avoids competing browser, renderer and child-process work.

The evaluator records per-entity bounding regions and independently decoded pixel diffs across consecutive holds, all transition midpoints and the last-to-first loop join. It reports which IDs changed state. Text-only, decoration-only and identical-object negative controls do not pass. Composition balance is recorded for every one of those captures. `beauty narrative --art-only` and MCP `artOnly: true` create a separate pack without the title, phase labels or body copy while retaining semantic labels that belong to the illustrated object. Manifest v3 retains `artOnly`, `semanticObjectCaptures` and structured `compositionByFrame` evidence, and adds per-frame/phase/region transformation evidence under `evaluation.automatedEvidence`.

## Ledger de revisión (manifest v3)

El ciclo detallado está en [REVIEW-PROCESS.md](REVIEW-PROCESS.md). `beauty review` añade un registro a `<pack>.review.json` con reviewer, fecha, seis criterios visuales, los cinco niveles, feedback y hashes exactos de GIF/PNG/manifiesto canónico. `beauty review-state` comprueba esos hashes; una diferencia devuelve `stale` y conserva los registros históricos. La auto-revisión no aprueba.

Los campos de galería derivados (`reviewState`, número de comentarios abiertos, enlaces, recomendación y `evaluation.visual-review`) quedan excluidos del hash canónico para evitar ciclos. Cambiar brief, renderer, controles u otros datos estáticos del manifiesto sí cambia el hash. Cada render existente incrementa `renderRevision`, incluso con píxeles deterministas idénticos, y deja obsoleta la aprobación previa. Las rutas de `feedbackFrames` son relativas al manifiesto; se crean únicamente al usar `--frames` y apuntan a PNG decodificados de forma independiente.

`beauty rerender <manifest> [--apply-feedback]` reutiliza el brief normalizado y seed conservados. Cada ejecución añade una entrada de cambio con hashes, feedback atendido, diferencias de frames/regiones, tiempo y bytes. Solo feedback con diferencia medida dentro de su frame y región puede pasar de `open` a `fixed`; un render idéntico no lo resuelve. Las evaluaciones automáticas son proxies; la recomendación `consider-publication`, cuando exista, exige revisión humana independiente y cinco niveles en pass, y nunca publica el artefacto.

## Defaults and compatibility

- Old recipes and pilots with `status` continue to normalize. If an old brief has `status:done` but no outcome/evidence fields, its final label becomes **Resultado esperado** and it is marked illustrative. This prevents a workflow status from asserting measurement.
- A brief that explicitly claims an observed result must now attach identifiable evidence, an explicit exclusion scope note and `illustrative:false`. The validator rejects a vague scope note that does not name an excluded claim.
- Old `document` composition is an alias for `comparison`. Existing gallery and pilot briefs use declared state values and continue to render.
- The default readable hold formula is preserved: `max(minReadableHoldMs, bodyWordCount × 300ms)`, rounded up to a 10ms GIF delay. Transitions and loop bridge add time beyond phase holds.
- Default `badgePolicy:workflow` retains the previous stamps. New `none` and `custom` policies change pixels only when requested.
- Los manifiestos v2 comprometidos siguen siendo reproducibles desde sus briefs. Los packs no se regeneran por esta migración de contrato: el manifiesto v3 aparece en nuevas salidas. Cinco antiguos packs `done` sin evidencia ya cambiaron su etiqueta final a resultado esperado en la etapa anterior; no se altera esa evidencia aquí.

See [ARCHITECTURE.md](ARCHITECTURE.md) for capability counts, timing formula and contract rationale. `test/narrative-gallery-repro.test.ts` checks committed pack bytes against their source briefs.

- The five changed packs are gallery galactic/Hitos de lectura (GIF, contact sheet), nature/Archivo de lectura (GIF, contact sheet), and vaporwave/Lectura ordenada (GIF, PNG, contact sheet), plus pilot papercraft/Observación registrada and brutalist/Observación registrada (GIF, contact sheet each). The label is derived from outcome.mode=expected; no evidence or measurement was added.

## Revisión semántica de Renaissance y Ukiyo-e · issue 7, etapa 2b

Cuatro paquetes de galería cambian intencionalmente de historia y de arte. Los briefs conservan las rutas `gallery/<style>/<composition>/brief.json`; el CLI regeneró GIF, PNG, contacto y manifiesto en cada carpeta. Los nombres anteriores se retiraron después de la generación nueva para que no queden manifiestos huérfanos. La reproducción sigue indexando los mismos 22 briefs de galería y seis briefs piloto.

| Estilo/composición | Historia previa | Semántica y transformación nueva |
| --- | --- | --- |
| Renaissance/comparison | señal junto a un único fragmento (`cambios-que-se-revisan-7cff1462`) | `card-collection`: cuatro paneles hallados fuera de asiento y reunidos dentro de un arco asimétrico (`piezas-del-arco-e87a8a9d`) |
| Renaissance/checklist | pasos de lectura con una única pieza roja (`ruta-para-revisar-el-cierre-66d5877c`) | `counter`: paneles A–D; las relaciones explícitas cambian el conteo 1 → 2 → 4 (`cuenta-del-fresco-7045d15f`) |
| Ukiyo-e/comparison | bote en una ruta punteada sin fallo definido (`senal-42f06804`) | `file-download`: bote/archivo, progreso hasta 55%, fallo fijo, reintento en curso; el cierre sigue pendiente (`travesia-interrumpida-3bca935f`) |
| Ukiyo-e/checklist | señal de revisión genérica (`senal-e509628a`) | `card-collection`: tres estaciones costeras; horizonte y punto de referencia fijos mientras avanza la pertenencia a la ruta (`estaciones-de-la-costa-fa304104`) |

Los cuatro paquetes anteriores y todos sus GIF, PNG, manifiestos y hojas de contacto quedaron retirados después de generar los cuatro nuevos en sus mismas carpetas. Las variantes solo-arte se guardan fuera de `gallery/` en `art-only/<style>/<composition>/`; así no se convierten en paquetes adicionales en la galería ni cambian el recuento de la prueba de reproducción. Sus GIF mantienen los mismos holds, puntos medios y unión de loop, sin título ni copy narrativo.

La matriz únicamente promueve a `supported` las celdas 16:9 con prueba bilingüe, GIF decodificado, regiones de objeto y cambio de estado/píxeles. Renaissance cubre `card-collection` y `counter`; Ukiyo-e cubre `card-collection` y `file-download`. Otras combinaciones conservan su fallback explícito o `unsupported` por aspecto. Los manifiestos siguen marcando revisión visual `pending`.
