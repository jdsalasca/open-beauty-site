import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkSprintFidelity, createSprintKit, drawSprintFrame, parseSprintBrief } from '../src/sprint.js';
import { validateDeck } from '../src/validate.js';
import { styleSlugs } from '../src/styles/presets.js';
import { RICH_SPRINT } from './support/sprint-fixture.js';

const SMALL_GIF = { gifWidth: 240, gifHeight: 240, gifFps: 8, gifDuration: 1 };

async function tempDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

test('the rich kit turns stories, risks and actions into real slides', async () => {
  const dir = await tempDir('sprint-rich-');
  try {
    const kit = await createSprintKit(RICH_SPRINT, dir, SMALL_GIF);
    const review = await readFile(kit.review.html, 'utf8');
    const retro = await readFile(kit.retro.html, 'utf8');
    const planning = await readFile(kit.planning.html, 'utf8');

    for (const story of RICH_SPRINT.stories) assert.ok(review.includes(story.title), `review is missing "${story.title}"`);
    for (const risk of RICH_SPRINT.risks) assert.ok(review.includes(risk.title), `review is missing risk "${risk.title}"`);
    for (const action of RICH_SPRINT.retro.actions) assert.ok(retro.includes(action.what), `retro is missing action "${action.what}"`);
    for (const item of RICH_SPRINT.capacity) assert.ok(planning.includes(item.person), `planning is missing "${item.person}"`);
    assert.ok(review.includes('S14'), 'review must name the sprint');
    assert.ok(review.includes('Umbral'), 'brand must come from team.brand');
    assert.ok(review.includes('data-sprint="velocity"'), 'review needs the velocity chart');
    assert.ok(review.includes('data-sprint="burndown"'), 'review needs the burndown chart');
    assert.ok(retro.includes('data-sprint="retro-columns"'), 'retro needs its three columns');
    assert.ok(retro.includes('data-sprint="retro-actions"'), 'retro needs the action list');
    assert.ok(planning.includes('data-sprint="capacity"'), 'planning needs capacity bars');
    assert.ok(!review.includes('[object Object]'));
    assert.ok(!retro.includes('[object Object]'));
    assert.ok(!planning.includes('[object Object]'));

    for (const item of [kit.review, kit.retro, kit.planning]) {
      assert.equal(item.grade, 'A', `${path.basename(item.html)} scored ${item.score}`);
      assert.ok(item.score >= 90, `${path.basename(item.html)} scored ${item.score}`);
    }
    assert.deepEqual(
      kit.issues.filter((issue) => issue.severity === 'error'),
      [],
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('unknown brief fields surface as warnings on the kit result', async () => {
  const dir = await tempDir('sprint-warn-');
  try {
    const kit = await createSprintKit({ ...RICH_SPRINT, velocity_: 3 }, dir, SMALL_GIF);
    const warning = kit.issues.find((issue) => issue.code === 'sprint-unknown-field');
    assert.ok(warning, 'expected a sprint-unknown-field issue');
    assert.match(warning.message, /velocity_/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('a legacy minimal brief still renders three complete decks', async () => {
  const dir = await tempDir('sprint-legacy-');
  try {
    const kit = await createSprintKit({ sprint: '15', style: 'isotype', team: 'Equipo Open Beauty', locale: 'es' }, dir, SMALL_GIF);
    for (const item of [kit.review, kit.retro, kit.planning]) {
      const html = await readFile(item.html, 'utf8');
      assert.ok(html.includes('Equipo Open Beauty'), 'legacy team must reach the brand');
      assert.ok(!html.includes('[object Object]'));
      assert.ok(['A', 'B'].includes(item.grade), `${path.basename(item.html)} scored ${item.score}`);
      assert.ok(item.score >= 90, `${path.basename(item.html)} scored ${item.score}`);
    }
    // The minimal brief has no retro data, so the template falls back to one
    // filler body per points slide. The repetition check must catch it instead
    // of letting a filler page claim an A.
    const retro = validateDeck(await readFile(kit.retro.html, 'utf8'), 'isotype');
    assert.ok(
      retro.issues.some((issue) => issue.code === 'repeated-filler'),
      'the repeated fallback body must be reported',
    );
    assert.notEqual(retro.grade, 'A');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('the output folder is honoured and holds every artifact', async () => {
  const dir = await tempDir('sprint-out-');
  const target = path.join(dir, 'custom', 'folder');
  try {
    const kit = await createSprintKit(RICH_SPRINT, target, SMALL_GIF);
    assert.equal(kit.directory, path.resolve(target));
    for (const item of [kit.review, kit.retro, kit.planning]) {
      assert.equal(path.dirname(item.html), path.resolve(target));
      assert.ok(existsSync(item.html));
      assert.ok(existsSync(item.gif));
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('default output folders never collide between parallel runs', async () => {
  const cwd = process.cwd();
  const sandbox = await tempDir('sprint-collision-');
  try {
    process.chdir(sandbox);
    const [first, second] = await Promise.all([
      createSprintKit({ ...RICH_SPRINT, style: 'nature' }, undefined, SMALL_GIF),
      createSprintKit({ ...RICH_SPRINT, style: 'nature' }, undefined, SMALL_GIF),
    ]);
    assert.notEqual(first.directory, second.directory);
    assert.ok(existsSync(first.review.html));
    assert.ok(existsSync(second.review.html));
    assert.ok(first.directory.includes('cuadrilla-umbral'));
    assert.ok(first.directory.includes('s14'));
  } finally {
    process.chdir(cwd);
    await rm(sandbox, { recursive: true, force: true });
  }
});

test('the same brief and output produce byte-identical HTML and GIFs', async () => {
  const dir = await tempDir('sprint-determinism-');
  try {
    const first = await createSprintKit(RICH_SPRINT, path.join(dir, 'a'), SMALL_GIF);
    const second = await createSprintKit(RICH_SPRINT, path.join(dir, 'b'), SMALL_GIF);
    for (const key of ['review', 'retro', 'planning'] as const) {
      const a = await readFile(first[key].html);
      const b = await readFile(second[key].html);
      assert.ok(a.equals(b), `${key} HTML differs between runs`);
      const ga = await readFile(first[key].gif);
      const gb = await readFile(second[key].gif);
      assert.ok(ga.equals(gb), `${key} GIF differs between runs`);
      assert.equal(ga.subarray(0, 6).toString('latin1').startsWith('GIF8'), true);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('every style produces an A kit with its data and GIFs', async () => {
  const dir = await tempDir('sprint-styles-');
  try {
    for (const style of styleSlugs) {
      const kit = await createSprintKit({ ...RICH_SPRINT, style }, path.join(dir, style), SMALL_GIF);
      for (const item of [kit.review, kit.retro, kit.planning]) {
        assert.equal(item.grade, 'A', `${style}/${path.basename(item.html)} scored ${item.score}`);
        assert.ok(item.score >= 90, `${style}/${path.basename(item.html)} scored ${item.score}`);
        assert.ok(existsSync(item.gif), `${style} is missing ${path.basename(item.gif)}`);
      }
      assert.deepEqual(
        kit.issues.filter((issue) => issue.severity === 'error'),
        [],
        `${style} kit reported errors`,
      );
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('the review GIF animates the velocity data, not only the decoration', () => {
  const { data } = parseSprintBrief(RICH_SPRINT);
  const start = drawSprintFrame('isotype', 'review', data, 0, 320, 320);
  const end = drawSprintFrame('isotype', 'review', data, 0.9, 320, 320);
  assert.ok(!start.every((value, index) => value === end[index]), 'review frames must animate');

  const different = parseSprintBrief({
    ...RICH_SPRINT,
    velocity: RICH_SPRINT.velocity.map((item) => ({ ...item, done: Math.max(0, item.committed - item.done) })),
  }).data;
  const changed = drawSprintFrame('isotype', 'review', different, 0.9, 320, 320);
  assert.ok(!end.every((value, index) => value === changed[index]), 'different velocity data must change the frame');
});

test('fidelity issues list every missing story, risk and action', () => {
  const { data } = parseSprintBrief(RICH_SPRINT);
  const issues = checkSprintFidelity(data, { review: '<html></html>', retro: '<html></html>', planning: '<html></html>' });
  const expected = data.stories.length + data.risks.length + data.retro.actions.length;
  assert.equal(issues.length, expected);
  assert.ok(issues.every((issue) => issue.code === 'sprint-fidelity'));
  assert.ok(issues.some((issue) => issue.message.includes('SC-101')));
});
