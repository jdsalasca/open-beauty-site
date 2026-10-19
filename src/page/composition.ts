import type { PageBrief, PageComposition, SectionBrief, StylePreset } from '../types.js';
import type { SceneSubject } from '../art.js';
import { sceneArt } from '../art.js';
import { attr, esc, labels, t } from './common.js';
import { ART_DIRECTION } from '../styles/art-direction.js';

/**
 * Shared composition layer for the 13 page renderers.
 *
 * Two independent features live here so no renderer has to re-implement them:
 *
 *  1. Content-driven hero art: `heroArtForScene` swaps the fixed illustration
 *     for a `sceneArt` drawing when the brief names a supported subject, and
 *     reports an unsupported subject as a visible warning instead of silently
 *     substituting a house/flower/planet ornament.
 *  2. Composition variants: `applyComposition` injects a below-hero band and
 *     style-aware CSS for `split` and `stepper`, plus the section types
 *     `explanation`, `comparison`, `process` and `cta`.
 *
 * The default is always `editorial`: when the brief sets neither `scene` nor
 * `composition`, the rendered bytes are identical to the pre-feature output.
 */

export const COMPOSITIONS: readonly PageComposition[] = ['editorial', 'split', 'stepper'];

export const SCENE_SUBJECTS: readonly SceneSubject[] = [
  'table',
  'vitrine',
  'river',
  'house',
  'stage',
  'plant',
  'window',
  'none',
];

export function isSceneSubject(value: unknown): value is SceneSubject {
  return typeof value === 'string' && (SCENE_SUBJECTS as readonly string[]).includes(value);
}

export function resolveComposition(value: unknown): PageComposition {
  return value === 'split' || value === 'stepper' ? value : 'editorial';
}

export interface ResolvedScene {
  subject?: SceneSubject;
  warning?: string;
}

/**
 * Resolve the hero scene from the brief. An unsupported string is reported so
 * the renderer can show a visible limitation instead of a silent ornament.
 */
export function resolveScene(brief: { scene?: unknown; heroArt?: unknown }): ResolvedScene {
  if (brief.heroArt === 'collage') return {};
  if (isSceneSubject(brief.scene)) return { subject: brief.scene };
  if (isSceneSubject(brief.heroArt)) return { subject: brief.heroArt };
  const requested = typeof brief.scene === 'string' ? brief.scene : typeof brief.heroArt === 'string' ? brief.heroArt : '';
  if (requested.trim() && requested !== 'collage') {
    return {
      warning: `La escena «${requested.trim()}» no está soportada; se mantiene la ilustración por defecto. Usá una de: ${SCENE_SUBJECTS.filter((s) => s !== 'none').join(', ')}.`,
    };
  }
  return {};
}

function warningMarkup(warning: string): string {
  return `<p class="composition-warning" role="note" data-composition-warning>${esc(warning)}</p>`;
}

/**
 * Hero art for a renderer. `fallback` returns the fixed illustration; when the
 * brief names a supported subject the `sceneArt` drawing is used instead.
 */
export function heroArtForScene(
  brief: { scene?: unknown; heroArt?: unknown },
  preset: StylePreset,
  fallback: () => string,
  caption: string,
): string {
  const resolved = resolveScene(brief);
  const art = resolved.subject && resolved.subject !== 'none'
    ? sceneArt(preset, 0, caption, resolved.subject)
    : fallback();
  return resolved.warning ? `${art}${warningMarkup(resolved.warning)}` : art;
}

const PLACEHOLDER_HREF = /^(?:#|#!|todo|tbd|placeholder|coming[- ]?soon|lorem(?: ipsum)?|javascript:.*|about:blank)$/i;
const EXAMPLE_HREF = /^(?:https?:\/\/)?(?:www\.)?example\.(?:com|org|net)(?:[/?#]|$)/i;
const EXAMPLE_MAIL = /^mailto:[^@]*@example\.(?:com|org|net)$/i;

/**
 * A CTA has a real destination when it is not empty or a placeholder. In-page
 * anchors (`#contact`, `#works`) are real destinations; a bare `#` is not.
 */
export function ctaHasDestination(href: unknown): boolean {
  const value = typeof href === 'string' ? href.trim() : '';
  if (!value) return false;
  return !PLACEHOLDER_HREF.test(value) && !EXAMPLE_HREF.test(value) && !EXAMPLE_MAIL.test(value);
}

const CTA_CLASS = /\b(?:cta|btn|button|nav-cta|action)\b/i;

function limitationNote(locale: 'es' | 'en'): string {
  return t(
    locale,
    'Este llamado aún no tiene destino: el brief no definió un enlace. No se publica como enlace roto.',
    'This call to action has no destination yet: the brief did not define a link. It is not published as a broken link.',
  );
}

function stripHref(attrs: string): string {
  return attrs.replace(/\s*\bhref\s*=\s*(?:"[^"]*"|'[^']*')/gi, '').trimEnd();
}

/**
 * Turn any CTA anchor with an empty or placeholder href into a visible
 * limitation state: a disabled button plus an explanatory note. Renderers keep
 * their own button markup for valid destinations, and this guard runs after
 * rendering so a broken link can never reach the page.
 */
export function sanitizeCtaAnchors(html: string, locale: 'es' | 'en'): string {
  return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (match, attrs: string, content: string) => {
    const className = (/\bclass\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? '').toLowerCase();
    if (!CTA_CLASS.test(className)) return match;
    const href = (/\bhref\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? '').trim();
    if (ctaHasDestination(href)) return match;
    const limited = `<button${stripHref(attrs)} type="button" aria-disabled="true">${content}</button>`;
    return `${limited}<span class="comp-cta-note" role="note">${esc(limitationNote(locale))}</span>`;
  });
}

export interface CtaOptions {
  /** Visible note shown next to a limitation state. */
  note: string;
  /** Optional extra class, e.g. a style-specific button class. */
  className?: string;
}

/**
 * Render a CTA as a destination link or as a visible limitation state. Never
 * emits an `<a>` with an empty or placeholder `href`.
 */
export function ctaMarkup(href: unknown, label: string, options: CtaOptions): string {
  const classes = `comp-cta${options.className ? ` ${options.className}` : ''}`;
  if (ctaHasDestination(href)) {
    return `<a class="${classes}" href="${attr(href)}">${esc(label)}</a>`;
  }
  return `<button class="${classes} comp-cta-limited" type="button" aria-disabled="true">${esc(label)}</button><p class="comp-cta-note" role="note">${esc(options.note)}</p>`;
}

interface BandContext {
  brief: Partial<PageBrief>;
  preset: StylePreset;
  locale: 'es' | 'en';
  sections: SectionBrief[];
}

function sectionList(sections: SectionBrief[], kind: SectionBrief['kind'], fallback: string): SectionBrief[] {
  const typed = sections.filter((section) => section.kind === kind);
  return typed.length ? typed : sections.slice(0, 3).map((section) => ({ ...section, title: section.title || fallback }));
}

function explanationBlock(context: BandContext): string {
  const { brief, locale, sections } = context;
  const label = t(locale, 'Explicación', 'Explanation');
  const typed = sections.find((section) => section.kind === 'explanation');
  const body =
    typed?.body ||
    brief.intro ||
    brief.tagline ||
    t(locale, 'Qué dice el brief y qué espera quien lo lee.', 'What the brief says and what its reader expects.');
  return `<div class="comp-block comp-explanation" data-section="explanation">
  <p class="comp-kicker">${esc(label)}</p>
  <p class="comp-text">${esc(body)}</p>
</div>`;
}

function comparisonBlock(context: BandContext): string {
  const { brief, locale, sections } = context;
  const label = t(locale, 'Comparación', 'Comparison');
  const rows = sectionList(sections, 'comparison', t(locale, 'Antes', 'Before')).slice(0, 3).map((section, index) => {
    const side = index % 2 === 0 ? t(locale, 'Antes', 'Before') : t(locale, 'Después', 'After');
    return `<li><span class="comp-side">${esc(section.kicker || side)}</span><strong>${esc(section.title)}</strong><span>${esc(section.body)}</span></li>`;
  }).join('');
  const list = rows || `<li><span class="comp-side">${esc(t(locale, 'Sin cambios', 'No change'))}</span><strong>${esc(brief.title)}</strong><span>${esc(t(locale, 'La validación compara las filas tal como llegan.', 'The validation compares the rows as they arrive.'))}</span></li>`;
  return `<div class="comp-block comp-comparison" data-section="comparison">
  <p class="comp-kicker">${esc(label)}</p>
  <ul class="comp-list">${list}</ul>
</div>`;
}

function processBlock(context: BandContext): string {
  const { locale, sections } = context;
  const label = t(locale, 'Proceso', 'Process');
  const steps = sectionList(sections, 'process', t(locale, 'Paso', 'Step')).slice(0, 6).map((section, index) => {
    return `<li><span class="comp-step-num">${String(index + 1).padStart(2, '0')}</span><strong>${esc(section.title)}</strong><span>${esc(section.body)}</span></li>`;
  }).join('');
  return `<div class="comp-block comp-process" data-section="process">
  <p class="comp-kicker">${esc(label)}</p>
  <ol class="comp-steps">${steps}</ol>
</div>`;
}

function ctaBlock(context: BandContext): string {
  const { brief, locale, preset, sections } = context;
  const label = t(locale, 'Llamado a la acción', 'Call to action');
  const typed = sections.find((section) => section.kind === 'cta');
  const cta = brief.cta ?? { label: t(locale, 'Escribinos', 'Write to us'), href: '' };
  const note = limitationNote(locale);
  const semantic = ART_DIRECTION[preset.slug]?.color.semanticStates;
  return `<section class="composition-band composition-cta" data-section="cta" style="--comp-warn:${esc(semantic?.warn ?? preset.palette.muted)}">
  <div class="comp-cta-copy">
    <p class="comp-kicker">${esc(label)}</p>
    <h2 class="comp-cta-title">${esc(typed?.title || labels(locale).contact)}</h2>
    ${typed?.body ? `<p class="comp-text">${esc(typed.body)}</p>` : ''}
  </div>
  <div class="comp-cta-action">${ctaMarkup(cta.href, cta.label || labels(locale).contact, { note, className: 'comp-cta-button' })}</div>
</section>`;
}

function bandMarkup(composition: PageComposition, context: BandContext): string {
  if (composition === 'editorial') return '';
  const { locale } = context;
  if (composition === 'split') {
    return `<section class="composition-band" data-composition="split" aria-label="${esc(t(locale, 'Explicación y comparación', 'Explanation and comparison'))}">
  ${explanationBlock(context)}
  ${comparisonBlock(context)}
</section>`;
  }
  return `<section class="composition-band" data-composition="stepper" aria-label="${esc(t(locale, 'Proceso', 'Process'))}">
  ${processBlock(context)}
</section>`;
}

/**
 * Style-aware CSS for the composition layer. It consumes the preset palette and
 * the `semanticStates` field of `src/styles/art-direction.ts`, so the band
 * keeps each identity instead of becoming a generic gray strip.
 */
export function compositionCss(preset: StylePreset): string {
  const p = preset.palette;
  const semantic = ART_DIRECTION[preset.slug]?.color.semanticStates;
  const problem = semantic?.problem ?? p.accent;
  const border = preset.rules.borderWidths[0] ?? 1;
  const emphasis = preset.rules.borderWidths[1] ?? border;
  return `
.composition-band{--comp-bg:${p.surface};--comp-ink:${p.ink};--comp-muted:${p.muted};--comp-accent:${p.accent};max-width:1180px;margin:0 auto;padding:64px 28px;display:grid;grid-template-columns:1fr 1fr;gap:40px;border-top:${border}px solid var(--comp-muted);border-bottom:${border}px solid var(--comp-muted)}
.composition-band[data-composition="stepper"]{grid-template-columns:1fr}
.comp-kicker{margin:0 0 16px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--comp-accent);font-weight:700}
.comp-text{margin:0;font-size:17px;line-height:1.7;color:var(--comp-ink);max-width:56ch}
.comp-list{list-style:none;margin:0;padding:0;display:grid;gap:14px}
.comp-list li{display:grid;grid-template-columns:96px 1fr;gap:14px;padding-bottom:14px;border-bottom:${border}px solid var(--comp-muted)}
.comp-list .comp-side{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--comp-accent)}
.comp-list strong{display:block;font-size:16px;line-height:1.3}
.comp-list li>span:last-child{font-size:13px;line-height:1.6;color:var(--comp-muted)}
.comp-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:20px;counter-reset:step}
.comp-steps li{position:relative;padding:20px;background:var(--comp-bg);border:${border}px solid var(--comp-muted);display:grid;gap:8px}
.comp-step-num{font-size:11px;letter-spacing:.14em;color:var(--comp-accent);font-weight:700}
.comp-steps strong{font-size:16px;line-height:1.3}
.comp-steps li>span:last-child{font-size:13px;line-height:1.6;color:var(--comp-muted)}
.composition-cta{display:grid;grid-template-columns:1fr auto;align-items:center;gap:28px;max-width:1080px}
.composition-cta .comp-kicker{margin:0 0 10px}
.comp-cta-action{display:grid;gap:8px;justify-items:start}
.comp-cta-title{margin:0;font-size:clamp(24px,3vw,38px);line-height:1.1}
.comp-cta{display:inline-flex;align-items:center;gap:10px;background:var(--comp-ink);color:var(--comp-bg);padding:14px 20px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;font-weight:700}
.comp-cta-limited{cursor:not-allowed;opacity:.55}
.comp-cta-note{display:block;margin:6px 0 0;font-size:11px;line-height:1.5;color:var(--ink,var(--comp-ink,currentColor));border-left:${emphasis}px solid var(--comp-warn,var(--accent,currentColor));padding-left:8px;max-width:34ch}
.composition-warning{margin:12px 0 0;padding:10px 12px;border-left:${emphasis}px solid ${problem};background:color-mix(in srgb,${problem} 12%,transparent);color:var(--comp-ink);font-size:11px;line-height:1.5}
.composition-cta .composition-warning{grid-column:1/-1}
.scene-art svg{width:100%;height:auto;display:block;max-height:560px}
@media (max-width:760px){.composition-band{grid-template-columns:1fr;padding:44px 18px;gap:26px}.composition-cta{grid-template-columns:1fr}.comp-list li{grid-template-columns:1fr;gap:6px}}
`;
}

/**
 * Apply the composition variant and the scene-support CSS to a rendered page.
 * Returns the input unchanged for the default `editorial` composition with no
 * scene, which is what keeps the recipe pages byte-identical.
 */
export function applyComposition(html: string, brief: Partial<PageBrief>, preset: StylePreset): string {
  const composition = resolveComposition(brief.composition);
  const hasScene = isSceneSubject(brief.scene) || isSceneSubject(brief.heroArt);
  const warning = resolveScene(brief).warning;
  // A brief that explicitly provides a CTA without a destination must not
  // publish a broken link, so the visible limitation band is always injected.
  const brokenCta = brief.cta !== undefined && !ctaHasDestination(brief.cta?.href);
  const locale = brief.locale === 'en' ? 'en' : 'es';
  const guarded = sanitizeCtaAnchors(html, locale);
  if (composition === 'editorial' && !hasScene && !warning && !brokenCta && guarded === html) return html;

  const sections = brief.sections ?? [];
  const band = composition === 'editorial' ? '' : bandMarkup(composition, { brief, preset, locale, sections });
  const cta = brokenCta || composition !== 'editorial' ? ctaBlock({ brief, preset, locale, sections }) : '';

  let next = guarded;
  if (band || cta) {
    const mainStart = next.indexOf('<main');
    const heroEnd = mainStart >= 0 ? next.indexOf('</section>', mainStart) : -1;
    if (heroEnd >= 0) {
      const insertAt = heroEnd + '</section>'.length;
      next = `${next.slice(0, insertAt)}\n${band}\n${cta}${next.slice(insertAt)}`;
    } else {
      const mainTag = mainStart >= 0 ? next.indexOf('>', mainStart) + 1 : 0;
      next = `${next.slice(0, mainTag)}\n${band}\n${cta}${next.slice(mainTag)}`;
    }
  }

  const css = `${compositionCss(preset)}`;
  const styleEnd = next.lastIndexOf('</style>');
  if (styleEnd >= 0) next = `${next.slice(0, styleEnd)}${css}${next.slice(styleEnd)}`;

  if (composition !== 'editorial') {
    next = next.replace(/<body([^>]*?)>/, (match, attrs: string) => {
      const hasClass = /\sclass=/.test(attrs);
      return hasClass
        ? match.replace(/class="([^"]*)"/, (_m, value: string) => `class="${value} composition-${composition}"`)
        : `<body${attrs} class="composition-${composition}">`;
    });
  }
  return next;
}
