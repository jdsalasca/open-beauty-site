import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createNarrative } from '../src/narrative/create.js';
import { narrativeCapabilityReport } from '../src/narrative/capabilities.js';
import { verifyNarrativeGif } from '../src/narrative/verify-gif.js';

type Locale = 'es' | 'en';
type Style = 'renaissance' | 'ukiyoe';
type Primitive = 'card-collection' | 'counter' | 'file-download';

function scenario(style: Style, primitive: Primitive, locale: Locale) {
  const english = locale === 'en';
  const renaissance = style === 'renaissance';
  const checklist = primitive === 'counter' || primitive === 'card-collection' && style === 'ukiyoe';
  const phases = primitive === 'file-download'
    ? [
      { state: 'pending', progress: 0, action: undefined },
      { state: 'downloading', progress: 0.55, action: 'start-download' },
      { state: 'failed', progress: 0.55, action: 'fail' },
      { state: 'retrying', progress: 0.72, action: 'retry' },
    ]
    : primitive === 'card-collection'
      ? renaissance
        ? [0, 1, 4].map((count) => ({ count }))
        : [0, 1, 3].map((count) => ({ count }))
      : [1, 2, 4].map((count) => ({ count }));
  const entities = primitive === 'file-download'
    ? [{ id: 'download', kind: 'file', label: english ? 'field-notes.pdf' : 'notas-de-campo.pdf' }]
    : primitive === 'card-collection'
      ? [
        { id: 'collection', kind: 'collection', label: renaissance ? (english ? 'Painted register' : 'Registro pintado') : (english ? 'Coastal stations' : 'Estaciones costeras') },
        ...Array.from({ length: renaissance ? 4 : 3 }, (_, index) => ({
          id: renaissance ? `panel-${index + 1}` : `station-${index + 1}`,
          kind: 'card',
          label: renaissance ? (english ? `Fragment ${index + 1}` : `Fragmento ${index + 1}`) : `${english ? 'Station' : 'Estación'} ${String.fromCharCode(65 + index)}`,
        })),
      ]
      : [
        { id: 'count', kind: 'counter', value: 1 },
        ...Array.from({ length: 4 }, (_, index) => ({ id: `piece-${index + 1}`, kind: 'card', label: `${english ? 'Panel' : 'Panel'} ${index + 1}` })),
      ];

  return {
    style,
    kind: 'narrative-gif',
    locale,
    audience: english ? 'Review team' : 'Equipo revisor',
    title: renaissance ? (english ? 'Fragments found' : 'Fragmentos hallados') : (english ? 'Along the coast' : 'Por la costa'),
    workflowStatus: 'in-review',
    outcome: { mode: 'expected' },
    illustrative: true,
    badgePolicy: 'none',
    playback: { preset: 'concise', minReadableHoldMs: 2_000, transitionMs: 300, loop: true },
    output: { width: 1280, height: 720, preset: 'review-1280x720', formats: ['gif', 'png'] },
    seed: 41,
    phases: phases.map((phase, index) => {
      const count = 'count' in phase ? phase.count : undefined;
      const memberIds = count === undefined ? [] : Array.from({ length: count }, (_, cardIndex) => renaissance && primitive === 'card-collection' ? `panel-${cardIndex + 1}` : primitive === 'card-collection' ? `station-${cardIndex + 1}` : `piece-${cardIndex + 1}`);
      const states = primitive === 'file-download'
        ? { download: (phase as { state: string }).state }
        : primitive === 'counter'
          ? { count: index === 0 ? 'value' : 'increased', ...Object.fromEntries(Array.from({ length: 4 }, (_, cardIndex) => [`piece-${cardIndex + 1}`, memberIds.includes(`piece-${cardIndex + 1}`) ? 'member' : 'default'])) }
          : { collection: memberIds.length ? 'counted' : 'open', ...Object.fromEntries(entities.filter((entity) => entity.kind === 'card').map((entity) => [entity.id, memberIds.includes(entity.id) ? 'member' : 'default'])) };
      const relations = primitive === 'counter'
        ? memberIds.map((id) => ({ kind: 'counts', from: 'count', to: id }))
        : memberIds.map((id) => ({ kind: 'member-of', from: id, to: 'collection' }));
      const actions = primitive === 'file-download'
        ? (phase as { action?: string }).action ? [{ entityId: 'download', type: (phase as { action: string }).action }] : []
        : memberIds.filter((id) => index === 0 || !((phases[index - 1] as { count?: number }).count ?? 0) || Number(id.match(/\d+$/u)?.[0]) >= ((phases[index - 1] as { count?: number }).count ?? 0) + 1).map((id) => ({ entityId: primitive === 'counter' ? 'count' : id, type: primitive === 'counter' ? 'count-changes' : 'add-to-collection' }));
      const semanticEntities = entities.map((entity) => entity.id === 'count' && count !== undefined ? { ...entity, value: count } : entity.id === 'download' ? { ...entity, progress: (phase as { progress?: number }).progress } : entity);
      return {
        id: ['discovered', 'gathered', 'ordered', 'retry'][index] ?? `phase-${index + 1}`,
        label: (english ? ['Found', 'Gathered', 'Resolved', 'Retry'] : ['Hallazgo', 'Recogida', 'Orden', 'Reintento'])[index]!,
        text: english ? ['Pieces rest outside their places.', 'Identified pieces enter the composition.', 'The arrangement reaches a calm order.', 'The file resumes from the failure point.'][index]! : ['Las piezas aguardan fuera de sitio.', 'Las piezas identificadas entran en la composición.', 'El conjunto alcanza un orden sereno.', 'El archivo retoma desde el punto de fallo.'][index]!,
        visual: {
          kind: checklist ? 'checklist' : 'comparison',
          state: ['unreviewed', 'flagged', 'flagged', 'review-ready'][index]!,
          semantic: { primitive, illustrative: true, entities: semanticEntities, relations, states, actions },
        },
      };
    }),
  };
}

const cases: Array<{ style: Style; primitive: Primitive }> = [
  { style: 'renaissance', primitive: 'card-collection' },
  { style: 'renaissance', primitive: 'counter' },
];

for (const item of cases) {
  for (const locale of ['es', 'en'] as const) {
    test(`${item.style}/${item.primitive}/16:9/${locale} has decoded object-region proof`, async () => {
      const root = await mkdtemp(path.join(os.tmpdir(), 'narrative-style-semantic-'));
      try {
        const cell = narrativeCapabilityReport({ style: item.style }).cells.find((candidate) => candidate.primitive === item.primitive && candidate.aspect === '16:9' && candidate.locale === locale);
        assert.equal(cell?.status, 'supported');
        assert.match(cell?.reason ?? '', /narrative-style-semantic\.test\.ts/u);
        const brief = scenario(item.style, item.primitive, locale);
        if (item.style === 'renaissance' && item.primitive === 'card-collection') {
          for (const phase of brief.phases.slice(1)) phase.visual.semantic.entities.reverse();
        }
        const result = await createNarrative(brief, { outputDir: root });
        const manifest = JSON.parse(await readFile(result.paths.manifest, 'utf8')) as { semanticObjectCaptures: Array<{ regions: Array<{ entityId: string }> }> };
        const decoded = verifyNarrativeGif(await readFile(result.paths.gif), []);
        assert.equal(decoded.integrity.valid, true);
        assert.ok(manifest.semanticObjectCaptures.every((capture) => capture.regions.length > 0));
        const controls = result.evaluation.narrative.controls.filter((control) => control.name.startsWith('semantic-object-transformation:'));
        assert.ok(controls.some((control) => control.passed), 'decoded pixels inside declared entity regions show the actual transformation');
        assert.equal(result.evaluation['technical-integrity'].status, 'pass');
        if (item.style === 'ukiyoe') {
          const balance = result.evaluation.readability.controls.find((control) => control.name === 'composition-balance');
          assert.equal(balance?.passed, true, balance?.detail);
          assert.match(balance?.detail ?? '', /largest empty rectangle (?:[0-9]|1[0-9]|2[01])%/u);
        }
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    });
  }
}

for (const item of cases) {
  test(`${item.style}/${item.primitive} art-only holds prove the object change without narrative copy`, async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'narrative-style-art-only-'));
    try {
      const result = await createNarrative(scenario(item.style, item.primitive, 'es'), { outputDir: root, artOnly: true });
      const manifest = JSON.parse(await readFile(result.paths.manifest, 'utf8')) as { artOnly: boolean; semanticObjectCaptures: Array<{ kind: string; label: string }> };
      assert.equal(manifest.artOnly, true);
      assert.match(result.paths.gif, /-art-only\.gif$/u);
      const transformations = result.evaluation.narrative.controls.filter((control) => control.name.startsWith('semantic-object-transformation:'));
      assert.ok(transformations.some((control) => control.passed), 'decoded art-only object regions show the requested change');
      assert.ok(manifest.semanticObjectCaptures.some((capture) => capture.kind === 'hold'));
      assert.ok(manifest.semanticObjectCaptures.some((capture) => /loop join|unión del ciclo/u.test(capture.label)));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}

for (const item of [cases[0]!]) {
  test(`${item.style} text-only changes do not pass its object transformation controls`, async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'narrative-style-text-negative-'));
    try {
      const brief = scenario(item.style, item.primitive, 'en');
      const initial = structuredClone(brief.phases[0]!.visual.semantic);
      for (const phase of brief.phases) {
        phase.visual.semantic = structuredClone(initial);
        phase.visual.semantic.actions = [];
      }
      const result = await createNarrative(brief, { outputDir: root });
      const controls = result.evaluation.narrative.controls.filter((control) => control.name.startsWith('semantic-object-transformation:'));
      assert.ok(controls.length >= 3);
      assert.ok(controls.every((control) => !control.passed), controls.map((control) => control.detail).join('\n'));
      assert.ok(controls.every((control) => /changed-state entities: none/u.test(control.detail)));
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
}
