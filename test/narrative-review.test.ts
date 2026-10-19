import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createNarrative } from '../src/narrative/create.js';
import { assessNarrativeReview, extractFeedbackFrames, getNarrativeReviewState, reviewNarrativeArtifact } from '../src/narrative/review.js';
import type { NarrativeBriefInput } from '../src/types/narrative.js';

const allPass = {
  thumbnailIdentity: { verdict: 'pass' }, cardSizeReading: { verdict: 'pass' }, styleMaterial: { verdict: 'pass' },
  phaseContinuity: { verdict: 'pass' }, loopRestart: { verdict: 'pass' }, artOnlyTransformationUnderstood: { verdict: 'pass' },
} as const;
const allLevels = {
  'technical-integrity': 'pass', 'style-conformance': 'pass', 'rendered-legibility': 'pass',
  narrative: 'pass', 'visual-review': 'pass',
} as const;

function brief(): NarrativeBriefInput {
  return {
    style: 'papercraft', kind: 'narrative-gif', locale: 'es', audience: 'Producto', title: 'Revisión',
    workflowStatus: 'in-review',
    phases: [
      { id: 'before', label: 'Antes', text: 'El registro está pendiente.', visual: { kind: 'comparison', state: 'unreviewed' } },
      { id: 'change', label: 'Cambio', text: 'Se marca para revisar.', visual: { kind: 'comparison', state: 'flagged' } },
      { id: 'result', label: 'Resultado esperado', text: 'El registro queda listo.', visual: { kind: 'comparison', state: 'review-ready' } },
    ],
    playback: { preset: 'concise', transitionMs: 100, loop: true },
    output: { preset: 'card-640x360', width: 640, height: 360, formats: ['gif', 'png'] }, seed: 18,
  };
}

test('review approval requires an independent reviewer and every visual criterion', () => {
  const hashes = { gifSha256: 'a'.repeat(64), pngSha256: 'b'.repeat(64), manifestSha256: 'c'.repeat(64) };
  const base = { hashes, generatedBy: 'agent-renderer', reviewer: { id: 'reviewer-1', name: 'A. Reviewer', kind: 'human' as const }, criteria: allPass, qualityLevels: allLevels };
  assert.equal(assessNarrativeReview({ ...base, reviewer: { ...base.reviewer, id: 'agent-renderer' }, recordsExist: true }).reviewState, 'pending');
  assert.equal(assessNarrativeReview({ ...base, criteria: { ...allPass, loopRestart: { verdict: 'not-evaluated' } } }).reviewState, 'pending');
  assert.equal(assessNarrativeReview(base).reviewState, 'approved');
  assert.equal(assessNarrativeReview({ ...base, hashes, currentHashes: { ...hashes, gifSha256: 'd'.repeat(64) }, recordsExist: true }).reviewState, 'stale');
});

test('model review never recommends publication and revise feedback stays open', () => {
  const result = assessNarrativeReview({
    hashes: { gifSha256: 'a'.repeat(64), pngSha256: 'b'.repeat(64), manifestSha256: 'c'.repeat(64) },
    generatedBy: 'renderer', reviewer: { id: 'model-1', name: 'Model reviewer', kind: 'model', model: { id: 'model-x', version: '2', criteria: 'visual matrix v1' } },
    criteria: allPass, qualityLevels: allLevels,
  });
  assert.equal(result.reviewState, 'approved');
  assert.equal(result.publicationRecommendation, 'none');
});

test('review ledger binds hashes, preserves history as stale after artifact regeneration, and extracts decoded frame crops', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'beauty-review-'));
  try {
    const output = path.join(root, 'pack');
    const created = await createNarrative(brief(), { outputDir: output });
    const feedback = [{
      id: 'fb-corner', phaseId: 'before', frameIndex: 0,
      region: { x: 2, y: 3, w: 24, h: 18 }, problem: 'La entidad se pierde.', severity: 'major' as const,
      evidence: { frameRef: 0 }, allowedAdjustment: 'increase object size', status: 'open' as const,
    }];
    const extracted = await extractFeedbackFrames(created.paths.manifest, feedback);
    assert.equal(extracted[0]?.framePath.endsWith('frame-0000.png'), true);
    assert.equal(extracted[0]?.cropPath.endsWith('feedback-fb-corner-crop.png'), true);
    assert.deepEqual(await readFile(extracted[0]!.cropPath).then((b) => [...b.subarray(0, 8)]), [137, 80, 78, 71, 13, 10, 26, 10]);

    await reviewNarrativeArtifact({ manifestPath: created.paths.manifest, reviewer: { id: 'human-1', name: 'Revisora', kind: 'human' }, criteria: allPass, qualityLevels: allLevels, feedback });
    assert.equal((await getNarrativeReviewState(created.paths.manifest)).reviewState, 'approved');
    const recordPath = created.paths.manifest.replace(/\.manifest\.json$/u, '.review.json');
    const prior = JSON.parse(await readFile(recordPath, 'utf8')) as { records: unknown[] };
    assert.equal(prior.records.length, 1);

    await writeFile(created.paths.gif, Buffer.from('regenerated gif bytes'));
    assert.equal((await getNarrativeReviewState(created.paths.manifest)).reviewState, 'stale');
    assert.equal((JSON.parse(await readFile(recordPath, 'utf8')) as { records: unknown[] }).records.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
