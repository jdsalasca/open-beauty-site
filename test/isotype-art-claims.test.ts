import assert from 'node:assert/strict';
import test from 'node:test';
import { sceneArt } from '../src/art.js';
import { getStyle } from '../src/styles/presets.js';

test('Isotype showcase art labels its illustration without inventing a metric or series', () => {
  const svg = sceneArt(getStyle('isotype'));

  assert.match(svg, /ILUSTRATIVO/u);
  assert.match(svg, /SIN MÉTRICA/u);
  assert.doesNotMatch(svg, /68%|SERIE\s*\/\s*0?1/u);
});
