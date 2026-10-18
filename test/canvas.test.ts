import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCanvas, canvasChecks } from '../src/canvas-art.js';
import { styleSlugs } from '../src/styles/presets.js';

test('canvas is an open composition with palette tokens, motion and an asset credit', () => {
  const brief = {
    style: 'nature' as const,
    title: 'Carta al mar',
    size: 'landscape' as const,
    texture: 'paper' as const,
    duration: 16,
    layers: [
      { kind: 'rect' as const, x: 0, y: 0, width: 1600, height: 1000, fill: '@surface' },
      { kind: 'path' as const, d: 'M0 640 C 260 560 420 720 680 620 S 1160 680 1600 560 V1000 H0Z', fill: '@accent3', animation: 'drift' as const },
      { kind: 'circle' as const, cx: 1200, cy: 250, r: 100, fill: '@accent4', animation: 'breathe' as const },
      { kind: 'text' as const, text: 'Carta al mar', x: 80, y: 820, size: 96, font: 'display' as const, fill: '@ink' },
      { kind: 'image' as const, href: 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%2710%27%3E%3Crect width=%2710%27 height=%2710%27 fill=%27%23B55239%27/%3E%3C/svg%3E', alt: 'Una hoja prensada', caption: 'Herbario', source: 'CC0', x: 80, y: 80, width: 80, height: 80 },
    ],
  };
  const svg = renderCanvas(brief);
  assert.match(svg, /#[0-9A-Fa-f]{6}/); // palette tokens become exact style values
  assert.match(svg, /ca-drift/);
  assert.match(svg, /prefers-reduced-motion/);
  assert.match(svg, /aria-label="Una hoja prensada"/);
  assert.match(svg, /Herbario/);
  assert.ok(canvasChecks(svg, brief).every((check) => check.passed));
});

test('canvas refuses a colour outside the style palette', () => {
  assert.throws(() => renderCanvas({ style: 'nature', layers: [{ kind: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#123456' }] }), /outside the Nature Memory palette/);
});


test('the same open composition can be painted in all 13 palettes', () => {
  for (const style of styleSlugs) {
    const svg = renderCanvas({
      style,
      title: `Canvas ${style}`,
      layers: [
        { kind: 'rect', x: 0, y: 0, width: 1200, height: 1200, fill: '@bg' },
        { kind: 'circle', cx: 720, cy: 430, r: 210, fill: '@accent', animation: 'breathe' },
        { kind: 'path', d: 'M0 900C240 820 380 980 620 900S980 940 1200 860V1200H0Z', fill: '@accent3', animation: 'drift' },
        { kind: 'text', text: 'Una forma', x: 80, y: 1050, size: 110, font: 'display', fill: '@ink' },
      ],
    });
    assert.ok(canvasChecks(svg, { style, layers: [{ kind: 'rect', x: 0, y: 0, width: 10, height: 10 }] }).every((check) => check.passed), style);
  }
});
