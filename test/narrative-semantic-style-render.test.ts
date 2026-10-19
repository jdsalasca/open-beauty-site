import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createNarrative } from '../src/narrative/create.js';
import { narrativeCapabilityReport } from '../src/narrative/capabilities.js';
import { verifyNarrativeGif } from '../src/narrative/verify-gif.js';

type Style = 'isotype' | 'opart';
type Primitive = 'counter' | 'card-collection';
type Locale = 'es' | 'en';
type Composition = 'comparison' | 'checklist';

const ASPECTS = [
  { id: '16:9', width: 1280, height: 720 },
  { id: '1:1', width: 640, height: 640 },
  { id: '9:16', width: 540, height: 960 },
] as const;

function sceneStates(style: Style, phaseIndex: number): Record<string, string> {
  if (style === 'isotype') {
    return {
      tally: 'value',
      ...Object.fromEntries(Array.from({ length: 6 }, (_, index) => [
        `unit-${index + 1}`,
        index === 5 ? ['default', 'flagged', 'pending'][phaseIndex]! : 'default',
      ])),
    };
  }
  return {
    field: 'open',
    ...Object.fromEntries(Array.from({ length: 6 }, (_, index) => [
      `disc-${index + 1}`,
      index >= 3 ? ['member', 'selected', 'pending'][phaseIndex]! : 'member',
    ])),
  };
}

function semantic(style: Style, primitive: Primitive, phaseIndex: number, repeatState = false) {
  const states = repeatState ? sceneStates(style, 0) : sceneStates(style, phaseIndex);
  if (style === 'isotype' && primitive === 'counter') {
    return {
      primitive: 'counter' as const,
      illustrative: true,
      entities: [
        { id: 'tally', kind: 'counter', value: 6 },
        ...Array.from({ length: 6 }, (_, index) => ({ id: `unit-${index + 1}`, kind: 'row' })),
      ],
      relations: Array.from({ length: 6 }, (_, index) => ({ kind: 'counts', from: 'tally', to: `unit-${index + 1}` })),
      states,
      actions: phaseIndex === 1 && !repeatState ? [{ entityId: 'unit-6', type: 'detect' }] : [],
    };
  }
  if (style === 'isotype') {
    return {
      primitive: 'card-collection' as const,
      illustrative: true,
      entities: [
        { id: 'roster', kind: 'collection', label: 'Illustrative units' },
        ...Array.from({ length: 6 }, (_, index) => ({ id: `unit-${index + 1}`, kind: 'card', label: `Unit ${index + 1}` })),
      ],
      relations: Array.from({ length: 6 }, (_, index) => ({ kind: 'member-of', from: `unit-${index + 1}`, to: 'roster' })),
      states: {
        roster: phaseIndex === 2 && !repeatState ? 'counted' : 'open',
        ...Object.fromEntries(Array.from({ length: 6 }, (_, index) => [
          `unit-${index + 1}`,
          index === 5 ? ['default', 'selected', 'pending'][repeatState ? 0 : phaseIndex]! : 'member',
        ])),
      },
      actions: [],
    };
  }
  return {
    primitive: 'card-collection' as const,
    illustrative: true,
    entities: [
      { id: 'field', kind: 'collection', label: 'Optical field' },
      ...Array.from({ length: 6 }, (_, index) => ({ id: `disc-${index + 1}`, kind: 'card', label: `Disc ${index + 1}` })),
    ],
    relations: Array.from({ length: 6 }, (_, index) => ({ kind: 'member-of', from: `disc-${index + 1}`, to: 'field' })),
    states,
    actions: [],
  };
}

function brief(style: Style, primitive: Primitive, repeatState = false, locale: Locale = 'en', width = 640, height = 360, composition: Composition = 'comparison') {
  const english = locale === 'en';
  return {
    style,
    kind: 'narrative-gif',
    locale,
    audience: english ? 'Design review' : 'Revisión de diseño',
    title: style === 'isotype' ? (english ? 'Unit set' : 'Unidades') : (english ? 'Rings' : 'Anillos'),
    workflowStatus: 'in-review',
    outcome: { mode: 'expected' },
    illustrative: true,
    badgePolicy: 'none',
    playback: { preset: 'concise', minReadableHoldMs: 2_000, transitionMs: 400, loop: true },
    output: { width, height, formats: ['gif', 'png'] },
    seed: 31,
    phases: [
      { id: 'before', label: english ? 'Before' : 'Antes', text: english ? 'A sample set appears.' : 'Aparece un conjunto.', visual: { kind: composition, state: 'unreviewed', semantic: semantic(style, primitive, 0, repeatState) } },
      { id: 'change', label: english ? 'Change' : 'Cambio', text: english ? 'The explanation changes.' : 'Cambia la explicación.', visual: { kind: composition, state: 'flagged', semantic: semantic(style, primitive, 1, repeatState) } },
      { id: 'result', label: english ? 'Expected result' : 'Resultado esperado', text: english ? 'The same drawing remains.' : 'El dibujo permanece.', visual: { kind: composition, state: 'review-ready', semantic: semantic(style, primitive, 2, repeatState) } },
    ],
  };
}

test('opart/checklist keeps the optical group change in a still art-only hold', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'narrative-opart-checklist-'));
  try {
    const input = brief('opart', 'card-collection', false, 'en', 1280, 720, 'checklist');
    const result = await createNarrative(input, { outputDir: root });
    const objectChanges = result.evaluation.narrative.controls.filter((control) => control.name.startsWith('semantic-object-transformation:'));
    assert.ok(objectChanges.some((control) => control.passed), 'the checklist pattern changes inside declared optical-unit regions');
    assert.equal(verifyNarrativeGif(await readFile(result.paths.gif), []).integrity.valid, true);

    const artOnly = await createNarrative(input, { outputDir: path.join(root, 'art-only'), artOnly: true });
    const manifest = JSON.parse(await readFile(artOnly.paths.manifest, 'utf8')) as { artOnly: boolean; semanticObjectCaptures: Array<{ kind: string; regions: unknown[] }> };
    assert.equal(manifest.artOnly, true);
    assert.ok(manifest.semanticObjectCaptures.filter((capture) => capture.kind === 'hold').every((capture) => capture.regions.length > 0));
    assert.ok(artOnly.evaluation.narrative.controls.some((control) => control.name.startsWith('semantic-object-transformation:') && control.passed));
    assert.ok(artOnly.evaluation['rendered-legibility'].controls.some((control) => control.name === 'stable-reading-holds' && control.passed));
    assert.deepEqual((await readFile(artOnly.paths.png)).subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

for (const [style, primitives] of [['isotype', ['counter', 'card-collection']], ['opart', ['card-collection']]] as const) {
  for (const primitive of primitives) {
    for (const aspect of ASPECTS) {
      for (const locale of ['es', 'en'] as const) {
        test(`${style}/${primitive}/${aspect.id}/${locale} has decoded semantic object proof`, async () => {
          const root = await mkdtemp(path.join(os.tmpdir(), `narrative-${style}-semantic-`));
          try {
            const capability = narrativeCapabilityReport({ style }).cells.find((cell) => cell.primitive === primitive && cell.aspect === aspect.id && cell.locale === locale);
            assert.equal(capability?.status, 'supported');
            assert.match(capability?.reason ?? '', /narrative-semantic-style-render\.test\.ts/u);

            const result = await createNarrative(brief(style, primitive, false, locale, aspect.width, aspect.height), { outputDir: root });
            const decoded = verifyNarrativeGif(await readFile(result.paths.gif), []);
            assert.equal(decoded.integrity.valid, true);
            assert.equal(decoded.width, aspect.width);
            assert.equal(decoded.height, aspect.height);
            const transforms = result.evaluation.narrative.controls.filter((control) => control.name.startsWith('semantic-object-transformation:'));
            assert.ok(transforms.some((control) => control.passed), 'a real object change is visible inside declared entity regions');
            assert.ok(transforms.every((control) => /changed-state entities:/u.test(control.detail)));

            if (aspect.id === '16:9' && locale === 'en') {
              const artOnly = await createNarrative(brief(style, primitive, false, locale, aspect.width, aspect.height), { outputDir: path.join(root, 'art-only'), artOnly: true });
              const manifest = JSON.parse(await readFile(artOnly.paths.manifest, 'utf8')) as { artOnly: boolean; semanticObjectCaptures: Array<{ kind: string; regions: unknown[] }> };
              assert.equal(manifest.artOnly, true);
              assert.equal(verifyNarrativeGif(await readFile(artOnly.paths.gif), []).integrity.valid, true);
              assert.ok(manifest.semanticObjectCaptures.filter((capture) => capture.kind === 'hold').every((capture) => capture.regions.length > 0));
              assert.ok(artOnly.evaluation.narrative.controls.some((control) => control.name.startsWith('semantic-object-transformation:') && control.passed));
              assert.ok(artOnly.evaluation['rendered-legibility'].controls.some((control) => control.name === 'stable-reading-holds' && control.passed), `${style}/${primitive} keeps its reading pattern fixed during holds`);
              assert.deepEqual((await readFile(artOnly.paths.png)).subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), 'a static PNG fallback is exported');
            }
          } finally {
            await rm(root, { recursive: true, force: true });
          }
        });
      }
    }
  }
  test(`${style} text-only changes do not pass the semantic-object control`, async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), `narrative-${style}-negative-`));
    try {
      const result = await createNarrative(brief(style, primitives[0], true), { outputDir: root });
      const transforms = result.evaluation.narrative.controls.filter((control) => control.name.startsWith('semantic-object-transformation:'));
      assert.ok(transforms.length > 0, 'declared object regions are evaluated');
      assert.ok(transforms.every((control) => !control.passed), 'changing only title/phase/body copy cannot pass');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}
