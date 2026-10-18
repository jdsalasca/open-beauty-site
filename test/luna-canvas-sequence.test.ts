import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCanvas, canvasChecks } from '../src/canvas-art.js';
import { renderSequence } from '../src/sequence.js';
import { getStyle, styleSlugs } from '../src/styles/presets.js';
import type { CanvasLayer, StyleSlug } from '../src/types.js';

const PALETTE_TOKENS = [
  ['@bg', 'bg'],
  ['@surface', 'surface'],
  ['@ink', 'ink'],
  ['@muted', 'muted'],
  ['@accent', 'accent'],
  ['@accent2', 'accent2'],
  ['@accent3', 'accent3'],
  ['@accent4', 'accent4'],
  ['@deep', 'deep'],
] as const;

const CANVAS_CHECKS = ['layers', 'assets-alt', 'palette', 'animation', 'reduced-motion', 'no-scripts'];
const SEQUENCE_CHECKS = ['frames', 'assets-alt', 'palette', 'animation', 'reduced-motion', 'gif'];

function assertPassedChecks(
  checks: Array<{ name: string; passed: boolean; detail: string }>,
  expectedNames: string[],
  context: string,
): void {
  assert.deepEqual(checks.map(({ name }) => name), expectedNames, `${context}: check names`);
  for (const check of checks) {
    assert.equal(check.passed, true, `${context}: ${check.name} failed (${check.detail})`);
  }
}

function readMetadata(svg: string): Record<string, unknown> {
  const match = /<metadata>([\s\S]*?)<\/metadata>/.exec(svg);
  assert.ok(match, 'SVG should contain metadata');
  return JSON.parse(match[1]!) as Record<string, unknown>;
}

function paletteLayers(): CanvasLayer[] {
  return PALETTE_TOKENS.map(([token], index) => ({
    kind: 'rect',
    x: index * 35,
    y: 8,
    width: 30,
    height: 24,
    fill: token,
  }));
}

function sequenceLayers(label: string): CanvasLayer[] {
  return [
    ...paletteLayers(),
    { kind: 'circle', cx: 270, cy: 110, r: 36, fill: '@accent4', animation: 'breathe' },
    { kind: 'path', d: 'M0 220 C80 180 150 250 240 210 S300 220 320 195 V320 H0Z', fill: '@accent3', animation: 'drift' },
    { kind: 'text', text: label, x: 12, y: 290, size: 20, font: 'display', fill: '@ink' },
  ];
}

function assertPaletteResolved(svg: string, style: StyleSlug): void {
  const palette = getStyle(style).palette;
  for (const [token, key] of PALETTE_TOKENS) {
    const hex = palette[key].toLowerCase();
    assert.ok(svg.toLowerCase().includes(hex), `${style}: ${token} did not resolve to ${hex} in SVG`);
  }
}

test('canvas composes independent layers, groups, transforms, and palette tokens', () => {
  const style = 'nature';
  const palette = getStyle(style).palette;
  const brief = {
    style,
    title: 'Luz y agua',
    width: 640,
    height: 480,
    texture: 'paper' as const,
    duration: 12,
    layers: [
      { kind: 'rect', x: 0, y: 0, width: 640, height: 480, fill: '@surface' },
      { kind: 'path', d: 'M0 300 C90 250 170 340 270 290 S500 330 640 250 V480 H0Z', fill: '@accent3', animation: 'drift' },
      { kind: 'circle', cx: 500, cy: 110, r: 48, fill: '@accent4', animation: 'breathe' },
      {
        kind: 'group',
        transform: { x: 8, y: 6, rotate: 2 },
        children: [
          { kind: 'polygon', points: '40,60 80,20 120,60', fill: '@accent2' },
          { kind: 'line', x1: 40, y1: 70, x2: 120, y2: 70, stroke: '@deep', strokeWidth: 2 },
        ],
      },
      { kind: 'text', text: 'Luz & agua', x: 30, y: 420, size: 42, font: 'display', fill: '@ink' },
    ] satisfies CanvasLayer[],
  };

  const svg = renderCanvas(brief);
  assert.match(svg, new RegExp(`fill="${palette.bg}"`));
  assert.match(svg, new RegExp(`fill="${palette.surface}"`));
  assert.match(svg, new RegExp(`fill="${palette.accent3}"`));
  assert.match(svg, new RegExp(`fill="${palette.accent4}"`));
  assert.match(svg, new RegExp(`fill="${palette.accent2}"`));
  assert.match(svg, new RegExp(`stroke="${palette.deep}"`));
  assert.match(svg, new RegExp(`fill="${palette.ink}"`));
  assert.match(svg, /transform="translate\(8 6\) rotate\(2\)"/);
  assert.match(svg, /ca-drift/);
  assert.match(svg, /prefers-reduced-motion/);
  assert.match(svg, /Luz &amp; agua/);
  assert.ok(svg.indexOf('<path d="M0 300') < svg.indexOf('<circle cx="500"'));
  assert.ok(svg.indexOf('<circle cx="500"') < svg.indexOf('<polygon points="40,60'));
  assert.ok(svg.indexOf('<polygon points="40,60') < svg.indexOf('<text x="30"'));
  assertPassedChecks(canvasChecks(svg, brief), CANVAS_CHECKS, 'free canvas composition');
});

test('canvas rejects a hex colour that is outside the selected palette', () => {
  assert.throws(
    () => renderCanvas({
      style: 'nature',
      layers: [{ kind: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#123456' }],
    }),
    /Colour "#123456" is outside the Nature Memory palette/,
  );
});

test('canvas keeps image alt text and caption/source in SVG metadata and visible credits', () => {
  const asset = {
    kind: 'image' as const,
    href: 'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22/%3E',
    alt: 'Una hoja prensada & seca',
    caption: 'Herbario <n.º 4>',
    source: 'CC0',
    x: 24,
    y: 24,
    width: 80,
    height: 80,
  };
  const brief = {
    style: 'nature' as const,
    title: 'Colección botánica',
    width: 320,
    height: 320,
    layers: [
      { kind: 'rect' as const, x: 0, y: 0, width: 320, height: 320, fill: '@bg' },
      { kind: 'group' as const, children: [asset] },
    ],
  };

  const svg = renderCanvas(brief);
  assert.match(svg, /aria-label="Una hoja prensada &amp; seca"/);
  assert.match(svg, /<title>Una hoja prensada &amp; seca<\/title>/);
  assert.match(svg, /Herbario &lt;n\.º 4&gt; · CC0/);
  assert.deepEqual((readMetadata(svg).assets), [{
    href: asset.href,
    alt: asset.alt,
    caption: asset.caption,
    source: asset.source,
  }]);
  assertPassedChecks(canvasChecks(svg, brief), CANVAS_CHECKS, 'credited image asset');
});

test('sequence renders three storyboard frames to animated SVG and a valid GIF', async () => {
  const result = await renderSequence({
    style: 'papercraft',
    title: 'La semilla',
    license: 'CC0 1.0',
    width: 320,
    height: 320,
    fps: 4,
    frames: [
      { id: '01', duration: 0.3, layers: sequenceLayers('Una semilla') },
      { id: '02', duration: 0.3, layers: sequenceLayers('Esperó la lluvia') },
      { id: '03', duration: 0.3, layers: sequenceLayers('Y creció') },
    ],
  });

  assert.equal(result.frames, 3);
  assert.equal(result.width, 320);
  assert.equal(result.height, 320);
  for (const [index, label] of ['Una semilla', 'Esperó la lluvia', 'Y creció'].entries()) {
    assert.match(result.svg, new RegExp(`class="seq-frame seq-f${index}"`));
    assert.ok(result.svg.includes(label), `frame ${index + 1} should include its story text`);
  }
  assert.match(result.svg, /@keyframes seq-2/);
  assert.match(result.svg, /prefers-reduced-motion/);
  assert.equal(readMetadata(result.svg).frames, 3);
  assert.ok(result.gif instanceof Buffer, 'GIF output should be a Buffer');
  assert.match(result.gif.subarray(0, 6).toString('ascii'), /^GIF8[79]a$/);
  assert.ok(result.gif.length > 100, 'GIF output should contain encoded image data');
  assertPassedChecks(result.checks, SEQUENCE_CHECKS, 'SVG + GIF sequence');
});

test('sequence supports SVG-only output and reports the GIF as intentionally skipped', async () => {
  const result = await renderSequence({
    style: 'nature',
    gif: false,
    width: 320,
    height: 320,
    frames: [
      { id: '01', layers: sequenceLayers('Primer momento') },
      { id: '02', layers: sequenceLayers('Segundo momento') },
    ],
  });

  assert.equal(result.frames, 2);
  assert.equal(result.gif, undefined);
  assert.match(result.svg, /class="seq-frame seq-f0"/);
  assert.match(result.svg, /class="seq-frame seq-f1"/);
  assert.match(result.svg, /prefers-reduced-motion/);
  assert.equal(result.checks.find(({ name }) => name === 'gif')?.detail, 'skipped (SVG-only)');
  assertPassedChecks(result.checks, SEQUENCE_CHECKS, 'SVG-only sequence');
});

test('canvas resolves all nine palette tokens in each of the 13 styles', () => {
  assert.equal(styleSlugs.length, 13, 'the preset catalog should contain exactly 13 styles');

  for (const style of styleSlugs) {
    const svg = renderCanvas({
      style,
      title: `Paleta ${style}`,
      width: 320,
      height: 320,
      layers: paletteLayers(),
    });
    assertPaletteResolved(svg, style);
    assert.equal(readMetadata(svg).style, style, `${style}: SVG metadata should identify the selected style`);
    assertPassedChecks(canvasChecks(svg, { style, layers: paletteLayers() }), CANVAS_CHECKS, `${style} canvas`);
  }
});

test('two-frame sequences preserve palette resolution and every check in all 13 styles', async () => {
  assert.equal(styleSlugs.length, 13, 'the preset catalog should contain exactly 13 styles');

  for (const style of styleSlugs) {
    const result = await renderSequence({
      style,
      gif: false,
      width: 320,
      height: 320,
      frames: [
        { id: '01', duration: 0.3, layers: sequenceLayers(`Inicio ${style}`) },
        { id: '02', duration: 0.3, layers: sequenceLayers(`Cambio ${style}`) },
      ],
    });

    assert.equal(result.frames, 2, `${style}: both frames should be retained`);
    assertPaletteResolved(result.svg, style);
    assert.equal(readMetadata(result.svg).style, style, `${style}: SVG metadata should identify the selected style`);
    assert.ok(result.svg.includes(`Inicio ${style}`), `${style}: first frame text is missing`);
    assert.ok(result.svg.includes(`Cambio ${style}`), `${style}: second frame text is missing`);
    assertPassedChecks(result.checks, SEQUENCE_CHECKS, `${style} sequence`);
  }
});
