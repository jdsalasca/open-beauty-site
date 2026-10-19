import assert from 'node:assert/strict';
import test from 'node:test';
import {
  VISUAL_MATRIX_KINDS,
  formatVisualMatrix,
  matrixFailed,
  runVisualMatrix,
  summarizeMatrix,
  type VisualMatrixRow,
} from '../scripts/visual-matrix.js';
import { locatePlaywright } from '../src/visual.js';

const row = (style: string, scores: Partial<Record<(typeof VISUAL_MATRIX_KINDS)[number], number>>): VisualMatrixRow => ({
  style: style as VisualMatrixRow['style'],
  cells: VISUAL_MATRIX_KINDS.map((kind) => ({
    kind,
    status: scores[kind] === undefined ? 'below' : scores[kind] === 100 ? 'A100' : 'below',
    score: scores[kind] ?? 90,
    grade: scores[kind] === 100 ? 'A' : 'B',
    findings: scores[kind] === undefined ? ['clipped-text'] : [],
  })),
});

test('summarizeMatrix counts perfect cells only', () => {
  const rows = [row('nature', { page: 100, deck: 100 }), row('galactic', { page: 94 })];
  assert.deepEqual(summarizeMatrix(rows), { total: 14, ok: 2, failed: 12 });
  assert.equal(matrixFailed(rows), true);
});

test('formatVisualMatrix prints the score table and the finding codes', () => {
  const report = formatVisualMatrix([row('galactic', { page: 94, deck: 100 })]);
  assert.match(report, /style\s+page\s+deck/);
  assert.match(report, /galactic {2}94/);
  assert.match(report, /galactic\/story: B 90\/100 \[clipped-text\]/);
  assert.match(report, /1\/7 cells A100 \(6 below the bar\)/);
});

test('formatVisualMatrix reports cells near the bar with their codes', () => {
  const rows: VisualMatrixRow[] = [
    {
      style: 'brutalist' as VisualMatrixRow['style'],
      cells: [{ kind: 'page', status: 'below', score: 94, grade: 'B', findings: ['clipped-text'] }],
    },
  ];
  const report = formatVisualMatrix(rows);
  assert.match(report, /brutalist\/page: B 94\/100 \[clipped-text\]/);
});

test('every recipe artefact scores A 100 in the full visual matrix', async (t) => {
  if (!locatePlaywright()) {
    t.skip('playwright not found via BEAUTY_PLAYWRIGHT_ROOT, project, global or sibling path');
    return;
  }
  const rows = await runVisualMatrix({ concurrency: 4 });
  assert.equal(summarizeMatrix(rows).total, 13 * VISUAL_MATRIX_KINDS.length, 'the matrix must cover all 13 styles');
  const failures = rows.flatMap((item) =>
    item.cells
      .filter((cell) => cell.status !== 'A100')
      .map((cell) => `${item.style}/${cell.kind}: ${cell.grade} ${cell.score}/100 [${cell.findings.join(', ')}]`),
  );
  assert.deepEqual(failures, [], `\n${formatVisualMatrix(rows)}`);
});
