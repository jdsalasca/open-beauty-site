# Revisión visual interna · Renaissance y Ukiyo-e · issue 7, finding 6

Fecha: 2026-10-19. Alcance: comparar y checklist por estilo, sus GIF decodificados y sus variantes sin copy. Esta es una revisión interna de composición; los manifiestos permanecen `visual-review: pending` y no hay aprobación de publicación.

## Renaissance

| Ronda | Defecto observado en cuadros/contactos | Corrección revisada |
| --- | --- | --- |
| 1 | La ventana de arco y los campos planos enmarcaban un fragmento rojo que solo cambiaba de sitio. El cambio no explicaba hallazgo ni orden. | Se sustituyó el objeto único por cuatro fragmentos con IDs persistentes y relaciones semánticas explícitas. |
| 2 | La primera distribución de fragmentos leía como piezas rectangulares intercambiables y el grupo se apretaba en la base. | Se variaron siluetas y motivos pintados por identidad; se reservaron cuatro asientos diferenciados y se desplazó el conjunto fuera del eje central. |
| 3 | La entrada no dejaba claro qué piezas faltaban ni por qué cambiaba el número del checklist. | `card-collection` deja ver piezas aún fuera de asiento; `counter` usa relaciones `counts` 1 → 2 → 4. El conteo no cambia en la comparación, donde el brief no lo pide. |
| 4 | La pausa final necesitaba leerse como composición resuelta sin un brillo o un encuadre simétrico que compitiera con el fresco. | Contactos y holds finales muestran cuatro motivos identificables, un arco asimétrico y una pausa estable. Se conserva una sola anotación pequeña (`PIEZA`/`FRAGMENT`). |

Evidencia final: [`comparison`](renaissance/comparison/piezas-del-arco-e87a8a9d-contact-sheet.png), cuadro nativo [`PNG`](renaissance/comparison/piezas-del-arco-e87a8a9d.png), [`checklist`](renaissance/checklist/cuenta-del-fresco-7045d15f-contact-sheet.png) y las hojas [`solo arte comparison`](../art-only/renaissance/comparison/piezas-del-arco-e87a8a9d-art-only-contact-sheet.png) y [`solo arte checklist`](../art-only/renaissance/checklist/cuenta-del-fresco-7045d15f-art-only-contact-sheet.png). El panel mantiene su identidad a través de hallar, reunir, resolver y unión del loop; no adopta el bisel ni la sombra de papercraft.

## Ukiyo-e

| Ronda | Defecto concreto | Corrección y comprobación |
| --- | --- | --- |
| 1 | La escena del bote tenía un rectángulo vacío medido en 25%, sobre el máximo de 22%; la ruta no definía un fallo recuperable. El barco también quedaba pequeño frente al campo costero. | Se añadieron planos de nubes, cordillera y mar; la ruta se ligó al progreso semántico, al fallo fijo del 55% y al reintento en 72%. Se amplió el casco y la vela. |
| 2 | El casco ampliado salía por el borde izquierdo del campo y entraba en la columna del relato. | El punto inicial se movió al 32% del campo; el barco queda dentro del mar desde el primer hold. La prueba decodifica el GIF art-only y comprueba al menos 12.000 píxeles oscuros del casco y cero píxeles de casco en la columna de copy. |
| 3 | Al mover el barco, el faro seguía demasiado cerca de su trayectoria; en checklist la vela secundaria cubría parte de la estación A. El control de píxeles encontró 382 píxeles bermellón sobre su marcador y 71 píxeles claros de vela sobre la etiqueta latina A. | El faro y el final de ruta se desplazaron a una coordenada fija del 94%. Para `card-collection`, el barco pasó debajo de marcadores y etiquetas; el control negativo de solapamiento da cero píxeles de vela sobre el marcador y cero sobre la caja de la etiqueta A. |
| 4 | La nueva posición aún podía mezclar el barco secundario con el nombre de la primera estación durante la pausa. | Se redujeron escala y altura de ese barco y se bajó su centro. El PNG nativo y los contactos actualizados conservan A/B/C despejadas, con horizonte y faro fijos. |

Evidencia final: cuadro nativo de pausa [`comparison PNG`](ukiyoe/comparison/travesia-interrumpida-3bca935f.png) y [`checklist PNG`](ukiyoe/checklist/estaciones-de-la-costa-fa304104.png). En los GIFs decodificados se inspeccionaron comparison cuadro 1 (pausa), cuadro 16 (fallo, punto medio) y cuadro 38 (unión del loop), y checklist cuadro 1 (pausa), cuadro 16 (punto medio) y cuadro 27 (unión). Sus contactos cubren holds y transiciones completos: [`comparison`](ukiyoe/comparison/travesia-interrumpida-3bca935f-contact-sheet.png) y [`checklist`](ukiyoe/checklist/estaciones-de-la-costa-fa304104-contact-sheet.png). Las variantes sin copy narrativo son los GIF [`comparison`](../art-only/ukiyoe/comparison/travesia-interrumpida-3bca935f-art-only.gif) y [`checklist`](../art-only/ukiyoe/checklist/estaciones-de-la-costa-fa304104-art-only.gif), con contactos [`comparison`](../art-only/ukiyoe/comparison/travesia-interrumpida-3bca935f-art-only-contact-sheet.png) y [`checklist`](../art-only/ukiyoe/checklist/estaciones-de-la-costa-fa304104-art-only-contact-sheet.png).

El manifiesto decodificado deja el mayor rectángulo vacío en **6,3%** (comparison) y **9,4%** (checklist); el peor cuadro queda por debajo del umbral original de 22%. El campo de impresión cubre 44,18% del lienzo y el proxy de área de objeto reporta 50%. El horizonte/faro se construyen en coordenadas fijas. El objeto se entiende sin copy narrativo en los GIF art-only.

## Verificación visual y límites

- Se revisaron cuadros 1280×720, holds nativos, puntos medios, unión del loop y contactos completos, incluidos los dos contactos art-only por estilo. Los seis cuadros Uki de fase/transición/unión se extrajeron del GIF a `%TEMP%\open-beauty-ukiyoe-review\` para inspección nativa; no son entregables del repositorio.
- El catálogo semántico prueba español e inglés. Los briefs de galería son español; su copy mostrado supera 36px nativos, títulos 56px y etiquetas 24px. El texto interno de cartela es 28px nativos, equivalente a 14px a 640×360. Se inspeccionaron PNG redimensionados a 640×360 y los tamaños efectivos en manifiesto; no se hizo OCR ni revisión en un reproductor externo.
- La matriz promueve a `supported` solo `card-collection` y `counter` para Renaissance, y `card-collection` y `file-download` para Ukiyo-e, en 16:9 es/en. Las otras celdas conservan su fallback o `unsupported`.
- Controles negativos: el cambio solo textual deja sin aprobar todos los controles `semantic-object-transformation`; los cambios reales pasan con diff de píxeles en regiones declaradas. El checklist Uki además comprueba el marcador y la etiqueta A despejados.

La revisión visual automatizada continúa pendiente de evaluación independiente: no se altera el estado `pending` para convertir la inspección propia en autoaprobación.
