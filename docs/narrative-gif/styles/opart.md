# Op Art · cambio de foco inmóvil durante la lectura

## Intención

Negro y hueso construyen un patrón óptico de bandas anchas, junto a una banda negra de lectura. El patrón cambia el foco o agrupa sus líneas durante la transición; se detiene por completo en cada pausa. Ninguna línea pasa sobre título, etiqueta o cuerpo.

## Composiciones

- **comparison:** el conjunto de anillos concéntricos desplaza su centro de observación hacia una posición asentada.
- **checklist:** bandas rectangulares desfasadas se alinean en un mismo registro; las separaciones son amplias para evitar moiré fino.

El seed selecciona siete u ocho bandas y un desplazamiento acotado del foco. La escena no usa destellos, cambio de luminosidad por frame ni movimiento durante la pausa. La prueba de píxeles confirma que el patrón comparison cambia al menos 8% de sus píxeles entre Antes y Resultado.

## Tipografía, fallback y límites

Archivo Black 400 para display y cifra; Space Grotesk 400 para lectura y anotación; Space Grotesk 500 para etiquetas. Se admiten 16:9, 1:1 y 9:16. El patrón ocupa aproximadamente 40.6% del cuadro.

El GIF no puede pausarse. El PNG de cada composición es la imagen fija de `Antes` generada por el encoder y debe funcionar como fallback estático: un reproductor debe sustituir el GIF por ese PNG al detener la animación. Esta entrega produce ambos archivos; no implementa el reproductor ni controles de galería. El patrón sigue siendo de alto contraste y no reemplaza una revisión de accesibilidad.

## Rechaza

Moiré fino sobre copy, bandas que invaden el margen de lectura, destellos, parpadeo, movimiento continuo, cambios de fase durante la pausa y una promesa de “loop seamless”. El reinicio está etiquetado como puente deliberado.

## Evidencia

- Renderer: [`src/narrative/scenes/opart.ts`](../../../src/narrative/scenes/opart.ts).
- Composiciones y briefs: [`comparison`](../gallery/opart/comparison/) y [`checklist`](../gallery/opart/checklist/).
- GIF animado y PNG estático: [`galería Op Art`](../gallery/README.md).
- Iteraciones y observaciones: [`REVIEW-stage-c.md`](../gallery/REVIEW-stage-c.md).
- `visual-review` permanece `pending`; la inspección registrada no certifica accesibilidad ni sustituye aprobación independiente.
