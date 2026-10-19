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
  readonly stampTexture: readonly number[];
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

function drawDocumentGrid(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, document: BrutalistDocument, colors: { ink: string; muted: string }): { left: number; right: number; split: number; copy: number } {
  const { ink, muted } = colors;
  const left = box.x + box.width * 0.08;
  const right = box.x + box.width * 0.92;
  const split = box.x + box.width * (0.67 + document.stubWidth * 0.1);
  const copy = split + box.width * 0.04;
  const top = box.y + box.height * 0.21;
  const bottom = box.y + box.height * 0.7;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(right, top);
  ctx.moveTo(left, box.y + box.height * 0.4);
  ctx.lineTo(right, box.y + box.height * 0.4);
  ctx.moveTo(left, box.y + box.height * 0.55);
  ctx.lineTo(right, box.y + box.height * 0.55);
  ctx.moveTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(split, top);
  ctx.lineTo(split, bottom);
  ctx.stroke();
  ctx.save();
  ctx.setLineDash([3, 5]);
  ctx.strokeStyle = muted;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(box.x + box.width * 0.95, top);
  ctx.lineTo(box.x + box.width * 0.95, bottom);
  ctx.stroke();
  ctx.restore();
  const holeRadius = box.width * 0.008;
  for (let index = 0; index < 7; index += 1) {
    const y = top + box.height * (0.035 + index * 0.068);
    ctx.beginPath();
    ctx.arc(box.x + box.width * 0.98, y, holeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#F2EFE4';
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  return { left, right, split, copy };
}

function drawReferenceColumn(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, copyX: number, colors: { ink: string; muted: string }): void {
  const { ink, muted } = colors;
  drawText(ctx, 'REFERENCIA', copyX, box.y + box.height * 0.28, 'Space Mono', 700, Math.max(12, box.width * 0.034), ink);
  drawRule(ctx, copyX, box.y + box.height * 0.315, box.x + box.width * 0.88, muted, 1);
  drawRule(ctx, copyX, box.y + box.height * 0.36, box.x + box.width * 0.87, muted, 1);
  drawText(ctx, 'COPIA', copyX, box.y + box.height * 0.47, 'Space Mono', 700, Math.max(12, box.width * 0.034), ink);
  drawRule(ctx, copyX, box.y + box.height * 0.5, box.x + box.width * 0.88, muted, 1);
  drawRule(ctx, copyX, box.y + box.height * 0.515, box.x + box.width * 0.86, muted, 1);
  drawText(ctx, 'TRAZA', copyX, box.y + box.height * 0.64, 'Space Mono', 700, Math.max(12, box.width * 0.034), ink);
}

function drawInkEdge(ctx: ReturnType<typeof canvasFor>['ctx'], x: number, y: number, width: number, height: number, alpha: number, label: string, texture: readonly number[], color: string): void {
  if (alpha <= 0.01) return;
  const jitter = (index: number): number => (texture[index % texture.length]! - 0.5) * 2.2;
  const travel = (1 - alpha) * 10;
  const left = x - travel;
  const top = y + (1 - alpha) * 4;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.shadowColor = rgba('#000000', 0.72);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.moveTo(left + jitter(0), top + jitter(1));
  for (let index = 1; index <= 5; index += 1) ctx.lineTo(left + width * index / 6, top + jitter(index + 1));
  ctx.lineTo(left + width + jitter(7), top + jitter(8));
  for (let index = 1; index <= 4; index += 1) ctx.lineTo(left + width + jitter(index + 8), top + height * index / 5);
  ctx.lineTo(left + width + jitter(13), top + height + jitter(14));
  for (let index = 1; index <= 5; index += 1) ctx.lineTo(left + width * (1 - index / 6), top + height + jitter(index + 14));
  ctx.lineTo(left + jitter(20), top + height + jitter(21));
  for (let index = 1; index <= 4; index += 1) ctx.lineTo(left + jitter(index + 21), top + height * (1 - index / 5));
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.globalAlpha = Math.min(1, alpha) * 0.24;
  ctx.fillStyle = color;
  for (let index = 0; index < 18; index += 1) {
    const dotX = left + width * ((index * 29) % 97) / 100;
    const dotY = top + height * ((index * 17) % 83) / 100;
    ctx.fillRect(dotX, dotY, 1.5 + texture[index % texture.length]! * 1.4, 1.3);
  }
  ctx.shadowColor = 'transparent';
  ctx.globalAlpha = Math.min(1, alpha);
  drawText(ctx, label, left + width * 0.06, top + height * 0.64, 'Space Mono', 700, Math.max(12, width * 0.088), color);
  ctx.restore();
}

function drawRegistrationBoxes(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, document: BrutalistDocument, level: number, finalLabel: string, red: string): void {
  const labelX = box.x + box.width * 0.08;
  const labelY = box.y + box.height * 0.755;
  drawText(ctx, 'REGISTRO', labelX, labelY, 'Space Mono', 700, Math.max(12, box.width * 0.033), '#0B0B0B');
  const y = box.y + box.height * 0.78;
  const height = box.height * 0.13;
  const cellWidth = box.width * 0.37;
  const firstX = box.x + box.width * 0.08;
  const secondX = box.x + box.width * 0.53;
  for (const x of [firstX, secondX]) {
    ctx.strokeStyle = '#0B0B0B';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cellWidth, height);
  }
  drawInkEdge(ctx, firstX + 7, y + 7, cellWidth - 14, height - 14, Math.min(1, level), 'OBSERVACIÓN', document.stampTexture, red);
  drawInkEdge(ctx, secondX + 7, y + 7, cellWidth - 14, height - 14, Math.max(0, level - 1), finalLabel, document.stampTexture, red);
}

function drawFormComparison(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, document: BrutalistDocument, level: number, finalLabel: string, colors: { ink: string; muted: string; red: string; acid: string }): void {
  const { ink, muted, red, acid } = colors;
  const columns = drawDocumentGrid(ctx, box, document, { ink, muted });
  const headerY = box.y + box.height * 0.07;
  ctx.fillStyle = acid;
  ctx.fillRect(columns.left, headerY, box.width * 0.62, box.height * 0.105);
  drawText(ctx, 'FICHA DE REVISIÓN', columns.left + box.width * 0.025, headerY + box.height * 0.069, 'Space Mono', 700, Math.max(13, box.width * 0.043), ink);
  drawText(ctx, 'MEDIDA', columns.left, box.y + box.height * 0.275, 'Space Mono', 700, Math.max(12, box.width * 0.035), ink);
  drawRule(ctx, columns.left, box.y + box.height * 0.325, columns.split - box.width * 0.045, ink, 2);
  drawRule(ctx, columns.left, box.y + box.height * 0.365, columns.split - box.width * 0.07, muted, 1);
  drawText(ctx, 'SEÑALAR', columns.left, box.y + box.height * 0.48, 'Space Mono', 700, Math.max(12, box.width * 0.035), level >= 0.01 ? ink : muted);
  const checkbox = box.width * 0.06;
  drawCheckbox(ctx, columns.split - checkbox - box.width * 0.04, box.y + box.height * 0.43, checkbox, Math.min(1, level), ink, red);
  drawText(ctx, 'REVISIÓN', columns.left, box.y + box.height * 0.63, 'Space Mono', 700, Math.max(12, box.width * 0.035), level >= 1.01 ? ink : muted);
  drawCheckbox(ctx, columns.split - checkbox - box.width * 0.04, box.y + box.height * 0.58, checkbox, Math.max(0, level - 1), ink, red);
  drawReferenceColumn(ctx, box, columns.copy, { ink, muted });
  drawRegistrationBoxes(ctx, box, document, level, finalLabel, red);
}

function drawFormChecklist(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, document: BrutalistDocument, level: number, finalLabel: string, colors: { ink: string; muted: string; red: string; acid: string }): void {
  const { ink, muted, red, acid } = colors;
  const columns = drawDocumentGrid(ctx, box, document, { ink, muted });
  const headerY = box.y + box.height * 0.07;
  ctx.fillStyle = acid;
  ctx.fillRect(columns.left, headerY, box.width * 0.62, box.height * 0.105);
  drawText(ctx, 'CONTROL DE LECTURA', columns.left + box.width * 0.025, headerY + box.height * 0.069, 'Space Mono', 700, Math.max(12, box.width * 0.038), ink);
  const rows = [
    { label: 'LEER LA GUÍA', y: box.y + box.height * 0.31, checked: Math.min(1, level) },
    { label: 'SEÑALAR EL DATO', y: box.y + box.height * 0.46, checked: Math.min(1, level) },
    { label: 'DEJAR EN REVISIÓN', y: box.y + box.height * 0.61, checked: Math.max(0, level - 1) },
  ];
  const size = box.width * 0.065;
  for (const row of rows) {
    drawCheckbox(ctx, columns.left, row.y - size * 0.82, size, row.checked, ink, red);
    drawText(ctx, row.label, columns.left + size * 1.5, row.y, 'Space Mono', 700, Math.max(12, box.width * 0.034), row.checked > 0 ? ink : muted);
    drawRule(ctx, columns.left, row.y + size * 0.68, columns.split - box.width * 0.035, rgba(ink, 0.72), 1.5);
  }
  drawReferenceColumn(ctx, box, columns.copy, { ink, muted });
  drawRegistrationBoxes(ctx, box, document, level, finalLabel, red);
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
    x: art.x + art.width * 0.005,
    y: art.y + art.height * 0.005,
    width: art.width * 0.99,
    height: art.height * 0.99,
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
  const progress = phaseMarkProgress(frame, (value) => cubicBezierEase(value, 0.4, 0, 0.2, 1));
  const level = outgoing + (incoming - outgoing) * progress;
  const colors = { ink: preset.palette.ink, muted: preset.palette.muted, red: preset.palette.accent2, acid: preset.palette.accent };
  if (document.subfamily === 'poster') drawPoster(ctx, box, level, progress, colors);
  else if (document.composition === 'checklist') {
    const finalLabel = brief.status === 'done' ? 'REVISADA' : brief.status === 'in-review' ? 'EN REVISIÓN' : 'PENDIENTE';
    drawFormChecklist(ctx, box, document, level, finalLabel, colors);
  } else {
    const finalLabel = brief.status === 'done' ? 'REVISADA' : brief.status === 'in-review' ? 'EN REVISIÓN' : 'PENDIENTE';
    drawFormComparison(ctx, box, document, level, finalLabel, colors);
  }
  // A ruled form records a changed state in a dedicated margin, never over copy.
  ctx.restore();
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const brutalistNarrativeScene: NarrativeScene = {
  style: 'brutalist',
  version: 'brutalist-documentary/1.1.0',
  supportsAspect(aspect) {
    return [16 / 9, 1].some((ratio) => Math.abs(aspect - ratio) / ratio < 0.015);
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'documento-de-revision',
      composition: compositionFor(brief),
      subfamily: brief.subfamily === 'poster' ? 'poster' : 'documentary',
      gridOffset: Math.floor(rng() * 2),
      stubWidth: 0.16 + rng() * 0.025,
      stampTexture: Object.freeze(Array.from({ length: 24 }, () => rng())),
    } satisfies BrutalistDocument);
  },
  renderFrame,
};
