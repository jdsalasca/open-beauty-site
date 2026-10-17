#!/usr/bin/env node
import path from 'node:path';
import { packageRoot } from '../src/paths.js';

const server = path.join(packageRoot(), 'dist', 'mcp', 'server.js');
const config = {
  mcpServers: {
    open_beauty: {
      command: 'node',
      args: [server],
    },
  },
};

console.log(`open-beauty MCP server: ${server}\n`);
console.log('Codex CLI (~/.codex/config.toml):\n');
console.log(`[mcp_servers.open_beauty]
command = "node"
args = ["${server.replaceAll('\\', '\\\\')}"]
startup_timeout_sec = 30.0
`);
console.log('Claude Code:\n');
console.log(`claude mcp add -s user open-beauty -- node "${server}"\n`);
console.log('Cursor / generic JSON:\n');
console.log(JSON.stringify(config, null, 2));
