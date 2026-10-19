# Art direction: renaissance

## Intent
- Personality: A chalky fresco: plaster, pigment and ink, asymmetric and slow, with one cinnabar event.
- Suitable for: portfolios, cultural institutions, editorial essays, weddings, long-form launches
- Limits: dashboards, dense product UI, playful youth brands, anything that needs to feel fast

## Composition
- Grid: Asymmetric two-column hero: copy left, 48vw arch plate right; 12-column underlying grid with 18px/24px double hairline frame.
- Allowed asymmetry: Copy vs. image sides may swap by seed; one off-centre cinnabar event; roman-numeral section offsets.
- Scale: Display clamp(64px,10.5vw,152px) against 20px body: a ≥7x jump; arch plate min(660px,48vw).
- Empty space: Generous plaster margins; white space finishes sentences; ~55% plaster ground.
- Alignment: Left-aligned copy, right plate; hairlines frame the viewport; no centred-everything.
- Density: Low-to-medium: one idea per paragraph, 2–3 sentences; avoid card grids.

## Typography
- display: EB Garamond 600 (bundled)
- reading: EB Garamond 400 (bundled)
- label: EB Garamond 600 (bundled)
- figure: EB Garamond 600 (bundled)
- annotation: EB Garamond 400 (bundled)
- Sizes by format: web=Display clamp(64px,10.5vw,152px), body 20–21px, labels 12–13px; slide=Display 96–140px, body 20–24px, labels 12–16px; gif=Display ≥44px at 640×360, body ≥18px, labels ≥12px
- Leading: Display .87, body 1.62, labels 1.2; italic emphasis only.
- Reading width: Body max 62ch on web, 40–48ch on slides, 24–32ch on GIF.
- Display usage: Sentence case, 2–5 words, one italic cinnabar phrase max; never all caps; never sans-serif.
- Explicit fallback: Approved glyph fallbacks: EB Garamond/Archivo Black/Space Mono for → and missing outlines (src/narrative/fonts.ts).

## Color
- Surfaces: #F6EDDD, #E3E9E6
- Text: #2B211B
- Accents: #B08A4F, #B4432C, #AFC5D6, #B9C4A6
- Semantic states: ok=#B9C4A6, warn=#B08A4F, problem=#B4432C, neutral=#AFC5D6
- Contrast notes: Chalky sun-faded pigment on plaster; hairlines rgba(43,33,27,.28); cinnabar ≤2% of surface; verify text on pastel fields.

## Materiality
- Borders: 1px hairlines only; double frame 18px/24px from edge; no radius above 2px.
- Shadows: None or one long soft ambient shadow 0 24px 60px rgba(43,33,27,.08); never hard offset.
- Grain: Almost invisible grain; no photographic texture.
- Cutouts: Arch plate as image container; flat fresco fields with hard plaster edges.
- Depth: Flat planes of pigment; no radial gradients fading to transparent.
- Readability rule: Pastel must arrive as flat fields; text weight #2B211B keeps pastel from becoming papilla.

## Illustration
- Vocabulary: hills, cypress, sun, arches, laurel, fresco fields, single-weight ink linework
- Entities: Entities as flat fresco shapes inside the arch plate, desaturated to sepia if photographic.
- Relations: Spatial relation through overlapping flat planes and arch framing; no arrows unless diagrammatic.
- Actions: Actions implied by placement and pigment change, not by icons or motion trails.

## Motion
- Entries: Slow 0.7–1.2s fade + 16px rise, cubic-bezier(.22,.61,.36,1).
- Transformations: Ornaments draw once via stroke-dashoffset over 1.4s; rays stagger 40ms.
- Continuity: Page transitions 1.2s; progress bar 2px; reveal script respects reduced motion.
- Rest during reading: No loops except almost invisible grain; hover is colour shift or growing underline, no scaling.

## Negative rules
- No border-radius above 2px.
- No hard offset shadows.
- No sans-serif headlines.
- No soft gradient washes; pastel must be a flat field.
- No more than one italic phrase per screen.

## Adaptation
- Web: Asymmetric hero with copy left and arch plate right, flat fresco fields, double hairline frame, section numerals in ochre small caps; identity survives from hero to CTA. (example: examples/renaissance/index.html)
- Slides: 1600×900 deck with 80px margins, one idea per slide, title 96–140px, figure or number every second slide; fresco fields as slide grounds. (example: examples/agents/round-2026/renaissance.html)
- GIF: Three-scene Problema→Solución→Highlight with one fresco event per scene; 2s/5s presets; pause and short transitions; PNGs and manifest. (example: examples/gifs/renaissance.gif)
