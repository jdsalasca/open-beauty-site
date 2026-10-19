# Cierre de issue 7 · mejoras 2

Base de comparación: `09bc6abbe4a9aac02416e7843a8acad12fa06faf`. La evidencia se conserva en `compare/index.json`; los 14 briefs históricos usan sus seeds originales. El registro contiene además 12 fixtures semánticos de solo después (seis de papercraft y seis de brutalist, en español e inglés) con su variante solo arte.

## Estado por hallazgo

| # | Estado | Resultado y límite |
| --- | --- | --- |
| 1 · Ilustración semántica | Hecho (done) | Papercraft y brutalist tienen escenas para tabla/filas, colección, contador y archivo/descarga. Los 12 pares narrativo/solo arte pasan el control automático de transformación. La revisión visual humana sigue pendiente. |
| 2 · Estados y capacidades | Hecho (done) | CLI `capabilities --json` y matriz de 312 celdas distinguen `supported`, `fallback` y `unsupported`; 58 celdas aprobadas tienen prueba y pack existentes. No se aprueba una celda sin evidencia. |
| 3 · Trabajo y resultado | Hecho (done) | Los manifiestos separan `workflowStatus`, `outcome.mode`, alcance ilustrativo y evidencia; los flujos de resultado esperado no afirman impacto observado. |
| 4 · Sellos y localización | Hecho (done) | La política de badges y el locale están registrados; los fixtures semánticos comparan es/en sin añadir sellos como sustituto del estado del objeto. |
| 5 · Timing por fase | Hecho (done) | Los holds decodificados se informan por fase y se separan de transiciones/loop. En los 14 briefs comparados cada hold sigue en 5.000 ms antes y después. |
| 6 · Ciclo verificable y composiciones débiles | Parcial: controles resueltos; aprobación visual independiente pendiente | El normalizador eleva por defecto los 14 briefs históricos de los seis estilos con escenas semánticas. En los packs regenerados, transformación por objeto, diff de píxeles decodificados y balance pasan 14/14. `legacyArt:true` conserva la ilustración anterior y deja sus controles de región en `pending`. Los siete estilos sin escena semántica mantienen sus recursos raster byte a byte. La aprobación humana sigue pendiente. |

## Los 13 estilos

Las primitivas indicadas son las celdas `supported` para aspecto 16:9 y locale es; los demás estados y aspectos están en [CAPABILITIES.md](CAPABILITIES.md). `—` significa que no hay una primitiva aprobada en esa combinación. Evaluación abreviada: integridad técnica `pass` en los packs elegidos; conformidad de estilo y narrativa `pending`; legibilidad `pending`, excepto isotype y opart (`revise`); revisión visual `pending` en los 13 estilos.

| Estilo | Fuente de título / lectura | Composiciones con evidencia | Primitivas `supported` (16:9/es) | Evidencia solo arte | Evaluación y revisión |
| --- | --- | --- | --- | --- | --- |
| artdeco | Poiret One / Josefin Sans | checklist, comparison | — | No hay pack | Técnica pass; resto pending |
| bestiary | UnifrakturMaguntia / IM Fell English | checklist, comparison | — | No hay pack | Técnica pass; resto pending |
| brutalist | Archivo Black / Space Mono | checklist, comparison | card-collection, counter, file-download, table-rows | `semantic/brutalist/**/art-only` (3 briefs × es/en) | Técnica pass; resto pending |
| galactic | Michroma / Space Grotesk | checklist, comparison | — | No hay pack | Técnica pass; resto pending |
| isotype | Jost / IBM Plex Sans | checklist, comparison | card-collection, counter | `gallery/isotype/{checklist,comparison}/*-art-only` (sin fixture semántico pareado) | Técnica pass; legibilidad revise; visual pending |
| memphis | Bricolage Grotesque / DM Sans | checklist, comparison | — | No hay pack | Técnica pass; resto pending |
| nature | Cormorant Garamond / Karla | checklist, comparison | — | No hay pack | Técnica pass; resto pending |
| opart | Archivo Black / Space Grotesk | checklist, comparison | card-collection | `gallery/opart/{checklist,comparison}/*-art-only` (sin fixture semántico pareado) | Técnica pass; legibilidad revise; visual pending |
| papercraft | Fraunces / Nunito Sans | checklist, comparison | card-collection, counter, file-download, table-rows | `semantic/papercraft/**/art-only` (3 briefs × es/en) | Técnica pass; resto pending |
| psychedelic | Bungee Shade / Space Grotesk | checklist, comparison | — | No hay pack | Técnica pass; resto pending |
| renaissance | EB Garamond / EB Garamond | checklist, comparison | card-collection, counter | `art-only/renaissance/` (pack existente, no fixture semántico pareado) | Técnica pass; resto pending |
| ukiyoe | Shippori Mincho B1 / Zen Kaku Gothic New | checklist, comparison | card-collection, file-download | `art-only/ukiyoe/` (pack existente, no fixture semántico pareado) | Técnica pass; resto pending |
| vaporwave | Press Start 2P / Space Grotesk | checklist, comparison | — | No hay pack | Técnica pass; resto pending |

## Comparación medida antes/después

Los tiempos son medianas de tres renders por brief, antes con `legacyArt:true` y después con upgrade predeterminado. Δ de render = Después − Antes. Tamaños y holds proceden de la decodificación GIF independiente. Δ de tamaño = Después − Antes.

| Estilo | Briefs y seeds (composición/seed) | GIF total antes → después (Δ bytes) | Render mediano antes → después (Δ ms) | Holds |
| --- | --- | ---: | ---: | --- |
| brutalist | comparison/7, checklist/29, comparison/43 | 4.172.299 → 4.863.041 (+690.742) | 3.496 → 4.695 (+1.199) | 3 × 5.000 ms, sin cambio |
| papercraft | comparison/7, checklist/29, comparison/43 | 3.975.341 → 6.332.063 (+2.356.722) | 3.920 → 4.956 (+1.036) | 3 × 5.000 ms, sin cambio |
| isotype | checklist/7, comparison/7 | 1.902.089 → 1.890.346 (−11.743) | 2.588 → 3.756 (+1.168) | 3 × 5.000 ms, sin cambio |
| opart | checklist/7, comparison/7 | 2.013.796 → 1.834.113 (−179.683) | 3.646 → 3.689 (+43) | 3 × 5.000 ms, sin cambio |
| renaissance | checklist/7, comparison/7 | 1.950.265 → 2.360.290 (+410.025) | 3.374 → 6.899 (+3.525) | 3 × 5.000 ms, sin cambio |
| ukiyoe | checklist/7, comparison/7 | 1.692.406 → 2.146.422 (+454.016) | 3.128 → 8.355 (+5.227) | 3 × 5.000 ms, sin cambio |
| **Total** | **14 pares** | **15.706.196 → 19.426.275 (+3.720.079)** | **medianas por estilo** | **42 holds, sin cambio** |

Los **14/14 GIF** antes/después difieren en SHA-256. Antes, los 14 controles de transformación fallaban y los diffs de región estaban pendientes; después, transformación, diff de región decodificado y balance pasan 14/14. El mayor rectángulo vacío es **21,9%**, dentro del umbral de 22%. Los holds de 5.000 ms y el tiempo total decodificado por par se conservan. `legacyArt:true` deja los controles de región en `pending` porque el arte optado no declara regiones. Bajo opt-out, la ilustración coincide con los recursos históricos en 8/14 pares; seis difieren por cambios de renderer posteriores al commit de base.

Se regeneraron 20 packs de papercraft (3 pilotos, 2 galería, 3 comparaciones históricas y 12 salidas semánticas narrativo/solo-arte), 20 de brutalist con la misma distribución y 4 por estilo para isotype, opart, renaissance y ukiyoe (2 galería y 2 comparaciones históricas). Los siete estilos sin escena semántica mantuvieron sus archivos raster byte a byte. Los conteos canónicos no cambian: siguen siendo 28 packs (22 de galería + 6 pilotos) y 60 manifiestos; la mejora sustituye arte dentro de esos briefs existentes. El índice registra 12 fixtures semánticos en es/en, cada uno con variante narrativo y solo-arte.

El índice registra **26.174.249 bytes GIF/PNG en 63 archivos** de comparación y fixtures; el GIF más grande mide **1.444.112 bytes**, por debajo del tope de 6 MiB.

## Validación y controles negativos

| Ejecución | Resultado |
| --- | --- |
| `pnpm coverage:matrix` | **104/104**, 0 celdas fuera de cobertura |
| `pnpm capabilities:matrix` | **312 celdas**: 58 supported, 158 fallback, 96 unsupported; sin celdas promovidas por esta migración |
| `pnpm narrative:recipes` | **13/13** recetas ejecutables; 1280×720, 33 frames, 17.190 ms y loop 0 |
| `pnpm fonts:check` | **65** verificaciones estilo/rol, 13 estilos, 30 caras reales, 0 sintéticas |
| `pnpm visual:matrix` | **91/91 A100**, 0 celdas debajo del mínimo; tercer intento completó sin timeouts |
| `node dist/cli.js validate docs/narrative-gif/GALLERY.html --style papercraft --visual` | **A 100/100**, visión 4/4, sin problemas |
| `node dist/cli.js validate docs/narrative-gif/COMPARE.html --style papercraft --visual` | **A 100/100**, visión 4/4, sin problemas |
| `pnpm check:all` | En curso en segundo plano; el primer pase de `narrative-pilots.test.ts` encontró 4 expectativas de arte heredado incompatibles con el nuevo default. Se actualizaron esos fixtures para usar `legacyArt:true`; las 4 pruebas afectadas pasan aisladas. Log externo `%TEMP%\open-beauty-check-all.log`; falta repetir el gate completo. |

Controles negativos explícitos: la matriz conserva **254/312** celdas no aprobadas (158 `fallback` + 96 `unsupported`). Pasan los tests de cambio solo de texto, arte decorativo, estados desconocidos y escenas sin regiones declaradas. El test del opt-out confirma que `legacyArt:true` conserva el arte papercraft anterior byte a byte y deja el control de región en `pending`; el upgrade con cambio solo narrativo sigue fallando el control de objeto.

## Inspección visual, límites y pendientes

Se inspeccionaron hojas de contacto de un pack por cada uno de los seis estilos; cada hoja incluye pausas, puntos medios y unión del loop. Defectos encontrados y corregidos: badge de brutalist que rebasaba tarjeta; cambio de Op Art que solo afectaba un motivo, ahora afecta las cuatro unidades; rótulo de Ukiyo-e que se montaba sobre el cartucho, ahora localizado, corto y dentro del marco. Isotype, papercraft y Renaissance no mostraron clipping en los estados inspeccionados. El detalle por pack y las imágenes revisadas están en [REVIEW-legacy-upgrade.md](semantic/REVIEW-legacy-upgrade.md).

Los seis manifiestos revisados reportan cuerpo >=36 px nativo, etiqueta >=24 px nativa y mínimo de etiqueta de 15 px efectivos a 640×360; todos pasan. El mayor rectángulo vacío medido es 21,9% (máximo permitido 22%). Esta revisión cubre los seis estilos de la migración; no constituye aprobación estética independiente para los 13 estilos ni contrasta la referencia privada de Grid. La revisión humana final de publicación queda `pending`.

La comparación mide decodificación, bytes, cambios de regiones y balance en estos fixtures y esta plataforma. Los 14 GIF cambiaron de hash; los ocho recursos que coinciden bajo opt-out representan la ruta de arte heredada respecto de la base, mientras seis difieren por cambios de renderer posteriores al commit histórico. Ningún resultado demuestra igualdad entre sistemas operativos.
