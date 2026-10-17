---
name: open-beauty-vaporwave
description: Apply the Vaporwave / Y2K editorial system (A window into a future that already expired) to a page or GIF with open-beauty-site.
---

# Vaporwave / Y2K skill

Use this skill together with `beauty` when the brief calls for vaporwave / y2k.
Never mix it with another style.

# Vaporwave / Y2K — A window into a future that already expired

Violet dusk, chrome type and a perspective grid. A desktop from 1999, half-remembered, with a cursor that still works.

**Use it for:** internet history, media studies, music, digital culture, nostalgia.
**Avoid it for:** serious policy, health, legal.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Press Start 2P` |
| Body font | `Space Grotesk` |
| Mono/label font | `Space Grotesk` |
| Border widths | 1, 2, 3 px |
| Border radius | 0–6 px |
| Motion window | 0.2–1.4 s |
| Shadow rule | Chrome bevels and 2px hard inset edges; no soft ambient shadow. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#1B1035` |
| surface | `#2B3A8F` |
| ink | `#FFFFFF` |
| muted | `#B9A7FF` |
| accent | `#FF4FA3` |
| accent2 | `#4FE3E3` |
| accent3 | `#C9D1D9` |
| accent4 | `#FFD6F2` |
| deep | `#2B3A8F` |

## Typography

- Display: Press Start 2P at 28–56px, uppercase, line-height 1.35. It is a pixel face: keep lines short.
- Body: Space Grotesk 400 at 16–18px. Labels: Space Grotesk 500 at 10px, uppercase, tracked .14em.
- Chrome is a gradient on the title only; body text stays white or lavender.

## Colour

- Violet #1B1035 is the desktop. Hot pink #FF4FA3, cyan #4FE3E3 and chrome #C9D1D9 are UI accents.
- Blue #2B3A8F is the window title bar. White #FFFFFF is body text.
- Gradients are allowed in the sky and chrome, never behind body copy.

## Layout

- A fake OS window with a title bar, three buttons and a status bar. The page is the desktop.
- Perspective grid on the lower third; sun on the horizon. Do not center the window exactly.
- Cards are file windows or tiles, not rounded SaaS cards.

## Motion

- The grid scrolls slowly; the sun’s stripes drift; the window can be dragged. Glitch is a 120ms RGB split on hover.
- No flashing above 3 Hz.

## Imagery

- Original CSS/SVG: chrome gradient, grid, sun, pixel cursor, window chrome, floppy disk.
- No lifted Windows screenshots.

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
- No modern SaaS cards.
- No illegible pixel body copy.
- No flashing.

## Signature moves

- Draggable 1999 window
- Perspective grid and a striped sun
- Chrome gradient title
- Glitch on hover


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
