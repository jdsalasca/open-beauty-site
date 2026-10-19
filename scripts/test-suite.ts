import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEST_DIR = path.join(ROOT, 'test');

/**
 * Suites that launch Chromium/Playwright. They run serially (concurrency 1) so
 * several browser launches never compete for CPU, and every Playwright launch
 * and navigation honours BEAUTY_BROWSER_TIMEOUT_MS (see src/browser.ts). Every
 * other file is a unit suite and runs in parallel.
 */
export const BROWSER_SUITES: readonly string[] = [
  'deck-capture.test.ts',
  'min-text-visual.test.ts',
  'narrative-compare.browser.test.ts',
  'narrative-gallery.browser.test.ts',
  'page-geometry.test.ts',
  'visual-matrix.test.ts',
  'visual.test.ts',
];

export function testFiles(): string[] {
  return readdirSync(TEST_DIR)
    .filter((name) => name.endsWith('.test.ts'))
    .sort();
}

export function suiteFiles(group: 'unit' | 'browser'): string[] {
  const browser = new Set(BROWSER_SUITES);
  const names = testFiles().filter((name) => (group === 'browser' ? browser.has(name) : !browser.has(name)));
  return names.map((name) => path.join('test', name));
}

function run(group: 'unit' | 'browser'): void {
  const files = suiteFiles(group);
  if (files.length === 0) {
    console.error(`no ${group} test files found under ${TEST_DIR}`);
    process.exitCode = 1;
    return;
  }
  const args = ['--import', 'tsx', '--test'];
  if (group === 'browser') args.push('--test-concurrency=1');
  args.push(...files);
  const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit', windowsHide: true });
  process.exitCode = result.status ?? 1;
}

const group = process.argv[2];
if (group === 'unit' || group === 'browser') {
  run(group);
} else {
  console.error('usage: tsx scripts/test-suite.ts <unit|browser>');
  process.exitCode = 1;
}
