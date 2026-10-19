import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { createGif, createGifPoster, drawGifFrame } from '../src/gif.js';
import { getStyle, styleSlugs } from '../src/styles/presets.js';
import type { GifDitherMode } from '../src/types/gif.js';
import { backgroundCoverage, decodeGif, hexToRgb, meanFrameDiff } from './support/gif-frames.js';

const base = { text: 'Luz y papel', subtitle: 'Prueba', width: 320, height: 320, fps: 12, duration: 1.5, seed: 7 };

async function tempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'beauty-gif-test-'));
}

interface FrameControl {
  transparent: boolean;
  disposal: number;
}

/** Minimal GIF89a scanner: returns frame count and one control record per frame. */
function scanGif(bytes: Uint8Array): { frames: number; controls: FrameControl[] } {
  let offset = 6;
  const screenPacked = bytes[offset + 4]!;
  offset += 7;
  if (screenPacked & 0x80) offset += 3 * 2 ** ((screenPacked & 0x07) + 1);
  const controls: FrameControl[] = [];
  let frames = 0;
  while (offset < bytes.length) {
    const marker = bytes[offset]!;
    if (marker === 0x3b) break;
    if (marker === 0x21) {
      const label = bytes[offset + 1]!;
      offset += 2;
      if (label === 0xf9) {
        const size = bytes[offset]!;
        const header = bytes[offset + 1]!;
        controls.push({ transparent: (header & 1) === 1, disposal: (header >> 2) & 7 });
        offset += 1 + size;
      }
      while (bytes[offset] !== 0) offset += 1 + bytes[offset]!;
      offset += 1;
    } else if (marker === 0x2c) {
      frames += 1;
      const descriptorPacked = bytes[offset + 9]!;
      offset += 10;
      if (descriptorPacked & 0x80) offset += 3 * 2 ** ((descriptorPacked & 0x07) + 1);
      offset += 1;
      while (bytes[offset] !== 0) offset += 1 + bytes[offset]!;
      offset += 1;
    } else {
      throw new Error(`unknown GIF block 0x${marker.toString(16)} at ${offset}`);
    }
  }
  return { frames, controls };
}

test('unchanged pixels are transparent in later frames so LZW can compress the delta', async () => {
  const dir = await tempDir();
  try {
    const target = path.join(dir, 'delta.gif');
    const result = await createGif('brutalist', { ...base, template: 'loop' }, target);
    const { frames, controls } = scanGif(await readFile(target));
    assert.equal(frames, result.frames, 'every frame is encoded');
    assert.equal(controls.length, result.frames, 'every frame carries a graphic control block');
    assert.equal(controls[0]!.transparent, false, 'first frame is a full opaque keyframe');
    assert.equal(controls[0]!.disposal, 0, 'keyframe does not dispose');
    for (const control of controls.slice(1)) {
      assert.equal(control.transparent, true, 'delta frames mark unchanged pixels transparent');
      assert.equal(control.disposal, 1, 'delta frames keep the previous frame');
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('GIF encoding is deterministic: same input, same bytes', async () => {
  const dir = await tempDir();
  try {
    for (const style of ['renaissance', 'memphis', 'galactic'] as const) {
      const pathA = path.join(dir, `${style}-a.gif`);
      const pathB = path.join(dir, `${style}-b.gif`);
      const first = await createGif(style, { ...base, template: 'loop' }, pathA);
      const second = await createGif(style, { ...base, template: 'loop' }, pathB);
      assert.equal(first.bytes, second.bytes, `${style}: byte size changed between identical runs`);
      assert.deepEqual(await readFile(pathA), await readFile(pathB), `${style}: encoded bytes differ between identical runs`);
      assert.deepEqual([...first.warnings], [], `${style}: unexpected warnings`);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('legacy GIF title layout reports overflow instead of silently dropping lines', async () => {
  const dir = await tempDir();
  try {
    const result = await createGif('papercraft', {
      ...base,
      text: 'PALABRA '.repeat(24),
      width: 320,
      height: 320,
      template: 'title',
    }, path.join(dir, 'overflow.gif'));
    assert.ok(result.warnings.some((warning) => warning.includes('gif-title-overflow')));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('absurd width/height/fps/duration are clamped with a clear message, not a crash', async () => {
  const dir = await tempDir();
  try {
    const sized = await createGif(
      'brutalist',
      { ...base, width: 99999, height: -40 },
      path.join(dir, 'clamped-size.gif'),
    );
    assert.equal(sized.width, 1200, 'width clamped to the 1200 max');
    assert.equal(sized.height, 240, 'height clamped to the 240 min');
    assert.ok(sized.warnings.some((line) => line.includes('width')), 'width warning present');
    assert.ok(sized.warnings.some((line) => line.includes('height')), 'height warning present');
    assert.ok(sized.bytes > 1024, 'size-clamped GIF still renders');

    const timed = await createGif(
      'brutalist',
      { ...base, width: 320, height: 320, fps: 1000, duration: 999 },
      path.join(dir, 'clamped-time.gif'),
    );
    assert.equal(timed.fps, 30, 'fps clamped to the 30 max');
    assert.equal(timed.duration, 6, 'duration clamped to the 6s max');
    assert.equal(timed.frames, 180, '30 fps for 6 s is 180 frames');
    assert.ok(timed.warnings.some((line) => line.includes('fps')), 'fps warning present');
    assert.ok(timed.warnings.some((line) => line.includes('duration')), 'duration warning present');
    assert.ok(timed.bytes > 1024, 'time-clamped GIF still renders');

    const huge = await createGif('renaissance', { ...base, width: 1200, height: 1200, fps: 30, duration: 6 }, path.join(dir, 'huge.gif'));
    assert.ok(huge.warnings.some((line) => line.includes('memory budget')), 'memory budget warning present');
    assert.ok(huge.width * huge.height * huge.frames <= 48_000_000, 'pixel-frame budget respected');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('non-finite dimensions fall back to defaults with a warning', async () => {
  const dir = await tempDir();
  try {
    const result = await createGif('isotype', { ...base, width: Number.NaN, fps: Number.POSITIVE_INFINITY }, path.join(dir, 'nan.gif'));
    assert.equal(result.width, 800, 'NaN width falls back to 800');
    assert.equal(result.fps, 24, 'infinite fps falls back to 24');
    assert.ok(result.warnings.some((line) => line.includes('width')), 'width warning present');
    assert.ok(result.warnings.some((line) => line.includes('fps')), 'fps warning present');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('unknown dither mode and non-finite palette size fall back with a warning', async () => {
  const dir = await tempDir();
  try {
    const result = await createGif(
      'brutalist',
      { ...base, width: 240, height: 240, paletteColors: Number.NaN, dither: 'sparkle' as GifDitherMode },
      path.join(dir, 'fallback.gif'),
    );
    assert.ok(result.warnings.some((line) => line.includes('palette')), 'palette warning present');
    assert.ok(result.warnings.some((line) => line.includes('dither')), 'dither warning present');
    assert.ok(result.bytes > 1024, 'GIF still renders');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('loop templates wrap seamlessly: frame at t=0 matches frame at t=1 for every style', () => {
  for (const style of styleSlugs) {
    const atZero = drawGifFrame(style, { text: 'Luz y papel', template: 'loop', seed: 7 }, 0, 240, 240);
    const atOne = drawGifFrame(style, { text: 'Luz y papel', template: 'loop', seed: 7 }, 1, 240, 240);
    let sum = 0;
    for (let i = 0; i < atZero.length; i += 1) sum += Math.abs(atZero[i]! - atOne[i]!);
    const mean = sum / atZero.length;
    assert.ok(mean < 2, `${style}: loop wrap mean delta ${mean.toFixed(3)} is visible`);
  }
});

test('every animated template of every style has perceptible motion at its peak', async () => {
  const dir = await tempDir();
  try {
    for (const style of styleSlugs) {
      for (const template of ['title', 'loop'] as const) {
        const target = path.join(dir, `${style}-${template}.gif`);
        await createGif(
          style,
          { text: 'Luz y papel', subtitle: 'Prueba', template, width: 240, height: 240, fps: 8, duration: 1.25, seed: 7 },
          target,
        );
        const decoded = decodeGif(await readFile(target));
        let peak = 0;
        for (const frame of decoded.frames.slice(1)) {
          peak = Math.max(peak, meanFrameDiff(decoded.frames[0]!, frame));
        }
        assert.ok(peak >= 3, `${style}/${template}: peak motion ${peak.toFixed(2)} is below the 3.0 threshold`);
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

function frameDiff(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += Math.abs(a[i]! - b[i]!);
  return sum / a.length;
}

const composedFrame = { text: 'Luz y papel', subtitle: 'Prueba', seed: 7 };

test('every template opens on the composed poster frame', () => {
  for (const style of styleSlugs) {
    const poster = drawGifFrame(style, { ...composedFrame, template: 'poster' }, 0, 240, 240);
    for (const template of ['title', 'loop'] as const) {
      const first = drawGifFrame(style, { ...composedFrame, template }, 0, 240, 240);
      assert.equal(frameDiff(poster, first), 0, `${style}/${template}: frame 0 must equal the poster frame`);
    }
  }
});

test('title and loop share the same eased arc at every loop position', () => {
  for (const style of styleSlugs) {
    for (const t of [0, 0.2, 0.5, 0.8, 1]) {
      const title = drawGifFrame(style, { ...composedFrame, template: 'title' }, t, 240, 240);
      const loop = drawGifFrame(style, { ...composedFrame, template: 'loop' }, t, 240, 240);
      assert.equal(frameDiff(title, loop), 0, `${style}: title and loop diverge at t=${t}`);
    }
  }
});

test('the poster template is a still: every position renders the composed frame', () => {
  for (const style of styleSlugs) {
    const atZero = drawGifFrame(style, { ...composedFrame, template: 'poster' }, 0, 240, 240);
    const elsewhere = drawGifFrame(style, { ...composedFrame, template: 'poster' }, 0.63, 240, 240);
    assert.equal(frameDiff(atZero, elsewhere), 0, `${style}: poster frames must not animate`);
  }
});

test('decoded GIFs open on the composed frame and wrap imperceptibly for all 13 styles', async () => {
  const dir = await tempDir();
  try {
    for (const style of styleSlugs) {
      const target = path.join(dir, `${style}.gif`);
      await createGif(
        style,
        { text: 'Luz y papel', subtitle: 'Prueba', width: 240, height: 240, fps: 12, duration: 1.5, seed: 7 },
        target,
      );
      const decoded = decodeGif(await readFile(target));
      assert.ok(decoded.frames.length >= 8, `${style}: expected a real animation, got ${decoded.frames.length} frames`);

      // Measured minimum across the 13 styles at this size is 12.4% (isotype),
      // so 8% proves the opening frame is composed without being brittle.
      const coverage = backgroundCoverage(decoded.frames[0]!, hexToRgb(getStyle(style).palette.bg));
      assert.ok(coverage >= 0.08, `${style}: frame 0 is mostly background (${(coverage * 100).toFixed(1)}% covered)`);

      const consecutive: number[] = [];
      for (let index = 1; index < decoded.frames.length; index += 1) {
        consecutive.push(meanFrameDiff(decoded.frames[index - 1]!, decoded.frames[index]!));
      }
      const wrap = meanFrameDiff(decoded.frames[decoded.frames.length - 1]!, decoded.frames[0]!);
      const sorted = [...consecutive].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)]!;
      assert.ok(median > 0.05, `${style}: loop does not animate (median consecutive diff ${median.toFixed(3)})`);
      assert.ok(
        wrap <= median * 1.5,
        `${style}: wrap diff ${wrap.toFixed(2)} exceeds 1.5x the median consecutive diff ${median.toFixed(2)}`,
      );
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('poster PNG matches the composed poster frame pixel for pixel', async () => {
  const dir = await tempDir();
  try {
    const target = path.join(dir, 'poster.png');
    await createGifPoster('artdeco', { text: 'Luz y papel', subtitle: 'Prueba', width: 240, height: 240, seed: 7 }, target);
    const bytes = await readFile(target);
    assert.equal(bytes.subarray(1, 4).toString('latin1'), 'PNG', 'PNG signature present');
    const image = await loadImage(target);
    assert.equal(image.width, 240, 'poster width follows the GIF settings');
    assert.equal(image.height, 240, 'poster height follows the GIF settings');
    const canvas = createCanvas(240, 240);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const painted = ctx.getImageData(0, 0, 240, 240).data;
    const expected = drawGifFrame('artdeco', { ...composedFrame, template: 'poster' }, 0, 240, 240);
    assert.equal(frameDiff(painted, expected), 0, 'PNG pixels differ from the poster frame');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('the last encoded frame never duplicates the first (t stops one step before 1)', async () => {
  const dir = await tempDir();
  try {
    const result = await createGif('papercraft', { ...base, template: 'loop', fps: 10, duration: 1 }, path.join(dir, 'loop.gif'));
    assert.equal(result.frames, 10);
    const first = drawGifFrame('papercraft', { text: 'Luz y papel', template: 'loop', seed: 7 }, 0, 320, 320);
    const last = drawGifFrame('papercraft', { text: 'Luz y papel', template: 'loop', seed: 7 }, (result.frames - 1) / result.frames, 320, 320);
    let sum = 0;
    for (let i = 0; i < first.length; i += 1) sum += Math.abs(first[i]! - last[i]!);
    const mean = sum / first.length;
    assert.ok(mean < 4, `first/last frame delta ${mean.toFixed(3)}: the loop would stutter`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('gradient styles dither: floyd-steinberg breaks quantisation bands renaissance', async () => {
  const dir = await tempDir();
  try {
    const dithered = await createGif('renaissance', { ...base, template: 'title', dither: 'floyd-steinberg' }, path.join(dir, 'dithered.gif'));
    const plain = await createGif('renaissance', { ...base, template: 'title', dither: 'none' }, path.join(dir, 'plain.gif'));
    assert.ok(dithered.bytes > 1024 && plain.bytes > 1024, 'both GIFs render');
    // Error diffusion replaces flat quantisation steps with fine texture, which
    // is what hides the bands; measured ratio at these settings is ~2.1x.
    assert.ok(dithered.bytes > plain.bytes * 1.5, `dithering adds pixel-level texture (${dithered.bytes} vs ${plain.bytes} bytes)`);
    assert.ok(dithered.warnings.length === 0, 'no warnings for valid options');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('flat-colour styles stay crisp: brutalist uses no dithering', async () => {
  const dir = await tempDir();
  try {
    const result = await createGif('brutalist', { ...base, template: 'loop' }, path.join(dir, 'flat.gif'));
    assert.ok(result.bytes > 1024, 'GIF renders');
    assert.ok(result.warnings.length === 0, 'no warnings for valid options');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('GIFs stay reasonably sized at 480x480', async () => {
  const dir = await tempDir();
  try {
    for (const style of ['renaissance', 'vaporwave', 'memphis'] as const) {
      const result = await createGif(style, { text: 'Luz y papel', subtitle: 'Medición', width: 480, height: 480, fps: 20, duration: 2, seed: 7 }, path.join(dir, `${style}.gif`));
      // Measured with delta frames + tiled error diffusion: renaissance ~370 KB,
      // ordered styles ~100 KB; 1 MB leaves room for small art changes.
      assert.ok(result.bytes < 1_000_000, `${style}: ${(result.bytes / 1024).toFixed(0)} KB exceeds the 1 MB budget`);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('no style exceeds 2 MB with the default CLI settings (800x800, 24 fps, 2.4 s)', async () => {
  const dir = await tempDir();
  try {
    for (const style of styleSlugs) {
      const target = path.join(dir, `${style}.gif`);
      const result = await createGif(style, { text: 'Plan del sprint' }, target);
      assert.equal(result.width, 800, `${style}: default width`);
      assert.equal(result.height, 800, `${style}: default height`);
      assert.ok(result.bytes < 2_000_000, `${style}: ${(result.bytes / 1024).toFixed(0)} KB exceeds the 2 MB budget`);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
