import { createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import type { NarrativeTimelineFrame } from '../../types/narrative.js';
import { narrativeCanvasWeight } from '../fonts.js';

export function cubicBezierEase(progress: number, x1: number, y1: number, x2: number, y2: number): number {
  const x = Math.max(0, Math.min(1, progress));
  const curve = (t: number, first: number, second: number): number => 3 * (1 - t) ** 2 * t * first + 3 * (1 - t) * t ** 2 * second + t ** 3;
  let low = 0;
  let high = 1;
  let parameter = x;
  for (let iteration = 0; iteration < 16; iteration += 1) {
    parameter = (low + high) / 2;
    if (curve(parameter, x1, x2) < x) low = parameter;
    else high = parameter;
  }
  return curve(parameter, y1, y2);
}

export function phaseMarkProgress(frame: NarrativeTimelineFrame, ease: (progress: number) => number): number {
  if (frame.kind === 'transition' || frame.kind === 'loop-bridge') return ease(frame.progress);
  return 1;
}

export function makeTransparentFrame(width: number, height: number): { ctx: SKRSContext2D; pixels: Uint8ClampedArray } {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  return { ctx, pixels: new Uint8ClampedArray(width * height * 4) };
}

export function rgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '');
  const value = raw.length === 3 ? [...raw].map((part) => part + part).join('') : raw;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

export function drawText(ctx: SKRSContext2D, text: string, x: number, baseline: number, face: string, weight: number, size: number, color: string): void {
  const font = { family: face, weight };
  ctx.font = `${narrativeCanvasWeight(font)} ${size}px "${face}"`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(text, x, baseline);
}

export function drawRule(ctx: SKRSContext2D, x1: number, y: number, x2: number, color: string, width = 1): void {
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}
