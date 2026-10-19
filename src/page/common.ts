import type { Locale, PageBrief, PageClosingBrief, SectionBrief, StylePreset } from '../types.js';
import { displayGlyphRatio, focusRingColor, headlineFitPx, HEADLINE_PREFERRED_VW, isDarkColor } from '../a11y.js';

export class BeautyError extends Error {
  constructor(message: string, readonly code = 'BEAUTY_ERROR') {
    super(message);
    this.name = 'BeautyError';
  }
}

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] ?? char);
}

export function attr(value: unknown): string {
  return esc(value).replace(/`/g, '&#96;');
}

export function clampText(value: unknown, max: number): string {
  const text = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '').trim();
}

export interface Labels {
  works: string;
  manifesto: string;
  contact: string;
  viewWorks: string;
  readMore: string;
  backToTop: string;
  madeWith: string;
  selectedWorks: string;
  index: string;
  next: string;
}

const LABELS: Record<Locale, Labels> = {
  es: {
    works: 'Obras',
    manifesto: 'Manifiesto',
    contact: 'Contacto',
    viewWorks: 'Ver obras',
    readMore: 'Leer más',
    backToTop: 'Volver arriba',
    madeWith: 'Diseñado con open-beauty-site',
    selectedWorks: 'Obras seleccionadas',
    index: 'Índice',
    next: 'Siguiente',
  },
  en: {
    works: 'Works',
    manifesto: 'Manifesto',
    contact: 'Contact',
    viewWorks: 'View works',
    readMore: 'Read more',
    backToTop: 'Back to top',
    madeWith: 'Designed with open-beauty-site',
    selectedWorks: 'Selected works',
    index: 'Index',
    next: 'Next',
  },
};

export function labels(locale: Locale): Labels {
  return LABELS[locale];
}

export function normalizeBrief(input: Partial<PageBrief> & { closing?: PageClosingBrief | string }): PageBrief {
  const title = clampText(input.title, 90);
  if (!title) {
    throw new BeautyError('A page needs a title. Pass at least { title }.', 'MISSING_TITLE');
  }

  const locale: Locale = input.locale === 'en' ? 'en' : 'es';
  const sections: SectionBrief[] = (input.sections ?? [])
    .slice(0, 6)
    .map((section, index) => ({
      kicker: clampText(section?.kicker ?? '', 28) || undefined,
      title: clampText(section?.title, 64) || `Capítulo ${index + 1}`,
      body: clampText(section?.body, 320),
    }))
    .filter((section) => section.title.length > 0);

  const ctaLabel = clampText(input.cta?.label, 30);
  const closingInput = typeof input.closing === 'object' && input.closing !== null ? input.closing : undefined;
  const closingTitle = clampText(closingInput?.title, 90);
  const closingText = clampText(closingInput?.text, 240);
  const closingLabel = clampText(closingInput?.cta?.label, 30);

  return {
    title,
    tagline: clampText(input.tagline, 160) || undefined,
    intro: clampText(input.intro, 760) || undefined,
    eyebrow: clampText(input.eyebrow, 48) || undefined,
    brand: clampText(input.brand, 42) || undefined,
    sections: sections.length ? sections : undefined,
    quote: input.quote?.text
      ? {
          text: clampText(input.quote.text, 260),
          author: clampText(input.quote.author, 60) || undefined,
        }
      : undefined,
    cta: ctaLabel ? { label: ctaLabel, href: clampText(input.cta?.href, 200) || '#' } : undefined,
    closing:
      closingTitle || closingText || closingLabel
        ? {
            title: closingTitle || undefined,
            text: closingText || undefined,
            cta: closingLabel ? { label: closingLabel, href: clampText(closingInput?.cta?.href, 200) || '#' } : undefined,
          }
        : undefined,
    audio:
      input.audio?.src && input.audio?.title
        ? {
            src: clampText(input.audio.src, 300),
            title: clampText(input.audio.title, 80),
            subtitle: clampText(input.audio.subtitle, 100) || undefined,
            note: clampText(input.audio.note, 180) || undefined,
          }
        : undefined,
    footer: clampText(input.footer, 140) || undefined,
    locale,
    seed: Number.isFinite(input.seed) ? Math.abs(Math.trunc(input.seed as number)) : 0,
    subfamily: clampText(input.subfamily, 40) || undefined,
  };
}

/** Split a headline so the last 1–2 words can be set in italic as an accent. */
export function splitAccent(title: string): { main: string; accent: string } {
  const words = title.trim().split(/\s+/);
  if (words.length < 2) return { main: title, accent: '' };
  const take = words.length > 5 ? 2 : 1;
  const accent = words.slice(-take).join(' ');
  const main = words.slice(0, -take).join(' ');
  return { main, accent };
}

export function brandInitial(brand: string): string {
  return brand
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

export interface ClosingCopy {
  title: string;
  text?: string;
  cta: { label: string; href: string };
}

/**
 * Resolve the closing section from `brief.closing`, then `brief.cta`, then the
 * style default. Keeps every renderer on the same precedence order.
 */
export function resolveClosing(
  brief: PageBrief,
  defaults: { title: string; text?: string; label: string; href: string },
): ClosingCopy {
  return {
    title: brief.closing?.title || defaults.title,
    text: brief.closing?.text || defaults.text,
    cta: {
      label: brief.closing?.cta?.label || brief.cta?.label || defaults.label,
      href: brief.closing?.cta?.href || brief.cta?.href || defaults.href,
    },
  };
}


function designLanguageCss(preset: StylePreset): string {
  const type = preset.typeSystem;
  const motion = preset.motionSystem;
  const focus = focusRingColor(preset.palette);
  const scheme = isDarkColor(preset.palette.bg) ? 'dark' : 'light';
  const tokens = type && motion
    ? `--type-display-case:${type.displayCase};--type-display-tracking:${type.displayTracking};--type-display-leading:${type.displayLeading};--type-body-size:${type.bodySize};--type-body-leading:${type.bodyLeading};--type-label-tracking:${type.labelTracking};--type-label-case:${type.labelCase};--motion-enter:${motion.enter};--motion-distance:${motion.distance};--motion-stagger:${motion.stagger};--motion-ease:${motion.easing};--motion-page:${motion.page};`
    : '';
  return `:root{${tokens}color-scheme:${scheme};--focus-ring:${focus}}
.skip-link{position:absolute;left:14px;top:-64px;z-index:10000;background:${preset.palette.ink};color:${preset.palette.bg};padding:10px 16px;font:600 13px/1.2 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.02em;text-decoration:none;outline:2px solid ${preset.palette.accent};outline-offset:-2px;transition:top .18s ease}
.skip-link:focus,.skip-link:focus-visible{top:14px}
html.is-capturing .skip-link{display:none!important}
html.is-capturing .reveal,html.is-static .reveal{opacity:1!important;transform:none!important;transition:none!important;animation:none!important}
html.is-capturing body,html.is-static body{animation:none!important}
html.is-capturing{scroll-behavior:auto}
html{overflow-x:hidden}
html body,html body[class]{font-size:var(--type-body-size);line-height:var(--type-body-leading);font-kerning:normal;font-optical-sizing:auto;text-rendering:optimizeLegibility;overflow-x:hidden;overflow-wrap:break-word;hyphens:manual}
html body :where(p,li),html body[class] :where(p,li){font-size:inherit}
html body :where(p,li,blockquote,figcaption,td,th){overflow-wrap:break-word;hyphens:manual}
html body :where(.hero-copy,.hero-main,.card,.work,.nature-drawer,.aside,.section-head>div,.about-card,.cta-card,.player-main,.music-room>div,.xp-room-copy,.story-chapter-main){min-width:0}
html body :where(.works-count,.section-head>span,.aside>span,.folio,.nature-count,.nature-plate-head>span,.iso-head>span:last-child,.iso-foot>span,.works-meta,.hero-strip>span,.vapor-status>span,.vapor-bar>span,.galaxy-coord,.galaxy-scale,.est,.sec-num){white-space:nowrap;overflow-wrap:normal}
:where(h1,h2,h3,.display){line-height:var(--type-display-leading);letter-spacing:var(--type-display-tracking);text-transform:var(--type-display-case);text-wrap:${type?.wrap ?? 'balance'};font-feature-settings:${type?.features ?? 'normal'}}
:where(p,li,blockquote){text-wrap:pretty;font-feature-settings:${type?.features ?? 'normal'}}
:where(.eyebrow,.kicker,.label,.meta,.micro,.tag){letter-spacing:var(--type-label-tracking);text-transform:var(--type-label-case)}
html body .card p,html body[class] .card p,html body .aside p,html body[class] .aside p,html body .section-head p,html body[class] .section-head p{font-size:16px;line-height:1.6}
html body .quote cite,html body[class] .quote cite{font-size:11px}
html body .top nav,html body[class] .top nav,html body .eyebrow,html body[class] .eyebrow,html body .kicker,html body[class] .kicker,html body .link,html body[class] .link,html body .card-link,html body[class] .card-link{font-size:11px}
html body .hero-note,html body[class] .hero-note{font-size:10px}
.beauty-scroll{position:fixed;top:0;left:0;z-index:9999;width:100%;height:2px;background:var(--accent);transform:scaleX(0);transform-origin:0 50%;pointer-events:none;opacity:.9}
.motion-dock{position:relative;z-index:40;display:flex;justify-content:flex-end;padding:0 max(14px,4vw) calc(18px + env(safe-area-inset-bottom))}
.motion-toggle{display:inline-flex;align-items:center;gap:8px;border:0;background:var(--bg);color:var(--muted);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px;font:10px/1 ui-monospace,'Courier New',monospace;letter-spacing:.1em;text-transform:uppercase;padding:8px 10px;opacity:.7;cursor:pointer;border-radius:0}
.motion-toggle:hover,.motion-toggle:focus-visible{opacity:1;color:var(--ink);text-decoration-color:var(--accent)}
@media (max-width:720px){.motion-dock{justify-content:center;padding-bottom:calc(24px + env(safe-area-inset-bottom))}.motion-toggle{opacity:.9;padding:10px 12px}}
body.motion-paused *,body.motion-paused *::before,body.motion-paused *::after{animation-play-state:paused!important;transition:none!important}
a{text-underline-offset:.18em;text-decoration-thickness:1px}
img,svg,video,canvas{max-width:100%}
:focus-visible{outline:3px solid var(--focus-ring,var(--accent));outline-offset:3px}
::selection{background:var(--accent);color:var(--ground,var(--bg))}
@media (prefers-reduced-motion:no-preference){
  html{scroll-behavior:smooth}
  body{animation:beauty-page-in var(--motion-page) var(--motion-ease) both}
  .js .reveal{transition-duration:var(--motion-enter);transition-timing-function:var(--motion-ease);transition-delay:calc(var(--i,0) * var(--motion-stagger))}
  @keyframes beauty-page-in{from{opacity:0}to{opacity:1}}
}
@media (max-width:560px){html body .hero h1,html body[class] .hero h1{font-size:min(var(--headline-fit,11.5vw),clamp(40px,11.5vw,56px))!important;letter-spacing:var(--type-display-tracking)}html body .style-vaporwave .hero h1,html body[class] .style-vaporwave .hero h1{font-size:min(var(--headline-fit,6.8vw),clamp(24px,6.8vw,40px))!important}}
@media (max-width:380px){
  html,body{max-width:100%}
  html body{overflow-wrap:anywhere;hyphens:manual}
  html body :where(h1,h2,.display){font-size:clamp(30px,11vw,46px)!important;line-height:1.02;letter-spacing:0}
  html body .style-vaporwave :where(h1,h2,.display){font-size:clamp(20px,7vw,34px)!important}
  .page-frame,.nature-frame{inset:6px}
  .top,.site-head,.nature-top,.xp-top,.story-top{padding-left:14px!important;padding-right:14px!important}
}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  body{animation:none!important}
  .js .reveal{transition:none!important;transform:none!important;opacity:1!important}
}
`;
}

/** Visible text of the first <h1> in the body, used to size the headline. */
function headlineText(markup: string): string {
  const match = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(markup);
  if (!match) return '';
  return (match[1] ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Positive display tracking in em, added to the measured glyph ratio. */
function trackingEm(preset: StylePreset): number {
  const match = /^(-?\d*\.?\d+)em/.exec(preset.typeSystem?.displayTracking ?? '');
  const value = match ? Number(match[1]) : 0;
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * Length-aware headline typography. The generator computes the smallest font
 * size at which the longest word of the real title still fits a 360px viewport
 * and emits it as `--headline-fit`; the narrow-screen clamp never goes below
 * that, so a headline can never break inside a word. The validator re-checks
 * the same value (`headline-fits`).
 */
export function headlineFitCss(body: string, preset: StylePreset): string {
  const text = headlineText(body);
  const ratio = Number((displayGlyphRatio(preset.fonts.display) + trackingEm(preset)).toFixed(3));
  const fit = headlineFitPx(text, undefined, ratio);
  if (!fit) return '';
  return `:root{--headline-fit:${fit}px;--headline-ratio:${ratio}}
html body :where(h1,h2,h3,.display){overflow-wrap:normal;word-break:normal;hyphens:manual;text-wrap:balance}
@media (max-width:760px){html body[class] .hero h1,html body .hero h1,html body[class] h1,html body h1{font-size:min(var(--headline-fit),${HEADLINE_PREFERRED_VW}vw)!important;line-height:1.04;letter-spacing:0;overflow-wrap:normal;word-break:normal;hyphens:manual}}
`;
}

export interface ShellOptions {
  lang: Locale;
  title: string;
  description: string;
  preset: StylePreset;
  css: string;
  body: string;
  script?: string;
  bodyClass?: string;
  skipHref?: string;
  /** Visible text of the closing CTA headline, used for length-aware sizing. */
  closing?: string;
}

/**
 * Length-aware sizing for the closing CTA headline. It reuses the same fit
 * computation as the hero so a long word never breaks inside the container,
 * and the closing headline stays readable at 360px.
 */
export function closingFitCss(text: string, preset: StylePreset): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const ratio = Number((displayGlyphRatio(preset.fonts.display) + trackingEm(preset)).toFixed(3));
  const fit = headlineFitPx(clean, undefined, ratio);
  if (!fit) return '';
  return `:root{--closing-fit:${fit}px;--closing-ratio:${ratio}}
@media (max-width:760px){html body :where(.cta,.nature-cta,.cta-card) h2{font-size:min(var(--closing-fit),${HEADLINE_PREFERRED_VW}vw)!important;line-height:1.06;letter-spacing:0;overflow-wrap:normal;word-break:normal;hyphens:manual}}
`;
}

export function shell({ lang, title, description, preset, css, body, script, bodyClass, skipHref = '#top', closing }: ShellOptions): string {
  const safeTitle = esc(title);
  const scheme = isDarkColor(preset.palette.bg) ? 'dark' : 'light';
  const skipLabel = lang === 'es' ? 'Saltar al contenido' : 'Skip to content';
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<meta name="description" content="${attr(description)}">
<meta name="generator" content="open-beauty-site (${preset.slug})">
<meta name="color-scheme" content="${scheme}">
<meta name="theme-color" content="${preset.palette.bg}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${preset.fonts.googleHref}" rel="stylesheet">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='${encodeURIComponent(preset.palette.ink)}'/%3E%3Crect x='12' y='12' width='40' height='40' fill='${encodeURIComponent(preset.palette.accent)}'/%3E%3C/svg%3E">
<script>document.documentElement.classList.add('js')</script>
<style>
${css}
${designLanguageCss(preset)}
${headlineFitCss(body, preset)}
${closingFitCss(closing ?? '', preset)}
@media print{
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .reveal,.js .reveal{opacity:1!important;transform:none!important;transition:none!important;animation:none!important}
  .page-frame,.grain,.beauty-scroll,.motion-toggle,.motion-dock,.skip-link{display:none!important}
  .site-head,.topbar{position:static!important}
  .ticker-track{animation:none!important}
  figure,table,pre,blockquote{break-inside:avoid}
  a[href^="http"]::after{content:" (" attr(href) ")";font-size:.8em;word-break:break-all}
}
</style>
</head>
<body${bodyClass ? ` class="${attr(bodyClass)}"` : ''}>
<a class="skip-link" href="${attr(skipHref)}">${esc(skipLabel)}</a>
${body}
${bodyClass?.includes('deck') ? '' : `<div class="beauty-scroll" aria-hidden="true"></div>
<div class="motion-dock">
<button class="motion-toggle" type="button" aria-pressed="false">${lang === 'es' ? 'Pausar movimiento' : 'Pause motion'}</button>
</div>`}
${script ? `<script>\n${script}\n</script>` : ''}
${bodyClass?.includes('deck') ? '' : `<script>
(() => {
  const bar = document.querySelector('.beauty-scroll');
  const toggle = document.querySelector('.motion-toggle');
  if (toggle) {
    const es = document.documentElement.lang === 'es';
    const labels = es ? ['Pausar movimiento', 'Reanudar movimiento'] : ['Pause motion', 'Resume motion'];
    const render = (paused) => {
      document.body.classList.toggle('motion-paused', paused);
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.textContent = paused ? labels[1] : labels[0];
    };
    render(matchMedia('(prefers-reduced-motion: reduce)').matches);
    toggle.addEventListener('click', () => render(!document.body.classList.contains('motion-paused')));
  }
  if (!bar) return;
  const update = () => { const max = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')'; };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
})();
</script>`}
</body>
</html>
`;
}

export const REVEAL_SCRIPT = `
(() => {
  const root = document.documentElement;
  const nodes = document.querySelectorAll('.reveal');
  const revealAll = () => nodes.forEach((node) => node.classList.add('is-in'));
  const params = new URLSearchParams(location.search);
  const staticMode =
    params.has('static') ||
    root.classList.contains('is-capturing') ||
    navigator.webdriver === true ||
    !('IntersectionObserver' in window);
  if (staticMode) {
    root.classList.add('is-static');
    revealAll();
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  nodes.forEach((node) => io.observe(node));
})();
`;

/** Small inline arrow used by all styles. */
export function arrowSvg(size = 18): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"/></svg>`;
}

export function quoteGlyphSvg(size = 64): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><path d="M8 40c0-14 7-23 19-27l3 7c-7 3-11 8-11 13h9v16H8V40Zm28 0c0-14 7-23 19-27l3 7c-7 3-11 8-11 13h9v16H36V40Z"/></svg>`;
}

export function safeHref(href: string | undefined): string {
  if (!href) return '#';
  return /^(https?:\/\/|mailto:|tel:|#|\/)/i.test(href) ? href : '#';
}

export function t(locale: Locale, es: string, en: string): string {
  return locale === 'es' ? es : en;
}

