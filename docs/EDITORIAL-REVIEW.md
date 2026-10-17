# Editorial review — deck system

Reviewer: independent editorial auditor, 2026-10-17.
Scope: `src/deck.ts`, `src/deck-motifs.ts`, `src/validate.ts`, `src/mcp/server.ts`, `src/styles/subfamilies.ts`, `skills/`, `docs/`, examples.

## Verdict

The page system was strong; the first deck was a landing page with arrows: one cover orbit for all 12 styles, four layouts, colour-only subfamilies, and the generic page audit. It passed A/100 + vision 4/4 without a single deck-specific check. That gap is now closed at the contract level, but the deck is still a **first generation**: good enough to publish, not yet a full presentation grammar.

## P0 findings and status

| Finding | Status |
| --- | --- |
| Page audit was used for decks | **Fixed.** `validateDeck` adds slide count, words per slide, points, layout variety, `aria-live`, `inert` and print checks; CLI and MCP detect decks. |
| Per-style atmosphere was hidden behind the slide background | **Fixed.** The stage no longer paints over `.atmosphere`; Brutalist grid, Art Deco rays, Galactic planet, Papercraft field and the other motifs are visible. |
| Subfamilies only changed accent/ground | **Improved.** Three structural modes (`sala`, `gabinete`, `cartel`) change the cover and points composition; accent still comes only from the preset palette. |
| Hidden slides focusable, no announcements, print lost slides | **Improved.** `inert`, `aria-live`, focusable headings, 44px controls and print CSS. A PDF still emits one trailing blank page; content is present. |
| Docs and contract were a cycle behind | **Fixed.** Eight tools, `beauty_create_deck`, `format: "deck"`, presentation resource, 12 example routes, CLI `--subfamily`, `createDeck` export, updated README/STYLEGUIDE/education. |
| No figure or speaker-note grammar | **Open.** The deck has statement, points, stats and quote. A `figure` layout with caption/source is the next real feature, not another palette. |
| Per-style motion and transitions | **Open.** Entrance/transition is a shared fade+rise; `motion: none|subtle|full` and style-specific transitions are not implemented. |

## What the second pass proved

- 12/12 styles render a deck at **A/100 + vision 4/4** in the local matrix.
- Luna 6 Max built an 8-slide Galactic/deep-field deck through MCP only: **A/100 + vision 4/4**, 47,481 tokens.
- A 70-word slide now produces `deck-word-count` instead of A/100.
- Hidden slides carry `inert`; the live region announces “Diapositiva N de M”; the PDF contains every slide.
- `beauty_examples` now points to the real `examples/showcase/<style>/index.html` and `examples/gifs/showcase-<style>.gif` routes for the nine new styles.

## Next three moves

1. **Figure layout** — `{ kind: 'motif' | 'diagram' | 'image', name, alt, caption, source }`, with 12 original rendered figures and a validator requirement that a deck over 6 slides includes one.
2. **Structural subfamilies** — consume `sequence`, `ornament`, `rhythm`, `material` and `type` per subfamily, and add a grayscale fingerprint test that rejects pure recolours.
3. **Motion profiles** — `motion: none | subtle | full`, style-specific transition (hard cut for Brutalist, dissolve for Renaissance/Galactic, sweep for Art Deco, paper settle for Papercraft), pause and reduced-motion.

The full audit is in the session log; this page keeps the decisions that survive.
