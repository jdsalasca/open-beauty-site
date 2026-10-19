import type { DeckPoint, DeckPurpose, DeckSlide, DeckTable, Locale, StylePreset } from './types.js';
import { ART_DIRECTION } from './styles/art-direction.js';
import { esc, t } from './page/common.js';
import { DECK_TABLE_COLUMN_LIMIT, DECK_TABLE_ROW_LIMIT } from './types/deck.js';

/**
 * Purpose-driven slide compositions. Each one has a single focus and its own
 * structure; none of them is a renamed card grid.
 *
 * Rhythm is deterministic: the purpose chooses the composition and its base
 * scale, `index` alternates the axis and a slightly tighter scale, and `seed`
 * only mirrors the axis when the style's art direction allows asymmetry. The
 * seed never changes the content or the composition type.
 */
export type CompositionFocus = 'title' | 'after' | 'steps' | 'object' | 'statement' | 'table';

export interface CompositionPlan {
  purpose: DeckPurpose;
  focus: CompositionFocus;
  density: 'airy' | 'regular' | 'dense';
  mirrored: boolean;
  rhythm: 'even' | 'odd';
  allowsAsymmetry: boolean;
}

export interface CompositionFigure {
  art: string;
  caption?: string;
  source?: string;
  subjectAttribute?: string;
}

export interface CompositionInput {
  slide: DeckSlide;
  index: number;
  plan: CompositionPlan;
  locale: Locale;
  figure?: CompositionFigure;
}

const FOCUS: Record<DeckPurpose, CompositionFocus> = {
  cover: 'title',
  problem: 'title',
  comparison: 'after',
  process: 'steps',
  example: 'object',
  result: 'statement',
  'next-steps': 'steps',
  table: 'table',
};

const PURPOSE_DENSITY: Record<DeckPurpose, number> = {
  cover: -1,
  problem: 0,
  comparison: 0,
  process: 1,
  example: -1,
  result: -1,
  'next-steps': 0,
  table: 1,
};

/**
 * Art-direction fields actually consumed here:
 * - `composition.density` maps the style's prose to airy / regular / dense
 *   spacing (low → airy, high → dense).
 * - `composition.allowedAsymmetry` decides whether the axis may mirror between
 *   slides. Styles that demand a fixed axis keep it.
 * Everything else (palette, fonts, rules, motifs) comes from the preset.
 */
const ASYMMETRY_ALLOWED =
  /asym|off-grid|off-centre|off-center|swap|left or right|rotated|break symmetry|not exactly centred|not exactly centered|overlap|mirror|bleed|sides?/i;

function styleDensity(style: StylePreset): number {
  const density = ART_DIRECTION[style.slug]?.composition.density ?? '';
  if (/high/i.test(density)) return 1;
  if (/low/i.test(density)) return -1;
  return 0;
}

export function compositionPlan(slide: DeckSlide, index: number, seed: number, style: StylePreset): CompositionPlan {
  const purpose = slide.purpose ?? 'cover';
  const art = ART_DIRECTION[style.slug]?.composition;
  const allowsAsymmetry = art ? ASYMMETRY_ALLOWED.test(art.allowedAsymmetry) : false;
  const score = PURPOSE_DENSITY[purpose] + styleDensity(style) + (index % 2 === 0 ? 0 : 1);
  return {
    purpose,
    focus: FOCUS[purpose],
    density: score <= -1 ? 'airy' : score >= 1 ? 'dense' : 'regular',
    mirrored: allowsAsymmetry && (index + Math.abs(Math.trunc(seed))) % 2 === 1,
    rhythm: index % 2 === 0 ? 'even' : 'odd',
    allowsAsymmetry,
  };
}

function kicker(slide: DeckSlide): string {
  return slide.kicker ? `<p class="kicker anim" style="--a:0">${esc(slide.kicker)}</p>` : '';
}

function title(slide: DeckSlide): string {
  return `<h2 class="comp-title anim" style="--a:1">${esc(slide.title)}</h2>`;
}

function lead(slide: DeckSlide): string {
  return slide.body ? `<p class="comp-lead anim" style="--a:2">${esc(slide.body)}</p>` : '';
}

function signalList(points: DeckPoint[] | undefined): string {
  if (!points?.length) return '';
  return `<ol class="comp-signals anim" style="--a:3">${points
    .map(
      (point, index) =>
        `<li class="comp-signal"><span class="comp-signal-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div><h3>${esc(point.title)}</h3>${point.body ? `<p>${esc(point.body)}</p>` : ''}</div></li>`,
    )
    .join('')}</ol>`;
}

function coverComposition(input: CompositionInput): string {
  const { slide, index } = input;
  return `${kicker(slide)}
  <div class="comp-cover-grid">
    <div class="comp-cover-copy">${title(slide)}${lead(slide)}</div>
    <div class="comp-cover-mark" aria-hidden="true"><span>${String(index + 2).padStart(2, '0')}</span><i></i></div>
  </div>`;
}

function problemComposition(input: CompositionInput): string {
  const { slide } = input;
  const side = `${lead(slide)}${signalList(slide.points)}`;
  return `<div class="comp-split">
    <div class="comp-main">${kicker(slide)}${title(slide)}</div>
    ${side ? `<div class="comp-side">${side}</div>` : ''}
  </div>`;
}

function compareSide(point: DeckPoint | undefined, role: string, focus: boolean): string {
  return `<article class="compare-side${focus ? ' is-focus' : ''}">
    <span class="compare-role">${esc(role)}</span>
    <h3>${esc(point?.title ?? role)}</h3>
    ${point?.body ? `<p>${esc(point.body)}</p>` : ''}
  </article>`;
}

function comparisonComposition(input: CompositionInput): string {
  const { slide, locale } = input;
  const points = slide.points ?? [];
  const before = t(locale, 'Antes', 'Before');
  const after = t(locale, 'Después', 'After');
  const notes = points.slice(2);
  return `${kicker(slide)}${title(slide)}
  <div class="comp-compare">
    ${compareSide(points[0], before, false)}
    <span class="compare-divider" aria-hidden="true"></span>
    ${compareSide(points[1], after, true)}
  </div>
  ${
    notes.length
      ? `<ol class="compare-notes anim" style="--a:3">${notes
          .map((point) => `<li><strong>${esc(point.title)}</strong>${point.body ? `<span>${esc(point.body)}</span>` : ''}</li>`)
          .join('')}</ol>`
      : ''
  }`;
}

function processComposition(input: CompositionInput): string {
  const { slide } = input;
  const steps = slide.steps ?? slide.points ?? [];
  return `${kicker(slide)}${title(slide)}
  <ol class="comp-process">
    ${steps
      .map(
        (step, index) =>
          `<li class="comp-step anim" style="--a:${index + 2}"><span class="comp-step-node" aria-hidden="true">${index + 1}</span><h3>${esc(step.title)}</h3>${step.body ? `<p>${esc(step.body)}</p>` : ''}</li>`,
      )
      .join('')}
  </ol>`;
}

function exampleComposition(input: CompositionInput): string {
  const { slide, figure } = input;
  const block = figure ?? { art: '' };
  return `<div class="comp-example">
    <figure class="comp-example-figure anim" style="--a:2"${block.subjectAttribute ?? ''}>${block.art}<figcaption>${esc(block.caption ?? '')}${block.source ? `<span>${esc(block.source)}</span>` : ''}</figcaption></figure>
    <div class="comp-example-note">${kicker(slide)}${title(slide)}${lead(slide)}</div>
  </div>`;
}

function resultComposition(input: CompositionInput): string {
  const { slide, locale } = input;
  return `${kicker(slide)}
  <div class="comp-result${slide.table ? ' has-table' : ''}">
    <div class="comp-result-statement">${title(slide)}${lead(slide)}</div>
    ${slide.table ? renderTable(slide.table, slide.title, locale) : ''}
  </div>`;
}

function nextStepsComposition(input: CompositionInput): string {
  const { slide } = input;
  const points = slide.points ?? [];
  return `${kicker(slide)}${title(slide)}
  <ol class="comp-next">
    ${points
      .map(
        (point, index) =>
          `<li class="comp-next-item anim" style="--a:${index + 2}"><span class="comp-next-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span><div><h3>${esc(point.title)}</h3>${point.body ? `<span class="comp-next-meta">${esc(point.body)}</span>` : ''}</div></li>`,
      )
      .join('')}
  </ol>`;
}

function tableComposition(input: CompositionInput): string {
  const { slide, locale } = input;
  return `${kicker(slide)}${title(slide)}${lead(slide)}
  ${slide.table ? renderTable(slide.table, slide.title, locale) : ''}`;
}

export function renderTable(table: DeckTable, fallbackCaption: string, locale: Locale): string {
  const caption = table.caption || fallbackCaption;
  const label = t(locale, 'Tabla', 'Table');
  const head = table.columns.map((column) => `<th scope="col">${esc(column)}</th>`).join('');
  const body = table.rows
    .map((row) => {
      const [first, ...rest] = row;
      return `<tr><th scope="row">${esc(first)}</th>${rest.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`;
    })
    .join('');
  return `<div class="table-scroll" role="region" aria-label="${esc(`${label}: ${caption}`)}" tabindex="0">
    <table class="comp-table">
      <caption>${esc(caption)}</caption>
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  </div>`;
}

export function renderComposition(input: CompositionInput): string {
  const { slide, plan } = input;
  const classes = [
    'slide-inner',
    'comp',
    `comp-${plan.purpose}`,
    `density-${plan.density}`,
    plan.mirrored ? 'mirror' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const markup = (() => {
    switch (plan.purpose) {
      case 'cover':
        return coverComposition(input);
      case 'problem':
        return problemComposition(input);
      case 'comparison':
        return comparisonComposition(input);
      case 'process':
        return processComposition(input);
      case 'example':
        return exampleComposition(input);
      case 'result':
        return resultComposition(input);
      case 'next-steps':
        return nextStepsComposition(input);
      case 'table':
        return tableComposition(input);
      default: {
        const exhaustive: never = plan.purpose;
        return exhaustive;
      }
    }
  })();
  return `<div class="${classes}" data-composition="${plan.purpose}" data-focus="${plan.focus}" data-rhythm="${plan.rhythm}">${markup}</div>`;
}

export const COMPOSITION_CSS = `/* Purpose compositions: one focus, real structure, no card-grid fallback. */
.deck .comp{position:relative;z-index:2;width:min(1180px,100%);max-height:100%;display:flex;flex-direction:column;justify-content:center;--comp-title:clamp(34px,4.6vw,64px)}
.deck .comp .kicker{font-size:12px}
.deck .comp .comp-title{font-size:var(--comp-title);line-height:1.02;letter-spacing:-.025em;margin:0;max-width:22ch;text-wrap:balance}
.deck .comp[data-rhythm="odd"] .comp-title{font-size:calc(var(--comp-title) * .92)}
.deck .comp .comp-lead{font-size:clamp(16px,1.55vw,21px);line-height:1.5;color:var(--muted);max-width:52ch;margin:14px 0 0}
.deck .comp.density-airy{--comp-gap:clamp(22px,3vw,44px)}
.deck .comp.density-regular{--comp-gap:clamp(16px,2.2vw,32px)}
.deck .comp.density-dense{--comp-gap:clamp(10px,1.4vw,20px)}
.deck .comp-cover{--comp-title:clamp(46px,6.4vw,92px)}
.deck .comp-result{--comp-title:clamp(40px,5.6vw,82px)}
.deck .comp-problem{--comp-title:clamp(36px,4.8vw,66px)}
.deck .comp-comparison,.deck .comp-process{--comp-title:clamp(32px,4vw,56px)}
.deck .comp-example{--comp-title:clamp(30px,3.6vw,50px)}
.deck .comp-next-steps,.deck .comp-table{--comp-title:clamp(34px,4.2vw,60px)}
.deck .comp-cover-grid{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:clamp(18px,3vw,44px);align-items:center}
.deck .comp.mirror .comp-cover-grid{grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr)}
.deck .comp.mirror .comp-cover-grid .comp-cover-copy{order:2}
.deck .comp-cover-mark{position:relative;aspect-ratio:1;display:grid;place-items:center}
.deck .comp-cover-mark:before{content:"";position:absolute;inset:8%;border:var(--line) solid var(--accent);border-radius:50%;transform:rotate(-16deg) scaleY(.42);opacity:.8}
.deck .comp-cover-mark:after{content:"";position:absolute;inset:20%;border:var(--line) solid var(--muted);border-radius:50%;transform:rotate(28deg) scaleY(1.3)}
.deck .comp-cover-mark i{width:34%;height:34%;border-radius:50%;background:var(--accent);opacity:.9}
.deck .comp-cover-mark span{position:absolute;right:0;bottom:2%;font-family:var(--display-font,inherit);font-size:clamp(34px,5vw,72px);color:var(--accent-text);opacity:.5}
.deck .comp-split{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(20px,4vw,64px);align-items:center}
.deck .comp.mirror .comp-split{grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr)}
.deck .comp.mirror .comp-split>.comp-main{order:2}
.deck .comp.mirror .comp-split>.comp-side{order:1}
.deck .comp-signals{list-style:none;margin:var(--comp-gap) 0 0;padding:0;display:flex;flex-direction:column;gap:12px}
.deck .comp-signal{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;border-top:var(--line) solid color-mix(in srgb,var(--muted) 45%,transparent);padding-top:10px}
.deck .comp-signal-index{font-size:12px;letter-spacing:.12em;color:var(--accent-text);line-height:1.5}
.deck .comp-signal h3{font-size:clamp(15px,1.4vw,19px);line-height:1.25;margin:0;letter-spacing:-.01em}
.deck .comp-signal p{font-size:13px;line-height:1.45;color:var(--muted);margin:3px 0 0}
.deck .comp-compare{display:grid;grid-template-columns:minmax(0,1fr) var(--line) minmax(0,1fr);gap:clamp(14px,2.4vw,34px);margin-top:var(--comp-gap);align-items:stretch}
.deck .comp.mirror .comp-compare .compare-side:first-of-type{order:3}
.deck .comp.mirror .comp-compare .compare-divider{order:2}
.deck .comp.mirror .comp-compare .compare-side:last-of-type{order:1}
.deck .compare-divider{display:block;background:color-mix(in srgb,var(--muted) 55%,transparent)}
.deck .compare-side{border-top:var(--line) solid color-mix(in srgb,var(--muted) 55%,transparent);padding-top:14px;min-width:0}
.deck .compare-side.is-focus{border-top-color:var(--accent)}
.deck .compare-side.is-focus h3{color:var(--accent-text)}
.deck .compare-role{display:block;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.deck .compare-side h3{font-size:clamp(18px,2vw,26px);line-height:1.15;margin:8px 0 8px;letter-spacing:-.01em}
.deck .compare-side p{font-size:clamp(14px,1.3vw,17px);line-height:1.5;color:var(--muted);margin:0}
.deck .compare-notes{list-style:none;display:flex;gap:18px;margin:14px 0 0;padding:0;font-size:13px;color:var(--muted)}
.deck .compare-notes li{display:flex;gap:6px;min-width:0}
.deck .compare-notes strong{color:var(--ink);font-weight:600;white-space:nowrap}
.deck .comp-process{list-style:none;display:flex;gap:clamp(10px,1.8vw,26px);margin:var(--comp-gap) 0 0;padding:0;position:relative}
.deck .comp-process:before{content:"";position:absolute;left:0;right:0;top:17px;height:var(--line);background:color-mix(in srgb,var(--muted) 50%,transparent)}
.deck .comp.mirror .comp-process{padding-inline-start:clamp(8px,4vw,48px)}
.deck .comp-step{position:relative;flex:1 1 0;min-width:0;padding-top:46px}
.deck .comp-step-node{position:absolute;top:0;left:0;width:34px;height:34px;border:var(--line) solid var(--accent);border-radius:50%;display:grid;place-items:center;background:var(--ground);font-size:12px;color:var(--accent-text);z-index:1}
.deck .comp-step h3{font-size:clamp(14px,1.35vw,18px);line-height:1.2;margin:0 0 6px;letter-spacing:-.01em}
.deck .comp-step p{font-size:13px;line-height:1.4;color:var(--muted);margin:0}
.deck .comp-example{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,.65fr);gap:clamp(18px,3vw,42px);align-items:center}
.deck .comp.mirror .comp-example{grid-template-columns:minmax(0,.65fr) minmax(0,1.35fr)}
.deck .comp.mirror .comp-example .comp-example-figure{order:2}
.deck .comp.mirror .comp-example .comp-example-note{order:1}
.deck .comp-example-figure{margin:0;min-width:0}
.deck .comp-example-figure svg{width:100%;aspect-ratio:8/5;display:block;border:var(--line) solid color-mix(in srgb,var(--ink) 28%,transparent);background:var(--surface)}
.deck .comp-example-figure figcaption{margin-top:8px;font-size:12px;line-height:1.4;color:var(--muted)}
.deck .comp-example-figure figcaption span{display:block;margin-top:3px;font-size:12px;letter-spacing:.1em;text-transform:uppercase}
.deck .comp-example-note{min-width:0}
.deck .comp-result{display:flex;flex-direction:column;justify-content:center}
.deck .comp-result.has-table{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:clamp(20px,3.4vw,52px);align-items:center}
.deck .comp-result-statement{min-width:0}
.deck .comp-result:not(.has-table) .comp-result-statement{max-width:20ch}
.deck .comp-result:not(.has-table) .comp-lead{max-width:44ch}
.deck .comp-next{list-style:none;margin:var(--comp-gap) 0 0;padding:0;display:flex;flex-direction:column}
.deck .comp-next-item{display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px;padding:12px 0;border-top:var(--line) solid color-mix(in srgb,var(--muted) 45%,transparent)}
.deck .comp-next-item:last-child{border-bottom:var(--line) solid color-mix(in srgb,var(--muted) 45%,transparent)}
.deck .comp-next-index{font-family:var(--display-font,inherit);font-size:clamp(16px,1.8vw,24px);line-height:1;color:var(--accent-text)}
.deck .comp-next h3{font-size:clamp(16px,1.7vw,22px);line-height:1.2;margin:0;letter-spacing:-.01em}
.deck .comp-next-meta{display:block;font-size:13px;line-height:1.4;color:var(--muted);margin-top:3px}
.deck .table-scroll{max-width:100%;overflow-x:auto;margin-top:var(--comp-gap);padding-top:10px;border-top:var(--line) solid color-mix(in srgb,var(--muted) 45%,transparent)}
.deck .table-scroll:focus-visible{outline:var(--line) solid var(--accent);outline-offset:4px}
.deck .comp-table{width:100%;min-width:520px;border-collapse:collapse;font-size:13px;line-height:1.4}
.deck .comp-table caption{text-align:left;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);padding:0 0 8px}
.deck .comp-table th,.deck .comp-table td{text-align:left;padding:8px 12px;border-bottom:var(--line) solid color-mix(in srgb,var(--muted) 35%,transparent);vertical-align:top}
.deck .comp-table thead th{font-family:var(--display-font,inherit);font-weight:400;font-size:13px;letter-spacing:.06em;color:var(--ink)}
.deck .comp-table tbody th{font-weight:600;color:var(--ink)}
@media (max-width:820px){
  .deck .comp-cover-grid,.deck .comp-split,.deck .comp-example,.deck .comp-result.has-table{grid-template-columns:1fr}
  .deck .comp.mirror .comp-cover-grid .comp-cover-copy{order:0}
  .deck .comp.mirror .comp-split>.comp-main,.deck .comp.mirror .comp-split>.comp-side{order:0}
  .deck .comp.mirror .comp-example .comp-example-figure,.deck .comp.mirror .comp-example .comp-example-note{order:0}
  .deck .comp-cover-mark{display:none}
  .deck .comp-process{flex-direction:column;padding-inline-start:0}
  .deck .comp-process:before{left:17px;right:auto;top:0;bottom:0;width:var(--line);height:auto}
  .deck .comp-step{padding:0 0 18px 48px}
  .deck .comp-step-node{top:0}
  .deck .comp.mirror .comp-process{padding-inline-start:0}
  .deck .comp-compare{grid-template-columns:1fr;gap:18px}
  .deck .compare-divider{height:var(--line)}
  .deck .comp.mirror .comp-compare .compare-side:first-of-type,.deck .comp.mirror .comp-compare .compare-side:last-of-type{order:0}
  .deck .comp.mirror .comp-compare .compare-divider{order:0}
  .deck .comp-next-item{gap:12px}
  .deck .comp-example-figure svg{max-height:36vh}
}
@media (max-width:820px) and (min-width:601px){
  .deck .comp{max-height:100%}
}`;
