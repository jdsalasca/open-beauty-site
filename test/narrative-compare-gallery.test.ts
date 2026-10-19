import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createNarrativeCompareGallery } from '../src/narrative/gallery.js';
import { validateHtml } from '../src/validate.js';

test('comparison gallery keeps both sides static, exposes review evidence, and supports mobile and reduced motion', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'beauty-compare-gallery-'));
  try {
    const compareDir = path.join(temp, 'compare');
    await mkdir(path.join(compareDir, 'papercraft', 'comparison', 'after'), { recursive: true });
    await writeFile(path.join(compareDir, 'index.json'), JSON.stringify({
      schemaVersion: 1,
      pairs: [{
        style: 'papercraft', composition: 'comparison', seed: 7, briefSha256: 'abc123', title: 'Filas duplicadas',
        before: { assets: { gif: 'papercraft/comparison/before/before.gif', png: 'papercraft/comparison/before/before.png' }, metrics: { gifBytes: 120, frames: 8, durationMs: 4000, phaseHolds: [{ phaseId: 'before', decodedMs: 2000 }], renderMs: null }, evaluation: { narrative: 'pending', 'visual-review': 'pending' }, balance: 'pending', transformations: [], objectRegionDiff: 'pending' },
        after: { assets: { gif: 'papercraft/comparison/after/after.gif', png: 'papercraft/comparison/after/after.png' }, metrics: { gifBytes: 100, frames: 9, durationMs: 4500, phaseHolds: [{ phaseId: 'before', decodedMs: 2100 }], renderMs: 42 }, evaluation: { narrative: 'pass', 'visual-review': 'pending' }, balance: 'pass', transformations: ['decoded object diff 12%'], objectRegionDiff: 'decoded object diff 12%' },
        openFeedback: [{ problem: 'La fila repetida no se reconoce', phaseId: 'before', frameIndex: 0, framePath: 'papercraft/comparison/after/frame-000.png' }],
      }],
      semanticFixtures: [{ style: 'papercraft', composition: 'table-rows', seed: 7, title: 'Filas duplicadas', narrative: { gif: 'semantic/narrative.gif', png: 'semantic/narrative.png' }, artOnly: { gif: 'semantic/art.gif', png: 'semantic/art.png' }, reviewState: 'pending', evaluation: { narrative: 'pass', 'visual-review': 'pending' } }],
    }), 'utf8');

    const output = path.join(temp, 'COMPARE.html');
    await createNarrativeCompareGallery({ directory: compareDir, output });
    const html = await readFile(output, 'utf8');
    assert.match(html, /Antes/);
    assert.match(html, /Después/);
    assert.match(html, /Filas duplicadas/);
    assert.match(html, /data-poster=.*before\.png/s);
    assert.match(html, /data-gif=.*before\.gif/s);
    assert.match(html, /GIF estático hasta pedir reproducción/i);
    assert.match(html, /state--pending|Revisión visual: <strong>pending/i);
    assert.match(html, /frame-000\.png/);
    assert.match(html, /Art-only|Solo arte/i);
    assert.match(html, /640 × 360/);
    assert.match(html, /<dialog/);
    assert.match(html, /prefers-reduced-motion/);
    assert.match(html, /data-action="play"/);
    assert.doesNotMatch(html, /https?:\/\//);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('generated comparison gallery meets papercraft A100 and all four visual heuristics', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'beauty-compare-score-'));
  try {
    const output = path.join(temp, 'COMPARE.html');
    await createNarrativeCompareGallery({
      directory: path.join(process.cwd(), 'docs', 'narrative-gif', 'compare'),
      output,
      title: 'Issue 7 · Galería comparativa',
    });
    const html = await readFile(output, 'utf8');
    const result = validateHtml(html, 'papercraft');
    assert.equal(result.grade, 'A');
    assert.equal(result.score, 100);
    assert.deepEqual(result.issues, []);
    assert.equal(result.vision.score, 4);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
