# Revisión visual y medible: papercraft semántico

**Estado de aprobación visual: pendiente de revisión independiente.** Las imágenes renderizadas y decodificadas sí se inspeccionaron en esta tarea. El estado pendiente evita tratar esa autoinspección como aprobación independiente.

Se realizaron tres rondas de render → inspección de hojas de contacto y cuadros decodificados → corrección → nuevo render. En cada ronda se revisaron pausas de fase, puntos medios de transición y unión último→primero del ciclo. Las capturas temporales se mantuvieron fuera del repositorio; los paquetes entregables están en `semantic/papercraft/<fixture>/`.

## Iteración 1 — filas duplicadas

- **Capturas revisadas:** repetición visible y fila rechazada en pausa; punto medio entre identificación y rechazo; cuadro de unión del ciclo; hojas de contacto es/en y solo arte.
- **Defecto observado:** la marca `ILUSTRATIVO` quedaba demasiado pequeña para leerse como etiqueta editorial a tamaño nativo.
- **Corrección:** se aumentaron las dimensiones de la cinta y el tamaño de su texto.
- **Comprobación posterior:** la marca quedó legible en la inspección nativa. El objeto conserva ambas filas; la repetida se señala y luego se rechaza, sin borrar registros.

## Iteración 2 — descarga pendiente

- **Capturas revisadas:** fallo por tiempo de espera, reintento y progreso todavía pendiente en pausa; punto medio de transición y unión del ciclo; hojas de contacto es/en y solo arte.
- **Defecto observado:** el glifo Unicode de reintento no estaba presente en las fuentes y aparecía como un recuadro vacío.
- **Corrección:** se sustituyó el glifo por una flecha curva dibujada con trazos vectoriales de la escena.
- **Comprobación posterior:** la flecha se renderiza nítida en el cuadro nativo. El reintento mantiene el 42 % confirmado; la descarga queda pendiente y no se promete resolver fallos distintos del tiempo de espera ilustrado.

## Iteración 3 — contador y colección

- **Capturas revisadas:** conteos 2 y 3 en pausa, punto medio con tres fichas relacionadas y unión del ciclo; hojas de contacto es/en y solo arte.
- **Defecto observado:** las líneas que relacionaban fichas con el contador eran demasiado finas y no comunicaban dirección.
- **Corrección:** se aumentó el contraste y el grosor, y se añadieron puntas de flecha hacia el contador.
- **Comprobación posterior:** las relaciones se distinguen en el cuadro nativo. El valor cambia de 2 a 3 cuando se añade explícitamente la ficha C; la colección y el alcance permanecen visibles.

## Estado de evidencia

- Los manifiestos registran comparación de regiones semánticas por entidad entre fases consecutivas, entidad(es) cuyo estado cambió, balance en cada pausa, punto medio y unión del ciclo. Los GIF se decodifican para medirlos; cambiar solo el texto o la decoración no hace pasar el control.
- Las seis hojas de contacto finales, sus versiones solo arte y cuadros nativos de las fases señaladas se inspeccionaron visualmente. La variante solo arte elimina el texto explicativo del relato para facilitar la revisión de la transformación del objeto.
- La revisión visual queda **pendiente** de una persona independiente; no se declara aprobación visual. La revisión de arte tampoco sustituye la verificación del comportamiento real descrito por cada brief ilustrativo.

## Actualización: legibilidad semántica de etapa 2b

Se aplicó la composición semántica de 45% del ancho y 90% de alto también a papercraft, sin cambiar el layout de briefs heredados. Se regeneraron los seis paquetes bilingües, incluidos sus seis equivalentes solo arte. La revisión del orquestador había estimado 8–10 px efectivos para ids, estados y cifras antes del cambio; los manifiestos actuales miden 14.0 px mínimos en las cajas interiores declaradas, 20.0 px para el porcentaje principal y 34.0 px para el número del contador. El contador conserva la ficha C fuera de las relaciones que suman 2 y la conecta al pasar a 3; no se oculta el conjunto de referencia.

En la inspección de estas regeneraciones revisé hojas de contacto y PNG nativos para filas, descarga y contador en es/en. El inicio de descarga ya no lleva el 18% sin sustento; el 42% aparece en el timeout y se conserva durante el reintento pendiente. Los valores de texto que no cabían se acortaron con los diagnósticos `TEXT_OVERFLOW` del motor, sin truncarlos. La prueba de galería confirmó que estos cambios semánticos no alteran los paquetes heredados. La aprobación visual independiente continúa **pendiente**.

La revisión de los manifiestos después de esa inspección detectó que el estado final de la tabla y del contador cambiaba en el brief, pero no en los píxeles del objeto (diff decodificado 0.0%). Se añadió la nota `CONSERVADA/RETAINED` en el espacio vacío inferior de la tabla y `ESPERADO/EXPECTED` bajo el contador; el último estado numérico ahora queda diferenciado sin alterar su valor. Se acortó la secuencia de filas a cuatro fases para quitar una pausa repetida. Volví a renderizar y a mirar hojas de contacto y cuadros nativos; los 12 paquetes semánticos principales ya no tienen transformaciones fallidas en sus manifiestos. La medida sigue siendo tipográfica y no implica aprobación visual independiente.
