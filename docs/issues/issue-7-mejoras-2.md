<!-- Snapshot of https://github.com/jdsalasca/open-beauty-site/issues/7 taken 2026-10-19 for agents. The live issue is the source of truth. -->
# Issue 7: mejoras 2 (segunda revisión del issue 3)

Open Beauty Site — segunda revisión del issue #3

Fecha: 19 de octubre de 2026. Repo: https://github.com/jdsalasca/open-beauty-site
Base revisada: `09bc6abbe4a9aac02416e7843a8acad12fa06faf`.
Issue: https://github.com/jdsalasca/open-beauty-site/issues/3

## Alcance y evidencia

Se verificaron el issue y su cierre, los PR #5 y #6 integrados, código del motor narrativo y documentación. Se inspeccionaron visualmente las hojas de contacto de papercraft/comparison, brutalist/comparison e isotype/comparison. Esta revisión no constituye aprobación visual de los 13 estilos ni comparación validada con la referencia privada de Grid. No se ejecutaron pruebas ni se regeneraron paquetes. El cierre reporta 338 pruebas; ese resultado pertenece al autor y no fue reproducido aquí. No se publicaron comentarios ni cambios remotos.

La base sí evolucionó: registro con 13 renderers, fuentes por estilo, narrativa de 3–5 fases, exportación GIF/PNG/contact sheet, evaluación separada y galería. La revisión visual pendiente y publicationRecommendation: none están expresadas con claridad. Conviene conservar estas garantías.

## Hallazgos prioritarios

### 1. Dar contenido semántico a la ilustración

Evidencia: `src/types/narrative.ts:36–41` solo modela visual.kind y visual.state como strings. `src/narrative/scenes/papercraft.ts:244–258` dibuja una guía fija con reglas y rótulos genéricos; `306–313` transforma señal/sello. La hoja de contacto muestra esa misma guía en las tres fases.

Consecuencia: se puede cambiar el relato sin cambiar el problema representado por el dibujo. Para historias de filas duplicadas, descargas o contadores, la imagen debe contener las entidades y la transformación relevantes. El texto puede explicar la escena, pero el cambio del objeto debe ser reconocible por sí mismo.

Propuesta: contrato de escena separado del estilo, con entidades identificadas, datos ilustrativos explícitos, relaciones y acciones. Primitivas iniciales: tabla/filas, tarjetas/colección, contador y archivo/descarga. Los estilos resuelven material, composición, tipografía y movimiento. No inventar cifras de impacto; distinguir datos ilustrativos de resultados medidos. Un ejemplo de filas duplicadas debe mostrar la repetición y el comportamiento exacto autorizado por el brief: detectar/rechazar/evitar, sin asumir que elimina registros.

### 2. Validar los estados que el renderer entiende

Evidencia: `papercraft.ts:168–174` devuelve estado 0 para un valor desconocido. El esquema admite strings arbitrarios. `evaluate.ts:248–254` combina strings distintos con píxeles distintos del GIF completo; los cambios de texto también producen píxeles distintos. Ese control no demuestra que el objeto haya cambiado según el estado solicitado, y su source: pixels mezcla evidencia de fuente y píxeles.

Propuesta: capabilities consultables por CLI/MCP, esquema por primitiva y validación antes del render. Un estado no soportado debe devolver un error con fase, valor y alternativas válidas. Separar cambio de texto, decoración y objeto semántico. Si solo cambió texto, el control de transformación del objeto debe quedar pendiente o fallar. Admitir fases con el mismo estado cuando narrativamente sean válidas.

### 3. Separar estado del trabajo y evidencia del resultado

Evidencia: `brief.ts:234–240` exige Resultado observado para done. La interfaz no pide evidencia de observación.

Propuesta: outcome.mode = expected | observed, independiente del estado del trabajo. Agregar evidenceRefs y una nota de alcance. Un resultado observado requiere evidencia identificable y revisión; done por sí solo no demuestra despliegue, medición ni efecto en usuarios. Para una propuesta puede usarse un flujo demostrativo rotulado como ilustración, sin afirmar impacto real.

### 4. Hacer opcionales los sellos de estado y localizar el arte

Evidencia: `papercraft.ts:176–180` fija REVISADA / EN REVISIÓN / PENDIENTE; el renderer los usa en el dibujo. También Guía, LECTURA y SEÑAL están fijos en español pese a locale: en.

Propuesta: badgePolicy = none | custom | workflow, con none para recursos de producto. Mantener estado y evaluación en el manifiesto y la galería. Localizar los textos de las ilustraciones, no solo las etiquetas narrativas. No quitar la distinción esperado/observado cuando sea necesaria para comprender el alcance.

### 5. Timing por fase y presets de lectura

Evidencia: `brief.ts:223–229` rechaza holds menores a 5000 ms. El brief solo tiene un hold global.

El mínimo de 5 s cumple el pedido original del issue #3. Nuestra necesidad posterior es distinta: también debemos poder producir historias cortas de cinco escenas y cuatro transiciones, con holds de 2 s cuando el texto sea breve.

Propuesta: presets readable y concise, holdMs por fase, alertas por carga de lectura y presupuesto total. Mantener 5 s como default seguro y permitir 2 s explícitos. Informar por separado duración de holds, transiciones y reinicio del loop; un hold de 2 s no equivale a una pieza total de 10 s si hay transiciones adicionales.

### 6. Convertir la revisión en un ciclo verificable de mejora

Evidencia: `evaluate.ts:213–223` calcula el balance usando sampledFrames[0]. El control de composición es un proxy sobre una única muestra, tal como declara la herramienta. Las hojas de contacto de isotype mantienen casi todo el objeto fijo y desplazan una señal pequeña. El cierre ya reconoce debilidades causales en isotype, opart y renaissance y advertencias de composición en ukiyoe; son pendientes conocidos.

Propuesta: revisar todos los holds, puntos medios de las transiciones y unión final/inicio. Añadir feedback estructurado por frame/fase/región: problema, severidad, evidencia y ajuste permitido. Persistir revisor, fecha, hash del GIF y veredicto por criterio. Una regeneración invalida la aprobación del archivo previo. Mantener controles técnicos y evaluación visual separados. No convertir un proxy de densidad en puntuación estética.

## Prompt listo para un nuevo issue

### Objetivo

Completar la segunda etapa del harness narrativo sobre la implementación del issue #3. El resultado debe permitir a un agente generar piezas profesionales que expliquen cambios concretos, revisar el GIF realmente exportado y corregirlo con evidencia. Conservar los 13 estilos, las fuentes incorporadas, la determinación por seed, los límites de recursos y los niveles de evaluación existentes.

### Trabajo solicitado

1. Diseñar un contrato de escenas con entidades persistentes, estados y acciones explícitas, independiente del tratamiento visual. Implementar primero papercraft y brutalist con tabla/filas, colección/tarjetas, contador y archivo/descarga. Documentar las capacidades reales de los otros 11 estilos y sus fallbacks explícitos. No declarar cobertura semántica de una primitiva sin mostrarla.
2. Exponer las capacidades y errores estructurados en CLI y MCP: estilos, primitivas, estados/acciones, composición, aspecto, idiomas y restricciones. El agente debe poder consultar las opciones antes de redactar el brief. Rechazar estados desconocidos con diagnóstico accionable.
3. Separar workflowStatus, outcome.mode y evidencia. Permitir Resultado esperado en historias terminadas cuando el beneficio siga sin medirse. Validar referencias para afirmar un resultado observado y conservar la necesidad de revisión humana del alcance.
4. Añadir badgePolicy, localización completa de los rótulos y timing por fase. Soportar cinco escenas con cuatro transiciones y holds de 2000 ms solicitados explícitamente; preservar 5000 ms como default de lectura y emitir advertencias justificadas por volumen de texto.
5. Añadir controles de transformación del objeto y revisión de todos los holds/transiciones/loop. Exponer feedback y rerender con trazabilidad de hashes y cambios. Una señal o sello decorativo no acredita por sí solo la transformación solicitada.
6. Mejorar las composiciones débiles ya reconocidas: isotype, opart, renaissance y ukiyoe. Preservar identidad visual original de cada estilo; no reutilizar una única tarjeta con distinta paleta para declarar la mejora de los 13.

### Demostraciones requeridas

- Filas duplicadas: repetición visible → identificación del problema → actuación exacta del proceso → estado posterior → beneficio esperado u observado según evidencia. No asumir eliminación de datos si el brief solo autoriza validación.
- Descarga: secuencia original y tratamiento del fallo específico, delimitando lo que permanece pendiente; evitar prometer solución de fallos que el cambio no aborda.
- Contador/colección: relación visible entre elementos y número, con semántica y alcance explícitos; no inventar causa ni solución de una historia real.
- Las tres son fixtures ilustrativos de la librería. Para usar historias reales, tomar requisitos y alcance de fuentes identificadas.

### Criterios de aceptación

- Al ver los holds consecutivos con el texto explicativo oculto se distingue la transformación principal del objeto en las escenas semánticas implementadas. Un revisor registra si la relación causal se entiende.
- Una acción o estado desconocido produce error antes de exportar; nunca cae silenciosamente al estado inicial.
- Cambiar exclusivamente el texto no aprueba el control de transformación del objeto.
- done y observed se pueden representar de forma independiente; una afirmación de beneficio medido exige evidencia.
- badgePolicy: none elimina los sellos de workflow de todos los frames, sin esconder la información de alcance necesaria.
- locale: en localiza también el contenido de las ilustraciones.
- Cinco holds de 2000 ms se decodifican con el timing solicitado. El manifiesto detalla los tiempos adicionales. También se conserva el preset de lectura de 5000 ms.
- Galería a 640×360 con GIF, PNG, contactos y evaluación por fase, además de vista nativa. Los problemas registrados enlazan a frames concretos.
- Entregar una matriz por estilo/primitiva/aspecto con supported, unsupported o fallback explícito; las celdas sin evidencia no figuran como aprobadas.
- Comparar antes/después sobre los mismos briefs y seeds. Presentar evidencia visual de las mejoras, costos de render y tamaño final. El autor del cambio puede ejecutar pruebas focalizadas, negativas y de regresión y registrar sus comandos/resultados.
- Mantener visual-review pendiente hasta revisión independiente. Una aprobación queda vinculada al hash exacto del artefacto y se invalida tras regenerarlo.

### Entregables

Contrato y migración compatibles, implementación, documentación para agentes, ejemplos con datos ilustrativos declarados, GIF/PNG/contactos, galería comparativa, matriz de capacidades y registro de revisión. No realizar instalaciones globales ni publicaciones externas como parte de esta tarea.
