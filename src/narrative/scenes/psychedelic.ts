import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativePhase, NarrativeRect, NarrativeRenderContext, NarrativeScene, NormalizedNarrativeBrief } from '../../types/narrative.js';
import { cubicBezierEase } from './common.js';
import { sceneVocabulary } from '../vocabulary.js';
import { sceneText } from '../i18n.js';

interface LiquidPoster {
  readonly identity: 'flujo-de-senal';
  readonly composition: 'comparison' | 'checklist';
  readonly ripple: number;
  readonly twist: number;
}

function compositionFor(brief: NormalizedNarrativeBrief): LiquidPoster['composition'] {
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
  return from + (to - from) * cubicBezierEase(frame.progress, 0.22, 0.8, 0.24, 1);
}

function artField(width: number, height: number): NarrativeRect {
  return { x: width * 0.5, y: height * 0.03, width: width * 0.47, height: height * 0.94 };
}

function drawBlob(ctx: ReturnType<typeof canvasFor>['ctx'], x: number, y: number, rx: number, ry: number, phase: number, colorA: string, colorB: string): void {
  const wobble = Math.sin(phase) * 0.13;
  const gradient = ctx.createRadialGradient(x - rx * 0.18, y - ry * 0.28, Math.max(2, rx * 0.04), x, y, Math.max(rx, ry) * 1.08);
  gradient.addColorStop(0, colorA);
  gradient.addColorStop(1, colorB);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(x - rx * 0.92, y - ry * 0.12);
  ctx.bezierCurveTo(x - rx * (0.92 + wobble), y - ry * 0.95, x - rx * 0.08, y - ry * (1.08 - wobble), x + rx * 0.43, y - ry * 0.81);
  ctx.bezierCurveTo(x + rx * 1.12, y - ry * 0.48, x + rx * (0.97 - wobble), y + ry * 0.25, x + rx * 0.73, y + ry * 0.72);
  ctx.bezierCurveTo(x + rx * 0.34, y + ry * (1.08 + wobble), x - rx * 0.43, y + ry * 0.93, x - rx * 0.76, y + ry * 0.57);
  ctx.bezierCurveTo(x - rx * 1.14, y + ry * 0.27, x - rx * 1.03, y - ry * 0.02, x - rx * 0.92, y - ry * 0.12);
  ctx.closePath();
  ctx.fill();
}

function drawRibbons(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, poster: LiquidPoster, level: number, colors: { pink: string; orange: string; teal: string; yellow: string; cream: string }): void {
  const { x, y, width: w, height: h } = field;
  const focusX = x + w * 0.71;
  const focusY = y + h * 0.53;
  const order = Math.max(0, Math.min(1, level));
  const streams = [
    { color: colors.pink, startX: x + w * 0.33, startY: y + h * 0.31, controlX: x + w * 0.35, controlY: y + h * 0.67, endX: focusX - w * 0.14, endY: focusY - h * 0.12 },
    { color: colors.orange, startX: x + w * 0.91, startY: y + h * 0.29, controlX: x + w * 0.74, controlY: y + h * 0.14, endX: focusX + w * 0.12, endY: focusY - h * 0.06 },
    { color: colors.teal, startX: x + w * 0.35, startY: y + h * 0.77, controlX: x + w * 0.53, controlY: y + h * 0.83, endX: focusX - w * 0.1, endY: focusY + h * 0.13 },
  ];
  streams.forEach((stream, index) => {
    const bend = (1 - order) * (index % 2 ? -1 : 1) * (h * 0.16 + poster.twist);
    ctx.strokeStyle = stream.color;
    ctx.lineWidth = h * (0.052 + index * 0.007);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(stream.startX, stream.startY + (1 - order) * poster.ripple);
    ctx.bezierCurveTo(stream.controlX, stream.controlY + bend, stream.endX - bend * 0.25, stream.endY + bend, focusX - w * 0.03, focusY + (index - 1) * h * 0.05);
    ctx.stroke();
  });
  ctx.fillStyle = colors.yellow;
  ctx.beginPath();
  ctx.arc(x + w * 0.38, y + h * 0.54, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.arc(focusX - w * 0.03, focusY, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawChecklistBands(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, poster: LiquidPoster, level: number, colors: { pink: string; orange: string; teal: string; yellow: string }): void {
  const { x, y, width: w, height: h } = field;
  const bands = [
    { color: colors.pink, baseY: 0.30, chaotic: -0.13, target: -0.03 },
    { color: colors.orange, baseY: 0.50, chaotic: 0.14, target: 0.0 },
    { color: colors.teal, baseY: 0.70, chaotic: -0.1, target: 0.03 },
  ];
  bands.forEach((band, index) => {
    const settle = index === 0 ? Math.max(0, Math.min(1, level)) : Math.max(0, Math.min(1, level - 1));
    const displacement = band.chaotic * (1 - settle) + band.target * settle;
    const cy = y + h * band.baseY;
    const left = x + w * 0.31;
    const right = x + w * 0.82;
    ctx.strokeStyle = band.color;
    ctx.lineWidth = h * 0.07;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(left, cy + h * displacement);
    ctx.bezierCurveTo(left + w * 0.12, cy - h * displacement, right - w * 0.14, cy + h * displacement * 0.8, right, cy + h * band.target);
    ctx.stroke();
    ctx.fillStyle = colors.yellow;
    ctx.beginPath();
    ctx.arc(right, cy + h * band.target, 7, 0, Math.PI * 2);
    ctx.fill();
  });
  const signalProgress = Math.max(0, Math.min(1, level / 2));
  const signalT = 0.1 + signalProgress * 0.37;
  const signalX = x + w * (0.31 + 0.51 * signalT);
  const orangeSettle = Math.max(0, Math.min(1, level - 1));
  const orangeOffset = bands[1]!.chaotic * (1 - orangeSettle);
  const orangeStartY = y + h * (0.5 + orangeOffset);
  const orangeControlY = y + h * (0.5 - orangeOffset);
  const orangeControl2Y = y + h * (0.5 + orangeOffset * 0.8);
  const orangeEndY = y + h * 0.5;
  const inverse = 1 - signalT;
  const signalY = inverse ** 3 * orangeStartY
    + 3 * inverse ** 2 * signalT * orangeControlY
    + 3 * inverse * signalT ** 2 * orangeControl2Y
    + signalT ** 3 * orangeEndY;
  drawBlob(ctx, signalX, signalY, w * 0.045, h * 0.04, poster.twist * 0.04, colors.yellow, colors.orange);
}

function drawFocus(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, family: string, locale: 'es' | 'en', colors: { cream: string; dark: string; yellow: string }): void {
  const cx = field.x + field.width * 0.71;
  const cy = field.y + field.height * 0.53;
  const radius = field.height * 0.14;
  // This quiet reading/focus disk is deliberately identical in every frame.
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.dark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = `500 24px "${family}"`;
  ctx.fillStyle = colors.dark;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sceneText('psychedelic', locale, 'review'), cx, cy);
  ctx.textAlign = 'start';
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  const { brief, object, fonts } = context;
  const poster = object as LiquidPoster;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const preset = getStyle('psychedelic');
  const field = artField(brief.output.width, brief.output.height);
  const level = stateLevel(context);
  const colors = { pink: preset.palette.accent, orange: preset.palette.accent2, yellow: preset.palette.accent3, teal: preset.palette.accent4, cream: preset.palette.ink, dark: preset.palette.bg };

  // Hard-edged poster panel; the reading area remains a flat, quiet night field.
  ctx.fillStyle = '#11101F';
  ctx.fillRect(field.x + 9, field.y + 9, field.width, field.height);
  ctx.fillStyle = preset.palette.surface;
  ctx.fillRect(field.x, field.y, field.width, field.height);
  ctx.strokeStyle = '#11101F';
  ctx.lineWidth = 4;
  ctx.strokeRect(field.x, field.y, field.width, field.height);
  ctx.save();
  ctx.beginPath();
  ctx.rect(field.x + field.width * 0.28, field.y + field.height * 0.1, field.width * 0.69, field.height * 0.82);
  ctx.clip();
  if (poster.composition === 'checklist') drawChecklistBands(ctx, field, poster, level, colors);
  else drawRibbons(ctx, field, poster, level / 2, colors);
  if (poster.composition === 'comparison') {
    const bubbleX = field.x + field.width * (0.45 + level * 0.11);
    const bubbleY = field.y + field.height * (0.26 + level * 0.03);
    drawBlob(ctx, bubbleX, bubbleY, field.width * 0.12, field.height * 0.105, poster.twist * 0.08, colors.pink, colors.orange);
  }
  ctx.restore();
  drawFocus(ctx, field, fonts.effective.label.family, brief.locale, colors);
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const psychedelicNarrativeScene: NarrativeScene = {
  style: 'psychedelic',
  version: 'psychedelic-fluid-focus/1.0.0',
  vocabulary: sceneVocabulary('value-driven'),
  supportsAspect(aspect) {
    return [16 / 9, 1].some((ratio) => Math.abs(aspect - ratio) / ratio < 0.015);
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'flujo-de-senal',
      composition: compositionFor(brief),
      ripple: (rng() - 0.5) * 24,
      twist: 12 + rng() * 28,
    } satisfies LiquidPoster);
  },
  renderFrame,
};
