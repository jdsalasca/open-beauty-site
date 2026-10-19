import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createNarrative } from '../src/narrative/create.js';
import { verifyNarrativeGif } from '../src/narrative/verify-gif.js';
import { narrativeCapabilityReport } from '../src/narrative/capabilities.js';

type Primitive = 'table-rows' | 'card-collection' | 'counter' | 'file-download';

function semanticBrief(primitive: Primitive, locale: 'es' | 'en', square: boolean, style: 'papercraft' | 'brutalist' = 'papercraft') {
  const phases = primitive === 'table-rows' ? [
    [{ table: 'default', 'row-a': 'original', 'row-b': 'duplicate' }, [], []],
    [{ table: 'default', 'row-a': 'original', 'row-b': 'flagged' }, [{ entityId: 'row-b', type: 'detect' }, { entityId: 'row-b', type: 'mark-duplicate' }], []],
    [{ table: 'default', 'row-a': 'original', 'row-b': 'rejected' }, [{ entityId: 'row-b', type: 'reject' }], []],
  ] : primitive === 'card-collection' ? [
    [{ collection: 'open', 'card-a': 'default', 'card-b': 'member', 'card-c': 'member' }, [], ['b', 'c'].map((id) => ({ kind: 'member-of', from: `card-${id}`, to: 'collection' }))],
    [{ collection: 'counted', 'card-a': 'selected', 'card-b': 'member', 'card-c': 'member' }, [{ entityId: 'card-a', type: 'add-to-collection' }], ['a', 'b', 'c'].map((id) => ({ kind: 'member-of', from: `card-${id}`, to: 'collection' }))],
    [{ collection: 'open', 'card-a': 'default', 'card-b': 'member', 'card-c': 'member' }, [{ entityId: 'card-a', type: 'remove-from-collection' }], ['b', 'c'].map((id) => ({ kind: 'member-of', from: `card-${id}`, to: 'collection' }))],
  ] : primitive === 'counter' ? [
    [{ count: 'value', 'item-a': 'default', 'item-b': 'default', 'item-c': 'default', 'item-d': 'default' }, [], ['item-a', 'item-b', 'item-c'].map((id) => ({ kind: 'counts', from: 'count', to: id }))],
    [{ count: 'increased', 'item-a': 'default', 'item-b': 'default', 'item-c': 'default', 'item-d': 'default' }, [{ entityId: 'count', type: 'count-changes' }], ['item-a', 'item-b', 'item-c', 'item-d'].map((id) => ({ kind: 'counts', from: 'count', to: id }))],
    [{ count: 'decreased', 'item-a': 'default', 'item-b': 'default', 'item-c': 'default', 'item-d': 'default' }, [], ['item-a', 'item-b'].map((id) => ({ kind: 'counts', from: 'count', to: id }))],
  ] : [
    [{ file: 'downloading' }, [{ entityId: 'file', type: 'start-download' }], []],
    [{ file: 'failed' }, [{ entityId: 'file', type: 'fail' }], []],
    [{ file: 'retrying' }, [{ entityId: 'file', type: 'retry' }], []],
    [{ file: 'complete' }, [{ entityId: 'file', type: 'complete' }], []],
  ];
  const entities = primitive === 'table-rows' ? [
    { id: 'table', kind: 'table' },
    { id: 'row-a', kind: 'row', label: 'REF-84', value: 'REF-84' },
    { id: 'row-b', kind: 'row', label: 'REF-84', value: 'REF-84' },
  ] : primitive === 'card-collection' ? [
    { id: 'collection', kind: 'collection', label: locale === 'en' ? 'Registry' : 'Registro' },
    { id: 'card-a', kind: 'card', label: 'A' },
    { id: 'card-b', kind: 'card', label: 'B' },
    { id: 'card-c', kind: 'card', label: 'C' },
  ] : primitive === 'counter' ? [
    { id: 'count', kind: 'counter', value: 3 },
    { id: 'item-a', kind: 'row', label: 'A' },
    { id: 'item-b', kind: 'row', label: 'B' },
    { id: 'item-c', kind: 'row', label: 'C' },
    { id: 'item-d', kind: 'row', label: 'D' },
  ] : [{ id: 'file', kind: 'file', label: 'informe.pdf', progress: 0.24 }];
  const relations = primitive === 'table-rows' ? [{ kind: 'duplicate-of', from: 'row-b', to: 'row-a' }] : [];
  const values = primitive === 'counter' ? [3, 4, 2] : [];
  return {
    style, subfamily: style === 'papercraft' ? 'editorial' : 'documentary', kind: 'narrative-gif', locale, audience: 'Equipo', title: 'Fixture',
    workflowStatus: 'in-review', outcome: { mode: 'expected' }, illustrative: true,
    badgePolicy: 'none',
    playback: { preset: 'concise', minReadableHoldMs: 2_000, transitionMs: 400, loop: true },
    output: square ? { width: 640, height: 640 } : { width: 640, height: 360 },
    phases: phases.map(([states, actions, phaseRelations], index) => ({
      id: `phase-${index + 1}`,
      label: index === phases.length - 1
        ? locale === 'en' ? 'Expected result' : 'Resultado esperado'
        : (locale === 'en' ? ['Before', 'Change', 'Retry'] : ['Antes', 'Cambio', 'Reintento'])[index],
      text: (locale === 'en' ? ['Rows stay visible.', 'State changes.', 'State is marked.', 'Still pending.'] : ['Filas aún visibles.', 'Cambió el estado.', 'Estado señalado.', 'Sigue pendiente.'])[index],
      visual: {
        kind: 'comparison',
        state: ['before', 'flagged', 'review-ready', 'review-ready'][index],
        semantic: {
          primitive,
          illustrative: true,
        entities: entities.map((entity) => entity.id === 'count' ? { ...entity, value: values[index] } : entity.id === 'file' ? { ...entity, label: locale === 'en' ? 'report.pdf' : 'informe.pdf', progress: [0.18, 0.42, 0.42, 1][index] } : entity),
          relations: primitive === 'counter' ? phaseRelations : primitive === 'card-collection' ? phaseRelations : relations,
          states,
          actions,
        },
      },
    })),
  };
}

test('papercraft and brutalist semantic primitives render decoded object changes in every supported aspect and locale', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'narrative-semantic-matrix-'));
  try {
    for (const style of ['papercraft', 'brutalist'] as const) {
      for (const primitive of ['table-rows', 'card-collection', 'counter', 'file-download'] as const) {
        for (const square of [false, true]) {
          for (const locale of ['es', 'en'] as const) {
            await t.test(`${style}/${primitive} ${square ? '1:1' : '16:9'} ${locale}`, async () => {
            const brief = semanticBrief(primitive, locale, square, style);
            const result = await createNarrative(brief, { outputDir: path.join(root, `${primitive}-${square}-${locale}`) });
            const decoded = verifyNarrativeGif(await readFile(result.paths.gif), []);
            assert.equal(result.evaluation['technical-integrity'].status, 'pass');
            assert.equal(decoded.integrity.valid, true);
            assert.equal(decoded.width, square ? 640 : 640);
            assert.equal(decoded.height, square ? 640 : 360);
            const transformations = result.evaluation.narrative.controls.filter((control) => control.name.startsWith('semantic-object-transformation:'));
            assert.ok(transformations.some((control) => control.passed), 'decoded entity-region pixels prove at least one state transformation');
            assert.ok(transformations.every((control) => /changed-state entities:/u.test(control.detail)));
            const midpoints = result.evaluation.narrative.controls.filter((control) => control.name.startsWith('semantic-object-midpoint:'));
            assert.equal(midpoints.length, brief.phases.length, 'every transition midpoint and the last-to-first loop join are evaluated');
            assert.ok(midpoints.every((control) => /decoded object diff/u.test(control.detail)), 'every midpoint reports decoded object-region metrics, including valid repeated states');
            const balance = result.evaluation['rendered-legibility'].controls.find((control) => control.name === 'composition-balance');
            assert.match(balance?.detail ?? '', /Per-frame:/u);
            assert.match(balance?.detail ?? '', locale === 'en' ? /transition midpoint/u : /punto medio de transición/u);
            assert.match(balance?.detail ?? '', locale === 'en' ? /loop join/u : /unión del ciclo/u);
            const textLegibility = result.evaluation['rendered-legibility'].controls.find((control) => control.name === 'semantic-text-legibility');
            assert.equal(textLegibility?.passed, true, textLegibility?.detail);
            assert.match(textLegibility?.detail ?? '', /minimum effective text >=14px:/u);
            const report = narrativeCapabilityReport({ style });
            const cell = report.cells.find((candidate) => candidate.primitive === primitive && candidate.aspect === (square ? '1:1' : '16:9') && candidate.locale === locale);
            assert.equal(cell?.status, 'supported');
          });
          }
        }
      }
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('review and expected-result state changes leave a decoded record in the object', async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'narrative-semantic-record-marks-'));
  try {
    for (const style of ['papercraft', 'brutalist'] as const) {
      for (const locale of ['es', 'en'] as const) {
        for (const primitive of ['table-rows', 'counter'] as const) {
          await t.test(`${style}/${primitive}/${locale}`, async () => {
            const brief = semanticBrief(primitive, locale, false, style);
            const final = structuredClone(brief.phases.at(-1)!);
            final.id = 'phase-recorded-result';
            final.label = locale === 'en' ? 'Expected result' : 'Resultado esperado';
            final.text = locale === 'en' ? 'Mark remains in the ledger.' : 'La marca queda en el registro.';
            if (primitive === 'table-rows') final.visual.semantic.states.table = 'reviewed';
            else final.visual.semantic.states.count = 'pending';
            brief.phases.push(final);

            const result = await createNarrative(brief, { outputDir: path.join(root, `${style}-${primitive}-${locale}`) });
            const transformation = result.evaluation.narrative.controls.find((control) => control.name === 'semantic-object-transformation:phase-3 → phase-recorded-result hold');
            assert.equal(transformation?.passed, true, transformation?.detail);
            assert.match(transformation?.detail ?? '', primitive === 'table-rows' ? /changed-state entities: table/u : /changed-state entities: count/u);
          });
        }
      }
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('art-only creates a separate GIF without the narrative copy and retains object-region review', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'narrative-art-only-'));
  try {
    const brief = semanticBrief('table-rows', 'en', false);
    const result = await createNarrative(brief, { outputDir: root, artOnly: true });
    const manifest = JSON.parse(await readFile(result.paths.manifest, 'utf8')) as { artOnly: boolean; semanticObjectCaptures: Array<{ label: string; regions: unknown[] }>; phaseCaptures: Array<{ labels: string[] }> };
    assert.equal(manifest.artOnly, true);
    assert.match(result.paths.gif, /-art-only\.gif$/u);
    assert.ok(manifest.semanticObjectCaptures.some((capture) => capture.label.includes('transition midpoint')));
    assert.ok(manifest.phaseCaptures.some((capture) => capture.labels.some((label) => label.includes('transition midpoint'))));
    assert.ok(manifest.phaseCaptures.some((capture) => capture.labels.some((label) => label.includes('loop join'))));
    assert.ok(result.evaluation.narrative.controls.some((control) => control.name.startsWith('semantic-object-transformation:') && control.passed));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
