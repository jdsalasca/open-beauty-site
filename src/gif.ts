import { writeFile } from 'node:fs/promises';
import gifenc from 'gifenc';
import type { SKRSContext2D } from '@napi-rs/canvas';
import type { StylePreset, StyleSlug } from './types.js';
import type { GifDitherMode, GifQualityOptions, SafeGifResult } from './types/gif.js';
import { getStyle, isStyleSlug } from './styles/presets.js';
import { canvasFor } from './canvas.js';
import { BeautyError } from './page/common.js';

const { GIFEncoder, quantize } = gifenc;

const TAU = Math.PI * 2;

type Template = 'title' | 'loop' | 'poster';

interface FrameEnv {
  ctx: SKRSContext2D;
  w: number;
  h: number;
  preset: StylePreset;
  text: string;
  subtitle?: string;
  /** Loop position, 0..1. 'poster' frames are frozen at 0. */
  t: number;
  /** Eased arc derived from `t`: 0 at both ends, 1 mid-loop (see loopPhase). */
  phase: number;
  seed: number;
}

interface FontSpec {
  family: string;
  size: number;
  weight?: number;
  italic?: boolean;
  color: string;
  tracking?: number;
}

interface TitleLayout {
  lines: string[];
  size: number;
  lineHeight: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Eased, near-symmetric arc over one loop: 0 at t=0 and t=1, 1 at the midpoint,
 * with zero velocity at both ends. Every GIF therefore opens on the fully
 * composed poster frame (t=0) and eases back into it, so the restart of the
 * loop is imperceptible while the middle of the cycle carries the motion.
 */
function loopPhase(t: number): number {
  return 0.5 - 0.5 * Math.cos(TAU * clamp(t, 0, 1));
}

/* ------------------------------------------------------------------ */
/* Per-style rendering profiles                                        */
/* ------------------------------------------------------------------ */

/** Per-style dithering: gradients get error diffusion, flat styles stay crisp. */
export const STYLE_DITHER: Record<StyleSlug, GifDitherMode> = {
  renaissance: 'floyd-steinberg',
  vaporwave: 'ordered',
  galactic: 'ordered',
  ukiyoe: 'ordered',
  nature: 'ordered',
  psychedelic: 'ordered',
  brutalist: 'none',
  papercraft: 'none',
  artdeco: 'none',
  isotype: 'none',
  opart: 'none',
  bestiary: 'none',
  memphis: 'none',
};

const DEFAULT_DITHER: GifDitherMode = 'none';
const DEFAULT_PALETTE = 128;
const ORDERED_SPREAD = 34;
const FS_TILE = 64;

const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
];

/* ------------------------------------------------------------------ */
/* Global palette + dithering                                          */
/* ------------------------------------------------------------------ */

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

/** Map RGBA pixels to palette indices, with optional ordered/Floyd-Steinberg dithering. */
export function mapIndices(
  data: Uint8ClampedArray,
  palette: number[][],
  lut: Uint8Array,
  w: number,
  h: number,
  mode: GifDitherMode,
): Uint8Array {
  const count = w * h;
  const out = new Uint8Array(count);
  if (mode === 'none') {
    for (let i = 0; i < count; i += 1) {
      const o = i * 4;
      out[i] = lut[((data[o]! >> 3) << 10) | ((data[o + 1]! >> 3) << 5) | (data[o + 2]! >> 3)]!;
    }
    return out;
  }
  if (mode === 'ordered') {
    for (let y = 0; y < h; y += 1) {
      const row = (y & 7) * 8;
      for (let x = 0; x < w; x += 1) {
        const i = y * w + x;
        const o = i * 4;
        const shift = ((BAYER8[row + (x & 7)]! + 0.5) / 64 - 0.5) * ORDERED_SPREAD;
        const r = clamp(data[o]! + shift, 0, 255);
        const g = clamp(data[o + 1]! + shift, 0, 255);
        const b = clamp(data[o + 2]! + shift, 0, 255);
        out[i] = lut[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)]!;
      }
    }
    return out;
  }
  const buffer = new Float32Array(data);
  // Error diffusion runs in independent tiles: a change inside one tile never
  // ripples into static neighbours, so frame deltas stay small and local.
  for (let ty = 0; ty < h; ty += FS_TILE) {
    const yEnd = Math.min(ty + FS_TILE, h);
    for (let tx = 0; tx < w; tx += FS_TILE) {
      const xEnd = Math.min(tx + FS_TILE, w);
      for (let y = ty; y < yEnd; y += 1) {
        for (let x = tx; x < xEnd; x += 1) {
          const o = (y * w + x) * 4;
          const r = buffer[o]!;
          const g = buffer[o + 1]!;
          const b = buffer[o + 2]!;
          // Diffused error can push channels outside 0..255; clamp before the LUT.
          const index = lut[
            ((clamp(r, 0, 255) >> 3) << 10) | ((clamp(g, 0, 255) >> 3) << 5) | ((clamp(b, 0, 255) >> 3))
          ]!;
          const color = palette[index]!;
          out[y * w + x] = index;
          const er = r - color[0]!;
          const eg = g - color[1]!;
          const eb = b - color[2]!;
          if (x + 1 < xEnd) {
            const p = o + 4;
            buffer[p] = buffer[p]! + (er * 7) / 16;
            buffer[p + 1] = buffer[p + 1]! + (eg * 7) / 16;
            buffer[p + 2] = buffer[p + 2]! + (eb * 7) / 16;
          }
          if (y + 1 < yEnd) {
            const below = o + w * 4;
            if (x > tx) {
              const p = below - 4;
              buffer[p] = buffer[p]! + (er * 3) / 16;
              buffer[p + 1] = buffer[p + 1]! + (eg * 3) / 16;
              buffer[p + 2] = buffer[p + 2]! + (eb * 3) / 16;
            }
            buffer[below] = buffer[below]! + (er * 5) / 16;
            buffer[below + 1] = buffer[below + 1]! + (eg * 5) / 16;
            buffer[below + 2] = buffer[below + 2]! + (eb * 5) / 16;
            if (x + 1 < xEnd) {
              const p = below + 4;
              buffer[p] = buffer[p]! + er / 16;
              buffer[p + 1] = buffer[p + 1]! + eg / 16;
              buffer[p + 2] = buffer[p + 2]! + eb / 16;
            }
          }
        }
      }
    }
  }
  return out;
}

/** One global palette per GIF, sampled from frames spread across the loop. */
function globalPalette(samples: Uint8ClampedArray[], colors: number): number[][] {
  const stride = 4;
  let total = 0;
  for (const sample of samples) total += Math.ceil(sample.length / 4 / stride);
  const merged = new Uint8ClampedArray(total * 4);
  let cursor = 0;
  for (const sample of samples) {
    const px = sample.length / 4;
    for (let i = 0; i < px; i += stride) {
      const o = i * 4;
      merged[cursor] = sample[o]!;
      merged[cursor + 1] = sample[o + 1]!;
      merged[cursor + 2] = sample[o + 2]!;
      merged[cursor + 3] = sample[o + 3]!;
      cursor += 4;
    }
  }
  return quantize(merged.subarray(0, cursor), colors, { format: 'rgb444' });
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((char) => char + char).join('') : value;
  const number = Number.parseInt(full.slice(0, 6), 16);
  return `rgba(${(number >> 16) & 255},${(number >> 8) & 255},${number & 255},${alpha})`;
}

function setFont(ctx: SKRSContext2D, font: FontSpec): void {
  ctx.font = `${font.italic ? 'italic ' : ''}${font.weight ?? 400} ${font.size}px "${font.family}"`;
  ctx.fillStyle = font.color;
  ctx.textBaseline = 'alphabetic';
}

function widthOf(ctx: SKRSContext2D, text: string, font: FontSpec): number {
  setFont(ctx, font);
  return ctx.measureText(text).width;
}

function wrapLines(ctx: SKRSContext2D, text: string, maxWidth: number, font: FontSpec): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const lines: string[] = [];
  let line = words[0] ?? '';
  for (let index = 1; index < words.length; index += 1) {
    const candidate = `${line} ${words[index]}`;
    if (widthOf(ctx, candidate, font) <= maxWidth || line.length === 0) {
      line = candidate;
    } else {
      lines.push(line);
      line = words[index] ?? '';
    }
  }
  lines.push(line);
  return lines;
}

function layoutTitle(
  ctx: SKRSContext2D,
  text: string,
  options: {
    maxWidth: number;
    maxLines: number;
    maxSize: number;
    minSize: number;
    family: string;
    weight?: number;
    lineHeight: number;
  },
): TitleLayout {
  for (let size = Math.floor(options.maxSize); size >= options.minSize; size -= 2) {
    const font: FontSpec = { family: options.family, size, weight: options.weight ?? 400, color: '#000' };
    const lines = wrapLines(ctx, text, options.maxWidth, font);
    const fits = lines.length <= options.maxLines && lines.every((line) => widthOf(ctx, line, font) <= options.maxWidth);
    if (fits) {
      return { lines, size, lineHeight: size * options.lineHeight };
    }
  }
  const font: FontSpec = {
    family: options.family,
    size: options.minSize,
    weight: options.weight ?? 400,
    color: '#000',
  };
  return {
    lines: wrapLines(ctx, text, options.maxWidth, font).slice(0, options.maxLines),
    size: options.minSize,
    lineHeight: options.minSize * options.lineHeight,
  };
}

function drawTracked(
  ctx: SKRSContext2D,
  text: string,
  x: number,
  y: number,
  font: FontSpec,
  tracking: number,
  align: 'left' | 'center' | 'right' = 'center',
): number {
  const chars = [...text];
  setFont(ctx, font);
  const widths = chars.map((char) => ctx.measureText(char).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + tracking * Math.max(0, chars.length - 1);
  let cursor = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  for (let index = 0; index < chars.length; index += 1) {
    ctx.fillText(chars[index] ?? '', cursor, y);
    cursor += (widths[index] ?? 0) + tracking;
  }
  return total;
}

function drawTitleLines(
  ctx: SKRSContext2D,
  lines: string[],
  cx: number,
  firstBaseline: number,
  lineHeight: number,
  font: FontSpec,
  accent?: { color: string; italic?: boolean },
): void {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const y = firstBaseline + index * lineHeight;
    const isLast = index === lines.length - 1;
    if (isLast && accent) {
      const words = line.split(' ');
      const last = words.pop() ?? '';
      const prefix = words.join(' ');
      const accentFont: FontSpec = { ...font, italic: accent.italic ?? true, color: accent.color };
      if (!prefix) {
        setFont(ctx, accentFont);
        ctx.textAlign = 'center';
        ctx.fillText(line, cx, y);
        continue;
      }
      const prefixFont: FontSpec = { ...font };
      const prefixWidth = widthOf(ctx, `${prefix} `, prefixFont);
      const accentWidth = widthOf(ctx, last, accentFont);
      const start = cx - (prefixWidth + accentWidth) / 2;
      setFont(ctx, prefixFont);
      ctx.textAlign = 'left';
      ctx.fillText(prefix, start, y);
      setFont(ctx, accentFont);
      ctx.textAlign = 'left';
      ctx.fillText(last, start + prefixWidth, y);
    } else {
      setFont(ctx, font);
      ctx.textAlign = 'center';
      ctx.fillText(line, cx, y);
    }
  }
  ctx.textAlign = 'left';
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

function blobPath(
  ctx: SKRSContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rng: () => number,
  points = 8,
): void {
  const knots = Array.from({ length: points }, (_, index) => {
    const angle = (index / points) * TAU;
    const radius = 0.82 + rng() * 0.26;
    return [cx + Math.cos(angle) * rx * radius, cy + Math.sin(angle) * ry * radius] as const;
  });
  ctx.beginPath();
  const first = knots[0]!;
  const last = knots[points - 1]!;
  ctx.moveTo((first[0] + last[0]) / 2, (first[1] + last[1]) / 2);
  for (let index = 0; index < points; index += 1) {
    const current = knots[index]!;
    const next = knots[(index + 1) % points]!;
    ctx.quadraticCurveTo(current[0], current[1], (current[0] + next[0]) / 2, (current[1] + next[1]) / 2);
  }
  ctx.closePath();
}

function drawNoise(ctx: SKRSContext2D, w: number, h: number, color: string, count: number, alpha: number, rng: () => number): void {
  ctx.save();
  ctx.fillStyle = rgba(color, alpha);
  for (let index = 0; index < count; index += 1) {
    const x = rng() * w;
    const y = rng() * h;
    ctx.fillRect(x, y, rng() > 0.85 ? 2 : 1, 1);
  }
  ctx.restore();
}

function drawSun(ctx: SKRSContext2D, x: number, y: number, radius: number, rotation: number, color: string, lineWidth: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.stroke();
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * TAU;
    const inner = radius * 1.16;
    const outer = radius * (index % 2 === 0 ? 1.44 : 1.32);
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Renaissance                                                         */
/* ------------------------------------------------------------------ */

function frameRenaissance(env: FrameEnv): void {
  const { ctx, w, h, preset, text, subtitle, t, phase, seed } = env;
  const p = preset.palette;
  const s = Math.min(w, h);
  const rng = mulberry32(seed * 31 + 7);
  const titleFontFamily = 'EB Garamond';

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);

  const roseWash = ctx.createRadialGradient(w * 0.18, h * 0.2, 0, w * 0.18, h * 0.2, w * 0.62);
  roseWash.addColorStop(0, rgba(p.accent2, 0.28));
  roseWash.addColorStop(1, rgba(p.accent2, 0));
  ctx.fillStyle = roseWash;
  ctx.fillRect(0, 0, w, h);

  const blueWash = ctx.createRadialGradient(w * 0.88, h * 0.78, 0, w * 0.88, h * 0.78, w * 0.58);
  blueWash.addColorStop(0, rgba(p.accent3, 0.36));
  blueWash.addColorStop(1, rgba(p.accent3, 0));
  ctx.fillStyle = blueWash;
  ctx.fillRect(0, 0, w, h);

  drawNoise(ctx, w, h, p.ink, 1400, 0.05, rng);

  const margin = s * 0.055;
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = Math.max(1, s * 0.0018);
  ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);
  ctx.strokeStyle = rgba(p.accent, 0.65);
  ctx.strokeRect(margin + s * 0.012, margin + s * 0.012, w - (margin + s * 0.012) * 2, h - (margin + s * 0.012) * 2);

  const archX = w * 0.2;
  const archW = w * 0.6;
  const archTop = h * 0.15;
  const archBottom = h * 0.84;
  const archR = archW / 2;

  const archPath = (): void => {
    ctx.beginPath();
    ctx.moveTo(archX, archBottom);
    ctx.lineTo(archX, archTop + archR);
    ctx.arc(archX + archR, archTop + archR, archR, Math.PI, 0);
    ctx.lineTo(archX + archW, archBottom);
    ctx.closePath();
  };

  ctx.save();
  archPath();
  ctx.clip();
  const sky = ctx.createLinearGradient(0, archTop, 0, archBottom);
  sky.addColorStop(0, rgba(p.accent3, 0.72));
  sky.addColorStop(0.55, rgba(p.accent3, 0.26));
  sky.addColorStop(1, rgba(p.bg, 0.1));
  ctx.fillStyle = sky;
  ctx.fillRect(archX, archTop - 10, archW, archBottom - archTop + 20);

  ctx.fillStyle = rgba(p.accent4, 0.42);
  ctx.beginPath();
  ctx.moveTo(archX, archBottom);
  ctx.lineTo(archX, archBottom - s * 0.12);
  ctx.quadraticCurveTo(w * 0.34, archBottom - s * 0.2, w * 0.52, archBottom - s * 0.1);
  ctx.quadraticCurveTo(w * 0.72, archBottom - s * 0.24, archX + archW, archBottom - s * 0.14);
  ctx.lineTo(archX + archW, archBottom);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = rgba(p.accent3, 0.38);
  ctx.beginPath();
  ctx.moveTo(archX, archBottom);
  ctx.lineTo(archX, archBottom - s * 0.05);
  ctx.quadraticCurveTo(w * 0.4, archBottom - s * 0.12, w * 0.6, archBottom - s * 0.04);
  ctx.quadraticCurveTo(w * 0.78, archBottom + s * 0.01, archX + archW, archBottom - s * 0.07);
  ctx.lineTo(archX + archW, archBottom);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.3, s * 0.062, 0, TAU);
  ctx.fillStyle = rgba(p.accent2, 0.55);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = rgba(p.accent, 0.55);
  ctx.lineWidth = Math.max(1, s * 0.0022);
  archPath();
  ctx.stroke();

  // A full turn per loop: the 16-ray sun maps onto itself, so t=0 and t=1
  // match exactly and the rotation keeps a constant, seamless velocity.
  const sunRotation = 0.18 + t * TAU;
  drawSun(ctx, w * 0.5, h * 0.3, s * 0.07, sunRotation, rgba(p.accent, 0.55 + phase * 0.25), Math.max(1, s * 0.0022));

  const layout = layoutTitle(ctx, text, {
    maxWidth: w * 0.72,
    maxLines: 3,
    maxSize: s * 0.155,
    minSize: s * 0.07,
    family: titleFontFamily,
    weight: 400,
    lineHeight: 0.98,
  });
  const blockHeight = layout.lines.length * layout.lineHeight;
  const centerY = h * 0.51;
  const firstBaseline = centerY - blockHeight / 2 + layout.size * 0.78;

  ctx.save();
  drawTitleLines(
    ctx,
    layout.lines,
    w / 2,
    firstBaseline,
    layout.lineHeight,
    { family: titleFontFamily, size: layout.size, weight: 400, color: p.ink },
    { color: p.accent2, italic: true },
  );
  ctx.restore();

  const ruleWidth = s * 0.19 * (1 - 0.15 * phase);
  const ruleY = firstBaseline + blockHeight + s * 0.035;
  ctx.fillStyle = p.accent;
  ctx.fillRect(w / 2 - ruleWidth / 2, ruleY, ruleWidth, Math.max(1, s * 0.0022));

  if (subtitle) {
    drawTracked(
      ctx,
      subtitle.toUpperCase(),
      w / 2,
      ruleY + s * 0.055,
      { family: titleFontFamily, size: s * 0.024, weight: 600, color: p.muted },
      s * 0.006,
    );
  }

  ctx.save();
  ctx.strokeStyle = rgba(p.accent, 0.5);
  ctx.lineWidth = 1;
  const ornamentY = h * 0.885;
  ctx.beginPath();
  ctx.moveTo(w * 0.5 - s * 0.09, ornamentY);
  ctx.lineTo(w * 0.5 + s * 0.09, ornamentY);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w * 0.5, ornamentY, s * 0.008, 0, TAU);
  ctx.fillStyle = p.accent;
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Brutalist                                                           */
/* ------------------------------------------------------------------ */

function frameBrutalist(env: FrameEnv): void {
  const { ctx, w, h, preset, text, subtitle, t } = env;
  const p = preset.palette;
  const s = Math.min(w, h);

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = rgba(p.ink, 0.09);
  ctx.lineWidth = 1;
  const grid = s * 0.1;
  for (let x = grid; x < w; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = grid; y < h; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const barH = s * 0.085;
  const tickerH = s * 0.095;
  const panelW = w * 0.29;
  const titleZoneW = w - panelW;

  ctx.fillStyle = p.ink;
  ctx.fillRect(0, 0, w, barH);

  const label = (subtitle || 'OPEN BEAUTY / DESIGN SYSTEM').toUpperCase();
  drawTracked(
    ctx,
    label,
    s * 0.045,
    barH * 0.62,
    { family: 'Space Mono', size: s * 0.0185, weight: 700, color: p.bg },
    s * 0.0032,
    'left',
  );
  ctx.fillStyle = p.accent;
  ctx.fillRect(w - s * 0.09, 0, s * 0.09, barH);
  ctx.fillStyle = p.ink;
  ctx.font = `700 ${s * 0.024}px "Space Mono"`;
  ctx.textAlign = 'center';
  ctx.fillText('↗', w - s * 0.045, barH * 0.66);
  ctx.textAlign = 'left';

  const panelTop = barH;
  const panelBottom = h - tickerH;
  ctx.fillStyle = p.ink;
  ctx.fillRect(w - panelW, panelTop, panelW, panelBottom - panelTop);

  const cx = w - panelW / 2;
  const cy = panelTop + (panelBottom - panelTop) / 2;
  const radius = Math.min(panelW, panelBottom - panelTop) * 0.27;
  // Half a turn per loop: the square + crosshair figure is 180°-symmetric, so
  // the wrap is exact while the figure keeps turning at a constant speed.
  const rotation = Math.PI / 8 + t * Math.PI;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = Math.max(2, s * 0.004);
  ctx.strokeRect(-radius, -radius, radius * 2, radius * 2);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.72, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-radius * 1.25, 0);
  ctx.lineTo(radius * 1.25, 0);
  ctx.moveTo(0, -radius * 1.25);
  ctx.lineTo(0, radius * 1.25);
  ctx.stroke();
  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.2, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(w - panelW + s * 0.035, panelTop + s * 0.055);
  ctx.rotate(-Math.PI / 16);
  ctx.fillStyle = p.accent2;
  ctx.fillRect(0, 0, s * 0.15, s * 0.05);
  ctx.fillStyle = p.bg;
  ctx.font = `700 ${s * 0.016}px "Space Mono"`;
  ctx.textAlign = 'center';
  ctx.fillText('FIG. 01', s * 0.075, s * 0.032);
  ctx.restore();
  ctx.textAlign = 'left';

  const displayText = text.toUpperCase();
  const layout = layoutTitle(ctx, displayText, {
    maxWidth: titleZoneW * 0.86,
    maxLines: 3,
    maxSize: s * 0.175,
    minSize: s * 0.075,
    family: 'Archivo Black',
    weight: 400,
    lineHeight: 0.84,
  });
  const blockHeight = layout.lines.length * layout.lineHeight;
  const firstBaseline = h * 0.5 - blockHeight / 2 + layout.size * 0.8;

  const lastLine = layout.lines[layout.lines.length - 1] ?? '';
  const lastWidth = widthOf(ctx, lastLine, { family: 'Archivo Black', size: layout.size, color: p.ink });
  const highlightH = layout.lineHeight * 1.02;
  const highlightY = firstBaseline + (layout.lines.length - 1) * layout.lineHeight - layout.size * 0.78;
  ctx.fillStyle = p.accent;
  ctx.fillRect(titleZoneW / 2 - lastWidth / 2 - s * 0.012, highlightY, lastWidth + s * 0.024, highlightH);

  drawTitleLines(
    ctx,
    layout.lines,
    titleZoneW / 2,
    firstBaseline,
    layout.lineHeight,
    { family: 'Archivo Black', size: layout.size, weight: 400, color: p.ink },
  );

  const lineY = firstBaseline + blockHeight + s * 0.012;
  const lineW = titleZoneW * 0.72;
  ctx.fillStyle = p.ink;
  ctx.fillRect(titleZoneW * 0.5 - lineW / 2, lineY, lineW, Math.max(3, s * 0.006));

  const metaY = lineY + s * 0.05;
  ctx.globalAlpha = 0.8;
  drawTracked(
    ctx,
    'EDITORIAL / MOTION / OPEN SOURCE',
    titleZoneW * 0.5,
    metaY,
    { family: 'Space Mono', size: s * 0.017, weight: 400, color: p.muted },
    s * 0.0025,
  );
  ctx.globalAlpha = 1;

  ctx.fillStyle = p.accent;
  ctx.fillRect(0, h - tickerH, w, tickerH);
  ctx.strokeStyle = p.ink;
  ctx.lineWidth = Math.max(3, s * 0.005);
  ctx.beginPath();
  ctx.moveTo(0, h - tickerH);
  ctx.lineTo(w, h - tickerH);
  ctx.stroke();

  const chunk = `${text.toUpperCase()} ///`;
  const tickerFont: FontSpec = { family: 'Archivo Black', size: tickerH * 0.36, weight: 400, color: p.ink };
  const step = widthOf(ctx, chunk, tickerFont) + s * 0.035;
  // The ticker scrolls exactly one chunk per loop: a periodic offset, so the
  // wrap and every other step move it by the same amount.
  const offset = (t * step) % step;
  setFont(ctx, tickerFont);
  ctx.textAlign = 'left';
  let x = -offset;
  while (x < w) {
    ctx.fillText(chunk, x, h - tickerH * 0.32);
    x += step;
  }
  ctx.textAlign = 'left';
}

/* ------------------------------------------------------------------ */
/* Paper craft                                                         */
/* ------------------------------------------------------------------ */

function framePapercraft(env: FrameEnv): void {
  const { ctx, w, h, preset, text, subtitle, t, phase, seed } = env;
  const p = preset.palette;
  const s = Math.min(w, h);
  const rng = mulberry32(seed * 13 + 11);

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);
  drawNoise(ctx, w, h, p.ink, 1200, 0.04, rng);

  // Main layers drift with the eased arc: out at the middle of the loop, back
  // to the poster position at both ends.
  const sway = phase;
  const rngShape = mulberry32(seed * 7 + 5);

  ctx.save();
  ctx.fillStyle = rgba(p.accent2, 0.55);
  ctx.shadowColor = 'rgba(58,46,40,.14)';
  ctx.shadowBlur = s * 0.03;
  ctx.shadowOffsetY = s * 0.012;
  blobPath(ctx, w * 0.22 + sway * s * 0.008, h * 0.32, w * 0.23, h * 0.24, rngShape, 7);
  ctx.fill();
  ctx.restore();

  drawSun(ctx, w * 0.82, h * 0.2, s * 0.075, t * TAU, p.accent, Math.max(2, s * 0.007));

  ctx.save();
  ctx.fillStyle = p.accent3;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.84);
  ctx.quadraticCurveTo(w * 0.24, h * 0.76, w * 0.5, h * 0.84);
  ctx.quadraticCurveTo(w * 0.76, h * 0.92, w, h * 0.82);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = rgba(p.accent2, 0.9);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.93);
  ctx.quadraticCurveTo(w * 0.3, h * 0.86, w * 0.55, h * 0.94);
  ctx.quadraticCurveTo(w * 0.8, h * 1.0, w, h * 0.9);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const cardW = w * 0.68;
  const cardH = h * 0.5;
  const cardCX = w * 0.5;
  const cardCY = h * 0.5;
  const bob = phase * s * 0.008;
  const angle = -0.035 + phase * 0.006;

  ctx.save();
  ctx.translate(cardCX, cardCY + bob);
  ctx.rotate(angle);

  // A second sheet peeks out behind the card: the paper layer is visible.
  ctx.fillStyle = rgba(p.accent2, 0.55);
  roundRect(ctx, -cardW / 2 + s * 0.014, -cardH / 2 + s * 0.018, cardW, cardH, s * 0.045);
  ctx.fill();

  ctx.shadowColor = 'rgba(74,58,50,.20)';
  ctx.shadowBlur = s * 0.04;
  ctx.shadowOffsetY = s * 0.018;
  ctx.fillStyle = p.bg;
  roundRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, s * 0.045);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.strokeStyle = rgba(p.ink, 0.28);
  ctx.lineWidth = Math.max(1.5, s * 0.0025);
  roundRect(ctx, -cardW / 2 + s * 0.022, -cardH / 2 + s * 0.022, cardW - s * 0.044, cardH - s * 0.044, s * 0.036);
  ctx.stroke();

  ctx.fillStyle = rgba(p.accent4, 0.82);
  ctx.save();
  ctx.translate(0, -cardH / 2);
  ctx.rotate(-0.06);
  roundRect(ctx, -s * 0.095, -s * 0.02, s * 0.19, s * 0.04, s * 0.008);
  ctx.fill();
  ctx.restore();

  const layout = layoutTitle(ctx, text, {
    maxWidth: cardW * 0.8,
    maxLines: 3,
    maxSize: s * 0.13,
    minSize: s * 0.06,
    family: 'Fraunces',
    weight: 400,
    lineHeight: 1.02,
  });
  const blockHeight = layout.lines.length * layout.lineHeight;
  const titleTop = -cardH * 0.16 - blockHeight / 2 + layout.size * 0.78;

  drawTitleLines(
    ctx,
    layout.lines,
    0,
    titleTop,
    layout.lineHeight,
    { family: 'Fraunces', size: layout.size, weight: 400, color: p.ink },
    { color: p.accent, italic: false },
  );

  const ruleY = titleTop + blockHeight + s * 0.025;
  ctx.strokeStyle = rgba(p.accent, 0.65);
  ctx.lineWidth = Math.max(2, s * 0.004);
  ctx.beginPath();
  ctx.moveTo(-s * 0.04, ruleY);
  ctx.lineTo(s * 0.04, ruleY);
  ctx.stroke();

  if (subtitle) {
    drawTracked(
      ctx,
      subtitle.toUpperCase(),
      0,
      ruleY + s * 0.045,
      { family: 'Nunito Sans', size: s * 0.02, weight: 800, color: p.muted },
      s * 0.004,
    );
  }
  ctx.restore();

  const confettiRng = mulberry32(seed * 23 + 19);
  for (let index = 0; index < 18; index += 1) {
    const baseX = confettiRng() * w;
    const baseY = confettiRng() * h;
    const size = s * (0.006 + confettiRng() * 0.008);
    const drift = Math.sin(t * TAU + index) * s * 0.008;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = index % 3 === 0 ? p.accent : index % 3 === 1 ? p.accent2 : p.accent3;
    ctx.translate(baseX + drift, baseY + Math.cos(t * TAU + index) * s * 0.004);
    ctx.rotate(index * 0.7 + t * TAU);
    if (index % 2 === 0) {
      ctx.fillRect(-size / 2, -size / 2, size, size);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

function frameShowcase(env: FrameEnv): void {
  const { ctx, w, h, preset: p, text, subtitle, t, phase } = env;
  const s = Math.min(w, h);
  const family =
    p.slug === 'vaporwave'
      ? 'Space Mono'
      : p.slug === 'artdeco' || p.slug === 'ukiyoe' || p.slug === 'bestiary' || p.slug === 'nature'
        ? 'EB Garamond'
        : 'Archivo Black';

  ctx.fillStyle = p.palette.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = 0.82;

  if (p.slug === 'nature') {
    ctx.fillStyle = p.palette.surface;
    ctx.fillRect(0, h * 0.7, w, h * 0.3);
    ctx.strokeStyle = p.palette.ink;
    ctx.lineWidth = Math.max(2, s * 0.004);
    ctx.beginPath();
    ctx.moveTo(w * 0.70, h * 0.88);
    ctx.quadraticCurveTo(w * 0.67, h * 0.48, w * 0.74, h * 0.18);
    ctx.stroke();
    ctx.fillStyle = p.palette.accent;
    for (let i = 0; i < 4; i += 1) {
      const y = h * (0.34 + i * 0.12);
      const side = i % 2 ? 1 : -1;
      ctx.save();
      ctx.translate(w * (0.95 + side * 0.03), y);
      // Leaves sway with the eased arc; sin(0 + i) is the poster pose.
      ctx.rotate(side * -0.55 + Math.sin(phase * Math.PI + i) * 0.05);
      ctx.beginPath();
      ctx.ellipse(side * s * 0.1, 0, s * 0.12, s * 0.045, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = p.palette.accent3;
    ctx.lineWidth = Math.max(1, s * 0.002);
    for (let i = 1; i <= 5; i += 1) {
      ctx.beginPath();
      ctx.arc(w * 0.20, h * 0.24, s * (0.02 + i * 0.018), 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = p.palette.accent2;
    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath();
      ctx.arc(w * (0.15 + (i % 4) * 0.025), h * (0.16 + Math.floor(i / 4) * 0.035), s * 0.004, 0, TAU);
      ctx.fill();
    }
  } else if (p.slug === 'artdeco') {
    ctx.strokeStyle = p.palette.accent;
    ctx.lineWidth = Math.max(1, s * 0.0015);
    for (let i = 0; i < 16; i += 1) {
      // One ray step per loop keeps the 16-fold pattern identical at t=0 and t=1.
      const a = (i / 16) * TAU + t * (TAU / 16);
      ctx.beginPath();
      ctx.moveTo(w / 2 + Math.cos(a) * s * 0.1, h / 2 + Math.sin(a) * s * 0.1);
      ctx.lineTo(w / 2 + Math.cos(a) * s * 0.48, h / 2 + Math.sin(a) * s * 0.48);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(p.palette.accent, 0.2);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, s * 0.22 * (1 + phase * 0.05), 0, TAU);
    ctx.fill();
    ctx.strokeStyle = p.palette.accent;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, s * 0.15 * (1 + phase * 0.05), 0, TAU);
    ctx.stroke();
    ctx.fillStyle = p.palette.accent;
    for (let i = 0; i < 4; i += 1) {
      const x = s * 0.1 + i * s * 0.22;
      ctx.fillRect(x, h - s * 0.21, s * 0.12, s * (0.06 + i * 0.025));
    }
  } else if (p.slug === 'isotype') {
    ctx.fillStyle = p.palette.accent;
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        if ((row + col) % 3 === 0) continue;
        const x = s * 0.08 + col * s * 0.095;
        // The pictogram crowd bobs with the eased arc; the poster pose is sin(i).
        const y = h - s * 0.3 + row * s * 0.045 + Math.sin(phase * Math.PI + col * 0.6 + row * 0.35) * s * 0.005;
        ctx.beginPath();
        ctx.arc(x, y, s * 0.009, 0, TAU);
        ctx.fill();
        ctx.fillRect(x - s * 0.009, y + s * 0.01, s * 0.018, s * 0.026);
      }
    }
    ctx.strokeStyle = rgba(p.palette.ink, 0.45);
    const ruleDrift = Math.sin(phase * Math.PI) * s * 0.01;
    for (let i = 0; i < 7; i += 1) {
      ctx.beginPath();
      ctx.moveTo(s * 0.06 + ruleDrift, s * 0.12 + i * s * 0.035);
      ctx.lineTo(w - s * 0.06 + ruleDrift, s * 0.12 + i * s * 0.035);
      ctx.stroke();
    }
  } else if (p.slug === 'opart') {
    ctx.strokeStyle = p.palette.ink;
    ctx.lineWidth = Math.max(1, s * 0.002);
    for (let i = 1; i < 14; i += 1) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, i * s * 0.026 + Math.sin(phase * Math.PI + i) * s * 0.004, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = p.palette.accent;
    ctx.fillRect(w * 0.08, h * 0.72, w * 0.84, s * 0.018);
  } else if (p.slug === 'ukiyoe') {
    ctx.fillStyle = rgba(p.palette.accent3, 0.45);
    ctx.fillRect(0, h * 0.46, w, h * 0.54);
    ctx.fillStyle = p.palette.accent2;
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.22, s * 0.075, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = p.palette.accent;
    ctx.lineWidth = Math.max(2, s * 0.004);
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      for (let x = -20; x <= w + 20; x += 12) {
        const y = h * (0.56 + i * 0.07) + Math.sin(x / 90 + i + phase * TAU) * s * 0.025;
        if (x === -20) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = p.palette.bg;
    for (let i = 0; i < 18; i += 1) {
      ctx.beginPath();
      ctx.arc((i * 97) % w, h * 0.64 + ((i * 43) % (s * 0.18)), s * 0.004, 0, TAU);
      ctx.fill();
    }
  } else if (p.slug === 'bestiary') {
    const breathe = 1 + Math.sin(phase * Math.PI) * 0.03;
    ctx.strokeStyle = p.palette.accent;
    ctx.lineWidth = Math.max(1, s * 0.002);
    ctx.strokeRect(s * 0.07, s * 0.06, w - s * 0.14, h - s * 0.12);
    ctx.strokeRect(s * 0.085, s * 0.075, w - s * 0.17, h - s * 0.15);
    ctx.fillStyle = rgba(p.palette.accent3, 0.18);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, s * 0.27 * breathe, 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.palette.ink;
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.52, s * 0.17 * breathe, s * 0.12 * breathe, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.palette.accent3;
    ctx.beginPath();
    ctx.arc(w / 2 - s * 0.06 * breathe, h * 0.5, s * 0.018, 0, TAU);
    ctx.arc(w / 2 + s * 0.06 * breathe, h * 0.5, s * 0.018, 0, TAU);
    ctx.fill();
  } else if (p.slug === 'psychedelic') {
    const rng = mulberry32(env.seed || 7);
    for (let i = 0; i < 4; i += 1) {
      const grow = 1 + Math.sin(phase * Math.PI + i) * 0.05;
      const bx = s * (0.22 + i * 0.19);
      const by = s * (0.3 + (i % 2) * 0.28);
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(grow, grow);
      ctx.translate(-bx, -by);
      ctx.fillStyle = [p.palette.accent, p.palette.accent2, p.palette.accent4, p.palette.deep][i] ?? p.palette.accent;
      blobPath(ctx, bx, by, s * (0.18 + i * 0.03), s * 0.16, rng, 7);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = p.palette.accent3;
    ctx.lineWidth = Math.max(1, s * 0.002);
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, s * (0.3 + i * 0.04), 0, TAU);
      ctx.stroke();
    }
  } else if (p.slug === 'memphis') {
    // Eased drift: shapes float away from the poster position and return.
    const drift = phase * s * 0.012;
    ctx.fillStyle = p.palette.accent;
    ctx.beginPath();
    ctx.arc(w * 0.78 - drift * 0.4, h * 0.2 - drift, s * 0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.palette.accent2;
    ctx.fillRect(w * 0.58, h * 0.28 - drift * 0.7, s * 0.18, s * 0.28);
    ctx.fillStyle = p.palette.accent3;
    ctx.fillRect(w * 0.08, h * 0.7 + drift * 0.5, s * 0.3, s * 0.08);
    ctx.fillStyle = p.palette.accent4;
    ctx.fillRect(w * 0.15, h * 0.14 - drift * 0.9, s * 0.13, s * 0.13);
    ctx.strokeStyle = p.palette.ink;
    ctx.lineWidth = Math.max(3, s * 0.008);
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const x = w * 0.18 + i * s * 0.09;
      const y = h * 0.84 + Math.sin(i * 1.8) * s * 0.035 + drift * 0.3;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.quadraticCurveTo(x - s * 0.045, y - s * 0.06, x, y);
    }
    ctx.stroke();
  } else if (p.slug === 'galactic') {
    ctx.strokeStyle = rgba(p.palette.accent, 0.6);
    ctx.lineWidth = Math.max(1, s * 0.0015);
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      // A half turn maps every ellipse onto itself, so the loop closes exactly.
      ctx.ellipse(w / 2, h / 2, s * (0.24 + i * 0.08), s * (0.08 + i * 0.045), i * 0.36 + t * Math.PI, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = p.palette.accent2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, s * 0.16 * (1 + phase * 0.04), 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.palette.accent3;
    ctx.beginPath();
    ctx.arc(w * 0.76, h * 0.24, s * 0.018, 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.palette.ink;
    for (let i = 0; i < 28; i += 1) {
      ctx.beginPath();
      ctx.arc((i * 79) % w, (i * 137) % h, s * 0.0022, 0, TAU);
      ctx.fill();
    }
  } else if (p.slug === 'vaporwave') {
    // The sun and the horizon grid rise with the eased arc and settle back.
    const rise = phase * s * 0.01;
    ctx.fillStyle = rgba(p.palette.accent, 0.75);
    ctx.beginPath();
    ctx.arc(w * 0.76, h * 0.25 - rise * 0.6, s * 0.12 * (1 + phase * 0.03), 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.palette.bg;
    for (let i = 0; i < 6; i += 1) ctx.fillRect(w * 0.62, h * 0.17 + i * s * 0.025 - rise * 0.6, s * 0.28, s * 0.008);
    ctx.strokeStyle = rgba(p.palette.accent2, 0.7);
    ctx.lineWidth = Math.max(1, s * 0.0015);
    for (let i = 0; i < 12; i += 1) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.58 + rise * 0.4);
      ctx.lineTo(w * (0.05 + i * 0.085), h);
      ctx.stroke();
      ctx.beginPath();
      const y = h * 0.58 + i * s * 0.03 + rise * 0.4;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.save();
  const layout = layoutTitle(ctx, text.toUpperCase(), {
    maxWidth: w * 0.72,
    maxLines: 3,
    maxSize: s * (p.slug === 'vaporwave' ? 0.075 : p.slug === 'nature' ? 0.08 : 0.11),
    minSize: s * 0.035,
    family,
    weight: 400,
    lineHeight: 1.02,
  });
  const firstBaseline = h / 2 - ((layout.lines.length - 1) * layout.lineHeight) / 2 + layout.size * 0.34;
  drawTitleLines(
    ctx,
    layout.lines,
    w / 2,
    firstBaseline,
    layout.lineHeight,
    { family, size: layout.size, weight: 400, color: p.palette.ink },
    { color: p.palette.accent, italic: false },
  );
  if (subtitle) {
    const subtitleY = p.slug === 'isotype' ? s * 0.045 : h - s * 0.08;
    drawTracked(ctx, subtitle.toUpperCase(), w / 2, subtitleY, { family, size: s * 0.018, weight: 400, color: p.palette.muted }, s * 0.006);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

function drawMaxGif(ctx: SKRSContext2D, w: number, h: number, p: StylePreset, t: number): void {
  const s = Math.min(w, h);
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.strokeStyle = p.palette.accent3;
  ctx.lineWidth = Math.max(1, s * 0.0015);
  if (p.slug === 'nature') {
    for (let i = 1; i <= 4; i += 1) {
      ctx.beginPath();
      ctx.arc(w * 0.12, h * 0.8, s * (0.025 + i * 0.025), 0, TAU);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.18);
    ctx.quadraticCurveTo(w * 0.16, h * 0.08, w * 0.24, h * 0.2);
    ctx.stroke();
  } else if (p.slug === 'brutalist') {
    ctx.fillStyle = p.palette.accent;
    ctx.fillRect(w * 0.04, h * 0.06, w * 0.11, s * 0.02);
    ctx.fillRect(w * 0.84, h * 0.9, w * 0.12, s * 0.03);
  } else if (p.slug === 'artdeco') {
    for (let i = 0; i < 9; i += 1) {
      const a = (i / 9) * TAU;
      ctx.beginPath();
      ctx.moveTo(w * 0.88, h * 0.12);
      ctx.lineTo(w * 0.88 + Math.cos(a) * s * 0.15, h * 0.12 + Math.sin(a) * s * 0.15);
      ctx.stroke();
    }
  } else if (p.slug === 'vaporwave') {
    ctx.strokeStyle = p.palette.accent2;
    for (let i = 0; i < 5; i += 1) {
      const y = h * (0.82 + i * 0.035);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  } else if (p.slug === 'galactic') {
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(w * 0.18, h * 0.22, s * (0.08 + i * 0.04), s * (0.03 + i * 0.015), -0.5, 0, TAU);
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * TAU + t * (TAU / 7);
      ctx.beginPath();
      ctx.arc(w * 0.12 + Math.cos(a) * s * 0.045, h * 0.86 + Math.sin(a) * s * 0.045, s * 0.005, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = p.palette.accent4;
  for (let i = 0; i < 8; i += 1) {
    const x = w * (0.72 + (i % 4) * 0.055);
    const y = h * (0.78 + Math.floor(i / 4) * 0.045);
    ctx.beginPath();
    ctx.arc(x, y, s * 0.004, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

const RENDERERS: Record<StyleSlug, (env: FrameEnv) => void> = {
  renaissance: frameRenaissance,
  brutalist: frameBrutalist,
  papercraft: framePapercraft,
  artdeco: frameShowcase,
  isotype: frameShowcase,
  opart: frameShowcase,
  ukiyoe: frameShowcase,
  bestiary: frameShowcase,
  psychedelic: frameShowcase,
  memphis: frameShowcase,
  vaporwave: frameShowcase,
  galactic: frameShowcase,
  nature: frameShowcase,
};

export interface GifFrameRequest {
  text: string;
  subtitle?: string;
  template?: Template;
  seed?: number;
  maxxing?: boolean;
}

/**
 * Paint one frame on `ctx`. `position` is the loop position (0..1); the poster
 * template is a still, so it always paints the composed frame at position 0.
 */
function paintFrame(
  ctx: SKRSContext2D,
  style: StyleSlug,
  request: GifFrameRequest,
  template: Template,
  position: number,
  width: number,
  height: number,
): void {
  const preset = getStyle(style);
  const poster = template === 'poster';
  const t = poster ? 0 : clamp(position, 0, 1);
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  RENDERERS[style]({
    ctx,
    w: width,
    h: height,
    preset,
    text: request.text.trim(),
    subtitle: request.subtitle?.trim() || undefined,
    t,
    phase: loopPhase(t),
    seed: request.seed ?? 7,
  });
  if (request.maxxing) drawMaxGif(ctx, width, height, preset, t);
  ctx.restore();
}

/** Render one frame at loop position t (0..1). Exported for tests and tooling. */
export function drawGifFrame(
  style: StyleSlug,
  request: GifFrameRequest,
  t: number,
  width: number,
  height: number,
): Uint8ClampedArray {
  const { ctx } = canvasFor(width, height);
  paintFrame(ctx, style, request, request.template ?? 'title', t, width, height);
  return ctx.getImageData(0, 0, width, height).data;
}

/** Write the composed poster frame as a PNG (previews, og images). */
export async function createGifPoster(style: StyleSlug, options: GifQualityOptions, output: string): Promise<string> {
  if (!isStyleSlug(style)) {
    throw new BeautyError(`Unknown style "${style}".`, 'UNKNOWN_STYLE');
  }
  if (!options.text?.trim()) {
    throw new BeautyError('A GIF needs non-empty text.', 'MISSING_TEXT');
  }
  const resolved = resolveGif(options, STYLE_DITHER[style] ?? DEFAULT_DITHER);
  const { canvas, ctx } = canvasFor(resolved.width, resolved.height);
  paintFrame(
    ctx,
    style,
    { text: options.text, subtitle: options.subtitle, seed: options.seed, maxxing: options.maxxing },
    'poster',
    0,
    resolved.width,
    resolved.height,
  );
  await writeFile(output, canvas.encodeSync('png'));
  return output;
}

const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const MIN_WIDTH = 240;
const MIN_HEIGHT = 240;
const MIN_FPS = 8;
const MAX_FPS = 30;
const MIN_DURATION = 1;
const MAX_DURATION = 6;
const MIN_FRAMES = 8;
const MAX_FRAMES = 180;
const MAX_PIXEL_FRAMES = 48_000_000;
const PALETTE_SAMPLES = 6;

interface ResolvedGif {
  width: number;
  height: number;
  fps: number;
  duration: number;
  frames: number;
  colors: number;
  dither: GifDitherMode;
  warnings: string[];
}

const DITHER_MODES: readonly GifDitherMode[] = ['none', 'ordered', 'floyd-steinberg'];

function resolveGif(options: GifQualityOptions, defaultDither: GifDitherMode): ResolvedGif {
  const warnings: string[] = [];
  const note = (message: string): void => {
    warnings.push(message);
  };

  const width = options.width === undefined || !Number.isFinite(options.width)
    ? 800
    : Math.round(options.width);
  if (options.width !== undefined && !Number.isFinite(options.width)) {
    note(`width ${String(options.width)} is not a valid number; used 800`);
  }
  const height = options.height === undefined || !Number.isFinite(options.height)
    ? 800
    : Math.round(options.height);
  if (options.height !== undefined && !Number.isFinite(options.height)) {
    note(`height ${String(options.height)} is not a valid number; used 800`);
  }
  const fps = options.fps === undefined || !Number.isFinite(options.fps)
    ? 24
    : Math.round(options.fps);
  if (options.fps !== undefined && !Number.isFinite(options.fps)) {
    note(`fps ${String(options.fps)} is not a valid number; used 24`);
  }
  const duration = options.duration === undefined || !Number.isFinite(options.duration)
    ? 2.4
    : options.duration;
  if (options.duration !== undefined && !Number.isFinite(options.duration)) {
    note(`duration ${String(options.duration)} is not a valid number; used 2.4`);
  }

  const clampedWidth = clamp(width, MIN_WIDTH, MAX_WIDTH);
  if (clampedWidth !== width) note(`width ${width} clamped to ${clampedWidth} (allowed ${MIN_WIDTH}–${MAX_WIDTH})`);
  const clampedHeight = clamp(height, MIN_HEIGHT, MAX_HEIGHT);
  if (clampedHeight !== height) note(`height ${height} clamped to ${clampedHeight} (allowed ${MIN_HEIGHT}–${MAX_HEIGHT})`);
  const clampedFps = clamp(fps, MIN_FPS, MAX_FPS);
  if (clampedFps !== fps) note(`fps ${fps} clamped to ${clampedFps} (allowed ${MIN_FPS}–${MAX_FPS})`);
  const clampedDuration = clamp(duration, MIN_DURATION, MAX_DURATION);
  if (clampedDuration !== duration) note(`duration ${duration}s clamped to ${clampedDuration}s (allowed ${MIN_DURATION}–${MAX_DURATION})`);

  const frames = clamp(Math.round(clampedFps * clampedDuration), MIN_FRAMES, MAX_FRAMES);
  if (frames !== Math.round(clampedFps * clampedDuration)) {
    note(`frame count ${Math.round(clampedFps * clampedDuration)} clamped to ${frames} (allowed ${MIN_FRAMES}–${MAX_FRAMES})`);
  }

  let finalWidth = clampedWidth;
  let finalHeight = clampedHeight;
  const pixelFrames = finalWidth * finalHeight * frames;
  if (pixelFrames > MAX_PIXEL_FRAMES) {
    const scale = Math.sqrt(MAX_PIXEL_FRAMES / pixelFrames);
    finalWidth = Math.max(MIN_WIDTH, Math.round(clampedWidth * scale));
    finalHeight = Math.max(MIN_HEIGHT, Math.round(clampedHeight * scale));
    note(
      `size ${clampedWidth}×${clampedHeight} at ${frames} frames exceeded the memory budget; scaled to ${finalWidth}×${finalHeight}`,
    );
  }

  const requestedColors = options.paletteColors;
  const colorValue = requestedColors === undefined || !Number.isFinite(requestedColors) ? DEFAULT_PALETTE : Math.round(requestedColors);
  if (requestedColors !== undefined && !Number.isFinite(requestedColors)) {
    note(`palette size ${String(requestedColors)} is not a valid number; used ${DEFAULT_PALETTE}`);
  }
  const colors = clamp(colorValue, 16, 255);
  if (colors !== colorValue) {
    note(`palette size ${colorValue} clamped to ${colors} (allowed 16–255, one slot is reserved for frame deltas)`);
  }

  const requestedDither = options.dither;
  const knownDither = requestedDither !== undefined && DITHER_MODES.includes(requestedDither);
  if (requestedDither !== undefined && !knownDither) {
    note(`unknown dither mode "${String(requestedDither)}"; used ${defaultDither}`);
  }
  const dither = knownDither ? requestedDither : defaultDither;

  return { width: finalWidth, height: finalHeight, fps: clampedFps, duration: clampedDuration, frames, colors, dither, warnings };
}

export async function createGif(style: StyleSlug, options: GifQualityOptions, output: string): Promise<SafeGifResult> {
  if (!isStyleSlug(style)) {
    throw new BeautyError(`Unknown style "${style}".`, 'UNKNOWN_STYLE');
  }
  if (!options.text?.trim()) {
    throw new BeautyError('A GIF needs non-empty text.', 'MISSING_TEXT');
  }

  const styleDither = STYLE_DITHER[style] ?? DEFAULT_DITHER;
  const resolved = resolveGif(options, styleDither);
  const { width, height, frames, colors, dither: ditherMode, warnings } = resolved;
  const template: Template = options.template ?? 'title';
  const request: GifFrameRequest = {
    text: options.text,
    subtitle: options.subtitle,
    template,
    seed: options.seed,
    maxxing: options.maxxing,
  };

  // One global palette per GIF: sample frames spread across the whole loop so
  // every colour that appears in any frame has a stable slot (no flicker).
  const sampleCount = Math.min(PALETTE_SAMPLES, frames);
  const samples: Uint8ClampedArray[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const frameIndex = Math.round((index * (frames - 1)) / Math.max(1, sampleCount - 1));
    samples.push(drawGifFrame(style, request, frameIndex / frames, width, height));
  }
  const palette = globalPalette(samples, colors);
  const lut = buildPaletteLut(palette);
  // Reserve the slot right after the quantised colours for frame deltas: later
  // frames mark unchanged pixels with it so LZW stores only what really moved.
  // The LUT is built first, so the transparent slot is never picked for a pixel.
  const transparentIndex = palette.length;
  palette.push([0, 0, 0]);

  const gif = GIFEncoder();
  let previous: Uint8Array | undefined;
  for (let frame = 0; frame < frames; frame += 1) {
    // t never reaches 1: the last frame sits one step before the first, so the
    // loop wraps seamlessly instead of repeating the opening frame.
    const t = frame / frames;
    const data = drawGifFrame(style, request, t, width, height);
    const index = mapIndices(data, palette, lut, width, height, ditherMode);
    const delay = Math.round(1000 / resolved.fps);
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

  const result: SafeGifResult = {
    path: output,
    width,
    height,
    fps: resolved.fps,
    duration: resolved.duration,
    frames,
    bytes: bytes.byteLength,
    warnings,
  };
  return result;
}
