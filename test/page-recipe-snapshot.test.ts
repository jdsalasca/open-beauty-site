import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { recipePageHashes } from '../scripts/recipe-page-hashes.js';

/**
 * Compatibility contract for the page renderers: adding scene-driven hero art
 * and composition variants must not change the bytes of the existing recipe
 * pages, because they are the 91 visual-matrix cells and the published
 * examples. The fixture was generated before those features were added.
 */
test('recipe pages keep their exact bytes after scene/composition support', async () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const fixture = JSON.parse(
    await readFile(path.join(root, 'test/fixtures/recipe-page-hashes.json'), 'utf8'),
  ) as Record<string, string>;
  const current = await recipePageHashes(path.join(root, 'examples/recipes'));

  const styles = Object.keys(fixture).sort();
  assert.deepEqual(Object.keys(current).sort(), styles, 'every recipe style must be hashed');

  for (const style of styles) {
    assert.equal(
      current[style],
      fixture[style],
      `${style} recipe page bytes changed. Re-run \`pnpm exec tsx scripts/recipe-page-hashes.ts --write\` only if the change is intentional and reviewed.`,
    );
  }
});
