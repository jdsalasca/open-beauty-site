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
