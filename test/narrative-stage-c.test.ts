import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { normalizeNarrativeBrief } from '../src/narrative/brief.js';
import { createNarrative } from '../src/narrative/create.js';
import { getNarrativeFontProfile } from '../src/narrative/fonts.js';
import { layoutNarrative } from '../src/narrative/layout.js';
import { getNarrativeScene, supportedNarrativeStyles } from '../src/narrative/scene.js';
import { verifyNarrativeGif } from '../src/narrative/verify-gif.js';
import type { NarrativeTimelineFrame } from '../src/types/narrative.js';

const STYLE_FONTS = {
  ukiyoe: { display: 'Shippori Mincho B1', reading: 'Zen Kaku Gothic New' },
  bestiary: { display: 'UnifrakturMaguntia', reading: 'IM Fell English' },
  psychedelic: { display: 'Bungee Shade', reading: 'Space Grotesk' },
  memphis: { display: 'Bricolage Grotesque', reading: 'DM Sans' },
} as const;

type StageCStyle = keyof typeof STYLE_FONTS;

function brief(style: StageCStyle, composition: 'comparison' | 'checklist', width = 640, height = 360, seed = 7) {
  return {
    style,
    kind: 'narrative-gif' as const,
    locale: 'es' as const,
    audience: 'Producto en Sprint Review',
    title: 'Señal',
    status: 'in-review' as const,
    phases: [
      { id: 'before', label: 'Antes', text: 'Una medida puede quedar sin señal.', visual: { kind: composition, state: 'unreviewed' } },
      { id: 'change', label: 'Cambio', text: 'Ahora la guía marca qué revisar.', visual: { kind: composition, state: 'flagged' } },
      { id: 'result', label: 'Resultado esperado', text: 'Revisar la medida antes del cierre.', visual: { kind: composition, state: 'review-ready' } },
    ],
    playback: { minReadableHoldMs: 5_000, transitionMs: 240, loop: true },
    output: { width, height, formats: ['gif', 'png'] as const },
    seed,
  };
}

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function render(style: StageCStyle, composition: 'comparison' | 'checklist', phaseIndex: number, seed = 7): Uint8ClampedArray {
  const normalized = normalizeNarrativeBrief(brief(style, composition, 1280, 720, seed)).brief;
  const scene = getNarrativeScene(style);
  const layout = layoutNarrative(normalized);
  const object = scene.createObject(normalized, seeded(seed ^ 0xa5a5a5a5));
  const frame: NarrativeTimelineFrame = {
    kind: 'hold', phaseIndex, fromPhaseIndex: phaseIndex, toPhaseIndex: phaseIndex, progress: 1, delayMs: 5_000,
  };
  return scene.renderFrame({
    brief: normalized,
    layout,
    frame,
    localTimeMs: phaseIndex * 5_000,
    phaseIndex,
    phase: normalized.phases[phaseIndex]!,
    object,
    safeBoxes: { safe: layout.safeZone, text: layout.textArea, art: layout.reservedArtArea },
    fonts: getNarrativeFontProfile(style),
    rng: seeded(seed + phaseIndex),
  });
}

test('stage C registers only its four assigned production scenes', () => {
  const supported = supportedNarrativeStyles();
  for (const style of Object.keys(STYLE_FONTS) as StageCStyle[]) {
    assert.ok(supported.includes(style), `${style} is registered`);
    assert.equal(getNarrativeScene(style).style, style);
  }
  for (const style of ['artdeco', 'isotype', 'opart', 'vaporwave', 'galactic', 'nature'] as const) {
    assert.throws(() => getNarrativeScene(style), { code: 'STYLE_NOT_SUPPORTED_YET' });
  }
});

test('stage C copy stays in its column and wraps without shrinking below the reading minimum', () => {
  for (const style of Object.keys(STYLE_FONTS) as StageCStyle[]) {
    const normalized = normalizeNarrativeBrief(brief(style, 'comparison', 1280, 720)).brief;
    const layout = layoutNarrative(normalized);
    assert.ok(layout.textArea.x + layout.textArea.width <= 1280 * 0.48, `${style} copy ends before its artwork`);
    for (const phase of layout.phases) {
      assert.ok(phase.body.size >= 36, `${style} preserves the minimum body size`);
      assert.ok(phase.body.width <= layout.textArea.width, `${style} wraps its body inside the copy column`);
      assert.equal(phase.body.lines.join(' '), phase.body.sourceText, `${style} preserves every word`);
    }
  }
});

test('stage C preserves Spanish glyphs and reports a very long unbroken word as TEXT_OVERFLOW', () => {
  for (const style of Object.keys(STYLE_FONTS) as StageCStyle[]) {
    const input = brief(style, 'comparison', 1280, 720) as ReturnType<typeof brief> & { phases: Array<Record<string, any>> };
    input.title = '¿Señal · 4%? ¡Revisión!';
    input.phases[0]!.text = 'á é í ó ú ü ñ ¿sí? ¡4% pasa → revisión!';
    const normalized = normalizeNarrativeBrief(input).brief;
    const glyphLayout = layoutNarrative(normalized);
    assert.equal(glyphLayout.title.lines.join(' '), input.title);
    assert.equal(glyphLayout.phases[0]!.body.lines.join(' '), input.phases[0]!.text);

    input.phases[0]!.text = 'extraordinariamente' + 'x'.repeat(180);
    assert.throws(() => layoutNarrative(normalizeNarrativeBrief(input).brief), (error: unknown) => {
      assert.equal((error as { code: string }).code, 'TEXT_OVERFLOW');
      assert.match((error as { suggestion: string }).suggestion, /revise its wording|Split the phase/u);
      return true;
    }, `${style} returns guidance without truncating the word`);
  }
});

for (const style of Object.keys(STYLE_FONTS) as StageCStyle[]) {
  test(`${style} has its effective font pair, distinct compositions, persistent narrative and bounded deterministic variation`, () => {
    const fonts = getNarrativeFontProfile(style);
    assert.equal(fonts.effective.display.family, STYLE_FONTS[style].display);
    assert.equal(fonts.effective.reading.family, STYLE_FONTS[style].reading);
    const before = render(style, 'comparison', 0);
    const beforeAgain = render(style, 'comparison', 0);
    const after = render(style, 'comparison', 2);
    const checklist = render(style, 'checklist', 2);
    const otherSeed = render(style, 'comparison', 0, 8);
    assert.deepEqual(before, beforeAgain);
    assert.notDeepEqual(before, after, 'the same scene object changes a meaningful visual state');
    assert.notDeepEqual(after, checklist, 'the second curated composition has a different structure');
    assert.notDeepEqual(before, otherSeed, 'the seed changes only bounded art details');
    const scene = getNarrativeScene(style);
    assert.equal(scene.supportsAspect(16 / 9), true);
    assert.equal(scene.supportsAspect(1), true);
    assert.equal(scene.supportsAspect(9 / 16), false);
    assert.equal(scene.supportsAspect(4 / 3), false);
  });

  test(`${style} produces a decoded, manifest-backed in-review narrative without aesthetic self-approval`, async () => {
    const outputDir = await mkdtemp(path.join(os.tmpdir(), `narrative-${style}-stage-c-`));
    try {
      const result = await createNarrative(brief(style, 'comparison', 1280, 720), { outputDir });
      const decoded = verifyNarrativeGif(await readFile(result.paths.gif));
      assert.equal(decoded.width, 1280);
      assert.equal(decoded.height, 720);
      assert.equal(decoded.integrity.valid, true);
      assert.equal(result.evaluation['visual-review'].status, 'pending');
      assert.equal(result.evaluation.publicationRecommendation, 'none');
      const manifest = JSON.parse(await readFile(result.paths.manifest, 'utf8')) as Record<string, any>;
      assert.ok(manifest.phaseHoldsVerified.every((hold: { passed: boolean; decodedMs: number }) => hold.passed && hold.decodedMs >= 5_000));
      assert.equal(manifest.style, style);
      assert.equal(manifest.brief.status, 'in-review');
      assert.equal(manifest.brief.phases[2].label, 'Resultado esperado');
      assert.equal(manifest.dimensions.width, 1280);
      assert.equal(manifest.dimensions.height, 720);
      assert.equal(manifest.fonts.roles.display.family, STYLE_FONTS[style].display);
      assert.equal(manifest.fonts.roles.reading.family, STYLE_FONTS[style].reading);
      const contrast = manifest.controls.find((control: { name: string }) => control.name === 'contrast');
      assert.ok(contrast?.passed, `${style} rendered label and body colors meet contrast controls`);
      assert.equal(manifest.evaluation['visual-review'].status, 'pending');
      assert.ok(manifest.phaseCaptures.some((capture: { labels: string[] }) => capture.labels.includes('reinicio del loop')));
      for (const capture of manifest.phaseCaptures as Array<{ phaseId: string; labels: string[] }>) {
        for (const label of ['inicio', 'transición media', 'pausa', 'salida']) {
          assert.ok(capture.labels.some((value) => value.includes(label)), `${style}/${capture.phaseId ?? ''} contact includes ${label}`);
        }
      }
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });
}
