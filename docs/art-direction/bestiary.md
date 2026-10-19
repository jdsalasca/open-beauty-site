# Art direction: bestiary

## Intent
- Personality: A field-guide manuscript: parchment, iron-gall ink, illuminated initial, creature that watches back.
- Suitable for: biology and taxonomy, fable and literature, mythology, natural history, slow essays
- Limits: sports, SaaS, breaking news

## Composition
- Grid: Two columns with wide gutter and generous lower margin; illuminated initial breaks first column; marginalia outside.
- Allowed asymmetry: Marginalia rotated 90° only if short; one creature anchor.
- Scale: Display 54–94px against 18–21px body; drop cap 4 lines.
- Empty space: Generous lower margin; parchment breathes.
- Alignment: Manuscript columns; 1px ink rules; small corner fleurons.
- Density: Medium: observation before metaphor; one initial.

## Typography
- display: UnifrakturMaguntia 400 (bundled)
- reading: IM Fell English 400 (bundled)
- label: IM Fell English 400 (bundled)
- figure: UnifrakturMaguntia 400 (bundled)
- annotation: IM Fell English 400 (bundled)
- Sizes by format: web=Display 54–94px, body 18–21px, labels 12px; slide=Display 96–140px, body 20–24px, labels 12–16px; gif=Display ≥40px at 640×360, body ≥18px, labels ≥12px
- Leading: Display 1, body 1.7, labels 1.2; blackletter display only.
- Reading width: Body 55–62ch on web; 40–48ch on slides; 24–32ch on GIF.
- Display usage: Sentence case, never body copy; drop caps 4 lines in lapis/vermilion with gold rule.
- Explicit fallback: Approved glyph fallbacks: EB Garamond/Space Mono (src/narrative/fonts.ts).

## Color
- Surfaces: #E8D9B8, #F2E6C9
- Text: #2B2118
- Accents: #C9A227, #A63A2B, #2E4A7D, #4E7A63
- Semantic states: ok=#4E7A63, warn=#C9A227, problem=#A63A2B, neutral=#2E4A7D
- Contrast notes: Parchment page, iron-gall text; lapis ≤10%; gold flat leaf not gradient; no white/neon.

## Materiality
- Borders: 1–2px ink rules; corner fleurons; no thick borders; no shadow.
- Shadows: No shadow; manuscript flat.
- Grain: CSS grain, not photo; no photographic texture.
- Cutouts: Illuminated initial, creature silhouette, botanical border, gold sun.
- Depth: Flat manuscript.
- Readability rule: Blackletter display only; body 18–21/1.7; one initial, not whole paragraph.

## Illustration
- Vocabulary: hare-headed bird, two-tailed fox, botanical border, gold sun, marginalia, red rubric
- Entities: Entities as hand-drawn silhouettes with anatomy/habitat/behaviour; mark invented as hypothesis.
- Relations: Relation through marginal notes and two-column grid.
- Actions: Actions as observed traits; marginal translation, not replacement.

## Motion
- Entries: Illuminate 800ms, 12px rise, stagger 80ms.
- Transformations: Creature blinks every 7s; gold glints once on reveal; marginal note reveals translation on hover.
- Continuity: Page 1.0s; one blink/glint/translation.
- Rest during reading: Manuscript otherwise still; reduced motion freezes eye/glint.

## Negative rules
- No blackletter body copy.
- No glossy gradients.
- No modern sans-serif.
- No generic fantasy dragons.
- Do not call any dark dragon a bestiary.

## Adaptation
- Web: Two-column manuscript, illuminated initial, marginalia, creature anchor. (example: examples/showcase/bestiary/index.html)
- Slides: Manuscript slides with initial, marginalia, creature; two-column grid. (example: examples/agents/round-2026/bestiary.html)
- GIF: Blink every 7s, glint once; otherwise still. (example: examples/gifs/showcase-bestiary.gif)
