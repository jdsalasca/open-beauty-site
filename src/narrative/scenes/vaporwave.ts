import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativePhase, NarrativeRect, NarrativeRenderContext, NarrativeScene, NormalizedNarrativeBrief } from '../../types/narrative.js';
import { cubicBezierEase, drawRule, drawText, phaseMarkProgress, rgba } from './common.js';

interface DesktopArtifact {
  readonly identity: 'archivo-de-revision-1999';
  readonly composition: 'comparison' | 'checklist';
  readonly gridOffset: number;
  readonly sunBandOffset: number;
  readonly windowWidth: number;
}

function compositionFor(brief: NormalizedNarrativeBrief): DesktopArtifact['composition'] {
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

function roundedRect(ctx: ReturnType<typeof canvasFor>['ctx'], rect: NarrativeRect, radius: number): void {
  ctx.beginPath();
  ctx.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
}

function drawHorizon(ctx: ReturnType<typeof canvasFor>['ctx'], art: NarrativeRect, palette: ReturnType<typeof getStyle>['palette'], gridOffset: number, bandOffset: number): void {
  const horizonY = art.y + art.height * 0.68;
  const sky = ctx.createLinearGradient(art.x, horizonY - art.height * 0.32, art.x, art.y + art.height);
  sky.addColorStop(0, palette.accent3);
  sky.addColorStop(0.46, palette.accent);
  sky.addColorStop(1, palette.deep);
  ctx.fillStyle = sky;
  ctx.fillRect(art.x, horizonY - art.height * 0.35, art.width, art.height * 0.35);

  const sun = { x: art.x + art.width * 0.72, y: horizonY - art.height * 0.055, radius: art.width * 0.24 };
  ctx.save();
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, sun.radius, Math.PI, 0);
  ctx.closePath();
  ctx.clip();
  const sunFill = ctx.createLinearGradient(sun.x, sun.y - sun.radius, sun.x, sun.y);
  sunFill.addColorStop(0, palette.accent4);
  sunFill.addColorStop(1, palette.accent);
  ctx.fillStyle = sunFill;
  ctx.fillRect(sun.x - sun.radius, sun.y - sun.radius, sun.radius * 2, sun.radius);
  for (let band = 0; band < 5; band += 1) {
    const y = sun.y - sun.radius * 0.12 + (band + bandOffset) * sun.radius * 0.105;
    ctx.fillStyle = palette.deep;
    ctx.fillRect(sun.x - sun.radius, y, sun.radius * 2, Math.max(3, sun.radius * 0.025));
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(art.x, horizonY, art.width, art.y + art.height - horizonY);
  ctx.clip();
  ctx.strokeStyle = rgba(palette.accent2, 0.82);
  ctx.lineWidth = Math.max(1.5, art.width * 0.004);
  const vanishingX = art.x + art.width * (0.56 + gridOffset * 0.015);
  for (let index = -5; index <= 5; index += 1) {
    ctx.beginPath();
    ctx.moveTo(vanishingX + index * art.width * 0.018, horizonY);
    ctx.lineTo(art.x + art.width * (0.5 + index * 0.2), art.y + art.height);
    ctx.stroke();
  }
  for (let step = 1; step <= 6; step += 1) {
    const p = step / 6;
    const y = horizonY + (art.y + art.height - horizonY) * p ** 1.65;
    ctx.beginPath();
    ctx.moveTo(art.x, y);
    ctx.lineTo(art.x + art.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWindow(ctx: ReturnType<typeof canvasFor>['ctx'], art: NarrativeRect, artifact: DesktopArtifact, palette: ReturnType<typeof getStyle>['palette'], fonts: NarrativeRenderContext['fonts'], progress: number, status: NormalizedNarrativeBrief['status']): { window: NarrativeRect; row: NarrativeRect; detail: NarrativeRect | null } {
  const window: NarrativeRect = {
    x: art.x + art.width * 0.035,
    y: art.y + art.height * 0.075,
    width: art.width * artifact.windowWidth,
    height: art.height * 0.53,
  };
  const chrome = Math.max(4, art.width * 0.012);
  ctx.fillStyle = '#101024';
  ctx.fillRect(window.x + chrome, window.y + chrome, window.width, window.height);
  ctx.fillStyle = palette.surface;
  ctx.fillRect(window.x, window.y, window.width, window.height);
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = Math.max(2, art.width * 0.008);
  ctx.strokeRect(window.x, window.y, window.width, window.height);
  ctx.fillStyle = palette.accent2;
  ctx.fillRect(window.x, window.y, window.width, art.height * 0.082);
  drawText(ctx, 'EDITOR DE REVISION', window.x + art.width * 0.035, window.y + art.height * 0.056, fonts.effective.figure.family, fonts.effective.figure.weight, Math.max(24, art.width * 0.042), palette.ink);

  const buttonSize = art.height * 0.034;
  for (let index = 0; index < 3; index += 1) {
    ctx.fillStyle = index === 0 ? palette.accent : index === 1 ? palette.accent4 : palette.accent2;
    ctx.fillRect(window.x + window.width - (index + 1) * buttonSize * 1.4, window.y + art.height * 0.021, buttonSize, buttonSize);
  }
  drawText(ctx, 'ARCHIVO DEMO · 1999', window.x + art.width * 0.035, window.y + art.height * 0.13, fonts.effective.label.family, fonts.effective.label.weight, Math.max(24, art.width * 0.042), palette.accent4);
  drawRule(ctx, window.x + art.width * 0.035, window.y + art.height * 0.15, window.x + window.width - art.width * 0.035, rgba(palette.ink, 0.42), 1.5);

  const detailReveal = Math.min(1, Math.max(0, progress - 1));
  const comparisonRow: NarrativeRect = { x: window.x + window.width * 0.055, y: window.y + window.height * 0.57, width: window.width * 0.53, height: window.height * 0.20 };
  const taskRowHeight = window.height * 0.18;
  const taskRows = [0, 1, 2].map((index) => ({
    x: window.x + window.width * 0.055,
    y: window.y + window.height * (0.26 + index * 0.21),
    width: window.width * 0.89,
    height: taskRowHeight,
  }));
  const row = artifact.composition === 'comparison' ? comparisonRow : taskRows[0]!;
  const detail: NarrativeRect | null = artifact.composition === 'comparison'
    ? { x: window.x + window.width * 0.62, y: window.y + window.height * 0.26, width: window.width * 0.33, height: window.height * 0.58 }
    : null;
  const labelSize = Math.max(24, art.width * 0.042);

  if (artifact.composition === 'comparison') {
    const detailRect = detail!;
    const selectedAlpha = Math.min(1, progress);
    ctx.fillStyle = rgba(palette.accent, 0.18 + selectedAlpha * 0.52);
    ctx.fillRect(row.x, row.y, row.width, row.height);
    ctx.strokeStyle = selectedAlpha > 0.3 ? palette.accent4 : rgba(palette.ink, 0.55);
    ctx.lineWidth = 2;
    ctx.strokeRect(row.x, row.y, row.width, row.height);
    drawText(ctx, 'LECTURA.TXT', row.x + art.width * 0.13, row.y + row.height * 0.63, fonts.effective.reading.family, fonts.effective.reading.weight, labelSize, palette.ink);

    if (detailReveal > 0) {
      ctx.save();
      ctx.globalAlpha = detailReveal;
      ctx.fillStyle = rgba(palette.deep, 0.62);
      ctx.fillRect(detailRect.x, detailRect.y, detailRect.width, detailRect.height);
      ctx.strokeStyle = palette.accent2;
      ctx.lineWidth = 2;
      ctx.strokeRect(detailRect.x, detailRect.y, detailRect.width, detailRect.height);
      drawText(ctx, 'ESTADO', detailRect.x + art.width * 0.025, detailRect.y + detailRect.height * 0.29, fonts.effective.label.family, fonts.effective.label.weight, labelSize, palette.accent4);
      drawRule(ctx, detailRect.x + art.width * 0.025, detailRect.y + detailRect.height * 0.38, detailRect.x + detailRect.width - art.width * 0.025, palette.accent2, 2);
      drawText(ctx, status === 'done' ? 'REVISADO' : 'EN REVISIÓN', detailRect.x + art.width * 0.025, detailRect.y + detailRect.height * 0.62, fonts.effective.reading.family, fonts.effective.reading.weight, labelSize, palette.ink);
      ctx.restore();
    }
  } else {
    const labels = ['LECTURA.TXT', 'SEÑALAR', 'ARCHIVAR'];
    const current = Math.min(2, Math.floor(progress));
    taskRows.forEach((task, index) => {
      const done = index < progress || (status === 'done' && progress >= 2 && index === 2);
      ctx.fillStyle = rgba(palette.accent, index === current ? 0.3 : 0.1);
      ctx.fillRect(task.x, task.y, task.width, task.height);
      ctx.strokeStyle = index === current ? palette.accent4 : rgba(palette.ink, 0.45);
      ctx.lineWidth = 2;
      ctx.strokeRect(task.x, task.y, task.width, task.height);
      const labelX = task.x + (index === 0 ? art.width * 0.15 : art.width * 0.07);
      drawText(ctx, labels[index]!, labelX, task.y + task.height * 0.69, fonts.effective.reading.family, fonts.effective.reading.weight, labelSize, palette.ink);
      if (index === 0) drawText(ctx, 'REVISAR', task.x + task.width * 0.66, task.y + task.height * 0.69, fonts.effective.label.family, fonts.effective.label.weight, labelSize, palette.accent4);
      const markX = task.x + task.width * 0.9;
      const markY = task.y + task.height * 0.5;
      ctx.strokeStyle = done ? palette.accent4 : rgba(palette.ink, 0.55);
      ctx.strokeRect(markX - art.width * 0.025, markY - art.width * 0.025, art.width * 0.05, art.width * 0.05);
      if (done) {
        ctx.beginPath();
        ctx.moveTo(markX - art.width * 0.015, markY);
        ctx.lineTo(markX - art.width * 0.003, markY + art.width * 0.012);
        ctx.lineTo(markX + art.width * 0.019, markY - art.width * 0.016);
        ctx.strokeStyle = palette.accent4;
        ctx.lineWidth = Math.max(2, art.width * 0.006);
        ctx.stroke();
      }
    });
  }
  return { window, row, detail };
}

function drawFileIcon(ctx: ReturnType<typeof canvasFor>['ctx'], centerX: number, centerY: number, size: number, palette: ReturnType<typeof getStyle>['palette'], fonts: NarrativeRenderContext['fonts'], captionAlpha = 1): void {
  const x = centerX - size * 0.34;
  const y = centerY - size * 0.40;
  ctx.fillStyle = palette.accent4;
  ctx.fillRect(x, y, size * 0.68, size * 0.82);
  ctx.fillStyle = palette.accent3;
  ctx.beginPath();
  ctx.moveTo(x + size * 0.42, y);
  ctx.lineTo(x + size * 0.68, y + size * 0.26);
  ctx.lineTo(x + size * 0.42, y + size * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size * 0.68, size * 0.82);
  drawRule(ctx, x + size * 0.11, y + size * 0.48, x + size * 0.55, palette.surface, 2);
  drawRule(ctx, x + size * 0.11, y + size * 0.62, x + size * 0.47, palette.surface, 2);
  if (captionAlpha > 0.01) {
    ctx.save();
    ctx.globalAlpha = captionAlpha;
    drawText(ctx, 'ARCHIVO', x - size * 0.16, y + size * 1.04, fonts.effective.reading.family, fonts.effective.reading.weight, Math.max(24, size * 0.28), palette.ink);
    ctx.restore();
  }
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  const { brief, layout, frame, object, fonts } = context;
  const artifact = object as DesktopArtifact;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const art = layout.reservedArtArea;
  const palette = getStyle('vaporwave').palette;
  const easing = phaseMarkProgress(frame, (value) => cubicBezierEase(value, 0.22, 0.76, 0.25, 1));
  const from = stateRank(brief.phases[frame.fromPhaseIndex]!);
  const to = stateRank(brief.phases[frame.toPhaseIndex]!);
  const progress = from + (to - from) * easing;

  ctx.save();
  ctx.beginPath();
  ctx.rect(art.x, art.y, art.width, art.height);
  ctx.clip();
  ctx.fillStyle = palette.bg;
  ctx.fillRect(art.x, art.y, art.width, art.height);
  drawHorizon(ctx, art, palette, artifact.gridOffset, artifact.sunBandOffset);
  const { window, row } = drawWindow(ctx, art, artifact, palette, fonts, progress, brief.status);
  const desktopX = art.x + art.width * 0.75;
  const desktopY = art.y + art.height * 0.84;
  const rowX = row.x + art.width * 0.055;
  const rowY = row.y + row.height * 0.49;
  const fileX = progress >= 1 ? rowX : desktopX + (rowX - desktopX) * progress;
  const fileY = progress >= 1 ? rowY : desktopY + (rowY - desktopY) * progress;
  const fileSize = Math.min(art.width * 0.14, art.height * 0.14, row.height * 0.96);
  drawFileIcon(ctx, fileX, fileY, fileSize, palette, fonts, Math.max(0, 1 - progress / 0.38));
  if (artifact.composition === 'comparison' && progress > 1) {
    ctx.strokeStyle = rgba(palette.accent4, Math.min(1, progress - 1));
    ctx.lineWidth = 2;
    ctx.strokeRect(row.x - 3, row.y - 3, row.width + 6, row.height + 6);
  }
  const status = artifact.composition === 'checklist' ? 'REVISAR · MARCAR · ARCHIVAR' : 'ARCHIVO · LECTURA · REVISIÓN';
  drawText(ctx, status, art.x + art.width * 0.045, window.y + window.height * 0.94, fonts.effective.reading.family, fonts.effective.reading.weight, Math.max(24, art.width * 0.042), palette.ink);
  ctx.restore();
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const vaporwaveNarrativeScene: NarrativeScene = {
  style: 'vaporwave',
  version: 'vaporwave-desktop-archive/1.0.0',
  supportsAspect(aspect) {
    return Math.abs(aspect - 16 / 9) / (16 / 9) < 0.015;
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'archivo-de-revision-1999',
      composition: compositionFor(brief),
      gridOffset: Math.floor(rng() * 3),
      sunBandOffset: Math.floor(rng() * 2),
      windowWidth: 0.91 + rng() * 0.055,
    } satisfies DesktopArtifact);
  },
  renderFrame,
};
