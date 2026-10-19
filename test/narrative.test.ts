import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadImage } from '@napi-rs/canvas';
import test from 'node:test';
import { checkAllNarrativeFonts, getNarrativeFontProfile, NARRATIVE_GLYPHS } from '../src/narrative/fonts.js';
import { normalizeContentSource, normalizeNarrativeBrief } from '../src/narrative/brief.js';
import { layoutNarrative } from '../src/narrative/layout.js';
import { buildNarrativeTimeline } from '../src/narrative/timeline.js';
import { createNarrative, narrativeFailure } from '../src/narrative/create.js';
import { evaluateNarrative } from '../src/narrative/evaluate.js';
import { getNarrativeScene, supportedNarrativeStyles } from '../src/narrative/scene.js';
import type { StyleSlug } from '../src/types.js';
import { decodeGif } from './support/gif-frames.js';
import { testNarrativeScene } from './support/narrative-scene.js';

function brief(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    style: 'papercraft',
    kind: 'narrative-gif',
    locale: 'es',
    audience: 'Producto',
    title: 'Guías',
    status: 'in-review',
    phases: [
      { id: 'before', label: 'Antes', text: 'Medida inesperada.', visual: { kind: 'document', state: 'unreviewed' } },
      { id: 'change', label: 'Cambio', text: 'Señal para revisar.', visual: { kind: 'document', state: 'flagged' } },
      { id: 'result', label: 'Resultado esperado', text: 'Revisión antes de publicar.', visual: { kind: 'document', state: 'review-ready' } },
    ],
    playback: { transitionMs: 160, loop: true },
    output: { preset: 'card-640x360', width: 640, height: 360, formats: ['gif', 'png'] },
    seed: 7,
    ...overrides,
  };
}

function codeFrom(fn: () => unknown, code: string): void {
  assert.throws(fn, (error: unknown) => (error as { code?: string }).code === code);
}

test('brief normalizes defaults, hashes canonically and keeps the final state honest', () => {
  const raw = brief();
  delete raw.playback;
  delete raw.output;
  const first = normalizeNarrativeBrief(raw);
  const second = normalizeNarrativeBrief({ seed: 7, phases: raw.phases, status: raw.status, title: raw.title, audience: raw.audience, locale: raw.locale, kind: raw.kind, style: raw.style });
  assert.equal(first.brief.playback.minReadableHoldMs, 5_000);
  assert.equal(first.brief.playback.transitionMs, 650);
  assert.deepEqual(first.brief.output, { preset: 'review-1280x720', formats: ['gif', 'png'], width: 1280, height: 720 });
  assert.equal(first.hash, second.hash);
  assert.equal(first.brief.phases[2]!.label, 'Resultado esperado');
  const observed = brief({ status: 'done', phases: [
    ...(raw.phases as unknown[]).slice(0, 2),
    { id: 'result', label: 'Resultado observado', text: 'Se verificó el cambio.', visual: { kind: 'document', state: 'verified' } },
  ] });
  assert.equal(normalizeNarrativeBrief(observed).brief.phases[2]!.label, 'Resultado observado');
  const englishExpected = brief({ locale: 'en', phases: [
    { id: 'before', label: 'Before', text: 'The measure arrived without a signal.', visual: { kind: 'document', state: 'unreviewed' } },
    { id: 'change', label: 'Change', text: 'A review signal is now visible.', visual: { kind: 'document', state: 'flagged' } },
    { id: 'result', label: 'Expected result', text: 'Review before release.', visual: { kind: 'document', state: 'ready' } },
  ] });
  assert.equal(normalizeNarrativeBrief(englishExpected).brief.phases[2]!.label, 'Expected result');
  const open = brief({ status: 'open' });
  assert.equal(normalizeNarrativeBrief(open).brief.phases[2]!.label, 'Resultado esperado');
});

test('brief failures use actionable typed codes and millisecond units', () => {
  const empty = brief() as Record<string, any>;
  empty.phases[1].text = '  ';
  codeFrom(() => normalizeNarrativeBrief(empty), 'EMPTY_PHASE');
  codeFrom(() => normalizeNarrativeBrief({ ...brief(), status: 'resolved' }), 'INVALID_STATE');
  const wrongDone = brief({ status: 'done' });
  codeFrom(() => normalizeNarrativeBrief(wrongDone), 'INVALID_STATE');
  codeFrom(() => normalizeNarrativeBrief(brief({ playback: { transitionMs: -10 } })), 'BAD_DURATION');
  codeFrom(() => normalizeNarrativeBrief(brief({ playback: { minReadableHoldMs: 5, transitionMs: 650, loop: true } })), 'BAD_DURATION');
  codeFrom(() => normalizeNarrativeBrief(brief({ playback: { minReadableHoldMs: Number.POSITIVE_INFINITY } })), 'NOT_FINITE');
  codeFrom(() => normalizeNarrativeBrief(brief({ playback: { minReadableHoldMs: Number.NaN } })), 'NOT_FINITE');
  codeFrom(() => normalizeNarrativeBrief(brief({ output: { width: 100, height: 56, formats: ['gif', 'png'] } })), 'IMPOSSIBLE_SIZE');
  codeFrom(() => normalizeNarrativeBrief(brief({ output: { width: 2880, height: 1620, formats: ['gif', 'png'] } })), 'RESOURCE_LIMIT');
  codeFrom(() => normalizeNarrativeBrief(brief({ output: { width: 640, height: 400, formats: ['gif', 'png'] } })), 'UNSUPPORTED_ASPECT');
  codeFrom(() => normalizeNarrativeBrief(brief({ playback: { minReadableHoldMs: 700_000, transitionMs: 650, loop: true } })), 'BAD_DURATION');
  codeFrom(() => normalizeNarrativeBrief(brief({ playback: { minReadableHoldMs: '7000ms', transitionMs: 650, loop: true } })), 'BAD_DURATION');
  codeFrom(() => normalizeNarrativeBrief(brief({ output: { width: -1280, height: 720, formats: ['gif', 'png'] } })), 'IMPOSSIBLE_SIZE');
  codeFrom(() => normalizeNarrativeBrief(brief({ output: { width: '1280px', height: 720, formats: ['gif', 'png'] } })), 'IMPOSSIBLE_SIZE');
});

test('external ContentSource adapts to the same validated contract without ticket coupling', async () => {
  const result = await normalizeContentSource({ read: async () => ({ sprintName: 'S16' }) }, (payload) => ({ ...brief(), audience: payload.sprintName }));
  assert.equal(result.brief.audience, 'S16');
  assert.match(result.hash, /^[0-9a-f]{64}$/);
});

test('layout preserves all copy and meets the review and 640x360 size thresholds', () => {
  const normalized = normalizeNarrativeBrief(brief({ output: undefined })).brief;
  const layout = layoutNarrative(normalized);
  assert.ok(layout.safeZone.x >= normalized.output.width * 0.05);
  assert.ok(layout.safeZone.y >= normalized.output.height * 0.05);
  assert.ok(layout.title.size >= 56);
  for (let index = 0; index < normalized.phases.length; index += 1) {
    const phase = normalized.phases[index]!;
    const fitted = layout.phases[index]!;
    assert.equal(fitted.body.lines.join(' '), phase.text);
    assert.equal(fitted.label.lines.join(' '), phase.label);
    assert.ok(fitted.body.size >= 36);
    assert.ok(fitted.label.size >= 24);
    assert.ok(fitted.body.effectiveCardSize >= 18);
    assert.ok(fitted.label.effectiveCardSize >= 12);
  }
  assert.equal(NARRATIVE_GLYPHS, 'áéíóúüñ¿¡0123456789%→·');
});

test('layout supports square and story ratios and rejects text it cannot fit', () => {
  for (const output of [
    { preset: 'square-1080', width: 1080, height: 1080, formats: ['gif', 'png'] },
    { preset: 'story-1080x1920', width: 1080, height: 1920, formats: ['gif', 'png'] },
  ]) {
    const normalized = normalizeNarrativeBrief(brief({ output })).brief;
    const layout = layoutNarrative(normalized);
    assert.ok(layout.phases.every((phase) => phase.body.size >= 36 && phase.body.lines.join(' ') === normalized.phases[layout.phases.indexOf(phase)]!.text));
  }
  const tooLong = brief() as Record<string, any>;
  tooLong.phases[0].text = 'medicion'.repeat(400);
  assert.throws(() => layoutNarrative(normalizeNarrativeBrief(tooLong).brief), (error: unknown) => {
    assert.equal((error as { code: string }).code, 'TEXT_OVERFLOW');
    assert.match((error as Error).message, /does not fit/);
    assert.match((error as Error & { suggestion?: string }).suggestion ?? '', /Split the phase/);
    return true;
  });
  const longText = brief() as Record<string, any>;
  longText.phases[0].text = 'La guía reúne una medida, su explicación y una recomendación de lectura para que el equipo pueda volver sobre el dato antes de dejar constancia de su revisión. '.repeat(8);
  assert.throws(() => layoutNarrative(normalizeNarrativeBrief(longText).brief), (error: unknown) => {
    assert.equal((error as { code: string }).code, 'TEXT_OVERFLOW');
    assert.match((error as Error & { suggestion?: string }).suggestion ?? '', /Split the phase/);
    return true;
  });
});

test('all 13 styles have registered role faces and rendered Spanish glyph coverage', () => {
  const checks = checkAllNarrativeFonts();
  assert.equal(checks.length, 65);
  assert.equal(new Set(checks.map((check) => check.style)).size, 13);
  assert.ok(checks.every((check) => check.glyphs === 22 && check.measured === 22 && check.renderedPixels === 22));
  const papercraft = getNarrativeFontProfile('papercraft');
  assert.equal(papercraft.effective.display.family, 'Fraunces');
  assert.equal(papercraft.effective.reading.family, 'Nunito Sans');
  assert.equal(papercraft.preferred.display.family, 'Fraunces');
});

test('timeline gives each phase a separate readable hold and transitions at 12fps or faster', () => {
  const normalized = normalizeNarrativeBrief(brief()).brief;
  const timeline = buildNarrativeTimeline(normalized);
  assert.deepEqual(timeline.holds.map((hold) => hold.encodedMs), [5_000, 5_000, 5_000]);
  assert.equal(timeline.transitionFramesPerStep, 2);
  assert.equal(timeline.frames.length, 12);
  assert.ok(timeline.frames.filter((frame) => frame.kind === 'transition' || frame.kind === 'loop-bridge').every((frame) => frame.delayMs === 80));
  assert.ok(timeline.durationMs > 15_000, 'transitions add time instead of consuming the holds');
  assert.equal(timeline.frames.filter((frame) => frame.kind === 'loop-bridge').length, 2);
  assert.deepEqual(timeline.frames.slice(0, 3).map((frame) => frame.kind), ['entry', 'hold', 'transition']);
  const longPhase = brief() as Record<string, any>;
  longPhase.output = { preset: 'review-1280x720', width: 1280, height: 720, formats: ['gif', 'png'] };
  longPhase.phases[0].text = 'uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciseis diecisiete dieciocho';
  const extended = buildNarrativeTimeline(normalizeNarrativeBrief(longPhase).brief);
  assert.equal(extended.holds[0]!.requestedMs, 5_400, 'longer copy extends the hold in milliseconds');
  assert.equal(extended.holds[0]!.encodedMs, 5_400);
  const requested650ms = buildNarrativeTimeline(normalizeNarrativeBrief(brief({ playback: { minReadableHoldMs: 5_000, transitionMs: 650, loop: true } })).brief);
  for (const phaseIndex of [1, 2, 0]) {
    const kind = phaseIndex === 0 ? 'loop-bridge' : 'transition';
    const phaseFrames = requested650ms.frames.filter((frame) => frame.kind === kind && frame.toPhaseIndex === phaseIndex);
    assert.equal(phaseFrames.reduce((sum, frame) => sum + frame.delayMs, 0), 650);
    assert.ok(phaseFrames.every((frame) => frame.delayMs <= 80));
  }
  codeFrom(() => buildNarrativeTimeline(normalizeNarrativeBrief(brief({ phases: [...(brief().phases as unknown[]), ...(brief().phases as unknown[])] })).brief), 'INVALID_STATE');
  codeFrom(() => buildNarrativeTimeline(normalizeNarrativeBrief(brief({ playback: { minReadableHoldMs: 5_000, transitionMs: 120_000, loop: true } })).brief), 'TOO_MANY_FRAMES');
  const pixelLimited = normalizeNarrativeBrief(brief({
    output: { preset: 'review-1280x720', width: 2500, height: 1406, formats: ['gif', 'png'] },
    playback: { minReadableHoldMs: 5_000, transitionMs: 650, loop: true },
  })).brief;
  codeFrom(() => buildNarrativeTimeline(pixelLimited), 'RESOURCE_LIMIT');
  const sourcePhases = brief().phases as unknown[];
  const memoryLimited = normalizeNarrativeBrief(brief({
    phases: [
      ...sourcePhases,
      { id: 'detail', label: 'Detalle', text: 'Sigue el cambio.', visual: { kind: 'document', state: 'detail' } },
      { id: 'close', label: 'Resultado esperado', text: 'Pendiente de verificar.', visual: { kind: 'document', state: 'pending' } },
    ],
    output: { preset: 'square-1080', width: 2048, height: 2048, formats: ['gif', 'png'] },
    playback: { minReadableHoldMs: 5_000, transitionMs: 10, loop: true },
  })).brief;
  assert.throws(() => buildNarrativeTimeline(memoryLimited), (error: unknown) => {
    assert.equal((error as { code: string }).code, 'RESOURCE_LIMIT');
    assert.match((error as Error).message, /memory budget/);
    return true;
  });
});

test('test-only scene creates GIF, static PNG, contact sheet, manifest and decoded holds deterministically', async () => {
  const firstDir = await mkdtemp(path.join(os.tmpdir(), 'narrative-first-'));
  const secondDir = await mkdtemp(path.join(os.tmpdir(), 'narrative-second-'));
  try {
    const first = await createNarrative(brief(), { outputDir: firstDir, scene: testNarrativeScene });
    const second = await createNarrative(brief(), { outputDir: secondDir, scene: testNarrativeScene });
    assert.equal(first.ok, true);
    assert.equal(first.frames, 12);
    const firstGif = await readFile(first.paths.gif);
    const secondGif = await readFile(second.paths.gif);
    assert.deepEqual(firstGif, secondGif, 'same brief, seed and runtime produce identical GIF bytes');
    assert.deepEqual(await readFile(first.paths.png), await readFile(second.paths.png), 'same brief and seed produce identical poster PNG bytes');
    assert.deepEqual(await readFile(first.paths.contactSheet), await readFile(second.paths.contactSheet), 'same brief and seed produce identical contact sheet bytes');
    assert.equal(first.evaluation['technical-integrity'].status, 'pass');
    assert.equal(first.evaluation['technical-integrity'].controls.find((control) => control.name === 'ffprobe-crosscheck')?.passed, true);
    assert.equal(first.evaluation['visual-review'].status, 'pending');
    assert.equal(first.evaluation.publicationRecommendation, 'none');
    assert.ok(first.evaluation['style-conformance'].status !== 'pass', 'pixel format checks never simulate a style review');
    assert.ok(first.paths.gif && first.paths.png && first.paths.contactSheet && first.paths.manifest);
    assert.ok((await readFile(first.paths.gif)).subarray(0, 6).toString('ascii') === 'GIF89a');
    const png = await loadImage(first.paths.png);
    const contact = await loadImage(first.paths.contactSheet);
    assert.equal(png.width, 640);
    assert.equal(png.height, 360);
    assert.ok(contact.width >= 640 && contact.height > 0);
    const independentlyDecoded = decodeGif(firstGif);
    assert.equal(independentlyDecoded.frames.length, 12);
    assert.equal(independentlyDecoded.delays.filter((delay) => delay >= 500).length, 3);
    const art = layoutNarrative(normalizeNarrativeBrief(brief()).brief).reservedArtArea;
    const hold = independentlyDecoded.frames[1]!;
    const alphaCompositeTarget = [207, 137, 122]; // #AF3F2F99 composited over the paper #FFF8EA
    let foundAlphaComposite = false;
    for (let y = Math.floor(art.y); y < art.y + art.height && !foundAlphaComposite; y += 1) {
      for (let x = Math.floor(art.x); x < art.x + art.width; x += 1) {
        const offset = (y * independentlyDecoded.width + x) * 3;
        const pixel = [hold.rgb[offset]!, hold.rgb[offset + 1]!, hold.rgb[offset + 2]!];
        if (pixel.every((channel, index) => Math.abs(channel - alphaCompositeTarget[index]!) <= 24)) {
          foundAlphaComposite = true;
          break;
        }
      }
    }
    assert.ok(foundAlphaComposite, 'decoded GIF contains the real semi-transparent stamp composite over paper');
    assert.equal(first.evaluation['technical-integrity'].controls.find((control) => control.name === 'loop')?.passed, true);
    const manifest = JSON.parse(await readFile(first.paths.manifest, 'utf8')) as Record<string, any>;
    assert.equal(manifest.briefSha256, first.briefHash);
    assert.equal(manifest.decoded.durationMs, first.durationMs);
    assert.equal(manifest.phaseHoldsVerified.length, 3);
    assert.ok(manifest.resourceEstimate.memoryBytes <= manifest.resourceEstimate.maxMemoryBytes);
    assert.equal(manifest.phaseCaptures.length, 3);
    for (const capture of manifest.phaseCaptures) {
      assert.ok(capture.labels.some((label) => label.endsWith('· inicio')));
      assert.ok(capture.labels.some((label) => label.endsWith('· pausa')));
      assert.ok(capture.labels.some((label) => label.endsWith('· salida')));
    }
    assert.ok(manifest.phaseCaptures.some((capture) => capture.labels.includes('reinicio del loop')));
    assert.equal(typeof manifest.ffprobe.available, 'boolean');
    assert.notEqual(manifest.ffprobe.passed, false);
    assert.match(manifest.hashes.gifSha256, /^[0-9a-f]{64}$/);
  } finally {
    await rm(firstDir, { recursive: true, force: true });
    await rm(secondDir, { recursive: true, force: true });
  }
});

test('negative controls cannot pass on file format alone', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'narrative-negative-'));
  try {
    const input = normalizeNarrativeBrief(brief());
    const layout = layoutNarrative(input.brief);
    // Read just enough internal evidence for the independent evaluator contract.
    const createModule = await import('../src/narrative/encode.js');
    const timeline = buildNarrativeTimeline(input.brief);
    const { encodeNarrative } = createModule;
    const encoded = await encodeNarrative(input.brief, input.hash, layout, timeline, testNarrativeScene, directory);
    const identical = evaluateNarrative({ brief: input.brief, layout, encoded: { ...encoded, uniquePixelFrames: 1 } });
    assert.equal(identical['style-conformance'].status, 'fail');
    assert.equal(identical.narrative.status, 'fail');

    const cutLayout = structuredClone(layout);
    cutLayout.phases[0]!.body.lines.pop();
    const cutText = evaluateNarrative({ brief: input.brief, layout: cutLayout, encoded });
    assert.equal(cutText['rendered-legibility'].status, 'fail');

    const missingFont = evaluateNarrative({ brief: input.brief, layout, encoded, fontChecksPassed: false });
    assert.equal(missingFont['style-conformance'].status, 'fail');
    assert.equal(missingFont['rendered-legibility'].status, 'fail');

    const lostColor = evaluateNarrative({ brief: input.brief, layout, encoded: { ...encoded, palette: { ...encoded.palette, meanAbsoluteChannelError: 100, maximumChannelError: 255 } } });
    assert.equal(lostColor['style-conformance'].pixelStatus, 'fail');
    let durationError: unknown;
    try {
      normalizeNarrativeBrief(brief({ playback: { minReadableHoldMs: 700_000, transitionMs: 650, loop: true } }));
    } catch (error) {
      durationError = error;
    }
    assert.equal((durationError as { code: string }).code, 'BAD_DURATION');
    const incompatible = narrativeFailure(durationError);
    assert.equal(incompatible.evaluation.publicationRecommendation, 'none');
    assert.equal(incompatible.ok, false);
    assert.equal(incompatible.evaluation['technical-integrity'].status, 'not-evaluated');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('registered renderers are supported and the registry preserves an explicit unknown-style failure', () => {
  const registered = supportedNarrativeStyles();
  for (const style of ['artdeco', 'brutalist', 'galactic', 'isotype', 'nature', 'opart', 'papercraft', 'renaissance', 'vaporwave'] as const) assert.ok(registered.includes(style));
  assert.throws(() => getNarrativeScene('unlisted-style' as StyleSlug), (error: unknown) => {
    assert.equal((error as { code: string }).code, 'STYLE_NOT_SUPPORTED_YET');
    assert.match((error as Error).message, /Supported styles:/);
    return true;
  });
});
