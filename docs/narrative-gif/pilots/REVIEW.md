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

These inspections identified no further visual change to make within the two implemented compositions. Small internal form labels remain the clearest card-scale weakness; this review is not independent design approval and does not close OCR or semantic causality checks.
