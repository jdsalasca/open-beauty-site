import type { DeckBrief, DeckSlide, DeckStat, StylePreset, StyleSubfamily } from './types.js';
import { esc, normalizeBrief, safeHref, shell, t } from './page/common.js';
import { motifFor } from './deck-motifs.js';

export interface DeckOptions {
  style: StylePreset;
  brief: Partial<DeckBrief>;
}

export interface DeckResult {
  html: string;
  slideCount: number;
  subfamily: StyleSubfamily;
}

function firstSubfamily(preset: StylePreset): StyleSubfamily {
  return preset.subfamilies?.[0] ?? {
    slug: 'default',
    name: 'Default',
    description: preset.epithet,
    accent: 'accent',
  };
}

function subfamilyFor(preset: StylePreset, slug?: string): StyleSubfamily {
  if (!slug) return firstSubfamily(preset);
  const found = preset.subfamilies?.find((item) => item.slug === slug);
  if (!found) throw new Error(`Unknown subfamily "${slug}" for ${preset.name}. Use one of: ${(preset.subfamilies ?? []).map((item) => item.slug).join(', ')}`);
  return found;
}

function normalizePoints(value: DeckSlide['points']) {
  return (value ?? [])
    .slice(0, 4)
    .map((point, index) => ({
      title: String(point?.title ?? '').trim().slice(0, 80) || `Punto ${index + 1}`,
      body: String(point?.body ?? '').trim().slice(0, 180) || undefined,
    }));
}

function normalizeStats(value: DeckSlide['stats']): DeckStat[] {
  return (value ?? [])
    .slice(0, 3)
    .map((stat) => ({
      value: String(stat?.value ?? '').trim().slice(0, 18) || '—',
      label: String(stat?.label ?? '').trim().slice(0, 48) || 'Dato',
    }));
}

function normalizeSlides(preset: StylePreset, brief: Partial<DeckBrief>): DeckSlide[] {
  const fallbackTitle = brief.title || 'Presentación';
  const source: DeckSlide[] = brief.slides?.length
    ? brief.slides
    : [
        ...(brief.intro
          ? [{ layout: 'statement' as const, kicker: 'La idea', title: fallbackTitle, body: brief.intro }]
          : []),
        ...(brief.sections?.length
          ? [
              {
                layout: 'points' as const,
                kicker: 'En tres movimientos',
                title: brief.tagline || fallbackTitle,
                points: brief.sections.slice(0, 3).map((section) => ({ title: section.title, body: section.body })),
              },
            ]
          : []),
        ...(brief.quote ? [{ layout: 'quote' as const, kicker: 'Una voz', title: 'Cita', quote: brief.quote }] : []),
      ];

  const slides = source.slice(0, 8).map((slide, index) => {
    const points = normalizePoints(slide.points);
    const stats = normalizeStats(slide.stats);
    const layout =
      slide.layout ??
      (slide.quote ? 'quote' : stats.length ? 'stats' : points.length ? 'points' : 'statement');
    return {
      layout,
      kicker: String(slide.kicker ?? '').trim().slice(0, 40) || `${String(index + 2).padStart(2, '0')} / ${preset.name}`,
      title: String(slide.title ?? '').trim().slice(0, 120) || fallbackTitle,
      body: String(slide.body ?? '').trim().slice(0, 300) || undefined,
      points: points.length ? points : undefined,
      stats: stats.length ? stats : undefined,
      quote: slide.quote?.text
        ? { text: String(slide.quote.text).slice(0, 240), author: String(slide.quote.author ?? '').slice(0, 60) || undefined }
        : undefined,
    } satisfies DeckSlide;
  });

  if (slides.length === 0) {
    slides.push({
      layout: 'statement',
      kicker: 'La idea',
      title: fallbackTitle,
      body: brief.tagline || 'Una idea que merece su propio tiempo.',
      points: undefined,
      stats: undefined,
      quote: undefined,
    });
  }
  return slides;
}

function renderSlideContent(slide: DeckSlide, index: number): string {
  const kicker = `<p class="kicker anim" style="--a:0">${esc(slide.kicker ?? '')}</p>`;
  if (slide.layout === 'quote' && slide.quote) {
    return `<div class="slide-inner">
      ${kicker}
      <blockquote class="deck-quote anim" style="--a:1">“${esc(slide.quote.text)}”</blockquote>
      <p class="deck-quote-author anim" style="--a:2">${esc(slide.quote.author || '—')}</p>
    </div>`;
  }
  if (slide.layout === 'stats' && slide.stats?.length) {
    return `<div class="slide-inner">
      ${kicker}
      <h2 class="anim" style="--a:1">${esc(slide.title)}</h2>
      <div class="stat-grid">${slide.stats
        .map(
          (stat, i) => `<div class="stat anim" style="--a:${i + 2}"><strong>${esc(stat.value)}</strong><span>${esc(stat.label)}</span></div>`,
        )
        .join('')}</div>
    </div>`;
  }
  if (slide.layout === 'points' && slide.points?.length) {
    return `<div class="slide-inner">
      ${kicker}
      <h2 class="anim" style="--a:1">${esc(slide.title)}</h2>
      <div class="point-grid">${slide.points
        .map(
          (point, i) => `<article class="point anim" style="--a:${i + 2}"><span>${String(i + 1).padStart(2, '0')}</span><h3>${esc(point.title)}</h3>${point.body ? `<p>${esc(point.body)}</p>` : ''}</article>`,
        )
        .join('')}</div>
    </div>`;
  }
  return `<div class="slide-inner">
    ${kicker}
    <h2 class="anim" style="--a:1">${esc(slide.title)}</h2>
    ${slide.body ? `<p class="deck-body anim" style="--a:2">${esc(slide.body)}</p>` : ''}
  </div>`;
}

export function renderDeck({ style, brief: input }: DeckOptions): DeckResult {
  const brief = normalizeBrief(input);
  const locale = brief.locale ?? 'es';
  const subfamily = subfamilyFor(style, input.subfamily);
  const slides = normalizeSlides(style, input);
  const accent = style.palette[subfamily.accent];
  const ground = subfamily.ground ? style.palette[subfamily.ground] : style.palette.bg;
  const cta = brief.cta ?? { label: t(locale, 'Gracias', 'Thank you'), href: '#' };
  const closingTitle = t(locale, 'Fin de la presentación.', 'End of the deck.');
  const total = slides.length + 2;
  const display = style.fonts.display;
  const bodyFont = style.fonts.body;
  const line = style.rules.borderWidths[0] ?? 1;
  const radius = style.rules.radius[0] ?? 0;

  const contentSlides = slides
    .map(
      (slide, index) => `<section class="slide layout-${slide.layout}" data-index="${index + 1}" aria-hidden="true" aria-roledescription="slide" aria-label="Diapositiva ${index + 2} de ${total}" inert>
        <span class="slide-watermark" aria-hidden="true">${String(index + 2).padStart(2, '0')}</span>
        ${renderSlideContent(slide, index)}
        <span class="slide-number">${String(index + 2).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
      </section>`,
    )
    .join('\n');

  const cover = `<section class="slide slide-cover is-active" data-index="0" aria-hidden="false" aria-roledescription="slide" aria-label="Diapositiva 1 de ${total}">
    <div class="cover-grid">
      <div class="cover-copy">
        <p class="kicker anim" style="--a:0">${esc(brief.eyebrow || style.name)}</p>
        <h1 class="anim" style="--a:1">${esc(brief.title)}</h1>
        ${brief.tagline ? `<p class="cover-tagline anim" style="--a:2">${esc(brief.tagline)}</p>` : ''}
        <div class="cover-meta anim" style="--a:3"><span>${esc(style.name)}</span><span>${esc(subfamily.name)}</span><span>${String(total).padStart(2, '0')} slides</span></div>
      </div>
      <div class="cover-mark" aria-hidden="true"><span class="cover-orbit"></span><span class="cover-dot"></span><span class="cover-index">${esc(String(total).padStart(2, '0'))}</span></div>
    </div>
    <span class="slide-number">01 / ${String(total).padStart(2, '0')}</span>
  </section>`;

  const closing = `<section class="slide slide-closing" data-index="${total - 1}" aria-hidden="true" aria-roledescription="slide" aria-label="Diapositiva ${total} de ${total}" inert>
    <span class="slide-watermark" aria-hidden="true">${String(total).padStart(2, '0')}</span>
    <div class="slide-inner">
      <p class="kicker anim" style="--a:0">${esc(t(locale, 'Cierre', 'Closing'))}</p>
      <h2 class="anim" style="--a:1">${esc(closingTitle)}</h2>
      <p class="deck-body anim" style="--a:2">${esc(brief.tagline || brief.intro || '')}</p>
      <a class="deck-cta anim" style="--a:3" href="${safeHref(cta.href)}">${esc(cta.label)} →</a>
    </div>
    <span class="slide-number">${String(total).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
  </section>`;

  const css = `*{box-sizing:border-box}
body.deck{--bg:${style.palette.bg};--surface:${style.palette.surface};--ink:${style.palette.ink};--muted:${style.palette.muted};--accent2:${style.palette.accent2};--accent3:${style.palette.accent3};--accent4:${style.palette.accent4};--deep:${style.palette.deep};--accent:${accent};--ground:${ground};--line:${line}px;--radius:${radius}px;margin:0;background:var(--ground);color:var(--ink);font-family:'${bodyFont}',sans-serif;overflow:hidden}
.deck .display,.deck h1,.deck h2,.deck h3{font-family:'${display}',sans-serif;font-weight:400}
.deck h1:focus,.deck h2:focus{outline:var(--line) solid var(--accent);outline-offset:10px}
.deck .atmosphere{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.deck .atmosphere:before,.deck .atmosphere:after{content:"";position:absolute;display:block}
.deck .deck-top{position:fixed;z-index:20;top:0;left:0;right:0;display:flex;justify-content:space-between;gap:20px;align-items:center;padding:18px 30px;border-bottom:var(--line) solid var(--muted);background:color-mix(in srgb,var(--ground) 78%,transparent);backdrop-filter:blur(12px);font-size:9px;letter-spacing:.16em;text-transform:uppercase}
.deck .deck-brand{font-family:'${display}',sans-serif;font-size:15px;letter-spacing:.1em;color:var(--ink)}
.deck .deck-brand span{color:var(--accent)}
.deck .deck-title{color:var(--muted);max-width:50vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.deck .deck-count{color:var(--muted)}.deck .deck-count b{color:var(--accent);font-weight:400}
.deck .deck-stage{position:fixed;inset:0;z-index:2}
.deck .slide{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:clamp(76px,8vh,120px) clamp(26px,7vw,110px) clamp(72px,10vh,100px);background:transparent;opacity:0;visibility:hidden;transform:translateY(22px) scale(.995);transition:opacity .7s var(--ease),transform .7s var(--ease),visibility .7s;overflow:hidden}
.deck .slide.is-active{opacity:1;visibility:visible;transform:none}
.deck .slide-inner{position:relative;z-index:2;width:min(1180px,100%);max-height:100%;display:flex;flex-direction:column;justify-content:center}
.deck .slide:not(.slide-cover):not(.slide-closing) .slide-inner{border-left:var(--line) solid color-mix(in srgb,var(--muted) 55%,transparent);padding-left:clamp(22px,4vw,58px)}
.deck .slide-watermark{position:absolute;z-index:0;right:clamp(8px,3vw,42px);bottom:4vh;font-family:'${display}',sans-serif;font-size:clamp(150px,24vw,360px);line-height:.7;color:var(--accent);opacity:.075;pointer-events:none}
.deck .layout-statement .deck-body{font-size:clamp(20px,2.1vw,32px);line-height:1.45;max-width:28ch;color:var(--ink);opacity:.82}
.deck .kicker{margin:0 0 16px;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted)}
.deck h1{font-size:clamp(50px,9.2vw,138px);line-height:.92;letter-spacing:-.035em;margin:0;max-width:12ch;text-wrap:balance}
.deck h2{font-size:clamp(30px,4.5vw,68px);line-height:1.02;letter-spacing:-.025em;margin:0 0 18px;max-width:18ch;text-wrap:balance}
.deck .cover-grid{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:30px;align-items:center;width:min(1260px,100%)}
.deck.comp-gabinete .cover-grid{grid-template-columns:1.35fr .65fr}
.deck.comp-gabinete h1{font-size:clamp(44px,7.4vw,108px)}
.deck.comp-cartel .cover-grid{grid-template-columns:1fr;text-align:center;max-width:1000px;margin:0 auto}
.deck.comp-cartel .cover-copy{display:flex;flex-direction:column;align-items:center}
.deck.comp-cartel .cover-mark{position:absolute;inset:0;opacity:.18;z-index:0;pointer-events:none}
.deck.comp-cartel h1{font-size:clamp(52px,10vw,150px);max-width:12ch;text-align:center}
.deck.comp-cartel .cover-tagline{margin-left:auto;margin-right:auto}
.deck.comp-cartel .cover-meta{justify-content:center}
.deck.comp-cartel .point-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
.deck .cover-tagline{font-size:clamp(17px,2vw,24px);line-height:1.5;color:var(--muted);max-width:520px;margin:22px 0 0}
.deck .cover-meta{display:flex;flex-wrap:wrap;gap:18px;margin-top:30px;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.deck .cover-meta span+span:before{content:"·";margin-right:18px;color:var(--accent)}
.deck .cover-mark{position:relative;aspect-ratio:1;display:grid;place-items:center}
.deck .cover-orbit{position:absolute;inset:9%;border:var(--line) solid var(--accent);border-radius:50%;opacity:.65;transform:rotate(-18deg) scaleY(.38)}
.deck .cover-orbit:after{content:"";position:absolute;inset:12%;border:var(--line) solid var(--muted);border-radius:50%;transform:rotate(32deg) scaleY(1.35)}
.deck .cover-dot{width:38%;height:38%;border-radius:50%;background:var(--accent);opacity:.9}
.deck .cover-index{position:absolute;right:0;bottom:2%;font-family:'${display}',sans-serif;font-size:clamp(42px,6vw,86px);color:var(--accent);opacity:.5}
.deck .deck-body{font-size:clamp(15px,1.55vw,21px);line-height:1.65;color:var(--muted);max-width:68ch;margin:0}
.deck .point-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px}
.deck .point{border:var(--line) solid var(--muted);border-radius:var(--radius);padding:18px 16px;background:color-mix(in srgb,var(--surface) 82%,transparent);min-height:150px}
.deck .point>span{font-size:9px;letter-spacing:.16em;color:var(--muted)}
.deck .point h3{font-size:clamp(15px,1.5vw,20px);line-height:1.25;margin:10px 0 8px;letter-spacing:-.01em}
.deck .point p{font-size:12px;line-height:1.55;color:var(--muted);margin:0}
.deck .stat-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:20px}
.deck .stat{border-top:var(--line) solid var(--accent);padding-top:12px}
.deck .stat strong{display:block;font-family:'${display}',sans-serif;font-size:clamp(30px,5vw,64px);line-height:1;color:var(--accent);font-weight:400}
.deck .stat span{display:block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-top:8px}
.deck .deck-quote{font-family:'${display}',sans-serif;font-size:clamp(30px,4.6vw,72px);line-height:1.08;letter-spacing:-.025em;margin:0;max-width:18ch;color:var(--ink)}
.deck .deck-quote-author{margin:22px 0 0;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.deck .slide-closing .slide-inner{max-width:900px}
.deck .deck-cta{display:inline-flex;align-self:flex-start;margin-top:26px;padding:12px 16px;background:var(--accent);color:var(--ground);font-size:10px;letter-spacing:.16em;text-transform:uppercase;border-radius:var(--radius)}
.deck .slide-number{position:absolute;right:30px;bottom:24px;font-size:9px;letter-spacing:.16em;color:var(--muted)}
.deck .deck-bottom{position:fixed;z-index:20;bottom:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;gap:14px;padding:14px 30px;border-top:var(--line) solid var(--muted);background:color-mix(in srgb,var(--ground) 82%,transparent);backdrop-filter:blur(12px);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.deck .deck-controls{display:flex;gap:6px}
.deck .deck-controls button{min-width:44px;min-height:44px;border:var(--line) solid var(--muted);background:transparent;color:var(--ink);padding:7px 10px;font-size:12px;line-height:1;cursor:pointer;border-radius:var(--radius)}
.deck .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
.deck .deck-controls button:hover{background:var(--accent);color:var(--ground);border-color:var(--accent)}
.deck .deck-progress{position:fixed;z-index:21;top:0;left:0;right:0;height:2px;background:color-mix(in srgb,var(--muted) 25%,transparent)}
.deck .deck-progress i{display:block;height:100%;width:0;background:var(--accent);transition:width .5s var(--ease)}
.deck .anim{opacity:0;transform:translateY(14px);transition:opacity .7s var(--ease),transform .7s var(--ease);transition-delay:calc(var(--a,0) * 80ms)}
.deck .slide.is-active .anim{opacity:1;transform:none}
.deck .deck-hint{font-size:8px;letter-spacing:.12em;color:var(--muted)}
.deck .atmosphere .orb-a,.deck .atmosphere .orb-b{position:absolute;border-radius:50%}
${motifFor(style.slug)}
@media (max-width:820px){
  .deck .deck-top{padding:14px 16px}.deck .deck-title{display:none}.deck .deck-bottom{padding:10px 16px}.deck .deck-hint{display:none}
  .deck .slide{padding:86px 20px 66px}.deck .cover-grid{grid-template-columns:1fr}.deck .cover-mark{display:none}
  .deck h1{font-size:clamp(42px,13vw,74px)}.deck h2{font-size:clamp(27px,7vw,44px)}
  .deck .point-grid,.deck .stat-grid{grid-template-columns:1fr;gap:8px}.deck .point{min-height:0;padding:12px 14px}.deck .point p{font-size:11px}
  .deck .deck-quote{font-size:clamp(26px,7vw,44px)}.deck .slide-number{right:18px;bottom:18px}
}
@media (prefers-reduced-motion:reduce){.deck .slide,.deck .anim{transition:none!important}.deck .deck-progress i{transition:none}}
@page{size:1600px 900px;margin:0}
@media print{.deck .anim{opacity:1!important;transform:none!important}body.deck{overflow:visible;background:var(--ground)}.deck .deck-top,.deck .deck-bottom,.deck .deck-progress,.deck .deck-hint{display:none}.deck .deck-stage{position:static;inset:auto;background:var(--ground)}.deck .slide{position:relative;inset:auto;width:1600px;height:900px;opacity:1;visibility:visible;transform:none;padding:80px}.deck .slide:not(:first-of-type){page-break-before:always;break-before:page}.deck .slide[aria-hidden=true]{display:flex}}
`;

  const body = `<div class="atmosphere" aria-hidden="true"></div>
<div class="deck-progress"><i data-progress></i></div>
<header class="deck-top">
  <span class="deck-brand">${esc(brief.brand || 'OPEN/BEAUTY')}<span>.</span></span>
  <span class="deck-title">${esc(brief.title)}</span>
  <span class="deck-count"><b data-current>01</b> / ${String(total).padStart(2, '0')}</span>
</header>
<main class="deck-stage" id="top">
  ${cover}
  ${contentSlides}
  ${closing}
</main>
<footer class="deck-bottom">
  <span class="deck-hint">${esc(t(locale, '← → para navegar · F pantalla completa', '← → to navigate · F fullscreen'))}</span>
  <div class="deck-controls">
    <button type="button" data-prev aria-label="${esc(t(locale, 'Anterior', 'Previous'))}">←</button>
    <button type="button" data-next aria-label="${esc(t(locale, 'Siguiente', 'Next'))}">→</button>
    <button type="button" data-full aria-label="${esc(t(locale, 'Pantalla completa', 'Fullscreen'))}">⛶</button>
  </div>
</footer>
<p class="sr-only" aria-live="polite" data-live></p>`;

  const script = `(() => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const current = document.querySelector('[data-current]');
  const progress = document.querySelector('[data-progress]');
  let index = 0;
  let started = false;
  const pad = (n) => String(n).padStart(2, '0');
  const show = (next) => {
    index = Math.max(0, Math.min(slides.length - 1, next));
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
      slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
      slide.inert = i !== index;
    });
    if (current) current.textContent = pad(index + 1);
    if (progress) progress.style.width = ((index + 1) / slides.length * 100) + '%';
    const live = document.querySelector('[data-live]');
    if (live) live.textContent = 'Diapositiva ' + (index + 1) + ' de ' + slides.length;
    history.replaceState(null, '', '#slide-' + (index + 1));
    if (started) {
      const heading = slides[index].querySelector('h1,h2');
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    }
    started = true;
  };
  const fromHash = () => {
    const match = location.hash.match(/slide-(\\d+)/);
    if (match) show(Number(match[1]) - 1);
  };
  document.querySelector('[data-next]')?.addEventListener('click', () => show(index + 1));
  document.querySelector('[data-prev]')?.addEventListener('click', () => show(index - 1));
  document.querySelector('[data-full]')?.addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  });
  addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); show(index + 1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) { event.preventDefault(); show(index - 1); }
    else if (event.key === 'Home') show(0);
    else if (event.key === 'End') show(slides.length - 1);
    else if (event.key.toLowerCase() === 'f') document.querySelector('[data-full]')?.click();
  });
  let startX = 0;
  addEventListener('touchstart', (event) => { startX = event.touches[0]?.clientX || 0; }, { passive: true });
  addEventListener('touchend', (event) => {
    const dx = (event.changedTouches[0]?.clientX || 0) - startX;
    if (Math.abs(dx) > 42) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });
  addEventListener('hashchange', fromHash);
  fromHash();
  show(index);
})();`;

  return {
    html: shell({
      lang: locale,
      title: `${brief.title} — ${brief.brand || style.name}`,
      description: brief.tagline || brief.intro || brief.title,
      preset: style,
      css,
      body,
      bodyClass: `deck style-${style.slug} sub-${subfamily.slug} comp-${subfamily.composition ?? 'sala'}`,
      script,
    }),
    slideCount: total,
    subfamily,
  };
}
