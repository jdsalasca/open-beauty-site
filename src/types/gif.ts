import type { GifOptions, GifResult } from '../types.js';

export type GifDitherMode = 'none' | 'ordered' | 'floyd-steinberg';

export interface GifQualityOptions extends GifOptions {
  /** Per-pixel error diffusion for gradient styles; defaults to the style profile. */
  dither?: GifDitherMode;
  /** Palette size for the global quantisation; defaults to the style profile. */
  paletteColors?: number;
}

export interface SafeGifResult extends GifResult {
  /** Duration actually encoded, after clamping. */
  duration: number;
  /** Human-readable notes when a requested value was clamped for safety. */
  warnings: string[];
}

/**
 * Single source of truth for `beauty gif --help`. Every flag the CLI reads must
 * be listed here; the help drift test compares this table with cli.ts.
 */
export interface GifFlagHelp {
  flag: string;
  value?: string;
  help: string;
}

export const GIF_FLAGS: GifFlagHelp[] = [
  { flag: 'style', value: '<s>', help: 'Editorial system (required)' },
  { flag: 'text', value: '"..."', help: '2–5 word headline (required)' },
  { flag: 'subtitle', value: '"..."', help: 'Small caption under the headline' },
  { flag: 'template', value: 'name', help: 'title|loop|poster (default title)' },
  { flag: 'width', value: 'px', help: 'Frame width, 240–1200 (default 800)' },
  { flag: 'height', value: 'px', help: 'Frame height, 240–1200 (default 800)' },
  { flag: 'fps', value: 'n', help: 'Frame rate, 8–30 (default 20)' },
  { flag: 'duration', value: 's', help: 'Loop seconds, 1–6' },
  { flag: 'seed', value: 'n', help: 'Deterministic variation 0–9999' },
  { flag: 'maxxing', value: undefined, help: 'Full art direction' },
  { flag: 'poster', value: undefined, help: 'Also write the composed poster frame as <out>.png' },
  { flag: 'out', value: 'path', help: 'Where to write the GIF (default beauty-output/…)' },
];

/** One option line per gif flag; `beauty gif --help` cannot drift from the table. */
export function gifHelpOptions(): string[] {
  return GIF_FLAGS.map(({ flag, value, help }) => `  --${flag}${value ? ` ${value}` : ''}`.padEnd(26) + help);
}

export function gifUsage(): string {
  return 'beauty gif --style <s> --text "..." [--subtitle "..."] [--template title|loop|poster] [--poster] [--maxxing] [--out file.gif]';
}
