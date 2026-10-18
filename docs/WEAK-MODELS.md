# Weak models: how this harness keeps them honest

Small models fail at design in predictable ways: they invent fonts, mix palettes,
add gradients to fake depth, write placeholder copy and call the result finished.
open-beauty-site removes those choices instead of asking for taste.

## Why weak models fail

- **Too many choices.** A blank page invites ten fonts, five accents and a gradient.
- **No source of truth.** Without exact tokens, a model guesses `#3b82f6` and `Inter`.
- **Silent success.** A page that renders is not a page that follows a system.
- **Vague errors.** "Looks off" does not teach; `forbidden-font: Inter` does.

## Design rules the harness follows

1. **Few choices.** Thirteen styles, one per artifact. No fourteenth, no mixing.
2. **Deterministic.** Same brief + same style + same seed renders the same page.
   `seed` (0/1/2) changes composition, never the skin.
3. **Errors that teach.** `beauty_validate` returns a code, a message and a `fix`
   line for every issue (e.g. `border-width`, `color-outside-palette`).
4. **Validate + fix loop.** Create, validate, read the fix lines, adjust the brief,
   repeat. Ship only craft A (90+) and vision 4/4.
5. **Tokens, not taste.** Fonts, hex, borders, radii and motion come from
   `beauty_get_style`. The model writes copy and picks a style; the harness renders.

## Weak-model kit

- `skills/beauty.md` is a one-page decision tree: what you want -> exact command.
- `examples/recipes/<style>/` holds starter briefs (`page`, `deck`, `story`,
  `experience`) that already validate. Change words, not tokens.
- Per-style skills open with a Quick recipe: three copy-paste commands, five hard
  rules, three common mistakes with fixes, and words/tone in es + en.

## Coming in this release

Marked as not available yet. Do not call them until shipped; use the commands in
`skills/beauty.md` until then.

- `beauty make <kind> --style <slug> --idea "..."`
- `beauty fix <file> --style <slug>`
- critic (automated review pass; command form to be announced)

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `forbidden-font` / `missing-font` | Invented a font | Read Hard tokens; use the exact family |
| `color-outside-palette` | Hex not in the style | Use only palette roles from `beauty_get_style` |
| `border-width` | Width not allowed | Use the listed widths (often 1/3/6px) |
| `deck-too-short` | Fewer than 4 slides | Add a statement, points or quote slide |
| `story-chapter-thin` | Chapter under ~80 words | Add one scene and one turn per chapter |
| Vision 3/4 | Template look | Change `seed`, image scale or material |
| Craft below A | Obedience errors | Read fix lines and adjust the brief |
| GIF unreadable | Too much text | 2-5 words; put detail in page/deck |
