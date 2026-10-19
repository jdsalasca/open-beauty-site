<!-- Snapshot of https://github.com/jdsalasca/open-beauty-site/issues/3 taken 2026-10-19 for agents. The live issue is the source of truth. -->
# Issue 3: mejoras (narrative GIF, tipografía, 13 estilos, harness honesto)

# Elevar los 13 estilos a calidad editorial profesional: tipografía, composición, narrativa GIF y controles sobre el resultado exportado

## Encargo para el agente

Actuá como director de arte, ingeniero de render y responsable de calidad de Open Beauty Site. Mejorá los **13 estilos existentes** para que una persona o un modelo pequeño puedan producir piezas profesionales, legibles y reconocibles con un brief sencillo. El entregable central son **GIF reales que cuentan una historia**, acompañados de un PNG y una galería de revisión. Conservá la utilidad de páginas, decks, stories, experiences, canvas y motion.

No des por terminado el trabajo porque el HTML cumple tokens, porque un archivo tiene extensión GIF o porque un validador devuelve A y 4/4. Inspeccioná lo que realmente se exporta. Mostrá evidencia de cada estilo y corregí las piezas deficientes.

### Contexto de uso

El público principal de esta mejora es Producto en una Sprint Review. Necesita entender qué problema había, qué cambió y qué resultado se obtuvo o se espera. El lenguaje debe ser español claro, sin códigos de campos, ambientes, endpoints ni detalles internos innecesarios. Los GIF van dentro de un recuadro de una presentación: deben funcionar a tamaño de tarjeta, además de poder ampliarse.

Preferencias del usuario:

- Archivo final **GIF animado**, descargable y visible dentro de su tarjeta; PNG estático y vista ampliada.
- Historia **Antes → Cambio → Resultado**; si el trabajo sigue abierto, decir **Resultado esperado**.
- Ritmo lento para leer: comenzar con **5 segundos de texto completamente visible por fase**, ajustables hacia arriba según la extensión. La transición no consume ese tiempo de lectura.
- Cada animación debe explicar una transformación concreta. Mover adornos o revelar un título no sustituye la historia.
- Papercraft editorial y un brutalismo documental inspirado en trámites, sellos y formularios son referencias deseadas. El segundo puede recordar la atmósfera de *Papers, Please*, con arte original y tipografía legible; no copiar sprites, interfaces o recursos del juego.
- El resto de los estilos debe conservar identidad propia. No convertir los 13 en variaciones de papercraft.

Referencia aportada por el usuario: https://grid.adminml.com/d/01M50F2X7P22EER1R9VSX68F9S/view . Si no podés acceder, informalo y pedí capturas concretas; no afirmes haberla reproducido. Extraé de ella principios observables de jerarquía, espacio, material y ritmo, sin copiar contenido.

## Base auditada y límites de esta descripción

Auditoría estática del commit **`84c54b413d94a28b24f9275015c0fe694454da00`**, rama `main`, consultado el 18 de octubre de 2026. Antes de implementar, revisá el HEAD actual y adaptá el diagnóstico a cambios posteriores. Los hallazgos siguientes provienen de lectura de código; **no constituyen una evaluación visual de los GIF renderizados**.

### Capacidades existentes que debés aprovechar

- Ya hay 13 presets, guías, `typeSystem`, `motionSystem`, subfamilias, recetas y ejemplos.
- Ya existen `makeArtifact`, `fixHtml`, crítica, validación, generación de GIF, secuencias y herramientas MCP. No plantees crearlos desde cero.
- Ya hay una comprobación de determinismo byte a byte en `test/make.test.ts:86–95`. Ampliar su cobertura a la ruta narrativa y a metadata cuando corresponda; no presentar determinismo como capacidad ausente.
- Las secuencias ya admiten múltiples frames y duración por frame; extendelas cuando sea conveniente.
- Ya hay fuentes empaquetadas y un error ante archivos de fuentes ausentes. El problema a resolver incluye cobertura e identidad por estilo, no simplemente agregar un loader.
- Los documentos `ART-DIRECTION.md` y `STYLE-REVIEW-2026.md` ya describen intención editorial, límites al movimiento y legibilidad. Convertí esas promesas en comportamiento y evidencia del render.

### Hallazgos reproducibles en fuente

1. **Identidad tipográfica reducida en GIF.** Diez estilos apuntan a `frameShowcase`; esa función selecciona solo Space Mono, EB Garamond o Archivo Black. Esto no preserva las parejas tipográficas específicas que documentan las guías de esos estilos. Compartir utilidades está bien; compartir una dirección de arte genérica para estilos distintos requiere corrección. [src/gif.ts:770](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/gif.ts#L770), [registro:1092](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/gif.ts#L1092).
2. **La ruta GIF simple no alcanza para la narrativa solicitada.** `GifOptions` ofrece título/subtítulo/template, sin fases semánticas, y `createGif` limita la duración a 1–6 segundos y cada dimensión a 1200. No puede expresar directamente tres pausas legibles de cinco segundos ni un preset 1280×720 sin alterar medidas. Las secuencias tienen otra capacidad y deben evaluarse antes de duplicar infraestructura. [src/types.ts:540](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/types.ts#L540), [src/gif.ts:1116](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/gif.ts#L1116).
3. **Texto puede perderse silenciosamente.** Cuando el título no cabe al tamaño mínimo, `layoutTitle` recorta líneas con `slice(0, maxLines)`. Debe devolver un diagnóstico de desborde o proponer una distribución, sin eliminar significado. [src/gif.ts:134](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/gif.ts#L134).
4. **El score del GIF no mide calidad visual.** `runGif` considera cabecera GIF89a, cantidad de frames reportada, dimensiones reportadas y más de 1024 bytes. Eso puede devolver `vision:4/4` sin verificar lectura, jerarquía, movimiento efectivo, fuentes, narrativa o frames decodificados. La recomendación `no changes are needed` puede salir de la ausencia de issues mecánicos. Separá integridad técnica de evaluación estética. [src/make.ts:328](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/make.ts#L328), [nextStep:299](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/make.ts#L299).
5. **Fuentes raster limitadas.** `canvas.ts` registra cinco familias: Archivo Black, Space Mono, EB Garamond, Fraunces y Nunito Sans. El render GIF debe resolver de forma explícita las familias de los otros estilos o documentar alternativas aprobadas y probarlas visualmente. No asumir que una familia solicitada está disponible por existir en CSS. [src/canvas.ts:7](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/canvas.ts#L7).
6. **Paleta construida con una sola imagen.** El GIF simple usa un probe; secuencia obtiene la paleta del primer frame. Hay que verificar colores de estados posteriores, contraste, tramado y banding del GIF decodificado, especialmente si cada fase incorpora colores nuevos. Esto es un riesgo de representación, no un defecto visual confirmado. [src/gif.ts:1149](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/gif.ts#L1149), [src/sequence.ts:138](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/sequence.ts#L138).
7. **Deriva entre guía y comportamiento.** `skills/beauty.md` anuncia `make` y `fix` como futuros, aunque la CLI ya implementa ambos. Además, la dirección de arte de Renaissance pide campos planos sin glow radial y su renderer GIF crea gradientes radiales. Reconciliá documentación y código con una decisión editorial explícita; no borres las guías para hacer pasar el código. [src/cli.ts:160](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/cli.ts#L160), [src/gif.ts:291](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/gif.ts#L291).

8. **Error de cálculo temporal en secuencias — resolver antes de usar esta ruta como base.** `repeats = max(1, floor(360 / planned))` multiplica los frames de cada escena, pero conserva su delay. Por cálculo estático, tres escenas de 0,5 s a 6 fps planean 9 frames, obtienen `repeats=40` y escriben 360 frames con delay solicitado de 167 ms: alrededor de un minuto frente a 1,5 s declarados. El valor final exacto depende de la cuantización del delay GIF y debe medirse al decodificar. En el otro extremo, `planned > 360` no se rechaza ni limita mediante esa fórmula. No ejecutamos este caso en la auditoría: incluirlo como reproducción y verificar ambos extremos al implementar. [src/sequence.ts:127](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/sequence.ts#L127).
9. **La secuencia rasteriza escenas estáticas y las repite.** `frameSvg` fija `frameTime:0.86` y `staticFrame:true`; la codificación carga una imagen por escena y repite esos mismos píxeles. Por tanto, no basta configurar una duración para obtener una transición entre escenas. Extender el modelo para evaluar los estados intermedios reales sin perder los holds. [src/sequence.ts:35](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/sequence.ts#L35), [bucle raster:130](https://github.com/jdsalasca/open-beauty-site/blob/84c54b413d94a28b24f9275015c0fe694454da00/src/sequence.ts#L130).

### Puntos de inspección por estilo

Son diferencias verificables de estructura o implementación, no calificaciones visuales. Todas las líneas siguientes remiten a `src/gif.ts` en el commit auditado, salvo donde se indique otro archivo.

| Estilo | Evidencia inicial para reproducir y contrastar con la guía |
|---|---|
| Renaissance | Líneas 291–335 y 372–395: washes y arco/título centrales frente a campos planos y asimetría documentados. |
| Brutalist | Líneas 446–458: grilla modular basada en 10 % de la dimensión menor; 575–605: metadata y ticker genéricos. Conservar su renderer propio y vincular la pieza documental al contenido. |
| Papercraft | Líneas 662–701 y 748–766: hoja, cinta redondeada y confetti genérico. Comparar con contornos recortados, notch y cinta rasgada descritos por el preset; vincular el objeto al tema. |
| Art Deco | Líneas 820–842: rayos, círculo y barras bajo la composición común. Contrastar eje vertical, marcos escalonados y familia tipográfica del preset. |
| Isotype | Líneas 843–862: malla fija de círculo/cuerpo sin entrada cuantitativa. Además `src/art.ts:113–115` contiene `68%` y `SERIE 01` fijos: no usarlos como dato real; eliminar cifra inventada o rotular explícitamente ejemplo. |
| Op Art | Líneas 863–872: radios oscilantes. El archivo GIF necesita un fallback estático y la galería debe controlar su reproducción; no prometer controles dentro del propio GIF. |
| Ukiyo-e | Líneas 873–896: ondas y sol frente a cartela/horizonte/planos documentados; el layout compartido mantiene el título central. |
| Bestiary | Líneas 897–914: cuerpo elíptico y ojos, sin anatomía o marginalia semántica. Evitar que un nuevo tema solo cambie el título sobre la misma criatura genérica. |
| Psychedelic | Líneas 915–928: blobs/anillos no usan `t` en su rama; el reveal común no equivale a movimiento material propio. |
| Memphis | Líneas 929–949: primitivas fijas y línea ondulada; incorporar keyline, sombra y reorganización significativa conforme a su intención. |
| Vaporwave | Líneas 972–991: sol segmentado/grilla sin ventana o artefacto específico. Tipografía compartida Space Mono frente al display pixel documentado. |
| Galactic | Líneas 950–971 y 995–1019: planeta/órbitas/título centrales, sin composición lateral/bleed de la guía. La selección tipográfica común cae en Archivo Black para este slug. |
| Nature | Líneas 786–819: rama/hojas/anillos sin etiqueta de espécimen; la familia común es EB Garamond frente al sistema de `src/styles/nature-preset.ts`. |

Revisar también `src/maxxing.ts` y `src/styles/subfamilies.ts`: el acabado compartido y las variaciones tonales existentes no constituyen por sí solos composición o movimiento específicos por estilo. El cambio debe probarse visualmente; agregar más decoración no es un criterio de aceptación.

## Resultado esperado de la mejora

Una sola entrada de contenido debe generar una historia coherente en cualquiera de los 13 estilos, usando una dirección de arte propia, texto íntegro y una duración legible. La herramienta debe avisar cuando no pueda cumplir una condición, producir evidencia para revisarlo y permitir corregirlo sin editar coordenadas a mano.

### 1. Contrato narrativo compartido — prioridad P0

Diseñá un brief tipado y validado en runtime. El siguiente JSON es **una propuesta de contrato**, no una API existente ni un mandato de nombres exactos:

```json
{
  "style": "papercraft",
  "kind": "narrative-gif",
  "locale": "es",
  "audience": "product",
  "title": "Guías más confiables",
  "status": "in-review",
  "phases": [
    {"id": "before", "label": "Antes", "text": "Una medida inesperada podía pasar sin aviso.", "visual": {"kind": "comparison", "state": "unreviewed"}},
    {"id": "change", "label": "Cambio", "text": "Ahora se señala para que pueda revisarse.", "visual": {"kind": "comparison", "state": "flagged"}},
    {"id": "result", "label": "Resultado esperado", "text": "Detectar el problema antes de publicar.", "visual": {"kind": "comparison", "state": "review-ready"}}
  ],
  "playback": {"minReadableHoldMs": 5000, "transitionMs": 650, "loop": true},
  "output": {"width": 1280, "height": 720, "formats": ["gif", "png"]},
  "seed": 7
}
```

Es contenido ilustrativo; no representa una entrega ni un resultado medido. En ejemplos de historias reales, conservar fuente, estado y fecha de consulta en metadata. No inventar métricas, ahorro, impacto ni puesta en producción.

Requisitos:

- Admitir fuentes de contenido externas normalizadas sin acoplar el motor a Jira. El adaptador de tickets es opcional y separado.
- Validar fase vacía, estado inválido, tamaño imposible, unidades de tiempo, NaN, Infinity y límites de recursos. Devolver errores accionables; no corregir silenciosamente un pedido sustancial.
- La última fase debe distinguir resultado observado y esperado. No imponer “resuelto” cuando el brief dice revisión.
- Las tres fases deben conservar el mismo objeto visual: por ejemplo, la misma guía recibe una señal y pasa a revisión. Evitar tres ilustraciones inconexas.
- El sistema puede sugerir copy corto, pero debe mostrarlo para revisión y preservar los hechos. No rellenar el brief con una voz estilística genérica.
- Mantener APIs simples existentes. Agregar esta capacidad mediante extensión compatible o ruta explícita, con migración documentada.

### 2. Tipografía y composición — prioridad P0

- Definir roles por estilo: display, lectura, etiqueta, cifra y anotación. Consumir el sistema tipográfico existente donde corresponda.
- Empaquetar fuentes con licencias y pesos reales o registrar una alternativa editorial aprobada por estilo. Verificar registro exitoso y glifos, no solo existencia del archivo.
- Evitar fallback silencioso, negrita/itálica sintética no deseada y diferencias inesperadas entre HTML, SVG y Canvas. La paridad significa misma identidad y jerarquía, no píxeles idénticos entre motores.
- Cubrir español real: á, é, í, ó, ú, ü, ñ, ¿, ¡, números, porcentajes y flechas; medir también palabras largas y saltos explícitos.
- Resolver ajuste por ancho **y alto**, ascendentes/descendentes, interlineado, tracking, líneas y área reservada al arte. No recortar frases ni reducir hasta volverlas ilegibles.
- Ante exceso: redistribuir dentro de las variantes permitidas, dividir una fase o devolver `TEXT_OVERFLOW` con sugerencia. El usuario decide cambios semánticos.
- Como preset de review propuesto a 1280×720: texto principal de fase inicialmente ≥36 px, títulos ≥56 px y etiquetas ≥24 px; comprobar lectura en una tarjeta de 640×360. Si una familia necesita otro tamaño óptico, justificarlo con evidencia. Estos son umbrales de partida, no garantía de legibilidad.
- Usar zona segura consistente, con al menos 5 % de margen para texto indispensable. Permitir bleed artístico sin cortar contenido.
- Separar área de lectura de patrones y texturas. Textura y adornos no deben competir con el mensaje.
- Revisar proporciones 16:9, 1:1 y 9:16. Si una no está soportada por un estilo, devolver limitación explícita hasta implementarla; no deformar o recortar el layout cuadrado.

### 3. Dirección de arte para los 13 estilos — prioridad P1

Aplicar estos criterios sobre las guías existentes. No reemplazar la identidad de cada estilo con una receta universal. Compartir primitivas de dibujo es deseable; la composición, el material y el movimiento deben seguir la intención de cada estilo.

| Estilo | Dirección y tipografía a conservar o resolver | Qué debe hacer la transformación | Qué rechazar en revisión |
|---|---|---|---|
| **Renaissance** | Fresco, campos de color planos, arco asimétrico, EB Garamond; una anotación pequeña y contraste de escala. | Una pieza se descubre y se ordena; el cambio tiene un foco y termina en una composición estable. | Glow decorativo que contradiga la guía, marcos de invitación de boda, todo centrado por defecto. |
| **Brutalist** | Cartel público, grilla, tinta, bloque de acento, archivo documental; resolver display y lectura sin perder carácter. | Un documento recibe revisión, una observación o un sello con significado real; registrar cada estado. | Sellos permanentes sobre texto, ruido que tapa datos, números falsos, letra pixelada de cuerpo. El modo documental debe ser una subfamilia explícita. |
| **Papercraft** | Fraunces Soft + Nunito Sans según guía; papel por capas, bordes irregulares controlados, cinta, sombras por altura. | La misma pieza de papel se desplaza, recibe una señal o se reorganiza y queda asentada. | Pegatinas infantiles genéricas, sombras iguales en todas las capas, costuras decorativas, rebotes y cambios aleatorios de posición. |
| **Art Deco** | Negro dominante, champagne, geometría vertical y filetes; resolver Poiret/Josefin o sustitución aprobada. | Ejes y líneas enmarcan la transformación y dejan una zona sobria de lectura. | Plantilla Gatsby genérica, rayos detrás de cada palabra, dorado de bajo contraste. |
| **Isotype** | Pictograma como unidad, Jost/IBM Plex o equivalentes aprobados; cantidad, denominador y fuente cuando hay datos. | Se transforma un conjunto contable con correspondencia exacta. Sin datos, usar categorías cualitativas claramente marcadas. | Personas decorativas con cantidades arbitrarias, cifras sin denominador, movimiento que altera la interpretación. |
| **Op Art** | Contraste óptico y una banda quieta de lectura; Archivo Black/Space Grotesk según rol. | El patrón demuestra un cambio de foco o agrupación y se detiene para leer. | Moiré sobre texto, destellos, movimiento continuo sin control en la galería. Proveer alternativa estática. |
| **Ukiyo-e** | Planos, horizonte, cielo vacío, azul Prusia y cartela; resolver Shippori/Zen Kaku para texto latino legible. | Capas o recorrido revelan progresión manteniendo horizonte y punto de referencia. | Símbolos japoneses sin significado, sakura de relleno, ondas que pisan el copy. |
| **Bestiary** | Tinta, anatomía, marginalia e inicial; blackletter breve y cuerpo de lectura separado. | Una criatura o metáfora consistente permite observar, anotar y comprender un rasgo. | Cambiar solo una silueta genérica, párrafos en blackletter, presentar hipótesis como hechos. |
| **Psychedelic** | Color líquido con foco y espacio tranquilo; Bungee Shade solo donde sea legible, cuerpo sobrio. | La deformación comunica pasar de confusión a organización o viceversa, sin mover el área de lectura durante el hold. | Saturación uniforme, blobs sin relación con contenido, distorsionar letras durante la lectura. |
| **Memphis** | Caos controlado, keyline, una rotación protagonista; Bricolage/DM según guía. | Piezas se agrupan o reordenan con una causa visible y una composición final intencional. | Confeti aleatorio, todas las figuras moviéndose a la vez, paleta sin jerarquía. |
| **Vaporwave** | Artefacto digital fechado, ventana, horizonte y grilla; pixel display breve, cuerpo limpio. | Una interacción de ventana/archivo revela estados y conserva continuidad. | Párrafos en pixel font, nostalgia genérica sin artefacto, glitch que impide leer o falsea contenido. |
| **Galactic** | Espacio negativo, órbitas, escala y línea; Michroma/Space Grotesk o alternativa aprobada. | Una órbita o trayectoria muestra relación y cambio sin dar vueltas sin propósito. | Planetas ornamentales detrás del texto, tantos elementos que se pierde la escala, audio automático. |
| **Nature / Memory** | Archivo botánico, hoja, pliegue, fecha/lugar/procedencia cuando hay datos; Cormorant/Karla o alternativa aprobada. | El espécimen se observa, se anota y se archiva; el mismo objeto conserva su identidad. | Flores anónimas de stock, procedencia inventada, confundir este estilo con papercraft cambiando solo la paleta. |

Cada estilo necesita al menos dos composiciones curadas para distintos tipos de contenido. No exigir que cambien con cada seed: usar variación determinista con límites editoriales. No mezclar fuentes de todas las familias en una pieza.

### 4. Movimiento y codificación GIF — prioridad P0

- Timeline explícita: entrada → texto completamente visible → pausa de lectura → transición → siguiente fase. Medir los tiempos del archivo decodificado.
- Preservar identidad espacial del objeto entre fases. Easing, profundidad y movimiento propios del estilo; un solo foco principal durante transiciones.
- En las pausas, texto estable; los adornos solo pueden moverse si no dificultan lectura.
- Una historia completa debe durar al menos la suma de sus holds; no limitarla silenciosamente a seis segundos. Evitar multiplicar frames idénticos para lograr pausas largas cuando se puedan representar con delays.
- Definir reinicio de loop: puente claro y deliberado del resultado al antes. No llamar “seamless” a una historia que necesita reiniciarse; que el salto no parezca un bug.
- Para títulos/loops decorativos conservar sus modos existentes, sin forzar tres fases en todos los artefactos.
- Verificar alpha real al componer, fades, capas, antialiasing y limpieza entre frames. Un parámetro alpha en el código no prueba que funcione.
- Seleccionar paleta usando colores representativos de **todas las fases**, o estrategia local medida. Verificar pérdida de colores semánticos, bordes tipográficos y degradados después de cuantizar.
- Comprobar delays efectivos, cantidad de frames, loop, dimensiones, duración y memoria con un decodificador independiente del encoder.
- Dar presets de calidad/tamaño y límites de CPU/memoria/duración. Informar bytes y degradaciones; nunca entregar menos fases para ahorrar peso.
- El GIF no puede pausar por sí mismo ni obedecer CSS reduced-motion. La galería debe permitir ocultar/detener su animación sustituyéndolo por el PNG, iniciar reproducción explícitamente y descargar ambos.

### 5. Harness de evaluación honesto — prioridad P0

Separar resultados con nombres inequívocos:

1. **Integridad técnica:** el archivo existe, decodifica y tiene metadata consistente.
2. **Conformidad de estilo:** roles tipográficos, paleta, composición y reglas documentadas. Señalar qué se detecta de fuente y qué de píxeles.
3. **Legibilidad renderizada:** texto completo, contraste, colisiones, tamaño efectivo y estabilidad durante cada pausa.
4. **Narrativa:** fases completas, continuidad del objeto, cambio causal y resultado fiel al brief. Explicar límites de automatización.
5. **Revisión visual:** aprobación humana o evaluación visual identificada con evidencia. Si no se hizo, estado `pending` o `not-evaluated`; nunca simularla con cuatro checks de formato.

Un único A no debe ocultar un fallo de texto, narrativa o fidelidad. No recomendar publicar automáticamente por pasar checks técnicos. Si se conservan scores por compatibilidad, documentar su alcance y agregar desglose/estado de revisión.

Manifest de evidencia propuesto: commit, brief normalizado y su hash, estilo/subfamilia, seed, versiones de renderer y fuentes, dimensiones, formato, frames decodificados, delays/duración reales, bytes, hash del archivo final, resultados por control y capturas de fases. No incluir credenciales ni material privado.

Automatizar lo verificable y reservar revisión humana para gusto y sentido. No inventar un “beauty score” universal. Si usás un modelo visual, debe poder deshabilitarse, registrar modelo/versión/criterios y no ser la única barrera para texto perdido o un archivo corrupto.

### 6. CLI, MCP y documentación — prioridad P1

- Exponer el mismo contrato narrativo en biblioteca, CLI y MCP con validación equivalente. El usuario no debe descubrir que su hold o su tamaño se ignoró.
- Devolver paths reales, metadata y diagnósticos estructurados; mensajes breves y útiles para modelos pequeños.
- Proveer una receta ejecutable de historia por estilo, con entrada y salida esperada. Los ejemplos deben usar copy realista y específico, no solo “Beautiful Design”.
- `make`, generación directa y secuencias deben explicar sus diferencias. Elegir la ruta que preserve el brief, sin convertir automáticamente una historia en título decorativo.
- Actualizar `skills/beauty.md`, guías y docs MCP para reflejar capacidades presentes. Eliminar instrucciones obsoletas de funciones “próximamente” que ya existen.
- Mantener compatibilidad de nombres/exports/recetas existentes o documentar migración y probarla.
- No instalar globalmente, publicar paquete, subir archivos privados, crear servicios externos ni modificar configuración del usuario como parte de esta issue.

## Plan de entrega propuesto

### Etapa A — Diagnóstico reproducible

- Leer instrucciones del repo y refrescar los hallazgos contra HEAD.
- Renderizar baseline con un brief narrativo común, contenido corto y largo y una referencia por estilo.
- Publicar galería local antes/después y una lista priorizada de defectos observados. No decidir calidad solo leyendo código.
- Elegir arquitectura compatible y justificar cómo comparte tokens/primitivas sin homogeneizar arte.

### Etapa B — Contrato, tipografía y timeline

- Implementar brief/validación y tratamiento de overflow.
- Resolver fuentes y roles raster por estilo.
- Resolver pausas, transiciones, metadata, estrategia de paleta y checks del archivo final.
- Establecer dos estilos piloto: papercraft editorial y brutalismo documental. Revisarlos completos y corregirlos antes de extender el patrón.

### Etapa C — Los otros once estilos

- Implementar composición y movimiento propios siguiendo la matriz.
- Reutilizar mecanismos, manteniendo tipografía, material y metáforas particulares.
- Entregar evidencia individual y evitar declarar el conjunto completo porque pasaron solo los pilotos.

### Etapa D — Experiencia y cierre

- Alinear CLI/MCP/docs/recipes.
- Entregar galería y archivos finales con manifest.
- Informar limitaciones y estados de revisión pendientes sin marcar todo como aprobado.

## Criterios de aceptación y evidencia obligatoria

Este encargo **sí requiere pruebas y verificación de la implementación futura**. Ejecutar la suite pertinente del repo y agregar cobertura focalizada para los cambios; no sustituir revisión visual por tests.

- [ ] Los 13 slugs existentes siguen disponibles y se documenta cualquier cambio compatible.
- [ ] Hay un GIF narrativo real, PNG y contacto de sus tres fases por estilo: mínimo 13 GIF, 13 PNG y 13 contactos, con links en una galería local.
- [ ] Cada pieza cuenta Antes/Cambio/Resultado o Resultado esperado usando el mismo brief normalizado, sin alterar hechos para acomodar el estilo.
- [ ] Las 13 piezas usan identidad tipográfica y composición verificadas; no son el mismo título centrado recoloreado.
- [ ] Dos composiciones curadas por estilo están documentadas y al menos una pieza de cada composición se inspecciona.
- [ ] Ningún texto se trunca, desaparece, se sustituye silenciosamente o queda fuera de zona segura. Los casos que no caben fallan con diagnóstico útil.
- [ ] Se prueban acentos, ñ, signos invertidos, cifras, texto largo, palabra larga, fase vacía, estado abierto, contenido sin métricas y entradas numéricas inválidas.
- [ ] El preset 1280×720 sale con esas dimensiones exactas; la galería permite leerlo a 640×360. Los otros formatos soportados tienen evidencia de su layout.
- [ ] Cada fase del preset de review mantiene al menos 5 s de lectura efectiva, sin contar su transición; modificar este valor cambia el GIF final y su manifest.
- [ ] Se inspeccionan el inicio, hold y salida de cada fase, además del reinicio. No basta el poster final.
- [ ] Un decodificador independiente comprueba dimensiones, frames, delays, duración, loop e integridad del GIF final.
- [ ] Hay controles negativos: archivo con frames iguales, texto cortado, fuente faltante, paleta que pierde un estado y duración solicitada incompatible no reciben aprobación visual por checks de formato.
- [ ] Dos ejecuciones equivalentes son reproducibles en un entorno fijado. Si la reproducibilidad de bytes no está garantizada entre plataformas, se documenta el alcance y se verifica equivalencia visual/metadata por separado.
- [ ] La galería ofrece descarga de GIF/PNG, ampliación, reproducción explícita y fallback estático; respeta reduced-motion en su comportamiento de reproducción.
- [ ] Ninguna evaluación estética se reporta como realizada si falta revisión de imágenes. La aprobación pendiente se ve en CLI/MCP/galería.
- [ ] La revisión final incluye comparación por estilo y anota qué cambió, por qué, pruebas realizadas y limitaciones.

### Matriz mínima de revisión visual

Para cada uno de los 13 estilos registrar:

| Control | Evidencia | Estado |
|---|---|---|
| Identidad reconocible a miniatura | Contact sheet del conjunto a 200 px por pieza, sin exigir lectura del cuerpo a ese tamaño | pass / revise / pending |
| Lectura dentro de la tarjeta | Captura a 640×360 y reproducción completa | pass / revise / pending |
| Tipografía/material | Frame nativo 1280×720 y nombres/archivos de fuentes efectivas | pass / revise / pending |
| Historia y fidelidad | Brief junto a los tres estados extraídos del GIF | pass / revise / pending |
| Ritmo | Delays y duración decodificados + reproducción | pass / revise / pending |
| Composición alternativa | Segunda composición con otro contenido, sin colisiones | pass / revise / pending |
| Accesibilidad de la galería | PNG, controles de reproducción, teclado y reduced-motion | pass / revise / pending |

## Formato del reporte del agente al cerrar

1. Resumen concreto de cambios y decisiones editoriales.
2. Tabla de los 13 estilos: fuente efectiva, composición, GIF, PNG, evidencia y estado de revisión.
3. Comandos exactos para reproducir los artefactos desde un checkout limpio, con versiones necesarias.
4. Resultados de pruebas y controles negativos, distinguidos de observaciones visuales.
5. Antes/después de papercraft y brutalismo documental y contacto de los otros once.
6. Limitaciones, tareas pendientes y cualquier diferencia frente a la referencia.

**Definición de terminado:** una persona de Producto puede leer una historia completa sin esfuerzo dentro de su tarjeta; entiende la transformación y el estado real del trabajo; reconoce la intención visual del estilo; y el repositorio permite repetir ese resultado con un brief nuevo sin corregir coordenadas manualmente.

