# Art direction: isotype

## Intent
- Personality: Data as public language: cream paper, black rules, red pictograms that count.
- Suitable for: data and economics, civic history, mathematics, public health, explanatory journalism
- Limits: luxury, romance, atmospheric fiction

## Composition
- Grid: Visible 12-column grid with 1px rules; pictogram rows as paragraphs; tables allowed.
- Allowed asymmetry: Asymmetry from data, not arbitrary offsets; one red quantity.
- Scale: Display 72–128px against 16–18px body; numbers as display anchors.
- Empty space: Moderate: paper margins; grid visible.
- Alignment: Grid-aligned; pictogram rows repeat one silhouette.
- Density: Medium-high data density, but each number has unit and source.

## Typography
- display: Jost 500 (bundled)
- reading: IBM Plex Sans 400 (bundled)
- label: IBM Plex Sans 500 (bundled)
- figure: Jost 500 (bundled)
- annotation: IBM Plex Sans 400 (bundled)
- Sizes by format: web=Display 72–128px, body 16–18px, labels 11px; slide=Display 96–140px, body 20–24px, labels 12–16px; gif=Display ≥40px at 640×360, body ≥18px, labels ≥12px
- Leading: Display .95, body 1.65, labels 1.2.
- Reading width: Body 55–62ch on web; 40–48ch on slides; 24–32ch on GIF.
- Display usage: Tabular numerals as visual anchor; Jost drawn not branded; never rounded icon packs.
- Explicit fallback: Approved glyph fallbacks: Archivo Black/EB Garamond/Space Mono (src/narrative/fonts.ts).

## Color
- Surfaces: #F2EBDD, #E7DFC9
- Text: #1C1C1C
- Accents: #B53328, #2A7F7A, #D9A441, #8C8C8C
- Semantic states: ok=#2A7F7A, warn=#D9A441, problem=#B53328, neutral=#8C8C8C
- Contrast notes: Cream paper, black ink; red marks one quantity never decoration; no gradients/shadows.

## Materiality
- Borders: 1–3px solid rules; grid visible; no shadow.
- Shadows: No shadow; grid and pictograms do the work.
- Grain: Paper print feel via rules, not texture.
- Cutouts: Hand-cut silhouettes, one pictogram family per row.
- Depth: Flat printed page.
- Readability rule: One pictogram = one unit; never invent quantities; state unit, denominator, source.

## Illustration
- Vocabulary: person, house, tree, factory, book, water drop, flat silhouettes
- Entities: Entities as consistent silhouettes on the grid; no isometric 3D or rounded icon packs.
- Relations: Relation through counting rows and grids; one silhouette per concept.
- Actions: Actions as counts and comparisons; numbers tick once on reveal.

## Motion
- Entries: Count 350ms, 10px rise, stagger 50ms; bars grow 400ms from zero.
- Transformations: Counters tick once; no looping animation.
- Continuity: Page 500ms; information arrives once and stays.
- Rest during reading: Cifras finales without counting; reduced motion shows final number.

## Negative rules
- No rounded cards.
- No drop shadows.
- No more than two pictogram families.
- No fake statistics.
- Do not turn every number into a card.

## Adaptation
- Web: Visible grid, pictogram rows, tables, one red quantity; data-driven asymmetry. (example: examples/showcase/isotype/index.html)
- Slides: Counting slides with visible grid, pictogram rows, tables; one red number anchor. (example: examples/agile/sprint-15-planning.html)
- GIF: Counters tick once, bars grow; no looping; reduced motion final numbers. (example: examples/gifs/showcase-isotype.gif)
