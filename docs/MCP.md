# MCP server

`open-beauty-site` exposes a stdio MCP server with seven tools and four resources. The server is deliberately narrow: it does not call an LLM, it does not browse the web, and it does not invent content. It turns a short brief into a complete, validated artefact.

## Build

```bash
pnpm install
pnpm build
node dist/mcp/server.js   # starts the stdio server; normally a client does this
```

The server needs the bundled `fonts/` directory at runtime. It locates the package root by walking up from `dist/mcp/server.js`, so do not move `dist/` away from the repo.

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

No arguments. Returns the eleven styles with their display font, best use cases and what to avoid.

### `beauty_get_style`

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | one of `renaissance`, `brutalist`, `papercraft`, `artdeco`, `isotype`, `opart`, `ukiyoe`, `bestiary`, `psychedelic`, `memphis`, `vaporwave` | yes | |
| `format` | `markdown \| json` | no | Markdown by default; JSON returns the full preset. |

Returns the hard tokens: exact fonts, palette, border widths, radii, motion window, shadow rule, layout rules, copy voice and a `Never` list. This is the single source of truth.

### `beauty_get_skill`

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | style slug | no | Appends that style guide to the skill. |

Returns the contents of `skills/beauty.md`: the mandatory workflow, a brief recipe, self-check and failure modes. Load it into an agent's context before asking it to design.

### `beauty_create_page`

Creates a full HTML page and writes it to disk.

| Argument | Type | Required | Notes |
| --- | --- | --- | --- |
| `style` | style slug | yes | |
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
| `output` | string | no | Defaults to `beauty-output/<style>-<slug>-<timestamp>.html`. |
| `include_html` | boolean | no | Also return the full HTML in the response. |

Returns the absolute path, craft grade/score, vision score (0–4), fonts used and up to six issues with fixes.

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

Vision (0–4) is a separate heuristic, not a grade:

- `scale-jump`: max/min font size ≥10;
- `flat-fields`: no soft gradients (brutalist allows its grid);
- `asymmetry-or-bleed`: a full-bleed band, clip-path or two-column hero;
- `material`: at least two physical marks (grain, tape, inset edge, draw-on-stroke, 3px border).

The skill asks for **craft A and vision 4/4**. A/100 with vision 3/4 means the page is obedient but still a template.

### `beauty_examples`

No arguments. Returns the absolute paths of the reference pages and GIFs. Use them as a visual reference, not as a template to copy.

## Resources

| URI | MIME type | Content |
| --- | --- | --- |
| `beauty://styles/renaissance` | `application/json` | Full preset |
| `beauty://styles/brutalist` | `application/json` | Full preset |
| `beauty://styles/papercraft` | `application/json` | Full preset |
| `beauty://skills/beauty.md` | `text/markdown` | Agent skill |
| `beauty://skills/education.md` | `text/markdown` | Educational page skill |

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
