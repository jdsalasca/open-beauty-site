# Isotype · categorías cualitativas

## Intención

Papel crema, reglas visibles y pictogramas planos usan el documento como unidad repetible. La pieza no recibe datos cuantitativos: cada brief se muestra explícitamente como `CATEGORÍAS CUALITATIVAS` y `SIN MÉTRICA`. Hay exactamente una unidad por fase del brief, no una población ni un porcentaje inventado. El único acento rojo identifica la categoría activa.

## Composiciones

- **comparison:** pictogramas de documento ordenados en una tabla abierta; el registro rojo se desplaza entre las categorías Antes, Cambio y Esperado/Observado.
- **checklist:** la misma correspondencia exacta se presenta como filas de proceso, con icono a la izquierda y un contorno rojo sobre la fila activa.

Ambas composiciones usan una sola familia de pictogramas. No agregan cantidades, denominadores, fuentes, fechas o series que el brief no suministra.

## Tipografía y límites

Jost 500 para display; IBM Plex Sans 400 para lectura y anotación; IBM Plex Sans 500 para etiquetas y cifras. Los símbolos son dibujos propios, no emoji ni iconos de paquete. La tabla visible ocupa aproximadamente 42.3% del cuadro. Se admiten 16:9, 1:1 y 9:16.

Este renderer trata las fases como categorías, no acepta una fuente de datos estructurada y no debe usarse para comunicar una cantidad observada. Si el brief incorpora datos en otra evolución, debe proporcionar su cantidad, denominador y fuente antes de dibujar pictogramas cuantitativos.

## Rechaza

Personas decorativas con cantidades arbitrarias, 68%, `SERIE 01`, porcentajes sin denominador, unidades rojas repetidas como decoración, sombras, degradados y movimiento que cambie la interpretación de la correspondencia.

## Evidencia

- Renderer: [`src/narrative/scenes/isotype.ts`](../../../src/narrative/scenes/isotype.ts).
- Composiciones y briefs: [`comparison`](../gallery/isotype/comparison/) y [`checklist`](../gallery/isotype/checklist/).
- GIF, PNG, contacto y manifest: [`galería Isotype`](../gallery/README.md).
- Iteraciones y observaciones: [`REVIEW-stage-c.md`](../gallery/REVIEW-stage-c.md).
- `visual-review` permanece `pending`; la inspección no simula validación de datos ni aprobación independiente.
