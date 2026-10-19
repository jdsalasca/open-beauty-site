# Revisión Stage C — ukiyoe, bestiary, psychedelic y memphis

## Estado

Inspeccioné los ocho contactos completos y los fotogramas nativos de inicio, pausa de 5 s y cierre de cada GIF. `visual-review: pending` y recomendación de publicación `none` permanecen como están en los ocho manifiestos: esta revisión de implementación no sustituye la aprobación editorial/visual independiente.

## Iteraciones render → observación → ajuste

1. **Primera pasada — ocho composiciones.** La etiqueta ukiyo-e caía sobre la línea del horizonte; el líder y las notas del búho cruzaban el cuerpo; dos esferas psicodélicas quedaban desconectadas de la señal. Ajusté ubicación/contraste del marcador japonés, ruta de anotación y alas/etiquetas del búho, y conecté la señal a la banda naranja.
2. **Segunda pasada — ocho contactos y frames nativos de los tres primeros estilos.** El texto del punto ukiyo-e seguía con poco contraste sobre la montaña; los trazos de plumas del búho parecían rayos. Puse el rótulo sobre el plano de papel y mantuve plumas curvas dentro de las alas.
3. **Tercera pasada — exports 1280×720.** Los frames nativos mostraron que algunas frases largas invadían el panel de arte aunque ningún carácter se truncara. El área de lectura pasó a 43% del ancho y el arte empieza en 50%; el copy se envuelve, conserva el mínimo tipográfico y falla con `TEXT_OVERFLOW` accionable si no cabe.
4. **Cuarta pasada — galería final completa.** Los manifiestos revelaron contraste de etiqueta insuficiente en Bestiary, Psychedelic y Memphis. Cambié esas etiquetas a tinta de alto contraste, alineé el evaluador con el color renderizado y añadí una aserción. Regeneré los ocho paquetes y volví a inspeccionar contactos y holds nativos.

## Medidas y verificación observada

- Los campos de arte miden 47% del ancho × 94% del alto, **44,18% del área del cuadro**. Esta es la huella del panel; incluye fondos y no equivale al área segmentada del objeto. El panel usa casi toda la altura y deja la columna de copy a la izquierda.
- Los ocho GIF miden 1280×720, 33 frames, 17.190 ms, loop infinito y tres holds decodificados de 5.000 ms. Todos tienen integridad LZW y contraste calculado aprobados; cada contacto registra 13 capturas (cinco para la fase inicial y cuatro por fase posterior), incluidas transición media y reinicio.
- Tamaño GIF por variante: Ukiyo-e comparison **745.595 B**, checklist **741.842 B**; Bestiary comparison **996.439 B**, checklist **1.063.773 B**; Psychedelic comparison **885.538 B**, checklist **788.470 B**; Memphis comparison **735.109 B**, checklist **837.211 B**. Máximo: 1.063.773 B, bajo el límite de 6 MiB.
- Contraste label/tinta reportado por los manifiestos: Ukiyo-e 9,63:1; Bestiary 11,29:1; Psychedelic 13,71:1; Memphis 16,63:1. El evaluador aclara que este cálculo no mide OCR ni oclusiones por píxel.
- A 640×360 por escala: título 38 px, cuerpo mínimo 20 px, etiqueta mínima 14 px. El render fuente mantiene 76/36/24 px respectivamente. Reduje y examiné las ocho tarjetas a 640×360: el cuerpo se conserva en dos líneas, separado del arte. La lectura OCR y una aprobación humana externa siguen pendientes.
- Los cuatro estilos admiten 16:9 y 1:1; 9:16 falla explícitamente con `UNSUPPORTED_ASPECT`. La prueba cubre acentos, ñ, ¿, ¡, dígitos, porcentaje y flecha; una palabra sin cortes provoca `TEXT_OVERFLOW` con sugerencia.

## Hallazgos finales y límites

- **Ukiyo-e:** horizonte y cartela se mantienen; la ruta punteada liga bote y punto fijo. La versión lista aporta progresión de tres hitos. Riesgo restante: en la tarjeta reducida la cartela es una anotación secundaria, no texto de lectura.
- **Bestiary:** el búho conserva su identidad; anillo y lista explican observación → encuadre → revisión. “Disco/foco” es una metáfora explícita y no una afirmación biológica. Riesgo restante: la anatomía es ilustración vectorial estilizada, no lámina naturalista.
- **Psychedelic:** el disco “REVISIÓN” y el copy no se mueven; las bandas reorganizan el foco y la señal permanece conectada. Riesgo restante: las áreas lisas del panel aportan más superficie que textura líquida, por diseño para proteger la lectura.
- **Memphis:** solo la ficha gira y el marcador llega a su ranura; la variante de proceso marca filas una a una. Riesgo restante: decoración de margen es fija y deliberadamente escasa.
- Los ejemplos son un Sprint Review `in-review`: el resultado se rotula **Resultado esperado** y no declara métricas, ahorro ni producción. Para `done`, el copy debe rotularse **Resultado observado** y sostenerse en el brief fuente.
- Evidencia: `docs/narrative-gif/gallery/<style>/<comparison|checklist>/` (brief, GIF, PNG, contacto y manifiesto); escenas `src/narrative/scenes/{ukiyoe,bestiary,psychedelic,memphis}.ts`; prueba `test/narrative-stage-c.test.ts`.

## Validación automatizada

- `test/narrative-stage-c.test.ts`: 11/11; `test/narrative.test.ts` y `test/mcp.test.ts`: 29/29 tras actualizar las expectativas de estilos soportados.
- `pnpm coverage:matrix`: 104/104; `pnpm visual:matrix`: 91/91 A100; `pnpm fonts:check`: 65 roles comprobados, sin caras sintéticas.
- En `pnpm check:all`, `check`, `build` y `check:scripts` pasaron. La primera suite concurrente reportó 294/299: las dos expectativas obsoletas ya están corregidas; las otras incidencias fueron falta de memoria y workers visuales/de geometría sin completar. En la repetición, un worker de `narrative-fonts.test.ts` superó 62 GB de memoria privada y los workers de texto mínimo y geometría no avanzaron; se detuvo esa ejecución. `check:all` sigue pendiente de una corrida completa estable.
