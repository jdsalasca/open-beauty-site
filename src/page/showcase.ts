import type { PageBrief, StylePreset } from '../types.js';
import { arrowSvg, esc, labels, normalizeBrief, resolveClosing, safeHref, shell, splitAccent, t, REVEAL_SCRIPT } from './common.js';
import { heroArtForScene } from './composition.js';

export interface ShowcaseConfig {
  art: string;
  css: string;
  script?: string;
  eyebrow?: string;
  heroNote?: string;
  ctaHeading?: { es: string; en: string };
  sectionTitle?: { es: string; en: string };
  music?: ShowcaseMusic;
}

export interface ShowcaseMusic {
  src: string;
  title: string;
  subtitle?: string;
  note?: string;
}

const BASE_CSS = `:root{
  --bg:${'{bg}'};--surface:${'{surface}'};--ink:${'{ink}'};--muted:${'{muted}'};
  --accent:${'{accent}'};--accent2:${'{accent2}'};--accent3:${'{accent3}'};--accent4:${'{accent4}'};
  --deep:${'{deep}'};--display:'${'{display}'}',serif;--body:'${'{body}'}',sans-serif;
  --mono:'${'{mono}'}',monospace;--ease:cubic-bezier(.22,.9,.24,1);
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--body);font-size:17px;line-height:1.65;-webkit-font-smoothing:antialiased;overflow-x:hidden}
body::before{content:"";position:fixed;inset:0;z-index:70;pointer-events:none;opacity:.035;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")}
a{color:inherit;text-decoration:none}
img,svg{display:block;max-width:100%}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
.top{position:relative;z-index:20;display:flex;align-items:center;justify-content:space-between;gap:24px;max-width:1360px;margin:0 auto;padding:22px 34px}
.brand{display:inline-flex;align-items:center;gap:11px;font-family:var(--display);font-size:21px;letter-spacing:.04em;text-transform:uppercase}
.brand .mark{display:inline-grid;place-items:center;width:22px;height:22px;color:var(--accent);font-family:var(--body);font-size:14px}
.top nav{display:flex;align-items:center;gap:24px;font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase}
.top nav a{opacity:.78;transition:opacity .3s var(--ease)}
.top nav a:hover{opacity:1;color:var(--accent)}
.nav-cta{display:inline-flex;align-items:center;gap:8px;border:1px solid currentColor;padding:10px 15px;font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;transition:background .3s var(--ease),color .3s var(--ease)}
.nav-cta:hover{background:var(--accent);color:var(--bg);border-color:var(--accent)}
.hero{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);align-items:center;gap:44px;max-width:1280px;margin:0 auto;padding:54px 34px 84px}
.eyebrow{display:flex;align-items:center;gap:11px;margin:0;font-family:var(--mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.eyebrow::before{content:"";width:28px;height:1px;background:var(--accent)}
h1{font-family:var(--display);font-weight:400;font-size:clamp(62px,8.6vw,126px);line-height:.9;letter-spacing:-.02em;margin:18px 0 0;max-width:12ch}
h1 em{font-style:normal;color:var(--accent)}
.tagline{max-width:480px;margin:22px 0 0;font-size:18px;line-height:1.6;color:var(--muted)}
.hero-actions{display:flex;align-items:center;gap:22px;flex-wrap:wrap;margin-top:28px}
.btn{display:inline-flex;align-items:center;gap:10px;background:var(--accent);color:var(--bg);padding:14px 22px;font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;transition:transform .3s var(--ease),background .3s var(--ease)}
.btn:hover{transform:translateY(-2px);background:var(--ink);color:var(--bg)}
.btn svg{transition:transform .3s var(--ease)}
.btn:hover svg{transform:translateX(4px)}
.link{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;border-bottom:1px solid var(--muted);padding-bottom:4px}
.link:hover{color:var(--accent);border-color:var(--accent)}
.hero-note{margin:28px 0 0;font-family:var(--mono);font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.hero-art{position:relative;min-width:0;width:100%}
.manifesto{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:60px;max-width:1180px;margin:0 auto;padding:70px 34px}
.kicker{margin:0 0 14px;font-family:var(--mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)}
.statement{font-family:var(--display);font-size:clamp(30px,3.4vw,46px);line-height:1.12;letter-spacing:-.015em;margin:0}
.aside{border-left:1px solid var(--accent);padding-left:22px;align-self:start}
.aside span{font-family:var(--mono);font-size:9px;letter-spacing:.18em;color:var(--accent)}
.aside p{margin:12px 0 0;font-size:14px;line-height:1.55;color:var(--muted)}
.works{position:relative;z-index:2;max-width:1280px;margin:0 auto;padding:30px 34px 84px}
.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:32px;border-top:1px solid var(--muted);padding-top:18px}
.section-head h2{font-family:var(--display);font-weight:400;font-size:clamp(34px,4vw,54px);line-height:1;letter-spacing:-.02em;margin:0}
.section-head>span{font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:18px}
@media (min-width:981px){
  .cards[data-count="1"]{grid-template-columns:minmax(0,1fr)}
  .cards[data-count="2"]{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cards[data-count="3"]{grid-template-columns:repeat(3,minmax(0,1fr))}
  .cards[data-count="4"]{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cards[data-count="5"],.cards[data-count="6"]{grid-template-columns:repeat(3,minmax(0,1fr))}
}
.card{position:relative;padding:22px 22px 20px;border:1px solid var(--muted);background:var(--surface);min-height:235px;display:flex;flex-direction:column;transition:transform .35s var(--ease),background .35s var(--ease)}
.card:hover{transform:translateY(-4px)}
.card-num{font-family:var(--mono);font-size:9px;letter-spacing:.14em;color:var(--accent)}
.card-kicker{margin:14px 0 0;font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.card h3{font-family:var(--display);font-weight:400;font-size:27px;line-height:1.06;margin:8px 0 10px;letter-spacing:-.015em}
.card p{margin:0 0 18px;font-size:14px;line-height:1.55;color:var(--muted)}
.card-link{margin-top:auto;font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
.quote{position:relative;z-index:2;max-width:1000px;margin:0 auto;padding:64px 34px;text-align:center}
.music-room{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:38px;align-items:center;max-width:1180px;margin:0 auto;padding:44px 34px;border-top:1px solid var(--muted);border-bottom:1px solid var(--muted)}
.music-room h2{font-family:var(--display);font-size:clamp(30px,4vw,52px);line-height:1;letter-spacing:-.02em;margin:8px 0 10px}
.music-room p{max-width:420px;margin:0;color:var(--muted);font-size:15px}
.player{display:grid;grid-template-columns:68px 1fr;gap:16px;align-items:center;border:1px solid var(--accent);padding:14px;background:rgba(0,0,0,.18)}
.player audio{display:none}
.play{width:56px;height:56px;border:1px solid var(--accent);display:grid;place-items:center;color:var(--accent);font-size:16px;transition:background .3s,color .3s}
.play:hover{background:var(--accent);color:var(--bg)}
.player-main{min-width:0}
.player-label{font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:0 0 3px}
.player-title{display:block;font-family:var(--body);font-size:15px;margin-bottom:8px;overflow-wrap:break-word}
.bar{height:3px;background:rgba(128,128,128,.28);position:relative;overflow:hidden}
.bar i{display:block;height:100%;width:0;background:var(--accent);transition:width .1s linear}
.player-meta{display:flex;justify-content:space-between;gap:10px;margin-top:6px;font-family:var(--mono);font-size:9px;letter-spacing:.1em;color:var(--muted)}
.player-note{grid-column:1/-1;margin:0;font-family:var(--mono);font-size:9px;letter-spacing:.08em;color:var(--muted)}
.levels{display:flex;align-items:flex-end;gap:2px;height:14px;margin-top:7px}
.levels i{display:block;width:3px;height:4px;background:var(--accent);opacity:.45}
.player.is-playing .levels i{animation:level 1.1s ease-in-out infinite alternate}
.player.is-playing .levels i:nth-child(2n){animation-delay:.18s}
.player.is-playing .levels i:nth-child(3n){animation-delay:.33s}
@keyframes level{to{height:14px;opacity:1}}
.quote blockquote{font-family:var(--display);font-size:clamp(30px,4.2vw,54px);line-height:1.1;letter-spacing:-.018em;margin:0}
.quote cite{display:block;margin-top:18px;font-family:var(--mono);font-style:normal;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.cta{position:relative;z-index:2;max-width:1180px;margin:20px auto 70px;padding:58px 34px;text-align:center;border:1px solid var(--accent)}
.cta h2{font-family:var(--display);font-size:clamp(34px,4.6vw,58px);line-height:1;letter-spacing:-.02em;margin:10px auto 22px;max-width:760px}
.foot{position:relative;z-index:2;display:flex;justify-content:space-between;gap:18px;max-width:1360px;margin:0 auto;padding:22px 34px 34px;border-top:1px solid var(--muted);font-family:var(--mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.js .reveal{opacity:0;transform:translateY(16px);transition:opacity .6s var(--ease),transform .6s var(--ease);transition-delay:calc(var(--i,0) * 70ms)}
.js .reveal.is-in{opacity:1;transform:none}
@media (max-width:980px){
  .hero{grid-template-columns:1fr;padding-top:34px}
  .hero-art{max-width:620px;margin:0 auto}
  .manifesto{grid-template-columns:1fr;gap:30px}
  .cards{grid-template-columns:1fr}
  .top nav{display:none}
}
@media (max-width:620px){
  body{font-size:16px}
  .top{padding:16px 18px}
  .hero{padding:26px 18px 56px}
  h1{font-size:clamp(52px,13vw,84px)}
  .manifesto,.works,.quote,.cta{padding-left:18px;padding-right:18px}
  .foot{flex-direction:column;padding-left:18px;padding-right:18px}
}
@media (prefers-reduced-motion:reduce){
  .js .reveal{opacity:1;transform:none;transition:none}
  *{scroll-behavior:auto}
  .player.is-playing .levels i{animation:none}
}`;

const BASE_SCRIPT = `${REVEAL_SCRIPT}
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.documentElement;
  addEventListener('pointermove', (event) => {
    root.style.setProperty('--mx', String((event.clientX / innerWidth - 0.5) * 2));
    root.style.setProperty('--my', String((event.clientY / innerHeight - 0.5) * 2));
  }, { passive: true });
  document.querySelectorAll('[data-shuffle]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-scatter]').forEach((shape) => {
        const x = (Math.random() - 0.5) * 36;
        const y = (Math.random() - 0.5) * 36;
        const r = (Math.random() - 0.5) * 18;
        shape.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + r.toFixed(1) + 'deg)';
      });
    });
  });
  document.querySelectorAll('[data-toggle]').forEach((button) => {
    button.addEventListener('click', () => document.body.classList.toggle(button.getAttribute('data-toggle') || 'is-paused'));
  });
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.parentElement;
      if (!group) return;
      group.querySelectorAll('[data-tab]').forEach((item) => item.classList.toggle('is-active', item === button));
      const view = button.getAttribute('data-tab');
      document.querySelectorAll('[data-view]').forEach((panel) => panel.classList.toggle('is-active', panel.getAttribute('data-view') === view));
    });
  });
  document.querySelectorAll('[data-count]').forEach((element) => {
    const target = Number(element.getAttribute('data-count') || 0);
    if (!Number.isFinite(target) || target === 0) return;
    const suffix = element.getAttribute('data-suffix') || '';
    let started = false;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || started) return;
      started = true;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / 900);
        element.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3)))) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: .4 });
    observer.observe(element);
  });
  const formatTime = (value) => {
    if (!Number.isFinite(value)) return '0:00';
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return minutes + ':' + String(seconds).padStart(2, '0');
  };
  document.querySelectorAll('[data-player]').forEach((player) => {
    const audio = player.querySelector('[data-audio]');
    const button = player.querySelector('[data-play]');
    const progress = player.querySelector('[data-progress]');
    const current = player.querySelector('[data-current]');
    const duration = player.querySelector('[data-duration]');
    if (!audio || !button || !progress) return;
    const setTime = () => {
      const total = audio.duration || 0;
      const now = audio.currentTime || 0;
      progress.style.width = total ? Math.min(100, (now / total) * 100) + '%' : '0%';
      if (current) current.textContent = formatTime(now);
      if (duration) duration.textContent = formatTime(total);
    };
    button.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    });
    audio.addEventListener('loadedmetadata', setTime);
    audio.addEventListener('timeupdate', setTime);
    audio.addEventListener('play', () => {
      player.classList.add('is-playing');
      button.textContent = '❚❚';
      button.setAttribute('aria-label', 'Pausar');
    });
    audio.addEventListener('pause', () => {
      player.classList.remove('is-playing');
      button.textContent = '▶';
      button.setAttribute('aria-label', 'Reproducir');
    });
    audio.addEventListener('ended', () => {
      player.classList.remove('is-playing');
      button.textContent = '▶';
      progress.style.width = '0%';
    });
    setTime();
  });
})();`;

export function renderShowcase(briefInput: Partial<PageBrief>, preset: StylePreset, config: ShowcaseConfig): string {
  const brief = normalizeBrief(briefInput);
  const locale = brief.locale ?? 'es';
  const l = labels(locale);
  const { main, accent } = splitAccent(brief.title);
  const brand = brief.brand || brief.title;
  const eyebrow = config.eyebrow || brief.eyebrow || t(locale, 'Lección visual · Edición 01', 'Visual lesson · Edition 01');
  const tagline = brief.tagline || brief.intro || brief.title;
  const intro = brief.intro || tagline;
  const sections = brief.sections ?? [];
  const cta = brief.cta ?? { label: t(locale, 'Empezar', 'Start'), href: '#top' };
  const closing = resolveClosing(brief, {
    title: t(locale, config.ctaHeading?.es ?? 'El siguiente capítulo es tuyo.', config.ctaHeading?.en ?? 'The next chapter is yours.'),
    label: cta.label,
    href: cta.href,
  });
  const sectionTitle = t(locale, config.sectionTitle?.es ?? l.selectedWorks, config.sectionTitle?.en ?? l.selectedWorks);
  const year = new Date().getFullYear();
  const subfamily = brief.subfamily ? preset.subfamilies?.find((item) => item.slug === brief.subfamily) : undefined;
  const subAccent = subfamily ? preset.palette[subfamily.accent] : undefined;
  const css = BASE_CSS
    .replaceAll('{bg}', preset.palette.bg)
    .replaceAll('{surface}', preset.palette.surface)
    .replaceAll('{ink}', preset.palette.ink)
    .replaceAll('{muted}', preset.palette.muted)
    .replaceAll('{accent}', preset.palette.accent)
    .replaceAll('{accent2}', preset.palette.accent2)
    .replaceAll('{accent3}', preset.palette.accent3)
    .replaceAll('{accent4}', preset.palette.accent4)
    .replaceAll('{deep}', preset.palette.deep)
    .replaceAll('{display}', preset.fonts.display)
    .replaceAll('{body}', preset.fonts.body)
    .replaceAll('{mono}', preset.fonts.mono);

  const cards = sections
    .map(
      (section, index) => `<article class="card reveal" style="--i:${index + 1}">
  <span class="card-num">${String(index + 1).padStart(2, '0')}</span>
  ${section.kicker ? `<p class="card-kicker">${esc(section.kicker)}</p>` : ''}
  <h3>${esc(section.title)}</h3>
  <p>${esc(section.body)}</p>
  <a class="card-link" href="#contact">${esc(l.readMore)} →</a>
</article>`,
    )
    .join('\n');

  const body = `<header class="top">
  <a class="brand" href="#top"><span class="mark">◆</span>${esc(brand)}</a>
  <nav aria-label="${esc(t(locale, 'Navegación principal', 'Main navigation'))}">
    <a href="#manifesto">${esc(l.manifesto)}</a>
    ${sections.length ? `<a href="#works">${esc(l.works)}</a>` : ''}
    <a href="#contact">${esc(l.contact)}</a>
  </nav>
  <a class="nav-cta" href="${safeHref(cta.href)}">${esc(cta.label)} ${arrowSvg(12)}</a>
</header>
<main id="top">
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow reveal">${esc(eyebrow)}</p>
      <h1 class="reveal" style="--i:1">${esc(main)}${accent ? `<br><em>${esc(accent)}</em>` : ''}</h1>
      <p class="tagline reveal" style="--i:2">${esc(tagline)}</p>
      <div class="hero-actions reveal" style="--i:3">
        <a class="btn" href="${sections.length ? '#works' : '#contact'}">${esc(l.viewWorks)} ${arrowSvg(15)}</a>
        <a class="link" href="#manifesto">${esc(l.manifesto)}</a>
      </div>
      <p class="hero-note reveal" style="--i:4">${esc(config.heroNote || '01 — 08')}</p>
    </div>
    <div class="hero-art reveal" style="--i:1">${heroArtForScene(brief, preset, () => config.art, brief.title)}</div>
  </section>
  <section id="manifesto" class="manifesto">
    <div class="reveal">
      <p class="kicker">${esc(l.manifesto)}</p>
      <p class="statement">${esc(intro)}</p>
    </div>
    <aside class="aside reveal" style="--i:1">
      <span>01 / ${String(sections.length).padStart(2, '0')}</span>
      <p>${esc(t(locale, 'Una página, una idea. El resto es ruido.', 'One page, one idea. The rest is noise.'))}</p>
    </aside>
  </section>
  ${
    sections.length
      ? `<section id="works" class="works">
    <div class="section-head reveal"><div><p class="kicker">${esc(l.works)}</p><h2>${esc(sectionTitle)}</h2></div><span>${String(sections.length).padStart(2, '0')} ${esc(t(locale, 'piezas', 'pieces'))}</span></div>
    <div class="cards" data-count="${sections.length}">${cards}</div>
  </section>`
      : ''
  }
  ${
    config.music
      ? `<section class="music-room reveal" id="music">
    <div><p class="kicker">${esc(t(locale, 'Música original de la sala', 'Original room music'))}</p><h2>${esc(config.music.title)}</h2><p>${esc(config.music.subtitle || '')}</p></div>
    <div class="player" data-player>
      <button class="play" type="button" data-play aria-label="${esc(t(locale, 'Reproducir', 'Play'))}">▶</button>
      <div class="player-main">
        <p class="player-label">${esc(t(locale, 'Pista original', 'Original track'))}</p>
        <strong class="player-title">${esc(config.music.title)}</strong>
        <div class="bar"><i data-progress></i></div>
        <div class="player-meta"><span data-current>0:00</span><span data-duration>0:00</span></div>
        <div class="levels" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      </div>
      <p class="player-note">${esc(config.music.note || '')}</p>
      <audio data-audio src="${esc(config.music.src)}" preload="metadata"></audio>
    </div>
  </section>`
      : ''
  }
  ${
    brief.quote
      ? `<section class="quote reveal"><blockquote>“${esc(brief.quote.text)}”</blockquote><cite>${esc(brief.quote.author || brand)}</cite></section>`
      : ''
  }
  <section id="contact" class="cta reveal">
    <p class="kicker">${esc(l.contact)}</p>
    <h2>${esc(closing.title)}</h2>
    <a class="btn" href="${safeHref(closing.cta.href)}">${esc(closing.cta.label)} ${arrowSvg(15)}</a>
  </section>
</main>
<footer class="foot">
  <span>${esc(brief.footer || brand)}</span>
  <span>${esc(t(locale, 'Hecho con open-beauty-site', 'Made with open-beauty-site'))} · ${year}</span>
</footer>`;

  return shell({
    lang: locale,
    title: `${brief.title} — ${brand}`,
    description: tagline,
    preset,
    css: `${css}\n${config.css}${subAccent ? `\n.style-${preset.slug}{--accent:${subAccent}}` : ''}`,
    body,
    bodyClass: `style-${preset.slug}${subfamily ? ` sub-${subfamily.slug}` : ''}`,
    script: `${BASE_SCRIPT}\n${config.script ?? ''}`,
    closing: closing.title,
  });
}
