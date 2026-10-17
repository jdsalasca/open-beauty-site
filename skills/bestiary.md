---
name: open-beauty-bestiary
description: Apply the Illuminated bestiary editorial system (A field guide for animals that never existed) to a page or GIF with open-beauty-site.
---

# Illuminated bestiary skill

Use this skill together with `beauty` when the brief calls for illuminated bestiary.
Never mix it with another style.

# Illuminated bestiary — A field guide for animals that never existed

Parchment, iron-gall ink and a single lapis blue. A manuscript page with an illuminated initial, marginalia and a creature that watches back.

**Use it for:** biology and taxonomy, fable and literature, mythology, natural history, slow essays.
**Avoid it for:** sports, SaaS, breaking news.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `UnifrakturMaguntia` |
| Body font | `IM Fell English` |
| Mono/label font | `IM Fell English` |
| Border widths | 1, 2 px |
| Border radius | 0–4 px |
| Motion window | 0.5–1.4 s |
| Shadow rule | No shadow. The manuscript is flat; use a 1px ink rule. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#E8D9B8` |
| surface | `#F2E6C9` |
| ink | `#2B2118` |
| muted | `#6A5745` |
| accent | `#C9A227` |
| accent2 | `#A63A2B` |
| accent3 | `#2E4A7D` |
| accent4 | `#4E7A63` |
| deep | `#2B2118` |

## Typography

- Display: UnifrakturMaguntia 400 at 54–94px, sentence case. It is a display face; never set body copy in it.
- Body: IM Fell English 400 at 18–21px, line-height 1.7. Italic for marginalia. Labels: IM Fell English 400 at 12px, small caps.
- Drop caps: 4 lines, lapis or vermilion, with a 12px gold rule.

## Colour

- Parchment #E8D9B8 is the page. Iron-gall #2B2118 is the text. Lapis #2E4A7D is the sacred blue, ≤10%.
- Gold #C9A227 is flat leaf, never a gradient. Vermilion #A63A2B is a rubric or a wound.
- No white backgrounds, no neon, no photographic texture.

## Layout

- Two columns with a wide gutter and generous lower margin. The initial breaks the first column.
- Marginalia sits outside the text block, rotated 90° only if it is short.
- Frames are drawn with 1px rules and small corner fleurons, not thick borders.

## Motion

- The creature blinks every 7s; gold glints once on reveal. No floating.
- Hovering a marginal note reveals its translation.

## Imagery

- Original SVG: a hare-headed bird, a two-tailed fox, a botanical border, a gold sun. Hand-drawn silhouette, no clip art.
- Texture from CSS grain, not a photo.

## Copy voice

- Voice: precise, curious, never jokey. Explain the subject, not the studio.
- Headline: 2–6 words. One word may carry the accent colour.
- Body: one idea per paragraph, concrete nouns, no filler.

## Never

- No lorem ipsum.
- No emoji.
- No stock photography.
- No gradients that fake depth unless the style calls for them.
- No blackletter body copy.
- No glossy gradients.
- No modern sans-serif.
- No generic fantasy dragons.

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `scriptorium` | Scriptorium | sala | `accent` | Old gold and iron gall; the room lit by one candle. |
| `lapis` | Lapis | gabinete | `accent3` | A blue initial and a gold rule; the sacred page. |
| `rubric` | Rubric | cartel | `accent2` | Vermilion marginalia and a green vine. |

## Signature moves

- Illuminated initial with a creature
- Two-column manuscript grid
- Gold leaf as a flat shape, not a gradient
- Marginalia and a red rubric


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
