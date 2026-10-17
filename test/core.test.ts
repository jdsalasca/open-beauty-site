import assert from 'node:assert/strict';
import test from 'node:test';
import { renderPage } from '../src/page/index.js';
import { validateHtml } from '../src/validate.js';
import { styleSlugs } from '../src/styles/presets.js';
import type { Brief } from '../src/types.js';

const brief: Brief = {
  title: 'Atelier <Lumen>',
  brand: 'Atelier Lumen',
  tagline: 'Objects that age well.',
  intro: 'We work with our hands and with time. Every piece starts with a drawing and a long conversation.',
  sections: [
    { kicker: 'One', title: 'Portraits', body: 'Three sessions: light, sketch and matter.' },
    { kicker: 'Two', title: 'Ceramics', body: 'Short series with ash glazes and visible fingerprints.' },
    { kicker: 'Three', title: 'Rooms', body: 'Fewer objects, better shadows.' },
  ],
  quote: { text: 'Beauty is discovered, not added.', author: 'Elena Varela' },
  cta: { label: 'Visit the studio', href: '#contact' },
  locale: 'en',
};

test('every style renders a complete document and scores A', () => {
  for (const style of styleSlugs) {
    const html = renderPage(style, brief);
    assert.match(html, /^<!doctype html>/i);
    assert.match(html, /<html lang="en">/);
    assert.match(html, /<main id="top">/);
    assert.match(html, /Atelier Lumen/);
    assert.doesNotMatch(html, /undefined|NaN|\{\{/);

    const result = validateHtml(html, style);
    assert.ok(result.score >= 90, `${style} scored ${result.score}: ${JSON.stringify(result.issues)}`);
    assert.equal(result.grade, 'A');
    assert.deepEqual(result.issues, []);
  }
});

test('user content is escaped', () => {
  const html = renderPage('brutalist', { title: 'Punk <script>alert(1)</script>', locale: 'en' });
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});

test('the validator catches generic AI design', () => {
  const bad = `<!doctype html><html lang="en"><head><title>Bad</title><style>
    body{font-family:Inter,sans-serif;background:#123456;color:#FFFFFF}
    h1{border-radius:8px;border:5px solid #000;box-shadow:0 0 20px #000}
  </style></head><body><main><h1>Bad page</h1></main></body></html>`;
  const result = validateHtml(bad, 'brutalist');
  const codes = result.issues.map((issue) => issue.code);
  assert.ok(result.score < 70, `expected a low score, got ${result.score}`);
  assert.ok(codes.includes('forbidden-font'));
  assert.ok(codes.includes('missing-font'));
  assert.ok(codes.includes('color-outside-palette'));
  assert.ok(codes.includes('radius-out-of-range'));
  assert.ok(codes.includes('border-width'));
  assert.ok(codes.includes('soft-shadow-in-brutalist'));
});

test('the validator rejects unknown styles', () => {
  assert.throws(() => validateHtml('<html></html>', 'artdeco' as never), /Unknown style/);
});
