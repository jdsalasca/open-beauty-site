# Ukiyo-e · viaje costero en planos

## Intención visual

Un campo de impresión en azul Prusia conserva cielo abierto, horizonte y referencia costera en coordenadas fijas. Nubes de tinta, cordillera distante y capas de mar ocupan el rectángulo con planos distintos. Un barco de escala protagonista lleva el cambio; el barco secundario del checklist queda bajo las etiquetas de estación. La cartela usa texto latino legible y no glifos de relleno.

## Composiciones

- **comparison · Travesía interrumpida:** emplea `file-download`. El archivo/bote pasa de pendiente a 55% de avance, falla allí y reintenta hasta 72% sin llegar a la referencia. El horizonte, el faro y la cartela no cambian de sitio. La pausa final mantiene explícito que la llegada sigue pendiente.
- **checklist · Estaciones de la costa:** emplea `card-collection`. Las estaciones A, B y C conservan identidad sobre la costa; la pertenencia cambia de cero a una y luego tres estaciones. El faro y el horizonte permanecen fijos. El bote secundario navega debajo del nombre A/B/C para dejar el texto del objeto despejado.
- Ambas composiciones usan `badgePolicy: none` porque el sello de estado no forma parte de esta estampa. `outcome: expected` y el carácter ilustrativo quedan en el manifiesto; no se presenta el ejemplo como evidencia observada.

## Tipografía, tamaño y balance

- Display: Shippori Mincho B1. Copy, estaciones, faro y cartela: Zen Kaku Gothic New. Todo el texto representado es latino.
- A 1280×720 el título es de 76px, el cuerpo supera 36px y las etiquetas superan 24px. Las palabras internas de la cartela se dibujan a 28px nativos (14px efectivos a 640×360).
- El campo costero mide 47% × 94% del lienzo, equivalente a 44,18% de área. El balance se mide sobre GIF decodificado: rectángulo vacío máximo **6,3%** en comparison y **9,4%** en checklist; ambas pasan el límite existente de 22%. No se alteró el umbral.
- La matriz solo declara `supported` las celdas 16:9 de `file-download` y `card-collection` para español e inglés. Los otros aspectos y primitivas conservan su fallback o estado anterior hasta tener render y decodificación probados.

## Evidencia reproducible

- Escena y regiones semánticas: [`ukiyoe.ts`](../../../src/narrative/scenes/ukiyoe.ts).
- Prueba bilingüe de render, cambio decodificado, balance, holds art-only y controles negativos: [`narrative-style-semantic.test.ts`](../../../test/narrative-style-semantic.test.ts).
- Briefs, GIF, PNG, contacto y manifiesto: [`comparison`](../gallery/ukiyoe/comparison/) y [`checklist`](../gallery/ukiyoe/checklist/).
- GIF y hoja de contacto sin copy narrativo: [`comparison`](../art-only/ukiyoe/comparison/) y [`checklist`](../art-only/ukiyoe/checklist/).
- Iteraciones observadas, métricas y pendientes: [`REVIEW-renaissance-ukiyoe.md`](../gallery/REVIEW-renaissance-ukiyoe.md).

Reproducción:

```powershell
pnpm dev narrative --style ukiyoe --brief docs/narrative-gif/gallery/ukiyoe/comparison/brief.json --out docs/narrative-gif/gallery/ukiyoe/comparison
pnpm dev narrative --style ukiyoe --art-only --brief docs/narrative-gif/gallery/ukiyoe/comparison/brief.json --out docs/narrative-gif/art-only/ukiyoe/comparison
```

El manifiesto conserva `visual-review: pending` y `publicationRecommendation: none`: la inspección de estas rondas no sustituye una revisión independiente.
