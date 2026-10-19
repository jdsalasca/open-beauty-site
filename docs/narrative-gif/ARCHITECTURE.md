# Narrative GIF foundation: architecture decision

**Status:** Stage A, the Stage B foundation, and all 13 narrative style renderers are complete. Visual sign-off remains pending. Production scenes cover artdeco, bestiary, brutalist, galactic, isotype, memphis, nature, opart, papercraft, psychedelic, renaissance, ukiyoe, and vaporwave. Brutalist/poster remains available.

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
    └──► scene.ts ──► NarrativeScene registry (13 styles; one renderer per StyleSlug)
                         │
                         ▼
                    encode.ts ──► GIF + PNG + contact sheet
                         │
                         ├──► verify-gif.ts (independent LZW parser)
                         ├──► evaluate.ts (five non-collapsing levels)
                         └──► manifest.ts (inputs, files, hashes, decode and controls)
```

The scene gets the normalized brief, phase index, local time, safe boxes, all font roles and a seeded RNG. The engine creates one `object` once and passes that same reference to every phase. Production `supportedNarrativeStyles()` returns all 13 `StyleSlug` values, each registered once; a renderer lookup for an unknown value returns `STYLE_NOT_SUPPORTED_YET`. `test/support/narrative-scene.ts` injects one tiny renderer only in foundation-specific tests.

## Reuse and compatibility

- `getStyle()` and each existing `typeSystem` provide the style's tokens; `canvasFor()` and `ensureFonts()` supply the current raster environment.
- `gifenc` remains the encoder. The narrative path samples a single palette from representative pixels across every timeline frame, composites real alpha over the style background, records palette loss and then independently decodes the written bytes.
- The legacy `createGif`, `createGifFile`, `renderSequence`, CLI commands and MCP tool names remain available. Narrative gets a separate `beauty narrative` command and `beauty_create_narrative` tool.
- `renderSequence` now rasterizes each authored static scene once and encodes its requested hold as a GIF delay. Its reported `frames`, `fps`, `duration`, SVG and check fields remain present; the GIF's actual frame count is now the authored scene count. This removes the prior repeat inflation and first-scene-only palette.
- The old GIF title API stays compatible. `layoutTitle` now preserves all wrapped lines and accepts an optional diagnostic sink; overflow emits `gif-title-overflow`. Narrative layout instead enforces the minimum readable size and returns `TEXT_OVERFLOW` with the original text intact.

## Contract and rendering rules

`kind` is `narrative-gif`; a brief has 3–5 non-empty phases and `status` controls whether the last label must identify an observed or expected result. Holds use milliseconds, default to and cannot go below 5000ms, and are encoded as one GIF frame delay per phase. Transitions distribute GIF-centisecond delays across frames no longer than 80ms (at least 12.5fps); a 650ms request becomes `80,80,70,70,70,70,70,70,70ms` and does not consume the hold. Looping includes an explicit result-to-before bridge. At 1280×720, layout searches upward to 104px title, 56px body and 30px label, retaining floors of 56/36/24px. Ceilings scale from output dimensions. The measured copy group uses two deliberate 10%-of-frame hierarchy gaps and is vertically centered using the tallest phase label/body, so copy does not jump between holds. Wrapping, ascent/descent, tracking and line height participate in fitting; text is preserved, shrunk only to its floor, then reported as `TEXT_OVERFLOW` if it still cannot fit. Text and art rectangles remain inside five-percent safe margins.

The timeline rejects more than 360 frames, more than 96 million pixel-frames and an estimated working set over 256MiB (GIF output, raster buffers, samples and contact-sheet overhead). The brief rejects dimensions outside supported limits and does not silently resize substantial requests. Output includes GIF, a static PNG and a labeled contact sheet for phase start/hold/exit and loop restart. The manifest records independently decoded dimensions, frame delays, duration, loop, hashes, sizes, role faces, source controls, all five evaluation levels, and the source commit; it contains no credentials. A single `A` or technical pass does not imply style, legibility, narrative or visual approval, and `publicationRecommendation` is always `none`.

## Per-style composition contract

`src/narrative/composition.ts` is the single source for text width, art gap, art width and art vertical bounds. The art x-coordinate is the text area's right edge plus `artGapRatio`; `artY` and `artHeight` are frame-height ratios. The grouped rows below are exact values used to render the committed packages.

| Styles | Text width | Art gap | Art width | Art y | Art height | Change and reason |
|---|---:|---:|---:|---:|---:|---|
| Papercraft, Brutalist | 0.57 | 0.02 | 0.31 | 0.08 | 0.84 | Copy narrowed from 0.60 to open a clearer lane while preserving the form/card art width. |
| Renaissance | 0.43 | 0.02 | 0.45 | 0.05 | 0.90 | Art moved into the five-percent vertical safe inset (from 0.03/0.94). |
| Art Deco | 0.41 | 0.02 | 0.47 | 0.05 | 0.90 | Art widened by 0.02 for the framed document and moved into the safe inset. |
| Isotype | 0.43 | 0.02 | 0.45 | 0.05 | 0.90 | Art moved into the five-percent vertical safe inset (from 0.03/0.94). |
| Op Art | 0.41 | 0.02 | 0.47 | 0.05 | 0.90 | Art widened by 0.02 for the target and moved into the safe inset. |
| Vaporwave, Galactic, Nature | 0.43 | 0.02 | 0.45 | 0.05 | 0.90 | Copy narrowed from 0.44 to give the window, planet and botanical plate clearer separation. |
| Ukiyoe, Bestiary, Psychedelic, Memphis | 0.43 | 0.02 | 0.45 | 0.05 | 0.90 | Art widened from 0.27 to 0.45 and raised from 0.17/0.66 to use the full-height scene lane. |
| Fallback | 0.59 | 0.04 | 0.27 | 0.17 | 0.66 | Unchanged; it is not used by the registered 13-style gallery. |

Papercraft and Brutalist copy lanes were shortened slightly so large titles and body copy have air before their persistent forms. Art Deco and Op Art gained two percentage points of art width after their hero objects proved narrow; Ukiyoe, Bestiary, Psychedelic and Memphis gained eighteen points and a larger vertical lane after their objects were visibly undersized. Renaissance and Isotype use the same width with a corrected vertical inset. Vaporwave, Galactic and Nature give one point of width back to the text lane to retain a clear gap beside the window, planet or plate. Nature's comparison annotations also move left within the art area so `OBSERVACIÓN` and `EN REVISIÓN` remain inside the five-percent right margin; this is the only scene drawing change in this pass.

`NARRATIVE_LABEL_TONE_BY_STYLE` keeps rendered label color and evaluator contrast checks aligned. Contact-sheet midpoint labels remain enabled for the two pilots and Ukiyoe, Bestiary, Psychedelic and Memphis, matching the layout of their committed packs. `test/narrative-gallery-repro.test.ts` guards these rules, checks at least 60% vertical text-column fill, and compares every committed GIF, PNG and contact sheet byte-for-byte.

## Typography and licensing

The role registry now points every one of the 13 styles at its real guide families: Poiret One/Josefin Sans, Jost/IBM Plex Sans, Space Grotesk, Shippori Mincho B1/Zen Kaku Gothic New, UnifrakturMaguntia/IM Fell English, Bungee Shade, Bricolage Grotesque/DM Sans, Press Start 2P, Michroma and Cormorant Garamond/Karla ship as bundled OFL `.woff2` faces copied from the npm registry (`@fontsource/*`, versions recorded in `fonts/FONTS.md`, packages removed afterwards). The 21 new files add 415,984 bytes (406.2 KiB). Shippori Mincho B1 and Zen Kaku Gothic New ship Latin subsets only; the packaged files cannot render Japanese text. Papercraft keeps Fraunces Soft + Nunito Sans and brutalist keeps Archivo Black + Space Mono, preserving their art direction while the shared layout regenerates the pilot exports.

`src/canvas.ts` records which faces were actually registered from the bundle, so the checks cannot be satisfied by an installed system font. Canvas misreads the Fraunces face's exact registered weight 560; the raster code requests weight 400 so the same bundled typeface renders at normal size. Each role is verified by registering the exact family/weight, then painting and measuring `á é í ó ú ü ñ ¿ ¡ 0–9 % → ·`; the arrow is supplied explicitly by the glyph-complete fallback because the Latin subsets omit it. The previous bundled alternatives remain as an explicit `approvedAlternative` map used only for missing glyph outlines; every substitution is reported in the check output and manifest, and a missing file still raises `FONT_MISSING`. `pnpm fonts:check` runs all 65 style/role checks, prints per-family results and flags synthetic bold/italic against the bundled registry (none are synthesized). `fonts/FONTS.md` records sources, versions, licenses, bytes and per-style roles.

## Evaluation honesty

The five output keys are `technical-integrity`, `style-conformance`, `rendered-legibility`, `narrative` and `visual-review`. Style conformance distinguishes source checks from pixel checks. Legibility measures full-copy retention, native and 640×360 effective type sizes, style-token contrast ratios, safe-area geometry and decoded holds. `640x360-effective-size` requires body copy of at least 20px. `composition-balance` decodes the first complete GIF hold, samples a 16×16 set inside each cell of an 8×4 grid, and compares luminance with the style background. It reports empty-cell ratio, vertical text-column fill (occupied grid rows), art/object-area ratio (occupied cells whose centers are outside the text column), and the largest contiguous empty rectangle as a fraction of the 32 cells. It warns with status `revise` when the rectangle exceeds 22%, text-column fill is below 60%, or decoded pixels are unavailable. This is a coarse balance proxy, not an aesthetic score; on a four-row grid, fill changes in 25-point steps. OCR, per-pixel text collisions and human card-size reading remain pending. Narrative checks phase structure, object reference continuity, state change and status wording; causal meaning still needs a person. Visual review is `pending` until a human or identified visual model records evidence. Negative controls include a top-left-crammed frame and an effective body below 20px; passing a file-format check cannot approve them.

## Determinism and limits

`test/narrative-gallery-repro.test.ts` requires byte-identical GIF, PNG and contact-sheet bytes for all 28 committed packs in this environment; manifest paths reflect the chosen output directory. The manifest scopes rendering determinism to the same OS, architecture, Node/dependency lock and `@napi-rs/canvas`/`gifenc` versions; it makes no cross-platform byte-equality claim. The independent LZW decoder is compared with `ffprobe` where available. Human visual review and 640×360 reading checks are recorded separately; they remain pending until an identified reviewer records evidence.

## Stage B pilot renderers

- **Papercraft/editorial:** one persistent `guía` card with controlled cut edges, a visible notch, layered paper shadows at 2/14/30px, and a torn butter ribbon. The `comparison` composition uses a marked editorial sheet; `checklist` uses the same sheet as a review list. Seeded changes are limited to cut variant, backing paper, small rotation and ribbon angle. State changes add a terracotta signal and a separate `EN REVISIÓN` mark; the card text remains unobscured.
- **Brutalist/documentary:** one persistent form/ticket with sharp 3px borders, hard offset shadow, a ledger grid, blank fields and a dedicated status margin. `comparison` uses a form with a perforated blank stub; `checklist` uses ruled review rows. An observation stamp occupies a reserved footer and a separate checkbox records review-ready. No value, date, folio or measurement is invented. `poster` keeps a distinct high-contrast sign composition.
- **Vaporwave:** one dated demo desktop from 1999 keeps its original file, window, horizon and perspective grid. `comparison` moves a file into a review pane; `checklist` turns the same file window into a three-step queue. Press Start 2P is reserved for brief display; Space Grotesk carries reading copy. The screen date marks the fictional interface era, not the Sprint Review date.
- **Galactic:** a single off-center planet bleeds to the right edge while one trajectory moves a probe from an unreviewed position to a stable orbital relation. `comparison` follows one curved route; `checklist` records three waypoints. Michroma is display; Space Grotesk is reading. There is no audio.
- **Nature:** one original, genus-free leaf specimen stays fixed on a flat herbarium plate while a fine annotation arrives and its record settles. `comparison` uses one callout; `checklist` uses observation, annotation and archive rows. Cormorant Garamond and Karla carry display and reading roles. No date, location or provenance is shown because none was supplied.
- Vaporwave, galactic and nature currently support landscape 16:9 only; square and portrait layouts are explicitly rejected instead of being cropped or deformed.
- Both pilots support 16:9, 1:1 and 9:16. The object stays inside the shared safe/art areas; no square or portrait output is cropped or stretched. A layout overflow returns `TEXT_OVERFLOW` with the complete copy retained in the diagnostic source.
- See `styles/papercraft.md`, `styles/brutalist.md`, `styles/vaporwave.md`, `styles/galactic.md`, `styles/nature.md`, `pilots/REVIEW.md` and `gallery/REVIEW-stage-c-vaporwave-galactic-nature.md` for composition contracts, rendered evidence, iterations and remaining weaknesses. The Stage C exports and their manifests are indexed in `gallery/README.md`.
