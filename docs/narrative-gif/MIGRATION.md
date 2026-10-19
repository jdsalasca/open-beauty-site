# Narrative brief migration: v1 to v2

Contract v2 is used by the CLI, library and MCP. The brief schema is defined once in `src/narrative/brief.ts`; `beauty narrative --help` derives its field list from that schema, and `beauty_create_narrative` exposes the same Zod schema. Query `beauty capabilities [--style <s>] [--json]` or MCP `beauty_get_capabilities` before authoring visual values.

## Field mapping

| v1 field or behavior | v2 field or behavior | Migration |
| --- | --- | --- |
| `status: open\|in-review\|done` | `workflowStatus` | `status` remains an accepted deprecated alias and is normalized to both `workflowStatus` and `status`. If both are supplied, they must match. |
| `status: done` implied an observed result | `outcome: { mode: "expected"\|"observed" }` | `workflowStatus: done` alone maps to `outcome.mode: expected`. A finished task can report an unmeasured expected benefit. |
| final phase label authored by the brief | final label derived from `outcome.mode` | The engine writes `Resultado esperado/observado` or `Expected/Observed result` according to locale. |
| no evidence or scope field | `outcome.evidenceRefs` and `outcome.scopeNote` | `observed` requires at least one ref with a stable `id` and readable `label`, plus a scope note that explicitly says what the evidence does not claim. `source` and `date` are optional metadata. |
| no illustrative marker | `illustrative: boolean` | Missing v1 values default to `true`, preserving example/demo content as illustrative. An evidence-backed observed result must set `illustrative:false`. |
| implicit fixed workflow stamp | `badgePolicy` | Defaults to `workflow` to preserve v1 behavior. `none` suppresses workflow stamps/status marks. `custom` requires `badgeText`. |
| arbitrary `visual.kind/state` strings | style-declared visual vocabulary | Existing `comparison`, `checklist`, and legacy `document`, `process`, `lista`, and `proceso` values remain supported. The current states include `unreviewed`, `before`, `pending`, `flagged`, `signal`, `observation`, `observacion`, `review-ready`, `reviewed`, `ready`, `done`, `verified`, and `list`; unknown values now fail before rendering with valid alternatives. Repeating the same state across phases is allowed. No scene currently declares an action. |
| `playback.minReadableHoldMs` only | `playback.preset` and `phases[].holdMs` | `readable` is the default and keeps a 5000ms minimum floor. `concise` allows explicit per-phase holds from 2000ms. Values are numeric milliseconds; units, non-finite values and holds below the selected floor return `BAD_DURATION`. |
| manifest schema v1 | manifest schema v2 | V2 adds work/outcome/evidence classification and separately reports holds, transitions, loop bridge, entries, total decoded time and per-phase requested/encoded/decoded holds. |

## Defaults and compatibility

- Old recipes and pilots with `status` continue to normalize. If an old brief has `status:done` but no outcome/evidence fields, its final label becomes **Resultado esperado** and it is marked illustrative. This prevents a workflow status from asserting measurement.
- A brief that explicitly claims an observed result must now attach identifiable evidence, an explicit exclusion scope note and `illustrative:false`. The validator rejects a vague scope note that does not name an excluded claim.
- Old `document` composition is an alias for `comparison`. Existing gallery and pilot briefs use declared state values and continue to render.
- The default readable hold formula is preserved: `max(minReadableHoldMs, bodyWordCount × 300ms)`, rounded up to a 10ms GIF delay. Transitions and loop bridge add time beyond phase holds.
- Default `badgePolicy:workflow` retains the previous stamps. New `none` and `custom` policies change pixels only when requested.
- All 28 committed pack manifests are regenerated as schema v2. Five old `done` packs without evidence intentionally change their final narrative label to expected; GIF/PNG/contact-sheet bytes for other packs remain unchanged. Their workflow stamps still reflect `workflowStatus`.

See [ARCHITECTURE.md](ARCHITECTURE.md) for capability counts, timing formula and contract rationale. `test/narrative-gallery-repro.test.ts` checks committed pack bytes against their source briefs.

- The five changed packs are gallery galactic/Hitos de lectura (GIF, contact sheet), nature/Archivo de lectura (GIF, contact sheet), and vaporwave/Lectura ordenada (GIF, PNG, contact sheet), plus pilot papercraft/Observación registrada and brutalist/Observación registrada (GIF, contact sheet each). The label is derived from outcome.mode=expected; no evidence or measurement was added.
