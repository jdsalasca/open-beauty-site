# Renaissance · fresco narrativo

## Intención

Campos planos de yeso, polvo azul y verdaccio sostienen un arco desplazado. Un fragmento de cinabrio aparece fuera de orden, llega a una repisa y queda asentado en el registro. La escala del arco domina; solo hay una anotación, `PIEZA`. No se usan gradientes, glow, marcos de invitación ni simetría de portada.

## Composiciones

- **comparison:** arco asimétrico con un nicho y una repisa. La misma pieza roja se descubre abajo, se lleva a la repisa y se ordena en el nicho.
- **checklist:** el arco permanece, pero tres campos de catálogo organizan la pieza en una columna de lectura.

La variación del seed se limita al campo pastel, la curvatura del arco, el tamaño del fragmento y su asiento final. El evento se mueve con easing lento; el objeto y el copy permanecen inmóviles durante cada pausa.

## Tipografía y límites

EB Garamond 600 para display, etiqueta y cifra; EB Garamond 400 para lectura y anotación. La etiqueta de fase usa tinta para conservar contraste; el ocre queda en reglas y acentos pequeños. Se admiten 16:9, 1:1 y 9:16 sin deformar la composición. La placa ocupa 45% del ancho por 94% de alto del marco de arte; su caja visible equivale a aproximadamente 42.3% del cuadro completo.

La anotación es secundaria y pequeña. El texto de fase conserva 36px nativos como mínimo (18px a 640×360); los controles miden geometría y contraste, pero no sustituyen lectura humana a tamaño de tarjeta.

## Rechaza

Glow radial, viñetas, marcos nupciales, paletas saturadas, centrado automático, más de una anotación y movimiento de ornamentos durante la pausa.

## Evidencia

- Renderer: [`src/narrative/scenes/renaissance.ts`](../../../src/narrative/scenes/renaissance.ts).
- Composiciones y briefs: [`comparison`](../gallery/renaissance/comparison/) y [`checklist`](../gallery/renaissance/checklist/).
- GIF, PNG, contacto y manifest: [`galería Renaissance`](../gallery/README.md).
- Iteraciones y observaciones: [`REVIEW-stage-c.md`](../gallery/REVIEW-stage-c.md).
- La evaluación `visual-review` se conserva como `pending`; la inspección registrada no es aprobación independiente.
