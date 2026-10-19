import assert from 'node:assert/strict';
import test from 'node:test';
import { ensureMinTextSize, ensureMinTextSizeInHtml } from '../src/page/min-text.js';

const MIN = '@media (max-width:720px){';

test('raises px sizes below the minimum inside one phone media block', () => {
  const out = ensureMinTextSize('p{color:red;font-size:10px}');
  assert.ok(out.startsWith('p{color:red;font-size:10px}'), 'the original rule is preserved');
  assert.ok(out.includes(`${MIN}p{font-size:12px}}`), out);
});

test('leaves rules at or above the minimum untouched', () => {
  for (const css of ['p{font-size:12px}', 'p{font-size:13px}', 'p{font-size:1rem}', 'p{color:red}']) {
    assert.equal(ensureMinTextSize(css), css);
  }
});

test('resolves rem and em against a 16px root', () => {
  const below = ensureMinTextSize('.a{font-size:.6rem}.b{font-size:.7em}');
  assert.ok(below.includes('.a{font-size:12px}'), below);
  assert.ok(below.includes('.b{font-size:12px}'), below);
  assert.equal(ensureMinTextSize('.c{font-size:.75rem}.d{font-size:1em}'), '.c{font-size:.75rem}.d{font-size:1em}');
});

test('uses the clamp minimum as the resolved size', () => {
  const below = ensureMinTextSize('.a{font-size:clamp(10px,2vw,20px)}');
  assert.ok(below.includes('.a{font-size:12px}'), below);
  assert.equal(ensureMinTextSize('.b{font-size:clamp(12px,2vw,20px)}'), '.b{font-size:clamp(12px,2vw,20px)}');
  assert.equal(ensureMinTextSize('.c{font-size:clamp(1vw,2vw,20px)}'), '.c{font-size:clamp(1vw,2vw,20px)}');
});

test('resolves simple calc() cases', () => {
  const below = ensureMinTextSize('.a{font-size:calc(10px + .1rem)}.b{font-size:calc(.5rem + 3px)}');
  assert.ok(below.includes('.a{font-size:12px}'), below);
  assert.ok(below.includes('.b{font-size:12px}'), below);
  assert.equal(ensureMinTextSize('.c{font-size:calc(1rem - 2px)}'), '.c{font-size:calc(1rem - 2px)}');
});

test('understands the font shorthand size token', () => {
  const out = ensureMinTextSize('.motion-toggle{font:10px/1 ui-monospace,monospace}.skip{font:600 13px/1.2 system-ui}');
  assert.ok(out.includes('.motion-toggle{font-size:12px}'), out);
  assert.ok(!out.includes('.skip{font-size:12px}'), out);
});

test('keeps selectors with commas, pseudo-elements and functional pseudos intact', () => {
  const out = ensureMinTextSize('h1, .a, h2{font-size:11px}.x::after{font-size:9px}.y:where(.z){font-size:10px}');
  assert.ok(out.includes('h1, .a, h2{font-size:12px}'), out);
  assert.ok(out.includes('.x::after{font-size:12px}'), out);
  assert.ok(out.includes('.y:where(.z){font-size:12px}'), out);
});

test('ignores @keyframes and non-applicable at-rules', () => {
  const css =
    '@keyframes spin{from{font-size:8px}to{font-size:9px}}@media print{.p{font-size:9px}}@media (min-width:1000px){.wide{font-size:9px}}@font-face{font-family:x;src:url(x.woff2)}';
  assert.equal(ensureMinTextSize(css), css);
});

test('raises small sizes that only apply on phones inside nested media', () => {
  const css = '.nature-top{font-size:10px}@media (max-width:560px){.nature-top nav{font-size:9px}}';
  const out = ensureMinTextSize(css);
  assert.ok(out.includes('.nature-top{font-size:12px}'), out);
  assert.ok(out.includes('.nature-top nav{font-size:12px}'), out);
  assert.equal(ensureMinTextSize(out).indexOf('@media (max-width:720px)', out.indexOf('@media (max-width:720px)') + 1), -1, 'a second pass adds no new block');
});

test('prefers the effective cascade value: a later phone rule above the minimum wins', () => {
  const css = '.a{font-size:9px}@media (max-width:560px){.a{font-size:14px}}';
  assert.equal(ensureMinTextSize(css), css);
});

test('reduces excessive letter-spacing on raised micro-labels', () => {
  const out = ensureMinTextSize('.lab{font-size:9px;letter-spacing:.2em}');
  assert.ok(out.includes('.lab{font-size:12px;letter-spacing:.08em;overflow-wrap:normal;word-break:normal}'), out);
  const calm = ensureMinTextSize('.calm{font-size:9px;letter-spacing:.05em}');
  assert.ok(calm.includes('.calm{font-size:12px}') && !calm.includes('letter-spacing:.08em'), calm);
});

test('dedupes selectors and stays deterministic', () => {
  const css = '.q{font-size:9px}.q{color:red;font-size:10px}.r{font-size:8px}';
  const once = ensureMinTextSize(css);
  assert.equal(once, ensureMinTextSize(css));
  assert.equal(once.match(/\.q\{font-size:12px\}/g)?.length, 1, once);
  assert.ok(once.indexOf('.q{font-size:12px') < once.indexOf('.r{font-size:12px'), once);
});

test('is idempotent over generated output', () => {
  const css =
    'html body .top nav{font-size:11px}.card-link{font-size:10px}@media (max-width:380px){body{overflow-wrap:anywhere}}';
  const once = ensureMinTextSize(css);
  assert.equal(ensureMinTextSize(once), once);
});

test('honours custom minPx and maxWidth options', () => {
  const out = ensureMinTextSize('.a{font-size:13px}', { minPx: 14, maxWidth: 640 });
  assert.ok(out.includes('@media (max-width:640px){.a{font-size:14px}}'), out);
});

test('processes every style block of an HTML document', () => {
  const html = '<style>.a{font-size:9px}</style><p>copy</p><style>body{margin:0}</style>';
  const out = ensureMinTextSizeInHtml(html);
  assert.ok(out.includes('.a{font-size:12px}'), out);
  assert.ok(out.includes('<style>body{margin:0}</style>'), out);
  assert.equal(ensureMinTextSizeInHtml(out), out);
});
