# Nature / archivo botánico de memoria

## Intención y composiciones

Presenta una hoja asimétrica original con nervaduras dentro de una lámina de herbario plana. La muestra conserva identidad mientras aparece una observación y progresa el registro. La etiqueta describe acciones, no especie, fecha, lugar ni procedencia; los briefs no aportan esos datos y el renderer no los inventa.

- `comparison` deja espacio a una llamada que apunta a una nervadura de la misma hoja y revela `EN REVISIÓN` o `ARCHIVADA`, según el estado.
- `checklist` alinea `OBSERVAR`, `ANOTAR`, `ARCHIVAR` junto a la hoja y marca cada acción según avanza.
- Cormorant Garamond se usa en títulos; Karla, en lectura, etiquetas y rótulos. La semilla varía silueta, ángulo leve y tono de lámina, sin añadir datos botánicos.

## Rechaza

- Flores anónimas de banco de imágenes o lámina vegetal genérica.
- Copiar la composición, recortes, sombras o capas de papercraft con otra paleta.
- Inventar taxonomía, fecha, ubicación o procedencia.

## Límites y evidencia

- Solo admite 16:9; 1:1 y 9:16 se rechazan sin recorte ni deformación.
- Lámina reservada: 45% del ancho × 90% del alto = 40,5% del fotograma, x=51–96%, y=5–95%. En el PNG final, píxeles distintos del fondo (>24 en algún canal RGB): 20,6% del fotograma en ambas composiciones (50,9% y 51,0% del área reservada).
- Layout a 1280×720: título 76 px, cuerpo ≥36 px y etiqueta ≥24 px. Escala calculada a 640×360: título 38 px, cuerpo mínimo 20 px y etiqueta mínima 14 px.
- Renderer: `src/narrative/scenes/nature.ts`; pruebas: `test/narrative-stage-c.test.ts`.
- Briefs, GIF, PNG, contacto y manifiestos: `docs/narrative-gif/gallery/nature/`.
- Tres rondas de inspección y defectos: `docs/narrative-gif/gallery/REVIEW-stage-c-vaporwave-galactic-nature.md`.

La hoja llena la lámina en vertical, pero los rótulos laterales usan una escala secundaria. No se verificó lectura en pantallas pequeñas. Evaluación visual independiente: `pending`.
