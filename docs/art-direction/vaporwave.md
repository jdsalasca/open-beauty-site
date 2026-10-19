# Art direction: vaporwave

## Intent
- Personality: A remembered desktop from 1999: violet dusk, chrome type, perspective grid.
- Suitable for: internet history, media studies, music, digital culture, nostalgia
- Limits: serious policy, health, legal

## Composition
- Grid: Fake OS window with title bar, three buttons, status bar; page is desktop; perspective grid lower third; sun on horizon.
- Allowed asymmetry: Window not exactly centred; grid and sun in lower third.
- Scale: Display 28–56px (pixel face) against 16–18px body; ≥2x jump but pixel face short lines.
- Empty space: Violet desktop margins; grid to horizon.
- Alignment: Windowed UI; cards are file windows/tiles.
- Density: Medium: body clean, pixel display reserved for small uses.

## Typography
- display: Press Start 2P 400 (bundled)
- reading: Space Grotesk 400 (bundled)
- label: Space Grotesk 500 (bundled)
- figure: Press Start 2P 400 (bundled)
- annotation: Space Grotesk 400 (bundled)
- Sizes by format: web=Display 28–56px uppercase, body 16–18px, labels 10px; slide=Display 40–72px, body 20–24px, labels 12–16px; gif=Display ≥24px at 640×360, body ≥18px, labels ≥12px
- Leading: Display 1.35, body 1.65–1.7, labels 1.2.
- Reading width: Body 50–60ch on web; 38–46ch on slides; 24–32ch on GIF.
- Display usage: Pixel face only small display lines; never pixel paragraphs; chrome gradient on title only.
- Explicit fallback: Approved glyph fallbacks: Space Mono/EB Garamond (src/narrative/fonts.ts).

## Color
- Surfaces: #1B1035, #2B3A8F
- Text: #FFFFFF
- Accents: #FF4FA3, #4FE3E3, #C9D1D9, #FFD6F2
- Semantic states: ok=#4FE3E3, warn=#FFD6F2, problem=#FF4FA3, neutral=#C9D1D9
- Contrast notes: Violet desktop; blue title bar; gradients only in sky/chrome; body text white/lavender; no glow excess.

## Materiality
- Borders: 1–3px; chrome bevels; 2px hard inset edges; no soft ambient shadow.
- Shadows: Chrome bevels and inset edges; no soft shadow.
- Grain: Pixel grid; no photo grain.
- Cutouts: chrome gradient, perspective grid, striped sun, window chrome, pixel cursor, floppy disk
- Depth: Grid scrolls slowly; sun stripes drift; window draggable; glitch 120ms RGB split on hover.
- Readability rule: Pixel reserved for display; body clean; no paragraphs pixelated; no flashing above 3 Hz.

## Illustration
- Vocabulary: chrome gradient, perspective grid, striped sun, window chrome, pixel cursor, floppy disk
- Entities: Entities as UI windows/tiles; no lifted OS screenshots.
- Relations: Relation through windowed interface and grid.
- Actions: Actions as artefact, year, gesture of use; nostalgia tactile not neon.

## Motion
- Entries: Glitch 350ms, 8px, stagger 50ms.
- Transformations: Grid scrolls; sun stripes drift; window draggable; glitch 120ms RGB split on hover.
- Continuity: Page 600ms; desktop breathes; glitch short event not loop.
- Rest during reading: Reduced motion: quiet window; grid/sun paused.

## Negative rules
- No full paragraphs pixelated.
- No excess glow.
- No interface that obscures the product.
- No fake OS without history.
- No flashing above 3 Hz.

## Adaptation
- Web: Fake OS window, title bar, perspective grid, striped sun, chrome title. (example: examples/showcase/vaporwave/index.html)
- Slides: Windowed slides, perspective grid, chrome title, clean body. (example: examples/agents/round-2026/vaporwave.html)
- GIF: Grid scroll, sun stripes drift, glitch 120ms; reduced motion still. (example: examples/gifs/showcase-vaporwave.gif)
