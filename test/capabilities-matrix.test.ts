import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { parseCapabilitiesMarkdown } from '../scripts/capabilities-matrix.js';

const ROOT = process.cwd();

test('generated capabilities markdown matches beauty capabilities --json and supported cells cite an existing proof', () => {
  const command = spawnSync(process.execPath, [path.join(ROOT, 'dist', 'cli.js'), 'capabilities', '--json'], { cwd: ROOT, encoding: 'utf8', timeout: 30_000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
  assert.equal(command.status, 0, command.stderr || command.stdout);
  const report = JSON.parse(command.stdout);
  const markdown = readFileSync(path.join(ROOT, 'docs', 'narrative-gif', 'CAPABILITIES.md'), 'utf8');
  const rows = parseCapabilitiesMarkdown(markdown);
  assert.equal(rows.length, report.cells.length, 'every CLI capability cell is documented exactly once');
  for (const cell of report.cells) {
    const key = `${cell.style}/${cell.primitive}/${cell.aspect}/${cell.locale}`;
    const row = rows.find((candidate) => candidate.key === key);
    assert.ok(row, `missing matrix row ${key}`);
    assert.equal(row.status, cell.status, `${key} status matches CLI`);
    assert.equal(row.reason, cell.reason, `${key} reason matches CLI`);
    assert.equal(existsSync(path.join(ROOT, row.evidence)), true, `${key} evidence path exists`);
    if (cell.status === 'supported') {
      assert.ok(row.proof, `${key} supported cell names its proof test`);
      assert.equal(existsSync(path.join(ROOT, row.proof)), true, `${key} proof test exists`);
    }
  }
  assert.match(markdown, /no evidence = not approved/i);
});
