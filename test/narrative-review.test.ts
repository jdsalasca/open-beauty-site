import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { createNarrative } from '../src/narrative/create.js';
import { assessNarrativeReview, extractFeedbackFrames, getNarrativeReviewState, reviewNarrativeArtifact } from '../src/narrative/review.js';
import { rerenderNarrativePack } from '../src/narrative/rerender.js';
import { verifyNarrativeGif } from '../src/narrative/verify-gif.js';
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
  assert.equal(assessNarrativeReview({ ...base, criteria: { ...allPass, loopRestart: { verdict: 'revise' } } }).reviewState, 'revise');
  assert.equal(assessNarrativeReview(base).reviewState, 'approved');
  assert.equal(assessNarrativeReview(base).publicationRecommendation, 'consider-publication');
  assert.equal(assessNarrativeReview({ ...base, hashes, currentHashes: { ...hashes, gifSha256: 'd'.repeat(64) }, recordsExist: true }).reviewState, 'stale');
  assert.equal(assessNarrativeReview({ ...base, hashes, currentHashes: { ...hashes, pngSha256: 'd'.repeat(64) }, recordsExist: true }).reviewState, 'stale');
  assert.equal(assessNarrativeReview({ ...base, hashes, currentHashes: { ...hashes, manifestSha256: 'd'.repeat(64) }, recordsExist: true }).reviewState, 'stale');
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
    const initialManifest = JSON.parse(await readFile(created.paths.manifest, 'utf8')) as { evaluation: { automatedEvidence: { balanceByFrame: Array<{ frameIndex: number; phaseId: string; kind: string; regions: unknown[]; metrics: unknown }>; objectTransformationByFrame: Array<{ phaseId: string; kind: string }> } } };
    for (const phaseId of ['before', 'change', 'result']) {
      assert.ok(initialManifest.evaluation.automatedEvidence.balanceByFrame.some((row) => row.phaseId === phaseId && row.kind === 'hold'));
      assert.ok(initialManifest.evaluation.automatedEvidence.objectTransformationByFrame.some((row) => row.phaseId === phaseId && row.kind === 'hold'));
    }
    assert.ok(initialManifest.evaluation.automatedEvidence.balanceByFrame.some((row) => row.kind === 'loop-bridge'));
    assert.ok(initialManifest.evaluation.automatedEvidence.objectTransformationByFrame.some((row) => row.kind === 'loop-bridge'));
    assert.equal(initialManifest.evaluation.automatedEvidence.balanceByFrame.filter((row) => row.kind === 'transition').length, 2);
    assert.ok(initialManifest.evaluation.automatedEvidence.balanceByFrame.every((row) => Array.isArray(row.regions) && row.metrics !== undefined));
    const feedback = [{
      id: 'fb-corner', phaseId: 'before', frameIndex: 0,
      region: { x: 2, y: 3, w: 24, h: 18 }, problem: 'La entidad se pierde.', severity: 'major' as const,
      evidence: { frameRef: 0 }, allowedAdjustment: 'increase object size', status: 'open' as const,
    }];
    const extracted = await extractFeedbackFrames(created.paths.manifest, feedback);
    assert.equal(extracted[0]?.framePath.endsWith('frame-0000.png'), true);
    assert.equal(extracted[0]?.cropPath.endsWith('feedback-fb-corner-crop.png'), true);
    assert.deepEqual(await readFile(extracted[0]!.cropPath).then((b) => [...b.subarray(0, 8)]), [137, 80, 78, 71, 13, 10, 26, 10]);
    const independentlyDecoded = verifyNarrativeGif(await readFile(created.paths.gif), [0]);
    const expectedRgb = independentlyDecoded.sampledFrames[0]!.rgb;
    const cropImage = await loadImage(extracted[0]!.cropPath);
    const cropCanvas = createCanvas(cropImage.width, cropImage.height);
    const cropContext = cropCanvas.getContext('2d');
    cropContext.drawImage(cropImage, 0, 0);
    const actualRgba = cropContext.getImageData(0, 0, cropImage.width, cropImage.height).data;
    for (let y = 0; y < feedback[0]!.region.h; y += 1) {
      for (let x = 0; x < feedback[0]!.region.w; x += 1) {
        const source = ((feedback[0]!.region.y + y) * independentlyDecoded.width + feedback[0]!.region.x + x) * 3;
        const target = (y * feedback[0]!.region.w + x) * 4;
        assert.deepEqual([...actualRgba.subarray(target, target + 3)], [...expectedRgb.subarray(source, source + 3)]);
      }
    }

    await reviewNarrativeArtifact({ manifestPath: created.paths.manifest, reviewer: { id: 'human-1', name: 'Revisora', kind: 'human' }, criteria: allPass, qualityLevels: allLevels, feedback });
    assert.equal((await getNarrativeReviewState(created.paths.manifest)).reviewState, 'approved');
    const reviewedManifest = JSON.parse(await readFile(created.paths.manifest, 'utf8')) as { reviewState: string; publicationRecommendation: string; evaluation: { 'visual-review': { status: string } } };
    assert.equal(reviewedManifest.reviewState, 'approved');
    assert.equal(reviewedManifest.evaluation['visual-review'].status, 'approved');
    assert.equal(reviewedManifest.publicationRecommendation, 'consider-publication');
    const recordPath = created.paths.manifest.replace(/\.manifest\.json$/u, '.review.json');
    const prior = JSON.parse(await readFile(recordPath, 'utf8')) as { records: unknown[] };
    assert.equal(prior.records.length, 1);

    const originalPng = await readFile(created.paths.png);
    await writeFile(created.paths.png, Buffer.from('changed png bytes'));
    assert.equal((await getNarrativeReviewState(created.paths.manifest)).reviewState, 'stale', 'PNG hash mismatch invalidates the review');
    await writeFile(created.paths.png, originalPng);
    const originalManifestBytes = await readFile(created.paths.manifest);
    const editedManifest = JSON.parse(originalManifestBytes.toString('utf8')) as { brief: { title: string } };
    editedManifest.brief.title = 'Título de manifiesto alterado';
    await writeFile(created.paths.manifest, JSON.stringify(editedManifest));
    assert.equal((await getNarrativeReviewState(created.paths.manifest)).reviewState, 'stale', 'manifest hash mismatch invalidates the review');
    await writeFile(created.paths.manifest, originalManifestBytes);
    assert.equal((await getNarrativeReviewState(created.paths.manifest)).reviewState, 'approved');

    const rerendered = await rerenderNarrativePack(created.paths.manifest, { applyFeedback: true });
    assert.equal(rerendered.toHash, rerendered.fromHash, 'same normalized brief and seed keep the GIF byte-deterministic');
    assert.deepEqual(rerendered.feedbackFixed, [], 'identical deterministic pixels must not fix feedback');
    assert.ok(rerendered.changedRegions.every((region) => region.pixelsChanged === 0));
    assert.equal(rerendered.reviewState, 'stale', 'a new manifest render revision invalidates the old approval even when pixels are identical');
    const afterRerender = JSON.parse(await readFile(recordPath, 'utf8')) as { records: Array<{ feedback: Array<{ status: string }> }>; changes: Array<{ fromHash: string; toHash: string; renderTimeMs: number }> };
    assert.equal(afterRerender.records[0]?.feedback[0]?.status, 'open');
    assert.equal(afterRerender.changes.length, 1);
    assert.ok(afterRerender.changes[0]!.renderTimeMs >= 0);
    const renewedReview = await reviewNarrativeArtifact({
      manifestPath: created.paths.manifest,
      reviewer: { id: 'human-2', name: 'Segunda revisora', kind: 'human' },
      criteria: allPass,
      qualityLevels: allLevels,
    });
    assert.equal(renewedReview.record.feedback[0]?.id, 'fb-corner');
    assert.equal(renewedReview.record.feedback[0]?.status, 'open', 'a later review cannot silently erase unresolved feedback');
    const feedbackManifest = JSON.parse(await readFile(created.paths.manifest, 'utf8')) as { openFeedbackCount: number };
    assert.equal(feedbackManifest.openFeedbackCount, 1);

    await writeFile(created.paths.gif, Buffer.from('regenerated gif bytes'));
    assert.equal((await getNarrativeReviewState(created.paths.manifest)).reviewState, 'stale');
    assert.equal((JSON.parse(await readFile(recordPath, 'utf8')) as { records: unknown[] }).records.length, 2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
