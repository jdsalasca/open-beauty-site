import { GlobalFonts } from '@napi-rs/canvas';
import { canvasFor, ensureFonts } from '../canvas.js';
import { getStyle } from '../styles/presets.js';
import { NarrativeError, type NarrativeFontMap, type NarrativeFontProfile, type NarrativeFontRole, type NarrativeFontRoleName } from '../types/narrative.js';
import type { StyleSlug } from '../types.js';

const roles = (
  display: NarrativeFontRole,
  reading: NarrativeFontRole,
  label: NarrativeFontRole,
  figure: NarrativeFontRole,
  annotation: NarrativeFontRole,
): NarrativeFontMap => ({ display, reading, label, figure, annotation });
const face = (family: string, weight = 400): NarrativeFontRole => ({ family, weight });

const PREFERRED: Record<StyleSlug, NarrativeFontMap> = {
  renaissance: roles(face('EB Garamond', 600), face('EB Garamond'), face('EB Garamond', 600), face('EB Garamond', 600), face('EB Garamond')),
  brutalist: roles(face('Archivo Black'), face('Space Mono'), face('Space Mono', 700), face('Archivo Black'), face('Space Mono')),
  papercraft: roles(face('Fraunces', 560), face('Nunito Sans'), face('Nunito Sans', 800), face('Fraunces', 560), face('Space Mono')),
  artdeco: roles(face('Poiret One'), face('Josefin Sans'), face('Josefin Sans'), face('Josefin Sans'), face('Josefin Sans')),
  isotype: roles(face('Jost'), face('IBM Plex Sans'), face('IBM Plex Sans'), face('Jost'), face('IBM Plex Sans')),
  opart: roles(face('Archivo Black'), face('Space Grotesk'), face('Space Grotesk'), face('Archivo Black'), face('Space Grotesk')),
  ukiyoe: roles(face('Shippori Mincho B1'), face('Zen Kaku Gothic New'), face('Zen Kaku Gothic New'), face('Shippori Mincho B1'), face('Zen Kaku Gothic New')),
  bestiary: roles(face('UnifrakturMaguntia'), face('IM Fell English'), face('IM Fell English'), face('UnifrakturMaguntia'), face('IM Fell English')),
  psychedelic: roles(face('Bungee Shade'), face('Space Grotesk'), face('Space Grotesk'), face('Bungee Shade'), face('Space Grotesk')),
  memphis: roles(face('Bricolage Grotesque'), face('DM Sans'), face('DM Sans'), face('Bricolage Grotesque'), face('DM Sans')),
  vaporwave: roles(face('Press Start 2P'), face('Space Grotesk'), face('Space Grotesk'), face('Press Start 2P'), face('Space Grotesk')),
  galactic: roles(face('Michroma'), face('Space Grotesk'), face('Space Grotesk'), face('Michroma'), face('Space Grotesk')),
  nature: roles(face('Cormorant Garamond'), face('Karla'), face('Karla'), face('Cormorant Garamond'), face('IBM Plex Mono')),
};

/** Approved bundled substitutes for guide families not shipped as raster fonts. */
const EFFECTIVE: Record<StyleSlug, NarrativeFontMap> = {
  renaissance: roles(face('EB Garamond', 600), face('EB Garamond'), face('EB Garamond', 600), face('EB Garamond', 600), face('EB Garamond')),
  brutalist: roles(face('Archivo Black'), face('Space Mono'), face('Space Mono', 700), face('Archivo Black'), face('Space Mono')),
  // Fraunces Soft is the display face. Its bundled build omits the middle dot,
  // which is explicitly drawn from the bundled Nunito Sans fallback below.
  papercraft: roles(face('Fraunces', 560), face('Nunito Sans'), face('Nunito Sans', 800), face('Fraunces', 560), face('Space Mono')),
  artdeco: roles(face('Archivo Black'), face('EB Garamond'), face('Space Mono', 700), face('EB Garamond'), face('Space Mono')),
  isotype: roles(face('Archivo Black'), face('Nunito Sans'), face('Nunito Sans', 700), face('Archivo Black'), face('Space Mono')),
  opart: roles(face('Archivo Black'), face('Nunito Sans'), face('Nunito Sans', 700), face('Archivo Black'), face('Space Mono')),
  ukiyoe: roles(face('EB Garamond', 600), face('Nunito Sans'), face('Nunito Sans', 700), face('EB Garamond'), face('Space Mono')),
  bestiary: roles(face('EB Garamond', 600), face('EB Garamond'), face('Space Mono', 700), face('EB Garamond', 600), face('Space Mono')),
  psychedelic: roles(face('Archivo Black'), face('Nunito Sans'), face('Nunito Sans', 700), face('Archivo Black'), face('Space Mono')),
  memphis: roles(face('Nunito Sans', 800), face('Nunito Sans'), face('Nunito Sans', 700), face('Nunito Sans', 800), face('Space Mono')),
  vaporwave: roles(face('Space Mono', 700), face('Nunito Sans'), face('Nunito Sans', 700), face('Space Mono', 700), face('Space Mono')),
  galactic: roles(face('Space Mono', 700), face('Nunito Sans'), face('Nunito Sans', 700), face('Space Mono', 700), face('Space Mono')),
  nature: roles(face('EB Garamond', 600), face('Nunito Sans'), face('Nunito Sans', 700), face('EB Garamond'), face('Space Mono')),
};

const ALTERNATIVES: Record<StyleSlug, NarrativeFontMap> = {
  ...EFFECTIVE,
  papercraft: roles(face('Nunito Sans', 800), face('Nunito Sans'), face('Nunito Sans', 800), face('Nunito Sans', 800), face('Space Mono')),
};

export const NARRATIVE_GLYPHS = 'áéíóúüñ¿¡0123456789%→·';

export interface FontGlyphCheck {
  style: StyleSlug;
  role: NarrativeFontRoleName;
  family: string;
  weight: number;
  glyphs: number;
  measured: number;
  renderedPixels: number;
  fallbackGlyphs: string[];
}

/** Canvas misreads this bundled face's metrics at its registered weight 560; 400 selects the same face with correct metrics. */
export function narrativeCanvasWeight(face: NarrativeFontRole): number {
  return face.family === 'Fraunces' ? 400 : face.weight;
}

const glyphInkCache = new Map<string, boolean>();

function hasGlyphInk(face: NarrativeFontRole, glyph: string): boolean {
  const key = `${face.family}/${face.weight}/${glyph}`;
  const cached = glyphInkCache.get(key);
  if (cached !== undefined) return cached;
  const { ctx } = canvasFor(80, 96);
  ctx.clearRect(0, 0, 80, 96);
  ctx.font = `${narrativeCanvasWeight(face)} 64px "${face.family}"`;
  ctx.fillStyle = '#000000';
  ctx.fillText(glyph, 8, 76);
  const pixels = ctx.getImageData(0, 0, 80, 96).data;
  let ink = false;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index]! > 0) {
      ink = true;
      break;
    }
  }
  glyphInkCache.set(key, ink);
  return ink;
}

/** Resolve one glyph explicitly when the primary bundled face lacks its outline. */
export function faceForNarrativeGlyph(primary: NarrativeFontRole, fallback: NarrativeFontRole, glyph: string): NarrativeFontRole {
  if (/^\s+$/u.test(glyph)) return primary;
  if (hasGlyphInk(primary, glyph)) return primary;
  if (hasGlyphInk(fallback, glyph)) return fallback;
  throw new NarrativeError(
    'FONT_MISSING',
    `Bundled ${primary.family} and approved fallback ${fallback.family} do not render required glyph "${glyph}".`,
    'Use bundled OFL faces that paint every required Spanish glyph; system fallback is not accepted.',
    `fonts.${primary.family}`,
  );
}

export function getNarrativeFontProfile(style: StyleSlug): NarrativeFontProfile {
  const preset = getStyle(style);
  if (!preset.typeSystem) {
    throw new NarrativeError('FONT_MISSING', `Style ${style} has no typeSystem tokens.`, 'Restore the style typeSystem before rendering a narrative.', `styles.${style}.typeSystem`);
  }
  return {
    preferred: PREFERRED[style],
    effective: EFFECTIVE[style],
    approvedAlternative: ALTERNATIVES[style],
    typeSystem: preset.typeSystem,
    source: 'bundled-ofl',
  };
}

function familyHasWeight(family: string, weight: number): boolean {
  const registered = GlobalFonts.families.find((candidate) => candidate.family.toLowerCase() === family.toLowerCase());
  return Boolean(registered?.styles.some((style) => style.weight === weight));
}

export function checkNarrativeFontRoles(style: StyleSlug): FontGlyphCheck[] {
  try {
    ensureFonts();
  } catch (error) {
    throw new NarrativeError(
      'FONT_MISSING',
      `Narrative bundled font registration failed: ${(error as Error).message}`,
      'Restore the bundled OFL files and ensure the raster font faces register before rendering.',
      'fonts',
    );
  }
  const profile = getNarrativeFontProfile(style);
  const result: FontGlyphCheck[] = [];
  for (const role of Object.keys(profile.effective) as NarrativeFontRoleName[]) {
    const { family, weight } = profile.effective[role];
    const fallback = profile.approvedAlternative[role];
    if (!GlobalFonts.has(family) || !familyHasWeight(family, weight)) {
      throw new NarrativeError(
        'FONT_MISSING',
        `Narrative ${style}/${role} requires bundled ${family} weight ${weight}, but that face is not registered.`,
        'Restore the bundled OFL font file or choose a registered approved alternative; system fallback is not accepted.',
        `fonts.${style}.${role}`,
      );
    }
    let measured = 0;
    let renderedPixels = 0;
    const fallbackGlyphs: string[] = [];
    const missingGlyphs: string[] = [];
    const { ctx } = canvasFor(80, 96);
    for (const glyph of NARRATIVE_GLYPHS) {
      const primaryFace = { family, weight };
      const face = hasGlyphInk(primaryFace, glyph) ? primaryFace : fallback;
      if (face.family !== primaryFace.family || face.weight !== primaryFace.weight) fallbackGlyphs.push(glyph);
      ctx.clearRect(0, 0, 80, 96);
      ctx.font = `${narrativeCanvasWeight(face)} 64px "${face.family}"`;
      const metrics = ctx.measureText(glyph);
      if (Number.isFinite(metrics.width) && metrics.width > 0 && Number.isFinite(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)) {
        measured += 1;
      }
      if (hasGlyphInk(face, glyph)) renderedPixels += 1;
      else missingGlyphs.push(glyph);
    }
    if (measured !== [...NARRATIVE_GLYPHS].length || renderedPixels !== [...NARRATIVE_GLYPHS].length) {
      throw new NarrativeError(
        'FONT_MISSING',
        `Narrative ${style}/${role} (${family} ${weight}) rendered ${renderedPixels}/${[...NARRATIVE_GLYPHS].length} required Spanish glyphs; missing: ${missingGlyphs.join(' ') || 'metrics did not resolve'}.`,
        'Use a bundled face with the complete Spanish glyph set; do not allow an unverified fallback.',
        `fonts.${style}.${role}`,
      );
    }
    result.push({ style, role, family, weight, glyphs: [...NARRATIVE_GLYPHS].length, measured, renderedPixels, fallbackGlyphs });
  }
  return result;
}

export function checkAllNarrativeFonts(): FontGlyphCheck[] {
  const checks = Object.keys(PREFERRED) as StyleSlug[];
  return checks.flatMap(checkNarrativeFontRoles);
}
