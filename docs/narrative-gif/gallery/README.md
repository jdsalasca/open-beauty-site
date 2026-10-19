# Stage C · galería narrative GIF

La galería contiene dos composiciones por estilo para una Sprint Review de Producto en español. Los ocho briefs usan seed `7`, estado `in-review` y por ello terminan en **Resultado esperado**. El texto describe una propuesta y una comprobación futura; no declara métricas, ahorros, despliegue ni resultados de producción.

Todos los GIF decodifican a **1280×720, 33 cuadros y 17.190 ms**. Cada pausa de Antes, Cambio y Resultado dura **5.000 ms**; las transiciones de 650 ms se excluyen de esos holds. El reinicio Resultado→Antes es un puente deliberado. El PNG es la portada estática de Antes; en Op Art también sirve de fallback cuando el reproductor detenga el GIF.

## Archivos y medidas

| Estilo · tipografía efectiva | Composición | GIF | PNG | Hoja de contacto | Manifest | GIF (bytes) · hold · caja del objeto |
|---|---|---|---|---|---|---|
| Renaissance · EB Garamond 600/400 | comparison | [GIF](renaissance/comparison/cambios-que-se-revisan-7cff1462.gif) | [PNG](renaissance/comparison/cambios-que-se-revisan-7cff1462.png) | [contacto](renaissance/comparison/cambios-que-se-revisan-7cff1462-contact-sheet.png) | [manifest](renaissance/comparison/cambios-que-se-revisan-7cff1462.manifest.json) | 819.112 · 5.000×3 · 42,3% |
| Renaissance · EB Garamond 600/400 | checklist | [GIF](renaissance/checklist/ruta-para-revisar-el-cierre-66d5877c.gif) | [PNG](renaissance/checklist/ruta-para-revisar-el-cierre-66d5877c.png) | [contacto](renaissance/checklist/ruta-para-revisar-el-cierre-66d5877c-contact-sheet.png) | [manifest](renaissance/checklist/ruta-para-revisar-el-cierre-66d5877c.manifest.json) | 795.081 · 5.000×3 · 42,3% |
| Art Deco · Poiret One 400 / Josefin Sans 400, etiqueta 600 | comparison | [GIF](artdeco/comparison/cambios-que-se-revisan-8e6b7a28.gif) | [PNG](artdeco/comparison/cambios-que-se-revisan-8e6b7a28.png) | [contacto](artdeco/comparison/cambios-que-se-revisan-8e6b7a28-contact-sheet.png) | [manifest](artdeco/comparison/cambios-que-se-revisan-8e6b7a28.manifest.json) | 920.325 · 5.000×3 · 40,5% |
| Art Deco · Poiret One 400 / Josefin Sans 400, etiqueta 600 | checklist | [GIF](artdeco/checklist/ruta-para-revisar-el-cierre-022e1903.gif) | [PNG](artdeco/checklist/ruta-para-revisar-el-cierre-022e1903.png) | [contacto](artdeco/checklist/ruta-para-revisar-el-cierre-022e1903-contact-sheet.png) | [manifest](artdeco/checklist/ruta-para-revisar-el-cierre-022e1903.manifest.json) | 924.786 · 5.000×3 · 40,5% |
| Isotype · Jost 500 / IBM Plex Sans 400, etiqueta 500 | comparison | [GIF](isotype/comparison/cambios-que-se-revisan-98e5125e.gif) | [PNG](isotype/comparison/cambios-que-se-revisan-98e5125e.png) | [contacto](isotype/comparison/cambios-que-se-revisan-98e5125e-contact-sheet.png) | [manifest](isotype/comparison/cambios-que-se-revisan-98e5125e.manifest.json) | 811.283 · 5.000×3 · 42,3% |
| Isotype · Jost 500 / IBM Plex Sans 400, etiqueta 500 | checklist | [GIF](isotype/checklist/ruta-para-revisar-el-cierre-6150b5ca.gif) | [PNG](isotype/checklist/ruta-para-revisar-el-cierre-6150b5ca.png) | [contacto](isotype/checklist/ruta-para-revisar-el-cierre-6150b5ca-contact-sheet.png) | [manifest](isotype/checklist/ruta-para-revisar-el-cierre-6150b5ca.manifest.json) | 831.996 · 5.000×3 · 42,3% |
| Op Art · Archivo Black 400 / Space Grotesk 400, etiqueta 500 | comparison | [GIF](opart/comparison/cambios-que-se-revisan-f7428037.gif) | [PNG](opart/comparison/cambios-que-se-revisan-f7428037.png) | [contacto](opart/comparison/cambios-que-se-revisan-f7428037-contact-sheet.png) | [manifest](opart/comparison/cambios-que-se-revisan-f7428037.manifest.json) | 1.163.969 · 5.000×3 · 40,6% |
| Op Art · Archivo Black 400 / Space Grotesk 400, etiqueta 500 | checklist | [GIF](opart/checklist/ruta-para-revisar-el-cierre-d58b7c58.gif) | [PNG](opart/checklist/ruta-para-revisar-el-cierre-d58b7c58.png) | [contacto](opart/checklist/ruta-para-revisar-el-cierre-d58b7c58-contact-sheet.png) | [manifest](opart/checklist/ruta-para-revisar-el-cierre-d58b7c58.manifest.json) | 653.021 · 5.000×3 · 40,6% |

El porcentaje es el bounding box del marco/objeto respecto del cuadro completo, no el porcentaje de píxeles cubiertos. Los bytes son el GIF comprimido; el manifest conserva también los tamaños exactos del PNG y la hoja de contacto.

## Contenido por estilo

- [Renaissance](../styles/renaissance.md): arco y fragmento de fresco; comparison descubre y asienta una pieza, checklist la ordena en un registro.
- [Art Deco](../styles/artdeco.md): marco escalonado y eje vertical; comparison asienta una placa, checklist desplaza el marcador de etapa.
- [Isotype](../styles/isotype.md): un pictograma por fase, con categorías cualitativas claramente rotuladas y sin cifras añadidas.
- [Op Art](../styles/opart.md): el foco de los anillos cambia entre pausas; checklist alinea bandas agrupadas. Se genera PNG para fallback estático.

## Estado de evaluación

Los ocho manifests conservan `visual-review: pending` y recomendación de publicación `none`. Las comprobaciones automáticas incluyen integridad GIF, decodificación independiente, dimensiones, holds, tamaño, fuente, copia completa, tamaño de lectura y contraste. No son OCR ni aprobación visual independiente. La revisión de tres iteraciones y los límites pendientes están en [REVIEW-stage-c.md](REVIEW-stage-c.md).
