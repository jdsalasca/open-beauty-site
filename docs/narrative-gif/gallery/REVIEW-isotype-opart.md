# Revisión iterativa · Isotype y Op Art

## Alcance y método

Se compararon los cuatro packs anteriores con las nuevas composiciones de cada estilo. En cada ronda se regeneraron GIF, PNG fijo y hoja de contacto; se inspeccionaron la hoja completa y fotogramas nativos de inicio/pausa, punto medio, resultado y unión del ciclo. Las extracciones de frames quedaron en `%TEMP%\open-beauty-isotype-review-iteration-{1,2,3}` y no se añadieron al repositorio. Los PNG fijos son los holds de inicio para comprobar la lectura del objeto sin texto narrativo.

La inspección del implementador pudo abrir los frames y las hojas a resolución nativa. No equivale a aprobación visual independiente: `visual-review` de los manifiestos sigue `pending` y `publicationRecommendation` permanece `none`.

## Isotype

### Ronda 1 · línea base y primer render

Los packs anteriores mantenían casi fijo el objeto y desplazaban un marcador pequeño; el cambio dependía de leer el copy. En la primera composición semántica, comparison ya mostraba seis pictogramas identificables; checklist movía la unidad seleccionada solo hacia el extremo de su fila, de modo que la separación no se distinguía en los holds art-only. Además, el arte de muestra heredado en `src/art.ts` todavía exponía `68%` y `SERIE / 01`, etiquetas sin respaldo en los briefs.

**Correcciones:** se movió la unidad pendiente de checklist a una franja inferior delimitada en rojo. El arte heredado se rotuló `MUESTRA CUALITATIVA`, `ILUSTRATIVO` y `SIN MÉTRICA`; se eliminó el porcentaje y la serie fija.

### Ronda 2 · franja de revisión

Se regeneraron ambas composiciones en modo narrativo y `--art-only`. Las hojas de contacto y los frames nativos 1, 5, 12, 16, 23 y 27 mostraron el estado inicial, selección, tránsito, resultado y retorno al inicio. La banda separa el sexto pictograma de las cinco filas superiores; el rótulo `REVISAR` y la casilla permanecen junto a esa unidad. El contador conserva seis unidades. En esta inspección también se localizó y eliminó el reclamo métrico del arte heredado.

### Ronda 3 · verificación final

Tras regenerar los cuatro packs, se volvieron a inspeccionar hojas completas y holds nativos de las versiones narrativas y art-only. En comparison el grupo de cinco queda visible y el sexto pictograma rojo aparece separado para revisión; en checklist se ven cinco filas superiores y una fila de revisión inferior. Los dos PNG art-only conservan el cambio sin título, etiqueta de fase ni cuerpo narrativo. No se observaron recortes, solapamiento del copy con el objeto, parpadeo ni cambios durante las pausas. El panel ocupa 45% del ancho del cuadro y conserva las reglas, siluetas planas y paleta de Isotype.

**Resultado de la revisión interna:** la tercera pasada no encontró defectos nuevos en las composiciones Isotype; esta observación del implementador no constituye aprobación visual y el estado sigue `pending`. No se usaron fuentes o cifras de producto; `6 / 6` corresponde exactamente a los seis pictogramas y se rotula como ilustrativo. Las 12 celdas semánticas soportadas tienen pruebas de render y píxeles decodificados. El control negativo confirma que cambiar solo el copy no aprueba la transformación del objeto.

**Recursos inspeccionados:** [comparison · hoja](isotype/comparison/cambios-que-se-revisan-f5381181-contact-sheet.png), [comparison · GIF art-only](isotype/comparison/cambios-que-se-revisan-f5381181-art-only.gif), [comparison · PNG art-only](isotype/comparison/cambios-que-se-revisan-f5381181-art-only.png), [checklist · hoja](isotype/checklist/ruta-para-revisar-el-cierre-9cfda0c7-contact-sheet.png), [checklist · GIF art-only](isotype/checklist/ruta-para-revisar-el-cierre-9cfda0c7-art-only.gif), [checklist · PNG art-only](isotype/checklist/ruta-para-revisar-el-cierre-9cfda0c7-art-only.png).

## Op Art

### Ronda 1 · campo semántico inicial

El baseline tenía los mismos anillos concéntricos en todas las fases y una deformación leve; el cambio no se reconocía sin leer el copy. El primer render semántico creó seis motivos en dos grupos y una banda de lectura fija. En las hojas y frames nativos el grupo inferior se movía, pero el desplazamiento de 9% del panel y el desfase de franjas eran discretos en miniatura.

**Correcciones:** se aumentó el desplazamiento a 13% del panel, se ajustó la retícula para mantener margen interno y se elevó el desfase de las franjas gruesas. La banda `LECTURA/READING` se dibuja encima del patrón también en el fallback legado.

### Ronda 2 · separación y cambio de foco

La inspección de contact sheets y frames 1, 5, 12, 16, 23 y 27 en GIF completo y art-only mostró el grupo inferior separado con claridad. En comparison, los focos concéntricos internos se desplazan dentro de cada motivo; en checklist, las franjas anchas cambian de fase mientras la banda central queda libre. El rótulo de la banda seguía en 28 px, justo en el mínimo efectivo a media escala.

**Corrección:** se aumentó `LECTURA/READING` a 32 px nativos para dar más aire a la lectura a 640×360.

### Ronda 3 · verificación final

Tras regenerar ambos briefs y sus versiones art-only, se inspeccionaron de nuevo las cuatro hojas de contacto y frames nativos 1, 5, 12, 16, 23 y 27. Los holds de resultado muestran el grupo inferior desplazado y el foco cambiado sin depender del relato. La banda queda despejada y quieta; no se observó moiré sobre ella, parpadeo, recorte ni patrón moviéndose durante las pausas. El panel ocupa 47% del ancho y los motivos conservan contraste negro/hueso del estilo. Los PNG art-only muestran el hold `Antes`; el hold de resultado se conserva en cada GIF art-only.

**Resultado de la inspección interna:** seis celdas `card-collection` (tres ratios × dos idiomas) tienen prueba de render y diferencia de píxeles decodificados; el control negativo de texto solo falla como se espera. `stable-reading-holds` pasa en comparison y checklist art-only. No se muestra una cifra ni fuente porque los briefs son ilustrativos y no contienen datos de producto. La inspección del implementador no constituye aprobación visual independiente: `visual-review` se mantiene `pending`.

**Recursos inspeccionados:** [comparison · hoja](opart/comparison/cambios-que-se-revisan-b1b5690b-contact-sheet.png), [comparison · GIF art-only](opart/comparison/cambios-que-se-revisan-b1b5690b-art-only.gif), [comparison · PNG art-only](opart/comparison/cambios-que-se-revisan-b1b5690b-art-only.png), [checklist · hoja](opart/checklist/ruta-para-revisar-el-cierre-b4535b83-contact-sheet.png), [checklist · GIF art-only](opart/checklist/ruta-para-revisar-el-cierre-b4535b83-art-only.gif), [checklist · PNG art-only](opart/checklist/ruta-para-revisar-el-cierre-b4535b83-art-only.png).
