# Stage B pilot visual review

**Decision:** rendered and inspected in three iterations; evaluation remains `visual-review: pending`. This is a recorded agent review, not independent art-direction approval.

## Iteration 1 — initial 1280×720 pilots

Inspected the papercraft and brutalist comparison contact sheets and the three phase holds for each.

- **Papercraft:** the title used Fraunces' exact registered weight in Canvas, which produced corrupted font metrics and a compressed-looking heading. The paper guide occupied too little of the art strip, so its cut contour and field structure disappeared at card scale.
- **Brutalist/documentary:** the form also read too small in the art strip, and its offset shadow was gray instead of the hard black shadow specified for the style.

**Fixes:** raster drawing now requests Canvas weight 400 for the same bundled Fraunces Soft face whose declared/registered role remains 560; the rendering check confirms physical metrics and the full Spanish glyph set. Pilot layout gives the art a wider column, and the documentary form uses a solid ink offset shadow.

## Iteration 2 — font, art scale and shadow fixes

Re-rendered both 1280×720 scenes and inspected their contact sheets plus all three phase holds.

- The Fraunces title and form material now render cleanly; the black documentary offset reads as a printed form edge.
- **Brutalist/documentary:** the title `Guías claras` raised `TEXT_OVERFLOW` in the actual 640×360 composition test: its 358×76px title box could not preserve the 56px minimum. The 1280 preview did not expose that card-size failure.
- **Papercraft:** a permanent empty status ring sat near the final review stamp. It added a second status cue after the terracotta signal and `EN REVISIÓN` stamp already explained the state.

**Fixes:** pilot layout now assigns 60% of the width to copy, 2% to the gap and 28% to the art. The title fits at the required minimum in card-size scene tests, while the art column remains slightly wider than the foundation layout. The unused paper status ring was removed.

## Iteration 3 — decoded GIF review

Re-rendered both comparison examples from the CLI. Inspected each generated contact sheet and the `Antes`, `Cambio` and `Resultado esperado` hold frames decoded back from the GIF bytes using the independent test decoder.

- **Papercraft:** the heading and phase copy remain legible; one guide card persists; the terracotta signal arrives in `Cambio`; the separate review stamp settles at the foot of the card without covering its copy. No empty status ring remains.
- **Brutalist/documentary:** the form remains fixed while the red observation box and final checkbox record the state. The stamp occupies its reserved lower area, outside the large narrative copy. No invented number, date or folio appears.
- Both sheets show the deliberately labeled loop restart from result to before. It is a bridge, not a seamless loop.
- Decoded GIF holds are 5000ms for all three phases. The transition frames have separate 70–80ms delays and do not reduce those holds. Native narrative body sizes are measured in the manifests and remain at least 36px; their 640×360 effective sizes are reported separately.

No further renderer edits were indicated by these six decoded holds. This observation does not settle narrative causality, OCR, smaller internal form labels, or approval by an independent designer, so `visual-review` stays pending and publication recommendation remains `none`.

## Final composition evidence

The six checked-in examples include `comparison` and `checklist` compositions per style. I inspected all six contact sheets and the three GIF-decoded phase holds from each at 640×360.

- The longer brutalist headings wrap cleanly at card size; no body copy is cut or pushed into the form column.
- Papercraft's checklist labels inside the illustrated card are secondary and small at 640×360. The phase body remains the readable source of the story; the internal labels should be treated as form detail, not payload.
- The documentary form uses Space Mono labels that are also smaller than the narrative body. They remain secondary to the large copy and state marks; this review did not use OCR.
- The `done` examples use “Resultado observado”; the `in-review` examples use “Resultado esperado”. No example asserts deployment, metrics or savings.

All three phases are rendered by the same per-style object; phase-specific content, state marks, explicit seed and status are retained in each adjacent brief and manifest.

- Papercraft: `docs/narrative-gif/pilots/papercraft/`.
- Brutalist documentary: `docs/narrative-gif/pilots/brutalist/`.
- Source briefs: `docs/narrative-gif/pilots/briefs/`.

At that review stage, these inspections identified no further visual change within the two compositions. The later independent art review found the hero objects too small, which is recorded in the polish pass below. Small internal form labels remain the clearest card-scale weakness; this review is not independent design approval and does not close OCR or semantic causality checks.

## Polish pass — larger paper object and documentary form

**Review state:** `visual-review: pending`. The following records rendered observations and concrete defects; it is not independent art-direction approval.

### Iteration 1 — checked-in baseline, native 1280×720 frames and contacts

Inspected the existing comparison contact sheets and native PNG holds for papercraft and brutalist/documentary. The scene rectangle occupies about **13.4%** of the full frame for papercraft and **14.4%** for brutalist. Relative to each reserved art lane, about **27.8%** and **22.6%** of that lane respectively sits outside the hero-object rectangle. These are geometry-derived ratios: scene box area divided by 1280×720; empty-art ratio is one minus scene box area divided by reserved-art area.

- **Papercraft:** the native frame showed one narrow, pale guide card at the right. The lower part of the frame stayed empty. The notched contour, backing sheet, tape and shadow read weakly at contact size; there was no visible height hierarchy between the paper layers.
- **Brutalist/documentary:** the form read as a small outlined card with a hard shadow. Its fields and edge did not yet carry enough documentary weight; there was no prominent registration area or distinct copy column.
- **Both:** the contact sheet omitted transition midpoints. A hold alone could not show how the signal or status mark arrived.

### Iteration 2 — first expanded render

Rendered all six briefs to a temporary directory and inspected all six contact sheets, plus native 1280×720 holds for the comparison and checklist compositions in both styles. The phase holds still decode as 5000ms. The revised scene rectangles occupy **25.4%** of the papercraft frame and **26.3%** of the brutalist frame; empty space within their reserved art lanes falls to **11.7%** and **8.8%** respectively.

Concrete defects found in these frames:

- **Papercraft:** the backing and middle sheet still merge into the warm ground; the upper-right “window” looks like a beige inset instead of a cut-through revealing the folder. The `EN REVISIÓN` mark crosses the final comparison rule. The terracotta tab slides into place but still reads as a plain arrow rather than a tucked flag.
- **Brutalist/documentary:** the two-column ledger, perforations and registration cells now read as one form and the red marks stay in their reserved boxes. The internal labels become microcopy at 640×360, so their size needs one more pass; the phase body remains the main readable content. The wrapped two-line title is stable and clear at native size.

### Iteration 3 — second expanded render

Rendered the six briefs again after widening the text column slightly and tightening the art column. Inspected all six contact sheets and all 18 native 1280×720 phase holds. The scene rectangles now occupy **24.0%** of the papercraft frame and **24.8%** of the brutalist frame. Empty space within their reserved art lanes is **11.7%** and **8.8%**.

- The papercraft folder edge and color-revealing window read more clearly; the folded terracotta tab now has a visible swallowtail and crease. Moving the stamp down cleared the comparison rule.
- The brutalist form now holds its own column, separated fields, perforation, reference/copy strip and registration marks. Checklist ticks advance; the observation and final status stay in separate cells.
- Two residual defects were visible: the `done` papercraft example still stamped `EN REVISIÓN`, contradicting its `Resultado observado` phase; the brutalist `REFERENCIA` label touched the perforation rule. The signal also began too abruptly for the intended paper movement.

These findings led to a status-derived papercraft stamp, a farther-right perforation and a symmetric ease curve. A subsequent 640×360 composition check also found a title overflow, so one more width correction and inspection pass followed; `visual-review` remains pending regardless of these inspections.

### Iteration 4 — refined marks, motion and first checked-in exports

Rendered the six review packs into their checked-in pilot folders, decoded each GIF with Pillow for native phase holds, and inspected all six final contact sheets plus all 18 1280×720 holds.

| Pilot | Hero-object area / full frame, before → after | Empty art-lane area, before → after |
|---|---:|---:|
| Papercraft · Guías más confiables | 13.35% → 24.03% | 27.76% → 11.65% |
| Papercraft · Lectura antes del cierre | 13.35% → 24.03% | 27.76% → 11.65% |
| Papercraft · Observación registrada | 13.35% → 24.03% | 27.76% → 11.65% |
| Brutalist · Guías más confiables | 14.31% → 24.81% | 22.56% → 8.80% |
| Brutalist · Lectura antes del cierre | 14.31% → 24.81% | 22.56% → 8.80% |
| Brutalist · Observación registrada | 14.31% → 24.81% | 22.56% → 8.80% |

Ratios use the rendered scene rectangle geometry: scene-box area divided by the 1280×720 frame; empty-art ratio is one minus scene-box area divided by the reserved art-lane area. The scene area increased 1.80× in papercraft and 1.73× in brutalist. All six files decode to 1280×720, 42 frames and 17940ms total; each phase holds exactly 5000ms, and each of the three eased transitions (including the loop bridge) lasts 900ms across 12 frames. GIFs range from 1171232 to 1281441 bytes, below 6MiB. Native body size is at least 36px and effective body size is 20px at 640×360 in every manifest.

- **Papercraft / Antes:** the folder, middle sheet and guide retain the same cut identity; the notch, torn ribbon, grain and shadow heights are visible at native scale.
- **Papercraft / Cambio:** the terracotta folded tab slides into the guide with eased motion. **Resultado:** the stamp settles below the final ledger rule; it reads `EN REVISIÓN` for the in-review briefs and `REVISADA` for the done brief.
- **Brutalist / Antes:** the same form retains its reference/copy column, ledger grid, stub and blank registration cells. **Cambio:** the observation checkbox and rough red stamp are recorded in their reserved cells. **Resultado:** the next checkbox and supplied final-status stamp appear without invented numbers, dates or folios.
- Contact sheets now label each phase start, transition midpoint, hold and exit, plus the explicit loop-restart frame. External narrative copy remains static while the document mark supplies the focal motion.

Remaining weaknesses: the documentary form's internal field labels are secondary and small at 640×360; the papercraft grain is intentionally subtle and is easiest to see at native size; long brutalist titles wrap over two lines. This inspection did not include OCR or independent designer approval. Every manifest therefore retains `visual-review: pending` and `publicationRecommendation: none`.

### Iteration 5 — corrected 640px title fit and final checked-in exports

The full suite caught `TEXT_OVERFLOW` for the brutalist title `Guías claras` at the 640×360 effective size when the text column was narrowed to 54%. Restored the pilot copy column to 60% of the frame width, kept a 2% gap, set the art lane to 31% width and 84% height, and expanded each hero object to 99% of that lane. Re-rendered and replaced all six checked-in GIF/PNG/contact-sheet/manifest packs. Inspected all six contact sheets and 18 GIF-decoded 1280×720 hold frames (indexes 1, 15 and 29); all contact sheets include phase start, transition midpoint, hold, exit and the labeled loop restart.

| Pilot | Hero-object area / full frame, original → final | Empty art-lane area, original → final |
|---|---:|---:|
| Papercraft · Guías más confiables | 13.35% → 25.52% | 27.76% → 1.99% |
| Papercraft · Lectura antes del cierre | 13.35% → 25.52% | 27.76% → 1.99% |
| Papercraft · Observación registrada | 13.35% → 25.52% | 27.76% → 1.99% |
| Brutalist · Guías más confiables | 14.31% → 25.52% | 22.56% → 1.99% |
| Brutalist · Lectura antes del cierre | 14.31% → 25.52% | 22.56% → 1.99% |
| Brutalist · Observación registrada | 14.31% → 25.52% | 22.56% → 1.99% |

These are geometry-derived object bounds: object-box area divided by the 1280×720 frame; empty art is one minus object-box area divided by reserved-art-lane area. The final object area is 1.91× the original papercraft guide and 1.78× the original brutalist form. The final exports decode to 1280×720, 42 frames and 17940ms; all three holds are exactly 5000ms. Each of the two phase transitions and result-to-before bridge lasts 900ms across 12 eased frames. GIFs range from 1153651 to 1343788 bytes (under 6 MiB). Native phase body copy is at least 36px and effective body copy is 20px at 640×360 in each manifest. Both scenes support 16:9 and 1:1; 9:16 and 4:3 are explicit limitations covered by scene tests because the current side-by-side composition has no portrait stacking mode.

- **Papercraft / Antes:** the same layered guide fills nearly the full art-lane height; offset backing, mid-sheet, controlled notch, cutout reveal and height-specific shadows are visible. **Cambio:** a single folded terracotta tab slides in while narrative text stays still. **Resultado:** the status stamp settles under the last rule and reads `EN REVISIÓN` or `REVISADA` from supplied brief status.
- **Brutalist / Antes:** the enlarged form retains its perforated stub, ledger grid, reference/copy column and empty registration cells. **Cambio:** the observation checkbox and rough stamp land in their own cell. **Resultado:** the next checkbox and status stamp appear in the second cell. The same document layout and identity persist; no folio, date, metric or number is fabricated.
- In both styles, motion has one focal mark and eased entry/exit; title and phase copy remain stable through the transition. The contact sheet includes transition midpoints as well as the four requested states.

Remaining weaknesses: papercraft grain and small internal paper labels are intentionally secondary; brutalist internal form microcopy remains smaller than phase copy, and the longest brutalist titles wrap to two lines. This inspection did not include OCR or independent designer approval. All manifests retain `visual-review: pending` and `publicationRecommendation: none`.
