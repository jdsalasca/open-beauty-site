<!-- Snapshot of https://github.com/jdsalasca/open-beauty-site/issues/10 taken 2026-10-19 for agents. The live issue is the source of truth. -->
# Issue 10: mejoras 3 (13 estilos profesionales en web, presentaciones y GIF)

# Prompt para mejorar Open Beauty: 13 estilos profesionales en web, presentaciones y GIF

## Encargo

Trabajá en `https://github.com/jdsalasca/open-beauty-site`. Base revisada: `4cb43799d5ae2aed5720b65424cfb4fd560f7536`, merge del PR #9 del 19 de octubre de 2026. Verificá el HEAD antes de empezar y adaptá este diagnóstico si cambió. Leé los issues #3 y #7 y sus comentarios. El #3 está cerrado y el #7 seguía abierto al momento de esta revisión.

El objetivo es que Open Beauty funcione como un sistema de dirección de arte y producción: a partir de un brief de negocio debe producir sitios web, presentaciones completas y GIF narrativos con composición cuidada, ilustraciones relevantes y trece identidades visuales reconocibles. La meta es consistencia entre temas y formatos, además de ejemplos bonitos.

Referencia de calidad: https://grid.adminml.com/d/01M50F2X7P22EER1R9VSX68F9S/view . Usala para estudiar jerarquía, composición, materialidad, legibilidad y cómo las ilustraciones explican conceptos. No copies contenido corporativo ni conviertas los trece estilos en papercraft. Si no podés acceder a la referencia, declaralo y pedí una captura/exportación antes de afirmar equivalencia visual.

## 1. Qué conservar y qué investigar

Ya existen escenas semánticas, primitivas de objetos, matriz de capacidades, separación entre estado del trabajo y resultado, locales, políticas de badges, tiempos por fase, feedback por frame, registro de revisiones, rerender e invalidación por hash. Extendé esos mecanismos. No implementes un segundo sistema paralelo ni presentes como nuevo lo ya entregado.

La revisión de esta base encontró:

- Las primitivas semánticas nuevas de papercraft y brutalist representan mejor la acción. La aprobación visual independiente sigue pendiente en los trece estilos.
- La matriz de 312 celdas distingue 58 supported, 158 fallback y 96 unsupported. No confundas integridad de la matriz con cobertura completa ni con calidad estética.
- Hay ejemplos web y portadas con buena ejecución visual. El trabajo debe conservar esa calidad y extenderla a contenido real y a todas las secciones/diapositivas.
- En `src/deck.ts`, la rama de figuras no papercraft pasa `'house'` a `sceneArt` e ignora la escena específica del brief. Confirmá el problema y corregí la pérdida de intención.
- En `src/page/papercraft.ts`, `heroArt()` no recibe el tema ni una escena; el collage está fijado en código. Conservá esa composición como ejemplo o plantilla, pero permití ilustraciones que correspondan al contenido.
- Los GIF repiten mucho título/texto a un lado y objeto al otro. Hay identidades visuales diferentes, pero falta variedad de composición y mejor protagonismo del objeto que cambia.
- El informe del issue 7 reconoce 8 de 14 pares históricos con GIF idéntico. Son regresiones conservadas, no evidencia de mejora visual.
- El informe registra `pnpm check:all` fallido por dos timeouts, aunque algunos reruns aislados pasaron. Investigá y obtené una corrida integral reproducible; no cambies el resultado histórico a verde.
- La normalización de decks contiene varios `slice` sobre textos. Distinguí límites explícitos de entradas frente a pérdida silenciosa de contenido, y eliminá esta última.

Primero entregá un mapa breve de rutas reales: brief → planificación → composición → renderer → exportación → evaluación → revisión. Señalá qué comparten web/deck/GIF y qué sigue siendo específico de cada motor. No declares paridad porque comparten nombre de estilo o tokens.

## 2. Contrato de dirección de arte

Cada estilo debe tener una especificación ejecutable y documentada que incluya:

1. Intención: personalidad, usos adecuados y limitaciones.
2. Composición: retícula, asimetrías permitidas, escala, espacio vacío, alineaciones y densidad.
3. Tipografía: familias y pesos disponibles, roles, tamaños por formato, interlínea, ancho de lectura, uso permitido de display y fallback explícito.
4. Color: superficies, texto, acentos, estados semánticos y contraste sobre el fondo final compuesto.
5. Materialidad: bordes, sombras, grano, recortes y profundidad. Debe ser visible sin ensuciar la lectura.
6. Ilustración: vocabulario de formas y reglas para representar entidades, relaciones y acciones del brief.
7. Movimiento: entradas, transformaciones, continuidad entre escenas y quietud durante la lectura.
8. Reglas negativas: usos que destruyen ese estilo o dificultan comprender el mensaje.
9. Adaptación a web, slides y GIF, con ejemplos reales de cada una.

Los tokens son parte del sistema, no toda la dirección de arte. La elección de un estilo debe influir en composición, ilustración y movimiento, además de colores y fuentes.

## 3. Requisitos por estilo

| Estilo | Dirección esperada | Evitar |
|---|---|---|
| papercraft | Papel cálido, capas y sombras coherentes, recortes, pequeños desplazamientos, objetos de negocio construidos en papel, anotaciones puntuales. | Cinta y flores repetidas sin relación con el tema; etiquetas minúsculas; rotaciones que afecten la lectura. |
| brutalist | Retícula editorial marcada, bloques contundentes, tipografía firme, bordes, sellos y documentos. Variante burocrática retro original inspirada en la materialidad de formularios. | Copiar recursos de Papers, Please; confundir brutalismo con mala alineación; convertir todos los datos en monoespaciado diminuto. |
| artdeco | Simetría y ejes, geometría escalonada, marcos arquitectónicos, contraste oscuro/claro y acentos metálicos contenidos. | Solo añadir un borde dorado a la plantilla genérica o usar texto estrecho ilegible. |
| bestiary | Manuscrito ilustrado, iniciales y marginalia controladas, criaturas con función explicativa, textura de tinta/pergamino. | Repetir siempre el mismo búho o dificultar el cuerpo con tipografía ornamental. |
| galactic | Profundidad, órbitas y trayectorias que representen relaciones, escalas y rutas claras, paneles limpios. | Planeta decorativo permanente sin vínculo con lo narrado. |
| isotype | Pictogramas coherentes, agrupación y correspondencia visual, cantidades fieles, leyendas y unidades cuando corresponda. | Inventar cantidades, sugerir métricas con figuras arbitrarias o cambiar solo el rótulo. |
| memphis | Geometría lúdica, asimetría intencional, color y patrones con zonas tranquilas de lectura, ritmo editorial. | Confeti uniforme por todas partes o competencia entre patrón y mensaje. |
| nature | Vocabulario botánico, crecimiento, ramificación y ciclos aplicados a la historia; materiales orgánicos y espacio respirable. | Hoja idéntica para cualquier brief, decoración que no exprese la acción. |
| opart | Ritmo óptico en zonas delimitadas, contraste y geometría como sistema, lectura estable y causalidad explícita. | Franjas detrás de textos, movimiento óptico continuo durante lectura o efectos que oculten qué cambió. |
| psychedelic | Contornos fluidos, gradientes/paletas expresivas, display acotado y espacios de lectura estables. | Distorsionar párrafos, exceso de capas o movimiento que impida seguir la secuencia. |
| renaissance | Proporción y composición clásicas, pigmentos, planos y marcos con función, serif editorial legible e ilustración original adecuada al tema. | Limitarlo a Garamond y un arco o introducir imágenes sin permisos/procedencia. |
| ukiyoe | Planos de profundidad, línea de grabado, color plano, horizonte y movimiento direccional, objetos semánticos dentro de esa gramática. | Aplicar olas y un sol de forma idéntica a todas las historias. |
| vaporwave | Interfaces retro, ventanas, retícula y cromatismo controlados; pixel display en usos pequeños y cuerpo limpio. | Párrafos completos pixelados, exceso de glow o interfaz que no permita entender el producto. |

En papercraft, ofrecé al menos dos perfiles coherentes: editorial con Fraunces y amistoso/redondeado cercano a la referencia. La referencia usa Fredoka, Nunito y Caveat con roles diferenciados. No significa sustituir todas las fuentes ni usar manuscrita para párrafos. Comprobá archivos, pesos, licencias y disponibilidad en la exportación.

## 4. Contenido y escenas que explican

Extendé el contrato semántico existente para describir entidades con identidad estable, propiedades, relaciones, estados y acciones. El objeto que aparece en el problema debe poder reconocerse cuando cambia y cuando llega al resultado.

Ejemplos de acciones: detectar, señalar, rechazar, conservar, ordenar, agrupar, guiar, reintentar y recuperar. No son equivalentes. Una validación que rechaza una guía no debe ilustrarse como si limpiara automáticamente las filas; una recuperación no debe prometer que ya no habrá errores.

El contrato debe permitir indicar qué región del objeto cambia y qué significado tiene la transición. El adaptador de cada estilo debe preservar ese significado. Cuando no soporte una combinación, devolvé una alternativa explícita o un error accionable; nunca sustituyas silenciosamente la escena por una casa, flor, planeta o adorno genérico.

Usá ilustraciones originales en SVG/Canvas o recursos con procedencia verificable. Si integrás un proveedor de imágenes, hacelo opcional, con permisos y costos explícitos; el camino básico debe seguir funcionando. No dependas de red para reproducir un artefacto cuando ya están disponibles sus assets.

## 5. Composición por formato

### Presentaciones

Diseñá una biblioteca de composiciones reales: portada, problema, comparación, proceso, ejemplo concreto, resultado y próximos pasos. Debe poder mostrar tablas simples, diagramas, capturas y multimedia. No resuelvas todas como cuadrículas de tarjetas.

Cada slide debe tener un foco principal. La secuencia debe alternar escala, posición y densidad para crear ritmo, sin perder coherencia de estilo. La composición se elige por el contenido y el propósito; la aleatoriedad solo puede resolver variantes equivalentes y debe ser reproducible.

Corregí la pérdida de intención en figuras y cualquier truncamiento silencioso. Ante texto excesivo: proponer resumen separado del original, dividir contenido, cambiar composición o devolver un diagnóstico. No achicar todo hasta volverlo ilegible ni borrar el final sin avisar.

Evaluá todas las diapositivas, no únicamente la portada. El HTML exportado debe navegar con teclado, preservar texto seleccionable y tener alternativa de movimiento reducido. Verificá el comportamiento del deck y sus medios en el tamaño real de presentación.

### GIF narrativo

Preset principal para review de producto: tres escenas, **Problema → Solución → Highlight**. Una idea visual por escena. Titular sugerido de 3–7 palabras y, cuando haga falta, una sola frase breve. Estos límites son guías editoriales, no cortes automáticos de caracteres.

- Preset breve: alrededor de dos segundos de lectura estable por escena, solo con texto realmente corto.
- Preset legible: alrededor de cinco segundos por escena y ajuste según cantidad de texto.
- Separar tiempo de lectura y tiempo de transición, usando el soporte existente.
- Permitir cuatro o más escenas cuando la historia lo necesite, sin imponerlas a toda pieza.
- La transformación debe verse en el objeto, además del texto: señalar una fila, mostrar un rechazo, conservar una estructura, ofrecer un reintento.
- El centro visual debe ser suficientemente grande en 640×360. Revisar también 1280×720; no certificar lectura mirando solo una contact sheet.
- Sin estados Jira, códigos internos, entornos, PRs ni métricas inventadas por defecto. Los resultados esperados y medidos deben seguir diferenciados en el contrato.
- Pausa real en cada escena, transiciones cortas y suaves, continuidad entre objetos y loop que no sugiera una acción inexistente.
- Exportar GIF real, PNG por escena, contact sheet y manifest de duración, dimensiones, frames y assets. MP4 puede ser opcional, no reemplazo del GIF.
- Comprobar paleta, bordes, dithering, fuentes y frames decodificados del archivo final.

### Sitios web

La identidad debe sobrevivir al pasar del hero a secciones de explicación, comparación, proceso y CTA. Ofrecé variantes de composición, no una única landing para todos los briefs.

Las ilustraciones deben recibir contenido/escena; los collages fijos pueden ser una opción deliberada. Para cada CTA debe existir destino o una limitación visible. Usá HTML semántico, teclado, estados de foco, contraste y movimiento reducido. Revisá 360, 768 y 1440 píxeles de ancho. No escondas problemas de diseño con overflow oculto.

## 6. MCP, CLI y skill como harness

Reutilizá `beauty_make`, `beauty_create_narrative`, `beauty_get_capabilities`, `beauty_review_artifact`, `beauty_get_review_state` y `beauty_rerender_narrative`, verificando sus nombres y contratos actuales.

El flujo guiado debe ser:

1. Entender audiencia, propósito, formato y fuente de verdad.
2. Identificar el mensaje y seleccionar una estructura visual compatible.
3. Elegir estilo y perfil; explicar fallbacks antes del render.
4. Producir storyboard/composición y textos breves revisables.
5. Renderizar y exportar.
6. Inspeccionar el archivo final y generar diagnósticos concretos.
7. Aplicar feedback mediante el ledger existente.
8. Rerenderizar y repetir hasta resolver hallazgos o declarar límites.

La skill debe enseñar este flujo con ejemplos end to end, entradas buenas y malas, criterios para elegir estilos y cómo interpretar un fallo. No alcanza un catálogo de prompts ni instrucciones de “hacelo hermoso”.

Registrá brief normalizado, versión del motor, fuentes/assets, semilla, capacidades utilizadas, advertencias, output hashes, revisiones y estado final. Si cambia cualquier artefacto revisado, invalidá la aprobación correspondiente. No construyas una aprobación automática estética a partir de checks de markup.

## 7. Calidad verificable

Separá cuatro resultados:

- Integridad técnica: exporta, abre, reproduce y conserva el contenido.
- Legibilidad: se puede leer en el tamaño real, sin colisiones ni texto perdido.
- Claridad narrativa: se entiende problema, acción y alcance del resultado.
- Dirección de arte: composición, tipografía, materialidad e identidad convincentes.

Un A100 técnico no aprueba las otras tres dimensiones. Un diff de píxeles no demuestra que la transformación sea correcta. Conservá pruebas negativas para cambios solo de texto o decoración y añadí revisión del significado de la escena.

Además de geometría fuente, inspeccioná el resultado compuesto: contraste sobre textura real, ocupación de líneas, anotaciones y etiquetas, densidad, recortes y adaptación. Usá feedback localizado con escena/frame, síntoma, causa probable, cambio pedido y criterio de cierre.

La aprobación visual requiere una persona o un revisor independiente con capacidad real de ver las imágenes. Si esa capacidad no está disponible, el estado debe seguir pendiente. No simules una revisión visual ni cierres feedback cambiando únicamente el informe.

## 8. Benchmark de los trece estilos

Construí una galería que permita comparar el mismo brief en los trece estilos y los tres formatos: al menos 39 familias de entregables.

Brief principal ficticio: una guía con una fila completamente duplicada; una validación la detecta y rechaza esa entrada; la persona recibe una indicación para corregirla. No representar eliminación automática ni atribuir métricas. Sumá dos briefs de transferencia: recuperación de una descarga fallida y orientación para corregir información. La calidad debe sostenerse al cambiar de tema.

Para cada estilo del benchmark principal:

- Web de al menos cuatro secciones revisada en tres anchos.
- Deck de seis slides con problema, solución, ejemplo, resultado y próximos pasos, además de portada según contrato.
- GIF de tres escenas con PNGs y timings reales.
- Una ficha con intención, decisiones tipográficas, significado de la ilustración y limitaciones.

Variá longitud de texto, acentos en español, palabras largas y locales admitidos. Probá las combinaciones adicionales de aspecto/localización únicamente cuando se afirmen como soportadas. No fabriques cobertura para llenar una tabla.

Criterios de aceptación visual:

1. Se reconoce el estilo por composición, tipografía e ilustración, incluso ocultando su nombre.
2. Cada historia tiene un cambio comprensible y fiel al brief.
3. Los trece resultados no reutilizan exactamente la misma composición con otra decoración.
4. La lectura funciona a tamaño real.
5. Las slides interiores mantienen la calidad de la portada.
6. La web mantiene su calidad debajo del hero y en móvil.
7. Se observa una mejora concreta respecto de la base donde había un problema. Los casos idénticos se registran como conservados, no como mejorados.
8. Cualquier feedback no resuelto sigue visible; no se declara aprobación global por aprobar dos estilos.

## 9. Implementación por etapas

Primero cerrá papercraft y brutalist de punta a punta en los tres formatos, incluyendo revisión de todas las piezas. Después abordá isotype/opart y otros estilos con mayores dificultades de legibilidad o significado. Finalmente completá el resto, sin dejar el objetivo en dos pilotos.

Elegí la arquitectura mínima que preserve compatibilidad. Introducí pruebas junto a las correcciones: pérdida de escenas, contenido truncado, fallback silencioso, fuentes faltantes, regeneración y aprobación por hash. Ejecutá los comandos documentados del repo, investigá los timeouts integrales y reportá comando, entorno y resultado real. No cambies pruebas para que acepten ejemplos débiles.

Antes/después debe mantener brief, semilla y condiciones comparables. Si modificás el brief para mejorar contenido, mostrala como una comparación editorial distinta y documentá ambas entradas.

## 10. Entregables y cierre

Entregá código, contratos y skill actualizados; galería web/deck/GIF; archivos finales; manifests; matriz de capacidades por formato/estilo y las dimensiones que el motor realmente usa; informe de tests; feedback aplicado; y comparación visual antes/después con enlaces reproducibles.

En el resumen final indicá: qué mejoró, qué sigue igual, qué está soportado con evidencia, qué usa fallback y qué permanece pendiente. Mostrá ejemplos representativos y todas las slides/escenas para revisión. No cierres el issue solo por la existencia de documentación o por una puntuación automática.

No publiques paquetes, instales globalmente, cambies configuraciones del usuario ni hagas despliegues sin autorización del propietario. El trabajo debe quedar concreto y revisable en la rama acordada.


--- COMMENTS ---

