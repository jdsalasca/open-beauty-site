---
name: open-beauty-brutalist
description: Apply the Brutalist editorial system (Concrete, ink and acid) to a page or GIF with open-beauty-site.
---

# Brutalist skill

Use this skill together with `beauty` when the brief calls for brutalist.
Never mix it with another style.

# Brutalist — Concrete, ink and acid

A loud poster that happens to be a website. Visible skeleton, 3px borders, hard shadows and one acid highlight per view.

**Use it for:** studios, launches, music, events, manifestos, portfolios that need to shout.
**Avoid it for:** luxury hospitality, wellness, children, dense dashboards, formal finance.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Archivo Black` |
| Body font | `Space Mono` |
| Mono/label font | `Space Mono` |
| Border widths | 3, 6 px |
| Border radius | 0–0 px |
| Motion window | 0.15–0.7 s |
| Shadow rule | Hard offset only: 8px 8px 0 #0B0B0B (zero blur). Hover can grow it to 12px 12px. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#F2EFE4` |
| surface | `#E6E2D3` |
| ink | `#0B0B0B` |
| muted | `#6D695C` |
| accent | `#D8FF00` |
| accent2 | `#FF3D1F` |
| accent3 | `#2438FF` |
| accent4 | `#F2EFE4` |
| deep | `#0B0B0B` |

## Typography

- Display: Archivo Black 400 at 96–148px, uppercase, line-height .82, letter-spacing -.03em. The headline is the layout.
- Labels, data and body: Space Mono. Labels 700 at 10–13px, uppercase, letter-spacing .12em. Body 400 at 15–17px, line-height 1.5.
- Mix one oversized line with tiny mono metadata. Avoid mid-size text.
- Never use a serif or a geometric sans. Never letterspace the display face.

## Colour

- Paper #F2EFE4 plus ink #0B0B0B are ~85%. Acid #D8FF00 is the highlighter: one block per view.
- Red #FF3D1F is a stamp (badge, number, dot). Blue #2438FF is a rare third accent, once per page maximum.
- Never put acid text on paper. Acid is a background; text on acid is always ink.
- No gradients, no translucency except a 6% black grid.

## Layout

- Show the skeleton: 12 columns, sections sharing edges, full-bleed bands.
- 3px borders everywhere; 6px only for the page frame or a hero divider.
- Hard offset shadows 8px 8px 0 ink with zero blur. No soft shadows, no blur.
- At least one marquee band and one oversized numeral.

## Motion

- Fast and mechanical: .25–.5s, cubic-bezier(.2,.8,.2,1). Stagger 60ms.
- Marquee loops at 18–24s, linear. Buttons shift -2px/-2px and grow the shadow.
- No bounce, no fade-only entrances: elements should arrive with a hard stop.

## Imagery

- Geometry only: squares, grids, arrows, crosses, barcodes, halftones. Inline SVG with 3px strokes.
- No photographs, no serif fonts, no rounded corners, no gradients, no emoji.
- A black panel with acid type counts as an image.

## Copy voice

- Voice: poster, imperative, loud. Two to six words per headline, all caps.
- Use numerals, dates and coordinates as decoration ("EST. 2026 / 04°42′N").
- Body copy is short and declarative. No adjectives doing the work of ideas.

## Never

- No rounded corners.
- No soft or blurred shadows.
- No serif, no pastel, no centered-everything layouts.
- No more than one acid block and one red stamp per screen.

## Type system

| Token | Value |
| --- | --- |
| Display case | uppercase |
| Display tracking | -.035em |
| Display leading | .84 |
| Body size / leading | 18px / 1.55 |
| Label tracking | .12em |
| Features | "kern" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 250ms · cubic-bezier(.2,.8,.2,1) |
| Distance / stagger | 20px / 60ms |
| Page transition | 250ms · cut |
| Ambient | marquee · 22s |
| Hover | shift |
| Note | Mechanical, hard stops; the layout moves like a sign, not a spring. |

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `concrete` | Concrete | sala | `accent` | Paper, ink and acid: the original control room. |
| `signal` | Signal | cartel | `accent2` | Red warning stripe on a bone field. Louder, not busier. |
| `terminal` | Terminal | gabinete | `accent3` | Blue telemetry and monospace; a control room after hours. |

## Signature moves

- 3px black borders on every surface
- Hard 8px offset shadows
- Acid highlighter block behind one phrase
- Marquee band between sections


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
