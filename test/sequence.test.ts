import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeGif } from './support/gif-frames.js';
import { renderSequence } from '../src/sequence.js';
import { styleSlugs } from '../src/styles/presets.js';
import type { CanvasLayer } from '../src/types.js';

const layers = (text: string): CanvasLayer[] => [
  { kind: 'rect', x: 0, y: 0, width: 480, height: 300, fill: '@bg' },
  { kind: 'circle', cx: 340, cy: 95, r: 46, fill: '@accent4', animation: 'breathe' },
  { kind: 'path', d: 'M0 210C90 180 150 230 240 200S390 220 480 180V300H0Z', fill: '@accent3', animation: 'drift' },
  { kind: 'text', text, x: 28, y: 255, size: 34, font: 'display', fill: '@ink' },
];

test('sequence makes an SVG storyboard and a raster GIF', async () => {
  const result = await renderSequence({
    style: 'papercraft',
    title: 'La semilla',
    license: 'CC0 1.0',
    width: 480,
    height: 300,
    fps: 6,
    frames: [
      { id: '01', duration: 0.5, layers: layers('Una semilla') },
      { id: '02', duration: 0.5, layers: layers('Esperó la lluvia') },
      { id: '03', duration: 0.5, layers: layers('Y creció') },
    ],
  });
  assert.match(result.svg, /seq-frame/);
  assert.match(result.svg, /prefers-reduced-motion/);
  assert.ok(result.gif && result.gif.length > 0);
  assert.ok(result.checks.every((check) => check.passed));
});

test('GIF holds use frame delays instead of duplicating each static scene', async () => {
  const result = await renderSequence({
    style: 'papercraft',
    width: 320,
    height: 320,
    fps: 6,
    frames: [
      { id: 'before', duration: 0.5, layers: layers('Antes') },
      { id: 'change', duration: 0.5, layers: layers('Cambio') },
      { id: 'result', duration: 0.5, layers: layers('Resultado') },
    ],
  });
  const decoded = decodeGif(result.gif!);
  assert.equal(decoded.frames.length, 3, 'one encoded frame per authored scene');
  assert.deepEqual(decoded.delays, [50, 50, 50], 'each scene holds for 500ms');
  assert.equal(decoded.delays.reduce((sum, delay) => sum + delay, 0), 150);
});

test('sequence durations beyond the old 360-frame plan keep their requested time', async () => {
  const result = await renderSequence({
    style: 'papercraft',
    width: 320,
    height: 320,
    fps: 24,
    frames: [
      { id: 'one', duration: 7.6, layers: layers('Primera') },
      { id: 'two', duration: 7.6, layers: layers('Segunda') },
    ],
  });
  const decoded = decodeGif(result.gif!);
  assert.equal(decoded.frames.length, 2, 'one encoded frame per authored scene');
  assert.deepEqual(decoded.delays, [760, 760], 'each scene holds for the requested 7.6 seconds');
  assert.equal(decoded.delays.reduce((sum, delay) => sum + delay, 0), 1520);
});

test('a sequence can run as SVG-only and still keep frame checks', async () => {
  const result = await renderSequence({
    style: 'nature',
    gif: false,
    width: 480,
    height: 300,
    frames: [
      { id: '01', layers: layers('Uno') },
      { id: '02', layers: layers('Dos') },
    ],
  });
  assert.equal(result.gif, undefined);
  assert.ok(result.checks.every((check) => check.passed));
});

test('the sequence tool composes frames in all 13 style palettes', async () => {
  for (const style of styleSlugs) {
    const result = await renderSequence({
      style,
      gif: false,
      width: 480,
      height: 300,
      frames: [
        { id: '01', layers: layers('Forma') },
        { id: '02', layers: layers('Memoria') },
      ],
    });
    assert.ok(result.checks.every((check) => check.passed), style);
  }
});
