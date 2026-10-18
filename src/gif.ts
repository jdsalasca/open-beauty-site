import { writeFile } from 'node:fs/promises';
import gifenc from 'gifenc';
import type { SKRSContext2D } from '@napi-rs/canvas';
import type { GifOptions, GifResult, StylePreset, StyleSlug } from './types.js';
import { getStyle, isStyleSlug } from './styles/presets.js';
import { canvasFor } from './canvas.js';
import { BeautyError } from './page/common.js';

const { GIFEncoder, applyPalette, quantize } = gifenc;

const TAU = Math.PI * 2;

type Template = 'title' | 'loop' | 'poster';

interface FrameEnv {
  ctx: SKRSContext2D;
  w: number;
  h: number;
  preset: StylePreset;
  text: string;
  subtitle?: string;
  template: Template;
  t: number;
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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - clamp(t, 0, 1)) ** 3;
}

function easeOutQuint(t: number): number {
  return 1 - (1 - clamp(t, 0, 1)) ** 5;
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
  const { ctx, w, h, preset, text, subtitle, template, t, seed } = env;
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

  const reveal = template === 'title' ? easeOutCubic(clamp(t / 0.55, 0, 1)) : 1;
  const sunRotation = template === 'loop' ? t * TAU : 0.18 + reveal * 0.15;
  drawSun(ctx, w * 0.5, h * 0.3, s * 0.07, sunRotation, rgba(p.accent, template === 'loop' ? 0.6 : 0.55 + reveal * 0.25), Math.max(1, s * 0.0022));

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
  ctx.globalAlpha = template === 'title' ? reveal : 1;
  drawTitleLines(
    ctx,
    layout.lines,
    w / 2,
    firstBaseline + (template === 'title' ? (1 - reveal) * s * 0.02 : 0),
    layout.lineHeight,
    { family: titleFontFamily, size: layout.size, weight: 400, color: p.ink },
    { color: p.accent2, italic: true },
  );
  ctx.restore();

  const ruleWidth = s * 0.19 * (template === 'loop' ? 0.85 + Math.sin(t * TAU) * 0.08 : reveal);
  const ruleY = firstBaseline + blockHeight + s * 0.035;
  ctx.fillStyle = p.accent;
  ctx.fillRect(w / 2 - ruleWidth / 2, ruleY, ruleWidth, Math.max(1, s * 0.0022));

  if (subtitle) {
    ctx.globalAlpha = template === 'title' ? reveal : 1;
    drawTracked(
      ctx,
      subtitle.toUpperCase(),
      w / 2,
      ruleY + s * 0.055,
      { family: titleFontFamily, size: s * 0.024, weight: 600, color: p.muted },
      s * 0.006,
    );
    ctx.globalAlpha = 1;
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
  const { ctx, w, h, preset, text, subtitle, template, t, seed } = env;
  const p = preset.palette;
  const s = Math.min(w, h);
  const rng = mulberry32(seed * 17 + 3);

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
  const rotation = template === 'loop' ? t * TAU * 0.5 : Math.PI / 8;

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
  const firstBaseline = h * 0.5 - blockHeight / 2 + layout.size * 0.8 + (template === 'title' ? (1 - easeOutQuint(t / 0.5)) * s * 0.04 : 0);

  const lastLine = layout.lines[layout.lines.length - 1] ?? '';
  const lastWidth = widthOf(ctx, lastLine, { family: 'Archivo Black', size: layout.size, color: p.ink });
  const highlightProgress = template === 'title' ? easeOutQuint(clamp((t - 0.08) / 0.45, 0, 1)) : 1;
  const highlightH = layout.lineHeight * 1.02;
  const highlightY = firstBaseline + (layout.lines.length - 1) * layout.lineHeight - layout.size * 0.78;
  ctx.save();
  ctx.beginPath();
  ctx.rect(titleZoneW / 2 - lastWidth / 2 - s * 0.012, highlightY, (lastWidth + s * 0.024) * clamp(highlightProgress, 0, 1), highlightH);
  ctx.clip();
  ctx.fillStyle = p.accent;
  ctx.fillRect(titleZoneW / 2 - lastWidth / 2 - s * 0.012, highlightY, lastWidth + s * 0.024, highlightH);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, firstBaseline - layout.size * 1.1, titleZoneW, (blockHeight + layout.size) * (template === 'title' ? easeOutCubic(clamp(t / 0.45 + 0.08, 0, 1)) : 1));
  ctx.clip();
  drawTitleLines(
    ctx,
    layout.lines,
    titleZoneW / 2,
    firstBaseline,
    layout.lineHeight,
    { family: 'Archivo Black', size: layout.size, weight: 400, color: p.ink },
  );
  ctx.restore();

  const lineY = firstBaseline + blockHeight + s * 0.012;
  const lineW = titleZoneW * 0.72;
  const lineGrow = template === 'title' ? easeOutCubic(t / 0.55) : 1;
  ctx.fillStyle = p.ink;
  ctx.fillRect(titleZoneW * 0.5 - (lineW * lineGrow) / 2, lineY, lineW * lineGrow, Math.max(3, s * 0.006));

  const metaY = lineY + s * 0.05;
  ctx.globalAlpha = template === 'title' ? clamp((t - 0.35) / 0.3, 0, 1) : 0.8;
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
  const offset = (template === 'loop' ? t * step * 2 : t * step * 0.6) % step;
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
  const { ctx, w, h, preset, text, subtitle, template, t, seed } = env;
  const p = preset.palette;
  const s = Math.min(w, h);
  const rng = mulberry32(seed * 13 + 11);

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);
  drawNoise(ctx, w, h, p.ink, 1200, 0.04, rng);

  const sway = template === 'loop' ? Math.sin(t * TAU) : Math.sin(t * Math.PI);
  const rngShape = mulberry32(seed * 7 + 5);

  ctx.save();
  ctx.fillStyle = rgba(p.accent2, 0.55);
  ctx.shadowColor = 'rgba(58,46,40,.14)';
  ctx.shadowBlur = s * 0.03;
  ctx.shadowOffsetY = s * 0.012;
  blobPath(ctx, w * 0.22 + sway * s * 0.008, h * 0.32, w * 0.23, h * 0.24, rngShape, 7);
  ctx.fill();
  ctx.restore();

  drawSun(ctx, w * 0.82, h * 0.2, s * 0.075, template === 'loop' ? t * TAU * 0.5 : 0.3, p.accent, Math.max(2, s * 0.007));

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
  const pop = template === 'title' ? easeOutCubic(clamp(t / 0.5 + 0.09, 0, 1)) : 1;
  const cardScale = lerp(0.9, 1, pop);
  const bob = template === 'loop' ? Math.sin(t * TAU) * s * 0.008 : 0;
  const angle = -0.035 + (template === 'loop' ? Math.sin(t * TAU) * 0.006 : 0);

  ctx.save();
  ctx.translate(cardCX, cardCY + bob);
  ctx.rotate(angle);
  ctx.scale(cardScale, cardScale);

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

  ctx.globalAlpha = pop;
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
  ctx.globalAlpha = 1;
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
    ctx.translate(baseX + drift, baseY + (template === 'loop' ? Math.cos(t * TAU + index) * s * 0.004 : 0));
    ctx.rotate(index * 0.7 + t * (template === 'loop' ? TAU : 0));
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
  const { ctx, w, h, preset: p, text, subtitle, t } = env;
  const s = Math.min(w, h);
  const e = easeOutCubic(t);
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
      ctx.rotate(side * -0.55);
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
      const a = (i / 16) * TAU + t * 0.08;
      ctx.beginPath();
      ctx.moveTo(w / 2 + Math.cos(a) * s * 0.1, h / 2 + Math.sin(a) * s * 0.1);
      ctx.lineTo(w / 2 + Math.cos(a) * s * 0.48, h / 2 + Math.sin(a) * s * 0.48);
      ctx.stroke();
    }
    ctx.fillStyle = rgba(p.palette.accent, 0.2);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, s * 0.22, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = p.palette.accent;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, s * 0.15, 0, TAU);
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
        const y = h - s * 0.3 + row * s * 0.045;
        ctx.beginPath();
        ctx.arc(x, y, s * 0.009, 0, TAU);
        ctx.fill();
        ctx.fillRect(x - s * 0.009, y + s * 0.01, s * 0.018, s * 0.026);
      }
    }
    ctx.strokeStyle = rgba(p.palette.ink, 0.45);
    for (let i = 0; i < 7; i += 1) {
      ctx.beginPath();
      ctx.moveTo(s * 0.06, s * 0.12 + i * s * 0.035);
      ctx.lineTo(w - s * 0.06, s * 0.12 + i * s * 0.035);
      ctx.stroke();
    }
  } else if (p.slug === 'opart') {
    ctx.strokeStyle = p.palette.ink;
    ctx.lineWidth = Math.max(1, s * 0.002);
    for (let i = 1; i < 14; i += 1) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, i * s * 0.026 + Math.sin(t * TAU + i) * s * 0.004, 0, TAU);
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
        const y = h * (0.56 + i * 0.07) + Math.sin(x / 90 + i + t * 1.4) * s * 0.025;
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
    ctx.strokeStyle = p.palette.accent;
    ctx.lineWidth = Math.max(1, s * 0.002);
    ctx.strokeRect(s * 0.07, s * 0.06, w - s * 0.14, h - s * 0.12);
    ctx.strokeRect(s * 0.085, s * 0.075, w - s * 0.17, h - s * 0.15);
    ctx.fillStyle = rgba(p.palette.accent3, 0.18);
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, s * 0.27, 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.palette.ink;
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.52, s * 0.17, s * 0.12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.palette.accent3;
    ctx.beginPath();
    ctx.arc(w / 2 - s * 0.06, h * 0.5, s * 0.018, 0, TAU);
    ctx.arc(w / 2 + s * 0.06, h * 0.5, s * 0.018, 0, TAU);
    ctx.fill();
  } else if (p.slug === 'psychedelic') {
    const rng = mulberry32(env.seed || 7);
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = [p.palette.accent, p.palette.accent2, p.palette.accent4, p.palette.deep][i] ?? p.palette.accent;
      blobPath(ctx, s * (0.22 + i * 0.19), s * (0.3 + (i % 2) * 0.28), s * (0.18 + i * 0.03), s * 0.16, rng, 7);
      ctx.fill();
    }
    ctx.strokeStyle = p.palette.accent3;
    ctx.lineWidth = Math.max(1, s * 0.002);
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, s * (0.3 + i * 0.04), 0, TAU);
      ctx.stroke();
    }
  } else if (p.slug === 'memphis') {
    ctx.fillStyle = p.palette.accent;
    ctx.beginPath();
    ctx.arc(w * 0.78, h * 0.2, s * 0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.palette.accent2;
    ctx.fillRect(w * 0.58, h * 0.28, s * 0.18, s * 0.28);
    ctx.fillStyle = p.palette.accent3;
    ctx.fillRect(w * 0.08, h * 0.7, s * 0.3, s * 0.08);
    ctx.fillStyle = p.palette.accent4;
    ctx.fillRect(w * 0.15, h * 0.14, s * 0.13, s * 0.13);
    ctx.strokeStyle = p.palette.ink;
    ctx.lineWidth = Math.max(3, s * 0.008);
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const x = w * 0.18 + i * s * 0.09;
      const y = h * 0.84 + Math.sin(i * 1.8) * s * 0.035;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.quadraticCurveTo(x - s * 0.045, y - s * 0.06, x, y);
    }
    ctx.stroke();
  } else if (p.slug === 'galactic') {
    ctx.strokeStyle = rgba(p.palette.accent, 0.6);
    ctx.lineWidth = Math.max(1, s * 0.0015);
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, s * (0.24 + i * 0.08), s * (0.08 + i * 0.045), (i * 0.36) + t * 0.06, 0, TAU);
      ctx.stroke();
    }
    ctx.fillStyle = p.palette.accent2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, s * 0.16, 0, TAU);
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
    ctx.fillStyle = rgba(p.palette.accent, 0.75);
    ctx.beginPath();
    ctx.arc(w * 0.76, h * 0.25, s * 0.12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.palette.bg;
    for (let i = 0; i < 6; i += 1) ctx.fillRect(w * 0.62, h * 0.17 + i * s * 0.025, s * 0.28, s * 0.008);
    ctx.strokeStyle = rgba(p.palette.accent2, 0.7);
    ctx.lineWidth = Math.max(1, s * 0.0015);
    for (let i = 0; i < 12; i += 1) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.58);
      ctx.lineTo(w * (0.05 + i * 0.085), h);
      ctx.stroke();
      ctx.beginPath();
      const y = h * 0.58 + i * s * 0.03;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = e;
  ctx.translate(0, (1 - e) * s * 0.045);
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

export async function createGif(style: StyleSlug, options: GifOptions, output: string): Promise<GifResult> {
  if (!isStyleSlug(style)) {
    throw new BeautyError(`Unknown style "${style}".`, 'UNKNOWN_STYLE');
  }
  if (!options.text?.trim()) {
    throw new BeautyError('A GIF needs non-empty text.', 'MISSING_TEXT');
  }

  const width = Math.round(clamp(options.width ?? 800, 240, 1200));
  const height = Math.round(clamp(options.height ?? 800, 240, 1200));
  const fps = Math.round(clamp(options.fps ?? 24, 8, 30));
  const duration = clamp(options.duration ?? 2.4, 1, 6);
  const template: Template = options.template ?? 'title';
  const frames = Math.max(8, Math.min(180, Math.round(fps * duration)));
  const preset = getStyle(style);
  const { canvas, ctx } = canvasFor(width, height);

  const gif = GIFEncoder();

  const drawAt = (t: number): Uint8ClampedArray => {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    RENDERERS[style]({
      ctx,
      w: width,
      h: height,
      preset,
      text: options.text.trim(),
      subtitle: options.subtitle?.trim() || undefined,
      template,
      t,
      seed: options.seed ?? 7,
    });
    ctx.restore();
    return ctx.getImageData(0, 0, width, height).data;
  };

  // Quantize from a fully revealed frame: a palette built from frame 0 would
  // miss ink/accent colours that only appear later in a reveal animation.
  const probe = drawAt(template === 'title' ? 0.94 : 0.5);
  const palette = quantize(probe, 128, { format: 'rgb444' });

  for (let frame = 0; frame < frames; frame += 1) {
    const t = frame / frames;
    const data = drawAt(t);
    const index = applyPalette(data, palette, 'rgb444');
    gif.writeFrame(index, width, height, {
      palette,
      delay: Math.round(1000 / fps),
      repeat: frame === 0 ? 0 : undefined,
    });
  }

  gif.finish();
  const bytes = gif.bytes();
  await writeFile(output, bytes);
  void canvas;

  return {
    path: output,
    width,
    height,
    fps,
    frames,
    bytes: bytes.byteLength,
  };
}
