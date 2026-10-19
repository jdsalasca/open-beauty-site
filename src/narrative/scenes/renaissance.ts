import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativeRenderContext, NarrativeObjectRegion, NarrativeRect, NarrativeScene } from '../../types/narrative.js';
import type { NarrativeSemanticEntity, NarrativeSemanticScene } from '../../types/narrative-scene.js';
import { cubicBezierEase, drawRule } from './common.js';
import { clamp, compositionFor, drawRoleText, mix, phasePosition, type StageCComposition } from './stage-c-common.js';
import { sceneVocabulary } from '../vocabulary.js';
import { sceneText } from '../i18n.js';

interface FrescoPanel {
  readonly identity: 'fresco-fragment';
  readonly composition: StageCComposition;
  readonly field: 'verdaccio' | 'powder';
  readonly archBias: number;
  readonly fragmentWidth: number;
  readonly catalogOffset: number;
}

function drawAsymmetricArch(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, panel: FrescoPanel, colors: ReturnType<typeof getStyle>['palette']): void {
  const { x, y, width: w, height: h } = box;
  // Flat plaster field and one asymmetric arch, with no vignette or radial wash.
  ctx.fillStyle = colors.surface;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = panel.field === 'verdaccio' ? colors.accent4 : colors.accent3;
  ctx.fillRect(x, y, w * 0.23, h);
  ctx.fillStyle = colors.accent3;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.12, y + h);
  ctx.lineTo(x + w * 0.12, y + h * 0.43);
  ctx.bezierCurveTo(x + w * 0.12, y + h * 0.18, x + w * (0.30 + panel.archBias), y + h * 0.06, x + w * 0.58, y + h * 0.10);
  ctx.bezierCurveTo(x + w * 0.83, y + h * 0.12, x + w * 0.90, y + h * 0.35, x + w * 0.90, y + h * 0.54);
  ctx.lineTo(x + w * 0.90, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = colors.accent2;
  ctx.fillRect(x + w * 0.86, y + h * 0.18, w * 0.04, h * 0.27);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(x + w * 0.12, y + h * 0.91, w * 0.78, h * 0.09);
  drawRule(ctx, x + w * 0.08, y + h * 0.91, x + w * 0.94, colors.ink, 2);
}

function drawFragment(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, piece: FrescoPanel, state: number, colors: ReturnType<typeof getStyle>['palette']): void {
  const fragmentW = box.width * piece.fragmentWidth;
  const fragmentH = box.height * 0.22;
  const start = { x: box.x + box.width * 0.045, y: box.y + box.height * 0.62 };
  const ledge = { x: box.x + box.width * 0.39, y: box.y + box.height * 0.64 };
  const slot = piece.composition === 'comparison'
    ? { x: box.x + box.width * 0.64, y: box.y + box.height * 0.40 }
    : { x: box.x + box.width * 0.66, y: box.y + box.height * (0.49 + piece.catalogOffset) };
  const progress = clamp(state);
  const finalProgress = clamp(state - 1);
  const x = state <= 1 ? mix(start.x, ledge.x, progress) : mix(ledge.x, slot.x, finalProgress);
  const y = state <= 1 ? mix(start.y, ledge.y, progress) : mix(ledge.y, slot.y, finalProgress);
  // A single cinnabar fragment is discovered, then seated in the painted register.
  ctx.fillStyle = colors.accent2;
  ctx.beginPath();
  ctx.moveTo(x, y + fragmentH * 0.08);
  ctx.lineTo(x + fragmentW * 0.84, y);
  ctx.lineTo(x + fragmentW, y + fragmentH * 0.73);
  ctx.lineTo(x + fragmentW * 0.87, y + fragmentH);
  ctx.lineTo(x + fragmentW * 0.11, y + fragmentH * 0.91);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = colors.bg;
  ctx.fillRect(x + fragmentW * 0.16, y + fragmentH * 0.25, fragmentW * 0.49, fragmentH * 0.05);
}

function drawComparison(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, panel: FrescoPanel, state: number, colors: ReturnType<typeof getStyle>['palette']): void {
  drawAsymmetricArch(ctx, box, panel, colors);
  ctx.fillStyle = colors.accent4;
  ctx.fillRect(box.x + box.width * 0.28, box.y + box.height * 0.76, box.width * 0.60, box.height * 0.08);
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x + box.width * 0.59, box.y + box.height * 0.34, box.width * 0.27, box.height * 0.29);
  drawFragment(ctx, box, panel, state, colors);
}

function drawChecklist(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, panel: FrescoPanel, state: number, colors: ReturnType<typeof getStyle>['palette']): void {
  drawAsymmetricArch(ctx, box, panel, colors);
  const left = box.x + box.width * 0.33;
  const right = box.x + box.width * 0.82;
  const rows = [0.34, 0.52, 0.70];
  for (const [index, row] of rows.entries()) {
    const y = box.y + box.height * row;
    ctx.fillStyle = index === 1 ? colors.accent4 : colors.surface;
    ctx.fillRect(left, y, right - left, box.height * 0.10);
    drawRule(ctx, left, y + box.height * 0.10, right, colors.muted, 1.5);
  }
  drawFragment(ctx, box, panel, state, colors);
}

function semanticFor(context: NarrativeRenderContext, phaseIndex: number): NarrativeSemanticScene {
  return context.brief.phases[phaseIndex]!.visual.semantic;
}

function pieceIndex(context: NarrativeRenderContext, entityId: string): number {
  const identities = context.brief.phases[0]!.visual.semantic.entities
    .filter((entity) => entity.kind === 'card' || entity.kind === 'row')
    .map((entity) => entity.id)
    .sort();
  return identities.indexOf(entityId);
}

function isMember(semantic: NarrativeSemanticScene, entityId: string, collectionId: string): boolean {
  return semantic.relations.some((relation) => relation.kind === 'member-of' && relation.from === entityId && relation.to === collectionId)
    || semantic.relations.some((relation) => relation.kind === 'counts' && relation.from === collectionId && relation.to === entityId);
}

function membershipProgress(context: NarrativeRenderContext, entityId: string, collectionId: string): number {
  const { frame } = context;
  const semantic = context.semantic!;
  if (frame.kind === 'transition' || frame.kind === 'loop-bridge') {
    const from = isMember(semanticFor(context, frame.fromPhaseIndex), entityId, collectionId) ? 1 : 0;
    const to = isMember(semanticFor(context, frame.toPhaseIndex), entityId, collectionId) ? 1 : 0;
    return mix(from, to, cubicBezierEase(frame.progress, 0.22, 0.61, 0.36, 1));
  }
  return isMember(semantic, entityId, collectionId) ? 1 : 0;
}

function panelSlot(box: NarrativeRect, index: number, composition: 'comparison' | 'checklist'): NarrativeRect {
  const columns = composition === 'comparison' ? 2 : 1;
  const width = composition === 'comparison' ? box.width * 0.29 : box.width * 0.42;
  const height = composition === 'comparison' ? box.height * 0.23 : box.height * 0.125;
  const gapX = box.width * 0.035;
  const gapY = box.height * (composition === 'comparison' ? 0.035 : 0.025);
  const left = composition === 'comparison' ? box.x + box.width * 0.19 : box.x + box.width * 0.27;
  const top = box.y + box.height * (composition === 'comparison' ? 0.27 : 0.30);
  const row = Math.floor(index / columns);
  const column = index % columns;
  const asymmetry = (row % 2 ? 0.018 : 0) * box.width;
  return {
    x: left + column * (width + gapX) + asymmetry,
    y: top + row * (height + gapY) + (column ? box.height * 0.018 : 0),
    width,
    height,
  };
}

function fragmentStart(box: NarrativeRect, index: number, composition: 'comparison' | 'checklist'): NarrativeRect {
  if (composition === 'checklist') {
    return { x: box.x + box.width * (0.02 + index * 0.235), y: box.y + box.height * 0.78, width: box.width * 0.18, height: box.height * 0.10 };
  }
  const column = index % 2;
  const row = Math.floor(index / 2);
  return {
    x: box.x + box.width * (column ? 0.355 : 0.015),
    y: box.y + box.height * (row ? 0.75 : 0.52),
    width: box.width * 0.29,
    height: box.height * 0.23,
  };
}

function drawFrescoPiece(
  ctx: ReturnType<typeof canvasFor>['ctx'],
  target: NarrativeRect,
  entity: NarrativeSemanticEntity,
  index: number,
  progress: number,
  palette: ReturnType<typeof getStyle>['palette'],
): void {
  const colors = [palette.surface, palette.accent3, palette.accent4, palette.accent] as const;
  const { x, y, width: w, height: h } = target;
  // Irregular painted fragments sit flush with the fresco; they have no card stock, drop shadow or clipped-paper edge.
  ctx.beginPath();
  ctx.moveTo(x + w * 0.04, y + h * 0.15);
  ctx.quadraticCurveTo(x + w * 0.31, y + h * 0.04, x + w * 0.57, y + h * 0.10);
  ctx.lineTo(x + w * 0.96, y + h * 0.03);
  ctx.lineTo(x + w * 0.93, y + h * 0.82);
  ctx.quadraticCurveTo(x + w * 0.65, y + h * 0.90, x + w * 0.38, y + h * 0.83);
  ctx.lineTo(x + w * 0.07, y + h * 0.97);
  ctx.quadraticCurveTo(x + w * 0.01, y + h * 0.58, x + w * 0.04, y + h * 0.15);
  ctx.closePath();
  ctx.fillStyle = colors[index % colors.length]!;
  ctx.fill();
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.lineWidth = Math.max(2, target.width * 0.007);
  ctx.strokeStyle = palette.accent2;
  ctx.beginPath();
  if (index === 0) {
    ctx.moveTo(x + w * 0.23, y + h * 0.76);
    ctx.lineTo(x + w * 0.23, y + h * 0.26);
    ctx.moveTo(x + w * 0.16, y + h * 0.29);
    ctx.lineTo(x + w * 0.31, y + h * 0.29);
    ctx.moveTo(x + w * 0.16, y + h * 0.75);
    ctx.lineTo(x + w * 0.31, y + h * 0.75);
  } else if (index === 1) {
    ctx.arc(x + w * 0.56, y + h * 0.51, h * 0.25, Math.PI * 0.12, Math.PI * 1.82);
  } else if (index === 2) {
    ctx.moveTo(x + w * 0.24, y + h * 0.72);
    ctx.quadraticCurveTo(x + w * 0.54, y + h * 0.50, x + w * 0.79, y + h * 0.25);
    ctx.moveTo(x + w * 0.50, y + h * 0.52);
    ctx.quadraticCurveTo(x + w * 0.39, y + h * 0.31, x + w * 0.27, y + h * 0.34);
    ctx.moveTo(x + w * 0.61, y + h * 0.42);
    ctx.quadraticCurveTo(x + w * 0.73, y + h * 0.48, x + w * 0.78, y + h * 0.58);
  } else {
    ctx.ellipse(x + w * 0.57, y + h * 0.51, w * 0.22, h * 0.29, -0.12, 0, Math.PI * 2);
    ctx.moveTo(x + w * 0.44, y + h * 0.52);
    ctx.quadraticCurveTo(x + w * 0.56, y + h * (0.35 + progress * 0.08), x + w * 0.71, y + h * 0.49);
  }
  ctx.stroke();
  if (progress > 0.5) {
    ctx.fillStyle = palette.accent2;
    ctx.beginPath();
    ctx.arc(x + w * 0.84, y + h * 0.18, Math.max(3, target.height * 0.035), 0, Math.PI * 2);
    ctx.fill();
  }
  void entity;
}

function drawFrescoCount(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, entity: NarrativeSemanticEntity, palette: ReturnType<typeof getStyle>['palette']): void {
  ctx.fillStyle = palette.ink;
  ctx.font = `600 ${Math.max(44, box.height * 0.095)}px "EB Garamond"`;
  ctx.textBaseline = 'middle';
  ctx.fillText(`${String(entity.value ?? 0)}/4`, box.x + box.width * 0.70, box.y + box.height * 0.24);
}

function drawSemanticFresco(context: NarrativeRenderContext, panel: FrescoPanel): Uint8ClampedArray {
  const { brief, layout } = context;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const art = layout.reservedArtArea;
  const box: NarrativeRect = { x: art.x, y: art.y, width: art.width, height: art.height };
  const colors = getStyle('renaissance').palette;
  const semantic = context.semantic!;
  drawAsymmetricArch(ctx, box, panel, colors);
  const collection = semantic.entities.find((entity) => entity.kind === (semantic.primitive === 'counter' ? 'counter' : 'collection'));
  const pieces = semantic.entities.filter((entity) => entity.kind === 'card' || entity.kind === 'row');
  if (collection) {
    ctx.strokeStyle = colors.accent2;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(box.x + box.width * 0.18, box.y + box.height * 0.28);
    ctx.lineTo(box.x + box.width * 0.18, box.y + box.height * 0.83);
    ctx.lineTo(box.x + box.width * 0.88, box.y + box.height * 0.83);
    ctx.stroke();
  }
  for (const entity of pieces) {
    const index = pieceIndex(context, entity.id);
    const slot = panelSlot(box, index, panel.composition);
    const start = fragmentStart(box, index, panel.composition);
    const progress = membershipProgress(context, entity.id, collection?.id ?? 'count');
    const target: NarrativeRect = {
      x: mix(start.x, slot.x, progress),
      y: mix(start.y, slot.y, progress),
      width: mix(start.width, slot.width, progress),
      height: mix(start.height, slot.height, progress),
    };
    drawFrescoPiece(ctx, target, entity, index, progress, colors);
  }
  if (semantic.primitive === 'counter') {
    drawFrescoCount(ctx, box, semantic.entities.find((entity) => entity.kind === 'counter')!, colors);
  }
  drawRoleText(ctx, sceneText('renaissance', brief.locale, 'caption'), box.x + box.width * (semantic.primitive === 'counter' ? 0.14 : 0.64), box.y + box.height * 0.21, context.fonts.effective.annotation, 32, colors.ink);
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

function semanticObjectRegions(context: NarrativeRenderContext): NarrativeObjectRegion[] {
  const semantic = context.semantic;
  if (!semantic || !['card-collection', 'counter'].includes(semantic.primitive)) return [];
  const art = context.layout.reservedArtArea;
  const box = { x: art.x, y: art.y, width: art.width, height: art.height };
  const pieces = semantic.entities.filter((entity) => entity.kind === 'card' || entity.kind === 'row');
  const regions: NarrativeObjectRegion[] = [];
  const collection = semantic.entities.find((entity) => entity.kind === (semantic.primitive === 'counter' ? 'counter' : 'collection'));
  if (collection) regions.push({ entityId: collection.id, bounds: box });
  pieces.forEach((entity) => {
    const index = pieceIndex(context, entity.id);
    const slot = panelSlot(box, index, (context.object as FrescoPanel).composition);
    const start = fragmentStart(box, index, (context.object as FrescoPanel).composition);
    regions.push({
      entityId: entity.id,
      bounds: {
        x: Math.min(slot.x, start.x),
        y: Math.min(slot.y, start.y),
        width: Math.max(slot.x + slot.width, start.x + start.width) - Math.min(slot.x, start.x),
        height: Math.max(slot.y + slot.height, start.y + start.height) - Math.min(slot.y, start.y),
      },
    });
  });
  return regions;
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  if (context.semantic && ['card-collection', 'counter'].includes(context.semantic.primitive)) {
    return drawSemanticFresco(context, context.object as FrescoPanel);
  }
  const { brief, layout } = context;
  const panel = context.object as FrescoPanel;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const art = layout.reservedArtArea;
  const box: NarrativeRect = { x: art.x, y: art.y, width: art.width, height: art.height };
  const colors = getStyle('renaissance').palette;
  const state = phasePosition(context, (value) => cubicBezierEase(value, 0.22, 0.61, 0.36, 1));
  if (panel.composition === 'comparison') drawComparison(ctx, box, panel, state, colors);
  else drawChecklist(ctx, box, panel, state, colors);
  drawRoleText(ctx, sceneText('renaissance', brief.locale, 'caption'), box.x + box.width * 0.68, box.y + box.height * 0.88, context.fonts.effective.annotation, 24, colors.ink);
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const renaissanceNarrativeScene: NarrativeScene = {
  style: 'renaissance',
  version: 'renaissance-fresco/1.0.0',
  vocabulary: sceneVocabulary('phase-order-fallback'),
  supportsAspect(aspect) {
    return [16 / 9, 1, 9 / 16].some((ratio) => Math.abs(aspect - ratio) / ratio < 0.015);
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'fresco-fragment',
      composition: compositionFor(brief.phases),
      field: rng() < 0.5 ? 'verdaccio' : 'powder',
      archBias: (rng() - 0.5) * 0.06,
      fragmentWidth: 0.17 + rng() * 0.035,
      catalogOffset: (rng() - 0.5) * 0.08,
    } satisfies FrescoPanel);
  },
  objectRegions: semanticObjectRegions,
  renderFrame,
};
