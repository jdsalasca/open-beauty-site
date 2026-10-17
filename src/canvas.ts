import { GlobalFonts, createCanvas, type Canvas, type SKRSContext2D } from '@napi-rs/canvas';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { BeautyError } from './page/common.js';
import { packageRoot } from './paths.js';

const FONT_FILES: Array<[string, string]> = [
  ['CrimsonText-Regular.ttf', 'Crimson Text'],
  ['CrimsonText-SemiBold.ttf', 'Crimson Text'],
  ['CrimsonText-Bold.ttf', 'Crimson Text'],
  ['CrimsonText-Italic.ttf', 'Crimson Text'],
  ['ArchivoBlack-Regular.ttf', 'Archivo Black'],
  ['SpaceMono-Regular.ttf', 'Space Mono'],
  ['SpaceMono-Bold.ttf', 'Space Mono'],
  ['DMSerifDisplay-Regular.ttf', 'DM Serif Display'],
  ['Lato-Regular.ttf', 'Lato'],
  ['Lato-Bold.ttf', 'Lato'],
  ['Lato-Black.ttf', 'Lato'],
];

let registered = false;

export function ensureFonts(): void {
  if (registered) return;
  const root = packageRoot();
  const missing: string[] = [];
  for (const [file, family] of FONT_FILES) {
    const filePath = path.join(root, 'fonts', file);
    if (!existsSync(filePath)) {
      missing.push(file);
      continue;
    }
    GlobalFonts.registerFromPath(filePath, family);
  }
  if (missing.length) {
    throw new BeautyError(`Missing bundled font files: ${missing.join(', ')}`, 'FONTS_MISSING');
  }
  registered = true;
}

export function canvasFor(width: number, height: number): { canvas: Canvas; ctx: SKRSContext2D } {
  ensureFonts();
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}
