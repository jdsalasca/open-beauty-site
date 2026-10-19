# Papercraft / editorial narrative scene

## What it does

- Keeps one `guía` card throughout Antes → Cambio → Resultado esperado/observado.
- Gives it a controlled hand-cut contour, one upper notch, three paper heights with different shadow depth, warm stock, and a torn butter-paper ribbon.
- Uses Fraunces Soft for display and Nunito Sans for reading, labels and the `EN REVISIÓN` mark.
- `comparison` uses a ruled reading sheet; `checklist` turns the same card into three review rows.
- Seed varies only cut contour, backing sheet, a slight rotation and ribbon angle. State changes add a terracotta signal and a separate review stamp.
- Supports 16:9, 1:1 and 9:16. Text stays inside the shared safe zone; unsupported copy raises `TEXT_OVERFLOW` with a suggestion.

## What it rejects

- Generic sticker packs, confetti, bouncing cards, random jumps and decorative seams.
- A new illustration for each phase; the card's identity persists.
- Identical shadow treatment for all paper layers.
- Stamps or ornaments over copy; the card text remains stationary during each hold.
- Replacing either bundled typeface with a system fallback.

## Evidence

- Renderer: `src/narrative/scenes/papercraft.ts`.
- Scene tests: `test/narrative-pilots.test.ts`.
- Briefs: `docs/narrative-gif/pilots/briefs/*papercraft.json`.
- Exports: `docs/narrative-gif/pilots/papercraft/` (GIF, PNG, contact sheet and manifest per brief).
- Visual review record: `docs/narrative-gif/pilots/REVIEW.md`.
- Manifests state decoded dimensions, frame delays/duration, phase holds, all five evaluation levels and `visual-review: pending`.
