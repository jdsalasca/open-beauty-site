---
name: open-beauty-site
description: Create art-directed HTML pages, decks, stories, experiences and GIFs in 13 styles. Use the decision tree below: pick the artifact, copy the command, validate.
---

# open-beauty-site (weak-model kit)

Pick what you want. Copy the command. Run validate. Ship only A + vision 4/4.

## Decision tree

| You want | Command |
| --- | --- |
| List styles | `node dist/cli.js styles` |
| Read one style | `node dist/cli.js guide <style>` |
| Page | `node dist/cli.js page --style <s> --brief examples/recipes/<s>/page.json --out out/<s>.html` |
| Deck | `node dist/cli.js deck --style <s> --brief examples/recipes/<s>/deck.json --out out/<s>-deck.html` |
| Story | `node dist/cli.js story --style <s> --brief examples/recipes/<s>/story.json --out out/<s>-story.html` |
| Experience | `node dist/cli.js experience --style <s> --brief examples/recipes/<s>/experience.json --out out/<s>-exp.html` |
| GIF | `node dist/cli.js gif --style <s> --text "Short Title" --out out/<s>.gif` |
| Validate | `node dist/cli.js validate <file> --style <s> --strict` |

## MCP tools

`beauty_create_page`, `beauty_create_deck`, `beauty_create_gif`, `beauty_validate`; decks use a subfamily (subfamilia).

## Styles (pick one, never mix)

`renaissance brutalist papercraft artdeco isotype opart ukiyoe bestiary psychedelic memphis vaporwave galactic nature`

## Rules

1. Read the style guide first: `node dist/cli.js guide <style>`.
2. Copy a recipe from `examples/recipes/<style>/`; change only words, not tokens.
3. One accent per screen. Real copy, no placeholders, no lorem.
4. Validate every output. Ship only craft A and vision 4/4.
5. GIF text is 2-5 words; objectives go in a page or deck.

## Coming in this release (not available yet)

- `beauty make <kind> --style <slug> --idea "..."`
- `beauty fix <file> --style <slug>`

Use the commands above until then; do not invent flags.
