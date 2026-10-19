import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { NarrativeTimelineFrame } from '../src/types/narrative.js';
import { normalizeNarrativeBrief } from '../src/narrative/brief.js';
import { createNarrative } from '../src/narrative/create.js';
import { getNarrativeScene, supportedNarrativeStyles } from '../src/narrative/scene.js';
import { layoutNarrative } from '../src/narrative/layout.js';
import { getNarrativeFontProfile } from '../src/narrative/fonts.js';

const STYLES = ['vaporwave', 'galactic', 'nature'] as const;
type StageCStyle = (typeof STYLES)[number];

function makeBrief(style: StageCStyle, kind = 'comparison', overrides: Record<string, unknown> = {}) {
  return normalizeNarrativeBrief({
    style,
    kind: 'narrative-gif',
    locale: 'es',
    audience: 'Producto · Sprint Review',
    title: 'Guías claras',
    status: 'in-review',
    phases: [
      { id: 'before', label: 'Antes', text: 'La guía no indica qué criterio requiere una segunda lectura.', visual: { kind, state: 'unreviewed' } },
      { id: 'change', label: 'Cambio', text: 'Una señal relaciona el criterio con la revisión pendiente.', visual: { kind, state: 'flagged' } },
      { id: 'result', label: 'Resultado esperado', text: 'El equipo puede revisar el criterio antes de cerrar la sprint.', visual: { kind, state: 'review-ready' } },
    ],
    playback: { minReadableHoldMs: 5_000, transitionMs: 650, loop: true },
    output: { width: 1280, height: 720, preset: 'review-1280x720', formats: ['gif', 'png'] },
    seed: 7,
    ...overrides,
  });
}

function seedRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function timelineFrame(phaseIndex: number, kind: NarrativeTimelineFrame['kind'] = 'hold'): NarrativeTimelineFrame {
  return {
    kind,
    phaseIndex,
    fromPhaseIndex: kind === 'hold' ? phaseIndex : Math.max(0, phaseIndex - 1),
    toPhaseIndex: phaseIndex,
    progress: kind === 'hold' ? 1 : 0.5,
    delayMs: kind === 'hold' ? 5_000 : 80,
  };
}

function render(style: StageCStyle, kind: string, phaseIndex: number, seed = 7, frameKind: NarrativeTimelineFrame['kind'] = 'hold'): Uint8ClampedArray {
  const brief = makeBrief(style, kind, { seed }).brief;
  const scene = getNarrativeScene(style);
  const layout = layoutNarrative(brief);
  const object = scene.createObject(brief, seedRandom(seed ^ 0x725a17));
  return scene.renderFrame({
    brief,
    layout,
    frame: timelineFrame(phaseIndex, frameKind),
    localTimeMs: phaseIndex * 5_000,
    phaseIndex,
    phase: brief.phases[phaseIndex]!,
    object,
    safeBoxes: { safe: layout.safeZone, text: layout.textArea, art: layout.reservedArtArea },
    fonts: getNarrativeFontProfile(style),
    rng: seedRandom(seed + phaseIndex),
  });
}

test('stage C group 2 registers its three scene renderers alongside the other stage C groups and preserves the unknown-style failure', () => {
  const registered = supportedNarrativeStyles();
  for (const style of STYLES) {
    assert.ok(registered.includes(style), `${style} is registered`);
    assert.equal(getNarrativeScene(style).style, style);
  }
  assert.throws(() => getNarrativeScene('unlisted-style' as never), (error: unknown) => (error as { code?: string }).code === 'STYLE_NOT_SUPPORTED_YET');
});

for (const style of STYLES) {
  test(`${style} owns a large landscape composition, two distinct scenes, purposeful phase motion and seeded determinism`, () => {
    const brief = makeBrief(style).brief;
    const scene = getNarrativeScene(style);
    const layout = layoutNarrative(brief);
    const footprint = layout.reservedArtArea.width * layout.reservedArtArea.height / (brief.output.width * brief.output.height);
    assert.ok(footprint >= 0.4 && footprint <= 0.55, `hero scene footprint is ${(footprint * 100).toFixed(1)}% of the frame`);
    assert.equal(scene.supportsAspect(16 / 9), true);
    assert.equal(scene.supportsAspect(1), false, 'square output is explicitly unsupported by the landscape composition');
    assert.equal(scene.supportsAspect(9 / 16), false, 'portrait output is explicitly unsupported by the landscape composition');

    const first = render(style, 'comparison', 0);
    const same = render(style, 'comparison', 0);
    const changed = render(style, 'comparison', 2);
    const transition = render(style, 'comparison', 1, 7, 'transition');
    const checklist = render(style, 'checklist', 2);
    const anotherSeed = render(style, 'comparison', 0, 8);
    assert.equal(first.length, 1280 * 720 * 4);
    assert.deepEqual(first, same, 'the same brief and seed render identical pixels');
    assert.notDeepEqual(first, changed, 'the retained object changes state during the story');
    assert.notDeepEqual(changed, transition, 'the material has an authored transition state');
    assert.notDeepEqual(changed, checklist, 'comparison and checklist have distinct compositions');
    assert.notDeepEqual(first, anotherSeed, 'seeded variation is visible and deterministic');
  });

  test(`${style} retains Spanish copy and gives an actionable overflow for an unbreakable long word`, () => {
    const copy = 'La guía reúne á, é, í, ó, ú, ü, ñ, ¿sí? ¡4% y lectura estable! El equipo conserva el mismo criterio para volver a revisarlo antes del cierre.';
    const brief = makeBrief(style, 'comparison', {
      phases: [
        { id: 'before', label: 'Antes', text: copy, visual: { kind: 'comparison', state: 'unreviewed' } },
        { id: 'change', label: 'Cambio', text: 'Una nota conduce la mirada a la misma pieza.', visual: { kind: 'comparison', state: 'flagged' } },
        { id: 'result', label: 'Resultado esperado', text: 'El equipo revisa el criterio sin atribuir métricas.', visual: { kind: 'comparison', state: 'review-ready' } },
      ],
    }).brief;
    const layout = layoutNarrative(brief);
    assert.equal(layout.phases[0]!.body.sourceText, copy);
    assert.equal(layout.phases[0]!.body.lines.join(' '), copy);
    assert.ok(layout.phases[0]!.body.size >= 36);

    const longWord = 'hiperextraordinariamenteinterdisciplinario';
    assert.throws(
      () => layoutNarrative(makeBrief(style, 'comparison', {
        phases: [
          { id: 'before', label: 'Antes', text: longWord, visual: { kind: 'comparison', state: 'unreviewed' } },
          { id: 'change', label: 'Cambio', text: 'Se conserva la misma pieza.', visual: { kind: 'comparison', state: 'flagged' } },
          { id: 'result', label: 'Resultado esperado', text: 'La lectura queda lista para revisión.', visual: { kind: 'comparison', state: 'review-ready' } },
        ],
      }).brief),
      (error: unknown) => (error as { code?: string; suggestion?: string }).code === 'TEXT_OVERFLOW' && Boolean((error as { suggestion?: string }).suggestion),
    );
  });

  test(`${style} exports deterministic GIF, PNG, contact sheet and a decoded manifest with its guide fonts`, async () => {
    const firstDir = await mkdtemp(path.join(os.tmpdir(), `narrative-${style}-stage-c-first-`));
    const secondDir = await mkdtemp(path.join(os.tmpdir(), `narrative-${style}-stage-c-second-`));
    try {
      const input = makeBrief(style).brief;
      const first = await createNarrative(input, { outputDir: firstDir });
      const second = await createNarrative(input, { outputDir: secondDir });
      for (const key of ['gif', 'png', 'contactSheet'] as const) {
        assert.deepEqual(await readFile(first.paths[key]), await readFile(second.paths[key]), `${key} is byte-deterministic for this scene`);
      }
      const manifest = JSON.parse(await readFile(first.paths.manifest, 'utf8')) as Record<string, any>;
      const expectedFonts: Record<StageCStyle, [string, string]> = {
        vaporwave: ['Press Start 2P', 'Space Grotesk'],
        galactic: ['Michroma', 'Space Grotesk'],
        nature: ['Cormorant Garamond', 'Karla'],
      };
      assert.equal(manifest.style, style);
      assert.equal(manifest.decoded.width, 1280);
      assert.equal(manifest.decoded.height, 720);
      assert.equal(manifest.decoded.durationMs, 17_190);
      assert.equal(manifest.decoded.frameCount, 33);
      assert.ok(manifest.phaseHoldsVerified.every((hold: { decodedMs: number; passed: boolean }) => hold.passed && hold.decodedMs >= 5_000));
      assert.equal(manifest.fonts.roles.display.family, expectedFonts[style][0]);
      assert.equal(manifest.fonts.roles.reading.family, expectedFonts[style][1]);
      assert.ok(manifest.bytes.gif <= 6 * 1024 * 1024);
      assert.equal(manifest.evaluation['technical-integrity'].status, 'pass');
      assert.equal(manifest.evaluation['visual-review'].status, 'pending');
      assert.equal(manifest.evaluation.publicationRecommendation, 'none');
      assert.ok(manifest.phaseCaptures.some((capture: { labels: string[] }) => capture.labels.includes('reinicio del loop')));
    } finally {
      await rm(firstDir, { recursive: true, force: true });
      await rm(secondDir, { recursive: true, force: true });
    }
  });
}
