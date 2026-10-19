# Escenas semánticas: papercraft y brutalist/documentary

Los briefs bilingües implementan `table-rows`, `card-collection`, `counter` y `file-download` sobre el mismo contrato semántico. Cada combinación de estilo, primitiva, aspecto y locale tiene pruebas de render y comparación de cambios del objeto decodificado. Los ejemplos son ilustrativos: no acreditan resultados operacionales.

## Contrato, compatibilidad y legibilidad

- Papercraft y brutalist/documentary declaran `supported` en 16:9 y 1:1, es/en: 32 celdas. Sus celdas 9:16 siguen `unsupported`; en el resto de la matriz, `fallback` identifica escenas existentes sin implementación semántica y `unsupported` las celdas sin escena. El total queda en 32 `supported`, 184 `fallback` y 96 `unsupported`.
- Las escenas antiguas que solo tienen `visual.kind` y `visual.state` conservan el objeto `legacy-object` y la composición `guia`. La composición de arte de 45% de ancho y 90% de alto se activa solamente para briefs semánticos; los paquetes de galería anteriores se protegen con `test/narrative-gallery-repro.test.ts`.
- `rendered-legibility` mide el tamaño efectivo de cada caja de texto declarada dentro de las regiones del objeto, a 640×360. El umbral es 14 px para todas las etiquetas y 20 px para titulares numéricos. La revisión del orquestador había estimado 8–10 px antes del ajuste; después, las seis escenas tienen mínimo medido de 14 px. Los titulares de descarga miden 20 px; los contadores, 34 px en papercraft y 28 px en brutalist. Filas no tiene titular numérico.
- Las copias se ajustaron siguiendo `TEXT_OVERFLOW` del motor. No se recorta texto. Las ilustraciones solo arte omiten título, fase y relato; conservan los identificadores, marcas y valores del objeto.
- Brutalist/documentary usa Archivo Black y Space Mono, formulario de ledger, perforación, sombra desplazada, una tinta de acento y marcas dentro de casillas reservadas. Las fases conservan el mismo documento y sus cambios quedan anotados: identificación/rechazo de filas, error específico por timeout y reintento aún pendiente, y relación que suma la ficha C. No se agregaron folios ni fechas. En descarga, el valor 42% aparece solo desde el estado de espera agotada; el inicio no inventa progreso.

## Paquetes de ejemplo

Cada ruta principal contiene `brief.json`, GIF, PNG, hoja de contacto y manifiesto. `art-only/<locale>/` contiene los otros cuatro artefactos. Los bytes corresponden a los archivos guardados. Cuadros, duración e integridad se extrajeron de los manifiestos tras decodificar los GIF.

| Fixture | Estilo | Idioma | GIF principal (bytes) | PNG / contacto (bytes) | Decodificado | GIF solo arte (bytes) | PNG / contacto solo arte (bytes) |
| --- | --- | --- | ---: | ---: | --- | ---: | ---: |
| `filas-duplicadas` | papercraft | es | [filas-8577c06b.gif](papercraft/filas-duplicadas/es/filas-8577c06b.gif) · 537 696 | 55 798 / 176 378 | 28 cuadros · 10 720 ms | [solo arte](papercraft/filas-duplicadas/art-only/es/filas-8577c06b-art-only.gif) · 367 680 | 38 773 / 120 364 |
| `filas-duplicadas` | papercraft | en | [rows-93496b4f.gif](papercraft/filas-duplicadas/en/rows-93496b4f.gif) · 536 576 | 56 915 / 176 340 | 28 cuadros · 10 720 ms | [solo arte](papercraft/filas-duplicadas/art-only/en/rows-93496b4f-art-only.gif) · 360 533 | 38 694 / 116 226 |
| `descarga-pendiente` | papercraft | es | [descarga-7de7a841.gif](papercraft/descarga-pendiente/es/descarga-7de7a841.gif) · 470 671 | 49 790 / 167 281 | 28 cuadros · 10 720 ms | [solo arte](papercraft/descarga-pendiente/art-only/es/descarga-7de7a841-art-only.gif) · 296 735 | 33 398 / 105 101 |
| `descarga-pendiente` | papercraft | en | [download-40adb99d.gif](papercraft/descarga-pendiente/en/download-40adb99d.gif) · 444 267 | 48 242 / 162 205 | 28 cuadros · 10 720 ms | [solo arte](papercraft/descarga-pendiente/art-only/en/download-40adb99d-art-only.gif) · 295 027 | 33 374 / 103 461 |
| `contador-coleccion` | papercraft | es | [total-1b74129f.gif](papercraft/contador-coleccion/es/total-1b74129f.gif) · 338 210 | 48 500 / 116 252 | 21 cuadros · 8 040 ms | [solo arte](papercraft/contador-coleccion/art-only/es/total-1b74129f-art-only.gif) · 239 433 | 34 208 / 79 226 |
| `contador-coleccion` | papercraft | en | [count-5bc6e9e8.gif](papercraft/contador-coleccion/en/count-5bc6e9e8.gif) · 327 948 | 46 192 / 110 120 | 21 cuadros · 8 040 ms | [solo arte](papercraft/contador-coleccion/art-only/en/count-5bc6e9e8-art-only.gif) · 230 676 | 33 260 / 76 943 |
| `filas-duplicadas` | brutalist | es | [filas-fdd4f19a.gif](brutalist/filas-duplicadas/es/filas-fdd4f19a.gif) · 325 064 | 23 628 / 109 999 | 28 cuadros · 10 720 ms | [solo arte](brutalist/filas-duplicadas/art-only/es/filas-fdd4f19a-art-only.gif) · 189 411 | 10 723 / 63 875 |
| `filas-duplicadas` | brutalist | en | [rows-f8165508.gif](brutalist/filas-duplicadas/en/rows-f8165508.gif) · 304 225 | 23 714 / 104 271 | 28 cuadros · 10 720 ms | [solo arte](brutalist/filas-duplicadas/art-only/en/rows-f8165508-art-only.gif) · 184 434 | 10 600 / 59 435 |
| `descarga-pendiente` | brutalist | es | [pdf-ac38f07a.gif](brutalist/descarga-pendiente/es/pdf-ac38f07a.gif) · 294 460 | 19 535 / 97 125 | 28 cuadros · 10 720 ms | [solo arte](brutalist/descarga-pendiente/art-only/es/pdf-ac38f07a-art-only.gif) · 175 516 | 9 824 / 56 306 |
| `descarga-pendiente` | brutalist | en | [pdf-3a3d7875.gif](brutalist/descarga-pendiente/en/pdf-3a3d7875.gif) · 267 125 | 17 900 / 88 130 | 28 cuadros · 10 720 ms | [solo arte](brutalist/descarga-pendiente/art-only/en/pdf-3a3d7875-art-only.gif) · 160 949 | 8 422 / 51 896 |
| `contador-coleccion` | brutalist | es | [total-e05e6b51.gif](brutalist/contador-coleccion/es/total-e05e6b51.gif) · 225 461 | 16 928 / 74 615 | 21 cuadros · 8 040 ms | [solo arte](brutalist/contador-coleccion/art-only/es/total-e05e6b51-art-only.gif) · 127 979 | 7 480 / 43 139 |
| `contador-coleccion` | brutalist | en | [count-b70805e3.gif](brutalist/contador-coleccion/en/count-b70805e3.gif) · 221 114 | 20 102 / 72 871 | 21 cuadros · 8 040 ms | [solo arte](brutalist/contador-coleccion/art-only/en/count-b70805e3-art-only.gif) · 125 543 | 7 020 / 41 267 |

Las variantes solo arte tienen el mismo conteo de cuadros y duración que su paquete principal. Todos los GIF son 640×360; los manifiestos registran el resultado de integridad y la hoja de contacto muestra pausas, transiciones y unión del ciclo. Los `brief.json` en cada carpeta son la fuente completa del relato por fase, estados, acciones, relaciones y política de insignias.

## Pruebas de capacidad y cambios semánticos

`test/narrative-semantic-render.test.ts` renderiza y decodifica las 32 celdas papercraft/brutalist cubiertas por estas capacidades, comparando regiones declaradas del objeto entre fases. Brutalist recibe `supported` solo en las celdas cubiertas por esa prueba; no implica soporte 9:16.

`test/narrative-semantic.test.ts` incluye controles negativos para texto que cambia sin cambio del objeto, decoración sin cambio semántico y tipografía bajo 14 px o titulares bajo 20 px. Las escenas sin regiones declaradas siguen `pending`. El control `test/narrative-gallery-repro.test.ts` regenera los paquetes no semánticos desde sus briefs y compara sus bytes.

## Revisión visual

Las rondas, los defectos observados y el alcance de la inspección están registrados en [REVIEW-papercraft.md](REVIEW-papercraft.md) y [REVIEW-brutalist.md](REVIEW-brutalist.md). La inspección de esta tarea es propia; **la aprobación visual independiente permanece pendiente**.
