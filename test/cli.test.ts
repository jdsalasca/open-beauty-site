import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { distCliPath, distFixMessage } from '../src/cli.js';

const root = process.cwd();
const cli = distCliPath();

interface CliResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

function runCli(args: string[], input?: string): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args], { cwd: root });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    if (input !== undefined) child.stdin.write(input);
    child.stdin.end();
  });
}

function runScript(script: string): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'), path.join(root, script)], {
      cwd: root,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.stdin.end();
  });
}

const COMMANDS = [
  'styles',
  'guide',
  'make',
  'page',
  'deck',
  'experience',
  'story',
  'sprint',
  'sequence',
  'canvas',
  'motion',
  'gif',
  'validate',
  'fix',
  'examples',
  'doctor',
  'mcp',
  'version',
] as const;

test('the global help lists every command and never names an MCP tool', async () => {
  const result = await runCli(['--help']);
  assert.equal(result.code, 0);
  for (const command of COMMANDS) {
    assert.ok(result.stdout.includes(command), `global help is missing "${command}"`);
  }
  assert.doesNotMatch(result.stdout, /beauty_get_style|beauty_create_|beauty_validate|beauty_list_styles/);
});

for (const command of COMMANDS) {
  test(`beauty ${command} --help exits 0 with usage, options and an example`, async () => {
    const result = await runCli([command, '--help']);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /Usage:/i, `${command}: no usage line`);
    assert.match(result.stdout, /Options:/i, `${command}: no options section`);
    assert.match(result.stdout, /Example:/i, `${command}: no example`);
    assert.ok(result.stdout.includes('beauty'), `${command}: usage does not show the beauty command`);

    const short = await runCli([command, '-h']);
    assert.equal(short.code, 0, `${command}: -h failed`);
    assert.equal(short.stdout, result.stdout, `${command}: -h differs from --help`);

    const named = await runCli(['help', command]);
    assert.equal(named.code, 0, `${command}: help <cmd> failed`);
    assert.equal(named.stdout, result.stdout, `${command}: help <cmd> differs from --help`);
  });
}

test('beauty --version prints the package version', async () => {
  const result = await runCli(['--version']);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+$/);
});

test('beauty help <unknown> fails with a non-zero exit', async () => {
  const result = await runCli(['help', 'nope']);
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /Unknown command/);
});

test('beauty <unknown> --help fails instead of printing global help', async () => {
  const result = await runCli(['nope', '--help']);
  assert.notEqual(result.code, 0);
});

test('beauty styles never names an MCP tool and points at the CLI', async () => {
  const result = await runCli(['styles']);
  assert.equal(result.code, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /beauty_get_style/);
  assert.match(result.stdout, /beauty guide/);
});

test('beauty doctor reports dist, node, fonts, canvas and playwright with fixes', async () => {
  const result = await runCli(['doctor']);
  assert.equal(result.code, 0, result.stderr);
  const lower = result.stdout.toLowerCase();
  for (const token of ['dist/cli.js', 'node', 'fonts', 'canvas', 'playwright']) {
    assert.ok(lower.includes(token), `doctor is missing "${token}"`);
  }
  assert.match(result.stdout, /fix:/i, 'doctor does not print a one-line fix');
});

test('the prepare guard is a no-op when dist is already built', async () => {
  assert.ok(existsSync(cli), 'dist/cli.js is missing before the test run');
  const result = await runCli(['--prepare']);
  assert.equal(result.code, 0, result.stderr);
});

test('the dist fix message names the build command', () => {
  assert.match(distFixMessage(), /pnpm build/);
});

test('beauty page accepts a brief on stdin with --brief -', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'beauty-cli-stdin-'));
  const out = path.join(dir, 'stdin.html');
  const brief = JSON.stringify({
    title: 'Brief por stdin',
    tagline: 'Una página creada desde la entrada estándar.',
    intro: 'Texto de prueba con suficiente cuerpo para validar la página generada.',
    locale: 'es',
  });
  const result = await runCli(['page', '--style', 'nature', '--brief', '-', '--out', out], brief);
  assert.equal(result.code, 0, result.stderr);
  assert.ok(existsSync(out), 'page from stdin did not write the file');
});

test('beauty page accepts a brief file path', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'beauty-cli-file-'));
  const briefPath = path.join(dir, 'brief.json');
  const out = path.join(dir, 'from-file.html');
  writeFileSync(briefPath, JSON.stringify({ title: 'Brief desde archivo', tagline: 'Ruta de archivo.', locale: 'es' }), 'utf8');
  const result = await runCli(['page', '--style', 'nature', '--brief', briefPath, '--out', out]);
  assert.equal(result.code, 0, result.stderr);
  assert.ok(existsSync(out), 'page from a file path did not write the file');
});

test('every brief command reads its brief from a file path, and deck from stdin', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'beauty-cli-briefs-'));
  const recipes = [
    ['deck', 'nature', 'deck.json'],
    ['story', 'papercraft', 'story.json'],
    ['experience', 'galactic', 'experience.json'],
  ] as const;
  for (const [command, style, recipe] of recipes) {
    const out = path.join(dir, `${command}.html`);
    const briefPath = path.join('examples', 'recipes', style, recipe);
    const result = await runCli([command, '--style', style, '--brief', briefPath, '--out', out]);
    assert.equal(result.code, 0, `${command}: ${result.stderr}`);
    assert.ok(existsSync(out), `${command} did not read its brief from a file path`);
  }
  const stdinOut = path.join(dir, 'deck-stdin.html');
  const brief = readFileSync(path.join(root, 'examples', 'recipes', 'nature', 'deck.json'), 'utf8');
  const viaStdin = await runCli(['deck', '--style', 'nature', '--brief', '-', '--out', stdinOut], brief);
  assert.equal(viaStdin.code, 0, viaStdin.stderr);
  assert.ok(existsSync(stdinOut), 'deck did not read its brief from stdin');
});

test('beauty make accepts --idea-file', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'beauty-cli-idea-'));
  const ideaPath = path.join(dir, 'idea.txt');
  const out = path.join(dir, 'from-idea.html');
  writeFileSync(ideaPath, 'Una sala de cine que abre a medianoche.', 'utf8');
  const result = await runCli(['make', 'page', '--style', 'artdeco', '--idea-file', ideaPath, '--out', out]);
  assert.equal(result.code, 0, result.stderr);
  assert.ok(existsSync(out), 'make with --idea-file did not write the file');
});

test('help for make and sprint documents the stdin and file inputs', async () => {
  const make = await runCli(['make', '--help']);
  assert.match(make.stdout, /--idea-file/);
  const sprint = await runCli(['sprint', '--help']);
  assert.match(sprint.stdout, /--brief -/);
  assert.match(sprint.stdout, /--brief <file>/);
});

test('pnpm mcp:config prints a one-command registration for codex and claude', async () => {
  const result = await runScript('scripts/mcp-config.ts');
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /codex mcp add open-beauty/);
  assert.match(result.stdout, /claude mcp add -s user open-beauty/);
  assert.match(result.stdout, /dist[\\/]mcp[\\/]server\.js/);
  assert.match(result.stdout, /never edits your config files/);
});

test('the documented MCP snippet is exactly what pnpm mcp:config prints', async () => {
  const result = await runScript('scripts/mcp-config.ts');
  assert.equal(result.code, 0, result.stderr);
  const server = path.join(root, 'dist', 'mcp', 'server.js');
  const normalized = result.stdout
    .replaceAll(server.replaceAll('\\', '\\\\'), '<repo>/dist/mcp/server.js')
    .replaceAll(server, '<repo>/dist/mcp/server.js');
  const docs = readFileSync(path.join(root, 'docs', 'MCP.md'), 'utf8');
  for (const line of normalized.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith('open-beauty MCP server:')) continue;
    assert.ok(docs.includes(line), `docs/MCP.md is missing the printed line: ${line}`);
  }
});

test('the docs link the one-command MCP registration and the output check', () => {
  const read = (file: string) => readFileSync(path.join(root, file), 'utf8');
  const weak = read('docs/WEAK-MODELS.md');
  const mcp = read('docs/MCP.md');
  const skill = read('skills/beauty.md');
  for (const doc of [weak, mcp, skill]) {
    assert.match(doc, /pnpm mcp:config/);
    assert.match(doc, /codex mcp add open-beauty/);
    assert.match(doc, /claude mcp add -s user open-beauty/);
    assert.match(doc, /How to look at your output/i);
  }
});
