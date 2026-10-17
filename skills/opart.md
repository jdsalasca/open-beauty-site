---
name: open-beauty-opart
description: Apply the Op Art editorial system (Your eye is the medium) to a page or GIF with open-beauty-site.
---

# Op Art skill

Use this skill together with `beauty` when the brief calls for op art.
Never mix it with another style.

# Op Art — Your eye is the medium

Black and bone, a pattern that refuses to sit still. The page is an instrument for perception: your movement completes the image.

**Use it for:** perception, geometry, physics, music posters, experimental education.
**Avoid it for:** long reading, formal finance, accessibility-critical content without a static fallback.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Archivo Black` |
| Body font | `Space Grotesk` |
| Mono/label font | `Space Grotesk` |
| Border widths | 1, 2, 3 px |
| Border radius | 0–0 px |
| Motion window | 0.2–1 s |
| Shadow rule | No shadow. Contrast and repetition create depth. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#0A0A0A` |
| surface | `#F7F7F2` |
| ink | `#F7F7F2` |
| muted | `#A6A6A6` |
| accent | `#E03C31` |
| accent2 | `#1F4FD8` |
| accent3 | `#E8FF3A` |
| accent4 | `#9A9A9A` |
| deep | `#F7F7F2` |

## Typography

- Display: Archivo Black at 82–150px, uppercase, line-height .82, letter-spacing -.03em. Let it collide with the pattern.
- Body: Space Grotesk 400 at 16–18px. Labels: Space Grotesk 500 at 11px, uppercase, tracked .16em.
- Do not use more than two weights. The pattern is the third voice.

## Colour

- Black #0A0A0A and bone #F7F7F2 are the pattern. Red #E03C31 is a warning or a single number.
- Blue #1F4FD8 and acid #E8FF3A appear in one band each, never together in a gradient.
- No soft shadows; no grey haze.

## Layout

- Full-bleed pattern behind or beside the type. The grid should be visible and slightly wrong.
- Alternate dense and empty bands. Give the eye a rest every second screen.
- One rotated element is enough; rotating everything cancels the effect.

## Motion

- The moiré follows the pointer at 0.04 damping; a toggle freezes it. Never strobe above 3 Hz.
- Reveal is a hard cut or a 240ms wipe, not a fade.

## Imagery

- Original CSS/SVG patterns: concentric rings, warped grids, checkerboards, interference lines.
- No stock optical illusions; build the pattern.

## Copy voice

- Voice: precise, curious, never jokey. Explain the subject, not the studio.
- Headline: 2–6 words. One word may carry the accent colour.
- Body: one idea per paragraph, concrete nouns, no filler.

## Never

- No lorem ipsum.
- No emoji.
- No stock photography.
- No gradients that fake depth unless the style calls for them.
- No rounded corners.
- No soft shadows.
- No more than 3 Hz.
- No pattern without a pause.

## Signature moves

- Moiré field that moves with the pointer
- Black/white/red with one acid accent
- Hard geometric type
- Static fallback for reduced motion


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
