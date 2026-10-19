import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createNarrative } from '../src/narrative/create.js';
import { normalizeNarrativeBrief } from '../src/narrative/brief.js';
import { verifyNarrativeGif } from '../src/narrative/verify-gif.js';
import { styleSlugs } from '../src/styles/presets.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = await mkdtemp(path.join(os.tmpdir(), 'beauty-narrative-recipes-'));
const evaluationLevels = ['technical-integrity', 'style-conformance', 'rendered-legibility', 'narrative', 'visual-review'];

try {
  for (const style of styleSlugs) {
    const recipePath = path.join(root, 'examples', 'recipes', style, 'narrative.json');
    const source = JSON.parse(await readFile(recipePath, 'utf8')) as unknown;
    const { brief } = normalizeNarrativeBrief(source);
    assert.equal(brief.style, style, `${style}: the recipe names its directory style`);
    assert.equal(brief.status, 'in-review', `${style}: review-in-progress remains honest`);
    assert.deepEqual(brief.phases.map((phase) => phase.label), ['Antes', 'Cambio', 'Resultado esperado']);

    const result = await createNarrative(brief, { outputDir: path.join(temp, style) });
    const decoded = verifyNarrativeGif(await readFile(result.paths.gif));
    const manifest = JSON.parse(await readFile(result.paths.manifest, 'utf8')) as {
      evaluation: Record<string, { status?: string }>;
      decoded: { width: number; height: number; durationMs: number; loopCount: number };
    };
    assert.equal(decoded.width, 1280, `${style}: decoded width`);
    assert.equal(decoded.height, 720, `${style}: decoded height`);
    assert.equal(decoded.loopCount, 0, `${style}: infinite loop extension`);
    assert.equal(decoded.delaysMs.filter((delay) => delay === 5_000).length, 3, `${style}: three decoded 5000ms holds`);
    assert.ok(decoded.durationMs >= 17_000 && decoded.durationMs < 18_000, `${style}: decoded duration was ${decoded.durationMs}ms`);
    assert.ok(evaluationLevels.every((level) => Object.hasOwn(manifest.evaluation, level)), `${style}: all five evaluation levels exist in the manifest`);
    assert.equal(manifest.evaluation['technical-integrity']?.status, 'pass', `${style}: technical integrity passes`);
    assert.equal(manifest.evaluation['style-conformance']?.status, 'pending', `${style}: style review remains pending`);
    assert.equal(manifest.evaluation['rendered-legibility']?.status, 'pending', `${style}: card-size reading remains pending`);
    assert.equal(manifest.evaluation.narrative?.status, 'pending', `${style}: causal review remains pending`);
    assert.equal(manifest.evaluation['visual-review']?.status, 'pending', `${style}: visual review stays pending`);
    assert.equal(manifest.decoded.width, decoded.width, `${style}: manifest records decoded width`);
    assert.equal(manifest.decoded.height, decoded.height, `${style}: manifest records decoded height`);
    assert.equal(manifest.decoded.durationMs, decoded.durationMs, `${style}: manifest records decoded duration`);
    assert.equal(manifest.decoded.loopCount, 0, `${style}: manifest records an infinite loop`);
    assert.equal((result.evaluation as { publicationRecommendation: string }).publicationRecommendation, 'none', `${style}: no automated publication approval`);
    console.log(`${style}: ${decoded.width}x${decoded.height}, ${decoded.frames.length} frames, ${decoded.durationMs}ms, loop=0, visual-review=pending`);
  }
  console.log(`Validated ${styleSlugs.length} executable narrative recipes.`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
