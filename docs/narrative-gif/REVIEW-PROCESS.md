# Revisión visual y ciclo de mejora

El ledger registra decisiones humanas o de modelos sobre archivos concretos. Los controles de integridad, estilo, legibilidad, narrativa y balance siguen separados: una métrica de píxeles no decide si una imagen es buena.

## 1. Generar el artefacto

Conserva el brief normalizado y su seed. Genera el pack como siempre:

```bash
beauty narrative --style papercraft --brief examples/recipes/papercraft/narrative.json --out out/papercraft
```

Abre el GIF completo, el PNG inicial y la hoja de contacto. Comprueba también la vista de tarjeta 640 × 360 y, si la transformación del objeto importa, compara los holds con el texto oculto. `beauty narrative --art-only` produce un pack separado para ese último examen.

## 2. Registrar una revisión

El reviewer debe identificarse de forma estable. El comando escribe `<pack>.review.json` junto al pack y conserva cada registro como historial. Los seis criterios visuales son obligatorios; los que no se envían quedan `not-evaluated`.

```bash
beauty review out/papercraft/guia.manifest.json --reviewer reviewer-17:Ada --criterion thumbnailIdentity=pass --criterion cardSizeReading=pass --criterion styleMaterial=pass --criterion phaseContinuity=pass --criterion loopRestart=pass --criterion artOnlyTransformationUnderstood=pass --level technical-integrity=pass --level style-conformance=pass --level rendered-legibility=pass --level narrative=pass --level visual-review=pass
```

Una revisión de modelo requiere `--reviewer-kind model`, `--model-id`, `--model-version` y `--model-criteria`. Un modelo independiente puede registrar una aprobación visual, pero nunca habilita `publicationRecommendation`. Para completar los cinco niveles, el reviewer evalúa esos niveles expresamente; no se copian automáticamente los resultados técnicos.

La revisión almacena SHA-256 del GIF y PNG, además de un hash canónico del manifiesto. Ese hash excluye los campos derivados de revisión (`reviewState`, recuentos y enlaces de feedback, recomendación y `evaluation.visual-review`) para evitar una dependencia circular; mantiene los datos del brief, renderer, evidencia, controles y `renderRevision`. Cada generación sobre un pack existente incrementa `renderRevision`, por lo que invalida la aprobación anterior aunque el render determinista conserve exactamente los mismos píxeles. El registro anterior permanece en el ledger y su estado se informa como `stale`.

## 3. Adjuntar feedback localizado

Cada comentario identifica fase, índice del frame, región en píxeles nativos, severidad, evidencia y ajustes permitidos. Ejemplo de `feedback.json`:

```json
[
  {
    "id": "fila-duplicada",
    "phaseId": "change",
    "frameIndex": 14,
    "region": { "x": 520, "y": 190, "w": 260, "h": 180 },
    "problem": "La segunda fila no se distingue a tamaño de tarjeta.",
    "severity": "major",
    "evidence": { "frameRef": 14 },
    "allowedAdjustment": "increase object size; do not change palette",
    "status": "open"
  }
]
```

Guarda y extrae frames con:

```bash
beauty review out/papercraft/guia.manifest.json --reviewer reviewer-17:Ada --feedback feedback.json --frames
```

El decodificador LZW independiente escribe el frame compuesto y el recorte de cada región en `guia.frames/`. Los enlaces relativos quedan en el manifiesto para que `beauty gallery <dir>` muestre la revisión, los comentarios abiertos y sus imágenes. Sin `--frames`, el ledger conserva el índice y la referencia, pero no crea imágenes de evidencia.

## 4. Comprobar estado y revisar el ciclo

```bash
beauty review-state out/papercraft/guia.manifest.json
beauty rerender out/papercraft/guia.manifest.json --apply-feedback
```

`rerender` vuelve a leer el brief normalizado y el seed guardados; no cambia copy, paleta ni entidades a partir de instrucciones libres. Registra hashes anterior/nuevo, frames y regiones que cambiaron según el decodificador, tiempo y bytes. Solo cambia feedback abierto a `fixed` cuando la región nativa del mismo frame contiene un cambio medido superior al umbral del comparador (`>0,1 %` de sus píxeles, con diferencia RGB acumulada mayor que 24). Sin esa evidencia conserva `open`. Cada nueva renderización invalida la aprobación anterior mediante `renderRevision`, incluso si sus píxeles son idénticos.

Después de ajustar el renderer o el brief de origen de forma deliberada, vuelve a generar y revisar el artefacto nuevo. No se infiere que un comentario está resuelto por haber vuelto a ejecutar el comando.

## Estados y recomendación

`reviewState` usa `none`, `pending`, `approved`, `revise` o `stale`. `approved` exige seis criterios en `pass`, hashes actuales y una identidad de reviewer distinta de `generatedBy`. La auto-revisión nunca aprueba. `publicationRecommendation` sigue en `none` salvo que una revisión humana independiente tenga los seis criterios y los cinco niveles en `pass`; entonces puede indicar `consider-publication`. Es una señal para deliberación humana, no una publicación ni autorización automática.

La identidad que genera el artefacto es `BEAUTY_GENERATOR_ID` si está definida; de lo contrario, `open-beauty-site`. Mantén ese identificador estable durante el render y declara al reviewer con otra identidad.
