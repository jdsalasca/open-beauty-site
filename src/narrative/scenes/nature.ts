import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativePhase, NarrativeRect, NarrativeRenderContext, NarrativeScene, NormalizedNarrativeBrief } from '../../types/narrative.js';
import { cubicBezierEase, drawRule, drawText, phaseMarkProgress, rgba } from './common.js';

interface BotanicalSpecimen {
  readonly identity: 'muestra-botanica';
  readonly composition: 'comparison' | 'checklist';
  readonly leafVariant: number;
  readonly leafAngle: number;
  readonly paperTone: 'lichen' | 'parchment';
}

function compositionFor(brief: NormalizedNarrativeBrief): BotanicalSpecimen['composition'] {
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

function drawLeaf(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, variant: number, palette: ReturnType<typeof getStyle>['palette']): { tip: { x: number; y: number }; vein: { x: number; y: number } } {
  const left = box.x;
  const top = box.y;
  const width = box.width;
  const height = box.height;
  const centerX = left + width * (0.48 + (variant - 1) * 0.025);
  const baseY = top + height * 0.96;
  const tip = { x: centerX + width * 0.08, y: top + height * 0.035 };
  const swell = [0.31, 0.36, 0.28][variant]!;
  const fullness = [0.94, 1.05, 0.88][variant]!;

  ctx.beginPath();
  ctx.moveTo(centerX, baseY);
  ctx.bezierCurveTo(left + width * 0.12, top + height * 0.81, left + width * 0.01, top + height * 0.66, left + width * 0.14, top + height * 0.55);
  ctx.bezierCurveTo(left + width * 0.21, top + height * 0.50, left + width * 0.03, top + height * 0.39, left + width * 0.12, top + height * 0.30);
  ctx.bezierCurveTo(left + width * 0.22, top + height * 0.15, left + width * 0.37, top + height * 0.09, tip.x, tip.y);
  ctx.bezierCurveTo(left + width * (0.88 * fullness), top + height * 0.16, left + width * 0.98, top + height * 0.38, left + width * 0.84, top + height * 0.53);
  ctx.bezierCurveTo(left + width * 0.95, top + height * 0.70, left + width * 0.77, top + height * 0.84, centerX, baseY);
  ctx.closePath();
  ctx.save();
  ctx.shadowColor = rgba(palette.ink, 0.16);
  ctx.shadowBlur = Math.max(8, width * 0.045);
  ctx.shadowOffsetX = width * 0.012;
  ctx.shadowOffsetY = height * 0.018;
  ctx.fillStyle = palette.accent;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = Math.max(1.8, width * 0.008);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX, baseY);
  ctx.bezierCurveTo(centerX - width * 0.04, top + height * 0.63, centerX + width * 0.05, top + height * 0.27, tip.x, tip.y);
  ctx.strokeStyle = palette.accent4;
  ctx.lineWidth = Math.max(2.2, width * 0.014);
  ctx.stroke();

  for (let index = 1; index <= 7; index += 1) {
    const t = index / 8;
    const spineX = centerX + (tip.x - centerX) * t;
    const spineY = baseY + (tip.y - baseY) * t;
    const length = width * (swell * (1 - t * 0.42));
    for (const direction of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(spineX, spineY);
      ctx.quadraticCurveTo(spineX + direction * length * 0.58, spineY - height * 0.012, spineX + direction * length, spineY - height * (0.17 * (1 - t * 0.55)));
      ctx.strokeStyle = rgba(palette.surface, 0.92);
      ctx.lineWidth = Math.max(1.2, width * 0.0045);
      ctx.stroke();
    }
  }
  const stemEnd = { x: centerX - width * 0.015, y: top + height * 1.06 };
  ctx.beginPath();
  ctx.moveTo(centerX, baseY);
  ctx.lineTo(stemEnd.x, stemEnd.y);
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = Math.max(2, width * 0.009);
  ctx.stroke();
  return { tip, vein: { x: centerX + width * 0.12, y: top + height * 0.47 } };
}

function drawPlate(ctx: ReturnType<typeof canvasFor>['ctx'], art: NarrativeRect, specimen: BotanicalSpecimen, palette: ReturnType<typeof getStyle>['palette']): void {
  // A flat herbarium field gives the specimen a full-height archive plate without paper layers or shadows.
  ctx.fillStyle = specimen.paperTone === 'lichen' ? palette.surface : '#E6DDC7';
  ctx.fillRect(art.x, art.y, art.width, art.height);
  ctx.strokeStyle = rgba(palette.ink, 0.7);
  ctx.lineWidth = Math.max(1, art.width * 0.0035);
  ctx.strokeRect(art.x + art.width * 0.018, art.y + art.height * 0.014, art.width * 0.964, art.height * 0.972);
  const headerY = art.y + art.height * 0.075;
  drawText(ctx, 'ARCHIVO BOTÁNICO', art.x + art.width * 0.065, headerY, 'Karla', 600, Math.max(24, art.width * 0.055), palette.ink);
  drawRule(ctx, art.x + art.width * 0.065, headerY + art.height * 0.025, art.x + art.width * 0.93, palette.muted, 1.2);
  drawText(ctx, 'PLIEGO DE OBSERVACIÓN', art.x + art.width * 0.065, headerY + art.height * 0.07, 'Karla', 400, Math.max(24, art.width * 0.045), palette.muted);
}

function comparisonLeafBox(art: NarrativeRect): NarrativeRect {
  return { x: art.x + art.width * 0.045, y: art.y + art.height * 0.17, width: art.width * 0.60, height: art.height * 0.72 };
}

function checklistLeafBox(art: NarrativeRect): NarrativeRect {
  return { x: art.x + art.width * 0.015, y: art.y + art.height * 0.2, width: art.width * 0.62, height: art.height * 0.69 };
}

function drawComparisonNotes(ctx: ReturnType<typeof canvasFor>['ctx'], art: NarrativeRect, vein: { x: number; y: number }, progress: number, status: NormalizedNarrativeBrief['status'], palette: ReturnType<typeof getStyle>['palette']): void {
  // Keep the two indispensable right-hand annotations comfortably inside the 5% safe margin.
  const labelX = art.x + art.width * 0.62;
  const labelY = art.y + art.height * 0.56;
  drawRule(ctx, labelX, labelY, art.x + art.width * 0.91, palette.ink, 1.5);
  drawText(ctx, 'OBSERVACIÓN', labelX, labelY + art.height * 0.055, 'Karla', 600, Math.max(24, art.width * 0.047), palette.ink);
  if (progress <= 0.01) return;
  const reveal = Math.min(1, progress);
  const anchorX = labelX - art.width * 0.025;
  const anchorY = labelY + art.height * 0.1;
  ctx.save();
  ctx.globalAlpha = reveal;
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY);
  ctx.lineTo(vein.x + art.width * 0.035, vein.y - art.height * 0.04);
  ctx.lineTo(vein.x, vein.y);
  ctx.strokeStyle = palette.accent2;
  ctx.lineWidth = Math.max(2, art.width * 0.006);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(vein.x, vein.y, art.width * 0.045, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  const archiveReveal = Math.min(1, Math.max(0, progress - 1));
  if (archiveReveal > 0) {
    ctx.save();
    ctx.globalAlpha = archiveReveal;
    drawRule(ctx, labelX, labelY + art.height * 0.15, art.x + art.width * 0.91, palette.accent2, 3);
    drawText(ctx, status === 'done' ? 'ARCHIVADA' : 'EN REVISIÓN', labelX, labelY + art.height * 0.22, 'Karla', 600, Math.max(24, art.width * 0.05), palette.accent2);
    ctx.restore();
  }
}

function drawCheckMark(ctx: ReturnType<typeof canvasFor>['ctx'], x: number, y: number, size: number, progress: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2.5, size * 0.12);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size * 0.28, y + size * 0.3);
  ctx.lineTo(x + size * 0.84 * progress, y - size * 0.3 * progress);
  ctx.stroke();
}

function drawChecklistNotes(ctx: ReturnType<typeof canvasFor>['ctx'], art: NarrativeRect, progress: number, status: NormalizedNarrativeBrief['status'], palette: ReturnType<typeof getStyle>['palette']): void {
  const x = art.x + art.width * 0.68;
  const labels = ['OBSERVAR', 'ANOTAR', 'ARCHIVAR'];
  const rowHeight = art.height * 0.155;
  const top = art.y + art.height * 0.33;
  ctx.strokeStyle = rgba(palette.ink, 0.42);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + art.width * 0.025, top - art.height * 0.035);
  ctx.lineTo(x + art.width * 0.025, top + rowHeight * 2.5);
  ctx.stroke();
  labels.forEach((label, index) => {
    const y = top + index * rowHeight;
    drawText(ctx, label, x + art.width * 0.075, y, 'Karla', index === 2 ? 600 : 400, Math.max(24, art.width * 0.044), index <= progress ? palette.ink : palette.muted);
    if (index > 0) drawRule(ctx, x + art.width * 0.075, y + art.height * 0.025, art.x + art.width * 0.93, rgba(palette.ink, 0.28), 1);
    if (index < progress || (status === 'done' && progress >= 2 && index === 2)) drawCheckMark(ctx, x, y - art.height * 0.012, art.width * 0.035, 1, palette.accent2);
    else if (index === Math.floor(progress) && progress % 1 > 0.01) drawCheckMark(ctx, x, y - art.height * 0.012, art.width * 0.035, progress % 1, palette.accent2);
  });
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  const { brief, layout, frame, object } = context;
  const specimen = object as BotanicalSpecimen;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const art = layout.reservedArtArea;
  const palette = getStyle('nature').palette;
  const easing = phaseMarkProgress(frame, (value) => cubicBezierEase(value, 0.18, 0.72, 0.25, 1));
  const from = stateRank(brief.phases[frame.fromPhaseIndex]!);
  const to = stateRank(brief.phases[frame.toPhaseIndex]!);
  const progress = from + (to - from) * easing;
  drawPlate(ctx, art, specimen, palette);

  const leaf = specimen.composition === 'comparison' ? comparisonLeafBox(art) : checklistLeafBox(art);
  ctx.save();
  const pivotX = leaf.x + leaf.width * 0.5;
  const pivotY = leaf.y + leaf.height * 0.5;
  ctx.translate(pivotX, pivotY);
  ctx.rotate(specimen.leafAngle + (specimen.composition === 'comparison' ? -0.1 : 0));
  ctx.translate(-pivotX, -pivotY);
  const details = drawLeaf(ctx, leaf, specimen.leafVariant, palette);
  ctx.restore();

  if (specimen.composition === 'comparison') drawComparisonNotes(ctx, art, details.vein, progress, brief.status, palette);
  else drawChecklistNotes(ctx, art, progress, brief.status, palette);
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const natureNarrativeScene: NarrativeScene = {
  style: 'nature',
  version: 'nature-herbarium-memory/1.0.0',
  supportsAspect(aspect) {
    return Math.abs(aspect - 16 / 9) / (16 / 9) < 0.015;
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'muestra-botanica',
      composition: compositionFor(brief),
      leafVariant: Math.floor(rng() * 3),
      leafAngle: (rng() - 0.5) * 0.11,
      paperTone: rng() < 0.5 ? 'lichen' : 'parchment',
    } satisfies BotanicalSpecimen);
  },
  renderFrame,
};
