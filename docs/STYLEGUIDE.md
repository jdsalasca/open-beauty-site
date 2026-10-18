# open-beauty-site style guide

Thirteen complete editorial systems. Every value here is normative: if a page uses another font, colour, border width or radius, the validator will flag it.

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

## Type system

| Token | Value |
| --- | --- |
| Display case | none |
| Display tracking | .01em |
| Display leading | .88 |
| Body size / leading | 20px / 1.62 |
| Label tracking | .18em |
| Features | "liga" 1, "kern" 1, "onum" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 900ms · cubic-bezier(.22,.61,.36,1) |
| Distance / stagger | 16px / 80ms |
| Page transition | 1200ms · rise |
| Ambient | draw · 24s |
| Hover | underline |
| Note | Slow, ceremonial; one draw, one fade, no bounce. |

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `fresco` | Fresco | sala | `accent3` | Powder-blue ground, cinnabar only in the margin. |
| `incarnato` | Incarnato | gabinete | `accent2` | Warm plaster and a cinnabar event; the most human room. |
| `notte` | Notte | cartel | `accent` | A darker sacristy: umber ground, gold line, one blue window. |

## Signature moves

- Fixed double hairline frame around the viewport
- Arch plate with flat pastel fresco fields
- Drop cap on the manifesto
- Gold rule ornament that draws itself
- Flat fresco fields in powder blue, verdaccio and cinnabar


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
| accent4 | `#F2EFE4` |
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

## Type system

| Token | Value |
| --- | --- |
| Display case | uppercase |
| Display tracking | -.035em |
| Display leading | .84 |
| Body size / leading | 18px / 1.55 |
| Label tracking | .12em |
| Features | "kern" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 250ms · cubic-bezier(.2,.8,.2,1) |
| Distance / stagger | 20px / 60ms |
| Page transition | 250ms · cut |
| Ambient | marquee · 22s |
| Hover | shift |
| Note | Mechanical, hard stops; the layout moves like a sign, not a spring. |

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `concrete` | Concrete | sala | `accent` | Paper, ink and acid: the original control room. |
| `signal` | Signal | cartel | `accent2` | Red warning stripe on a bone field. Louder, not busier. |
| `terminal` | Terminal | gabinete | `accent3` | Blue telemetry and monospace; a control room after hours. |

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


---

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


---

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

- Voice: a public-data caption. State quantity, unit, denominator and source; say what each pictogram counts.
- Headline: a finding, not a theme: "One in four homes has no lift."
- Body: the comparison in words, then the number. No jargon, no decorative statistics.

## Never

- No lorem ipsum.
- No emoji.
- No stock photography.
- No gradients that fake depth unless the style calls for them.
- No rounded cards.
- No drop shadows.
- No more than two pictogram families.
- No fake statistics.

## Type system

| Token | Value |
| --- | --- |
| Display case | none |
| Display tracking | -.02em |
| Display leading | .95 |
| Body size / leading | 18px / 1.65 |
| Label tracking | .14em |
| Features | "tnum" 1, "kern" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 350ms · cubic-bezier(.2,.7,.2,1) |
| Distance / stagger | 10px / 50ms |
| Page transition | 500ms · count |
| Ambient | none · 0s |
| Hover | underline |
| Note | Information arrives once and stays put; numbers count, nothing loops. |

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


---

# Op Art — Your eye is the medium

Black and bone, a pattern that refuses to sit still. The page is an instrument for perception: your movement completes the image.

**Use it for:** perception, geometry, physics, music posters, experimental education.
**Avoid it for:** long reading, formal finance, accessibility-critical content without a static fallback.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Archivo Black` |
| Body font | `Space Grotesk` |
| Mono/label font | `Space Grotesk` |
| Border widths | 1, 2, 3 px |
| Border radius | 0–0 px |
| Motion window | 0.2–1 s |
| Shadow rule | No shadow. Contrast and repetition create depth. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#0A0A0A` |
| surface | `#F7F7F2` |
| ink | `#F7F7F2` |
| muted | `#A6A6A6` |
| accent | `#E03C31` |
| accent2 | `#1F4FD8` |
| accent3 | `#E8FF3A` |
| accent4 | `#9A9A9A` |
| deep | `#F7F7F2` |

## Typography

- Display: Archivo Black at 82–150px, uppercase, line-height .82, letter-spacing -.03em. Let it collide with the pattern.
- Body: Space Grotesk 400 at 16–18px. Labels: Space Grotesk 500 at 11px, uppercase, tracked .16em.
- Do not use more than two weights. The pattern is the third voice.

## Colour

- Black #0A0A0A and bone #F7F7F2 are the pattern. Red #E03C31 is a warning or a single number.
- Blue #1F4FD8 and acid #E8FF3A appear in one band each, never together in a gradient.
- No soft shadows; no grey haze.

## Layout

- Full-bleed pattern behind or beside the type. The grid should be visible and slightly wrong.
- Alternate dense and empty bands. Give the eye a rest every second screen.
- One rotated element is enough; rotating everything cancels the effect.

## Motion

- The moiré follows the pointer at 0.04 damping; a toggle freezes it. Never strobe above 3 Hz.
- Reveal is a hard cut or a 240ms wipe, not a fade.

## Imagery

- Original CSS/SVG patterns: concentric rings, warped grids, checkerboards, interference lines.
- No stock optical illusions; build the pattern.

## Copy voice

- Voice: a perceptual experiment. Ask one question about what the eye sees, then answer it plainly.
- Headline: 2–5 words with one verb of seeing or moving; never a generic "future" claim.
- Body: short declaratives. Give the eye a pause before the next pattern.

## Never

- No lorem ipsum.
- No emoji.
- No stock photography.
- No gradients that fake depth unless the style calls for them.
- No rounded corners.
- No soft shadows.
- No more than 3 Hz.
- No pattern without a pause.

## Type system

| Token | Value |
| --- | --- |
| Display case | uppercase |
| Display tracking | -.03em |
| Display leading | .84 |
| Body size / leading | 18px / 1.6 |
| Label tracking | .16em |
| Features | "kern" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 200ms · cubic-bezier(.2,.8,.2,1) |
| Distance / stagger | 0px / 30ms |
| Page transition | 200ms · cut |
| Ambient | moire · 18s |
| Hover | none |
| Note | Hard cuts; the eye supplies the movement. No strobe, no bounce. |

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `interference` | Interference | sala | `accent` | Black and bone with a red warning line. |
| `electric` | Electric | gabinete | `accent2` | Blue interference and a single acid pause. |
| `acid` | Acid | cartel | `accent3` | Acid core, black field, red only as an error. |

## Signature moves

- Moiré field that moves with the pointer
- Black/white/red with one acid accent
- Hard geometric type
- Static fallback for reduced motion


---

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

- Voice: a travel print: coast, season, date and a human trace. Never use Japan as decoration or fake Japanese.
- Headline: a place and a change, 2–6 words. Let the weather do some of the work.
- Body: one observed detail, one consequence. No exoticism, no cherry-blossom cliché.

## Never

- No lorem ipsum.
- No emoji.
- No stock photography.
- No gradients that fake depth unless the style calls for them.
- No rounded corners.
- No 3D or drop shadows.
- No cherry-blossom clip art.
- No faux-Japanese lettering.

## Type system

| Token | Value |
| --- | --- |
| Display case | none |
| Display tracking | .02em |
| Display leading | 1.04 |
| Body size / leading | 18px / 1.8 |
| Label tracking | .14em |
| Features | "liga" 1, "kern" 1, "palt" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 1000ms · cubic-bezier(.22,.61,.36,1) |
| Distance / stagger | 14px / 90ms |
| Page transition | 1200ms · rise |
| Ambient | drift · 12s |
| Hover | underline |
| Note | Waves drift, paper stays still; nothing should look digital. |

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `prussian` | Prussian | sala | `accent` | The classic deep blue sea and a vermilion seal. |
| `vermilion` | Vermilion | cartel | `accent2` | Red sun, blue shadow, washi sky. |
| `mist` | Mist | gabinete | `accent3` | Grey-blue distance; the horizon disappears. |

## Signature moves

- Layered wave planes with foam claws
- Vertical title cartouche
- Vermilion seal
- Washi grain and a low horizon


---

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

- Voice: a field guide for an impossible species: anatomy, habitat, behaviour. Mark the invented as hypothesis.
- Headline: the creature's name and one distinguishing trait.
- Body: observation before metaphor. A marginal note may translate the Latin, not replace the evidence.

## Never

- No lorem ipsum.
- No emoji.
- No stock photography.
- No gradients that fake depth unless the style calls for them.
- No blackletter body copy.
- No glossy gradients.
- No modern sans-serif.
- No generic fantasy dragons.

## Type system

| Token | Value |
| --- | --- |
| Display case | none |
| Display tracking | .01em |
| Display leading | 1 |
| Body size / leading | 18px / 1.75 |
| Label tracking | .12em |
| Features | "liga" 1, "kern" 1, "onum" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 800ms · cubic-bezier(.22,.61,.36,1) |
| Distance / stagger | 12px / 80ms |
| Page transition | 1000ms · illuminate |
| Ambient | blink · 7s |
| Hover | glow |
| Note | One blink, one glint, one translation; the manuscript is otherwise still. |

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


---

# Psychedelic poster — A poster that refuses to sit still

Night blue, magenta and orange, liquid shapes and a headline that bends. A 1967 concert poster for a subject that deserves a trip.

**Use it for:** music, biology, chemistry, festivals, consciousness.
**Avoid it for:** legal, medical instructions, conservative finance.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Bungee Shade` |
| Body font | `Space Grotesk` |
| Mono/label font | `Space Grotesk` |
| Border widths | 0, 1, 2, 4 px |
| Border radius | 0–40 px |
| Motion window | 0.3–1.4 s |
| Shadow rule | Hard offset shadows in magenta or orange are allowed; no soft grey shadows. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#1B1B3A` |
| surface | `#2A1A5E` |
| ink | `#F7E8C8` |
| muted | `#B9A7FF` |
| accent | `#E5197F` |
| accent2 | `#FF6B1A` |
| accent3 | `#F5E13B` |
| accent4 | `#00A6A6` |
| deep | `#5B2A86` |

## Typography

- Display: Bungee Shade at 68–120px, uppercase, line-height .88. It is already decorative; do not add another display face.
- Body: Space Grotesk 400 at 16–18px, line-height 1.6. Labels: Space Grotesk 500 at 11px, tracked .14em.
- One word can be set in a curved arc or rotated 3°; not the whole headline.

## Colour

- Night #1B1B3A is the ground. Magenta #E5197F and orange #FF6B1A are the hot pair. Acid #F5E13B is a single hit.
- Teal #00A6A6 and violet #5B2A86 are cool pauses. Cream #F7E8C8 is text.
- Gradients are allowed only inside blobs; keep type on flat colour.

## Layout

- All-over composition: blobs, rings and type overlap. Leave one quiet corner for the CTA.
- Cards are poster panels, not UI cards: thick black keylines and a hard offset.
- The fold or crop can cut a shape; do not center everything.

## Motion

- Blobs drift 20–40px over 9s; hover expands a blob 4%. No strobing.
- Reduced motion freezes the blobs and keeps the poster.

## Imagery

- Original SVG: liquid blobs, concentric rings, a sun with a face, mushrooms? no: abstract cells and eyes.
- No stock psychedelic art, no AI-glow.

## Copy voice

- Voice: a concert poster with a clear subject. One sensory verb, one plain explanation, no vague "vibes".
- Headline: the phenomenon and the invitation, 2–5 words.
- Body: describe what happens to the eye or the room; then say why it matters.

## Never

- No lorem ipsum.
- No emoji.
- No stock photography.
- No gradients that fake depth unless the style calls for them.
- No soft shadows.
- No more than three hot colours.
- No illegible body copy.
- No strobing above 3 Hz.

## Type system

| Token | Value |
| --- | --- |
| Display case | uppercase |
| Display tracking | .02em |
| Display leading | .85 |
| Body size / leading | 18px / 1.55 |
| Label tracking | .18em |
| Features | "kern" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 550ms · cubic-bezier(.22,.8,.24,1) |
| Distance / stagger | 18px / 60ms |
| Page transition | 800ms · swirl |
| Ambient | drift · 9s |
| Hover | lift |
| Note | Blobs drift like heat; the type stays readable. |

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `magenta` | Magenta | sala | `accent` | Hot pink lead, orange shadow, acid only as punctuation. |
| `acid` | Acid | gabinete | `accent3` | Yellow lead on violet; the poster under blacklight. |
| `teal` | Teal | cartel | `accent4` | Cool teal and violet; the after-hours version. |

## Signature moves

- Liquid blobs that follow the pointer
- Bungee Shade headline with a hard offset
- Acid yellow and hot magenta
- A poster that fills the viewport


---

# Memphis — A deliberate case of bad taste

Milan, 1981: squiggles, terrazzo, cobalt and pink. Postmodern play with a straight face, held together by a black keyline.

**Use it for:** design history, music, workshops, creative education, events.
**Avoid it for:** hospitals, luxury, solemn memorials.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Bricolage Grotesque` |
| Body font | `DM Sans` |
| Mono/label font | `DM Sans` |
| Border widths | 1, 2, 3 px |
| Border radius | 0–48 px |
| Motion window | 0.3–1.2 s |
| Shadow rule | Hard black offset shadows (6px 6px 0) are the point; no soft blur. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#F5F0E6` |
| surface | `#FFFFFF` |
| ink | `#111111` |
| muted | `#6B6B6B` |
| accent | `#F2A6B3` |
| accent2 | `#9FD8C8` |
| accent3 | `#2E4FD8` |
| accent4 | `#F4D35E` |
| deep | `#B9A7E0` |

## Typography

- Display: Bricolage Grotesque 700 at 72–128px, line-height .92, tight tracking -.03em.
- Body: DM Sans 400 at 16–18px, line-height 1.6. Labels: DM Sans 500 at 11px, uppercase, tracked .12em.
- One word can be on a pink highlight; do not rainbow the headline.

## Colour

- Bone #F5F0E6 is the table. Black #111111 is the keyline. Pink #F2A6B3, mint #9FD8C8, cobalt #2E4FD8 and butter #F4D35E are flat shapes.
- Lilac #B9A7E0 is a fifth accent; use it sparingly.
- No gradients, no soft shadows, no beige minimalism.

## Layout

- Asymmetrical, rotated 1–4°, overlapping. A 3px black keyline keeps the chaos legible.
- Cards can be different widths; the grid is a suggestion. Do not align everything.
- Use one giant squiggle and one terrazzo field per page.

## Motion

- Click “shuffle” to re-scatter shapes with a 300ms transform. Squiggles draw in 700ms.
- Hover lifts a card 4px and increases the hard shadow to 8px.

## Imagery

- Original SVG: squiggles, terrazzo chips, a checkerboard, a wavy vase, a star.
- No Memphis Group scans; draw the vocabulary.

## Copy voice

- Voice: dry wit under a playful title. The joke is in the composition, not in the copy.
- Headline: a concrete object or action, 2–5 words. Resist the easy punchline.
- Body: a precise observation in one or two sentences; keep one straight face.

## Never

- No lorem ipsum.
- No emoji.
- No stock photography.
- No gradients that fake depth unless the style calls for them.
- No soft shadows.
- No rounded sans-only look without a keyline.
- No more than five accents.
- No aligning everything.

## Type system

| Token | Value |
| --- | --- |
| Display case | none |
| Display tracking | -.01em |
| Display leading | .9 |
| Body size / leading | 18px / 1.55 |
| Label tracking | .16em |
| Features | "kern" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 300ms · cubic-bezier(.2,.8,.2,1) |
| Distance / stagger | 16px / 45ms |
| Page transition | 500ms · scatter |
| Ambient | none · 0s |
| Hover | lift |
| Note | Shapes land with a hard stop; one shuffle per visit is enough. |

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `cobalt` | Cobalt | sala | `accent3` | Blue keyline, pink squiggle, bone ground. |
| `pink` | Pink | gabinete | `accent` | Pink field, mint object, cobalt detail. |
| `mint` | Mint | cartel | `accent2` | Mint ground, butter shape, black keyline. |

## Signature moves

- Squiggles and terrazzo
- Hard 6px black offset shadows
- Rotated cards with a 3px keyline
- Cobalt, pink, mint and butter


---

# Vaporwave / Y2K — A window into a future that already expired

Violet dusk, chrome type and a perspective grid. A desktop from 1999, half-remembered, with a cursor that still works.

**Use it for:** internet history, media studies, music, digital culture, nostalgia.
**Avoid it for:** serious policy, health, legal.

## Hard tokens

| Token | Value |
| --- | --- |
| Display font | `Press Start 2P` |
| Body font | `Space Grotesk` |
| Mono/label font | `Space Grotesk` |
| Border widths | 1, 2, 3 px |
| Border radius | 0–6 px |
| Motion window | 0.2–1.4 s |
| Shadow rule | Chrome bevels and 2px hard inset edges; no soft ambient shadow. |

## Palette (exact)

| Role | Hex |
| --- | --- |
| bg | `#1B1035` |
| surface | `#2B3A8F` |
| ink | `#FFFFFF` |
| muted | `#B9A7FF` |
| accent | `#FF4FA3` |
| accent2 | `#4FE3E3` |
| accent3 | `#C9D1D9` |
| accent4 | `#FFD6F2` |
| deep | `#2B3A8F` |

## Typography

- Display: Press Start 2P at 28–56px, uppercase, line-height 1.35. It is a pixel face: keep lines short.
- Body: Space Grotesk 400 at 16–18px. Labels: Space Grotesk 500 at 10px, uppercase, tracked .14em.
- Chrome is a gradient on the title only; body text stays white or lavender.

## Colour

- Violet #1B1035 is the desktop. Hot pink #FF4FA3, cyan #4FE3E3 and chrome #C9D1D9 are UI accents.
- Blue #2B3A8F is the window title bar. White #FFFFFF is body text.
- Gradients are allowed in the sky and chrome, never behind body copy.

## Layout

- A fake OS window with a title bar, three buttons and a status bar. The page is the desktop.
- Perspective grid on the lower third; sun on the horizon. Do not center the window exactly.
- Cards are file windows or tiles, not rounded SaaS cards.

## Motion

- The grid scrolls slowly; the sun’s stripes drift; the window can be dragged. Glitch is a 120ms RGB split on hover.
- No flashing above 3 Hz.

## Imagery

- Original CSS/SVG: chrome gradient, grid, sun, pixel cursor, window chrome, floppy disk.
- No lifted Windows screenshots.

## Copy voice

- Voice: a user manual for an obsolete interface: artifact, year, gesture. Nostalgia needs a specific object.
- Headline: 2–5 words, one chrome word at most. No generic "Y2K" mood.
- Body: what the interface promised, what it actually did, and who used it.

## Never

- No lorem ipsum.
- No emoji.
- No stock photography.
- No gradients that fake depth unless the style calls for them.
- No soft shadows.
- No modern SaaS cards.
- No illegible pixel body copy.
- No flashing.

## Type system

| Token | Value |
| --- | --- |
| Display case | uppercase |
| Display tracking | .08em |
| Display leading | .95 |
| Body size / leading | 18px / 1.7 |
| Label tracking | .18em |
| Features | "kern" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 350ms · cubic-bezier(.2,.8,.2,1) |
| Distance / stagger | 8px / 50ms |
| Page transition | 600ms · glitch |
| Ambient | grid · 16s |
| Hover | glow |
| Note | The desktop breathes; glitch is a short event, never a loop. |

## Subfamilies

| Slug | Name | Composition | Accent | What changes |
| --- | --- | --- | --- |
| `chrome` | Chrome | sala | `accent2` | Cyan chrome, violet desktop, magenta accent. |
| `hot-pink` | Hot pink | gabinete | `accent` | Pink window, cyan grid, chrome type. |
| `terminal` | Terminal | cartel | `accent3` | Chrome text on blue; the quiet server room. |

## Signature moves

- Draggable 1999 window
- Perspective grid and a striped sun
- Chrome gradient title
- Glitch on hover


---

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

- Voice: a planetarium note or a memory of a sound. Intimate, not cosmic gibberish; chrome one word at most.
- Headline: a human-scale image, 2–6 words. The universe is the room, not the subject.
- Body: one remembered detail, one measured fact. Leave space for the audio to speak.

## Never

- No lorem ipsum.
- No emoji.
- No stock photography.
- No gradients that fake depth unless the style calls for them.
- No rounded cards.
- No neon rainbow.
- No autoplay audio.
- No sci-fi logos or fake alien alphabets.

## Type system

| Token | Value |
| --- | --- |
| Display case | uppercase |
| Display tracking | .1em |
| Display leading | 1.02 |
| Body size / leading | 18px / 1.65 |
| Label tracking | .24em |
| Features | "kern" 1 |

## Motion system

| Token | Value |
| --- | --- |
| Enter | 800ms · cubic-bezier(.22,.61,.36,1) |
| Distance / stagger | 14px / 80ms |
| Page transition | 1100ms · orbit |
| Ambient | orbit · 48s |
| Hover | glow |
| Note | Orbits and starlight move; the reading layer stays anchored. |

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


---

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

