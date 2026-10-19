import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativePhase, NarrativeRect, NarrativeRenderContext, NarrativeScene, NormalizedNarrativeBrief } from '../../types/narrative.js';
import { cubicBezierEase, drawText } from './common.js';
import { sceneVocabulary } from '../vocabulary.js';
import { sceneText } from '../i18n.js';

interface MemphisReview {
  readonly identity: 'ficha-de-revision';
  readonly composition: 'comparison' | 'checklist';
  readonly protagonistAngle: number;
  readonly accent: 'pink' | 'mint';
  readonly chipOffset: number;
}

function compositionFor(brief: NormalizedNarrativeBrief): MemphisReview['composition'] {
  const kind = brief.phases[0]!.visual.kind.toLowerCase();
  return /checklist|process|lista|proceso/u.test(kind) ? 'checklist' : 'comparison';
}

function stateRank(phase: NarrativePhase): number {
  const state = phase.visual.state.toLowerCase();
  if (/^unreviewed$|^before$|^pending$/u.test(state)) return 0;
  if (/flag|signal|observation|observaci/u.test(state)) return 1;
  if (/review.?ready|^reviewed$|^ready$|^done$|verified|list/u.test(state)) return 2;
  return 0;
}

function stateLevel(context: NarrativeRenderContext): number {
  const { frame, brief } = context;
  if (frame.kind !== 'transition' && frame.kind !== 'loop-bridge') return stateRank(brief.phases[frame.phaseIndex]!);
  const from = stateRank(brief.phases[frame.fromPhaseIndex]!);
  const to = stateRank(brief.phases[frame.toPhaseIndex]!);
  return from + (to - from) * cubicBezierEase(frame.progress, 0.22, 0.61, 0.36, 1);
}

function artField(width: number, height: number): NarrativeRect {
  return { x: width * 0.5, y: height * 0.03, width: width * 0.47, height: height * 0.94 };
}

function drawSquiggle(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, pink: string, offset: number): void {
  const { x, y, width: w, height: h } = field;
  ctx.strokeStyle = pink;
  ctx.lineWidth = 14;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.33, y + h * 0.14 + offset);
  ctx.bezierCurveTo(x + w * 0.4, y + h * 0.05, x + w * 0.49, y + h * 0.26, x + w * 0.57, y + h * 0.16);
  ctx.bezierCurveTo(x + w * 0.66, y + h * 0.06, x + w * 0.68, y + h * 0.28, x + w * 0.76, y + h * 0.18);
  ctx.stroke();
}

function drawTerrazzo(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, cobalt: string, butter: string, mint: string, offset: number): void {
  const { x, y, width: w, height: h } = field;
  const chips = [
    { x: 0.84, y: 0.16, color: cobalt, size: 11 },
    { x: 0.91, y: 0.24, color: butter, size: 8 },
    { x: 0.87, y: 0.8, color: mint, size: 10 },
    { x: 0.94, y: 0.73, color: cobalt, size: 7 },
  ];
  for (const [index, chip] of chips.entries()) {
    const cx = x + w * chip.x + (index % 2 ? offset : -offset);
    const cy = y + h * chip.y;
    ctx.fillStyle = chip.color;
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2;
    if (index % 2 === 0) {
      ctx.beginPath();
      ctx.moveTo(cx, cy - chip.size);
      ctx.lineTo(cx + chip.size, cy);
      ctx.lineTo(cx, cy + chip.size);
      ctx.lineTo(cx - chip.size, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect(cx - chip.size, cy - chip.size, chip.size * 2, chip.size * 2);
      ctx.strokeRect(cx - chip.size, cy - chip.size, chip.size * 2, chip.size * 2);
    }
  }
}

function drawMarker(ctx: ReturnType<typeof canvasFor>['ctx'], x: number, y: number, size: number, cobalt: string): void {
  ctx.fillStyle = cobalt;
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 3;
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
  ctx.strokeRect(x - size / 2, y - size / 2, size, size);
}

function drawCheck(ctx: ReturnType<typeof canvasFor>['ctx'], x: number, y: number, size: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(x - size * 0.32, y);
  ctx.lineTo(x - size * 0.08, y + size * 0.24);
  ctx.lineTo(x + size * 0.36, y - size * 0.3);
  ctx.stroke();
}

function drawComparisonCard(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, review: MemphisReview, level: number, face: string, locale: 'es' | 'en', colors: { ink: string; pink: string; mint: string; cobalt: string; butter: string }): void {
  const eased = cubicBezierEase(Math.max(0, Math.min(1, level / 2)), 0.22, 0.61, 0.36, 1);
  const angle = review.protagonistAngle * (1 - eased);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  const accent = review.accent === 'pink' ? colors.pink : colors.mint;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle * Math.PI / 180);
  ctx.translate(-centerX, -centerY);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(box.x + 8, box.y + 8, box.width, box.height);
  ctx.fillStyle = '#F5F0E6';
  ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  ctx.fillStyle = accent;
  ctx.fillRect(box.x + box.width * 0.08, box.y + box.height * 0.1, box.width * 0.38, box.height * 0.19);
  drawText(ctx, sceneText('memphis', locale, 'measure'), box.x + box.width * 0.12, box.y + box.height * 0.235, face, 500, 24, colors.ink);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  for (let row = 0; row < 3; row += 1) {
    const y = box.y + box.height * (0.43 + row * 0.15);
    ctx.beginPath();
    ctx.moveTo(box.x + box.width * 0.1, y);
    ctx.lineTo(box.x + box.width * 0.74, y);
    ctx.stroke();
  }
  const slot = { x: box.x + box.width * 0.81, y: box.y + box.height * 0.58 };
  ctx.strokeRect(slot.x - 13, slot.y - 13, 26, 26);
  const markerProgress = Math.max(0, Math.min(1, level));
  const markerX = box.x + box.width * (0.1 + markerProgress * 0.71);
  const markerY = box.y + box.height * 0.58;
  drawMarker(ctx, markerX, markerY, 25, colors.cobalt);
  if (level > 0.75) drawCheck(ctx, slot.x, slot.y, 22, colors.ink);
  if (level > 1.75) {
    ctx.fillStyle = colors.butter;
    ctx.fillRect(box.x + box.width * 0.09, box.y + box.height * 0.79, box.width * 0.37, box.height * 0.085);
    drawText(ctx, sceneText('memphis', locale, 'review'), box.x + box.width * 0.12, box.y + box.height * 0.85, face, 500, 24, colors.ink);
  }
  ctx.restore();
}

function drawChecklistCard(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, review: MemphisReview, level: number, face: string, locale: 'es' | 'en', colors: { ink: string; pink: string; mint: string; cobalt: string; butter: string }): void {
  const eased = cubicBezierEase(Math.max(0, Math.min(1, level / 2)), 0.22, 0.61, 0.36, 1);
  const angle = review.protagonistAngle * (1 - eased);
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle * Math.PI / 180);
  ctx.translate(-centerX, -centerY);
  ctx.fillStyle = colors.ink;
  ctx.fillRect(box.x + 8, box.y + 8, box.width, box.height);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  ctx.fillStyle = review.accent === 'pink' ? colors.pink : colors.mint;
  ctx.fillRect(box.x + box.width * 0.08, box.y + box.height * 0.08, box.width * 0.78, box.height * 0.16);
  drawText(ctx, sceneText('memphis', locale, 'reviewBeforeClosing'), box.x + box.width * 0.11, box.y + box.height * 0.19, face, 500, 24, colors.ink);
  const rows = [
    { label: sceneText('memphis', locale, 'read'), y: box.y + box.height * 0.42, reached: 1 },
    { label: sceneText('memphis', locale, 'mark'), y: box.y + box.height * 0.59, reached: level },
    { label: sceneText('memphis', locale, 'reviewAction'), y: box.y + box.height * 0.76, reached: Math.max(0, level - 1) },
  ];
  for (const row of rows) {
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x + box.width * 0.1, row.y - 19, 26, 26);
    if (row.reached >= 1) drawCheck(ctx, box.x + box.width * 0.1 + 13, row.y - 6, 20, colors.cobalt);
    const markerProgress = Math.max(0, Math.min(1, row.reached));
    if (row.reached > 0 && row.reached < 1) {
      const markerX = box.x + box.width * (0.04 + markerProgress * 0.06);
      drawMarker(ctx, markerX, row.y - 6, 16, colors.cobalt);
    }
    drawText(ctx, row.label, box.x + box.width * 0.2, row.y, face, 500, 24, colors.ink);
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(box.x + box.width * 0.53, row.y - 7);
    ctx.lineTo(box.x + box.width * 0.87, row.y - 7);
    ctx.stroke();
  }
  ctx.restore();
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  const { brief, object, fonts } = context;
  const review = object as MemphisReview;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const preset = getStyle('memphis');
  const field = artField(brief.output.width, brief.output.height);
  const level = stateLevel(context);
  const colors = { ink: preset.palette.ink, pink: preset.palette.accent, mint: preset.palette.accent2, cobalt: preset.palette.accent3, butter: preset.palette.accent4 };
  const card: NarrativeRect = {
    x: field.x + field.width * 0.3,
    y: field.y + field.height * 0.27,
    width: field.width * 0.62,
    height: field.height * 0.55,
  };

  // One bone-white stage gives the asymmetry a frame; chips stay fixed while its one card settles.
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(field.x, field.y, field.width, field.height);
  drawSquiggle(ctx, field, colors.pink, review.chipOffset);
  drawTerrazzo(ctx, field, colors.cobalt, colors.butter, colors.mint, review.chipOffset);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(field.x, field.y, field.width, field.height);
  if (review.composition === 'checklist') drawChecklistCard(ctx, card, review, level, fonts.effective.label.family, brief.locale, colors);
  else drawComparisonCard(ctx, card, review, level, fonts.effective.label.family, brief.locale, colors);
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const memphisNarrativeScene: NarrativeScene = {
  style: 'memphis',
  version: 'memphis-keyline-assembly/1.0.0',
  vocabulary: sceneVocabulary('value-driven'),
  supportsAspect(aspect) {
    return [16 / 9, 1].some((ratio) => Math.abs(aspect - ratio) / ratio < 0.015);
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'ficha-de-revision',
      composition: compositionFor(brief),
      protagonistAngle: 2.5 + rng() * 1.5,
      accent: rng() < 0.5 ? 'pink' : 'mint',
      chipOffset: 3 + rng() * 7,
    } satisfies MemphisReview);
  },
  renderFrame,
};
