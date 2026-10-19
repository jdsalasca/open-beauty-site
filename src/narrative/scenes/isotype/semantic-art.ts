import type { SKRSContext2D } from '@napi-rs/canvas';
import type { NarrativeObjectRegion, NarrativeSemanticEntity, NarrativeSemanticScene } from '../../../types/narrative-scene.js';
import type { NarrativeRect, NarrativeRenderContext } from '../../../types/narrative.js';
import type { getStyle } from '../../../styles/presets.js';
import { sceneText } from '../../i18n.js';
import { drawRoleText } from '../stage-c-common.js';

type IsotypeComposition = 'comparison' | 'checklist';
type Palette = ReturnType<typeof getStyle>['palette'];

interface UnitPlacement {
  bounds: NarrativeRect;
  centerX: number;
  centerY: number;
  size: number;
}

function unitEntities(semantic: NarrativeSemanticScene): NarrativeSemanticEntity[] {
  return semantic.entities.filter((entity) => entity.kind === 'row' || entity.kind === 'card');
}

function separated(state: string | undefined): boolean {
  return state === 'pending';
}

function columnsFor(box: NarrativeRect): number {
  return box.width >= 420 ? 3 : box.width >= 250 ? 2 : 1;
}

function placement(
  box: NarrativeRect,
  composition: IsotypeComposition,
  entityIndex: number,
  entityCount: number,
  state: string | undefined,
): UnitPlacement {
  const size = composition === 'checklist'
    ? Math.max(28, Math.min(box.width * 0.105, box.height * 0.075))
    : Math.max(30, Math.min(box.width * 0.145, box.height * 0.13));
  let centerX: number;
  let centerY: number;
  if (composition === 'checklist') {
    const rowHeight = box.height * 0.078;
    const firstY = box.y + box.height * 0.29;
    const pending = separated(state);
    const isSeparatedUnit = pending && entityIndex === entityCount - 1;
    centerY = isSeparatedUnit ? box.y + box.height * 0.82 : firstY + rowHeight * entityIndex;
    centerX = box.x + box.width * (isSeparatedUnit && box.width >= 250 ? 0.30 : 0.18);
  } else if (separated(state)) {
    centerX = box.x + box.width * 0.85;
    centerY = box.y + box.height * 0.59;
  } else {
    const columns = columnsFor(box);
    const column = entityIndex % columns;
    const row = Math.floor(entityIndex / columns);
    const rows = Math.ceil(entityCount / columns);
    if (columns === 1) {
      centerX = box.x + box.width * 0.48;
      centerY = box.y + box.height * (0.29 + (row + 0.5) * 0.50 / rows);
    } else {
      const groupWidth = box.width * 0.66;
      centerX = box.x + box.width * 0.08 + groupWidth * (column + 0.5) / columns;
      centerY = box.y + box.height * (rows === 1 ? 0.56 : 0.38 + row * 0.30);
    }
  }
  const width = size * 1.7;
  const height = composition === 'checklist' ? Math.max(size * 1.9, box.height * 0.065) : size * 1.75;
  return { bounds: { x: centerX - width / 2, y: centerY - height / 2, width, height }, centerX, centerY, size };
}

function blendPlacement(from: UnitPlacement, to: UnitPlacement, progress: number): UnitPlacement {
  const mix = (start: number, end: number): number => start + (end - start) * progress;
  const width = mix(from.bounds.width, to.bounds.width);
  const height = mix(from.bounds.height, to.bounds.height);
  const centerX = mix(from.centerX, to.centerX);
  const centerY = mix(from.centerY, to.centerY);
  return { bounds: { x: centerX - width / 2, y: centerY - height / 2, width, height }, centerX, centerY, size: mix(from.size, to.size) };
}

function drawPerson(ctx: SKRSContext2D, unit: UnitPlacement, ink: string): void {
  const { centerX: x, centerY: y, size } = unit;
  const head = size * 0.14;
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(x, y - size * 0.29, head, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - size * 0.19, y - size * 0.08);
  ctx.lineTo(x - size * 0.13, y - size * 0.20);
  ctx.lineTo(x + size * 0.13, y - size * 0.20);
  ctx.lineTo(x + size * 0.19, y - size * 0.08);
  ctx.lineTo(x + size * 0.14, y + size * 0.12);
  ctx.lineTo(x + size * 0.10, y + size * 0.12);
  ctx.lineTo(x + size * 0.12, y + size * 0.39);
  ctx.lineTo(x + size * 0.035, y + size * 0.39);
  ctx.lineTo(x, y + size * 0.16);
  ctx.lineTo(x - size * 0.035, y + size * 0.39);
  ctx.lineTo(x - size * 0.12, y + size * 0.39);
  ctx.lineTo(x - size * 0.10, y + size * 0.12);
  ctx.lineTo(x - size * 0.14, y + size * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - size * 0.31, y - size * 0.08, size * 0.16, size * 0.07);
  ctx.fillRect(x + size * 0.15, y - size * 0.08, size * 0.16, size * 0.07);
}

function countValues(semantic: NarrativeSemanticScene, items: NarrativeSemanticEntity[]): { count: number; total: number } {
  if (semantic.primitive === 'counter') {
    const counter = semantic.entities.find((entity) => entity.kind === 'counter');
    const count = semantic.relations.filter((relation) => relation.kind === 'counts' && relation.from === counter?.id).length;
    return { count: typeof counter?.value === 'number' ? counter.value : count, total: items.length };
  }
  const collectionIds = new Set(semantic.entities.filter((entity) => entity.kind === 'collection').map((entity) => entity.id));
  const count = semantic.relations.filter((relation) => relation.kind === 'member-of' && collectionIds.has(relation.to)).length;
  return { count, total: items.length };
}

function drawHeader(ctx: SKRSContext2D, context: NarrativeRenderContext, box: NarrativeRect, count: { count: number; total: number }, palette: Palette): void {
  const labelY = box.y + box.height * 0.075;
  const numberY = box.y + box.height * 0.155;
  ctx.save();
  ctx.textAlign = 'center';
  drawRoleText(ctx, sceneText('isotype', context.brief.locale, 'illustrative'), box.x + box.width * 0.5, labelY, context.fonts.effective.annotation, 28, palette.ink);
  drawRoleText(ctx, `${count.count} / ${count.total}`, box.x + box.width * 0.5, numberY, context.fonts.effective.figure, Math.max(28, Math.min(box.width * 0.12, 48)), palette.accent);
  ctx.restore();
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = Math.max(1.5, box.width * 0.004);
  ctx.beginPath();
  ctx.moveTo(box.x + box.width * 0.07, box.y + box.height * 0.205);
  ctx.lineTo(box.x + box.width * 0.93, box.y + box.height * 0.205);
  ctx.stroke();
}

function itemRegion(context: NarrativeRenderContext, entity: NarrativeSemanticEntity, index: number, items: NarrativeSemanticEntity[], box: NarrativeRect, composition: IsotypeComposition): NarrativeObjectRegion {
  const state = context.semantic?.states[entity.id];
  return { entityId: entity.id, bounds: placement(box, composition, index, items.length, state).bounds };
}

export function isotypeSemanticObjectRegions(context: NarrativeRenderContext, box: NarrativeRect, composition: IsotypeComposition): NarrativeObjectRegion[] {
  const semantic = context.semantic;
  if (!semantic || semantic.primitive === 'legacy-illustration') return [];
  const items = unitEntities(semantic);
  const regions: NarrativeObjectRegion[] = items.map((entity, index) => itemRegion(context, entity, index, items, box, composition));
  const counter = semantic.entities.find((entity) => entity.kind === 'counter');
  const collection = semantic.entities.find((entity) => entity.kind === 'collection');
  if (counter) regions.push({ entityId: counter.id, bounds: { x: box.x + box.width * 0.31, y: box.y + box.height * 0.105, width: box.width * 0.38, height: box.height * 0.085 } });
  if (collection) regions.push({ entityId: collection.id, bounds: { x: box.x + box.width * 0.07, y: box.y + box.height * 0.205, width: box.width * 0.86, height: box.height * 0.72 } });
  return regions;
}

export function drawIsotypeSemantic(ctx: SKRSContext2D, context: NarrativeRenderContext, box: NarrativeRect, composition: IsotypeComposition, palette: Palette): void {
  const semantic = context.semantic;
  if (!semantic) return;
  const items = unitEntities(semantic);
  const count = countValues(semantic, items);
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = Math.max(1.5, box.width * 0.004);
  ctx.strokeRect(box.x + 1, box.y + 1, box.width - 2, box.height - 2);
  drawHeader(ctx, context, box, count, palette);

  const fromSemantic = context.brief.phases[context.frame.fromPhaseIndex]!.visual.semantic;
  const toSemantic = context.brief.phases[context.frame.toPhaseIndex]!.visual.semantic;
  const isTransition = context.frame.kind === 'transition' || context.frame.kind === 'loop-bridge';
  const progress = isTransition ? context.frame.progress : 1;
  const separatedUnit = items.find((entity) => toSemantic.states[entity.id] === 'pending');
  if (composition === 'checklist' && separatedUnit) {
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = Math.max(2, box.width * 0.006);
    ctx.beginPath();
    ctx.moveTo(box.x + box.width * 0.07, box.y + box.height * 0.74);
    ctx.lineTo(box.x + box.width * 0.93, box.y + box.height * 0.74);
    ctx.stroke();
  }

  items.forEach((entity, index) => {
    const fromPlacement = placement(box, composition, index, items.length, fromSemantic.states[entity.id]);
    const toPlacement = placement(box, composition, index, items.length, toSemantic.states[entity.id]);
    const current = isTransition ? blendPlacement(fromPlacement, toPlacement, progress) : placement(box, composition, index, items.length, semantic.states[entity.id]);
    const state = toSemantic.states[entity.id];
    const fill = state === 'pending' ? palette.accent : palette.ink;
    drawPerson(ctx, current, fill);
    if (composition === 'checklist') {
      const row = current.bounds;
      ctx.strokeStyle = palette.muted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(box.x + box.width * 0.07, row.y + row.height * 0.78);
      ctx.lineTo(box.x + box.width * 0.93, row.y + row.height * 0.78);
      ctx.stroke();
    }
    if (state === 'flagged' || state === 'selected') {
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = Math.max(2, current.size * 0.045);
      ctx.beginPath();
      ctx.arc(current.centerX, current.centerY, current.size * 0.57, 0, Math.PI * 2);
      ctx.stroke();
    } else if (state === 'pending') {
      if (composition === 'checklist') {
        drawRoleText(ctx, sceneText('isotype', context.brief.locale, 'review'), box.x + box.width * 0.42, current.centerY + current.size * 0.12, context.fonts.effective.label, 28, palette.accent);
      } else {
        ctx.save();
        ctx.textAlign = 'center';
        drawRoleText(ctx, sceneText('isotype', context.brief.locale, 'review'), current.centerX, box.y + box.height * 0.82, context.fonts.effective.label, 28, palette.accent);
        ctx.restore();
      }
    }
    if (composition === 'checklist' && entity.kind === 'card') {
      const checkX = box.x + box.width * 0.83;
      const checkY = current.centerY - current.size * 0.18;
      const side = current.size * 0.34;
      ctx.strokeStyle = state === 'default' || state === 'member' ? palette.muted : palette.accent;
      ctx.lineWidth = Math.max(2, side * 0.1);
      ctx.strokeRect(checkX - side / 2, checkY - side / 2, side, side);
      if (state === 'flagged' || state === 'pending') {
        ctx.beginPath();
        ctx.moveTo(checkX - side * 0.28, checkY);
        ctx.lineTo(checkX - side * 0.04, checkY + side * 0.22);
        ctx.lineTo(checkX + side * 0.32, checkY - side * 0.28);
        ctx.stroke();
      }
    }
  });
}
