# Narrative GIF pilot exports

Six CLI-generated review packs live here: three briefs rendered in papercraft/editorial and brutalist/documentary. Each folder contains a real GIF, a static PNG, a labeled contact sheet and a JSON manifest. GIF bytes, frame timing and dimensions are measured after encoding; the checked-in manifests include the independent GIF decode and `ffprobe` cross-check.

| Brief / composition | Status | Papercraft GIF | Brutalist GIF |
|---|---|---|---|
| Guías más confiables / comparison | in-review | [GIF · 1269205 B](papercraft/guias-mas-confiables/guias-mas-confiables-418d1d87.gif) · [PNG](papercraft/guias-mas-confiables/guias-mas-confiables-418d1d87.png) · [contacto](papercraft/guias-mas-confiables/guias-mas-confiables-418d1d87-contact-sheet.png) · [manifest](papercraft/guias-mas-confiables/guias-mas-confiables-418d1d87.manifest.json) | [GIF · 1320808 B](brutalist/guias-mas-confiables/guias-mas-confiables-7df0f340.gif) · [PNG](brutalist/guias-mas-confiables/guias-mas-confiables-7df0f340.png) · [contacto](brutalist/guias-mas-confiables/guias-mas-confiables-7df0f340-contact-sheet.png) · [manifest](brutalist/guias-mas-confiables/guias-mas-confiables-7df0f340.manifest.json) |
| Lectura antes del cierre / checklist | in-review | [GIF · 1347749 B](papercraft/lectura-antes-del-cierre/lectura-antes-del-cierre-a789b538.gif) · [PNG](papercraft/lectura-antes-del-cierre/lectura-antes-del-cierre-a789b538.png) · [contacto](papercraft/lectura-antes-del-cierre/lectura-antes-del-cierre-a789b538-contact-sheet.png) · [manifest](papercraft/lectura-antes-del-cierre/lectura-antes-del-cierre-a789b538.manifest.json) | [GIF · 1444112 B](brutalist/lectura-antes-del-cierre/lectura-antes-del-cierre-b49056b8.gif) · [PNG](brutalist/lectura-antes-del-cierre/lectura-antes-del-cierre-b49056b8.png) · [contacto](brutalist/lectura-antes-del-cierre/lectura-antes-del-cierre-b49056b8-contact-sheet.png) · [manifest](brutalist/lectura-antes-del-cierre/lectura-antes-del-cierre-b49056b8.manifest.json) |
| Observación registrada / comparison | done | [GIF · 1358387 B](papercraft/observacion-registrada/observacion-registrada-34abb571.gif) · [PNG](papercraft/observacion-registrada/observacion-registrada-34abb571.png) · [contacto](papercraft/observacion-registrada/observacion-registrada-34abb571-contact-sheet.png) · [manifest](papercraft/observacion-registrada/observacion-registrada-34abb571.manifest.json) | [GIF · 1407379 B](brutalist/observacion-registrada/observacion-registrada-903609f3.gif) · [PNG](brutalist/observacion-registrada/observacion-registrada-903609f3.png) · [contacto](brutalist/observacion-registrada/observacion-registrada-903609f3-contact-sheet.png) · [manifest](brutalist/observacion-registrada/observacion-registrada-903609f3.manifest.json) |

Each contact sheet includes each phase start, its outgoing transition midpoint, hold and exit; the first frame also carries the explicit loop-restart label. Manifests retain those labels by phase. Brief inputs are in [`briefs/`](briefs/).

## Decoded timing and size

- Each output decodes to **1280×720**, **42 frames**, **17940ms total**, with infinite loop metadata (`loopCount: 0`).
- The independent pixel decoder reports exactly **5000ms** on each phase hold. Their hold-frame indexes are 1, 15 and 29.
- The remaining frames are three 80ms phase entries and two inter-phase transitions plus one deliberate result-to-before bridge. Each transition/bridge has 12 eased frames and decodes as six 80ms plus six 70ms delays (900ms). The bridge is not described as seamless.
- All GIFs are below 6 MiB. Exact GIF, PNG and contact-sheet sizes plus file hashes are in each manifest.
- Native phase body type is at least 56px in these six packs; the measured 640×360 effective body size is 28px. Each manifest also reports the per-phase title/body/label values.
- Manifests record all five review levels. `visual-review` stays `pending`, `publicationRecommendation` is `none`, and visual findings/weaknesses are recorded in [`REVIEW.md`](REVIEW.md).

The earlier geometry-only “empty art-lane area” values in [`REVIEW.md`](REVIEW.md) describe the unused part of the reserved object rectangle; they are not a measure of what a viewer perceives as empty. Use the decoded-pixel balance proxy and its limits in [`gallery/REVIEW-layout-pass.md`](../gallery/REVIEW-layout-pass.md) for current composition evidence.

## Reproduce

Run each command from the repository root after dependencies are installed:

```powershell
pnpm exec tsx src/cli.ts narrative --style papercraft --brief docs/narrative-gif/pilots/briefs/guias-mas-confiables-papercraft.json --out docs/narrative-gif/pilots/papercraft/guias-mas-confiables
pnpm exec tsx src/cli.ts narrative --style papercraft --brief docs/narrative-gif/pilots/briefs/lectura-antes-del-cierre-papercraft.json --out docs/narrative-gif/pilots/papercraft/lectura-antes-del-cierre
pnpm exec tsx src/cli.ts narrative --style papercraft --brief docs/narrative-gif/pilots/briefs/observacion-registrada-papercraft.json --out docs/narrative-gif/pilots/papercraft/observacion-registrada
pnpm exec tsx src/cli.ts narrative --style brutalist --brief docs/narrative-gif/pilots/briefs/guias-mas-confiables-brutalist.json --out docs/narrative-gif/pilots/brutalist/guias-mas-confiables
pnpm exec tsx src/cli.ts narrative --style brutalist --brief docs/narrative-gif/pilots/briefs/lectura-antes-del-cierre-brutalist.json --out docs/narrative-gif/pilots/brutalist/lectura-antes-del-cierre
pnpm exec tsx src/cli.ts narrative --style brutalist --brief docs/narrative-gif/pilots/briefs/observacion-registrada-brutalist.json --out docs/narrative-gif/pilots/brutalist/observacion-registrada
```

Two equivalent renders have byte-identical GIF/PNG/contact-sheet outputs on this locked local runtime. The manifests document the supported scope: same operating system, architecture, Node runtime, `pnpm-lock.yaml` dependency graph and renderer versions. Cross-platform byte equality is not claimed. No metrics, savings or deployment assertions are used in these examples.
