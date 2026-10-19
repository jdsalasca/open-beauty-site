# Narrative GIF pilot exports

Six CLI-generated review packs live here: three briefs rendered in papercraft/editorial and brutalist/documentary. Each folder contains a real GIF, a static PNG, a labeled contact sheet and a JSON manifest. GIF bytes, frame timing and dimensions are measured after encoding; the checked-in manifests include the independent GIF decode and `ffprobe` cross-check.

| Brief / composition | Status | Papercraft GIF | Brutalist GIF |
|---|---|---|---|
| Guías más confiables / comparison | in-review | [704544 B](papercraft/guias-mas-confiables/guias-mas-confiables-5b289755.gif) | [715394 B](brutalist/guias-mas-confiables/guias-mas-confiables-693b6de2.gif) |
| Lectura antes del cierre / checklist | in-review | [849291 B](papercraft/lectura-antes-del-cierre/lectura-antes-del-cierre-151ae214.gif) | [767097 B](brutalist/lectura-antes-del-cierre/lectura-antes-del-cierre-db393a39.gif) |
| Observación registrada / comparison | done | [753677 B](papercraft/observacion-registrada/observacion-registrada-e522212b.gif) | [776200 B](brutalist/observacion-registrada/observacion-registrada-dfb15b10.gif) |

Every linked GIF has a sibling `.png`, `-contact-sheet.png` and `.manifest.json` in the same folder. The manifest lists every phase's start, hold and exit captures plus the result-to-before loop bridge. Brief inputs are in [`briefs/`](briefs/).

## Decoded timing and size

- Each output decodes to **1280×720**, **33 frames**, **17190ms total**, with infinite loop metadata (`loopCount: 0`).
- The independent pixel decoder reports exactly **5000ms** on each phase hold. Their hold-frame indexes are 1, 12 and 23.
- The remaining frames are three 80ms phase entries and two inter-phase transitions plus one deliberate result-to-before bridge. Each of those three transitions/bridges decodes as `[80, 80, 70, 70, 70, 70, 70, 70, 70]ms` (650ms). The bridge is not described as seamless.
- All GIFs are below 0.82 MiB, far under the 6 MiB limit. Exact GIF, PNG and contact-sheet sizes plus file hashes are in each manifest.
- Native phase body type is at least 36px; the evaluated 640×360 effective body size is 20px for all six. The display-title size is reported per manifest (Papercraft 76px; Brutalist 69px native, 34.5px effective at card size).
- Manifests record all five review levels. `visual-review` stays `pending`, `publicationRecommendation` is `none`, and visual findings/weaknesses are recorded in [`REVIEW.md`](REVIEW.md).

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
