# Psychedelic / flujo hacia el foco

## Intención

Tres bandas líquidas de color intenso convergen hacia un disco crema, fijo y sobrio. En `comparison`, las curvas tensas y la forma señalada se organizan alrededor del foco. En `checklist`, la guía pasa de una curva abierta a tres bandas ordenadas; una esfera degradada se desplaza pegada a la banda naranja, como señal que llega al punto de lectura.

## Composiciones

- `comparison`: bandas curvas y forma señalada se ordenan alrededor del disco “REVISIÓN”.
- `checklist`: tres recorridos se nivelan por pasos; la esfera de señal sigue conectada a la ruta naranja.
- El disco de lectura no se desplaza ni se deforma. Los holds son imágenes estáticas; el color y la geometría cambian solo en las transiciones.

## Tipografía y límites

- Bungee Shade solo se usa en el título breve. Space Grotesk se usa para lectura, etiqueta y anotación. Las etiquetas usan el color de tinta para conservar contraste medido.
- El copy ocupa una columna separada del campo visual. Se envuelve sin pérdida y una fase impracticable devuelve `TEXT_OVERFLOW` con sugerencia.
- Admite 16:9 y 1:1. 9:16 devuelve `UNSUPPORTED_ASPECT`; no se comprime el disco estable dentro del copy.
- Campo visual de arte: 47% del ancho × 94% del alto = **44,18%** del cuadro, incluido el fondo púrpura. La huella de bandas y disco no se contabiliza como área opaca del objeto.
- En 1280×720: título 76 px, cuerpo mínimo 36 px, etiqueta mínima 24 px; efectivo a 640×360: 38/20/14 px respectivamente.

## Rechaza

Saturación uniforme, blobs desconectados del recorrido, oscilación durante los holds, mover el área de lectura y distorsionar letras para simular movimiento.

## Evidencia y reproducción

- Escena y prueba: `src/narrative/scenes/psychedelic.ts`, `test/narrative-stage-c.test.ts`.
- GIF, PNG, contacto y manifiesto de cada composición: `docs/narrative-gif/gallery/psychedelic/comparison/` y `docs/narrative-gif/gallery/psychedelic/checklist/`.
- Contraste medido del copy y etiqueta: 13,71:1. Tres holds por pieza: 5.000 ms cada uno; duración decodificada: 17.190 ms. `visual-review` queda pendiente.
- Reproducir: `pnpm dev narrative --style psychedelic --brief docs/narrative-gif/gallery/psychedelic/comparison/brief.json --out docs/narrative-gif/gallery/psychedelic/comparison` (cambiar `comparison` por `checklist`).
