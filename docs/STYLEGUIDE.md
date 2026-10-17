# open-beauty-site style guide

Three complete editorial systems. Every value here is normative: if a page uses another font, colour, border width or radius, the validator will flag it.

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


---

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

## Signature moves

- 3px black borders on every surface
- Hard 8px offset shadows
- Acid highlighter block behind one phrase
- Marquee band between sections


---

# Paper Craft — A warm table covered in cut paper

Cream, kraft and scissors. Layered paper shapes, soft shadows, tape and a gentle float: handmade but art-directed.

**Use it for:** crafts, food, education, community, personal projects, children, stationery.
**Avoid it for:** fintech, enterprise SaaS, brutalist music, anything that needs to feel sharp.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `DM Serif Display` |
| Body font | `Lato` |
| Mono/label font | `Lato` |
| Border widths | 1, 2 px |
| Border radius | 14–32 px |
| Motion window | 0.5–1.2 s |
| Shadow rule | Soft and warm: 0 18px 30px rgba(58,46,40,.18) plus a 0 2px 0 edge. Never a hard offset. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#FBF3E4` |
| surface | `#F4E6CE` |
| ink | `#3A2E28` |
| muted | `#6B5648` |
| accent | `#C96F4A` |
| accent2 | `#8FA98A` |
| accent3 | `#A9C7D9` |
| deep | `#6E4B63` |

## Typography

- Display: DM Serif Display 400 at 84–120px, line-height .9, sentence case. It should feel cut, not typed.
- Body: Lato 400 at 17–19px, line-height 1.6. Labels: Lato 900 at 10–12px, uppercase, letter-spacing .18em.
- Italic only for one handwritten-feeling word; never all caps for the display.
- Never use monospace or a second serif.

## Colour

- Cream #FBF3E4 is the table. Terracotta #C96F4A, sage #8FA98A, sky #A9C7D9 and kraft #D9B98C are paper sheets; ink #3A2E28 is the pen.
- Use at most three paper colours per screen plus cream. Plum #6E4B63 only for tiny accents.
- Shadows are warm brown rgba(58,46,40,.18), never grey or black.
- No neon, no pure white, no acid.

## Layout

- Layered and off-grid but balanced: cards rotated -3° to 3°, overlapping 12–24px, with visible tape.
- Radii 16–28px and asymmetric, e.g. 22px 18px 24px 16px. Never perfect circles for cards.
- Vertical rhythm 96–140px. Use a scalloped or torn divider between bands.
- One focal paper object per screen; everything else supports it.

## Motion

- Gentle and physical: .6–.9s pop-in with cubic-bezier(.34,1.56,.64,1), then a 6s float loop with 12px amplitude.
- Stagger 90ms; parallax layers by 8–16px. Respect reduced motion.
- Hover lifts a card by 4px and deepens its shadow. No colour flashing.

## Imagery

- Paper cutout SVG: flowers, leaves, suns, waves, confetti. Each shape gets a soft warm shadow and a slightly darker edge.
- No photos, no neon, no hard black borders, no brutalist grids.
- Tape is semi-transparent and slightly rotated; it is the signature detail.

## Copy voice

- Voice: warm, handmade, first person. Short sentences, sensory details.
- Headline: 3–6 words, sentence case; one word can be italic.
- Body: concrete nouns, no corporate abstractions. Say "we folded 400 invitations", not "we deliver solutions".

## Never

- No 0px corners.
- No 3px black borders, no acid colours, no monospace.
- No uppercase display, no hard shadows, no dark backgrounds.
- No more than one italic phrase per screen.

## Signature moves

- Layered paper cards rotated -3° to 3°
- Washi tape strips on the corners
- Scalloped or torn band dividers
- Soft float loop on decorative shapes

