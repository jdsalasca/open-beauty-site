/**
 * End-to-end test through the local colmena-mcp server.
 *
 * Requires colmena-mcp checked out next to this repo (or COLMENA_ROOT set)
 * and a `luna-max` worker in ~/.colmena/colmena.yml.
 *
 * Usage: COLMENA_ROOT=... pnpm exec tsx scripts/e2e-colmena.ts
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import path from 'node:path';
import { colmenaTransport } from './lib/colmena.js';
import { runScript } from './lib/run.js';

const project = path.resolve(process.cwd());

interface TextBlock {
  type: string;
  text: string;
}

function contentText(result: unknown): string {
  const blocks = (result as { content?: TextBlock[] }).content ?? [];
  return blocks.map((block) => block.text).join('\n');
}

function parsePayload(result: unknown): Record<string, unknown> {
  const text = contentText(result);
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { raw: text };
  }
}

async function main(): Promise<void> {
  const transport = colmenaTransport();
  const client = new Client({ name: 'open-beauty-colmena-test', version: '1.0.0' });
  await client.connect(transport);

  const doctor = parsePayload(await client.callTool({ name: 'doctor', arguments: {} }));
  console.log('doctor:', JSON.stringify(doctor).slice(0, 700));

  const task = `You are testing open-beauty-site, a design harness exposed through the MCP server open_beauty.

Goal: create a beautiful papercraft page for a fictional studio called "Casa Limón".

1. Call beauty_get_style with style "papercraft".
2. Call beauty_create_page with:
   style "papercraft",
   title "CASA LIMÓN",
   tagline "Objetos, fiestas y pequeños rituales.",
   intro "Somos un taller de papel que diseña celebraciones y objetos para gente que todavía mira los detalles. Cortamos, pegamos y probamos hasta que una idea se vuelve algo que se puede tocar.",
   sections: "Identidad" (Marcas con textura y sellos), "Fiestas" (Invitaciones y mesas que se recuerdan), "Objetos" (Piezas pequeñas hechas a mano),
   output "luna-test/papercraft.html".
3. Call beauty_validate on "luna-test/papercraft.html" with style "papercraft".
4. Report the grade, the absolute path and any issues in under 10 lines.

Do not write HTML by hand. Do not edit the harness. Use the MCP tools.`;

  let result = parsePayload(
    await client.callTool({
      name: 'run',
      arguments: {
        task,
        cwd: project,
        worker: 'luna-max',
        isolation: 'inplace',
        wait: true,
        timeout_s: 480,
      },
    }),
  );
  console.log('run:', JSON.stringify(result).slice(0, 1500));

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (!result.pending) break;
    const jobId = (result.pending as { job_id?: string } | undefined)?.job_id;
    if (!jobId) break;
    result = parsePayload(
      await client.callTool({ name: 'wait', arguments: { job_ids: [jobId], timeout_s: 480 } }),
    );
    console.log('wait:', JSON.stringify(result).slice(0, 1500));
  }

  await client.close();
}

runScript(main);
