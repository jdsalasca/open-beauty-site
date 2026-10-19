import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { narrativeHelpOptions, normalizeNarrativeBrief } from '../src/narrative/brief.js';
import { createNarrative } from '../src/narrative/create.js';
import { NarrativeError, type NarrativeBriefInput } from '../src/types/narrative.js';
import type { StyleSlug } from '../src/types.js';

const UPGRADE_STYLES: Array<{ style: StyleSlug; comparison: string; checklist: string }> = [
  { style: 'papercraft', comparison: 'table-rows', checklist: 'card-collection' },
  { style: 'brutalist', comparison: 'table-rows', checklist: 'card-collection' },
  { style: 'isotype', comparison: 'card-collection', checklist: 'card-collection' },
  { style: 'opart', comparison: 'card-collection', checklist: 'card-collection' },
  { style: 'renaissance', comparison: 'card-collection', checklist: 'card-collection' },
  { style: 'ukiyoe', comparison: 'card-collection', checklist: 'card-collection' },
];

function legacyBrief(style: StyleSlug, kind = 'comparison', states = ['unreviewed', 'flagged', 'review-ready']): NarrativeBriefInput {
  return {
    style,
    kind: 'narrative-gif',
    locale: 'es',
    audience: 'Personas revisoras',
    title: 'Una',
    workflowStatus: 'in-review',
    outcome: { mode: 'expected' },
    illustrative: true,
    phases: states.map((state, index) => ({
      id: `phase-${index + 1}`,
      label: `Fase ${index + 1}`,
      text: `Texto narrativo ${index + 1}`,
      visual: { kind, state },
    })),
    playback: { preset: 'concise', transitionMs: 160, loop: true },
    output: { preset: 'card-640x360', formats: ['gif', 'png'] },
    seed: 19,
  };
}

test('legacy kind/state sequences upgrade deterministically to each semantic scene vocabulary', () => {
  for (const mapping of UPGRADE_STYLES) {
    for (const kind of ['comparison', 'checklist'] as const) {
      const first = normalizeNarrativeBrief(legacyBrief(mapping.style, kind));
      const second = normalizeNarrativeBrief(legacyBrief(mapping.style, kind));
      const primitive = mapping[kind];
      assert.deepEqual(first, second, `${mapping.style}/${kind} upgrade is deterministic`);
      assert.equal(first.brief.phases[0]!.visual.semantic!.primitive, primitive, `${mapping.style}/${kind} chooses its declared scene primitive`);
      assert.equal(first.upgrade.applied, true, `${mapping.style}/${kind} records the applied upgrade`);
      assert.equal(first.upgrade.mapping, `legacy-state-v1:${mapping.style}:${kind}`);
      const statefulKind = primitive === 'table-rows' ? 'row' : 'card';
      assert.deepEqual(first.brief.phases.map((phase) => {
        const entity = phase.visual.semantic!.entities.find((candidate) => candidate.kind === statefulKind)!;
        return phase.visual.semantic!.states[entity.id];
      }), ['pending', 'flagged', 'ready-for-review']);
      const identity = first.brief.phases.map((phase) => phase.visual.semantic!.entities.map(({ id, kind: entityKind }) => [id, entityKind]));
      assert.ok(identity.slice(1).every((entities) => JSON.stringify(entities) === JSON.stringify(identity[0])), `${mapping.style}/${kind} keeps stable illustrative entities across phases`);
      for (const phase of first.brief.phases) {
        for (const entity of phase.visual.semantic!.entities) {
          assert.equal(entity.illustrative, true);
          assert.ok(entity.label, `${mapping.style}/${kind} entity text comes from its localized catalog`);
          assert.doesNotMatch(entity.label!, /\d/u, 'generic illustrative labels contain no invented numbers');
        }
      }
      assert.deepEqual(first.brief.phases.map((phase) => phase.text), ['Texto narrativo 1', 'Texto narrativo 2', 'Texto narrativo 3']);
    }
  }
});

test('legacyArt opts out and styles without semantic scenes keep their old illustration', () => {
  const optedOut = normalizeNarrativeBrief({ ...legacyBrief('papercraft'), legacyArt: true });
  assert.equal(optedOut.brief.phases[0]!.visual.semantic!.primitive, 'legacy-illustration');
  assert.deepEqual(optedOut.brief.phases[0]!.visual.semantic!.states, { 'legacy-object': 'unreviewed' });
  assert.deepEqual(optedOut.upgrade, {
    applied: false,
    mapping: 'legacy-art-opt-out',
    reason: 'Explicit legacyArt opt-out keeps the previous illustration.',
  });

  const unsupported = normalizeNarrativeBrief(legacyBrief('artdeco'));
  assert.equal(unsupported.brief.phases[0]!.visual.semantic!.primitive, 'legacy-illustration');
  assert.equal(unsupported.upgrade.applied, false);
  assert.equal(unsupported.upgrade.mapping, 'legacy-renderer');
  assert.equal(Object.hasOwn(unsupported.brief, 'legacyArt'), false, 'the default upgrade must not mutate the historical brief payload');
  assert.equal(unsupported.brief.phases[0]!.visual.state, 'unreviewed');
});

test('the new legacy-art CLI flag appears in narrative help and unknown legacy states still fail', () => {
  assert.ok(narrativeHelpOptions().some((line) => line.includes('--legacy-art')));
  assert.throws(() => normalizeNarrativeBrief(legacyBrief('papercraft', 'comparison', ['unknown', 'flagged', 'review-ready'])), (error: unknown) => {
    assert.ok(error instanceof NarrativeError);
    assert.equal(error.code, 'UNSUPPORTED_STATE');
    return true;
  });
});

test('table-row and card-collection upgrades pass decoded object controls and record manifest provenance', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'legacy-upgrade-render-'));
  try {
    const cases = [
      { style: 'papercraft', kind: 'comparison' },
      { style: 'papercraft', kind: 'checklist' },
      { style: 'brutalist', kind: 'checklist' },
      ...UPGRADE_STYLES.filter(({ style }) => style !== 'papercraft').map(({ style }) => ({ style, kind: 'comparison' })),
    ] as const;
    for (const { style, kind } of cases) {
      const brief = legacyBrief(style, kind);
      if (style === 'brutalist') brief.output = { preset: 'review-1280x720', formats: ['gif', 'png'] };
      if (style === 'brutalist' && kind === 'checklist') brief.workflowStatus = 'done';
      const result = await createNarrative(brief, { outputDir: path.join(root, `${style}-${kind}`) });
      const objectControls = result.evaluation.narrative.controls.filter((control) => control.name.startsWith('semantic-object-transformation:'));
      assert.ok(objectControls.length > 0, `${style}/${kind} declares decoded object transformation controls`);
      assert.ok(objectControls.every((control) => control.passed), `${style}/${kind} passes every decoded object transformation control: ${objectControls.map((control) => control.detail).join(' | ')}`);
      if (style === 'opart') {
        assert.ok(objectControls.every((control) => control.detail.includes('changed-state entities: legacy-item-a, legacy-item-b, legacy-item-c, legacy-item-d')), 'opart changes each illustrative unit across every hold and loop join');
      }
      const midpointControls = result.evaluation.narrative.controls.filter((control) => control.name.startsWith('semantic-object-midpoint:'));
      assert.ok(midpointControls.every((control) => control.passed), `${style}/${kind} passes each decoded transition midpoint control`);
      assert.ok(result.evaluation.automatedEvidence?.objectTransformationByFrame?.some((frame) => frame.measured && frame.passed), `${style}/${kind} records decoded region evidence`);
      assert.ok(result.evaluation['rendered-legibility'].controls.find((control) => control.name === 'composition-balance')?.passed, `${style}/${kind} keeps the balance proxy below revise`);
      assert.equal(result.upgrade.applied, true);
      const manifest = JSON.parse(await readFile(result.paths.manifest, 'utf8')) as {
        upgrade: { applied: boolean; mapping: string; reason: string };
        brief: { phases: Array<{ text: string }> };
      };
      assert.equal(manifest.upgrade.applied, true);
      assert.equal(manifest.upgrade.mapping, `legacy-state-v1:${style}:${kind}`);
      assert.deepEqual(manifest.brief.phases.map((phase) => phase.text), ['Texto narrativo 1', 'Texto narrativo 2', 'Texto narrativo 3']);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('text-only changes fail the object control for an upgraded legacy brief', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'legacy-upgrade-text-only-'));
  try {
    const brief = legacyBrief('papercraft', 'comparison', ['unreviewed', 'unreviewed', 'unreviewed']);
    const result = await createNarrative(brief, { outputDir: root });
    const objectControls = result.evaluation.narrative.controls.filter((control) => control.name.startsWith('semantic-object-transformation:'));
    assert.ok(objectControls.length > 0);
    assert.ok(objectControls.every((control) => control.passed === false));
    assert.equal(result.evaluation.narrative.status, 'fail', 'the decoded object controls fail the narrative evaluation for text-only changes');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('legacyArt reproduces the previous papercraft art byte-for-byte', async () => {
  const narrativeRoot = path.resolve('docs/narrative-gif');
  const index = JSON.parse(await readFile(path.join(narrativeRoot, 'compare', 'index.json'), 'utf8')) as {
    pairs: Array<{ style: StyleSlug; composition: string; before: { assets: { gif: string; png: string; contactSheet: string; manifest: string } } }>;
  };
  const root = await mkdtemp(path.join(os.tmpdir(), 'legacy-art-opt-out-'));
  try {
    const style = 'papercraft';
    const pair = index.pairs.find((entry) => entry.style === style && entry.composition === 'comparison');
    assert.ok(pair, `${style} has a historical comparison pack`);
    const oldManifestPath = path.join(narrativeRoot, 'compare', pair.before.assets.manifest);
    const oldManifest = JSON.parse(await readFile(oldManifestPath, 'utf8')) as { brief: NarrativeBriefInput };
    const result = await createNarrative(oldManifest.brief, { outputDir: root, legacyArt: true });
    const pendingControl = result.evaluation.narrative.controls.find((control) => control.name === 'semantic-object-transformation');
    assert.equal(pendingControl?.status, 'pending', 'the opt-out declares no semantic object regions, so its control remains pending');
    assert.ok(result.evaluation.automatedEvidence?.objectTransformationByFrame?.every((frame) => frame.regions.length === 0));
    for (const [generatedPath, relativePath] of [
      [result.paths.gif, pair.before.assets.gif],
      [result.paths.png, pair.before.assets.png],
      [result.paths.contactSheet, pair.before.assets.contactSheet],
    ] as const) {
      assert.deepEqual(await readFile(generatedPath), await readFile(path.join(narrativeRoot, 'compare', relativePath)), `${style} opt-out preserves ${path.basename(relativePath)}`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
