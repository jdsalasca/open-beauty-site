# Revisión visual · upgrade de briefs heredados

Inspección de hojas de contacto regeneradas: doce capturas por pack, con retenciones, puntos medios de transición y unión del loop. El contacto permite comprobar estados estables y cambios sin depender de una sola miniatura. Las imágenes se inspeccionaron en su resolución nativa 1280×720.

| Estilo y pack revisado | Observación en retenciones/transiciones/loop | Resultado |
| --- | --- | --- |
| papercraft · `pilots/papercraft/guias-mas-confiables/guias-mas-confiables-f75f32a9-contact-sheet.png` | Las filas conservan alineación y etiquetas entre fases; el estado cambia en las tarjetas de objeto y el loop vuelve al pendiente sin duplicar elementos. | Sin defecto visible; continuar revisando contraste sobre el papel claro. |
| brutalist · `pilots/brutalist/guias-mas-confiables/guias-mas-confiables-66e9086e-contact-sheet.png` | El primer badge de estado sobresalía del ancho de algunas tarjetas. Se compactó la etiqueta del flujo heredado y se revisó de nuevo: todos los badges quedan dentro del borde y las tarjetas mantienen su rejilla. | Defecto corregido. |
| isotype · pendiente de hoja final | Se revisará tras la regeneración final del índice. | Pendiente. |
| opart · pendiente de hoja final | La primera inspección mostró que solo el cuarto motivo reflejaba los cambios de estado. Se cambió el renderer para que las cuatro unidades del motivo respondan al estado semántico en upgrades heredados; falta inspeccionar el pack regenerado. | Corrección implementada; inspección final pendiente. |
| renaissance · pendiente de hoja final | Se revisará tras la regeneración final del índice. | Pendiente. |
| ukiyoe · pendiente de hoja final | Se revisará tras la regeneración final del índice. | Pendiente. |

La comparación automática de balance y legibilidad se reporta en los manifiestos y en `ISSUE-7-REPORT.md`. La revisión visual no aprueba por sí sola requisitos tipográficos que no estén registrados en la evidencia de la imagen; las comprobaciones HTML de `visual:matrix` miden páginas y no sustituyen las capturas GIF. No se altera el copy narrativo heredado.
