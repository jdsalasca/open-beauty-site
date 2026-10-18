import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPage } from '../src/page/index.js';
import { validateHtml } from '../src/validate.js';

test('maxxing adds an original layer without losing craft', () => {
  const html = renderPage('nature', {
    title: 'El jardín de las horas lentas',
    tagline: 'Una hoja prensada también es una forma de mirar el tiempo.',
    maxxing: true,
  });
  assert.match(html, /class="maxxing /);
  assert.match(html, /class="max-layer"/);
  assert.match(html, /class="max-art"/);
  const result = validateHtml(html, 'nature');
  assert.equal(result.grade, 'A');
  assert.equal(result.vision.score, 4);
});
