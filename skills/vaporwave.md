---
name: open-beauty-vaporwave
description: Apply the Vaporwave / Y2K editorial system (A window into a future that already expired) to a page or GIF with open-beauty-site.
---

## Quick recipe

Copy, paste, run. Replace only the quoted words.

```bash
node dist/cli.js page --style vaporwave --brief examples/recipes/vaporwave/page.json --out out/vaporwave.html
node dist/cli.js deck --style vaporwave --brief examples/recipes/vaporwave/deck.json --out out/vaporwave-deck.html
node dist/cli.js gif --style vaporwave --text "Vaporwave Window" --out out/vaporwave.gif
```

**5 hard rules**
- Display font is `Press Start 2P`; body and labels use it too. Never substitute.
- Border widths: 1, 2, 3 px. Radius: 0–6 px.
- Motion window: 0.2–1.4 s.
- Shadow: Chrome bevels and 2px hard inset edges; no soft ambient shadow.
- No lorem ipsum.

**3 common mistakes (and fixes)**
- Inventing a font -> read Hard tokens and use the exact family.
- Adding a second accent -> one accent per screen; keep the rest chalky/flat.
- Too much copy -> card body 1–2 sentences; headline 2–6 words.

**Words / tone**
- es: Manual de uso de una interfaz obsoleta: artefacto, año, gesto. La nostalgia necesita un objeto concreto.
- en: a user manual for an obsolete interface: artifact, year, gesture. Nostalgia needs a specific object.

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

- Voice: a user manual for an obsolete interface: artifact, year, gesture. Nostalgia needs a specific object.
- Headline: 2–5 words, one chrome word at most. No generic "Y2K" mood.
- Body: what the interface promised, what it actually did, and who used it.

## Never

- No lorem ipsum.
- No emoji.
- No stock photography.
- No gradients that fake depth unless the style calls for them.
- No soft shadows.
- No modern SaaS cards.
- No illegible pixel body copy.
- No flashing.

## Type system

| Token | Value |
| --- | --- |
| Display case | uppercase |
| Display tracking | .08em |
| Display leading | .95 |
| Body size / leading | 18px / 1.7 |
| Label tracking | .18em |
| Features | "kern" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 350ms · cubic-bezier(.2,.8,.2,1) |
| Distance / stagger | 8px / 50ms |
| Page transition | 600ms · glitch |
| Ambient | grid · 16s |
| Hover | glow |
| Note | The desktop breathes; glitch is a short event, never a loop. |

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `chrome` | Chrome | sala | `accent2` | Cyan chrome, violet desktop, magenta accent. |
| `hot-pink` | Hot pink | gabinete | `accent` | Pink window, cyan grid, chrome type. |
| `terminal` | Terminal | cartel | `accent3` | Chrome text on blue; the quiet server room. |

## Signature moves

- Draggable 1999 window
- Perspective grid and a striped sun
- Chrome gradient title
- Glitch on hover


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
