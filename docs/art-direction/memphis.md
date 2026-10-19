# Art direction: memphis

## Intent
- Personality: Postmodern play with a straight face: squiggles, terrazzo, cobalt/pink, black keyline.
- Suitable for: design history, music, workshops, creative education, events
- Limits: hospitals, luxury, solemn memorials

## Composition
- Grid: Asymmetrical, rotated 1–4°, overlapping; 3px black keyline keeps chaos legible; cards different widths.
- Allowed asymmetry: Rotated cards, overlapping shapes, one giant squiggle and one terrazzo field.
- Scale: Display 72–128px against 16–18px body; ≥4x jump.
- Empty space: Moderate: bone table with scattered shapes.
- Alignment: Grid is a suggestion; do not align everything.
- Density: Medium: one dry observation under playful title.

## Typography
- display: Bricolage Grotesque 700 (bundled)
- reading: DM Sans 400 (bundled)
- label: DM Sans 500 (bundled)
- figure: Bricolage Grotesque 700 (bundled)
- annotation: DM Sans 400 (bundled)
- Sizes by format: web=Display 72–128px, body 16–18px, labels 11px; slide=Display 96–140px, body 20–24px, labels 12–16px; gif=Display ≥40px at 640×360, body ≥18px, labels ≥12px
- Leading: Display .92, body 1.6, labels 1.2.
- Reading width: Body 50–60ch on web; 38–46ch on slides; 24–32ch on GIF.
- Display usage: One word on pink highlight; do not rainbow headline; tracking open on display.
- Explicit fallback: Approved glyph fallbacks: Archivo Black/EB Garamond/Space Mono (src/narrative/fonts.ts).

## Color
- Surfaces: #F5F0E6, #FFFFFF
- Text: #111111
- Accents: #F2A6B3, #9FD8C8, #2E4FD8, #F4D35E
- Semantic states: ok=#9FD8C8, warn=#F4D35E, problem=#F2A6B3, neutral=#B9A7E0
- Contrast notes: Bone table; black keyline; flat shapes; no gradients/soft shadows; max five accents.

## Materiality
- Borders: 1–3px solid black keylines; radius 0–48px.
- Shadows: Hard black offset 6px 6px 0 (hover 8px); no soft blur.
- Grain: Terrazzo chips, not photo grain.
- Cutouts: Squiggles, terrazzo, checkerboard, wavy vase, star.
- Depth: Scatter with 300ms transform; squiggles draw 700ms.
- Readability rule: Keyline keeps chaos legible; body 16–18/1.6; no soft shadows.

## Illustration
- Vocabulary: squiggles, terrazzo chips, checkerboard, wavy vase, star, rotated cards
- Entities: Entities as postmodern shapes; no Memphis Group scans; draw vocabulary.
- Relations: Relation through rotation/overlap; keyline holds hierarchy.
- Actions: Actions as dry precise observation under playful title; one shuffle per visit.

## Motion
- Entries: Scatter 300ms, 16px, stagger 45ms.
- Transformations: Shuffle rescatters shapes; squiggles draw 700ms; hover lifts 4px and shadow 8px.
- Continuity: Page 500ms; shapes land hard stop.
- Rest during reading: Reduced motion places pieces; ambient only Revolver button.

## Negative rules
- No soft shadows.
- No rounded sans-only look without keyline.
- No more than five accents.
- No aligning everything.
- Do not use squiggles as confetti.

## Adaptation
- Web: Rotated cards, terrazzo field, giant squiggle, hard shadows, keylines. (example: examples/showcase/memphis/index.html)
- Slides: Memphis slides with rotated cards, terrazzo, hard shadows, keylines. (example: examples/agile/sprint-14-retro.html)
- GIF: Shuffle 300ms, hard stops, squiggle draw; reduced motion placed. (example: examples/gifs/showcase-memphis.gif)
