import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createNarrative } from '../src/narrative/create.js';
import { distCliPath } from '../src/cli.js';
import type { NarrativeBriefInput } from '../src/types/narrative.js';

const brief: NarrativeBriefInput = {
  style: 'papercraft', kind: 'narrative-gif', locale: 'es', audience: 'Producto', title: 'Prueba CLI', workflowStatus: 'in-review',
  phases: [
    { id: 'before', label: 'Antes', text: 'Pendiente.', visual: { kind: 'comparison', state: 'unreviewed' } },
    { id: 'change', label: 'Cambio', text: 'Se marca.', visual: { kind: 'comparison', state: 'flagged' } },
    { id: 'result', label: 'Resultado esperado', text: 'Listo para revisar.', visual: { kind: 'comparison', state: 'review-ready' } },
  ],
  playback: { preset: 'concise', transitionMs: 100, loop: true },
  output: { preset: 'card-640x360', width: 640, height: 360, formats: ['gif', 'png'] }, seed: 42,
};

test('beauty review CLI records a complete review, extracts feedback frames, and reports the current state', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'beauty-review-cli-'));
  try {
    const pack = await createNarrative(brief, { outputDir: path.join(root, 'pack') });
    const feedbackPath = path.join(root, 'feedback.json');
    await writeFile(feedbackPath, JSON.stringify([{
      id: 'cli-frame', phaseId: 'before', frameIndex: 0, region: { x: 1, y: 1, w: 5, h: 5 },
      problem: 'El objeto es pequeño.', severity: 'minor', evidence: { frameRef: 0 },
      allowedAdjustment: 'increase object size', status: 'open',
    }]), 'utf8');
    const args = [
      distCliPath(), 'review', pack.paths.manifest, '--reviewer', 'cli-reviewer:Ada', '--feedback', feedbackPath, '--frames',
      ...['thumbnailIdentity', 'cardSizeReading', 'styleMaterial', 'phaseContinuity', 'loopRestart', 'artOnlyTransformationUnderstood'].flatMap((name) => ['--criterion', `${name}=pass`]),
      ...['technical-integrity', 'style-conformance', 'rendered-legibility', 'narrative', 'visual-review'].flatMap((name) => ['--level', `${name}=pass`]),
    ];
    const reviewed = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' });
    assert.equal(reviewed.status, 0, reviewed.stderr || reviewed.stdout);
    assert.match(reviewed.stdout, /consider-publication/);
    const stateRun = spawnSync(process.execPath, [distCliPath(), 'review-state', pack.paths.manifest], { cwd: root, encoding: 'utf8' });
    assert.equal(stateRun.status, 0, stateRun.stderr || stateRun.stdout);
    const state = JSON.parse(stateRun.stdout) as { reviewState: string };
    assert.equal(state.reviewState, 'approved');
    const frames = await readFile(pack.paths.manifest.replace(/\.manifest\.json$/u, '.frames/feedback-cli-frame-crop.png'));
    assert.equal(frames.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    const rerendered = spawnSync(process.execPath, [distCliPath(), 'rerender', pack.paths.manifest, '--apply-feedback'], { cwd: root, encoding: 'utf8' });
    assert.equal(rerendered.status, 0, rerendered.stderr || rerendered.stdout);
    const rerenderSummary = JSON.parse(rerendered.stdout) as { feedbackFixed: string[]; changedRegions: Array<{ pixelsChanged: number }>; reviewState: string };
    assert.deepEqual(rerenderSummary.feedbackFixed, []);
    assert.ok(rerenderSummary.changedRegions.every((region) => region.pixelsChanged === 0));
    assert.equal(rerenderSummary.reviewState, 'stale');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
