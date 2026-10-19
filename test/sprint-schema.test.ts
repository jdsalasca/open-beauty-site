import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSprintBrief, SprintBriefError } from '../src/sprint.js';
import { RICH_SPRINT } from './support/sprint-fixture.js';

test('a legacy minimal brief still parses', () => {
  const { data, warnings } = parseSprintBrief({ sprint: '15', style: 'nature' });
  assert.equal(data.sprint.id, '15');
  assert.equal(data.style, 'nature');
  assert.equal(data.team.name, 'Open Beauty');
  assert.deepEqual(data.stories, []);
  assert.deepEqual(data.velocity, []);
  assert.deepEqual(warnings, []);
});

test('legacy team strings and dates keep working', () => {
  const { data } = parseSprintBrief({ sprint: '15', style: 'nature', team: 'Equipo Atlas', date: '2026-10-09' });
  assert.equal(data.team.name, 'Equipo Atlas');
  assert.equal(data.date, '2026-10-09');
});

test('a rich brief normalizes every field', () => {
  const { data, warnings } = parseSprintBrief(RICH_SPRINT);
  assert.equal(data.team.name, 'Cuadrilla Umbral');
  assert.equal(data.team.brand, 'Umbral');
  assert.equal(data.sprint.id, 'S14');
  assert.equal(data.sprint.start, '2026-09-28');
  assert.equal(data.sprint.goal, 'Cerrar el ciclo de lecturas del norte');
  assert.equal(data.stories.length, 5);
  assert.equal(data.stories[0]?.status, 'done');
  assert.equal(data.velocity.length, 5);
  assert.equal(data.burndown.length, 7);
  assert.equal(data.risks.length, 2);
  assert.equal(data.retro.actions.length, 2);
  assert.equal(data.capacity.length, 3);
  assert.equal(data.nextGoal, 'Una lectura común del norte, publicada y discutida.');
  assert.deepEqual(warnings, []);
});

test('velocity keeps only the last five sprints', () => {
  const velocity = Array.from({ length: 7 }, (_, index) => ({
    sprint: `S${index + 1}`,
    committed: 10 + index,
    done: 5 + index,
  }));
  const { data } = parseSprintBrief({ sprint: 'S7', style: 'isotype', velocity });
  assert.deepEqual(data.velocity.map((item) => item.sprint), ['S3', 'S4', 'S5', 'S6', 'S7']);
});

test('wrong types produce field-level errors, never [object Object]', () => {
  let error: unknown;
  try {
    parseSprintBrief({
      sprint: { id: 'S14' },
      style: 'isotype',
      stories: [{ title: 'Muestreo desigual', status: 'done', points: 'cinco' }],
    });
  } catch (caught) {
    error = caught;
  }
  assert.ok(error instanceof SprintBriefError, 'expected a SprintBriefError');
  const message = (error as Error).message;
  assert.match(message, /stories\.0\.points/);
  assert.match(message, /number/);
  assert.doesNotMatch(message, /\[object Object\]/);
});

test('an invalid story status names the field and the allowed values', () => {
  let error: unknown;
  try {
    parseSprintBrief({ sprint: 'S14', style: 'isotype', stories: [{ title: 'X', status: 'blocked' }] });
  } catch (caught) {
    error = caught;
  }
  assert.ok(error instanceof SprintBriefError);
  const message = (error as Error).message;
  assert.match(message, /stories\.0\.status/);
  assert.match(message, /done/);
  assert.doesNotMatch(message, /\[object Object\]/);
});

test('a team object without a name fails on team.name', () => {
  let error: unknown;
  try {
    parseSprintBrief({ sprint: 'S14', style: 'isotype', team: { brand: 'Umbral' } });
  } catch (caught) {
    error = caught;
  }
  assert.ok(error instanceof SprintBriefError);
  assert.match((error as Error).message, /team\.name/);
  assert.doesNotMatch((error as Error).message, /\[object Object\]/);
});

test('unknown fields warn instead of disappearing silently', () => {
  const { warnings } = parseSprintBrief({
    sprint: 'S14',
    style: 'isotype',
    velocity_: 3,
    team: { name: 'Umbral', planet: 'Marte' },
    stories: [{ title: 'Muestreo', status: 'done', wat: true }],
  });
  assert.equal(warnings.length, 3);
  assert.ok(warnings.some((warning) => warning.includes('velocity_')));
  assert.ok(warnings.some((warning) => warning.includes('team.planet')));
  assert.ok(warnings.some((warning) => warning.includes('stories.0.wat')));
});

test('legacy blockers accept up to 300 characters with a clear limit', () => {
  const allowed = 'a'.repeat(300);
  const { data } = parseSprintBrief({ sprint: 'S14', style: 'isotype', blockers: [allowed] });
  assert.equal(data.blockers[0]?.length, 300);

  let error: unknown;
  try {
    parseSprintBrief({ sprint: 'S14', style: 'isotype', blockers: ['a'.repeat(301)] });
  } catch (caught) {
    error = caught;
  }
  assert.ok(error instanceof SprintBriefError);
  assert.match((error as Error).message, /blockers\.0/);
  assert.match((error as Error).message, /300/);
});

test('the sprint id is required to be non-empty', () => {
  assert.throws(() => parseSprintBrief({ sprint: '', style: 'isotype' }), SprintBriefError);
  assert.throws(() => parseSprintBrief({ style: 'isotype' }), SprintBriefError);
});
