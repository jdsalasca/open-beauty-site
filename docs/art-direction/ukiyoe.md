# Art direction: ukiyoe

## Intent
- Personality: A printed landscape: flat colour planes, low horizon, Prussian blue and vermilion seal.
- Suitable for: oceanography, Japanese history, poetry, climate, art history
- Limits: fast product launches, dense dashboards, ironic memes

## Composition
- Grid: Low horizon, large negative sky; title in vertical cartouche on one side, body opposite; flat overlapping bands.
- Allowed asymmetry: Cartouche left or right; body opposite; one vermilion seal.
- Scale: Display 62–112px against 16–18px body; ≥4x jump.
- Empty space: Large sky negative space; print-cropped feel.
- Alignment: Flat planes overlap like printed layers; vertical rhythm.
- Density: Medium-low: one observed detail and consequence.

## Typography
- display: Shippori Mincho B1 700 (bundled)
- reading: Zen Kaku Gothic New 400 (bundled)
- label: Zen Kaku Gothic New 500 (bundled)
- figure: Shippori Mincho B1 700 (bundled)
- annotation: Zen Kaku Gothic New 400 (bundled)
- Sizes by format: web=Display 62–112px, body 16–18px, labels 11px; slide=Display 96–140px, body 20–24px, labels 12–16px; gif=Display ≥40px at 640×360, body ≥18px, labels ≥12px
- Leading: Display 1.02, body 1.75, labels 1.2.
- Reading width: Body 55–62ch on web; 40–48ch on slides; 24–32ch on GIF.
- Display usage: Vertical cartouche allowed; palt only in Japanese; Latin subset only, no CJK rendering.
- Explicit fallback: Approved glyph fallbacks: EB Garamond/Space Mono (src/narrative/fonts.ts); Latin subsets only.

## Color
- Surfaces: #F3E9D2, #DCE6E3
- Text: #22201D
- Accents: #1B3A5C, #BC3C27, #5B7C99, #6E7F5C
- Semantic states: ok=#6E7F5C, warn=#5B7C99, problem=#BC3C27, neutral=#DCE6E3
- Contrast notes: Washi 55%; Prussian sea/type; vermilion seal and one accent; no gold/neon/pure white; flat planes.

## Materiality
- Borders: 1–2px; no shadow; paper and ink flat.
- Shadows: No shadow.
- Grain: Washi grain and misregistration welcome.
- Cutouts: Wave planes, foam claws, distant mountain, boat, crane.
- Depth: Flat printed layers; no 3D or drop shadows.
- Readability rule: Body 16–18/1.75; cartela vertical breve; no faux-Japanese lettering.

## Illustration
- Vocabulary: waves, foam, distant mountain, boat, crane, vermilion seal, flat planes
- Entities: Entities as flat colour planes; no outlines-only clip art; no cherry blossom.
- Relations: Relation through overlapping printed layers and horizon.
- Actions: Actions as named coast, season, date; no exotization.

## Motion
- Entries: Rise 1.0s, 14px, stagger 90ms.
- Transformations: Waves drift 8–16px on scroll; foam appears once; seal breathes opacity 0.9→1 over 6s.
- Continuity: Page 1.2s; waves drift, paper stays still.
- Rest during reading: Reduced motion: flat waves, no drift; nothing digital.

## Negative rules
- No cherry-blossom clip art.
- No faux-Japanese lettering.
- No rounded corners or 3D/drop shadows.
- No applying waves and sun identically to every story.
- Do not use Japan as decoration.

## Adaptation
- Web: Low horizon, large sky, vertical cartouche, flat wave planes, vermilion seal. (example: examples/showcase/ukiyoe/index.html)
- Slides: Printed-landscape slides, cartouche title, flat planes, low horizon. (example: examples/agents/round-2026/ukiyoe.html)
- GIF: Wave drift, foam once, seal breathes; paper stays still. (example: examples/gifs/showcase-ukiyoe.gif)
