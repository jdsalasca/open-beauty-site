# Revisión del pase de composición narrativa

**Estado:** cuatro iteraciones de render y revisión visual completadas. La aprobación visual de los paquetes sigue `pending`; esta revisión documenta evidencia de render y una inspección interna, no un aval editorial independiente.

## Iteraciones render → inspección → ajuste

En cada iteración se renderizaron las 13 composiciones representativas y se observaron sus hojas de contacto y fotogramas nativos de 1280×720. La última inspección también cubrió los tres holds nativos de cada estilo (39 imágenes). El proceso fue:

1. **Pase 1 — primera ampliación del texto.** La inspección confirmó que el problema era compartido: el bloque seguía concentrado en la parte alta y sobraba área bajo el cuerpo. Se amplió la tipografía en el motor y se acotaron las cajas para envolver sin cortar copia.
2. **Pase 2 — proporciones por estilo y zona segura.** Se ajustaron las cajas de arte donde los objetos principales quedaban estrechos, se incorporó el margen vertical de 5% y se desplazaron a la izquierda las anotaciones de Nature. La comparación visual mostró que la relación entre título y cuerpo había mejorado, pero el bloque aún necesitaba ocupar más altura.
3. **Pase 3 — control de píxeles.** La nueva cuadrícula de 8×4 encontró relleno vertical de 50% en Bestiary, Memphis, Papercraft, Psychedelic y Ukiyoe. Se aumentaron los espacios jerárquicos compartidos y se volvió a renderizar la matriz representativa.
4. **Pase 4 — espaciado final y confirmación.** Dos separaciones jerárquicas de 10% de la altura del cuadro elevaron el relleno mínimo por estilo a 75%. Las 13 hojas y sus 39 holds se inspeccionaron de nuevo. El proxy conserva una advertencia para Ukiyoe porque su rectángulo vacío mayor alcanza 25%; corresponde al cielo amplio de esa dirección y no se oculta ni se trata como aprobación estética.

Tras esos pases se regeneraron con el CLI los 28 paquetes de sus carpetas existentes. Cada carpeta ya contenía los cuatro artefactos esperados, sin archivos generados sobrantes que retirar. El test de reproducción confirma coincidencia byte por byte de GIF, PNG y hoja de contacto. La inspección visual de los pases no cambia el estado de revisión de los manifiestos: sigue `pending`.

## Métricas por estilo

Los valores **antes** se calculan sobre los artefactos versionados antes de este pase; los valores **después**, sobre los 28 paquetes regenerados. Para cada estilo, vacío es el promedio de sus paquetes; relleno es el mínimo; rectángulo vacío es el máximo. Tamaño de cuerpo es el mínimo de las fases y paquetes del estilo. El balance se mide en el primer hold decodificado de cada paquete. Se expresa el relleno y las áreas como porcentaje de las celdas/filas del proxy.

| Estilo | Celdas vacías antes → después (prom.) | Columna de texto antes → después (mín.) | Mayor rectángulo vacío antes → después (máx.) | Cuerpo nativo antes → después | Cuerpo efectivo a 640×360 antes → después |
|---|---:|---:|---:|---:|---:|
| Art Deco | 51.6% → 39.1% | 75% → 75% | 15.6% → 12.5% | 40 → 53 px | 20 → 26.5 px |
| Bestiary | 28.1% → 18.8% | 75% → 100% | 18.8% → 12.5% | 40 → 56 px | 20 → 28 px |
| Brutalist | 21.9% → 17.7% | 75% → 100% | 15.6% → 12.5% | 40 → 56 px | 20 → 28 px |
| Galactic | 53.1% → 50.0% | 75% → 100% | 18.8% → 18.8% | 40 → 54 px | 20 → 27 px |
| Isotype | 31.3% → 29.7% | 75% → 75% | 12.5% → 12.5% | 40 → 54 px | 20 → 27 px |
| Memphis | 28.1% → 9.4% | 75% → 100% | 18.8% → 6.3% | 40 → 56 px | 20 → 28 px |
| Nature | 23.4% → 10.9% | 75% → 100% | 12.5% → 9.4% | 40 → 54 px | 20 → 27 px |
| Op Art | 17.2% → 10.9% | 75% → 100% | 12.5% → 9.4% | 40 → 51 px | 20 → 25.5 px |
| Papercraft | 31.3% → 24.0% | 75% → 75% | 25.0% → 15.6% | 40 → 56 px | 20 → 28 px |
| Psychedelic | 48.4% → 32.8% | 75% → 100% | 25.0% → 15.6% | 40 → 56 px | 20 → 28 px |
| Renaissance | 21.9% → 20.3% | 75% → 75% | 18.8% → 12.5% | 40 → 56 px | 20 → 28 px |
| Ukiyoe | 43.8% → 28.1% | 75% → 100% | 25.0% → 25.0% | 40 → 56 px | 20 → 28 px |
| Vaporwave | 18.8% → 12.5% | 75% → 75% | 12.5% → 12.5% | 40 → 53 px | 20 → 26.5 px |

Las métricas son una señal de balance de composición basada en píxeles decodificados, no una puntuación estética: una celda ocupada indica variación de luminancia respecto al fondo local; el bloque vacío mayor se calcula sobre una cuadrícula gruesa de 32 celdas. Un cambio de una fila equivale a 25 puntos porcentuales en el relleno. No detecta semántica, lectura humana ni colisiones finas de texto. El control negativo con contenido concentrado arriba a la izquierda queda en `revise`; el control de cuerpo de 19.5px falla el mínimo efectivo de 20px.

## Cambios de caja y revisión visual

La tabla de proporciones exactas y sus motivos está en [ARCHITECTURE.md](../ARCHITECTURE.md#per-style-composition-contract). En resumen, Art Deco y Op Art reciben 2 puntos porcentuales más de ancho de arte; Bestiary, Ukiyoe, Psychedelic y Memphis reciben 18 puntos más y el carril de altura completo; Papercraft y Brutalist ceden 3 puntos al texto; Galactic, Nature y Vaporwave ceden 1 punto; Renaissance e Isotype adoptan el inset vertical de 5%. El dibujo de escena no cambió, salvo la anotación de Nature, cuyo `labelX` pasa de 0.69 a 0.62 del ancho del arte. En los tres holds nativos revisados, `OBSERVACIÓN` y `EN REVISIÓN` quedan dentro de la zona segura de 5%.

La revisión visual interna pudo inspeccionar las 13 hojas de contacto y los 39 holds nativos finales de 1280×720. El cuerpo ocupa visualmente la columna izquierda con sus jerarquías y el objeto conserva su caja a la derecha en los tres estados. No se hizo OCR, medición de lectura por personas a 640×360 ni aprobación editorial independiente. Por eso los 28 manifiestos conservan `visual-review: pending` y `publicationRecommendation: none`.

## Integridad de los paquetes regenerados

- 28 de 28 paquetes se renderizaron desde sus briefs con el CLI; el test de reproducción comprueba byte por byte GIF, PNG y contacto.
- Cada GIF decodifica a 1280×720 y conserva los tres holds de 5000ms, el puente explícito de loop y `loopCount: 0`.
- Los 28 GIF permanecen bajo 6 MiB; el mayor ocupa 1,444,112 bytes.
- Dos manifiestos Ukiyoe quedan correctamente en `revise`: el rectángulo vacío mayor es 25%, superior al umbral de 22%, por el cielo intencionalmente amplio. El aviso es una limitación visible del proxy que requiere criterio humano.
