---
name: open-beauty-narrative
description: Choose and review a narrative GIF workflow with honest status, decoded timing and separate evaluation levels.
---

# Narrativa GIF: elegir la ruta y revisar la salida

## Árbol de decisión

| Necesitas | Usa | Qué produce |
| --- | --- | --- |
| Un artefacto rápido desde una idea de una frase | `beauty make <kind> --style <s> --idea "..."` | Una página, deck, GIF, story, experience o motion con valores iniciales sensatos. No conserva un contrato de fases de historia. |
| Una historia Antes → Cambio → Resultado con estado, holds y evidencia | `beauty narrative --style <s> --brief examples/recipes/<s>/narrative.json --out out/<s>` | GIF, PNG, hoja de contacto y manifiesto con cinco niveles de evaluación. |
| Varias escenas o cuadros dibujados explícitamente | `beauty sequence --style <s> --brief seq.json --out out/sequence` | SVG animado y GIF desde una secuencia de frames aportados por el brief. No crea la semántica ni el texto de tres fases por ti. |
| Un título corto o cartel en loop | `beauty gif --style <s> --text "Título breve" --out out/title.gif` | Un GIF editorial corto con título. No es una historia de progreso ni incluye niveles de evaluación narrativa. |

Si la narración necesita Antes, Cambio y Resultado esperado, empieza con
`beauty narrative`; no conviertas esas fases en un título decorativo.

## Estado: observado o esperado

- `status: "in-review"` o `status: "open"` termina con **Resultado esperado**.
- `status: "done"` solo es válido con **Resultado observado** y hechos que el
  brief pueda respaldar.
- No inventes métricas, ahorros, fechas, impacto o publicación. Si el trabajo
  sigue en revisión, describe una expectativa con futuro o condicional.

Cada fase conserva el mismo objeto visual y cambia su estado; escribe copy en
español claro y propio de la revisión de producto. Las recetas parten de una
review de una medida que debe quedar señalada para revisión, sin afirmar un
resultado medido.

## Diagnosticar texto que no cabe

`TEXT_OVERFLOW` indica que el motor no puede conservar todo el copy dentro del
área segura y los tamaños mínimos. El error incluye fase, texto completo y una
sugerencia, normalmente dividir una idea entre fases o acortar la redacción sin
perder el hecho. No reduce el tipo hasta volverlo ilegible, no corta palabras y
no borra líneas por su cuenta. Reescribe el brief, vuelve a renderizar y revisa
el PNG nativo y la vista 640 × 360.

## Cinco evaluaciones separadas

| Nivel | Qué comprueba | Límite |
| --- | --- | --- |
| `technical-integrity` | Decodificación GIF, dimensiones, frames, duración, loop y archivos. | Un archivo íntegro puede ser ilegible o estar mal compuesto. |
| `style-conformance` | Tokens, escena, fuentes registradas, cambio de frames y pérdida de paleta. | Una coincidencia de tokens no prueba parecido visual suficiente. |
| `rendered-legibility` | Copy completo, tamaños, contraste, área segura y pausas decodificadas. | OCR y lectura humana a 640 × 360 pueden seguir pendientes. |
| `narrative` | Cantidad de fases, estado, continuidad del objeto y etiqueta final. | El sentido causal y la veracidad necesitan revisión. |
| `visual-review` | Revisión humana o de un modelo visual identificado, con criterios y evidencia. | Empieza en `pending` y no cambia sin registrar esa revisión. |

Ningún nivel aprueba la publicación. `publicationRecommendation` permanece en
`none`. Valida el HTML de galería, mira las piezas en una pantalla real y deja
registrada aparte cualquier revisión visual.

## Comandos

```bash
beauty narrative --style papercraft --brief examples/recipes/papercraft/narrative.json --out out/papercraft
beauty gallery docs/narrative-gif --out docs/narrative-gif/GALLERY.html --title "Sprint Review"
beauty validate docs/narrative-gif/GALLERY.html --style papercraft --visual
pnpm narrative:recipes
```

`beauty gallery` lee composición, estado y niveles desde cada manifiesto. El
PNG se carga al abrir la página; el GIF solo se solicita después de pulsar
**Reproducir**. **Detener** vuelve al PNG. El diálogo nativo se cierra con Esc,
conserva el foco y muestra la imagen a su resolución declarada. No hay autoplay;
la preferencia `prefers-reduced-motion` se mantiene visible y respetada.
