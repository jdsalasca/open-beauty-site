# Testing

## Automated

```bash
pnpm build
pnpm test
```

The suite runs with Node's test runner through `tsx`:

- `test/core.test.ts` — every style renders a complete document, escapes user content, reaches A/100 and vision 4/4; the validator rejects generic AI design (Inter, invented colours, 8px radii, 5px borders, soft shadows in brutalist); `seed` changes the composition archetype.
- `test/mcp.test.ts` — spawns the built MCP server over stdio, verifies the eight-tool surface, reads the Renaissance tokens, creates and audits a page, creates a valid GIF, creates an animated deck, a room experience and a chaptered story, and verifies the presentation skill and example routes.

Current result: **25/25 passing** in ~8 s (plus MCP startup).

```text
✔ every style renders a complete document and scores A
✔ user content is escaped
✔ the validator catches generic AI design
✔ the validator rejects unknown styles
✔ exposes the full tool surface
✔ styles expose exact fonts and palette
✔ creates and audits a page over MCP
✔ creates a valid GIF over MCP
✔ creates an animated deck over MCP
✔ creates a museum experience over MCP
✔ creates a chaptered story over MCP
✔ serves the presentation skill on demand
✔ example routes point to real files
✔ the deck audit catches a slide with too many words
```

## Visual QA

The example pages are rendered at 1440×900 and full-page with Playwright (Chrome), after scrolling to trigger the reveal observer. Screenshots live in `examples/previews/`.

```bash
pnpm examples
python scripts/qa.py        # needs playwright + the Chrome channel
```

The QA script also prints section geometry and console errors. The current run reports zero console errors and all sections visible.

## End-to-end: Codex CLI with Luna 6

Codex CLI 0.163.0 was configured with `model = "gpt-6-luna"` and `model_reasoning_effort = "max"`. The MCP server was registered as `open_beauty` in `~/.codex/config.toml` for the duration of the test.

Prompt (shortened): *"Call beauty_list_styles, then beauty_get_style for brutalist, create a page titled LUNA / SIGNAL with three sections, validate it, report the grade."*

Observed tool trace:

```text
mcp: open_beauty/beauty_list_styles started
mcp: open_beauty/beauty_list_styles (completed)
mcp: open_beauty/beauty_get_style started
mcp: open_beauty/beauty_get_style (completed)
mcp: open_beauty/beauty_create_page started
mcp: open_beauty/beauty_create_page (completed)
mcp: open_beauty/beauty_validate started
mcp: open_beauty/beauty_validate (completed)
```

Result:

```text
Validación completada: A (100/100).
Archivo: C:/Users/jdsal/Documents/Programming-personal/open-beauty-site/luna-test/brutalist.html
Problemas pendientes: ninguno.
```

Session: `01a14a89-39a0-72b2-a140-b779e9569f69` · 32,813 tokens. The agent did not hand-write HTML; every design decision came from the harness.

The output is preserved at `examples/agents/luna-brutalist.html`.

## End-to-end: Codex CLI with Luna 6, round 2

After the art-direction rewrite (EB Garamond, flat fresco fields, Fraunces Soft, cut-paper geometry, vision audit), Luna was run again with the same MCP:

```text
mcp: open_beauty/beauty_list_styles started
mcp: open_beauty/beauty_list_styles (completed)
mcp: open_beauty/beauty_get_style started
mcp: open_beauty/beauty_get_style (completed)
mcp: open_beauty/beauty_create_page started
mcp: open_beauty/beauty_create_page (completed)
mcp: open_beauty/beauty_validate started
mcp: open_beauty/beauty_validate (completed)
```

Result:

```text
Calificación: A · 100/100
Visión: 4/4; todas las comprobaciones pasan
Problemas: ninguno
Archivo: examples/agents/luna-papercraft-v2.html
```

Session: `01a14ab1-e42e-7fa2-b57c-d8e28405c128` · 35,526 tokens. The page is a children's natural-history lesson built with Fraunces Soft, layered paper sheets and cut corners. It is a different object from the v1 papercraft page, not a recolour: `examples/agents/luna-papercraft.html` used DM Serif Display and Lato; v2 uses Fraunces and Nunito Sans. The v1 page is kept as a before/after reference.

## End-to-end: colmena-mcp with `luna-max`

`colmena-mcp` was connected over stdio by `scripts/e2e-colmena.ts`. It reported a healthy doctor (Node, git, config, Codex binary, home writable) and ran a job with `worker: "luna-max"`, `isolation: "inplace"`.

Result:

```json
{
  "id": "bf1623ed",
  "state": "done",
  "worker": "luna-max",
  "model": "gpt-6-luna",
  "provider": "codex",
  "effort": "max",
  "cost_usd": 0,
  "reportOk": true,
  "report": {
    "RESULT": "Página Casa Limón creada; validación A · 100/100.",
    "FILES": ".../open-beauty-site/luna-test/papercraft.html",
    "TESTS": "beauty_validate con estilo papercraft: sin problemas.",
    "RISKS": "Ninguno reportado."
  }
}
```

The output is preserved at `examples/agents/luna-papercraft.html`.

That is two different styles, two different agents, two A/100 pages, with no manual HTML.

## End-to-end: the cheapest worker in the hive

To test the "dumb model" claim literally, the same harness was run through `colmena-mcp` with `worker: "max-hive"` — an OpenCode worker on `opencode-go/longcat-2.5-preview-free`, effort `high`, cost 0. OpenCode does not share Codex's MCP config, so the prompt used the CLI, which calls the same renderers.

Result:

```json
{
  "id": "070b00e9",
  "state": "done",
  "worker": "max-hive",
  "model": "opencode-go/longcat-2.5-preview-free",
  "provider": "opencode",
  "effort": "high",
  "cost_usd": 0,
  "reportOk": true,
  "report": {
    "RESULT": "Ejecuté ambos comandos en orden. El page generó el HTML y el validate confirmó conformidad con el sistema editorial.",
    "FILES": "luna-test/hive-renaissance.html (creado, 17555 bytes).",
    "TESTS": "page → Renaissance · 100/100; validate → A · 100/100 · renaissance."
  }
}
```

The output is preserved at `examples/agents/hive-renaissance.html`. It is a quieter page than the Luna ones because the brief had no sections, but it is still a complete, art-directed folio: the harness supplied the layout, the free model supplied four sentences.

## Reproduce the agent tests

1. Build and confirm the MCP server starts:

   ```bash
   pnpm build
   node dist/cli.js doctor
   ```

2. Add the server to Codex (`~/.codex/config.toml`):

   ```toml
   [mcp_servers.open_beauty]
   command = "node"
   args = ["C:/absolute/path/open-beauty-site/dist/mcp/server.js"]
   startup_timeout_sec = 30.0
   ```

3. Run Codex with a brief. Keep the prompt short and explicit about using the tools.

4. For colmena:

   ```bash
   COLMENA_ROOT="C:/path/to/colmena-mcp" pnpm e2e:colmena
   ```

   `~/.colmena/colmena.yml` must define a `luna-max` worker. The script calls `doctor` first, then `run` with `worker: "luna-max"`, `wait: true` and a 480 s timeout.

## Eight new styles, Luna × 8

After adding Art Deco, Isotype, Op Art, Ukiyo-e, Bestiario, Psicodelia, Memphis and Vaporwave, Luna 6 Max was asked to create one page per style through the MCP. It wrote its own Spanish brief for each, called `beauty_create_page` eight times and validated all eight.

```text
| style        | craft      | vision | path                                      |
| artdeco      | A 100/100  | 4/4    | examples/luna-showcase/artdeco.html       |
| isotype      | A 100/100  | 4/4    | examples/luna-showcase/isotype.html       |
| opart        | A 100/100  | 4/4    | examples/luna-showcase/opart.html         |
| ukiyoe       | A 100/100  | 4/4    | examples/luna-showcase/ukiyoe.html        |
| bestiary     | A 100/100  | 4/4    | examples/luna-showcase/bestiary.html      |
| psychedelic  | A 100/100  | 4/4    | examples/luna-showcase/psychedelic.html   |
| memphis      | A 100/100  | 4/4    | examples/luna-showcase/memphis.html       |
| vaporwave    | A 100/100  | 4/4    | examples/luna-showcase/vaporwave.html     |
```

Session: 97,047 tokens. The comparison against my own briefs is at `examples/compare.html`; it is the visual record of the same grammar used by two authors.

## MUSEM · Galactic Futurism

The ninth new style is live at [musem.eridu.top](https://musem.eridu.top). The Random Access Memories room validates **A/100 + vision 4/4**, uses `Michroma` + `Space Grotesk`, and plays an original 160-second suite generated by [`open-music`](https://github.com/jdsalasca/open-music). The public audio was tested through the browser: `duration: 160`, playback starts on user click, and the MP3 is served with HTTP 200.

## What was not tested

- A production CDN / hosting setup.
- Right-to-left scripts and CJK typography.
- More than 6 sections or 900 characters of body copy.
- Windows display scaling above 150%.
- Real user acceptance beyond the agent runs above.

## Deck end-to-end: Luna 6 Max

Codex CLI `0.163.0`, `gpt-6-luna`, `model_reasoning_effort = "max"`. The MCP server was registered only for the run and removed afterwards.

Prompt asked for an 8-slide 16:9 symposium deck in `galactic`, subfamily `deep-field`, with statement, points, stats and quote layouts. The agent read `beauty_get_skill({ format: "deck" })`, the Galactic style guide and the subfamilies; it never wrote HTML.

Result: **A · 100/100 · vision 4/4**, 8 slides (6 content + cover + closing), 47,481 tokens.

- Deck: `examples/luna-deck/memory-future.html`
- Screenshots: `examples/luna-deck/luna-deck-1.png` … `luna-deck-8.png`
- Log: `qa/luna-deck3.log` (local only; not published)

The editorial auditor's P0 list drove the deck audit, the per-style atmosphere fix, `inert`/`aria-live`, print styles and the `sala | gabinete | cartel` composition modes. Figures and per-style motion profiles are still pending.

## Maxxing y kit de sprint (2026)

- `test/maxxing.test.ts` comprueba que una página Nature con `maxxing: true` conserva **A/100 y visión 4/4** y contiene la capa `max-layer`.
- La matriz local `qa/max-matrix.ts` valida **13/13 estilos** con `maxxing` en A/100 y 4/4.
- `test/mcp.test.ts` crea un kit de sprint completo por MCP: tres decks **A/100 + 4/4** y tres GIFs.
- `examples/gifs/maxxing/` guarda **13 GIFs**, uno por estilo, generados por Luna con `maxxing: true`.

## Ronda 2026: 12 estilos con Luna 6 Max

Doce corridas independientes, una por estilo, con un brief distinto en español y el MCP real. Cada una llamó `beauty_get_skill`, `beauty_get_style`, `beauty_create_page` y `beauty_validate`; ninguna escribió HTML. Salidas públicas en `examples/agents/round-2026/<style>.html` (copia de las salidas de `qa/luna-12/`).

| Estilo | Subfamilia | Craft | Vision | Tokens |
| --- | --- | --- | --- | ---: |
| Renaissance | `fresco` | A · 100 | 4/4 | 42.936 |
| Brutalist | `signal` | A · 100 | 4/4 | 45.076 |
| Paper Craft | `picnic` | A · 100 | 4/4 | 32.306 |
| Art Deco | `cinema` | A · 100 | 4/4 | 38.260 |
| Isotype | `vienna` | A · 100 | 4/4 | 49.795 |
| Op Art | `interference` | A · 100 | 4/4 | 36.090 |
| Ukiyo-e | `prussian` | A · 100 | 4/4 | 43.167 |
| Bestiary | `lapis` | A · 100 | 4/4 | 21.296 |
| Psychedelic | `magenta` | A · 100 | 4/4 | 43.346 |
| Memphis | `cobalt` | A · 100 | 4/4 | 46.631 |
| Vaporwave | `chrome` | A · 100 | 4/4 | 53.833 |
| Galactic | `orbital` | A · 100 | 4/4 | 28.492 |

Total: **12/12 A/100 + vision 4/4**, **481.228 tokens**. La matriz también se validó con `node dist/cli.js validate` después de generar los doce archivos. El informe de arte/editorial está en [`docs/STYLE-REVIEW-2026.md`](STYLE-REVIEW-2026.md).

La lección de la ronda: el modelo no necesita saber CSS; necesita un brief concreto, un estilo y una validación que le devuelva el fix. La varianza de tokens (21k–54k) muestra que el brief y la longitud de la página importan más que el estilo.

