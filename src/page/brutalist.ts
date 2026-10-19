import type { Brief, StylePreset } from '../types.js';
import {
  arrowSvg,
  esc,
  labels,
  normalizeBrief,
  REVEAL_SCRIPT,
  safeHref,
  shell,
  splitAccent,
  t,
} from './common.js';

function glyphSvg(): string {
  return `<svg viewBox="0 0 320 320" fill="none" aria-hidden="true">
  <rect x="1.5" y="1.5" width="317" height="317" stroke="currentColor" stroke-width="3"/>
  <line x1="0" y1="160" x2="320" y2="160" stroke="currentColor" stroke-width="3"/>
  <line x1="160" y1="0" x2="160" y2="320" stroke="currentColor" stroke-width="3"/>
  <circle cx="160" cy="160" r="96" stroke="currentColor" stroke-width="3"/>
  <circle cx="160" cy="160" r="52" fill="currentColor"/>
  <path d="M160 18 L178 62 L160 52 L142 62 Z" fill="currentColor"/>
  <path d="M160 302 L178 258 L160 268 L142 258 Z" fill="currentColor"/>
  <path d="M18 160 L62 142 L52 160 L62 178 Z" fill="currentColor"/>
  <path d="M302 160 L258 142 L268 160 L258 178 Z" fill="currentColor"/>
  <rect x="16" y="16" width="34" height="34" fill="currentColor"/>
  <rect x="270" y="270" width="34" height="34" fill="currentColor"/>
</svg>`;
}

export function renderBrutalist(input: Partial<Brief>, preset: StylePreset): string {
  const brief = normalizeBrief(input);
  const locale = brief.locale ?? 'es';
  const l = labels(locale);
  const { main, accent } = splitAccent(brief.title);
  const brand = brief.brand || brief.title;
  const eyebrow = brief.eyebrow || t(locale, 'Estudio independiente', 'Independent studio');
  const tagline =
    brief.tagline ||
    t(locale, 'Diseño que no pide permiso. Sitios, carteles y animaciones para marcas que quieren existir.', 'Design that does not ask permission. Sites, posters and motion for brands that want to exist.');
  const intro = brief.intro;
  const sections = brief.sections ?? [];
  const quote = brief.quote;
  const cta = brief.cta ?? { label: t(locale, 'Hablemos', 'Let’s talk'), href: '#contact' };
  const year = new Date().getFullYear();
  const worksHref = sections.length ? '#works' : '#contact';
  const ticker = t(
    locale,
    'OPEN BEAUTY /// DIRECCIÓN DE ARTE /// HTML + GIF /// SIN PLANTILLAS /// ',
    'OPEN BEAUTY /// ART DIRECTION /// HTML + GIF /// NO TEMPLATES /// ',
  );

  const cards = sections
    .map(
      (section, index) => `<article class="card reveal" style="--d:${index}">
  <div class="card-top">
    <span class="card-num">${String(index + 1).padStart(2, '0')}</span>
    <span class="card-tag">${esc(section.kicker || t(locale, 'OBRA', 'WORK'))}</span>
  </div>
  <h3>${esc(section.title)}</h3>
  <p>${esc(section.body)}</p>
  <a class="card-link" href="${safeHref(worksHref)}">${esc(l.readMore)} ${arrowSvg(14)}</a>
</article>`,
    )
    .join('\n');

  const body = `<div class="page-frame" aria-hidden="true"></div>
<header class="topbar">
  <a class="logo" href="#top">${esc(brand)}<span class="reg">®</span></a>
  <p class="coord">${esc(brand.toUpperCase().slice(0, 30))}</p>
  <nav aria-label="${esc(t(locale, 'Navegación principal', 'Main navigation'))}">
    <a class="toplink" href="${safeHref(cta.href)}">${esc(cta.label)} ${arrowSvg(14)}</a>
  </nav>
</header>

<main id="top">
  <section class="hero">
    <div class="hero-copy">
      <div class="hero-eyebrow reveal" style="--d:0">
        <span class="badge">${esc(eyebrow)}</span>
        <span class="est">EST. ${year}</span>
      </div>
      <h1 class="reveal" style="--d:1"><span class="line">${esc(main)}</span>${accent ? `<span class="line"><span class="hl">${esc(accent)}</span></span>` : ''}</h1>
      <p class="lede reveal" style="--d:2">${esc(tagline)}</p>
      <div class="hero-actions reveal" style="--d:3">
        <a class="btn btn-acid" href="${safeHref(worksHref)}">${esc(l.viewWorks)} ${arrowSvg(16)}</a>
        <a class="btn btn-ghost" href="${intro ? '#manifesto' : '#contact'}">${esc(l.manifesto)}</a>
      </div>
      <div class="hero-strip reveal" style="--d:4">
        <span>${esc(t(locale, '03 ESTILOS', '03 STYLES'))}</span>
        <span>${esc(t(locale, '02 FORMATOS', '02 FORMATS'))}</span>
        <span>${esc(t(locale, '100% ABIERTO', '100% OPEN'))}</span>
      </div>
    </div>
    <aside class="hero-aside reveal" style="--d:2">
      <div class="aside-top"><span>FIG. 01</span><span>SCALE 1:1</span></div>
      <div class="glyph">${glyphSvg()}</div>
      <div class="aside-bottom"><span>${esc(t(locale, 'SISTEMA DE DISEÑO', 'DESIGN SYSTEM'))}</span><span class="aside-arrow">↗</span></div>
    </aside>
  </section>

  <div class="ticker" aria-hidden="true">
    <div class="ticker-track"><span>${esc(ticker)}</span><span>${esc(ticker)}</span></div>
  </div>

  ${
    intro
      ? `<section id="manifesto" class="manifesto">
    <div class="sec-head reveal"><span class="num">01</span><span>${esc(l.manifesto)}</span></div>
    <div class="manifesto-body">
      <h2 class="reveal">${esc(t(locale, 'Menos adorno. Más criterio.', 'Less decoration. More judgement.'))}</h2>
      <p class="reveal" style="--d:1">${esc(intro)}</p>
      <div class="facts reveal" style="--d:2">
        <div><b>03</b><span>${esc(t(locale, 'SISTEMAS', 'SYSTEMS'))}</span></div>
        <div><b>24</b><span>${esc(t(locale, 'FOTOGRAMAS / SEG', 'FRAMES / SEC'))}</span></div>
        <div><b>∞</b><span>${esc(t(locale, 'VARIACIONES', 'VARIATIONS'))}</span></div>
      </div>
    </div>
  </section>`
      : ''
  }

  ${
    sections.length
      ? `<section id="works" class="works">
    <header class="works-head reveal">
      <div><span class="sec-num">02</span><h2>${esc(l.works)}</h2></div>
      <span class="works-meta">${esc(l.selectedWorks)} · ${String(sections.length).padStart(2, '0')}</span>
    </header>
    <div class="cards">${cards}</div>
  </section>`
      : ''
  }

  ${
    quote
      ? `<section class="quote reveal">
    <span class="quote-mark" aria-hidden="true">“</span>
    <blockquote>${esc(quote.text)}</blockquote>
    ${quote.author ? `<p class="quote-author">— ${esc(quote.author)}</p>` : ''}
  </section>`
      : ''
  }

  <section id="contact" class="cta reveal">
    <p class="cta-label">${esc(t(locale, '¿EMPEZAMOS?', 'SHALL WE START?'))}</p>
    <h2>${esc(t(locale, 'HACÉ ALGO QUE NO SE OLVIDE.', 'MAKE SOMETHING THEY WON’T FORGET.'))}</h2>
    <a class="btn btn-ink" href="${safeHref(cta.href)}">${esc(cta.label)} ${arrowSvg(18)}</a>
  </section>
</main>

<footer class="site-foot">
  <span>${esc(brand)}</span>
  <span>${esc(brief.footer || t(locale, 'DISEÑO Y CÓDIGO — MMXXVI', 'DESIGN AND CODE — MMXXVI'))}</span>
  <span>© ${year} ${esc(l.madeWith)}</span>
</footer>`;

  const css = `:root{
  --paper:${preset.palette.bg};--surface:${preset.palette.surface};--ink:${preset.palette.ink};
  --muted:${preset.palette.muted};--acid:${preset.palette.accent};--red:${preset.palette.accent2};
  --blue:${preset.palette.accent3};
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:'Space Mono',ui-monospace,'Courier New',monospace;font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(to right,rgba(11,11,11,.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(11,11,11,.06) 1px,transparent 1px);background-size:80px 80px}
.page-frame{position:fixed;inset:0;border:6px solid var(--ink);pointer-events:none;z-index:80}
a{color:inherit;text-decoration:none}
svg{display:block;max-width:100%}
header,main,footer{position:relative;z-index:2}
.topbar{display:flex;align-items:center;justify-content:space-between;gap:24px;padding:16px 28px;border-bottom:3px solid var(--ink);background:var(--paper);position:sticky;top:0;z-index:50}
.logo{font-family:'Archivo Black',Impact,'Arial Black',sans-serif;font-size:22px;text-transform:uppercase;letter-spacing:-.02em;display:flex;align-items:flex-start;gap:4px}
.logo .reg{font-family:'Space Mono',monospace;font-size:9px;margin-top:3px}
.coord{font-size:10px;letter-spacing:.1em;text-transform:uppercase;margin:0;color:var(--muted)}
.toplink{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border-bottom:3px solid var(--ink);padding-bottom:2px}
.toplink:hover{background:var(--acid);box-shadow:4px 4px 0 var(--ink)}
.hero{display:grid;grid-template-columns:1.35fr .65fr;border-bottom:3px solid var(--ink);min-height:clamp(620px,calc(100vh - 70px),820px)}
.hero-copy{padding:clamp(38px,6vw,86px);border-right:3px solid var(--ink);display:flex;flex-direction:column;justify-content:center}
.hero-eyebrow{display:flex;align-items:center;gap:14px;margin-bottom:26px}
.badge{background:var(--ink);color:var(--paper);padding:5px 9px;font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.est{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
h1{font-family:'Archivo Black',Impact,'Arial Black',sans-serif;font-weight:400;font-size:clamp(54px,9.6vw,146px);line-height:.9;letter-spacing:-.04em;text-transform:uppercase;margin:0;max-width:14ch}
h1 .line{display:block}
h1 .hl{display:inline-block;background:var(--acid);padding:0 .08em;line-height:1;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.lede{max-width:560px;margin:30px 0 0;font-size:16px;line-height:1.55;color:var(--ink)}
.hero-actions{display:flex;flex-wrap:wrap;gap:16px;margin-top:34px}
.btn{display:inline-flex;align-items:center;gap:12px;padding:16px 22px;border:3px solid var(--ink);font-family:'Space Mono',monospace;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;box-shadow:6px 6px 0 var(--ink);transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s cubic-bezier(.2,.8,.2,1),background .25s}
.btn:hover{transform:translate(-2px,-2px);box-shadow:9px 9px 0 var(--ink)}
.btn:active{transform:translate(2px,2px);box-shadow:3px 3px 0 var(--ink)}
.btn svg{transition:transform .25s}
.btn:hover svg{transform:translateX(4px)}
.btn-acid{background:var(--acid);color:var(--ink)}
.btn-ghost{background:var(--paper);color:var(--ink)}
.btn-ink{background:var(--ink);color:var(--paper);border-color:var(--ink);box-shadow:6px 6px 0 var(--paper)}
.btn-ink:hover{box-shadow:9px 9px 0 var(--paper)}
.hero-strip{display:flex;flex-wrap:wrap;gap:10px 22px;margin-top:44px;padding-top:14px;border-top:3px solid var(--ink);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.hero-aside{background:var(--ink);color:var(--acid);display:flex;flex-direction:column;padding:20px}
.aside-top,.aside-bottom{display:flex;justify-content:space-between;gap:12px;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--paper)}
.aside-top{border-bottom:3px solid rgba(242,239,228,.28);padding-bottom:10px}
.aside-bottom{border-top:3px solid rgba(242,239,228,.28);padding-top:10px}
.glyph{flex:1;display:grid;place-items:center;padding:28px 8px;color:var(--acid)}
.glyph svg{width:min(100%,340px);height:auto}
.aside-arrow{font-size:18px;line-height:1}
.ticker{overflow:hidden;background:var(--acid);border-bottom:3px solid var(--ink);height:52px;display:flex;align-items:center}
.ticker-track{display:flex;width:max-content;animation:marquee 22s linear infinite}
.ticker-track span{font-family:'Archivo Black',sans-serif;font-size:17px;letter-spacing:.02em;text-transform:uppercase;padding-right:18px;white-space:nowrap}
@keyframes marquee{to{transform:translateX(-50%)}}
.manifesto{padding:clamp(60px,8vw,104px) clamp(24px,6vw,96px);border-bottom:3px solid var(--ink);display:grid;grid-template-columns:220px 1fr;gap:40px}
.sec-head{display:flex;align-items:flex-start;gap:14px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;padding-top:8px}
.sec-head .num{background:var(--ink);color:var(--acid);padding:4px 7px}
.manifesto-body h2{font-family:'Archivo Black',sans-serif;font-weight:400;font-size:clamp(36px,5.2vw,68px);line-height:.9;letter-spacing:-.03em;text-transform:uppercase;margin:0;max-width:16ch}
.manifesto-body>p{max-width:680px;margin:26px 0 0;font-size:16px;line-height:1.65;color:var(--ink)}
.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:40px;max-width:760px}
.facts>div{border-top:3px solid var(--ink);padding-top:12px}
.facts b{display:block;font-family:'Archivo Black',sans-serif;font-weight:400;font-size:36px;line-height:1;letter-spacing:-.02em}
.facts span{display:block;margin-top:6px;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.works{padding:clamp(60px,8vw,104px) clamp(24px,6vw,96px);border-bottom:3px solid var(--ink)}
.works-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:38px}
.works-head>div{display:flex;align-items:flex-start;gap:14px}
.sec-num{font-size:11px;letter-spacing:.14em;color:var(--ink);border-bottom:3px solid var(--red);padding-bottom:2px;margin-top:8px}
.works-head h2{font-family:'Archivo Black',sans-serif;font-weight:400;font-size:clamp(42px,6vw,84px);line-height:.85;letter-spacing:-.04em;text-transform:uppercase;margin:0}
.works-meta{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);text-align:right}
.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.card{border:3px solid var(--ink);background:var(--paper);padding:24px;display:flex;flex-direction:column;box-shadow:8px 8px 0 var(--ink);transition:transform .3s cubic-bezier(.2,.8,.2,1),box-shadow .3s cubic-bezier(.2,.8,.2,1),background .3s}
.card:hover{transform:translate(-4px,-4px);box-shadow:12px 12px 0 var(--ink);background:var(--surface)}
.card-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:34px}
.card-num{font-family:'Archivo Black',sans-serif;font-size:42px;line-height:.8;letter-spacing:-.04em;color:transparent;-webkit-text-stroke:2px var(--ink)}
.card-tag{font-size:9px;letter-spacing:.14em;text-transform:uppercase;background:var(--ink);color:var(--paper);padding:4px 7px}
.card h3{font-family:'Archivo Black',sans-serif;font-weight:400;font-size:24px;line-height:1;text-transform:uppercase;letter-spacing:-.02em;margin:0 0 12px}
.card p{margin:0 0 24px;font-size:14px;line-height:1.55;color:var(--ink)}
.card-link{display:inline-flex;align-items:center;gap:8px;margin-top:auto;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border-top:3px solid var(--ink);padding-top:10px}
.card-link svg{transition:transform .25s}
.card:hover .card-link svg{transform:translateX(4px)}
.quote{background:var(--ink);color:var(--paper);padding:clamp(60px,8vw,110px) clamp(24px,6vw,96px);position:relative;border-bottom:3px solid var(--ink)}
.quote-mark{font-family:'Archivo Black',sans-serif;font-size:110px;line-height:.55;color:var(--red);display:block}
.quote blockquote{font-family:'Archivo Black',sans-serif;font-weight:400;font-size:clamp(34px,5.6vw,80px);line-height:.94;letter-spacing:-.03em;text-transform:uppercase;margin:0;max-width:20ch}
.quote-author{margin:26px 0 0;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--acid)}
.cta{background:var(--acid);padding:clamp(60px,8vw,110px) clamp(24px,6vw,96px);border-bottom:3px solid var(--ink)}
.cta-label{font-size:10px;letter-spacing:.18em;text-transform:uppercase;margin:0 0 22px}
.cta h2{font-family:'Archivo Black',sans-serif;font-weight:400;font-size:clamp(42px,8vw,112px);line-height:.84;letter-spacing:-.045em;text-transform:uppercase;margin:0 0 34px;max-width:15ch}
.site-foot{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:20px 28px;background:var(--ink);color:var(--paper);font-size:9px;letter-spacing:.12em;text-transform:uppercase}
.js .reveal{opacity:0;transform:translateY(26px);transition:opacity .45s cubic-bezier(.2,.8,.2,1),transform .45s cubic-bezier(.2,.8,.2,1);transition-delay:calc(var(--d,0) * 70ms)}
.js .reveal.is-in{opacity:1;transform:none}
@media (max-width:980px){
  .hero{grid-template-columns:1fr;min-height:0}
  .hero-copy{border-right:none;border-bottom:3px solid var(--ink)}
  .hero-aside{min-height:340px}
  .manifesto{grid-template-columns:1fr;gap:20px}
  .cards{grid-template-columns:1fr}
  .works-head{flex-direction:column;align-items:flex-start;gap:10px}
  .works-meta{text-align:left}
}
@media (max-width:640px){
  .topbar{padding:12px 16px}
  .coord{display:none}
  h1{font-size:clamp(48px,13vw,86px)}
  .hero-copy{padding:34px 20px 44px}
  .hero-aside{padding:14px}
  .manifesto,.works,.quote,.cta{padding-left:20px;padding-right:20px}
  .facts{grid-template-columns:1fr 1fr}
  .page-frame{border-width:3px}
  .site-foot{flex-direction:column;align-items:flex-start}
}
@media (prefers-reduced-motion:reduce){
  .js .reveal{opacity:1;transform:none;transition:none}
  .ticker-track{animation:none}
  .btn,.card,.btn svg,.card-link svg{transition:none}
}
`;

  return shell({
    lang: locale,
    title: `${brief.title} — ${brand}`,
    description: brief.tagline || brief.intro || brief.title,
    preset,
    css,
    body,
    script: REVEAL_SCRIPT,
  });
}
