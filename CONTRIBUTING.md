# Contributing

Small, opinionated contributions are welcome.

## Setup

```bash
pnpm install
pnpm build
pnpm test
pnpm examples
```

`pnpm test` expects `dist/` to exist because the MCP test spawns the built server. Run `pnpm build` first.

## What good looks like

- A new page scores **A (90+)** with `beauty_validate`.
- No new dependency unless it earns its weight.
- The three styles stay distinct. Do not turn them into recolours of one template.
- Generated artefacts are deterministic: same brief, same output.
- The validator catches a real mistake, not a theoretical one.
- A small model can use the new surface without reading the source.

## Adding a style

1. Add a `StylePreset` to `src/styles/presets.ts`. Include exact fonts, palette, border widths, radii, motion, shadow rule, guidance arrays and signature moves.
2. Add a renderer in `src/page/` and register it in `src/page/index.ts`.
3. Add a frame function in `src/gif.ts` and register it in `RENDERERS`.
4. Bundle the TTF files in `fonts/` and register them in `src/canvas.ts`. Use OFL fonts and include the licence.
5. Add the style to `test/core.test.ts`; it must render at A.
6. Run `pnpm docs:build` to regenerate `skills/<style>.md` and `docs/STYLEGUIDE.md`.
7. Add a preview at `examples/previews/<style>.png` and a GIF.
8. Update the tables in `README.md`, `docs/MCP.md` and `docs/ARCHITECTURE.md`.

## Changing the validator

Every new rule needs a test that fails on a bad page and passes on all three generated pages. False positives are worse than no rule: they teach agents to ignore the validator.

## Content rules

- Spanish and English are supported. If you add microcopy, add both.
- Never add stock photography. The system is typography/illustration-first.
- Avoid emoji in generated pages and GIFs.
- Keep copy lengths inside the caps in `src/types.ts`.

## Commits

Use a short imperative subject. Include the style or module:

```text
brutalist: fix headline highlight on wrap
mcp: return validation issues in create_page
docs: add agent E2E results
```

## Pull requests

Open an issue first for a new style or a new tool. A PR should include:

- the code;
- a test;
- a visual example (page screenshot or GIF);
- a note on what a weak model can now do that it could not do before.
