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
| 6 · Ciclo verificable y composiciones débiles | Parcial (partial) | El ledger, feedback por frame, rerender e invalidación existen. La galería muestra 14/14 transformaciones heredadas como `fail` y sus diffs de región como `pending`; no hay feedback abierto registrado ni aprobación visual independiente. Opart conserva una composición de barras con causalidad poco legible; isotype, papercraft y renaissance incluyen pares sin cambio de GIF. |

## Los 13 estilos

Las primitivas indicadas son las celdas `supported` para aspecto 16:9 y locale es; los demás estados y aspectos están en [CAPABILITIES.md](CAPABILITIES.md). `—` significa que no hay una primitiva aprobada en esa combinación. Evaluación abreviada: integridad técnica `pass` en los packs elegidos; conformidad de estilo y narrativa `pending`; legibilidad `pending`, excepto isotype y opart (`revise`); revisión visual `pending` en los 13 estilos.

| Estilo | Fuente de título / lectura | Composiciones con evidencia | Primitivas `supported` (16:9/es) | Evidencia solo arte | Evaluación y revisión |
| --- | --- | --- | --- | --- | --- |
| artdeco | Poiret One / Josefin Sans | checklist, comparison | — | No hay pack | Técnica pass; resto pending |
| bestiary | UnifrakturMaguntia / IM Fell English | checklist, comparison | — | No hay pack | Técnica pass; resto pending |
| brutalist | Archivo Black / Space Mono | checklist, comparison | card-collection, counter, file-download, table-rows | `semantic/brutalist/**/art-only` (3 briefs × es/en) | Técnica pass; resto pending |
| galactic | Michroma / Space Grotesk | checklist, comparison | — | No hay pack | Técnica pass; resto pending |
| isotype | Jost / IBM Plex Sans | checklist, comparison | card-collection, counter | No hay fixture semántico solo arte | Técnica pass; legibilidad revise; visual pending |
| memphis | Bricolage Grotesque / DM Sans | checklist, comparison | — | No hay pack | Técnica pass; resto pending |
| nature | Cormorant Garamond / Karla | checklist, comparison | — | No hay pack | Técnica pass; resto pending |
| opart | Archivo Black / Space Grotesk | checklist, comparison | card-collection | No hay fixture semántico solo arte | Técnica pass; legibilidad revise; visual pending |
| papercraft | Fraunces / Nunito Sans | checklist, comparison | card-collection, counter, file-download, table-rows | `semantic/papercraft/**/art-only` (3 briefs × es/en) | Técnica pass; resto pending |
| psychedelic | Bungee Shade / Space Grotesk | checklist, comparison | — | No hay pack | Técnica pass; resto pending |
| renaissance | EB Garamond / EB Garamond | checklist, comparison | card-collection, counter | `art-only/renaissance/` (pack existente, no fixture semántico pareado) | Técnica pass; resto pending |
| ukiyoe | Shippori Mincho B1 / Zen Kaku Gothic New | checklist, comparison | card-collection, file-download | `art-only/ukiyoe/` (pack existente, no fixture semántico pareado) | Técnica pass; resto pending |
| vaporwave | Press Start 2P / Space Grotesk | checklist, comparison | — | No hay pack | Técnica pass; resto pending |

## Comparación medida antes/después

Los tiempos `Después` son medianas de tres renders por brief; la última columna es la mediana de esas medianas dentro del estilo. El render histórico no se midió en la base, así que no existe delta temporal comprobable. La duración y los holds proceden de la decodificación GIF independiente. Δ de tamaño = Después − Antes.

| Estilo | Briefs y seeds (composición/seed) | GIF total antes → después (Δ bytes) | Frames y duración total antes/después | Holds por fase | Render Después mediano |
| --- | --- | ---: | --- | --- | ---: |
| brutalist | comparison/7, checklist/29, comparison/43 | 4.172.299 → 4.170.810 (−1.489) | 126 / 53.820 ms; sin cambio | 5.000 ms cada fase, iguales | 4.261 ms |
| papercraft | comparison/7, checklist/29, comparison/43 | 3.975.341 → 3.971.584 (−3.757) | 126 / 53.820 ms; sin cambio | 5.000 ms cada fase, iguales | 5.012 ms |
| isotype | checklist/7, comparison/7 | 1.902.089 → 1.902.089 (0) | 66 / 34.380 ms; sin cambio | 5.000 ms cada fase, iguales | 4.176 ms |
| opart | checklist/7, comparison/7 | 2.013.796 → 1.972.433 (−41.363) | 66 / 34.380 ms; sin cambio | 5.000 ms cada fase, iguales | 3.771 ms |
| renaissance | checklist/7, comparison/7 | 1.950.265 → 1.950.265 (0) | 66 / 34.380 ms; sin cambio | 5.000 ms cada fase, iguales | 4.079 ms |
| ukiyoe | checklist/7, comparison/7 | 1.692.406 → 1.664.124 (−28.282) | 66 / 34.380 ms; sin cambio | 5.000 ms cada fase, iguales | 3.563,5 ms |
| **Total** | **14 pares** | **15.706.196 → 15.631.305 (−74.891)** | **516 / 245.160 ms; sin cambio** | **3 holds por brief, iguales** | — |

En **8/14 pares** los GIF antes/después tienen SHA-256 idéntico. Los 14 pares heredados dan balance proxy `pass` (14/14), transformación de objeto `fail` (14/14, porque estos briefs no declaran regiones semánticas) y diff de región `pending` (14/14). Los 12 fixtures nuevos dan balance `pass` y transformación `pass` (12/12 cada uno), diff de región `pending` (12/12), feedback abierto 0 y revisión visual `pending`. Esos controles no equivalen a aprobación estética.

El índice registra **15.824.107 bytes binarios nuevos en 40 archivos**; el GIF más grande mide **1.407.379 bytes**, por debajo del tope de 6 MiB. El resto de assets idénticos apunta a packs versionados en vez de duplicar bytes.

## Validación y controles negativos

| Ejecución | Resultado |
| --- | --- |
| `pnpm coverage:matrix` | **104/104**, 0 celdas fuera de cobertura |
| `pnpm narrative:recipes` | **13/13** recetas ejecutables |
| `pnpm fonts:check` | **65** verificaciones estilo/rol, 13 estilos, 30 caras, 0 caras sintéticas; 52 roles usan fallback para el glifo `→` |
| Pruebas dirigidas compare + matrix | **5/5**; incluye página estática, A100, índice, teclado y matriz |
| `node dist/cli.js validate docs/narrative-gif/COMPARE.html --style papercraft --visual` | **A 100/100**, visión 4/4, cero avisos |
| `pnpm visual:matrix` | **91/91 A100**, 0 celdas debajo del mínimo |
| `pnpm check:all` y repro byte por byte | Pendientes al redactar; registrar salida final antes del cierre |

Controles negativos explícitos: la matriz mantiene **254/312** celdas como no aprobadas (158 `fallback` + 96 `unsupported`); el test de matriz comprueba que solo las 58 celdas `supported` tienen prueba y pack existentes. En navegador se verificaron dos condiciones de carga negativa: cero GIF antes de pulsar Reproducir y cero GIF en movimiento reducido sin acción explícita. La regresión de los pares históricos conserva el resultado negativo de transformación en 14/14, en vez de inferir causalidad desde cambios de texto.

## Inspección visual, límites y pendientes

Se generaron y revisaron capturas de `COMPARE.html` a 1440 y 360 px fuera del repositorio (`%TEMP%\beauty-compare-review`). La prueba de navegador confirma sin overflow a 360 px, póster 16:9, modo tarjeta 640×360, Tab/Enter/Esc, diálogo nativo, movimiento reducido y carga diferida. En las muestras PNG revisadas:

- isotype conserva exactamente el mismo GIF antes y después, incluida la fila activa; no hay una transformación visible del objeto.
- opart usa franjas de alto contraste con un rótulo aislado; la relación causal no se reconoce con claridad en la miniatura.
- renaissance deja una gran zona vacía y una pieza geométrica sencilla; el cambio narrativo no queda explícito en las muestras heredadas.
- ukiyoe tiene una escena paisajística coherente, pero la señal narrativa es pequeña a tamaño de tarjeta.
- papercraft tiene materialidad clara y brutalist una jerarquía deliberada; sus pares heredados siguen mostrando el mismo arte en varios briefs.

La inspección anterior la realizó quien preparó esta entrega; **ninguno de los 13 estilos fue revisado ni aprobado independientemente**. Tampoco se revisaron todos los frames/holds de los 14 pares ni se contrastó con la referencia privada de Grid. No hay feedback humano abierto que enlazar a frames; el estado permanece `pending`. Las 91 comprobaciones de `visual:matrix` evalúan la calidad de páginas HTML, no sustituyen esa revisión de GIF.

La igualdad binaria de varios pares y los 14 fallos de transformación heredada son los límites más relevantes. La comparación informa tamaños y decodificación con precisión; no demuestra mejora visual en los pares idénticos. La determinación se limita a la misma plataforma, runtime y dependencias fijadas en `pnpm-lock.yaml`; no se afirma igualdad de bytes entre sistemas operativos.
