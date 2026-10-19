# Art direction: opart

## Intent
- Personality: Perception as argument: optical rhythm in delimited zones, stable reading.
- Suitable for: perception, geometry, physics, music posters, experimental education
- Limits: long reading, formal finance, accessibility-critical content without static fallback

## Composition
- Grid: Full-bleed pattern behind/beside type; alternating dense and empty bands; visible grid slightly wrong.
- Allowed asymmetry: One rotated element max; pattern a sangre with empty bands.
- Scale: Display 82–150px against 16–18px body; ≥5x jump.
- Empty space: Deliberate empty bands every second screen to rest the eye.
- Alignment: Hard geometric alignment; pattern and type collide intentionally.
- Density: Medium; pattern is the third voice; no more than two weights.

## Typography
- display: Archivo Black 400 (bundled)
- reading: Space Grotesk 400 (bundled)
- label: Space Grotesk 500 (bundled)
- figure: Archivo Black 400 (bundled)
- annotation: Space Grotesk 400 (bundled)
- Sizes by format: web=Display 82–150px uppercase, body 16–18px, labels 11px; slide=Display 96–140px, body 20–24px, labels 12–16px; gif=Display ≥40px at 640×360, body ≥18px, labels ≥12px
- Leading: Display .82, body 1.6, labels 1.2.
- Reading width: Body 50–60ch on web; 38–46ch on slides; 24–32ch on GIF.
- Display usage: Uppercase, one displaced glyph, not whole title; pattern never behind paragraphs.
- Explicit fallback: Approved glyph fallbacks: Archivo Black/EB Garamond/Space Mono (src/narrative/fonts.ts).

## Color
- Surfaces: #0A0A0A, #F7F7F2
- Text: #F7F7F2
- Accents: #E03C31, #1F4FD8, #E8FF3A
- Semantic states: ok=#E8FF3A, warn=#1F4FD8, problem=#E03C31, neutral=#9A9A9A
- Contrast notes: Black/bone pattern; red warning; blue/acid one band each; never together in gradient; static fallback.

## Materiality
- Borders: 1–3px solid; no radius; no shadow; contrast and repetition create depth.
- Shadows: No shadow.
- Grain: None; optical pattern instead.
- Cutouts: Concentric rings, warped grids, checkerboards, interference lines.
- Depth: Flat; moiré follows pointer at 0.04 damping and can freeze.
- Readability rule: Pattern only in delimited zones; never stripes behind text; max 3 Hz; reading stable.

## Illustration
- Vocabulary: concentric rings, warped grids, checkerboards, interference lines, rotated elements
- Entities: Entities as geometric pattern modules; one rotated element enough.
- Relations: Relation through interference and alignment; causal state must be explicit.
- Actions: Actions as state changes in pattern; reading layer stays still.

## Motion
- Entries: Hard cut 200ms, 0px distance, stagger 30ms.
- Transformations: Moiré follows pointer; toggle freezes; reduced motion static pattern.
- Continuity: Page 200ms; hard cuts; no strobe.
- Rest during reading: Pattern freezes during reading; one static state; no autonomous moiré.

## Negative rules
- No stripes behind text.
- No continuous optical movement during reading.
- No effects that hide what changed.
- No strobing above 3 Hz.
- No pattern without a pause.

## Adaptation
- Web: Pattern in delimited zones, alternating dense/empty bands, hard cuts; static fallback. (example: examples/showcase/opart/index.html)
- Slides: Hard-cut slides, pattern only in zones, stable reading, one rotated element max. (example: examples/agents/round-2026/opart.html)
- GIF: Hard cuts, static frames, pointer-independent stills; no strobing. (example: examples/gifs/showcase-opart.gif)
