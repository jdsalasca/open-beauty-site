---
name: open-beauty-renaissance
description: Apply the Renaissance editorial system (A chalky, asymmetric fresco system) to a page or GIF with open-beauty-site.
---

# Renaissance skill

Use this skill together with `beauty` when the brief calls for renaissance.
Never mix it with another style.

# Renaissance — A chalky, asymmetric fresco system

Plaster, pigment and ink. Flat pastel fields, one cinnabar event, a large arch plate and an asymmetric page: a fresco, not a wedding suite.

**Use it for:** portfolios, cultural institutions, editorial essays, weddings, long-form launches.
**Avoid it for:** dashboards, dense product UI, playful youth brands, anything that needs to feel fast.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `EB Garamond` |
| Body font | `EB Garamond` |
| Mono/label font | `EB Garamond` |
| Border widths | 1 px |
| Border radius | 0–2 px |
| Motion window | 0.6–1.6 s |
| Shadow rule | None, or one long soft ambient shadow (0 24px 60px rgba(43,33,27,.08)). Never hard offset shadows. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#F6EDDD` |
| surface | `#E3E9E6` |
| ink | `#2B211B` |
| muted | `#6F5D50` |
| accent | `#B08A4F` |
| accent2 | `#B4432C` |
| accent3 | `#AFC5D6` |
| accent4 | `#B9C4A6` |
| deep | `#1C1611` |

## Typography

- Display: EB Garamond 400 at clamp(64px,10.5vw,152px), line-height .87, sentence case. Italic is the only emphasis: put one or two words in italic cinnabar.
- Eyebrows and labels: EB Garamond 600, 12–13px, true small caps (font-feature-settings:"smcp" 1), letter-spacing .18em.
- Body: EB Garamond 400, 20–21px, line-height 1.62, max-width 62ch.
- Never use a sans-serif for a headline. Never use more than two weights on one screen.

## Colour

- Plaster #F6EDDD covers ~55% of the page. Powder blue #AFC5D6, verdaccio #B9C4A6 and cinnabar #B4432C are flat fresco fields in 10–25% doses.
- Ochre #B08A4F is for 1px rules, numerals and small ornaments, never for body text.
- The palette must feel chalky and sun-faded: pigment mixed with lime plaster, not candy and not a wedding suite.
- One hot event per page: cinnabar on ≤2% of the surface. Without it, pastel becomes papilla.
- Hairlines are rgba(43,33,27,.28), never flat grey.

## Layout

- Asymmetric hero: copy on the left, a large plate on the right. Never center everything.
- Frame the page with a fixed double hairline: 18px from the edge, then 24px, 1px each.
- Use flat, hard-edged pastel fields per section, not gradients fading to transparency. A fresco has a plaster edge, not a vignette.
- The arch plate is the signature image container: min(660px,48vw). No rounded cards, no blobs, no grids of pills.
- Number sections with roman numerals in ochre small caps.

## Motion

- Slow and dignified: 0.7–1.2s, cubic-bezier(.22,.61,.36,1). Fade plus a 16px rise, nothing else.
- Ornaments draw themselves once with stroke-dashoffset over 1.4s; rays stagger 40ms. Nothing loops except an almost invisible grain.
- Hover states are a colour shift or an underline that grows from the left. No scaling.

## Imagery

- Fresco first, engraving second: flat fields of powder blue, verdaccio and cinnabar, with single-weight ink linework on top. Hills, cypress, sun, arches, laurel.
- No photos, emoji, 3D, neon and no gradients. Colour comes in flat fields with a hard edge.
- If an image is unavoidable, desaturate it to sepia and place it inside the arch.

## Copy voice

- Voice: museum wall label, first person plural, no exclamation marks.
- Headline: 2–5 words, sentence case (never all caps).
- Body: one idea per paragraph, 2–3 sentences. Let white space finish the sentence.

## Never

- No border-radius above 2px.
- No hard offset shadows.
- No sans-serif headlines, no pure white, no purple.
- No soft gradient washes. Pastel must arrive as a flat field.
- No saturated primary colours. The pastels must stay chalky, never neon.
- No more than one italic phrase per screen.

## Signature moves

- Fixed double hairline frame around the viewport
- Arch plate with flat pastel fresco fields
- Drop cap on the manifesto
- Gold rule ornament that draws itself
- Flat fresco fields in powder blue, verdaccio and cinnabar


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
