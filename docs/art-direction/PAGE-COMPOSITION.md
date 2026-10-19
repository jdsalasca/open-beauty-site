# Page composition and scene heroes

This document covers the two page-brief fields added for issue 10 (§4–§5):
content-driven hero illustrations and below-hero composition variants. The
shared implementation lives in `src/page/composition.ts`.

## Brief fields

| Field | Values | Default |
|---|---|---|
| `scene` | `table`, `vitrine`, `river`, `house`, `stage`, `plant`, `window`, `none` | none: the renderer keeps its fixed illustration |
| `heroArt` | `collage` (fixed template) or any `scene` subject | the fixed illustration when no scene is given |
| `composition` | `editorial`, `split`, `stepper` | `editorial` |
| `sections[].kind` | `default`, `explanation`, `comparison`, `process`, `cta` | `default` |

`scene` and `heroArt` share the vocabulary of `sceneArt` in `src/art.ts`.
`heroArt: "collage"` is the explicit escape hatch for papercraft: it always
keeps the original collage. A scene subject replaces the fixed illustration.

An unsupported scene or hero-art value never falls back silently to a generic
house, flower or planet. The page renders a visible `role="note"` warning
(`data-composition-warning`) that lists the supported subjects, and keeps the
renderer's documented fixed illustration.

## Composition variants

- `editorial`: the renderer output is left byte-identical. Nothing is inserted.
- `split`: explanation and comparison blocks below the hero.
- `stepper`: a numbered process block below the hero.

The two new variants also add a CTA block. Their section roles are rendered
from `sections[].kind`; untyped sections keep the style's existing chapter
layout. The variant is selected **only** by `brief.composition`; neither
`seed` nor any other random source chooses it. `seed` continues to control
decorative variation inside each renderer (ornament placement, rotation,
which equivalent composition the style already supported). A future
equivalent-variant tie-break may use the seed only inside the same variant
family and must be documented here first.

## Style identity

`compositionCss` consumes:

- `StylePreset.palette.surface`, `ink`, `muted`, `accent` for the band, rules,
  text and buttons;
- `ART_DIRECTION[style].color.semanticStates.warn` and `.problem` for the CTA
  limitation note and the scene warning;
- the shared labels from `labels(locale)` and `t(locale, es, en)`.

The band uses the same CSS custom properties and typographic families as the
rest of the page, so it keeps the style's type, palette and material voice
instead of becoming a generic gray strip.

## CTA integrity

A CTA is either a link with a real destination or a visible limitation state.
`ctaHasDestination` rejects empty values, a bare `#`, `#!`, `todo`, `tbd`,
`placeholder`, `coming soon`, `lorem`, `javascript:`, `about:blank` and
example domains. In-page anchors such as `#contact` are valid.

`applyComposition` runs `sanitizeCtaAnchors` after rendering: any CTA anchor
with an invalid `href` becomes `<button type="button" aria-disabled="true">`
plus a `role="note"` explanation. `validateHtml` independently reports
`cta-no-destination` for any CTA anchor that still has an empty or placeholder
`href` (for example, edited HTML).

## Verification

- `test/page-composition.test.ts`: scene support for all 13 styles, explicit
  collage, unsupported-scene warning, variants, section roles, CTA states and
  validator coverage.
- `test/page-composition-examples.test.ts`: the Spanish duplicate-row examples
  under `examples/web/composition-variants/`.
- `test/page-geometry.test.ts`: 13 styles × `split`/`stepper` at 360, 768 and
  1440 px using `test/support/geometry.ts` (horizontal overflow, clipping,
  overlap, split words, two-column collapse).
- `test/page-recipe-snapshot.test.ts`: the 13 recipe pages keep their exact
  bytes, so the 91 visual-matrix cells are unchanged.
