import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const styles = [
  { slug: 'artdeco', name: 'Art Deco', meta: 'Poiret One · champagne · sol', mine: 'La ciudad vertical', luna: 'Ascensor a las nubes' },
  { slug: 'isotype', name: 'Isotype', meta: 'Jost · pictograma · Viena', mine: 'Viena 1925', luna: 'La ciudad en nueve pictogramas' },
  { slug: 'opart', name: 'Op Art', meta: 'Archivo Black · moiré · ojo', mine: 'Tu ojo miente', luna: 'El punto ciego' },
  { slug: 'ukiyoe', name: 'Ukiyo-e', meta: 'Shippori Mincho · Prussian blue · ola', mine: 'La ola que se repite', luna: 'Mapa de corrientes' },
  { slug: 'bestiary', name: 'Bestiario iluminado', meta: 'Unifraktur · pergamino · oro', mine: 'Animales que nunca existieron', luna: 'El jardín de los animales imposibles' },
  { slug: 'psychedelic', name: 'Psychedelic', meta: 'Bungee Shade · magenta · 1967', mine: 'Carteles que vibran', luna: 'El color del sonido' },
  { slug: 'memphis', name: 'Memphis', meta: 'Bricolage · keyline · 1981', mine: 'El mal gusto es un método', luna: 'Una silla para un gato' },
  { slug: 'vaporwave', name: 'Vaporwave / Y2K', meta: 'Press Start 2P · grid · 1999', mine: 'La historia de internet en 12 ventanas', luna: 'Manual de la ventana perdida' },
];

const rows = styles
  .map(
    (style, index) => `<section class="duel" id="${style.slug}">
  <header class="duel-head reveal">
    <span class="index">${String(index + 1).padStart(2, '0')}</span>
    <div class="duel-title"><h2>${style.name}</h2><p>${style.meta}</p></div>
    <a class="jump" href="#top">↑</a>
  </header>
  <div class="versus reveal">
    <figure class="side mine">
      <figcaption><span class="who">MÍO</span><strong>${style.mine}</strong></figcaption>
      <button class="shot" type="button" data-full="previews/mine-${style.slug}.png" aria-label="Ampliar mi versión de ${style.name}">
        <img src="previews/mine-${style.slug}.png" alt="Mi versión de ${style.name}" loading="lazy">
      </button>
      <a class="open" href="showcase/${style.slug}/index.html">Abrir página <span>↗</span></a>
    </figure>
    <div class="vs" aria-hidden="true"><span>VS</span></div>
    <figure class="side luna">
      <figcaption><span class="who">LUNA 6 MAX</span><strong>${style.luna}</strong></figcaption>
      <button class="shot" type="button" data-full="previews/luna-${style.slug}.png" aria-label="Ampliar la versión de Luna de ${style.name}">
        <img src="previews/luna-${style.slug}.png" alt="Versión de Luna 6 Max de ${style.name}" loading="lazy">
      </button>
      <a class="open" href="luna-showcase/${style.slug}.html">Abrir página <span>↗</span></a>
    </figure>
  </div>
</section>`,
  )
  .join('\n');

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dos manos · Ocho estilos · open-beauty-site</title>
<meta name="description" content="Ocho direcciones de arte, dos versiones: la mía y la de Luna 6 Max. Todas A/100 y vision 4/4.">
<style>
:root{--paper:#F2EFE6;--ink:#0B0B0B;--acid:#D8FF3E;--red:#E0432E;--muted:#6D6A61;--line:rgba(11,11,11,.22);--mono:'Space Mono',ui-monospace,monospace;--display:'Archivo Black',system-ui,sans-serif}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--mono);font-size:14px;line-height:1.5}
a{color:inherit;text-decoration:none}
img{display:block;max-width:100%}
.top{position:sticky;top:0;z-index:30;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:14px 22px;background:var(--paper);border-bottom:2px solid var(--ink)}
.brand{font-family:var(--display);font-size:18px;letter-spacing:-.02em}
.brand i{color:var(--red);font-style:normal}
.top nav{display:flex;gap:18px;font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.top nav a{padding-bottom:3px;border-bottom:1px solid transparent}
.top nav a:hover{border-color:var(--ink)}
.hero{padding:54px 22px 36px;border-bottom:2px solid var(--ink);background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:56px 56px}
.hero-inner{max-width:1320px;margin:0 auto}
.kicker{margin:0 0 14px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
h1{font-family:var(--display);font-size:clamp(46px,7.4vw,108px);line-height:1.12;letter-spacing:-.06em;text-transform:uppercase;margin:0;max-width:11ch}
h1 mark{background:var(--acid);color:var(--ink);padding:.02em .07em;box-decoration-break:clone;line-height:1.14}
.lede{max-width:640px;margin:26px 0 0;font-size:17px;line-height:1.6}
.lede b{background:var(--acid);padding:0 .15em}
.stats{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
.stat{border:2px solid var(--ink);background:var(--paper);padding:10px 14px;font-size:10px;letter-spacing:.1em;text-transform:uppercase}
.stat b{font-family:var(--display);font-size:22px;display:block;letter-spacing:-.03em;margin-bottom:2px}
.legend{display:flex;flex-wrap:wrap;gap:26px;margin-top:26px;font-size:11px;line-height:1.5}
.legend span{max-width:430px}
.legend strong{display:block;font-family:var(--display);font-size:13px;letter-spacing:.04em;margin-bottom:3px}
.filter{display:flex;gap:0;margin:22px 0 0}
.filter button{border:2px solid var(--ink);background:transparent;color:var(--ink);font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;padding:9px 14px;cursor:pointer}
.filter button+button{border-left:0}
.filter button.is-on{background:var(--ink);color:var(--paper)}
main{max-width:1320px;margin:0 auto;padding:0 22px}
.duel{padding:46px 0 34px;border-bottom:2px solid var(--ink)}
.duel-head{display:grid;grid-template-columns:52px 1fr 40px;gap:16px;align-items:start;margin-bottom:20px}
.index{font-family:var(--display);font-size:22px;line-height:1;color:var(--red)}
.duel-title h2{font-family:var(--display);font-size:clamp(30px,4.4vw,58px);line-height:.95;letter-spacing:-.045em;margin:0;text-transform:uppercase}
.duel-title p{margin:8px 0 0;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.jump{display:grid;place-items:center;width:38px;height:38px;border:2px solid var(--ink);font-size:15px;transition:background .2s,color .2s}
.jump:hover{background:var(--ink);color:var(--paper)}
.versus{display:grid;grid-template-columns:1fr 42px 1fr;gap:12px;align-items:center}
.side{position:relative;margin:0}
.side figcaption{display:flex;align-items:center;gap:12px;min-height:34px;margin-bottom:9px}
.who{flex:0 0 auto;background:var(--ink);color:var(--paper);padding:5px 8px;font-size:9px;letter-spacing:.12em}
.luna .who{background:var(--red)}
.side figcaption strong{font-family:var(--display);font-size:14px;line-height:1.2;letter-spacing:-.01em;font-weight:400}
.shot{display:block;width:100%;padding:0;border:2px solid var(--ink);background:#fff;cursor:zoom-in;overflow:hidden;position:relative}
.shot img{width:100%;aspect-ratio:16/10;object-fit:cover;object-position:top;transition:transform .5s cubic-bezier(.22,.9,.24,1)}
.shot:hover img{transform:scale(1.025)}
.side.luna .shot{border-color:var(--red)}
.open{display:flex;justify-content:space-between;align-items:center;border:2px solid var(--ink);border-top:0;padding:9px 11px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;background:var(--paper);transition:background .2s,color .2s}
.open:hover{background:var(--acid)}
.side.luna .open{border-color:var(--red)}
.open span{font-size:13px}
.vs{display:grid;place-items:center;height:100%;position:relative}
.vs::before{content:"";position:absolute;top:0;bottom:0;left:50%;width:2px;background:var(--ink)}
.vs span{position:relative;z-index:1;background:var(--acid);border:2px solid var(--ink);display:grid;place-items:center;width:34px;height:34px;font-family:var(--display);font-size:10px;transform:rotate(-6deg)}
footer{max-width:1320px;margin:0 auto;padding:26px 22px 40px;display:flex;justify-content:space-between;gap:20px;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
dialog{border:2px solid var(--ink);padding:0;background:var(--paper);max-width:min(94vw,1400px);width:100%}
dialog::backdrop{background:rgba(11,11,11,.78)}
dialog img{width:100%;height:auto;max-height:82vh;object-fit:contain;background:var(--paper)}
.dialog-bar{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;border-bottom:2px solid var(--ink);font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.dialog-bar button{border:2px solid var(--ink);background:var(--ink);color:var(--paper);padding:5px 10px;cursor:pointer;font-family:var(--mono);font-size:10px}
.is-mine .side.luna,.is-luna .side.mine{display:none}
.is-mine .versus,.is-luna .versus{grid-template-columns:1fr}
.is-mine .vs,.is-luna .vs{display:none}
.is-mine .side.mine,.is-luna .side.luna{max-width:900px}
.reveal{opacity:0;transform:translateY(18px);transition:opacity .6s ease,transform .6s cubic-bezier(.22,.9,.24,1)}
.reveal.is-in{opacity:1;transform:none}
@media (max-width:860px){
 .versus{grid-template-columns:1fr;gap:18px}
 .vs{height:32px}.vs::before{top:50%;bottom:auto;left:0;right:0;width:auto;height:2px}
 .vs span{transform:rotate(-3deg)}
 .duel-head{grid-template-columns:42px 1fr 34px}
 .jump{width:34px;height:34px}
 .is-mine .versus,.is-luna .versus{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none;transition:none}.shot img{transition:none}}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
</head>
<body id="top">
<header class="top">
  <a class="brand" href="index.html">OPEN<i>/</i>BEAUTY</a>
  <nav>
    <a href="index.html">Galería</a>
    <a href="#top">Comparar</a>
    <a href="https://github.com/jdsalasca/open-beauty-site">GitHub ↗</a>
  </nav>
</header>
<section class="hero">
  <div class="hero-inner">
    <p class="kicker">Ocho estilos · Dieciséis páginas · Cero imágenes de stock</p>
    <h1>Dos manos.<br><mark>Ocho estilos.</mark></h1>
    <p class="lede">El mismo sistema tipográfico y cromático, dos autores. <b>MÍO:</b> un brief educativo escrito para cada estilo. <b>LUNA 6 MAX:</b> el mismo MCP, su propio brief. Todo el arte es SVG y CSS original.</p>
    <div class="stats">
      <div class="stat"><b>8</b>direcciones de arte</div>
      <div class="stat"><b>16</b>páginas</div>
      <div class="stat"><b>100</b>craft en todas</div>
      <div class="stat"><b>4/4</b>vision en todas</div>
    </div>
    <div class="legend">
      <span><strong>MI MANO</strong>Construí el renderer, el SVG, el CSS, las reglas y el brief. Cada página es una lección: arquitectura, datos, percepción, océano, taxonomía, sonido, diseño e internet.</span>
      <span><strong>LUNA 6 MAX</strong>Llamó las herramientas MCP en orden, escribió su propio copy en español y validó cada página. Ocho de ocho: A/100 y vision 4/4, sin HTML escrito a mano.</span>
    </div>
    <div class="filter" role="group" aria-label="Filtrar comparación">
      <button type="button" class="is-on" data-filter="both">Lado a lado</button>
      <button type="button" data-filter="mine">Solo mío</button>
      <button type="button" data-filter="luna">Solo Luna</button>
    </div>
  </div>
</section>
<main>
${rows}
</main>
<footer>
  <span>open-beauty-site · 2026</span>
  <span>Mismo sistema. Dos manos. Todo original.</span>
</footer>
<dialog id="lightbox">
  <div class="dialog-bar"><span id="dialog-label">Vista completa</span><button type="button" data-close>Cerrar ×</button></div>
  <img id="dialog-img" src="" alt="">
</dialog>
<script>
(() => {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  }, { threshold: .08 });
  document.querySelectorAll('.reveal').forEach((node) => io.observe(node));
  const body = document.body;
  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('is-on', item === button));
      body.classList.toggle('is-mine', button.getAttribute('data-filter') === 'mine');
      body.classList.toggle('is-luna', button.getAttribute('data-filter') === 'luna');
    });
  });
  const dialog = document.getElementById('lightbox');
  const image = document.getElementById('dialog-img');
  document.querySelectorAll('[data-full]').forEach((button) => {
    button.addEventListener('click', () => {
      image.src = button.getAttribute('data-full') || '';
      image.alt = button.getAttribute('aria-label') || '';
      document.getElementById('dialog-label').textContent = button.getAttribute('aria-label') || '';
      dialog.showModal();
    });
  });
  document.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
})();
</script>
</body>
</html>`;

await writeFile(path.join(process.cwd(), 'examples', 'compare.html'), html, 'utf8');
console.log('Wrote examples/compare.html');
