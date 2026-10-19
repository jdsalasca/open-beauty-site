# Papercraft / editorial narrative scene

## What it does

- Keeps one `guía` card throughout Antes → Cambio → Resultado esperado/observado.
- Makes the guide a near full-height paper object: seeded hand-cut edges, an offset folder backing, an intermediate sheet, an upper notch, a cutout window that reveals the folder, and distinct shadow depth at each height.
- Adds subtle seeded grain beneath the ink and a torn butter-paper ribbon with a crease; texture remains behind the lettering.
- Uses Fraunces Soft for display and Nunito Sans for reading, labels and the state mark.
- `comparison` uses a ruled reading sheet; `checklist` turns the same card into three review rows.
- Seed varies only the bounded cut contour, backing color, slight rotation, ribbon angle and fine grain. `Cambio` slides a folded terracotta flag into the same guide; the result stamp settles in a clear lower margin and reflects status (`EN REVISIÓN`, `REVISADA` or `PENDIENTE`).
- Supports 16:9 and 1:1. The 9:16 portrait layout is explicitly unsupported until a stacked editorial composition is designed; unsupported copy in supported ratios raises `TEXT_OVERFLOW` with a suggestion.

## What it rejects

- Generic sticker packs, confetti, bouncing cards, random jumps and decorative seams.
- A new illustration for each phase; the card's identity persists.
- Identical shadow treatment for all paper layers.
- Stamps or ornaments over copy or ledger rules; the card text remains stationary during each hold.
- Re-seeding the contour, texture or object position between phases.
- Replacing either bundled typeface with a system fallback.

## Evidence

- Renderer: `src/narrative/scenes/papercraft.ts`.
- Scene tests: `test/narrative-pilots.test.ts`.
- Briefs: `docs/narrative-gif/pilots/briefs/*papercraft.json`.
- Exports: `docs/narrative-gif/pilots/papercraft/` (GIF, PNG, contact sheet and manifest per brief).
- Visual review record: `docs/narrative-gif/pilots/REVIEW.md`.
- Manifests state decoded dimensions, frame delays/duration, phase holds, all five evaluation levels and `visual-review: pending`.
