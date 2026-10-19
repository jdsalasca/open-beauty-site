import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, platform, arch } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_BROWSER_TIMEOUT_MS, browserTimeoutMs } from '../src/browser.js';
import { runScript } from './lib/run.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_DIR = path.join(ROOT, 'docs', 'reports');
const REPORT_MARKDOWN = path.join(REPORT_DIR, 'check-all-latest.md');
const REPORT_JSON = path.join(REPORT_DIR, 'check-all-latest.json');

interface StepSpec {
  name: string;
  script: string;
}

/** The full integral, in the order `check:all` runs it. */
const STEPS: StepSpec[] = [
  { name: 'check', script: 'check' },
  { name: 'build', script: 'build' },
  { name: 'check:scripts', script: 'check:scripts' },
  { name: 'test:unit', script: 'test:unit' },
  { name: 'test:browser', script: 'test:browser' },
];

interface StepResult {
  name: string;
  command: string;
  status: number;
  durationMs: number;
  tests: number | null;
  pass: number | null;
  fail: number | null;
  skipped: number | null;
  cancelled: number | null;
  timeouts: number;
  failingTests: string[];
  outputTail: string;
}

function parseCount(output: string, label: string): number | null {
  const match = output.match(new RegExp(`(?:^|\\n)\\s*(?:\\u2139\\s*)?${label} (\\d+)`));
  return match?.[1] !== undefined ? Number(match[1]) : null;
}

function failingTestNames(output: string): string[] {
  const names = new Set<string>();
  for (const line of output.split('\n')) {
    const match = /^\s*\u2716 (.+?)(?: \(\d+(?:\.\d+)?ms\))?$/.exec(line);
    if (match?.[1]) names.add(match[1].trim());
  }
  return [...names];
}

function timeoutMentions(output: string): number {
  return output.match(/(?:timeout|timed out)/gi)?.length ?? 0;
}

function runStep(step: StepSpec): StepResult {
  const started = Date.now();
  const result = spawnSync(`pnpm ${step.script}`, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
    shell: true,
  });
  const durationMs = Date.now() - started;
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  return {
    name: step.name,
    command: `pnpm ${step.script}`,
    status: result.status ?? 1,
    durationMs,
    tests: parseCount(output, 'tests'),
    pass: parseCount(output, 'pass'),
    fail: parseCount(output, 'fail'),
    skipped: parseCount(output, 'skipped'),
    cancelled: parseCount(output, 'cancelled'),
    timeouts: timeoutMentions(output),
    failingTests: failingTestNames(output),
    outputTail: output.split('\n').slice(-40).join('\n'),
  };
}

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

function cell(value: number | null): string {
  return value === null ? '—' : String(value);
}

function statusOf(result: StepResult): string {
  return result.status === 0 ? 'PASS' : 'FAIL';
}

function renderMarkdown(results: StepResult[], generatedAt: string): string {
  const failed = results.filter((result) => result.status !== 0);
  const timeoutOverride = process.env.BEAUTY_BROWSER_TIMEOUT_MS;
  const lines: string[] = [
    '# check:all report',
    '',
    `- Generated: ${generatedAt}`,
    `- Node: ${process.version} · ${platform()} ${arch()} · ${cpus().length} CPUs`,
    `- Browser timeout: ${browserTimeoutMs()} ms (BEAUTY_BROWSER_TIMEOUT_MS ${timeoutOverride ?? `unset → default ${DEFAULT_BROWSER_TIMEOUT_MS}`})`,
    `- Overall: ${failed.length === 0 ? 'PASS' : `FAIL (${failed.map((result) => result.name).join(', ')})`}`,
    '',
    '## Steps',
    '',
    '| Step | Command | Status | Duration | Tests | Pass | Fail | Skipped | Timeout mentions |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ];
  for (const result of results) {
    lines.push(
      `| ${result.name} | \`${result.command}\` | ${statusOf(result)} | ${seconds(result.durationMs)} | ${cell(result.tests)} | ${cell(result.pass)} | ${cell(result.fail)} | ${cell(result.skipped)} | ${result.timeouts} |`,
    );
  }

  lines.push('', '## Failures', '');
  const failing = results.filter((result) => result.status !== 0 || result.failingTests.length > 0);
  if (failing.length === 0) {
    lines.push('None: every step exited 0.');
  } else {
    for (const result of failing) {
      lines.push(`### ${result.name} (exit ${result.status})`);
      if (result.failingTests.length) {
        for (const name of result.failingTests) lines.push(`- ${name}`);
      } else {
        lines.push('- (no test name parsed; see the step output below)');
      }
      lines.push('');
    }
  }

  for (const result of results) {
    lines.push('', `## ${result.name} output (tail)`, '', '```text', result.outputTail.trimEnd(), '```');
  }
  lines.push('');
  return lines.join('\n');
}

runScript(async () => {
  const generatedAt = new Date().toISOString();
  const results: StepResult[] = [];
  for (const step of STEPS) {
    console.log(`\n=== pnpm ${step.script} ===`);
    const result = runStep(step);
    console.log(result.outputTail);
    console.log(`=== pnpm ${step.script}: exit ${result.status} in ${seconds(result.durationMs)} ===`);
    results.push(result);
  }

  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(REPORT_MARKDOWN, renderMarkdown(results, generatedAt), 'utf8');
  await writeFile(
    REPORT_JSON,
    `${JSON.stringify(
      {
        generatedAt,
        node: process.version,
        platform: platform(),
        arch: arch(),
        cpus: cpus().length,
        browserTimeoutMs: browserTimeoutMs(),
        overall: results.every((result) => result.status === 0) ? 'pass' : 'fail',
        steps: results.map(({ outputTail, ...rest }) => rest),
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  console.log(`\nwrote ${path.relative(ROOT, REPORT_MARKDOWN)} and ${path.relative(ROOT, REPORT_JSON)}`);

  if (results.some((result) => result.status !== 0)) process.exitCode = 1;
});
