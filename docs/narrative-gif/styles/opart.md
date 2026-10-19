# Op Art · agrupamiento óptico con banda inmóvil

## Intención

Negro y hueso producen el campo óptico; el rojo del preset queda como acento de fase en el relato. Las formas son geométricas y planas. La escena no usa papel, relieve, sombras, patrones finos ni movimiento continuo.

Los briefs contienen seis motivos ilustrativos, sin fuente ni cifra de producto. La composición muestra la transformación mediante agrupamiento y cambio de foco; no presenta un contador. Una banda negra central, rotulada `LECTURA`/`READING`, permanece quieta y cubre el campo para dejar una zona limpia de lectura.

## Composiciones

- **comparison:** seis blancos concéntricos en dos grupos de tres. El grupo inferior se desplaza hacia la derecha mientras sus anillos cambian gradualmente el foco; el grupo superior queda fijo.
- **checklist:** seis celdas de franjas anchas en dos grupos. El grupo inferior se desplaza y cambia la fase horizontal de sus franjas, sin líneas finas ni moiré sobre texto.

Las transformaciones se interpolan solo durante la transición. Cada hold queda estático; el GIF no destella ni anima el patrón durante las pausas. Las pruebas comparan regiones semánticas por motivo: una transformación real pasa; cambiar solo el título, fase o cuerpo no pasa. `card-collection` está soportado en los tres ratios y ambos idiomas (6 celdas), cubierto por render y prueba de píxeles decodificados. `table-rows` queda en fallback porque los motivos ópticos no representan registros; `counter` porque la escena es cualitativa; `file-download` porque progreso y reintento no pertenecen a este lenguaje.

Ambos briefs usan `badgePolicy: none`, resultado esperado y `illustrative: true`. La banda se localiza mediante el catálogo `src/narrative/i18n.ts`; el texto de usuario permanece fuera del campo óptico.

## Tipografía, contraste y fallback

Archivo Black 400 para display y Space Grotesk 400/500 para lectura y etiquetas. A 1280×720 se mantienen los pisos de 56 px para títulos, 36 px para cuerpo y 24 px para etiquetas. El rótulo interno de la banda es 32 px nativos (16 px efectivos a 640×360). El panel reservado mide 47% del ancho del cuadro y queda separado del carril de lectura.

El encoder exporta GIF, una hoja de contacto y un PNG estático por cada brief y modo. El PNG art-only muestra el hold inicial `Antes`; la transformación se juzga en los holds del GIF art-only, incluido el resultado, sin texto narrativo. El PNG ofrece un patrón quieto de fallback cuando un reproductor no puede detener el GIF. La inspección visual no certifica accesibilidad independiente.

## Recursos regenerados

- **comparison:** [brief](../gallery/opart/comparison/brief.json), [GIF](../gallery/opart/comparison/cambios-que-se-revisan-b1b5690b.gif), [PNG](../gallery/opart/comparison/cambios-que-se-revisan-b1b5690b.png), [contacto](../gallery/opart/comparison/cambios-que-se-revisan-b1b5690b-contact-sheet.png), [manifest](../gallery/opart/comparison/cambios-que-se-revisan-b1b5690b.manifest.json). Art-only: [GIF](../gallery/opart/comparison/cambios-que-se-revisan-b1b5690b-art-only.gif), [PNG fijo](../gallery/opart/comparison/cambios-que-se-revisan-b1b5690b-art-only.png), [contacto](../gallery/opart/comparison/cambios-que-se-revisan-b1b5690b-art-only-contact-sheet.png), [manifest](../gallery/opart/comparison/cambios-que-se-revisan-b1b5690b-art-only.manifest.json).
- **checklist:** [brief](../gallery/opart/checklist/brief.json), [GIF](../gallery/opart/checklist/ruta-para-revisar-el-cierre-b4535b83.gif), [PNG](../gallery/opart/checklist/ruta-para-revisar-el-cierre-b4535b83.png), [contacto](../gallery/opart/checklist/ruta-para-revisar-el-cierre-b4535b83-contact-sheet.png), [manifest](../gallery/opart/checklist/ruta-para-revisar-el-cierre-b4535b83.manifest.json). Art-only: [GIF](../gallery/opart/checklist/ruta-para-revisar-el-cierre-b4535b83-art-only.gif), [PNG fijo](../gallery/opart/checklist/ruta-para-revisar-el-cierre-b4535b83-art-only.png), [contacto](../gallery/opart/checklist/ruta-para-revisar-el-cierre-b4535b83-art-only-contact-sheet.png), [manifest](../gallery/opart/checklist/ruta-para-revisar-el-cierre-b4535b83-art-only.manifest.json).

## Evidencia y límites de revisión

- Renderer semántico: [`opart.ts`](../../../src/narrative/scenes/opart.ts) y [`semantic-art.ts`](../../../src/narrative/scenes/opart/semantic-art.ts).
- Pruebas: [`narrative-semantic-style-render.test.ts`](../../../test/narrative-semantic-style-render.test.ts), [`narrative-capabilities.test.ts`](../../../test/narrative-capabilities.test.ts) y [`narrative-gallery-repro.test.ts`](../../../test/narrative-gallery-repro.test.ts).
- Las tres iteraciones con hojas de contacto y frames nativos están en [`REVIEW-isotype-opart.md`](../gallery/REVIEW-isotype-opart.md). La inspección del implementador permanece separada de aprobación independiente; todos los manifiestos mantienen `visual-review: pending`.
