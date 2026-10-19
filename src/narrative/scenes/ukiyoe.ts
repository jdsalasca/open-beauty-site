import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativeObjectRegion, NarrativePhase, NarrativeRect, NarrativeRenderContext, NarrativeScene, NormalizedNarrativeBrief } from '../../types/narrative.js';
import type { NarrativeSemanticEntity, NarrativeSemanticScene } from '../../types/narrative-scene.js';
import { cubicBezierEase, drawText } from './common.js';
import { sceneVocabulary } from '../vocabulary.js';
import { legacySemanticStateText, sceneText } from '../i18n.js';

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
  const shoreStart = x + w * 0.08;
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
  const box = { x: x + w * 0.68, y: y + h * 0.08, width: w * 0.28, height: h * 0.31 };
  ctx.fillStyle = '#F3E9D2';
  ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1;
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  ctx.strokeStyle = vermilion;
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x + 5, box.y + 5, box.width - 10, box.height - 10);
  drawText(ctx, sceneText('ukiyoe', locale, 'point'), box.x + box.width * 0.10, box.y + box.height * 0.37, face, 500, 28, ink);
  drawText(ctx, sceneText('ukiyoe', locale, 'of'), box.x + box.width * 0.10, box.y + box.height * 0.61, face, 500, 28, ink);
  drawText(ctx, sceneText('ukiyoe', locale, 'review'), box.x + box.width * 0.10, box.y + box.height * 0.84, face, 500, 28, ink);
}

function drawReference(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, ink: string, vermilion: string, face: string, locale: 'es' | 'en', semanticLabel = false): { x: number; y: number } {
  const point = { x: field.x + field.width * 0.94, y: field.y + field.height * 0.52 };
  ctx.fillStyle = vermilion;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#F3E9D2';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
  ctx.stroke();
  if (semanticLabel) {
    const panel = { x: point.x - 126, y: point.y + field.height * 0.17, width: 116, height: 38 };
    ctx.fillStyle = '#F3E9D2';
    ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
    ctx.strokeStyle = vermilion;
    ctx.lineWidth = 2;
    ctx.strokeRect(panel.x, panel.y, panel.width, panel.height);
    drawText(ctx, sceneText('ukiyoe', locale, 'signal'), panel.x + 8, panel.y + 27, face, 500, 28, ink);
  } else {
    // Preserve the historical legacy artwork exactly for opt-out and unsupported styles.
    drawText(ctx, sceneText('ukiyoe', locale, 'signal'), point.x - 98, point.y - 20, face, 500, 28, ink);
  }
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

function semanticAt(context: NarrativeRenderContext, phaseIndex: number): NarrativeSemanticScene {
  return context.brief.phases[phaseIndex]!.visual.semantic;
}

function collectionMember(semantic: NarrativeSemanticScene, entityId: string, collectionId: string): boolean {
  return semantic.relations.some((relation) => relation.kind === 'member-of' && relation.from === entityId && relation.to === collectionId);
}

function memberProgress(context: NarrativeRenderContext, entityId: string, collectionId: string): number {
  const { frame } = context;
  if (context.semantic?.legacyUpgrade) {
    const progressFor = (phaseIndex: number): number => {
      const state = semanticAt(context, phaseIndex).states[entityId];
      return state === 'pending' ? 0.12 : state === 'flagged' ? 0.52 : state === 'ready-for-review' ? 0.92 : 0;
    };
    if (frame.kind === 'transition' || frame.kind === 'loop-bridge') {
      return progressFor(frame.fromPhaseIndex) + (progressFor(frame.toPhaseIndex) - progressFor(frame.fromPhaseIndex)) * frame.progress;
    }
    return progressFor(context.phaseIndex);
  }
  if (frame.kind === 'transition' || frame.kind === 'loop-bridge') {
    const from = collectionMember(semanticAt(context, frame.fromPhaseIndex), entityId, collectionId) ? 1 : 0;
    const to = collectionMember(semanticAt(context, frame.toPhaseIndex), entityId, collectionId) ? 1 : 0;
    return from + (to - from) * cubicBezierEase(frame.progress, 0.22, 0.61, 0.36, 1);
  }
  return collectionMember(context.semantic!, entityId, collectionId) ? 1 : 0;
}

function fileProgress(context: NarrativeRenderContext, entityId: string): number {
  const phaseProgress = (phaseIndex: number) => {
    const semantic = semanticAt(context, phaseIndex);
    const entity = semantic.entities.find((item) => item.id === entityId);
    return entity?.progress ?? (semantic.states[entityId] === 'complete' ? 1 : 0);
  };
  const { frame } = context;
  if (frame.kind === 'transition' || frame.kind === 'loop-bridge') {
    const amount = cubicBezierEase(frame.progress, 0.22, 0.61, 0.36, 1);
    return phaseProgress(frame.fromPhaseIndex) + (phaseProgress(frame.toPhaseIndex) - phaseProgress(frame.fromPhaseIndex)) * amount;
  }
  const entity = context.semantic!.entities.find((item) => item.id === entityId);
  return entity?.progress ?? (context.semantic!.states[entityId] === 'complete' ? 1 : 0);
}

function semanticState(context: NarrativeRenderContext, entityId: string): string {
  const { frame } = context;
  if (frame.kind === 'transition' || frame.kind === 'loop-bridge') {
    const target = semanticAt(context, frame.toPhaseIndex);
    const source = semanticAt(context, frame.fromPhaseIndex);
    return frame.progress >= 0.5 ? target.states[entityId] ?? '' : source.states[entityId] ?? '';
  }
  return context.semantic!.states[entityId] ?? '';
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function routeNodes(field: NarrativeRect): Array<{ x: number; y: number }> {
  const { x, y, width: w, height: h } = field;
  return [
    { x: x + w * 0.32, y: y + h * 0.79 },
    { x: x + w * 0.31, y: y + h * 0.56 },
    { x: x + w * 0.49, y: y + h * 0.54 },
    { x: x + w * 0.67, y: y + h * 0.54 },
    { x: x + w * 0.94, y: y + h * 0.52 },
  ];
}

function routePoint(field: NarrativeRect, progress: number): { x: number; y: number } {
  const start = { x: field.x + field.width * 0.32, y: field.y + field.height * 0.79 };
  const control = { x: field.x + field.width * 0.42, y: field.y + field.height * 0.38 };
  const end = { x: field.x + field.width * 0.94, y: field.y + field.height * 0.52 };
  const t = clamp(progress);
  const inverse = 1 - t;
  return {
    x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
    y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
  };
}

function collectionPoint(field: NarrativeRect, progress: number): { x: number; y: number } {
  const nodes = routeNodes(field);
  const t = clamp(progress) * 3;
  const index = Math.min(2, Math.floor(t));
  const amount = clamp(t - index);
  const from = nodes[index]!;
  const to = nodes[index + 1]!;
  return { x: from.x + (to.x - from.x) * amount, y: from.y + (to.y - from.y) * amount };
}

function drawCloud(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, left: number, top: number, width: number, height: number, color: string): void {
  const x = field.x + field.width * left;
  const y = field.y + field.height * top;
  const w = field.width * width;
  const h = field.height * height;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.60);
  ctx.quadraticCurveTo(x + w * 0.16, y + h * 0.13, x + w * 0.34, y + h * 0.48);
  ctx.quadraticCurveTo(x + w * 0.52, y + h * 0.07, x + w * 0.66, y + h * 0.42);
  ctx.quadraticCurveTo(x + w * 0.85, y + h * 0.18, x + w, y + h * 0.58);
  ctx.lineTo(x + w * 0.91, y + h * 0.82);
  ctx.quadraticCurveTo(x + w * 0.52, y + h * 0.98, x + w * 0.11, y + h * 0.79);
  ctx.closePath();
  ctx.fill();
}

function drawCoastalSky(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, colors: { mist: string; moss: string }): void {
  // Leave broad open sky while breaking the empty rectangular block with two quiet ink-cloud planes.
  drawCloud(ctx, field, 0.05, 0.09, 0.49, 0.12, colors.mist);
  drawCloud(ctx, field, 0.47, 0.25, 0.43, 0.11, colors.moss);
  drawCloud(ctx, field, 0.10, 0.34, 0.30, 0.06, colors.mist);
}

function drawHorizon(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, ink: string): void {
  const y = field.y + field.height * 0.52;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(field.x + field.width * 0.08, y);
  ctx.lineTo(field.x + field.width * 0.98, y);
  ctx.stroke();
}

function drawRoute(ctx: ReturnType<typeof canvasFor>['ctx'], nodes: Array<{ x: number; y: number }>, progress: number, colors: { mist: string; vermilion: string }): void {
  ctx.save();
  ctx.strokeStyle = colors.mist;
  ctx.lineWidth = 7;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  ctx.moveTo(nodes[0]!.x, nodes[0]!.y);
  for (const node of nodes.slice(1)) ctx.lineTo(node.x, node.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = colors.vermilion;
  ctx.lineWidth = 7;
  const count = nodes.length - 1;
  const distance = clamp(progress) * count;
  ctx.beginPath();
  ctx.moveTo(nodes[0]!.x, nodes[0]!.y);
  for (let index = 0; index < count; index += 1) {
    const from = nodes[index]!;
    const to = nodes[index + 1]!;
    const portion = clamp(distance - index);
    if (portion <= 0) break;
    ctx.lineTo(from.x + (to.x - from.x) * portion, from.y + (to.y - from.y) * portion);
    if (portion < 1) break;
  }
  ctx.stroke();
  ctx.restore();
}

function drawLargeBoat(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, center: { x: number; y: number }, colors: { ink: string; blue: string; vermilion: string; surface: string }, scale = 1): void {
  const w = field.width * 0.42 * scale;
  const h = field.height * scale;
  const mastX = center.x + w * 0.02;
  const deckY = center.y + h * 0.055;
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.moveTo(center.x - w * 0.5, deckY);
  ctx.lineTo(center.x + w * 0.5, deckY);
  ctx.lineTo(center.x + w * 0.34, deckY + h * 0.075);
  ctx.quadraticCurveTo(center.x, deckY + h * 0.14, center.x - w * 0.34, deckY + h * 0.075);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(mastX, deckY - h * 0.39);
  ctx.lineTo(mastX, deckY + h * 0.02);
  ctx.stroke();
  ctx.fillStyle = colors.surface;
  ctx.beginPath();
  ctx.moveTo(mastX - w * 0.03, deckY - h * 0.35);
  ctx.lineTo(mastX - w * 0.40, deckY - h * 0.025);
  ctx.lineTo(mastX - w * 0.03, deckY - h * 0.025);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.blue;
  ctx.beginPath();
  ctx.moveTo(mastX + w * 0.035, deckY - h * 0.34);
  ctx.lineTo(mastX + w * 0.36, deckY - h * 0.035);
  ctx.lineTo(mastX + w * 0.035, deckY - h * 0.035);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = colors.vermilion;
  ctx.beginPath();
  ctx.moveTo(mastX - w * 0.04, deckY - h * 0.40);
  ctx.lineTo(mastX + w * 0.08, deckY - h * 0.40);
  ctx.lineTo(mastX + w * 0.02, deckY - h * 0.36);
  ctx.closePath();
  ctx.fill();
  // A foreground wave crosses the keel to seat the boat in the layered sea.
  ctx.strokeStyle = colors.surface;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(center.x - w * 0.43, deckY + h * 0.10);
  ctx.quadraticCurveTo(center.x - w * 0.14, deckY + h * 0.15, center.x + w * 0.11, deckY + h * 0.10);
  ctx.quadraticCurveTo(center.x + w * 0.31, deckY + h * 0.08, center.x + w * 0.48, deckY + h * 0.11);
  ctx.stroke();
}

function drawFailureMark(ctx: ReturnType<typeof canvasFor>['ctx'], point: { x: number; y: number }, color: string): void {
  const radius = 18;
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.moveTo(point.x - radius * 0.58, point.y - radius * 0.58);
  ctx.lineTo(point.x + radius * 0.58, point.y + radius * 0.58);
  ctx.moveTo(point.x + radius * 0.58, point.y - radius * 0.58);
  ctx.lineTo(point.x - radius * 0.58, point.y + radius * 0.58);
  ctx.stroke();
}

function drawStation(ctx: ReturnType<typeof canvasFor>['ctx'], field: NarrativeRect, index: number, progress: number, colors: { ink: string; vermilion: string; surface: string; moss: string }, face: string): void {
  const x = field.x + field.width * (0.31 + index * 0.18);
  const y = field.y + field.height * 0.52;
  ctx.fillStyle = colors.moss;
  ctx.beginPath();
  ctx.moveTo(x - field.width * 0.08, y + field.height * 0.06);
  ctx.quadraticCurveTo(x - field.width * 0.02, y - field.height * 0.015, x + field.width * 0.04, y + field.height * 0.055);
  ctx.lineTo(x + field.width * 0.08, y + field.height * 0.07);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + field.height * 0.055);
  ctx.lineTo(x, y - field.height * 0.065);
  ctx.stroke();
  ctx.fillStyle = progress > 0.5 ? colors.vermilion : colors.surface;
  ctx.beginPath();
  ctx.arc(x, y - field.height * 0.07, field.height * (0.035 + progress * 0.012), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  drawText(ctx, String.fromCharCode(65 + index), x - 10, y + field.height * 0.13, face, 500, 28, colors.ink);
}

function pieceIndex(context: NarrativeRenderContext, entityId: string): number {
  return context.brief.phases[0]!.visual.semantic.entities
    .filter((entity) => entity.kind === 'card')
    .map((entity) => entity.id)
    .sort()
    .indexOf(entityId);
}

function drawSemanticScene(context: NarrativeRenderContext, print: CoastPrint): Uint8ClampedArray {
  const { brief } = context;
  const semantic = context.semantic!;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const preset = getStyle('ukiyoe');
  const field = artField(brief.output.width, brief.output.height);
  const colors = { blue: preset.palette.accent, mist: preset.palette.accent3, moss: preset.palette.accent4, vermilion: preset.palette.accent2, ink: preset.palette.ink, surface: preset.palette.surface };

  ctx.fillStyle = preset.palette.surface;
  ctx.fillRect(field.x, field.y, field.width, field.height);
  ctx.fillStyle = preset.palette.bg;
  ctx.fillRect(field.x, field.y, field.width, field.height * 0.45);
  drawCoastalSky(ctx, field, colors);
  drawMountain(ctx, field, colors.blue, colors.mist);
  drawSea(ctx, field, 2, print, colors.blue, colors.mist, colors.moss);
  drawHorizon(ctx, field, preset.palette.ink);
  drawReference(ctx, field, preset.palette.ink, colors.vermilion, context.fonts.effective.label.family, brief.locale, true);
  drawCartouche(ctx, field, preset.palette.ink, colors.vermilion, context.fonts.effective.label.family, brief.locale);

  if (semantic.primitive === 'file-download') {
    const file = semantic.entities.find((entity) => entity.kind === 'file')!;
    const progress = fileProgress(context, file.id);
    const boat = routePoint(field, progress);
    const nodes = Array.from({ length: 21 }, (_, index) => routePoint(field, index / 20));
    drawRoute(ctx, nodes, progress * (nodes.length - 1), colors);
    drawLargeBoat(ctx, field, boat, colors);
    const state = semanticState(context, file.id);
    if (state === 'failed' || state === 'retrying') drawFailureMark(ctx, routePoint(field, 0.55), colors.vermilion);
  } else if (semantic.primitive === 'card-collection') {
    const collection = semantic.entities.find((entity) => entity.kind === 'collection')!;
    const cards = semantic.entities.filter((entity) => entity.kind === 'card');
    const nodes = routeNodes(field);
    const amount = cards.reduce((sum, entity) => sum + memberProgress(context, entity.id, collection.id), 0) / Math.max(1, cards.length);
    for (const entity of cards) {
      const stableIndex = pieceIndex(context, entity.id);
      drawStation(ctx, field, stableIndex, memberProgress(context, entity.id, collection.id), colors, context.fonts.effective.label.family);
      if (stableIndex < cards.length) {
        const start = nodes[stableIndex]!;
        const end = nodes[stableIndex + 1]!;
        const progress = memberProgress(context, entity.id, collection.id);
        ctx.strokeStyle = colors.vermilion;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(start.x + (end.x - start.x) * progress, start.y + (end.y - start.y) * progress);
        ctx.stroke();
      }
    }
    const boat = collectionPoint(field, amount);
    drawLargeBoat(ctx, field, { x: boat.x, y: field.y + field.height * 0.87 }, colors, 0.55);
    if (semantic.legacyUpgrade) {
      const stateful = cards[0];
      const state = stateful ? semantic.states[stateful.id] ?? 'pending' : 'pending';
      drawText(ctx, legacySemanticStateText('ukiyoe', brief.locale, state), field.x + field.width * 0.69, field.y + field.height * 0.13, context.fonts.effective.label.family, 500, 28, preset.palette.ink);
    }
  }
  // The sea horizon and review point are drawn from fixed field coordinates in every phase.
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

function semanticObjectRegions(context: NarrativeRenderContext): NarrativeObjectRegion[] {
  const semantic = context.semantic;
  if (!semantic || !['file-download', 'card-collection'].includes(semantic.primitive)) return [];
  const field = artField(context.brief.output.width, context.brief.output.height);
  if (semantic.primitive === 'file-download') {
    return semantic.entities.filter((entity) => entity.kind === 'file').map((entity) => ({
      entityId: entity.id,
      bounds: { x: field.x + field.width * 0.04, y: field.y + field.height * 0.36, width: field.width * 0.92, height: field.height * 0.59 },
    }));
  }
  const collection = semantic.entities.find((entity) => entity.kind === 'collection');
  const regions: NarrativeObjectRegion[] = collection ? [{ entityId: collection.id, bounds: { x: field.x, y: field.y + field.height * 0.36, width: field.width, height: field.height * 0.60 } }] : [];
  for (const card of semantic.entities.filter((entity) => entity.kind === 'card')) {
    const index = pieceIndex(context, card.id);
    regions.push({ entityId: card.id, bounds: { x: field.x + field.width * (0.22 + index * 0.18), y: field.y + field.height * 0.43, width: field.width * 0.18, height: field.height * 0.30 } });
  }
  return regions;
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  if (context.semantic && ['file-download', 'card-collection'].includes(context.semantic.primitive)) {
    return drawSemanticScene(context, context.object as CoastPrint);
  }
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
  version: 'ukiyoe-coastal-print/1.1.0',
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
  objectRegions: semanticObjectRegions,
  renderFrame,
};
