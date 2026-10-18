import assert from 'node:assert/strict';
import test from 'node:test';
import { validateHtml } from '../src/validate.js';
import { getStyle, styleSlugs } from '../src/styles/presets.js';
import { renderPage } from '../src/page/index.js';

function brokenPage(): string {
  return `<!doctype html>
<html>
<head>
<style>
body{font-family:'Inter',sans-serif;background:#123456;color:#abcdef}
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

test('every issue teaches with code, severity, where, why, fix and example', () => {
  const result = validateHtml(brokenPage(), 'brutalist');
  assert.ok(result.issues.length > 0, 'the broken page should produce issues');
  for (const issue of result.issues) {
    assert.equal(typeof issue.code, 'string');
    assert.ok(issue.code.length > 0);
    assert.ok(['error', 'warn', 'info'].includes(issue.severity), `${issue.code} severity`);
    assert.ok(issue.where.length > 0, `${issue.code} where`);
    assert.ok(issue.why.length > 0, `${issue.code} why`);
    assert.ok(issue.fix.length > 0, `${issue.code} fix`);
    assert.ok(issue.example.length > 0, `${issue.code} example`);
    assert.ok(Array.isArray(issue.patch), `${issue.code} patch`);
  }
});

test('repairable rules carry a machine-applicable patch', () => {
  const result = validateHtml(brokenPage(), 'brutalist');
  const byCode = new Map(result.issues.map((issue) => [issue.code, issue]));
  const expectations: Record<string, string> = {
    'missing-lang': 'set-lang',
    'missing-title': 'ensure-title',
    'missing-viewport': 'ensure-viewport',
    'missing-skip-link': 'ensure-skip-link',
    'missing-main': 'ensure-main',
    'missing-h1': 'normalize-headings',
    'img-alt': 'add-alt',
    'color-outside-palette': 'replace-hex',
    'radius-out-of-range': 'radius-to-range',
    'forbidden-font': 'replace-font',
    'soft-shadow-in-brutalist': 'brutalist-shadow',
    'emoji-in-copy': 'strip-emoji',
    'forbidden-element': 'remove-element',
    'missing-overflow-guard': 'clamp-overflow',
  };
  for (const [code, op] of Object.entries(expectations)) {
    const issue = byCode.get(code);
    assert.ok(issue, `expected the validator to emit ${code}`);
    assert.ok(issue!.patch.some((patch) => patch.op === op), `${code} should carry a ${op} patch`);
  }
});

test('multiple h1 and papercraft hard shadows also carry patches', () => {
  const multi = validateHtml(
    `<!doctype html><html lang="en"><head><title>X</title></head><body><main><h1>One</h1><h1>Two</h1></main></body></html>`,
    'renaissance',
  );
  const multiple = multi.issues.find((issue) => issue.code === 'multiple-h1');
  assert.ok(multiple?.patch.some((patch) => patch.op === 'normalize-headings'));

  const paper = validateHtml(
    `<!doctype html><html lang="en"><head><title>X</title><style>.card{box-shadow:0 0 0 #000}</style></head><body><main><h1>X</h1></main></body></html>`,
    'papercraft',
  );
  const hard = paper.issues.find((issue) => issue.code === 'hard-shadow-in-papercraft');
  assert.ok(hard?.patch.some((patch) => patch.op === 'papercraft-shadow'));
});

test('clean generated pages carry no issues and no patches', () => {
  for (const style of styleSlugs) {
    const html = renderPage(style, {
      title: 'Atelier Lumen',
      locale: 'en',
      sections: [{ title: 'One', body: 'A short card body.' }],
    });
    const result = validateHtml(html, style);
    assert.deepEqual(result.issues, [], `${style} should be clean`);
    assert.equal(result.issues.flatMap((issue) => issue.patch).length, 0);
  }
});

test('the nearest palette token is offered for an off-palette colour', () => {
  const preset = getStyle('brutalist');
  const result = validateHtml(
    `<!doctype html><html lang="en"><head><title>X</title><style>body{background:#123456}</style></head><body><main><h1>X</h1></main></body></html>`,
    'brutalist',
  );
  const issue = result.issues.find((candidate) => candidate.code === 'color-outside-palette');
  assert.ok(issue, 'expected a colour issue');
  const allowed = Object.values(preset.palette).map((hex) => hex.toUpperCase());
  const patch = issue!.patch.find((candidate) => candidate.op === 'replace-hex');
  assert.ok(patch?.params?.to && allowed.includes(patch.params.to.toUpperCase()), `snapped to ${patch?.params?.to}`);
});
