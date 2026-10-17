---
name: open-beauty-psychedelic
description: Apply the Psychedelic poster editorial system (A poster that refuses to sit still) to a page or GIF with open-beauty-site.
---

# Psychedelic poster skill

Use this skill together with `beauty` when the brief calls for psychedelic poster.
Never mix it with another style.

# Psychedelic poster — A poster that refuses to sit still

Night blue, magenta and orange, liquid shapes and a headline that bends. A 1967 concert poster for a subject that deserves a trip.

**Use it for:** music, biology, chemistry, festivals, consciousness.
**Avoid it for:** legal, medical instructions, conservative finance.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Bungee Shade` |
| Body font | `Space Grotesk` |
| Mono/label font | `Space Grotesk` |
| Border widths | 0, 1, 2, 4 px |
| Border radius | 0–40 px |
| Motion window | 0.3–1.4 s |
| Shadow rule | Hard offset shadows in magenta or orange are allowed; no soft grey shadows. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#1B1B3A` |
| surface | `#2A1A5E` |
| ink | `#F7E8C8` |
| muted | `#B9A7FF` |
| accent | `#E5197F` |
| accent2 | `#FF6B1A` |
| accent3 | `#F5E13B` |
| accent4 | `#00A6A6` |
| deep | `#5B2A86` |

## Typography

- Display: Bungee Shade at 68–120px, uppercase, line-height .88. It is already decorative; do not add another display face.
- Body: Space Grotesk 400 at 16–18px, line-height 1.6. Labels: Space Grotesk 500 at 11px, tracked .14em.
- One word can be set in a curved arc or rotated 3°; not the whole headline.

## Colour

- Night #1B1B3A is the ground. Magenta #E5197F and orange #FF6B1A are the hot pair. Acid #F5E13B is a single hit.
- Teal #00A6A6 and violet #5B2A86 are cool pauses. Cream #F7E8C8 is text.
- Gradients are allowed only inside blobs; keep type on flat colour.

## Layout

- All-over composition: blobs, rings and type overlap. Leave one quiet corner for the CTA.
- Cards are poster panels, not UI cards: thick black keylines and a hard offset.
- The fold or crop can cut a shape; do not center everything.

## Motion

- Blobs drift 20–40px over 9s; hover expands a blob 4%. No strobing.
- Reduced motion freezes the blobs and keeps the poster.

## Imagery

- Original SVG: liquid blobs, concentric rings, a sun with a face, mushrooms? no: abstract cells and eyes.
- No stock psychedelic art, no AI-glow.

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
- No more than three hot colours.
- No illegible body copy.
- No strobing above 3 Hz.

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `magenta` | Magenta | sala | `accent` | Hot pink lead, orange shadow, acid only as punctuation. |
| `acid` | Acid | gabinete | `accent3` | Yellow lead on violet; the poster under blacklight. |
| `teal` | Teal | cartel | `accent4` | Cool teal and violet; the after-hours version. |

## Signature moves

- Liquid blobs that follow the pointer
- Bungee Shade headline with a hard offset
- Acid yellow and hot magenta
- A poster that fills the viewport


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
