<p align="center">
  <strong>open-beauty-site</strong><br>
  <em>A design harness for models that can't design.</em>
</p>

<p align="center">
  <img alt="CI" src="https://github.com/jdsalasca/open-beauty-site/actions/workflows/ci.yml/badge.svg">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-0B0B0B">
  <img alt="node" src="https://img.shields.io/badge/node-%3E%3D22-0B0B0B">
  <img alt="MCP" src="https://img.shields.io/badge/MCP-stdio-D8FF00">
</p>

---

**ES** — Un harness de diseño en TypeScript con servidor MCP. Le das a un modelo un brief corto y devuelve una página HTML completa o un GIF, con tipografía, paleta, bordes, movimiento y validación ya decididos. La IA escribe el contenido; el sistema escribe el gusto.

**EN** — A TypeScript design harness with an MCP server. Give a small model a short brief and get a complete HTML page or looping GIF with typography, palette, borders, motion and a validator already decided. The model writes content; the system writes taste.

![Brutalist example](examples/previews/brutalist.png)

## Por qué existe

Los modelos chicos pueden escribir un buen titular. Lo que no pueden hacer de forma consistente es elegir una tipografía, un acento, un ancho de borde y un ritmo de animación que funcionen juntos. El resultado típico es la estética "IA genérica": Inter, tarjetas redondeadas, degradados violetas, todo centrado, nada recordado.

Este repo mueve esas decisiones a tres sistemas editoriales completos. El modelo solo tiene que elegir uno, escribir contenido real y llamar a una herramienta.

- **Sin LLM en runtime.** El render es determinista: brief + preset → HTML/GIF.
- **Sin plantillas genéricas.** Cada estilo tiene su propio layout, no un recoloreo.
- **Con validador.** Un página que se sale de la línea editorial se detecta y se corrige antes de publicar.
- **Un solo archivo.** El HTML es autocontenido; el GIF se genera con canvas y `gifenc`.

## Los tres estilos

| Renaissance | Brutalist | Paper Craft |
| --- | --- | --- |
| <img src="examples/previews/renaissance.png" width="280" alt="Renaissance example"> | <img src="examples/previews/brutalist.png" width="280" alt="Brutalist example"> | <img src="examples/previews/papercraft.png" width="280" alt="Paper Craft example"> |
| Pergamino, tinta, oro. Simetría, arco, capitular. Lento y digno. | Papel, tinta, ácido. 3px, sombras duras, marquee. Ruidoso. | Crema, kraft, washi tape. Capas, recortes, flotación. Cálido. |
| `Crimson Text` | `Archivo Black` + `Space Mono` | `DM Serif Display` + `Lato` |

Cada estilo incluye tokens exactos, reglas de layout, recetas de componentes, voz de copy y una lista de "nunca". Están en [`docs/STYLEGUIDE.md`](docs/STYLEGUIDE.md) y en las skills de [`skills/`](skills/).

### GIFs

| Renaissance | Brutalist | Paper Craft |
| --- | --- | --- |
| <img src="examples/gifs/renaissance.gif" width="240" alt="Renaissance GIF"> | <img src="examples/gifs/brutalist.gif" width="240" alt="Brutalist GIF"> | <img src="examples/gifs/papercraft.gif" width="240" alt="Paper Craft GIF"> |

Los tres salen del mismo comando que las páginas y comparten la línea editorial.

## Quickstart

Requisitos: Node ≥ 22, pnpm, Git.

```bash
git clone https://github.com/jdsalasca/open-beauty-site.git
cd open-beauty-site
pnpm install
pnpm build

# ver los estilos
node dist/cli.js styles

# crear una página
node dist/cli.js page \
  --style brutalist \
  --title "LUNA / SIGNAL" \
  --tagline "A transmission from the other side of the prompt." \
  --intro "We build signals for people who are tired of being talked to." \
  --out out/luna.html

# crear un GIF
node dist/cli.js gif \
  --style papercraft \
  --text "Taller Papel" \
  --subtitle "Hecho a mano" \
  --out out/taller.gif

# auditar
node dist/cli.js validate out/luna.html --style brutalist --strict
```

También podés generar los tres ejemplos completos:

```bash
pnpm examples
```

## MCP

El servidor habla stdio y expone siete herramientas. Está pensado para que un modelo débil no tenga que adivinar nada.

```bash
node dist/mcp/server.js
```

### Claude Code

```bash
claude mcp add -s user open-beauty -- node "C:/absolute/path/open-beauty-site/dist/mcp/server.js"
```

### Codex

```toml
[mcp_servers.open_beauty]
command = "node"
args = ["C:/absolute/path/open-beauty-site/dist/mcp/server.js"]
startup_timeout_sec = 30.0
```

### Cursor / genérico

```json
{
  "mcpServers": {
    "open-beauty": {
      "command": "node",
      "args": ["C:/absolute/path/open-beauty-site/dist/mcp/server.js"]
    }
  }
}
```

### Herramientas

| Tool | Qué hace |
| --- | --- |
| `beauty_list_styles` | Lista los tres estilos y para qué sirve cada uno. |
| `beauty_get_style` | Devuelve tokens exactos, reglas y do/don't. Es la fuente de verdad. |
| `beauty_get_skill` | Devuelve la skill lista para pegar en el contexto del agente. |
| `beauty_create_page` | Crea una página completa y la escribe a disco. |
| `beauty_create_gif` | Crea un GIF con el mismo estilo. |
| `beauty_validate` | Audita un HTML y devuelve score, grade y fixes. |
| `beauty_examples` | Devuelve las rutas de los ejemplos de referencia. |

Recursos: `beauty://styles/{renaissance|brutalist|papercraft}` y `beauty://skills/beauty.md`.

El servidor manda instrucciones al conectarse: listar estilos → leer el estilo → crear con copy real → validar hasta A. La misma secuencia está en [`skills/beauty.md`](skills/beauty.md).

## Validación

El validador no es un navegador; es un auditor de la línea editorial. Detecta los errores que cometen los modelos:

```text
A · 100/100 · brutalist
No issues. The page respects the editorial system.
stats: {"bytes":15605,"colors":7,"fonts":["Space Mono","Archivo Black"],"radii":[],"durations":[0.25,0.3,0.45]}
```

Y cuando algo está mal:

```text
[error] forbidden-font: "Inter" is forbidden in Brutalist.
  fix: Use Archivo Black for display and Space Mono for text.
[warn] radius-out-of-range: border-radius 8px is outside Brutalist's 0–0px range.
  fix: Use border-radius:0px (or none).
[error] soft-shadow-in-brutalist: Brutalist shadows must have zero blur.
```

Chequea fuentes, colores, bordes, radios, sombras, motion, landmarks, placeholders y contraste de los pares que el estilo usa para texto.

## Probado con modelos reales

No es una demo teórica. Dos agentes distintos, dos estilos distintos, sin HTML escrito a mano:

| Agente | Estilo | Resultado | Evidencia |
| --- | --- | --- | --- |
| Codex CLI 0.163 · `gpt-6-luna` · effort `max` | Brutalist | **A · 100/100** | [`examples/agents/luna-brutalist.html`](examples/agents/luna-brutalist.html) |
| `colmena-mcp` · worker `luna-max` | Paper Craft | **A · 100/100** | [`examples/agents/luna-papercraft.html`](examples/agents/luna-papercraft.html) |
| `colmena-mcp` · worker `max-hive` · LongCat 2.5 free | Renaissance | **A · 100/100** | [`examples/agents/hive-renaissance.html`](examples/agents/hive-renaissance.html) |

Luna llamó las cuatro herramientas MCP en orden, recibió el brief y el sistema hizo el resto. El modelo gratuito ni siquiera usó MCP: le alcanzó con dos comandos del CLI. El detalle de los runs está en [`docs/TESTING.md`](docs/TESTING.md).

## Cómo funciona

```
brief + style ──► preset ──► renderer ──► HTML ──► validator ──► score + fixes
                     │
                     └────► canvas frames ──► gifenc ──► GIF
```

- `src/styles/presets.ts` — los tres sistemas como datos: paleta, fuentes, reglas, guía.
- `src/page/*.ts` — un renderer por estilo, con CSS y markup propios.
- `src/validate.ts` — auditoría y scoring.
- `src/gif.ts` — frames con `@napi-rs/canvas`, encoding con `gifenc`.
- `src/mcp/server.ts` — el servidor MCP.
- `src/cli.ts` — la misma funcionalidad desde la terminal.
- `skills/` — la mitad en lenguaje natural del harness.

Más detalle en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) y [`docs/MCP.md`](docs/MCP.md).

## Estructura

```text
open-beauty-site/
├── src/            # presets, renderers, validator, GIF, MCP, CLI
├── skills/         # beauty.md + una skill por estilo (generadas)
├── docs/           # style guide, MCP, arquitectura, testing
├── examples/       # 3 páginas, 3 GIFs, previews y outputs de agentes
├── fonts/          # TTFs OFL para los GIFs
├── scripts/        # build de ejemplos, docs, QA y e2e con colmena
└── test/           # tests de core y MCP
```

## Roadmap

- [ ] Más estilos: swiss editorial, art déco, risograph, cine negro.
- [ ] Secciones opcionales: galería, tabla de precios, FAQ, formulario.
- [ ] `beauty_create_social` para carruseles y OG images.
- [ ] Self-hosting de fuentes en el HTML para uso offline.
- [ ] Publicación en npm (`npx open-beauty-site`).
- [ ] Tests de accesibilidad con axe.

## Contribuir

Las contribuciones son bienvenidas. Si agregás un estilo, tiene que pasar el validador en A, tener su skill generada y un ejemplo visual. Leé [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licencia

MIT. Las fuentes incluidas son OFL: Crimson Text, Archivo Black, Space Mono, DM Serif Display y Lato. Las licencias están en [`fonts/`](fonts/).

Hecho con demasiado café en Buenos Aires.
