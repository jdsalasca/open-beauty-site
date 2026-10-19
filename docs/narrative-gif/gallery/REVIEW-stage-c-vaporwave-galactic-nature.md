# Revisión visual interna — Stage C

**Estilos:** vaporwave, galactic, nature

**Estado:** revisión independiente pendiente; este registro no aprueba el diseño.

**Evidencia visual:** los seis contactos y los 18 holds nativos de 1280×720 de la tercera vuelta. Las capturas de inspección están fuera del repositorio en `C:\Users\jdsal\AppData\Local\Temp\stage-c-iteration-3-76cc2935e1a2410991b2d65edb168c14`; vueltas anteriores: `C:\Users\jdsal\AppData\Local\Temp\stage-c-iteration-1-b8b73940e2204da39421c61ab033b676` y `C:\Users\jdsal\AppData\Local\Temp\stage-c-iteration-2-6a26bc4080244f019ed0dfe1af671d48`.

## Iteraciones

| Vuelta | Evidencia observada | Defectos concretos y ajuste |
| --- | --- | --- |
| 1 | Seis contactos y 18 holds nativos | Vaporwave: el icono invadía el nombre del archivo y una barra sugería un porcentaje inexistente; se separó el icono, se mantuvo `LECTURA.TXT` visible y se sustituyó la barra por estado. Galactic: el tercer hito no terminaba en posición activa clara; se fijó el marcador al destino. Nature: la hoja se leía simétrica y la llamada tocaba la muestra; se irregularizó la silueta y se desplazó la etiqueta. |
| 2 | Seis contactos y siete holds representativos | Vaporwave: el panel de estado entraba abruptamente; se suavizó su aparición. Nature: `ARCHIVADA` afirmaba un resultado antes de que `in-review` lo permitiera y el checklist no seguía `done`; las etiquetas y marcas pasaron a depender del estado. Se verificó la lectura del nombre de archivo. |
| 3 | Seis contactos y 18 holds nativos, todos a 1280×720 | Las composiciones `comparison` y `checklist` se distinguen en los tres estilos; la llamada de naturaleza queda fuera de la hoja, los hitos galácticos conservan su ruta y el archivo vaporwave permanece visible. La copia de fase se mantiene estable en los holds. Los rótulos secundarios a tamaño de tarjeta siguen pendientes de lectura humana. |

## Medidas reproducibles

- `reservedArtArea` ocupa `0,45 × 0,90 = 40,5%` del fotograma; comienza en x=51%, y=5% y usa toda la altura segura de 90%. La distribución evita una franja vertical sin uso y separa el arte del texto narrativo.
- Proxy de ocupación del PNG final: conté píxeles en la reserva cuyo mayor cambio RGB frente al fondo de `(0,0)` supera 24. Es un indicador de marcas visibles, no una segmentación semántica del objeto:

| Estilo | `comparison` (fotograma / reserva) | `checklist` (fotograma / reserva) | Capas visibles |
| --- | ---: | ---: | --- |
| vaporwave | 23,9% / 59,0% | 24,0% / 59,3% | escritorio, cielo/sol, horizonte, retícula, ventana, archivo |
| galactic | 7,0% / 17,2% | 7,1% / 17,6% | campo estelar, planeta a sangre, bandas, órbitas, ruta/marcador |
| nature | 20,6% / 50,9% | 20,6% / 51,0% | lámina plana, sombra leve, contorno/nervaduras, anotaciones |

Galactic conserva más vacío deliberadamente; su porcentaje de píxeles de color no equivale al tamaño aparente del planeta y las órbitas. Nature usa una lámina plana sin capas de papel para diferenciarse del piloto papercraft. Estos valores describen imágenes rasterizadas con un umbral fijo, no son una valoración estética.

## Lectura, reproducción y pendientes

- Los manifiestos decodificados registran GIF 1280×720, 33 cuadros, 17.190 ms y holds independientes de 5.000/5.000/5.000 ms. Los seis GIF pesan entre 1,04 y 1,18 MiB.
- El layout mide título ≥56 px, cuerpo ≥36 px y etiqueta ≥24 px en nativo. La escala derivada para 640×360 registra título 32,5–38 px, cuerpo mínimo 20 px y etiqueta mínima 14 px; son medidas de fuente/layout, no OCR.
- Los seis manifiestos conservan `visual-review: pending`; también quedan pendientes la revisión independiente de estilo y la lectura humana a 640×360. Decodificación, dimensiones, holds, estado, continuidad, determinismo y tamaño se informan por separado.
- Reproducción: `pnpm dev narrative --style vaporwave --brief docs/narrative-gif/gallery/vaporwave/comparison/brief.json --out <directorio>`; para otros packs, cambiar estilo y brief. Los briefs están en `docs/narrative-gif/gallery/{vaporwave,galactic,nature}/{comparison,checklist}/`.
- Los briefs usan `Resultado esperado` para `in-review` y `Resultado observado` para `done`, sin métricas ni afirmaciones de producción. Las pruebas mantienen `STYLE_NOT_SUPPORTED_YET` para estilos Stage D, rechazan formatos/aspectos no admitidos y devuelven `TEXT_OVERFLOW` con sugerencia para texto que no cabe; no truncan una palabra extrema.
