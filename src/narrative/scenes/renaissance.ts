import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativeRenderContext, NarrativeRect, NarrativeScene } from '../../types/narrative.js';
import { cubicBezierEase, drawRule } from './common.js';
import { clamp, compositionFor, drawRoleText, mix, phasePosition, type StageCComposition } from './stage-c-common.js';
import { sceneVocabulary } from '../vocabulary.js';
import { sceneText } from '../i18n.js';

interface FrescoPanel {
  readonly identity: 'fresco-fragment';
  readonly composition: StageCComposition;
  readonly field: 'verdaccio' | 'powder';
  readonly archBias: number;
  readonly fragmentWidth: number;
  readonly catalogOffset: number;
}

function drawAsymmetricArch(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, panel: FrescoPanel, colors: ReturnType<typeof getStyle>['palette']): void {
  const { x, y, width: w, height: h } = box;
  // Flat plaster field and one asymmetric arch, with no vignette or radial wash.
  ctx.fillStyle = colors.surface;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = panel.field === 'verdaccio' ? colors.accent4 : colors.accent3;
  ctx.fillRect(x, y, w * 0.23, h);
  ctx.fillStyle = colors.accent3;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, y + h);
  ctx.lineTo(x + w * 0.12, y + h * 0.43);
  ctx.bezierCurveTo(x + w * 0.12, y + h * 0.18, x + w * (0.30 + panel.archBias), y + h * 0.06, x + w * 0.58, y + h * 0.10);
  ctx.bezierCurveTo(x + w * 0.83, y + h * 0.12, x + w * 0.90, y + h * 0.35, x + w * 0.90, y + h * 0.54);
  ctx.lineTo(x + w * 0.90, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = colors.accent2;
  ctx.fillRect(x + w * 0.86, y + h * 0.18, w * 0.04, h * 0.27);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(x + w * 0.12, y + h * 0.91, w * 0.78, h * 0.09);
  drawRule(ctx, x + w * 0.08, y + h * 0.91, x + w * 0.94, colors.ink, 2);
}

function drawFragment(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, piece: FrescoPanel, state: number, colors: ReturnType<typeof getStyle>['palette']): void {
  const fragmentW = box.width * piece.fragmentWidth;
  const fragmentH = box.height * 0.22;
  const start = { x: box.x + box.width * 0.045, y: box.y + box.height * 0.62 };
  const ledge = { x: box.x + box.width * 0.39, y: box.y + box.height * 0.64 };
  const slot = piece.composition === 'comparison'
    ? { x: box.x + box.width * 0.64, y: box.y + box.height * 0.40 }
    : { x: box.x + box.width * 0.66, y: box.y + box.height * (0.49 + piece.catalogOffset) };
  const progress = clamp(state);
  const finalProgress = clamp(state - 1);
  const x = state <= 1 ? mix(start.x, ledge.x, progress) : mix(ledge.x, slot.x, finalProgress);
  const y = state <= 1 ? mix(start.y, ledge.y, progress) : mix(ledge.y, slot.y, finalProgress);
  // A single cinnabar fragment is discovered, then seated in the painted register.
  ctx.fillStyle = colors.accent2;
  ctx.beginPath();
  ctx.moveTo(x, y + fragmentH * 0.08);
  ctx.lineTo(x + fragmentW * 0.84, y);
  ctx.lineTo(x + fragmentW, y + fragmentH * 0.73);
  ctx.lineTo(x + fragmentW * 0.87, y + fragmentH);
  ctx.lineTo(x + fragmentW * 0.11, y + fragmentH * 0.91);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = colors.bg;
  ctx.fillRect(x + fragmentW * 0.16, y + fragmentH * 0.25, fragmentW * 0.49, fragmentH * 0.05);
}

function drawComparison(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, panel: FrescoPanel, state: number, colors: ReturnType<typeof getStyle>['palette']): void {
  drawAsymmetricArch(ctx, box, panel, colors);
  ctx.fillStyle = colors.accent4;
  ctx.fillRect(box.x + box.width * 0.28, box.y + box.height * 0.76, box.width * 0.60, box.height * 0.08);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x + box.width * 0.59, box.y + box.height * 0.34, box.width * 0.27, box.height * 0.29);
  drawFragment(ctx, box, panel, state, colors);
}

function drawChecklist(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, panel: FrescoPanel, state: number, colors: ReturnType<typeof getStyle>['palette']): void {
  drawAsymmetricArch(ctx, box, panel, colors);
  const left = box.x + box.width * 0.33;
  const right = box.x + box.width * 0.82;
  const rows = [0.34, 0.52, 0.70];
  for (const [index, row] of rows.entries()) {
    const y = box.y + box.height * row;
    ctx.fillStyle = index === 1 ? colors.accent4 : colors.surface;
    ctx.fillRect(left, y, right - left, box.height * 0.10);
    drawRule(ctx, left, y + box.height * 0.10, right, colors.muted, 1.5);
  }
  drawFragment(ctx, box, panel, state, colors);
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  const { brief, layout } = context;
  const panel = context.object as FrescoPanel;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const art = layout.reservedArtArea;
  const box: NarrativeRect = { x: art.x, y: art.y, width: art.width, height: art.height };
  const colors = getStyle('renaissance').palette;
  const state = phasePosition(context, (value) => cubicBezierEase(value, 0.22, 0.61, 0.36, 1));
  if (panel.composition === 'comparison') drawComparison(ctx, box, panel, state, colors);
  else drawChecklist(ctx, box, panel, state, colors);
  drawRoleText(ctx, sceneText('renaissance', brief.locale, 'caption'), box.x + box.width * 0.68, box.y + box.height * 0.88, context.fonts.effective.annotation, 24, colors.ink);
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const renaissanceNarrativeScene: NarrativeScene = {
  style: 'renaissance',
  version: 'renaissance-fresco/1.0.0',
  vocabulary: sceneVocabulary('phase-order-fallback'),
  supportsAspect(aspect) {
    return [16 / 9, 1, 9 / 16].some((ratio) => Math.abs(aspect - ratio) / ratio < 0.015);
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'fresco-fragment',
      composition: compositionFor(brief.phases),
      field: rng() < 0.5 ? 'verdaccio' : 'powder',
      archBias: (rng() - 0.5) * 0.06,
      fragmentWidth: 0.17 + rng() * 0.035,
      catalogOffset: (rng() - 0.5) * 0.08,
    } satisfies FrescoPanel);
  },
  renderFrame,
};
