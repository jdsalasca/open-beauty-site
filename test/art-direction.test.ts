import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { ART_DIRECTION, artDirectionMarkdown } from '../src/styles/art-direction.js';
import { styleSlugs } from '../src/styles/presets.js';

const BUNDLED_FAMILIES = new Set([
  'Archivo Black',
  'EB Garamond',
  'Fraunces',
  'Nunito Sans',
  'Space Mono',
  'Poiret One',
  'Josefin Sans',
  'Jost',
  'IBM Plex Sans',
  'Space Grotesk',
  'Shippori Mincho B1',
  'Zen Kaku Gothic New',
  'UnifrakturMaguntia',
  'IM Fell English',
  'Bungee Shade',
  'Bricolage Grotesque',
  'DM Sans',
  'Press Start 2P',
  'Michroma',
  'Cormorant Garamond',
  'Karla',
]);

function isNonEmpty(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0 && value.every(isNonEmpty);
  if (value && typeof value === 'object') {
    return Object.values(value).every((v) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'boolean') return true;
      return isNonEmpty(v);
    });
  }
  return value !== null && value !== undefined;
}

test('art direction covers all 13 styles', () => {
  assert.equal(Object.keys(ART_DIRECTION).length, 13);
  assert.deepEqual(new Set(Object.keys(ART_DIRECTION)), new Set(styleSlugs));
});

test('art direction required fields are non-empty', () => {
  for (const slug of styleSlugs) {
    const ad = ART_DIRECTION[slug];
    assert.ok(isNonEmpty(ad.intent), `${slug} intent`);
    assert.ok(isNonEmpty(ad.composition), `${slug} composition`);
    assert.ok(isNonEmpty(ad.typography), `${slug} typography`);
    assert.ok(isNonEmpty(ad.color), `${slug} color`);
    assert.ok(isNonEmpty(ad.materiality), `${slug} materiality`);
    assert.ok(isNonEmpty(ad.illustration), `${slug} illustration`);
    assert.ok(isNonEmpty(ad.motion), `${slug} motion`);
    assert.ok(ad.negativeRules.length >= 3, `${slug} negativeRules >= 3`);
    assert.ok(isNonEmpty(ad.adaptation), `${slug} adaptation`);
    for (const role of ['display', 'reading', 'label', 'figure', 'annotation'] as const) {
      const family = ad.typography.families[role];
      assert.ok(isNonEmpty(family.family), `${slug} ${role} family`);
      assert.ok(family.weight !== undefined && family.weight !== null, `${slug} ${role} weight`);
    }
    assert.ok(isNonEmpty(ad.typography.sizesByFormat.web), `${slug} sizes web`);
    assert.ok(isNonEmpty(ad.typography.sizesByFormat.slide), `${slug} sizes slide`);
    assert.ok(isNonEmpty(ad.typography.sizesByFormat.gif), `${slug} sizes gif`);
  }
});

test('art direction example paths exist', () => {
  for (const slug of styleSlugs) {
    const ad = ART_DIRECTION[slug];
    for (const format of ['web', 'slides', 'gif'] as const) {
      const entry = ad.adaptation[format === 'slides' ? 'slides' : format];
      const example = entry.example || entry.examplePath || entry.path || entry.file;
      assert.ok(typeof example === 'string' && example.length > 0, `${slug} ${format} example`);
      assert.ok(existsSync(path.resolve(example)), `${slug} ${format} example missing: ${example}`);
    }
  }
});

test('art direction font families are bundled or marked unavailable', () => {
  for (const slug of styleSlugs) {
    const ad = ART_DIRECTION[slug];
    for (const role of ['display', 'reading', 'label', 'figure', 'annotation'] as const) {
      const family = ad.typography.families[role];
      if (BUNDLED_FAMILIES.has(family.family)) {
        assert.equal(family.available, true, `${slug} ${role} should be available`);
      } else {
        assert.equal(family.available, false, `${slug} ${role} should be marked unavailable`);
      }
    }
  }
  const pc = ART_DIRECTION.papercraft;
  assert.ok(pc.profiles, 'papercraft profiles');
  assert.equal(pc.profiles!.editorial.available, true);
  assert.equal(pc.profiles!.friendly.available, false);
  for (const font of Object.values(pc.profiles!.friendly.families)) {
    if (!font) continue;
    assert.equal(font.available, false, 'friendly profile fonts unavailable');
  }
});

test('art direction docs have no drift', () => {
  for (const slug of styleSlugs) {
    const expected = artDirectionMarkdown(slug);
    const filePath = path.join('docs', 'art-direction', `${slug}.md`);
    // Git on Windows may check the file out with CRLF; the content, not the line ending, is what must not drift.
    const actual = readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    assert.equal(actual, expected.replace(/\r\n/g, '\n'), `${slug} doc drift`);
  }
});
