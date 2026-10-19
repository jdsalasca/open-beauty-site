import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { NarrativeTimelineFrame } from '../src/types/narrative.js';
import { canvasFor } from '../src/canvas.js';
import { normalizeNarrativeBrief } from '../src/narrative/brief.js';
import { createNarrative, narrativeFailure } from '../src/narrative/create.js';
import { encodeNarrative } from '../src/narrative/encode.js';
import { evaluateNarrative } from '../src/narrative/evaluate.js';
import { getNarrativeFontProfile, narrativeCanvasWeight } from '../src/narrative/fonts.js';
import { layoutNarrative } from '../src/narrative/layout.js';
import { getNarrativeScene } from '../src/narrative/scene.js';
import { buildNarrativeTimeline } from '../src/narrative/timeline.js';
import { verifyNarrativeGif } from '../src/narrative/verify-gif.js';

const STYLES = ['papercraft', 'brutalist'] as const;

function brief(style: (typeof STYLES)[number], kind = 'comparison', overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const status = overrides.status === 'done' ? 'done' : 'in-review';
  return {
    style,
    subfamily: style === 'papercraft' ? 'editorial' : 'documentary',
    kind: 'narrative-gif',
    locale: 'es',
    audience: 'Producto en Sprint Review',
    title: 'Guías claras',
    status,
    phases: [
      { id: 'before', label: 'Antes', text: 'Medida sin aviso.', visual: { kind, state: 'unreviewed' } },
      { id: 'change', label: 'Cambio', text: 'Señal para revisar.', visual: { kind, state: 'flagged' } },
      { id: 'result', label: status === 'done' ? 'Resultado observado' : 'Resultado esperado', text: 'Guía lista para revisión.', visual: { kind, state: status === 'done' ? 'reviewed' : 'review-ready' } },
    ],
    playback: { minReadableHoldMs: 5_000, transitionMs: 160, loop: true },
    output: { width: 640, height: 360, preset: 'card-640x360', formats: ['gif', 'png'] },
    seed: 7,
    ...overrides,
  };
}

function rng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function holdFrame(phaseIndex: number): NarrativeTimelineFrame {
  return { kind: 'hold', phaseIndex, fromPhaseIndex: phaseIndex, toPhaseIndex: phaseIndex, progress: 1, delayMs: 5_000 };
}

function render(style: (typeof STYLES)[number], kind: string, phaseIndex: number, seed = 7, output = { width: 640, height: 360, preset: 'card-640x360', formats: ['gif', 'png'] }, subfamily?: string): Uint8ClampedArray {
  const normalized = normalizeNarrativeBrief(brief(style, kind, { seed, output, ...(subfamily ? { subfamily } : {}) })).brief;
  const scene = getNarrativeScene(style);
  const fonts = getNarrativeFontProfile(style);
  const layout = layoutNarrative(normalized);
  const object = scene.createObject(normalized, rng(seed ^ 0xa5a5a5a5));
  return scene.renderFrame({
    brief: normalized,
    layout,
    frame: holdFrame(phaseIndex),
    localTimeMs: phaseIndex * 5_000,
    phaseIndex,
    phase: normalized.phases[phaseIndex]!,
    object,
    safeBoxes: { safe: layout.safeZone, text: layout.textArea, art: layout.reservedArtArea },
    fonts,
    rng: rng(seed + phaseIndex),
  });
}

test('pilot font roles use the two requested bundled families and expose the documentary poster subfamily', () => {
  const paper = getNarrativeFontProfile('papercraft');
  assert.equal(paper.effective.display.family, 'Fraunces');
  assert.equal(paper.effective.reading.family, 'Nunito Sans');
  assert.equal(paper.effective.display.weight, 560);
  assert.equal(narrativeCanvasWeight(paper.effective.display), 400);
  const { ctx } = canvasFor(600, 120);
  ctx.font = `${narrativeCanvasWeight(paper.effective.display)} 56px "${paper.effective.display.family}"`;
  const titleMetrics = ctx.measureText('Guías claras');
  assert.ok(titleMetrics.width > 100 && titleMetrics.width < 400, 'Fraunces keeps natural glyph metrics at display size');
  assert.ok(titleMetrics.actualBoundingBoxAscent < 60, 'Fraunces display ascent remains physical pixels, not misread font units');
  const brutal = getNarrativeFontProfile('brutalist');
  assert.equal(brutal.effective.display.family, 'Archivo Black');
  assert.equal(brutal.effective.reading.family, 'Space Mono');
  assert.equal(normalizeNarrativeBrief(brief('brutalist', 'comparison', { subfamily: 'poster' })).brief.subfamily, 'poster');
});

for (const style of STYLES) {
  test(`${style} has two distinct curated compositions, persistent phase art and deterministic seeded variation`, () => {
    const first = render(style, 'comparison', 0);
    const same = render(style, 'comparison', 0);
    const changed = render(style, 'comparison', 2);
    const checklist = render(style, 'checklist', 2);
    const anotherSeed = render(style, 'comparison', 0, 8);
    assert.deepEqual(first, same, 'same brief and seed render identical phase pixels in this runtime');
    assert.notDeepEqual(first, changed, 'the same scene object changes its meaningful state between phases');
    assert.notDeepEqual(changed, checklist, 'comparison and checklist use curated composition differences');
    assert.notDeepEqual(first, anotherSeed, 'seed changes bounded editorial details');
    if (style === 'brutalist') {
      const poster = render('brutalist', 'comparison', 0, 7, undefined, 'poster');
      assert.notDeepEqual(first, poster, 'the original high-contrast poster composition remains selectable');
    }
    const scene = getNarrativeScene(style);
    assert.equal(scene.supportsAspect(16 / 9), true);
    assert.equal(scene.supportsAspect(1), true);
    assert.equal(scene.supportsAspect(9 / 16), true);
    assert.equal(scene.supportsAspect(4 / 3), false);
    const square = render(style, 'comparison', 2, 7, { width: 640, height: 640, preset: 'square-1080', formats: ['gif', 'png'] });
    const portrait = render(style, 'checklist', 2, 7, { width: 360, height: 640, preset: 'story-1080x1920', formats: ['gif', 'png'] });
    assert.equal(square.length, 640 * 640 * 4);
    assert.equal(portrait.length, 360 * 640 * 4);
  });

  test(`${style} writes a real 1280×720 review pack with independently decoded holds and honest review levels`, async () => {
    const firstDir = await mkdtemp(path.join(os.tmpdir(), `narrative-${style}-first-`));
    const secondDir = await mkdtemp(path.join(os.tmpdir(), `narrative-${style}-second-`));
    try {
      const input = brief(style, 'comparison', {
        output: { width: 1280, height: 720, preset: 'review-1280x720', formats: ['gif', 'png'] },
        title: '¿Guías · 4%? ¡Revisión!',
        phases: [
          { id: 'before', label: 'Antes', text: 'á é í ó ú ü ñ ¿sí? ¡4% pasa → revisión!', visual: { kind: 'comparison', state: 'unreviewed' } },
          { id: 'change', label: 'Cambio', text: 'La señal dirige la mirada a una ficha pendiente.', visual: { kind: 'comparison', state: 'flagged' } },
          { id: 'result', label: 'Resultado esperado', text: 'El equipo sabe qué revisar antes de cerrar.', visual: { kind: 'comparison', state: 'review-ready' } },
        ],
      });
      const baseScene = getNarrativeScene(style);
      const seenObjects = new Set<unknown>();
      const observedScene = {
        ...baseScene,
        renderFrame(context: Parameters<typeof baseScene.renderFrame>[0]) {
          seenObjects.add(context.object);
          return baseScene.renderFrame(context);
        },
      };
      const first = await createNarrative(input, { outputDir: firstDir, scene: observedScene });
      const second = await createNarrative(input, { outputDir: secondDir });
      const bytes = await readFile(first.paths.gif);
      assert.deepEqual(bytes, await readFile(second.paths.gif));
      assert.deepEqual(await readFile(first.paths.png), await readFile(second.paths.png));
      assert.deepEqual(await readFile(first.paths.contactSheet), await readFile(second.paths.contactSheet));
      assert.equal(first.evaluation['technical-integrity'].status, 'pass');
      assert.equal(first.evaluation['visual-review'].status, 'pending');
      assert.equal(first.evaluation.publicationRecommendation, 'none');
      assert.equal(seenObjects.size, 1, 'the engine passes the same paper/document object reference through all states');
      assert.equal(first.evaluation['style-conformance'].sourceStatus, 'pass');
      assert.equal(first.evaluation['rendered-legibility'].status, 'pending');
      assert.equal(first.evaluation.narrative.status, 'pending');
      const decoded = verifyNarrativeGif(bytes);
      assert.equal(decoded.width, 1280);
      assert.equal(decoded.height, 720);
      assert.ok(first.evaluation['technical-integrity'].controls.some((control) => control.name === 'phase-holds' && control.passed));
      const manifest = JSON.parse(await readFile(first.paths.manifest, 'utf8')) as Record<string, any>;
      assert.equal(manifest.subfamily, style === 'papercraft' ? 'editorial' : 'documentary');
      assert.equal(manifest.decoded.width, 1280);
      assert.equal(manifest.decoded.height, 720);
      assert.equal(manifest.evaluation['visual-review'].status, 'pending');
      assert.equal(manifest.evaluation['style-conformance'].status, 'pending');
      assert.equal(manifest.evaluation['rendered-legibility'].status, 'pending');
      assert.equal(manifest.evaluation.narrative.status, 'pending');
      assert.match(manifest.deterministicScope, /pnpm-lock\.yaml/);
      assert.match(manifest.deterministicScope, /cross-platform byte equality is not claimed/);
      assert.equal(manifest.fonts.roles.display.family, style === 'papercraft' ? 'Fraunces' : 'Archivo Black');
      assert.equal(manifest.fonts.roles.reading.family, style === 'papercraft' ? 'Nunito Sans' : 'Space Mono');
      assert.ok(manifest.phaseHoldsVerified.every((hold: { decodedMs: number; requiredMs: number; passed: boolean }) => hold.passed && hold.decodedMs >= 5_000 && hold.requiredMs >= 5_000));
      assert.ok(manifest.phaseCaptures.some((capture: { labels: string[] }) => capture.labels.includes('reinicio del loop')));

      const negativeDir = await mkdtemp(path.join(os.tmpdir(), `narrative-${style}-negative-`));
      try {
        const encoded = await encodeNarrative(first.brief, first.briefHash, layoutNarrative(first.brief), buildNarrativeTimeline(first.brief), baseScene, negativeDir);
        const baseline = evaluateNarrative({ brief: first.brief, layout: layoutNarrative(first.brief), encoded });
        assert.equal(baseline['technical-integrity'].status, 'pass');

        const identical = evaluateNarrative({ brief: first.brief, layout: layoutNarrative(first.brief), encoded: { ...encoded, uniquePixelFrames: 1 } });
        assert.equal(identical['style-conformance'].status, 'fail');
        assert.equal(identical.narrative.status, 'fail');

        const cutLayout = structuredClone(layoutNarrative(first.brief));
        cutLayout.phases[0]!.body.lines.pop();
        assert.equal(evaluateNarrative({ brief: first.brief, layout: cutLayout, encoded })['rendered-legibility'].status, 'fail');

        const missingFont = evaluateNarrative({ brief: first.brief, layout: layoutNarrative(first.brief), encoded, fontChecksPassed: false });
        assert.equal(missingFont['style-conformance'].status, 'fail');
        assert.equal(missingFont['rendered-legibility'].status, 'fail');

        const lostColor = evaluateNarrative({ brief: first.brief, layout: layoutNarrative(first.brief), encoded: { ...encoded, palette: { ...encoded.palette, meanAbsoluteChannelError: 100, maximumChannelError: 255 } } });
        assert.equal(lostColor['style-conformance'].pixelStatus, 'fail');

        let impossibleError: unknown;
        try {
          normalizeNarrativeBrief({ ...first.brief, playback: { minReadableHoldMs: 700_000, transitionMs: 160, loop: true } });
        } catch (error) {
          impossibleError = error;
        }
        assert.equal((impossibleError as { code: string }).code, 'BAD_DURATION');
        assert.equal(narrativeFailure(impossibleError).evaluation['technical-integrity'].status, 'not-evaluated');
      } finally {
        await rm(negativeDir, { recursive: true, force: true });
      }

      const longerDir = await mkdtemp(path.join(os.tmpdir(), `narrative-${style}-longer-hold-`));
      try {
        const longerInput = { ...input, playback: { minReadableHoldMs: 7_000, transitionMs: 160, loop: true } };
        const longer = await createNarrative(longerInput, { outputDir: longerDir });
        assert.notDeepEqual(await readFile(first.paths.gif), await readFile(longer.paths.gif));
        const longerManifest = JSON.parse(await readFile(longer.paths.manifest, 'utf8')) as Record<string, any>;
        assert.ok(longerManifest.phaseHoldsVerified.every((hold: { decodedMs: number; passed: boolean }) => hold.passed && hold.decodedMs >= 7_000));
        assert.ok(longerManifest.decoded.durationMs > manifest.decoded.durationMs);
      } finally {
        await rm(longerDir, { recursive: true, force: true });
      }
    } finally {
      await rm(firstDir, { recursive: true, force: true });
      await rm(secondDir, { recursive: true, force: true });
    }
  });
}
