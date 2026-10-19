# Revisión visual y medida: brutalist/documentary semántico

**Aprobación visual: pendiente de revisión independiente.** Revisé hojas de contacto y cuadros PNG nativos de los dos locales, además de consultar controles decodificados de todos los paquetes. Esta autoinspección no se registra como visto bueno externo.

## Rondas de render e inspección

### 1. Composición y copia

- **Inspección:** primeros renders de filas, descarga y contador en hoja de contacto y cuadro nativo; comprobación de diagnósticos de ajuste del motor.
- **Defectos:** el arte semántico conservaba la columna estrecha señalada por la revisión anterior (ids y estados a unos 8–10 px efectivos, según esa revisión) y parte de la copia excedía el espacio disponible (`TEXT_OVERFLOW`).
- **Ajustes:** composición semántica aislada con 45% del ancho y 90% de alto para el objeto; tipo interior escalado y cajas declaradas; copias reducidas guiadas por el diagnóstico compartido. Las escenas antiguas no semánticas conservan su composición.
- **Comprobación:** las nuevas hojas y PNG de 640×360 muestran el ledger ocupando el área reservada; los manifiestos miden mínimo 14 px en cajas de texto del objeto y 20 px en titulares numéricos.

### 2. Procedencia de progreso e identidad de fila

- **Inspección:** hojas de contacto de descarga y filas, es/en; pausas y cuadros de inicio/error/reintento.
- **Defectos:** el inicio de descarga mostraba 18%, valor sin base en el brief, que solo fija el timeout en 42%. En inglés, el objeto decía `REC-204` mientras la copia decía `REG-204`.
- **Ajustes:** se quitó el porcentaje del estado de inicio; 42% queda visible desde el timeout y no cambia durante el reintento pendiente. Se unificó el identificador a `REG-204` en el objeto y la narración inglesa.
- **Comprobación:** el cuadro inicial muestra barra vacía sin porcentaje; timeout y reintento conservan 42% y sus sellos ocupan una casilla separada. El PNG nativo y la hoja final de filas en inglés muestran `REG-204` en ambos lugares.

### 3. Verificación visual tras corregir los ejemplos

- **Inspección:** después de regenerar, revisé PNG nativos de filas, descarga y contador; hojas de contacto de los tres fixtures y sus variantes solo arte; muestras en español e inglés.
- **Defecto observado:** en la hoja de contacto se comprobó el defecto anterior `REC`/`REG` junto con el resto del ledger; al inspeccionar el render corregido, ya coincidía el identificador y las fases mantenían la misma ficha.
- **Ajuste:** se volvió a inspeccionar el PNG y la hoja de contacto después de unificar el id y quitar el 18% inicial.
- **Comprobación:** las filas permanecen en el mismo ledger y el rechazo se registra en la segunda fila sin cubrir el texto; timeout, reintento y pendiente conservan un solo archivo y el mismo 42%; el contador cambia de 2 a 3 cuando la ficha C queda conectada. Las etiquetas de entidad aparecen en ambos locales.

### 4. Estados declarados que no dejaban marca

- **Inspección:** además de las imágenes, revisé los controles de transformación RGB de cada pausa y transición en los manifiestos.
- **Defecto:** algunas fases decían que la fila estaba revisada o que el total era esperado, pero el objeto repetía los mismos píxeles: el control informaba diff 0.0%. El contador también tenía una pausa final redundante.
- **Ajuste:** filas queda en cuatro fases y el estado `reviewed` agrega una anotación `CONSERVADA/RETAINED` en el espacio libre inferior del ledger. El contador termina en estado `pending` e imprime `ESPERADO/EXPECTED` en una casilla bajo el número. Ambas marcas se localizan y quedan dentro de las regiones comparadas.
- **Comprobación:** se regeneraron los paquetes y revisé las hojas de contacto y PNG nativos corregidos. Las transformaciones declaradas de las doce escenas principales pasan en sus manifiestos; ninguna marca cubre el texto de una fila o el número del contador.

## Medidas y evidencia de entrega

En los seis briefs brutalist, `rendered-legibility` informa mínimo efectivo de 14.0 px para cada caja declarada del objeto, a 640×360. Titulares numéricos: 20.0 px para progreso de descarga y 28.0 px para el contador. Filas no declara titular numérico. Los manifiestos registran dimensiones 640×360, decodificación íntegra, cuadros, duración, hashes, controles de transformación semántica y tamaños de GIF/PNG/contacto. Cada fixture es bilingüe y tiene variante solo arte. La tabla de tamaños y los enlaces están en [README.md](README.md); los paquetes viven en `brutalist/filas-duplicadas/`, `brutalist/descarga-pendiente/` y `brutalist/contador-coleccion/`.

La prueba `test/narrative-semantic-render.test.ts` incluye 16 renders brutalist (4 primitivas × 2 aspectos × 2 locales) y compara cambios en regiones del objeto decodificadas. La matriz de capacidad ofrece `supported` solo para esas celdas 16:9 y 1:1; 9:16 permanece `unsupported`. La escena no declara badges de flujo (`badgePolicy: none`); sus marcas de registro describen cambios semánticos y no tapan texto existente.

## Límite de la revisión

Las capturas nativas y hojas de contacto se inspeccionaron en esta tarea. No hubo aprobación de una persona independiente ni validación de hechos operacionales detrás de los ejemplos. La legibilidad medida es un proxy de tamaños tipográficos declarados; no es OCR ni sustituye la revisión humana a tamaño de tarjeta.
