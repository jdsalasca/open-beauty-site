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
