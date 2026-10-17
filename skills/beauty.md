---
name: open-beauty-site
description: Create art-directed HTML pages and looping GIFs with the open-beauty-site MCP server. Use when the user asks for a website, landing page, poster, visual identity, animation, or GIF and you want a coherent editorial style instead of generic AI design.
---

# open-beauty-site

You are using a design harness, not a blank canvas. The harness owns the typography, palette, borders, spacing, motion and validation. Your job is to choose a style, write real content, and let the tools render it.

## The three styles

| Style | Use it for | Display font | Feeling |
| --- | --- | --- | --- |
| `renaissance` | portfolios, cultural institutions, editorial essays, weddings, long-form launches | Crimson Text | parchment, ink, gold, symmetry, slow |
| `brutalist` | studios, launches, music, events, manifestos, loud portfolios | Archivo Black | concrete, acid, 3px borders, hard shadows |
| `papercraft` | crafts, food, education, community, personal projects, stationery | DM Serif Display | cream, kraft, tape, layered paper, warm |

Do not mix styles. Do not invent a fourth one.

## Mandatory workflow

### 1. Choose and read the style

Call `beauty_list_styles`. Then call `beauty_get_style` for the chosen slug and read the **Hard tokens**, **Typography**, **Colour**, **Layout** and **Never** sections.

If you skip this step you will guess a font or a hex colour, and the page will look generic.

### 2. Write the brief

A good brief has:

- `title`: 2–6 words. The headline. Required.
- `tagline`: one sentence under the headline.
- `intro`: 2–3 sentences for the manifesto. Concrete nouns, no corporate filler.
- `sections`: 2–3 cards. Each needs a short `title` and one or two sentences. Optional `kicker`.
- `quote`: optional, one sentence plus an author.
- `cta`: optional label and href.
- `brand`: optional. Defaults to the title.
- `locale`: `es` or `en`. Defaults to `es`.

Do not use lorem ipsum. Do not use "Your Company". Do not write placeholders.

### 3. Create the page

```json
{
  "style": "brutalist",
  "title": "LUNA / SIGNAL",
  "tagline": "A transmission from the other side of the prompt.",
  "intro": "We build signals for people who are tired of being talked to. Less decoration, more voltage.",
  "sections": [
    { "kicker": "01 / Identity", "title": "Identity", "body": "Marks with a pulse and rules that survive contact." },
    { "kicker": "02 / Web", "title": "Web", "body": "Sites built like posters: fast, loud, impossible to confuse." },
    { "kicker": "03 / Motion", "title": "Motion", "body": "Loops with a pulse. Frame by frame, no plugins." }
  ],
  "quote": { "text": "If it doesn't stop you, it isn't finished.", "author": "Studio manifesto" },
  "cta": { "label": "Start a project", "href": "#contact" },
  "locale": "en",
  "output": "out/brutalist.html"
}
```

Tool: `beauty_create_page`.

### 4. Validate and fix

Call `beauty_validate` with `{ "style": "...", "path": "out/brutalist.html" }`.

- **A (90–100)**: ship it.
- **B (80–89)**: fix the warnings before showing the user.
- **C or lower**: regenerate with a simpler brief or fix the HTML, then validate again.

Never report a page as finished if the grade is below A. Never ignore a `forbidden-font`, `missing-font`, `color-outside-palette` or `soft-shadow-in-brutalist` error.

### 5. Make a GIF

Call `beauty_create_gif` with the same style and a short text (2–6 words):

```json
{
  "style": "papercraft",
  "text": "Taller Papel",
  "subtitle": "Hecho a mano",
  "template": "title",
  "width": 800,
  "height": 800,
  "fps": 20,
  "duration": 2.4,
  "output": "out/papercraft.gif"
}
```

Templates:

- `title`: a reveal with a hold. Best for a hero or a social post.
- `loop`: seamless marquee/float. Best for a profile banner.
- `poster`: ambient shapes. Best when the text is short.

## Self-check before answering

1. Is the grade A?
2. Does the page contain real copy, not placeholders?
3. Is there exactly one accent colour doing the work?
4. Is the headline readable at 360px wide?
5. Do the fonts match the style guide exactly?
6. If there is a GIF, does it loop and is the text short enough to read in two seconds?
7. Did you avoid emoji, stock photography, purple gradients and rounded cards in brutalist?

## If the MCP server is not available

Use the CLI from the repository root:

```bash
node dist/cli.js styles
node dist/cli.js guide brutalist
node dist/cli.js page --style brutalist --title "LUNA / SIGNAL" --tagline "..." --out out/page.html
node dist/cli.js gif --style papercraft --text "Taller Papel" --out out/loop.gif
node dist/cli.js validate out/page.html --style brutalist --strict
```

The CLI and MCP call the same renderers, so the result is identical.

## Common failure modes

- **Inventing a font.** The validator catches `forbidden-font` and `missing-font`. Read the error, use the exact family.
- **Adding a second accent.** One accent per screen. In brutalist, acid is a background, never small text on paper.
- **Too much copy.** A card body is one or two sentences. A headline is 2–6 words.
- **Using the wrong style for the content.** A funeral home is not brutalist. A techno label is not papercraft. Re-read `bestFor` and `avoid`.
- **Forgetting the brief.** The page renders with defaults; it will look clean but generic. Real copy is the difference.
- **Editing the HTML by hand without re-validating.** Run `beauty_validate` again after every edit.
