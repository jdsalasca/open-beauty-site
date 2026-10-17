/**
 * Optional stress test with the cheapest worker in the hive.
 * It uses the CLI, because OpenCode workers do not share Codex's MCP config.
 *
 * Usage: COLMENA_ROOT=... pnpm exec tsx scripts/e2e-weak.ts
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';

const project = path.resolve(process.cwd());
const colmenaRoot = process.env.COLMENA_ROOT ?? path.resolve(project, '..', 'colmena-mcp');
const worker = process.env.COLMENA_WORKER ?? 'max-hive';

function textOf(result: unknown): string {
  const blocks = (result as { content?: Array<{ text?: string }> }).content ?? [];
  return blocks.map((block) => block.text ?? '').join('\n');
}

async function main(): Promise<void> {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(colmenaRoot, 'src', 'server.js')],
    env: { ...process.env, COLMENA_NOTIFIER: 'none' } as Record<string, string>,
  });
  const client = new Client({ name: 'open-beauty-weak-test', version: '1.0.0' });
  await client.connect(transport);

  const task = `You are testing a design harness, not writing code. Work only in the current directory.

Run these commands, in order, and report their output:
1. node dist/cli.js page --style renaissance --title "HIVE / LIGHT" --tagline "Small hands, old light." --intro "A quiet page made by the cheapest model in the hive. The system did the typography; the model only wrote the words." --out "luna-test/hive-renaissance.html"
2. node dist/cli.js validate luna-test/hive-renaissance.html --style renaissance

Report RESULT (grade), FILES (path), TESTS, RISKS. Do not edit source code. Keep it under 10 lines.`;

  const result = await client.callTool({
    name: 'run',
    arguments: { task, cwd: project, worker, isolation: 'inplace', wait: true, timeout_s: 420 },
  });
  console.log(textOf(result).slice(0, 3000));
  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
