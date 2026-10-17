# Art direction

This document is the taste layer of the harness. It exists because a validator can prove obedience, not beauty.

## The diagnosis

The first version was **craft, not art**. The pages were consistent, accessible and well-composed, but every decision was a category decision: serif + centred + arch + gold for Renaissance; cream + rounded + tape for Paper Craft. Nothing was specific to the brief. If you replaced the copy with lorem ipsum, the pages still looked finished. That is the definition of a skin.

Two concrete corrections changed the direction:

### Renaissance: fresco, not stationery

- **Flat fields, hard edges.** No radial gradients fading to transparent. Plaster, powder blue, verdaccio and cinnabar arrive as flat planes, like pigment on lime plaster.
- **Darker ink.** `#2B211B`, not a soft sepia. Pastel only works when the text has weight.
- **EB Garamond.** A text face with real small caps and oldstyle figures; 152px headlines with `line-height: .87`.
- **Asymmetry.** Copy on one side, a 48vw arch plate on the other. No centred column.
- **One hot event.** Cinnabar appears on ≤2% of the page. Without a saturated note, pastel becomes papilla.

### Paper Craft: cut paper, not a children's app

- **Fraunces Soft** (`SOFT 100`, `WONK 1`, `opsz 144`, weight 560). A soft serif with a slightly wrong cut; not Fredoka, not a rounded sans.
- **Nunito Sans** for body, labels at 800. Humanist, not bubbly.
- **Cut geometry.** `30px 12px 28px 14px` (a visible ≥18px delta) and a 26px corner notch on the focal card. No dashed stitching.
- **Paper on paper.** `#FFF8EA` sheet on `#FBF1E2` table, 1px edge, layered shadow 2/14/30. No soft sticker floating in space.
- **Tape as material.** 128×34, torn ends, 6–8°, butter repeat, one-pixel shadow.
- **Motion that falls.** 480ms `cubic-bezier(.22,.9,.24,1)`, shadow settles later, tape follows. No spring bounce.

## Craft vs vision

`beauty_validate` now returns two numbers.

**Craft (A–F, 0–100)** is the old audit: fonts, palette, border widths, radii, shadows, markup, contrast.

**Vision (0–4)** is a heuristic:

| Check | What it asks | How it is measured |
| --- | --- | --- |
| `scale-jump` | Is there a real hierarchy? | max/min `font-size` ≥10 |
| `flat-fields` | Is colour a material, not a glow? | zero linear/radial gradients (brutalist allows 4 for its grid) |
| `asymmetry-or-bleed` | Does anything break the column? | `100vw`, negative bleed, `clip-path`, two-column grid |
| `material` | Is there evidence of a physical process? | grain, inset edge, tape pattern, draw-on-stroke, 3px border |

A page can be A/100 and vision 3/4. That is the moment to change the composition, not the adjectives. The skill asks for **A + 4/4**, plus three human tests the code cannot run:

1. **Squint:** blur the page. Are there at least three masses of value?
2. **Replace:** swap the copy for lorem ipsum. Does it still look finished? Then it is a skin.
3. **Remember:** look for 3 seconds, look away, name the page. If you remember the style and not the subject, the content is not doing its job.

## Composition archetypes

`seed` chooses a composition, not a skin:

- `0` — default: copy left, image right (or centred for brutalist).
- `1` — mirrored: image left, copy right.
- `2` — papercraft only: full-bleed collage behind the copy.

Use a different seed when two pages for the same client should not look like the same template. Do not randomise the style itself; the grammar stays fixed.

## North stars

- **Renaissance:** Fra Angelico, *Annunciation*, cell 3, San Marco, Florence (c. 1438–45). Chalky pastels, scarce gold, one light source, colour shadows. Technique: *buon fresco* and *spolvero*.
- **Paper Craft:** Matisse, *Jazz* (1947) and *The Snail* (1953); Kveta Pacovská, *The Little Flower King* (1987); riso at two inks with 1.5px misregistration.
- **Brutalist:** concrete poetry broadsides of the 1960s (*An Anthology*, Emmett Williams, 1963): typographic mass as image.

## Nine signature styles for education

**Status:** all nine are implemented in `src/page/showcase-a.ts` / `showcase-b.ts`, with pages in `examples/showcase/`, GIFs in `examples/gifs/showcase-*.gif`, and a side-by-side test in `examples/compare.html`. Galactic Futurism is the room style behind `musem.eridu.top`.

These are not recolours. Each changes the **minimum unit** of composition, so it is recognisable at 200px and useful for a different subject.

| # | Style | Unit | Anchor topics | Display / body | Palette core |
| --- | --- | --- | --- | --- | --- |
| 1 | **Ukiyo-e** (Edo, 1603–1868) | flat colour plane | history, oceanography, haiku | Shippori Mincho B1 / Zen Kaku Gothic New | Prussian blue, washi cream, vermilion, sumi |
| 2 | **Illuminated bestiary** (Europe, 12th–15th c.) | ink line | biology, fable, epistemology | UnifrakturMaguntia / IM Fell English | parchment, iron-gall ink, old gold, lapis |
| 3 | **Art Deco** (Paris–NY, 1920s–30s) | geometric ornament | architecture, jazz, timelines | Poiret One / Josefin Sans | lacquer black, champagne gold, ivory, emerald |
| 4 | **Isotype** (Vienna, 1925–34) | pictogram | data, economics, maths | Jost / IBM Plex Sans | cream, black, signal red, teal, mustard |
| 5 | **Op Art** (1960s) | optical pattern | perception, geometry, physics | Archivo Black / Space Grotesk | black, bone white, red, electric blue, acid |
| 6 | **Psychedelic poster** (SF, 1966–72) | liquid filter | music, biology, chemistry | Bungee Shade / Space Grotesk | night blue, magenta, orange, lemon, turquoise |
| 7 | **Memphis** (Milan, 1981–88) | postmodern shape | design, music, patterns | Bricolage Grotesque / DM Sans | black, bone, pink, mint, cobalt, butter |
| 8 | **Vaporwave / Y2K** (internet, 2010s) | pixel / gradient | internet history, media | Press Start 2P / Space Grotesk | violet, hot pink, cyan, chrome, grid blue |
| 9 | **Galactic Futurism** (MUSEM, 2026) | orbital line | music rooms, space, memory | Michroma / Space Grotesk | void black, chrome ivory, cyan, solar gold, violet |

### Build order (all shipped)

1. **Art Deco.** Shipped. Highest impact per line of code: `conic-gradient` rays, stepped frames, Poiret One. Covers architecture, jazz, timelines and presentations. The risk is the Gatsby wedding invitation: keep black dominant and gold as a 1px line.
2. **Isotype.** Shipped. The most educational style: one pictogram equals one unit. A library of 30 silhouettes serves history, economics, biology and maths. The risk is a generic chart library; keep the hand-cut silhouette and the visible grid.
3. **Op Art.** Shipped. Cheapest and most recognisable at thumbnail size. Fully procedural: patterns, moiré, deformed grids. Covers perception, geometry and physics. Accessibility: cap at 3 Hz, provide a static frame.

The second wave — Ukiyo-e, Bestiario, Psicodelia, Memphis, Vaporwave — is also shipped. The next gap is not another style: it is the slide format and the `figure` / `keyIdea` / `process` blocks.

## Education and slides

The current renderer produces **pages**, not decks. For educational pages:

- one learning objective, one misconception, one concrete detail, one source;
- sections as rooms: hook → concept → use;
- quote = primary source, with author and work;
- CTA = the next action, not "contact us".

For a future `slide` format:

- 1600×900, 80px margins;
- one idea per slide, title 96–140px, ≤45 words;
- a figure or a single number every second slide;
- source + slide number in the footer;
- no bullet list longer than three items.

Without that format, "educational site" will keep producing beautiful landing pages with museum copy. The blocks to add are `figure` (image + caption + source), `keyIdea` (definition) and `process` (3–5 steps).

## What to preserve

- The double hairline frame (18px + 6px inset) in Renaissance.
- The copy voice of the examples: specific, warm, unsentimental.
- The arch as a container, not as a logo.
- Brutalist, untouched: it is the control that proves the system can have an idea.
- The validator's contrast and typography drift checks.
- `prefers-reduced-motion` and the reveal script.
- The scallop as a concept for band edges, not its current 24 identical bumps.
