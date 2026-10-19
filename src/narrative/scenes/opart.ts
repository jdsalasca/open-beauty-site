import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativeRenderContext, NarrativeRect, NarrativeScene } from '../../types/narrative.js';
import { cubicBezierEase } from './common.js';
import { clamp, compositionFor, phasePosition, type StageCComposition } from './stage-c-common.js';
import { sceneVocabulary } from '../vocabulary.js';
import { drawOpartReadingBand, drawOpartSemantic, opartSemanticObjectRegions } from './opart/semantic-art.js';

interface OpticalPattern {
  readonly identity: 'focus-grouping-pattern';
  readonly composition: StageCComposition;
  readonly bandCount: number;
  readonly focusOffset: number;
  readonly groupOffset: number;
}

function drawConcentricFocus(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, pattern: OpticalPattern, state: number, colors: ReturnType<typeof getStyle>['palette']): void {
  const cx = box.x + box.width * 0.5;
  const cy = box.y + box.height * (0.5 + pattern.focusOffset * (1 - clamp(state / 2)));
  const rx = box.width * 0.49;
  const ry = box.height * 0.49;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, box.y + box.height * 0.5, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = colors.surface;
  ctx.fillRect(box.x, box.y, box.width, box.height);
  const rings = pattern.bandCount;
  for (let index = rings; index >= 0; index -= 1) {
    const fraction = (index + 1) / (rings + 1);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * fraction, ry * fraction, 0, 0, Math.PI * 2);
    ctx.fillStyle = index % 2 === 0 ? colors.bg : colors.surface;
    ctx.fill();
  }
  ctx.restore();
}

function drawGroupedBands(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, pattern: OpticalPattern, state: number, colors: ReturnType<typeof getStyle>['palette']): void {
  ctx.fillStyle = colors.surface;
  ctx.fillRect(box.x, box.y, box.width, box.height);
  const count = pattern.bandCount;
  const top = box.y + box.height * 0.06;
  const available = box.height * 0.88;
  const rowHeight = available / count;
  const maxOffset = box.width * 0.08;
  for (let index = 0; index < count; index += 1) {
    const y = top + rowHeight * index;
    const beforeOffset = index % 2 === 0 ? -maxOffset : maxOffset;
    const offset = mixOffset(beforeOffset, pattern.groupOffset * box.width, clamp(state / 2));
    const left = box.x + box.width * 0.08 + offset;
    const width = box.width * 0.84;
    const thickness = rowHeight * 0.64;
    ctx.fillStyle = index % 2 === 0 ? colors.bg : colors.surface;
    ctx.fillRect(left, y + rowHeight * 0.16, width, thickness);
    ctx.fillStyle = index % 2 === 0 ? colors.surface : colors.bg;
    ctx.fillRect(left + width * 0.72, y + rowHeight * 0.16, width * 0.12, thickness);
  }
}

function mixOffset(before: number, after: number, progress: number): number {
  return before + (after - before) * progress;
}

function drawComparison(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, pattern: OpticalPattern, state: number, colors: ReturnType<typeof getStyle>['palette']): void {
  drawConcentricFocus(ctx, box, pattern, state, colors);
}

function drawChecklist(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, pattern: OpticalPattern, state: number, colors: ReturnType<typeof getStyle>['palette']): void {
  drawGroupedBands(ctx, box, pattern, state, colors);
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  const { brief, layout } = context;
  const pattern = context.object as OpticalPattern;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const box = layout.reservedArtArea;
  const colors = getStyle('opart').palette;
  const state = phasePosition(context, (value) => cubicBezierEase(value, 0.2, 0.6, 0.25, 1));
  if (context.semantic && context.semantic.primitive !== 'legacy-illustration') {
    drawOpartSemantic(ctx, context, box, pattern.composition, colors);
  } else {
    if (pattern.composition === 'comparison') drawComparison(ctx, box, pattern, state, colors);
    else drawChecklist(ctx, box, pattern, state, colors);
    drawOpartReadingBand(ctx, context, box, colors);
  }
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const opartNarrativeScene: NarrativeScene = {
  style: 'opart',
  version: 'opart-semantic-focus-groups/2.1.0',
  vocabulary: sceneVocabulary('phase-order-fallback'),
  supportsAspect(aspect) {
    return [16 / 9, 1, 9 / 16].some((ratio) => Math.abs(aspect - ratio) / ratio < 0.015);
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'focus-grouping-pattern',
      composition: compositionFor(brief.phases),
      bandCount: 7 + Math.floor(rng() * 2),
      focusOffset: (rng() - 0.5) * 0.36,
      groupOffset: (rng() - 0.5) * 0.04,
    } satisfies OpticalPattern);
  },
  objectRegions(context) {
    if (!context.semantic || context.semantic.primitive === 'legacy-illustration') return [];
    const pattern = context.object as OpticalPattern;
    return opartSemanticObjectRegions(context, context.layout.reservedArtArea, pattern.composition);
  },
  renderFrame,
};
