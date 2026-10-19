# Galactic / trayectoria y escala

## Intención y composiciones

Usa espacio negativo, escala, órbitas y una trayectoria con destino. El planeta sangra por el borde derecho y no se centra detrás del texto. Un marcador luminoso recorre una relación espacial entre fases; hay pocas estrellas y ningún audio.

- `comparison` dibuja una curva discontinua y mueve una señal hasta una órbita de revisión.
- `checklist` convierte la relación en tres hitos (`OBSERVAR`, `ANOTAR`, `ARCHIVAR`) conectados al mismo recorrido.
- Michroma se usa en el título; Space Grotesk, en lectura, hitos y etiquetas. La semilla varía escala del planeta, inclinación orbital y posiciones/tamaños/opacidades de once estrellas; mantiene el destino y la progresión.

## Rechaza

- Planetas ornamentales detrás del texto o composición centrada.
- Tantos elementos que se pierdan escala y espacio negativo.
- Audio, trayectorias sin propósito o un cambio que solo recoloree el cielo.

## Límites y evidencia

- Solo admite 16:9; 1:1 y 9:16 se rechazan sin recorte ni deformación.
- Área reservada: 45% del ancho × 90% del alto = 40,5% del fotograma, x=51–96%, y=5–95%. En el PNG final, píxeles distintos del fondo (>24 en algún canal RGB): 7,0% del fotograma en `comparison` y 7,1% en `checklist` (17,2% y 17,6% del área reservada). Es un proxy de color, no el tamaño perceptual del planeta y las órbitas.
- Layout a 1280×720: título 69 px, cuerpo ≥36 px y etiqueta ≥24 px. Escala calculada a 640×360: título 34,5 px, cuerpo mínimo 20 px y etiqueta mínima 14 px.
- Renderer: `src/narrative/scenes/galactic.ts`; pruebas: `test/narrative-stage-c.test.ts`.
- Briefs, GIF, PNG, contacto y manifiestos: `docs/narrative-gif/gallery/galactic/`.
- Tres rondas de inspección y defectos: `docs/narrative-gif/gallery/REVIEW-stage-c-vaporwave-galactic-nature.md`.

La baja ocupación de píxeles preserva el vacío; las etiquetas de hitos se acercan visualmente al disco. No se midió lectura en dispositivos reales. Evaluación visual independiente: `pending`.
