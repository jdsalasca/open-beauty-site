---
name: open-beauty-memphis
description: Apply the Memphis editorial system (A deliberate case of bad taste) to a page or GIF with open-beauty-site.
---

# Memphis skill

Use this skill together with `beauty` when the brief calls for memphis.
Never mix it with another style.

# Memphis — A deliberate case of bad taste

Milan, 1981: squiggles, terrazzo, cobalt and pink. Postmodern play with a straight face, held together by a black keyline.

**Use it for:** design history, music, workshops, creative education, events.
**Avoid it for:** hospitals, luxury, solemn memorials.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Bricolage Grotesque` |
| Body font | `DM Sans` |
| Mono/label font | `DM Sans` |
| Border widths | 1, 2, 3 px |
| Border radius | 0–48 px |
| Motion window | 0.3–1.2 s |
| Shadow rule | Hard black offset shadows (6px 6px 0) are the point; no soft blur. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#F5F0E6` |
| surface | `#FFFFFF` |
| ink | `#111111` |
| muted | `#6B6B6B` |
| accent | `#F2A6B3` |
| accent2 | `#9FD8C8` |
| accent3 | `#2E4FD8` |
| accent4 | `#F4D35E` |
| deep | `#B9A7E0` |

## Typography

- Display: Bricolage Grotesque 700 at 72–128px, line-height .92, tight tracking -.03em.
- Body: DM Sans 400 at 16–18px, line-height 1.6. Labels: DM Sans 500 at 11px, uppercase, tracked .12em.
- One word can be on a pink highlight; do not rainbow the headline.

## Colour

- Bone #F5F0E6 is the table. Black #111111 is the keyline. Pink #F2A6B3, mint #9FD8C8, cobalt #2E4FD8 and butter #F4D35E are flat shapes.
- Lilac #B9A7E0 is a fifth accent; use it sparingly.
- No gradients, no soft shadows, no beige minimalism.

## Layout

- Asymmetrical, rotated 1–4°, overlapping. A 3px black keyline keeps the chaos legible.
- Cards can be different widths; the grid is a suggestion. Do not align everything.
- Use one giant squiggle and one terrazzo field per page.

## Motion

- Click “shuffle” to re-scatter shapes with a 300ms transform. Squiggles draw in 700ms.
- Hover lifts a card 4px and increases the hard shadow to 8px.

## Imagery

- Original SVG: squiggles, terrazzo chips, a checkerboard, a wavy vase, a star.
- No Memphis Group scans; draw the vocabulary.

## Copy voice

- Voice: precise, curious, never jokey. Explain the subject, not the studio.
- Headline: 2–6 words. One word may carry the accent colour.
- Body: one idea per paragraph, concrete nouns, no filler.

## Never

- No lorem ipsum.
- No emoji.
- No stock photography.
- No gradients that fake depth unless the style calls for them.
- No soft shadows.
- No rounded sans-only look without a keyline.
- No more than five accents.
- No aligning everything.

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `cobalt` | Cobalt | sala | `accent3` | Blue keyline, pink squiggle, bone ground. |
| `pink` | Pink | gabinete | `accent` | Pink field, mint object, cobalt detail. |
| `mint` | Mint | cartel | `accent2` | Mint ground, butter shape, black keyline. |

## Signature moves

- Squiggles and terrazzo
- Hard 6px black offset shadows
- Rotated cards with a 3px keyline
- Cobalt, pink, mint and butter


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
