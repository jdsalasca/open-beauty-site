# Escenas semánticas papercraft

Fixtures bilingües e ilustrativos para las cuatro primitivas visuales del contrato semántico v3. Cada brief incluye entidades con identificadores estables, relaciones explícitas y estados/acciones por fase. Los valores, ejemplos y beneficios son ilustrativos; no se presentan como métricas ni como evidencia operacional.

Los briefs que aún usan `visual.kind` y `visual.state` se convierten automáticamente en una escena trivial con la entidad estable `legacy-object`. Esa compatibilidad conserva la composición `guia` existente. La galería de referencia se protege con `test/narrative-gallery-repro.test.ts`.

## Paquetes

Todos los GIF se decodificaron a 640 × 360; los manifiestos registran integridad, duración, conteo de cuadros, balance por captura, controles de transformación y hashes. Cada carpeta de locale contiene `brief.json`, GIF, PNG, hoja de contacto y manifiesto. `art-only/<locale>/` contiene los mismos cuatro artefactos sin título, etiqueta de fase ni texto narrativo; conserva las etiquetas necesarias para identificar las entidades y sus estados.

| Fixture | Locale | Cuadros | Duración | GIF / PNG / contacto (bytes) | Solo arte: GIF / PNG / contacto (bytes) |
| --- | --- | ---: | ---: | ---: | ---: |
| `filas-duplicadas` | es | 35 | 13 400 ms | 771 230 / 64 466 / 256 335 | 361 933 / 31 692 / 123 834 |
| `filas-duplicadas` | en | 35 | 13 400 ms | 741 389 / 62 615 / 249 382 | 356 137 / 31 393 / 119 755 |
| `descarga-pendiente` | es | 28 | 10 720 ms | 506 504 / 56 107 / 189 398 | 258 508 / 29 476 / 95 430 |
| `descarga-pendiente` | en | 28 | 10 720 ms | 498 489 / 57 158 / 183 310 | 252 600 / 28 371 / 93 703 |
| `contador-coleccion` | es | 21 | 8 040 ms | 397 297 / 57 307 / 139 828 | 200 996 / 30 709 / 70 160 |
| `contador-coleccion` | en | 21 | 8 040 ms | 385 278 / 53 496 / 133 838 | 198 189 / 30 032 / 68 224 |

Los tamaños son bytes exactos de los archivos renderizados. Las duraciones y cuadros proceden de los manifiestos con decodificación independiente; cada manifiesto de GIF marca integridad verdadera.

## Capacidades

Papercraft declara `supported` para las cuatro primitivas (`table-rows`, `card-collection`, `counter`, `file-download`) en los dos aspectos implementados (`16:9`, `1:1`) y ambos locales (`es`, `en`): 16 celdas. Cada combinación tiene render y comparación de regiones de objetos decodificados en `test/narrative-semantic-render.test.ts`, en la subprueba **“papercraft semantic primitives render decoded object changes in every supported aspect and locale”**. Las 8 celdas `9:16` siguen como `unsupported` porque no hay renderer papercraft para ese aspecto; `beauty capabilities` comunica esa razón para cada celda.

Los controles negativos de `test/narrative-semantic.test.ts` confirman que un cambio solo de texto, un cambio decorativo sin cambio del objeto, y objetos idénticos no aprueban la transformación semántica. Una escena que no declara regiones de objeto queda `pending`.

## Revisión

Las tres rondas, los defectos concretos observados y su estado después de los ajustes se registran en [REVIEW-papercraft.md](REVIEW-papercraft.md). La autoinspección no se marca como aprobación externa.
