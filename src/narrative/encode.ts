import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import gifenc from 'gifenc';
import { createCanvas, type Canvas, type SKRSContext2D } from '@napi-rs/canvas';
import { ensureFonts } from '../canvas.js';
import { getStyle } from '../styles/presets.js';
import { NarrativeError, type NormalizedNarrativeBrief, type NarrativeFontProfile, type NarrativeLayout, type NarrativeRenderContext, type NarrativeScene, type NarrativeTimelineFrame } from '../types/narrative.js';
import { NARRATIVE_CONTACT_MIDPOINT_STYLES, narrativeLabelToneFor } from './composition.js';
import { faceForNarrativeGlyph, getNarrativeFontProfile, narrativeCanvasWeight } from './fonts.js';
import { NARRATIVE_MAX_MEMORY_BYTES, NARRATIVE_MAX_PIXEL_FRAMES, type NarrativeTimeline } from './timeline.js';
import { crossCheckWithFfprobe, verifyNarrativeGif, type FfprobeCrosscheck, type VerifiedGif } from './verify-gif.js';
import { measureCompositionBalance, type CompositionBalanceMetrics } from './evaluate.js';

const { GIFEncoder, applyPalette, quantize } = gifenc;
export const NARRATIVE_RENDERER_VERSION = 'narrative-core/0.2.0';
const SAMPLE_PIXELS_PER_FRAME = 2_048;
const CONTACT_TILE_WIDTH = 320;
const CONTACT_LABEL_HEIGHT = 28;

function seedRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function frameSeed(seed: number, index: number): number {
  return (seed + Math.imul(index + 1, 0x9e3779b9)) >>> 0;
}

function slug(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 56) || 'narrative';
}

function drawLine(
  ctx: SKRSContext2D,
  text: string,
  x: number,
  baseline: number,
  face: { family: string; weight: number },
  fallback: { family: string; weight: number },
  size: number,
  tracking: number,
): void {
  ctx.textBaseline = 'alphabetic';
  let cursor = x;
  for (const glyph of text) {
    const glyphFace = faceForNarrativeGlyph(face, fallback, glyph);
    ctx.font = `${narrativeCanvasWeight(glyphFace)} ${size}px "${glyphFace.family}"`;
    ctx.fillText(glyph, cursor, baseline);
    cursor += ctx.measureText(glyph).width + tracking;
  }
}

function blockBaselines(ctx: SKRSContext2D, block: { lines: string[]; size: number; lineHeight: number }, y: number, face: { family: string; weight: number }): number[] {
  ctx.font = `${narrativeCanvasWeight(face)} ${block.size}px "${face.family}"`;
  const ascent = ctx.measureText('ÁÉgjpq').actualBoundingBoxAscent || block.size * 0.8;
  return block.lines.map((_, index) => y + ascent + index * block.lineHeight);
}

function drawBlock(
  ctx: SKRSContext2D,
  block: { lines: string[]; size: number; lineHeight: number; tracking: number },
  x: number,
  y: number,
  face: { family: string; weight: number },
  fallback: { family: string; weight: number },
  color: string,
): void {
  const baselines = blockBaselines(ctx, block, y, face);
  ctx.fillStyle = color;
  block.lines.forEach((line, index) => drawLine(ctx, line, x, baselines[index]!, face, fallback, block.size, block.tracking));
}

function safeBoxes(layout: NarrativeLayout): { safe: NarrativeLayout['safeZone']; text: NarrativeLayout['textArea']; art: NarrativeLayout['reservedArtArea'] } {
  return { safe: layout.safeZone, text: layout.textArea, art: layout.reservedArtArea };
}

function sceneContext(
  brief: NormalizedNarrativeBrief,
  layout: NarrativeLayout,
  fonts: NarrativeFontProfile,
  object: unknown,
  frame: NarrativeTimelineFrame,
  index: number,
  localTimeMs: number,
): NarrativeRenderContext {
  const phaseIndex = frame.phaseIndex;
  const phase = brief.phases[phaseIndex]!;
  return {
    brief,
    layout,
    frame,
    localTimeMs,
    phaseIndex,
    phase,
    object,
    safeBoxes: safeBoxes(layout),
    fonts,
    rng: seedRandom(frameSeed(brief.seed, index)),
    semantic: phase.visual.semantic,
  };
}

function renderFramePixels(
  ctx: SKRSContext2D,
  brief: NormalizedNarrativeBrief,
  layout: NarrativeLayout,
  fonts: NarrativeFontProfile,
  scene: NarrativeScene,
  object: unknown,
  frame: NarrativeTimelineFrame,
  index: number,
  localTimeMs: number,
  artOnly = false,
): Uint8ClampedArray {
  const width = brief.output.width;
  const height = brief.output.height;
  const phaseIndex = frame.phaseIndex;
  const raw = scene.renderFrame(sceneContext(brief, layout, fonts, object, frame, index, localTimeMs));
  if (!(raw instanceof Uint8ClampedArray) || raw.length !== width * height * 4) {
    throw new NarrativeError('RESOURCE_LIMIT', `Scene ${scene.style} returned ${raw?.length ?? 0} RGBA bytes; expected ${width * height * 4}.`, 'Return one complete RGBA canvas for every timeline frame.');
  }
  const image = ctx.createImageData(width, height);
  image.data.set(raw);
  ctx.clearRect(0, 0, width, height);
  ctx.putImageData(image, 0, 0);
  // Composite genuine source alpha onto the style background before palette
  // quantization; no transparent pixels are left to become black in GIF.
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = getStyle(brief.style).palette.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';

  const phaseLayout = layout.phases[phaseIndex]!;
  const textArea = layout.textArea;
  const { titleY, labelY, bodyY } = layout.copyPositions;
  const palette = getStyle(brief.style).palette;
  const labelColor = palette[narrativeLabelToneFor(brief.style)];
  if (!artOnly) {
    drawBlock(ctx, layout.title, textArea.x, titleY, fonts.effective.display, fonts.approvedAlternative.display, palette.ink);
    drawBlock(ctx, phaseLayout.label, textArea.x, labelY, fonts.effective.label, fonts.approvedAlternative.label, labelColor);
    drawBlock(ctx, phaseLayout.body, textArea.x, bodyY, fonts.effective.reading, fonts.approvedAlternative.reading, palette.ink);
  }
  return ctx.getImageData(0, 0, width, height).data;
}

function sampleRgba(data: Uint8ClampedArray): Uint8Array {
  const pixels = data.length / 4;
  const stride = Math.max(1, Math.ceil(pixels / SAMPLE_PIXELS_PER_FRAME));
  const values = new Uint8Array(Math.ceil(pixels / stride) * 4);
  let target = 0;
  for (let pixel = 0; pixel < pixels; pixel += stride) {
    const offset = pixel * 4;
    values[target++] = data[offset]!;
    values[target++] = data[offset + 1]!;
    values[target++] = data[offset + 2]!;
    values[target++] = data[offset + 3]!;
  }
  return values.subarray(0, target);
}

function paletteLoss(samples: Uint8Array, palette: number[][]): { meanAbsoluteChannelError: number; maximumChannelError: number } {
  let channelError = 0;
  let sampleCount = 0;
  let maximum = 0;
  for (let offset = 0; offset + 3 < samples.length; offset += 4) {
    const red = samples[offset]!;
    const green = samples[offset + 1]!;
    const blue = samples[offset + 2]!;
    let nearest = palette[0] ?? [0, 0, 0];
    let best = Number.POSITIVE_INFINITY;
    for (const color of palette) {
      const dr = red - color[0]!;
      const dg = green - color[1]!;
      const db = blue - color[2]!;
      const distance = dr * dr + dg * dg + db * db;
      if (distance < best) {
        best = distance;
        nearest = color;
      }
    }
    for (const [actual, mapped] of [[red, nearest[0]!], [green, nearest[1]!], [blue, nearest[2]!]]) {
      const error = Math.abs(actual! - mapped!);
      channelError += error;
      maximum = Math.max(maximum, error);
      sampleCount += 1;
    }
  }
  return { meanAbsoluteChannelError: sampleCount ? channelError / sampleCount : 0, maximumChannelError: maximum };
}

function imageDataCanvas(width: number, height: number, pixels: Uint8ClampedArray): Canvas {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(width, height);
  image.data.set(pixels);
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function captureLabels(brief: NormalizedNarrativeBrief, timeline: NarrativeTimeline): Map<number, string[]> {
  const labels = new Map<number, string[]>();
  const add = (index: number, label: string) => labels.set(index, [...(labels.get(index) ?? []), label]);
  for (let phaseIndex = 0; phaseIndex < brief.phases.length; phaseIndex += 1) {
    const phase = brief.phases[phaseIndex]!;
    const semanticScene = phase.visual.semantic.primitive !== 'legacy-illustration';
    const startWord = semanticScene && brief.locale === 'en' ? 'start' : 'inicio';
    const holdWord = semanticScene && brief.locale === 'en' ? 'hold' : 'pausa';
    const exitWord = semanticScene && brief.locale === 'en' ? 'exit' : 'salida';
    const startIndex = timeline.frames.findIndex((frame) => frame.kind === 'entry' && frame.phaseIndex === phaseIndex);
    const holdIndex = timeline.holds[phaseIndex]!.frameIndex;
    add(startIndex, `${phase.id} · ${semanticScene ? startWord : 'inicio'}`);
    add(holdIndex, `${phase.id} · ${semanticScene ? holdWord : 'pausa'}`);
    const isLoopBridge = phaseIndex === brief.phases.length - 1;
    const midKind = isLoopBridge ? 'loop-bridge' : 'transition';
    const targetPhaseIndex = isLoopBridge ? 0 : phaseIndex + 1;
    let midIndex = -1;
    let midpointDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < timeline.frames.length; index += 1) {
      const frame = timeline.frames[index]!;
      if (frame.kind !== midKind || frame.fromPhaseIndex !== phaseIndex || frame.toPhaseIndex !== targetPhaseIndex) continue;
      const distance = Math.abs(frame.progress - 0.5);
      if (distance < midpointDistance) {
        midpointDistance = distance;
        midIndex = index;
      }
    }
    if (midIndex >= 0 && (NARRATIVE_CONTACT_MIDPOINT_STYLES.has(brief.style) || semanticScene)) {
      add(midIndex, semanticScene
        ? isLoopBridge
          ? `${phase.id} → ${brief.phases[0]!.id} · ${brief.locale === 'en' ? 'loop join' : 'unión del ciclo'}`
          : `${phase.id} → ${brief.phases[targetPhaseIndex]!.id} · ${brief.locale === 'en' ? 'transition midpoint' : 'punto medio de transición'}`
        : `${phase.id} · transición media`);
    }
    let exitIndex = -1;
    for (let index = 0; index < timeline.frames.length; index += 1) {
      const frame = timeline.frames[index]!;
      const isExit = phaseIndex === brief.phases.length - 1
        ? frame.kind === 'loop-bridge' && frame.fromPhaseIndex === phaseIndex
        : frame.kind === 'transition' && frame.fromPhaseIndex === phaseIndex;
      if (isExit) exitIndex = index;
    }
    if (phaseIndex === brief.phases.length - 1 && exitIndex < 0) exitIndex = holdIndex;
    if (exitIndex >= 0) add(exitIndex, `${phase.id} · ${semanticScene ? exitWord : 'salida'}`);
  }
  const hasSemantic = brief.phases.some((phase) => phase.visual.semantic.primitive !== 'legacy-illustration');
  add(0, hasSemantic && brief.locale === 'en' ? 'loop restart' : 'reinicio del loop');
  return labels;
}

function semanticCaptureSpecs(brief: NormalizedNarrativeBrief, timeline: NarrativeTimeline): Array<{ label: string; phaseIndex: number; fromPhaseIndex: number; frameIndex: number; kind: 'hold' | 'transition' | 'loop-bridge' }> {
  const result: Array<{ label: string; phaseIndex: number; fromPhaseIndex: number; frameIndex: number; kind: 'hold' | 'transition' | 'loop-bridge' }> = [];
  for (const hold of timeline.holds) {
    const label = brief.locale === 'en' ? 'hold' : 'pausa';
    result.push({ label: `${hold.phaseId} · ${label}`, phaseIndex: hold.phaseIndex, fromPhaseIndex: hold.phaseIndex, frameIndex: hold.frameIndex, kind: 'hold' });
  }
  for (const kind of ['transition', 'loop-bridge'] as const) {
    const keys = new Set(timeline.frames.filter((frame) => frame.kind === kind).map((frame) => `${frame.fromPhaseIndex}:${frame.toPhaseIndex}`));
    for (const key of keys) {
      const [fromPhaseIndex, toPhaseIndex] = key.split(':').map(Number) as [number, number];
      let bestIndex = -1;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let index = 0; index < timeline.frames.length; index += 1) {
        const frame = timeline.frames[index]!;
        if (frame.kind !== kind || frame.fromPhaseIndex !== fromPhaseIndex || frame.toPhaseIndex !== toPhaseIndex) continue;
        const distance = Math.abs(frame.progress - 0.5);
        if (distance < bestDistance) { bestDistance = distance; bestIndex = index; }
      }
      if (bestIndex >= 0) {
        const phaseIndex = toPhaseIndex;
        const label = kind === 'loop-bridge'
          ? `${brief.phases[fromPhaseIndex]!.id} → ${brief.phases[toPhaseIndex]!.id} · ${brief.locale === 'en' ? 'loop join' : 'unión del ciclo'}`
          : `${brief.phases[fromPhaseIndex]!.id} → ${brief.phases[toPhaseIndex]!.id} · ${brief.locale === 'en' ? 'transition midpoint' : 'punto medio de transición'}`;
        result.push({ label, phaseIndex, fromPhaseIndex, frameIndex: bestIndex, kind });
      }
    }
  }
  return result;
}

function drawContactTile(
  sheet: Canvas,
  source: Canvas,
  sourceContext: SKRSContext2D,
  sourceImage: ReturnType<SKRSContext2D['createImageData']>,
  index: number,
  labels: string[],
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): void {
  const columns = 4;
  const tileWidth = CONTACT_TILE_WIDTH;
  const tileHeight = Math.round(tileWidth * height / width);
  const cellHeight = tileHeight + CONTACT_LABEL_HEIGHT;
  const x = (index % columns) * tileWidth;
  const y = Math.floor(index / columns) * cellHeight;
  sourceImage.data.set(pixels);
  sourceContext.putImageData(sourceImage, 0, 0);
  const ctx = sheet.getContext('2d');
  ctx.drawImage(source, x, y, tileWidth, tileHeight);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y + tileHeight, tileWidth, CONTACT_LABEL_HEIGHT);
  ctx.fillStyle = '#161616';
  ctx.font = '700 15px "Space Mono"';
  ctx.textBaseline = 'middle';
  ctx.fillText(labels.join(' / ').slice(0, 39), x + 8, y + tileHeight + CONTACT_LABEL_HEIGHT / 2);
}

export interface NarrativeEncodedFiles {
  paths: { gif: string; png: string; contactSheet: string };
  bytes: { gif: number; png: number; contactSheet: number };
  finalSha256: string;
  decoded: VerifiedGif;
  ffprobe: FfprobeCrosscheck;
  palette: { colors: number; meanAbsoluteChannelError: number; maximumChannelError: number; sampledFrames: number };
  uniquePixelFrames: number;
  phaseHoldsVerified: Array<{ phaseId: string; requiredMs: number; decodedMs: number; passed: boolean }>;
  captureLabels: string[];
  resourceEstimate: { pixelFrames: number; maxPixelFrames: number; memoryBytes: number; maxMemoryBytes: number };
  rendererVersion: string;
  sceneVersion: string;
  fonts: NarrativeFontProfile;
  artOnly: boolean;
  semanticObjectCaptures: Array<{ label: string; phaseIndex: number; fromPhaseIndex: number; frameIndex: number; kind: 'hold' | 'transition' | 'loop-bridge'; regions: ReturnType<NonNullable<NarrativeScene['objectRegions']>> }>;
  compositionByFrame?: Array<{
    frameIndex: number;
    label: string;
    phaseId: string;
    kind: 'hold' | 'transition' | 'loop-bridge';
    regions: ReturnType<NonNullable<NarrativeScene['objectRegions']>>;
    metrics: CompositionBalanceMetrics;
  }>;
}

export async function encodeNarrative(
  brief: NormalizedNarrativeBrief,
  hash: string,
  layout: NarrativeLayout,
  timeline: NarrativeTimeline,
  scene: NarrativeScene,
  outputDir: string,
  artOnly = false,
): Promise<NarrativeEncodedFiles> {
  ensureFonts();
  const fonts = getNarrativeFontProfile(brief.style);
  const width = brief.output.width;
  const height = brief.output.height;
  const aspect = width / height;
  if (!scene.supportsAspect(aspect)) {
    throw new NarrativeError('UNSUPPORTED_ASPECT', `Scene ${scene.style} does not support aspect ${aspect.toFixed(3)} (${width}×${height}).`, 'Choose a ratio supported by this style scene.', 'output');
  }
  await mkdir(outputDir, { recursive: true });
  const basename = `${slug(brief.title)}-${hash.slice(0, 8)}${artOnly ? '-art-only' : ''}`;
  const paths = {
    gif: path.join(outputDir, `${basename}.gif`),
    png: path.join(outputDir, `${basename}.png`),
    contactSheet: path.join(outputDir, `${basename}-contact-sheet.png`),
  };
  const renderCanvas = createCanvas(width, height);
  const renderContext = renderCanvas.getContext('2d');
  const seed = seedRandom(brief.seed ^ 0xa5a5a5a5);
  const object = scene.createObject(brief, seed);
  const semanticSpecs = semanticCaptureSpecs(brief, timeline);
  const semanticSpecByFrame = new Map(semanticSpecs.map((spec) => [spec.frameIndex, spec]));
  const semanticObjectCaptures: NarrativeEncodedFiles['semanticObjectCaptures'] = [];
  let localTimeMs = 0;
  const phaseSamples: Uint8Array[] = [];
  const pixelHashes = new Set<string>();
  for (let index = 0; index < timeline.frames.length; index += 1) {
    const frame = timeline.frames[index]!;
    const pixels = renderFramePixels(renderContext, brief, layout, fonts, scene, object, frame, index, localTimeMs, artOnly);
    const spec = semanticSpecByFrame.get(index);
    if (spec) {
      const context = sceneContext(brief, layout, fonts, object, frame, index, localTimeMs);
      semanticObjectCaptures.push({ ...spec, regions: scene.objectRegions?.(context) ?? [] });
    }
    phaseSamples.push(sampleRgba(pixels));
    pixelHashes.add(createHash('sha256').update(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength)).digest('hex'));
    localTimeMs += timeline.frames[index]!.delayMs;
  }
  const sampleLength = phaseSamples.reduce((sum, sample) => sum + sample.length, 0);
  let paletteInput = new Uint8Array(sampleLength);
  let sampleOffset = 0;
  for (const sample of phaseSamples) {
    paletteInput.set(sample, sampleOffset);
    sampleOffset += sample.length;
  }
  const palette = quantize(paletteInput, 128, { format: 'rgb444', clearAlpha: true });
  if (!palette.length) throw new NarrativeError('RESOURCE_LIMIT', 'GIF palette sampling produced no colors.', 'Render at least one fully composited phase.');
  const loss = paletteLoss(paletteInput, palette);
  phaseSamples.length = 0;
  paletteInput = new Uint8Array();
  const indices = captureLabels(brief, timeline);
  const captureCount = indices.size;
  const tileHeight = Math.round(CONTACT_TILE_WIDTH * height / width) + CONTACT_LABEL_HEIGHT;
  const rows = Math.ceil(captureCount / 4);
  const contactCanvas = createCanvas(CONTACT_TILE_WIDTH * 4, tileHeight * rows);
  const contactSourceCanvas = createCanvas(width, height);
  const contactSourceContext = contactSourceCanvas.getContext('2d');
  const contactSourceImage = contactSourceContext.createImageData(width, height);
  const encoder = GIFEncoder();
  const gifPalette = palette.length < 2 ? [...palette, palette[0]!] : palette;
  let holdFramePixels: Uint8ClampedArray | undefined;
  localTimeMs = 0;
  let tileIndex = 0;
  for (let index = 0; index < timeline.frames.length; index += 1) {
    const frame = timeline.frames[index]!;
    const pixels = renderFramePixels(renderContext, brief, layout, fonts, scene, object, frame, index, localTimeMs, artOnly);
    const rgbaSamples = applyPalette(pixels, gifPalette, 'rgb444');
    encoder.writeFrame(rgbaSamples, width, height, {
      palette: gifPalette,
      delay: frame.delayMs,
      repeat: index === 0 ? (brief.playback.loop ? 0 : -1) : undefined,
      dispose: 1,
    });
    if (frame.kind === 'hold' && frame.phaseIndex === 0) holdFramePixels = pixels.slice();
    const labels = indices.get(index);
    if (labels) {
      drawContactTile(contactCanvas, contactSourceCanvas, contactSourceContext, contactSourceImage, tileIndex, labels, pixels, width, height);
      tileIndex += 1;
    }
    localTimeMs += frame.delayMs;
  }
  encoder.finish();
  const gifBytes = Buffer.from(encoder.bytes());
  await writeFile(paths.gif, gifBytes);
  if (!holdFramePixels) throw new NarrativeError('RESOURCE_LIMIT', 'The first phase did not produce a static hold frame.', 'Include a complete first phase in the narrative timeline.');
  const poster = imageDataCanvas(width, height, holdFramePixels);
  const pngBytes = Buffer.from(poster.encodeSync('png'));
  const contactBytes = Buffer.from(contactCanvas.encodeSync('png'));
  holdFramePixels = undefined;
  await writeFile(paths.png, pngBytes);
  await writeFile(paths.contactSheet, contactBytes);
  renderCanvas.width = 1;
  renderCanvas.height = 1;
  poster.width = 1;
  poster.height = 1;
  contactCanvas.width = 1;
  contactCanvas.height = 1;
  contactSourceCanvas.width = 1;
  contactSourceCanvas.height = 1;

  const captureByFrame = new Map(semanticObjectCaptures.map((capture) => [capture.frameIndex, capture]));
  const compositionByFrame: NonNullable<NarrativeEncodedFiles['compositionByFrame']> = [];
  const retainDecodedSamples = semanticObjectCaptures.some((capture) => capture.regions.length > 0);
  const decoded = verifyNarrativeGif(gifBytes, semanticObjectCaptures.map((capture) => capture.frameIndex), {
    retainSamples: retainDecodedSamples,
    onSample: ({ index, rgb }) => {
      const capture = captureByFrame.get(index);
      if (!capture) return;
      compositionByFrame.push({
        frameIndex: capture.frameIndex,
        label: capture.label,
        phaseId: brief.phases[capture.phaseIndex]!.id,
        kind: capture.kind,
        regions: capture.regions,
        metrics: measureCompositionBalance({ rgb, width, height, background: getStyle(brief.style).palette.bg, textArea: layout.textArea }),
      });
    },
  });
  const ffprobe = await crossCheckWithFfprobe(paths.gif, decoded);
  const phaseHoldsVerified = timeline.holds.map((hold) => {
    const decodedMs = decoded.delaysMs[hold.frameIndex] ?? 0;
    return { phaseId: hold.phaseId, requiredMs: hold.encodedMs, decodedMs, passed: decodedMs >= hold.encodedMs };
  });
  if (decoded.width !== width || decoded.height !== height || decoded.frames.length !== timeline.frames.length) {
    throw new NarrativeError('RESOURCE_LIMIT', `Decoded GIF metadata ${decoded.width}×${decoded.height}/${decoded.frames.length} frames does not match ${width}×${height}/${timeline.frames.length}.`, 'Inspect the encoder metadata and retry.');
  }
  if (decoded.loopCount !== (brief.playback.loop ? 0 : null)) {
    throw new NarrativeError('RESOURCE_LIMIT', `Decoded GIF loop count ${decoded.loopCount} does not match loop=${brief.playback.loop}.`, 'Check the loop bridge and GIF repeat extension.');
  }
  if (phaseHoldsVerified.some((hold) => !hold.passed)) {
    const failed = phaseHoldsVerified.find((hold) => !hold.passed)!;
    throw new NarrativeError('BAD_DURATION', `Decoded phase "${failed.phaseId}" holds for ${failed.decodedMs}ms; ${failed.requiredMs}ms was requested.`, 'Use a GIF delay representable in centiseconds and regenerate.');
  }
  if (!decoded.integrity.valid) {
    throw new NarrativeError('RESOURCE_LIMIT', `Encoded GIF failed independent integrity verification: ${decoded.integrity.errors.join('; ')}.`, 'Inspect the encoder output and retry.');
  }
  const finalSha256 = createHash('sha256').update(gifBytes).digest('hex');
  return {
    paths,
    bytes: { gif: gifBytes.length, png: pngBytes.length, contactSheet: contactBytes.length },
    finalSha256,
    decoded,
    ffprobe,
    palette: {
      colors: palette.length,
      meanAbsoluteChannelError: Number(loss.meanAbsoluteChannelError.toFixed(3)),
      maximumChannelError: loss.maximumChannelError,
      sampledFrames: timeline.frames.length,
    },
    uniquePixelFrames: pixelHashes.size,
    phaseHoldsVerified,
    captureLabels: [...indices.values()].flat(),
    resourceEstimate: {
      pixelFrames: width * height * timeline.frames.length,
      maxPixelFrames: NARRATIVE_MAX_PIXEL_FRAMES,
      memoryBytes: timeline.estimatedMemoryBytes,
      maxMemoryBytes: NARRATIVE_MAX_MEMORY_BYTES,
    },
    rendererVersion: NARRATIVE_RENDERER_VERSION,
    sceneVersion: scene.version,
    fonts,
    artOnly,
    semanticObjectCaptures,
    compositionByFrame,
  };
}
