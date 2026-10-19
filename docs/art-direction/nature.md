# Art direction: nature

## Intent
- Personality: A herbarium archive: pressed specimens, field notes, growth rings, patient and exact.
- Suitable for: botanical gardens, museums and archives, slow editorial, nature education, memory projects, seed libraries
- Limits: nightlife, fast commerce, dense dashboards, ironic youth brands

## Composition
- Grid: Asymmetric field sheet: copy one side, specimen plate other; plate can bleed; sections are drawers not cards.
- Allowed asymmetry: Plate bleeds one edge; vertical herbarium label; seasonal bands.
- Scale: Display 64–132px against 18–20px body; ≥4x jump.
- Empty space: Moderate: paper margins; specimen plate large.
- Alignment: Field sheet with visible label: date, place, collector, source.
- Density: Medium-low: observation before metaphor; no five tiny cards on mobile.

## Typography
- display: Cormorant Garamond 400 (bundled)
- reading: Karla 400 (bundled)
- label: Karla 600 (bundled)
- figure: Cormorant Garamond 400 (bundled)
- annotation: Karla 400 (bundled)
- Sizes by format: web=Display 64–132px, body 18–20px, labels 10–11px; slide=Display 96–140px, body 20–24px, labels 12–16px; gif=Display ≥40px at 640×360, body ≥18px, labels ≥12px
- Leading: Display 1.02, body 1.68, labels 1.2.
- Reading width: Body max 62ch on web; 40–48ch on slides; 24–32ch on GIF.
- Display usage: Sentence case; italic for field name/single turn, not paragraphs; old-style numerals for dates.
- Explicit fallback: Approved glyph fallbacks: EB Garamond/Space Mono (src/narrative/fonts.ts); Nature guide names IBM Plex Mono labels but packaging uses Karla 600/400.

## Color
- Surfaces: #EFE9D8, #DCE4D2
- Text: #243026
- Accents: #606E3E, #B55239, #4B6B62, #D8B56A
- Semantic states: ok=#606E3E, warn=#D8B56A, problem=#B55239, neutral=#4B6B62
- Contrast notes: Parchment page, lichen field; moss lead; clay one warm event; no gradients faking light; soft botanical shadow.

## Materiality
- Borders: 1–2px; sections drawers; no hard offset; radius 0–22px.
- Shadows: Soft botanical 0 18px 40px rgba(36,48,38,.14); never hard offset.
- Grain: Paper texture from grain and thin rules, not global noise.
- Cutouts: stems, leaves, seed heads, roots, growth rings, single insect
- Depth: Slow botanical 900ms fade + 14px rise; leaf drift 16s; rings draw once.
- Readability rule: Body 18–20/1.68; no cottagecore clichés; invented specimens marked.

## Illustration
- Vocabulary: stems, leaves, seed heads, roots, growth rings, single insect, field label
- Entities: Entities as original botanical SVG with name, place, date or marked unknown.
- Relations: Relation through field sheet and drawer sections.
- Actions: Actions as observation before metaphor; no fake Latin.

## Motion
- Entries: Rise 900ms, 14px, stagger 80ms.
- Transformations: Leaf drift 16s; growth rings draw once; hover underline/2px shift.
- Continuity: Page 1.1s; rings grow once; nothing loops faster than a season.
- Rest during reading: Reduced motion shows final state and stops drift; no scaling.

## Negative rules
- No cottagecore clichés or fake Latin.
- No hard offset shadows or neon.
- No stock forest/hand photos.
- No presenting invented specimen as fact.
- No five tiny cards on mobile.

## Adaptation
- Web: Field sheet, specimen plate bleeding, drawer sections, vertical herbarium label. (example: examples/showcase/nature/index.html)
- Slides: Botanical slides with specimen plate, field label, drawer sections. (example: examples/decks/tea.html)
- GIF: Leaf drift 16s, rings draw once, slow botanical timing. (example: examples/gifs/showcase-nature.gif)
