import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativeRenderContext, NarrativeRect, NarrativeScene } from '../../types/narrative.js';
import { cubicBezierEase, drawRule } from './common.js';
import { sceneVocabulary } from '../vocabulary.js';
import { sceneText } from '../i18n.js';
import { clamp, compositionFor, drawRoleText, mix, phasePosition, type StageCComposition } from './stage-c-common.js';

interface DecoAxis {
  readonly identity: 'stepped-lacquer-panel';
  readonly composition: StageCComposition;
  readonly axisOffset: number;
  readonly plaqueHeight: number;
  readonly captionOffset: number;
}

function steppedFrame(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, inset: number, color: string, width: number): void {
  const x = box.x + box.width * inset;
  const y = box.y + box.height * inset * 0.4;
  const w = box.width * (1 - inset * 2);
  const h = box.height * (1 - inset * 0.8);
  const step = Math.min(w, h) * 0.055;
  ctx.beginPath();
  ctx.moveTo(x + step, y);
  ctx.lineTo(x + w - step, y);
  ctx.lineTo(x + w - step, y + step);
  ctx.lineTo(x + w, y + step);
  ctx.lineTo(x + w, y + h - step);
  ctx.lineTo(x + w - step, y + h - step);
  ctx.lineTo(x + w - step, y + h);
  ctx.lineTo(x + step, y + h);
  ctx.lineTo(x + step, y + h - step);
  ctx.lineTo(x, y + h - step);
  ctx.lineTo(x, y + step);
  ctx.lineTo(x + step, y + step);
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawAxis(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, panel: DecoAxis, progress: number, colors: ReturnType<typeof getStyle>['palette']): void {
  const centerX = box.x + box.width * (0.5 + panel.axisOffset);
  steppedFrame(ctx, box, 0.015, colors.accent, 2);
  steppedFrame(ctx, box, 0.075, colors.accent, 1);
  steppedFrame(ctx, box, 0.14, colors.accent, 1);
  ctx.fillStyle = colors.surface;
  ctx.fillRect(centerX - box.width * 0.015, box.y + box.height * 0.05, box.width * 0.03, box.height * 0.90);
  ctx.fillStyle = colors.accent2;
  ctx.fillRect(centerX - box.width * 0.011, box.y + box.height * 0.08, box.width * 0.022, box.height * 0.84);
  const lineY = box.y + box.height * 0.12;
  ctx.fillStyle = colors.accent;
  ctx.fillRect(centerX - box.width * 0.002, lineY, box.width * 0.004, box.height * 0.76 * progress);
  drawRule(ctx, box.x + box.width * 0.22, box.y + box.height * 0.91, box.x + box.width * 0.78, colors.accent, 1);
}

function plaquePosition(box: NarrativeRect, panel: DecoAxis, state: number): { x: number; y: number } {
  const start = { x: box.x + box.width * 0.20, y: box.y + box.height * 0.27 };
  const axis = { x: box.x + box.width * (0.5 + panel.axisOffset) - box.width * 0.12, y: box.y + box.height * 0.27 };
  const frame = { x: axis.x, y: box.y + box.height * (0.50 - panel.captionOffset) };
  if (state <= 1) return { x: mix(start.x, axis.x, clamp(state)), y: mix(start.y, axis.y, clamp(state)) };
  return { x: mix(axis.x, frame.x, clamp(state - 1)), y: mix(axis.y, frame.y, clamp(state - 1)) };
}

function drawComparison(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, panel: DecoAxis, state: number, colors: ReturnType<typeof getStyle>['palette']): void {
  drawAxis(ctx, box, panel, clamp(state), colors);
  const position = plaquePosition(box, panel, state);
  const plaqueW = box.width * 0.24;
  const plaqueH = box.height * panel.plaqueHeight;
  const step = box.width * 0.035;
  ctx.fillStyle = colors.surface;
  ctx.beginPath();
  ctx.moveTo(position.x + step, position.y);
  ctx.lineTo(position.x + plaqueW - step, position.y);
  ctx.lineTo(position.x + plaqueW - step, position.y + step);
  ctx.lineTo(position.x + plaqueW, position.y + step);
  ctx.lineTo(position.x + plaqueW, position.y + plaqueH);
  ctx.lineTo(position.x, position.y + plaqueH);
  ctx.lineTo(position.x, position.y + step);
  ctx.lineTo(position.x + step, position.y + step);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawRule(ctx, position.x + plaqueW * 0.16, position.y + plaqueH * 0.38, position.x + plaqueW * 0.84, colors.ink, 2);
  drawRule(ctx, position.x + plaqueW * 0.16, position.y + plaqueH * 0.56, position.x + plaqueW * 0.70, colors.ink, 1.5);
  drawRule(ctx, position.x + plaqueW * 0.16, position.y + plaqueH * 0.68, position.x + plaqueW * 0.62, colors.ink, 1.5);
}

function drawChecklist(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, panel: DecoAxis, state: number, colors: ReturnType<typeof getStyle>['palette']): void {
  drawAxis(ctx, box, panel, clamp(state), colors);
  const centerX = box.x + box.width * (0.5 + panel.axisOffset);
  const rows = [0.25, 0.49, 0.73];
  for (const [index, row] of rows.entries()) {
    const width = box.width * (index === 1 ? 0.34 : 0.28);
    const x = centerX - width / 2 + (index === 1 ? box.width * 0.035 : 0);
    const y = box.y + box.height * row;
    const height = box.height * 0.13;
    steppedFrame(ctx, { x, y, width, height }, 0.06, colors.accent, 1.5);
    ctx.fillStyle = index === 1 ? colors.accent3 : colors.surface;
    ctx.fillRect(x + width * 0.12, y + height * 0.24, width * 0.76, height * 0.52);
  }
  // One ivory marker glides along the axis to record the active review state.
  const markerY = mix(box.y + box.height * 0.31, box.y + box.height * 0.76, clamp(state / 2));
  ctx.fillStyle = colors.accent;
  ctx.fillRect(centerX - box.width * 0.18, markerY, box.width * 0.045, box.height * 0.045);
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  const { brief, layout } = context;
  const panel = context.object as DecoAxis;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const box = layout.reservedArtArea;
  const colors = getStyle('artdeco').palette;
  const state = phasePosition(context, (value) => cubicBezierEase(value, 0.18, 0.68, 0.24, 1));
  if (panel.composition === 'comparison') drawComparison(ctx, box, panel, state, colors);
  else drawChecklist(ctx, box, panel, state, colors);
  // A single off-axis caption breaks the centered portal; no rays sit behind copy.
  drawRoleText(ctx, sceneText('artdeco', brief.locale, 'caption'), box.x + box.width * 0.08, box.y + box.height * 0.96, context.fonts.effective.annotation, 24, colors.ink);
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const artdecoNarrativeScene: NarrativeScene = {
  style: 'artdeco',
  version: 'artdeco-lacquer-axis/1.0.0',
  vocabulary: sceneVocabulary('phase-order-fallback'),
  supportsAspect(aspect) {
    return [16 / 9, 1, 9 / 16].some((ratio) => Math.abs(aspect - ratio) / ratio < 0.015);
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'stepped-lacquer-panel',
      composition: compositionFor(brief.phases),
      axisOffset: (rng() - 0.5) * 0.035,
      plaqueHeight: 0.39 + rng() * 0.035,
      captionOffset: (rng() - 0.5) * 0.03,
    } satisfies DecoAxis);
  },
  renderFrame,
};
