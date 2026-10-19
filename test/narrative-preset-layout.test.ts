import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { normalizeNarrativeBrief } from '../src/narrative/brief.js';
import { narrativeCapabilityReport, narrativeLayoutsFor } from '../src/narrative/capabilities.js';
import { NARRATIVE_SCENE_LAYOUTS, narrativeCompositionFor } from '../src/narrative/composition.js';
import { createNarrative } from '../src/narrative/create.js';
import { getNarrativeScene } from '../src/narrative/scene.js';
import { layoutNarrative } from '../src/narrative/layout.js';
import { getNarrativeFontProfile } from '../src/narrative/fonts.js';
import { buildNarrativeTimeline } from '../src/narrative/timeline.js';
import { measureCompositionBalance } from '../src/narrative/evaluate.js';
import type { NarrativeRenderContext, NarrativeSceneLayout } from '../src/types/narrative.js';

function base(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    style: 'papercraft',
    kind: 'narrative-gif',
    locale: 'es',
    audience: 'Producto',
    title: 'Guías claras',
    workflowStatus: 'in-review',
    outcome: { mode: 'expected' },
    illustrative: true,
    badgePolicy: 'none',
    phases: [
      { id: 'problema', label: 'Problema', text: 'Medida sin señal.', visual: { kind: 'comparison', state: 'unreviewed' } },
      { id: 'solucion', label: 'Solución', text: 'Ahora hay señal.', visual: { kind: 'comparison', state: 'flagged' } },
      { id: 'highlight', label: 'Highlight', text: 'Revisar antes de publicar.', visual: { kind: 'comparison', state: 'review-ready' } },
    ],
    playback: { preset: 'product-review', transitionMs: 320, loop: true },
    output: { width: 1280, height: 720, preset: 'review-1280x720', formats: ['gif', 'png'] },
    seed: 7,
    ...overrides,
  };
}

function codeFrom(fn: () => unknown, code: string): void {
  assert.throws(fn, (error: unknown) => (error as { code?: string }).code === code);
}

test('product-review preset keeps the readable floor, extends by text and shortens transitions', () => {
  const short = normalizeNarrativeBrief(base({ playback: { preset: 'product-review', loop: true } })).brief;
  assert.equal(short.playback.preset, 'product-review');
  assert.equal(short.playback.minReadableHoldMs, 5_000);
  assert.equal(short.playback.transitionMs, 320);
  assert.equal(buildNarrativeTimeline(short).holds.every((hold) => hold.encodedMs >= 5_000), true);

  const longText = 'La guía reúne la medida, su explicación y una recomendación de lectura para que el equipo pueda volver sobre el dato antes de dejar constancia de su revisión.';
  const extended = normalizeNarrativeBrief(base({
    phases: [
      { id: 'problema', label: 'Problema', text: longText, visual: { kind: 'comparison', state: 'unreviewed' } },
      { id: 'solucion', label: 'Solución', text: 'Ahora hay señal.', visual: { kind: 'comparison', state: 'flagged' } },
      { id: 'highlight', label: 'Highlight', text: 'Revisar antes de publicar.', visual: { kind: 'comparison', state: 'review-ready' } },
    ],
    playback: { preset: 'product-review', loop: true },
  })).brief;
  assert.ok(buildNarrativeTimeline(extended).holds[0]!.encodedMs > 5_000, 'reading load extends the five-second floor');

  const concise = normalizeNarrativeBrief(base({ playback: { preset: 'concise', transitionMs: 160, loop: true } })).brief;
  assert.equal(concise.playback.minReadableHoldMs, 2_000);
  const readable = normalizeNarrativeBrief(base({ playback: { preset: 'readable', loop: true } })).brief;
  assert.equal(readable.playback.minReadableHoldMs, 5_000);
  assert.equal(readable.playback.transitionMs, 650);
});

test('product-review edits only defaults and warnings and accepts four scenes', () => {
  const four = normalizeNarrativeBrief(base({
    title: 'Guías claras revisadas',
    phases: [
      { id: 'problema', label: 'Problema', text: 'Medida sin señal.', visual: { kind: 'comparison', state: 'unreviewed' } },
      { id: 'contexto', label: 'Contexto', text: 'La guía llega al equipo.', visual: { kind: 'comparison', state: 'unreviewed' } },
      { id: 'solucion', label: 'Solución', text: 'Ahora hay señal.', visual: { kind: 'comparison', state: 'flagged' } },
      { id: 'highlight', label: 'Highlight', text: 'Revisar antes de publicar.', visual: { kind: 'comparison', state: 'review-ready' } },
    ],
    playback: { preset: 'product-review', loop: true },
  }));
  assert.equal(four.brief.phases.length, 4);
  assert.equal(four.warnings.filter((warning) => warning.code === 'EDITORIAL_GUIDELINE').length, 0);
});

test('editorial guidelines warn about headline length and sentence count without editing copy', () => {
  const text = 'La guía se revisa. Luego se publica.';
  const parsed = normalizeNarrativeBrief(base({
    title: 'Una guía para revisar cada cierre de sprint',
    phases: [
      { id: 'problema', label: 'Problema', text, visual: { kind: 'comparison', state: 'unreviewed' } },
      { id: 'solucion', label: 'Solución', text: 'Ahora hay señal.', visual: { kind: 'comparison', state: 'flagged' } },
      { id: 'highlight', label: 'Highlight', text: 'Revisar antes de publicar.', visual: { kind: 'comparison', state: 'review-ready' } },
    ],
  }));
  const warnings = parsed.warnings.filter((warning) => warning.code === 'EDITORIAL_GUIDELINE');
  assert.ok(warnings.some((warning) => warning.field === 'title' && /3.?7/u.test(warning.suggestion)), 'warns about the 3–7-word title guideline');
  assert.ok(warnings.some((warning) => warning.field === 'phases[0].text' && /una sola frase|one short sentence/iu.test(warning.suggestion)), 'warns about a single short sentence');
  assert.equal(parsed.brief.phases[0]!.text, text, 'the user text is not cut');
});

test('content lint warns about internal codes, PRs, environments and Jira states in phase texts', () => {
  const text = 'Ver PROJ-123 y PR #42 en staging antes del hotfix. Estado: IN PROGRESS.';
  const parsed = normalizeNarrativeBrief(base({
    phases: [
      { id: 'problema', label: 'Problema', text, visual: { kind: 'comparison', state: 'unreviewed' } },
      { id: 'solucion', label: 'Solución', text: 'Ahora hay señal.', visual: { kind: 'comparison', state: 'flagged' } },
      { id: 'highlight', label: 'Highlight', text: 'Revisar antes de publicar.', visual: { kind: 'comparison', state: 'review-ready' } },
    ],
  }));
  const lint = parsed.warnings.filter((warning) => warning.code === 'CONTENT_LINT');
  for (const pattern of ['PROJ-123', 'PR #42', 'staging', 'hotfix', 'IN PROGRESS']) {
    assert.ok(lint.some((warning) => warning.message.includes(pattern)), `lint reports ${pattern}`);
  }
  assert.ok(lint.every((warning) => warning.suggestion.length > 10));
  assert.equal(parsed.brief.phases[0]!.text, text, 'lint never rewrites user copy');
});

test('layout hints are validated per style before rendering with explicit alternatives', () => {
  codeFrom(() => normalizeNarrativeBrief(base({ style: 'nature', phases: [
    { id: 'problema', label: 'Problema', text: 'Medida sin señal.', layout: 'object-hero', visual: { kind: 'comparison', state: 'unreviewed' } },
    { id: 'solucion', label: 'Solución', text: 'Ahora hay señal.', visual: { kind: 'comparison', state: 'flagged' } },
    { id: 'highlight', label: 'Highlight', text: 'Revisar antes de publicar.', visual: { kind: 'comparison', state: 'review-ready' } },
  ] })), 'UNSUPPORTED_LAYOUT');
  assert.throws(() => normalizeNarrativeBrief(base({ style: 'nature', phases: [
    { id: 'problema', label: 'Problema', text: 'Medida sin señal.', layout: 'object-hero', visual: { kind: 'comparison', state: 'unreviewed' } },
    { id: 'solucion', label: 'Solución', text: 'Ahora hay señal.', visual: { kind: 'comparison', state: 'flagged' } },
    { id: 'highlight', label: 'Highlight', text: 'Revisar antes de publicar.', visual: { kind: 'comparison', state: 'review-ready' } },
  ] })), (error: unknown) => {
    const narrative = error as { code: string; details?: { validAlternatives?: string[] } };
    assert.equal(narrative.code, 'UNSUPPORTED_LAYOUT');
    assert.deepEqual(narrative.details?.validAlternatives, ['object-left', 'object-right']);
    return true;
  });
  for (const style of ['papercraft', 'brutalist'] as const) {
    for (const layout of NARRATIVE_SCENE_LAYOUTS) {
      const parsed = normalizeNarrativeBrief(base({ style, phases: [
        { id: 'problema', label: 'Problema', text: 'Medida sin señal.', layout, visual: { kind: 'comparison', state: 'unreviewed' } },
        { id: 'solucion', label: 'Solución', text: 'Ahora hay señal.', layout, visual: { kind: 'comparison', state: 'flagged' } },
        { id: 'highlight', label: 'Highlight', text: 'Revisar antes de publicar.', layout, visual: { kind: 'comparison', state: 'review-ready' } },
      ] }));
      assert.equal(parsed.brief.phases[0]!.layout, layout);
    }
  }
});

test('capabilities list the layouts supported per style and aspect', () => {
  assert.deepEqual(narrativeLayoutsFor('papercraft', 16 / 9), ['object-left', 'object-right', 'object-top', 'object-hero']);
  assert.deepEqual(narrativeLayoutsFor('papercraft', 1), ['object-left', 'object-right', 'object-top', 'object-hero']);
  assert.deepEqual(narrativeLayoutsFor('nature', 16 / 9), ['object-left', 'object-right']);
  const report = narrativeCapabilityReport({ style: 'nature' });
  assert.ok(report.cells.filter((cell) => cell.aspect === '16:9').every((cell) => cell.layouts.join(',') === 'object-left,object-right'));
  assert.ok(report.cells.filter((cell) => cell.aspect !== '16:9').every((cell) => cell.layouts.length === 0));
  const papercraft = narrativeCapabilityReport({ style: 'papercraft' });
  assert.ok(papercraft.cells.filter((cell) => cell.aspect !== '9:16').every((cell) => cell.layouts.includes('object-hero')));
  assert.ok(papercraft.cells.filter((cell) => cell.aspect === '9:16').every((cell) => cell.layouts.length === 0));
});

function frameLayouts(style: 'papercraft' | 'brutalist', layout: NarrativeSceneLayout, width: number, height: number) {
  const parsed = normalizeNarrativeBrief(base({
    style,
    output: { width, height, preset: width === height ? 'square-1080' : 'review-1280x720', formats: ['gif', 'png'] },
    phases: [
      { id: 'problema', label: 'Problema', text: 'Medida.', layout, visual: { kind: 'comparison', state: 'unreviewed' } },
      { id: 'solucion', label: 'Solución', text: 'Señal.', layout, visual: { kind: 'comparison', state: 'flagged' } },
      { id: 'highlight', label: 'Highlight', text: 'Revisar.', layout, visual: { kind: 'comparison', state: 'review-ready' } },
    ],
  }));
  return { parsed, layout: layoutNarrative(parsed.brief) };
}

test('papercraft and brutalist geometry is data-driven for every layout at 16:9 and 1:1', () => {
  for (const style of ['papercraft', 'brutalist'] as const) {
    for (const aspect of [[1280, 720], [640, 640]] as const) {
      for (const layout of NARRATIVE_SCENE_LAYOUTS) {
        const { parsed, layout: measured } = frameLayouts(style, layout, aspect[0], aspect[1]);
        const frame = measured.phaseFrames[0]!;
        assert.equal(frame.layout, layout);
        const text = frame.textArea;
        const art = frame.reservedArtArea;
        assert.ok(text.x >= parsed.brief.output.width * 0.05 - 0.01 && text.y >= parsed.brief.output.height * 0.05 - 0.01, `${style}/${layout} text inside safe area`);
        assert.ok(art.x >= parsed.brief.output.width * 0.05 - 0.01 && art.x + art.width <= parsed.brief.output.width * 0.95 + 0.01, `${style}/${layout} art inside safe area`);
        assert.ok(art.y >= parsed.brief.output.height * 0.05 - 0.01 && art.y + art.height <= parsed.brief.output.height * 0.95 + 0.01, `${style}/${layout} art inside vertical safe area`);
        const overlap = text.x < art.x + art.width && art.x < text.x + text.width && text.y < art.y + art.height && art.y < text.y + text.height;
        assert.equal(overlap, false, `${style}/${layout} copy and art do not overlap`);
        if (layout === 'object-left') assert.ok(art.x < text.x, 'art sits on the left');
        if (layout === 'object-right') assert.ok(text.x < art.x, 'art sits on the right');
        if (layout === 'object-top') assert.ok(art.y + art.height <= text.y, 'art sits above copy');
        if (layout === 'object-hero') {
          assert.ok(art.width * art.height >= parsed.brief.output.width * parsed.brief.output.height * 0.50, `${style} hero object occupies about half the frame or more`);
        }
        for (let index = 0; index < parsed.brief.phases.length; index += 1) {
          const phase = measured.phaseFrames[index]!;
          assert.equal(phase.body.lines.join(' '), parsed.brief.phases[index]!.text);
          assert.ok(phase.body.size >= 36, `${style}/${layout} body stays at least 36px native`);
          assert.ok(phase.label.size >= 24);
          assert.ok(phase.title.size >= 56);
        }
      }
    }
  }
});

test('layout and scene rendering are deterministic for explicit layout hints', () => {
  const { parsed, layout } = frameLayouts('papercraft', 'object-hero', 1280, 720);
  const again = layoutNarrative(parsed.brief);
  assert.deepEqual(again.phaseFrames, layout.phaseFrames);
  const scene = getNarrativeScene(parsed.brief.style);
  const fonts = getNarrativeFontProfile(parsed.brief.style);
  const object = scene.createObject(parsed.brief, () => 0.5);
  const render = () => {
    const phaseIndex = 2;
    const context: NarrativeRenderContext = {
      brief: parsed.brief,
      layout,
      frame: { kind: 'hold', phaseIndex, fromPhaseIndex: phaseIndex, toPhaseIndex: phaseIndex, progress: 1, delayMs: 5_000 },
      localTimeMs: 0,
      phaseIndex,
      phase: parsed.brief.phases[phaseIndex]!,
      object,
      safeBoxes: { safe: layout.safeZone, text: layout.phaseFrames[phaseIndex]!.textArea, art: layout.phaseFrames[phaseIndex]!.reservedArtArea },
      fonts,
      rng: () => 0.5,
    };
    return scene.renderFrame(context);
  };
  assert.deepEqual(render(), render());
});

test('object prominence proxy reports the art-box area ratio and object-hero renders above 30%', async (t) => {
  const width = 1280;
  const height = 720;
  const rgb = new Uint8Array(width * height * 3).fill(255);
  const artArea = { x: width * 0.37, y: height * 0.05, width: width * 0.58, height: height * 0.9 };
  for (let y = Math.floor(artArea.y); y < Math.ceil(artArea.y + artArea.height); y += 1) {
    for (let x = Math.floor(artArea.x); x < Math.ceil(artArea.x + artArea.width); x += 1) {
      const offset = (y * width + x) * 3;
      rgb[offset] = 0;
      rgb[offset + 1] = 0;
      rgb[offset + 2] = 0;
    }
  }
  const metrics = measureCompositionBalance({ rgb, width, height, background: '#ffffff', textArea: { x: 0, y: 0, width: width * 0.25, height }, artArea });
  assert.ok(metrics.objectAreaRatio >= 0.3);

  const root = await mkdtemp(path.join(os.tmpdir(), 'narrative-hero-'));
  try {
    const result = await createNarrative(base({
      output: { width: 640, height: 360, preset: 'card-640x360', formats: ['gif', 'png'] },
      playback: { preset: 'product-review', loop: true },
      phases: [
        { id: 'problema', label: 'Problema', text: 'Medida.', layout: 'object-hero', visual: { kind: 'comparison', state: 'unreviewed' } },
        { id: 'solucion', label: 'Solución', text: 'Señal.', layout: 'object-hero', visual: { kind: 'comparison', state: 'flagged' } },
        { id: 'highlight', label: 'Highlight', text: 'Revisar.', layout: 'object-hero', visual: { kind: 'comparison', state: 'review-ready' } },
      ],
    }), { outputDir: path.join(root, 'pack') });
    const control = result.evaluation['rendered-legibility'].controls.find((entry) => entry.name === 'object-prominence');
    assert.ok(control, 'object-prominence is measured');
    assert.equal(control.passed, true, control.detail);
    assert.match(control.detail, /proxy/iu);
    assert.match(control.detail, /problema: \d/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('object-hero keeps the existing semantic object-text legibility control green at 640x360', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'narrative-hero-semantic-'));
  try {
    const semantic = (state: string, value: number) => ({
      primitive: 'counter',
      illustrative: true,
      entities: [
        { id: 'count', kind: 'counter', value },
        { id: 'item-a', kind: 'row', label: 'A' },
        { id: 'item-b', kind: 'row', label: 'B' },
      ],
      relations: Array.from({ length: value }, (_, index) => ({ kind: 'counts', from: 'count', to: index === 0 ? 'item-a' : 'item-b' })),
      states: { count: state, 'item-a': 'default', 'item-b': 'default' },
      actions: [],
    });
    const phases = [
      { id: 'problema', label: 'Problema', text: 'Dos.', visual: { kind: 'comparison', state: 'unreviewed', semantic: semantic('value', 1) } },
      { id: 'solucion', label: 'Solución', text: 'Tres.', visual: { kind: 'comparison', state: 'flagged', semantic: semantic('increased', 2) } },
      { id: 'highlight', label: 'Highlight', text: 'Dos.', visual: { kind: 'comparison', state: 'review-ready', semantic: semantic('decreased', 1) } },
    ].map((phase) => ({ ...phase, layout: 'object-hero' as const }));
    const result = await createNarrative(base({
      title: 'Guías',
      output: { width: 640, height: 360, preset: 'card-640x360', formats: ['gif', 'png'] },
      playback: { preset: 'concise', transitionMs: 160, loop: true },
      phases,
    }), { outputDir: path.join(root, 'pack') });
    const controls = result.evaluation['rendered-legibility'].controls;
    const objectText = controls.find((control) => control.name === 'semantic-text-legibility');
    assert.ok(objectText, 'semantic object text is measured');
    assert.equal(objectText.passed, true, objectText.detail);
    assert.match(objectText.detail, />=14px/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('object-right remains the no-hint default and keeps its source composition', () => {
  const noHint = normalizeNarrativeBrief(base()).brief;
  assert.equal(noHint.phases[0]!.layout, undefined);
  const layout = layoutNarrative(noHint);
  assert.equal(layout.phaseFrames[0]!.layout, 'object-right');
  assert.deepEqual(layout.textArea, layout.phaseFrames[0]!.textArea);
  assert.deepEqual(layout.reservedArtArea, layout.phaseFrames[0]!.reservedArtArea);
  assert.deepEqual(layout.reservedArtArea, {
    x: noHint.output.width * 0.05 + noHint.output.width * narrativeCompositionFor('papercraft').textWidthRatio + noHint.output.width * narrativeCompositionFor('papercraft').artGapRatio,
    y: noHint.output.height * narrativeCompositionFor('papercraft').artY,
    width: noHint.output.width * narrativeCompositionFor('papercraft').artWidthRatio,
    height: noHint.output.height * narrativeCompositionFor('papercraft').artHeight,
  });
});
