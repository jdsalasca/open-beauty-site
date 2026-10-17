import type { Brief, Locale, SectionBrief, StylePreset } from '../types.js';

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

export function normalizeBrief(input: Partial<Brief>): Brief {
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


function designLanguageCss(preset: StylePreset): string {
  const type = preset.typeSystem;
  const motion = preset.motionSystem;
  if (!type || !motion) return '';
  return `:root{--type-display-case:${type.displayCase};--type-display-tracking:${type.displayTracking};--type-display-leading:${type.displayLeading};--type-body-size:${type.bodySize};--type-body-leading:${type.bodyLeading};--type-label-tracking:${type.labelTracking};--type-label-case:${type.labelCase};--motion-enter:${motion.enter};--motion-distance:${motion.distance};--motion-stagger:${motion.stagger};--motion-ease:${motion.easing};--motion-page:${motion.page}}
html{overflow-x:hidden}
html body,html body[class]{font-size:var(--type-body-size);line-height:var(--type-body-leading);font-kerning:normal;font-optical-sizing:auto;text-rendering:optimizeLegibility;overflow-x:hidden}
html body :where(p,li),html body[class] :where(p,li){font-size:inherit}
:where(h1,h2,h3,.display){line-height:var(--type-display-leading);letter-spacing:var(--type-display-tracking);text-transform:var(--type-display-case);text-wrap:${type.wrap};font-feature-settings:${type.features}}
:where(p,li,blockquote){text-wrap:pretty;font-feature-settings:${type.features}}
:where(.eyebrow,.kicker,.label,.meta,.micro,.tag){letter-spacing:var(--type-label-tracking);text-transform:var(--type-label-case)}
html body .card p,html body[class] .card p,html body .aside p,html body[class] .aside p,html body .section-head p,html body[class] .section-head p{font-size:16px;line-height:1.6}
html body .quote cite,html body[class] .quote cite{font-size:11px}
html body .top nav,html body[class] .top nav,html body .eyebrow,html body[class] .eyebrow,html body .kicker,html body[class] .kicker,html body .link,html body[class] .link,html body .card-link,html body[class] .card-link{font-size:11px}
html body .hero-note,html body[class] .hero-note{font-size:10px}
.beauty-scroll{position:fixed;top:0;left:0;z-index:9999;width:100%;height:2px;background:var(--accent);transform:scaleX(0);transform-origin:0 50%;pointer-events:none;opacity:.9}
.motion-toggle{position:fixed;right:12px;bottom:12px;z-index:9998;border:0;background:var(--bg);color:var(--muted);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px;font:10px/1 ui-monospace,'Courier New',monospace;letter-spacing:.1em;text-transform:uppercase;padding:8px 10px;opacity:.55;cursor:pointer;border-radius:0}
.motion-toggle:hover,.motion-toggle:focus-visible{opacity:1;color:var(--ink);text-decoration-color:var(--accent)}
body.motion-paused *,body.motion-paused *::before,body.motion-paused *::after{animation-play-state:paused!important;transition:none!important}
a{text-underline-offset:.18em;text-decoration-thickness:1px}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
::selection{background:var(--accent);color:var(--ground,var(--bg))}
@media (prefers-reduced-motion:no-preference){
  html{scroll-behavior:smooth}
  body{animation:beauty-page-in var(--motion-page) var(--motion-ease) both}
  .js .reveal{transition-duration:var(--motion-enter);transition-timing-function:var(--motion-ease);transition-delay:calc(var(--i,0) * var(--motion-stagger))}
  @keyframes beauty-page-in{from{opacity:0}to{opacity:1}}
}
@media (max-width:560px){html body .hero h1,html body[class] .hero h1{font-size:clamp(40px,11.5vw,56px)!important;letter-spacing:var(--type-display-tracking)}html body .style-vaporwave .hero h1,html body[class] .style-vaporwave .hero h1{font-size:clamp(24px,6.8vw,40px)!important}}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  body{animation:none!important}
  .js .reveal{transition:none!important;transform:none!important;opacity:1!important}
}
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
}

export function shell({ lang, title, description, preset, css, body, script, bodyClass }: ShellOptions): string {
  const safeTitle = esc(title);
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle}</title>
<meta name="description" content="${attr(description)}">
<meta name="generator" content="open-beauty-site (${preset.slug})">
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
@media print{
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .reveal,.js .reveal{opacity:1!important;transform:none!important;transition:none!important;animation:none!important}
  .page-frame,.grain,.beauty-scroll,.motion-toggle{display:none!important}
  .site-head,.topbar{position:static!important}
  .ticker-track{animation:none!important}
}
</style>
</head>
<body${bodyClass ? ` class="${attr(bodyClass)}"` : ''}>
${body}
${bodyClass?.includes('deck') ? '' : `<div class="beauty-scroll" aria-hidden="true"></div>
<button class="motion-toggle" type="button" aria-pressed="false">${lang === 'es' ? 'Pausar movimiento' : 'Pause motion'}</button>`}
${script ? `<script>\n${script}\n</script>` : ''}
${bodyClass?.includes('deck') ? '' : `<script>
(() => { const bar = document.querySelector('.beauty-scroll'); const toggle = document.querySelector('.motion-toggle'); if (toggle) { toggle.addEventListener('click', () => { const paused = document.body.classList.toggle('motion-paused'); toggle.setAttribute('aria-pressed', String(paused)); toggle.textContent = paused ? (document.documentElement.lang === 'es' ? 'Reanudar movimiento' : 'Resume motion') : (document.documentElement.lang === 'es' ? 'Pausar movimiento' : 'Pause motion'); }); } if (!bar) return; const update = () => { const max = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')'; }; addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update(); })();
</script>`}
</body>
</html>
`;
}

export const REVEAL_SCRIPT = `
(() => {
  const nodes = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    nodes.forEach((node) => node.classList.add('is-in'));
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

