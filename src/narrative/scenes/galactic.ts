import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativePhase, NarrativeRect, NarrativeRenderContext, NarrativeScene, NormalizedNarrativeBrief } from '../../types/narrative.js';
import { cubicBezierEase, drawText, phaseMarkProgress, rgba } from './common.js';

interface OrbitalRecord {
  readonly identity: 'trayectoria-de-revision';
  readonly composition: 'comparison' | 'checklist';
  readonly planetScale: number;
  readonly orbitTilt: number;
  readonly starPositions: ReadonlyArray<{ x: number; y: number; radius: number; alpha: number }>;
}

interface Point { x: number; y: number }

function compositionFor(brief: NormalizedNarrativeBrief): OrbitalRecord['composition'] {
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

function cubicPoint(points: readonly [Point, Point, Point, Point], t: number): Point {
  const u = 1 - t;
  return {
    x: u ** 3 * points[0].x + 3 * u ** 2 * t * points[1].x + 3 * u * t ** 2 * points[2].x + t ** 3 * points[3].x,
    y: u ** 3 * points[0].y + 3 * u ** 2 * t * points[1].y + 3 * u * t ** 2 * points[2].y + t ** 3 * points[3].y,
  };
}

function comparisonRoute(art: NarrativeRect): readonly [Point, Point, Point, Point] {
  return [
    { x: art.x + art.width * 0.015, y: art.y + art.height * 0.78 },
    { x: art.x + art.width * 0.16, y: art.y + art.height * 0.12 },
    { x: art.x + art.width * 0.72, y: art.y + art.height * 0.14 },
    { x: art.x + art.width * 0.80, y: art.y + art.height * 0.37 },
  ];
}

function drawStarField(ctx: ReturnType<typeof canvasFor>['ctx'], art: NarrativeRect, record: OrbitalRecord, accent: string): void {
  for (const star of record.starPositions) {
    const x = art.x + star.x * art.width;
    const y = art.y + star.y * art.height;
    ctx.fillStyle = rgba(accent, star.alpha);
    ctx.beginPath();
    ctx.arc(x, y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlanet(ctx: ReturnType<typeof canvasFor>['ctx'], art: NarrativeRect, record: OrbitalRecord, palette: ReturnType<typeof getStyle>['palette']): Point {
  const center = { x: art.x + art.width * 0.84, y: art.y + art.height * 0.51 };
  const rx = art.width * 0.36 * record.planetScale;
  const ry = art.height * 0.47 * record.planetScale;
  const fill = ctx.createRadialGradient(center.x - rx * 0.55, center.y - ry * 0.48, 0, center.x, center.y, rx * 1.5);
  fill.addColorStop(0, '#303852');
  fill.addColorStop(0.57, palette.surface);
  fill.addColorStop(1, palette.deep);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, rx, ry, 0.02, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.clip();
  ctx.strokeStyle = rgba(palette.muted, 0.16);
  ctx.lineWidth = Math.max(2, art.width * 0.014);
  for (let band = 0; band < 5; band += 1) {
    const y = center.y - ry * 0.55 + band * ry * 0.28;
    ctx.beginPath();
    ctx.ellipse(center.x - rx * 0.18, y, rx * (0.74 + band * 0.025), ry * 0.11, 0.08, Math.PI * 0.12, Math.PI * 0.92);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(center.x, center.y, rx, ry, 0.02, -Math.PI * 0.46, Math.PI * 0.41);
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = Math.max(2, art.width * 0.008);
  ctx.stroke();
  ctx.restore();
  return center;
}

function drawPlanetaryOrbits(ctx: ReturnType<typeof canvasFor>['ctx'], art: NarrativeRect, center: Point, record: OrbitalRecord, palette: ReturnType<typeof getStyle>['palette'], active: number): void {
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(record.orbitTilt);
  ctx.beginPath();
  ctx.ellipse(0, 0, art.width * 0.53, art.height * 0.47, 0, Math.PI * 0.04, Math.PI * 1.98);
  ctx.strokeStyle = rgba(palette.muted, 0.34);
  ctx.lineWidth = Math.max(1.5, art.width * 0.003);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, art.width * 0.43, art.height * 0.39, 0, Math.PI * 0.08, Math.PI * 1.88);
  ctx.strokeStyle = rgba(palette.accent2, 0.22);
  ctx.lineWidth = Math.max(1, art.width * 0.002);
  ctx.stroke();
  ctx.restore();

  if (active > 0) {
    const target = { x: art.x + art.width * 0.79, y: art.y + art.height * 0.37 };
    ctx.beginPath();
    ctx.arc(target.x, target.y, art.width * 0.025, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(palette.accent, Math.min(0.9, active * 0.9));
    ctx.lineWidth = Math.max(2, art.width * 0.006);
    ctx.stroke();
  }
}

function drawComparisonPath(ctx: ReturnType<typeof canvasFor>['ctx'], art: NarrativeRect, palette: ReturnType<typeof getStyle>['palette'], progress: number): void {
  const route = comparisonRoute(art);
  ctx.beginPath();
  ctx.moveTo(route[0].x, route[0].y);
  ctx.bezierCurveTo(route[1].x, route[1].y, route[2].x, route[2].y, route[3].x, route[3].y);
  ctx.strokeStyle = rgba(palette.accent, 0.68);
  ctx.lineWidth = Math.max(1.5, art.width * 0.004);
  ctx.setLineDash([art.width * 0.018, art.width * 0.016]);
  ctx.stroke();
  ctx.setLineDash([]);
  const start = cubicPoint(route, 0.09);
  const target = cubicPoint(route, 0.9);
  for (const endpoint of [start, target]) {
    ctx.beginPath();
    ctx.arc(endpoint.x, endpoint.y, art.width * 0.014, 0, Math.PI * 2);
    ctx.fillStyle = endpoint === start ? palette.muted : palette.accent3;
    ctx.fill();
  }
  const point = cubicPoint(route, 0.09 + Math.min(1, progress / 2) * 0.81);
  const radius = art.width * (0.024 + Math.min(1, progress / 2) * 0.008);
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius * 2.4, 0, Math.PI * 2);
  ctx.fillStyle = rgba(palette.accent, 0.14 + Math.min(1, progress / 2) * 0.17);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = palette.ink;
  ctx.fill();
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, 'TRAYECTORIA', art.x + art.width * 0.04, art.y + art.height * 0.94, 'Space Grotesk', 500, Math.max(24, art.width * 0.055), palette.muted);
}

function drawChecklistPath(ctx: ReturnType<typeof canvasFor>['ctx'], art: NarrativeRect, palette: ReturnType<typeof getStyle>['palette'], progress: number, status: NormalizedNarrativeBrief['status']): void {
  const points: Point[] = [
    { x: art.x + art.width * 0.07, y: art.y + art.height * 0.78 },
    { x: art.x + art.width * 0.37, y: art.y + art.height * 0.60 },
    { x: art.x + art.width * 0.62, y: art.y + art.height * 0.40 },
  ];
  ctx.beginPath();
  ctx.moveTo(points[0]!.x, points[0]!.y);
  ctx.lineTo(points[1]!.x, points[1]!.y);
  ctx.lineTo(points[2]!.x, points[2]!.y);
  ctx.strokeStyle = rgba(palette.accent, 0.7);
  ctx.lineWidth = Math.max(2, art.width * 0.006);
  ctx.stroke();
  points.forEach((point, index) => {
    const active = progress >= index ? 1 : 0.25;
    ctx.beginPath();
    ctx.arc(point.x, point.y, art.width * 0.026, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(index === 2 ? palette.accent3 : palette.accent, active);
    ctx.lineWidth = Math.max(2, art.width * 0.006);
    ctx.stroke();
    if (index < progress || (status === 'done' && progress >= 2 && index === 2) || (index === Math.floor(progress) && progress % 1 > 0.5)) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, art.width * 0.01, 0, Math.PI * 2);
      ctx.fillStyle = index === 2 ? palette.accent3 : palette.accent;
      ctx.fill();
    }
  });
  const currentIndex = Math.min(2, Math.floor(progress));
  const activeSegment = currentIndex === 2 ? 0 : Math.min(1, progress - currentIndex);
  const current = points[currentIndex]!;
  const next = points[Math.min(2, currentIndex + 1)]!;
  const position = { x: current.x + (next.x - current.x) * activeSegment, y: current.y + (next.y - current.y) * activeSegment };
  ctx.beginPath();
  ctx.arc(position.x, position.y, art.width * 0.022, 0, Math.PI * 2);
  ctx.fillStyle = palette.ink;
  ctx.fill();
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, 'OBSERVAR', points[0]!.x - art.width * 0.035, points[0]!.y + art.height * 0.065, 'Space Grotesk', 500, Math.max(24, art.width * 0.05), palette.muted);
  drawText(ctx, 'ANOTAR', points[1]!.x - art.width * 0.035, points[1]!.y + art.height * 0.065, 'Space Grotesk', 500, Math.max(24, art.width * 0.05), palette.muted);
  drawText(ctx, 'ARCHIVAR', points[2]!.x - art.width * 0.035, points[2]!.y + art.height * 0.065, 'Space Grotesk', 500, Math.max(24, art.width * 0.05), palette.muted);
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  const { brief, layout, frame, object } = context;
  const record = object as OrbitalRecord;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const art = layout.reservedArtArea;
  const palette = getStyle('galactic').palette;
  const easing = phaseMarkProgress(frame, (value) => cubicBezierEase(value, 0.2, 0.72, 0.24, 1));
  const from = stateRank(brief.phases[frame.fromPhaseIndex]!);
  const to = stateRank(brief.phases[frame.toPhaseIndex]!);
  const progress = from + (to - from) * easing;

  ctx.save();
  ctx.beginPath();
  ctx.rect(art.x, art.y, art.width, art.height);
  ctx.clip();
  drawStarField(ctx, art, record, palette.ink);
  const center = drawPlanet(ctx, art, record, palette);
  drawPlanetaryOrbits(ctx, art, center, record, palette, progress / 2);
  if (record.composition === 'comparison') drawComparisonPath(ctx, art, palette, progress);
  else drawChecklistPath(ctx, art, palette, progress, brief.status);
  ctx.restore();
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const galacticNarrativeScene: NarrativeScene = {
  style: 'galactic',
  version: 'galactic-orbital-review/1.0.0',
  supportsAspect(aspect) {
    return Math.abs(aspect - 16 / 9) / (16 / 9) < 0.015;
  },
  createObject(brief, rng) {
    const starPositions = Array.from({ length: 11 }, () => ({
      x: 0.05 + rng() * 0.9,
      y: 0.04 + rng() * 0.92,
      radius: 1.2 + rng() * 2.5,
      alpha: 0.24 + rng() * 0.44,
    }));
    return Object.freeze({
      identity: 'trayectoria-de-revision',
      composition: compositionFor(brief),
      planetScale: 0.96 + rng() * 0.07,
      orbitTilt: (rng() - 0.5) * 0.16,
      starPositions,
    } satisfies OrbitalRecord);
  },
  renderFrame,
};
