---
name: open-beauty-artdeco
description: Apply the Art Deco editorial system (A lacquered machine for looking upward) to a page or GIF with open-beauty-site.
---

## Quick recipe

Copy, paste, run. Replace only the quoted words.

```bash
node dist/cli.js page --style artdeco --brief examples/recipes/artdeco/page.json --out out/artdeco.html
node dist/cli.js deck --style artdeco --brief examples/recipes/artdeco/deck.json --out out/artdeco-deck.html
node dist/cli.js gif --style artdeco --text "Art Deco Lobby" --out out/artdeco.gif
```

**5 hard rules**
- Display font is `Poiret One`; body and labels use it too. Never substitute.
- Border widths: 1, 2 px. Radius: 0–2 px.
- Motion window: 0.4–1.4 s.
- Shadow: No shadow: depth comes from gold hairlines and nested stepped frames.
- No lorem ipsum.

**3 common mistakes (and fixes)**
- Inventing a font -> read Hard tokens and use the exact family.
- Adding a second accent -> one accent per screen; keep the rest chalky/flat.
- Too much copy -> card body 1–2 sentences; headline 2–6 words.

**Words / tone**
- es: Programa de cine de 1929: preciso, ascendente, un poco teatral. Nombra edificio, año y material.
- en: a 1929 cinema programme: precise, upward, a little theatrical. Name the building, the year, the material.

# Art Deco skill

Use this skill together with `beauty` when the brief calls for art deco.
Never mix it with another style.

# Art Deco — A lacquered machine for looking upward

Black lacquer, champagne lines and a sunburst geometry. Symmetrical, vertical, cinematic: a lobby for a future that never quite arrived.

**Use it for:** architecture, jazz and nightlife, timelines, luxury brands, city histories.
**Avoid it for:** children, dense data, informal community pages.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Poiret One` |
| Body font | `Josefin Sans` |
| Mono/label font | `Josefin Sans` |
| Border widths | 1, 2 px |
| Border radius | 0–2 px |
| Motion window | 0.4–1.4 s |
| Shadow rule | No shadow: depth comes from gold hairlines and nested stepped frames. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#0E0E10` |
| surface | `#17171B` |
| ink | `#F4EBD9` |
| muted | `#B9C0C4` |
| accent | `#C8A45C` |
| accent2 | `#1F5C4A` |
| accent3 | `#6E1F2B` |
| accent4 | `#D9A6A0` |
| deep | `#050506` |

## Typography

- Display: Poiret One 400 at 88–148px, uppercase, letter-spacing .06em, line-height .9. Never bold it.
- Body: Josefin Sans 300/400 at 16–18px, line-height 1.7. Labels: Josefin Sans 600 at 11px, uppercase, letter-spacing .22em.
- One champagne italic is allowed for a single word; everything else stays geometric.

## Colour

- Black #0E0E10 is 75% of the page. Champagne #C8A45C is a 1px line, a sun, a numeral; never a large fill.
- Emerald #1F5C4A and burgundy #6E1F2B are deep accents in small fields. Ivory #F4EBD9 is the only text colour.
- No pastel gradients. Gold may glow only through opacity, not a soft radial haze.

## Layout

- Symmetry is the point: a centred axis, mirrored steps, a tall hero. Break it once with an off-centre caption.
- Use nested frames: 1px outer, 8px gap, 1px inner. Corners may step, never round.
- Cards are vertical panels with a stepped top, not floating rectangles.

## Motion

- A slow 24s sun rotation; 900ms gold line draw; hover lifts a card by 2px and brightens the hairline.
- Nothing bounces. No spring.

## Imagery

- Original SVG: sunburst, stepped arch, chevrons, fans, a skyscraper silhouette. Hard edges, no photos.
- Gold lines at 1px; deep green and burgundy only as flat fields.

## Copy voice

- Voice: a 1929 cinema programme: precise, upward, a little theatrical. Name the building, the year, the material.
- Headline: 3–6 words in spaced caps. One word may be champagne; never use "luxury" as a claim.
- Body: one image, one fact, one date. Cut any sentence that could belong to a perfume ad.

## Never

- No lorem ipsum.
- No emoji.
- No stock photography.
- No gradients that fake depth unless the style calls for them.
- No rounded corners.
- No sans-serif body other than Josefin Sans.
- No rainbow palette.
- No centred-everything without one asymmetry.

## Type system

| Token | Value |
| --- | --- |
| Display case | uppercase |
| Display tracking | .06em |
| Display leading | .9 |
| Body size / leading | 18px / 1.7 |
| Label tracking | .22em |
| Features | "kern" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 900ms · cubic-bezier(.22,.61,.36,1) |
| Distance / stagger | 12px / 90ms |
| Page transition | 1100ms · curtain |
| Ambient | sun · 38s |
| Hover | glow |
| Note | A curtain opens upward; the sun keeps turning in the background. |

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `lacquer` | Lacquer | sala | `accent` | Champagne line on black; the default lobby. |
| `emerald` | Emerald | gabinete | `accent2` | Deep green ground and a gold sun; a cinema foyer. |
| `cinema` | Cinema | cartel | `accent4` | Rose-gold light, burgundy shadow, one white screen. |

## Signature moves

- Gold sunburst with stepped rays
- Symmetrical black-and-champagne frame
- Vertical chevrons and stepped corners
- Poiret One spaced caps


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
