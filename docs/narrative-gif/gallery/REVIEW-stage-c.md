# Stage C · revisión de implementación por grupos

`visual-review` permanece `pending` y la recomendación de publicación es `none` en todos los manifiestos. Este registro documenta iteraciones de implementación; no reemplaza una revisión visual/editorial independiente ni habilita publicación.

## Renaissance, Art Deco, Isotype y Op Art

Se volvieron a renderizar las ocho composiciones con seed fijo. En la tercera iteración se revisaron las ocho hojas de contacto, 24 cuadros de pausa a 1280×720 y los PNG estáticos.

| Iteración | Hallazgo | Ajuste |
|---|---|---|
| 1 | El ocre de la etiqueta Renaissance no alcanzaba el contraste requerido; el cierre de la placa Art Deco se percibía poco; el cambio del foco Op Art era sutil. | Etiqueta Renaissance en tinta, asiento Art Deco más bajo y mayor desplazamiento determinista del foco Op Art. |
| 2 | El evaluator aún calculaba el contraste Renaissance como ocre (2,74:1 en vez del color renderizado); la marca roja de los pictogramas Isotype competía con la categoría. | Contraste alineado con tinta (13,53:1) y marcas interiores Isotype en gris neutro; el rojo queda para la categoría/fila activa. |
| 3 | No se observaron cortes del copy ni cruces entre la banda de lectura y el arte. Persisten límites de reducción tipográfica en Art Deco y posible fatiga por el patrón Op Art. | Sin cambios adicionales de composición; se conservan los límites en sus fichas y el fallback PNG de Op Art. |

Los GIF decodifican a 1280×720, 33 cuadros y 17.190 ms; los tres holds duran 5.000 ms y las transiciones no los consumen. La huella del objeto/marco observada fue 42,3% del cuadro para Renaissance e Isotype, 40,5% para Art Deco y 40,6% para Op Art. No representa porcentaje de píxeles cubiertos. Los controles verifican texto completo, tamaño mínimo, zona segura y colisiones geométricas, pero no hacen OCR ni certifican lectura humana.

Pendiente de revisión independiente: lectura real en tarjeta 640×360, definición de Poiret One y filetes Art Deco en pantallas pequeñas, tolerancia al patrón Op Art y correspondencia causal de cada transición.

## Ukiyoe, Bestiary, Psychedelic y Memphis

Se inspeccionaron los ocho contactos completos y fotogramas nativos de inicio, pausa de 5 s y cierre.

1. **Primera pasada:** la etiqueta Ukiyoe caía sobre el horizonte; el líder y las notas del búho cruzaban el cuerpo; dos esferas Psychedelic quedaban desconectadas de la señal. Se recolocaron marcador y anotaciones, se curvaron las plumas dentro de las alas y se conectó la señal a la banda naranja.
2. **Segunda pasada:** el punto Ukiyoe aún tenía poco contraste y las plumas parecían rayos. El rótulo pasó al plano de papel y las plumas quedaron dentro de las alas.
3. **Tercera pasada:** frases largas invadían el panel aunque no se truncaban. La columna de copy quedó en 43% del ancho y el arte empieza en 50%; el ajuste conserva tamaños mínimos y genera `TEXT_OVERFLOW` con una sugerencia cuando el texto no cabe.
4. **Cuarta pasada:** se detectó contraste bajo en las etiquetas de Bestiary, Psychedelic y Memphis. Se pasaron a tinta, se alineó el evaluator con el render y se regeneraron los ocho paquetes de este grupo.

Los ocho GIF son 1280×720, 33 cuadros, 17.190 ms y tres holds de 5.000 ms. Los contactos incluyen inicio, pausas, transiciones y reinicio del loop. El mayor GIF pesa 1.063.773 bytes, por debajo de 6 MiB. Los contrastes de etiqueta reportados son 9,63:1 (Ukiyoe), 11,29:1 (Bestiary), 13,71:1 (Psychedelic) y 16,63:1 (Memphis); no miden OCR ni oclusión por píxel. Las tarjetas de 640×360 mantienen el copy en dos líneas según la inspección registrada. Los cuatro estilos admiten 16:9 y 1:1; 9:16 devuelve `UNSUPPORTED_ASPECT`.

- **Ukiyoe:** horizonte y cartela se mantienen; la ruta punteada vincula bote y punto fijo. La cartela es una anotación secundaria en tamaño reducido.
- **Bestiary:** búho, anillo y lista articulan observación → encuadre → revisión. “Disco/foco” es una metáfora, no una afirmación biológica; la anatomía es vectorial estilizada.
- **Psychedelic:** el disco “REVISIÓN” y el copy permanecen fijos; las bandas reorganizan el foco y la señal conectada. Las superficies lisas protegen la lectura.
- **Memphis:** gira la ficha y el marcador llega a su ranura; la variante de proceso marca filas una a una, con decoración de margen fija y escasa.

Los ejemplos `in-review` terminan en **Resultado esperado** y no atribuyen métricas, ahorro ni producción. Un resultado `done` debe usar **Resultado observado** sustentado por el brief. La ilustración no constituye evidencia de producto.

## Evidencia y pendientes compartidos

- Archivos, briefs y manifiestos: [índice de galería](README.md); escenas: `src/narrative/scenes/`.
- Fichas y límites: [`renaissance`](../styles/renaissance.md), [`artdeco`](../styles/artdeco.md), [`isotype`](../styles/isotype.md), [`opart`](../styles/opart.md), [`ukiyoe`](../styles/ukiyoe.md), [`bestiary`](../styles/bestiary.md), [`psychedelic`](../styles/psychedelic.md) y [`memphis`](../styles/memphis.md).
- Sigue pendiente la aprobación visual/editorial humana, OCR, legibilidad en diversos dispositivos y la evaluación causal de las escenas.
