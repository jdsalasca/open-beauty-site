# Renaissance · piezas halladas en un fresco

## Intención

Un arco desplazado organiza un fresco de yeso, verdaccio, polvo azul y cinabrio. Cuatro fragmentos pintados conservan su identidad: aparecen sin asiento, se reúnen y terminan dentro del arco en una composición estable y asimétrica. La pieza principal se dibuja como pintura plana con motivos distintos; no usa sombras, marcos de papel, viñeta ni glow radial.

## Composiciones

- **comparison · Piezas del arco:** emplea `card-collection`. Los cuatro fragmentos tienen IDs persistentes y su pertenencia al registro cambia de ninguna pieza a una pieza y luego a las cuatro. El arco y los campos de pintura permanecen fijos. No se presenta un número porque esta historia describe orden, no un conteo solicitado.
- **checklist · Cuenta del fresco:** emplea `counter`. Los paneles A–D conservan su identidad; las relaciones `counts` fijan los valores 1, 2 y 4. El número grande solo cambia cuando cambian esas relaciones y el brief declara el valor correspondiente.

Las pausas muestran estados estables. El movimiento de transición desplaza y asienta los mismos fragmentos, y el último puente devuelve cada pieza a su ubicación inicial para cerrar el loop.

## Tipografía y límites

- Display y anotación: EB Garamond. Lectura y etiqueta: los roles tipográficos Renaissance ya registrados en el preset.
- Título, cuerpo y etiqueta conservan los mínimos globales de 56px, 36px y 24px a 1280×720. La única anotación de arte, `PIEZA`/`FRAGMENT`, usa 32px nativos (16px efectivos a 640×360). El contador usa una cifra de mayor tamaño.
- El marco de arte reservado es 45% × 90% = 40.5% del lienzo. El arco ocupa ese campo sin centrar el conjunto como una portada.
- 16:9 está cubierto por las pruebas semánticas en español e inglés. Los otros aspectos conservan fallback semántico hasta tener prueba de render y decodificación propia.

## Evidencia reproducible

- Renderer y regiones de objeto: [`renaissance.ts`](../../../src/narrative/scenes/renaissance.ts).
- Composiciones: [`comparison`](../gallery/renaissance/comparison/) y [`checklist`](../gallery/renaissance/checklist/).
- Solo arte, sin título ni copy narrativo: [`comparison`](../art-only/renaissance/comparison/) y [`checklist`](../art-only/renaissance/checklist/).
- Prueba de render, transformación en píxeles decodificados y control negativo de texto-only: [`narrative-style-semantic.test.ts`](../../../test/narrative-style-semantic.test.ts).
- Registro de iteraciones, defectos y métricas: [`REVIEW-renaissance-ukiyoe.md`](../gallery/REVIEW-renaissance-ukiyoe.md).

El manifiesto mantiene `visual-review: pending` y `publicationRecommendation: none`: la revisión interna confirma cambios concretos de objeto, no reemplaza una aprobación independiente.
