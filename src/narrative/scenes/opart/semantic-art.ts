import type { SKRSContext2D } from '@napi-rs/canvas';
import type { NarrativeObjectRegion, NarrativeSemanticEntity, NarrativeSemanticScene } from '../../../types/narrative-scene.js';
import type { NarrativeRect, NarrativeRenderContext } from '../../../types/narrative.js';
import type { getStyle } from '../../../styles/presets.js';
import { sceneText } from '../../i18n.js';
import { drawRoleText } from '../stage-c-common.js';

type OpticalComposition = 'comparison' | 'checklist';
type Palette = ReturnType<typeof getStyle>['palette'];

interface OpticalUnit {
  centerX: number;
  centerY: number;
  radius: number;
  focusX: number;
  focusY: number;
  progress: number;
}

function opticalUnits(semantic: NarrativeSemanticScene): NarrativeSemanticEntity[] {
  return semantic.entities.filter((entity) => entity.kind === 'card');
}

function groupProgress(state: string | undefined): number {
  if (state === 'pending') return 1;
  if (state === 'selected' || state === 'flagged') return 0.72;
  return 0;
}

function unitPlacement(box: NarrativeRect, composition: OpticalComposition, index: number, state: string | undefined): OpticalUnit {
  const columns = [0.16, 0.45, 0.72];
  const isLowerGroup = index >= 3;
  const progress = isLowerGroup ? groupProgress(state) : 0;
  const radius = Math.min(box.width * (composition === 'comparison' ? 0.085 : 0.082), box.height * 0.11);
  const centerX = box.x + box.width * (columns[index % 3]! + progress * 0.13);
  const centerY = box.y + box.height * (isLowerGroup ? 0.71 : 0.29);
  return {
    centerX,
    centerY,
    radius,
    focusX: radius * 0.36 * progress,
    focusY: radius * 0.12 * progress,
    progress,
  };
}

function placementFor(context: NarrativeRenderContext, box: NarrativeRect, composition: OpticalComposition, entity: NarrativeSemanticEntity, index: number): OpticalUnit {
  const fromSemantic = context.brief.phases[context.frame.fromPhaseIndex]!.visual.semantic;
  const toSemantic = context.brief.phases[context.frame.toPhaseIndex]!.visual.semantic;
  if (context.frame.kind !== 'transition' && context.frame.kind !== 'loop-bridge') {
    return unitPlacement(box, composition, index, context.semantic?.states[entity.id]);
  }
  const from = unitPlacement(box, composition, index, fromSemantic.states[entity.id]);
  const to = unitPlacement(box, composition, index, toSemantic.states[entity.id]);
  const t = Math.max(0, Math.min(1, context.frame.progress));
  const mix = (start: number, end: number): number => start + (end - start) * t;
  return {
    centerX: mix(from.centerX, to.centerX),
    centerY: mix(from.centerY, to.centerY),
    radius: mix(from.radius, to.radius),
    focusX: mix(from.focusX, to.focusX),
    focusY: mix(from.focusY, to.focusY),
    progress: mix(from.progress, to.progress),
  };
}

function drawConcentricUnit(ctx: SKRSContext2D, unit: OpticalUnit, colors: Palette): void {
  for (let index = 4; index >= 0; index -= 1) {
    const fraction = (index + 1) / 5;
    const centerX = unit.centerX + unit.focusX * (1 - fraction);
    const centerY = unit.centerY + unit.focusY * (1 - fraction);
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, unit.radius * fraction, unit.radius * fraction * (1 - 0.08 * unit.progress), 0, 0, Math.PI * 2);
    ctx.fillStyle = index % 2 === 0 ? colors.bg : colors.surface;
    ctx.fill();
  }
}

function drawStripedUnit(ctx: SKRSContext2D, unit: OpticalUnit, box: NarrativeRect, colors: Palette): void {
  const width = box.width * 0.22;
  const height = Math.min(box.height * 0.15, unit.radius * 2.2);
  const x = unit.centerX - width / 2;
  const y = unit.centerY - height / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.fillStyle = colors.surface;
  ctx.fillRect(x, y, width, height);
  const stripeHeight = height * 0.18;
  for (let stripe = 0; stripe < 5; stripe += 1) {
    const phaseShift = stripe % 2 === 0 ? -unit.focusX * 0.6 : unit.focusX * 0.6;
    ctx.fillStyle = stripe % 2 === 0 ? colors.bg : colors.surface;
    ctx.fillRect(x + phaseShift, y + height * (0.05 + stripe * 0.2), width * 1.05, stripeHeight);
  }
  ctx.strokeStyle = colors.bg;
  ctx.lineWidth = Math.max(2, box.width * 0.004);
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}

function unitRegion(unit: OpticalUnit, composition: OpticalComposition, box: NarrativeRect, entityId: string): NarrativeObjectRegion {
  const width = composition === 'comparison' ? unit.radius * 2.5 : box.width * 0.26;
  const height = composition === 'comparison' ? unit.radius * 2.5 : box.height * 0.18;
  return { entityId, bounds: { x: unit.centerX - width / 2, y: unit.centerY - height / 2, width, height } };
}

export function opartSemanticObjectRegions(context: NarrativeRenderContext, box: NarrativeRect, composition: OpticalComposition): NarrativeObjectRegion[] {
  const semantic = context.semantic;
  if (!semantic || semantic.primitive === 'legacy-illustration') return [];
  const cards = opticalUnits(semantic);
  const regions = cards.map((entity, index) => unitRegion(placementFor(context, box, composition, entity, index), composition, box, entity.id));
  const collection = semantic.entities.find((entity) => entity.kind === 'collection');
  if (collection) regions.push({ entityId: collection.id, bounds: box });
  return regions;
}

export function drawOpartReadingBand(ctx: SKRSContext2D, context: NarrativeRenderContext, box: NarrativeRect, colors: Palette): void {
  const bandHeight = box.height * 0.12;
  const bandY = box.y + box.height * 0.5 - bandHeight / 2;
  ctx.fillStyle = colors.bg;
  ctx.fillRect(box.x, bandY, box.width, bandHeight);
  ctx.textAlign = 'center';
  drawRoleText(ctx, sceneText('opart', context.brief.locale, 'readingBand'), box.x + box.width * 0.5, bandY + bandHeight * 0.68, context.fonts.effective.label, 32, colors.surface);
}

export function drawOpartSemantic(ctx: SKRSContext2D, context: NarrativeRenderContext, box: NarrativeRect, composition: OpticalComposition, colors: Palette): void {
  const semantic = context.semantic;
  if (!semantic) return;
  const cards = opticalUnits(semantic);
  ctx.fillStyle = colors.surface;
  ctx.fillRect(box.x, box.y, box.width, box.height);
  ctx.strokeStyle = colors.bg;
  ctx.lineWidth = Math.max(2, box.width * 0.004);
  ctx.strokeRect(box.x + 1, box.y + 1, box.width - 2, box.height - 2);

  cards.forEach((entity, index) => {
    const unit = placementFor(context, box, composition, entity, index);
    if (composition === 'comparison') drawConcentricUnit(ctx, unit, colors);
    else drawStripedUnit(ctx, unit, box, colors);
  });

  drawOpartReadingBand(ctx, context, box, colors);
}
