/**
 * Optional stress test across N styles with a (cheap/free) worker.
 *
 * Usage:
 *   COLMENA_WORKER=max-hive pnpm exec tsx scripts/e2e-weak-matrix.ts renaissance brutalist papercraft
 *
 * Defaults to 3 styles when none are given. Never run against paid workers.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { colmenaTransport } from './lib/colmena.js';
import { runScript } from './lib/run.js';
import { validateHtml } from '../src/validate.js';
import { isStyleSlug, styleSlugs } from '../src/styles/presets.js';

const project = path.resolve(process.cwd());
const worker = process.env.COLMENA_WORKER ?? 'max-hive';

interface TextBlock { type: string; text: string; }
interface RunResult { pending?: { job_id?: string }; raw?: string; }

function contentText(result: unknown): string {
  const blocks = (result as { content?: TextBlock[] }).content ?? [];
  return blocks.map((block) => block.text ?? '').join('\n');
}

function parsePayload(result: unknown): RunResult {
  const text = contentText(result);
  try { return JSON.parse(text) as RunResult; } catch { return { raw: text }; }
}

async function runTask(client: Client, task: string): Promise<string> {
  let result = parsePayload(await client.callTool({ name: 'run', arguments: { task, cwd: project, worker, isolation: 'inplace', wait: true, timeout_s: 420 } }));
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!result.pending) break;
    const jobId = result.pending?.job_id;
    if (!jobId) break;
    result = parsePayload(await client.callTool({ name: 'wait', arguments: { job_ids: [jobId], timeout_s: 420 } }));
  }
  return result.raw ?? contentText(result);
}

async function main(): Promise<void> {
  const requested = process.argv.slice(2).filter(Boolean);
  const styles = (requested.length ? requested : ['renaissance', 'brutalist', 'papercraft'])
    .filter(isStyleSlug)
    .slice(0, 13);
  if (styles.length === 0) {
    throw new Error(`Pass style slugs. Available: ${styleSlugs.join(', ')}`);
  }

  const transport = colmenaTransport();
  const client = new Client({ name: 'open-beauty-weak-matrix', version: '1.0.0' });
  await client.connect(transport);

  const scoreboard: Array<{ style: string; grade: string; score: number; vision: number; ok: boolean; note: string }> = [];

  for (const style of styles) {
    const out = `weak-matrix/${style}.html`;
    const task = `You are testing open-beauty-site. Work only in the current directory. Use ONLY skills/beauty.md and examples/recipes/${style}/page.json. Do not read src/.

1. Read skills/beauty.md.
2. Run: node dist/cli.js page --style ${style} --brief examples/recipes/${style}/page.json --out ${out}
3. Run: node dist/cli.js validate ${out} --style ${style}

Report RESULT (grade and vision), FILES (${out}), TESTS, RISKS. Keep it under 8 lines.`;
    console.log(`\n=== ${style} ===`);
    const report = await runTask(client, task);
    console.log(report.slice(0, 1200));

    try {
      const html = await readFile(path.resolve(project, out), 'utf8');
      const validation = validateHtml(html, style as never);
      scoreboard.push({ style, grade: validation.grade, score: validation.score, vision: validation.vision.score, ok: true, note: '' });
    } catch (error) {
      scoreboard.push({ style, grade: '?', score: 0, vision: 0, ok: false, note: (error as Error).message });
    }
  }

  await client.close();

  console.log('\n=== SCOREBOARD ===');
  for (const row of scoreboard) {
    console.log(`${row.style.padEnd(12)} ${row.grade} ${String(row.score).padStart(3)}/100 vision ${row.vision}/4 ${row.ok ? 'ok' : 'FAIL: ' + row.note}`);
  }
}

runScript(main);
