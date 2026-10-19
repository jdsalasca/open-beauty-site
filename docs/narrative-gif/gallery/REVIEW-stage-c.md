# Revisión Stage C · cuatro estilos

**Estado visual:** `pending` en los ocho manifiestos. Esta revisión de implementación no es aprobación independiente ni habilita publicación.

## Método y registro de iteraciones

Se renderizaron de nuevo las ocho composiciones con seed fijo en cada ronda. En la ronda 3 se inspeccionaron las ocho hojas de contacto y 24 cuadros de pausa extraídos del GIF a 1280×720 (Antes, Cambio y Resultado esperado por composición). Se verificaron además los PNG estáticos, texto y pausa decodificada en cada manifest.

| Iteración | Hallazgos concretos | Ajuste aplicado |
|---|---|---|
| 1 | Renaissance: la etiqueta de fase ocre no llegaba al contraste requerido. Art Deco: el desplazamiento final de la placa apenas señalaba que se había asentado. Op Art: el cambio del centro de foco era demasiado sutil. | Etiqueta Renaissance en tinta; asiento Art Deco más abajo sobre el eje; mayor rango determinista para el desplazamiento de foco Op Art. |
| 2 | El manifest seguía calculando contraste como si la etiqueta Renaissance fuera ocre, aunque el PNG ya la mostraba en tinta (2.74:1 falso). En Isotype, la marca roja repetida en cada hoja competía con el indicador de categoría. | Se alineó el evaluator con el color realmente dibujado (13.53:1 para tinta) y se pasó la marca interior de los pictogramas a gris neutro; el rojo queda para el indicador/fila activa. |
| 3 | Las ocho hojas y los 24 cuadros nativos muestran copy completo y estable, sin solapamientos observados entre banda de lectura y arte. Permanecen dos límites a evaluar: los filetes de 1px y Poiret One pierden definición en Art Deco al reducir; el alto contraste óptico de Op Art puede cansar en lectura prolongada. | No se cambió la composición tras la tercera inspección. Se conservan los límites en las fichas de estilo y el fallback PNG Op Art. Se requiere valoración humana independiente antes de cerrar la revisión visual. |

## Medidas observadas

- Cada GIF decodifica a **1280×720**, 33 cuadros y **17.190 ms**. Cada fase queda visible **5.000 ms** en una imagen fija; las transiciones no cuentan como lectura. El puente Resultado→Antes es deliberado, no se denomina seamless.
- Los ocho GIF están por debajo de **6 MiB**; el README de galería consigna bytes exactos, rutas, tipografías y holds por composición.
- La caja de arte ocupa aproximadamente **42.3%** del cuadro para Renaissance e Isotype, **40.5%** para Art Deco y **40.6%** para Op Art. Es el cociente del bounding box del objeto/marco entre el cuadro completo, no el porcentaje de píxeles cubiertos.
- El layout comprueba títulos ≥56px, texto ≥36px y etiquetas ≥24px a tamaño nativo, con zona segura y sin colisión de cajas. A 640×360 la escala tipográfica se reduce a la mitad; el evaluator no hace OCR ni certifica lectura humana.
- `visual-review` permanece `pending`, `publicationRecommendation` es `none` y las fichas registran limitaciones. En Op Art cada composición exporta GIF animado y PNG fijo de Antes; la galería/reproductor debe sustituir el GIF por ese PNG cuando el usuario detenga la animación.

## Evidencia

- Índice de assets, manifests, métricas y medidas por composición: [`README.md`](README.md).
- Hojas y archivos finales: [`Renaissance`](renaissance/), [`Art Deco`](artdeco/), [`Isotype`](isotype/) y [`Op Art`](opart/).
- Límites y decisiones por estilo: [`renaissance.md`](../styles/renaissance.md), [`artdeco.md`](../styles/artdeco.md), [`isotype.md`](../styles/isotype.md), [`opart.md`](../styles/opart.md).

## Pendientes de revisión independiente

Confirmar lectura real en tarjeta de 640×360, fuerza de Poiret One y filetes Art Deco en pantallas pequeñas, tolerancia al patrón Op Art y correspondencia causal de cada transición. Hasta entonces no se aprueba visualmente ni se recomienda publicar.
