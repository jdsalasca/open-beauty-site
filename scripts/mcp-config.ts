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
console.log('# Codex CLI (~/.codex/config.toml)');
console.log(`[mcp_servers.open_beauty]
command = "node"
args = ["${server.replaceAll('\\', '\\\\')}"]
startup_timeout_sec = 30.0
`);
console.log('# Codex one-liner');
console.log(`codex mcp add open-beauty -- node "${server}"\n`);
console.log('# Claude Code one-liner');
console.log(`claude mcp add -s user open-beauty -- node "${server}"\n`);
console.log('# Cursor / generic JSON');
console.log(JSON.stringify(config, null, 2));
console.log('\nThis script never edits your config files; copy the snippet you need.');
