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

Papercraft implements all four primitives at 16:9 and 1:1 in es/en. Its 16 `supported` capability cells are covered by decoded object-region tests in `test/narrative-semantic-render.test.ts`. Isotype adds `counter` and `card-collection` in 16:9, 1:1 and 9:16 for es/en; its 12 cells are covered by `test/narrative-semantic-style-render.test.ts`. Op Art adds `card-collection` in all three ratios for es/en; its six cells use the same decoded optical-group tests. The matrix now has 34 `supported`, 182 `fallback` and 96 `unsupported` cells. No style/aspect/locale is marked supported from source inspection alone.

## Isotype gallery migration

The Isotype comparison and checklist briefs now declare six countable pictograms in each phase and explicitly mark the example illustrative. A selected unit moves into a review area while the six-unit total remains visible. The renderer supports only `counter` and `card-collection`; table rows and file downloads keep reasoned fallbacks because those primitives do not map naturally to this pictogram language. Both updated packs have regular and `--art-only` GIF, static PNG, contact sheet and manifest outputs. The previous Isotype exports were removed after the new artifacts were rendered and visually inspected. `test/narrative-gallery-repro.test.ts` checks the regular gallery packs and the Isotype art-only outputs byte-for-byte.

## Op Art gallery migration

The Op Art comparison and checklist briefs now model six illustrative optical motifs as a `card-collection`. The lower group shifts and changes focus/stripe phase while the central reading band remains fixed. No counter, source or product figure is invented. Only `card-collection` is supported; table rows, counters and file downloads retain reasoned fallbacks. Both packs have regular and `--art-only` GIF, static PNG, contact sheet and manifest outputs; their art-only manifests retain the paused holds and entity regions. The previous ring-only exports were removed after three render/inspection rounds. `test/narrative-gallery-repro.test.ts` reproduces all four art-only Isotype and Op Art variants alongside all 28 regular packs.

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
