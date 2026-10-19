import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { NarrativeBriefInput, NarrativeTimelineFrame, NormalizedNarrativeBrief } from '../src/types/narrative.js';
import { normalizeNarrativeBrief } from '../src/narrative/brief.js';
import { createNarrative } from '../src/narrative/create.js';
import { getNarrativeFontProfile } from '../src/narrative/fonts.js';
import { layoutNarrative } from '../src/narrative/layout.js';
import { getNarrativeScene, supportedNarrativeStyles } from '../src/narrative/scene.js';

const STYLES = ['renaissance', 'artdeco', 'isotype', 'opart'] as const;

function brief(style: (typeof STYLES)[number], kind = 'comparison', output = { width: 1280, height: 720, preset: 'review-1280x720' }): NarrativeBriefInput {
  return {
    style,
    kind: 'narrative-gif',
    locale: 'es',
    audience: 'Producto en Sprint Review',
    title: 'Lectura de cambios',
    status: 'in-review',
    phases: [
      { id: 'before', label: 'Antes', text: 'La guía del producto llegaba con datos sin señalar.', visual: { kind, state: 'unreviewed' } },
      { id: 'change', label: 'Cambio', text: 'Una marca visible organiza la observación antes de cerrar.', visual: { kind, state: 'flagged' } },
      { id: 'result', label: 'Resultado esperado', text: 'Producto puede revisar el cambio antes de completar el ciclo.', visual: { kind, state: 'review-ready' } },
    ],
    playback: { minReadableHoldMs: 5_000, transitionMs: 160, loop: true },
    output: { ...output, formats: ['gif', 'png'] },
    seed: 7,
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

function hold(phaseIndex: number): NarrativeTimelineFrame {
  return { kind: 'hold', phaseIndex, fromPhaseIndex: phaseIndex, toPhaseIndex: phaseIndex, progress: 1, delayMs: 5_000 };
}

function render(
  style: (typeof STYLES)[number],
  kind: string,
  phaseIndex: number,
  seed = 7,
  output = { width: 1280, height: 720, preset: 'review-1280x720' },
): Uint8ClampedArray {
  const normalized = normalizeNarrativeBrief(brief(style, kind, output)).brief;
  const scene = getNarrativeScene(style);
  const fonts = getNarrativeFontProfile(style);
  const layout = layoutNarrative(normalized);
  const object = scene.createObject(normalized, seeded(seed));
  return scene.renderFrame({
    brief: normalized,
    layout,
    frame: hold(phaseIndex),
    localTimeMs: phaseIndex * 5_000,
    phaseIndex,
    phase: normalized.phases[phaseIndex]!,
    object,
    safeBoxes: { safe: layout.safeZone, text: layout.textArea, art: layout.reservedArtArea },
    fonts,
    rng: seeded(seed + phaseIndex),
  });
}

function opaqueBoundsRatio(pixels: Uint8ClampedArray, width: number, height: number): number {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (pixels[offset + 3] === 0) continue;
    const pixel = offset / 4;
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return maxX < minX || maxY < minY ? 0 : ((maxX - minX + 1) * (maxY - minY + 1)) / (width * height);
}

function pixelDifferenceRatio(left: Uint8ClampedArray, right: Uint8ClampedArray): number {
  let different = 0;
  for (let offset = 0; offset < left.length; offset += 4) {
    if (left[offset] !== right[offset] || left[offset + 1] !== right[offset + 1] || left[offset + 2] !== right[offset + 2] || left[offset + 3] !== right[offset + 3]) different += 1;
  }
  return different / (left.length / 4);
}

test('stage C registers each of its four completed styles alongside the existing pilots', () => {
  const registered = supportedNarrativeStyles();
  for (const style of [...STYLES, 'brutalist', 'papercraft']) assert.ok(registered.includes(style));
});

for (const style of STYLES) {
  test(`${style} has distinct curated compositions, stable holds and deterministic bounded variation`, () => {
    const first = render(style, 'comparison', 0);
    assert.deepEqual(first, render(style, 'comparison', 0), 'the same seeded phase is byte-identical');
    assert.ok(opaqueBoundsRatio(first, 1280, 720) >= 0.4, "the hero object's visible bounds fill at least 40% of the frame");
    assert.notDeepEqual(first, render(style, 'comparison', 2), 'a phase change alters the style object itself');
    const checklist = render(style, 'checklist', 2);
    assert.notDeepEqual(render(style, 'comparison', 2), checklist, 'comparison and checklist have different compositions');
    assert.ok(opaqueBoundsRatio(checklist, 1280, 720) >= 0.4, 'the checklist hero also fills at least 40% of the frame');
    assert.notDeepEqual(first, render(style, 'comparison', 0, 8), 'a new seed changes only the deterministic scene variation');

    const scene = getNarrativeScene(style);
    if (style === 'isotype') {
      const normalized = normalizeNarrativeBrief(brief(style)).brief;
      const object = scene.createObject(normalized, seeded(7)) as { unitCount: number };
      assert.equal(object.unitCount, normalized.phases.length, 'each qualitative pictogram maps to one supplied phase');
    }
    assert.equal(scene.supportsAspect(16 / 9), true);
    assert.equal(scene.supportsAspect(1), true);
    assert.equal(scene.supportsAspect(9 / 16), true);
    assert.equal(scene.supportsAspect(4 / 3), false);
    const square = render(style, 'comparison', 2, 7, { width: 1080, height: 1080, preset: 'square-1080' });
    const portrait = render(style, 'checklist', 2, 7, { width: 1080, height: 1920, preset: 'story-1080x1920' });
    assert.equal(square.length, 1080 * 1080 * 4);
    assert.equal(portrait.length, 1080 * 1920 * 4);
  });

  test(`${style} exports a 1280×720 GIF, static PNG, contact sheet and independently measured manifest`, async () => {
    const outputDir = await mkdtemp(path.join(os.tmpdir(), `narrative-stage-c-${style}-`));
    try {
      const result = await createNarrative(brief(style), { outputDir });
      const manifest = JSON.parse(await readFile(result.paths.manifest, 'utf8')) as {
        dimensions: { width: number; height: number };
        decoded: { width: number; height: number; durationMs: number; delaysMs: number[]; integrity: boolean };
        bytes: { gif: number };
        fonts: { roles: { display: { family: string }; reading: { family: string } } };
        evaluation: { 'visual-review': { status: string } };
      };
      assert.equal(manifest.dimensions.width, 1280);
      assert.equal(manifest.dimensions.height, 720);
      assert.equal(manifest.decoded.width, 1280);
      assert.equal(manifest.decoded.height, 720);
      assert.equal(manifest.decoded.integrity, true);
      assert.ok(manifest.decoded.delaysMs.includes(5_000));
      assert.ok(manifest.decoded.durationMs >= 15_000);
      assert.ok(manifest.bytes.gif <= 6 * 1024 * 1024);
      assert.equal(manifest.evaluation['visual-review'].status, 'pending');
      assert.equal(result.evaluation.publicationRecommendation, 'none');
      const contrast = result.evaluation['rendered-legibility'].controls.find((control) => control.name === 'contrast');
      assert.equal(contrast?.passed, true, 'the visible label color meets the contrast threshold');
      for (const file of [result.paths.gif, result.paths.png, result.paths.contactSheet]) assert.ok((await stat(file)).size > 0);
      assert.equal((await readFile(result.paths.png)).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
      assert.ok(manifest.fonts.roles.display.family.length > 0);
      assert.ok(manifest.fonts.roles.reading.family.length > 0);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });
}

test('op art comparison makes a clearly visible focus shift instead of a near-static pattern', () => {
  assert.ok(pixelDifferenceRatio(render('opart', 'comparison', 0), render('opart', 'comparison', 2)) >= 0.08);
});

test('stage C layouts keep the copy readable and expand the hero area to the frame height', () => {
  for (const style of STYLES) {
    const normalized: NormalizedNarrativeBrief = normalizeNarrativeBrief(brief(style)).brief;
    const layout = layoutNarrative(normalized);
    assert.ok(layout.phases.every((phase) => phase.body.size >= 36));
    assert.ok(layout.title.size >= 56);
    assert.ok(layout.reservedArtArea.y <= 0.06 * normalized.output.height);
    assert.ok(layout.reservedArtArea.height >= 0.88 * normalized.output.height);
    assert.ok(layout.reservedArtArea.width >= 0.4 * normalized.output.width);
  }
});

test('stage C keeps Spanish copy and returns TEXT_OVERFLOW for an unbreakable word', () => {
  for (const style of STYLES) {
    const localized = normalizeNarrativeBrief({ ...brief(style),
      title: '¿Qué cambió? ¡Revisión útil!',
      phases: [
        { id: 'before', label: 'Antes', text: 'Árboles, señalización y revisión: 4% aún requiere atención; guía útil.', visual: { kind: 'comparison', state: 'unreviewed' } },
        { id: 'change', label: 'Cambio', text: 'La señal conserva la lectura del cambio.', visual: { kind: 'comparison', state: 'flagged' } },
        { id: 'result', label: 'Resultado esperado', text: 'El equipo podrá revisar sin perder información.', visual: { kind: 'comparison', state: 'review-ready' } },
      ],
    }).brief;
    assert.equal(layoutNarrative(localized).phases[0]!.body.sourceText, localized.phases[0]!.text);
    const overflow = normalizeNarrativeBrief({ ...brief(style),
      title: 'Cambios para revisar',
      phases: [
        { id: 'before', label: 'Antes', text: 'SupercalifragilísticoSinSeparaciones'.repeat(30), visual: { kind: 'comparison', state: 'unreviewed' } },
        { id: 'change', label: 'Cambio', text: 'La señal conserva la lectura del cambio.', visual: { kind: 'comparison', state: 'flagged' } },
        { id: 'result', label: 'Resultado esperado', text: 'El equipo podrá revisar sin perder información.', visual: { kind: 'comparison', state: 'review-ready' } },
      ],
    }).brief;
    assert.throws(() => layoutNarrative(overflow), (error: unknown) => {
      assert.equal((error as { code: string }).code, 'TEXT_OVERFLOW');
      assert.match((error as Error).message, /text does not fit/);
      return true;
    });
  }
});
