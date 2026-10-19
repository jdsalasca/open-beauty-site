import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { NARRATIVE_BRIEF_EXAMPLE, normalizeNarrativeBrief } from '../src/narrative/brief.js';
import { createNarrative } from '../src/narrative/create.js';
import { NarrativeError } from '../src/types/narrative.js';
import { buildNarrativeTimeline } from '../src/narrative/timeline.js';
import { verifyNarrativeGif } from '../src/narrative/verify-gif.js';

type Brief = Record<string, any>;

function fixture(): Brief {
  return JSON.parse(NARRATIVE_BRIEF_EXAMPLE) as Brief;
}

test('unknown visual state is a structured error with phase, style, value, and allowed alternatives', () => {
  const brief = fixture();
  brief.phases[1].visual.state = 'invented-state';
  assert.throws(
    () => normalizeNarrativeBrief(brief),
    (error: unknown) => {
      assert.ok(error instanceof NarrativeError);
      assert.equal(error.code, 'UNSUPPORTED_STATE');
      assert.deepEqual(error.details, {
        phaseIndex: 1,
        style: 'papercraft',
        value: 'invented-state',
        validAlternatives: ['unreviewed', 'before', 'pending', 'flagged', 'signal', 'observation', 'observacion', 'review-ready', 'reviewed', 'ready', 'done', 'verified', 'list'],
      });
      return true;
    },
  );
});

test('unknown visual kind and action are rejected before rendering', () => {
  const badKind = fixture();
  badKind.phases[0].visual.kind = 'unknown-composition';
  assert.throws(() => normalizeNarrativeBrief(badKind), (error: unknown) => (error as NarrativeError).code === 'UNSUPPORTED_VISUAL_KIND');

  const badAction = fixture();
  badAction.phases[0].visual.action = 'delete-record';
  assert.throws(() => normalizeNarrativeBrief(badAction), (error: unknown) => (error as NarrativeError).code === 'UNSUPPORTED_ACTION');
});

test('workflow completion and outcome mode are independent, and observed outcomes require evidence and scope', () => {
  const expectedAfterDone = fixture();
  expectedAfterDone.status = 'done';
  expectedAfterDone.workflowStatus = 'done';
  expectedAfterDone.outcome = { mode: 'expected' };
  const normalizedExpected = normalizeNarrativeBrief(expectedAfterDone).brief;
  assert.equal(normalizedExpected.workflowStatus, 'done');
  assert.equal(normalizedExpected.status, 'done');
  assert.equal(normalizedExpected.outcome.mode, 'expected');
  assert.equal(normalizedExpected.phases.at(-1)?.label, 'Resultado esperado');

  const observedWithoutEvidence = fixture();
  observedWithoutEvidence.outcome = { mode: 'observed', scopeNote: 'No se afirma despliegue.' };
  assert.throws(() => normalizeNarrativeBrief(observedWithoutEvidence), (error: unknown) => (error as NarrativeError).code === 'INVALID_STATE');

  const vagueScope = fixture();
  vagueScope.illustrative = false;
  vagueScope.outcome = { mode: 'observed', evidenceRefs: [{ id: 'run-8', label: 'Registro de prueba' }], scopeNote: 'El alcance cubre el flujo revisado.' };
  assert.throws(() => normalizeNarrativeBrief(vagueScope), (error: unknown) => (error as NarrativeError).field === 'outcome.scopeNote');

  const observed = fixture();
  observed.illustrative = false;
  observed.outcome = {
    mode: 'observed',
    evidenceRefs: [{ id: 'review-17', label: 'Acta de verificación' }],
    scopeNote: 'No se afirma despliegue ni impacto en usuarios.',
  };
  const normalizedObserved = normalizeNarrativeBrief(observed).brief;
  assert.equal(normalizedObserved.outcome.mode, 'observed');
  assert.equal(normalizedObserved.phases.at(-1)?.label, 'Resultado observado');
});

test('legacy done briefs without outcome migrate to expected and illustrative', () => {
  const legacy = fixture();
  legacy.status = 'done';
  delete legacy.workflowStatus;
  legacy.phases.at(-1).label = 'Resultado observado';
  legacy.phases.at(-1).visual.state = 'reviewed';
  const normalized = normalizeNarrativeBrief(legacy).brief;
  assert.equal(normalized.outcome.mode, 'expected');
  assert.equal(normalized.illustrative, true);
  assert.equal(normalized.phases.at(-1)?.label, 'Resultado esperado');
});

test('concise preset accepts five explicit 2000ms holds, repeats states, and accounts for transitions and loop bridge', () => {
  const brief = fixture();
  const first = structuredClone(brief.phases[0]);
  brief.phases = [
    { ...first, id: 'one', label: 'Antes', text: 'Corto.' },
    { ...first, id: 'two', label: 'Paso', text: 'Corto.' },
    { ...first, id: 'three', label: 'Paso', text: 'Corto.' },
    { ...first, id: 'four', label: 'Paso', text: 'Corto.' },
    { ...first, id: 'five', label: 'Resultado esperado', text: 'Corto.' },
  ].map((phase) => ({ ...phase, holdMs: 2_000, visual: { kind: 'comparison', state: 'flagged' } }));
  brief.playback = { preset: 'concise', transitionMs: 160, loop: true };
  const normalized = normalizeNarrativeBrief(brief).brief;
  const timeline = buildNarrativeTimeline(normalized);
  assert.deepEqual(timeline.holds.map((hold) => hold.encodedMs), [2_000, 2_000, 2_000, 2_000, 2_000]);
  assert.equal(timeline.frames.filter((frame) => frame.kind === 'transition').reduce((sum, frame) => sum + frame.delayMs, 0), 640);
  assert.equal(timeline.frames.filter((frame) => frame.kind === 'loop-bridge').reduce((sum, frame) => sum + frame.delayMs, 0), 160);
  assert.equal(timeline.durationMs, 11_200);
});

test('five concise 2000ms phases decode to 11200ms and manifest separates each duration source', async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'narrative-concise-v2-'));
  try {
    const brief = fixture();
    const phase = structuredClone(brief.phases[0]);
    brief.phases = Array.from({ length: 5 }, (_, index) => ({
      ...phase,
      id: `phase-${index + 1}`,
      label: `Paso ${index + 1}`,
      text: 'Cambio corto.',
      holdMs: 2_000,
      visual: { kind: 'comparison', state: 'flagged' },
    }));
    brief.playback = { preset: 'concise', transitionMs: 160, loop: true };
    const result = await createNarrative(brief, { outputDir });
    const decoded = verifyNarrativeGif(await readFile(result.paths.gif));
    const manifest = JSON.parse(await readFile(result.paths.manifest, 'utf8')) as {
      schemaVersion: number;
      ffprobe: { available: boolean; passed: boolean | null };
      timing: { holdsRequestedMs: number; holdsDecodedMs: number; transitionsMs: number; loopBridgeMs: number; entryMs: number; totalDecodedMs: number; phaseHolds: Array<{ requestedMs: number; encodedMs: number; decodedMs: number }> };
    };
    assert.equal(decoded.integrity.valid, true);
    assert.equal(decoded.durationMs, 11_200);
    assert.ok(decoded.durationMs > 10_000, 'four transitions, loop bridge and entries add 1200ms to the five holds');
    assert.equal(manifest.schemaVersion, 2);
    assert.equal(manifest.timing.holdsRequestedMs, 10_000);
    assert.equal(manifest.timing.holdsDecodedMs, 10_000);
    assert.equal(manifest.timing.transitionsMs, 640);
    assert.equal(manifest.timing.loopBridgeMs, 160);
    assert.equal(manifest.timing.entryMs, 400);
    assert.equal(manifest.timing.totalDecodedMs, 11_200);
    assert.deepEqual(manifest.timing.phaseHolds, Array.from({ length: 5 }, (_, index) => ({ phaseId: `phase-${index + 1}`, requestedMs: 2_000, encodedMs: 2_000, decodedMs: 2_000 })));
    if (manifest.ffprobe.available) assert.equal(manifest.ffprobe.passed, true, 'ffprobe independently agrees when installed');
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
});

test('duration validation keeps the readable floor and rejects invalid concise holds as BAD_DURATION', () => {
  const readable = fixture();
  readable.playback.minReadableHoldMs = 4_999;
  assert.throws(() => normalizeNarrativeBrief(readable), (error: unknown) => (error as NarrativeError).code === 'BAD_DURATION');

  const tooShort = fixture();
  tooShort.playback = { preset: 'concise', transitionMs: 160, loop: true };
  tooShort.phases[0].holdMs = 1_999;
  assert.throws(() => normalizeNarrativeBrief(tooShort), (error: unknown) => (error as NarrativeError).code === 'BAD_DURATION');

  const negative = fixture();
  negative.phases[0].holdMs = -1;
  assert.throws(() => normalizeNarrativeBrief(negative), (error: unknown) => (error as NarrativeError).code === 'BAD_DURATION');

  const notFinite = fixture();
  notFinite.playback = { preset: 'concise', transitionMs: 160, loop: true };
  notFinite.phases[0].holdMs = Number.POSITIVE_INFINITY;
  assert.throws(() => normalizeNarrativeBrief(notFinite), (error: unknown) => (error as NarrativeError).code === 'BAD_DURATION');

  const units = fixture();
  units.playback = { preset: 'concise', transitionMs: 160, loop: true };
  units.phases[0].holdMs = '2s';
  assert.throws(() => normalizeNarrativeBrief(units), (error: unknown) => (error as NarrativeError).code === 'BAD_DURATION');
});

test('badge policy accepts none and custom text, while custom requires its own label', () => {
  const none = fixture();
  none.badgePolicy = 'none';
  assert.equal(normalizeNarrativeBrief(none).brief.badgePolicy, 'none');

  const custom = fixture();
  custom.badgePolicy = 'custom';
  custom.badgeText = 'Revisión interna';
  assert.equal(normalizeNarrativeBrief(custom).brief.badgeText, 'Revisión interna');

  const missing = fixture();
  missing.badgePolicy = 'custom';
  assert.throws(() => normalizeNarrativeBrief(missing), (error: unknown) => (error as NarrativeError).code === 'INVALID_STATE');
});

test('timeline warns when label plus body exceeds three words per second or total duration budget', () => {
  const brief = fixture();
  brief.playback = { preset: 'concise', transitionMs: 160, loop: true, totalDurationBudgetMs: 5_000 };
  brief.phases[0].holdMs = 2_000;
  brief.phases[0].label = 'Antes';
  brief.phases[0].text = 'Texto de ocho palabras para medir lectura bien.';
  const timeline = buildNarrativeTimeline(normalizeNarrativeBrief(brief).brief);
  const reading = timeline.warnings.find((warning) => warning.code === 'READING_LOAD');
  assert.match(reading?.message ?? '', /9 label\+body words ÷ 2\.00s hold/);
  assert.ok(timeline.warnings.some((warning) => warning.code === 'TOTAL_DURATION_BUDGET'));
});
