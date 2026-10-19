import { GlobalFonts, createCanvas, type Canvas, type SKRSContext2D } from '@napi-rs/canvas';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { BeautyError } from './page/common.js';
import { packageRoot } from './paths.js';

export type BundledFontStyle = 'normal' | 'italic';

export interface BundledFontFace {
  file: string;
  family: string;
  weight: number;
  style: BundledFontStyle;
}

interface FontFileSpec {
  file: string;
  family: string;
  weight?: number;
  style?: BundledFontStyle;
}

const FONT_FILES: FontFileSpec[] = [
  { file: 'ArchivoBlack-Regular.ttf', family: 'Archivo Black' },
  { file: 'SpaceMono-Regular.ttf', family: 'Space Mono' },
  { file: 'SpaceMono-Bold.ttf', family: 'Space Mono', weight: 700 },
  { file: 'EBGaramond-Regular.ttf', family: 'EB Garamond' },
  { file: 'EBGaramond-SemiBold.ttf', family: 'EB Garamond', weight: 600 },
  { file: 'EBGaramond-Italic.ttf', family: 'EB Garamond', style: 'italic' },
  { file: 'Fraunces-Soft.ttf', family: 'Fraunces', weight: 560 },
  { file: 'NunitoSans-Regular.ttf', family: 'Nunito Sans' },
  { file: 'NunitoSans-Bold.ttf', family: 'Nunito Sans', weight: 700 },
  { file: 'NunitoSans-ExtraBold.ttf', family: 'Nunito Sans', weight: 800 },
  { file: 'PoiretOne-Regular.woff2', family: 'Poiret One' },
  { file: 'JosefinSans-Regular.woff2', family: 'Josefin Sans' },
  { file: 'JosefinSans-SemiBold.woff2', family: 'Josefin Sans', weight: 600 },
  { file: 'Jost-Medium.woff2', family: 'Jost', weight: 500 },
  { file: 'IBMPlexSans-Regular.woff2', family: 'IBM Plex Sans' },
  { file: 'IBMPlexSans-Medium.woff2', family: 'IBM Plex Sans', weight: 500 },
  { file: 'SpaceGrotesk-Regular.woff2', family: 'Space Grotesk' },
  { file: 'SpaceGrotesk-Medium.woff2', family: 'Space Grotesk', weight: 500 },
  { file: 'ShipporiMinchoB1-Bold.woff2', family: 'Shippori Mincho B1', weight: 700 },
  { file: 'ZenKakuGothicNew-Regular.woff2', family: 'Zen Kaku Gothic New' },
  { file: 'ZenKakuGothicNew-Medium.woff2', family: 'Zen Kaku Gothic New', weight: 500 },
  { file: 'UnifrakturMaguntia-Regular.woff2', family: 'UnifrakturMaguntia' },
  { file: 'IMFellEnglish-Regular.woff2', family: 'IM Fell English' },
  { file: 'BungeeShade-Regular.woff2', family: 'Bungee Shade' },
  { file: 'BricolageGrotesque-Bold.woff2', family: 'Bricolage Grotesque', weight: 700 },
  { file: 'DMSans-Regular.woff2', family: 'DM Sans' },
  { file: 'DMSans-Medium.woff2', family: 'DM Sans', weight: 500 },
  { file: 'PressStart2P-Regular.woff2', family: 'Press Start 2P' },
  { file: 'Michroma-Regular.woff2', family: 'Michroma' },
  { file: 'CormorantGaramond-Regular.woff2', family: 'Cormorant Garamond' },
  { file: 'Karla-Regular.woff2', family: 'Karla' },
  { file: 'Karla-SemiBold.woff2', family: 'Karla', weight: 600 },
];

let registered = false;
let registeredFaces: BundledFontFace[] = [];

export function ensureFonts(): void {
  if (registered) return;
  const root = packageRoot();
  const missing: string[] = [];
  const failedRegistration: string[] = [];
  const faces: BundledFontFace[] = [];
  for (const spec of FONT_FILES) {
    const filePath = path.join(root, 'fonts', spec.file);
    if (!existsSync(filePath)) {
      missing.push(spec.file);
      continue;
    }
    if (!GlobalFonts.registerFromPath(filePath, spec.family)) {
      failedRegistration.push(spec.file);
      continue;
    }
    faces.push({ file: spec.file, family: spec.family, weight: spec.weight ?? 400, style: spec.style ?? 'normal' });
  }
  if (missing.length || failedRegistration.length) {
    const details = [
      missing.length ? `missing bundled files: ${missing.join(', ')}` : '',
      failedRegistration.length ? `failed to register: ${failedRegistration.join(', ')}` : '',
    ].filter(Boolean).join('; ');
    throw new BeautyError(`Bundled fonts unavailable (${details}).`, 'FONTS_MISSING');
  }
  registeredFaces = faces;
  registered = true;
}

/** Faces actually registered from the repository bundle (never system fonts). */
export function bundledFontFaces(): readonly BundledFontFace[] {
  ensureFonts();
  return registeredFaces;
}

export function bundledFontFace(family: string, weight: number, style: BundledFontStyle = 'normal'): BundledFontFace | undefined {
  return bundledFontFaces().find(
    (face) => face.family.toLowerCase() === family.toLowerCase() && face.weight === weight && face.style === style,
  );
}

export function canvasFor(width: number, height: number): { canvas: Canvas; ctx: SKRSContext2D } {
  ensureFonts();
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}
