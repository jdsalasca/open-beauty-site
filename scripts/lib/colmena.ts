import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';

export interface ColmenaCommand {
  command: string;
  args: string[];
  env: Record<string, string>;
}

export function colmenaServerCommand(colmenaRoot?: string): ColmenaCommand {
  const root = colmenaRoot ?? path.resolve(process.cwd(), '..', 'colmena-mcp');
  return {
    command: process.execPath,
    args: [path.join(root, 'src', 'server.js')],
    env: { COLMENA_NOTIFIER: 'none' },
  };
}

export function colmenaTransport(): StdioClientTransport {
  const { command, args } = colmenaServerCommand(process.env.COLMENA_ROOT);
  return new StdioClientTransport({
    command,
    args,
    env: { ...process.env, COLMENA_NOTIFIER: 'none' } as Record<string, string>,
  });
}
