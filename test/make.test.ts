import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { makeArtifact } from '../src/make.js';
import { styleSlugs } from '../src/styles/presets.js';
import type { Locale } from '../src/types.js';
import type { MakeKind } from '../src/types/make.js';
import { assertDocumentContract } from './support/html-contract.js';

const run = promisify(execFile);
const root = process.cwd();
const KINDS: MakeKind[] = ['page', 'deck', 'gif', 'story', 'experience', 'motion'];
const EXTENSIONS: Record<MakeKind, string> = {
  page: 'html',
  deck: 'html',
  gif: 'gif',
  story: 'html',
  experience: 'html',
  motion: 'svg',
};
const IDEAS: Record<Locale, string> = {
  es: 'Una panadería de barrio que hornea pan de masa madre al amanecer.',
  en: 'A neighborhood bakery that bakes sourdough at dawn.',
};

let dir: string;

before(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'beauty-make-'));
});

after(async () => {
  await rm(dir, { recursive: true, force: true });
});

for (const kind of KINDS) {
  test(`make ${kind} works in all thirteen styles`, async () => {
    for (const style of styleSlugs) {
      const locale: Locale = (style.length + kind.length) % 2 === 0 ? 'es' : 'en';
      const output = path.join(dir, 'matrix', `${kind}-${style}.${EXTENSIONS[kind]}`);
      const result = await makeArtifact({ kind, style, idea: IDEAS[locale], locale, output });

      assert.equal(result.kind, kind, `${kind}/${style}: wrong kind`);
      assert.equal(result.style, style, `${kind}/${style}: wrong style`);
      assert.equal(result.locale, locale, `${kind}/${style}: wrong locale`);
      assert.ok(existsSync(result.path), `${kind}/${style}: missing output file`);
      assert.ok(result.score >= 90, `${kind}/${style}: scored ${result.score} (${JSON.stringify(result.issues)})`);
      assert.equal(result.grade, 'A', `${kind}/${style}: grade ${result.grade}`);
      assert.deepEqual(result.issues, [], `${kind}/${style}: issues ${JSON.stringify(result.issues)}`);
      assert.ok(result.next_step.length > 0, `${kind}/${style}: empty next_step`);
      assert.ok(!result.next_step.includes('\n'), `${kind}/${style}: next_step spans lines`);
      assert.ok(result.next_step.trim().endsWith('.'), `${kind}/${style}: next_step is not a sentence`);

      const bytes = await readFile(result.path);
      const text = bytes.toString('utf8');
      if (kind === 'gif') {
        assert.equal(bytes.subarray(0, 6).toString('ascii'), 'GIF89a', `${kind}/${style}: not a GIF`);
      } else if (kind === 'motion') {
        assert.match(text, /^<svg\b/, `${kind}/${style}: not an SVG`);
        assert.match(text, /prefers-reduced-motion/, `${kind}/${style}: missing reduced motion`);
      } else {
        assertDocumentContract(text, { label: `${kind}/${style}`, locale });
      }
    }
  });
}

test('both locales are complete for every style', async () => {
  for (const style of styleSlugs) {
    for (const locale of ['es', 'en'] as const) {
      const output = path.join(dir, 'locales', `${style}-${locale}.html`);
      const result = await makeArtifact({ kind: 'page', style, idea: IDEAS[locale], locale, output });
      assert.equal(result.locale, locale, `${style}/${locale}: wrong locale`);
      assert.deepEqual(result.issues, [], `${style}/${locale}: ${JSON.stringify(result.issues)}`);
      const html = await readFile(result.path, 'utf8');
      assertDocumentContract(html, { label: `page/${style}/${locale}`, locale });
    }
  }
});

test('the same input produces byte-identical files', async () => {
  for (const kind of KINDS) {
    const output = path.join(dir, 'determinism', `same-${kind}.${EXTENSIONS[kind]}`);
    const input = { kind, style: 'nature' as const, idea: 'Una hoja prensada que guarda la lluvia de octubre.', locale: 'es' as const, output };
    await makeArtifact(input);
    const first = await readFile(output);
    await makeArtifact(input);
    const second = await readFile(output);
    assert.deepEqual(second, first, `${kind}: output is not deterministic`);
  }
});

test('an empty idea fails with a helpful example', async () => {
  await assert.rejects(
    makeArtifact({ kind: 'page', style: 'renaissance', idea: '   ' }),
    (error: Error) => /idea/i.test(error.message) && /--idea/i.test(error.message) && /for example/i.test(error.message),
  );
});

test('a very long idea is truncated without losing the request', async () => {
  const idea = 'memoria '.repeat(500);
  const output = path.join(dir, 'long.html');
  const result = await makeArtifact({ kind: 'page', style: 'renaissance', idea, locale: 'es', output });
  assert.deepEqual(result.issues, []);
  const html = await readFile(result.path, 'utf8');
  assert.ok(html.length < 400_000, `long idea produced ${html.length} bytes`);
  assert.ok(!html.includes(idea), 'the raw 4000-character idea leaked into the page');
  assert.match(html, /memoria/);
});

test('unicode and RTL survive escaping; emoji are stripped so the page stays clean', async () => {
  const idea = 'مقهى صغير ✨ abre al amanecer 🌅';
  const output = path.join(dir, 'unicode.html');
  const result = await makeArtifact({ kind: 'page', style: 'nature', idea, locale: 'en', output });
  assert.deepEqual(result.issues, []);
  const html = await readFile(result.path, 'utf8');
  assert.ok(html.includes('مقهى'), 'RTL text was lost');
  assert.ok(!html.includes('✨') && !html.includes('🌅'), 'emoji leaked into the copy');
  assert.ok(html.includes('lang="en"'), 'locale was lost');
});

test('hostile HTML is escaped, never executed', async () => {
  const idea = 'A <script>alert(1)</script> & "quotes"';
  const output = path.join(dir, 'hostile.html');
  const result = await makeArtifact({ kind: 'page', style: 'brutalist', idea, locale: 'en', output });
  assert.deepEqual(result.issues, []);
  const html = await readFile(result.path, 'utf8');
  assert.ok(!html.includes('<script>alert(1)</script>'), 'raw script leaked');
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'payload was not escaped');
  assert.ok(!/<img\s+src=x\s+onerror/i.test(html), 'event handler leaked');
});

test('the CLI exposes beauty make', async () => {
  const output = path.join(dir, 'cli.html');
  const { stdout } = await run(process.execPath, [path.join(root, 'dist', 'cli.js'), 'make', 'page', '--style', 'artdeco', '--idea', 'Una sala de cine que abre a medianoche.', '--locale', 'es', '--out', output]);
  assert.match(stdout, /A · 100\/100|A \(100\/100\)|100\/100/);
  assert.ok(existsSync(output), 'CLI did not write the file');
  const missing = await run(process.execPath, [path.join(root, 'dist', 'cli.js'), 'make', 'page', '--style', 'artdeco']).then(
    () => null,
    (error: { stderr?: string; code?: number }) => error,
  );
  assert.ok(missing, 'CLI accepted an empty idea');
  assert.match(missing?.stderr ?? '', /example/i);
});
