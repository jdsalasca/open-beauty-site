# Memphis / ficha que se organiza

## Intención

Una ficha con keyline, sombra dura y una rotación protagonista se asienta al recibir una señal. El marcador azul recorre una única guía hacia su casilla. La onda rosa y las piezas geométricas pequeñas permanecen como marco controlado; no compiten con el documento.

## Composiciones

- `comparison`: ficha con líneas de medida, marcador que avanza hasta una casilla y marca de revisión al final.
- `checklist`: la misma ficha inclinada contiene tres pasos; una sola pieza gira hacia la grilla mientras las casillas se marcan en secuencia.
- Seedeado: cambia solo unos grados de inclinación inicial, acento y desplazamiento leve de las piezas de margen. El movimiento de transición conserva un único protagonista.

## Tipografía y límites

- Bricolage Grotesque para display; DM Sans para lectura, etiquetas y texto de ficha. Color de etiqueta usa tinta de alto contraste; el rosa queda en los bloques gráficos.
- Copy envuelto en columna propia; fases demasiado largas dan `TEXT_OVERFLOW` sin truncar.
- Admite 16:9 y 1:1. 9:16 devuelve `UNSUPPORTED_ASPECT` para evitar comprimir la ficha y el área de lectura.
- Campo visual de arte: 47% del ancho × 94% del alto = **44,18%** del cuadro; la proporción incluye el panel blanco. El área real de la ficha es menor y no se presenta como una medición segmentada.
- En 1280×720: título 76 px, cuerpo mínimo 36 px, etiqueta mínima 24 px; efectivo a 640×360: 38/20/14 px respectivamente.

## Rechaza

Confeti aleatorio, múltiples rotaciones simultáneas, paleta sin jerarquía, mover toda la decoración a la vez y casillas que no correspondan al avance.

## Evidencia y reproducción

- Escena y prueba: `src/narrative/scenes/memphis.ts`, `test/narrative-stage-c.test.ts`.
- Cada carpeta contiene brief, GIF, PNG, contacto y manifest: `docs/narrative-gif/gallery/memphis/comparison/` y `docs/narrative-gif/gallery/memphis/checklist/`.
- Contraste medido: 16,63:1. Tres holds de 5.000 ms; duración decodificada 17.190 ms; el reinicio es un puente deliberado, no se denomina seamless. Revisión visual pendiente.
- Reproducir: `pnpm dev narrative --style memphis --brief docs/narrative-gif/gallery/memphis/comparison/brief.json --out docs/narrative-gif/gallery/memphis/comparison` (cambiar `comparison` por `checklist`).
