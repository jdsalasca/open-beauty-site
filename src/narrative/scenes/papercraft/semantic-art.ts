import type { SKRSContext2D } from '@napi-rs/canvas';
import type { NarrativeRect, NarrativeRenderContext } from '../../../types/narrative.js';
import type { NarrativeSemanticEntity, NarrativeSemanticScene } from '../../../types/narrative-scene.js';
import { sceneText } from '../../i18n.js';
import { drawText, rgba } from '../common.js';

export interface PaperPalette {
  ink: string;
  muted: string;
  accent: string;
  accent2: string;
  accent3: string;
  accent4: string;
  surface: string;
}

function rect(x: number, y: number, width: number, height: number): NarrativeRect {
  return { x, y, width, height };
}

function indexed(entities: NarrativeSemanticEntity[], kind: NarrativeSemanticEntity['kind']): NarrativeSemanticEntity[] {
  return entities.filter((entity) => entity.kind === kind);
}

function clipped(value: string, limit: number): string {
  return value.length <= limit ? value : `${value.slice(0, Math.max(1, limit - 1)).trimEnd()}…`;
}

function drawFittedText(ctx: SKRSContext2D, value: string, x: number, baseline: number, maxWidth: number, size: number, color: string, face: 'Nunito Sans' | 'Fraunces' = 'Nunito Sans'): void {
  let fitted = size;
  ctx.font = `700 ${fitted}px "${face}"`;
  while (fitted > 10 && ctx.measureText(value).width > maxWidth) {
    fitted -= 1;
    ctx.font = `700 ${fitted}px "${face}"`;
  }
  drawText(ctx, value, x, baseline, face, 700, fitted, color);
}

function paperPanel(ctx: SKRSContext2D, box: NarrativeRect, fill: string, edge: string, alpha = 0.2): void {
  const cut = Math.max(3, Math.min(10, box.width * 0.025));
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(box.x + cut, box.y);
  ctx.lineTo(box.x + box.width - cut * 1.7, box.y + 1);
  ctx.lineTo(box.x + box.width, box.y + cut * 0.8);
  ctx.lineTo(box.x + box.width - 1, box.y + box.height - cut);
  ctx.lineTo(box.x + box.width - cut, box.y + box.height);
  ctx.lineTo(box.x + cut * 0.7, box.y + box.height - 1);
  ctx.lineTo(box.x, box.y + box.height - cut * 0.8);
  ctx.closePath();
  ctx.shadowColor = rgba('#4A3A32', alpha);
  ctx.shadowBlur = Math.max(2, box.width * 0.012);
  ctx.shadowOffsetY = Math.max(2, box.width * 0.01);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = edge;
  ctx.lineWidth = Math.max(1, box.width * 0.004);
  ctx.stroke();
  ctx.restore();
}

function positions(semantic: NarrativeSemanticScene, box: NarrativeRect): Map<string, NarrativeRect> {
  const result = new Map<string, NarrativeRect>();
  const left = box.x + box.width * 0.11;
  const width = box.width * 0.78;
  if (semantic.primitive === 'table-rows') {
    const table = rect(left, box.y + box.height * 0.2, width, box.height * 0.62);
    const rows = indexed(semantic.entities, 'row');
    const rowHeight = Math.min(box.height * 0.16, table.height / Math.max(1, rows.length + 1));
    const rowStart = table.y + rowHeight * 0.78;
    indexed(semantic.entities, 'table').forEach((entity) => result.set(entity.id, table));
    rows.forEach((entity, index) => result.set(entity.id, rect(table.x + table.width * 0.035, rowStart + index * rowHeight, table.width * 0.93, rowHeight * 0.82)));
  } else if (semantic.primitive === 'card-collection') {
    const collectionBox = rect(left, box.y + box.height * 0.2, width, box.height * 0.62);
    const cards = indexed(semantic.entities, 'card');
    const columns = Math.min(2, Math.max(1, cards.length));
    const rows = Math.ceil(cards.length / columns);
    const gapX = box.width * 0.035;
    const gapY = box.height * 0.035;
    const cardWidth = (collectionBox.width * 0.88 - gapX * (columns - 1)) / columns;
    const cardHeight = (collectionBox.height * 0.72 - gapY * (rows - 1)) / rows;
    indexed(semantic.entities, 'collection').forEach((entity) => result.set(entity.id, collectionBox));
    cards.forEach((entity, index) => result.set(entity.id, rect(collectionBox.x + collectionBox.width * 0.06 + (index % columns) * (cardWidth + gapX), collectionBox.y + collectionBox.height * 0.13 + Math.floor(index / columns) * (cardHeight + gapY), cardWidth, cardHeight)));
  } else if (semantic.primitive === 'counter') {
    const items = semantic.entities.filter((entity) => entity.kind === 'row' || entity.kind === 'card');
    const itemWidth = Math.min(box.width * 0.21, (box.width * 0.78) / Math.max(1, items.length));
    const itemGap = Math.max(4, box.width * 0.025);
    const totalWidth = items.length * itemWidth + Math.max(0, items.length - 1) * itemGap;
    const startX = box.x + (box.width - totalWidth) / 2;
    items.forEach((entity, index) => result.set(entity.id, rect(startX + index * (itemWidth + itemGap), box.y + box.height * 0.3, itemWidth, box.height * 0.27)));
    const counters = indexed(semantic.entities, 'counter');
    const counterWidth = Math.min(box.width * 0.43, 260);
    counters.forEach((entity, index) => result.set(entity.id, rect(box.x + (box.width - counterWidth) / 2, box.y + box.height * (0.63 + index * 0.1), counterWidth, box.height * 0.19)));
  } else {
    const fileBox = rect(left, box.y + box.height * 0.25, width, box.height * 0.5);
    indexed(semantic.entities, 'file').forEach((entity) => result.set(entity.id, fileBox));
  }
  return result;
}

export function papercraftObjectRegions(context: NarrativeRenderContext, box: NarrativeRect): Array<{ entityId: string; bounds: NarrativeRect }> {
  if (!context.semantic) return [];
  const layout = positions(context.semantic, box);
  return context.semantic.entities.flatMap((entity) => {
    const bounds = layout.get(entity.id);
    return bounds ? [{ entityId: entity.id, bounds }] : [];
  });
}

function drawRow(ctx: SKRSContext2D, semantic: NarrativeSemanticScene, entity: NarrativeSemanticEntity, target: NarrativeRect, box: NarrativeRect, palette: PaperPalette, locale: 'es' | 'en'): void {
  const state = semantic.states[entity.id] ?? 'default';
  const sourceId = semantic.relations.find((relation) => relation.kind === 'duplicate-of' && relation.from === entity.id)?.to;
  const source = semantic.entities.find((item) => item.id === sourceId);
  const text = source ? (source.label ?? String(source.value ?? source.id)) : (entity.label ?? String(entity.value ?? sceneText('papercraft', locale, 'semanticRow')));
  const highlighted = ['duplicate', 'flagged', 'marked', 'rejected'].includes(state);
  paperPanel(ctx, target, state === 'rejected' ? '#F4DED3' : highlighted ? '#FFF4DB' : '#FBF7EE', state === 'rejected' ? '#BF664F' : highlighted ? palette.accent : '#C9B99F', 0.12);
  const inset = target.width * 0.075;
  const size = Math.max(12, Math.min(target.height * 0.34, box.width * 0.045));
  drawFittedText(ctx, clipped(text, 45), target.x + inset, target.y + target.height * 0.63, target.width * 0.67, size, palette.ink);
  if (state === 'duplicate') {
    ctx.save();
    ctx.setLineDash([target.width * 0.025, target.width * 0.014]);
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = Math.max(1, target.width * 0.006);
    ctx.strokeRect(target.x + target.width * 0.72, target.y + target.height * 0.22, target.width * 0.23, target.height * 0.55);
    ctx.restore();
    drawText(ctx, sceneText('papercraft', locale, 'semanticDuplicate'), target.x + target.width * 0.74, target.y + target.height * 0.57, 'Nunito Sans', 800, Math.max(9, size * 0.58), palette.ink);
  } else if (state === 'flagged' || state === 'marked') {
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(target.x + target.width * 0.88, target.y + target.height * 0.48, target.height * 0.19, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFF8EC';
    ctx.lineWidth = Math.max(1.5, target.height * 0.04);
    ctx.beginPath();
    ctx.moveTo(target.x + target.width * 0.82, target.y + target.height * 0.49);
    ctx.lineTo(target.x + target.width * 0.87, target.y + target.height * 0.56);
    ctx.lineTo(target.x + target.width * 0.95, target.y + target.height * 0.38);
    ctx.stroke();
  } else if (state === 'rejected') {
    // The row remains visible: rejection is a process decision, not deletion.
    ctx.strokeStyle = '#B3493E';
    ctx.lineWidth = Math.max(2, target.height * 0.09);
    ctx.beginPath();
    ctx.moveTo(target.x + target.width * 0.79, target.y + target.height * 0.25);
    ctx.lineTo(target.x + target.width * 0.92, target.y + target.height * 0.74);
    ctx.moveTo(target.x + target.width * 0.92, target.y + target.height * 0.25);
    ctx.lineTo(target.x + target.width * 0.79, target.y + target.height * 0.74);
    ctx.stroke();
    drawText(ctx, sceneText('papercraft', locale, 'semanticRejected'), target.x + target.width * 0.38, target.y + target.height * 0.88, 'Nunito Sans', 800, Math.max(9, size * 0.58), '#8F3E35');
  }
}

function drawTable(ctx: SKRSContext2D, semantic: NarrativeSemanticScene, box: NarrativeRect, palette: PaperPalette, locale: 'es' | 'en'): void {
  const layout = positions(semantic, box);
  const table = semantic.entities.find((entity) => entity.kind === 'table');
  const rows = indexed(semantic.entities, 'row');
  const tableBox = table ? layout.get(table.id) : rect(box.x + box.width * 0.11, box.y + box.height * 0.2, box.width * 0.78, box.height * 0.62);
  if (!tableBox) return;
  paperPanel(ctx, tableBox, '#F7EEDC', '#C9B99F', 0.14);
  drawFittedText(ctx, sceneText('papercraft', locale, 'semanticTable'), tableBox.x + tableBox.width * 0.06, tableBox.y + tableBox.height * 0.16, tableBox.width * 0.75, Math.max(11, box.width * 0.043), palette.muted, 'Fraunces');
  for (const entity of rows) {
    const row = layout.get(entity.id);
    if (row) drawRow(ctx, semantic, entity, row, box, palette, locale);
  }
}

function drawCollection(ctx: SKRSContext2D, semantic: NarrativeSemanticScene, box: NarrativeRect, palette: PaperPalette, locale: 'es' | 'en'): void {
  const layout = positions(semantic, box);
  const collection = semantic.entities.find((entity) => entity.kind === 'collection');
  const collectionBox = collection ? layout.get(collection.id) : rect(box.x + box.width * 0.11, box.y + box.height * 0.2, box.width * 0.78, box.height * 0.62);
  if (collectionBox) {
    paperPanel(ctx, collectionBox, '#F5EAD4', '#B9A27E', 0.16);
    const label = collection?.label ?? sceneText('papercraft', locale, 'semanticCollection');
    drawFittedText(ctx, label, collectionBox.x + collectionBox.width * 0.06, collectionBox.y + collectionBox.height * 0.1, collectionBox.width * 0.82, Math.max(11, box.width * 0.04), palette.ink, 'Fraunces');
  }
  const cards = indexed(semantic.entities, 'card');
  for (const [index, card] of cards.entries()) {
    const cardBox = layout.get(card.id);
    if (!cardBox) continue;
    const state = semantic.states[card.id] ?? 'default';
    paperPanel(ctx, cardBox, state === 'selected' ? '#F7E5C1' : index % 2 ? '#FCF7EA' : '#FFFDF5', state === 'selected' ? palette.accent : '#D2C1A4', 0.11);
    const membership = semantic.relations.some((relation) => relation.kind === 'member-of' && relation.from === card.id && relation.to === collection?.id);
    drawFittedText(ctx, card.label ?? String(card.value ?? card.id), cardBox.x + cardBox.width * 0.08, cardBox.y + cardBox.height * 0.53, cardBox.width * 0.82, Math.max(10, cardBox.height * 0.21), palette.ink);
    ctx.fillStyle = state === 'selected' ? palette.accent : membership ? palette.accent2 : palette.muted;
    ctx.beginPath();
    ctx.arc(cardBox.x + cardBox.width * 0.86, cardBox.y + cardBox.height * 0.82, Math.max(3, cardBox.height * 0.055), 0, Math.PI * 2);
    ctx.fill();
  }
  if (collection && collectionBox) {
    const count = cards.filter((card) => semantic.relations.some((relation) => relation.kind === 'member-of' && relation.from === card.id && relation.to === collection.id)).length;
    drawCountBadge(ctx, collectionBox, String(count), palette, locale);
  }
}

function drawCountBadge(ctx: SKRSContext2D, target: NarrativeRect, value: string, palette: PaperPalette, locale: 'es' | 'en'): void {
  const badge = rect(target.x + target.width * 0.64, target.y + target.height * 0.02, target.width * 0.31, target.height * 0.19);
  paperPanel(ctx, badge, '#FFF7E7', '#C9B99F', 0.1);
  drawFittedText(ctx, `${value} ${sceneText('papercraft', locale, 'semanticCount')}`, badge.x + badge.width * 0.08, badge.y + badge.height * 0.67, badge.width * 0.84, Math.max(9, badge.height * 0.42), palette.ink);
}

function drawCounter(ctx: SKRSContext2D, semantic: NarrativeSemanticScene, box: NarrativeRect, palette: PaperPalette, locale: 'es' | 'en'): void {
  const layout = positions(semantic, box);
  const items = semantic.entities.filter((entity) => entity.kind === 'row' || entity.kind === 'card');
  const relations = semantic.relations.filter((relation) => relation.kind === 'counts');
  for (const [index, item] of items.entries()) {
    const itemBox = layout.get(item.id);
    if (!itemBox) continue;
    paperPanel(ctx, itemBox, index % 2 ? '#E6E9D8' : '#EFE3CF', '#B9AA91', 0.12);
    drawFittedText(ctx, item.label ?? String(item.value ?? item.id), itemBox.x + itemBox.width * 0.08, itemBox.y + itemBox.height * 0.58, itemBox.width * 0.82, Math.max(10, itemBox.height * 0.2), palette.ink);
  }
  for (const counter of indexed(semantic.entities, 'counter')) {
    const counterBox = layout.get(counter.id);
    if (!counterBox) continue;
    paperPanel(ctx, counterBox, '#F8E8BE', palette.accent, 0.17);
    const relatedCount = new Set(relations.filter((relation) => relation.from === counter.id).map((relation) => relation.to)).size;
    const value = counter.value === undefined ? String(relatedCount) : String(counter.value);
    drawFittedText(ctx, value, counterBox.x + counterBox.width * 0.08, counterBox.y + counterBox.height * 0.7, counterBox.width * 0.38, Math.max(18, counterBox.height * 0.55), palette.ink, 'Fraunces');
    drawFittedText(ctx, sceneText('papercraft', locale, 'semanticCount'), counterBox.x + counterBox.width * 0.49, counterBox.y + counterBox.height * 0.62, counterBox.width * 0.45, Math.max(10, counterBox.height * 0.24), palette.muted);
    const targets = relations.filter((relation) => relation.from === counter.id).map((relation) => layout.get(relation.to)).filter((value): value is NarrativeRect => Boolean(value));
    ctx.strokeStyle = rgba(palette.accent, 0.72);
    ctx.fillStyle = palette.accent;
    ctx.lineWidth = Math.max(2, box.width * 0.009);
    const startX = counterBox.x + counterBox.width * 0.5;
    const startY = counterBox.y + counterBox.height * 0.03;
    for (const target of targets) {
      const targetX = target.x + target.width / 2;
      const targetY = target.y + target.height;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();
      const angle = Math.atan2(targetY - startY, targetX - startX);
      const arrowLength = Math.max(6, box.width * 0.03);
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(targetX - arrowLength * Math.cos(angle - Math.PI / 6), targetY - arrowLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(targetX - arrowLength * Math.cos(angle + Math.PI / 6), targetY - arrowLength * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }
  }
}

function fileStateKey(state: string): string {
  return state === 'complete' ? 'semanticComplete'
    : state === 'failed' ? 'semanticFailed'
      : state === 'retrying' ? 'semanticRetrying'
        : state === 'downloading' ? 'semanticDownloading'
          : 'semanticPending';
}

function drawRetryMark(ctx: SKRSContext2D, box: NarrativeRect, color: string): void {
  const x = box.x + box.width * 0.91;
  const y = box.y + box.height * 0.27;
  const radius = Math.min(box.height * 0.09, box.width * 0.055);
  const endAngle = Math.PI * 1.8;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, radius * 0.19);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, radius, Math.PI * 0.4, endAngle);
  ctx.stroke();
  const tipX = x + radius * Math.cos(endAngle);
  const tipY = y + radius * Math.sin(endAngle);
  const tangent = endAngle + Math.PI / 2;
  const normal = tangent + Math.PI / 2;
  const arrowLength = radius * 0.55;
  const halfBase = radius * 0.36;
  const baseX = tipX - arrowLength * Math.cos(tangent);
  const baseY = tipY - arrowLength * Math.sin(tangent);
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(baseX + halfBase * Math.cos(normal), baseY + halfBase * Math.sin(normal));
  ctx.lineTo(baseX - halfBase * Math.cos(normal), baseY - halfBase * Math.sin(normal));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawFile(ctx: SKRSContext2D, semantic: NarrativeSemanticScene, box: NarrativeRect, palette: PaperPalette, locale: 'es' | 'en'): void {
  const layout = positions(semantic, box);
  for (const file of indexed(semantic.entities, 'file')) {
    const fileBox = layout.get(file.id);
    if (!fileBox) continue;
    const state = semantic.states[file.id] ?? 'pending';
    paperPanel(ctx, fileBox, state === 'failed' ? '#F4DFD5' : '#FBF5E8', state === 'failed' ? '#C05749' : '#C5B69C', 0.17);
    const filename = file.label ?? String(file.value ?? sceneText('papercraft', locale, 'semanticFile'));
    drawFittedText(ctx, filename, fileBox.x + fileBox.width * 0.08, fileBox.y + fileBox.height * 0.28, fileBox.width * 0.78, Math.max(12, fileBox.height * 0.12), palette.ink, 'Fraunces');
    const bar = rect(fileBox.x + fileBox.width * 0.08, fileBox.y + fileBox.height * 0.52, fileBox.width * 0.76, fileBox.height * 0.09);
    ctx.fillStyle = '#E1D5C3';
    ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
    const progress = state === 'complete' ? 1 : file.progress ?? 0;
    if (progress > 0) {
      paperPanel(ctx, rect(bar.x, bar.y, bar.width * progress, bar.height), state === 'failed' ? '#C05749' : palette.accent2, 'transparent', 0);
    }
    const status = sceneText('papercraft', locale, fileStateKey(state));
    drawFittedText(ctx, status, fileBox.x + fileBox.width * 0.08, fileBox.y + fileBox.height * 0.84, fileBox.width * 0.58, Math.max(10, fileBox.height * 0.11), palette.ink);
    if (state === 'failed') {
      ctx.strokeStyle = '#B3493E';
      ctx.lineWidth = Math.max(2, fileBox.height * 0.035);
      ctx.beginPath();
      ctx.moveTo(fileBox.x + fileBox.width * 0.85, fileBox.y + fileBox.height * 0.2);
      ctx.lineTo(fileBox.x + fileBox.width * 0.91, fileBox.y + fileBox.height * 0.32);
      ctx.lineTo(fileBox.x + fileBox.width * 0.97, fileBox.y + fileBox.height * 0.2);
      ctx.moveTo(fileBox.x + fileBox.width * 0.91, fileBox.y + fileBox.height * 0.2);
      ctx.lineTo(fileBox.x + fileBox.width * 0.91, fileBox.y + fileBox.height * 0.32);
      ctx.stroke();
    } else if (state === 'retrying') {
      drawRetryMark(ctx, fileBox, palette.accent);
    } else if (state === 'complete') {
      ctx.fillStyle = palette.accent2;
      ctx.beginPath();
      ctx.arc(fileBox.x + fileBox.width * 0.91, fileBox.y + fileBox.height * 0.27, fileBox.height * 0.095, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFF8EC';
      ctx.lineWidth = Math.max(1.5, fileBox.height * 0.02);
      ctx.beginPath();
      ctx.moveTo(fileBox.x + fileBox.width * 0.87, fileBox.y + fileBox.height * 0.27);
      ctx.lineTo(fileBox.x + fileBox.width * 0.9, fileBox.y + fileBox.height * 0.31);
      ctx.lineTo(fileBox.x + fileBox.width * 0.96, fileBox.y + fileBox.height * 0.23);
      ctx.stroke();
    }
  }
}

export function drawPapercraftSemantic(ctx: SKRSContext2D, semantic: NarrativeSemanticScene, box: NarrativeRect, palette: PaperPalette, locale: 'es' | 'en'): void {
  if (semantic.primitive === 'table-rows') drawTable(ctx, semantic, box, palette, locale);
  else if (semantic.primitive === 'card-collection') drawCollection(ctx, semantic, box, palette, locale);
  else if (semantic.primitive === 'counter') drawCounter(ctx, semantic, box, palette, locale);
  else if (semantic.primitive === 'file-download') drawFile(ctx, semantic, box, palette, locale);
  if (semantic.illustrative) {
    const tag = rect(box.x + box.width * 0.48, box.y + box.height * 0.045, box.width * 0.43, box.height * 0.1);
    paperPanel(ctx, tag, '#F2D99A', '#B99858', 0.08);
    drawFittedText(ctx, sceneText('papercraft', locale, 'semanticIllustrative'), tag.x + tag.width * 0.08, tag.y + tag.height * 0.69, tag.width * 0.84, Math.max(11, tag.height * 0.42), palette.ink);
  }
}
