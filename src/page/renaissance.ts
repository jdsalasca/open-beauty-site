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

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

function archPlate(locale: Brief['locale']): string {
  const caption =
    locale === 'en' ? 'Fig. I — A study of light and stone' : 'Fig. I — Estudio de la luz y la piedra';
  return `<figure class="plate reveal" style="--d:4">
  <svg class="plate-svg" viewBox="0 0 560 470" role="img" aria-label="${esc(
    locale === 'en' ? 'Engraving of a sun over hills inside an arch' : 'Grabado de un sol sobre colinas dentro de un arco',
  )}">
    <defs>
      <clipPath id="archClip"><path d="M76 445 V218 A204 204 0 0 1 484 218 V445 Z"/></clipPath>
      <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" stroke-width=".7" opacity=".45"/>
      </pattern>
    </defs>
    <path class="arch-fill" d="M76 445 V218 A204 204 0 0 1 484 218 V445 Z"/>
    <g clip-path="url(#archClip)">
      <g class="ink-lines" fill="none" stroke="currentColor" stroke-width="1">
        <path d="M60 382 C 138 330, 205 350, 280 382 S 425 334, 500 382"/>
        <path d="M60 405 C 145 360, 212 382, 280 405 S 420 360, 500 405"/>
        <path d="M60 428 C 150 390, 214 410, 280 428 S 418 388, 500 428"/>
      </g>
      <path d="M60 405 C 145 360, 212 382, 280 405 S 420 360, 500 405 V450 H60 Z" fill="url(#hatch)" opacity=".5"/>
    </g>
    <g class="gold-lines" fill="none" stroke="currentColor" stroke-width="1">
      <path d="M60 445 V215 A220 220 0 0 1 500 215 V445"/>
      <path d="M76 445 V218 A204 204 0 0 1 484 218 V445"/>
      <line x1="40" y1="445" x2="520" y2="445"/>
      <line x1="40" y1="452" x2="520" y2="452" opacity=".55"/>
    </g>
    <g class="sun gold-lines" fill="none" stroke="currentColor" stroke-width="1">
      <circle cx="280" cy="196" r="52"/>
      <circle cx="280" cy="196" r="44" opacity=".45"/>
      ${Array.from({ length: 16 }, (_, index) => {
        const angle = (index / 16) * Math.PI * 2;
        const x1 = 280 + Math.cos(angle) * 62;
        const y1 = 196 + Math.sin(angle) * 62;
        const x2 = 280 + Math.cos(angle) * (index % 2 === 0 ? 82 : 73);
        const y2 = 196 + Math.sin(angle) * (index % 2 === 0 ? 82 : 73);
        return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
      }).join('')}
    </g>
    <g class="ink-lines" fill="none" stroke="currentColor" stroke-width="1" opacity=".8">
      <path d="M196 148 q 10 -10 20 0 q 10 -10 20 0"/>
      <path d="M338 126 q 8 -8 16 0 q 8 -8 16 0"/>
      <path d="M132 190 q 7 -7 14 0 q 7 -7 14 0"/>
    </g>
    <g class="laurel gold-lines" fill="none" stroke="currentColor" stroke-width="1">
      <path d="M236 452 C 214 430, 208 402, 218 376"/>
      <path d="M324 452 C 346 430, 352 402, 342 376"/>
      ${Array.from({ length: 5 }, (_, index) => {
        const y = 438 - index * 14;
        const spread = 10 + index * 4;
        return `<path d="M${236 + index * 2} ${y} q -${spread} -4 -${spread + 4} -14"/><path d="M${324 - index * 2} ${y} q ${spread} -4 ${spread + 4} -14"/>`;
      }).join('')}
      <circle cx="280" cy="452" r="3" fill="currentColor" stroke="none"/>
    </g>
  </svg>
  <figcaption>${esc(caption)}</figcaption>
</figure>`;
}

function ornamentDivider(): string {
  return `<div class="ornament reveal" aria-hidden="true" style="--d:1">
  <svg viewBox="0 0 420 40" fill="none" stroke="currentColor" stroke-width="1">
    <line x1="0" y1="20" x2="150" y2="20"/>
    <line x1="270" y1="20" x2="420" y2="20"/>
    <path d="M176 20 q 14 -14 28 0 q 14 14 28 0 q 14 -14 28 0"/>
    <circle cx="210" cy="20" r="2.5" fill="currentColor" stroke="none"/>
    <circle cx="238" cy="20" r="2.5" fill="currentColor" stroke="none"/>
  </svg>
</div>`;
}

export function renderRenaissance(input: Partial<Brief>, preset: StylePreset): string {
  const brief = normalizeBrief(input);
  const locale = brief.locale ?? 'es';
  const l = labels(locale);
  const { main, accent } = splitAccent(brief.title);
  const brand = brief.brand || brief.title;
  const eyebrow = brief.eyebrow || t(locale, 'Estudio de arte y diseño', 'Art and design studio');
  const tagline =
    brief.tagline || t(locale, 'Objetos, imágenes y sitios hechos con tiempo.', 'Objects, images and sites made slowly.');
  const intro = brief.intro;
  const cta = brief.cta ?? {
    label: t(locale, 'Empecemos', 'Let us begin'),
    href: '#contact',
  };
  const sections = brief.sections ?? [];
  const quote = brief.quote;
  const year = new Date().getFullYear();
  const indexHref = sections.length ? '#works' : intro ? '#manifesto' : '#contact';

  const cards = sections
    .map(
      (section, index) => `<article class="work reveal" style="--d:${index + 1}">
  <div class="work-top"><span class="folio">${ROMAN[index] ?? index + 1}</span><span class="work-rule"></span></div>
  <h3>${esc(section.title)}</h3>
  <p>${esc(section.body)}</p>
  <a class="text-link" href="${safeHref(indexHref)}">${esc(l.readMore)} ${arrowSvg(14)}</a>
</article>`,
    )
    .join('\n');

  const body = `<div class="page-frame" aria-hidden="true"></div>
<header class="site-head">
  <a class="wordmark" href="#top"><span class="mark">✦</span><span>${esc(brand)}</span></a>
  <nav aria-label="${esc(t(locale, 'Navegación principal', 'Main navigation'))}">
    ${intro ? `<a href="#manifesto">${esc(l.manifesto)}</a>` : ''}
    ${sections.length ? `<a href="#works">${esc(l.works)}</a>` : ''}
    <a href="#contact">${esc(l.contact)}</a>
  </nav>
</header>

<main id="top">
  <section class="hero">
    <p class="eyebrow reveal" style="--d:0"><span class="rule"></span>${esc(eyebrow)}<span class="rule"></span></p>
    <h1 class="reveal" style="--d:1">${esc(main)}${accent ? ` <em>${esc(accent)}</em>` : ''}</h1>
    <p class="tagline reveal" style="--d:2">${esc(tagline)}</p>
    <div class="hero-actions reveal" style="--d:3">
      <a class="button" href="${safeHref(indexHref)}">${esc(l.viewWorks)} ${arrowSvg(16)}</a>
      <a class="quiet-link" href="#contact">${esc(l.contact)}</a>
    </div>
    ${archPlate(locale)}
    <a class="scroll-cue reveal" style="--d:5" href="${indexHref}" aria-label="${esc(l.next)}">
      <span></span><span>${esc(t(locale, 'Descender', 'Scroll'))}</span>
    </a>
  </section>

  ${ornamentDivider()}

  ${
    intro
      ? `<section id="manifesto" class="manifesto">
    <div class="manifesto-copy reveal">
      <p class="section-label">${esc(l.manifesto)}</p>
      <p class="dropcap">${esc(intro)}</p>
    </div>
    <aside class="marginalia reveal" style="--d:1">
      <span class="folio">II</span>
      <p>${esc(t(locale, 'Cada proyecto empieza con una conversación larga y un boceto a lápiz.', 'Every project starts with a long conversation and a pencil sketch.'))}</p>
      <span class="marginalia-rule"></span>
      <p class="marginalia-small">${esc(brand)} — MMXXVI</p>
    </aside>
  </section>`
      : ''
  }

  ${
    sections.length
      ? `<section id="works" class="works">
    <header class="works-head reveal">
      <div>
        <p class="section-label">${esc(l.works)}</p>
        <h2>${esc(t(locale, 'Tres estudios recientes.', 'Three recent studies.'))}</h2>
      </div>
      <span class="works-count">${String(sections.length).padStart(2, '0')} ${esc(l.selectedWorks)}</span>
    </header>
    <div class="works-grid">
      ${cards}
    </div>
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
    <p class="section-label">${esc(l.contact)}</p>
    <h2>${esc(t(locale, 'El siguiente capítulo es tuyo.', 'The next chapter is yours.'))}</h2>
    <p>${esc(t(locale, 'Un proyecto, una exposición, un libro. Escribinos y lo pensamos juntos.', 'A project, an exhibition, a book. Write to us and we will think it through together.'))}</p>
    <a class="button button-gold" href="${safeHref(cta.href)}">${esc(cta.label)} ${arrowSvg(16)}</a>
  </section>
</main>

<footer class="site-foot">
  <div class="foot-brand"><span class="mark">✦</span>${esc(brand)}</div>
  <div class="foot-meta">${esc(brief.footer || t(locale, 'Buenos Aires · Desde MMXXVI', 'Buenos Aires · Since MMXXVI'))}</div>
  <div class="foot-meta">© ${year} — ${esc(l.madeWith)}</div>
</footer>`;

  const css = `:root{
  --bg:${preset.palette.bg};--surface:${preset.palette.surface};--ink:${preset.palette.ink};
  --muted:${preset.palette.muted};--gold:${preset.palette.accent};--oxblood:${preset.palette.accent2};
  --sage:${preset.palette.accent3};--deep:${preset.palette.deep};
  --hair:rgba(43,33,24,.32);--ease:cubic-bezier(.22,.61,.36,1);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:'Crimson Text',Georgia,'Times New Roman',serif;font-size:19px;line-height:1.6;-webkit-font-smoothing:antialiased}
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;opacity:.05;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E")}
body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(120% 70% at 50% 0%,rgba(255,255,255,.35),transparent 62%),radial-gradient(90% 60% at 10% 100%,rgba(184,137,47,.10),transparent 60%)}
.page-frame{position:fixed;inset:18px;border:1px solid var(--hair);z-index:60;pointer-events:none}
.page-frame::after{content:"";position:absolute;inset:6px;border:1px solid var(--hair);opacity:.6}
a{color:inherit;text-decoration:none}
img,svg{display:block;max-width:100%}
main,header.site-head,footer.site-foot{position:relative;z-index:2}
.site-head{max-width:1240px;margin:0 auto;padding:34px 10px 22px;display:flex;align-items:center;justify-content:space-between;gap:24px}
.wordmark{display:inline-flex;align-items:center;gap:12px;font-size:13px;letter-spacing:.26em;text-transform:uppercase;font-weight:600}
.wordmark .mark{color:var(--gold);font-size:16px}
.site-head nav{display:flex;gap:30px;font-size:11px;letter-spacing:.22em;text-transform:uppercase}
.site-head nav a{position:relative;padding-bottom:4px}
.site-head nav a::after{content:"";position:absolute;left:0;bottom:0;width:0;height:1px;background:var(--gold);transition:width .5s var(--ease)}
.site-head nav a:hover::after{width:100%}
.hero{max-width:1100px;margin:0 auto;padding:48px 28px 16px;text-align:center}
.eyebrow{display:flex;align-items:center;justify-content:center;gap:16px;margin:0;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--muted);font-weight:600}
.eyebrow .rule{display:block;width:46px;height:1px;background:var(--gold)}
h1{font-weight:400;font-size:clamp(54px,9.4vw,128px);line-height:.92;letter-spacing:-.018em;margin:22px auto 0;max-width:1020px}
h1 em{font-style:italic;color:var(--oxblood)}
.tagline{max-width:620px;margin:22px auto 0;font-size:21px;line-height:1.55;color:var(--muted)}
.hero-actions{display:flex;align-items:center;justify-content:center;gap:28px;margin-top:28px;flex-wrap:wrap}
.button{display:inline-flex;align-items:center;gap:12px;padding:15px 26px;background:var(--ink);color:var(--bg);border:1px solid var(--ink);font-size:11px;letter-spacing:.22em;text-transform:uppercase;font-weight:600;transition:background .4s var(--ease),color .4s var(--ease)}
.button svg{transition:transform .4s var(--ease)}
.button:hover{background:var(--gold);border-color:var(--gold);color:var(--ink)}
.button:hover svg{transform:translateX(4px)}
.quiet-link{font-size:11px;letter-spacing:.22em;text-transform:uppercase;border-bottom:1px solid var(--hair);padding-bottom:5px;transition:border-color .4s var(--ease),color .4s var(--ease)}
.quiet-link:hover{color:var(--oxblood);border-color:var(--oxblood)}
.plate{margin:32px auto 0;width:min(460px,78vw)}
.plate-svg{width:100%;height:auto;color:var(--gold)}
.plate-svg .ink-lines{color:var(--ink);opacity:.72}
.plate-svg .arch-fill{fill:var(--surface);opacity:.55}
.plate-svg .sun{color:var(--gold)}
.plate-svg .laurel{opacity:.85}
.plate figcaption{margin-top:16px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-style:italic}
.scroll-cue{display:inline-flex;align-items:center;gap:12px;margin-top:32px;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--muted)}
.scroll-cue span:first-child{display:block;width:1px;height:34px;background:var(--gold);animation:cue 2.4s var(--ease) infinite}
@keyframes cue{0%,100%{transform:scaleY(.55);transform-origin:top;opacity:.5}50%{transform:scaleY(1);opacity:1}}
.ornament{max-width:420px;margin:36px auto 0;color:var(--gold);padding:0 24px}
.ornament svg{width:100%;height:auto}
.manifesto{max-width:1100px;margin:0 auto;padding:72px 28px;display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:72px;border-top:1px solid var(--hair)}
.section-label{margin:0 0 22px;font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--oxblood);font-weight:600}
.dropcap{margin:0;font-size:21px;line-height:1.7}
.dropcap::first-letter{float:left;font-size:94px;line-height:.76;padding:10px 14px 0 0;color:var(--oxblood);font-style:italic}
.marginalia{border-left:1px solid var(--gold);padding-left:26px;align-self:start}
.marginalia p{margin:16px 0 0;font-size:15px;line-height:1.55;color:var(--muted);font-style:italic}
.marginalia .folio{font-size:12px;letter-spacing:.2em;color:var(--oxblood)}
.marginalia-rule{display:block;width:36px;height:1px;background:var(--gold);margin:22px 0}
.marginalia-small{font-style:normal;font-size:10px;letter-spacing:.2em;text-transform:uppercase}
.works{max-width:1240px;margin:0 auto;padding:72px 28px;border-top:1px solid var(--hair)}
.works-head{display:flex;align-items:flex-end;justify-content:space-between;gap:32px;margin-bottom:54px}
.works-head h2{font-weight:400;font-size:clamp(34px,4vw,52px);line-height:1;margin:0;letter-spacing:-.01em}
.works-count{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);text-align:right;line-height:1.7}
.works-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}
.work{padding:0 30px;border-left:1px solid var(--hair)}
.work:first-child{padding-left:0;border-left:none}
.work:last-child{padding-right:0}
.work-top{display:flex;align-items:center;gap:14px;margin-bottom:24px}
.work .folio{font-size:11px;letter-spacing:.2em;color:var(--oxblood)}
.work-rule{flex:1;height:1px;background:var(--hair)}
.work h3{font-weight:400;font-size:29px;line-height:1.12;margin:0 0 12px;letter-spacing:-.01em}
.work p{margin:0 0 20px;font-size:16px;line-height:1.6;color:var(--muted)}
.text-link{display:inline-flex;align-items:center;gap:8px;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--oxblood);border-bottom:1px solid transparent;padding-bottom:3px;transition:border-color .4s var(--ease)}
.text-link:hover{border-color:var(--oxblood)}
.text-link svg{transition:transform .4s var(--ease)}
.text-link:hover svg{transform:translateX(3px)}
.quote{max-width:920px;margin:0 auto;padding:74px 28px;text-align:center;border-top:1px solid var(--hair)}
.quote-mark{display:block;color:var(--gold);font-size:86px;line-height:.6;font-style:italic}
.quote blockquote{margin:0;font-size:clamp(28px,3.4vw,44px);line-height:1.22;font-style:italic;letter-spacing:-.01em}
.quote-author{margin:24px 0 0;font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--muted)}
.cta{position:relative;max-width:1180px;margin:30px auto 80px;background:var(--deep);color:var(--bg);padding:78px 40px;text-align:center;outline:1px solid var(--gold);outline-offset:-14px}
.cta .section-label{color:var(--gold)}
.cta h2{font-weight:400;font-size:clamp(38px,5vw,62px);line-height:.98;margin:0 auto 18px;max-width:760px;letter-spacing:-.015em}
.cta p{max-width:600px;margin:0 auto 30px;color:rgba(243,234,215,.78);font-size:18px}
.button-gold{background:var(--gold);color:var(--deep);border-color:var(--gold)}
.button-gold:hover{background:var(--bg);border-color:var(--bg);color:var(--deep)}
.site-foot{max-width:1240px;margin:0 auto;padding:30px 10px 40px;display:flex;align-items:center;justify-content:space-between;gap:20px;border-top:1px solid var(--hair);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.foot-brand{display:flex;align-items:center;gap:10px;color:var(--ink)}
.foot-brand .mark{color:var(--gold)}
.foot-meta{text-align:right;line-height:1.7}
.js .reveal{opacity:0;transform:translateY(16px);transition:opacity 1s var(--ease),transform 1s var(--ease);transition-delay:calc(var(--d,0) * 110ms)}
.js .reveal.is-in{opacity:1;transform:none}
@media (max-width:900px){
  .manifesto{grid-template-columns:1fr;gap:44px}
  .works-grid{grid-template-columns:1fr;gap:0}
  .work{padding:28px 0;border-left:none;border-top:1px solid var(--hair)}
  .work:first-child{border-top:none;padding-top:0}
  .works-head{flex-direction:column;align-items:flex-start;gap:14px}
  .works-count{text-align:left}
}
@media (max-width:620px){
  body{font-size:18px}
  .page-frame{inset:10px}
  .site-head{padding-top:26px;flex-direction:column;gap:16px}
  .site-head nav{gap:18px}
  .hero{padding-top:52px}
  .cta{margin-left:16px;margin-right:16px;padding:58px 24px}
  .site-foot{flex-direction:column;align-items:flex-start}
  .foot-meta{text-align:left}
}
@media (prefers-reduced-motion:reduce){
  .js .reveal{opacity:1;transform:none;transition:none}
  .scroll-cue span:first-child{animation:none}
  .button,.button svg,.text-link svg{transition:none}
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
