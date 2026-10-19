import type { SKRSContext2D } from '@napi-rs/canvas';
import type { NarrativeObjectRegion, NarrativeObjectTextBox, NarrativeRect, NarrativeRenderContext } from '../../../types/narrative.js';
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
  cardScale: number;
}

function rect(x: number, y: number, width: number, height: number): NarrativeRect {
  return { x, y, width, height };
}

function indexed(entities: NarrativeSemanticEntity[], kind: NarrativeSemanticEntity['kind']): NarrativeSemanticEntity[] {
  return entities.filter((entity) => entity.kind === kind);
}

function drawFittedText(ctx: SKRSContext2D, value: string, x: number, baseline: number, maxWidth: number, size: number, color: string, face: 'Nunito Sans' | 'Fraunces' = 'Nunito Sans', cardScale = 1, minEffective = 14): number {
  let fitted = Math.ceil(Math.max(size, minEffective / cardScale));
  const minimum = Math.ceil(minEffective / cardScale);
  ctx.font = `700 ${fitted}px "${face}"`;
  while (fitted > minimum && ctx.measureText(value).width > maxWidth) {
    fitted -= 1;
    ctx.font = `700 ${fitted}px "${face}"`;
  }
  drawText(ctx, value, x, baseline, face, 700, fitted, color);
  return fitted;
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
    const cardHeight = (collectionBox.height * 0.54 - gapY * (rows - 1)) / rows;
    indexed(semantic.entities, 'collection').forEach((entity) => result.set(entity.id, collectionBox));
    cards.forEach((entity, index) => result.set(entity.id, rect(collectionBox.x + collectionBox.width * 0.06 + (index % columns) * (cardWidth + gapX), collectionBox.y + collectionBox.height * 0.24 + Math.floor(index / columns) * (cardHeight + gapY), cardWidth, cardHeight)));
  } else if (semantic.primitive === 'counter') {
    const items = semantic.entities.filter((entity) => entity.kind === 'row' || entity.kind === 'card');
    const itemWidth = Math.min(box.width * 0.21, (box.width * 0.78) / Math.max(1, items.length));
    const itemGap = Math.max(4, box.width * 0.025);
    const totalWidth = items.length * itemWidth + Math.max(0, items.length - 1) * itemGap;
    const startX = box.x + (box.width - totalWidth) / 2;
    items.forEach((entity, index) => result.set(entity.id, rect(startX + index * (itemWidth + itemGap), box.y + box.height * 0.3, itemWidth, box.height * 0.27)));
    const counters = indexed(semantic.entities, 'counter');
    const counterWidth = Math.min(box.width * 0.43, 260);
    counters.forEach((entity, index) => result.set(entity.id, rect(box.x + (box.width - counterWidth) / 2, box.y + box.height * (0.61 + index * 0.1), counterWidth, box.height * 0.29)));
  } else {
    const fileBox = rect(left, box.y + box.height * 0.25, width, box.height * 0.5);
    indexed(semantic.entities, 'file').forEach((entity) => result.set(entity.id, fileBox));
  }
  return result;
}

export function papercraftObjectRegions(context: NarrativeRenderContext, box: NarrativeRect): Array<{ entityId: string; bounds: NarrativeRect }> {
  if (!context.semantic) return [];
  const layout = positions(context.semantic, box);
  const scale = context.layout.cardScale;
  const boxes = new Map<string, NarrativeObjectTextBox[]>();
  const add = (entityId: string, text: string, bounds: NarrativeRect, size: number, role: NarrativeObjectTextBox['role']): void => {
    const effectiveMinimum = role === 'headline' ? 20 : 14;
    const fontSizePx = Math.ceil(Math.max(size, effectiveMinimum / scale));
    const list = boxes.get(entityId) ?? [];
    list.push({ text, bounds, fontSizePx, role });
    boxes.set(entityId, list);
  };
  const semantic = context.semantic;
  const table = semantic.entities.find((item) => item.kind === 'table');
  const rows = indexed(semantic.entities, 'row');
  const collection = semantic.entities.find((item) => item.kind === 'collection');
  const cards = indexed(semantic.entities, 'card');
  if (semantic.primitive === 'table-rows' && table) {
    const tableBox = layout.get(table.id);
    if (tableBox) {
      add(table.id, sceneText('papercraft', context.brief.locale, 'semanticTable'), tableBox, Math.max(14, box.width * 0.043), 'label');
      if (semantic.states[table.id] === 'reviewed') {
        const mark = rect(tableBox.x + tableBox.width * 0.1, tableBox.y + tableBox.height * 0.72, tableBox.width * 0.8, tableBox.height * 0.14);
        add(table.id, sceneText('papercraft', context.brief.locale, 'semanticRetained'), mark, Math.max(14, mark.height * 0.56), 'status');
      }
    }
    for (const row of rows) {
      const rowBox = layout.get(row.id);
      if (!rowBox) continue;
      const sourceId = semantic.relations.find((relation) => relation.kind === 'duplicate-of' && relation.from === row.id)?.to;
      const source = semantic.entities.find((item) => item.id === sourceId);
      const value = source ? (source.label ?? String(source.value ?? source.id)) : (row.label ?? String(row.value ?? sceneText('papercraft', context.brief.locale, 'semanticRow')));
      const size = Math.max(14, Math.min(rowBox.height * 0.34, box.width * 0.045));
      add(row.id, value, rowBox, size, 'identifier');
      const state = semantic.states[row.id] ?? 'default';
      if (['duplicate', 'flagged', 'marked', 'rejected'].includes(state)) {
        const status = state === 'duplicate' ? sceneText('papercraft', context.brief.locale, 'semanticDuplicate')
          : state === 'rejected' ? sceneText('papercraft', context.brief.locale, 'semanticRejected')
            : sceneText('papercraft', context.brief.locale, 'semanticFlagged');
        add(row.id, status, rect(rowBox.x, rowBox.y + rowBox.height * 0.56, rowBox.width * 0.85, rowBox.height * 0.35), Math.max(14, size * 0.58), 'status');
      }
    }
  } else if (semantic.primitive === 'card-collection' && collection) {
    const collectionBox = layout.get(collection.id);
    if (collectionBox) {
      add(collection.id, collection.label ?? sceneText('papercraft', context.brief.locale, 'semanticCollection'), collectionBox, Math.max(14, box.width * 0.04), 'label');
      const badge = rect(collectionBox.x + collectionBox.width * 0.06, collectionBox.y + collectionBox.height * 0.82, collectionBox.width * 0.88, collectionBox.height * 0.15);
      const count = cards.filter((card) => semantic.relations.some((relation) => relation.kind === 'member-of' && relation.from === card.id && relation.to === collection.id)).length;
      add(collection.id, String(count), rect(badge.x, badge.y, badge.width * 0.25, badge.height), Math.max(20, badge.height * 0.48), 'headline');
      add(collection.id, sceneText('papercraft', context.brief.locale, 'semanticCount'), rect(badge.x + badge.width * 0.3, badge.y, badge.width * 0.65, badge.height), Math.max(14, badge.height * 0.42), 'label');
    }
    for (const card of cards) {
      const cardBox = layout.get(card.id);
      if (cardBox) add(card.id, card.label ?? String(card.value ?? card.id), cardBox, Math.max(14, cardBox.height * 0.21), 'identifier');
    }
  } else if (semantic.primitive === 'counter') {
    const counter = semantic.entities.find((item) => item.kind === 'counter');
    for (const item of semantic.entities.filter((candidate) => candidate.kind === 'row' || candidate.kind === 'card')) {
      const itemBox = layout.get(item.id);
      if (itemBox) add(item.id, item.label ?? String(item.value ?? item.id), itemBox, Math.max(14, itemBox.height * 0.2), 'identifier');
    }
    if (counter) {
      const counterBox = layout.get(counter.id);
      const relations = semantic.relations.filter((relation) => relation.kind === 'counts' && relation.from === counter.id);
      if (counterBox) {
        const countPanel = rect(counterBox.x, counterBox.y, counterBox.width, counterBox.height * 0.66);
        add(counter.id, String(counter.value ?? new Set(relations.map((relation) => relation.to)).size), countPanel, Math.max(20, countPanel.height * 0.55), 'headline');
        add(counter.id, sceneText('papercraft', context.brief.locale, 'semanticCount'), countPanel, Math.max(14, countPanel.height * 0.24), 'label');
        if (semantic.states[counter.id] === 'pending') {
          const mark = rect(counterBox.x + counterBox.width * 0.1, counterBox.y + counterBox.height * 0.72, counterBox.width * 0.8, counterBox.height * 0.22);
          add(counter.id, sceneText('papercraft', context.brief.locale, 'semanticExpected'), mark, Math.max(14, mark.height * 0.6), 'status');
        }
      }
    }
  } else if (semantic.primitive === 'file-download') {
    for (const file of semantic.entities.filter((item) => item.kind === 'file')) {
      const fileBox = layout.get(file.id);
      if (!fileBox) continue;
      const state = semantic.states[file.id] ?? 'pending';
      add(file.id, file.label ?? String(file.value ?? sceneText('papercraft', context.brief.locale, 'semanticFile')), fileBox, Math.max(20, fileBox.height * 0.12), 'headline');
      add(file.id, sceneText('papercraft', context.brief.locale, fileStateKey(state)), fileBox, Math.max(14, fileBox.height * 0.11), 'status');
    }
  }
  const container = table ?? collection ?? semantic.entities.find((item) => item.kind === 'counter') ?? semantic.entities.find((item) => item.kind === 'file') ?? semantic.entities[0];
  if (container) {
    const tag = rect(box.x + box.width * 0.4, box.y + box.height * 0.045, box.width * 0.55, box.height * 0.1);
    add(container.id, sceneText('papercraft', context.brief.locale, 'semanticIllustrative'), tag, Math.max(14, tag.height * 0.42), 'label');
  }
  return context.semantic.entities.flatMap((entity) => {
    const bounds = layout.get(entity.id);
    return bounds ? [{ entityId: entity.id, bounds, ...(boxes.has(entity.id) ? { textBoxes: boxes.get(entity.id)! } : {}) }] : [];
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
  const size = Math.max(14, Math.min(target.height * 0.34, box.width * 0.045));
  drawFittedText(ctx, text, target.x + inset, target.y + target.height * 0.42, target.width * 0.86, size, palette.ink, 'Nunito Sans', palette.cardScale);
  if (['duplicate', 'flagged', 'marked', 'rejected'].includes(state)) {
    const status = state === 'duplicate' ? sceneText('papercraft', locale, 'semanticDuplicate')
      : state === 'rejected' ? sceneText('papercraft', locale, 'semanticRejected')
        : sceneText('papercraft', locale, 'semanticFlagged');
    const stampX = target.x + target.width * 0.055;
    const stampY = target.y + target.height * 0.56;
    const stampWidth = target.width * 0.85;
    const stampHeight = target.height * 0.35;
    ctx.strokeStyle = state === 'rejected' ? '#B3493E' : palette.accent;
    ctx.lineWidth = Math.max(1.5, target.width * 0.008);
    ctx.strokeRect(stampX, stampY, stampWidth, stampHeight);
    drawFittedText(ctx, status, stampX + stampWidth * 0.05, stampY + stampHeight * 0.72, stampWidth * 0.9, Math.max(14, size * 0.58), state === 'rejected' ? '#8F3E35' : palette.ink, 'Nunito Sans', palette.cardScale);
  }
  if (state === 'flagged' || state === 'marked') {
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
  }
}

function drawTable(ctx: SKRSContext2D, semantic: NarrativeSemanticScene, box: NarrativeRect, palette: PaperPalette, locale: 'es' | 'en'): void {
  const layout = positions(semantic, box);
  const table = semantic.entities.find((entity) => entity.kind === 'table');
  const rows = indexed(semantic.entities, 'row');
  const tableBox = table ? layout.get(table.id) : rect(box.x + box.width * 0.11, box.y + box.height * 0.2, box.width * 0.78, box.height * 0.62);
  if (!tableBox) return;
  paperPanel(ctx, tableBox, '#F7EEDC', '#C9B99F', 0.14);
  drawFittedText(ctx, sceneText('papercraft', locale, 'semanticTable'), tableBox.x + tableBox.width * 0.06, tableBox.y + tableBox.height * 0.16, tableBox.width * 0.75, Math.max(14, box.width * 0.043), palette.muted, 'Fraunces', palette.cardScale);
  for (const entity of rows) {
    const row = layout.get(entity.id);
    if (row) drawRow(ctx, semantic, entity, row, box, palette, locale);
  }
  if (table && semantic.states[table.id] === 'reviewed') {
    const mark = rect(tableBox.x + tableBox.width * 0.1, tableBox.y + tableBox.height * 0.72, tableBox.width * 0.8, tableBox.height * 0.14);
    paperPanel(ctx, mark, '#FFF7E7', palette.accent2, 0.06);
    drawFittedText(ctx, sceneText('papercraft', locale, 'semanticRetained'), mark.x + mark.width * 0.05, mark.y + mark.height * 0.72, mark.width * 0.9, Math.max(14, mark.height * 0.56), palette.ink, 'Nunito Sans', palette.cardScale);
  }
}

function drawCollection(ctx: SKRSContext2D, semantic: NarrativeSemanticScene, box: NarrativeRect, palette: PaperPalette, locale: 'es' | 'en'): void {
  const layout = positions(semantic, box);
  const collection = semantic.entities.find((entity) => entity.kind === 'collection');
  const collectionBox = collection ? layout.get(collection.id) : rect(box.x + box.width * 0.11, box.y + box.height * 0.2, box.width * 0.78, box.height * 0.62);
  if (collectionBox) {
    paperPanel(ctx, collectionBox, '#F5EAD4', '#B9A27E', 0.16);
    const label = collection?.label ?? sceneText('papercraft', locale, 'semanticCollection');
    drawFittedText(ctx, label, collectionBox.x + collectionBox.width * 0.06, collectionBox.y + collectionBox.height * 0.1, collectionBox.width * 0.82, Math.max(14, box.width * 0.04), palette.ink, 'Fraunces', palette.cardScale);
  }
  const cards = indexed(semantic.entities, 'card');
  for (const [index, card] of cards.entries()) {
    const cardBox = layout.get(card.id);
    if (!cardBox) continue;
    const state = semantic.states[card.id] ?? 'default';
    paperPanel(ctx, cardBox, state === 'selected' ? '#F7E5C1' : index % 2 ? '#FCF7EA' : '#FFFDF5', state === 'selected' ? palette.accent : '#D2C1A4', 0.11);
    const membership = semantic.relations.some((relation) => relation.kind === 'member-of' && relation.from === card.id && relation.to === collection?.id);
    drawFittedText(ctx, card.label ?? String(card.value ?? card.id), cardBox.x + cardBox.width * 0.08, cardBox.y + cardBox.height * 0.53, cardBox.width * 0.82, Math.max(14, cardBox.height * 0.21), palette.ink, 'Nunito Sans', palette.cardScale);
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
  const badge = rect(target.x + target.width * 0.06, target.y + target.height * 0.82, target.width * 0.88, target.height * 0.15);
  paperPanel(ctx, badge, '#FFF7E7', '#C9B99F', 0.1);
  drawFittedText(ctx, value, badge.x + badge.width * 0.08, badge.y + badge.height * 0.72, badge.width * 0.18, Math.max(20, badge.height * 0.48), palette.ink, 'Fraunces', palette.cardScale, 20);
  drawFittedText(ctx, sceneText('papercraft', locale, 'semanticCount'), badge.x + badge.width * 0.3, badge.y + badge.height * 0.68, badge.width * 0.65, Math.max(14, badge.height * 0.42), palette.ink, 'Nunito Sans', palette.cardScale);
}

function drawCounter(ctx: SKRSContext2D, semantic: NarrativeSemanticScene, box: NarrativeRect, palette: PaperPalette, locale: 'es' | 'en'): void {
  const layout = positions(semantic, box);
  const items = semantic.entities.filter((entity) => entity.kind === 'row' || entity.kind === 'card');
  const relations = semantic.relations.filter((relation) => relation.kind === 'counts');
  for (const [index, item] of items.entries()) {
    const itemBox = layout.get(item.id);
    if (!itemBox) continue;
    paperPanel(ctx, itemBox, index % 2 ? '#E6E9D8' : '#EFE3CF', '#B9AA91', 0.12);
    drawFittedText(ctx, item.label ?? String(item.value ?? item.id), itemBox.x + itemBox.width * 0.08, itemBox.y + itemBox.height * 0.58, itemBox.width * 0.82, Math.max(14, itemBox.height * 0.2), palette.ink, 'Nunito Sans', palette.cardScale);
  }
  for (const counter of indexed(semantic.entities, 'counter')) {
    const counterBox = layout.get(counter.id);
    if (!counterBox) continue;
    const countPanel = rect(counterBox.x, counterBox.y, counterBox.width, counterBox.height * 0.66);
    paperPanel(ctx, countPanel, '#F8E8BE', palette.accent, 0.17);
    const relatedCount = new Set(relations.filter((relation) => relation.from === counter.id).map((relation) => relation.to)).size;
    const value = counter.value === undefined ? String(relatedCount) : String(counter.value);
    drawFittedText(ctx, value, countPanel.x + countPanel.width * 0.08, countPanel.y + countPanel.height * 0.7, countPanel.width * 0.38, Math.max(20, countPanel.height * 0.55), palette.ink, 'Fraunces', palette.cardScale, 20);
    drawFittedText(ctx, sceneText('papercraft', locale, 'semanticCount'), countPanel.x + countPanel.width * 0.49, countPanel.y + countPanel.height * 0.62, countPanel.width * 0.45, Math.max(14, countPanel.height * 0.24), palette.muted, 'Nunito Sans', palette.cardScale);
    if (semantic.states[counter.id] === 'pending') {
      const mark = rect(counterBox.x + counterBox.width * 0.1, counterBox.y + counterBox.height * 0.72, counterBox.width * 0.8, counterBox.height * 0.22);
      ctx.strokeStyle = palette.accent2;
      ctx.lineWidth = Math.max(1.5, mark.width * 0.008);
      ctx.strokeRect(mark.x, mark.y, mark.width, mark.height);
      drawFittedText(ctx, sceneText('papercraft', locale, 'semanticExpected'), mark.x + mark.width * 0.05, mark.y + mark.height * 0.72, mark.width * 0.9, Math.max(14, mark.height * 0.6), palette.ink, 'Nunito Sans', palette.cardScale);
    }
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
    drawFittedText(ctx, filename, fileBox.x + fileBox.width * 0.08, fileBox.y + fileBox.height * 0.28, fileBox.width * 0.78, Math.max(20, fileBox.height * 0.12), palette.ink, 'Fraunces', palette.cardScale, 20);
    const bar = rect(fileBox.x + fileBox.width * 0.08, fileBox.y + fileBox.height * 0.52, fileBox.width * 0.76, fileBox.height * 0.09);
    ctx.fillStyle = '#E1D5C3';
    ctx.fillRect(bar.x, bar.y, bar.width, bar.height);
    const progress = state === 'complete' ? 1 : file.progress ?? 0;
    if (progress > 0) {
      paperPanel(ctx, rect(bar.x, bar.y, bar.width * progress, bar.height), state === 'failed' ? '#C05749' : palette.accent2, 'transparent', 0);
    }
    const status = sceneText('papercraft', locale, fileStateKey(state));
    drawFittedText(ctx, status, fileBox.x + fileBox.width * 0.08, fileBox.y + fileBox.height * 0.84, fileBox.width * 0.78, Math.max(14, fileBox.height * 0.11), palette.ink, 'Nunito Sans', palette.cardScale);
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
    const tag = rect(box.x + box.width * 0.4, box.y + box.height * 0.045, box.width * 0.55, box.height * 0.1);
    paperPanel(ctx, tag, '#F2D99A', '#B99858', 0.08);
    drawFittedText(ctx, sceneText('papercraft', locale, 'semanticIllustrative'), tag.x + tag.width * 0.08, tag.y + tag.height * 0.69, tag.width * 0.84, Math.max(14, tag.height * 0.42), palette.ink, 'Nunito Sans', palette.cardScale);
  }
}
