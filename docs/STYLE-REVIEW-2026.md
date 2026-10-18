# Ronda de estilos 2026

Revisión editorial, tipográfica y de movimiento de los 13 estilos.
Mesa de trabajo: tres subagentes **Luna 6 Max** (dirección editorial, dirección de arte/tipografía y dirección de movimiento/aprendizaje), con síntesis humana en el repo. Los informes completos quedaron en `qa/luna-editorial.md`, `qa/luna-tipografia.md` y `qa/luna-motion.md` durante la sesión.

La regla de esta ronda: **cada estilo debe reconocerse a 200 px y en tres segundos; el movimiento debe ordenar la lectura, no decorarla**.

## 1. La promesa de cada estilo

| Estilo | Promesa | En 3 segundos | Error más común | Mejora de copy | Mejora de composición |
| --- | --- | --- | --- | --- | --- |
| **Renaissance** | Presentar una idea como fresco: conocimiento con materia, pausa y punto de vista. | Cal y pigmento; lectura serena a la izquierda; una escena arqueada al otro lado. | Papelería nupcial pastel y simetría ornamental. | Voz colectiva y un hecho visible: «En este muro, la luz organiza el poder». | Texto a la izquierda, placa arqueada grande a la derecha, marco doble y una irrupción bermellón. |
| **Brutalist** | Convertir una postura en cartel público, imposible de confundir con un folleto. | Golpe frontal y urgencia; un mensaje que puede repetirse de memoria. | Volumen sin idea: ácido, cifras y marquesina sin argumento. | Un imperativo ligado al asunto: «MIRÁ QUIÉN QUEDA AFUERA». | Retícula de 12 columnas, titular enorme, banda corrida y un solo bloque ácido. |
| **Paper Craft** | Hacer visible el trabajo manual y comunitario como invitación cálida. | Mesa de taller, papeles superpuestos y una pieza central hecha a mano. | Infantilizar con pegatinas o llenar de tarjetas redondeadas idénticas. | Acciones y cantidades: «Doblamos 240 hojas antes de abrir el taller». | Una pieza irregular al frente, otra hoja desplazada y cinta; una banda cruza el borde. |
| **Art Deco** | Volver el tema un vestíbulo vertical de elegancia geométrica y tiempo. | Laca negra, eje ascendente, un destello champagne y atmósfera de época. | Invitación Gatsby: oro y simetría sin un asunto verificable. | Cambiar «lujo eterno» por un nombre, una fecha y un gesto material. | Eje y marcos escalonados, hero alto; quebrar la simetría una vez con un epígrafe lateral. |
| **Isotype** | Hacer que un dato público se entienda como lenguaje común. | Cantidad, unidad y repetición legibles antes que la explicación. | Dashboard de tarjetas o pictogramas decorativos sin escala. | Nombrar período, denominador y fuente; explicar qué representa cada figura. | Retícula visible, un pictograma por unidad y un único número rojo. |
| **Op Art** | Transformar la percepción en argumento: el ojo participa para entender. | Tensión óptica controlada; la mirada alterna entre patrón y frase. | Mantener la interferencia hasta comprometer la lectura. | Plantear «¿Qué borde parece moverse?» y responderlo. | Alternar patrón a sangre con bandas vacías; un solo estado estático. |
| **Ukiyo-e** | Contar el paisaje como estampa: historia y agua en planos impresos. | Horizonte bajo, cielo amplio, azul de Prusia y sello bermellón. | Usar Japón como decoración: sakura, letras falsas o geografía genérica. | Nombrar costa, estación y fecha; contar qué cambió sin exotizarla. | Cartucho vertical a un lado, mar en planos superpuestos y cuerpo en el lado opuesto. |
| **Bestiario** | Volver la curiosidad un manuscrito sobre una especie que no existe. | Página de campo: criatura ilustrada, inicial iluminada y nota marginal. | Llamar bestiario a cualquier dragón oscuro y llenar todo de letra gótica. | Describir anatomía, hábitat y conducta; marcar como hipótesis lo inventado. | Dos columnas y margen externo; inicial amplia y criatura como ancla. |
| **Psicodelia** | Dar forma de cartel expansivo a una materia que merece exploración. | Color líquido, ritmo y choque; el tema sigue siendo reconocible. | Saturarlo todo hasta que nada quede en la memoria. | Nombrar un fenómeno específico con un verbo sensorial y explicarlo en voz llana. | Cruzar blob, anillos y tipo; reservar una esquina tranquila para el CTA. |
| **Memphis** | Unir humor visual y rigor para que una idea creativa permanezca. | Desorden deliberado: formas improbables, keyline negro y ritmo de imprenta. | Squiggles como confeti o rotarlo todo: caos sin jerarquía. | Voz seca: observación precisa bajo título juguetón, sin remate fácil. | Anclar un squiggle gigante y un campo terrazzo; rotar solo el foco. |
| **Vaporwave / Y2K** | Leer la cultura digital como una interfaz vieja que todavía responde. | Ventana de 1999, rejilla al horizonte y nostalgia táctil, no solo neón. | Simular un sistema operativo sin historia o pixelar párrafos enteros. | Cambiar nostalgia vaga por un artefacto, un año y un gesto de uso. | Descentrar una ventana legible; rejilla abajo y sol en el horizonte. |
| **Galactic Futurism** | Hacer del espacio una sala íntima para escuchar lo que recordamos. | Órbita lenta, planeta grande y negro suficiente para respirar. | Apilar nebulosa, estrellas, cromo y audio automático. | Partir de un detalle sonoro concreto; cromar una sola palabra. | Texto a un lado, planeta sangrado al otro y tres órbitas; audio explícito. |
| **Nature Memory** | Un herbario editorial: memoria botánica con fecha, sombra y procedencia. | Hoja prensada, etiqueta de campo, anillos de crecimiento y papel cálido. | Usar flores y hojas como decoración sin nombre, fecha ni fuente. | Nombrar la especie, el lugar y la fecha; si es ficción, decirlo. | Lámina prensada a un lado, etiqueta vertical y tres pliegues de archivo. |

## 2. Tipografía

Cada estilo tiene un `typeSystem` con caja, tracking, leading, tamaño de cuerpo, tracking de rótulos y features OpenType. No se agregaron familias nuevas.

| Estilo | Display / cuerpo | Gestos | Decisión 2026 |
| --- | --- | --- | --- |
| Renaissance | EB Garamond | `liga`, `kern`, `onum`; una cursiva y una capitular de dos líneas | Cuerpo 20/1.65; el titular se lee, no se espacia. |
| Brutalist | Archivo Black / Space Mono | caja alta, tracking negativo, mono real | Cuerpo 18/1.6 para que el cartel también explique. |
| Paper Craft | Fraunces / Nunito Sans | `liga`, `kern`; inicial recortada | Cuerpo 18/1.62; la irregularidad está en el papel, no en el párrafo. |
| Art Deco | Poiret One / Josefin Sans | caja alta, tracking moderado, filetes | No espaciar cada letra; cuerpo 18/1.65. |
| Isotype | Jost / IBM Plex Sans | `tnum`, `kern`; cifra tabular como capitular | Cuerpo 18/1.6; una cifra puede ser el ancla visual. |
| Op Art | Archivo Black / Space Grotesk | `kern`; un glifo desplazado, no todo el titular | Cuerpo 18/1.6; la legibilidad gana al efecto. |
| Ukiyo-e | Shippori Mincho B1 / Zen Kaku Gothic New | `liga`, `kern`; `palt` solo en japonés | Cuerpo 18/1.7; cartela vertical breve. |
| Bestiario | UnifrakturMaguntia / IM Fell English | `liga`, `kern`, `onum`; blackletter solo en display | Cuerpo 19/1.7; una inicial iluminada, no un párrafo gótico. |
| Psicodelia | Bungee Shade / Space Grotesk | `kern`; arco solo en la palabra acento | Cuerpo 18/1.6; el texto no compite con el blob. |
| Memphis | Bricolage Grotesque / DM Sans | `liga`, `kern`; pesos ya cargados | Cuerpo 18/1.6; tracking abierto en titulares. |
| Vaporwave | Press Start 2P / Space Grotesk | `kern`; acento cromático en la misma pixel | Cuerpo 18/1.65; el píxel se reserva para display. |
| Galactic | Michroma / Space Grotesk | `kern`, `liga`; numeral orbital | Cuerpo 18/1.7; Michroma pide titulares cortos. |
| Nature Memory | Cormorant Garamond / Karla | `liga`, `kern`, `onum`; una cursiva de campo | Cuerpo 18/1.68; etiqueta de 10–11 px y fecha con cifras old-style. |

**Reglas transversales**

1. Display, cuerpo y metadatos son roles; `mono` no siempre es monoespaciada.
2. Párrafo ≥18 px y leading 1.55–1.75; en proyector, cuerpo 20–24 px.
3. Display decorativa solo en titulares breves; a 360 px, empezar cerca de 40–48 px.
4. Rótulos .10–.14em; titulares entre −.03em y +.04em.
5. Caja, small caps, cursiva y numerales son recursos deliberados, no decoración.
6. Probar a 360 px y en proyector; no depender de texto de 8–13 px.

## 3. Movimiento

El `motionSystem` de cada estilo define entrada, ambiente, hover, transición de página y estado reducido. La animación no debe retrasar la lectura.

| Estilo | Entrada | Ambiente | Hover | Reduced motion |
| --- | --- | --- | --- | --- |
| Renaissance | 900 ms · 16 px · 80 ms | ornamento que se dibuja una vez | subrayado que crece | trazo completo, grano quieto |
| Brutalist | 250 ms · 20 px · 60 ms | marquee 22 s, con pausa | botón sube y crece la sombra | banda quieta, entrada completa |
| Paper Craft | 480 ms · 22 px · 90 ms | recortes ±0.6° cada 8 s | elevar 3 px | piezas ya colocadas |
| Art Deco | 900 ms · 12 px · 90 ms | sol 38 s, filete una vez | brillo o 2 px | rayos quietos, filetes completos |
| Isotype | 350 ms · 10 px · 50 ms | ninguno | subrayado/fila | cifras finales, sin conteo |
| Op Art | 200 ms · 0 px · 30 ms | muaré solo con puntero + congelar | ninguno | patrón estático |
| Ukiyo-e | 1.000 ms · 14 px · 90 ms | olas por scroll; espuma una vez | sello/subrayado | olas planas, sin deriva |
| Bestiario | 800 ms · 12 px · 80 ms | parpadeo cada 7 s; brillo una vez | traducción de margen | ojo y brillo quietos |
| Psicodelia | 550 ms · 18 px · 60 ms | manchas 12–20 px por ciclo | crecer 2% | manchas fijas |
| Memphis | 300 ms · 16 px · 45 ms | solo el botón «Revolver» | elevar 4 px | piezas en su sitio |
| Vaporwave | 350 ms · 8 px · 50 ms | rejilla/sol ≥16 s, pausa | RGB split 120 ms | ventana quieta |
| Galactic | 800 ms · 14 px · 80 ms | órbita 48–62 s; planeta 4 px | línea cian | cielo estático |
| Nature Memory | 900 ms · 14 px · 80 ms | deriva de una hoja 16 s; anillos una vez | subrayado o 2 px | hoja quieta, anillos finales |

**Reglas de motion educativo**

1. La animación ordena la mirada, no la información.
2. En proyector, un foco móvil por escena como máximo.
3. Movimiento suave y lento; nada de destellos, rebotes o muaré autónomo.
4. La interacción no depende de hover: teclado, toque y foco visible.
5. `prefers-reduced-motion`: estado final inmediato, sin bucles ni desplazamiento suave.

## 4. Lo que cambió en el harness

- `StylePreset.typeSystem` y `StylePreset.motionSystem` son datos obligatorios en los 13 presets.
- `shell()` consume esos tokens: caja, tracking, leading, features, página, stagger y scroll progress.
- La página tiene una **barra de progreso** de 2 px y un fade de entrada; el `reveal` usa duración/stagger del estilo.
- Las 9 direcciones showcase dejaron de compartir la misma voz de copy: cada una tiene su propia pauta.
- Las subfamilias eligen composición curada (`sala`, `gabinete`, `cartel`) cuando la estructura lo pide.
- `styleGuideMarkdown` y `beauty_get_style` publican los tokens; `docs/STYLEGUIDE.md` se regenera desde los presets.

## 5. Lo que sigue

- Un layout `figure` real con caption, alt y fuente para decks.
- Perfiles de motion por subfamilia, no solo por estilo.
- Pruebas de tipografía renderizada a 360 px y proyector, no solo lectura estática del CSS.
- El botón de pausa ya está en las páginas; falta integrarlo en los decks y en los GIF.
