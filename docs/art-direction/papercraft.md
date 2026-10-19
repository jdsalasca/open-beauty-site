# Art direction: papercraft

## Intent
- Personality: Warm cut paper on a table: handmade but art-directed, with coherent layers and shadows.
- Suitable for: crafts, food, education, community, personal projects, children, stationery
- Limits: fintech, enterprise SaaS, brutalist music, anything that needs to feel sharp

## Composition
- Grid: Layered and off-grid but balanced: cards rotated -2° to 2°, overlapping 16–28px; one focal paper object per screen.
- Allowed asymmetry: Off-grid collage by seed; second sheet 10px right/8px down; full-bleed band crossing right margin.
- Scale: Display 64–124px against 18–19px body; cut-paper geometry 30/12/28/14px with ≥18px delta and 26px notch.
- Empty space: Moderate warm table margins; one focal object; everything else supports it.
- Alignment: Balanced asymmetry; visible tape; scalloped/torn dividers.
- Density: Medium: concrete nouns, short sentences; no corporate abstractions.

## Typography
- display: Fraunces 560 (bundled)
- reading: Nunito Sans 400 (bundled)
- label: Nunito Sans 800 (bundled)
- figure: Fraunces 560 (bundled)
- annotation: Space Mono 400 (bundled)
- Sizes by format: web=Display 64–124px, body 18–19px, labels 10–12px; slide=Display 96–140px, body 20–24px, labels 12–16px; gif=Display ≥44px at 640×360, body ≥18px, labels ≥12px
- Leading: Display .96, body 1.62, labels 1.2; no italics.
- Reading width: Body 55–62ch on web; 40–48ch on slides; 24–32ch on GIF.
- Display usage: Sentence case, 3–6 words; one word may shift colour and rotate -1.2°; no rounded sans display.
- Explicit fallback: Approved glyph fallbacks: Fraunces/Nunito Sans roles use EB Garamond and Space Mono fallbacks (src/narrative/fonts.ts).

## Color
- Surfaces: #FBF1E2, #FFF8EA
- Text: #4A3A32
- Accents: #CE7256, #A9C3A0, #B8D4E0, #F2C879
- Semantic states: ok=#A9C3A0, warn=#F2C879, problem=#CE7256, neutral=#B8D4E0
- Contrast notes: Cream table #FBF1E2 vs paper sheet #FFF8EA; warm brown shadows rgba(74,58,50,.16–.20); butter is tape only.

## Materiality
- Borders: 1–2px warm edges; cut-paper radii 30/12/28/14px; no dashed stitching; no 3px black borders.
- Shadows: Soft warm 0 22px 40px rgba(74,58,50,.20) plus 0 2px 0 edge; no hard offset.
- Grain: Paper texture through layered sheets, not global noise.
- Cutouts: Cut geometry, 26px corner notch, washi tape with torn ends and 6–8° tilt; max five tape pieces.
- Depth: Layered paper sheets with 1px edge and 2/14/30 blur hierarchy.
- Readability rule: Irregularity lives in paper, not paragraphs; body 18/1.62; no rounded sans display.

## Illustration
- Vocabulary: soft serif-like flowers, leaves, suns, waves, butterflies, confetti, paper cutouts
- Entities: Entities as hard-cut paper silhouettes with soft edges; no line art, no dashed stitching.
- Relations: Relation through overlap, tape and rotation; collage must stay readable.
- Actions: Actions as folded/cut paper pieces, not as generic stickers; one focal object per screen.

## Motion
- Entries: Physical 480ms cubic-bezier(.22,.9,.24,1), translateY(-22px) rotate(-2.5deg) → zero; shadow settles 180ms later; tape follows 60ms.
- Transformations: Float by rotating ±.6° over 8s, delays 0/.9/1.7s; hover lifts 3px, no scale/spring.
- Continuity: Stagger 90ms; page 800ms; respect reduced motion (pieces already placed).
- Rest during reading: No spring bounce; ambient rotation tiny; reading layer stays still.

## Negative rules
- No 0px corners or perfect rounded rectangles; corner delta must be visible.
- No dashed stitching, no 3px black borders, no acid colours, no monospace body.
- No rounded sans display (Fredoka) or serif-with-hairlines (DM Serif).
- No cinta and flowers repeated without relation to the theme.
- No tiny labels that affect reading.

## Adaptation
- Web: Layered cut-paper collage, irregular radii, washi tape, scalloped dividers; hero collage can be fixed template or content-driven. (example: examples/papercraft/index.html)
- Slides: Paper-sheet slides with cut geometry, tape, layered shadows; one focal paper object per slide; no card grids. (example: examples/decks/kittens.html)
- GIF: Paper settles: 480ms ease, shadow settles later, tape follows; small ±.6° float; 2s/5s presets. (example: examples/gifs/papercraft.gif)

## Papercraft profiles
### editorial: Editorial
- Available: true
- Description: Current profile: Fraunces Soft display + Nunito Sans reading/labels, cut paper and warm shadows.
- display: Fraunces 560 (available=true)
- reading: Nunito Sans 400 (available=true)
- label: Nunito Sans 800 (available=true)
- annotation: Space Mono 400 (available=true)
- Note: Matches the current papercraft preset and pilot packs.
- Source: fonts/Fraunces-Soft.ttf, fonts/NunitoSans-*.ttf
- License: OFL-1.1 (bundled)
### friendly: Friendly
- Available: false
- Description: Rounded/friendly profile inspired by the reference: Fredoka, Nunito and Caveat with distinct roles; Caveat only for short annotations, never paragraphs.
- display: Fredoka 600 (available=false)
- reading: Nunito 400 (available=false)
- label: Nunito 700 (available=false)
- annotation: Caveat 400 (available=false)
- Note: Spec only. Fredoka, Nunito and Caveat are not in fonts/ or src/narrative/fonts.ts; do not fake availability. Requires bundling + licence review before use.
- Source: fonts/ (checked: no Fredoka/Nunito/Caveat files)
- License: not bundled (no OFL file present)
