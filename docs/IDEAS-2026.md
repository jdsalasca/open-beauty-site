# Mesa de ideas 2026

Cinco subagentes Luna 6 Max leyeron el repo desde roles distintos: **artista visual**, **escritor**, **lector**, **diseñador de producto** y **curador/educador**. Esta es la mesa de ideas que sobrevivió; no es una lista de deseos, es el mapa de lo que ya está y lo que sigue.

## Lo que la mesa vio

- El repo tenía doce manuales visuales fuertes, pero una sola gramática de página: hero, manifiesto, tarjetas, cita, cierre. Los estilos cambiaban la superficie; la estructura seguía siendo la misma.
- El arte era fijo por estilo. La liebre del Bestiario no cambiaba con el hábitat; el arco de Renaissance no cambiaba con el asunto. La imagen no escuchaba al brief.
- Las subfamilias cambiaban acento y, desde 2026, composición; todavía no cambian secuencia, ornamento y material.
- El deck era una landing con flechas: cuatro layouts, sin figura, sin notas, sin una gramática para una reunión.
- El lector pedía mapa de salas, puertas de salida, pausa real, modo proyector y datos con fuente; el museo pedía objetos, no fichas.
- La empresa pedía rituales: review, retrospective y planning con evidencia, no otro dashboard.

## Las diez ideas que se implementaron

1. **Experiencias con salas** (`beauty_create_experience`): un lugar se recorre, no se scrollea. 3–8 salas, escena, copy, objetos y salida.
2. **Cuentos y lecciones por capítulos** (`beauty_create_story`): 2–8 capítulos, cubierta, navegación, capitular, hechos al margen y fuente.
3. **Arte que responde al asunto**: `src/art.ts` suma mesa, vitrina, río, casa, escenario, planta y ventana a la escena de cada estilo.
4. **Captions de sala/capítulo**: la imagen deja de ser decoración y se ancla al texto.
5. **Rituales ágiles**: skill `agile`, decks de review/retro/planning y un GIF que abre la puerta.
6. **Voz propia por estilo**: las nueve direcciones showcase ya no comparten la misma pauta de copy.
7. **Pausa y movimiento reducido**: el lector puede detener el ambiente; el sistema muestra el estado final si lo prefiere.
8. **Legibilidad de aula**: cuerpo de 18–20 px, rótulos principales de 11 px, titulares móviles de ~45 px y cero overflow a 390 px.
9. **Fuente y hecho al margen**: historia y museo tienen un lugar visible para la procedencia y la incertidumbre.
10. **Un README que se lee como una casa**: tesis, doce estilos, lugares, historias, empresas, aulas, herramientas y límites.

## Lo que sigue en la mesa

- **Figura real** para decks y experiencias: `{ kind, alt, caption, source }`, no una imagen de stock.
- **Subfamilias estructurales**: `sequence`, `ornament`, `rhythm`, `material`, `type`, con un test de escala de grises que rechace recolores.
- **Motion por subfamilia**, no solo por estilo; `motion: none | subtle | full`.
- **Modo proyector / modo lectura** en todas las piezas: más cuerpo, más contraste, menos textura.
- **Mapa de recorrido** en experiencias: una planta textual y en SVG, no solo una rail.
- **Export PDF/PNG** con una página por sala y una por capítulo.
- **Datos verificables**: un campo de fuentes tipado y un chequeo de referencias, sin declarar verificación factual.

## Regla de la casa

> El modelo no necesita saber CSS. Necesita un brief con un objeto, una evidencia, un conflicto y un gesto; el harness pone la gramática; el validador pone el oficio; una persona responde por la verdad.

Los informes completos de los cinco roles quedaron en `qa/ideas-*.md` durante la sesión. Esta página conserva lo que cambió el repo.
