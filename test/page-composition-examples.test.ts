import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../src/page/index.js';
import { styleSlugs } from '../src/styles/presets.js';
import { validateHtml } from '../src/validate.js';
import type { PageBrief, StyleSlug } from '../src/types.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exampleRoot = path.join(root, 'examples', 'web', 'composition-variants');

interface CompositionExample {
  file: string;
  style: StyleSlug;
  variant: 'split' | 'stepper';
  brief: Partial<PageBrief>;
}

async function examples(): Promise<CompositionExample[]> {
  const files = (await readdir(exampleRoot)).filter((file) => file.endsWith('.json')).sort();
  return Promise.all(
    files.map(async (file) => {
      const match = /^(.+)-(split|stepper)\.json$/.exec(file);
      assert.ok(match, `unexpected composition example name: ${file}`);
      return {
        file,
        style: match[1] as StyleSlug,
        variant: match[2] as 'split' | 'stepper',
        brief: JSON.parse(await readFile(path.join(exampleRoot, file), 'utf8')) as Partial<PageBrief>,
      };
    }),
  );
}

test('composition examples cover the thirteen styles and both new variants', async () => {
  const list = await examples();
  const styles = new Set(list.map((example) => example.style));
  assert.deepEqual([...styles].sort(), [...styleSlugs].sort(), 'one example per style');
  assert.ok(list.some((example) => example.variant === 'split'), 'split examples exist');
  assert.ok(list.some((example) => example.variant === 'stepper'), 'stepper examples exist');
});

test('composition examples tell the duplicate-row story without invented claims', async () => {
  for (const example of await examples()) {
    const { brief } = example;
    assert.equal(brief.composition, example.variant, `${example.file}: composition must match the filename`);
    assert.equal(brief.locale, 'es', `${example.file}: copy must be Spanish`);
    assert.ok((brief.sections?.length ?? 0) >= 4, `${example.file}: at least four sections`);
    assert.ok(brief.sections?.some((section) => section.kind === 'explanation'), `${example.file}: explanation section`);
    assert.ok(brief.sections?.some((section) => section.kind === 'comparison'), `${example.file}: comparison section`);
    assert.ok(brief.sections?.some((section) => section.kind === 'process'), `${example.file}: process section`);

    const copy = JSON.stringify(brief).toLowerCase();
    assert.ok(copy.includes('duplicada'), `${example.file}: names the duplicated row`);
    assert.ok(copy.includes('rechaz'), `${example.file}: says the validation rejects it`);
    assert.ok(copy.includes('indicación'), `${example.file}: gives the person an instruction to correct it`);
    assert.doesNotMatch(copy, /\b(?:borrado automático|se elimina|eliminad[oa]|métricas?|porcentaje)\b/, `${example.file}: no deletion or metric claims`);

    const html = renderPage(example.style, brief);
    assert.match(html, new RegExp(`data-composition="${example.variant}"`), `${example.file}: variant rendered`);
    assert.doesNotMatch(html, /undefined|NaN|\{\{/, `${example.file}: no placeholder leak`);
    const result = validateHtml(html, example.style);
    assert.ok(
      !result.issues.some((issue) => issue.code === 'cta-no-destination'),
      `${example.file}: CTA must have a real destination`,
    );
  }
});
