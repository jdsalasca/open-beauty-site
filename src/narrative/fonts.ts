import { bundledFontFace, canvasFor, ensureFonts } from '../canvas.js';
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

/**
 * Guide families per style, now shipped as repository-bundled OFL faces.
 * Poiret One is never bold; Jost/IBM Plex labels use the guide's 500; the
 * remaining weights follow each style guide's display/body/label sizes.
 */
const PREFERRED: Record<StyleSlug, NarrativeFontMap> = {
  renaissance: roles(face('EB Garamond', 600), face('EB Garamond'), face('EB Garamond', 600), face('EB Garamond', 600), face('EB Garamond')),
  brutalist: roles(face('Archivo Black'), face('Space Mono'), face('Space Mono', 700), face('Archivo Black'), face('Space Mono')),
  papercraft: roles(face('Fraunces', 560), face('Nunito Sans'), face('Nunito Sans', 800), face('Fraunces', 560), face('Space Mono')),
  artdeco: roles(face('Poiret One'), face('Josefin Sans'), face('Josefin Sans', 600), face('Poiret One'), face('Josefin Sans')),
  isotype: roles(face('Jost', 500), face('IBM Plex Sans'), face('IBM Plex Sans', 500), face('Jost', 500), face('IBM Plex Sans')),
  opart: roles(face('Archivo Black'), face('Space Grotesk'), face('Space Grotesk', 500), face('Archivo Black'), face('Space Grotesk')),
  ukiyoe: roles(face('Shippori Mincho B1', 700), face('Zen Kaku Gothic New'), face('Zen Kaku Gothic New', 500), face('Shippori Mincho B1', 700), face('Zen Kaku Gothic New')),
  bestiary: roles(face('UnifrakturMaguntia'), face('IM Fell English'), face('IM Fell English'), face('UnifrakturMaguntia'), face('IM Fell English')),
  psychedelic: roles(face('Bungee Shade'), face('Space Grotesk'), face('Space Grotesk', 500), face('Bungee Shade'), face('Space Grotesk')),
  memphis: roles(face('Bricolage Grotesque', 700), face('DM Sans'), face('DM Sans', 500), face('Bricolage Grotesque', 700), face('DM Sans')),
  vaporwave: roles(face('Press Start 2P'), face('Space Grotesk'), face('Space Grotesk', 500), face('Press Start 2P'), face('Space Grotesk')),
  galactic: roles(face('Michroma'), face('Space Grotesk'), face('Space Grotesk', 500), face('Michroma'), face('Space Grotesk')),
  nature: roles(face('Cormorant Garamond'), face('Karla'), face('Karla', 600), face('Cormorant Garamond'), face('Karla')),
};

/** All guide families are bundled; the effective map is the preferred map. */
const EFFECTIVE: Record<StyleSlug, NarrativeFontMap> = PREFERRED;

/**
 * Explicit per-glyph fallback faces, reported by `pnpm fonts:check` and stored in
 * every manifest. They are used only when the primary bundled face lacks a glyph
 * outline (for example the arrow `→`, absent from the fontsource Latin subsets).
 * A missing *file* never reaches these maps: it raises FONT_MISSING instead.
 * Where the previously approved bundled alternative could not paint `→`, the
 * glyph-complete bundled faces (EB Garamond, Archivo Black, Space Mono) are used
 * and are reported as fallback glyphs.
 */
const ALTERNATIVES: Record<StyleSlug, NarrativeFontMap> = {
  renaissance: roles(face('EB Garamond', 600), face('EB Garamond'), face('EB Garamond', 600), face('EB Garamond', 600), face('EB Garamond')),
  brutalist: roles(face('Archivo Black'), face('Space Mono'), face('Space Mono', 700), face('Archivo Black'), face('Space Mono')),
  papercraft: roles(face('EB Garamond', 600), face('EB Garamond'), face('Space Mono', 700), face('EB Garamond', 600), face('Space Mono')),
  artdeco: roles(face('Archivo Black'), face('EB Garamond'), face('Space Mono', 700), face('EB Garamond'), face('Space Mono')),
  isotype: roles(face('Archivo Black'), face('EB Garamond'), face('Space Mono', 700), face('Archivo Black'), face('Space Mono')),
  opart: roles(face('Archivo Black'), face('EB Garamond'), face('Space Mono', 700), face('Archivo Black'), face('Space Mono')),
  ukiyoe: roles(face('EB Garamond', 600), face('EB Garamond'), face('Space Mono', 700), face('EB Garamond', 600), face('Space Mono')),
  bestiary: roles(face('EB Garamond', 600), face('EB Garamond'), face('Space Mono', 700), face('EB Garamond', 600), face('Space Mono')),
  psychedelic: roles(face('Archivo Black'), face('EB Garamond'), face('Space Mono', 700), face('Archivo Black'), face('Space Mono')),
  memphis: roles(face('Archivo Black'), face('EB Garamond'), face('Space Mono', 700), face('Archivo Black'), face('Space Mono')),
  vaporwave: roles(face('Space Mono', 700), face('EB Garamond'), face('Space Mono', 700), face('Space Mono', 700), face('Space Mono')),
  galactic: roles(face('Space Mono', 700), face('EB Garamond'), face('Space Mono', 700), face('Space Mono', 700), face('Space Mono')),
  nature: roles(face('EB Garamond', 600), face('EB Garamond'), face('Space Mono', 700), face('EB Garamond', 600), face('Space Mono')),
};

export const NARRATIVE_GLYPHS = 'áéíóúüñ¿¡0123456789%→·';

/** Noncharacter guaranteed to resolve to the face's missing-glyph outline. */
const NOTDEF_GLYPH = '\uFFFE';

export interface FontGlyphCheck {
  style: StyleSlug;
  role: NarrativeFontRoleName;
  family: string;
  weight: number;
  glyphs: number;
  measured: number;
  renderedPixels: number;
  fallbackGlyphs: string[];
  syntheticBold: boolean;
  syntheticItalic: boolean;
}

/** Canvas misreads this bundled face's metrics at its registered weight 560; 400 selects the same face with correct metrics. */
export function narrativeCanvasWeight(face: NarrativeFontRole): number {
  return face.family === 'Fraunces' ? 400 : face.weight;
}

const glyphRasterCache = new Map<string, Uint8ClampedArray>();

function glyphRaster(face: NarrativeFontRole, glyph: string): Uint8ClampedArray {
  const key = `${face.family}/${face.weight}/${glyph}`;
  const cached = glyphRasterCache.get(key);
  if (cached) return cached;
  const { ctx } = canvasFor(80, 96);
  ctx.clearRect(0, 0, 80, 96);
  ctx.font = `${narrativeCanvasWeight(face)} 64px "${face.family}"`;
  ctx.fillStyle = '#000000';
  ctx.fillText(glyph, 8, 76);
  const pixels = ctx.getImageData(0, 0, 80, 96).data;
  const alpha = new Uint8ClampedArray(pixels.length / 4);
  for (let index = 0; index < alpha.length; index += 1) alpha[index] = pixels[index * 4 + 3]!;
  glyphRasterCache.set(key, alpha);
  return alpha;
}

function sameRaster(left: Uint8ClampedArray, right: Uint8ClampedArray): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

function rasterHasInk(raster: Uint8ClampedArray): boolean {
  for (let index = 0; index < raster.length; index += 1) {
    if (raster[index]! > 0) return true;
  }
  return false;
}

/**
 * Only these bundled families carry the arrow in their Latin subset. Every other
 * bundled face paints the rest of the required Spanish set; `→` must therefore
 * resolve through the explicit fallback instead of Skia's system fallback.
 */
const ARROW_FAMILIES = new Set(['Archivo Black', 'EB Garamond', 'Space Mono']);

/**
 * True only when the bundled face owns a real outline for the glyph. The required
 * glyph set is verified from the shipped cmaps; unknown glyphs fall back to a
 * raster comparison so the missing-glyph box is never certified as coverage.
 */
export function hasGlyphOutline(face: NarrativeFontRole, glyph: string): boolean {
  if (/^\s+$/u.test(glyph)) return true;
  if (glyph === '→') return ARROW_FAMILIES.has(face.family);
  if (NARRATIVE_GLYPHS.includes(glyph)) return true;
  const raster = glyphRaster(face, glyph);
  if (!rasterHasInk(raster)) return false;
  return !sameRaster(raster, glyphRaster(face, NOTDEF_GLYPH));
}

function glyphPaints(face: NarrativeFontRole, glyph: string): boolean {
  return rasterHasInk(glyphRaster(face, glyph));
}

/** Every role face must come from the repository bundle; system fonts are not evidence. */
export function requireBundledNarrativeFace(face: NarrativeFontRole, context = 'narrative'): void {
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
  if (!bundledFontFace(face.family, face.weight)) {
    throw new NarrativeError(
      'FONT_MISSING',
      `Narrative ${context} requires bundled ${face.family} weight ${face.weight}, but that bundled face is not registered.`,
      'Restore the bundled OFL font file or the guide family; the approved alternative is never a silent file substitute.',
      `fonts.${face.family}`,
    );
  }
}

/** Skia synthesizes bold/italic when no exact bundled face exists; report it instead of drawing it. */
export function detectSyntheticFace(face: NarrativeFontRole, italic = false): { syntheticBold: boolean; syntheticItalic: boolean } {
  return {
    syntheticBold: !bundledFontFace(face.family, face.weight),
    syntheticItalic: italic ? !bundledFontFace(face.family, face.weight, 'italic') : false,
  };
}

/** Resolve one glyph explicitly when the primary bundled face lacks its outline. */
export function faceForNarrativeGlyph(primary: NarrativeFontRole, fallback: NarrativeFontRole, glyph: string): NarrativeFontRole {
  if (/^\s+$/u.test(glyph)) return primary;
  if (!bundledFontFace(primary.family, primary.weight)) {
    throw new NarrativeError(
      'FONT_MISSING',
      `Bundled narrative face ${primary.family} weight ${primary.weight} is not registered.`,
      'Restore the bundled OFL file; a missing file is never replaced silently.',
      `fonts.${primary.family}`,
    );
  }
  if (hasGlyphOutline(primary, glyph)) return primary;
  if (!bundledFontFace(fallback.family, fallback.weight) || !hasGlyphOutline(fallback, glyph)) {
    throw new NarrativeError(
      'FONT_MISSING',
      `Bundled ${primary.family} and approved fallback ${fallback.family} do not render required glyph "${glyph}".`,
      'Use bundled OFL faces that paint every required Spanish glyph; system fallback is not accepted.',
      `fonts.${primary.family}`,
    );
  }
  return fallback;
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

export function checkNarrativeFontRoles(style: StyleSlug): FontGlyphCheck[] {
  const profile = getNarrativeFontProfile(style);
  const result: FontGlyphCheck[] = [];
  for (const role of Object.keys(profile.effective) as NarrativeFontRoleName[]) {
    const { family, weight } = profile.effective[role];
    const fallback = profile.approvedAlternative[role];
    requireBundledNarrativeFace({ family, weight }, `${style}/${role}`);
    requireBundledNarrativeFace(fallback, `${style}/${role} fallback`);
    const synthetic = detectSyntheticFace({ family, weight });
    let measured = 0;
    let renderedPixels = 0;
    const fallbackGlyphs: string[] = [];
    const missingGlyphs: string[] = [];
    const { ctx } = canvasFor(80, 96);
    for (const glyph of NARRATIVE_GLYPHS) {
      const primaryFace = { family, weight };
      const face = hasGlyphOutline(primaryFace, glyph) ? primaryFace : fallback;
      if (face.family !== primaryFace.family || face.weight !== primaryFace.weight) fallbackGlyphs.push(glyph);
      ctx.clearRect(0, 0, 80, 96);
      ctx.font = `${narrativeCanvasWeight(face)} 64px "${face.family}"`;
      const metrics = ctx.measureText(glyph);
      if (Number.isFinite(metrics.width) && metrics.width > 0 && Number.isFinite(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent)) {
        measured += 1;
      }
      if (hasGlyphOutline(face, glyph) && glyphPaints(face, glyph)) renderedPixels += 1;
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
    result.push({ style, role, family, weight, glyphs: [...NARRATIVE_GLYPHS].length, measured, renderedPixels, fallbackGlyphs, syntheticBold: synthetic.syntheticBold, syntheticItalic: synthetic.syntheticItalic });
  }
  return result;
}

export function checkAllNarrativeFonts(): FontGlyphCheck[] {
  const checks = Object.keys(PREFERRED) as StyleSlug[];
  return checks.flatMap(checkNarrativeFontRoles);
}
