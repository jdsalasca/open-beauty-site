import type { StylePreset, StyleSlug, ValidationResult, VisionCheck, VisionReport } from './types.js';
import type { Patch, RichIssue, RichValidationResult } from './types/validation.js';
import { DECK_POINT_LIMIT, DECK_STAT_LIMIT, DECK_TOTAL_SLIDE_LIMIT, DECK_WORD_LIMIT } from './types/deck.js';
import { getStyle, isStyleSlug, styleSlugs } from './styles/presets.js';
import { contrastRatio, headlineOverflows360, HEADLINE_VIEWPORT, longestWordLength, nearestPaletteToken, relativeLuminance } from './a11y.js';
import { ctaHasDestination } from './page/composition.js';

export { contrastRatio, relativeLuminance as luminance } from './a11y.js';

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const FONT_RE = /font-family\s*:\s*([^;}{]+)/gi;
const RADIUS_RE = /border-radius\s*:\s*([^;}{]+)/gi;
const BORDER_RE = /border(?:-(?:top|right|bottom|left|width))?\s*:\s*([^;}{]+)/gi;
const SHADOW_RE = /box-shadow\s*:\s*([^;}{]+)/gi;
const DURATION_RE = /(\d*\.?\d+)s\b/g;
const EMOJI_RE = /\p{Emoji_Presentation}/u;
const PRESENTATIONAL_TAGS = ['center', 'font', 'marquee', 'blink', 'big', 'strike', 'tt'];

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

function mkIssue(
  severity: RichIssue['severity'],
  code: string,
  message: string,
  where: string,
  why: string,
  example: string,
  fix: string,
  patch: Patch[] = [],
): RichIssue {
  return { severity, code, message, where, why, example, fix, patch };
}

const CONTRAST_PAIRS: Partial<Record<StyleSlug, Array<[keyof StylePreset['palette'], keyof StylePreset['palette'], string]>>> = {
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

function issuesForColors(css: string, preset: StylePreset): { issues: RichIssue[]; colors: string[] } {
  const allowed = new Set(Object.values(preset.palette).map((hex) => normalizeHex(hex)));
  // Keep the raw spelling of every hex so `fix` can match #fff and #ffffff alike.
  const rawByNormalized = new Map<string, Set<string>>();
  for (const match of css.matchAll(HEX_RE)) {
    const normalized = normalizeHex(match[0]);
    const raws = rawByNormalized.get(normalized) ?? new Set<string>();
    raws.add(match[0]);
    rawByNormalized.set(normalized, raws);
  }
  const issues: RichIssue[] = [];
  const unknown = [...rawByNormalized.keys()].filter((hex) => !allowed.has(hex));
  for (const hex of unknown) {
    const token = nearestPaletteToken(hex, preset.palette);
    const raws = [...(rawByNormalized.get(hex) ?? [])];
    issues.push(
      mkIssue(
        'warn',
        'color-outside-palette',
        `${hex} is not in the ${preset.name} palette.`,
        'the <style> block',
        `A colour outside the palette breaks the ${preset.name} reading: the page stops looking art-directed and starts looking assembled.`,
        `${raws.join(', ')} -> ${token.hex} (${token.role})`,
        `Use one of: ${[...allowed].join(', ')}. The nearest token is ${token.hex} (${token.role}).`,
        [
          ...raws.map((from) => ({ op: 'replace-hex' as const, params: { from, to: token.hex } })),
          { op: 'snap-palette-colors' as const },
        ],
      ),
    );
  }
  return { issues, colors: [...rawByNormalized.keys()] };
}

function issuesForFonts(css: string, preset: StylePreset): { issues: RichIssue[]; fonts: string[] } {
  const firsts = Array.from(css.matchAll(FONT_RE), (match) => firstFamily(match[1] ?? '')).filter(
    (name) => name && !name.startsWith('var('),
  );
  const unique = [...new Set(firsts)];
  const lower = unique.map((name) => name.toLowerCase());
  const issues: RichIssue[] = [];

  for (const required of preset.rules.requiredFonts) {
    if (!lower.includes(required.toLowerCase())) {
      issues.push(
        mkIssue(
          'error',
          'missing-font',
          `${preset.name} requires "${required}", but it is never used.`,
          'the <style> block',
          `The display/body faces are the voice of ${preset.name}. Without "${required}" the page reads as a default system font and loses the style.`,
          `body{font-family:'${required}', Georgia, serif}`,
          `Add font-family:'${required}' to the display or body rules.`,
        ),
      );
    }
  }

  for (const family of unique) {
    const forbidden = preset.rules.forbiddenFonts.find((font) => font.toLowerCase() === family.toLowerCase());
    if (forbidden) {
      issues.push(
        mkIssue(
          'error',
          'forbidden-font',
          `"${family}" is forbidden in ${preset.name}.`,
          'the <style> block',
          `"${family}" is the generic web default. ${preset.name} is recognised by ${preset.fonts.display} and ${preset.fonts.body}; the default face makes it look machine-made.`,
          `font-family:${preset.fonts.display}`,
          `Use ${preset.fonts.display} for display and ${preset.fonts.body} for text.`,
          [{ op: 'replace-font', params: { family, with: preset.fonts.display } }],
        ),
      );
    }
  }

  return { issues, fonts: unique };
}

function issuesForRadii(css: string, preset: StylePreset): { issues: RichIssue[]; radii: number[] } {
  const [min, max] = preset.rules.radius;
  const values: number[] = [];
  const issues: RichIssue[] = [];
  for (const match of css.matchAll(RADIUS_RE)) {
    const raw = match[1] ?? '';
    for (const px of raw.matchAll(/(\d+(?:\.\d+)?)px/g)) {
      const value = Number(px[1]);
      values.push(value);
      if (value < min || value > max) {
        const target = value < min ? min : max;
        issues.push(
          mkIssue(
            'warn',
            'radius-out-of-range',
            `border-radius ${value}px is outside ${preset.name}'s ${min}–${max}px range.`,
            'the <style> block',
            `${preset.name} controls the corner geometry on purpose: ${min === max ? `${min}px` : `${min}–${max}px`} keeps every shape inside the same visual grammar.`,
            `border-radius:${target}px`,
            min === max ? `Use border-radius:${min}px (or none).` : `Stay between ${min}px and ${max}px.`,
            [{ op: 'radius-to-range', params: { min: String(min), max: String(max) } }],
          ),
        );
      }
    }
  }
  return { issues, radii: [...new Set(values)] };
}

function issuesForBorders(css: string, preset: StylePreset): RichIssue[] {
  const issues: RichIssue[] = [];
  for (const match of css.matchAll(BORDER_RE)) {
    const raw = match[1] ?? '';
    if (/none|0\b/.test(raw) && !/\d+px/.test(raw)) continue;
    for (const px of raw.matchAll(/(\d+(?:\.\d+)?)px/g)) {
      const value = Number(px[1]);
      if (!preset.rules.borderWidths.includes(value)) {
        const allowed = preset.rules.borderWidths;
        const target = allowed.reduce((best, candidate) =>
          Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best,
        allowed[0]!);
        issues.push(
          mkIssue(
            'warn',
            'border-width',
            `Border width ${value}px is not part of ${preset.name} (${allowed.join('/')}px).`,
            'the <style> block',
            `Border weight is a rhythm decision in ${preset.name}. A stray width makes hairlines and frames disagree.`,
            `border-width:${target}px`,
            `Use ${allowed.join(' or ')}px borders.`,
            [{ op: 'border-width', params: { widths: allowed.join(',') } }],
          ),
        );
      }
    }
  }
  return issues;
}

function issuesForShadows(css: string, preset: StylePreset): RichIssue[] {
  const declarations = Array.from(css.matchAll(SHADOW_RE), (match) => (match[1] ?? '').trim()).filter(
    (value) => value && value !== 'none',
  );
  const issues: RichIssue[] = [];

  if (preset.slug === 'renaissance') {
    for (const declaration of declarations) {
      issues.push(
        mkIssue(
          'warn',
          'shadow-not-allowed',
          `Renaissance pages should not use box-shadow (found "${declaration.slice(0, 42)}").`,
          'the <style> block',
          'Renaissance depth comes from hairlines and plaster tone. A shadow reads as a generic card and flattens the fresco.',
          'box-shadow:none',
          'Remove it. Depth comes from hairlines and paper tone, not shadows.',
          [{ op: 'replace-shadow', params: { with: 'none' } }],
        ),
      );
    }
    return issues;
  }

  if (preset.slug === 'brutalist') {
    if (declarations.length === 0) {
      issues.push(
        mkIssue(
          'warn',
          'missing-hard-shadow',
          'Brutalist pages need at least one hard offset shadow.',
          'the <style> block',
          'The hard offset is the Brutalist signature: without it the page is just black text on paper.',
          'box-shadow:8px 8px 0 #0B0B0B',
          'Add box-shadow:8px 8px 0 #0B0B0B.',
        ),
      );
    }
    for (const declaration of declarations) {
      const layer = declaration.split(',')[0] ?? '';
      const parts = layer.match(/-?\d+(?:\.\d+)?/g)?.map(Number);
      if (parts && parts.length >= 3 && parts[2] !== 0) {
        issues.push(
          mkIssue(
            'error',
            'soft-shadow-in-brutalist',
            `Brutalist shadows must have zero blur (found blur ${parts[2]}px).`,
            'the <style> block',
            'A blurred shadow is the opposite of the Brutalist grammar: hard edges, no softness, no gradient.',
            `box-shadow:${parts[0]}px ${parts[1]}px 0 #0B0B0B`,
            `Use box-shadow:${parts[0]}px ${parts[1]}px 0 #0B0B0B.`,
            [{ op: 'brutalist-shadow' }],
          ),
        );
      }
    }
    return issues;
  }

  // Paper craft: at least one soft shadow, no hard 0-blur shadows.
  if (preset.slug !== 'papercraft') return issues;
  if (declarations.length === 0) {
    issues.push(
      mkIssue(
        'warn',
        'missing-soft-shadow',
        'Paper craft pages need soft, warm shadows to read as layered paper.',
        'the <style> block',
        'The layered-paper illusion depends on a warm soft shadow; flat cards look like a spreadsheet.',
        'box-shadow:0 18px 30px rgba(58,46,40,.18)',
        'Add box-shadow:0 18px 30px rgba(58,46,40,.18).',
      ),
    );
  }
  for (const declaration of declarations) {
    const layer = declaration.split(',')[0] ?? '';
    const parts = layer.match(/-?\d+(?:\.\d+)?/g)?.map(Number);
    if (parts && parts.length >= 3 && parts[2] === 0 && parts[0] === 0 && parts[1] === 0) {
      issues.push(
        mkIssue(
          'error',
          'hard-shadow-in-papercraft',
          'Paper craft shadows must be soft; a 0-blur shadow breaks the paper illusion.',
          'the <style> block',
          'A 0-blur shadow is the Brutalist move. In Paper Craft it reads as a mistake, not as depth.',
          'box-shadow:0 18px 30px rgba(58,46,40,.18)',
          'Use a warm blur: 0 18px 30px rgba(58,46,40,.18).',
          [{ op: 'papercraft-shadow' }],
        ),
      );
    }
  }
  return issues;
}

function issuesForMotion(css: string): { issues: RichIssue[]; durations: number[] } {
  const durations = Array.from(css.matchAll(DURATION_RE), (match) => Number(match[1])).filter(
    (value) => value >= 0.05 && value <= 10,
  );
  const issues: RichIssue[] = [];
  if (durations.some((value) => value > 10)) {
    issues.push(
      mkIssue(
        'warn',
        'slow-motion',
        'A transition or animation lasts longer than 10s.',
        'the <style> block',
        'A 10s+ entrance feels broken, not cinematic. Motion should arrive and then get out of the way.',
        'animation-duration:1s',
        'Keep entrances under 1.2s; ambient loops up to 10s are fine.',
      ),
    );
  }
  return { issues, durations: [...new Set(durations)] };
}

function issuesForMarkup(html: string): RichIssue[] {
  const issues: RichIssue[] = [];
  if (!/<meta[^>]+name="viewport"/i.test(html)) {
    issues.push(
      mkIssue(
        'warn',
        'missing-viewport',
        'The document has no viewport meta tag.',
        'the <head> of the document',
        'Without width=device-width the page renders at desktop width on a phone and the user has to pinch to read it.',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        'Add the viewport meta tag.',
        [{ op: 'ensure-viewport' }],
      ),
    );
  }
  if (!/class="[^"]*skip-link/.test(html)) {
    issues.push(
      mkIssue(
        'warn',
        'missing-skip-link',
        'The document has no skip link.',
        'the top of the <body>',
        'Keyboard and screen-reader users need a first tab stop that jumps past the header. Without it they tab through the whole navigation on every page.',
        '<a class="skip-link" href="#top">Skip to content</a>',
        'Add a skip link as the first focusable element in the body.',
        [{ op: 'ensure-skip-link' }],
      ),
    );
  }
  if (!/<title[^>]*>\s*\S[\s\S]*?<\/title>/i.test(html)) {
    issues.push(
      mkIssue(
        'error',
        'missing-title',
        'The document has no non-empty <title>.',
        'the <head> of the document',
        'The title is what the browser tab, the search result and the screen reader announce. Without it the page is anonymous.',
        '<title>Atelier Lumen</title>',
        'Add a title with the page headline.',
        [{ op: 'ensure-title' }],
      ),
    );
  }
  if (!/<main[\s>]/i.test(html)) {
    issues.push(
      mkIssue(
        'warn',
        'missing-main',
        'No <main> landmark found.',
        'the <body> of the document',
        'Without <main>, a keyboard or screen-reader user cannot jump to the content: the page has no primary region.',
        '<main id="top"> ... </main>',
        'Wrap the page content in <main>.',
        [{ op: 'ensure-main' }],
      ),
    );
  }
  if (!/<header[\s>]/i.test(html)) {
    issues.push(
      mkIssue(
        'warn',
        'missing-header',
        'No <header> landmark found.',
        'the top of the <body>',
        'The header is the page banner: it is where a screen reader expects the brand and the primary navigation to live.',
        '<header> ... </header>',
        'Add a <header> around the brand and navigation.',
      ),
    );
  }
  if (!/<footer[\s>]/i.test(html)) {
    issues.push(
      mkIssue(
        'warn',
        'missing-footer',
        'No <footer> landmark found.',
        'the bottom of the <body>',
        'The footer is the content-info landmark: without it the page has no closing region for sources, contact or legal text.',
        '<footer> ... </footer>',
        'Add a <footer> with sources, contact or colophon.',
      ),
    );
  }
  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length;
  if (h1Count === 0) {
    issues.push(
      mkIssue(
        'error',
        'missing-h1',
        'No <h1> found.',
        'the page body',
        'The h1 is the single promise of the page. Without it there is no entry point for a reader or an outline algorithm.',
        '<h1>The promise</h1>',
        'Use exactly one h1 with the page headline.',
        [{ op: 'normalize-headings' }],
      ),
    );
  } else if (h1Count > 1) {
    issues.push(
      mkIssue(
        'warn',
        'multiple-h1',
        `${h1Count} h1 elements found.`,
        'the page body',
        'More than one h1 flattens the outline: assistive tech sees several equal "top" sections instead of one page.',
        '<h1>One headline</h1><h2>A section</h2>',
        'Keep one h1; use h2 for sections.',
        [{ op: 'normalize-headings' }],
      ),
    );
  }
  if (!/<html[^>]+lang=/i.test(html)) {
    issues.push(
      mkIssue(
        'warn',
        'missing-lang',
        'The <html> tag has no lang attribute.',
        'the opening <html> tag',
        'lang tells the screen reader which pronunciation to use and lets the browser offer translation. Without it the page is mis-read.',
        '<html lang="es">',
        'Add lang="es" or lang="en".',
        [{ op: 'set-lang' }],
      ),
    );
  }
  const placeholders: Array<[string, boolean]> = [
    ['{{', html.includes('{{')],
    ['undefined', /\bundefined\b/.test(html)],
    ['NaN', /\bNaN\b/.test(html)],
    ['lorem ipsum', /lorem ipsum/i.test(html)],
  ];
  for (const [pattern, found] of placeholders) {
    if (found) {
      issues.push(
        mkIssue(
          'error',
          'unresolved-token',
          `The HTML contains the placeholder "${pattern}".`,
          'the rendered text',
          'A placeholder means the template or the data never resolved. Shipping it is shipping an unfinished page.',
          'Replace "{{ title }}" with the real headline.',
          'Replace it with real content before shipping.',
          [{ op: 'strip-placeholder', params: { token: pattern } }],
        ),
      );
    }
  }
  // CTA integrity: a call to action must carry a real destination. An anchor
  // with an empty or placeholder href is flagged; the visible limitation state
  // (`<button aria-disabled>`) is the accepted alternative and is not an
  // anchor, so it passes this check.
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = match[1] ?? '';
    const href = (/\bhref\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? '').trim();
    if (ctaHasDestination(href)) continue;
    const className = (/\bclass\s*=\s*"([^"]*)"/i.exec(attrs)?.[1] ?? '').toLowerCase();
    if (!/\b(cta|btn|button|nav-cta|action)\b/.test(className)) continue;
    issues.push(
      mkIssue(
        'error',
        'cta-no-destination',
        'A call to action has an empty or placeholder href.',
        `the CTA link "${(match[2] ?? '').replace(/<[^>]+>/g, ' ').trim().slice(0, 48)}"`,
        'A button or link with no destination is a broken promise: the reader clicks and nothing happens. Either give it a real href or render a visible limitation state.',
        `<a class="btn" href="#contact">Empezar</a>`,
        'Give the CTA a real destination, or replace it with a visible limitation state (`<button aria-disabled="true">` plus an explanatory note).',
      ),
    );
  }
  const visibleText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  if (EMOJI_RE.test(visibleText)) {
    issues.push(
      mkIssue(
        'warn',
        'emoji-in-copy',
        'The page uses emoji in its copy.',
        'the rendered text',
        'Emoji are clip art: they break the editorial voice and render inconsistently across platforms.',
        'Replace the emoji with a word or an inline SVG mark.',
        'Replace emoji with real words or an inline SVG mark.',
        [{ op: 'strip-emoji' }],
      ),
    );
  }
  for (const tag of PRESENTATIONAL_TAGS) {
    if (new RegExp(`<${tag}[\\s>]`, 'i').test(html)) {
      issues.push(
        mkIssue(
          'warn',
          'forbidden-element',
          `The page uses the presentational <${tag}> element.`,
          `a <${tag}> element`,
          `<${tag}> is deprecated presentational markup: it cannot be themed, animated or read consistently by assistive tech.`,
          `Use a <span> or <p> and style it in CSS.`,
          `Remove <${tag}> and use a semantic element with CSS.`,
          [{ op: 'remove-element', params: { tag } }],
        ),
      );
    }
  }
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt=/i.test(match[0])) {
      issues.push(
        mkIssue(
          'warn',
          'img-alt',
          'An <img> has no alt attribute.',
          'an <img> in the page body',
          'Without alt the image is either announced as a filename or skipped entirely. Decorative images need alt=""; informative ones need real words.',
          '<img src="plate.jpg" alt="A fresco plate with a cypress tree">',
          'Add alt text, or alt="" if decorative.',
          [{ op: 'add-alt' }],
        ),
      );
    }
  }
  return issues;
}

function issuesForContrast(preset: StylePreset): RichIssue[] {
  const pairs = preset.slug === 'brutalist'
    ? ([
        ['ink', 'bg', 'body text'],
        ['ink', 'surface', 'cards'],
        ['ink', 'accent', 'text on acid'],
        ['bg', 'ink', 'inverted footer'],
      ] as const)
    : (CONTRAST_PAIRS[preset.slug] ?? [
        ['ink', 'bg', 'body text'],
        ['muted', 'bg', 'secondary text'],
      ]);

  const issues: RichIssue[] = [];
  for (const [fg, bg, label] of pairs) {
    const foreground = preset.palette[fg as keyof StylePreset['palette']];
    const background = preset.palette[bg as keyof StylePreset['palette']];
    const ratio = contrastRatio(foreground, background);
    if (ratio < 4.5) {
      issues.push(
        mkIssue(
          'warn',
          'contrast',
          `${label}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1.`,
          'the palette tokens',
          'Below 4.5:1, body text fails WCAG AA: low-vision readers and bright screens lose the sentence.',
          `Swap ${foreground} for ${preset.palette.ink} on ${background}.`,
          'Aim for at least 4.5:1 for body text. Keep low-contrast tones for decoration only.',
        ),
      );
    }
  }
  return issues;
}

function headingText(html: string): string {
  const match = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  return (match?.[1] ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCopy(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(value: string): Set<string> {
  return new Set(value.split(' ').filter(Boolean));
}

function nearIdenticalCopy(a: string, b: string): boolean {
  if (a === b) return true;
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (left.size === 0 || right.size === 0) return false;
  if (Math.abs(left.size - right.size) > 2) return false;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.max(left.size, right.size) >= 0.9;
}

/**
 * Filler detector: a template that repeats the same card body or paragraph
 * three times is not editorial content, it is a placeholder loop. Near-identical
 * copies (same words, different punctuation) count as one repeated block.
 */
function issuesForRepetition(html: string): RichIssue[] {
  const bodies = Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => plainCopy(match[1] ?? ''))
    .filter((text) => text.length >= 24)
    .slice(0, 200);
  if (bodies.length < 3) return [];

  const issues: RichIssue[] = [];
  const grouped = new Set<number>();
  const exact = new Map<string, number[]>();
  bodies.forEach((body, index) => {
    const list = exact.get(normalizeCopy(body)) ?? [];
    list.push(index);
    exact.set(normalizeCopy(body), list);
  });
  for (const indexes of exact.values()) {
    if (indexes.length < 3) continue;
    indexes.forEach((index) => grouped.add(index));
    issues.push(repeatedFillerIssue(bodies[indexes[0]!]!, indexes.length));
  }

  const remaining = bodies.map((body, index) => ({ body, index })).filter((entry) => !grouped.has(entry.index));
  for (let i = 0; i < remaining.length; i += 1) {
    const entry = remaining[i]!;
    if (grouped.has(entry.index)) continue;
    const cluster = [entry];
    for (let j = i + 1; j < remaining.length; j += 1) {
      const candidate = remaining[j]!;
      if (grouped.has(candidate.index)) continue;
      if (nearIdenticalCopy(normalizeCopy(entry.body), normalizeCopy(candidate.body))) cluster.push(candidate);
    }
    if (cluster.length < 3) continue;
    cluster.forEach((item) => grouped.add(item.index));
    issues.push(repeatedFillerIssue(entry.body, cluster.length));
  }
  return issues;
}

function plainCopy(block: string): string {
  return block
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function repeatedFillerIssue(sample: string, count: number): RichIssue {
  const shortened = sample.length > 64 ? `${sample.slice(0, 61).trimEnd()}…` : sample;
  return mkIssue(
    'warn',
    'repeated-filler',
    `The same body appears ${count} times: "${shortened}"`,
    `the <p> blocks (${count} identical or near-identical copies)`,
    'A repeated paragraph is template filler: it tells the reader that the content was not written for this page, and it flattens the rhythm of the layout.',
    '<p>Publicar una lectura común cada viernes.</p>',
    'Write one specific sentence per card, action or section; if the same sentence fits everywhere, cut all but one.',
  );
}

/**
 * Two headline checks that keep a prompt from becoming the page title and keep
 * the title from breaking inside a word on a 360px phone.
 */
function issuesForHeadline(html: string, css: string): RichIssue[] {
  const issues: RichIssue[] = [];
  const text = headingText(html);
  if (!text) return issues;
  const points = Array.from(text);
  const words = text.split(/\s+/).filter(Boolean);

  if (words.length > 8 || points.length > 60) {
    issues.push(
      mkIssue(
        'warn',
        'idea-as-title',
        `The h1 reads like a prompt: ${words.length} words / ${points.length} characters.`,
        'the page <h1>',
        'A headline is a short promise, not the whole request. When the entire idea becomes the h1 the page has no title and the body looks empty.',
        '<h1>Noche polinizadora</h1>',
        'Move the idea to the tagline and intro; keep the h1 at five words or fewer.',
      ),
    );
  }

  const fit = /--headline-fit\s*:\s*(\d+(?:\.\d+)?)px/i.exec(css)?.[1];
  const ratio = /--headline-ratio\s*:\s*(\d+(?:\.\d+)?)/i.exec(css)?.[1];
  if (fit !== undefined) {
    const longest = longestWordLength(text);
    if (headlineOverflows360(text, Number(fit), ratio ? Number(ratio) : undefined)) {
      issues.push(
        mkIssue(
          'warn',
          'headline-fits',
          `The longest headline word (${longest} characters) overflows a ${HEADLINE_VIEWPORT}px viewport.`,
          'the page <h1>',
          'On a narrow phone a long word is pushed past the viewport and breaks mid-word, leaving an orphan letter the automatic review never sees.',
          '--headline-fit:26px',
          'Shorten the headline or lower --headline-fit so the longest word fits.',
        ),
      );
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
  const material = ['feTurbulence', 'inset 0', 'clip-path', 'repeating-linear-gradient', 'stroke-dashoffset', '8px 8px 0', 'border:3px', 'drop-shadow', 'writing-mode', 'columns:', 'radial-gradient', 'border:var(--line)'].filter((marker) =>
    css.includes(marker),
  ).length;
  const gradientBudget =
    preset.slug === 'brutalist'
      ? 4
      : preset.slug === 'psychedelic'
        ? 8
        : preset.slug === 'vaporwave'
          ? 8
          : preset.slug === 'memphis'
            ? 4
            : preset.slug === 'opart'
              ? 3
              : preset.slug === 'ukiyoe' || preset.slug === 'artdeco'
                ? 2
                : preset.slug === 'galactic'
                  ? 8
                  : 0;

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

export function validateHtml(html: string, style: StyleSlug): RichValidationResult {
  if (!isStyleSlug(style)) {
    throw new Error(`Unknown style "${style}". Use one of: ${styleSlugs.join(', ')}.`);
  }
  const preset = getStyle(style);
  const css = stripComments(styleCss(html));
  const issues: RichIssue[] = [];

  if (!css.trim()) {
    issues.push(
      mkIssue(
        'error',
        'missing-css',
        'No <style> block found: the page cannot follow the editorial system.',
        'the <head> of the document',
        'The editorial system lives in the <style> block. Without it the page cannot carry the palette, the type or the motion rules.',
        '<style>:root{--bg:#F6EDDD}</style>',
        'Inline the style tokens and layout CSS in a <style> tag.',
      ),
    );
  }

  const guarded =
    /overflow-x\s*:\s*hidden/i.test(css) &&
    /max-width\s*:\s*100%/i.test(css) &&
    /overflow-wrap\s*:\s*anywhere/i.test(css);
  if (css.trim() && !guarded) {
    issues.push(
      mkIssue(
        'warn',
        'missing-overflow-guard',
        'The page has no text-overflow guards (overflow-x, max-width, overflow-wrap).',
        'the <style> block',
        'Without overflow guards a long word or a wide element scrolls the page horizontally on a phone.',
        'html,body{overflow-x:hidden;max-width:100%}',
        'Add overflow-x:hidden, max-width:100% on media and overflow-wrap:anywhere for narrow screens.',
        [{ op: 'clamp-overflow' }],
      ),
    );
  }

  const colors = issuesForColors(css, preset);
  const fonts = issuesForFonts(css, preset);
  const radii = issuesForRadii(css, preset);
  const borders = issuesForBorders(css, preset);
  const shadows = issuesForShadows(css, preset);
  const motion = issuesForMotion(css);
  const markup = issuesForMarkup(html);
  const contrast = issuesForContrast(preset);
  const headline = issuesForHeadline(html, css);
  const repetition = issuesForRepetition(html);

  issues.push(
    ...colors.issues,
    ...fonts.issues,
    ...radii.issues,
    ...borders,
    ...shadows,
    ...motion.issues,
    ...markup,
    ...contrast,
    ...headline,
    ...repetition,
  );

  return finalize(style, preset, css, html, issues, colors, fonts, radii, motion);
}

function finalize(
  style: StyleSlug,
  preset: StylePreset,
  css: string,
  html: string,
  issues: RichIssue[],
  colors: { colors: string[] },
  fonts: { fonts: string[] },
  radii: { radii: number[] },
  motion: { durations: number[] },
): RichValidationResult {
  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.filter((issue) => issue.severity === 'warn').length;
  const infos = issues.filter((issue) => issue.severity === 'info').length;
  const score = Math.max(0, Math.min(100, 100 - errors * 18 - warnings * 6 - infos));
  const grade: RichValidationResult['grade'] = gradeForScore(score, warnings);

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

export function formatValidation(result: RichValidationResult | ValidationResult): string {
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
  for (const raw of result.issues) {
    const issue = raw as Partial<RichIssue>;
    lines.push(`[${raw.severity}] ${raw.code}: ${raw.message}`);
    if (issue.where) lines.push(`  where: ${issue.where}`);
    if (issue.why) lines.push(`  why: ${issue.why}`);
    if (raw.fix) lines.push(`  fix: ${raw.fix}`);
    if (issue.example) lines.push(`  example: ${issue.example}`);
    if (issue.patch?.length) lines.push(`  patch: machine-applicable (${issue.patch.map((step) => step.op).join(' → ')})`);
  }
  return lines.join('\n');
}

/**
 * Deck-specific audit. It does not replace the page audit; it adds checks that
 * only make sense for a 16:9 sequence.
 */
function slideWords(block: string): number {
  const text = block
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.split(' ').length : 0;
}

function slideHeading(block: string): string {
  const text = (block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 60 ? `${text.slice(0, 57).trimEnd()}…` : text;
}

export function validateDeck(html: string, style: StyleSlug): RichValidationResult {
  const base = validateHtml(html, style);
  const issues: RichIssue[] = [...base.issues];
  const blocks = html.match(/<section class="slide[\s\S]*?<\/section>/g) ?? [];

  if (blocks.length < 4) {
    issues.push(
      mkIssue(
        'warn',
        'deck-too-short',
        `The deck has ${blocks.length} slides. A presentation needs at least 4.`,
        'the deck markup',
        'Fewer than four slides is a slide, not a talk: there is no argument, only a title.',
        'Add a statement, a points slide and a quote.',
        'Add a statement, a points slide or a quote. The cover and closing are already generated.',
      ),
    );
  }
  if (blocks.length > DECK_TOTAL_SLIDE_LIMIT) {
    issues.push(
      mkIssue(
        'warn',
        'deck-too-long',
        `The deck has ${blocks.length} slides; ${DECK_TOTAL_SLIDE_LIMIT} is the maximum.`,
        'the deck markup',
        `Past ${DECK_TOTAL_SLIDE_LIMIT} slides the room stops listening. A deck is an argument, not a document.`,
        'Cut one slide per section.',
        'Split the deck or cut one slide per section.',
      ),
    );
  }

  const layouts = new Set<string>();
  blocks.forEach((block, index) => {
    const layout = block.match(/layout-([a-z]+)/)?.[1] ?? 'cover';
    layouts.add(layout);
    const title = slideHeading(block);
    const named = title ? ` "${title}"` : '';
    const where = `slide ${index + 1} of the deck${title ? ` ("${title}")` : ''}`;
    const words = slideWords(block);
    if (layout !== 'cover' && layout !== 'closing' && words > DECK_WORD_LIMIT) {
      issues.push(
        mkIssue(
          'warn',
          'deck-word-count',
          `Slide ${index + 1}${named} (${layout} layout) has ${words} words, labels included; the limit is ${DECK_WORD_LIMIT}.`,
          where,
          `A slide with more than ${DECK_WORD_LIMIT} words is a page projected: the room reads instead of listening.`,
          'Cut the body to two short lines.',
          `Shorten ${title ? `"${title}"` : 'this slide'} to ${DECK_WORD_LIMIT} words or split it into two slides.`,
        ),
      );
    }
    const points = (block.match(/class="point(?=[\s"])/g) ?? []).length;
    if (points > DECK_POINT_LIMIT) {
      issues.push(
        mkIssue(
          'error',
          'deck-too-many-points',
          `Slide ${index + 1}${named} has ${points} cards in the points layout; the maximum is ${DECK_POINT_LIMIT}.`,
          where,
          `${DECK_POINT_LIMIT + 1} or more points is a list, not an idea. The slide loses its single claim.`,
          'Keep 2–3 points and move the rest.',
          `Keep ${DECK_POINT_LIMIT} cards or fewer and move the rest to another slide.`,
        ),
      );
    }
    const stats = (block.match(/class="stat(?=[\s"])/g) ?? []).length;
    if (stats > DECK_STAT_LIMIT) {
      issues.push(
        mkIssue(
          'warn',
          'deck-too-many-stats',
          `Slide ${index + 1}${named} has ${stats} stats in the stats layout; the maximum is ${DECK_STAT_LIMIT}.`,
          where,
          `${DECK_STAT_LIMIT + 1} or more figures stop being evidence: the room reads numbers instead of the point.`,
          'Keep the strongest figures and move the rest.',
          `Keep ${DECK_STAT_LIMIT} stats or fewer and move the rest to another slide.`,
        ),
      );
    }
  });

  if (layouts.size < 2) {
    issues.push(
      mkIssue(
        'warn',
        'deck-monotone',
        'All content slides use the same layout.',
        'the deck markup',
        'A single layout for every slide flattens the rhythm: the eye has nothing new to catch.',
        'Use at least one points, stats or quote slide.',
        'Use at least one points, stats or quote slide to change the rhythm.',
      ),
    );
  }
  if (!html.includes('aria-live')) {
    issues.push(
      mkIssue(
        'warn',
        'deck-missing-live',
        'The deck has no aria-live region for slide changes.',
        'the deck markup',
        'Without a live region, a screen-reader user never learns that the slide changed.',
        '<p class="sr-only" aria-live="polite">Slide 2 of 6</p>',
        'Add an aria-live status and announce the current slide.',
      ),
    );
  }
  if (!html.includes('inert')) {
    issues.push(
      mkIssue(
        'warn',
        'deck-missing-inert',
        'Hidden slides are still focusable (no inert).',
        'the hidden slides',
        'A hidden slide that still holds focus traps keyboard users in invisible content.',
        '<section class="slide" inert> ... </section>',
        'Set inert on slides that are not active.',
      ),
    );
  }
  if (!html.includes('@media print')) {
    issues.push(
      mkIssue(
        'warn',
        'deck-missing-print',
        'The deck has no print styles; a PDF would lose slides.',
        'the <style> block',
        'Without print rules, exporting the deck to PDF drops the hidden slides.',
        '@media print{.slide{display:block}}',
        'Add @media print with one page per slide.',
      ),
    );
  }

  return finalizeFrom(base, style, html, issues);
}

/**
 * Experience audit: a sequence of rooms, not a long landing.
 */
export function validateExperience(html: string, style: StyleSlug): RichValidationResult {
  const base = validateHtml(html, style);
  const issues: RichIssue[] = [...base.issues];
  const rooms = html.match(/data-room="\d+"/g) ?? [];
  if (rooms.length < 3) {
    issues.push(
      mkIssue(
        'error',
        'experience-too-short',
        `The experience has ${rooms.length} rooms; the minimum is 3.`,
        'the experience markup',
        'An experience with fewer than three rooms is a landing page wearing a costume.',
        'Add an entrance, one room and an exit.',
        'Add an entrance, one room and an exit.',
      ),
    );
  }
  if (rooms.length > 8) {
    issues.push(
      mkIssue(
        'warn',
        'experience-too-long',
        `The experience has ${rooms.length} rooms; the maximum is 8.`,
        'the experience markup',
        'More than eight rooms and the visit stops having a shape.',
        'Keep 4–6 rooms.',
        'Keep 4–6 rooms and move the rest to another visit.',
      ),
    );
  }
  const blocks = html.match(/<section class="xp-room[\s\S]*?<\/section>/g) ?? [];
  blocks.forEach((block, index) => {
    const text = block.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(' ').length : 0;
    if (words > 130) {
      issues.push(
        mkIssue(
          'warn',
          'experience-room-too-wordy',
          `Room ${index + 1} has ${words} words. Keep a room below 130.`,
          `room ${index + 1} of the experience`,
          'A room is a moment, not an essay. Long copy kills the sense of place.',
          'Move the detail to objects or cut it.',
          'Move the detail to objects or cut it.',
        ),
      );
    }
  });
  if (!html.includes('xp-rail')) {
    issues.push(
      mkIssue(
        'warn',
        'experience-missing-rail',
        'The experience has no room navigation.',
        'the experience markup',
        'Without a rail, the visitor cannot orient themselves or jump between rooms.',
        '<nav class="xp-rail" aria-label="Rooms"> ... </nav>',
        'Add an accessible room rail with aria-current.',
      ),
    );
  }
  if (!html.includes('@media print')) {
    issues.push(
      mkIssue(
        'warn',
        'experience-missing-print',
        'The experience has no print styles.',
        'the <style> block',
        'A printed experience without rules becomes an unreadable wall of text.',
        '@media print{.xp-room{page-break-after:always}}',
        'Print each room on its own page.',
      ),
    );
  }
  if (!html.includes('prefers-reduced-motion')) {
    issues.push(
      mkIssue(
        'warn',
        'experience-missing-reduced-motion',
        'The experience does not honor reduced motion.',
        'the <style> block',
        'Visitors who ask for reduced motion still get the full drift and pan unless there is an explicit fallback.',
        '@media (prefers-reduced-motion:reduce){*{animation:none}}',
        'Add the reduced-motion state.',
        [{ op: 'ensure-reduced-motion' }],
      ),
    );
  }
  if ((html.includes('kind-restaurant') || html.includes('kind-museum')) && !html.includes('xp-item')) {
    issues.push(
      mkIssue(
        'warn',
        'experience-missing-objects',
        'A restaurant or museum needs at least one object, dish or exhibit.',
        'the room markup',
        'A restaurant or museum without objects is a corridor: there is nothing to look at.',
        '<li class="xp-item">Dish · 18€</li>',
        'Add items to a room.',
      ),
    );
  }
  return finalizeFrom(base, style, html, issues);
}

/**
 * Story audit: chapters with enough prose and a visible reading structure.
 */
export function validateStory(html: string, style: StyleSlug): RichValidationResult {
  const base = validateHtml(html, style);
  const issues: RichIssue[] = [...base.issues];
  const chapters = html.match(/class="story-chapter[^"]*"[^>]*id="chapter-\d+"/g) ?? [];
  if (chapters.length < 2) {
    issues.push(
      mkIssue(
        'error',
        'story-too-short',
        `The story has ${chapters.length} chapters; the minimum is 2.`,
        'the story markup',
        'A single chapter is a paragraph, not a story: there is no turn.',
        'Add a second chapter with a turn.',
        'Add a second chapter with a turn.',
      ),
    );
  }
  if (chapters.length > 8) {
    issues.push(
      mkIssue(
        'warn',
        'story-too-long',
        `The story has ${chapters.length} chapters; the maximum is 8.`,
        'the story markup',
        'More than eight chapters and the narrative loses its spine.',
        'Split the story or cut one chapter.',
        'Split the story or cut one chapter.',
      ),
    );
  }
  const blocks = html.match(/<article class="story-chapter[\s\S]*?<\/article>/g) ?? [];
  let total = 0;
  blocks.forEach((block, index) => {
    const text = block.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
    const words = text ? text.split(' ').length : 0;
    total += words;
    if (words < 40) {
      issues.push(
        mkIssue(
          'warn',
          'story-chapter-thin',
          `Chapter ${index + 1} has ${words} words. Give it a scene or a turn.`,
          `chapter ${index + 1} of the story`,
          'A thin chapter reads as a transition, so the reader never settles into the scene.',
          'Add one concrete image and one consequence.',
          'Add one concrete image and one consequence.',
        ),
      );
    }
    if (words > 900) {
      issues.push(
        mkIssue(
          'warn',
          'story-chapter-long',
          `Chapter ${index + 1} has ${words} words. Consider a break.`,
          `chapter ${index + 1} of the story`,
          'A 900-word chapter exhausts the reader before the next turn.',
          'Split the chapter or move a section to a fact.',
          'Split the chapter or move a section to a fact.',
        ),
      );
    }
  });
  if (total < 180) {
    issues.push(
      mkIssue(
        'warn',
        'story-too-small',
        `The story has ${total} words. It reads like a caption.`,
        'the story markup',
        'Under 180 words there is no room for a scene, a turn and a consequence.',
        'Give each chapter one scene and one turn.',
        'Give each chapter one scene and one turn.',
      ),
    );
  }
  if (!html.includes('story-nav')) {
    issues.push(
      mkIssue(
        'warn',
        'story-missing-nav',
        'The story has no chapter navigation.',
        'the story markup',
        'Without chapter navigation the reader cannot move through a long story.',
        '<nav class="story-nav" aria-label="Chapters"> ... </nav>',
        'Add the chapter nav with aria-current.',
      ),
    );
  }
  if (!html.includes('story-lede')) {
    issues.push(
      mkIssue(
        'warn',
        'story-missing-lede',
        'The story has no lede/drop cap treatment.',
        'the first chapter',
        'A story without a lede starts flat: the reader has no handhold.',
        '<p class="story-lede"> ... </p>',
        'Use the first paragraph as the lede.',
      ),
    );
  }
  if (!html.includes('@media print')) {
    issues.push(
      mkIssue(
        'warn',
        'story-missing-print',
        'The story has no print styles.',
        'the <style> block',
        'Printed without rules, a long story becomes a single unbroken column.',
        '@media print{.story-chapter{page-break-after:always}}',
        'Add print rules with one chapter per page.',
      ),
    );
  }
  return finalizeFrom(base, style, html, issues);
}

/**
 * Documented scoring invariant: an open warning caps the grade at B, so a page
 * with an off-palette colour (or any other warning) can never present as "A 94".
 * The score itself still reflects the weighted penalty; only the letter is capped.
 */
function gradeForScore(score: number, warnings: number): RichValidationResult['grade'] {
  const base: RichValidationResult['grade'] = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  return warnings > 0 && base === 'A' ? 'B' : base;
}

function finalizeFrom(base: RichValidationResult, style: StyleSlug, html: string, issues: RichIssue[]): RichValidationResult {
  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.filter((issue) => issue.severity === 'warn').length;
  const infos = issues.filter((issue) => issue.severity === 'info').length;
  const score = Math.max(0, Math.min(100, 100 - errors * 18 - warnings * 6 - infos));
  const grade: RichValidationResult['grade'] = gradeForScore(score, warnings);
  return { ...base, score, grade, issues };
}

/**
 * Adds issues found after the static pass (visual geometry, repetition, …) and
 * rescores with the documented weights, so an open warning still caps the grade
 * at B and a visual issue can never leave an "A 100" standing.
 */
export function mergeIssues(base: RichValidationResult, extra: RichIssue[]): RichValidationResult {
  if (extra.length === 0) return base;
  return finalizeFrom(base, base.style, '', [...base.issues, ...extra]);
}
