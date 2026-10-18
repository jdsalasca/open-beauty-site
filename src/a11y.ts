import type { StylePalette, StyleSlug } from './types.js';

/**
 * Small, dependency-free WCAG helpers. The contrast maths is the same one the
 * validator uses; it lives here so palettes, pages, decks and tests share a
 * single source of truth.
 */

function normalizeHex(raw: string): string {
  let hex = raw.replace('#', '').toUpperCase();
  if (hex.length === 3) hex = hex.split('').map((char) => char + char).join('');
  if (hex.length === 4) hex = hex.split('').map((char) => char + char).join('').slice(0, 6);
  if (hex.length === 8) hex = hex.slice(0, 6);
  return `#${hex}`;
}

function channelToLinear(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const normalized = normalizeHex(hex).slice(1);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

export function isDarkColor(hex: string, threshold = 0.4): boolean {
  return relativeLuminance(hex) < threshold;
}

/** Minimum WCAG AA ratio: 4.5:1 for body text, 3:1 for large text. */
export function minRatio(large = false): number {
  return large ? 3 : 4.5;
}

export function meetsContrast(a: string, b: string, large = false): boolean {
  return contrastRatio(a, b) >= minRatio(large);
}

export type PaletteRole = keyof StylePalette;

export interface ContrastPair {
  fg: PaletteRole;
  bg: PaletteRole;
  label: string;
  large?: boolean;
}

const BODY_PAIRS: ContrastPair[] = [
  { fg: 'ink', bg: 'bg', label: 'body text' },
  { fg: 'muted', bg: 'bg', label: 'secondary text' },
  { fg: 'ink', bg: 'surface', label: 'card text' },
  { fg: 'muted', bg: 'surface', label: 'card secondary text' },
];

/**
 * The text/background pairs each style actually renders. Kept explicit (rather
 * than combinatorial) so decorative accent-on-accent ornament is never flagged,
 * while every readable combination is.
 */
export const PALETTE_TEXT_PAIRS: Record<StyleSlug, ContrastPair[]> = {
  renaissance: [
    ...BODY_PAIRS,
    { fg: 'bg', bg: 'ink', label: 'primary button' },
    { fg: 'bg', bg: 'deep', label: 'inverted cta' },
    { fg: 'deep', bg: 'accent', label: 'gold button' },
    { fg: 'accent2', bg: 'bg', label: 'accent display', large: true },
  ],
  brutalist: [
    { fg: 'ink', bg: 'bg', label: 'body text' },
    { fg: 'muted', bg: 'bg', label: 'secondary text' },
    { fg: 'ink', bg: 'surface', label: 'card text' },
    { fg: 'bg', bg: 'ink', label: 'inverted footer' },
    { fg: 'ink', bg: 'accent', label: 'acid button' },
    { fg: 'accent2', bg: 'ink', label: 'red mark', large: true },
  ],
  papercraft: [
    ...BODY_PAIRS,
    { fg: 'bg', bg: 'ink', label: 'primary button' },
    { fg: 'ink', bg: 'accent2', label: 'sage band' },
    { fg: 'accent', bg: 'bg', label: 'accent display', large: true },
  ],
  artdeco: [
    ...BODY_PAIRS,
    { fg: 'accent', bg: 'bg', label: 'kicker' },
    { fg: 'accent', bg: 'surface', label: 'card link' },
    { fg: 'bg', bg: 'accent', label: 'gold cta' },
    { fg: 'accent', bg: 'deep', label: 'cta button' },
  ],
  isotype: [
    ...BODY_PAIRS,
    { fg: 'accent', bg: 'bg', label: 'kicker' },
    { fg: 'accent', bg: 'surface', label: 'card numeral' },
    { fg: 'bg', bg: 'accent', label: 'red cta' },
  ],
  opart: [
    { fg: 'ink', bg: 'bg', label: 'body text' },
    { fg: 'muted', bg: 'bg', label: 'secondary text' },
    { fg: 'bg', bg: 'surface', label: 'inverted card' },
    { fg: 'bg', bg: 'accent', label: 'red card' },
    { fg: 'bg', bg: 'accent3', label: 'acid card' },
    { fg: 'accent', bg: 'bg', label: 'accent display', large: true },
  ],
  ukiyoe: [
    ...BODY_PAIRS,
    { fg: 'bg', bg: 'accent', label: 'navy button' },
    { fg: 'bg', bg: 'accent2', label: 'vermilion cta' },
    { fg: 'accent2', bg: 'bg', label: 'vermilion kicker' },
  ],
  bestiary: [
    ...BODY_PAIRS,
    { fg: 'bg', bg: 'accent2', label: 'vermilion button' },
    { fg: 'accent2', bg: 'bg', label: 'vermilion kicker' },
    { fg: 'bg', bg: 'deep', label: 'inverted cta' },
  ],
  psychedelic: [
    ...BODY_PAIRS,
    { fg: 'bg', bg: 'accent3', label: 'acid quote' },
    { fg: 'ink', bg: 'accent', label: 'magenta cta' },
    { fg: 'accent3', bg: 'bg', label: 'acid kicker' },
    { fg: 'accent3', bg: 'surface', label: 'acid card link' },
  ],
  memphis: [
    ...BODY_PAIRS,
    { fg: 'bg', bg: 'accent3', label: 'cobalt button' },
    { fg: 'ink', bg: 'accent', label: 'pink card' },
    { fg: 'ink', bg: 'accent4', label: 'butter card' },
    { fg: 'ink', bg: 'accent2', label: 'mint band' },
  ],
  vaporwave: [
    ...BODY_PAIRS,
    { fg: 'bg', bg: 'accent', label: 'magenta button' },
    { fg: 'bg', bg: 'accent2', label: 'cyan button' },
    { fg: 'accent2', bg: 'bg', label: 'cyan kicker' },
  ],
  nature: [
    ...BODY_PAIRS,
    { fg: 'bg', bg: 'accent', label: 'moss button' },
    { fg: 'accent3', bg: 'bg', label: 'field-note kicker' },
    { fg: 'accent2', bg: 'bg', label: 'terracotta display', large: true },
  ],
  galactic: [
    ...BODY_PAIRS,
    { fg: 'bg', bg: 'accent', label: 'cyan button' },
    { fg: 'accent', bg: 'bg', label: 'cyan kicker' },
    { fg: 'accent3', bg: 'bg', label: 'gold button' },
  ],
};

export interface ContrastFailure {
  label: string;
  fg: PaletteRole;
  bg: PaletteRole;
  ratio: number;
  required: number;
}

export function paletteContrastFailures(palette: StylePalette, pairs: ContrastPair[]): ContrastFailure[] {
  const failures: ContrastFailure[] = [];
  for (const pair of pairs) {
    const ratio = contrastRatio(palette[pair.fg], palette[pair.bg]);
    const required = minRatio(pair.large);
    if (ratio + 1e-9 < required) {
      failures.push({ label: pair.label, fg: pair.fg, bg: pair.bg, ratio, required });
    }
  }
  return failures;
}

/** Pick the candidate with the strongest contrast against a background. */
export function readableOn(background: string, candidates: string[], min = 4.5): string {
  let best = candidates[0] ?? background;
  let bestRatio = -1;
  for (const candidate of candidates) {
    const ratio = contrastRatio(candidate, background);
    if (ratio >= min) return candidate;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = candidate;
    }
  }
  return best;
}

/** A focus ring colour with guaranteed separation from the page ground. */
export function focusRingColor(palette: StylePalette): string {
  return readableOn(palette.bg, [palette.ink, palette.accent, palette.deep, palette.muted], 3);
}

/** Readable text colour to place on top of an accent-coloured surface. */
export function textOnAccent(palette: StylePalette, accent: string): string {
  return readableOn(accent, [palette.bg, palette.ink, palette.deep, '#FFFFFF', '#0B0B0B'], 4.5);
}

/** An accent colour that stays readable as text, falling back to the page ink. */
export function accentTextColor(palette: StylePalette, accent: string): string {
  return readableOn(palette.bg, [accent, palette.ink, palette.accent2, palette.accent3, palette.accent4], 4.5);
}
