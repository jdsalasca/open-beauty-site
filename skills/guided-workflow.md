---
name: open-beauty-guided-workflow
description: Guided 8-step workflow for producing web pages, decks and narrative GIFs with honest status, planning, validation and review.
---

# Guided workflow

Use this skill to move from a vague brief to a validated artifact without
inventing facts or claiming visual approval. The flow is fixed; do not skip steps.

## The eight steps

1. Understand audience, purpose, format and source of truth. Record them.
2. Identify the message and choose a compatible visual structure.
3. Choose style and profile. Run `beauty capabilities` and explain fallbacks
   before rendering.
4. Produce a storyboard/composition plan with short reviewable texts.
   Use `beauty plan` to generate it without rendering.
5. Render and export with the recommended command from the plan.
6. Inspect the exported file and produce concrete diagnostics.
7. Apply feedback through the review ledger (`beauty review`, `review-state`,
   `rerender`).
8. Re-render until findings are resolved or limits are declared.

## Inputs: good vs bad

Bad (vague): "make it beautiful", "a page about validation", "something nice
for product".

Good (entities/actions/scope): audience "Producto", purpose "Explicar validación",
message "Una guía con una fila completamente duplicada; una validación la
detecta y rechaza esa entrada; la persona recibe una indicación para
corregirla.", entities ["guía","fila"], actions ["detectar","rechazar"].

## Style choice criteria

Read `docs/art-direction/<style>.md` and `src/styles/art-direction.ts`. Match
intent, suitableFor and limits; check negativeRules before rendering. Summary:

- papercraft: warm cut paper; crafts, food, education, community; limits fintech,
  enterprise SaaS, sharp brands. Two profiles: editorial (available) and friendly
  (spec only).
- brutalist: loud public poster; studios, launches, events, manifestos; limits
  luxury, wellness, children, dense dashboards.
- artdeco: lacquered vertical lobby; architecture, nightlife, timelines, luxury;
  limits children, dense data, informal community.
- bestiary: field-guide manuscript; biology, fable, mythology, slow essays;
  limits sports, SaaS, breaking news.
- galactic: intimate planetarium; music rooms, astronomy, memory, film essays;
  limits fast commerce, children's worksheets, cluttered dashboards.
- isotype: data as public language; data/economics, civic history, public health,
  explanatory journalism; limits luxury, romance, atmospheric fiction.
- memphis: postmodern play; design history, music, workshops, creative education;
  limits hospitals, luxury, solemn memorials.
- nature: herbarium archive; botanical gardens, museums, archives, slow editorial,
  nature education; limits nightlife, fast commerce, dense dashboards.
- opart: perception as argument; perception, geometry, physics, music posters,
  experimental education; limits long reading, formal finance, accessibility-
  critical content without static fallback.
- psychedelic: expansive poster; music, biology, chemistry, festivals; limits
  legal, medical instructions, conservative finance.
- renaissance: chalky fresco; portfolios, cultural institutions, editorial
  essays, weddings, long-form launches; limits dashboards, dense product UI,
  playful youth brands, fast feeling.
- ukiyoe: printed landscape; oceanography, Japanese history, poetry, climate,
  art history; limits fast launches, dense dashboards, ironic memes.
- vaporwave: remembered desktop 1999; internet history, media studies, music,
  digital culture, nostalgia; limits serious policy, health, legal.

## Planning without rendering

Run:

```bash
beauty plan --format gif --style papercraft --audience "Producto" --purpose "Explicar validación" --message "Una guía con una fila completamente duplicada; una validación la detecta y rechaza esa entrada; la persona recibe una indicación para corregirla." --entities "guía,fila" --actions "detectar,rechazar"
```

Abbreviated real output:

```json
{
  "format": "gif",
  "style": "papercraft",
  "capabilities": { "summary": { "supported": 16, "fallback": 0, "unsupported": 8 } },
  "storyboard": [
    { "id": "scene-1", "kind": "scene", "purpose": "Problema", "draftText": "Una guía con una fila completamente duplicada...", "visual": "guía" },
    { "id": "scene-2", "kind": "scene", "purpose": "Cambio", "draftText": "Una guía con una fila completamente duplicada...", "visual": "guía" },
    { "id": "scene-3", "kind": "scene", "purpose": "Resultado", "draftText": "Una guía con una fila completamente duplicada...", "visual": "guía" }
  ],
  "warnings": ["No entities provided..." only when omitted],
  "missing": ["tagline", "intro", "visual.kind", "visual.state"],
  "recommendedNextCommand": "beauty narrative --style papercraft --brief plan.json --out out/papercraft"
}
```

Bad input example:

```bash
beauty plan --format web --style papercraft --audience "Producto" --purpose "Explicar" --message "Ticket ABC-123 en staging, PR #42, redujo errores 40%"
```

Abbreviated real output:

```json
{
  "warnings": [
    "Content lint: possible Jira ids found (ABC-123).",
    "Content lint: possible PR references found (PR #42).",
    "Content lint: environment-like words found (staging).",
    "Content lint: possible invented metrics found (40%).",
    "No entities provided: the visual object is a TODO placeholder."
  ]
}
```

## Example 1: web page

Command:

```bash
beauty page --style papercraft --brief page.json --out out/papercraft.html
```

Real output:

```text
Paper Craft · A 100/100
out/papercraft.html
No issues. The page follows the editorial system.
```

Then validate at three widths and inspect. A technical A is not visual approval.

## Example 2: 6-slide deck

Command:

```bash
beauty deck --style papercraft --brief deck.json --out out/papercraft-deck.html
```

Real output:

```text
Paper Craft deck · 8 slides · Picnic
A 100/100 · vision 4/4
out/papercraft-deck.html
```

The deck has cover + 6 content slides + closing; do not let text truncate silently.

## Example 3: 3-scene GIF

Command:

```bash
beauty narrative --style papercraft --brief narrative.json --out out/papercraft
```

Real output (abbreviated):

```text
technical-integrity: pass
rendered-legibility: pending
narrative: pending
visual-review: pending
dimensions: 1280x720
```

Inspect the PNG, GIF, contact sheet and decoded frames before any review.

## Failure modes

- `TEXT_OVERFLOW`: the engine cannot fit all copy in the safe area at minimum
  sizes. It reports phase and full text; split or shorten copy. It does not
  shrink type to illegibility or delete text.
- `UNSUPPORTED_STATE` / `UNSUPPORTED_ASPECT`: the capability matrix marks the
  cell unsupported; use a supported primitive/aspect or declare the limit.
- Fallback warnings: a fallback cell renders the existing illustration but does
  not implement the named semantic primitive. Do not describe it as implemented.
- Review stale: a change to GIF, PNG or static manifest marks the previous
  review record stale while retaining history.
- Control fail/pending: technical pass, style pass or legibility pass does not
  approve narrative or visual review.

## Quality dimensions

Four separate results:

1. Technical integrity: exports, opens, plays, preserves content.
2. Legibility: readable at real size, no collisions, no lost text.
3. Narrative clarity: problem, action and result scope are understood.
4. Art direction: composition, typography, materiality and identity are
   convincing.

A technical A100 approves none of the other three. Pixel diffs do not prove the
transformation is correct. Visual approval requires an independent reviewer
with real image-viewing capability; otherwise it stays pending. Never simulate
visual review by editing a report.
