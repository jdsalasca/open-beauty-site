import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createGif, drawGifFrame } from '../src/gif.js';
import { styleSlugs } from '../src/styles/presets.js';
import type { GifDitherMode } from '../src/types/gif.js';

const base = { text: 'Luz y papel', subtitle: 'Prueba', width: 320, height: 320, fps: 12, duration: 1.5, seed: 7 };

async function tempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), 'beauty-gif-test-'));
}

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

test('GIFs stay reasonably sized at default settings', async () => {
  const dir = await tempDir();
  try {
    for (const style of ['renaissance', 'vaporwave', 'memphis'] as const) {
      const result = await createGif(style, { text: 'Luz y papel', subtitle: 'Medición', width: 480, height: 480, fps: 20, duration: 2, seed: 7 }, path.join(dir, `${style}.gif`));
      // Error-diffused gradients trade bytes for smoothness: renaissance
      // (floyd-steinberg) measures ~2.0 MB at these settings, flat styles ~0.25 MB.
      assert.ok(result.bytes < 2_500_000, `${style}: ${(result.bytes / 1024).toFixed(0)} KB exceeds the 2.5 MB budget`);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
