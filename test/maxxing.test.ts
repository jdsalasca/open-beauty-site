import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPage } from '../src/page/index.js';
import { validateDeck, validateHtml } from '../src/validate.js';
import { renderDeck } from '../src/deck.js';
import { getStyle } from '../src/styles/presets.js';

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


test('a deck figure layout carries a papercut scene and validates', () => {
  const deck = renderDeck({
    style: getStyle('papercraft'),
    brief: {
      title: 'Figura de papel',
      slides: [
        { layout: 'statement', title: 'La sombra', body: 'Una imagen puede ser evidencia.' },
        { layout: 'figure', title: 'La pradera', figure: { caption: 'La liebre cruza la pradera.', source: 'Escena original · CC0', scene: { kind: 'meadow', characters: ['rabbit', 'fox'], props: ['pine', 'flowers'] } } },
        { layout: 'quote', title: 'Cita', quote: { text: 'Caminar también es mirar.' } },
      ],
    },
  });
  assert.match(deck.html, /deck-figure/);
  const result = validateDeck(deck.html, 'papercraft');
  assert.equal(result.grade, 'A');
  assert.equal(result.vision.score, 4);
});
