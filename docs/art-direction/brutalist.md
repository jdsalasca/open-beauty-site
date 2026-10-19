# Art direction: brutalist

## Intent
- Personality: A loud public poster: concrete, ink and acid, mechanical and urgent.
- Suitable for: studios, launches, music, events, manifestos, portfolios that need to shout
- Limits: luxury hospitality, wellness, children, dense dashboards, formal finance

## Composition
- Grid: Visible 12-column skeleton, sections sharing edges, full-bleed bands; 3px borders everywhere, 6px for page frame.
- Allowed asymmetry: Centred hero variant allowed; at least one marquee band and one oversized numeral; one acid block.
- Scale: Display 96–148px against 15–17px mono body: a ≥6x jump; headline is the layout.
- Empty space: Low: dense poster surface, but one acid block per view to focus.
- Alignment: Left-aligned or centred mass; hard edges; no soft centering.
- Density: High text density in mono metadata; mix oversized line with tiny mono, avoid mid-size.

## Typography
- display: Archivo Black 400 (bundled)
- reading: Space Mono 400 (bundled)
- label: Space Mono 700 (bundled)
- figure: Archivo Black 400 (bundled)
- annotation: Space Mono 400 (bundled)
- Sizes by format: web=Display 96–148px uppercase, body 15–17px, labels 10–13px; slide=Display 96–140px, body 20–24px, labels 12–16px; gif=Display ≥40px at 640×360, body ≥16px, labels ≥12px
- Leading: Display .82, body 1.5, labels 1.2.
- Reading width: Body 45–60ch on web; 36–44ch on slides; 24–32ch on GIF.
- Display usage: All caps, 2–6 words, letter-spacing -.03em; never letterspace more; never serif/sans display.
- Explicit fallback: Approved glyph fallbacks: Archivo Black/Space Mono for → (src/narrative/fonts.ts).

## Color
- Surfaces: #F2EFE4, #E6E2D3
- Text: #0B0B0B
- Accents: #D8FF00, #FF3D1F, #2438FF
- Semantic states: ok=#D8FF00, warn=#2438FF, problem=#FF3D1F, neutral=#F2EFE4
- Contrast notes: Paper + ink ~85%; acid is a background, text on acid is always ink; no translucency except 6% black grid.

## Materiality
- Borders: 3px solid black everywhere; 6px for page frame/hero divider; radius 0.
- Shadows: Hard offset only 8px 8px 0 #0B0B0B (zero blur); hover grows to 12px 12px.
- Grain: 6% black grid only; no photographic grain.
- Cutouts: None; blocks share edges; marquee bands.
- Depth: Flat; no gradients, no blur.
- Readability rule: Body 18/1.6 minimum; no monospaced tiny data floods; acid never as text on paper.

## Illustration
- Vocabulary: squares, grids, arrows, crosses, barcodes, halftones, acid block
- Entities: Entities as geometric blocks, stamps and numerals; black panel with acid type counts as image.
- Relations: Relation through grid alignment, arrows and coordinates.
- Actions: Actions as imperatives, numerals and stamps; no decorative iconography.

## Motion
- Entries: Fast .25–.5s, cubic-bezier(.2,.8,.2,1), 20px cut, stagger 60ms.
- Transformations: Marquee loops 18–24s linear; buttons shift -2px/-2px and grow shadow.
- Continuity: Page 250ms; hard stops; no fade-only entrances.
- Rest during reading: Marquee pauses on hover; reduced motion shows complete entrance; no bounce.

## Negative rules
- No rounded corners.
- No soft or blurred shadows.
- No serif or pastel.
- No more than one acid block and one red stamp per screen.
- Do not confuse brutalism with misalignment.

## Adaptation
- Web: Visible skeleton, full-bleed bands, marquee, oversized numeral, acid highlighter block; identity from hero to CTA. (example: examples/brutalist/index.html)
- Slides: Poster-like slides with 3px borders, hard shadows, marquee band, one acid block; large title and mono metadata. (example: examples/agents/round-2026/brutalist.html)
- GIF: Hard cuts, mechanical timing, marquee continuity; one acid event per scene; reduced-motion still frame. (example: examples/gifs/brutalist.gif)
