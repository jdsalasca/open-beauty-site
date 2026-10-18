import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { colmenaServerCommand } from '../scripts/lib/colmena.js';
import { ensureDir, writeTextFile } from '../scripts/lib/fs.js';
import { pageGrade, printIssues } from '../scripts/lib/page.js';
import { runScript } from '../scripts/lib/run.js';

let logs: string[] = [];
let dir: string;

before(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'beauty-scripts-lib-'));
  logs = [];
});

after(async () => {
  await rm(dir, { recursive: true, force: true });
});

test('pageGrade pads the label and score like the build scripts', () => {
  assert.equal(pageGrade('papercraft', 'A', 100), 'papercraft   A 100');
  assert.equal(pageGrade('brutalist', 'B', 90), 'brutalist    B  90');
});

test('printIssues lists one indented line per issue', async () => {
  logs = [];
  const original = console.log;
  console.log = (line: string) => logs.push(String(line));
  try {
    printIssues([
      { severity: 'warn', code: 'CONTRAST', message: 'Low contrast' },
      { severity: 'error', code: 'FONT', message: 'Missing display font' },
    ]);
  } finally {
    console.log = original;
  }
  assert.deepEqual(logs, ['  [warn] CONTRAST: Low contrast', '  [error] FONT: Missing display font']);
});

test('runScript runs the main body', async () => {
  let ran = false;
  runScript(() => {
    ran = true;
    return Promise.resolve();
  });
  assert.equal(ran, true);
});

test('runScript reports failures and sets exitCode without throwing', async () => {
  const original = console.error;
  const errors: unknown[] = [];
  console.error = (error: unknown) => errors.push(error);
  const previous = process.exitCode;
  try {
    runScript(() => Promise.reject(new Error('boom')));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(errors.length, 1);
    assert.match(String(errors[0] ?? ''), /boom/);
    assert.equal(process.exitCode, 1);
  } finally {
    console.error = original;
    process.exitCode = previous;
  }
});

test('ensureDir creates nested folders', async () => {
  const target = path.join(dir, 'a', 'b', 'c');
  await ensureDir(target);
  assert.ok(existsSync(target));
});

test('writeTextFile writes utf8 content', async () => {
  const target = path.join(dir, 'note.txt');
  await writeTextFile(target, 'héllo');
  assert.equal(await readFile(target, 'utf8'), 'héllo');
});

test('colmenaServerCommand targets the local colmena server', () => {
  const project = path.resolve(process.cwd());
  const command = colmenaServerCommand('/tmp/colmena');
  assert.equal(command.command, process.execPath);
  assert.deepEqual(command.args, [path.join('/tmp/colmena', 'src', 'server.js')]);
  assert.equal(command.env.COLMENA_NOTIFIER, 'none');

  const fallback = colmenaServerCommand(undefined);
  assert.deepEqual(fallback.args, [path.resolve(project, '..', 'colmena-mcp', 'src', 'server.js')]);
});
