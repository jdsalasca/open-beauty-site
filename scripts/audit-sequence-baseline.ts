import { pathToFileURL } from 'node:url';
import path from 'node:path';
import type { CanvasLayer } from '../src/types.js';

const root = process.env.NARRATIVE_BASELINE_ROOT || process.cwd();
const sequenceUrl = pathToFileURL(path.join(root, 'src', 'sequence.ts')).href;
const decoderUrl = pathToFileURL(path.join(root, 'test', 'support', 'gif-frames.ts')).href;
const { renderSequence } = await import(sequenceUrl) as typeof import('../src/sequence.js');
const { decodeGif } = await import(decoderUrl) as typeof import('../test/support/gif-frames.js');

const layers = (text: string): CanvasLayer[] => [
  { kind: 'rect', x: 0, y: 0, width: 320, height: 320, fill: '@bg' },
  { kind: 'circle', cx: 240, cy: 95, r: 30, fill: '@accent4', animation: 'breathe' },
  { kind: 'text', text, x: 28, y: 255, size: 24, font: 'display', fill: '@ink' },
];

for (const scenario of [
  { name: '3x0.5s@6fps', fps: 6, duration: 0.5, labels: ['Antes', 'Cambio', 'Resultado'] },
  { name: '2x7.6s@24fps', fps: 24, duration: 7.6, labels: ['Primera', 'Segunda'] },
]) {
  const result = await renderSequence({
    style: 'papercraft',
    width: 320,
    height: 320,
    fps: scenario.fps,
    frames: scenario.labels.map((label, index) => ({ id: String(index), duration: scenario.duration, layers: layers(label) })),
  });
  const decoded = decodeGif(result.gif!);
  const delayMsHistogram = Object.fromEntries(
    [...new Set(decoded.delays)].map((delayCentiseconds) => [
      delayCentiseconds * 10,
      decoded.delays.filter((value) => value === delayCentiseconds).length,
    ]),
  );
  console.log(JSON.stringify({
    case: scenario.name,
    declaredDurationMs: scenario.duration * 1000 * scenario.labels.length,
    returnedFrames: result.frames,
    decodedFrames: decoded.frames.length,
    decodedDelayMsHistogram: delayMsHistogram,
    effectiveDurationMs: decoded.delays.reduce((sum, value) => sum + value * 10, 0),
  }));
}
