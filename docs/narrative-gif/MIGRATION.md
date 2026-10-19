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
| `playback.minReadableHoldMs` only | `playback.preset` and `phases[].holdMs` | `readable` is the default and keeps a 5000ms minimum floor. `concise` allows explicit per-phase holds from 2000ms. Values are numeric milliseconds; units, non-finite values and holds below the selected floor return `BAD_DURATION`. |
| manifest schema v1 | manifest schema v2 | V2 adds work/outcome/evidence classification and separately reports holds, transitions, loop bridge, entries, total decoded time and per-phase requested/encoded/decoded holds. |

## Semantic scenes (v3)

Add `visual.semantic` to each phase to describe a style-neutral object model:

- `primitive`: `table-rows`, `card-collection`, `counter` or `file-download`.
- `entities`: stable `id` and `kind`, with optional brief-authored `label`, `value` or `progress`.
- `relations`: explicit `duplicate-of`, `member-of` or `counts` links.
- `states`: a state keyed by every entity ID; `actions`: events keyed by entity ID with optional target.
- `illustrative`: marks synthetic example data on the scene and, optionally, individual entities. Missing entity flags inherit the scene flag, which inherits the brief flag.

Entity IDs and kinds must match in every phase. Unknown entity references/kinds, states and actions fail before rendering with `UNSUPPORTED_ENTITY`, `UNSUPPORTED_STATE` or `UNSUPPORTED_ACTION`, including phase index, submitted value and valid alternatives. A numeric counter value must match its explicit `counts` links to visible rows/cards; if omitted, the renderer derives it from those links. A count never changes unless the relations or authored counter value change.

Compatibility is automatic: an old phase with `visual.kind/state` and no `visual.semantic` becomes one stable `legacy-object` illustration with the old phase state and an inherited illustrative flag. Old briefs keep the existing style drawing; scenes without declared object regions report semantic transformation as `pending`.

Papercraft currently implements all four primitives at 16:9 and 1:1 in es/en. Its 16 `supported` capability cells are covered by decoded object-region tests in `test/narrative-semantic-render.test.ts`; other styles remain `fallback` or `unsupported`. The contract deliberately does not mark a style/aspect/locale supported from source inspection alone.

The evaluator records per-entity bounding regions and independently decoded pixel diffs across consecutive holds, all transition midpoints and the last-to-first loop join. It reports which IDs changed state. Text-only, decoration-only and identical-object negative controls do not pass. Composition balance is recorded for every one of those captures. `beauty narrative --art-only` and MCP `artOnly: true` create a separate pack without the title, phase labels or body copy while retaining semantic labels that belong to the illustrated object. Manifest schema v2 remains at version 2 and adds `artOnly`, `semanticObjectCaptures` and `compositionByFrame`.

## Defaults and compatibility

- Old recipes and pilots with `status` continue to normalize. If an old brief has `status:done` but no outcome/evidence fields, its final label becomes **Resultado esperado** and it is marked illustrative. This prevents a workflow status from asserting measurement.
- A brief that explicitly claims an observed result must now attach identifiable evidence, an explicit exclusion scope note and `illustrative:false`. The validator rejects a vague scope note that does not name an excluded claim.
- Old `document` composition is an alias for `comparison`. Existing gallery and pilot briefs use declared state values and continue to render.
- The default readable hold formula is preserved: `max(minReadableHoldMs, bodyWordCount × 300ms)`, rounded up to a 10ms GIF delay. Transitions and loop bridge add time beyond phase holds.
- Default `badgePolicy:workflow` retains the previous stamps. New `none` and `custom` policies change pixels only when requested.
- All 28 committed pack manifests are regenerated as schema v2. Five old `done` packs without evidence intentionally change their final narrative label to expected; GIF/PNG/contact-sheet bytes for other packs remain unchanged. Their workflow stamps still reflect `workflowStatus`.

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
