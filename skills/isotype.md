---
name: open-beauty-isotype
description: Apply the Isotype editorial system (A city explained with pictograms) to a page or GIF with open-beauty-site.
---

# Isotype skill

Use this skill together with `beauty` when the brief calls for isotype.
Never mix it with another style.

# Isotype — A city explained with pictograms

Vienna, 1925: cream paper, black rules and a red pictogram that counts. Data as a public language, not a dashboard.

**Use it for:** data and economics, civic history, mathematics, public health, explanatory journalism.
**Avoid it for:** luxury, romance, atmospheric fiction.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Jost` |
| Body font | `IBM Plex Sans` |
| Mono/label font | `IBM Plex Sans` |
| Border widths | 1, 2, 3 px |
| Border radius | 0–2 px |
| Motion window | 0.3–1.2 s |
| Shadow rule | No shadow. The grid and the pictograms do the work. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#F2EBDD` |
| surface | `#E7DFC9` |
| ink | `#1C1C1C` |
| muted | `#6F6A5E` |
| accent | `#D23B2E` |
| accent2 | `#2A7F7A` |
| accent3 | `#D9A441` |
| accent4 | `#8C8C8C` |
| deep | `#1C1C1C` |

## Typography

- Display: Jost 500 at 72–128px, line-height .95, tight tracking -.02em. It must look drawn, not branded.
- Body: IBM Plex Sans 400 at 16–18px, line-height 1.65. Labels: IBM Plex Sans 500 at 11px, uppercase, letter-spacing .14em.
- Numbers are display: tabular, large, black; one number may be red.

## Colour

- Cream #F2EBDD is paper. Black #1C1C1C is ink. Signal red #D23B2E marks one quantity, never decoration.
- Teal #2A7F7A and mustard #D9A441 are secondary series. Grey #8C8C8C is the grid.
- No gradients, no shadows, no glass. The page is printed.

## Layout

- Visible 12-column grid with a 1px rule. Asymmetry comes from data, not from arbitrary offsets.
- A pictogram row is a paragraph: repeat the same silhouette, never mix three icon families.
- Tables are allowed and should look like tables. Do not turn every number into a card.

## Motion

- Counters tick once on reveal; bars grow 400ms from zero. No looping animation.
- Respect reduced motion; show the final number.

## Imagery

- Original pictograms: person, house, tree, factory, book, water drop. Flat silhouettes on the grid.
- No isometric 3D, no rounded icon packs.

## Copy voice

- Voice: precise, curious, never jokey. Explain the subject, not the studio.
- Headline: 2–6 words. One word may carry the accent colour.
- Body: one idea per paragraph, concrete nouns, no filler.

## Never

- No lorem ipsum.
- No emoji.
- No stock photography.
- No gradients that fake depth unless the style calls for them.
- No rounded cards.
- No drop shadows.
- No more than two pictogram families.
- No fake statistics.

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `vienna` | Vienna | sala | `accent` | Signal red pictograms on cream; the 1925 room. |
| `civic` | Civic | gabinete | `accent2` | Teal series, mustard secondary, counting grid. |
| `archive` | Archive | cartel | `accent3` | Mustard index cards and grey rules; quieter data. |

## Signature moves

- One pictogram = one unit
- Visible counting grid
- Cream, black and signal red
- Hand-cut silhouettes, not icons


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
