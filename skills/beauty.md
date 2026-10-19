---
name: open-beauty-site
description: Create art-directed HTML pages, decks, stories, experiences, motion, canvas, sequences and GIFs in 13 styles. Use the decision tree below: pick the artifact, copy the command, validate.
---

# open-beauty-site (weak-model kit)

Pick what you want. Copy the command. Run validate and inspect the rendered output. The craft grade and vision heuristics are not visual approval.

`beauty` is the installed CLI; `node dist/cli.js` is the same program after
`pnpm build`. On a fresh checkout, run `pnpm setup` first: it installs, builds
and tests. If `dist/` is missing, the CLI prints the exact one-line fix.

## Decision tree

| You want | Command |
| --- | --- |
| List styles | `beauty styles` |
| Read one style | `beauty guide <style>` |
| One-shot artifact | `beauty make <kind> --style <s> --idea "one sentence"` |
| Page | `beauty page --style <s> --brief examples/recipes/<s>/page.json --out out/<s>.html` |
| Deck | `beauty deck --style <s> --brief examples/recipes/<s>/deck.json --out out/<s>-deck.html` |
| Story | `beauty story --style <s> --brief examples/recipes/<s>/story.json --out out/<s>-story.html` |
| Experience | `beauty experience --style <s> --brief examples/recipes/<s>/experience.json --out out/<s>-exp.html` |
| Motion SVG | `beauty motion --style <s> --title "..." --scene bloom --out out/<s>.svg` |
| GIF | `beauty gif --style <s> --text "Short Title" --out out/<s>.gif` |
| Narrative GIF pack | `beauty narrative --style <s> --brief brief.json --out out/narrative` |
| Review gallery | `beauty gallery docs/narrative-gif --out docs/narrative-gif/GALLERY.html` |
| Sprint kit | `beauty sprint --style <s> --brief sprint.json` |
| Validate | `beauty validate <file> --style <s> --strict` |
| Repair | `beauty fix <file> --style <s>` |
| Subcommand help | `beauty <cmd> --help` or `beauty help <cmd>` |

`beauty make <kind>` accepts `page|deck|gif|story|experience|motion`. `beauty
sprint` writes review + retrospective + planning plus three GIFs; run
`beauty sprint --help` for its brief schema and options.

`beauty narrative` validates a 3–5-phase brief and writes a GIF, PNG, contact
sheet and manifest for any of the 13 registered narrative scenes. Its five
evaluation levels stay separate, visual review stays pending until a reviewer
records it, and no level approves publication. Use
`examples/recipes/<style>/narrative.json` for a complete Spanish Sprint Review
brief. See [the narrative decision guide](narrative.md) for when to use
`make`, `narrative`, `sequence` or `gif` and for the status and evaluation rules.

`beauty gallery <dir>` scans manifests and writes one self-contained HTML
review page. Cards start from static PNGs; a GIF is requested only after
**Reproducir** is activated. Filter by style, use the 640 × 360 preview, and
keep `visual-review: pending` visible until a person or identified visual model
records evidence.

## Briefs from a file or stdin

Every `--brief` flag accepts a JSON file path. `--brief -` reads the JSON from
stdin, which avoids the Windows command-length limit (os error 206):

```bash
beauty page --style nature --brief - --out out/nature.html < brief.json
beauty make page --style artdeco --idea-file idea.txt --out out/artdeco.html
```

`--idea-file` reads the one-sentence idea for `beauty make` from a file.

## MCP tools

`beauty_list_styles`, `beauty_get_style`, `beauty_get_skill`,
`beauty_create_page`, `beauty_create_deck`, `beauty_create_gif`,
`beauty_create_narrative`, `beauty_create_gallery`, `beauty_validate`; decks use
a subfamily (subfamilia). Prefer the CLI when the session has no MCP tools
registered.

## Register the MCP server for Codex/Claude

`pnpm mcp:config` prints the exact snippet for your machine and never edits
your config files. Copy the block you need:

```bash
pnpm mcp:config
```

It prints (your absolute path replaces `<repo>`):

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

## Styles (pick one, never mix)

`renaissance brutalist papercraft artdeco isotype opart ukiyoe bestiary psychedelic memphis vaporwave galactic nature`

## Rules

1. Read the style guide first: `beauty guide <style>`.
2. Copy a recipe from `examples/recipes/<style>/`; change only words, not tokens.
3. One accent per screen. Real copy, no placeholders, no lorem.
4. Validate every output, then inspect its actual render. Craft A and vision 4/4 are heuristics, not a human visual review.
5. Use a narrative GIF for a three-part change story; use `beauty gif` for a
   short looping title or poster. Put longer objectives in a page or deck.

## How to look at your output

The validator is a CSS audit, not a browser. Look at the real render before you
ship:

- `beauty validate <file> --style <s> --strict` for the craft grade and fixes.
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
