# Narrative GIF foundation: architecture decision

**Status:** Stage A and the Stage B foundation are complete. The two production pilots are papercraft/editorial and brutalist/documentary; brutalist/poster remains available. The other eleven styles have no production scene.

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
    └──► scene.ts ──► NarrativeScene registry (papercraft + brutalist pilots)
                         │
                         ▼
                    encode.ts ──► GIF + PNG + contact sheet
                         │
                         ├──► verify-gif.ts (independent LZW parser)
                         ├──► evaluate.ts (five non-collapsing levels)
                         └──► manifest.ts (inputs, files, hashes, decode and controls)
```

The scene gets the normalized brief, phase index, local time, safe boxes, all font roles and a seeded RNG. The engine creates one `object` once and passes that same reference to every phase. Production `supportedNarrativeStyles()` is `brutalist, papercraft`; unsupported requests return `STYLE_NOT_SUPPORTED_YET` with that complete supported-style list. `test/support/narrative-scene.ts` injects one tiny renderer only in foundation-specific tests.

## Reuse and compatibility

- `getStyle()` and each existing `typeSystem` provide the style's tokens; `canvasFor()` and `ensureFonts()` supply the current raster environment.
- `gifenc` remains the encoder. The narrative path samples a single palette from representative pixels across every timeline frame, composites real alpha over the style background, records palette loss and then independently decodes the written bytes.
- The legacy `createGif`, `createGifFile`, `renderSequence`, CLI commands and MCP tool names remain available. Narrative gets a separate `beauty narrative` command and `beauty_create_narrative` tool.
- `renderSequence` now rasterizes each authored static scene once and encodes its requested hold as a GIF delay. Its reported `frames`, `fps`, `duration`, SVG and check fields remain present; the GIF's actual frame count is now the authored scene count. This removes the prior repeat inflation and first-scene-only palette.
- The old GIF title API stays compatible. `layoutTitle` now preserves all wrapped lines and accepts an optional diagnostic sink; overflow emits `gif-title-overflow`. Narrative layout instead enforces the minimum readable size and returns `TEXT_OVERFLOW` with the original text intact.

## Contract and rendering rules

`kind` is `narrative-gif`; a brief has 3–5 non-empty phases and `status` controls whether the last label must identify an observed or expected result. Holds use milliseconds, default to and cannot go below 5000ms, and are encoded as one GIF frame delay per phase. Transitions distribute GIF-centisecond delays across frames no longer than 80ms (at least 12.5fps); a 650ms request becomes `80,80,70,70,70,70,70,70,70ms` and does not consume the hold. Looping includes an explicit result-to-before bridge. The default 1280×720 preset and card check use 56px title, 36px body and 24px label minimums at native size; layout also checks ascent/descent, tracking, line height, five-percent safe margins and a reserved art region.

The timeline rejects more than 360 frames, more than 96 million pixel-frames and an estimated working set over 256MiB (GIF output, raster buffers, samples and contact-sheet overhead). The brief rejects dimensions outside supported limits and does not silently resize substantial requests. Output includes GIF, a static PNG and a labeled contact sheet for phase start/hold/exit and loop restart. The manifest records independently decoded dimensions, frame delays, duration, loop, hashes, sizes, role faces, source controls, all five evaluation levels, and the source commit; it contains no credentials. A single `A` or technical pass does not imply style, legibility, narrative or visual approval, and `publicationRecommendation` is always `none`.

## Typography and licensing

The role registry now points every one of the 13 styles at its real guide families: Poiret One/Josefin Sans, Jost/IBM Plex Sans, Space Grotesk, Shippori Mincho B1/Zen Kaku Gothic New, UnifrakturMaguntia/IM Fell English, Bungee Shade, Bricolage Grotesque/DM Sans, Press Start 2P, Michroma and Cormorant Garamond/Karla ship as bundled OFL `.woff2` faces copied from the npm registry (`@fontsource/*`, versions recorded in `fonts/FONTS.md`, packages removed afterwards). The 21 new files add 415,984 bytes (406.2 KiB). Shippori Mincho B1 and Zen Kaku Gothic New ship Latin subsets only; the packaged files cannot render Japanese text. Papercraft keeps Fraunces Soft + Nunito Sans and brutalist keeps Archivo Black + Space Mono, so their committed pilots stay byte-identical.

`src/canvas.ts` records which faces were actually registered from the bundle, so the checks cannot be satisfied by an installed system font. Canvas misreads the Fraunces face's exact registered weight 560; the raster code requests weight 400 so the same bundled typeface renders at normal size. Each role is verified by registering the exact family/weight, then painting and measuring `á é í ó ú ü ñ ¿ ¡ 0–9 % → ·`; the arrow is supplied explicitly by the glyph-complete fallback because the Latin subsets omit it. The previous bundled alternatives remain as an explicit `approvedAlternative` map used only for missing glyph outlines; every substitution is reported in the check output and manifest, and a missing file still raises `FONT_MISSING`. `pnpm fonts:check` runs all 65 style/role checks, prints per-family results and flags synthetic bold/italic against the bundled registry (none are synthesized). `fonts/FONTS.md` records sources, versions, licenses, bytes and per-style roles.

## Evaluation honesty

The five output keys are `technical-integrity`, `style-conformance`, `rendered-legibility`, `narrative` and `visual-review`. Style conformance distinguishes source checks from pixel checks. Legibility measures full-copy retention, type size, style-token contrast ratios, safe-area geometry and decoded holds, while reporting renderer pixel collisions, OCR and card-size reading as pending. Narrative checks phase structure, object reference continuity, state change and status wording; causal meaning still needs a person. Visual review is `pending` until a human or identified visual model records evidence. Negative controls reject identical frames, cut text, missing fonts, destructive palettes and impossible durations; passing a file-format check cannot approve them.

## Determinism and limits

The pilot E2E tests require byte-identical GIF, poster PNG and contact-sheet bytes for the same brief and seed in this environment; manifest paths reflect the chosen output directory. The manifest scopes rendering determinism to the same OS, architecture, Node/dependency lock and `@napi-rs/canvas`/`gifenc` versions; it makes no cross-platform byte-equality claim. The independent LZW decoder is compared with `ffprobe` where available. Human visual review and 640×360 reading checks are recorded separately; they remain pending until an identified reviewer records evidence.

## Stage B pilot renderers

- **Papercraft/editorial:** one persistent `guía` card with controlled cut edges, a visible notch, layered paper shadows at 2/14/30px, and a torn butter ribbon. The `comparison` composition uses a marked editorial sheet; `checklist` uses the same sheet as a review list. Seeded changes are limited to cut variant, backing paper, small rotation and ribbon angle. State changes add a terracotta signal and a separate `EN REVISIÓN` mark; the card text remains unobscured.
- **Brutalist/documentary:** one persistent form/ticket with sharp 3px borders, hard offset shadow, a ledger grid, blank fields and a dedicated status margin. `comparison` uses a form with a perforated blank stub; `checklist` uses ruled review rows. An observation stamp occupies a reserved footer and a separate checkbox records review-ready. No value, date, folio or measurement is invented. `poster` keeps a distinct high-contrast sign composition.
- Both pilots support 16:9, 1:1 and 9:16. The object stays inside the shared safe/art areas; no square or portrait output is cropped or stretched. A layout overflow returns `TEXT_OVERFLOW` with the complete copy retained in the diagnostic source.
- See `styles/papercraft.md`, `styles/brutalist.md` and `pilots/REVIEW.md` for composition contracts, rendered evidence, iterations and remaining weaknesses.
