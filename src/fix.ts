import type { StyleSlug } from './types.js';
import type { Patch, RichIssue, RichValidationResult, ScoreSnapshot } from './types/validation.js';
import { validateHtml } from './validate.js';
import { getStyle } from './styles/presets.js';
import { nearestPaletteToken } from './a11y.js';

/**
 * The automatic repair loop. It is deliberately conservative: it only replays
 * the machine-applicable patches the validator already emitted, then re-runs
 * the validator. Running it twice is a no-op.
 */

export interface FixResult {
  html: string;
  changed: boolean;
  before: ScoreSnapshot;
  after: ScoreSnapshot;
  fixes: string[];
}

const EMOJI_RE = /\p{Emoji_Presentation}/gu;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function snapshot(result: RichValidationResult): ScoreSnapshot {
  return {
    score: result.score,
    grade: result.grade,
    errors: result.issues.filter((issue) => issue.severity === 'error').length,
    warnings: result.issues.filter((issue) => issue.severity === 'warn').length,
    infos: result.issues.filter((issue) => issue.severity === 'info').length,
  };
}

function collectPatches(issues: RichIssue[]): Patch[] {
  const seen = new Set<string>();
  const patches: Patch[] = [];
  for (const issue of issues) {
    for (const patch of issue.patch ?? []) {
      const key = JSON.stringify(patch);
      if (seen.has(key)) continue;
      seen.add(key);
      patches.push(patch);
    }
  }
  return patches;
}

function appendStyle(html: string, css: string): string {
  const block = `<style>\n${css}\n</style>`;
  const headClose = html.search(/<\/head>/i);
  if (headClose >= 0) return `${html.slice(0, headClose)}${block}\n${html.slice(headClose)}`;
  return `${html}${block}`;
}

function firstHeadingText(html: string): string {
  const heading = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i.exec(html);
  const text = (heading?.[1] ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || 'Untitled page';
}

function normalizeHeadings(html: string): string {
  let level = 0;
  return html.replace(/<h([1-6])\b([^>]*)>([\s\S]*?)<\/h\1\s*>/gi, (_match, _current, attrs, inner) => {
    level = Math.min(level + 1, 6);
    return `<h${level}${attrs}>${inner}</h${level}>`;
  });
}

function ensureMain(html: string): string {
  if (/<main[\s>]/i.test(html)) return html;
  const headerClose = /<\/header>/i.exec(html);
  const bodyOpen = /<body[^>]*>/i.exec(html);
  const openAt = headerClose ? headerClose.index + headerClose[0].length : bodyOpen ? bodyOpen.index + bodyOpen[0].length : 0;
  const footerOpen = /<footer[\s>]/i;
  const afterOpen = html.slice(openAt);
  const footerMatch = footerOpen.exec(afterOpen);
  const closeAt = footerMatch ? openAt + footerMatch.index : html.search(/<\/body>/i);
  const safeClose = closeAt >= 0 ? closeAt : html.length;
  return `${html.slice(0, openAt)}<main id="top">${html.slice(openAt, safeClose)}</main>${html.slice(safeClose)}`;
}

function addAlt(html: string): string {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\balt\s*=/i.test(tag)) return tag;
    return tag.replace(/\s*\/?>$/, ' alt="">');
  });
}

function clampRadius(css: string, min: number, max: number): string {
  return css.replace(/(border-radius\s*:\s*)([^;}{]+)/gi, (_match, prefix: string, value: string) => {
    const clamped = value.replace(/(\d+(?:\.\d+)?)px/g, (_px, raw: string) => {
      const number = Number(raw);
      const target = number < min ? min : number > max ? max : number;
      return `${target}px`;
    });
    return `${prefix}${clamped}`;
  });
}

function clampBorderWidths(css: string, widths: number[]): string {
  const allowed = widths.length ? widths : [1];
  return css.replace(/(border(?:-(?:top|right|bottom|left|width))?\s*:\s*)([^;}{]+)/gi, (_match, prefix: string, value: string) => {
    if (/none|0\b/.test(value) && !/\d+px/.test(value)) return `${prefix}${value}`;
    const clamped = value.replace(/(\d+(?:\.\d+)?)px/g, (_px, raw: string) => {
      const number = Number(raw);
      if (allowed.includes(number)) return `${number}px`;
      const target = allowed.reduce((best, candidate) =>
        Math.abs(candidate - number) < Math.abs(best - number) ? candidate : best,
      allowed[0]!);
      return `${target}px`;
    });
    return `${prefix}${clamped}`;
  });
}

function replaceFont(html: string, family: string, withFamily: string): string {
  const pattern = new RegExp(`(^|,\\s*)['"]?${escapeRegExp(family)}['"]?`, 'i');
  return html.replace(/(font-family\s*:\s*)([^;}{]+)/gi, (_match, prefix: string, declaration: string) => {
    if (!pattern.test(declaration)) return `${prefix}${declaration}`;
    return `${prefix}${declaration.replace(pattern, `$1'${withFamily}'`)}`;
  });
}

function replaceShadow(html: string, withValue: string): string {
  return html.replace(/box-shadow\s*:\s*[^;}{]+/gi, `box-shadow:${withValue}`);
}

function brutalistShadow(html: string, ink: string): string {
  return html.replace(/box-shadow\s*:\s*([^;}{]+)/gi, (_match, value: string) => {
    const layer = value.split(',')[0] ?? value;
    const parts = layer.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    const x = parts[0] ?? 8;
    const y = parts[1] ?? 8;
    return `box-shadow:${x}px ${y}px 0 ${ink}`;
  });
}

function papercraftShadow(html: string): string {
  return html.replace(/box-shadow\s*:\s*[^;}{]+/gi, 'box-shadow:0 18px 30px rgba(58,46,40,.18)');
}

function removeElement(html: string, tag: string): string {
  const pattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>|<${tag}\\b[^>]*/?>`, 'gi');
  return html.replace(pattern, '');
}

function snapPaletteColors(html: string, style: StyleSlug): string {
  const preset = getStyle(style);
  const allowed = new Set(Object.values(preset.palette).map((hex) => hex.toUpperCase()));
  return html.replace(/#[0-9a-fA-F]{3,8}\b/g, (hex) => {
    if (allowed.has(hex.toUpperCase())) return hex;
    return nearestPaletteToken(hex, preset.palette).hex;
  });
}

function clampOverflow(html: string): string {
  const css = Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
    .map((match) => match[1] ?? '')
    .join('\n');
  const rules: string[] = [];
  if (!/overflow-x\s*:\s*hidden/i.test(css)) rules.push('html,body{overflow-x:hidden;max-width:100%}');
  if (!/max-width\s*:\s*100%/i.test(css)) rules.push('img,svg,video,canvas{max-width:100%;height:auto}');
  if (!/overflow-wrap\s*:\s*anywhere/i.test(css)) {
    rules.push('@media (max-width:380px){html body{overflow-wrap:anywhere;word-break:break-word}}');
  }
  if (!rules.length) return html;
  return appendStyle(html, rules.join('\n'));
}

function ensureReducedMotion(html: string): string {
  const css = Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
    .map((match) => match[1] ?? '')
    .join('\n');
  if (/prefers-reduced-motion\s*:\s*reduce/i.test(css)) return html;
  return appendStyle(
    html,
    '@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}',
  );
}

function capDuration(html: string, max: number): string {
  return html.replace(/(\d*\.?\d+)s\b/g, (match, raw: string) => {
    const value = Number(raw);
    return value > max ? `${max}s` : match;
  });
}

function stripPlaceholder(html: string, token: string): string {
  if (token === 'lorem ipsum') return html.replace(/lorem ipsum/gi, '');
  if (token === 'undefined') return html.replace(/\bundefined\b/gi, '');
  if (token === 'NaN') return html.replace(/\bNaN\b/gi, '');
  return html.split(token).join('');
}

function applyPatch(html: string, style: StyleSlug, patch: Patch): string {
  const preset = getStyle(style);
  const params = patch.params ?? {};
  switch (patch.op) {
    case 'set-lang':
      return /<html[^>]+\blang=/i.test(html) ? html : html.replace(/<html\b/i, '<html lang="en"');
    case 'ensure-title':
      return /<title[^>]*>\s*\S/i.test(html)
        ? html
        : html.replace(/<head[^>]*>/i, (head) => `${head}\n<title>${firstHeadingText(html)}</title>`);
    case 'ensure-viewport':
      return /<meta[^>]+name="viewport"/i.test(html)
        ? html
        : html.replace(/<head[^>]*>/i, (head) => `${head}\n<meta name="viewport" content="width=device-width, initial-scale=1">`);
    case 'add-alt':
      return addAlt(html);
    case 'normalize-headings':
      return normalizeHeadings(html);
    case 'ensure-skip-link':
      return /class="[^"]*skip-link/.test(html)
        ? html
        : html.replace(/<body[^>]*>/i, (body) => `${body}\n<a class="skip-link" href="#top">Skip to content</a>`);
    case 'ensure-main':
      return ensureMain(html);
    case 'snap-palette-colors':
      return snapPaletteColors(html, style);
    case 'replace-hex': {
      const from = params.from;
      const to = params.to;
      if (!from || !to) return html;
      return html.replace(new RegExp(escapeRegExp(from), 'gi'), to);
    }
    case 'clamp-overflow':
      return clampOverflow(html);
    case 'radius-to-range': {
      const min = Number(params.min ?? 0);
      const max = Number(params.max ?? min);
      return clampRadius(html, min, max);
    }
    case 'border-width':
      return clampBorderWidths(html, (params.widths ?? '1').split(',').map(Number));
    case 'replace-font':
      return params.family ? replaceFont(html, params.family, params.with ?? preset.fonts.display) : html;
    case 'replace-shadow':
      return replaceShadow(html, params.with ?? 'none');
    case 'brutalist-shadow':
      return brutalistShadow(html, preset.palette.deep);
    case 'papercraft-shadow':
      return papercraftShadow(html);
    case 'remove-element':
      return params.tag ? removeElement(html, params.tag) : html;
    case 'strip-emoji':
      return html.replace(EMOJI_RE, '');
    case 'strip-placeholder':
      return params.token ? stripPlaceholder(html, params.token) : html;
    case 'ensure-reduced-motion':
      return ensureReducedMotion(html);
    case 'cap-duration':
      return capDuration(html, Number(params.max ?? 1.2));
    default: {
      const exhaustive: never = patch.op;
      return exhaustive;
    }
  }
}

function describe(patch: Patch): string {
  const target = patch.params?.family ?? patch.params?.token ?? patch.params?.tag ?? '';
  return `${patch.op}${target ? ` (${target})` : ''}`;
}

export function fixHtml(html: string, style: StyleSlug, options: { maxPasses?: number } = {}): FixResult {
  const maxPasses = options.maxPasses ?? 3;
  let current = html;
  const before = snapshot(validateHtml(current, style));
  const fixes: string[] = [];

  for (let pass = 0; pass < maxPasses; pass += 1) {
    const report = validateHtml(current, style);
    const patches = collectPatches(report.issues);
    if (patches.length === 0) break;
    let next = current;
    for (const patch of patches) {
      const candidate = applyPatch(next, style, patch);
      if (candidate !== next) {
        next = candidate;
        fixes.push(describe(patch));
      }
    }
    if (next === current) break;
    current = next;
  }

  const after = snapshot(validateHtml(current, style));
  return { html: current, changed: current !== html, before, after, fixes };
}
