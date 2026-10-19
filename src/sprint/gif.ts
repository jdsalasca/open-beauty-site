import { writeFile } from 'node:fs/promises';
import gifenc from 'gifenc';
import type { SKRSContext2D } from '@napi-rs/canvas';
import type { GifResult, StyleSlug } from '../types.js';
import { getStyle } from '../styles/presets.js';
import { canvasFor } from '../canvas.js';
import { drawGifFrame, mapIndices, STYLE_DITHER } from '../gif.js';
import { t as translate } from '../page/common.js';
import { sprintBrand, type SprintCapacity, type SprintData } from './data.js';

const { GIFEncoder, quantize } = gifenc;

export type SprintGifKind = 'review' | 'retro' | 'planning';

export interface SprintGifOptions {
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
}

const MIN_SIZE = 240;
const MAX_SIZE = 1200;
const MIN_FPS = 8;
const MAX_FPS = 30;
const MIN_DURATION = 1;
const MAX_DURATION = 6;
const MIN_FRAMES = 8;
const MAX_FRAMES = 180;
const PALETTE_COLORS = 128;
const PALETTE_SAMPLES = 6;

/** Fonts that are actually registered with @napi-rs/canvas. */
const GIF_FONTS: Record<StyleSlug, string> = {
  renaissance: 'EB Garamond',
  brutalist: 'Archivo Black',
  papercraft: 'Fraunces',
  artdeco: 'EB Garamond',
  isotype: 'Space Mono',
  opart: 'Archivo Black',
  ukiyoe: 'EB Garamond',
  bestiary: 'EB Garamond',
  psychedelic: 'Archivo Black',
  memphis: 'Archivo Black',
  vaporwave: 'Space Mono',
  galactic: 'Archivo Black',
  nature: 'EB Garamond',
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function easeOutCubic(t: number): number {
  return 1 - (1 - clamp(t, 0, 1)) ** 3;
}

function rgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((char) => char + char).join('') : value;
  const number = Number.parseInt(full.slice(0, 6), 16);
  return `rgba(${(number >> 16) & 255},${(number >> 8) & 255},${number & 255},${alpha})`;
}

function roundRect(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, radius: number): void {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function setFont(ctx: SKRSContext2D, size: number, family: string, weight: number, color: string): void {
  ctx.font = `${weight} ${Math.round(size)}px "${family}"`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function wrapLines(ctx: SKRSContext2D, text: string, maxWidth: number, font: () => void): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let line = words[0] ?? '';
  font();
  for (let index = 1; index < words.length; index += 1) {
    const candidate = `${line} ${words[index]}`;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = words[index] ?? '';
    }
  }
  lines.push(line);
  return lines;
}

interface Geometry {
  width: number;
  height: number;
  fps: number;
  duration: number;
  frames: number;
}

function resolveGeometry(options: SprintGifOptions): Geometry {
  const width = clamp(Math.round(options.width ?? 800), MIN_SIZE, MAX_SIZE);
  const height = clamp(Math.round(options.height ?? 800), MIN_SIZE, MAX_SIZE);
  const fps = clamp(Math.round(options.fps ?? 20), MIN_FPS, MAX_FPS);
  const duration = clamp(options.duration ?? 2.4, MIN_DURATION, MAX_DURATION);
  const frames = clamp(Math.round(fps * duration), MIN_FRAMES, MAX_FRAMES);
  return { width, height, fps, duration, frames };
}

function headlineNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
}

function drawHeader(ctx: SKRSContext2D, style: StyleSlug, data: SprintData, kind: SprintGifKind, t: number, w: number, h: number): void {
  const preset = getStyle(style);
  const p = preset.palette;
  const family = GIF_FONTS[style];
  const panelX = w * 0.07;
  const panelW = w * 0.86;
  const appear = easeOutCubic(clamp(t / 0.35, 0, 1));

  ctx.save();
  setFont(ctx, h * 0.03, family, 700, p.ink);
  ctx.globalAlpha = appear;
  ctx.fillText(sprintBrand(data), panelX, h * 0.105);
  const label = `Sprint ${data.sprint.id} · ${translate(data.locale, kind === 'review' ? 'Review' : kind === 'retro' ? 'Retrospectiva' : 'Planning', kind === 'review' ? 'Review' : kind === 'retro' ? 'Retrospective' : 'Planning')}`;
  setFont(ctx, h * 0.021, 'Space Mono', 400, p.muted);
  ctx.textAlign = 'right';
  ctx.fillText(label, panelX + panelW, h * 0.105);
  ctx.textAlign = 'left';
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(panelX, h * 0.125);
  ctx.lineTo(panelX + panelW * appear, h * 0.125);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function panelFor(ctx: SKRSContext2D, style: StyleSlug, w: number, h: number): { x: number; y: number; w: number; h: number } {
  const preset = getStyle(style);
  const p = preset.palette;
  const radius = clamp(preset.rules.radius[0] ?? 0, 0, 18);
  const x = w * 0.07;
  const y = h * 0.16;
  const width = w * 0.86;
  const height = h * 0.77;
  ctx.save();
  roundRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = rgba(p.surface, 0.93);
  ctx.fill();
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = Math.max(2, preset.rules.borderWidths[0] ?? 2);
  ctx.stroke();
  ctx.restore();
  return { x, y, w: width, h: height };
}

function drawReview(ctx: SKRSContext2D, style: StyleSlug, data: SprintData, t: number, w: number, h: number, panel: { x: number; y: number; w: number; h: number }): void {
  const preset = getStyle(style);
  const p = preset.palette;
  const family = GIF_FONTS[style];
  const entries = data.velocity.slice(-5);
  const done = data.stories.filter((story) => story.status === 'done');
  const donePoints = done.reduce((sum, story) => sum + (story.points ?? 0), 0);
  const totalPoints = entries.length ? entries[entries.length - 1]?.done ?? donePoints : donePoints;

  ctx.save();
  setFont(ctx, h * 0.11, family, 700, p.accent);
  const shown = Math.round(totalPoints * easeOutCubic(clamp(t / 0.75, 0, 1)));
  ctx.fillText(headlineNumber(shown), panel.x + 16, panel.y + h * 0.15);
  const width = ctx.measureText(headlineNumber(shown)).width;
  setFont(ctx, h * 0.028, 'Nunito Sans', 800, p.ink);
  ctx.fillText(translate(data.locale, 'puntos hechos', 'points done'), panel.x + 22 + width, panel.y + h * 0.15);
  setFont(ctx, h * 0.022, 'Space Mono', 400, p.muted);
  ctx.fillText(
    `${done.length}/${data.stories.length} ${translate(data.locale, 'historias cerradas', 'stories done')}`,
    panel.x + 16,
    panel.y + h * 0.205,
  );
  ctx.restore();

  const baseY = panel.y + panel.h * 0.68;
  const plotTop = panel.y + panel.h * 0.3;
  const plotHeight = baseY - plotTop;
  const left = panel.x + panel.w * 0.08;
  const plotWidth = panel.w * 0.86;
  const max = Math.max(1, ...entries.map((item) => Math.max(item.committed, item.done)));
  const groupWidth = plotWidth / Math.max(1, entries.length);
  const barWidth = Math.min(w * 0.035, groupWidth * 0.24);

  ctx.save();
  ctx.strokeStyle = rgba(p.ink, 0.35);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left, baseY);
  ctx.lineTo(left + plotWidth, baseY);
  ctx.stroke();

  entries.forEach((item, index) => {
    const grow = easeOutCubic(clamp((t - index * 0.07) / 0.55, 0, 1));
    const center = left + groupWidth * (index + 0.5);
    const committedHeight = (item.committed / max) * plotHeight * grow;
    const doneHeight = (item.done / max) * plotHeight * grow;
    ctx.fillStyle = rgba(p.surface, 0.9);
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = Math.max(2, preset.rules.borderWidths[0] ?? 2);
    ctx.beginPath();
    ctx.rect(center - barWidth - 3, baseY - committedHeight, barWidth, committedHeight);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = p.accent;
    ctx.fillRect(center + 3, baseY - doneHeight, barWidth, doneHeight);
    setFont(ctx, h * 0.018, 'Space Mono', 400, p.muted);
    ctx.textAlign = 'center';
    ctx.fillText(item.sprint, center, baseY + h * 0.035);
    ctx.fillStyle = p.ink;
    ctx.fillText(headlineNumber(item.done), center + 3 + barWidth / 2, baseY - doneHeight - h * 0.012);
    ctx.textAlign = 'left';
  });
  ctx.restore();

  if (!entries.length) {
    ctx.save();
    setFont(ctx, h * 0.03, 'Nunito Sans', 700, p.muted);
    ctx.fillText(translate(data.locale, 'Sin datos de velocidad en este brief.', 'No velocity data in this brief.'), left, baseY - h * 0.05);
    ctx.restore();
  }
}

function drawRetro(ctx: SKRSContext2D, style: StyleSlug, data: SprintData, t: number, w: number, h: number, panel: { x: number; y: number; w: number; h: number }): void {
  const preset = getStyle(style);
  const p = preset.palette;
  const family = GIF_FONTS[style];
  const items = data.retro.actions.length
    ? data.retro.actions.map((action) => ({ text: action.what, meta: [action.owner, action.due].filter(Boolean).join(' · ') }))
    : data.retro.toImprove.map((text) => ({ text, meta: '' }));
  const shown = items.slice(0, 5);

  ctx.save();
  setFont(ctx, h * 0.024, 'Space Mono', 400, p.muted);
  ctx.fillText(translate(data.locale, 'Acciones del sprint', 'Sprint actions'), panel.x + 16, panel.y + h * 0.07);
  ctx.restore();

  if (!shown.length) {
    ctx.save();
    setFont(ctx, h * 0.03, 'Nunito Sans', 700, p.muted);
    ctx.fillText(translate(data.locale, 'Sin acuerdos registrados.', 'No agreements recorded.'), panel.x + 16, panel.y + h * 0.35);
    ctx.restore();
    return;
  }

  const segment = 1 / shown.length;
  const position = clamp(t, 0, 0.9999) / segment;
  const active = Math.min(shown.length - 1, Math.floor(position));
  const local = position - active;
  const alpha = easeOutCubic(clamp(local / 0.2, 0, 1)) * (1 - easeOutCubic(clamp((local - 0.78) / 0.22, 0, 1)));
  const item = shown[active]!;

  ctx.save();
  ctx.globalAlpha = 0.25 + alpha * 0.75;
  const textX = panel.x + panel.w * 0.1;
  const maxWidth = panel.w * 0.8;
  const size = h * 0.055;
  const lines = wrapLines(ctx, item.text, maxWidth, () => setFont(ctx, size, family, 700, p.ink)).slice(0, 3);
  lines.forEach((line, index) => {
    setFont(ctx, size, family, 700, p.ink);
    ctx.fillText(line, textX, panel.y + panel.h * 0.36 + index * size * 1.14);
  });
  if (item.meta) {
    setFont(ctx, h * 0.022, 'Nunito Sans', 700, p.muted);
    ctx.fillText(item.meta, textX, panel.y + panel.h * 0.36 + lines.length * size * 1.14 + h * 0.03);
  }
  ctx.globalAlpha = 1;
  setFont(ctx, h * 0.02, 'Space Mono', 400, p.accent);
  ctx.textAlign = 'right';
  ctx.fillText(`${active + 1} / ${shown.length}`, panel.x + panel.w - 16, panel.y + panel.h * 0.9);
  ctx.textAlign = 'left';
  ctx.restore();
}

function drawCapacity(ctx: SKRSContext2D, style: StyleSlug, data: SprintData, t: number, w: number, h: number, panel: { x: number; y: number; w: number; h: number }): void {
  const preset = getStyle(style);
  const p = preset.palette;
  const family = GIF_FONTS[style];
  const items: SprintCapacity[] = data.capacity.slice(0, 6);
  const totalDays = items.reduce((sum, item) => sum + item.days, 0);
  const max = Math.max(1, ...items.map((item) => item.days));

  ctx.save();
  setFont(ctx, h * 0.026, family, 700, p.ink);
  ctx.fillText(translate(data.locale, 'Capacidad del próximo sprint', 'Next sprint capacity'), panel.x + 16, panel.y + h * 0.075);
  setFont(ctx, h * 0.02, 'Space Mono', 400, p.muted);
  ctx.fillText(
    `${headlineNumber(totalDays)} ${translate(data.locale, 'días de foco', 'focus days')}`,
    panel.x + 16,
    panel.y + h * 0.11,
  );
  ctx.restore();

  if (!items.length) {
    ctx.save();
    setFont(ctx, h * 0.03, 'Nunito Sans', 700, p.muted);
    ctx.fillText(translate(data.locale, 'Sin capacidad declarada.', 'No declared capacity.'), panel.x + 16, panel.y + h * 0.3);
    ctx.restore();
    return;
  }

  const rowHeight = Math.min(h * 0.1, (panel.h * 0.62) / items.length);
  const labelWidth = panel.w * 0.36;
  const barX = panel.x + labelWidth + 10;
  const barMax = panel.w - labelWidth - panel.w * 0.12 - 20;

  ctx.save();
  items.forEach((item, index) => {
    const y = panel.y + panel.h * 0.24 + index * rowHeight;
    const grow = easeOutCubic(clamp((t - index * 0.06) / 0.6, 0, 1));
    setFont(ctx, h * 0.024, 'Nunito Sans', 700, p.ink);
    ctx.textAlign = 'right';
    ctx.fillText(item.person, barX - 12, y + rowHeight * 0.42);
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba(p.surface, 0.9);
    ctx.strokeStyle = rgba(p.muted, 0.6);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(barX, y + rowHeight * 0.18, barMax, rowHeight * 0.42);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = p.accent3;
    ctx.beginPath();
    ctx.rect(barX, y + rowHeight * 0.18, barMax * (item.days / max) * grow, rowHeight * 0.42);
    ctx.fill();
    setFont(ctx, h * 0.02, 'Space Mono', 400, p.ink);
    ctx.fillText(headlineNumber(item.days), barX + barMax + 8, y + rowHeight * 0.52);
  });
  ctx.restore();
}

/** One fully composited frame: style background + data overlay. */
export function drawSprintFrame(
  style: StyleSlug,
  kind: SprintGifKind,
  data: SprintData,
  t: number,
  width: number,
  height: number,
): Uint8ClampedArray {
  const clamped = clamp(t, 0, 1);
  const base = drawGifFrame(
    style,
    { text: '', subtitle: '', template: 'loop', seed: 11, maxxing: data.maxxing },
    clamped,
    width,
    height,
  );
  const { ctx } = canvasFor(width, height);
  const image = ctx.createImageData(width, height);
  image.data.set(base);
  ctx.putImageData(image, 0, 0);
  drawHeader(ctx, style, data, kind, clamped, width, height);
  const panel = panelFor(ctx, style, width, height);
  if (kind === 'review') drawReview(ctx, style, data, clamped, width, height, panel);
  else if (kind === 'retro') drawRetro(ctx, style, data, clamped, width, height, panel);
  else drawCapacity(ctx, style, data, clamped, width, height, panel);
  return ctx.getImageData(0, 0, width, height).data;
}

function buildPaletteLut(palette: number[][]): Uint8Array {
  const lut = new Uint8Array(32 * 32 * 32);
  for (let r = 0; r < 32; r += 1) {
    for (let g = 0; g < 32; g += 1) {
      for (let b = 0; b < 32; b += 1) {
        const rr = r * 8 + 4;
        const gg = g * 8 + 4;
        const bb = b * 8 + 4;
        let best = 0;
        let bestDistance = Number.POSITIVE_INFINITY;
        for (let index = 0; index < palette.length; index += 1) {
          const color = palette[index]!;
          const dr = color[0]! - rr;
          const dg = color[1]! - gg;
          const db = color[2]! - bb;
          const distance = dr * dr + dg * dg + db * db;
          if (distance < bestDistance) {
            bestDistance = distance;
            best = index;
          }
        }
        lut[(r << 10) | (g << 5) | b] = best;
      }
    }
  }
  return lut;
}

function globalPalette(samples: Uint8ClampedArray[], colors: number): number[][] {
  const stride = 4;
  let total = 0;
  for (const sample of samples) total += Math.ceil(sample.length / 4 / stride);
  const merged = new Uint8ClampedArray(total * 4);
  let cursor = 0;
  for (const sample of samples) {
    const pixels = sample.length / 4;
    for (let index = 0; index < pixels; index += stride) {
      const o = index * 4;
      merged[cursor] = sample[o]!;
      merged[cursor + 1] = sample[o + 1]!;
      merged[cursor + 2] = sample[o + 2]!;
      merged[cursor + 3] = sample[o + 3]!;
      cursor += 4;
    }
  }
  return quantize(merged.subarray(0, cursor), colors, { format: 'rgb444' });
}

/** Encode the three data-driven sprint GIFs. Deterministic for a given brief. */
export async function createSprintGif(
  style: StyleSlug,
  kind: SprintGifKind,
  data: SprintData,
  output: string,
  options: SprintGifOptions = {},
): Promise<GifResult> {
  const { width, height, fps, duration, frames } = resolveGeometry(options);
  const dither = STYLE_DITHER[style] ?? 'none';

  const sampleCount = Math.min(PALETTE_SAMPLES, frames);
  const samples: Uint8ClampedArray[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const frameIndex = Math.round((index * (frames - 1)) / Math.max(1, sampleCount - 1));
    samples.push(drawSprintFrame(style, kind, data, frameIndex / frames, width, height));
  }
  const palette = globalPalette(samples, PALETTE_COLORS);
  const lut = buildPaletteLut(palette);
  const transparentIndex = palette.length;
  palette.push([0, 0, 0]);

  const gif = GIFEncoder();
  let previous: Uint8Array | undefined;
  for (let frame = 0; frame < frames; frame += 1) {
    const t = frame / frames;
    const pixels = drawSprintFrame(style, kind, data, t, width, height);
    const index = mapIndices(pixels, palette, lut, width, height, dither);
    const delay = Math.round(1000 / fps);
    if (!previous) {
      gif.writeFrame(index, width, height, { palette, delay, repeat: 0 });
    } else {
      const delta = new Uint8Array(index.length);
      for (let i = 0; i < index.length; i += 1) {
        delta[i] = index[i] === previous[i] ? transparentIndex : index[i]!;
      }
      gif.writeFrame(delta, width, height, { delay, transparent: true, transparentIndex, dispose: 1 });
    }
    previous = index;
  }
  gif.finish();
  const bytes = gif.bytes();
  await writeFile(output, bytes);
  return { path: output, width, height, fps, frames, bytes: bytes.byteLength };
}
