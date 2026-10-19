import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { makeArtifact } from '../src/make.js';
import { createBeautyServer } from '../src/mcp/server.js';
import { renderPage } from '../src/page/index.js';
import { styleSlugs } from '../src/styles/presets.js';
import type { SectionBrief } from '../src/types.js';

const SECTIONS: SectionBrief[] = [
  { kicker: '01 / Identity', title: 'Identity', body: 'Marks and a voice that survive real use.' },
  { kicker: '02 / Work', title: 'Work', body: 'Projects built from materials, type and motion.' },
  { kicker: '03 / Contact', title: 'Contact', body: 'Start a conversation with the studio.' },
];

const CLOSING = {
  title: 'Cada semilla, con fecha.',
  text: 'Una nota breve para cerrar la visita al archivo.',
  cta: { label: 'Abrir el archivo', href: '#contacto' },
};

const STYLES_WITH_CLOSING_TEXT = new Set(['renaissance', 'papercraft', 'nature']);

let dir: string;

before(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'beauty-closing-'));
});

after(async () => {
  await rm(dir, { recursive: true, force: true });
});

test('every style honours the closing brief and emits a length-aware closing fit', () => {
  for (const style of styleSlugs) {
    const html = renderPage(style, {
      title: 'Atelier Lumen',
      tagline: 'Objects that age well.',
      sections: SECTIONS,
      locale: 'es',
      closing: CLOSING,
    });
    assert.match(html, /Cada semilla, con fecha\./, `${style}: closing title missing`);
    assert.match(html, /Abrir el archivo/, `${style}: closing cta label missing`);
    assert.match(html, /#contacto/, `${style}: closing cta href missing`);
    assert.match(html, /--closing-fit:\d+px/, `${style}: closing fit is not length-aware`);
    if (STYLES_WITH_CLOSING_TEXT.has(style)) {
      assert.match(html, /Una nota breve para cerrar la visita al archivo\./, `${style}: closing text missing`);
    }
  }
});

test('the closing fit can never break a word on a 360px screen', () => {
  for (const style of styleSlugs) {
    const html = renderPage(style, {
      title: 'Atelier Lumen',
      locale: 'es',
      closing: { title: 'Extraordinariamente' },
    });
    const fit = /--closing-fit:\s*(\d+(?:\.\d+)?)px/i.exec(html)?.[1];
    const ratio = /--closing-ratio:\s*(\d+(?:\.\d+)?)/i.exec(html)?.[1];
    assert.ok(fit, `${style}: closing fit missing for a long word`);
    assert.ok(ratio, `${style}: closing ratio missing for a long word`);
    const rendered = Math.min(Number(fit), (360 * 12) / 100);
    assert.ok(
      Array.from('Extraordinariamente').length * Number(ratio) * rendered <= 360,
      `${style}: closing headline overflows 360px (${rendered}px at ratio ${ratio})`,
    );
  }
});

test('the pause control lives in normal flow and remembers reduced motion', () => {
  for (const style of styleSlugs) {
    const html = renderPage(style, { title: 'Atelier Lumen', locale: 'es' });
    assert.match(html, /class="motion-dock"/, `${style}: the pause control has no dock`);
    assert.match(html, /class="motion-toggle" type="button" aria-pressed="false"/, `${style}: pause control is not an accessible button`);
    assert.doesNotMatch(html, /\.motion-toggle\{position:fixed/, `${style}: the pause control is still pinned`);
    assert.match(html, /prefers-reduced-motion: reduce/, `${style}: reduced motion is not remembered`);
  }
});

test('make page derives a different body per card instead of repeating filler', async () => {
  for (const style of styleSlugs) {
    const output = path.join(dir, `bodies-${style}.html`);
    const result = await makeArtifact({
      kind: 'page',
      style,
      idea: 'Un archivo de semillas que espera la lluvia de octubre.',
      locale: 'es',
      output,
    });
    assert.deepEqual(result.issues, [], `${style}: ${JSON.stringify(result.issues)}`);
    const html = await readFile(result.path, 'utf8');
    const bodies = [...html.matchAll(/<article class="[^"]*(?:card|work|drawer)[^"]*"[^>]*>[\s\S]*?<p>([\s\S]*?)<\/p>/g)].map((match) =>
      match[1]!.replace(/\s+/g, ' ').trim(),
    );
    assert.ok(bodies.length >= 3, `${style}: expected at least three card bodies, got ${bodies.length}`);
    assert.equal(new Set(bodies).size, bodies.length, `${style}: duplicated card bodies`);
    const sentences = bodies.flatMap((body) => body.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.length > 12));
    assert.equal(new Set(sentences).size, sentences.length, `${style}: a filler sentence is repeated across cards`);
  }
});

test('the MCP page tool accepts and renders the closing block', async () => {
  const server = createBeautyServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'beauty-closing-test', version: '1.0.0' });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  try {
    const target = path.join(dir, 'mcp-closing.html');
    const result = (await client.callTool({
      name: 'beauty_create_page',
      arguments: {
        style: 'renaissance',
        title: 'MCP closing',
        locale: 'es',
        output: target,
        closing: { title: 'Cierre desde MCP', text: 'Texto de cierre desde el esquema.', cta: { label: 'Abrir el cierre' } },
      },
    })) as { isError?: boolean; content: Array<{ text?: string }> };
    assert.equal(result.isError ?? false, false, result.content.map((item) => item.text ?? '').join('\n'));
    const html = await readFile(target, 'utf8');
    assert.match(html, /Cierre desde MCP/);
    assert.match(html, /Texto de cierre desde el esquema\./);
    assert.match(html, /Abrir el cierre/);
  } finally {
    await client.close();
    await server.close();
  }
});
