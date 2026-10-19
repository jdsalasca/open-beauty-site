import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativePhase, NarrativeRenderContext, NarrativeScene, NormalizedNarrativeBrief, NarrativeRect } from '../../types/narrative.js';
import { cubicBezierEase, drawRule, drawText, phaseMarkProgress, rgba } from './common.js';

interface PaperGuide {
  readonly identity: 'guia-de-revision';
  readonly composition: 'comparison' | 'checklist';
  readonly rotation: number;
  readonly cutVariant: number;
  readonly backing: 'sage' | 'sky';
  readonly tapeAngle: number;
}

function compositionFor(brief: NormalizedNarrativeBrief): PaperGuide['composition'] {
  const kind = brief.phases[0]!.visual.kind.toLowerCase();
  return /checklist|process|lista|proceso/u.test(kind) ? 'checklist' : 'comparison';
}

function cutSheet(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, variant: number): void {
  const { x, y, width: w, height: h } = box;
  const notch = Math.max(18, Math.min(28, w * 0.09));
  const edge = Math.max(3, w * (variant === 0 ? 0.012 : variant === 1 ? 0.018 : 0.022));
  ctx.beginPath();
  ctx.moveTo(x + edge * 2, y + edge);
  ctx.lineTo(x + w * 0.77, y + edge);
  ctx.lineTo(x + w * 0.77, y + notch);
  ctx.lineTo(x + w * 0.77 + notch, y + notch);
  ctx.lineTo(x + w * 0.77 + notch, y + edge);
  ctx.lineTo(x + w - edge * 2, y + edge * 2);
  ctx.lineTo(x + w - edge, y + h * 0.32);
  ctx.lineTo(x + w - edge * 2, y + h * 0.72);
  ctx.lineTo(x + w - edge * 3, y + h - edge * 2);
  ctx.lineTo(x + w * 0.67, y + h - edge);
  ctx.lineTo(x + w * 0.42, y + h - edge * (variant + 1));
  ctx.lineTo(x + w * 0.18, y + h - edge);
  ctx.lineTo(x + edge, y + h - edge * 2);
  ctx.lineTo(x + edge * (variant + 1), y + h * 0.56);
  ctx.closePath();
}

function fillLayer(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, color: string, variant: number, shadow: { blur: number; y: number; alpha: number }): void {
  cutSheet(ctx, box, variant);
  ctx.save();
  ctx.shadowColor = rgba('#4A3A32', shadow.alpha);
  ctx.shadowBlur = shadow.blur;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = shadow.y;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
  cutSheet(ctx, box, variant);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#E5D8C4';
  ctx.stroke();
}

function drawTornRibbon(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, angle: number, butter: string, ink: string): void {
  const width = box.width * 0.37;
  const height = Math.max(18, box.height * 0.055);
  ctx.save();
  ctx.translate(box.x + box.width * 0.05, box.y + box.height * 0.035);
  ctx.rotate(angle * Math.PI / 180);
  ctx.beginPath();
  ctx.moveTo(0, height * 0.12);
  ctx.lineTo(width * 0.08, 0);
  ctx.lineTo(width * 0.19, height * 0.12);
  ctx.lineTo(width * 0.3, 0);
  ctx.lineTo(width, height * 0.12);
  ctx.lineTo(width * 0.92, height * 0.52);
  ctx.lineTo(width, height * 0.88);
  ctx.lineTo(width * 0.22, height);
  ctx.lineTo(width * 0.13, height * 0.81);
  ctx.lineTo(0, height * 0.93);
  ctx.closePath();
  ctx.shadowColor = rgba(ink, 0.13);
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = butter;
  ctx.fill();
  ctx.restore();
}

function stateRank(phase: NarrativePhase): number {
  const state = phase.visual.state.toLowerCase();
  if (/^unreviewed$|^before$|^pending$/u.test(state)) return 0;
  if (/flag|signal|observation|observaci/u.test(state)) return 1;
  if (/review.?ready|^reviewed$|^ready$|^done$|verified|list/u.test(state)) return 2;
  return 0;
}

function drawSignal(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, progress: number, accent: string): void {
  if (progress <= 0.01) return;
  const mark = Math.min(1, progress);
  const x = box.x + box.width * 0.78 + (1 - mark) * 14;
  const y = box.y + box.height * 0.37;
  ctx.save();
  ctx.globalAlpha = mark;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + box.width * 0.1, y + box.height * 0.035);
  ctx.lineTo(x, y + box.height * 0.07);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.fillRect(x + box.width * 0.009, y + box.height * 0.055, Math.max(3, box.width * 0.012), box.height * 0.12);
  ctx.restore();
}

function drawReviewStamp(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, progress: number, accent: string, ink: string): void {
  if (progress <= 0.01) return;
  const reveal = Math.min(1, progress);
  const stampWidth = box.width * 0.48;
  const stampHeight = Math.max(28, box.height * 0.085);
  const x = box.x + box.width * 0.43;
  const y = box.y + box.height * 0.79 + (1 - reveal) * 12;
  ctx.save();
  ctx.globalAlpha = reveal;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, stampWidth, stampHeight);
  drawText(ctx, 'EN REVISIÓN', x + stampWidth * 0.08, y + stampHeight * 0.66, 'Nunito Sans', 800, Math.max(14, box.width * 0.052), ink);
  ctx.restore();
}

function drawComparison(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, ink: string, muted: string): void {
  const pad = box.width * 0.12;
  const left = box.x + pad;
  const right = box.x + box.width - pad;
  const top = box.y + box.height * 0.15;
  drawText(ctx, 'Guía', left, top + box.height * 0.09, 'Fraunces', 560, Math.max(24, box.width * 0.13), ink);
  drawText(ctx, 'LECTURA', left, top + box.height * 0.21, 'Nunito Sans', 800, Math.max(12, box.width * 0.045), muted);
  drawRule(ctx, left, top + box.height * 0.24, right, '#D7CBB9', 1.2);
  drawRule(ctx, left, top + box.height * 0.36, right * 0.89, '#8F7C68', 2);
  drawRule(ctx, left, top + box.height * 0.41, right * 0.83, '#C9B8A2', 1.2);
  drawText(ctx, 'SEÑAL', left, top + box.height * 0.56, 'Nunito Sans', 800, Math.max(12, box.width * 0.045), muted);
  drawRule(ctx, left, top + box.height * 0.60, right, '#D7CBB9', 1.2);
  drawRule(ctx, left, top + box.height * 0.70, right * 0.9, '#8F7C68', 2);
}

function drawChecklist(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, ink: string, muted: string, accent: string): void {
  const pad = box.width * 0.12;
  const left = box.x + pad;
  const size = Math.max(16, box.width * 0.07);
  drawText(ctx, 'Lista de revisión', left, box.y + box.height * 0.25, 'Fraunces', 560, Math.max(22, box.width * 0.095), ink);
  const rows = [
    { label: 'LEER LA GUÍA', y: box.y + box.height * 0.42 },
    { label: 'SEÑALAR EL DATO', y: box.y + box.height * 0.57 },
    { label: 'DEJAR EN REVISIÓN', y: box.y + box.height * 0.72 },
  ];
  for (const [index, row] of rows.entries()) {
    ctx.strokeStyle = index === 1 ? accent : '#9B8570';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(left, row.y - size * 0.75, size, size);
    drawText(ctx, row.label, left + size * 1.55, row.y, 'Nunito Sans', 800, Math.max(11, box.width * 0.038), index === 1 ? ink : muted);
    if (index < rows.length - 1) drawRule(ctx, left, row.y + size * 0.68, box.x + box.width * 0.87, '#E4D8C6', 1);
  }
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  const { brief, layout, frame, phase, object } = context;
  const guide = object as PaperGuide;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const art = layout.reservedArtArea;
  const preset = getStyle('papercraft');
  const box: NarrativeRect = {
    x: art.x + art.width * 0.07,
    y: art.y + art.height * 0.07,
    width: art.width * 0.86,
    height: art.height * 0.84,
  };
  const smallSheet: NarrativeRect = { ...box, x: box.x + box.width * 0.055, y: box.y + box.height * 0.06, width: box.width * 0.93, height: box.height * 0.94 };
  const largeSheet: NarrativeRect = { ...box, x: box.x + box.width * 0.025, y: box.y + box.height * 0.025, width: box.width * 0.97, height: box.height * 0.97 };
  ctx.save();
  ctx.translate(box.x + box.width / 2, box.y + box.height / 2);
  ctx.rotate(guide.rotation * Math.PI / 180);
  ctx.translate(-(box.x + box.width / 2), -(box.y + box.height / 2));
  fillLayer(ctx, smallSheet, guide.backing === 'sage' ? preset.palette.accent2 : preset.palette.accent3, guide.cutVariant, { blur: 30, y: 15, alpha: 0.18 });
  fillLayer(ctx, largeSheet, '#F5E9D6', (guide.cutVariant + 1) % 3, { blur: 14, y: 9, alpha: 0.15 });
  fillLayer(ctx, box, preset.palette.surface, guide.cutVariant, { blur: 2, y: 3, alpha: 0.12 });
  if (guide.composition === 'checklist') drawChecklist(ctx, box, preset.palette.ink, preset.palette.muted, preset.palette.accent);
  else drawComparison(ctx, box, preset.palette.ink, preset.palette.muted);
  drawTornRibbon(ctx, box, guide.tapeAngle, preset.palette.accent4, preset.palette.ink);
  const outgoing = stateRank(brief.phases[frame.fromPhaseIndex]!);
  const incoming = stateRank(brief.phases[frame.toPhaseIndex]!);
  const eased = phaseMarkProgress(frame, (value) => cubicBezierEase(value, 0.22, 0.9, 0.24, 1));
  const level = outgoing + (incoming - outgoing) * eased;
  drawSignal(ctx, box, Math.max(0, Math.min(1, level)), preset.palette.accent);
  drawReviewStamp(ctx, box, Math.max(0, level - 1), preset.palette.accent, preset.palette.ink);
  ctx.restore();
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const papercraftNarrativeScene: NarrativeScene = {
  style: 'papercraft',
  version: 'papercraft-editorial/1.0.0',
  supportsAspect(aspect) {
    return [16 / 9, 1, 9 / 16].some((ratio) => Math.abs(aspect - ratio) / ratio < 0.015);
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'guia-de-revision',
      composition: compositionFor(brief),
      rotation: (rng() - 0.5) * 1.2,
      cutVariant: Math.floor(rng() * 3),
      backing: rng() < 0.5 ? 'sage' : 'sky',
      tapeAngle: 5.5 + rng() * 2,
    } satisfies PaperGuide);
  },
  renderFrame,
};
