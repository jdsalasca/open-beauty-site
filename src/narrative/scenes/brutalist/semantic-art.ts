import { canvasFor } from '../../../canvas.js';
import { NarrativeError, type NarrativeObjectRegion, type NarrativeObjectTextBox, type NarrativeRect, type NarrativeRenderContext } from '../../../types/narrative.js';
import type { NarrativeSemanticEntity, NarrativeSemanticScene } from '../../../types/narrative-scene.js';
import { getStyle } from '../../../styles/presets.js';
import { legacySemanticStateText, sceneText, workflowBadgeText } from '../../i18n.js';
import { drawText, rgba } from '../common.js';

interface BrutalistSemanticColors {
  ink: string;
  muted: string;
  paper: string;
  red: string;
  acid: string;
}

interface TextMark extends NarrativeObjectTextBox {
  entityId: string;
  x: number;
  baseline: number;
  face: 'Archivo Black' | 'Space Mono';
  color: string;
}

interface ShapeMark {
  kind: 'rect' | 'line' | 'circle' | 'checkbox' | 'stamp' | 'bar';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  lineWidth?: number;
  progress?: number;
}

interface SemanticPlan {
  regions: NarrativeObjectRegion[];
  texts: TextMark[];
  shapes: ShapeMark[];
}

function rect(x: number, y: number, width: number, height: number): NarrativeRect {
  return { x, y, width, height };
}

function entity(semantic: NarrativeSemanticScene, id: string): NarrativeSemanticEntity | undefined {
  return semantic.entities.find((candidate) => candidate.id === id);
}

function displayValue(item: NarrativeSemanticEntity | undefined): string {
  return item?.label ?? String(item?.value ?? item?.id ?? '');
}

function stateOf(semantic: NarrativeSemanticScene, id: string): string {
  return semantic.states[id] ?? 'default';
}

function localState(locale: 'es' | 'en', state: string): string {
  const key: Record<string, string> = {
    default: 'semanticPending', original: 'semanticSource', duplicate: 'semanticDuplicate',
    flagged: 'semanticFlagged', marked: 'semanticFlagged', rejected: 'semanticRejected',
    accepted: 'semanticAccepted', pending: 'semanticPending', downloading: 'semanticDownloading',
    failed: 'semanticFailed', retrying: 'semanticRetrying', complete: 'semanticComplete',
    member: 'semanticMember', selected: 'semanticMember', counted: 'semanticMember',
    'ready-for-review': 'legacyReady',
    value: 'semanticItems', increased: 'semanticItems', decreased: 'semanticItems', unchanged: 'semanticItems',
  };
  return sceneText('brutalist', locale, key[state] ?? 'semanticPending');
}

function createPlan(context: NarrativeRenderContext, box: NarrativeRect, measure: ReturnType<typeof canvasFor>['ctx'], colors: BrutalistSemanticColors): SemanticPlan {
  const semantic = context.semantic;
  if (!semantic || semantic.primitive === 'legacy-illustration') return { regions: [], texts: [], shapes: [] };
  const { ink, muted, paper, red, acid } = colors;
  const scale = context.layout.cardScale;
  const texts: TextMark[] = [];
  const shapes: ShapeMark[] = [];
  const regions = new Map<string, NarrativeObjectRegion>();
  const interior = rect(box.x + box.width * 0.055, box.y + box.height * 0.17, box.width * 0.88, box.height * 0.69);
  const addRegion = (id: string, bounds: NarrativeRect): NarrativeObjectRegion => {
    let value = regions.get(id);
    if (!value) {
      value = { entityId: id, bounds, textBoxes: [] };
      regions.set(id, value);
    } else {
      value.bounds = {
        x: Math.min(value.bounds.x, bounds.x), y: Math.min(value.bounds.y, bounds.y),
        width: Math.max(value.bounds.x + value.bounds.width, bounds.x + bounds.width) - Math.min(value.bounds.x, bounds.x),
        height: Math.max(value.bounds.y + value.bounds.height, bounds.y + bounds.height) - Math.min(value.bounds.y, bounds.y),
      };
    }
    return value;
  };
  const addText = (entityId: string, text: string, x: number, baseline: number, maxWidth: number, effectiveSize: number, role: NarrativeObjectTextBox['role'], color: string, face: TextMark['face'] = 'Space Mono'): void => {
    const minimumEffective = role === 'headline' ? 20 : 14;
    let fontSizePx = Math.ceil(Math.max(effectiveSize, minimumEffective) / scale);
    const minPx = Math.ceil(minimumEffective / scale);
    measure.font = `700 ${fontSizePx}px "${face}"`;
    while (fontSizePx > minPx && measure.measureText(text).width > maxWidth) {
      fontSizePx -= 1;
      measure.font = `700 ${fontSizePx}px "${face}"`;
    }
    if (measure.measureText(text).width > maxWidth) {
      throw new NarrativeError('TEXT_OVERFLOW', `Semantic ${role} text "${text}" does not fit its ${Math.round(maxWidth)}px object cell at the required effective size.`, 'Use a shorter semantic label or widen its ledger cell.', `phases[${context.phaseIndex}].visual.semantic`);
    }
    const bounds = rect(x, baseline - fontSizePx, Math.ceil(measure.measureText(text).width), Math.ceil(fontSizePx * 1.2));
    const mark: TextMark = { entityId, text, bounds, fontSizePx, role, x, baseline, face, color };
    texts.push(mark);
    addRegion(entityId, bounds).textBoxes!.push({ text, bounds, fontSizePx, role });
  };
  const addRect = (x: number, y: number, width: number, height: number, fill?: string, stroke?: string, lineWidth = 2): void => {
    shapes.push({ kind: 'rect', x, y, width, height, ...(fill ? { fill } : {}), ...(stroke ? { stroke } : {}), lineWidth });
  };
  const addLine = (x: number, y: number, width: number, height = 0, stroke = ink, lineWidth = 2): void => {
    shapes.push({ kind: 'line', x, y, width, height, stroke, lineWidth });
  };
  const semanticEntityIds = semantic.entities.map((item) => item.id);
  const containerId = semantic.primitive === 'table-rows'
    ? semantic.entities.find((item) => item.kind === 'table')?.id
    : semantic.primitive === 'card-collection'
      ? semantic.entities.find((item) => item.kind === 'collection')?.id
      : semantic.entities.find((item) => item.kind === 'counter')?.id ?? semanticEntityIds[0];
  if (containerId) addRegion(containerId, box);

  // The same ledger sheet, grid, accent block, perforated stub, and offset shadow persist in every phase.
  addRect(box.x + 7, box.y + 7, box.width, box.height, rgba('#000000', 0.92));
  addRect(box.x, box.y, box.width, box.height, paper, ink, 3);
  addRect(box.x + box.width * 0.055, box.y + box.height * 0.035, box.width * 0.88, box.height * 0.085, acid, ink, 2);
  const headerId = containerId ?? semanticEntityIds[0]!;
  addText(headerId, sceneText('brutalist', context.brief.locale, 'semanticLedger'), box.x + box.width * 0.075, box.y + box.height * 0.095, box.width * 0.72, 16, 'label', ink);
  const stubX = box.x + box.width * 0.79;
  const contentTop = box.y + box.height * 0.18;
  const contentBottom = box.y + box.height * 0.86;
  for (let y = contentTop; y < contentBottom; y += box.height * 0.078) {
    addLine(stubX, y, 0, box.height * 0.035, muted, 1.5);
  }

  if (semantic.primitive === 'table-rows') {
    const rows = semantic.entities.filter((item) => item.kind === 'row');
    const tableId = semantic.entities.find((item) => item.kind === 'table')?.id ?? headerId;
    const startY = box.y + box.height * 0.22;
    const rowHeight = box.height * Math.min(0.245, 0.64 / Math.max(1, rows.length));
    const rowX = box.x + box.width * 0.075;
    const rowWidth = box.width * 0.69;
    rows.forEach((item, index) => {
      const row = rect(rowX, startY + index * rowHeight, rowWidth, rowHeight * 0.86);
      addRegion(item.id, row);
      addRect(row.x, row.y, row.width, row.height, index % 2 ? '#E7E3D7' : paper, ink, 1.5);
      addLine(row.x, row.y + row.height * 0.53, row.width, 0, '#9A978F', 1);
      addText(item.id, displayValue(item), row.x + row.width * 0.045, row.y + row.height * 0.43, row.width * 0.88, 16, 'identifier', ink);
      const status = stateOf(semantic, item.id);
      const label = localState(context.brief.locale, status);
      const stampWidth = row.width * 0.94;
      const stampX = row.x + row.width * 0.03;
      const stampY = row.y + row.height * 0.57;
      addRect(stampX, stampY, stampWidth, row.height * 0.31, status === 'rejected' ? '#F4D4CA' : paper, status === 'rejected' ? red : ink, 1.5);
      addText(item.id, label, stampX + stampWidth * 0.04, stampY + row.height * 0.24, stampWidth * 0.9, 14, 'status', status === 'rejected' ? red : ink);
      if (status === 'flagged' || status === 'marked' || status === 'rejected') {
        shapes.push({ kind: 'checkbox', x: row.x + row.width * 0.91, y: row.y + row.height * 0.1, width: row.height * 0.25, height: row.height * 0.25, stroke: status === 'rejected' ? red : ink, lineWidth: 2, progress: 1 });
      }
    });
    if (stateOf(semantic, tableId) === 'reviewed') {
      const mark = rect(box.x + box.width * 0.075, box.y + box.height * 0.73, box.width * 0.69, box.height * 0.09);
      addRect(mark.x, mark.y, mark.width, mark.height, paper, red, 1.5);
      addText(tableId, sceneText('brutalist', context.brief.locale, 'semanticRetained'), mark.x + mark.width * 0.04, mark.y + mark.height * 0.72, mark.width * 0.92, 14, 'status', red);
    }
    addLine(box.x + box.width * 0.075, contentBottom, box.width * 0.69, 0, ink, 2);
    // Keep the parent region authoritative for the shared ledger; the row regions prove row-level changes.
    addRegion(tableId, box);
  } else if (semantic.primitive === 'card-collection') {
    const collection = semantic.entities.find((item) => item.kind === 'collection');
    const cards = semantic.entities.filter((item) => item.kind === 'card');
    const columns = Math.min(2, Math.max(1, cards.length));
    const rows = Math.ceil(cards.length / columns);
    const gap = box.width * 0.035;
    const gridX = box.x + box.width * 0.075;
    const gridY = box.y + box.height * 0.23;
    const gridWidth = box.width * 0.69;
    const gridHeight = box.height * 0.54;
      const cardWidth = (gridWidth - gap * (columns - 1)) / columns;
    const cardHeight = (gridHeight - gap * (rows - 1)) / rows;
    cards.forEach((item, index) => {
      const card = rect(gridX + (index % columns) * (cardWidth + gap), gridY + Math.floor(index / columns) * (cardHeight + gap), cardWidth, cardHeight);
      addRegion(item.id, card);
      addRect(card.x, card.y, card.width, card.height, index % 2 ? '#E7E3D7' : paper, ink, 2);
      addRect(card.x, card.y, card.width, card.height * 0.13, '#D4D0C5', ink, 1);
      const label = displayValue(item);
      addText(item.id, label, card.x + card.width * 0.05, card.y + card.height * 0.57, card.width * 0.9, 16, 'identifier', ink, 'Archivo Black');
      const member = semantic.relations.some((relation) => relation.kind === 'member-of' && relation.from === item.id && relation.to === collection?.id);
      const itemState = stateOf(semantic, item.id);
      const selected = itemState === 'selected' || semantic.legacyUpgrade && itemState === 'flagged';
      const checked = member || semantic.legacyUpgrade && itemState === 'ready-for-review';
      shapes.push({ kind: 'checkbox', x: card.x + card.width * 0.72, y: card.y + card.height * 0.68, width: Math.min(card.width, card.height) * 0.19, height: Math.min(card.width, card.height) * 0.19, stroke: selected ? red : ink, lineWidth: 2, progress: checked ? 1 : 0 });
    });
    const countBox = rect(box.x + box.width * 0.045, box.y + box.height * 0.78, box.width * 0.74, box.height * 0.11);
    addRect(countBox.x, countBox.y, countBox.width, countBox.height, paper, ink, 2);
    if (collection) {
      if (semantic.legacyUpgrade) {
        const state = cards[0] ? stateOf(semantic, cards[0].id) : 'pending';
        addText(collection.id, legacySemanticStateText('brutalist', context.brief.locale, state), countBox.x + countBox.width * 0.06, countBox.y + countBox.height * 0.68, countBox.width * 0.88, 14, 'status', ink);
      } else {
        const total = cards.filter((item) => semantic.relations.some((relation) => relation.kind === 'member-of' && relation.from === item.id && relation.to === collection.id)).length;
        addText(collection.id, String(total), countBox.x + countBox.width * 0.08, countBox.y + countBox.height * 0.72, countBox.width * 0.2, 20, 'headline', ink, 'Archivo Black');
        addText(collection.id, sceneText('brutalist', context.brief.locale, 'semanticItems'), countBox.x + countBox.width * 0.28, countBox.y + countBox.height * 0.68, countBox.width * 0.68, 14, 'label', ink);
      }
    }
  } else if (semantic.primitive === 'counter') {
    const items = semantic.entities.filter((item) => item.kind === 'row' || item.kind === 'card');
    const counter = semantic.entities.find((item) => item.kind === 'counter');
    const targets = semantic.relations.filter((relation) => relation.kind === 'counts' && relation.from === counter?.id).map((relation) => relation.to);
    const active = items.filter((item) => targets.includes(item.id));
    const cardWidth = Math.min(box.width * 0.2, box.width * 0.64 / Math.max(1, active.length));
    const gap = box.width * 0.035;
    const totalWidth = active.length * cardWidth + Math.max(0, active.length - 1) * gap;
    const startX = box.x + (box.width - totalWidth) / 2 - box.width * 0.08;
    const cardY = box.y + box.height * 0.24;
    active.forEach((item, index) => {
      const card = rect(startX + index * (cardWidth + gap), cardY, cardWidth, box.height * 0.2);
      addRegion(item.id, card);
      addRect(card.x, card.y, card.width, card.height, index % 2 ? '#E7E3D7' : paper, ink, 1.5);
      addText(item.id, displayValue(item), card.x + card.width * 0.18, card.y + card.height * 0.58, card.width * 0.64, 18, 'identifier', ink, 'Archivo Black');
      addLine(card.x + card.width / 2, card.y + card.height, box.width * 0.02, box.height * 0.12, red, 2);
    });
    if (counter) {
      const count = counter.value ?? active.length;
      const countBox = rect(box.x + box.width * 0.16, box.y + box.height * 0.57, box.width * 0.58, box.height * 0.24);
      addRegion(counter.id, countBox);
      addRect(countBox.x, countBox.y, countBox.width, countBox.height, paper, ink, 3);
      addText(counter.id, String(count), countBox.x + countBox.width * 0.08, countBox.y + countBox.height * 0.73, countBox.width * 0.37, 28, 'headline', ink, 'Archivo Black');
      addText(counter.id, sceneText('brutalist', context.brief.locale, 'semanticTotal'), countBox.x + countBox.width * 0.48, countBox.y + countBox.height * 0.64, countBox.width * 0.48, 14, 'label', ink);
      if (stateOf(semantic, counter.id) === 'pending') {
        const mark = rect(box.x + box.width * 0.16, box.y + box.height * 0.83, box.width * 0.58, box.height * 0.08);
        addRegion(counter.id, mark);
        addRect(mark.x, mark.y, mark.width, mark.height, paper, red, 1.5);
        addText(counter.id, sceneText('brutalist', context.brief.locale, 'semanticExpected'), mark.x + mark.width * 0.04, mark.y + mark.height * 0.72, mark.width * 0.92, 14, 'status', red);
      }
    }
  } else if (semantic.primitive === 'file-download') {
    const file = semantic.entities.find((item) => item.kind === 'file');
    if (file) {
      const fileBox = rect(box.x + box.width * 0.025, box.y + box.height * 0.22, box.width * 0.95, box.height * 0.58);
      addRegion(file.id, fileBox);
      addRect(fileBox.x, fileBox.y, fileBox.width, fileBox.height, paper, ink, 2);
      addRect(fileBox.x, fileBox.y, fileBox.width, fileBox.height * 0.12, '#D4D0C5', ink, 1);
      addText(file.id, displayValue(file), fileBox.x + fileBox.width * 0.06, fileBox.y + fileBox.height * 0.34, fileBox.width * 0.88, 20, 'headline', ink, 'Archivo Black');
      const progress = stateOf(semantic, file.id) === 'complete' ? 1 : file.progress ?? 0;
      const progressBar = rect(fileBox.x + fileBox.width * 0.06, fileBox.y + fileBox.height * 0.48, fileBox.width * 0.88, fileBox.height * 0.11);
      shapes.push({ kind: 'bar', ...progressBar, fill: '#D4D0C5', stroke: ink, lineWidth: 1, progress });
      if (typeof file.progress === 'number') addText(file.id, `${Math.round(file.progress * 100)}%`, progressBar.x + progressBar.width * 0.01, progressBar.y + progressBar.height * 0.92, progressBar.width * 0.38, 14, 'label', ink);
      const status = stateOf(semantic, file.id);
      const statusBox = rect(fileBox.x + fileBox.width * 0.06, fileBox.y + fileBox.height * 0.67, fileBox.width * 0.88, fileBox.height * 0.22);
      const statusColor = status === 'failed' ? '#F4D4CA' : paper;
      addRect(statusBox.x, statusBox.y, statusBox.width, statusBox.height, statusColor, status === 'failed' ? red : ink, 2);
      const label = status === 'failed' && file.value === 'timeout'
        ? sceneText('brutalist', context.brief.locale, 'semanticTimeout')
        : localState(context.brief.locale, status);
      addText(file.id, label, statusBox.x + statusBox.width * 0.06, statusBox.y + statusBox.height * 0.68, statusBox.width * 0.88, 14, 'status', status === 'failed' ? red : ink);
    }
  }

  const compactBadgeKey = context.brief.workflowStatus === 'open' ? 'badgeOpenSemantic'
    : context.brief.workflowStatus === 'in-review' ? 'badgeInReviewSemantic' : 'badgeDoneSemantic';
  const badgeText = semantic.legacyUpgrade && context.brief.badgePolicy === 'workflow'
    ? sceneText('brutalist', context.brief.locale, compactBadgeKey)
    : workflowBadgeText('brutalist', context.brief.locale, context.brief.workflowStatus, context.brief.badgePolicy, context.brief.badgeText);
  if (badgeText) {
    const badgeEntity = containerId ?? semanticEntityIds[0]!;
    const badge = rect(box.x + box.width * 0.81, box.y + box.height * 0.61, box.width * 0.16, box.height * 0.16);
    addRect(badge.x, badge.y, badge.width, badge.height, paper, red, 2);
    addText(badgeEntity, badgeText, badge.x + badge.width * 0.08, badge.y + badge.height * 0.58, badge.width * 0.84, 14, 'status', red);
  }
  return { regions: [...regions.values()], texts, shapes };
}

function drawShape(ctx: ReturnType<typeof canvasFor>['ctx'], shape: ShapeMark): void {
  ctx.save();
  if (shape.kind === 'line') {
    ctx.beginPath();
    ctx.moveTo(shape.x, shape.y);
    ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
    ctx.strokeStyle = shape.stroke ?? '#111111';
    ctx.lineWidth = shape.lineWidth ?? 1;
    ctx.stroke();
  } else if (shape.kind === 'circle') {
    ctx.beginPath();
    ctx.arc(shape.x + shape.width / 2, shape.y + shape.height / 2, Math.min(shape.width, shape.height) / 2, 0, Math.PI * 2);
    ctx.fillStyle = shape.fill ?? '#111111';
    ctx.fill();
  } else if (shape.kind === 'checkbox') {
    ctx.strokeStyle = shape.stroke ?? '#111111';
    ctx.lineWidth = shape.lineWidth ?? 2;
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    if ((shape.progress ?? 0) > 0) {
      ctx.beginPath();
      ctx.moveTo(shape.x + shape.width * 0.18, shape.y + shape.height * 0.52);
      ctx.lineTo(shape.x + shape.width * 0.42, shape.y + shape.height * 0.76);
      ctx.lineTo(shape.x + shape.width * 0.84, shape.y + shape.height * 0.2);
      ctx.strokeStyle = shape.stroke ?? '#111111';
      ctx.lineWidth = Math.max(2, shape.width * 0.13);
      ctx.stroke();
    }
  } else if (shape.kind === 'bar') {
    ctx.fillStyle = shape.fill ?? '#D4D0C5';
    ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    ctx.fillStyle = (shape.progress ?? 0) >= 1 ? '#111111' : '#D83B32';
    ctx.fillRect(shape.x, shape.y, shape.width * Math.max(0, Math.min(1, shape.progress ?? 0)), shape.height);
    ctx.strokeStyle = shape.stroke ?? '#111111';
    ctx.lineWidth = shape.lineWidth ?? 1;
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
  } else {
    if (shape.fill) {
      ctx.fillStyle = shape.fill;
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    }
    if (shape.stroke) {
      ctx.strokeStyle = shape.stroke;
      ctx.lineWidth = shape.lineWidth ?? 1;
      ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
    }
  }
  ctx.restore();
}

function colorsFromPreset(): BrutalistSemanticColors {
  const palette = getStyle('brutalist').palette;
  return { ink: palette.ink, muted: palette.muted, paper: palette.bg, red: palette.accent2, acid: palette.accent };
}

export function brutalistSemanticObjectRegions(context: NarrativeRenderContext, box: NarrativeRect): NarrativeObjectRegion[] {
  const { ctx } = canvasFor(8, 8);
  return createPlan(context, box, ctx, colorsFromPreset()).regions;
}

export function drawBrutalistSemantic(ctx: ReturnType<typeof canvasFor>['ctx'], context: NarrativeRenderContext, box: NarrativeRect, colors: BrutalistSemanticColors): void {
  const plan = createPlan(context, box, ctx, colors);
  for (const shape of plan.shapes) drawShape(ctx, shape);
  for (const mark of plan.texts) drawText(ctx, mark.text, mark.x, mark.baseline, mark.face, 700, mark.fontSizePx, mark.color);
}
