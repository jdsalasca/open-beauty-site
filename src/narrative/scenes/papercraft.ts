import { canvasFor } from '../../canvas.js';
import { getStyle } from '../../styles/presets.js';
import type { NarrativePhase, NarrativeRenderContext, NarrativeScene, NormalizedNarrativeBrief, NarrativeRect } from '../../types/narrative.js';
import { cubicBezierEase, drawRule, drawText, phaseMarkProgress, rgba } from './common.js';
import { sceneVocabulary } from '../vocabulary.js';
import { sceneText, workflowBadgeText } from '../i18n.js';
import { drawPapercraftSemantic, papercraftObjectRegions } from './papercraft/semantic-art.js';

function artBox(art: NarrativeRect): NarrativeRect {
  return { x: art.x + art.width * 0.005, y: art.y + art.height * 0.005, width: art.width * 0.99, height: art.height * 0.99 };
}

interface PaperGuide {
  readonly identity: 'guia-de-revision';
  readonly composition: 'comparison' | 'checklist';
  readonly rotation: number;
  readonly cutVariant: number;
  readonly backing: 'sage' | 'sky';
  readonly tapeAngle: number;
  readonly edgeProfile: readonly number[];
  readonly grainSeed: number;
}

function compositionFor(brief: NormalizedNarrativeBrief): PaperGuide['composition'] {
  const kind = brief.phases[0]!.visual.kind.toLowerCase();
  return /checklist|process|lista|proceso/u.test(kind) ? 'checklist' : 'comparison';
}

function cutSheet(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, variant: number, edgeProfile: readonly number[]): void {
  const { x, y, width: w, height: h } = box;
  const notch = Math.max(18, Math.min(34, w * (0.075 + variant * 0.012)));
  const edge = Math.max(3, Math.min(7, w * 0.012));
  const roughness = Math.max(1.5, Math.min(5.5, w * (0.006 + variant * 0.001)));
  const irregular = (index: number): number => (edgeProfile[index % edgeProfile.length]! - 0.5) * roughness;
  ctx.beginPath();
  ctx.moveTo(x + edge * 2, y + edge + irregular(0));
  for (let index = 1; index <= 5; index += 1) {
    const px = x + w * (0.08 + index * 0.1);
    if (px >= x + w * 0.67) break;
    ctx.lineTo(px, y + edge + irregular(index));
  }
  ctx.lineTo(x + w * 0.67, y + edge + irregular(6));
  ctx.lineTo(x + w * 0.67, y + notch);
  ctx.lineTo(x + w * 0.77 + notch * 0.3, y + notch);
  ctx.lineTo(x + w * 0.77 + notch * 0.3, y + edge + irregular(7));
  for (let index = 8; index <= 10; index += 1) {
    const px = x + w * (0.79 + (index - 8) * 0.065);
    ctx.lineTo(px, y + edge + irregular(index));
  }
  for (let index = 11; index <= 14; index += 1) {
    const py = y + h * (0.18 + (index - 11) * 0.19);
    ctx.lineTo(x + w - edge + irregular(index), py);
  }
  for (let index = 15; index <= 19; index += 1) {
    const px = x + w * (0.82 - (index - 15) * 0.16);
    ctx.lineTo(px, y + h - edge + irregular(index));
  }
  for (let index = 20; index <= 23; index += 1) {
    const py = y + h * (0.79 - (index - 20) * 0.19);
    ctx.lineTo(x + edge + irregular(index), py);
  }
  ctx.closePath();
}

function fillLayer(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, color: string, variant: number, edgeProfile: readonly number[], edgeColor: string, shadow: { blur: number; y: number; alpha: number }): void {
  cutSheet(ctx, box, variant, edgeProfile);
  ctx.save();
  ctx.shadowColor = rgba('#4A3A32', shadow.alpha);
  ctx.shadowBlur = shadow.blur;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = shadow.y;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
  cutSheet(ctx, box, variant, edgeProfile);
  ctx.lineWidth = 1;
  ctx.strokeStyle = edgeColor;
  ctx.stroke();
}

function drawFolderTab(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, color: string): void {
  const x = box.x + box.width * 0.63;
  const y = box.y + box.height * 0.005;
  const width = box.width * 0.19;
  const height = box.height * 0.09;
  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.lineTo(x, y + height * 0.3);
  ctx.lineTo(x + width * 0.12, y);
  ctx.lineTo(x + width * 0.83, y);
  ctx.lineTo(x + width, y + height * 0.28);
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = rgba('#4A3A32', 0.16);
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawCutoutWindow(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, reveal: string, ink: string): void {
  const x = box.x + box.width * 0.76;
  const y = box.y + box.height * 0.125;
  const width = box.width * 0.16;
  const height = box.height * 0.06;
  ctx.fillStyle = reveal;
  ctx.fillRect(x, y, width, height);
  ctx.fillStyle = rgba(ink, 0.16);
  ctx.fillRect(x, y + height - 3, width, 3);
  ctx.strokeStyle = rgba(ink, 0.35);
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
  ctx.beginPath();
  ctx.moveTo(x + 3, y + height - 4);
  ctx.lineTo(x + width - 4, y + height - 4);
  ctx.strokeStyle = rgba(ink, 0.18);
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawPaperGrain(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, seed: number): void {
  let state = seed >>> 0 || 1;
  const next = (): number => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x + box.width * 0.035, box.y + box.height * 0.04, box.width * 0.93, box.height * 0.92);
  ctx.clip();
  ctx.fillStyle = '#806D58';
  for (let index = 0; index < 190; index += 1) {
    ctx.globalAlpha = 0.018 + next() * 0.016;
    const x = box.x + box.width * (0.04 + next() * 0.92);
    const y = box.y + box.height * (0.04 + next() * 0.92);
    const size = 0.55 + next() * 0.6;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

function drawTornRibbon(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, angle: number, butter: string, ink: string): void {
  const width = box.width * 0.37;
  const height = Math.max(18, box.height * 0.055);
  ctx.save();
  ctx.translate(box.x + box.width * 0.05, box.y + box.height * 0.035);
  ctx.rotate(angle * Math.PI / 180);
  ctx.beginPath();
  ctx.moveTo(0, height * 0.12);
  ctx.lineTo(width * 0.08, 0);
  ctx.lineTo(width * 0.19, height * 0.12);
  ctx.lineTo(width * 0.3, 0);
  ctx.lineTo(width, height * 0.12);
  ctx.lineTo(width * 0.92, height * 0.52);
  ctx.lineTo(width, height * 0.88);
  ctx.lineTo(width * 0.22, height);
  ctx.lineTo(width * 0.13, height * 0.81);
  ctx.lineTo(0, height * 0.93);
  ctx.closePath();
  ctx.shadowColor = rgba(ink, 0.13);
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = butter;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(width * 0.82, height * 0.1);
  ctx.lineTo(width * 0.94, height * 0.51);
  ctx.lineTo(width * 0.82, height * 0.91);
  ctx.strokeStyle = rgba(ink, 0.2);
  ctx.lineWidth = Math.max(1, height * 0.045);
  ctx.stroke();
  ctx.restore();
}

function stateRank(phase: NarrativePhase): number {
  const state = phase.visual.state.toLowerCase();
  if (/^unreviewed$|^before$|^pending$/u.test(state)) return 0;
  if (/flag|signal|observation|observaci/u.test(state)) return 1;
  if (/review.?ready|^reviewed$|^ready$|^done$|verified|list/u.test(state)) return 2;
  return 0;
}

export function papercraftStatusStampText(status: NormalizedNarrativeBrief['status'], locale: 'es' | 'en' = 'es'): string {
  return workflowBadgeText('papercraft', locale, status, 'workflow')!;
}

function drawSignal(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, progress: number, accent: string): void {
  if (progress <= 0.01) return;
  const mark = Math.min(1, progress);
  const width = box.width * 0.16;
  const height = box.height * 0.055;
  const x = box.x + box.width * 0.84 + (1 - mark) * box.width * 0.19;
  const y = box.y + box.height * 0.42;
  ctx.save();
  ctx.globalAlpha = mark;
  ctx.shadowColor = rgba('#4A3A32', 0.22);
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width * 0.72, y);
  ctx.lineTo(x + width, y + height * 0.5);
  ctx.lineTo(x + width * 0.72, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x + width * 0.12, y + height * 0.5);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.moveTo(x + width * 0.72, y + height * 0.08);
  ctx.lineTo(x + width * 0.72, y + height * 0.92);
  ctx.strokeStyle = rgba('#4A3A32', 0.28);
  ctx.lineWidth = Math.max(1, box.width * 0.004);
  ctx.stroke();
  ctx.restore();
}

function drawReviewStamp(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, progress: number, text: string, accent: string, ink: string): void {
  if (progress <= 0.01) return;
  const reveal = Math.min(1, progress);
  const stampWidth = box.width * 0.48;
  const stampHeight = Math.max(26, box.height * 0.062);
  const x = box.x + box.width * 0.43;
  const y = box.y + box.height * 0.89 + (1 - reveal) * box.height * 0.055;
  ctx.save();
  ctx.globalAlpha = reveal;
  ctx.shadowColor = rgba(ink, 0.2);
  ctx.shadowBlur = 1;
  ctx.shadowOffsetY = 4;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.setLineDash([stampWidth * 0.19, Math.max(1, stampWidth * 0.012)]);
  ctx.strokeRect(x, y, stampWidth, stampHeight);
  ctx.setLineDash([]);
  ctx.shadowColor = 'transparent';
  ctx.globalAlpha = reveal * 0.12;
  ctx.fillStyle = accent;
  for (let index = 0; index < 32; index += 1) {
    const dotX = x + stampWidth * ((index * 17) % 97) / 100;
    const dotY = y + stampHeight * ((index * 31) % 89) / 100;
    ctx.fillRect(dotX, dotY, 1.6, 1.2);
  }
  ctx.globalAlpha = reveal;
  drawText(ctx, text, x + stampWidth * 0.08, y + stampHeight * 0.68, 'Nunito Sans', 800, Math.max(14, box.width * 0.052), ink);
  ctx.restore();
}

function drawComparison(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, ink: string, muted: string, locale: 'es' | 'en'): void {
  const pad = box.width * 0.12;
  const left = box.x + pad;
  const right = box.x + box.width - pad;
  const top = box.y + box.height * 0.15;
  drawText(ctx, sceneText('papercraft', locale, 'guide'), left, top + box.height * 0.09, 'Fraunces', 560, Math.max(24, box.width * 0.13), ink);
  drawText(ctx, sceneText('papercraft', locale, 'reading'), left, top + box.height * 0.21, 'Nunito Sans', 800, Math.max(12, box.width * 0.045), muted);
  drawRule(ctx, left, top + box.height * 0.24, right, '#D7CBB9', 1.2);
  drawRule(ctx, left, top + box.height * 0.36, right * 0.89, '#8F7C68', 2);
  drawRule(ctx, left, top + box.height * 0.41, right * 0.83, '#C9B8A2', 1.2);
  drawText(ctx, sceneText('papercraft', locale, 'signal'), left, top + box.height * 0.56, 'Nunito Sans', 800, Math.max(12, box.width * 0.045), muted);
  drawRule(ctx, left, top + box.height * 0.60, right, '#D7CBB9', 1.2);
  drawRule(ctx, left, top + box.height * 0.70, right * 0.9, '#8F7C68', 2);
}

function drawChecklist(ctx: ReturnType<typeof canvasFor>['ctx'], box: NarrativeRect, ink: string, muted: string, accent: string, locale: 'es' | 'en'): void {
  const pad = box.width * 0.12;
  const left = box.x + pad;
  const size = Math.max(16, box.width * 0.07);
  drawText(ctx, sceneText('papercraft', locale, 'reviewList'), left, box.y + box.height * 0.25, 'Fraunces', 560, Math.max(22, box.width * 0.095), ink);
  const rows = [
    { label: sceneText('papercraft', locale, 'readGuide'), y: box.y + box.height * 0.42 },
    { label: sceneText('papercraft', locale, 'markDatum'), y: box.y + box.height * 0.57 },
    { label: sceneText('papercraft', locale, 'leaveInReview'), y: box.y + box.height * 0.72 },
  ];
  for (const [index, row] of rows.entries()) {
    ctx.strokeStyle = index === 1 ? accent : '#9B8570';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(left, row.y - size * 0.75, size, size);
    drawText(ctx, row.label, left + size * 1.55, row.y, 'Nunito Sans', 800, Math.max(11, box.width * 0.038), index === 1 ? ink : muted);
    if (index < rows.length - 1) drawRule(ctx, left, row.y + size * 0.68, box.x + box.width * 0.87, '#E4D8C6', 1);
  }
}

function renderFrame(context: NarrativeRenderContext): Uint8ClampedArray {
  const { brief, layout, frame, phase, object } = context;
  const guide = object as PaperGuide;
  const { ctx } = canvasFor(brief.output.width, brief.output.height);
  const art = layout.reservedArtArea;
  const preset = getStyle('papercraft');
  const box = artBox(art);
  const backingSheet: NarrativeRect = { ...box, x: box.x + box.width * 0.045, y: box.y + box.height * 0.035, width: box.width * 0.94, height: box.height * 0.95 };
  const middleSheet: NarrativeRect = { ...box, x: box.x - box.width * 0.028, y: box.y + box.height * 0.018, width: box.width * 0.97, height: box.height * 0.96 };
  ctx.save();
  ctx.translate(box.x + box.width / 2, box.y + box.height / 2);
  ctx.rotate(guide.rotation * Math.PI / 180);
  ctx.translate(-(box.x + box.width / 2), -(box.y + box.height / 2));
  const backingColor = guide.backing === 'sage' ? preset.palette.accent2 : preset.palette.accent3;
  fillLayer(ctx, backingSheet, backingColor, guide.cutVariant, guide.edgeProfile, rgba(preset.palette.ink, 0.35), { blur: 27, y: 20, alpha: 0.32 });
  fillLayer(ctx, middleSheet, '#F1E0C8', (guide.cutVariant + 1) % 3, guide.edgeProfile, '#C7B79E', { blur: 13, y: 10, alpha: 0.22 });
  drawFolderTab(ctx, box, backingColor);
  fillLayer(ctx, box, preset.palette.surface, guide.cutVariant, guide.edgeProfile, '#CBB99F', { blur: 4, y: 4, alpha: 0.22 });
  drawPaperGrain(ctx, box, guide.grainSeed);
  drawCutoutWindow(ctx, box, backingColor, preset.palette.ink);
  const semantic = context.semantic;
  const semanticMode = Boolean(semantic && semantic.primitive !== 'legacy-illustration');
  if (semanticMode && semantic) drawPapercraftSemantic(ctx, semantic, box, { ...preset.palette, cardScale: layout.cardScale }, brief.locale);
  else if (guide.composition === 'checklist') drawChecklist(ctx, box, preset.palette.ink, preset.palette.muted, preset.palette.accent, brief.locale);
  else drawComparison(ctx, box, preset.palette.ink, preset.palette.muted, brief.locale);
  drawTornRibbon(ctx, box, guide.tapeAngle, preset.palette.accent4, preset.palette.ink);
  const outgoing = stateRank(brief.phases[frame.fromPhaseIndex]!);
  const incoming = stateRank(brief.phases[frame.toPhaseIndex]!);
  const eased = phaseMarkProgress(frame, (value) => cubicBezierEase(value, 0.4, 0, 0.2, 1));
  const level = outgoing + (incoming - outgoing) * eased;
  const stampText = workflowBadgeText('papercraft', brief.locale, brief.workflowStatus, brief.badgePolicy, brief.badgeText);
  if (!semanticMode) drawSignal(ctx, box, Math.max(0, Math.min(1, level)), preset.palette.accent);
  if (stampText) drawReviewStamp(ctx, box, Math.max(0, level - 1), stampText, preset.palette.accent, preset.palette.ink);
  ctx.restore();
  return ctx.getImageData(0, 0, brief.output.width, brief.output.height).data;
}

export const papercraftNarrativeScene: NarrativeScene = {
  style: 'papercraft',
  version: 'papercraft-editorial/1.1.0',
  vocabulary: sceneVocabulary('value-driven'),
  supportsAspect(aspect) {
    return [16 / 9, 1].some((ratio) => Math.abs(aspect - ratio) / ratio < 0.015);
  },
  createObject(brief, rng) {
    return Object.freeze({
      identity: 'guia-de-revision',
      composition: compositionFor(brief),
      rotation: (rng() - 0.5) * 1.2,
      cutVariant: Math.floor(rng() * 3),
      backing: rng() < 0.5 ? 'sage' : 'sky',
      tapeAngle: 5.5 + rng() * 2,
      edgeProfile: Object.freeze(Array.from({ length: 24 }, () => rng())),
      grainSeed: Math.floor(rng() * 0xffff_ffff) >>> 0,
    } satisfies PaperGuide);
  },
  objectRegions(context) {
    if (!context.semantic || context.semantic.primitive === 'legacy-illustration') return [];
    return papercraftObjectRegions(context, artBox(context.layout.reservedArtArea));
  },
  renderFrame,
};
