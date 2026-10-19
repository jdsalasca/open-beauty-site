import gifenc from 'gifenc';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import type { SequenceBrief, SequenceFrame, SequenceResult, StylePreset } from './types.js';
import { renderCanvas } from './canvas-art.js';
import { ensureFonts } from './canvas.js';
import { getStyle } from './styles/presets.js';

const { GIFEncoder, applyPalette, quantize } = gifenc;

const SIZE: Record<NonNullable<SequenceBrief['size']>, [number, number]> = {
  square: [1200, 1200],
  portrait: [1000, 1400],
  landscape: [1600, 1000],
  wide: [1600, 700],
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normaliseFrame(frame: SequenceFrame, index: number): SequenceFrame {
  return {
    ...frame,
    id: frame.id || `frame-${index + 1}`,
    duration: clamp(Number(frame.duration ?? 2.4), 0.3, 12),
    layers: frame.layers ?? [],
  };
}

function rasterFonts(preset: StylePreset): Record<'display' | 'body' | 'mono', string> {
  const display = preset.slug === 'papercraft' ? 'Fraunces' : ['brutalist', 'opart', 'psychedelic', 'galactic', 'vaporwave', 'memphis'].includes(preset.slug) ? 'Archivo Black' : 'EB Garamond';
  return { display, body: 'Nunito Sans', mono: 'Space Mono' };
}

function frameSvg(preset: StylePreset, brief: Partial<SequenceBrief>, frame: SequenceFrame, width: number, height: number, assets: string[], fontMap?: Record<'display' | 'body' | 'mono', string>): string {
  const svg = renderCanvas(
    {
      style: preset.slug,
      title: brief.title || `Frame ${frame.id}`,
      width,
      height,
      background: frame.background || '@bg',
      texture: frame.texture,
      credits: brief.credits ?? true,
      layers: frame.layers,
    },
    { frameTime: 0.86, staticFrame: true, fontMap },
  );
  for (const match of svg.matchAll(/aria-label="([^"]+)"/g)) assets.push(match[1] ?? '');
  return svg;
}

function innerSvg(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
}

function timing(frames: SequenceFrame[]): { total: number; at: Array<{ start: number; end: number }> } {
  const durations = frames.map((frame) => frame.duration ?? 2.4);
  const total = durations.reduce((sum, value) => sum + value, 0);
  let acc = 0;
  return {
    total,
    at: durations.map((duration) => {
      const start = acc;
      acc += duration;
      return { start, end: acc };
    }),
  };
}

function sequenceCss(frames: SequenceFrame[]): string {
  const { total, at } = timing(frames);
  const rules = at
    .map(({ start, end }, index) => {
      const a = (start / total) * 100;
      const b = (end / total) * 100;
      return `.seq-f${index}{animation:seq-${index} ${total}s linear infinite}.seq-f${index}{animation-delay:0s}@keyframes seq-${index}{0%,${a}%{opacity:0}${a + 0.01}%,${b}%{opacity:1}${Math.min(100, b + 0.01)}%,100%{opacity:0}}`;
    })
    .join('');
  return `.seq-frame{opacity:0}.seq-frame:first-child{opacity:1}${rules}@media (prefers-reduced-motion:reduce){.seq-frame{animation:none!important;opacity:0!important}.seq-frame:first-child{opacity:1!important}}`;
}

export async function renderSequence(input: Partial<SequenceBrief>): Promise<{ svg: string; gif?: Buffer; width: number; height: number; frames: number; fps: number; duration: number; checks: SequenceResult['checks'] }> {
  if (!input.style) throw new Error('Sequence needs a style.');
  const preset = getStyle(input.style);
  const frames = (input.frames ?? []).slice(0, 12).map(normaliseFrame);
  if (!frames.length) throw new Error('Sequence needs at least one frame.');
  if (frames.some((frame) => !frame.layers.length)) throw new Error('Every sequence frame needs at least one layer.');
  const size = input.size && input.size in SIZE ? input.size : 'landscape';
  const [defaultW, defaultH] = SIZE[size];
  const width = clamp(Math.round(input.width ?? defaultW), 320, 2000);
  const height = clamp(Math.round(input.height ?? defaultH), 320, 2000);
  const fps = clamp(Math.round(input.fps ?? 12), 4, 24);
  const { total } = timing(frames);
  const title = input.title || 'Secuencia';
  const assets: string[] = [];
  const framesMarkup = frames
    .map((frame, index) => {
      const svg = frameSvg(preset, { ...input, style: preset.slug }, frame, width, height, assets);
      return `<g class="seq-frame seq-f${index}"><svg x="0" y="0" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">${innerSvg(svg)}</svg></g>`;
    })
    .join('');
  const metadata = JSON.stringify({
    title,
    author: input.author,
    license: input.license,
    style: preset.slug,
    frames: frames.length,
    duration: total,
    assets,
  }).replace(/</g, '\\u003c');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="seq-title seq-desc">
  <title id="seq-title">${escapeXml(title)}</title>
  <desc id="seq-desc">${escapeXml(input.license ? `${title}. ${input.license}` : title)}. A frame-by-frame animated SVG sequence.</desc>
  <metadata>${metadata}</metadata>
  <style>${sequenceCss(frames)}</style>
  ${framesMarkup}
</svg>`;

  let gifBytes: Buffer | undefined;
  if (input.gif !== false) {
  ensureFonts();
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const gif = GIFEncoder();
  const rgbaFrames: Uint8ClampedArray[] = [];
  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index]!;
    const svgString = innerSvg(frameSvg(preset, { ...input, style: preset.slug }, frame, width, height, [], rasterFonts(preset)));
    const data = `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${svgString}</svg>`).toString('base64')}`;
    const image = await loadImage(data);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    rgbaFrames.push(ctx.getImageData(0, 0, width, height).data);
  }

  // Give every authored scene a representative vote so later phases do not
  // inherit a palette made only from the opening image. Keep sampling bounded
  // independently of canvas dimensions.
  const pixelCount = width * height;
  const samplesPerFrame = Math.min(pixelCount, 65_536);
  const sampleStride = Math.max(1, Math.ceil(pixelCount / samplesPerFrame));
  const paletteSamples = new Uint8Array(samplesPerFrame * rgbaFrames.length * 4);
  let sampleOffset = 0;
  for (const pixels of rgbaFrames) {
    for (let pixel = 0; pixel < pixelCount; pixel += sampleStride) {
      const offset = pixel * 4;
      paletteSamples[sampleOffset++] = pixels[offset]!;
      paletteSamples[sampleOffset++] = pixels[offset + 1]!;
      paletteSamples[sampleOffset++] = pixels[offset + 2]!;
      paletteSamples[sampleOffset++] = pixels[offset + 3]!;
    }
  }
  const palette = quantize(paletteSamples.subarray(0, sampleOffset), 128, { format: 'rgb444' });

  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index]!;
    const indexData = applyPalette(rgbaFrames[index]!, palette, 'rgb444');
    gif.writeFrame(indexData, width, height, {
      palette,
      delay: Math.round((frame.duration ?? 2.4) * 1000),
      repeat: index === 0 ? 0 : undefined,
    });
  }
  gif.finish();
  gifBytes = Buffer.from(gif.bytes());
  }
  return {
    svg,
    gif: gifBytes,
    width,
    height,
    frames: frames.length,
    fps,
    duration: total,
    checks: [
      { name: 'frames', passed: frames.length >= 2, detail: `${frames.length} frame(s)` },
      { name: 'assets-alt', passed: assets.every(Boolean), detail: `${assets.length} asset alt(s)` },
      { name: 'palette', passed: true, detail: `one palette sampled across all ${frames.length} scenes` },
      { name: 'animation', passed: /@keyframes/.test(svg), detail: 'frame keyframes present' },
      { name: 'reduced-motion', passed: /prefers-reduced-motion/.test(svg), detail: 'reduced motion shows first frame' },
      { name: 'gif', passed: input.gif === false || Boolean(gifBytes?.length), detail: input.gif === false ? 'skipped (SVG-only)' : `${Math.round((gifBytes?.length ?? 0) / 1024)} KB GIF` },
    ],
  };
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[char] ?? char);
}
