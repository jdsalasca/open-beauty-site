import assert from 'node:assert/strict';
import test from 'node:test';
import { criticReport } from '../src/critic.js';
import { renderPage } from '../src/page/index.js';
import { styleSlugs } from '../src/styles/presets.js';

test('the critic grades every generated page with nine categories and at most three fixes', () => {
  for (const style of styleSlugs) {
    const html = renderPage(style, {
      title: 'Atelier Lumen',
      locale: 'en',
      sections: [
        {
          title: 'Objects',
          body: 'Every piece starts with a drawing and a long conversation with the material before it becomes an object.',
        },
      ],
    });
    const report = criticReport(html, style);
    assert.equal(report.categories.length, 9, `${style} should have nine categories`);
    assert.ok(report.score >= 0 && report.score <= 100, `${style} score in range`);
    for (const category of report.categories) {
      assert.ok(category.score >= 0 && category.score <= 100, `${style}/${category.name} score in range`);
      assert.ok(Array.isArray(category.findings));
    }
    assert.ok(report.topFixes.length <= 3, `${style} top fixes bounded`);
  }
});

test('the critic names every axis', () => {
  const report = criticReport('<html lang="en"><body><main><h1>X</h1></main></body></html>', 'renaissance');
  assert.deepEqual(
    report.categories.map((category) => category.name),
    ['hierarchy', 'line-length', 'density', 'whitespace', 'contrast', 'motion', 'labelling', 'style-never', 'brief-fidelity'],
  );
});

test('the critic sees a missing h1, a bad measure, unsafe motion, unlabelled art and Never-list breaks', () => {
  const html = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>X</title><style>p{max-width:20ch}</style></head><body><header></header><main><img src="a.png"><section><h3>Hi</h3><p>lorem ipsum 🎉</p></section></main><footer></footer></body></html>`;
  const report = criticReport(html, 'brutalist');
  const byName = new Map(report.categories.map((category) => [category.name, category]));

  assert.ok(byName.get('hierarchy')!.score < 100, 'missing h1');
  assert.ok(byName.get('line-length')!.score < 100, 'bad measure');
  assert.ok(byName.get('motion')!.score < 100, 'unsafe motion');
  assert.ok(byName.get('labelling')!.score < 100, 'unlabelled image');
  assert.ok(byName.get('style-never')!.score < 100, 'Never-list break');

  assert.ok(report.topFixes.length > 0 && report.topFixes.length <= 3);
  assert.ok(report.topFixes.some((fix) => fix.length > 0));
});

test('the critic flags a forbidden font and ignores an allowed fallback', () => {
  const forbidden = criticReport(
    `<!doctype html><html lang="en"><head><title>X</title><style>body{font-family:'Inter',sans-serif}</style></head><body><main><h1>X</h1></main></body></html>`,
    'papercraft',
  );
  const neverForbidden = forbidden.categories.find((category) => category.name === 'style-never');
  assert.ok(neverForbidden!.findings.some((finding) => /Inter/.test(finding)), 'Inter should be flagged');

  const allowed = criticReport(
    `<!doctype html><html lang="en"><head><title>X</title><style>body{font-family:'Fraunces',Georgia,serif}</style></head><body><main><h1>X</h1></main></body></html>`,
    'papercraft',
  );
  const neverAllowed = allowed.categories.find((category) => category.name === 'style-never');
  assert.ok(!neverAllowed!.findings.some((finding) => /Georgia/.test(finding)), 'Georgia fallback should not be flagged');
});

test('the critic reuses the accessibility contrast pairs', () => {
  const report = criticReport(
    `<!doctype html><html lang="en"><head><title>X</title></head><body><main><h1>X</h1><p>Body</p></main></body></html>`,
    'nature',
  );
  const contrast = report.categories.find((category) => category.name === 'contrast');
  assert.equal(contrast!.score, 100, 'the shipped palettes meet WCAG AA');
});

test('the critic rejects unknown styles', () => {
  assert.throws(() => criticReport('<html></html>', 'editorial' as never), /Unknown style/);
});
