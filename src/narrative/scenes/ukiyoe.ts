import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativePhase, NarrativeRect, NarrativeRenderContext, NarrativeScene, NormalizedNarrativeBrief } from '../../types/narrative.js';
import { cubicBezierEase, drawText } from './common.js';
import { sceneVocabulary } from '../vocabulary.js';
import { sceneText } from '../i18n.js';

interface CoastPrint {
  readonly identity: 'guia-en-recorrido-costero';
  readonly composition: 'comparison' | 'checklist';
  readonly boatOffset: number;
  readonly waveOffset: number;
}

function compositionFor(brief: NormalizedNarrativeBrief): CoastPrint['composition'] {
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
  const progress = cubicBezierEase(frame.progress, 0.22, 0.61, 0.36, 1);
  return from + (to - from) * progress;
}

function artField(width: number, height: number): NarrativeRect {
  return { x: width * 0.5, y: height * 0.03, width: width * 0.47, height: height * 0.94 };
}

function drawSea(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, level: number, print: CoastPrint, blue: string, mist: string, moss: string): void {
  const { x, y, width: w, height: h } = field;
  const shoreStart = x + w * 0.3;
  const waterTop = y + h * 0.52;
  ctx.fillStyle = blue;
  ctx.beginPath();
  ctx.moveTo(shoreStart, waterTop);
  ctx.lineTo(x + w, waterTop);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(shoreStart, y + h);
  ctx.closePath();
  ctx.fill();

  const drift = (level > 0 && level < 2 ? 1 : 0) * (8 + print.waveOffset);
  ctx.fillStyle = mist;
  ctx.beginPath();
  ctx.moveTo(shoreStart, y + h * 0.67 + drift);
  ctx.bezierCurveTo(x + w * 0.49, y + h * 0.59 + drift, x + w * 0.58, y + h * 0.75 + drift, x + w, y + h * 0.62 + drift);
  ctx.lineTo(x + w, y + h * 0.79);
  ctx.bezierCurveTo(x + w * 0.71, y + h * 0.9, x + w * 0.54, y + h * 0.7, shoreStart, y + h * 0.83);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = moss;
  ctx.beginPath();
  ctx.moveTo(shoreStart, y + h * 0.83);
  ctx.bezierCurveTo(x + w * 0.52, y + h * 0.76, x + w * 0.72, y + h * 0.98, x + w, y + h * 0.84);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(shoreStart, y + h);
  ctx.closePath();
  ctx.fill();
}

function drawMountain(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, blue: string, distant: string): void {
  const { x, y, width: w, height: h } = field;
  const base = y + h * 0.53;
  const start = x + w * 0.32;
  ctx.fillStyle = distant;
  ctx.beginPath();
  ctx.moveTo(start, base);
  ctx.lineTo(x + w * 0.47, y + h * 0.39);
  ctx.lineTo(x + w * 0.53, y + h * 0.44);
  ctx.lineTo(x + w * 0.61, y + h * 0.32);
  ctx.lineTo(x + w * 0.69, y + h * 0.47);
  ctx.lineTo(x + w * 0.76, y + h * 0.43);
  ctx.lineTo(x + w, y + h * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = blue;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.59, base);
  ctx.lineTo(x + w * 0.72, y + h * 0.39);
  ctx.lineTo(x + w * 0.82, y + h * 0.47);
  ctx.lineTo(x + w, y + h * 0.4);
  ctx.lineTo(x + w, base);
  ctx.closePath();
  ctx.fill();
}

function drawCartouche(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, ink: string, vermilion: string, face: string, locale: 'es' | 'en'): void {
  const { x, y, width: w, height: h } = field;
  const box = { x: x + w * 0.69, y: y + h * 0.08, width: w * 0.25, height: h * 0.31 };
  ctx.fillStyle = '#F3E9D2';
  ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  ctx.strokeStyle = vermilion;
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x + 5, box.y + 5, box.width - 10, box.height - 10);
  drawText(ctx, sceneText('ukiyoe', locale, 'point'), box.x + box.width * 0.12, box.y + box.height * 0.39, face, 500, 24, ink);
  drawText(ctx, sceneText('ukiyoe', locale, 'of'), box.x + box.width * 0.12, box.y + box.height * 0.62, face, 500, 24, ink);
  drawText(ctx, sceneText('ukiyoe', locale, 'review'), box.x + box.width * 0.12, box.y + box.height * 0.85, face, 500, 24, ink);
}

function drawReference(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, ink: string, vermilion: string, face: string, locale: 'es' | 'en'): { x: number; y: number } {
  const point = { x: field.x + field.width * 0.66, y: field.y + field.height * 0.51 };
  ctx.fillStyle = vermilion;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#F3E9D2';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
  ctx.stroke();
  drawText(ctx, sceneText('ukiyoe', locale, 'signal'), point.x + 18, point.y - 15, face, 500, 24, ink);
  return point;
}

function drawBoat(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, print: CoastPrint, ink: string, blue: string): { x: number; y: number } {
  const x = field.x + field.width * (0.39 + print.boatOffset);
  const y = field.y + field.height * 0.78;
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(x - 25, y);
  ctx.lineTo(x + 28, y);
  ctx.lineTo(x + 17, y + 9);
  ctx.lineTo(x - 17, y + 9);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = blue;
  ctx.beginPath();
  ctx.moveTo(x, y - 27);
  ctx.lineTo(x, y - 2);
  ctx.lineTo(x + 19, y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#F3E9D2';
  ctx.beginPath();
  ctx.moveTo(x - 4, y - 25);
  ctx.lineTo(x - 4, y - 2);
  ctx.lineTo(x - 22, y - 2);
  ctx.closePath();
  ctx.fill();
  return { x, y: y - 5 };
}

function drawJourney(ctx: ReturnType<typeof canvasFor>['ctx'], start: { x: number; y: number }, end: { x: number; y: number }, progress: number, ink: string, vermilion: string): void {
  if (progress <= 0.01) return;
  const t = Math.max(0, Math.min(1, progress));
  const target = { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
  ctx.strokeStyle = vermilion;
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.quadraticCurveTo((start.x + target.x) / 2, start.y - 55, target.x, target.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawChecklistRoute(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, level: number, colors: { blue: string; mist: string; moss: string; vermilion: string }): void {
  const { x, y, width: w, height: h } = field;
  const colorsByLayer = [colors.blue, colors.mist, colors.moss];
  for (let index = 0; index < 3; index += 1) {
    const reveal = Math.max(0, Math.min(1, level - index + 1));
    if (reveal <= 0.01) continue;
    const lineY = y + h * (0.62 + index * 0.1);
    const startX = x + w * 0.31;
    const endX = startX + (w * 0.57) * reveal;
    ctx.strokeStyle = colorsByLayer[index]!;
    ctx.lineWidth = 12 - index * 2;
    ctx.beginPath();
    ctx.moveTo(startX, lineY + (index % 2 ? 8 : -8));
    ctx.bezierCurveTo(startX + w * 0.18, lineY - 23, endX - w * 0.1, lineY + 22, endX, lineY);
    ctx.stroke();
    ctx.fillStyle = colors.vermilion;
    ctx.beginPath();
    ctx.arc(endX, lineY, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  const { brief, frame, object, fonts } = context;
  const print = object as CoastPrint;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const preset = getStyle('ukiyoe');
  const field = artField(brief.output.width, brief.output.height);
  const level = stateLevel(context);
  const colors = { blue: preset.palette.accent, mist: preset.palette.accent3, moss: preset.palette.accent4, vermilion: preset.palette.accent2 };

  // A full-height washi print keeps an empty sky above its fixed low horizon.
  ctx.fillStyle = preset.palette.surface;
  ctx.fillRect(field.x, field.y, field.width, field.height);
  ctx.fillStyle = preset.palette.bg;
  ctx.fillRect(field.x, field.y, field.width, field.height * 0.34);
  ctx.strokeStyle = preset.palette.ink;
  ctx.lineWidth = 1;
  ctx.strokeRect(field.x, field.y, field.width, field.height);
  drawMountain(ctx, field, colors.blue, colors.mist);
  drawSea(ctx, field, level, print, colors.blue, colors.mist, colors.moss);

  const reference = drawReference(ctx, field, preset.palette.bg, colors.vermilion, fonts.effective.label.family, brief.locale);
  drawCartouche(ctx, field, preset.palette.ink, colors.vermilion, fonts.effective.label.family, brief.locale);
  const boat = drawBoat(ctx, field, print, preset.palette.ink, colors.blue);
  if (print.composition === 'checklist') drawChecklistRoute(ctx, field, level, colors);
  else drawJourney(ctx, boat, reference, level / 2, preset.palette.ink, colors.vermilion);

  // Horizon and seal are fixed through every transition; only the route/layers progress.
  const horizonY = field.y + field.height * 0.52;
  ctx.strokeStyle = preset.palette.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(field.x + field.width * 0.3, horizonY);
  ctx.lineTo(field.x + field.width, horizonY);
  ctx.stroke();
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const ukiyoeNarrativeScene: NarrativeScene = {
  style: 'ukiyoe',
  version: 'ukiyoe-coastal-print/1.0.0',
  vocabulary: sceneVocabulary('value-driven'),
  supportsAspect(aspect) {
    return [16 / 9, 1].some((ratio) => Math.abs(aspect - ratio) / ratio < 0.015);
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'guia-en-recorrido-costero',
      composition: compositionFor(brief),
      boatOffset: (rng() - 0.5) * 0.025,
      waveOffset: Math.floor(rng() * 9),
    } satisfies CoastPrint);
  },
  renderFrame,
};
