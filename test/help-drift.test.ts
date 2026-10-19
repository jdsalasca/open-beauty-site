import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { distCliPath } from '../src/cli.js';
import { GIF_FLAGS } from '../src/types/gif.js';
import { sprintBriefSchema, sprintHelpOptions } from '../src/types/sprint.js';
import { narrativeBriefSchema } from '../src/narrative/brief.js';
import { NARRATIVE_REVIEW_HELP, NARRATIVE_REVIEW_USAGE, NARRATIVE_RERENDER_HELP, NARRATIVE_RERENDER_USAGE } from '../src/narrative/review.js';
import { NARRATIVE_REVIEW_CRITERIA, NARRATIVE_REVIEW_LEVELS, reviewCriteriaSchema, reviewLevelsSchema } from '../src/types/narrative-review.js';

/**
 * Help drift guards. `beauty sprint --help` and `beauty gif --help` are
 * generated from one source of truth (the zod schema and the flag table); these
 * tests fail when the CLI starts reading a flag that the help never mentions.
 */

const root = process.cwd();

function runCli(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [distCliPath(), ...args], { cwd: root });
    let stdout = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.on('error', reject);
    child.on('close', () => resolve(stdout));
  });
}

test('every flag read in the gif branch appears in gif --help', async () => {
  const source = readFileSync(path.join(root, 'src', 'cli.ts'), 'utf8');
  const start = source.indexOf("case 'gif'");
  const end = source.indexOf("case 'sprint'");
  assert.ok(start >= 0 && end > start, 'could not locate the gif branch in cli.ts');
  const branch = source.slice(start, end);
  const flags = new Set(
    Array.from(branch.matchAll(/(?:stringFlag|booleanFlag|numberFlag)\(flags,\s*'([^']+)'\)/g), (match) => match[1]!),
  );
  assert.ok(flags.has('poster'), 'the gif branch should read --poster');
  const help = await runCli(['gif', '--help']);
  for (const flag of flags) {
    assert.ok(help.includes(`--${flag}`), `gif --help is missing --${flag}`);
  }
  for (const entry of GIF_FLAGS) {
    assert.ok(help.includes(`--${entry.flag}`), `GIF_FLAGS lists --${entry.flag} but the help does not show it`);
  }
});

test('every sprint schema field appears in sprint --help', async () => {
  const help = await runCli(['sprint', '--help']);
  const keys = Object.keys(sprintBriefSchema.shape);
  for (const key of keys) {
    assert.ok(help.includes(key), `sprint --help is missing the schema field "${key}"`);
  }
  for (const key of ['team', 'sprint', 'stories', 'velocity', 'burndown', 'risks', 'retro', 'capacity', 'nextGoal']) {
    assert.ok(help.includes(key), `sprint --help is missing the rich field "${key}"`);
  }
  assert.match(help, /stories.*velocity.*burndown/s, 'sprint --help needs the rich schema, not the legacy one');
  assert.match(help, /"sprint": \{ "id"/, 'sprint --help needs a JSON example');
});

test('sprint help options are generated from the schema keys', () => {
  const options = sprintHelpOptions().join('\n');
  for (const key of Object.keys(sprintBriefSchema.shape)) {
    assert.ok(options.includes(key), `sprintHelpOptions is missing "${key}"`);
  }
});

test('every narrative schema field and example appears in narrative --help', async () => {
  const help = await runCli(['narrative', '--help']);
  for (const key of Object.keys(narrativeBriefSchema.shape)) {
    assert.ok(help.includes(key), `narrative --help is missing the schema field "${key}"`);
  }
  for (const flag of ['--style', '--brief', '--out', '--legacy-art']) {
    assert.ok(help.includes(flag), `narrative --help is missing ${flag}`);
  }
  assert.match(help, /"kind": "narrative-gif"/);
  assert.match(help, /Resultado esperado/);
  for (const layout of ['object-left', 'object-right', 'object-top', 'object-hero']) {
    assert.ok(help.includes(layout), `narrative --help is missing layout ${layout}`);
  }
  for (const preset of ['product-review', 'readable', 'concise']) {
    assert.ok(help.includes(preset), `narrative --help is missing playback preset ${preset}`);
  }
});

test('capability CLI help and JSON command expose one machine-readable registry', async () => {
  const help = await runCli(['capabilities', '--help']);
  assert.match(help, /beauty capabilities \[--style <s>\] \[--json\]/);
  assert.match(help, /--style/);
  assert.match(help, /--json/);
  const child = await runCli(['capabilities', '--style', 'papercraft', '--json']);
  const report = JSON.parse(child) as { cells: Array<{ style: string }>; summary: Record<string, number> };
  assert.equal(report.cells.length, 24);
  assert.ok(report.cells.every((cell) => cell.style === 'papercraft'));
  assert.equal(report.summary.supported, 16);
  assert.equal(report.summary.unsupported, 8);
});

test('review and rerender help are generated from the shared ledger contract', async () => {
  const reviewHelp = await runCli(['review', '--help']);
  const rerenderHelp = await runCli(['rerender', '--help']);
  const source = readFileSync(path.join(root, 'src', 'cli.ts'), 'utf8');
  const start = source.indexOf("case 'review':");
  const end = source.indexOf("case 'review-state':");
  assert.ok(start >= 0 && end > start, 'could not locate the review branch in cli.ts');
  const branch = source.slice(start, end);
  const flags = new Set(Array.from(branch.matchAll(/(?:stringFlag|booleanFlag)\(flags,\s*'([^']+)'\)/g), (match) => match[1]!));
  for (const flag of flags) assert.ok(reviewHelp.includes(`--${flag}`), `beauty review --help is missing --${flag}`);
  for (const flag of ['--reviewer', '--criterion', '--level', '--feedback', '--frames']) assert.ok(reviewHelp.includes(flag));
  assert.ok(NARRATIVE_REVIEW_HELP.includes(NARRATIVE_REVIEW_USAGE));
  assert.ok(reviewHelp.includes(NARRATIVE_REVIEW_USAGE));
  assert.match(rerenderHelp, /--apply-feedback/);
  assert.ok(NARRATIVE_RERENDER_HELP.includes(NARRATIVE_RERENDER_USAGE));
  assert.ok(rerenderHelp.includes(NARRATIVE_RERENDER_USAGE));
  assert.deepEqual(Object.keys(reviewCriteriaSchema.shape), [...NARRATIVE_REVIEW_CRITERIA]);
  assert.deepEqual(Object.keys(reviewLevelsSchema.shape), [...NARRATIVE_REVIEW_LEVELS]);
  for (const criterion of NARRATIVE_REVIEW_CRITERIA) assert.ok(reviewHelp.includes(criterion));
  for (const level of NARRATIVE_REVIEW_LEVELS) assert.ok(reviewHelp.includes(level));
});
