import type { StylePreset, StyleSlug, ValidationIssue, ValidationResult, VisionCheck, VisionReport } from './types.js';
import { getStyle, isStyleSlug } from './styles/presets.js';

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const FONT_RE = /font-family\s*:\s*([^;}{]+)/gi;
const RADIUS_RE = /border-radius\s*:\s*([^;}{]+)/gi;
const BORDER_RE = /border(?:-(?:top|right|bottom|left|width))?\s*:\s*([^;}{]+)/gi;
const SHADOW_RE = /box-shadow\s*:\s*([^;}{]+)/gi;
const DURATION_RE = /(\d*\.?\d+)s\b/g;

function normalizeHex(raw: string): string {
  let hex = raw.replace('#', '').toUpperCase();
  if (hex.length === 3) hex = hex.split('').map((char) => char + char).join('');
  if (hex.length === 4) hex = hex.split('').map((char) => char + char).join('').slice(0, 6);
  if (hex.length === 8) hex = hex.slice(0, 6);
  return `#${hex}`;
}

function firstFamily(declaration: string): string {
  const first = declaration.split(',')[0]?.trim() ?? '';
  return first.replace(/^['"]|['"]$/g, '').trim();
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function styleCss(html: string): string {
  return Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi))
    .map((match) => match[1] ?? '')
    .join('\n');
}

function channelToLinear(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const normalized = normalizeHex(hex).slice(1);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

const CONTRAST_PAIRS: Record<StyleSlug, Array<[keyof StylePreset['palette'], keyof StylePreset['palette'], string]>> = {
  renaissance: [
    ['ink', 'bg', 'body text'],
    ['muted', 'bg', 'secondary text'],
    ['bg', 'deep', 'inverted CTA'],
    ['deep', 'bg', 'labels and small accents'],
  ],
  brutalist: [
    ['ink', 'bg', 'body text'],
    ['ink', 'surface', 'cards'],
    ['ink', 'accent', 'text on acid'],
    ['bg', 'ink', 'inverted footer'],
  ],
  papercraft: [
    ['ink', 'bg', 'body text'],
    ['muted', 'bg', 'secondary text'],
    ['ink', 'surface', 'paper bands'],
    ['bg', 'deep', 'buttons'],
    ['ink', 'accent2', 'quote band'],
  ],
};

function issuesForColors(css: string, preset: StylePreset): { issues: ValidationIssue[]; colors: string[] } {
  const allowed = new Set(Object.values(preset.palette).map((hex) => normalizeHex(hex)));
  const found = new Set(Array.from(css.matchAll(HEX_RE), (match) => normalizeHex(match[0])));
  const issues: ValidationIssue[] = [];
  const unknown = [...found].filter((hex) => !allowed.has(hex));
  for (const hex of unknown) {
    issues.push({
      severity: 'warn',
      code: 'color-outside-palette',
      message: `${hex} is not in the ${preset.name} palette.`,
      fix: `Use one of: ${[...allowed].join(', ')}. If you need a tint, use rgba() of a palette colour.`,
    });
  }
  return { issues, colors: [...found] };
}

function issuesForFonts(css: string, preset: StylePreset): { issues: ValidationIssue[]; fonts: string[] } {
  const firsts = Array.from(css.matchAll(FONT_RE), (match) => firstFamily(match[1] ?? '')).filter(
    (name) => name && !name.startsWith('var('),
  );
  const unique = [...new Set(firsts)];
  const lower = unique.map((name) => name.toLowerCase());
  const issues: ValidationIssue[] = [];

  for (const required of preset.rules.requiredFonts) {
    if (!lower.includes(required.toLowerCase())) {
      issues.push({
        severity: 'error',
        code: 'missing-font',
        message: `${preset.name} requires "${required}", but it is never used.`,
        fix: `Add font-family:'${required}' to the display/body rules.`,
      });
    }
  }

  for (const family of unique) {
    const forbidden = preset.rules.forbiddenFonts.find((font) => font.toLowerCase() === family.toLowerCase());
    if (forbidden) {
      issues.push({
        severity: 'error',
        code: 'forbidden-font',
        message: `"${family}" is forbidden in ${preset.name}.`,
        fix: `Use ${preset.fonts.display} for display and ${preset.fonts.body} for text.`,
      });
    }
  }

  return { issues, fonts: unique };
}

function issuesForRadii(css: string, preset: StylePreset): { issues: ValidationIssue[]; radii: number[] } {
  const [min, max] = preset.rules.radius;
  const values: number[] = [];
  const issues: ValidationIssue[] = [];
  for (const match of css.matchAll(RADIUS_RE)) {
    const raw = match[1] ?? '';
    for (const px of raw.matchAll(/(\d+(?:\.\d+)?)px/g)) {
      const value = Number(px[1]);
      values.push(value);
      if (value < min || value > max) {
        issues.push({
          severity: 'warn',
          code: 'radius-out-of-range',
          message: `border-radius ${value}px is outside ${preset.name}'s ${min}–${max}px range.`,
          fix: min === max ? `Use border-radius:${min}px (or none).` : `Stay between ${min}px and ${max}px.`,
        });
      }
    }
  }
  return { issues, radii: [...new Set(values)] };
}

function issuesForBorders(css: string, preset: StylePreset): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const match of css.matchAll(BORDER_RE)) {
    const raw = match[1] ?? '';
    if (/none|0\b/.test(raw) && !/\d+px/.test(raw)) continue;
    for (const px of raw.matchAll(/(\d+(?:\.\d+)?)px/g)) {
      const value = Number(px[1]);
      if (!preset.rules.borderWidths.includes(value)) {
        issues.push({
          severity: 'warn',
          code: 'border-width',
          message: `Border width ${value}px is not part of ${preset.name} (${preset.rules.borderWidths.join('/')}px).`,
          fix: `Use ${preset.rules.borderWidths.join(' or ')}px borders.`,
        });
      }
    }
  }
  return issues;
}

function issuesForShadows(css: string, preset: StylePreset): ValidationIssue[] {
  const declarations = Array.from(css.matchAll(SHADOW_RE), (match) => (match[1] ?? '').trim()).filter(
    (value) => value && value !== 'none',
  );
  const issues: ValidationIssue[] = [];

  if (preset.slug === 'renaissance') {
    for (const declaration of declarations) {
      issues.push({
        severity: 'warn',
        code: 'shadow-not-allowed',
        message: `Renaissance pages should not use box-shadow (found "${declaration.slice(0, 42)}").`,
        fix: 'Remove it. Depth comes from hairlines and paper tone, not shadows.',
      });
    }
    return issues;
  }

  if (preset.slug === 'brutalist') {
    if (declarations.length === 0) {
      issues.push({
        severity: 'warn',
        code: 'missing-hard-shadow',
        message: 'Brutalist pages need at least one hard offset shadow.',
        fix: 'Add box-shadow:8px 8px 0 #0B0B0B.',
      });
    }
    for (const declaration of declarations) {
      const layer = declaration.split(',')[0] ?? '';
      const parts = layer.match(/-?\d+(?:\.\d+)?/g)?.map(Number);
      if (parts && parts.length >= 3 && parts[2] !== 0) {
        issues.push({
          severity: 'error',
          code: 'soft-shadow-in-brutalist',
          message: `Brutalist shadows must have zero blur (found blur ${parts[2]}px).`,
          fix: `Use box-shadow:${parts[0]}px ${parts[1]}px 0 #0B0B0B.`,
        });
      }
    }
    return issues;
  }

  // Paper craft: at least one soft shadow, no hard 0-blur shadows.
  if (declarations.length === 0) {
    issues.push({
      severity: 'warn',
      code: 'missing-soft-shadow',
      message: 'Paper craft pages need soft, warm shadows to read as layered paper.',
      fix: 'Add box-shadow:0 18px 30px rgba(58,46,40,.18).',
    });
  }
  for (const declaration of declarations) {
    const layer = declaration.split(',')[0] ?? '';
    const parts = layer.match(/-?\d+(?:\.\d+)?/g)?.map(Number);
    if (parts && parts.length >= 3 && parts[2] === 0 && parts[0] === 0 && parts[1] === 0) {
      issues.push({
        severity: 'error',
        code: 'hard-shadow-in-papercraft',
        message: 'Paper craft shadows must be soft; a 0-blur shadow breaks the paper illusion.',
        fix: 'Use a warm blur: 0 18px 30px rgba(58,46,40,.18).',
      });
    }
  }
  return issues;
}

function issuesForMotion(css: string): { issues: ValidationIssue[]; durations: number[] } {
  const durations = Array.from(css.matchAll(DURATION_RE), (match) => Number(match[1])).filter(
    (value) => value >= 0.05 && value <= 10,
  );
  const issues: ValidationIssue[] = [];
  if (durations.some((value) => value > 10)) {
    issues.push({
      severity: 'warn',
      code: 'slow-motion',
      message: 'A transition or animation lasts longer than 10s.',
      fix: 'Keep entrances under 1.2s; ambient loops up to 10s are fine.',
    });
  }
  return { issues, durations: [...new Set(durations)] };
}

function issuesForMarkup(html: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!/<title[^>]*>\s*\S[\s\S]*?<\/title>/i.test(html)) {
    issues.push({ severity: 'error', code: 'missing-title', message: 'The document has no non-empty <title>.', fix: 'Add a title.' });
  }
  if (!/<main[\s>]/i.test(html)) {
    issues.push({ severity: 'warn', code: 'missing-main', message: 'No <main> landmark found.', fix: 'Wrap the page content in <main>.' });
  }
  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  if (h1Count === 0) {
    issues.push({ severity: 'error', code: 'missing-h1', message: 'No <h1> found.', fix: 'Use exactly one h1 with the page headline.' });
  } else if (h1Count > 1) {
    issues.push({ severity: 'warn', code: 'multiple-h1', message: `${h1Count} h1 elements found.`, fix: 'Keep one h1; use h2 for sections.' });
  }
  if (!/<html[^>]+lang=/i.test(html)) {
    issues.push({ severity: 'warn', code: 'missing-lang', message: 'The <html> tag has no lang attribute.', fix: 'Add lang="es" or lang="en".' });
  }
  for (const pattern of ['{{', 'undefined', 'NaN', 'lorem ipsum']) {
    if (html.toLowerCase().includes(pattern.toLowerCase())) {
      issues.push({
        severity: 'error',
        code: 'unresolved-token',
        message: `The HTML contains the placeholder "${pattern}".`,
        fix: 'Replace it with real content before shipping.',
      });
    }
  }
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=/i.test(match[0])) {
      issues.push({ severity: 'warn', code: 'img-alt', message: 'An <img> has no alt attribute.', fix: 'Add alt text, or alt="" if decorative.' });
    }
  }
  return issues;
}

function issuesForContrast(preset: StylePreset): ValidationIssue[] {
  const pairs = preset.slug === 'brutalist'
    ? ([
        ['ink', 'bg', 'body text'],
        ['ink', 'surface', 'cards'],
        ['ink', 'accent', 'text on acid'],
        ['bg', 'ink', 'inverted footer'],
      ] as const)
    : CONTRAST_PAIRS[preset.slug];

  const issues: ValidationIssue[] = [];
  for (const [fg, bg, label] of pairs) {
    const foreground = preset.palette[fg as keyof StylePreset['palette']];
    const background = preset.palette[bg as keyof StylePreset['palette']];
    const ratio = contrastRatio(foreground, background);
    if (ratio < 4.5) {
      issues.push({
        severity: 'warn',
        code: 'contrast',
        message: `${label}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1.`,
        fix: 'Aim for at least 4.5:1 for body text. Keep low-contrast tones for decoration only.',
      });
    }
  }
  return issues;
}

export function visionReport(css: string, preset: StylePreset): VisionReport {
  const sizes = Array.from(css.matchAll(/font-size\s*:\s*([^;}{]+)/gi)).flatMap((match) =>
    Array.from((match[1] ?? '').matchAll(/(\d+(?:\.\d+)?)px/g), (px) => Number(px[1])),
  ).filter((size) => size >= 8 && size <= 300);
  const maxSize = sizes.length ? Math.max(...sizes) : 0;
  const minSize = sizes.length ? Math.min(...sizes) : 1;
  const scale = minSize > 0 ? maxSize / minSize : 0;

  const gradients = (css.match(/(?<!repeating-)(?:linear|radial)-gradient/gi) ?? []).length;
  const bleed = /100vw|calc\(50%\s*-\s*50vw\)|clip-path|grid-template-columns:[^;]*fr[^;]*fr/i.test(css);
  const material = ['feTurbulence', 'inset 0', 'clip-path', 'repeating-linear-gradient', 'stroke-dashoffset', '8px 8px 0', 'border:3px'].filter((marker) =>
    css.includes(marker),
  ).length;
  const gradientBudget = preset.slug === 'brutalist' ? 4 : 0;

  const checks: VisionCheck[] = [
    {
      name: 'scale-jump',
      passed: scale >= 10,
      detail: `max/min font-size = ${scale.toFixed(1)}:1 (target ≥10)`,
    },
    {
      name: 'flat-fields',
      passed: gradients <= gradientBudget,
      detail: `${gradients} gradient(s), budget ${gradientBudget}`,
    },
    {
      name: 'asymmetry-or-bleed',
      passed: bleed,
      detail: bleed ? 'bleed or asymmetric grid found' : 'no full-bleed or asymmetric grid',
    },
    {
      name: 'material',
      passed: material >= 2,
      detail: `${material} physical mark(s) (target ≥2)`,
    },
  ];

  return {
    score: checks.filter((check) => check.passed).length,
    checks,
    note: 'Vision is a heuristic, not a grade. Confirm with human eyes: squint test, replacement test, memory test.',
  };
}

export function validateHtml(html: string, style: StyleSlug): ValidationResult {
  if (!isStyleSlug(style)) {
    throw new Error(`Unknown style "${style}". Use renaissance, brutalist or papercraft.`);
  }
  const preset = getStyle(style);
  const css = stripComments(styleCss(html));
  const issues: ValidationIssue[] = [];

  if (!css.trim()) {
    issues.push({
      severity: 'error',
      code: 'missing-css',
      message: 'No <style> block found: the page cannot follow the editorial system.',
      fix: 'Inline the style tokens and layout CSS in a <style> tag.',
    });
  }

  const colors = issuesForColors(css, preset);
  const fonts = issuesForFonts(css, preset);
  const radii = issuesForRadii(css, preset);
  const borders = issuesForBorders(css, preset);
  const shadows = issuesForShadows(css, preset);
  const motion = issuesForMotion(css);
  const markup = issuesForMarkup(html);
  const contrast = issuesForContrast(preset);

  issues.push(
    ...colors.issues,
    ...fonts.issues,
    ...radii.issues,
    ...borders,
    ...shadows,
    ...motion.issues,
    ...markup,
    ...contrast,
  );

  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.filter((issue) => issue.severity === 'warn').length;
  const infos = issues.filter((issue) => issue.severity === 'info').length;
  const score = Math.max(0, Math.min(100, 100 - errors * 18 - warnings * 6 - infos));
  const grade: ValidationResult['grade'] = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

  return {
    style,
    score,
    grade,
    issues,
    vision: visionReport(css, preset),
    stats: {
      bytes: Buffer.byteLength(html, 'utf8'),
      colors: colors.colors.length,
      fonts: fonts.fonts,
      radii: radii.radii,
      durations: motion.durations,
    },
  };
}

export function formatValidation(result: ValidationResult): string {
  const passed = result.vision.checks.filter((check) => check.passed).map((check) => check.name);
  const failed = result.vision.checks.filter((check) => !check.passed).map((check) => check.name);
  const lines = [
    `${result.grade} · ${result.score}/100 · ${result.style}`,
    `vision ${result.vision.score}/4${failed.length ? ` · missing: ${failed.join(', ')}` : ' · all checks pass'}${passed.length ? ` · ${passed.join(', ')}` : ''}`,
  ];
  if (result.issues.length === 0) {
    lines.push('No craft issues. The page respects the editorial system.');
    return lines.join('\n');
  }
  for (const issue of result.issues) {
    lines.push(`[${issue.severity}] ${issue.code}: ${issue.message}`);
    if (issue.fix) lines.push(`  fix: ${issue.fix}`);
  }
  return lines.join('\n');
}
