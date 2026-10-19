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
  `experience`, `sprint` and `narrative`) that already validate. Change words,
  not tokens.
- Per-style skills open with a Quick recipe: three copy-paste commands, five hard
  rules, three common mistakes with fixes, and words/tone in es + en.
- `beauty <cmd> --help` and `beauty help <cmd>` print that command's options and
  one example. Every `--brief` flag accepts a file path or `-` for stdin, and
  `beauty make` accepts `--idea-file`, so long briefs never hit the Windows
  command-length limit (os error 206).

## Flujo de historia GIF

Usa `beauty make` para convertir una idea de una frase en un artefacto
autoseleccionado; usa `beauty narrative` cuando el brief debe conservar tres
fases, estado observado/esperado, duración legible y evaluaciones; usa
`beauty sequence` para dibujar varios frames concretos; usa `beauty gif` para
un título corto en loop. Las diferencias y comandos completos están en
[`skills/narrative.md`](../skills/narrative.md).

Las recetas `examples/recipes/<style>/narrative.json` contienen copy en español
para una Sprint Review. `in-review` acaba en **Resultado esperado**; solo
`done`, con evidencia, puede decir **Resultado observado**. Ante `TEXT_OVERFLOW`,
lee la fase y el texto completo que reporta, divide o edita el copy y renderiza
otra vez; no elimines palabras para ocultar el diagnóstico.

La galería se genera con:

```bash
beauty gallery docs/narrative-gif --out docs/narrative-gif/GALLERY.html
```

Abre cada tarjeta como PNG estático; Reproducir carga el GIF bajo petición y
Detener vuelve a la imagen fija. Revisa la vista de 640 × 360. `visual-review`
empieza `pending`, y ninguno de los cinco niveles de evaluación recomienda o
aprueba publicar.

## Available one-shot and repair commands

These are shipped and tested; call them directly.

- `beauty make <kind> --style <slug> --idea "one sentence"` creates
  page|deck|gif|story|experience|motion and validates in one step.
- `beauty fix <file> --style <slug>` applies the safe automatic repairs and
  re-validates.
- `beauty sprint --style <slug> --brief sprint.json` writes review +
  retrospective + planning plus three GIFs; run `beauty sprint --help` for the
  brief schema (`sprint` is required, then team, date, summary, metrics,
  highlights, blockers, next, quote) and the `--out` folder.

## Register the MCP server for Codex/Claude

`pnpm mcp:config` prints the exact snippet for your machine and never edits
your config files. Copy the block you need:

```bash
pnpm mcp:config
```

It prints (your absolute path replaces `<repo>`):

```toml
# Codex CLI (~/.codex/config.toml)
[mcp_servers.open_beauty]
command = "node"
args = ["<repo>/dist/mcp/server.js"]
startup_timeout_sec = 30.0
```

```bash
# Codex one-liner
codex mcp add open-beauty -- node "<repo>/dist/mcp/server.js"

# Claude Code one-liner
claude mcp add -s user open-beauty -- node "<repo>/dist/mcp/server.js"
```

When a session has no MCP tools, fall back to the CLI: it is the same program.

## How to look at your output

The validator is a CSS audit, not a browser. Look at the real render before you
ship:

- `beauty validate <file> --style <s> --strict` for the craft grade and fixes.
- Open the HTML in a browser at 360px, 768px and 1440px.
- Screenshot with Playwright once it is installed:

  ```bash
  pnpm add -D playwright && pnpm exec playwright install chromium
  pnpm exec playwright screenshot --full-page out/nature.html out/nature.png
  ```

- For a GIF, count frames and check the loop instead of trusting the file size:

  ```bash
  python -X utf8 -c "from PIL import Image; im=Image.open('out/n.gif'); print(im.n_frames, im.info.get('loop'))"
  ```

Scroll through a page before capturing it: sections reveal on scroll and a
full-page screenshot can show blank bands.

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

## Flujo guiado y planificación

Usá `beauty plan` para planificar sin renderizar: capacidades, storyboard, avisos de contenido y esqueleto de brief. El flujo completo está en [`skills/guided-workflow.md`](../skills/guided-workflow.md). Un A100 técnico no aprueba legibilidad, narrativa ni dirección de arte; la revisión visual sigue pendiente sin revisor independiente.
