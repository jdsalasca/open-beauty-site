import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativePhase, NarrativeRect, NarrativeRenderContext, NarrativeScene, NormalizedNarrativeBrief } from '../../types/narrative.js';
import { cubicBezierEase } from './common.js';
import { sceneVocabulary } from '../vocabulary.js';
import { sceneText } from '../i18n.js';

interface OwlFolio {
  readonly identity: 'buho-de-disco-facial';
  readonly composition: 'comparison' | 'checklist';
  readonly featherShift: number;
}

function compositionFor(brief: NormalizedNarrativeBrief): OwlFolio['composition'] {
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

function drawPage(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, colors: { paper: string; ink: string; gold: string }): void {
  ctx.fillStyle = colors.paper;
  ctx.fillRect(field.x, field.y, field.width, field.height);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 1;
  ctx.strokeRect(field.x + 8, field.y + 8, field.width - 16, field.height - 16);
  ctx.strokeStyle = colors.gold;
  ctx.beginPath();
  ctx.moveTo(field.x + 17, field.y + 19);
  ctx.lineTo(field.x + 17, field.y + field.height - 19);
  ctx.moveTo(field.x + 25, field.y + 19);
  ctx.lineTo(field.x + field.width - 17, field.y + 19);
  ctx.stroke();
}

function drawInitial(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, face: string, ink: string, lapis: string): void {
  const x = field.x + field.width * 0.34;
  const y = field.y + field.height * 0.33;
  ctx.strokeStyle = lapis;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 99);
  ctx.lineTo(x - 7, y + 14);
  ctx.stroke();
  ctx.font = `400 94px "${face}"`;
  ctx.fillStyle = ink;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('R', x + 4, y);
}

function drawOwl(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, folio: OwlFolio, level: number, colors: { paper: string; ink: string; gold: string; lapis: string; rubric: string }, folded: boolean): { x: number; y: number; rx: number; ry: number } {
  const { x, y, width: w, height: h } = field;
  const cx = x + w * (folio.composition === 'checklist' ? 0.72 : 0.7);
  const cy = y + h * (folio.composition === 'checklist' ? 0.42 : 0.45);
  const headRx = w * (folio.composition === 'checklist' ? 0.22 : 0.2);
  const headRy = h * (folio.composition === 'checklist' ? 0.18 : 0.16);
  const bodyY = cy + headRy * 0.73;
  const bodyRx = w * 0.18;
  const bodyRy = h * 0.22;
  const wingSpread = folded ? w * 0.18 : w * 0.29;

  // Ink anatomy: ear tufts, facial disc, paired eyes, hooked beak, feathered wings and talons.
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.moveTo(cx - headRx * 0.83, cy - headRy * 0.62);
  ctx.lineTo(cx - headRx * 0.94, cy - headRy * 1.52);
  ctx.lineTo(cx - headRx * 0.25, cy - headRy * 1.04);
  ctx.lineTo(cx, cy - headRy * 1.2);
  ctx.lineTo(cx + headRx * 0.25, cy - headRy * 1.04);
  ctx.lineTo(cx + headRx * 0.94, cy - headRy * 1.52);
  ctx.lineTo(cx + headRx * 0.83, cy - headRy * 0.62);
  ctx.closePath();
  ctx.fill();

  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(cx + side * bodyRx * 0.62, bodyY - bodyRy * 0.47);
    ctx.quadraticCurveTo(cx + side * wingSpread * 0.9, bodyY - bodyRy * 1.05, cx + side * wingSpread, bodyY - bodyRy * 0.2);
    ctx.quadraticCurveTo(cx + side * wingSpread * 0.97, bodyY + bodyRy * 0.12, cx + side * wingSpread * 0.82, bodyY + bodyRy * 0.2);
    ctx.quadraticCurveTo(cx + side * wingSpread * 0.98, bodyY + bodyRy * 0.36, cx + side * wingSpread * 0.72, bodyY + bodyRy * 0.49);
    ctx.quadraticCurveTo(cx + side * wingSpread * 0.89, bodyY + bodyRy * 0.68, cx + side * bodyRx * 0.48, bodyY + bodyRy * 0.63);
    ctx.closePath();
    ctx.fill();
  }
  for (const side of [-1, 1] as const) {
    for (let feather = 0; feather < 6; feather += 1) {
      const fraction = (feather + 1) / 7;
      const shift = (feather - 2.5) * folio.featherShift;
      const startX = cx + side * (bodyRx * 0.92 + shift);
      const startY = bodyY + h * (0.01 + feather * 0.012);
      const endX = cx + side * wingSpread * (0.58 + fraction * 0.25);
      const endY = bodyY + bodyRy * (0.08 + fraction * 0.38);
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(cx + side * wingSpread * (0.42 + fraction * 0.28), bodyY + bodyRy * (0.08 + fraction * 0.2), endX, endY);
      ctx.stroke();
    }
  }
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.ellipse(cx, bodyY, bodyRx, bodyRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#E8D9B8';
  ctx.beginPath();
  ctx.ellipse(cx, cy, headRx, headRy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, headRx * 0.84, headRy * 0.81, 0, 0, Math.PI * 2);
  ctx.stroke();

  for (const side of [-1, 1] as const) {
    const eyeX = cx + side * headRx * 0.4;
    ctx.fillStyle = colors.paper;
    ctx.beginPath();
    ctx.ellipse(eyeX, cy - headRy * 0.03, headRx * 0.27, headRy * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.arc(eyeX, cy - headRy * 0.02, headRy * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.paper;
    ctx.beginPath();
    ctx.arc(eyeX - headRx * 0.04, cy - headRy * 0.09, headRy * 0.035, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = colors.rubric;
  ctx.beginPath();
  ctx.moveTo(cx, cy + headRy * 0.12);
  ctx.lineTo(cx - headRx * 0.11, cy + headRy * 0.43);
  ctx.lineTo(cx + headRx * 0.06, cy + headRy * 0.35);
  ctx.closePath();
  ctx.fill();

  for (let toe = -1; toe <= 1; toe += 1) {
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + toe * 13, bodyY + bodyRy * 0.8);
    ctx.lineTo(cx + toe * 19, bodyY + bodyRy + 19);
    ctx.lineTo(cx + toe * 19 + 8, bodyY + bodyRy + 24);
    ctx.stroke();
  }

  const ringProgress = Math.max(0, Math.min(1, level));
  if (ringProgress > 0.01) {
    ctx.save();
    ctx.globalAlpha = ringProgress;
    ctx.strokeStyle = colors.lapis;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, headRx * 0.94, headRy * 0.92, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  return { x: cx, y: cy, rx: headRx, ry: headRy };
}

function drawComparisonNotes(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, head: { x: number; y: number; rx: number; ry: number }, level: number, face: string, ink: string, lapis: string, rubric: string, locale: 'es' | 'en'): void {
  const noteX = field.x + field.width * 0.31;
  const noteY = field.y + field.height * 0.67;
  ctx.strokeStyle = lapis;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(head.x - head.rx * 0.88, head.y + head.ry * 0.05);
  ctx.lineTo(noteX + field.width * 0.1, head.y + head.ry * 0.05);
  ctx.lineTo(noteX + field.width * 0.1, noteY - 10);
  ctx.stroke();
  ctx.font = `400 24px "${face}"`;
  ctx.fillStyle = ink;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(sceneText('bestiary', locale, 'disc'), noteX, noteY);
  if (level > 0.7) {
    ctx.strokeStyle = rubric;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(noteX, noteY + 12);
    ctx.lineTo(noteX + 69, noteY + 12);
    ctx.stroke();
    ctx.fillStyle = rubric;
    ctx.fillText(sceneText('bestiary', locale, 'focus'), noteX, noteY + 38);
  }
}

function drawChecklistNotes(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, level: number, face: string, ink: string, lapis: string, rubric: string, locale: 'es' | 'en'): void {
  const x = field.x + field.width * 0.14;
  const y = field.y + field.height * 0.72;
  const labels = [sceneText('bestiary', locale, 'observe'), sceneText('bestiary', locale, 'frame'), sceneText('bestiary', locale, 'review')];
  for (let index = 0; index < labels.length; index += 1) {
    const rowY = y + index * 37;
    ctx.strokeStyle = index <= Math.floor(level) ? lapis : ink;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, rowY - 18, 18, 18);
    if (level >= index + 1) {
      ctx.strokeStyle = rubric;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 3, rowY - 9);
      ctx.lineTo(x + 7, rowY - 4);
      ctx.lineTo(x + 16, rowY - 17);
      ctx.stroke();
    }
    ctx.font = `400 24px "${face}"`;
    ctx.fillStyle = index <= Math.floor(level) ? ink : '#6A5745';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(labels[index]!, x + 30, rowY - 1);
  }
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  const { brief, object, fonts } = context;
  const folio = object as OwlFolio;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const preset = getStyle('bestiary');
  const field = artField(brief.output.width, brief.output.height);
  const level = stateLevel(context);
  const colors = { paper: preset.palette.surface, ink: preset.palette.ink, gold: preset.palette.accent, lapis: preset.palette.accent3, rubric: preset.palette.accent2 };

  drawPage(ctx, field, colors);
  drawInitial(ctx, field, fonts.effective.display.family, colors.ink, colors.lapis);
  const head = drawOwl(ctx, field, folio, level, colors, folio.composition === 'checklist');
  if (folio.composition === 'checklist') drawChecklistNotes(ctx, field, level, fonts.effective.label.family, colors.ink, colors.lapis, colors.rubric, brief.locale);
  else drawComparisonNotes(ctx, field, head, level, fonts.effective.label.family, colors.ink, colors.lapis, colors.rubric, brief.locale);
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const bestiaryNarrativeScene: NarrativeScene = {
  style: 'bestiary',
  version: 'bestiary-owl-folio/1.0.0',
  vocabulary: sceneVocabulary('value-driven'),
  supportsAspect(aspect) {
    return [16 / 9, 1].some((ratio) => Math.abs(aspect - ratio) / ratio < 0.015);
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'buho-de-disco-facial',
      composition: compositionFor(brief),
      featherShift: 1 + Math.floor(rng() * 3),
    } satisfies OwlFolio);
  },
  renderFrame,
};
