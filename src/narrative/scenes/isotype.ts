import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativeRenderContext, NarrativeRect, NarrativeScene } from '../../types/narrative.js';
import { cubicBezierEase, drawRule } from './common.js';
import { clamp, compositionFor, drawRoleText, mix, phasePosition, type StageCComposition } from './stage-c-common.js';
import { sceneVocabulary } from '../vocabulary.js';
import { sceneText } from '../i18n.js';

interface QualitativeSet {
  readonly identity: 'guide-stage-pictogram-set';
  readonly composition: StageCComposition;
  readonly unitCount: number;
  readonly gridOffset: number;
  readonly iconScale: number;
}

function drawDocumentPictogram(ctx: ReturnType<typeof canvasFor>['ctx'], centerX: number, centerY: number, size: number, ink: string, paper: string, signal: string): void {
  const w = size * 0.68;
  const h = size;
  const x = centerX - w / 2;
  const y = centerY - h / 2;
  const fold = w * 0.25;
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w - fold, y);
  ctx.lineTo(x + w, y + fold);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = paper;
  ctx.beginPath();
  ctx.moveTo(x + w - fold * 0.85, y + 2);
  ctx.lineTo(x + w - 2, y + fold * 0.85);
  ctx.lineTo(x + w - fold * 0.85, y + fold * 0.85);
  ctx.closePath();
  ctx.fill();
  drawRule(ctx, x + w * 0.18, y + h * 0.48, x + w * 0.78, paper, Math.max(2, size * 0.025));
  drawRule(ctx, x + w * 0.18, y + h * 0.62, x + w * 0.68, paper, Math.max(2, size * 0.025));
  drawRule(ctx, x + w * 0.18, y + h * 0.76, x + w * 0.72, paper, Math.max(2, size * 0.025));
  ctx.fillStyle = signal;
  ctx.fillRect(x + w * 0.10, y + h * 0.12, w * 0.16, h * 0.12);
}

function qualitativeHeading(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, context: NarrativeRenderContext, colors: ReturnType<typeof getStyle>['palette']): void {
  // The visible ruled perimeter makes this a compact Isotype table, not a floating card.
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  drawRoleText(ctx, sceneText('isotype', context.brief.locale, 'categories'), box.x + box.width * 0.055, box.y + box.height * 0.075, context.fonts.effective.label, 24, colors.ink);
  drawRoleText(ctx, sceneText('isotype', context.brief.locale, 'noMetric'), box.x + box.width * 0.055, box.y + box.height * 0.12, context.fonts.effective.annotation, 24, colors.muted);
  drawRule(ctx, box.x + box.width * 0.05, box.y + box.height * 0.15, box.x + box.width * 0.95, colors.ink, 2);
}

function categoryName(index: number, count: number, context: NarrativeRenderContext): string {
  if (index === 0) return sceneText('isotype', context.brief.locale, 'before');
  if (index === count - 1) return sceneText('isotype', context.brief.locale, context.brief.outcome.mode);
  if (index === 1) return sceneText('isotype', context.brief.locale, 'change');
  return sceneText('isotype', context.brief.locale, 'stage');
}

function drawComparison(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, set: QualitativeSet, state: number, context: NarrativeRenderContext, colors: ReturnType<typeof getStyle>['palette']): void {
  qualitativeHeading(ctx, box, context, colors);
  const count = set.unitCount;
  const top = box.y + box.height * 0.22;
  const bottom = box.y + box.height * 0.90;
  const step = (bottom - top) / count;
  const centerX = box.x + box.width * (0.50 + set.gridOffset);
  drawRule(ctx, box.x + box.width * 0.09, top, box.x + box.width * 0.91, colors.accent4, 1);
  drawRule(ctx, box.x + box.width * 0.09, bottom, box.x + box.width * 0.91, colors.accent4, 1);
  for (let index = 0; index < count; index += 1) {
    const centerY = top + step * (index + 0.5);
    const iconSize = Math.min(box.width * 0.28, step * 0.46) * set.iconScale;
    drawDocumentPictogram(ctx, centerX, centerY - step * 0.04, iconSize, colors.ink, colors.bg, colors.accent4);
    drawRoleText(ctx, categoryName(index, count, context), box.x + box.width * 0.17, centerY + step * 0.34, context.fonts.effective.label, 24, colors.ink);
    drawRule(ctx, box.x + box.width * 0.09, top + step * (index + 1), box.x + box.width * 0.91, colors.accent4, 1);
  }
  // This red register is the one moving focus; the pictogram set itself is unchanged.
  const activeY = mix(top + step * 0.5, top + step * (count - 0.5), clamp(state / 2));
  ctx.fillStyle = colors.accent;
  ctx.fillRect(box.x + box.width * 0.07, activeY - step * 0.11, box.width * 0.018, step * 0.22);
}

function drawChecklist(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, set: QualitativeSet, state: number, context: NarrativeRenderContext, colors: ReturnType<typeof getStyle>['palette']): void {
  qualitativeHeading(ctx, box, context, colors);
  const count = set.unitCount;
  const left = box.x + box.width * 0.08;
  const right = box.x + box.width * 0.92;
  const top = box.y + box.height * 0.22;
  const rowHeight = box.height * 0.68 / count;
  const iconSize = Math.min(box.width * 0.19, rowHeight * 0.66) * set.iconScale;
  for (let index = 0; index < count; index += 1) {
    const y = top + rowHeight * index;
    const centerY = y + rowHeight / 2;
    drawRule(ctx, left, y + rowHeight, right, colors.accent4, 1);
    drawDocumentPictogram(ctx, left + box.width * 0.13, centerY, iconSize, colors.ink, colors.bg, colors.accent4);
    drawRoleText(ctx, categoryName(index, count, context), left + box.width * 0.28, centerY + 9, context.fonts.effective.label, 24, colors.ink);
  }
  const markerY = top + rowHeight * (clamp(state / 2) * (count - 1) + 0.5);
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 5;
  ctx.strokeRect(left, markerY - rowHeight * 0.38, right - left, rowHeight * 0.76);
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  const { brief, layout } = context;
  const set = context.object as QualitativeSet;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const box = layout.reservedArtArea;
  const colors = getStyle('isotype').palette;
  const state = phasePosition(context, (value) => cubicBezierEase(value, 0.2, 0.75, 0.3, 1));
  if (set.composition === 'comparison') drawComparison(ctx, box, set, state, context, colors);
  else drawChecklist(ctx, box, set, state, context, colors);
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const isotypeNarrativeScene: NarrativeScene = {
  style: 'isotype',
  version: 'isotype-qualitative-pictograms/1.0.0',
  vocabulary: sceneVocabulary('phase-order-fallback'),
  supportsAspect(aspect) {
    return [16 / 9, 1, 9 / 16].some((ratio) => Math.abs(aspect - ratio) / ratio < 0.015);
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'guide-stage-pictogram-set',
      composition: compositionFor(brief.phases),
      unitCount: brief.phases.length,
      gridOffset: (rng() - 0.5) * 0.02,
      iconScale: 0.97 + rng() * 0.06,
    } satisfies QualitativeSet);
  },
  renderFrame,
};
