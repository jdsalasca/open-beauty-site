import type { StyleSlug } from '../types.js';
import type { NarrativeRect, NarrativeSceneLayout } from '../types/narrative.js';

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

/** Enlarged art column for the two renderers that draw identified semantic objects. */
export const SEMANTIC_NARRATIVE_COMPOSITION: NarrativeComposition = {
  textWidthRatio: 0.43,
  artGapRatio: 0.02,
  artWidthRatio: 0.45,
  artY: 0.05,
  artHeight: 0.90,
};

export const NARRATIVE_COMPOSITION_BY_STYLE: Readonly<Partial<Record<StyleSlug, NarrativeComposition>>> = {
  papercraft: { textWidthRatio: 0.57, artGapRatio: 0.02, artWidthRatio: 0.31, artY: 0.08, artHeight: 0.84 },
  brutalist: { textWidthRatio: 0.57, artGapRatio: 0.02, artWidthRatio: 0.31, artY: 0.08, artHeight: 0.84 },
  renaissance: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  artdeco: { textWidthRatio: 0.41, artGapRatio: 0.02, artWidthRatio: 0.47, artY: 0.05, artHeight: 0.90 },
  isotype: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  opart: { textWidthRatio: 0.41, artGapRatio: 0.02, artWidthRatio: 0.47, artY: 0.05, artHeight: 0.90 },
  vaporwave: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  galactic: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  nature: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  ukiyoe: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  bestiary: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  psychedelic: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  memphis: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
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

export function narrativeCompositionFor(style: StyleSlug, semantic = false): NarrativeComposition {
  if (semantic && (style === 'papercraft' || style === 'brutalist')) return SEMANTIC_NARRATIVE_COMPOSITION;
  return NARRATIVE_COMPOSITION_BY_STYLE[style] ?? DEFAULT_NARRATIVE_COMPOSITION;
}

export function narrativeLabelToneFor(style: StyleSlug): 'ink' | 'accent' {
  return NARRATIVE_LABEL_TONE_BY_STYLE[style];
}

/**
 * Scene layouts are declared as data, not as per-style render branches. Every
 * registered scene can mirror its existing composition (object-left/right);
 * the two pilot styles additionally render the vertical and hero layouts.
 */
export const NARRATIVE_SCENE_LAYOUTS = [
  'object-left', 'object-right', 'object-top', 'object-hero',
] as const satisfies readonly NarrativeSceneLayout[];

const NARRATIVE_LAYOUTS_BY_STYLE: Readonly<Partial<Record<StyleSlug, readonly NarrativeSceneLayout[]>>> = {
  papercraft: NARRATIVE_SCENE_LAYOUTS,
  brutalist: NARRATIVE_SCENE_LAYOUTS,
};

const NARRATIVE_ASPECTS_BY_STYLE: Readonly<Record<StyleSlug, readonly number[]>> = {
  artdeco: [16 / 9, 1, 9 / 16],
  bestiary: [16 / 9, 1],
  brutalist: [16 / 9, 1],
  galactic: [16 / 9],
  isotype: [16 / 9, 1, 9 / 16],
  memphis: [16 / 9, 1],
  nature: [16 / 9],
  opart: [16 / 9, 1, 9 / 16],
  papercraft: [16 / 9, 1],
  psychedelic: [16 / 9, 1],
  renaissance: [16 / 9, 1, 9 / 16],
  ukiyoe: [16 / 9, 1],
  vaporwave: [16 / 9],
};

function supportsAspect(style: StyleSlug, aspect: number): boolean {
  return NARRATIVE_ASPECTS_BY_STYLE[style]
    .some((ratio) => Math.abs(aspect - ratio) / ratio < 0.015);
}

export function narrativeLayoutsFor(style: StyleSlug, aspect: number): NarrativeSceneLayout[] {
  if (!supportsAspect(style, aspect)) return [];
  const layouts = NARRATIVE_LAYOUTS_BY_STYLE[style];
  return [...(layouts ?? ['object-left', 'object-right'])];
}

export interface NarrativeLayoutBoxes {
  titleRatio: number;
  labelRatio: number;
  bodyRatio: number;
  /** Gap as a ratio of the text area height. */
  gapRatio: number;
}

export const NARRATIVE_LAYOUT_BOXES: Readonly<Record<NarrativeSceneLayout, NarrativeLayoutBoxes>> = {
  'object-left': { titleRatio: 0.23, labelRatio: 0.10, bodyRatio: 0.56, gapRatio: 0.10 },
  'object-right': { titleRatio: 0.23, labelRatio: 0.10, bodyRatio: 0.56, gapRatio: 0.10 },
  'object-top': { titleRatio: 0.46, labelRatio: 0.21, bodyRatio: 0.28, gapRatio: 0.02 },
  'object-hero': { titleRatio: 0.44, labelRatio: 0.28, bodyRatio: 0.20, gapRatio: 0.03 },
};

export interface NarrativeResolvedLayout {
  layout: NarrativeSceneLayout;
  textArea: NarrativeRect;
  reservedArtArea: NarrativeRect;
  boxes: NarrativeLayoutBoxes;
}

function safeArea(width: number, height: number): NarrativeRect {
  return { x: width * 0.05, y: height * 0.05, width: width * 0.9, height: height * 0.9 };
}

/**
 * Resolve one layout hint to frame geometry. Left/right reuse the per-style
 * composition row; top/hero are shared vertical data and never mutate the
 * committed default geometry.
 */
export function resolveNarrativeLayout(
  style: StyleSlug,
  layout: NarrativeSceneLayout,
  semantic: boolean,
  width: number,
  height: number,
): NarrativeResolvedLayout {
  const safe = safeArea(width, height);
  if (layout === 'object-top') {
    return {
      layout,
      textArea: { x: safe.x, y: height * 0.55, width: safe.width, height: height * 0.40 },
      reservedArtArea: { x: safe.x, y: safe.y, width: safe.width, height: height * 0.47 },
      boxes: NARRATIVE_LAYOUT_BOXES[layout],
    };
  }
  if (layout === 'object-hero') {
    return {
      layout,
      textArea: { x: safe.x, y: safe.y, width: width * 0.29, height: safe.height },
      reservedArtArea: { x: safe.x + width * 0.31, y: safe.y, width: width * 0.59, height: safe.height },
      boxes: NARRATIVE_LAYOUT_BOXES[layout],
    };
  }
  const composition = narrativeCompositionFor(style, semantic);
  const textWidth = width * composition.textWidthRatio;
  const artWidth = width * composition.artWidthRatio;
  const artY = height * composition.artY;
  const artHeight = height * composition.artHeight;
  const gap = width * composition.artGapRatio;
  if (layout === 'object-left') {
    const art = { x: safe.x, y: artY, width: artWidth, height: artHeight };
    return {
      layout,
      textArea: { x: art.x + art.width + gap, y: safe.y, width: textWidth, height: safe.height },
      reservedArtArea: art,
      boxes: {
        ...NARRATIVE_LAYOUT_BOXES[layout],
        labelRatio: semantic ? 0.18 : NARRATIVE_LAYOUT_BOXES[layout].labelRatio,
      },
    };
  }
  const text = { x: safe.x, y: safe.y, width: textWidth, height: safe.height };
  return {
    layout,
    textArea: text,
    reservedArtArea: { x: text.x + text.width + gap, y: artY, width: artWidth, height: artHeight },
    boxes: {
      ...NARRATIVE_LAYOUT_BOXES[layout],
      labelRatio: semantic ? 0.18 : NARRATIVE_LAYOUT_BOXES[layout].labelRatio,
    },
  };
}

