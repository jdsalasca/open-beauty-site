---
name: open-beauty-site
description: Create art-directed HTML pages and looping GIFs with the open-beauty-site MCP server. Use when the user asks for a website, landing page, poster, visual identity, animation, or GIF and you want a coherent editorial style instead of generic AI design.
---

# open-beauty-site

You are using a design harness, not a blank canvas. The harness owns the typography, palette, borders, spacing, motion and validation. Your job is to choose a style, write real content, and let the tools render it.

## The eleven styles

| Style | Use it for | Display font | Feeling |
| --- | --- | --- | --- |
| `renaissance` | art history, literature, cultural institutions, editorial lessons | EB Garamond | chalky fresco fields, cinnabar, asymmetry, slow |
| `brutalist` | studios, launches, music, events, manifestos, loud portfolios | Archivo Black | concrete, acid, 3px borders, hard shadows |
| `papercraft` | biology, children's museums, crafts, community, stationery | Fraunces Soft | cut paper, layered sheets, tape, warm |
| `artdeco` | architecture, jazz, timelines, luxury, city histories | Poiret One | black lacquer, champagne lines, sunburst, vertical |
| `isotype` | data, economics, civics, public health, maths | Jost | pictograms, counting grid, Vienna, signal red |
| `opart` | perception, geometry, physics, experimental education | Archivo Black | moiré, high contrast, optical movement |
| `ukiyoe` | ocean, climate, Japanese history, poetry | Shippori Mincho B1 | Prussian blue, flat planes, wave, seal |
| `bestiary` | biology, taxonomy, fable, mythology, natural history | UnifrakturMaguntia | parchment, iron gall, lapis, illuminated initial |
| `psychedelic` | music, festivals, chemistry, consciousness | Bungee Shade | liquid blobs, magenta, acid, 1967 poster |
| `memphis` | design history, music, workshops, creative education | Bricolage Grotesque | squiggles, terrazzo, cobalt, hard keylines |
| `vaporwave` | internet history, media, digital culture, nostalgia | Press Start 2P | chrome, grid, 1999 window, glitch |

Do not mix styles. Do not invent a twelfth one.

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
- `seed`: `0`, `1` or `2`. Chooses a composition archetype: `0` is the default, `1` mirrors the hero, `2` goes full-bleed (papercraft). Use a different seed when you want a different composition, not a different skin.

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

The result has two numbers:

- **craft** (`A`/`B`/`C`/`F`, 0–100): fonts, palette, borders, radii, shadows, markup, contrast. This is obedience.
- **vision** (0–4): scale jump, flat colour fields, asymmetry/bleed, physical material. This is the difference between "correct" and "art".

Ship only when craft is **A** and vision is **4/4**. If vision is 3/4, the page is still a template; change the composition (`seed`), the scale of the image, or the material before showing it.

Never ignore a `forbidden-font`, `missing-font`, `color-outside-palette`, `soft-shadow-in-brutalist` or `hard-shadow-in-papercraft` error.

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

1. Is craft A **and** vision 4/4?
2. Does the page contain real copy, not placeholders?
3. Is there exactly one accent colour doing the work?
4. Is the headline readable at 360px wide?
5. Do the fonts match the style guide exactly?
6. If there is a GIF, does it loop and is the text short enough to read in two seconds?
7. Did you avoid emoji, stock photography, purple gradients and rounded cards in brutalist?
8. Can you name the composition, or does every page look like the same landing page?

### Four tests the validator cannot replace

- **Squint test:** blur the page. Can you see at least three masses of value? If it is one beige column, change the composition.
- **Replacement test:** replace the copy with lorem ipsum. If the page still looks finished, it is a skin. Change the image scale, the asymmetry or the material.
- **Memory test:** look for 3 seconds, look away, name the page. If you remember the style and not the subject, the content is not doing its job.
- **Break test:** allow one deliberate violation of the manual per page (a cinnabar rule, a sheet crossing the margin, a too-large plate). A page with zero ruptures has no authorship.

For educational pages, read `skills/education.md` before writing the brief.

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
- **Mistaking obedience for art.** A/100 only means the page follows the rules. Vision 4/4 and the four human tests decide whether it is worth looking at.
- **Using gradients to fake pastel.** Renaissance and papercraft want flat fields with a hard edge, not a radial aura fading to transparent.
