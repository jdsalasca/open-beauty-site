# Bestiary / folio de observación

## Intención

Un búho ilustrado en tinta ocupa el folio junto a una inicial, filetes y marginalia. El disco facial funciona como metáfora visual de atención y revisión; no se atribuye al animal un dato biológico ni una propiedad de medición. La misma criatura permanece en todas las fases.

## Composiciones

- `comparison`: una línea marginal nombra el disco; al aparecer la señal se añade “FOCO” y el anillo lapislázuli encuadra el mismo disco facial.
- `checklist`: la criatura se mantiene y el folio avanza por “OBSERVAR”, “ENMARCAR” y “REVISAR”, marcando cada paso alcanzado.
- La variación determinista solo ajusta levemente el plumaje. No sustituye la criatura ni altera el significado de las notas.

## Tipografía y límites

- UnifrakturMaguntia se reserva para el título breve y la inicial. IM Fell English se usa para lectura, etiquetas y anotaciones.
- El copy principal se envuelve dentro de su columna; la ilustración empieza en el 50% del ancho. El error `TEXT_OVERFLOW` conserva una sugerencia si una palabra o fase no cabe.
- Admite 16:9 y 1:1. 9:16 devuelve `UNSUPPORTED_ASPECT` para evitar que el folio y el copy se compriman o deformen.
- Campo visual de arte: 47% del ancho × 94% del alto = **44,18%** del cuadro; incluye papel de fondo y filetes, no es el área segmentada del búho.
- En 1280×720: título 76 px, cuerpo mínimo 36 px, etiqueta mínima 24 px; efectivo a 640×360: 38/20/14 px respectivamente.

## Rechaza

Cambiar una silueta genérica sin relación con el copy, redactar párrafos en blackletter y convertir la metáfora en afirmación científica. Las anotaciones son breves; el cuerpo de lectura permanece en IM Fell.

## Evidencia y reproducción

- Escena y prueba: `src/narrative/scenes/bestiary.ts`, `test/narrative-stage-c.test.ts`.
- Briefs, GIF, PNG, contacto y manifiesto por composición: `docs/narrative-gif/gallery/bestiary/comparison/` y `docs/narrative-gif/gallery/bestiary/checklist/`.
- Cada manifiesto decodifica tres holds de 5.000 ms, 17.190 ms de duración total y revisión visual pendiente. La aprobación estética y de publicación no se infiere del decodificador.
- Reproducir: `pnpm dev narrative --style bestiary --brief docs/narrative-gif/gallery/bestiary/comparison/brief.json --out docs/narrative-gif/gallery/bestiary/comparison` (cambiar `comparison` por `checklist`).
