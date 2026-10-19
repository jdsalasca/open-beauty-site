# Narrative GIF foundation: architecture decision

**Status:** Stage A + Stage B foundation. No production style scene is registered.

## Decision

Add `src/narrative/` as a style-agnostic story engine with a strict Zod brief, normalized copy and SHA-256, measured layout, phase timeline, palette/encoding pipeline, independent GIF verification, manifest and a five-level evaluation report. A `NarrativeScene` is the only style-specific boundary: each future style owns the same object's composition, material and motion. The core owns text, timing, alpha composition, output files and technical evidence. It does not invent a generic fallback scene.

This keeps one validated brief usable by the library, CLI and MCP without changing the legacy names or their output contracts. `src/types/narrative.ts` is additive; root exports include the new types. The optional `ContentSource` adapter accepts any payload and has no Jira client or product coupling.

## Module boundaries

```text
brief.ts ──► normalized brief + canonical SHA-256
    │
    ├──► fonts.ts ──► existing StylePreset.typeSystem + registered raster roles
    ├──► layout.ts ──► width/height fit, safe area, reserved art area, card-size measures
    ├──► timeline.ts ──► entry, visible hold, transition, explicit loop bridge
    └──► scene.ts ──► NarrativeScene registry (empty in this foundation)
                         │
                         ▼
                    encode.ts ──► GIF + PNG + contact sheet
                         │
                         ├──► verify-gif.ts (independent LZW parser)
                         ├──► evaluate.ts (five non-collapsing levels)
                         └──► manifest.ts (inputs, files, hashes, decode and controls)
```

The scene gets the normalized brief, phase index, local time, safe boxes, all font roles and a seeded RNG. The engine creates one `object` once and passes that same reference to every phase. Production `supportedNarrativeStyles()` is currently empty; unsupported requests return `STYLE_NOT_SUPPORTED_YET` with the complete supported-style list. `test/support/narrative-scene.ts` injects one tiny renderer only in tests.

## Reuse and compatibility

- `getStyle()` and each existing `typeSystem` provide the style's tokens; `canvasFor()` and `ensureFonts()` supply the current raster environment.
- `gifenc` remains the encoder. The narrative path samples a single palette from representative pixels across every timeline frame, composites real alpha over the style background, records palette loss and then independently decodes the written bytes.
- The legacy `createGif`, `createGifFile`, `renderSequence`, CLI commands and MCP tool names remain available. Narrative gets a separate `beauty narrative` command and `beauty_create_narrative` tool.
- `renderSequence` now rasterizes each authored static scene once and encodes its requested hold as a GIF delay. Its reported `frames`, `fps`, `duration`, SVG and check fields remain present; the GIF's actual frame count is now the authored scene count. This removes the prior repeat inflation and first-scene-only palette.
- The old GIF title API stays compatible. `layoutTitle` now preserves all wrapped lines and accepts an optional diagnostic sink; overflow emits `gif-title-overflow`. Narrative layout instead enforces the minimum readable size and returns `TEXT_OVERFLOW` with the original text intact.

## Contract and rendering rules

`kind` is `narrative-gif`; a brief has 3–5 non-empty phases and `status` controls whether the last label must identify an observed or expected result. Holds use milliseconds, default to and cannot go below 5000ms, and are encoded as one GIF frame delay per phase. Transitions distribute GIF-centisecond delays across frames no longer than 80ms (at least 12.5fps); a 650ms request becomes `80,80,70,70,70,70,70,70,70ms` and does not consume the hold. Looping includes an explicit result-to-before bridge. The default 1280×720 preset and card check use 56px title, 36px body and 24px label minimums at native size; layout also checks ascent/descent, tracking, line height, five-percent safe margins and a reserved art region.

The timeline rejects more than 360 frames, more than 96 million pixel-frames and an estimated working set over 256MiB (GIF output, raster buffers, samples and contact-sheet overhead). The brief rejects dimensions outside supported limits and does not silently resize substantial requests. Output includes GIF, a static PNG and a labeled contact sheet for phase start/hold/exit and loop restart. The manifest records the estimated resource use alongside decoded delays, duration, loop, dimensions, hashes, sizes, role faces, controls and source commit; it contains no credentials. A single `A` or technical pass does not imply style, legibility, narrative or visual approval, and `publicationRecommendation` is always `none`.

## Typography and licensing

The role registry records each guide-preferred family and the approved bundled face used for raster output. It checks registered weights and draws/measures `á é í ó ú ü ñ ¿ ¡ 0–9 % → ·`; a missing role or glyph raises `FONT_MISSING`. `pnpm fonts:check` executes all 65 style/role checks. No fonts were downloaded or installed: only existing OFL files are used. `fonts/FONTS.md` lists effective role families, licenses and the Fraunces Soft metrics issue. Alternatives are implementation choices awaiting style-specific visual approval.

## Evaluation honesty

The five output keys are `technical-integrity`, `style-conformance`, `rendered-legibility`, `narrative` and `visual-review`. Style conformance distinguishes source checks from pixel checks. Legibility measures full-copy retention, type size, style-token contrast ratios, safe-area geometry and decoded holds, while reporting renderer pixel collisions, OCR and card-size reading as pending. Narrative checks phase structure, object reference continuity, state change and status wording; causal meaning still needs a person. Visual review is `pending` until a human or identified visual model records evidence. Negative controls reject identical frames, cut text, missing fonts, destructive palettes and impossible durations; passing a file-format check cannot approve them.

## Determinism and limits

The E2E test requires byte-identical GIF, poster PNG and contact-sheet bytes for the same brief and seed in this environment; manifest paths reflect the chosen output directory. The manifest scopes rendering determinism to the same OS, architecture, Node/dependency lock and `@napi-rs/canvas`/`gifenc` versions; it makes no cross-platform byte-equality claim. The independent LZW decoder is compared with `ffprobe` where available. No production style renderer, full-animation visual review, 13-style GIF gallery, human legibility review or reference-board comparison is delivered in this foundation; those remain Stage C/D work.
