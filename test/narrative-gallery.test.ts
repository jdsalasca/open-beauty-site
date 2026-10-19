import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createNarrativeGallery } from '../src/narrative/gallery.js';
import { distCliPath } from '../src/cli.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKS = path.join(ROOT, 'docs', 'narrative-gif');

test('gallery is self-contained, manifest-driven and starts each card from its PNG poster', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'beauty-gallery-'));
  try {
    const output = path.join(temp, 'review.html');
    const result = await createNarrativeGallery({ directory: PACKS, output, title: 'Revisión de Sprint' });
    const html = await readFile(output, 'utf8');

    // 60 committed manifests minus 4 under the excluded docs/narrative-gif/art-only directory.
    assert.equal(result.pieceCount, 56);
    assert.equal(result.styles.length, 13);
    assert.doesNotMatch(html, /art-only\/ukiyoe/u, 'standalone art-only variants are not gallery cards');
    assert.match(html, /<title>Revisión de Sprint<\/title>/);
    assert.match(html, /visual-review: pending/);
    assert.match(html, /<dialog\b/);
    assert.match(html, /prefers-reduced-motion/);
    assert.match(html, /Descargar GIF/);
    assert.match(html, /Descargar PNG/);
    assert.match(html, /Ampliar/);
    assert.doesNotMatch(html, /<script[^>]+src=/i);
    assert.doesNotMatch(html, /<link[^>]+href=/i);
    assert.doesNotMatch(html, /https?:\/\//i);
    assert.doesNotMatch(html, /src="[^"]+\.gif(?:[?#"])/i);
    for (const level of ['technical-integrity', 'style-conformance', 'rendered-legibility', 'narrative', 'visual-review']) {
      assert.ok(html.includes(level), `gallery includes ${level}`);
    }
    assert.match(html, /data-filter="papercraft"/);

    const pngLinks = [...html.matchAll(/(?:src|href)="([^"]+\.png)"/gi)].map((match) => match[1]!);
    assert.ok(pngLinks.length >= 56, 'poster and contact-sheet links are emitted for every piece');
    for (const link of pngLinks) {
      assert.ok(!path.isAbsolute(link), `asset link must be relative: ${link}`);
      assert.ok(!link.startsWith('http'), `asset link must not use the network: ${link}`);
    }
    assert.match(html, /data-gif=/);
    assert.match(html, /data-action="play"/);
    assert.match(html, /data-action="stop"/);
    assert.match(html, /640\s*[×x]\s*360/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('beauty gallery CLI generates the requested output and help documents its options', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'beauty-gallery-cli-'));
  try {
    const output = path.join(temp, 'gallery.html');
    const generated = spawnSync(process.execPath, [distCliPath(), 'gallery', PACKS, '--out', output, '--title', 'Galería de revisión'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    assert.equal(generated.status, 0, generated.stderr || generated.stdout);
    assert.match(await readFile(output, 'utf8'), /Galería de revisión/);

    const help = spawnSync(process.execPath, [distCliPath(), 'gallery', '--help'], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /beauty gallery <dir>/);
    assert.match(help.stdout, /--out/);
    assert.match(help.stdout, /--title/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
