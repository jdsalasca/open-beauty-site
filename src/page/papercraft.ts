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

function flowerMark(size = 20): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6">
  <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/>
  <path d="M12 3.5c2.2 0 3.4 1.7 3.4 3.6 0 1.4-.8 2.5-2 3.1M20.5 12c0 2.2-1.7 3.4-3.6 3.4-1.4 0-2.5-.8-3.1-2M12 20.5c-2.2 0-3.4-1.7-3.4-3.6 0-1.4.8-2.5 2-3.1M3.5 12c0-2.2 1.7-3.4 3.6-3.4 1.4 0 2.5.8 3.1 2"/>
</svg>`;
}

function heroArt(): string {
  return `<div class="hero-art reveal" style="--d:3" aria-hidden="true">
  <svg viewBox="0 0 560 560" class="collage">
    <defs>
      <filter id="paperShadow" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0" dy="12" stdDeviation="9" flood-color="#3A2E28" flood-opacity=".20"/>
      </filter>
      <filter id="softShadow" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#3A2E28" flood-opacity=".14"/>
      </filter>
    </defs>

    <path d="M96 306C66 190 152 82 282 78C420 74 512 168 496 300C480 434 386 502 272 496C150 490 118 418 96 306Z" fill="var(--sage)" opacity=".55"/>

    <g transform="rotate(-5 236 292)">
      <g class="float-a" filter="url(#paperShadow)">
        <rect x="76" y="116" width="320" height="360" rx="24" fill="var(--cream)"/>
        <rect x="94" y="134" width="284" height="324" rx="16" fill="none" stroke="var(--ink)" stroke-opacity=".28" stroke-dasharray="7 8"/>
        <rect x="166" y="98" width="140" height="30" rx="4" fill="var(--tape)" transform="rotate(-3 236 113)"/>
        <circle cx="236" cy="248" r="62" fill="var(--terracotta)"/>
        <g stroke="var(--cream)" stroke-width="7" stroke-linecap="round">
          <line x1="236" y1="156" x2="236" y2="174"/>
          <line x1="236" y1="322" x2="236" y2="340"/>
          <line x1="144" y1="248" x2="162" y2="248"/>
          <line x1="310" y1="248" x2="328" y2="248"/>
          <line x1="171" y1="183" x2="184" y2="196"/>
          <line x1="288" y1="300" x2="301" y2="313"/>
          <line x1="301" y1="183" x2="288" y2="196"/>
          <line x1="184" y1="300" x2="171" y2="313"/>
        </g>
        <path d="M104 394C158 356 204 378 244 400C288 424 330 384 374 402V432C330 414 288 452 244 430C204 410 158 386 104 424Z" fill="var(--sky)" opacity=".9"/>
        <path d="M104 420C162 392 206 414 244 432C292 454 334 420 374 434V448H104Z" fill="var(--sage)"/>
      </g>
    </g>

    <g transform="rotate(5 388 336)">
      <g class="float-b" filter="url(#paperShadow)">
        <rect x="300" y="222" width="188" height="230" rx="22" fill="var(--terracotta)"/>
        <rect x="316" y="238" width="156" height="198" rx="14" fill="none" stroke="var(--cream)" stroke-opacity=".55" stroke-dasharray="6 7"/>
        <rect x="348" y="208" width="96" height="24" rx="4" fill="var(--tape)" transform="rotate(3 396 220)"/>
        <g transform="translate(394 340)" fill="var(--cream)">
          <ellipse cx="0" cy="-34" rx="17" ry="34"/>
          <ellipse cx="0" cy="-34" rx="17" ry="34" transform="rotate(72)"/>
          <ellipse cx="0" cy="-34" rx="17" ry="34" transform="rotate(144)"/>
          <ellipse cx="0" cy="-34" rx="17" ry="34" transform="rotate(216)"/>
          <ellipse cx="0" cy="-34" rx="17" ry="34" transform="rotate(288)"/>
          <circle cx="0" cy="0" r="16" fill="var(--plum)"/>
        </g>
      </g>
    </g>

    <g transform="rotate(-3 300 472)">
      <g class="float-c" filter="url(#softShadow)">
        <rect x="170" y="426" width="260" height="106" rx="18" fill="var(--sky)"/>
        <rect x="188" y="444" width="224" height="70" rx="10" fill="none" stroke="var(--ink)" stroke-opacity=".30" stroke-dasharray="6 7"/>
        <path d="M204 486h120M204 500h84" stroke="var(--ink)" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>
        <rect x="352" y="414" width="80" height="20" rx="3" fill="var(--tape)" transform="rotate(4 392 424)"/>
      </g>
    </g>

    <g class="confetti" fill="var(--ink)" opacity=".5">
      <circle cx="88" cy="150" r="5"/>
      <circle cx="500" cy="168" r="4"/>
      <rect x="470" y="94" width="12" height="12" rx="2" transform="rotate(18 476 100)"/>
      <path d="M62 372c10-12 20-12 30 0" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
      <circle cx="516" cy="420" r="3.5"/>
    </g>
  </svg>
</div>`;
}

function scallop(color: string, flip = false): string {
  const bumps = Array.from({ length: 24 }, (_, index) => {
    const x = index * 50;
    return `M${x} 40V22Q${x + 25} 0 ${x + 50} 22V40Z`;
  }).join('');
  return `<svg class="scallop${flip ? ' scallop-flip' : ''}" viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true"><path d="${bumps}" fill="${color}"/></svg>`;
}

export function renderPapercraft(input: Partial<Brief>, preset: StylePreset): string {
  const brief = normalizeBrief(input);
  const locale = brief.locale ?? 'es';
  const l = labels(locale);
  const { main, accent } = splitAccent(brief.title);
  const brand = brief.brand || brief.title;
  const eyebrow = brief.eyebrow || t(locale, 'Hecho a mano, todos los días', 'Handmade, every day');
  const tagline =
    brief.tagline ||
    t(locale, 'Papel, tijera y una idea. Cosas lindas que se pueden tocar con los ojos.', 'Paper, scissors and an idea. Pretty things you can touch with your eyes.');
  const intro = brief.intro;
  const sections = brief.sections ?? [];
  const quote = brief.quote;
  const cta = brief.cta ?? { label: t(locale, 'Escribinos', 'Write to us'), href: '#contact' };
  const year = new Date().getFullYear();
  const worksHref = sections.length ? '#works' : '#contact';

  const cards = sections
    .map(
      (section, index) => `<article class="work-card reveal" style="--d:${index}">
  <span class="tape" aria-hidden="true"></span>
  <span class="tag">${esc(section.kicker || `${t(locale, 'Hoja', 'Sheet')} ${String(index + 1).padStart(2, '0')}`)}</span>
  <h3>${esc(section.title)}</h3>
  <p>${esc(section.body)}</p>
  <a class="more" href="${safeHref(worksHref)}">${esc(l.readMore)} ${arrowSvg(15)}</a>
</article>`,
    )
    .join('\n');

  const body = `<div class="grain" aria-hidden="true"></div>
<header class="nav">
  <a class="logo" href="#top"><span class="mark">${flowerMark(20)}</span>${esc(brand)}</a>
  <nav aria-label="${esc(t(locale, 'Navegación principal', 'Main navigation'))}">
    ${intro ? `<a href="#about">${esc(l.manifesto)}</a>` : ''}
    ${sections.length ? `<a href="#works">${esc(l.works)}</a>` : ''}
    <a href="#contact">${esc(l.contact)}</a>
  </nav>
  <a class="nav-cta" href="${safeHref(cta.href)}">${esc(cta.label)} ${arrowSvg(14)}</a>
</header>

<main id="top">
  <section class="hero">
    <div class="hero-copy">
      <p class="kicker reveal" style="--d:0"><span class="dot"></span>${esc(eyebrow)}</p>
      <h1 class="reveal" style="--d:1">${esc(main)}${accent ? ` <em>${esc(accent)}</em>` : ''}</h1>
      <p class="tagline reveal" style="--d:2">${esc(tagline)}</p>
      <div class="actions reveal" style="--d:3">
        <a class="button" href="${safeHref(worksHref)}">${esc(l.viewWorks)} ${arrowSvg(17)}</a>
        <a class="text-link" href="${intro ? '#about' : '#contact'}">${esc(t(locale, 'Conocer el taller', 'Visit the studio'))}</a>
      </div>
      <p class="hand-note reveal" style="--d:4">${esc(t(locale, 'Cortado, pegado y pensado en Buenos Aires.', 'Cut, glued and thought in Buenos Aires.'))}</p>
    </div>
    ${heroArt()}
  </section>

  ${scallop(preset.palette.surface)}

  ${
    intro
      ? `<section id="about" class="about">
    <div class="about-card reveal">
      <span class="tape tape-left" aria-hidden="true"></span>
      <p class="section-label">${esc(l.manifesto)}</p>
      <p class="statement">${esc(intro)}</p>
      <span class="signature">— ${esc(brand)}</span>
    </div>
    <aside class="about-note reveal" style="--d:1">
      <span class="tape tape-sage" aria-hidden="true"></span>
      <p class="note-title">${esc(t(locale, 'Lo que hacemos', 'What we make'))}</p>
      <ul>
        <li>${esc(t(locale, 'Identidades con textura', 'Identities with texture'))}</li>
        <li>${esc(t(locale, 'Sitios que se sienten impresos', 'Sites that feel printed'))}</li>
        <li>${esc(t(locale, 'Animaciones cuadro a cuadro', 'Frame-by-frame animation'))}</li>
      </ul>
    </aside>
  </section>`
      : ''
  }

  ${
    sections.length
      ? `<section id="works" class="works">
    <div class="works-head reveal">
      <p class="section-label">${esc(l.works)}</p>
      <h2>${esc(t(locale, 'Recortes de nuestro cuaderno.', 'Cuttings from our notebook.'))}</h2>
    </div>
    <div class="scrap-grid">${cards}</div>
  </section>
  ${scallop(preset.palette.bg, true)}`
      : ''
  }

  ${
    quote
      ? `<section class="quote-band">
    <div class="quote reveal">
      <span class="quote-mark" aria-hidden="true">“</span>
      <blockquote>${esc(quote.text)}</blockquote>
      ${quote.author ? `<p class="quote-author">— ${esc(quote.author)}</p>` : ''}
    </div>
  </section>`
      : ''
  }

  <section id="contact" class="cta">
    <div class="cta-card reveal">
      <span class="tape" aria-hidden="true"></span>
      <p class="section-label">${esc(l.contact)}</p>
      <h2>${esc(t(locale, '¿Hacemos algo lindo juntos?', 'Shall we make something lovely?'))}</h2>
      <p>${esc(t(locale, 'Contanos qué tenés en mente. Nosotros ponemos el papel, la tijera y el café.', 'Tell us what you have in mind. We bring the paper, the scissors and the coffee.'))}</p>
      <a class="button" href="${safeHref(cta.href)}">${esc(cta.label)} ${arrowSvg(17)}</a>
    </div>
  </section>
</main>

<footer class="site-foot">
  <span class="foot-logo">${flowerMark(16)} ${esc(brand)}</span>
  <span>${esc(brief.footer || t(locale, 'Taller de papel y pantalla · MMXXVI', 'Paper and screen studio · MMXXVI'))}</span>
  <span>© ${year} — ${esc(l.madeWith)}</span>
</footer>`;

  const css = `:root{
  --cream:${preset.palette.bg};--paper:${preset.palette.surface};--ink:${preset.palette.ink};
  --muted:${preset.palette.muted};--terracotta:${preset.palette.accent};--sage:${preset.palette.accent2};
  --sky:${preset.palette.accent3};--plum:${preset.palette.deep};--tape:rgba(217,185,140,.72);
  --shadow:0 18px 30px rgba(58,46,40,.18);
  --ease:cubic-bezier(.34,1.56,.64,1);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--cream);color:var(--ink);font-family:'Lato','Segoe UI',sans-serif;font-size:18px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
body::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(60% 40% at 12% 0%,var(--cream) 0%,transparent 60%),radial-gradient(50% 35% at 92% 8%,rgba(201,111,74,.10),transparent 62%)}
.grain{position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.045;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")}
a{color:inherit;text-decoration:none}
svg{display:block;max-width:100%}
header,main,footer{position:relative;z-index:2}
.nav{max-width:1200px;margin:0 auto;padding:26px 28px;display:flex;align-items:center;justify-content:space-between;gap:22px}
.logo{display:inline-flex;align-items:center;gap:10px;font-family:'DM Serif Display',Georgia,serif;font-size:23px;letter-spacing:-.01em}
.logo .mark{color:var(--terracotta)}
.nav nav{display:flex;gap:26px;font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
.nav nav a{position:relative;padding-bottom:4px}
.nav nav a::after{content:"";position:absolute;left:0;bottom:0;height:2px;width:0;background:var(--terracotta);transition:width .4s var(--ease)}
.nav nav a:hover::after{width:100%}
.nav-cta{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;background:var(--paper);padding:10px 16px;border-radius:14px 18px 15px 19px;box-shadow:0 6px 12px rgba(58,46,40,.14);transition:transform .3s var(--ease),box-shadow .3s var(--ease)}
.nav-cta:hover{transform:translateY(-3px) rotate(-1deg);box-shadow:0 12px 20px rgba(58,46,40,.20)}
.hero{max-width:1200px;margin:0 auto;padding:64px 28px 76px;display:grid;grid-template-columns:1.02fr .98fr;gap:48px;align-items:center}
.kicker{display:inline-flex;align-items:center;gap:10px;margin:0;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:var(--plum);background:rgba(255,255,255,.4);padding:7px 12px;border-radius:14px 16px 15px 17px}
.kicker .dot{width:8px;height:8px;border-radius:50%;background:var(--terracotta)}
h1{font-family:'DM Serif Display',Georgia,serif;font-weight:400;font-size:clamp(56px,8.6vw,118px);line-height:.9;letter-spacing:-.025em;margin:22px 0 0;max-width:12ch}
h1 em{font-style:italic;color:var(--terracotta)}
.tagline{max-width:480px;margin:24px 0 0;font-size:18px;line-height:1.6;color:var(--muted)}
.actions{display:flex;align-items:center;gap:24px;flex-wrap:wrap;margin-top:30px}
.button{display:inline-flex;align-items:center;gap:10px;background:var(--plum);color:var(--cream);padding:15px 24px;border-radius:16px 20px 17px 21px;font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;box-shadow:0 12px 20px rgba(110,75,99,.28);transition:transform .35s var(--ease),box-shadow .35s var(--ease)}
.button:hover{transform:translateY(-4px) rotate(-1.5deg);box-shadow:0 18px 28px rgba(110,75,99,.34)}
.button svg{transition:transform .3s var(--ease)}
.button:hover svg{transform:translateX(3px)}
.text-link{font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;border-bottom:2px dashed rgba(58,46,40,.35);padding-bottom:3px}
.text-link:hover{border-color:var(--terracotta);color:var(--terracotta)}
.hand-note{margin:34px 0 0;font-family:'DM Serif Display',serif;font-style:italic;font-size:16px;color:var(--muted)}
.hero-art{position:relative}
.collage{width:100%;height:auto;overflow:visible}
.float-a{animation:float 7s ease-in-out infinite}
.float-b{animation:float 8.5s ease-in-out infinite reverse}
.float-c{animation:float 6s ease-in-out infinite .6s}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-11px)}}
.confetti{animation:twinkle 5s ease-in-out infinite}
@keyframes twinkle{0%,100%{opacity:.38}50%{opacity:.7}}
.scallop{width:100%;height:40px;display:block;margin-bottom:-1px}
.scallop-flip{transform:rotate(180deg);margin-top:-1px;margin-bottom:0}
.about{max-width:1120px;margin:0 auto;padding:78px 28px 86px;display:grid;grid-template-columns:1.2fr .8fr;gap:40px;align-items:start}
.about-card{position:relative;background:var(--cream);border-radius:24px 20px 26px 18px;box-shadow:var(--shadow);padding:52px 48px 40px;transform:rotate(-1.2deg)}
.about-card .section-label{margin-bottom:18px}
.section-label{margin:0;font-size:11px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:var(--plum)}
.statement{margin:0;font-family:'DM Serif Display',serif;font-size:clamp(26px,3.2vw,40px);line-height:1.18;letter-spacing:-.01em}
.signature{display:block;margin-top:22px;font-family:'DM Serif Display',serif;font-style:italic;font-size:16px;color:var(--muted)}
.about-note{position:relative;background:var(--sage);border-radius:22px 18px 24px 20px;box-shadow:var(--shadow);padding:40px 32px 30px;transform:rotate(2deg);margin-top:26px}
.note-title{margin:0 0 12px;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
.about-note ul{list-style:none;margin:0;padding:0}
.about-note li{font-size:16px;line-height:1.5;padding:9px 0;border-bottom:1px dashed rgba(58,46,40,.28)}
.about-note li:last-child{border-bottom:none}
.tape{position:absolute;top:-13px;left:50%;width:104px;height:27px;background:var(--tape);transform:translateX(-50%) rotate(-4deg);clip-path:polygon(2% 0,100% 0,98% 100%,0 100%);box-shadow:0 2px 4px rgba(58,46,40,.10)}
.tape-left{left:32%;transform:translateX(-50%) rotate(3deg)}
.tape-sage{background:rgba(143,169,138,.65);left:60%;transform:translateX(-50%) rotate(-3deg)}
.works{background:var(--paper);padding:64px 28px 78px;margin-top:26px}
.works-head{max-width:1120px;margin:0 auto 42px}
.works-head h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:clamp(36px,5vw,62px);line-height:.95;letter-spacing:-.02em;margin:12px 0 0;max-width:16ch}
.scrap-grid{max-width:1120px;margin:0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:30px}
.work-card{position:relative;background:var(--cream);border-radius:22px 18px 24px 17px;box-shadow:var(--shadow);padding:34px 28px 26px;display:flex;flex-direction:column;transition:transform .4s var(--ease),box-shadow .4s var(--ease)}
.work-card:nth-child(1){transform:rotate(-2deg)}
.work-card:nth-child(2){transform:rotate(1.4deg) translateY(10px)}
.work-card:nth-child(3){transform:rotate(-1deg)}
.work-card:hover{transform:translateY(-6px) rotate(0deg);box-shadow:0 26px 40px rgba(58,46,40,.22)}
.work-card .tag{align-self:flex-start;background:var(--sky);padding:5px 10px;border-radius:14px 16px 15px 17px;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
.work-card h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:27px;line-height:1.08;margin:16px 0 8px;letter-spacing:-.01em}
.work-card p{margin:0 0 22px;font-size:15px;line-height:1.55;color:var(--muted)}
.more{display:inline-flex;align-items:center;gap:8px;margin-top:auto;font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:var(--plum);border-top:2px dashed rgba(201,111,74,.35);padding-top:12px}
.more svg{transition:transform .3s var(--ease)}
.work-card:hover .more svg{transform:translateX(4px)}
.quote-band{background:var(--sage);padding:72px 28px;margin-top:0}
.quote{max-width:900px;margin:0 auto;text-align:center}
.quote-mark{display:block;font-family:'DM Serif Display',serif;font-size:92px;line-height:.5;color:var(--terracotta)}
.quote blockquote{margin:0;font-family:'DM Serif Display',serif;font-size:clamp(28px,4vw,50px);line-height:1.12;letter-spacing:-.015em}
.quote-author{margin:22px 0 0;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:var(--plum)}
.cta{padding:84px 28px 96px;display:flex;justify-content:center}
.cta-card{position:relative;background:var(--cream);border-radius:26px 20px 28px 22px;box-shadow:var(--shadow);padding:56px 54px 48px;max-width:760px;width:100%;text-align:center;transform:rotate(.8deg)}
.cta-card h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:clamp(36px,5vw,58px);line-height:.98;letter-spacing:-.02em;margin:12px 0 14px}
.cta-card p{max-width:520px;margin:0 auto 28px;font-size:17px;color:var(--muted)}
.site-foot{max-width:1200px;margin:0 auto;padding:28px 28px 40px;display:flex;align-items:center;justify-content:space-between;gap:16px;border-top:2px dashed rgba(58,46,40,.25);font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.foot-logo{display:inline-flex;align-items:center;gap:8px;color:var(--ink);font-family:'DM Serif Display',serif;font-size:15px;text-transform:none;letter-spacing:0}
.js .reveal{opacity:0;transform:translateY(18px) scale(.985);transition:opacity .7s var(--ease),transform .7s var(--ease);transition-delay:calc(var(--d,0) * 90ms)}
.js .reveal.is-in{opacity:1;transform:none}
@media (max-width:980px){
  .hero{grid-template-columns:1fr;gap:20px;padding-top:44px}
  .hero-art{max-width:560px;margin:0 auto}
  .about{grid-template-columns:1fr}
  .about-note{margin-top:10px;max-width:420px}
  .scrap-grid{grid-template-columns:1fr;max-width:520px}
  .work-card:nth-child(n){transform:none}
  .nav nav{display:none}
}
@media (max-width:620px){
  body{font-size:17px}
  .nav{padding:18px 18px}
  .hero{padding:34px 18px 54px}
  h1{font-size:clamp(52px,14vw,84px)}
  .about,.works,.cta{padding-left:18px;padding-right:18px}
  .about-card{padding:42px 26px 32px}
  .cta-card{padding:44px 24px 36px}
  .site-foot{flex-direction:column;align-items:flex-start;padding-left:18px;padding-right:18px}
}
@media (prefers-reduced-motion:reduce){
  .js .reveal{opacity:1;transform:none;transition:none}
  .float-a,.float-b,.float-c,.confetti{animation:none}
  .work-card,.button,.nav-cta{transition:none}
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
