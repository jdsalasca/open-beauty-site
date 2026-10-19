import assert from 'node:assert/strict';
import test from 'node:test';
import { auditArtifact, auditArtifactBatch, locatePlaywright, meetsStrictBar, repairArtifact, type BatchAuditEntry } from '../src/visual.js';
import type { RichValidationResult } from '../src/types/validation.js';
import type { VisualIssueCode } from '../src/types/visual.js';
import { renderPage } from '../src/page/index.js';

/**
 * Real-browser visual rules. The page uses the real Playwright when it can be
 * located (env, project, global or sibling install); otherwise every test skips
 * with a message instead of failing. The fixtures are tiny HTML pages crafted
 * to break exactly one rule each.
 */

const shell = (css: string, body: string): string =>
  `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Visual fixture</title><style>body{margin:0;font-family:'Nunito Sans',sans-serif}main{position:relative}${css}</style></head><body><main>${body}</main></body></html>`;

const FIXTURES: Array<{ code: VisualIssueCode; html: string }> = [
  {
    code: 'horizontal-overflow',
    html: shell('.wide{width:900px;height:20px;background:#1C1C1C}', '<h1>Overflow</h1><div class="wide"></div>'),
  },
  {
    code: 'fixed-sticky-element-occludes-text',
    html: shell(
      '.pause{position:fixed;right:8px;bottom:8px;width:140px;height:48px;background:#1C1C1C;color:#F2EBDD}',
      `<h1>Occlusion</h1>${Array.from({ length: 14 }, (_, index) => `<p>Paragraph ${index} with enough words for the fixed control to cover as the reader scrolls.</p>`).join('')}<button class="pause" type="button">Pause motion</button>`,
    ),
  },
  {
    code: 'orphan-grid-item',
    html: shell(
      '.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.cards article{background:#E7DFC9;min-height:90px}',
      '<h1>Orphan</h1><div class="cards"><article>One</article><article>Two</article><article>Three</article><article>Four</article></div>',
    ),
  },
  {
    code: 'clipped-text',
    html: shell(
      '.clip{width:120px;overflow:hidden;white-space:nowrap;background:#E7DFC9}',
      '<h1>Clipped</h1><div class="clip">This text is clipped by its own narrow box and never expands.</div>',
    ),
  },
  {
    code: 'text-too-small',
    html: shell('.tiny{font-size:9px}', '<h1>Tiny</h1><p class="tiny">A label below twelve pixels at phone width.</p>'),
  },
  {
    code: 'overlap-decoration-on-content',
    html: shell(
      '.decor{position:absolute;top:8px;left:10px;width:320px;height:90px;background:#B53328}.under{position:relative;top:40px;width:260px}',
      '<h1>Overlap</h1><div class="decor" aria-hidden="true"></div><p class="under">Readable copy under a decorative band drawn by the template.</p>',
    ),
  },
  {
    code: 'mid-word-break',
    html: shell('.word{width:60px;overflow-wrap:anywhere;font-size:16px}', '<h1>Break</h1><p class="word">extraordinarilylongwordthatmustsplit</p>'),
  },
];

let fixtureBatch: Promise<Map<string, BatchAuditEntry>> | null = null;

/** Audits all seven fixtures in one Chromium instead of one launch each. */
async function fixtureReports(): Promise<Map<string, BatchAuditEntry>> {
  fixtureBatch ??= auditArtifactBatch(
    FIXTURES.map((fixture) => ({ html: fixture.html, style: 'nature' as const, label: fixture.code })),
  ).then((entries) => new Map(entries.map((entry) => [entry.label, entry])));
  return fixtureBatch;
}

for (const fixture of FIXTURES) {
  test(`visual rule ${fixture.code} reports its code and selector`, async (t) => {
    if (!locatePlaywright()) {
      t.skip('playwright not found via BEAUTY_PLAYWRIGHT_ROOT, project, global or sibling path');
      return;
    }
    const report = (await fixtureReports()).get(fixture.code)?.visual;
    if (!report || report.status !== 'ran') {
      t.skip(report?.message ?? 'playwright located but Chromium is unavailable');
      return;
    }
    const finding = report.findings.find((item) => item.code === fixture.code);
    assert.ok(finding, `expected ${fixture.code}, got ${report.findings.map((item) => item.code).join(', ') || 'none'}`);
    assert.ok(finding.selector.length > 0, `${fixture.code} must carry a selector`);
    assert.ok(report.issues.some((issue) => issue.code === fixture.code), `${fixture.code} must become an issue`);
  });
}

test('visual issues count in the score and cap the grade below A', async (t) => {
  if (!locatePlaywright()) {
    t.skip('playwright not available');
    return;
  }
  const clean = renderPage('nature', {
    title: 'Visual score',
    locale: 'en',
    sections: [{ title: 'One', body: 'A single card with enough words to be a real section body.' }],
  }).replace(
    '<main id="top">',
    '<main id="top"><button class="probe-cover" type="button" style="position:fixed;inset:0;border:0;background:rgba(28,28,28,.55)">cover</button>',
  );
  const html = clean;
  const report = await auditArtifact(html, 'nature', { visual: true });
  if (report.visual.status !== 'ran') {
    t.skip(report.visual.message ?? 'playwright unavailable');
    return;
  }
  assert.ok(
    report.result.issues.some((issue) => issue.code === 'fixed-sticky-element-occludes-text'),
    'expected the fixed cover to be found',
  );
  assert.equal(report.result.grade === 'A', false, 'an open visual warning cannot stay an A');
  assert.equal(meetsStrictBar(report.result), false);
});

test('visual repairs are automatic and idempotent', async (t) => {
  if (!locatePlaywright()) {
    t.skip('playwright not available');
    return;
  }
  const fixture = FIXTURES.find((item) => item.code === 'orphan-grid-item')!.html;
  const first = await repairArtifact(fixture, 'nature', { visual: true });
  if (first.visual.status !== 'ran') {
    t.skip(first.visual.message ?? 'playwright unavailable');
    return;
  }
  assert.ok(first.changed, 'the orphan grid must be repaired');
  const second = await repairArtifact(first.html, 'nature', { visual: true });
  assert.equal(second.changed, false, 'repair must be idempotent');
  assert.equal(second.fixes.length, 0);
  const remaining = first.afterResult.issues.filter((issue) => issue.code === 'orphan-grid-item');
  assert.equal(remaining.length, 0, 'the orphan must be gone after the repair');
});

test('the strict bar requires craft A, 90+ and vision 4/4', () => {
  const result = (score: number, grade: 'A' | 'B', visionScore: number): RichValidationResult => ({
    style: 'nature',
    score,
    grade,
    issues: [],
    vision: { score: visionScore, checks: [], note: '' },
    stats: { bytes: 0, colors: 0, fonts: [], radii: [], durations: [] },
  });
  assert.equal(meetsStrictBar(result(94, 'B', 4)), false);
  assert.equal(meetsStrictBar(result(100, 'A', 3)), false);
  assert.equal(meetsStrictBar(result(90, 'A', 4)), true);
});
