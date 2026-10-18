import assert from 'node:assert/strict';
import test from 'node:test';
import { fixHtml } from '../src/fix.js';
import { getStyle, styleSlugs } from '../src/styles/presets.js';
import { renderPage } from '../src/page/index.js';
import type { StyleSlug } from '../src/types.js';

function shell(inner: string, styleCss = ''): string {
  return `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Atelier</title><style>${styleCss}</style></head><body>${inner}</body></html>`;
}

function brokenFor(style: StyleSlug): string {
  const forbidden = getStyle(style).rules.forbiddenFonts[0] ?? 'Inter';
  return `<!doctype html>
<html>
<head>
<style>
body{font-family:'${forbidden}',sans-serif;background:#123456;color:#abcdef}
.card{border-radius:24px;box-shadow:0 18px 30px rgba(0,0,0,.5)}
</style>
</head>
<body>
<center>hello</center>
<img src="x.png">
<section><h2>Hello</h2><p>lorem ipsum 🎉</p></section>
</body>
</html>`;
}

function styleBlocks(html: string): string[] {
  return Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi), (match) => match[1] ?? '');
}

test('fix adds the missing lang, title and viewport', () => {
  const html = '<!doctype html><html><head></head><body><h1>Atelier Lumen</h1></body></html>';
  const result = fixHtml(html, 'renaissance');
  assert.match(result.html, /<html lang="en">/);
  assert.match(result.html, /<title>Atelier Lumen<\/title>/);
  assert.match(result.html, /name="viewport" content="width=device-width, initial-scale=1"/);
});

test('fix adds the missing skip link and the main landmark', () => {
  const html = '<!doctype html><html lang="en"><head><title>X</title></head><body><h1>X</h1></body></html>';
  const result = fixHtml(html, 'renaissance');
  assert.match(result.html, /class="skip-link" href="#top"/);
  assert.match(result.html, /<main id="top">/);
});

test('fix wraps content in main after the header and before the footer', () => {
  const html = '<!doctype html><html lang="en"><head><title>X</title></head><body><header>brand</header><p>content</p><footer>end</footer></body></html>';
  const result = fixHtml(html, 'renaissance');
  assert.match(result.html, /<main id="top">/);
  assert.ok(result.html.indexOf('<main id="top">') > result.html.indexOf('</header>'), 'main starts after the header');
  assert.ok(result.html.indexOf('</main>') < result.html.indexOf('<footer'), 'main ends before the footer');
});

test('fix promotes the first heading to h1 when none exists', () => {
  const result = fixHtml(shell('<section><h2>Hello</h2><p>body</p></section>'), 'renaissance');
  assert.match(result.html, /<h1>Hello<\/h1>/);
  assert.ok(!result.html.includes('<h2>Hello'));
});

test('fix demotes extra h1 elements to h2', () => {
  const result = fixHtml(shell('<h1>One</h1><h1>Two</h1>'), 'renaissance');
  assert.equal((result.html.match(/<h1[\s>]/g) ?? []).length, 1);
  assert.match(result.html, /<h2>Two<\/h2>/);
});

test('fix adds an empty alt to images without one', () => {
  const result = fixHtml(shell('<img src="x.png">'), 'renaissance');
  assert.match(result.html, /<img src="x\.png" alt="">/);
});

test('fix replaces a forbidden font with the style display face', () => {
  const result = fixHtml(shell('<h1>X</h1>', `body{font-family:'Inter',sans-serif}`), 'papercraft');
  assert.ok(!/font-family:'Inter'/i.test(result.html));
  assert.match(result.html, /font-family:'Fraunces'/);
});

test('fix snaps off-palette colours to the nearest palette token', () => {
  const result = fixHtml(shell('<h1>X</h1>', `body{background:#123456}`), 'brutalist');
  const palette = new Set(Object.values(getStyle('brutalist').palette).map((hex) => hex.toUpperCase()));
  const hexes = [...result.html.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((match) => match[0].toUpperCase());
  assert.ok(hexes.length > 0, 'expected at least one colour');
  for (const hex of hexes) assert.ok(palette.has(hex), `${hex} is not in the palette`);
});

test('fix clamps an out-of-range border radius', () => {
  const result = fixHtml(shell('<h1>X</h1>', `.card{border-radius:24px}`), 'brutalist');
  assert.match(result.html, /border-radius:0px/);
});

test('fix converts a soft shadow into a hard brutalist shadow', () => {
  const result = fixHtml(shell('<h1>X</h1>', `.card{box-shadow:0 18px 30px rgba(0,0,0,.5)}`), 'brutalist');
  assert.match(result.html, /box-shadow:0px 18px 0 #0B0B0B/);
});

test('fix converts a hard shadow into a soft papercraft shadow', () => {
  const result = fixHtml(shell('<h1>X</h1>', `.card{box-shadow:0 0 0 #000}`), 'papercraft');
  assert.match(result.html, /box-shadow:0 18px 30px rgba\(58,46,40,\.18\)/);
});

test('fix strips emoji and presentational elements', () => {
  const result = fixHtml(shell('<p>hello 🎉</p><center>hi</center>'), 'renaissance');
  assert.ok(!result.html.includes('🎉'), 'emoji removed');
  assert.ok(!/<center[\s>]/i.test(result.html), 'center removed');
});

test('fix adds text-overflow guards', () => {
  const html = '<!doctype html><html lang="en"><head><title>X</title><style>h1{color:red}</style></head><body><main><h1>X</h1></main></body></html>';
  const result = fixHtml(html, 'renaissance');
  assert.match(result.html, /overflow-x:hidden/);
  assert.match(result.html, /max-width:100%/);
  assert.match(result.html, /overflow-wrap:anywhere/);
});

test('fixing is idempotent', () => {
  const once = fixHtml(brokenFor('renaissance'), 'renaissance');
  const twice = fixHtml(once.html, 'renaissance');
  assert.equal(twice.html, once.html);
  assert.equal(twice.changed, false);
  assert.equal(twice.fixes.length, 0);
});

test('fixing a broken page raises the score and lowers the errors', () => {
  const result = fixHtml(brokenFor('brutalist'), 'brutalist');
  assert.ok(result.after.score > result.before.score, `${result.before.score} -> ${result.after.score}`);
  assert.ok(result.after.errors < result.before.errors);
  assert.ok(result.changed);
  assert.ok(result.fixes.length > 0);
});

test('generated pages are already clean, so fix is a no-op', () => {
  for (const style of styleSlugs) {
    const html = renderPage(style, {
      title: 'Atelier Lumen',
      locale: 'en',
      sections: [{ title: 'One', body: 'A short card body with enough words to read as a section.' }],
    });
    const result = fixHtml(html, style);
    assert.equal(result.changed, false, `${style} should not change`);
    assert.equal(result.fixes.length, 0, `${style} should not report repairs`);
  }
});

test('every style repairs its Never-list font and snaps its palette', () => {
  for (const style of styleSlugs) {
    const preset = getStyle(style);
    const forbidden = preset.rules.forbiddenFonts[0]!;
    const result = fixHtml(brokenFor(style), style);
    assert.ok(result.after.score > result.before.score, `${style} should improve`);

    const pattern = new RegExp(`font-family\\s*:\\s*['"]?${forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    assert.ok(!pattern.test(result.html), `${style} should remove ${forbidden}`);

    const allowed = new Set(Object.values(preset.palette).map((hex) => hex.toUpperCase()));
    for (const block of styleBlocks(result.html)) {
      for (const match of block.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
        assert.ok(allowed.has(match[0].toUpperCase()), `${style}: ${match[0]} is off-palette`);
      }
    }
  }
});

test('fixing stays idempotent for every style', () => {
  for (const style of styleSlugs) {
    const once = fixHtml(brokenFor(style), style);
    const twice = fixHtml(once.html, style);
    assert.equal(twice.html, once.html, `${style} fix is not idempotent`);
  }
});
