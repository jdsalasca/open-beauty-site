import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createNarrative } from '../src/narrative/create.js';
import { normalizeNarrativeBrief } from '../src/narrative/brief.js';
import { compareSemanticObjectFrames } from '../src/narrative/evaluate.js';
import { NarrativeError } from '../src/types/narrative.js';
import { testNarrativeScene } from './support/narrative-scene.js';

function legacyBrief() {
  return {
    style: 'papercraft', kind: 'narrative-gif', locale: 'es', audience: 'Producto', title: 'Guías',
    workflowStatus: 'in-review', phases: [
      { id: 'before', label: 'Antes', text: 'Primera fase.', visual: { kind: 'comparison', state: 'before' } },
      { id: 'change', label: 'Cambio', text: 'Segunda fase.', visual: { kind: 'comparison', state: 'flagged' } },
      { id: 'result', label: 'Resultado esperado', text: 'Tercera fase.', visual: { kind: 'comparison', state: 'review-ready' } },
    ],
  };
}

function semanticBrief() {
  const brief = legacyBrief();
  return {
    ...brief,
    phases: brief.phases.map((phase, index) => ({
      ...phase,
      visual: {
        ...phase.visual,
        semantic: {
          primitive: 'table-rows',
          illustrative: true,
          entities: [{ id: 'row-a', kind: 'row' }, { id: 'row-b', kind: 'row' }],
          relations: [{ kind: 'duplicate-of', from: 'row-b', to: 'row-a' }],
          states: { 'row-a': 'default', 'row-b': ['duplicate', 'flagged', 'rejected'][index] },
          actions: index === 2 ? [{ entityId: 'row-b', type: 'reject' }] : [],
        },
      },
    })),
  };
}

test('legacy visual kind/state briefs normalize to a stable trivial semantic scene', () => {
  const { brief } = normalizeNarrativeBrief(legacyBrief());
  const semantics = brief.phases.map((phase) => phase.visual.semantic);
  assert.ok(semantics.every(Boolean));
  assert.deepEqual(semantics.map((scene) => scene!.entities.map((entity) => entity.id)), [
    ['legacy-object'], ['legacy-object'], ['legacy-object'],
  ]);
  assert.deepEqual(semantics.map((scene) => scene!.states['legacy-object']), ['before', 'flagged', 'review-ready']);
  assert.ok(semantics.every((scene) => scene!.illustrative === true));
});

test('explicit semantic entities keep identity and normalize per-phase states and actions', () => {
  const { brief } = normalizeNarrativeBrief(semanticBrief());
  assert.deepEqual(brief.phases.map((phase) => phase.visual.semantic!.entities.map((entity) => entity.id)), [
    ['row-a', 'row-b'], ['row-a', 'row-b'], ['row-a', 'row-b'],
  ]);
  assert.equal(brief.phases[2]!.visual.semantic!.actions[0]!.type, 'reject');
  assert.equal(brief.phases[2]!.visual.semantic!.illustrative, true);
});

test('unknown semantic entity references return phase, value, and valid entity alternatives', () => {
  const brief = semanticBrief();
  brief.phases[1]!.visual.semantic!.states = { ghost: 'duplicate', 'row-b': 'flagged' };
  assert.throws(() => normalizeNarrativeBrief(brief), (error: unknown) => {
    assert.ok(error instanceof NarrativeError);
    assert.equal(error.code, 'UNSUPPORTED_ENTITY');
    assert.deepEqual(error.details, { phaseIndex: 1, style: 'papercraft', value: 'ghost', validAlternatives: ['row-a', 'row-b'] });
    return true;
  });
});

test('unknown semantic states and actions fail before render with allowed alternatives', () => {
  const badState = semanticBrief();
  badState.phases[1]!.visual.semantic!.states['row-b'] = 'erased';
  assert.throws(() => normalizeNarrativeBrief(badState), (error: unknown) => {
    assert.ok(error instanceof NarrativeError);
    assert.equal(error.code, 'UNSUPPORTED_STATE');
    assert.equal(error.details?.phaseIndex, 1);
    assert.equal(error.details?.value, 'erased');
    assert.ok(error.details?.validAlternatives?.includes('rejected'));
    return true;
  });

  const badAction = semanticBrief();
  badAction.phases[2]!.visual.semantic!.actions[0]!.type = 'erase';
  assert.throws(() => normalizeNarrativeBrief(badAction), (error: unknown) => {
    assert.ok(error instanceof NarrativeError);
    assert.equal(error.code, 'UNSUPPORTED_ACTION');
    assert.equal(error.details?.phaseIndex, 2);
    assert.equal(error.details?.value, 'erase');
    assert.ok(error.details?.validAlternatives?.includes('reject'));
    return true;
  });
});

test('entity identity and kind cannot change between phases', () => {
  const brief = semanticBrief();
  brief.phases[1]!.visual.semantic!.entities[0]!.id = 'replacement-row';
  assert.throws(() => normalizeNarrativeBrief(brief), (error: unknown) => {
    assert.ok(error instanceof NarrativeError);
    assert.equal(error.code, 'UNSUPPORTED_ENTITY');
    assert.equal(error.details?.phaseIndex, 1);
    assert.equal(error.details?.value, 'replacement-row');
    assert.ok(error.details?.validAlternatives?.includes('row-a'));
    return true;
  });
});

test('counter values must equal the number of explicitly counted visible entities', () => {
  const brief = legacyBrief();
  const entities = [{ id: 'count', kind: 'counter', value: '1' }, { id: 'item-a', kind: 'row', label: 'A' }];
  const relations = [{ kind: 'counts', from: 'count', to: 'item-a' }];
  const input = {
    ...brief,
    phases: brief.phases.map((phase) => ({ ...phase, visual: { ...phase.visual, semantic: {
      primitive: 'counter', entities, relations, states: { count: 'value', 'item-a': 'default' }, actions: [],
    } } })),
  };
  assert.throws(() => normalizeNarrativeBrief(input), (error: unknown) => {
    assert.ok(error instanceof NarrativeError);
    assert.equal(error.code, 'UNSUPPORTED_STATE');
    assert.equal(error.details?.value, '1');
    assert.deepEqual(error.details?.validAlternatives, ['1']);
    return true;
  });
});

test('text-only and decorative-only changes cannot pass the semantic object pixel control', () => {
  const before = new Uint8Array(10 * 10 * 3);
  const textOnly = before.slice();
  textOnly.fill(255, 0, 3 * 2);
  const decorativeOnly = before.slice();
  decorativeOnly.fill(200, 3 * 9, 3 * 10);
  const region = [{ entityId: 'row-a', bounds: { x: 2, y: 2, width: 4, height: 4 } }];
  const common = { width: 10, height: 10, regions: region, fromStates: { 'row-a': 'duplicate' }, toStates: { 'row-a': 'flagged' } };
  assert.equal(compareSemanticObjectFrames({ ...common, beforeRgb: before, afterRgb: textOnly }).passed, false);
  assert.equal(compareSemanticObjectFrames({ ...common, beforeRgb: before, afterRgb: decorativeOnly }).passed, false);
  assert.equal(compareSemanticObjectFrames({ ...common, fromStates: { 'row-a': 'duplicate' }, toStates: { 'row-a': 'duplicate' }, beforeRgb: before, afterRgb: before }).passed, false);

  const positive = before.slice();
  positive.fill(180, (2 * 10 + 2) * 3, (2 * 10 + 2) * 3 + 12);
  const result = compareSemanticObjectFrames({ ...common, beforeRgb: before, afterRgb: positive });
  assert.equal(result.passed, true);
  assert.deepEqual(result.changedEntityIds, ['row-a']);
});

test('scenes without declared object regions keep transformation status pending', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'narrative-pending-object-'));
  try {
    const brief = { ...legacyBrief(), playback: { preset: 'concise', transitionMs: 160, loop: true }, output: { width: 640, height: 360 } };
    const result = await createNarrative(brief, { outputDir: root, scene: testNarrativeScene });
    const control = result.evaluation.narrative.controls.find((item) => item.name === 'semantic-object-transformation');
    assert.equal(control?.status, 'pending');
    assert.equal(control?.passed, false);
    assert.equal(result.evaluation.narrative.status, 'pending');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
