import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { styleSlugs } from '../src/styles/presets.js';
import { normalizeNarrativeBrief } from '../src/narrative/brief.js';
import { createNarrative } from '../src/narrative/create.js';
import { verifyNarrativeGif } from '../src/narrative/verify-gif.js';

const ROOT = process.cwd();

test('all narrative recipes normalize and preserve their observed-versus-expected wording', async () => {
  for (const style of styleSlugs) {
    const file = path.join(ROOT, 'examples', 'recipes', style, 'narrative.json');
    const source = JSON.parse(await readFile(file, 'utf8')) as unknown;
    const { brief } = normalizeNarrativeBrief(source);
    assert.equal(brief.style, style);
    assert.equal(brief.status, 'in-review');
    assert.deepEqual(brief.phases.map((phase) => phase.label), ['Antes', 'Cambio', 'Resultado esperado']);
    assert.equal(brief.playback.minReadableHoldMs, 5_000);
    assert.deepEqual([brief.output.width, brief.output.height], [1280, 720]);
  }
});

test('one narrative recipe renders the decoded 1280x720 review pack with three readable holds', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'beauty-narrative-recipe-'));
  try {
    const recipe = JSON.parse(await readFile(path.join(ROOT, 'examples', 'recipes', 'papercraft', 'narrative.json'), 'utf8')) as unknown;
    const result = await createNarrative(recipe, { outputDir: temp });
    const decoded = verifyNarrativeGif(await readFile(result.paths.gif));
    assert.equal(decoded.width, 1280);
    assert.equal(decoded.height, 720);
    assert.equal(decoded.loopCount, 0);
    assert.ok(decoded.durationMs >= 17_000 && decoded.durationMs < 18_000, `duration was ${decoded.durationMs}ms`);
    assert.equal(decoded.delaysMs.filter((delay) => delay >= 5_000).length, 3);
    assert.equal(result.evaluation['visual-review'].status, 'pending');
    assert.equal(result.evaluation.publicationRecommendation, 'none');
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
