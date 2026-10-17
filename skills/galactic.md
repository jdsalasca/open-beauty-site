---
name: open-beauty-galactic
description: Apply the Galactic Futurism editorial system (A planetarium for the things we remember) to a page or GIF with open-beauty-site.
---

# Galactic Futurism skill

Use this skill together with `beauty` when the brief calls for galactic futurism.
Never mix it with another style.

# Galactic Futurism — A planetarium for the things we remember

Deep-space navy, chrome ivory and one slow planet. Michroma, orbital rings and the silence before a bassline: less sci-fi blockbuster, more planetarium after closing time.

**Use it for:** music rooms, space and astronomy, memory and technology, film essays, album tributes.
**Avoid it for:** fast commerce, children’s worksheets, cluttered dashboards.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Michroma` |
| Body font | `Space Grotesk` |
| Mono/label font | `Space Grotesk` |
| Border widths | 1, 2 px |
| Border radius | 0–2 px |
| Motion window | 0.4–1.8 s |
| Shadow rule | No box shadow: depth comes from the starfield, orbital lines and black space. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#05060A` |
| surface | `#0D1020` |
| ink | `#F2F4FF` |
| muted | `#9BA6C4` |
| accent | `#79E8FF` |
| accent2 | `#B388FF` |
| accent3 | `#F5C86B` |
| accent4 | `#FF6FAE` |
| deep | `#02030A` |

## Typography

- Display: Michroma 400 at 42–92px, uppercase, letter-spacing .01em, line-height 1.08. It is wide: keep headlines short.
- Body: Space Grotesk 300/400 at 16–18px, line-height 1.7. Labels: Space Grotesk 500 at 10px, uppercase, tracked .18em.
- One chrome-gradient word is allowed. Never chrome the whole headline.

## Colour

- Void #05060A is 70% of the page. Chrome ivory #F2F4FF is the text. Cyan #79E8FF is a line or a planet rim, never a fill.
- Violet #B388FF and solar gold #F5C86B are secondary orbital accents. Magenta #FF6FAE is a single event.
- No rainbow nebula. No purple-to-pink gradient across everything. Space is mostly black.

## Layout

- One planet, three orbits, one headline. The page should feel like a room with a very large window.
- Asymmetric: copy on one side, a planet that bleeds off the other. Generous negative space is the luxury.
- Cards are instruments, not glassmorphism: 1px cyan rule, black field, small technical labels.

## Motion

- Orbits rotate over 40–80s; the planet breathes 4px; stars twinkle at 6s. No warp speed.
- Audio player is user-initiated; never autoplay.

## Imagery

- Original SVG: ringed planet, thin orbital ellipses, a small moon, a starfield. No NASA photos, no Star Wars ships, no lens flares.
- A single grain layer keeps the black from feeling flat.

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
- No neon rainbow.
- No autoplay audio.
- No sci-fi logos or fake alien alphabets.

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `orbital` | Orbital | sala | `accent` | Cyan orbit, violet planet, chrome ivory. |
| `deep-field` | Deep field | gabinete | `accent2` | Violet nebula and a gold moon; less interface. |
| `solar` | Solar | cartel | `accent3` | Gold sun, black space, cyan only as a line. |

## Signature moves

- One planet, three orbits
- Chrome Michroma caps
- Cyan and solar gold on void black
- A music room with an original track


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
