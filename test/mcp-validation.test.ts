import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createBeautyServer } from '../src/mcp/server.js';

let client: Client;
let server: McpServer;

before(async () => {
  server = createBeautyServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: 'beauty-validation-test', version: '1.0.0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
});

after(async () => {
  await client.close();
  await server.close();
});

interface ToolCallResult {
  isError?: boolean;
  content: Array<{ type: string; text?: string }>;
}

async function callTool(name: string, args: Record<string, unknown>): Promise<{ isError: boolean; text: string }> {
  const result = (await client.callTool({ name, arguments: args })) as ToolCallResult;
  return { isError: result.isError === true, text: result.content.map((item) => item.text ?? '').join('\n') };
}

const pageSlides = [{ layout: 'statement', title: 'One idea', body: 'The rest is noise.' }];

test('missing required arguments return a clear validation error', async () => {
  const page = await callTool('beauty_create_page', {});
  assert.equal(page.isError, true);
  assert.match(page.text, /Input validation error/);

  const titleMissing = await callTool('beauty_create_page', { style: 'renaissance' });
  assert.equal(titleMissing.isError, true);
  assert.match(titleMissing.text, /Input validation error/);
  assert.match(titleMissing.text, /title/);

  const deck = await callTool('beauty_create_deck', { style: 'nature', title: 'No slides' });
  assert.equal(deck.isError, true);
  assert.match(deck.text, /slides/);

  const gif = await callTool('beauty_create_gif', { style: 'brutalist' });
  assert.equal(gif.isError, true);
  assert.match(gif.text, /text/);
});

test('malformed argument types and ranges return field-level errors', async () => {
  const cases: Array<[string, Record<string, unknown>, RegExp]> = [
    ['beauty_create_page', { style: 'not-a-style', title: 'X' }, /renaissance/],
    ['beauty_create_page', { style: 'renaissance', title: '' }, /title/],
    ['beauty_create_page', { style: 'renaissance', title: 'x'.repeat(200) }, /title/],
    ['beauty_create_page', { style: 'renaissance', title: 'X', seed: 'soon' }, /seed/],
    ['beauty_create_gif', { style: 'brutalist', text: 'X', fps: 2 }, /fps/],
    ['beauty_create_gif', { style: 'brutalist', text: 'X', template: 'kaleidoscope' }, /template/],
    ['beauty_create_experience', { style: 'nature', title: 'X', rooms: [{ title: 'Only one' }] }, /rooms/],
    ['beauty_create_story', { style: 'nature', title: 'X', chapters: [{ title: 'One', body: 'Body' }] }, /chapters/],
    ['beauty_create_deck', { style: 'nature', title: 'X', slides: [] }, /slides/],
    ['beauty_create_sprint', { style: 'nature', sprint: 'x'.repeat(80) }, /sprint/],
  ];
  for (const [name, args, expected] of cases) {
    const result = await callTool(name, args);
    assert.equal(result.isError, true, `${name}: expected a validation error for ${JSON.stringify(args)}`);
    assert.match(result.text, /Input validation error/, `${name}: error is not a validation error`);
    assert.match(result.text, expected, `${name}: error does not mention the offending field`);
  }
});

test('runtime failures return a clear message instead of crashing the server', async () => {
  const deck = await callTool('beauty_create_deck', {
    style: 'nature',
    title: 'Unknown subfamily',
    slides: pageSlides,
    subfamily: 'does-not-exist',
  });
  assert.equal(deck.isError, true);
  assert.match(deck.text, /^Deck failed: Unknown subfamily/);
  assert.match(deck.text, /herbarium/);

  const validate = await callTool('beauty_validate', { style: 'nature' });
  assert.equal(validate.isError, true);
  assert.match(validate.text, /Pass either path or html/);
});

test('beauty_fix applies safe repairs and reports before/after scores', async () => {
  const broken = '<!doctype html><html><head><style>body{font-family:\'Inter\',sans-serif;background:#123456}</style></head><body><h2>Hello</h2><img src="x.png"></body></html>';
  const result = await callTool('beauty_fix', { style: 'papercraft', html: broken });
  assert.equal(result.isError, false);
  assert.match(result.text, /score: \d+ \(\w\) → \d+ \(\w\)/);
  assert.match(result.text, /repairs: \d+/);
  assert.match(result.text, /normalize-headings/);
  assert.match(result.text, /add-alt/);
  assert.match(result.text, /replace-hex/);

  const withHtml = await callTool('beauty_fix', { style: 'papercraft', html: broken, include_html: true });
  assert.equal(withHtml.isError, false);
  assert.match(withHtml.text, /--- HTML ---/);
  assert.match(withHtml.text, /<h1>Hello<\/h1>/);
  assert.match(withHtml.text, /alt=""/);

  const missing = await callTool('beauty_fix', { style: 'papercraft' });
  assert.equal(missing.isError, true);
  assert.match(missing.text, /Pass either path or html/);
});

test('the server keeps answering valid calls after invalid ones', async () => {
  await callTool('beauty_create_page', { style: 'nope' });
  const result = await callTool('beauty_list_styles', {});
  assert.equal(result.isError, false);
  assert.match(result.text, /Renaissance/);
  const style = await callTool('beauty_get_style', { style: 'papercraft' });
  assert.equal(style.isError, false);
  assert.match(style.text, /Fraunces/);
});
