---
name: open-beauty-ukiyoe
description: Apply the Ukiyo-e editorial system (The floating world, printed on paper) to a page or GIF with open-beauty-site.
---

# Ukiyo-e skill

Use this skill together with `beauty` when the brief calls for ukiyo-e.
Never mix it with another style.

# Ukiyo-e — The floating world, printed on paper

Prussian blue, washi cream and a vermilion seal. Flat planes, a great wave and a vertical cartouche: the world seen from the edge of the water.

**Use it for:** oceanography, Japanese history, poetry, climate, art history.
**Avoid it for:** fast product launches, dense dashboards, ironic memes.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Shippori Mincho B1` |
| Body font | `Zen Kaku Gothic New` |
| Mono/label font | `Zen Kaku Gothic New` |
| Border widths | 1, 2 px |
| Border radius | 0–2 px |
| Motion window | 0.6–1.6 s |
| Shadow rule | No shadow. Paper and ink are flat. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#F3E9D2` |
| surface | `#DCE6E3` |
| ink | `#22201D` |
| muted | `#5B6B73` |
| accent | `#1B3A5C` |
| accent2 | `#C8402A` |
| accent3 | `#5B7C99` |
| accent4 | `#6E7F5C` |
| deep | `#1B3A5C` |

## Typography

- Display: Shippori Mincho B1 700 at 62–112px, line-height 1.02, vertical rhythm. One word can be set vertically.
- Body: Zen Kaku Gothic New 400 at 16–18px, line-height 1.75. Labels: Zen Kaku 500 at 11px, letter-spacing .16em.
- Use the seal as punctuation, not as a logo.

## Colour

- Washi #F3E9D2 is 55%. Prussian #1B3A5C is the sea and the type. Vermilion #C8402A is the seal and one accent.
- Mist #DCE6E3 and moss #6E7F5C are distant planes; never gradients.
- No gold, no neon, no pure white.

## Layout

- A low horizon and a large negative sky. The composition should feel like a print cropped by the page.
- Title in a narrow vertical cartouche on the left or right; body text on the opposite side.
- Bands are flat and overlap like printed layers.

## Motion

- Waves drift 8–16px on scroll; foam appears once. No bounce.
- The seal can breathe opacity 0.9→1 over 6s.

## Imagery

- Original SVG: waves, foam, a distant mountain, a boat, a crane. Flat shapes, no outlines-only clip art.
- Paper grain and misregistration are welcome.

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
- No 3D or drop shadows.
- No cherry-blossom clip art.
- No faux-Japanese lettering.

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `prussian` | Prussian | sala | `accent` | The classic deep blue sea and a vermilion seal. |
| `vermilion` | Vermilion | gabinete | `accent2` | Red sun, blue shadow, washi sky. |
| `mist` | Mist | cartel | `accent3` | Grey-blue distance; the horizon disappears. |

## Signature moves

- Layered wave planes with foam claws
- Vertical title cartouche
- Vermilion seal
- Washi grain and a low horizon


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
