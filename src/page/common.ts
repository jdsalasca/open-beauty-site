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
@media print{
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .reveal,.js .reveal{opacity:1!important;transform:none!important;transition:none!important;animation:none!important}
  .page-frame,.grain{display:none!important}
  .site-head,.topbar{position:static!important}
  .ticker-track{animation:none!important}
}
</style>
</head>
<body${bodyClass ? ` class="${attr(bodyClass)}"` : ''}>
${body}
${script ? `<script>\n${script}\n</script>` : ''}
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

