import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativePhase, NarrativeRect, NarrativeRenderContext, NarrativeScene, NormalizedNarrativeBrief } from '../../types/narrative.js';
import { cubicBezierEase, drawRule, drawText, phaseMarkProgress, rgba } from './common.js';

interface BrutalistDocument {
  readonly identity: 'documento-de-revision';
  readonly composition: 'comparison' | 'checklist';
  readonly subfamily: 'documentary' | 'poster';
  readonly gridOffset: number;
  readonly stubWidth: number;
}

function compositionFor(brief: NormalizedNarrativeBrief): BrutalistDocument['composition'] {
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

function drawGrid(ctx: ReturnType<typeof canvasFor>['ctx'], art: NarrativeRect, ink: string, offset: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(art.x, art.y, art.width, art.height);
  ctx.clip();
  ctx.strokeStyle = rgba(ink, 0.09);
  ctx.lineWidth = 1;
  const step = Math.max(22, art.width * 0.14);
  const shift = offset * step * 0.5;
  for (let x = art.x - step + shift; x < art.x + art.width + step; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, art.y);
    ctx.lineTo(x, art.y + art.height);
    ctx.stroke();
  }
  for (let y = art.y + shift - step; y < art.y + art.height + step; y += step) {
    ctx.beginPath();
    ctx.moveTo(art.x, y);
    ctx.lineTo(art.x + art.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCheckbox(ctx: ReturnType<typeof canvasFor>['ctx'], x: number, y: number, size: number, checked: number, ink: string, accent: string): void {
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeStyle = ink;
  ctx.strokeRect(x, y, size, size);
  if (checked <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, checked);
  ctx.beginPath();
  ctx.moveTo(x + size * 0.18, y + size * 0.51);
  ctx.lineTo(x + size * 0.42, y + size * 0.76);
  ctx.lineTo(x + size * 0.84, y + size * 0.21);
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(3, size * 0.15);
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';
  ctx.stroke();
  ctx.restore();
}

function drawStatusStamp(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, level: number, progress: number, mono: string, red: string): void {
  const stampWidth = box.width * 0.68;
  const stampHeight = Math.max(34, box.height * 0.105);
  const x = box.x + box.width * 0.23;
  const y = box.y + box.height * 0.8;
  const observationAlpha = level >= 1 ? Math.min(1, progress) : 0;
  if (observationAlpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = observationAlpha;
  ctx.lineWidth = Math.max(2, box.width * 0.009);
  ctx.strokeStyle = red;
  ctx.strokeRect(x, y, stampWidth, stampHeight);
  drawText(ctx, 'OBSERVACIÓN', x + stampWidth * 0.055, y + stampHeight * 0.67, mono, 700, Math.max(13, box.width * 0.046), red);
  ctx.restore();
}

function drawReviewReady(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, level: number, progress: number, ink: string, red: string): void {
  const left = box.x + box.width * 0.09;
  const baseline = box.y + box.height * 0.76;
  const size = box.width * 0.055;
  drawText(ctx, 'ESTADO', left, baseline, 'Space Mono', 700, Math.max(11, box.width * 0.033), ink);
  drawCheckbox(ctx, box.x + box.width * 0.78, baseline - size * 0.83, size, level >= 2 ? progress : 0, ink, red);
}

function drawFormComparison(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, document: BrutalistDocument, level: number, progress: number, colors: { ink: string; muted: string; red: string; acid: string }): void {
  const { ink, muted, red, acid } = colors;
  const pad = box.width * 0.09;
  const left = box.x + pad;
  const right = box.x + box.width - pad;
  const headerY = box.y + box.height * 0.08;
  ctx.fillStyle = acid;
  ctx.fillRect(left, headerY, box.width * 0.57, box.height * 0.1);
  drawText(ctx, 'FICHA DE REVISIÓN', left + box.width * 0.025, headerY + box.height * 0.066, 'Space Mono', 700, Math.max(12, box.width * 0.039), ink);
  drawText(ctx, 'PRODUCTO', left, box.y + box.height * 0.27, 'Space Mono', 700, Math.max(11, box.width * 0.033), muted);
  drawRule(ctx, left, box.y + box.height * 0.31, right, ink, 2);
  drawText(ctx, 'LECTURA', left, box.y + box.height * 0.43, 'Space Mono', 700, Math.max(11, box.width * 0.033), ink);
  drawRule(ctx, left, box.y + box.height * 0.47, right * 0.93, ink, 1.5);
  drawRule(ctx, left, box.y + box.height * 0.53, right * 0.83, muted, 1);
  drawText(ctx, 'REVISIÓN', left, box.y + box.height * 0.64, 'Space Mono', 700, Math.max(11, box.width * 0.033), ink);
  drawRule(ctx, left, box.y + box.height * 0.68, right, ink, 1.5);
  const checkboxSize = box.width * 0.06;
  drawCheckbox(ctx, right - checkboxSize, box.y + box.height * 0.57, checkboxSize, 0, ink, red);
  // The comparison composition is a single form with a perforated, blank stub.
  const stubX = right - box.width * document.stubWidth;
  ctx.save();
  ctx.setLineDash([2, 5]);
  ctx.strokeStyle = rgba(ink, 0.55);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(stubX, box.y + box.height * 0.21);
  ctx.lineTo(stubX, box.y + box.height * 0.74);
  ctx.stroke();
  ctx.restore();
  drawText(ctx, 'COPIA', stubX + box.width * 0.025, box.y + box.height * 0.25, 'Space Mono', 400, Math.max(9, box.width * 0.025), muted);
  drawReviewReady(ctx, box, level, progress, ink, red);
  drawStatusStamp(ctx, box, level, progress, 'Space Mono', red);
}

function drawFormChecklist(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, level: number, progress: number, colors: { ink: string; muted: string; red: string; acid: string }): void {
  const { ink, muted, red, acid } = colors;
  const left = box.x + box.width * 0.1;
  const right = box.x + box.width * 0.9;
  const headerY = box.y + box.height * 0.08;
  ctx.fillStyle = acid;
  ctx.fillRect(left, headerY, box.width * 0.52, box.height * 0.1);
  drawText(ctx, 'CONTROL DE LECTURA', left + box.width * 0.025, headerY + box.height * 0.065, 'Space Mono', 700, Math.max(11, box.width * 0.033), ink);
  const rows = [
    { label: 'LEER LA GUÍA', y: box.y + box.height * 0.31, checked: 0 },
    { label: 'SEÑALAR EL DATO', y: box.y + box.height * 0.47, checked: level >= 1 ? progress : 0 },
    { label: 'DEJAR EN REVISIÓN', y: box.y + box.height * 0.63, checked: level >= 2 ? progress : 0 },
  ];
  const size = box.width * 0.072;
  for (const row of rows) {
    drawCheckbox(ctx, left, row.y - size * 0.82, size, row.checked, ink, red);
    drawText(ctx, row.label, left + size * 1.5, row.y, 'Space Mono', 700, Math.max(10, box.width * 0.031), row.checked > 0 ? ink : muted);
    drawRule(ctx, left, row.y + size * 0.68, right, rgba(ink, 0.6), 1);
  }
  drawReviewReady(ctx, box, level, progress, ink, red);
  drawStatusStamp(ctx, box, level, progress, 'Space Mono', red);
}

function drawPoster(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, level: number, progress: number, colors: { ink: string; red: string; acid: string }): void {
  const { ink, red, acid } = colors;
  ctx.fillStyle = ink;
  ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 4;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  const pad = box.width * 0.09;
  ctx.fillStyle = acid;
  ctx.fillRect(box.x + pad, box.y + box.height * 0.1, box.width * 0.78, box.height * 0.18);
  drawText(ctx, 'AVISO', box.x + pad * 1.2, box.y + box.height * 0.235, 'Archivo Black', 400, Math.max(30, box.width * 0.17), ink);
  drawRule(ctx, box.x + pad, box.y + box.height * 0.37, box.x + box.width - pad, '#F2EFE4', 3);
  drawText(ctx, 'REVISIÓN', box.x + pad, box.y + box.height * 0.52, 'Archivo Black', 400, Math.max(22, box.width * 0.1), '#F2EFE4');
  drawText(ctx, 'CAMBIO REGISTRADO', box.x + pad, box.y + box.height * 0.62, 'Space Mono', 700, Math.max(11, box.width * 0.035), '#F2EFE4');
  drawStatusStamp(ctx, box, level, progress, 'Space Mono', red);
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  const { brief, layout, frame, object } = context;
  const document = object as BrutalistDocument;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const art = layout.reservedArtArea;
  const preset = getStyle('brutalist');
  const box: NarrativeRect = {
    x: art.x + art.width * 0.06,
    y: art.y + art.height * 0.06,
    width: art.width * 0.88,
    height: art.height * 0.88,
  };
  const { ink } = preset.palette;
  drawGrid(ctx, art, ink, document.gridOffset);
  ctx.save();
  ctx.fillStyle = ink;
  ctx.fillRect(box.x + 8, box.y + 8, box.width, box.height);
  ctx.fillStyle = document.subfamily === 'poster' ? ink : preset.palette.bg;
  ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  const outgoing = stateRank(brief.phases[frame.fromPhaseIndex]!);
  const incoming = stateRank(brief.phases[frame.toPhaseIndex]!);
  const progress = phaseMarkProgress(frame, (value) => cubicBezierEase(value, 0.2, 0.8, 0.2, 1));
  const level = Math.round(outgoing + (incoming - outgoing) * progress);
  const colors = { ink: preset.palette.ink, muted: preset.palette.muted, red: preset.palette.accent2, acid: preset.palette.accent };
  if (document.subfamily === 'poster') drawPoster(ctx, box, level, progress, colors);
  else if (document.composition === 'checklist') drawFormChecklist(ctx, box, level, progress, colors);
  else drawFormComparison(ctx, box, document, level, progress, colors);
  // A ruled form records a changed state in a dedicated margin, never over copy.
  ctx.restore();
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const brutalistNarrativeScene: NarrativeScene = {
  style: 'brutalist',
  version: 'brutalist-documentary/1.0.0',
  supportsAspect(aspect) {
    return [16 / 9, 1, 9 / 16].some((ratio) => Math.abs(aspect - ratio) / ratio < 0.015);
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'documento-de-revision',
      composition: compositionFor(brief),
      subfamily: brief.subfamily === 'poster' ? 'poster' : 'documentary',
      gridOffset: Math.floor(rng() * 2),
      stubWidth: 0.16 + rng() * 0.025,
    } satisfies BrutalistDocument);
  },
  renderFrame,
};
