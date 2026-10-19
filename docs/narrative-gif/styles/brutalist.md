# Brutalist / documentary narrative scene

## What it does

- Makes `documentary` an explicit subfamily while retaining the existing brutalist `poster` direction.
- Carries one large paper form/stub from an unreviewed record, through an observation stamp, to a review-ready checkbox.
- Uses Archivo Black for display and Space Mono for reading and labels; body text is antialiased and sized for presentation cards.
- `comparison` uses a form with a punched perforation, ledger fields, a reference/copy column and two changing checks; `checklist` uses three ruled review rows that advance with the state.
- Uses a registration strip with separate `OBSERVACIÓN` and final-status boxes, a strict ledger grid, hard black offset shadow, ink and one acid block. Rough red ink stays in these reserved boxes.
- The final mark follows the supplied status (`EN REVISIÓN`, `REVISADA` or `PENDIENTE`). No folio, date, metric or identifier is fabricated.
- Supports 16:9 and 1:1. The 9:16 portrait layout is explicitly unsupported until a stacked documentary form is designed. The composition contains no invented folio, date, measurement or metric.

## What it rejects

- A generic poster recolored as a form; poster remains a separately selectable subfamily.
- Pixelated body type, soft shadow, fake measurements, fabricated dates or identifiers, or permanent stamps obscuring copy.
- Copied sprites, UI, layouts, or assets from any existing game. The vector form and atmosphere are original.
- Decorative movement during holds or more than one transition focus.

## Evidence

- Renderer: `src/narrative/scenes/brutalist.ts`.
- Scene tests: `test/narrative-pilots.test.ts`.
- Briefs: `docs/narrative-gif/pilots/briefs/*brutalist.json`.
- Exports: `docs/narrative-gif/pilots/brutalist/` (GIF, PNG, contact sheet and manifest per brief).
- Visual review record: `docs/narrative-gif/pilots/REVIEW.md`.
- Manifests state decoded dimensions, frame delays/duration, phase holds, start/mid-transition/hold/exit captures, all five evaluation levels and `visual-review: pending`.
