# Art direction: artdeco

## Intent
- Personality: A lacquered vertical lobby: geometry, symmetry and contained metallic accents.
- Suitable for: architecture, jazz and nightlife, timelines, luxury brands, city histories
- Limits: children, dense data, informal community pages

## Composition
- Grid: Symmetrical centred axis with nested frames (1px outer, 8px gap, 1px inner); vertical panels; stepped corners.
- Allowed asymmetry: Break symmetry once with an off-centre caption or epigraph; one stepped break.
- Scale: Display 88–148px against 16–18px body; ≥5x jump; tall hero.
- Empty space: Moderate: black ground dominates; gold is a line, not a fill.
- Alignment: Centred axis with vertical chevrons; mirrored steps.
- Density: Medium-low: one image, one fact, one date per block.

## Typography
- display: Poiret One 400 (bundled)
- reading: Josefin Sans 400 (bundled)
- label: Josefin Sans 600 (bundled)
- figure: Poiret One 400 (bundled)
- annotation: Josefin Sans 400 (bundled)
- Sizes by format: web=Display 88–148px uppercase tracked .06em, body 16–18px, labels 11px; slide=Display 96–140px, body 20–24px, labels 12–16px; gif=Display ≥40px at 640×360, body ≥18px, labels ≥12px
- Leading: Display .9, body 1.7, labels 1.2.
- Reading width: Body 55–62ch on web; 40–48ch on slides; 24–32ch on GIF.
- Display usage: Uppercase spaced caps; never bold Poiret One; one champagne italic word allowed.
- Explicit fallback: Approved glyph fallbacks: Archivo Black/EB Garamond/Space Mono (src/narrative/fonts.ts).

## Color
- Surfaces: #0E0E10, #17171B
- Text: #F4EBD9
- Accents: #C8A45C, #1F5C4A, #6E1F2B, #D9A6A0
- Semantic states: ok=#1F5C4A, warn=#C8A45C, problem=#6E1F2B, neutral=#B9C0C4
- Contrast notes: Black 75% of page; gold is 1px line/sun/numeral, never large fill; ivory text only.

## Materiality
- Borders: 1–2px gold hairlines; nested stepped frames; corners step, never round; no shadow.
- Shadows: No shadow; depth from gold hairlines and nested frames.
- Grain: None beyond flat lacquer.
- Cutouts: Stepped arches, chevrons, fans, skyscraper silhouettes.
- Depth: Flat lacquer; gold may glow only through opacity, not soft radial haze.
- Readability rule: Gold never large fill; body 16–18/1.7; no rainbow palette.

## Illustration
- Vocabulary: sunburst, stepped arch, chevrons, fans, skyscraper silhouette, gold lines
- Entities: Entities as geometric ornament and stepped frames; hard edges, no photos.
- Relations: Relation through symmetry and vertical rhythm; one asymmetry breaks the rule.
- Actions: Actions as dates, names and material gestures; no perfume-ad copy.

## Motion
- Entries: Curtain 900ms, 12px rise, stagger 90ms; sun rotates 24–38s.
- Transformations: Gold line draws once; hover lifts card 2px and brightens hairline.
- Continuity: Page 1.1s; slow sun; reduced motion freezes rays and completes filetes.
- Rest during reading: Nothing bounces; no spring; one mobile focus.

## Negative rules
- No rounded corners.
- No large gold fills.
- No rainbow palette.
- No centred-everything without one asymmetry.
- Avoid Gatsby wedding invitation look.

## Adaptation
- Web: Centred axis, nested stepped frames, sunburst hero, vertical panels; black dominant, gold as line. (example: examples/showcase/artdeco/index.html)
- Slides: Tall hero slides, nested frames, gold hairlines, stepped corners; one off-centre caption. (example: examples/agile/sprint-14-review.html)
- GIF: Slow sun rotation, gold line draw, curtain entrance; short transitions; reduced-motion stills. (example: examples/gifs/showcase-artdeco.gif)
