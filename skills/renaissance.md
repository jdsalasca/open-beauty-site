---
name: open-beauty-renaissance
description: Apply the Renaissance editorial system (A slow, gilded editorial system) to a page or GIF with open-beauty-site.
---

# Renaissance skill

Use this skill together with `beauty` when the brief calls for renaissance.
Never mix it with another style.

# Renaissance — A slow, gilded editorial system

Parchment, ink and gold. Symmetrical, quiet and deliberate: the page behaves like a printed folio, not an app.

**Use it for:** portfolios, cultural institutions, editorial essays, weddings, long-form launches.
**Avoid it for:** dashboards, dense product UI, playful youth brands, anything that needs to feel fast.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Crimson Text` |
| Body font | `Crimson Text` |
| Mono/label font | `Crimson Text` |
| Border widths | 1 px |
| Border radius | 0–2 px |
| Motion window | 0.6–1.6 s |
| Shadow rule | None, or one long soft ambient shadow (0 24px 60px rgba(43,33,24,.08)). Never hard offset shadows. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#F3EAD7` |
| surface | `#EADFC8` |
| ink | `#2B2118` |
| muted | `#6E5C49` |
| accent | `#B8892F` |
| accent2 | `#7A2E2A` |
| accent3 | `#7C8465` |
| deep | `#1C1611` |

## Typography

- Display: Crimson Text 400 at 96–132px, line-height .92, sentence case. Italic is the only emphasis: put one or two words in italic oxblood.
- Eyebrows and labels: Crimson Text 600, 11–13px, uppercase, letter-spacing .22em.
- Body: Crimson Text 400, 19–21px, line-height 1.65, max-width 62ch.
- Never use a sans-serif for a headline. Never use more than two weights on one screen.

## Colour

- Parchment #F3EAD7 covers ~70% of the page; ink #2B2118 ~20%; gold #B8892F and oxblood #7A2E2A only as punctuation (≤10%).
- Gold is for rules, numerals and small ornaments. Never for body text.
- Hairlines are rgba(43,33,24,.35), never a flat grey.
- Green #7C8465 is a whisper: one small detail at most.

## Layout

- Symmetry, centered hero, generous margins (minimum 64px desktop). One idea per screen.
- Frame the page with a fixed double hairline: 18px from the edge, then 24px, 1px each.
- The arch plate is the signature image container. No rounded cards, no blobs, no grids of pills.
- Number sections with roman numerals in gold small caps.

## Motion

- Slow and dignified: 0.8–1.2s, cubic-bezier(.22,.61,.36,1). Fade plus a 16px rise, nothing else.
- Ornaments may draw themselves once with stroke-dashoffset. Nothing loops except an almost invisible grain.
- Hover states are a colour shift or an underline that grows from the left. No scaling.

## Imagery

- Line engravings only: single-weight strokes, hatching, laurel, sun, arches, hills. Ink plus gold.
- Avoid photos, emoji, 3D, neon and gradients with more than two stops.
- If an image is unavoidable, desaturate it to sepia and place it inside the arch.

## Copy voice

- Voice: museum wall label, first person plural, no exclamation marks.
- Headline: 2–5 words, sentence case (never all caps).
- Body: one idea per paragraph, 2–3 sentences. Let white space finish the sentence.

## Never

- No border-radius above 2px.
- No hard offset shadows.
- No sans-serif headlines, no pure white, no purple.
- No more than one italic phrase per screen.

## Signature moves

- Fixed double hairline frame around the viewport
- Arch-shaped engraving plate
- Drop cap on the manifesto
- Gold rule ornament that draws itself


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
