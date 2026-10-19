# Vaporwave / archivo digital

## Intención y composiciones

Representa un escritorio fechado como artefacto visual: ventana de revisión, archivo persistente, horizonte y retícula en perspectiva. `ARCHIVO DEMO · 1999` marca una época ficticia de la interfaz; no afirma la fecha del Sprint Review. El archivo conserva su identidad al pasar del escritorio al panel.

- `comparison` mueve `LECTURA.TXT` a una fila de revisión y revela un panel de estado (`EN REVISIÓN` para `in-review`, `REVISADO` para `done`).
- `checklist` organiza tres acciones (`LECTURA.TXT`, `SEÑALAR`, `ARCHIVAR`); sus filas y marcas cambian con la fase y se completan para `done`.
- La semilla varía anchura de ventana, retícula y bandas del sol, sin cambiar identidad ni tapar texto. Press Start 2P se reserva a títulos y rótulos breves; Space Grotesk lleva lectura, estado y pies. Los párrafos nunca usan la fuente pixelada.

## Rechaza

- Nostalgia genérica sin artefacto identificable.
- Glitch que tape la lectura, datos falsos, porcentajes o métricas inventadas.
- Un cambio de color como único evento narrativo.

## Límites y evidencia

- Solo admite 16:9; 1:1 y 9:16 se rechazan sin recorte ni deformación.
- Área reservada: 45% del ancho × 90% del alto = 40,5% del fotograma, x=51–96%, y=5–95%. En el PNG final, píxeles que difieren del fondo (>24 en algún canal RGB): 23,9% del fotograma en `comparison` y 24,0% en `checklist` (59,0% y 59,3% del área reservada).
- Layout a 1280×720: título 65–69 px, cuerpo ≥36 px y etiqueta ≥24 px. Escala calculada a 640×360: título 32,5–34,5 px, cuerpo mínimo 20 px y etiqueta mínima 14 px.
- Renderer: `src/narrative/scenes/vaporwave.ts`; pruebas: `test/narrative-stage-c.test.ts`.
- Briefs, GIF, PNG, contacto y manifiestos: `docs/narrative-gif/gallery/vaporwave/`.
- Tres rondas de inspección y defectos: `docs/narrative-gif/gallery/REVIEW-stage-c-vaporwave-galactic-nature.md`.

La copia principal se conserva completa; los rótulos secundarios pueden perder comodidad en una tarjeta pequeña. Evaluación visual independiente: `pending`.
