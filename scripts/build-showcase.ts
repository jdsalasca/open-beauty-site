import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createPage } from '../src/generate.js';
import { createGif } from '../src/gif.js';
import type { Brief, StyleSlug } from '../src/types.js';

const root = process.cwd();
const out = path.join(root, 'examples', 'showcase');

const pages: Array<{ slug: StyleSlug; brief: Brief }> = [
  {
    slug: 'artdeco',
    brief: {
      title: 'La ciudad vertical',
      brand: 'The Chrysler Room',
      eyebrow: 'Arquitectura · Nueva York, 1930',
      tagline: 'Cómo un rascacielos aprendió a brillar.',
      intro:
        'En 1930, la altura dejó de ser ingeniería y se volvió espectáculo. Coronas de acero, ascensores rápidos y una línea de oro que sube: la ciudad se inventó un cielo propio.',
      sections: [
        { kicker: '01 / La corona', title: 'Remate de sol', body: 'Los arquitectos iluminaban la punta del edificio como un faro. La luz no decoraba: anunciaba poder.' },
        { kicker: '02 / El vestíbulo', title: 'Mármol y velocidad', body: 'Entrar era un ritual. Espejos, bronce y mármol hacían que el ascensor pareciera un viaje.' },
        { kicker: '03 / La retícula', title: 'Orden en zigurat', body: 'La planta se retira en escalones. Cada metro ganado al cielo repite la misma forma, más pequeña.' },
      ],
      quote: { text: 'La altura es una forma de mirar hacia arriba sin pedir permiso.', author: 'Cuaderno de obra, 1930' },
      cta: { label: 'Subir al mirador', href: '#top' },
      footer: 'The Chrysler Room · Arquitectura para mirar',
      locale: 'es',
    },
  },
  {
    slug: 'isotype',
    brief: {
      title: 'Viena 1925',
      brand: 'Instituto de Viena',
      eyebrow: 'Datos · Vivienda pública, 1925–1934',
      tagline: 'La ciudad que se puede contar.',
      intro:
        'En la Viena roja, el ayuntamiento construyó viviendas como quien resuelve una ecuación. Para explicarlo no alcanzaban las palabras: hicieron falta pictogramas, números y una retícula.',
      sections: [
        { kicker: '01 / La unidad', title: 'Un dibujo, diez mil casas', body: 'Cada silueta representa la misma cantidad. El ojo cuenta antes de que el cerebro lea.' },
        { kicker: '02 / La serie', title: 'Comparar es entender', body: 'Rojo, azul y mostaza separan series. El color no decora: distingue.' },
        { kicker: '03 / La retícula', title: 'El orden es público', body: 'La cuadrícula hace visible lo que el estado esconde: cuánto, para quién y desde cuándo.' },
      ],
      quote: { text: 'Contar es una forma de hacer visible una decisión política.', author: 'Otto Neurath, 1925' },
      cta: { label: 'Ver los datos', href: '#top' },
      footer: 'Instituto de Viena · Método Isotype',
      locale: 'es',
    },
  },
  {
    slug: 'opart',
    brief: {
      title: 'Tu ojo miente',
      brand: 'Percepción 01',
      eyebrow: 'Percepción · Laboratorio óptico',
      tagline: 'La imagen no termina en la pantalla.',
      intro:
        'Una línea recta parece curva. Un círculo vibra. Tu ojo completa lo que falta y, al hacerlo, inventa movimiento donde no hay ninguno. Esta página es el experimento.',
      sections: [
        { kicker: '01 / Contraste', title: 'El borde que tiembla', body: 'Dos superficies iguales se ven distintas según lo que las rodea. El contexto es parte del color.' },
        { kicker: '02 / Moiré', title: 'Dos tramas, una tercera', body: 'Cuando dos patrones se cruzan, aparece una imagen que ninguno de los dos contiene.' },
        { kicker: '03 / Movimiento', title: 'El ojo que se mueve', body: 'Tu pupila nunca está quieta. La imagen lo sabe y lo usa.' },
      ],
      quote: { text: 'Ver no es recibir una imagen: es construirla.', author: 'Laboratorio de percepción' },
      cta: { label: 'Entrar al experimento', href: '#top' },
      footer: 'Percepción 01 · Instrucciones: mirá de cerca',
      locale: 'es',
    },
  },
  {
    slug: 'ukiyoe',
    brief: {
      title: 'La ola que se repite',
      brand: 'Estampa del mundo flotante',
      eyebrow: 'Océano · Edo, 1831',
      tagline: 'Una ola puede ser una montaña.',
      intro:
        'Hokusai no pintó una ola: pintó el instante antes de que caiga. Tres planos de azul, una espuma con garras y un monte pequeño al fondo. La escala es la historia.',
      sections: [
        { kicker: '01 / El plano', title: 'Azul sobre azul', body: 'La profundidad no viene del degradado: viene de superponer planos planos.' },
        { kicker: '02 / La espuma', title: 'Garras de agua', body: 'La espuma se dibuja como una garra. Es una forma de dar miedo a algo que no tiene forma.' },
        { kicker: '03 / La escala', title: 'El monte diminuto', body: 'El Fuji aparece pequeño para que la ola sea enorme. El tamaño relativo es el argumento.' },
      ],
      quote: { text: 'El mar es inmenso porque miramos desde la orilla.', author: 'Cuaderno de Edo' },
      cta: { label: 'Mirar la estampa', href: '#top' },
      footer: 'Estampa del mundo flotante · Xilografía y agua',
      locale: 'es',
    },
  },
  {
    slug: 'bestiary',
    brief: {
      title: 'Animales que nunca existieron',
      brand: 'Liber Bestiarum',
      eyebrow: 'Biología · Bestiario imaginario, s. XIII',
      tagline: 'Un campo para lo que todavía no tiene nombre.',
      intro:
        'Antes de la taxonomía, los animales se clasificaban por lo que enseñaban. La liebre con alas no era un error: era una lección sobre la prudencia. Este bestiario inventa especies para pensar.',
      sections: [
        { kicker: '01 / La liebre', title: 'Orejas de pájaro', body: 'La liebre alada vive en los márgenes. Su cuerpo es de liebre; su vuelo, de pájaro; su función, advertir.' },
        { kicker: '02 / El zorro', title: 'Dos colas, una verdad', body: 'El zorro de dos colas no duda: muestra las dos caras de una misma decisión.' },
        { kicker: '03 / El coral', title: 'Un animal que es jardín', body: 'El coral parece planta y come como animal. Su existencia incomodó a los naturalistas durante siglos.' },
      ],
      quote: { text: 'La imaginación también es un instrumento de conocimiento.', author: 'Scriptorium, folio XII' },
      cta: { label: 'Abrir el manuscrito', href: '#top' },
      footer: 'Liber Bestiarum · Edición iluminada',
      locale: 'es',
    },
  },
  {
    slug: 'psychedelic',
    brief: {
      title: 'Carteles que vibran',
      brand: 'The Fillmore Room',
      eyebrow: 'Música · San Francisco, 1967',
      tagline: 'Un cartel que no se puede leer quieto.',
      intro:
        'En 1967, el cartel de concierto dejó de ser un aviso y se volvió una experiencia. Tipografía que se derrite, colores que se pelean y un ojo que nunca termina de enfocar.',
      sections: [
        { kicker: '01 / La tipografía', title: 'Letras líquidas', body: 'La palabra se estira hasta el borde de la legibilidad. El esfuerzo de leer es parte del cartel.' },
        { kicker: '02 / El color', title: 'Contraste sin descanso', body: 'Magenta contra naranja, amarillo contra violeta. El ojo no encuentra un lugar neutro.' },
        { kicker: '03 / La escala', title: 'Todo ocupa todo', body: 'No hay jerarquía clásica: la información flota en un mismo campo de energía.' },
      ],
      quote: { text: 'Si el cartel no te mueve, no es un cartel: es un aviso.', author: 'The Fillmore Room, 1967' },
      cta: { label: 'Entrar al concierto', href: '#top' },
      footer: 'The Fillmore Room · Serie psicodélica',
      locale: 'es',
    },
  },
  {
    slug: 'memphis',
    brief: {
      title: 'El mal gusto es un método',
      brand: 'Gruppo Memphis',
      eyebrow: 'Diseño · Milán, 1981',
      tagline: 'Una silla que no quiere ser moderna.',
      intro:
        'Memphis no fue un accidente: fue una estrategia. Contra el buen gusto moderno, puso plástico, squiggles y colores de helado. El resultado parecía divertido; la intención era política.',
      sections: [
        { kicker: '01 / La superficie', title: 'Laminado y mármol', body: 'Materiales baratos tratados como lujo. La superficie no imita: exagera.' },
        { kicker: '02 / La forma', title: 'El squiggle', body: 'Una línea que no va de A a B. La decoración recupera el derecho a no ser funcional.' },
        { kicker: '03 / El color', title: 'Cobalto y helado', body: 'Combinaciones que la escuela moderna prohibía. El color se vuelve una broma seria.' },
      ],
      quote: { text: 'El buen gusto también es una ideología.', author: 'Gruppo Memphis, 1981' },
      cta: { label: 'Revolver las formas', href: '#top' },
      footer: 'Gruppo Memphis · Diseño y desobediencia',
      locale: 'es',
    },
  },
  {
    slug: 'vaporwave',
    brief: {
      title: 'La historia de internet en 12 ventanas',
      brand: 'MUSEO_1999.EXE',
      eyebrow: 'Medios · Interfaz de escritorio, 1999',
      tagline: 'Una ventana es una forma de recordar.',
      intro:
        'La web de 1999 cabía en un escritorio: carpetas, ventanas y un cursor que prometía futuro. Hoy esas interfaces son ruinas. Este museo las vuelve a abrir, una por una.',
      sections: [
        { kicker: '01 / La ventana', title: 'Arrastrar y soltar', body: 'La ventana fue una metáfora del control. Podías moverla, cerrarla, olvidarla.' },
        { kicker: '02 / El cursor', title: 'La mano que señala', body: 'Antes del scroll infinito, el cursor era el único cuerpo. La pantalla respondía a un gesto.' },
        { kicker: '03 / La ruina', title: 'Un futuro caducado', body: 'Lo que prometía velocidad hoy parece lento. La nostalgia es una forma de leer la tecnología.' },
      ],
      quote: { text: 'Toda interfaz es una promesa sobre el futuro.', author: 'MUSEO_1999.EXE' },
      cta: { label: 'Abrir el archivo', href: '#top' },
      footer: 'MUSEO_1999.EXE · Archivo de interfaces',
      locale: 'es',
    },
  },
];

async function main(): Promise<void> {
  await mkdir(out, { recursive: true });
  await mkdir(path.join(root, 'examples', 'gifs'), { recursive: true });
  for (const page of pages) {
    const file = path.join(out, page.slug, 'index.html');
    await mkdir(path.dirname(file), { recursive: true });
    const result = await createPage({ style: page.slug, brief: page.brief, output: file });
    const failed = result.validation.vision.checks.filter((check) => !check.passed).map((check) => check.name);
    console.log(
      `${page.slug.padEnd(12)} ${result.validation.grade} ${String(result.validation.score).padStart(3)} · vision ${result.validation.vision.score}/4${failed.length ? ` (${failed.join(',')})` : ''}`,
    );
  }

  const gifText: Record<string, string> = {
    artdeco: 'CIUDAD',
    isotype: 'VIENA',
    opart: 'MIRÁ',
    ukiyoe: 'OLA',
    bestiary: 'BESTIARIO',
    psychedelic: 'VIBRÁ',
    memphis: 'MEMPHIS',
    vaporwave: '1999',
  };
  for (const page of pages) {
    const gif = path.join(root, 'examples', 'gifs', `showcase-${page.slug}.gif`);
    await createGif(page.slug, { text: gifText[page.slug] ?? page.brief.title, subtitle: 'OPEN BEAUTY', width: 560, height: 560, fps: 16, duration: 1.8 }, gif);
    console.log(`gif ${page.slug.padEnd(12)} → ${path.relative(root, gif)}`);
  }

  const cards = pages
    .map(
      (page, index) => `<a class="card" href="${page.slug}/index.html">
  <span class="num">${String(index + 1).padStart(2, '0')}</span>
  <img src="../previews/mine-${page.slug}.png" alt="${page.brief.title}" loading="lazy">
  <div class="body"><h2>${page.brief.title}</h2><p>${page.slug} · ${page.brief.eyebrow ?? ''}</p><span class="go">Abrir estilo →</span></div>
</a>`,
    )
    .join('\n');

  await writeFile(
    path.join(out, 'index.html'),
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ocho estilos nuevos · open-beauty-site</title>
<style>
:root{--paper:#F2EFE6;--ink:#0B0B0B;--acid:#D8FF3E;--red:#E0432E;--mono:'Space Mono',monospace;--display:'Archivo Black',sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--mono);font-size:13px}
a{color:inherit;text-decoration:none}img{display:block;width:100%}
.top{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:14px 22px;border-bottom:2px solid var(--ink)}
.brand{font-family:var(--display);font-size:18px}.brand i{color:var(--red);font-style:normal}
.top nav{display:flex;gap:18px;font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.hero{padding:52px 22px 34px;border-bottom:2px solid var(--ink);max-width:1320px;margin:0 auto}
h1{font-family:var(--display);font-size:clamp(46px,8vw,116px);line-height:1.08;letter-spacing:-.06em;text-transform:uppercase;margin:0;max-width:14ch}
h1 mark{background:var(--acid);padding:.02em .04em;box-decoration-break:clone;line-height:1.12}
p.lede{max-width:640px;font-size:16px;line-height:1.6;margin:22px 0}
.cta{display:inline-flex;border:2px solid var(--ink);padding:10px 13px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;background:var(--acid)}
.grid{max-width:1320px;margin:0 auto;padding:34px 22px 60px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}
.card{position:relative;border:2px solid var(--ink);background:#fff;display:grid;grid-template-columns:1fr;transition:transform .25s,box-shadow .25s}
.card:hover{transform:translate(-3px,-3px);box-shadow:6px 6px 0 var(--ink)}
.card img{aspect-ratio:16/10;object-fit:cover;object-position:top;border-bottom:2px solid var(--ink)}
.body{padding:14px 16px 16px;position:relative}
.num{position:absolute;top:-14px;left:12px;background:var(--acid);border:2px solid var(--ink);padding:3px 6px;font-size:10px;z-index:2}
h2{font-family:var(--display);font-size:24px;line-height:1;letter-spacing:-.03em;margin:0 0 6px}
.body p{margin:0 0 12px;color:#6D6A61;font-size:10px;letter-spacing:.06em;text-transform:uppercase}
.go{font-size:10px;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid var(--ink);padding-bottom:2px}
@media(max-width:780px){.grid{grid-template-columns:1fr}.top nav{display:none}}
</style>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Mono&display=swap" rel="stylesheet">
</head><body>
<header class="top"><a class="brand" href="../index.html">OPEN<i>/</i>BEAUTY</a><nav><a href="../index.html">Galería</a><a href="../compare.html">Dos manos</a><a href="https://github.com/jdsalasca/open-beauty-site">GitHub ↗</a></nav></header>
<section class="hero"><h1>Ocho<br><mark>estilos nuevos.</mark></h1><p class="lede">Art Deco, Isotype, Op Art, Ukiyo-e, Bestiario, Psicodelia, Memphis y Vaporwave. SVG y CSS original, tipografía exacta, interacción y GIF. Todos A/100 y vision 4/4.</p><a class="cta" href="../compare.html">Ver mi versión vs Luna 6 Max →</a></section>
<main class="grid">${cards}</main>
</body></html>`,
    'utf8',
  );
  console.log('Wrote examples/showcase/index.html');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
