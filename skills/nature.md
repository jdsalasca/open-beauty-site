---
name: open-beauty-nature
description: Apply the Nature Memory editorial system (A herbarium for the living archive) to a page or GIF with open-beauty-site.
---

# Nature Memory skill

Use this skill together with `beauty` when the brief calls for nature memory.
Never mix it with another style.

# Nature Memory — A herbarium for the living archive

Pressed leaves, field notes, growth rings and a palette of moss, clay and pollen. An archive that remembers it was alive: botanical, patient, exact.

**Use it for:** botanical gardens, museums and archives, slow editorial, nature education, memory projects, seed libraries.
**Avoid it for:** nightlife, fast commerce, dense dashboards, ironic youth brands.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Cormorant Garamond` |
| Body font | `Karla` |
| Mono/label font | `IBM Plex Mono` |
| Border widths | 1, 2 px |
| Border radius | 0–22 px |
| Motion window | 0.5–1.8 s |
| Shadow rule | Soft botanical shadow: 0 18px 40px rgba(36,48,38,.14). Never hard offset. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#EFE9D8` |
| surface | `#DCE4D2` |
| ink | `#243026` |
| muted | `#5A6450` |
| accent | `#7A8B4F` |
| accent2 | `#B55239` |
| accent3 | `#4B6B62` |
| accent4 | `#D8B56A` |
| deep | `#141B15` |

## Typography

- Display: Cormorant Garamond 400 at 64–132px, sentence case, line-height 1.02. Italic is for a field name or a single turn, not for whole paragraphs.
- Body: Karla 300/400 at 18–20px, line-height 1.68, max-width 62ch. Labels: IBM Plex Mono 400 at 10–11px, uppercase, tracking .16em.
- Use old-style numerals for dates and specimen numbers; tabular figures for measurements. Never set a whole page in italic.

## Colour

- Parchment #EFE9D8 is the page; lichen #DCE4D2 is a pressed field; moss #7A8B4F is the lead accent; clay #B55239 is the one warm event.
- Rain #4B6B62 is a secondary field; pollen #D8B56A is for labels and small marks, not body text. Deep #141B15 is for a dark archive only.
- No gradients that fake light. A seasonal field is flat, with a hard paper edge.

## Layout

- Asymmetric field sheet: copy on one side, a specimen plate on the other. The plate can bleed off one edge.
- Use a visible herbarium label: date, place, collector, source. If the source is unknown, say unknown.
- Sections are drawers, not cards: a thin rule, a number, a specimen title, a short note.
- On mobile, the plate becomes a full-width pressed sheet; never stack five tiny cards.

## Motion

- Slow and botanical: 900ms fade + 14px rise; stagger 80ms. A pressed leaf does not bounce.
- Ambient: a 16s drift of one leaf, growth rings drawing once. Nothing loops faster than a season.
- Hover: underline or a 2px shift; no scaling. Reduced motion shows the final state and stops the drift.

## Imagery

- Original botanical SVG: stems, leaves, seed heads, roots, growth rings, a single insect. Flat ink and muted fills.
- No stock photos, no fake Latin, no generic monstera. Every specimen has a name, a place and a date, or is marked as unknown.
- Paper texture comes from grain and thin rules, not a global noise overlay.

## Copy voice

- Voice: a field notebook written for a visitor, not a perfume ad. Precise, patient, first person plural.
- Headline: 2–6 words, sentence case; one botanical image, one measured fact.
- Body: observation before metaphor. Name what you can see, then what it might mean. Never invent a species or a date.

## Never

- No cottagecore clichés, fake Latin, pressed-flower stickers or "organic" gradients.
- No hard offset shadows, no neon, no pure white.
- No stock photography of forests or hands.
- Never present an invented specimen as a fact; mark fiction and uncertainty.

## Type system

| Token | Value |
| --- | --- |
| Display case | none |
| Display tracking | .005em |
| Display leading | 1.02 |
| Body size / leading | 18px / 1.68 |
| Label tracking | .16em |
| Features | "liga" 1, "kern" 1, "onum" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 900ms · cubic-bezier(.22,.61,.36,1) |
| Distance / stagger | 14px / 80ms |
| Page transition | 1100ms · rise |
| Ambient | drift · 16s |
| Hover | underline |
| Note | Leaves settle; rings grow once; nothing loops faster than a season. |

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `herbarium` | Herbarium | sala | `accent3` | Pressed leaves on cream paper, ink labels, one terracotta berry. |
| `understory` | Understory | gabinete | `accent2` | Deep moss, rain and a low canopy; quieter and more interior. |
| `seedbank` | Seed bank | cartel | `accent4` | A dark archive of seeds and pollen; gold only in the labels. |

## Signature moves

- Pressed-specimen plate with a hand-written field label
- Growth rings as a quiet diagram, never a generic target
- Seasonal bands: moss, clay, rain and pollen in flat fields
- Vertical herbarium label with date and place
- Botanical linework on paper, no stock photography


## Before you ship

- Run `beauty_validate` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
