import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkSprintFidelity, createSprintGif, createSprintKit, drawSprintFrame, parseSprintBrief } from '../src/sprint.js';
import { styleSlugs } from '../src/styles/presets.js';
import { decodeGif, meanFrameDiff } from './support/gif-frames.js';
import { LONG_SPRINT, RICH_SPRINT } from './support/sprint-fixture.js';

const SMALL_GIF = { size: 240, fps: 8, frames: 8 };

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
      assert.equal(item.grade, 'A', `${path.basename(item.html)} scored ${item.score}`);
    }
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
  const end = drawSprintFrame('isotype', 'review', data, 0.25, 320, 320);
  assert.ok(!start.every((value, index) => value === end[index]), 'review frames must animate');

  const different = parseSprintBrief({
    ...RICH_SPRINT,
    velocity: RICH_SPRINT.velocity.map((item) => ({ ...item, done: Math.max(0, item.committed - item.done) })),
  }).data;
  const changed = drawSprintFrame('isotype', 'review', different, 0.25, 320, 320);
  assert.ok(!end.every((value, index) => value === changed[index]), 'different velocity data must change the frame');
});

test('the review renders every risk even when the stories fill the deck', async () => {
  const dir = await tempDir('sprint-risks-');
  try {
    const kit = await createSprintKit(LONG_SPRINT, dir, SMALL_GIF);
    const review = await readFile(kit.review.html, 'utf8');
    const cards = review.match(/<article class="sprint-risk">/g) ?? [];
    assert.equal(cards.length, LONG_SPRINT.risks.length, 'every risk must keep its card');
    for (const risk of LONG_SPRINT.risks) assert.ok(review.includes(risk.title), `review is missing risk "${risk.title}"`);
    assert.deepEqual(
      kit.issues.filter((issue) => issue.severity === 'error'),
      [],
      'fidelity must not report missing risks',
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('legacy blockers are rendered as a risk-like list, not dropped', async () => {
  const dir = await tempDir('sprint-blockers-');
  try {
    const blocker = 'El tablero heredado duplica la fuente de verdad y frena cada cierre.';
    const kit = await createSprintKit({ ...RICH_SPRINT, blockers: [blocker] }, dir, SMALL_GIF);
    const review = await readFile(kit.review.html, 'utf8');
    assert.ok(review.includes(blocker), 'blockers must reach the review HTML');
    assert.ok(review.includes('data-sprint="blockers"'), 'blockers get their own labelled block');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('the retrospective title is derived from the team and sprint', async () => {
  const dir = await tempDir('sprint-retro-title-');
  try {
    const kit = await createSprintKit(RICH_SPRINT, dir, SMALL_GIF);
    const retro = await readFile(kit.retro.html, 'utf8');
    assert.ok(retro.includes('Umbral · Retrospectiva S14'), 'retro title should name brand and sprint');
    assert.ok(!retro.includes('Qué aprendimos cuando el plan se movió.'), 'the generic default title is gone');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('every sprint GIF opens composed and wraps within 1.5x the median step', async () => {
  const dir = await tempDir('sprint-loop-');
  try {
    const { data } = parseSprintBrief(LONG_SPRINT);
    for (const style of styleSlugs) {
      for (const kind of ['review', 'retro', 'planning'] as const) {
        const target = path.join(dir, `${style}-${kind}.gif`);
        const result = await createSprintGif(style, kind, data, target, { size: 240, fps: 10, frames: 12 });
        const decoded = decodeGif(await readFile(target));
        assert.equal(decoded.frames.length, result.frames, `${style}/${kind}: every frame is encoded`);
        const consecutive: number[] = [];
        for (let index = 1; index < decoded.frames.length; index += 1) {
          consecutive.push(meanFrameDiff(decoded.frames[index - 1]!, decoded.frames[index]!));
        }
        const sorted = [...consecutive].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)]!;
        const wrap = meanFrameDiff(decoded.frames[decoded.frames.length - 1]!, decoded.frames[0]!);
        assert.ok(median > 0.02, `${style}/${kind}: the sprint data must animate (median ${median.toFixed(3)})`);
        assert.ok(
          wrap <= median * 1.5,
          `${style}/${kind}: wrap diff ${wrap.toFixed(2)} exceeds 1.5x the median step ${median.toFixed(2)}`,
        );
        const middle = decoded.frames[Math.floor(decoded.frames.length / 2)]!;
        assert.ok(
          meanFrameDiff(decoded.frames[0]!, middle) > 0.2,
          `${style}/${kind}: frame 0 must be the composed poster, not a blank start`,
        );
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('one style of sprint GIFs stays under 2.5 MiB at default settings', async () => {
  const dir = await tempDir('sprint-size-');
  try {
    const { data } = parseSprintBrief(LONG_SPRINT);
    for (const style of styleSlugs) {
      let total = 0;
      for (const kind of ['review', 'retro', 'planning'] as const) {
        const result = await createSprintGif(style, kind, data, path.join(dir, `${style}-${kind}.gif`));
        assert.equal(result.width, 640, `${style}: default width`);
        assert.equal(result.height, 640, `${style}: default height`);
        total += result.bytes;
      }
      assert.ok(total <= 2.5 * 1024 * 1024, `${style}: ${(total / 1024).toFixed(0)} KiB exceeds the 2.5 MiB budget`);
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('sprint GIF size, fps and frame count are clamped', async () => {
  const dir = await tempDir('sprint-clamp-');
  try {
    const { data } = parseSprintBrief(RICH_SPRINT);
    const target = path.join(dir, 'clamped.gif');
    const result = await createSprintGif('isotype', 'review', data, target, { size: 10, fps: 99, frames: 2 });
    assert.equal(result.width, 240);
    assert.equal(result.height, 240);
    assert.equal(result.fps, 30);
    assert.equal(result.frames, 8);
    const custom = await createSprintGif('isotype', 'review', data, target, { width: 480, height: 240, fps: 12, frames: 9 });
    assert.equal(custom.width, 480);
    assert.equal(custom.height, 240);
    assert.equal(custom.fps, 12);
    assert.equal(custom.frames, 9);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('fidelity issues list every missing story, risk and action', () => {
  const { data } = parseSprintBrief(RICH_SPRINT);
  const issues = checkSprintFidelity(data, { review: '<html></html>', retro: '<html></html>', planning: '<html></html>' });
  const expected = data.stories.length + data.risks.length + data.retro.actions.length;
  assert.equal(issues.length, expected);
  assert.ok(issues.every((issue) => issue.code === 'sprint-fidelity'));
  assert.ok(issues.some((issue) => issue.message.includes('SC-101')));
});
