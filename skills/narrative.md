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

## Consulta capacidades antes de escribir el brief

Usa `beauty capabilities --json` o MCP `beauty_get_capabilities` para conocer
las celdas por estilo × primitive × aspecto × idioma, sus motivos y los valores
permitidos de `visual.kind`, `visual.state` y `visual.action`. El motor rechaza
valores desconocidos antes de renderizar con alternativas válidas. Los estados
repetidos entre fases están permitidos cuando el relato lo requiere. Los trece
estilos tienen vocabulario declarado; por ahora ninguno declara acciones.

Los estados compartidos actuales son `unreviewed`, `flagged`, `review-ready` y
`reviewed`. `comparison` y `checklist` son composiciones declaradas; `document`
se conserva como alias de compatibilidad para `comparison`. La matriz marca
`fallback` cuando se renderiza la escena existente pero aún no representa la
semántica del primitive. No describas un fallback como una tabla, colección,
contador o descarga implementada.

## Estado de trabajo, resultado y evidencia

- `workflowStatus: open|in-review|done` describe el estado del trabajo. `done`
  por sí solo no afirma un beneficio observado.
- `outcome.mode: expected|observed` indica si el resultado es esperado o
  respaldado por evidencia. El motor deriva la etiqueta final localizada.
- `observed` requiere `evidenceRefs` con `id` y `label`, más un `scopeNote` que
  diga explícitamente qué no prueba la evidencia. Añade `source` y `date` cuando
  estén disponibles; no inventes cifras, mediciones ni citas.
- `illustrative: true` declara datos de ejemplo o demostración. Los briefs v1
  sin este campo migran a ilustrativos; para un resultado observado basado en
  evidencia usa `illustrative: false`.
- `status` sigue aceptado como alias v1 de `workflowStatus`. Si `done` aparece
  sin `outcome`, la migración produce `expected`, no `observed`.

Cada fase conserva el mismo objeto visual. Escribe copy breve y fiel a la
evidencia. `locale: en` también traduce el texto fijo de la ilustración; el
copy de fase escrito por el autor se conserva en el idioma proporcionado.

## Sellos y tiempo

- `badgePolicy` puede ser `workflow` (default compatible con v1), `none` o
  `custom`. `none` quita los sellos y marcas de estado del flujo; `custom`
  requiere `badgeText`.
- `playback.preset: readable` es el valor predeterminado y conserva el piso de
  5000 ms por pausa. `concise` permite `phases[].holdMs` desde 2000 ms. Todas
  las duraciones son números en milisegundos; no añadas unidades.
- Las pausas no equivalen al tiempo total. Transiciones, entradas y el puente
  de loop suman duración. El manifiesto v3 separa cada suma y cada hold por
  fase. Un aviso de lectura se activa sobre 3 palabras/segundo, usando
  `(palabras de etiqueta + palabras de texto) / segundos decodificados`.

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
| `narrative` | Cantidad de fases, estados declarados, continuidad del objeto, outcome y evidencia requerida. | El sentido causal y la veracidad necesitan revisión. |
| `visual-review` | Revisión humana o de un modelo identificado, con seis criterios visuales y evidencia ligada a hashes. | Empieza sin registro; una revisión independiente debe pasar los seis criterios para aprobarla. |

Los controles técnicos no sustituyen el juicio visual. `publicationRecommendation`
permanece en `none` salvo revisión humana independiente, los seis criterios
visuales en pass y los cinco niveles en pass. `consider-publication` es una
señal para deliberación humana, nunca una publicación automática.

## Registrar y resolver feedback

1. Genera y abre el GIF, el PNG, la hoja de contacto y la vista de tarjeta.
2. Registra cada criterio visual con `beauty review <pack> --reviewer id:name --criterion nombre=pass|revise|not-evaluated`. Los seis nombres son
   `thumbnailIdentity`, `cardSizeReading`, `styleMaterial`,
   `phaseContinuity`, `loopRestart` y `artOnlyTransformationUnderstood`.
3. Adjunta feedback JSON con `phaseId`, índice del frame, región nativa `{x,y,w,h}`,
   problema, severidad, evidencia y `allowedAdjustment`. Añade `--frames` para
   guardar el frame decodificado y su recorte en `<pack>.frames/`.
4. Usa `beauty review-state <pack>` para revisar hashes actuales. Un cambio en
   GIF, PNG o manifiesto estático marca el registro anterior `stale` y conserva
   su historial.
5. `beauty rerender <manifest> --apply-feedback` vuelve a renderizar con el
   brief normalizado y seed guardados. Solo marca `fixed` si los píxeles de la
   misma región/frame cambiaron por encima del umbral documentado; un render
   idéntico mantiene el comentario abierto.

El hash de manifiesto excluye únicamente campos derivados de revisión para
evitar una dependencia circular. Consulta el proceso completo y el JSON de
ejemplo en [`docs/narrative-gif/REVIEW-PROCESS.md`](../docs/narrative-gif/REVIEW-PROCESS.md).

## Comandos

```bash
beauty narrative --style papercraft --brief examples/recipes/papercraft/narrative.json --out out/papercraft
beauty capabilities --style papercraft --json
beauty gallery docs/narrative-gif --out docs/narrative-gif/GALLERY.html --title "Sprint Review"
beauty validate docs/narrative-gif/GALLERY.html --style papercraft --visual
pnpm narrative:recipes
```

`beauty gallery` lee composición, estado y niveles desde cada manifiesto. El
PNG se carga al abrir la página; el GIF solo se solicita después de pulsar
**Reproducir**. **Detener** vuelve al PNG. El diálogo nativo se cierra con Esc,
conserva el foco y muestra la imagen a su resolución declarada. No hay autoplay;
la preferencia `prefers-reduced-motion` se mantiene visible y respetada.

La guía de migración completa de briefs v1 y manifiestos v2/v3 está en
[`docs/narrative-gif/MIGRATION.md`](../docs/narrative-gif/MIGRATION.md).

## Flujo guiado y planificación

Antes de renderizar, usá `beauty plan --format gif --style <s> ...` para obtener capacidades, storyboard, avisos de contenido y esqueleto de brief. El flujo completo de ocho pasos está en [`skills/guided-workflow.md`](guided-workflow.md). Un A100 técnico no aprueba legibilidad, narrativa ni dirección de arte.
