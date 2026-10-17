---
name: open-beauty-papercraft
description: Apply the Paper Craft editorial system (A warm table covered in cut paper) to a page or GIF with open-beauty-site.
---

# Paper Craft skill

Use this skill together with `beauty` when the brief calls for paper craft.
Never mix it with another style.

# Paper Craft — A warm table covered in cut paper

Cream, kraft and scissors. Layered paper shapes, soft shadows, tape and a gentle float: handmade but art-directed.

**Use it for:** crafts, food, education, community, personal projects, children, stationery.
**Avoid it for:** fintech, enterprise SaaS, brutalist music, anything that needs to feel sharp.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `DM Serif Display` |
| Body font | `Lato` |
| Mono/label font | `Lato` |
| Border widths | 1, 2 px |
| Border radius | 14–32 px |
| Motion window | 0.5–1.2 s |
| Shadow rule | Soft and warm: 0 18px 30px rgba(58,46,40,.18) plus a 0 2px 0 edge. Never a hard offset. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#FBF3E4` |
| surface | `#F4E6CE` |
| ink | `#3A2E28` |
| muted | `#6B5648` |
| accent | `#C96F4A` |
| accent2 | `#8FA98A` |
| accent3 | `#A9C7D9` |
| deep | `#6E4B63` |

## Typography

- Display: DM Serif Display 400 at 84–120px, line-height .9, sentence case. It should feel cut, not typed.
- Body: Lato 400 at 17–19px, line-height 1.6. Labels: Lato 900 at 10–12px, uppercase, letter-spacing .18em.
- Italic only for one handwritten-feeling word; never all caps for the display.
- Never use monospace or a second serif.

## Colour

- Cream #FBF3E4 is the table. Terracotta #C96F4A, sage #8FA98A, sky #A9C7D9 and kraft #D9B98C are paper sheets; ink #3A2E28 is the pen.
- Use at most three paper colours per screen plus cream. Plum #6E4B63 only for tiny accents.
- Shadows are warm brown rgba(58,46,40,.18), never grey or black.
- No neon, no pure white, no acid.

## Layout

- Layered and off-grid but balanced: cards rotated -3° to 3°, overlapping 12–24px, with visible tape.
- Radii 16–28px and asymmetric, e.g. 22px 18px 24px 16px. Never perfect circles for cards.
- Vertical rhythm 96–140px. Use a scalloped or torn divider between bands.
- One focal paper object per screen; everything else supports it.

## Motion

- Gentle and physical: .6–.9s pop-in with cubic-bezier(.34,1.56,.64,1), then a 6s float loop with 12px amplitude.
- Stagger 90ms; parallax layers by 8–16px. Respect reduced motion.
- Hover lifts a card by 4px and deepens its shadow. No colour flashing.

## Imagery

- Paper cutout SVG: flowers, leaves, suns, waves, confetti. Each shape gets a soft warm shadow and a slightly darker edge.
- No photos, no neon, no hard black borders, no brutalist grids.
- Tape is semi-transparent and slightly rotated; it is the signature detail.

## Copy voice

- Voice: warm, handmade, first person. Short sentences, sensory details.
- Headline: 3–6 words, sentence case; one word can be italic.
- Body: concrete nouns, no corporate abstractions. Say "we folded 400 invitations", not "we deliver solutions".

## Never

- No 0px corners.
- No 3px black borders, no acid colours, no monospace.
- No uppercase display, no hard shadows, no dark backgrounds.
- No more than one italic phrase per screen.

## Signature moves

- Layered paper cards rotated -3° to 3°
- Washi tape strips on the corners
- Scalloped or torn band dividers
- Soft float loop on decorative shapes


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
