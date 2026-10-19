# MCP server

`open-beauty-site` exposes a stdio MCP server with seventeen tools and twenty-two resources. The server is deliberately narrow: it does not call an LLM, it does not browse the web, and it does not invent content. It turns a short brief into a complete, validated artefact.

## Build

```bash
pnpm install
pnpm build
node dist/mcp/server.js   # starts the stdio server; normally a client does this
```

The server needs the bundled `fonts/` directory at runtime. It locates the package root by walking up from `dist/mcp/server.js`, so do not move `dist/` away from the repo.

## Register the MCP server for Codex/Claude

The one-command way to register the server is to print the exact snippet for
your machine. It never edits your config files; you copy the block you need.

```bash
pnpm mcp:config
```

It prints the absolute path of `dist/mcp/server.js` plus the blocks below, with
your real path in place of `<repo>`:

```toml
# Codex CLI (~/.codex/config.toml)
[mcp_servers.open_beauty]
command = "node"
args = ["<repo>/dist/mcp/server.js"]
startup_timeout_sec = 30.0
```

```bash
# Codex one-liner
codex mcp add open-beauty -- node "<repo>/dist/mcp/server.js"

# Claude Code one-liner
claude mcp add -s user open-beauty -- node "<repo>/dist/mcp/server.js"
```

```jsonc
# Cursor / generic JSON
{
  "mcpServers": {
    "open_beauty": {
      "command": "node",
      "args": [
        "<repo>/dist/mcp/server.js"
      ]
    }
  }
}
```

Everything above is printed verbatim by the command (your absolute path replaces
`<repo>`), including the closing reminder: `This script never edits your config files; copy the snippet you need.`

Build `dist/` first when it is missing: `pnpm build`. The CLI prints the same
one-line fix (`dist/cli.js is missing. Run \`pnpm build\` ...`) when it detects
an unbuilt checkout.

## How to look at your output

The validator is a CSS audit, not a browser. Look at the real render before you
ship:

- `beauty_validate` (or `beauty validate <file> --style <s> --strict`) for the
  craft grade and fixes.
- Open the HTML in a browser at 360px, 768px and 1440px.
- Screenshot with Playwright once it is installed:

  ```bash
  pnpm add -D playwright && pnpm exec playwright install chromium
  pnpm exec playwright screenshot --full-page out/nature.html out/nature.png
  ```

- For a GIF, count frames and check the loop instead of trusting the file size:

  ```bash
  python -X utf8 -c "from PIL import Image; im=Image.open('out/n.gif'); print(im.n_frames, im.info.get('loop'))"
  ```

Scroll through a page before capturing it: sections reveal on scroll and a
full-page screenshot can show blank bands.

## Client configuration

### Claude Code

```bash
claude mcp add -s user open-beauty -- node "C:/absolute/path/open-beauty-site/dist/mcp/server.js"
```

### Codex

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.open_beauty]
command = "node"
args = ["C:/absolute/path/open-beauty-site/dist/mcp/server.js"]
startup_timeout_sec = 30.0
```

Or use the CLI:

```bash
codex mcp add open-beauty -- node "C:/absolute/path/open-beauty-site/dist/mcp/server.js"
```

### Cursor

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "open-beauty": {
      "command": "node",
      "args": ["C:/absolute/path/open-beauty-site/dist/mcp/server.js"]
    }
  }
}
```

### Any stdio client

Spawn `node <repo>/dist/mcp/server.js` and speak MCP over stdin/stdout. stderr is free for diagnostics; stdout is protocol-only.

## Tools

All tools return human-readable text. Errors are returned with `isError: true` and a message that says what to fix.

### `beauty_list_styles`

No arguments. Returns the thirteen styles with their display font, best use cases and what to avoid.

### `beauty_get_style`

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | one of `renaissance`, `brutalist`, `papercraft`, `artdeco`, `isotype`, `opart`, `ukiyoe`, `bestiary`, `psychedelic`, `memphis`, `vaporwave`, `galactic`, `nature` | yes | |
| `format` | `markdown \| json` | no | Markdown by default; JSON returns the full preset. |

Returns the hard tokens: exact fonts, palette, border widths, radii, motion window, shadow rule, layout rules, copy voice and a `Never` list. This is the single source of truth.

### `beauty_get_skill`

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | style slug | no | Appends that style guide to the skill. |
| `format` | `page \| deck \| experience \| story \| agile \| sprint \| motion \| canvas \| sequence` | no | Appends the matching skill. |

Returns the contents of `skills/beauty.md` plus the matching skill (`presentation`, `experience`, `story` or `agile`). Load it into an agent's context before asking it to design.

### `beauty_create_page`

Creates a full HTML page and writes it to disk.

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | style slug | yes | |
| `maxxing` | boolean | no | Full art direction. |
| `title` | string (≤120) | yes | The headline. |
| `tagline` | string (≤200) | no | One sentence. |
| `intro` | string (≤900) | no | Manifesto paragraph. |
| `eyebrow` | string (≤60) | no | Small label above the headline. |
| `brand` | string (≤50) | no | Defaults to the title. |
| `sections` | array (≤6) | no | `{ kicker?, title, body }`. Two or three work best. |
| `quote` | `{ text, author? }` | no | |
| `cta` | `{ label, href }` | no | Defaults to a locale-aware CTA. |
| `footer` | string (≤160) | no | |
| `locale` | `es \| en` | no | Defaults to `es`. |
| `seed` | integer | no | Composition archetype: `0` default, `1` mirrored hero, `2` full-bleed (papercraft). |
| `subfamily` | string | no | Curated tone/composition family from `beauty_get_style`; changes the lead accent on showcase pages. |
| `output` | string | no | Defaults to `beauty-output/<style>-<slug>-<timestamp>.html`. |
| `include_html` | boolean | no | Also return the full HTML in the response. |

Returns the absolute path, craft grade/score, vision score (0–4), fonts used and up to six issues with fixes.

### `beauty_create_deck`

Creates a 16:9 animated presentation. The cover and closing are generated; `slides` is the content in between.

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | style slug | yes | |
| `maxxing` | boolean | no | Full art direction. |
| `title` | string (≤120) | yes | Deck title on the cover. |
| `tagline` | string (≤200) | no | One sentence under the title. |
| `slides` | array (1–8) | yes | `{ layout?, kicker?, title, body?, points?, stats?, quote?, figure? }`. Layouts: `statement`, `points`, `stats`, `quote`, `figure`. |
| `subfamily` | string | no | Structural family: `sala`, `gabinete` or `cartel` mode from the style guide. |
| `cta` | `{ label, href }` | no | Used on the closing slide. |
| `locale` | `es \| en` | no | |
| `output` | string | no | Defaults to `beauty-output/<style>-deck-<timestamp>.html`. |

The deck includes keyboard/touch navigation, progress, fullscreen, print styles, `inert` hidden slides, `aria-live` and reduced-motion handling. Craft and the deck audit both run.

### `beauty_create_sprint`

Corpo pack. Takes one sprint brief and writes three coordinated decks and three matching GIFs into one folder: review, retrospective and planning. Metrics are evidence; never invent them.

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | style slug | yes | One system for the whole kit. |
| `sprint` | string | yes | Number or name. |
| `team`, `date` | strings | no | Visible in the covers. |
| `summary` | string | no | One honest sentence that opens the review. |
| `metrics` | array (≤3) | no | `{ label, value }`; capacity or delivery evidence. |
| `highlights`, `blockers`, `next` | string arrays (≤4) | no | Demoed work, systemic friction, small bets. |
| `quote` | object | no | `{ text, author? }`. |
| `maxxing` | boolean | no | Full ornament and type contrast. |
| `output` | string | no | Folder; defaults to `beauty-output/sprint-<sprint>`. |

Every deck is validated; the three GIFs use the same style. If a deck is not A/100 + 4/4, fix the brief and regenerate the kit.

### `beauty_create_experience`

Creates a 3–8 room, single-file digital place: restaurant, museum, history room, studio, club or garden. Each room has a procedural scene, copy, optional objects and a room rail.

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | style slug | yes | |
| `maxxing` | boolean | no | Full art direction. |
| `kind` | `restaurant \| museum \| history \| studio \| club \| garden` | no | Defaults to `studio`. |
| `title`, `tagline`, `intro`, `brand` | strings | title yes | |
| `rooms` | array (3–8) | yes | `{ kicker?, title, body?, display?, items?, quote?, note? }`. |
| `items` | array (≤6) | no | `{ label, value?, detail? }` for dishes, exhibits or dates. |
| `hours`, `address`, `source` | strings | no | Visible facts; never invent them. |
| `output` | string | no | Defaults to `beauty-output/<style>-<kind>-<slug>-<timestamp>.html`. |

### `beauty_create_story`

Creates a chaptered story, history lesson or narrative essay: cover, chapter navigation, drop cap, plates, margin facts and source.

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | style slug | yes | |
| `maxxing` | boolean | no | Full art direction. |
| `kind` | `story \| history \| lesson \| essay` | no | Changes the art register; history expects a source. |
| `title`, `tagline`, `intro`, `brand` | strings | title yes | |
| `chapters` | array (2–8) | yes | `{ kicker?, title, body, quote?, fact?, scene? }`; 80–250 words each. `scene` is a papercut scene for storybook. |
| `source` | string | no | Required for history/lesson in practice. |
| `readingTime` | string | no | e.g. `6 min`; otherwise estimated. |
| `format` | `scroll \| storybook` | no | `storybook` gives one illustrated papercut page per chapter. |
| `output` | string | no | Defaults to `beauty-output/<style>-story-<slug>-<timestamp>.html`. |

### `beauty_create_gif`

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | style slug | yes | |
| `text` | string (≤48) | yes | Short headline. |
| `subtitle` | string (≤64) | no | Small caption. |
| `template` | `title \| loop \| poster` | no | `title` by default. |
| `width`, `height` | 240–1200 | no | 800×800 by default. |
| `fps` | 8–30 | no | 24 by default. |
| `duration` | 1–6 seconds | no | 2.4 by default. |
| `output` | string | no | Defaults to `beauty-output/<style>-<slug>-<timestamp>.gif`. |

Returns path, dimensions, frame count, fps and file size. Frames are capped at 180.

### `beauty_create_narrative`

Accepts the same normalized `narrative-gif` brief as `beauty narrative`. The production pilots are `papercraft` with `subfamily: "editorial"` (default), and `brutalist` with `subfamily: "documentary"` (default) or `"poster"` to keep the existing high-contrast poster direction available. Both pilot scenes support 16:9, 1:1 and 9:16 without cropping or stretching. The other eleven styles still return `STYLE_NOT_SUPPORTED_YET` and name the two supported styles. Exports include a real GIF, PNG, contact sheet and manifest with independently decoded timing and five separate evaluation levels; visual review remains pending until inspected.

```json
{
  "style": "papercraft",
  "brief": {
    "style": "papercraft",
    "subfamily": "editorial",
    "kind": "narrative-gif",
    "locale": "es",
    "audience": "Producto",
    "title": "Guías claras",
    "status": "in-review",
    "phases": [
      { "id": "before", "label": "Antes", "text": "La medida llegaba sin aviso.", "visual": { "kind": "document", "state": "unreviewed" } },
      { "id": "change", "label": "Cambio", "text": "Ahora aparece una señal de revisión.", "visual": { "kind": "document", "state": "flagged" } },
      { "id": "result", "label": "Resultado esperado", "text": "Detectar el problema antes de publicar.", "visual": { "kind": "document", "state": "review-ready" } }
    ]
  },
  "output": "out/narrative"
}
```

CLI equivalent: `beauty narrative --style papercraft --brief brief.json --out out/narrative`. Run `beauty narrative --help` for the complete schema-derived field list and JSON example.

### `beauty_create_motion`

Creates a single-file, looping **animated SVG poster**. It is not a GIF: it is an SVG with CSS keyframes, a reduced-motion fallback, exact style fonts, palette and a scene vocabulary.

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | style slug | yes | |
| `title` | string (≤90) | yes | 2–6 words; the renderer fits the width. |
| `subtitle`, `eyebrow`, `brand`, `footer` | strings | no | Caption, label, signature, source. |
| `scene` | `orbit \| bloom \| tide \| papercut \| constellation \| ribbon \| rain \| type` | no | Defaults to `orbit`. |
| `size` | `square \| portrait \| landscape` | no | 1200², 1000×1400 or 1600×1000. |
| `duration` | number (6–24) | no | Seconds; default 14. |
| `seed` | integer | no | Deterministic ornament variation. |
| `maxxing` | boolean | no | Grain, extra rings/particles and more type contrast. |
| `output` | string | no | Defaults to `beauty-output/<style>-motion-<slug>-<timestamp>.svg`. |

The SVG includes `<title>`, `<desc>`, `@keyframes`, `prefers-reduced-motion` and no external images or scripts. Google Fonts are imported by URL; if the SVG is offline, the font stack falls back to a system face.

### `beauty_create_sequence`

Builds a frame-by-frame story: 2–12 frames, each an open canvas layer stack. Writes an animated SVG and a GIF from the same frames. Use it for a public-domain story, a visual essay, a process or a short comic.

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | style slug | yes | |
| `title`, `author`, `license` | strings | no | License is visible and must not call a copyrighted work public domain. |
| `frames` | array (2–12) | yes | `{ id?, duration?, background?, texture?, layers }`; each frame needs layers. |
| `fps` | number (4–24) | no | Default 12. |
| `frameDuration` | number | no | Default seconds per frame; a frame can override. |
| `width`, `height` | numbers | no | Defaults from `size`. |
| `output` | string | no | Base path without extension; writes `.svg` and `.gif`. |

The SVG uses per-frame keyframes and a reduced-motion first frame. The GIF is rasterised from the same static frame SVGs. Assets require `alt`; captions and sources are preserved.

### `beauty_create_canvas`

The open canvas. You provide the layers, the geometry, the type and the motion; the tool supplies the style palette, brushes, animation clock, asset metadata and checks.

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | style slug | yes | Palette and type system. |
| `title` | string | no | Accessible title and metadata. |
| `layers` | array (1–96) | yes | `path`, `circle`, `ellipse`, `rect`, `line`, `polygon`, `text`, `image` or `group`. |
| `size` | `square \| portrait \| landscape \| wide` | no | 1200², 1000×1400, 1600×1000, 1600×700. |
| `background` | palette token | no | Defaults to `@bg`. |
| `duration` | number (4–40) | no | Default 14. |
| `texture` | `none \| paper \| grain` | no | Surface texture, no external assets. |
| `credits` | boolean | no | Render image captions/sources; default true. |
| `output` | string | no | Defaults to `beauty-output/<style>-canvas-<slug>-<timestamp>.svg`. |

Layer colours use `@bg`, `@surface`, `@ink`, `@muted`, `@accent`, `@accent2`, `@accent3`, `@accent4` or `@deep`. A hex is accepted only if it is an exact style palette value. Every image requires `alt`; `caption` and `source` go into the SVG metadata and a visible credit line. Animations: `drift`, `float`, `sway`, `spin`, `breathe`, `pulse`, `draw`, `reveal`.

### `beauty_validate`

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | style slug | yes | |
| `path` | string | one of path/html | Relative to the server's cwd. |
| `html` | string | one of path/html | Raw HTML. |

Returns a craft score (0–100), a craft grade (A–F), a vision score (0–4), every issue with a fix, and stats (bytes, colours, fonts, radii, durations). Checks:

- exact required fonts and forbidden fonts;
- hex colours outside the palette;
- border widths outside the style;
- border-radius outside the style;
- shadow recipe (hard vs soft vs none);
- motion duration sanity;
- `<title>`, `<h1>`, `<main>`, `lang`, unresolved placeholders, missing `alt`;
- contrast of the token pairs the style actually uses for text.

For a deck, the same audit also checks slide count, words per slide, points per slide, layout variety, `aria-live`, `inert` and print styles. Experiences get room count, word count, rail, objects, print and reduced motion; stories get chapter count, prose length, nav, lede and print.

Vision (0–4) is a separate heuristic, not a grade:

- `scale-jump`: max/min font size ≥10;
- `flat-fields`: no soft gradients (brutalist allows its grid);
- `asymmetry-or-bleed`: a full-bleed band, clip-path or two-column hero;
- `material`: at least two physical marks (grain, tape, inset edge, draw-on-stroke, 3px border).

Craft and vision remain separate heuristic reports. A `4/4` result measures only these four source/metadata checks; it is not human visual approval. Narrative output reports technical integrity, style conformance, rendered legibility, narrative continuity and visual review independently, and never recommends publishing automatically.

### `beauty_examples`

No arguments. Returns the absolute paths of the reference pages and GIFs. Use them as a visual reference, not as a template to copy.

## Resources

| URI | MIME type | Content |
| --- | --- | --- |
| `beauty://styles/{slug}` | `application/json` | Full preset for each of the 13 styles |
| `beauty://skills/beauty.md` | `text/markdown` | Agent skill |
| `beauty://skills/education.md` | `text/markdown` | Educational page skill |
| `beauty://skills/presentation.md` | `text/markdown` | Animated presentation skill |
| `beauty://skills/experience.md` | `text/markdown` | Room experience skill |
| `beauty://skills/story.md` | `text/markdown` | Story and history skill |
| `beauty://skills/agile.md` | `text/markdown` | Sprint review/retro/planning skill |

Resources are read-only. Use the tools to create files.

## Agent contract

The server sends an `instructions` string on connect. It tells the client to:

1. list styles;
2. read the chosen style;
3. create with real copy;
4. validate and reach A;
5. use the same style for GIFs.

The contract is intentionally repetitive: small models skip steps, so the workflow is enforced in three places — server instructions, tool descriptions and the skill file.

## Limits and security

- Page text is escaped before interpolation. `href` only allows `http(s)://`, `mailto:`, `tel:`, `#` and `/`.
- The server writes files under its own working directory (or the absolute `output` you pass). It does not read arbitrary paths except `beauty_validate`'s `path`, which you supply.
- No network calls at generation time. The generated HTML loads Google Fonts in the browser; self-host the fonts if that is a privacy requirement.
- The GIF renderer uses bundled OFL fonts and `@napi-rs/canvas`; no system font is required.
- HTML is single-file and has no build step. JavaScript is limited to a reveal observer.
- The validator is a pragmatic CSS audit, not a browser. It catches the mistakes small models actually make; it does not prove rendering correctness.
