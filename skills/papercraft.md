---
name: open-beauty-papercraft
description: Apply the Paper Craft editorial system (A warm table covered in cut paper) to a page or GIF with open-beauty-site.
---

# Paper Craft skill

Use this skill together with `beauty` when the brief calls for paper craft.
Never mix it with another style.

# Paper Craft — A warm table covered in cut paper

Cream, kraft and scissors. Layered paper shapes, soft shadows, tape and a gentle float: handmade but art-directed.

**Use it for:** crafts, food, education, community, personal projects, children, stationery.
**Avoid it for:** fintech, enterprise SaaS, brutalist music, anything that needs to feel sharp.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Fraunces` |
| Body font | `Nunito Sans` |
| Mono/label font | `Nunito Sans` |
| Border widths | 1, 2 px |
| Border radius | 10–48 px |
| Motion window | 0.5–1.2 s |
| Shadow rule | Soft and warm: 0 22px 40px rgba(74,58,50,.20) plus a 0 2px 0 edge. Never a hard offset. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#FBF1E2` |
| surface | `#FFF8EA` |
| ink | `#4A3A32` |
| muted | `#7A5F50` |
| accent | `#D9785B` |
| accent2 | `#A9C3A0` |
| accent3 | `#B8D4E0` |
| accent4 | `#F2C879` |
| deep | `#7C5A72` |

## Typography

- Display: Fraunces 560 with SOFT 100 / WONK 1 / opsz 144 at 64–124px, line-height .96, sentence case. A soft serif cut from paper, not a rounded sans.
- Body: Nunito Sans 400 at 18–19px, line-height 1.62. Labels: Nunito Sans 800 at 10–12px, uppercase, letter-spacing .12em.
- No italics: Fraunces is used upright here. Emphasis is a colour change plus a -1.2° rotation on one word.
- Never use a rounded geometric sans as display, never a monospace, never a second serif.

## Colour

- Cream #FBF1E2 is the table; paper #FFF8EA is the sheet. Terracotta #D9785B, sage #A9C3A0 and sky #B8D4E0 are the other three sheets; ink #4A3A32 is the pen.
- Butter #F2C879 is tape only, never a surface. Plum #7C5A72 is a tiny accent, never a button.
- Buttons are ink with cream text. Maximum three paper colours per screen plus cream.
- Shadows are warm brown rgba(74,58,50,.16–.20), never grey or black.

## Layout

- Layered and off-grid but balanced: cards rotated -2° to 2°, overlapping 16–28px, with visible tape.
- Cut-paper geometry: 30px 12px 28px 14px (a ≥18px delta) and one 26px corner notch on the focal card. No stitched dashed borders.
- Stack a second coloured sheet 10px right / 8px down behind each card; give the sheet a 1px edge and a 2/14/30 blur hierarchy.
- One full-bleed band per page, with two sheets crossing the right margin. Vertical rhythm 96–140px.
- One focal paper object per screen; everything else supports it.

## Motion

- Physical, not bouncy: 480ms cubic-bezier(.22,.9,.24,1), translateY(-22px) rotate(-2.5deg) → zero. Shadow settles 180ms later; tape follows 60ms after.
- Float by rotating ±.6° over 8s, delays 0/.9/1.7s. Hover lifts 3px, no scale, no spring.
- Stagger 90ms; respect reduced motion.

## Imagery

- Paper cutout SVG: soft serif-like flowers, leaves, suns, waves, butterflies, confetti. Hard cut edges, no line art, no dashed stitching.
- No photos, no neon, no hard black borders, no brutalist grids.
- Tape has torn ends, 6–8° tilt and a 1px shadow; it is the signature detail, max five per page.

## Copy voice

- Voice: warm, handmade, first person. Short sentences, sensory details.
- Headline: 3–6 words, sentence case; one word can shift colour and rotate.
- Body: concrete nouns, no corporate abstractions. Say "we folded 400 invitations", not "we deliver solutions".

## Never

- No 0px corners, no perfect rounded rectangles: the corner delta must be visible.
- No dashed stitching, no 3px black borders, no acid colours, no monospace.
- No rounded sans display, no hard shadows, no dark backgrounds.
- No serif-with-hairlines (DM Serif) and no rounded sans (Fredoka). Both read as stock.

## Type system

| Token | Value |
| --- | --- |
| Display case | none |
| Display tracking | .005em |
| Display leading | .94 |
| Body size / leading | 18px / 1.65 |
| Label tracking | .18em |
| Features | "liga" 1, "kern" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 480ms · cubic-bezier(.22,.9,.24,1) |
| Distance / stagger | 22px / 90ms |
| Page transition | 800ms · settle |
| Ambient | float · 8s |
| Hover | lift |
| Note | Paper settles: shadow arrives 180ms after the sheet. |

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `picnic` | Picnic | sala | `accent2` | Sage tablecloth, terracotta card, butter tape. |
| `carnival` | Carnival | cartel | `accent` | Terracotta lead, sky secondary, confetti kept small. |
| `museum` | Museum | gabinete | `accent3` | Sky-blue label, paper white, plum only in the seal. |

## Signature moves

- Fraunces display with Nunito Sans body
- Cut-paper radii: 30px 12px 28px 14px
- Layered paper sheets behind each card
- Washi tape with torn ends and a 6–8° tilt
- Scalloped or torn band dividers


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
