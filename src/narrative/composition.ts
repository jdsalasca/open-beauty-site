import type { StyleSlug } from '../types.js';

/**
 * Per-style narrative composition ratios.
 *
 * Each committed review pack was rendered with the values below, so they must not
 * drift: changing a row invalidates every artefact of that style (the gallery
 * reproducibility test in test/narrative-gallery-repro.test.ts guards this).
 */
export interface NarrativeComposition {
  /** Width of the copy column as a ratio of the frame width. */
  textWidthRatio: number;
  /** Gap between the copy column and the art area as a ratio of the frame width. */
  artGapRatio: number;
  /** Width of the art area as a ratio of the frame width. */
  artWidthRatio: number;
  /** Top edge of the art area as a ratio of the frame height. */
  artY: number;
  /** Height of the art area as a ratio of the frame height. */
  artHeight: number;
}

export const DEFAULT_NARRATIVE_COMPOSITION: NarrativeComposition = {
  textWidthRatio: 0.59,
  artGapRatio: 0.04,
  artWidthRatio: 0.27,
  artY: 0.17,
  artHeight: 0.66,
};

export const NARRATIVE_COMPOSITION_BY_STYLE: Readonly<Partial<Record<StyleSlug, NarrativeComposition>>> = {
  papercraft: { textWidthRatio: 0.60, artGapRatio: 0.02, artWidthRatio: 0.31, artY: 0.08, artHeight: 0.84 },
  brutalist: { textWidthRatio: 0.60, artGapRatio: 0.02, artWidthRatio: 0.31, artY: 0.08, artHeight: 0.84 },
  renaissance: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.03, artHeight: 0.94 },
  artdeco: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.03, artHeight: 0.94 },
  isotype: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.03, artHeight: 0.94 },
  opart: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.03, artHeight: 0.94 },
  vaporwave: { textWidthRatio: 0.44, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  galactic: { textWidthRatio: 0.44, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  nature: { textWidthRatio: 0.44, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  ukiyoe: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.27, artY: 0.17, artHeight: 0.66 },
  bestiary: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.27, artY: 0.17, artHeight: 0.66 },
  psychedelic: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.27, artY: 0.17, artHeight: 0.66 },
  memphis: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.27, artY: 0.17, artHeight: 0.66 },
};

/** One label-tone rule feeds both raster output and the rendered-contrast evaluator. */
export const NARRATIVE_LABEL_TONE_BY_STYLE: Readonly<Record<StyleSlug, 'ink' | 'accent'>> = {
  artdeco: 'accent',
  bestiary: 'ink',
  brutalist: 'ink',
  galactic: 'accent',
  isotype: 'accent',
  memphis: 'ink',
  nature: 'accent',
  opart: 'accent',
  papercraft: 'accent',
  psychedelic: 'ink',
  renaissance: 'ink',
  ukiyoe: 'accent',
  vaporwave: 'accent',
};

/** These committed groups include an explicit midpoint tile in the contact sheet. */
export const NARRATIVE_CONTACT_MIDPOINT_STYLES: ReadonlySet<StyleSlug> = new Set([
  'bestiary', 'brutalist', 'memphis', 'papercraft', 'psychedelic', 'ukiyoe',
]);

export function narrativeCompositionFor(style: StyleSlug): NarrativeComposition {
  return NARRATIVE_COMPOSITION_BY_STYLE[style] ?? DEFAULT_NARRATIVE_COMPOSITION;
}

export function narrativeLabelToneFor(style: StyleSlug): 'ink' | 'accent' {
  return NARRATIVE_LABEL_TONE_BY_STYLE[style];
}
