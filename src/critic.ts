import type { StylePreset, StyleSlug } from './types.js';
import type { CriticCategory, CriticReport } from './types/critic.js';
import { getStyle, isStyleSlug, styleSlugs } from './styles/presets.js';
import { PALETTE_TEXT_PAIRS, paletteContrastFailures } from './a11y.js';

/**
 * The critic reads a page the way an art director would: structure is assumed,
 * then hierarchy, line length, density, whitespace, contrast, motion, labelling
 * and the style's own "never" list are graded on their own.
 */

function cssOf(html: string): string {
  return Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
    .map((match) => match[1] ?? '')
    .join('\n');
}

function bodyOf(html: string): string {
  return html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html;
}

function textOf(markup: string): string {
  return markup
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(markup: string): number {
  const text = textOf(markup);
  return text ? text.split(' ').length : 0;
}

function pxSizes(css: string, property: RegExp): number[] {
  return Array.from(css.matchAll(property), (match) => {
    const values = (match[1] ?? '').match(/(\d+(?:\.\d+)?)px/g) ?? [];
    return values.map((value) => Number(value.replace('px', '')));
  }).flat();
}

function ratioScore(ratio: number): number {
  if (ratio >= 10) return 100;
  if (ratio >= 6) return 85;
  if (ratio >= 4) return 70;
  if (ratio >= 2) return 45;
  return 25;
}

function hierarchy(preset: StylePreset, html: string, css: string): CriticCategory {
  const findings: string[] = [];
  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  const sizes = pxSizes(css, /font-size\s*:\s*([^;}{]+)/gi).filter((size) => size >= 8 && size <= 300);
  const ratio = sizes.length ? Math.max(...sizes) / Math.min(...sizes) : 0;

  const h1Score = h1Count === 1 ? 100 : h1Count === 0 ? 35 : 55;
  if (h1Count === 0) findings.push('There is no <h1>: the page has no single promise.');
  if (h1Count > 1) findings.push(`${h1Count} <h1> elements: the outline is flat, keep one headline.`);
  if (ratio < 4) findings.push(`Type scale is ${ratio.toFixed(1)}:1; a page needs a clear size jump (≥4:1, target 10:1).`);

  return {
    name: 'hierarchy',
    label: 'Visual hierarchy',
    score: Math.round((h1Score + ratioScore(ratio)) / 2),
    findings,
  };
}

function lastCompound(part: string): string {
  const pieces = part.split(/[\s>+~]+/).filter(Boolean);
  return (pieces[pieces.length - 1] ?? '').toLowerCase();
}

const PROSE_CLASSES = ['prose', 'intro', 'tagline', 'lede', 'manifesto', 'body', 'copy', 'text', 'note', 'summary'];

function isProseSelector(selector: string): boolean {
  return selector.split(',').some((part) => {
    const compound = lastCompound(part);
    if (['p', 'li', 'blockquote'].includes(compound)) return true;
    const className = compound.replace(/^\./, '').split(/[:#[\]]/)[0] ?? '';
    return PROSE_CLASSES.some((keyword) => className === keyword || className.endsWith(`-${keyword}`));
  });
}

/** Reads the measure of prose selectors only; headings legitimately use short ch. */
function proseMeasures(css: string): number[] {
  const measures: number[] = [];
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  for (const match of css.matchAll(ruleRe)) {
    const selector = (match[1] ?? '').trim().toLowerCase();
    const declarations = match[2] ?? '';
    if (!isProseSelector(selector)) continue;
    const ch = /max-width\s*:\s*(\d+(?:\.\d+)?)ch/i.exec(declarations);
    if (ch) {
      measures.push(Number(ch[1]));
      continue;
    }
    const em = /max-width\s*:\s*(\d+(?:\.\d+)?)(em|rem)/i.exec(declarations);
    if (em) {
      measures.push(Number(em[1]) * 2);
      continue;
    }
    const px = /max-width\s*:\s*(\d+(?:\.\d+)?)px/i.exec(declarations);
    if (px) measures.push(Number(px[1]) / 8);
  }
  return measures;
}

function lineLength(css: string): CriticCategory {
  const findings: string[] = [];
  const values = proseMeasures(css);
  if (values.length === 0) {
    findings.push('No prose max-width: the measure is uncontrolled on wide screens.');
    return { name: 'line-length', label: 'Line length', score: 40, findings };
  }
  const inRange = values.filter((value) => value >= 45 && value <= 75);
  const near = values.filter((value) => value >= 35 && value <= 85);
  if (inRange.length !== values.length) {
    findings.push(`Body measure ${values.map((value) => Math.round(value)).join(', ')}ch: keep body text between 45 and 75ch.`);
  }
  return {
    name: 'line-length',
    label: 'Line length',
    score: inRange.length === values.length ? 100 : near.length === values.length ? 70 : 45,
    findings,
  };
}

function density(html: string): CriticCategory {
  const findings: string[] = [];
  const sections = html.match(/<section\b[^>]*>[\s\S]*?<\/section>/gi) ?? [];
  const blocks = sections.length ? sections : [bodyOf(html)];
  const counts = blocks.map((block) => wordCount(block));
  if (counts.length === 0 || counts.every((count) => count === 0)) {
    findings.push('The page has no readable prose to measure.');
    return { name: 'density', label: 'Text density', score: 30, findings };
  }
  const inRange = counts.filter((count) => count >= 20 && count <= 140).length;
  counts.forEach((count, index) => {
    if (count > 180) findings.push(`Section ${index + 1} has ${count} words; it reads as a wall, not a section.`);
    else if (count < 20) findings.push(`Section ${index + 1} has ${count} words; it is too thin to hold an idea.`);
  });
  return {
    name: 'density',
    label: 'Text density',
    score: Math.round((inRange / counts.length) * 100),
    findings,
  };
}

function whitespace(css: string, html: string): CriticCategory {
  const findings: string[] = [];
  const spacing = pxSizes(css, /padding(?:-block|-top|-bottom|-inline)?\s*:\s*([^;}{]+)/gi);
  const maxSpacing = spacing.length ? Math.max(...spacing) : 0;
  const distinct = new Set(spacing).size;
  const generous = maxSpacing >= 64;
  const rhythm = distinct > 0 && distinct <= 40;
  const printable = /@media\s+print/i.test(css);
  if (!generous) findings.push('Vertical padding never reaches 64px: sections feel cramped.');
  if (!rhythm) findings.push(`${distinct} distinct spacing values: the vertical rhythm is noisy.`);
  if (!printable) findings.push('No @media print: the page is not shippable as a document.');
  return {
    name: 'whitespace',
    label: 'Whitespace rhythm',
    score: Math.min(100, (generous ? 40 : 0) + (rhythm ? 30 : 0) + (printable ? 30 : 0)),
    findings,
  };
}

function contrast(preset: StylePreset, style: StyleSlug): CriticCategory {
  const pairs = PALETTE_TEXT_PAIRS[style] ?? [];
  const failures = paletteContrastFailures(preset.palette, pairs);
  return {
    name: 'contrast',
    label: 'Contrast pairs',
    score: pairs.length ? Math.round(((pairs.length - failures.length) / pairs.length) * 100) : 100,
    findings: failures.map(
      (failure) => `${failure.label}: ${failure.fg} on ${failure.bg} is ${failure.ratio.toFixed(2)}:1 (needs ${failure.required}:1).`,
    ),
  };
}

function motion(css: string): CriticCategory {
  const findings: string[] = [];
  const reduced = /prefers-reduced-motion\s*:\s*reduce/i.test(css);
  const durations = Array.from(css.matchAll(/(\d*\.?\d+)s\b/g), (match) => Number(match[1])).filter(
    (value) => value >= 0.05 && value <= 60,
  );
  const tooLong = durations.filter((value) => value > 10);
  const animations = Array.from(css.matchAll(/animation\s*:\s*([^;{}]+)/gi), (match) => match[1] ?? '');
  const strobe = animations.some((declaration) => {
    if (!/\binfinite\b/i.test(declaration)) return false;
    const duration = /(\d*\.?\d+)s\b/.exec(declaration);
    return duration ? Number(duration[1]) > 0 && Number(duration[1]) < 0.5 : false;
  });
  if (!reduced) findings.push('No prefers-reduced-motion fallback: motion-sensitive visitors get the full effect.');
  if (tooLong.length) findings.push(`Animation runs ${tooLong.join(', ')}s; keep entrances under 1.2s.`);
  if (strobe) findings.push('A fast infinite animation can trigger photosensitive reactions.');
  return {
    name: 'motion',
    label: 'Motion safety',
    score: Math.min(100, (reduced ? 50 : 0) + (tooLong.length ? 0 : 30) + (strobe ? 0 : 20)),
    findings,
  };
}

/** Finds the opening tag immediately before a match, ignoring whitespace. */
function precedingTag(html: string, index: number): string | null {
  const before = html.slice(0, index);
  const match = /<([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^'">])*?)>\s*$/i.exec(before);
  return match ? `${match[1]}${match[2] ?? ''}` : null;
}

function labelling(html: string): CriticCategory {
  const findings: string[] = [];
  const images = Array.from(html.matchAll(/<img\b[^>]*>/gi));
  const svgs = Array.from(html.matchAll(/<svg\b[^>]*>/gi));
  let total = images.length + svgs.length;
  let labelled = 0;

  for (const image of images) {
    if (/\balt=/i.test(image[0])) labelled += 1;
    else findings.push('An <img> has no alt attribute: a screen reader announces a filename.');
  }
  for (const svg of svgs) {
    const tag = svg[0];
    const parent = precedingTag(html, svg.index ?? 0);
    const decorative =
      /\baria-hidden\s*=\s*["']true["']/i.test(tag) ||
      (parent !== null && /\baria-hidden\s*=\s*["']true["']/i.test(parent));
    const roleImg = /\brole\s*=\s*["']img["']/i.test(tag);
    const hasLabel =
      /\baria-label\s*=/i.test(tag) ||
      /\baria-labelledby\s*=/i.test(tag) ||
      /<title[\s>]/i.test(html.slice(svg.index ?? 0, (svg.index ?? 0) + 400));
    if (decorative || (roleImg && hasLabel) || hasLabel) labelled += 1;
    else findings.push('An <svg> is neither decorative (aria-hidden) nor labelled (role="img" + aria-label).');
  }
  if (total === 0) {
    total = 1;
    labelled = 1;
  }
  return { name: 'labelling', label: 'Image/graphic labelling', score: Math.round((labelled / total) * 100), findings };
}

const EMOJI_RE = /\p{Emoji_Presentation}/u;
const PRESENTATIONAL = ['center', 'font', 'marquee', 'blink', 'big', 'strike', 'tt'];

function styleNever(preset: StylePreset, html: string, css: string): CriticCategory {
  const findings: string[] = [];
  const text = textOf(html);
  const lowerCss = css.toLowerCase();

  if (/lorem ipsum/i.test(text)) findings.push('Placeholder copy: replace the lorem ipsum with real words.');
  if (EMOJI_RE.test(text)) findings.push('Emoji in copy: the editorial system draws its own marks.');
  for (const tag of PRESENTATIONAL) {
    if (new RegExp(`<${tag}[\\s>]`, 'i').test(html)) findings.push(`Presentational <${tag}> element: use CSS instead.`);
  }

  const usedFonts = new Set(
    Array.from(css.matchAll(/font-family\s*:\s*([^;}{]+)/gi), (match) =>
      (match[1] ?? '')
        .split(',')[0]
        ?.trim()
        .replace(/^['"]|['"]$/g, '')
        .toLowerCase(),
    ).filter(Boolean),
  );
  const forbiddenFonts = preset.rules.forbiddenFonts.filter((font) => usedFonts.has(font.toLowerCase()));
  for (const font of forbiddenFonts) findings.push(`"${font}" is on the style's Never list.`);

  const [minRadius, maxRadius] = preset.rules.radius;
  const radii = pxSizes(css, /border-radius\s*:\s*([^;}{]+)/gi);
  if (maxRadius === 0 && radii.some((radius) => radius > 0)) {
    findings.push('Rounded corners are forbidden in this style.');
  }

  const softShadow = /box-shadow\s*:[^;{}]*\b\d+px\s+\d+px\s+(?!0\b)\d+px/i.test(css);
  if (softShadow) {
    for (const rule of preset.guidance.dont) {
      if (/soft|drop|blur|shadow/i.test(rule)) {
        findings.push(`Soft shadows are forbidden: ${rule}`);
        break;
      }
    }
  }

  const score = Math.max(0, 100 - findings.length * 15);
  return { name: 'style-never', label: 'Style Never rules', score, findings };
}

export function criticReport(html: string, style: StyleSlug): CriticReport {
  if (!isStyleSlug(style)) {
    throw new Error(`Unknown style "${style}". Use one of: ${styleSlugs.join(', ')}.`);
  }
  const preset = getStyle(style);
  const css = cssOf(html);

  const categories = [
    hierarchy(preset, html, css),
    lineLength(css),
    density(html),
    whitespace(css, html),
    contrast(preset, style),
    motion(css),
    labelling(html),
    styleNever(preset, html, css),
  ];

  const score = Math.round(categories.reduce((sum, category) => sum + category.score, 0) / categories.length);
  const grade: CriticReport['grade'] = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  const topFixes = [...categories]
    .sort((a, b) => a.score - b.score)
    .flatMap((category) => category.findings.map((finding) => `${category.label}: ${finding}`))
    .slice(0, 3);

  return { style, score, grade, categories, topFixes };
}

export function formatCritic(report: CriticReport): string {
  const lines = [`critic ${report.grade} · ${report.score}/100 · ${report.style}`];
  for (const category of report.categories) {
    lines.push(`  ${category.score.toString().padStart(3)}  ${category.label}${category.findings.length ? ` — ${category.findings[0]}` : ''}`);
  }
  if (report.topFixes.length) {
    lines.push('top fixes:');
    for (const fix of report.topFixes) lines.push(`  - ${fix}`);
  } else {
    lines.push('No editorial problems detected by the critic.');
  }
  return lines.join('\n');
}
