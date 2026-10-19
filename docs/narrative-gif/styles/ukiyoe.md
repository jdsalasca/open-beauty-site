# Ukiyo-e / recorrido costero

## Intención

Planos de papel, cielo vacío, horizonte fijo y azul Prusia. El mismo bote viaja desde una medida sin señal hasta un punto de revisión; la ruta explica el cambio. Una cartela en español identifica el punto, sin glifos japoneses de relleno.

## Composiciones

- `comparison`: bote, punto de referencia fijo y recorrido punteado que se completa entre Antes, Cambio y Resultado esperado/observado.
- `checklist`: conserva horizonte y bote; tres marcas de costa aparecen en orden para mostrar el proceso.
- La variación por seed se limita a desplazamientos pequeños de ola y bote. No cambia la historia ni la posición del horizonte.

## Tipografía y límites

- Display: Shippori Mincho B1. Lectura, etiqueta y anotación latina: Zen Kaku Gothic New. Se usa copy latino; no se simulan textos japoneses.
- El copy principal se envuelve en una columna de 43% del lienzo; el campo de ilustración empieza en 50%. Fuente muy larga o fase que no cabe produce `TEXT_OVERFLOW` con sugerencia; no se recorta.
- Admite 16:9 y 1:1. 9:16 devuelve `UNSUPPORTED_ASPECT`: esta disposición necesita copy a la izquierda y recorrido horizontal a la derecha.
- Campo visual de arte: 47% del ancho × 94% del alto = **44,18%** del cuadro. Es la huella del campo, no una segmentación de los píxeles de las figuras.
- En 1280×720: título 76 px, cuerpo mínimo 36 px, etiqueta mínima 24 px. Manifiesto: tamaño efectivo en tarjeta 640×360: título 38 px, cuerpo 20 px, etiqueta 14 px.

## Rechaza

Símbolos japoneses sin significado, sakura de relleno, olas sobre el copy, cambio de horizonte entre fases y recorridos que no conectan bote con punto de referencia.

## Evidencia y reproducción

- Escena y prueba: `src/narrative/scenes/ukiyoe.ts`, `test/narrative-stage-c.test.ts`.
- Brief, GIF, PNG, contacto y manifiesto de cada variante: `docs/narrative-gif/gallery/ukiyoe/comparison/` y `docs/narrative-gif/gallery/ukiyoe/checklist/`.
- En cada contacto se etiquetan inicio, pausa, punto medio de transición, salida y reinicio del loop. Los manifiestos registran tres holds decodificados de 5.000 ms; revisión visual y recomendación de publicación siguen pendientes.
- Reproducir: `pnpm dev narrative --style ukiyoe --brief docs/narrative-gif/gallery/ukiyoe/comparison/brief.json --out docs/narrative-gif/gallery/ukiyoe/comparison` (cambiar `comparison` por `checklist`).
