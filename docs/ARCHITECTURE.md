# Architecture

## The bet

A small model cannot reliably invent a design system. It can, however, fill a brief and call a tool. So the harness moves every design decision into code and data:

- **presets** own fonts, colours, borders, radii, spacing, motion and copy voice;
- **renderers** own layout and component composition;
- **validator** owns the quality gate;
- **MCP/CLI** expose the smallest possible surface;
- **skills** teach the model the workflow in natural language.

The model supplies content and judgement. It never supplies a hex colour or a font stack.

```
brief + style ──► preset ──► renderer ──► HTML ──► validator ──► score + fixes
                     │
                     └────► canvas frames ──► gifenc ──► GIF
```

## Layers

### 1. Types (`src/types.ts`)

`Brief`, `StylePreset`, `TypeSystem`, `MotionSystem`, `ValidationResult`, `GifOptions`. Presets are data: palette, fonts, rules, type, motion, guidance, signature moves, CSS markers.

### 2. Presets (`src/styles/presets.ts`)

Thirteen complete systems. Each one includes:

- a palette with semantic roles (`bg`, `surface`, `ink`, `muted`, `accent`, `accent2`, `accent3`, `deep`);
- exact font families plus the Google Fonts URL;
- machine-readable rules (`radius`, `borderWidths`, `borderStyles`, `motion`, `requiredFonts`, `forbiddenFonts`, `shadowPattern`);
- `typeSystem`: display case, tracking, leading, body size, label tracking, OpenType features;
- `motionSystem`: enter, distance, stagger, easing, page transition, ambient, hover and reduced-motion note;
- human-readable guidance broken into typography, colour, layout, motion, imagery, copy, don't;
- signature moves that make the style recognisable in a thumbnail.

### 3. Page renderers (`src/page/*.ts`)

One renderer per style, each with its own CSS and markup. They share only a shell (`src/page/common.ts`): escaping, locale labels, fonts, favicon, reveal script, scroll progress, type/motion tokens and print rules.

Why not one generic template with token substitution? Because that produces recolours of the same page. The styles differ in structure, not just colour:

- Renaissance is a centred folio with a fixed double hairline, an arch plate, a drop cap and roman numerals.
- Brutalist is a split poster with a visible grid, 3px borders, hard shadows, a marquee and an oversized numeral.
- Paper craft is a layered collage with tape, asymmetric radii, scalloped dividers and a float loop.

Every page is single-file HTML: inline CSS, inline SVG, a ~15-line IntersectionObserver, no build step, no runtime dependency.

### 4. Validator (`src/validate.ts`)

A pragmatic CSS audit. It extracts the `<style>` block and checks:

- required fonts are present and forbidden fonts are not used as the first family;
- every hex colour belongs to the palette;
- border widths and radii stay inside the preset's range;
- shadows match the style (hard offset, soft warm, or none);
- transition/animation durations are sane;
- document landmarks, one `h1`, `lang`, unresolved placeholders, image `alt`;
- contrast of the token pairs that actually carry text.

Scoring: 100 minus 18 per error, 6 per warning, 1 per info. Grades: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F below.

The validator is deliberately not a CSS parser. It targets the failure modes of generated design: wrong font, invented colour, generic radius, soft shadow in brutalist, missing palette, invisible text.

### 5. GIF renderer (`src/gif.ts`)

`@napi-rs/canvas` draws each frame; `gifenc` quantizes and encodes. The palette is sampled from a **fully revealed frame**, not frame 0, so ink and accent colours that appear later are not mapped to parchment.

Three templates:

- `title`: reveal + hold;
- `loop`: seamless marquee/float;
- `poster`: ambient shapes.

Each style has its own frame function: gold arch and sun (Renaissance), black panel and acid ticker (Brutalist), paper cards and blobs (Paper craft). The fonts are bundled TTFs, so the GIF looks the same on every machine.

### 6. Experiences and stories

`src/page/experience.ts` turns a brief into 3–8 full-viewport rooms, a room rail, keyboard navigation and a scene per room. `src/page/story.ts` builds a cover, chapter nav, prose with a drop cap, plates, margin facts and source. `src/art.ts` draws original scenes per style and subject (table, vitrine, river, house) and keeps captions attached to the text.

These are not generic templates with colour substitution: each style supplies palette, type and motion through the shared shell, and each renderer has a different reading structure.

### 7. Sprint kit (`src/sprint.ts`)

One `SprintBrief` becomes a coordinated corpo pack: review, retrospective and planning decks plus three GIFs. The module builds three `DeckBrief`s, delegates to `createDeck`, then to `createGifFile`. It is exposed as `beauty sprint` and `beauty_create_sprint`, so a team can go from a JSON brief to a full ritual without hand-writing HTML.

### 8. Maxxing (`src/maxxing.ts`)

An optional second art direction. `applyMaxxing` injects a body class, one original style-specific SVG layer and a small CSS/motion system into an already-rendered artefact. It never changes the palette or required fonts, so it can be applied to pages, decks, experiences and stories without weakening the validator. GIFs receive their own maxxing layer in `src/gif.ts`.

### 9. MCP server (`src/mcp/server.ts`)

`McpServer` over stdio. Eleven tools, nineteen resources, and an `instructions` string that repeats the workflow. The tools call the same `generate.ts` functions as the CLI, so the output is identical.

### 10. CLI (`src/cli.ts`)

`beauty styles | guide | page | gif | validate | examples | doctor | mcp`. Useful for humans, CI and agents that cannot load MCP.

### 11. Skills (`skills/*.md`)

The natural-language half of the harness. `beauty.md` is the mandatory workflow; the thirteen style skills are generated from the presets so they cannot drift.

## Determinism

- Layout depends only on the brief and the preset.
- Ornaments and GIF confetti use a seeded PRNG.
- The only time-dependent value is the footer year and the output filename timestamp.
- No image generation, no network, no model call.

The same brief and style produce the same HTML (byte-for-byte except timestamps) and the same GIF frames.

## Extending

To add a style:

1. Add a `StylePreset` in `src/styles/presets.ts`.
2. Add a renderer in `src/page/` and register it in `src/page/index.ts`.
3. Add a frame function in `src/gif.ts` and register it in `RENDERERS`.
4. Add the fonts to `src/canvas.ts` and `fonts/`.
5. Add tests; the validator must accept the generated page at A.
6. Run `pnpm docs` to regenerate the style skill and guide.

To add a component, add it to all renderers with the same content contract; do not add a style-specific option to the MCP tool unless all styles can honour it.

## Known limits

- The generated HTML uses Google Fonts via CDN. For offline/air-gapped use, replace the `<link>` with self-hosted `@font-face`.
- GIF text uses the bundled Latin fonts; emoji and unsupported scripts render as tofu.
- The validator is regex-based; it will not catch every cascade or media-query conflict.
- There are no photographic assets. The styles are illustration/typography-first by design.
- `beauty_create_page` caps text lengths to protect the layout. Longer copy needs a different template, not a bigger cap.
