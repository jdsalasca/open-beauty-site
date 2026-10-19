# Art direction: galactic

## Intent
- Personality: An intimate planetarium: deep space, slow orbits, chrome ivory, one planet.
- Suitable for: music rooms, space and astronomy, memory and technology, film essays, album tributes
- Limits: fast commerce, children’s worksheets, cluttered dashboards

## Composition
- Grid: Asymmetric: copy one side, planet bleeding off the other; one planet, three orbits; generous negative space.
- Allowed asymmetry: Copy vs. planet sides; orbital ellipses; one chrome word.
- Scale: Display 42–92px (wide face) against 16–18px body; ≥3x jump; headlines short.
- Empty space: Generous: negative space is the luxury; void black 70%.
- Alignment: Orbital lines, 1px cyan rules, technical labels.
- Density: Low-medium: one remembered detail, one measured fact; room for audio.

## Typography
- display: Michroma 400 (bundled)
- reading: Space Grotesk 400 (bundled)
- label: Space Grotesk 500 (bundled)
- figure: Michroma 400 (bundled)
- annotation: Space Grotesk 400 (bundled)
- Sizes by format: web=Display 42–92px uppercase tracked .1em, body 16–18px, labels 10px; slide=Display 64–104px, body 20–24px, labels 12–16px; gif=Display ≥36px at 640×360, body ≥18px, labels ≥12px
- Leading: Display 1.08, body 1.7, labels 1.2.
- Reading width: Body 50–60ch on web; 38–46ch on slides; 24–32ch on GIF.
- Display usage: Wide face, short headlines; one chrome-gradient word max; never chrome whole headline.
- Explicit fallback: Approved glyph fallbacks: Space Mono/EB Garamond (src/narrative/fonts.ts).

## Color
- Surfaces: #05060A, #0D1020
- Text: #F2F4FF
- Accents: #79E8FF, #B388FF, #F5C86B, #FF6FAE
- Semantic states: ok=#79E8FF, warn=#F5C86B, problem=#FF6FAE, neutral=#9BA6C4
- Contrast notes: Void 70%; chrome ivory text; cyan line/rim not fill; no rainbow nebula; space mostly black.

## Materiality
- Borders: 1–2px cyan rules; instrument panels; no box shadow.
- Shadows: No box shadow; depth from starfield, orbital lines, black space.
- Grain: Single grain layer keeps black from feeling flat.
- Cutouts: ringed planet, orbital ellipses, small moon, starfield
- Depth: Orbits 40–80s; planet breathes 4px; stars twinkle 6s; no warp speed.
- Readability rule: Audio user-initiated; no autoplay; text layer anchored during ambient motion.

## Illustration
- Vocabulary: ringed planet, orbital ellipses, small moon, starfield, 1px cyan rules
- Entities: Entities as orbital diagrams; no NASA photos, ships, lens flares.
- Relations: Relation through orbits and distance.
- Actions: Actions as remembered detail + measured fact; leave space for audio.

## Motion
- Entries: Orbit 800ms, 14px rise, stagger 80ms.
- Transformations: Orbits 40–80s; planet breathes 4px; stars twinkle 6s; reduced motion static sky.
- Continuity: Page 1.1s; reading layer anchored.
- Rest during reading: Ambient slow; no warp speed; audio explicit.

## Negative rules
- No rounded cards.
- No neon rainbow.
- No autoplay audio.
- No sci-fi logos or fake alien alphabets.
- Do not pile nebula/stars/chrome.

## Adaptation
- Web: Copy one side, planet bleeding other, three orbits, generous negative space. (example: examples/showcase/galactic/index.html)
- Slides: Planetarium slides with orbital diagrams, 1px rules, audio explicit. (example: examples/decks/atlas-memoria.html)
- GIF: Slow orbit 48–62s, planet breathes 4px, static reading layer. (example: examples/gifs/showcase-galactic.gif)
