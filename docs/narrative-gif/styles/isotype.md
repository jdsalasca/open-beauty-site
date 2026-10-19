# Isotype · pictogramas contables

## Intención

El pictograma humano es la unidad que se cuenta. Papel crema, tinta negra, un acento rojo, reglas abiertas y dibujos planos conservan la identidad Isotype; la escena no imita cartón ni agrega sombras o volumen ajenos a la guía.

Los briefs actuales son explícitamente ilustrativos: seis pictogramas corresponden a `6 / 6`, sin fuente de producto ni afirmación observada. El rótulo `ILUSTRATIVO` aclara el alcance. Si un brief aporta datos, las relaciones semánticas deben corresponder uno a uno con las unidades visibles y la fuente solo se muestra cuando el brief la entrega. No se infieren porcentajes, denominadores ni series.

## Composiciones

- **comparison:** seis unidades se agrupan en una matriz; una se marca en rojo y luego pasa a una zona de revisión separada. La colección conserva las seis unidades.
- **checklist:** cada pictograma ocupa una fila propia; la unidad seleccionada pasa a una franja roja inferior para revisión, mientras cinco filas quedan arriba. El contador conserva el total `6 / 6`.

`counter` y `card-collection` se implementan con regiones semánticas por entidad. `table-rows` usa fallback: el renderer no representa celdas ni acciones de fila; cada fila se expresa como una unidad contable. `file-download` usa fallback porque progreso, fallo y reintento no corresponden a este lenguaje de pictogramas. Las 12 celdas soportadas (dos primitivas × tres ratios × dos idiomas) tienen prueba de render y diferencia de píxeles decodificados; las demás conservan fallback o unsupported según el ratio.

Ambos briefs publicados están en español y usan `badgePolicy: none` y resultado esperado. Los renders de prueba cubren español e inglés a través del catálogo `src/narrative/i18n.ts`. La prueba negativa confirma que un cambio de título y copy, sin cambio del objeto, no aprueba el control semántico.

## Tipografía y límites

Jost 500 para display; IBM Plex Sans 400 para lectura y anotación; IBM Plex Sans 500 para etiquetas y cifras. A 1280×720 se conservan los pisos comunes de 56 px para títulos, 36 px para cuerpo y 24 px para etiquetas. El texto propio del objeto parte de 28 px y mantiene al menos 14 px efectivos a 640×360. El panel ocupa 45% del ancho del cuadro; las pausas muestran el cambio sin el relato.

## Recursos regenerados

- **comparison:** [brief](../gallery/isotype/comparison/brief.json), [GIF](../gallery/isotype/comparison/cambios-que-se-revisan-f5381181.gif), [PNG](../gallery/isotype/comparison/cambios-que-se-revisan-f5381181.png), [contacto](../gallery/isotype/comparison/cambios-que-se-revisan-f5381181-contact-sheet.png), [manifest](../gallery/isotype/comparison/cambios-que-se-revisan-f5381181.manifest.json). Modo sin relato: [GIF](../gallery/isotype/comparison/cambios-que-se-revisan-f5381181-art-only.gif), [PNG fijo](../gallery/isotype/comparison/cambios-que-se-revisan-f5381181-art-only.png), [contacto](../gallery/isotype/comparison/cambios-que-se-revisan-f5381181-art-only-contact-sheet.png), [manifest](../gallery/isotype/comparison/cambios-que-se-revisan-f5381181-art-only.manifest.json).
- **checklist:** [brief](../gallery/isotype/checklist/brief.json), [GIF](../gallery/isotype/checklist/ruta-para-revisar-el-cierre-9cfda0c7.gif), [PNG](../gallery/isotype/checklist/ruta-para-revisar-el-cierre-9cfda0c7.png), [contacto](../gallery/isotype/checklist/ruta-para-revisar-el-cierre-9cfda0c7-contact-sheet.png), [manifest](../gallery/isotype/checklist/ruta-para-revisar-el-cierre-9cfda0c7.manifest.json). Modo sin relato: [GIF](../gallery/isotype/checklist/ruta-para-revisar-el-cierre-9cfda0c7-art-only.gif), [PNG fijo](../gallery/isotype/checklist/ruta-para-revisar-el-cierre-9cfda0c7-art-only.png), [contacto](../gallery/isotype/checklist/ruta-para-revisar-el-cierre-9cfda0c7-art-only-contact-sheet.png), [manifest](../gallery/isotype/checklist/ruta-para-revisar-el-cierre-9cfda0c7-art-only.manifest.json).

`src/art.ts` también dejó de mostrar el antiguo `68%` y `SERIE / 01`; el arte de muestra ahora se rotula como ilustrativo y sin métrica.

## Evidencia y límites de revisión

- Renderer semántico: [`isotype.ts`](../../../src/narrative/scenes/isotype.ts) y [`semantic-art.ts`](../../../src/narrative/scenes/isotype/semantic-art.ts).
- Pruebas: [`narrative-semantic-style-render.test.ts`](../../../test/narrative-semantic-style-render.test.ts), [`narrative-capabilities.test.ts`](../../../test/narrative-capabilities.test.ts) y [`isotype-art-claims.test.ts`](../../../test/isotype-art-claims.test.ts).
- Las tres pasadas de render e inspección están registradas en [`REVIEW-isotype-opart.md`](../gallery/REVIEW-isotype-opart.md); la evaluación visual independiente sigue `pending`.
