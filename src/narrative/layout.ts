import type { SKRSContext2D } from '@napi-rs/canvas';
import { canvasFor } from '../canvas.js';
import { narrativeCompositionFor } from './composition.js';
import { faceForNarrativeGlyph, getNarrativeFontProfile, checkNarrativeFontRoles, narrativeCanvasWeight } from './fonts.js';
import { NarrativeError, type NormalizedNarrativeBrief, type NarrativeFontRole, type NarrativeLayout, type NarrativeRect, type NarrativeTextBlock } from '../types/narrative.js';

interface FitTextOptions {
  text: string;
  box: NarrativeRect;
  face: NarrativeFontRole;
  fallback: NarrativeFontRole;
  maxSize: number;
  minSize: number;
  leading: number;
  tracking: number;
  role: string;
  cardScale: number;
}

function setFont(ctx: SKRSContext2D, face: NarrativeFontRole, size: number): void {
  ctx.font = `${narrativeCanvasWeight(face)} ${size}px "${face.family}"`;
}

function textWidth(ctx: SKRSContext2D, value: string, face: NarrativeFontRole, fallback: NarrativeFontRole, size: number, tracking: number): number {
  let width = 0;
  for (const glyph of value) {
    const glyphFace = faceForNarrativeGlyph(face, fallback, glyph);
    setFont(ctx, glyphFace, size);
    width += ctx.measureText(glyph).width;
  }
  return width + tracking * Math.max(0, [...value].length - 1);
}

function wrapParagraph(ctx: SKRSContext2D, paragraph: string, maxWidth: number, face: NarrativeFontRole, fallback: NarrativeFontRole, size: number, tracking: number): string[] {
  if (!paragraph) return [''];
  const words = paragraph.split(/\s+/u).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && textWidth(ctx, candidate, face, fallback, size, tracking) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function wrapText(ctx: SKRSContext2D, text: string, maxWidth: number, face: NarrativeFontRole, fallback: NarrativeFontRole, size: number, tracking: number): string[] {
  return text.split('\n').flatMap((paragraph) => wrapParagraph(ctx, paragraph, maxWidth, face, fallback, size, tracking));
}

function verticalMetrics(ctx: SKRSContext2D, lines: string[], face: NarrativeFontRole, fallback: NarrativeFontRole, size: number, leading: number): { lineHeight: number; height: number } {
  const glyphs = (lines.length ? lines : ['ÁÉgjpq']).flatMap((line) => [...(line || 'ÁÉgjpq')]);
  const glyphHeight = Math.max(...glyphs.map((glyph) => {
    const glyphFace = faceForNarrativeGlyph(face, fallback, glyph);
    setFont(ctx, glyphFace, size);
    const metrics = ctx.measureText(glyph);
    return (metrics.actualBoundingBoxAscent || size * 0.8) + (metrics.actualBoundingBoxDescent || size * 0.25);
  }));
  const lineHeight = Math.max(size * leading, glyphHeight);
  return { lineHeight, height: lines.length * lineHeight };
}

function fitText(options: FitTextOptions, ctx: SKRSContext2D): NarrativeTextBlock {
  for (let size = options.maxSize; size >= options.minSize; size -= 1) {
    const tracking = options.tracking * size;
    const lines = wrapText(ctx, options.text, options.box.width, options.face, options.fallback, size, tracking);
    const { lineHeight, height } = verticalMetrics(ctx, lines, options.face, options.fallback, size, options.leading);
    const width = Math.max(0, ...lines.map((line) => textWidth(ctx, line, options.face, options.fallback, size, tracking)));
    if (width <= options.box.width && height <= options.box.height) {
      return {
        sourceText: options.text,
        lines,
        size,
        lineHeight,
        width,
        height,
        tracking,
        effectiveCardSize: size * options.cardScale,
      };
    }
  }
  throw new NarrativeError(
    'TEXT_OVERFLOW',
    `${options.role} text does not fit its ${Math.round(options.box.width)}×${Math.round(options.box.height)}px area while staying at least ${options.minSize}px.`,
    overflowSuggestion(options, ctx),
    options.role,
  );
}

/**
 * A suggestion a small model can act on: which field fails, and how much of it DOES fit at the
 * minimum size (largest whole-word prefix), so it can shorten the wording instead of guessing.
 * Nothing is ever truncated for the caller: this only describes the limit.
 */
function overflowSuggestion(options: FitTextOptions, ctx: SKRSContext2D): string {
  const field = options.role === 'title' ? 'the title' : options.role.replace(/^phases\[(\d+)\]\.(label|text)$/u, (_, index: string, part: string) => `phase ${Number(index) + 1} ${part === 'label' ? 'label' : 'text'}`);
  const words = options.text.split(/\s+/u).filter(Boolean);
  let fitting = '';
  for (let count = words.length - 1; count >= 1; count -= 1) {
    const candidate = words.slice(0, count).join(' ');
    const tracking = options.tracking * options.minSize;
    const lines = wrapText(ctx, candidate, options.box.width, options.face, options.fallback, options.minSize, tracking);
    const { height } = verticalMetrics(ctx, lines, options.face, options.fallback, options.minSize, options.leading);
    const width = Math.max(0, ...lines.map((line) => textWidth(ctx, line, options.face, options.fallback, options.minSize, tracking)));
    if (width <= options.box.width && height <= options.box.height) {
      fitting = candidate;
      break;
    }
  }
  const limit = fitting
    ? ` About ${[...fitting].length} characters fit in this style (for example: "${fitting}"); shorten ${field} to that length, or split the content into another phase.`
    : ` Even one word is too long here; use a shorter word for ${field}.`;
  return `Shorten ${field}: this style's face is wide at the required minimum size.${limit} All text is preserved; no font below the minimum is used.`;
}

function emValue(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function assertSafeRect(rect: NarrativeRect, width: number, height: number): void {
  const marginX = Math.min(rect.x, width - rect.x - rect.width);
  const marginY = Math.min(rect.y, height - rect.y - rect.height);
  if (marginX < width * 0.05 - 0.01 || marginY < height * 0.05 - 0.01) {
    throw new NarrativeError('RESOURCE_LIMIT', 'Narrative safe zone fell below the required 5% margin.', 'Use supported dimensions and retain the shared safe-zone layout.');
  }
}

export function layoutNarrative(brief: NormalizedNarrativeBrief): NarrativeLayout {
  checkNarrativeFontRoles(brief.style);
  const fonts = getNarrativeFontProfile(brief.style);
  const width = brief.output.width;
  const height = brief.output.height;
  const composition = narrativeCompositionFor(brief.style);
  const { ctx } = canvasFor(16, 16);
  const safeZone: NarrativeRect = { x: width * 0.05, y: height * 0.05, width: width * 0.9, height: height * 0.9 };
  const textArea: NarrativeRect = { x: safeZone.x, y: safeZone.y, width: width * composition.textWidthRatio, height: safeZone.height };
  const reservedArtArea: NarrativeRect = {
    x: textArea.x + textArea.width + width * composition.artGapRatio,
    y: height * composition.artY,
    width: width * composition.artWidthRatio,
    height: height * composition.artHeight,
  };
  assertSafeRect(safeZone, width, height);
  assertSafeRect(reservedArtArea, width, height);
  const cardScale = Math.min(640 / width, 360 / height);
  const scale = Math.min(width / 1280, height / 720);
  const titleBox: NarrativeRect = { x: textArea.x, y: textArea.y, width: textArea.width, height: textArea.height * 0.23 };
  const labelBox: NarrativeRect = { x: textArea.x, y: textArea.y, width: textArea.width, height: textArea.height * 0.10 };
  const bodyBox: NarrativeRect = { x: textArea.x, y: textArea.y, width: textArea.width, height: textArea.height * 0.56 };
  const titleSize = fitText({
    text: brief.title,
    box: titleBox,
    face: fonts.effective.display,
    fallback: fonts.approvedAlternative.display,
    maxSize: Math.max(56, Math.round(104 * scale)),
    minSize: 56,
    leading: 1.08,
    tracking: emValue(fonts.typeSystem.displayTracking),
    role: 'title',
    cardScale,
  }, ctx);
  const phases = brief.phases.map((phase, index) => {
    const label = fitText({
      text: phase.label,
      box: labelBox,
      face: fonts.effective.label,
      fallback: fonts.approvedAlternative.label,
      maxSize: Math.max(24, Math.round(30 * scale)),
      minSize: 24,
      leading: 1.2,
      tracking: emValue(fonts.typeSystem.labelTracking),
      role: `phases[${index}].label`,
      cardScale,
    }, ctx);
    const body = fitText({
      text: phase.text,
      box: bodyBox,
      face: fonts.effective.reading,
      fallback: fonts.approvedAlternative.reading,
      maxSize: Math.max(36, Math.round(56 * scale)),
      minSize: 36,
      leading: Number.parseFloat(fonts.typeSystem.bodyLeading),
      tracking: 0,
      role: `phases[${index}].text`,
      cardScale,
    }, ctx);
    return { label, body };
  });
  const maxLabelHeight = Math.max(...phases.map((phase) => phase.label.height));
  const maxBodyHeight = Math.max(...phases.map((phase) => phase.body.height));
  const titleLabelGap = height * 0.10;
  const labelBodyGap = height * 0.10;
  const groupHeight = titleSize.height + titleLabelGap + maxLabelHeight + labelBodyGap + maxBodyHeight;
  const groupTop = textArea.y + (textArea.height - groupHeight) / 2;
  const copyPositions = {
    titleY: groupTop,
    labelY: groupTop + titleSize.height + titleLabelGap,
    bodyY: groupTop + titleSize.height + titleLabelGap + maxLabelHeight + labelBodyGap,
    groupHeight,
  };
  return { safeZone, textArea, reservedArtArea, copyPositions, title: titleSize, phases, cardScale, warnings: [] };
}
