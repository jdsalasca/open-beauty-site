import type { SKRSContext2D } from '@napi-rs/canvas';
import { canvasFor } from '../canvas.js';
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
    'Split the phase or revise its wording; all text is preserved and no font below the minimum is used.',
    options.role,
  );
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
  const pilotComposition = brief.style === 'papercraft' || brief.style === 'brutalist';
  const textWidthRatio = pilotComposition ? 0.60 : 0.59;
  const artGapRatio = pilotComposition ? 0.02 : 0.04;
  const artWidthRatio = pilotComposition ? 0.28 : 0.27;
  const { ctx } = canvasFor(16, 16);
  const safeZone: NarrativeRect = { x: width * 0.05, y: height * 0.05, width: width * 0.9, height: height * 0.9 };
  const textArea: NarrativeRect = { x: safeZone.x, y: height * 0.09, width: width * textWidthRatio, height: height * 0.81 };
  const reservedArtArea: NarrativeRect = {
    x: textArea.x + textArea.width + width * artGapRatio,
    y: height * 0.17,
    width: width * artWidthRatio,
    height: height * 0.66,
  };
  assertSafeRect(safeZone, width, height);
  const cardScale = Math.min(640 / width, 360 / height);
  const titleBox: NarrativeRect = { x: textArea.x, y: height * 0.10, width: textArea.width, height: height * 0.21 };
  const labelBox: NarrativeRect = { x: textArea.x, y: height * 0.34, width: textArea.width, height: height * 0.09 };
  const bodyBox: NarrativeRect = { x: textArea.x, y: height * 0.43, width: textArea.width, height: height * 0.47 };
  const titleSize = fitText({
    text: brief.title,
    box: titleBox,
    face: fonts.effective.display,
    fallback: fonts.approvedAlternative.display,
    maxSize: 76,
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
      maxSize: 28,
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
      maxSize: 40,
      minSize: 36,
      leading: Number.parseFloat(fonts.typeSystem.bodyLeading),
      tracking: 0,
      role: `phases[${index}].text`,
      cardScale,
    }, ctx);
    return { label, body };
  });
  return { safeZone, textArea, reservedArtArea, title: titleSize, phases, cardScale, warnings: [] };
}
