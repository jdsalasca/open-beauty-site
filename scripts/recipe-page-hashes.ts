import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderPage } from '../src/page/index.js';
import { styleSlugs } from '../src/styles/presets.js';
import type { StyleSlug } from '../src/types.js';
import { runScript } from './lib/run.js';

/**
 * Snapshot tool for the page-renderer compatibility contract. It hashes the
 * exact bytes `renderPage` produces for every recipe brief. The test suite
 * regenerates the same hashes and compares them, so adding scene/composition
 * support cannot silently change the existing pages.
 *
 *   pnpm exec tsx scripts/recipe-page-hashes.ts --write
 */

export async function recipePageHashes(recipeRoot: string): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};
  for (const style of styleSlugs) {
    const raw = await readFile(path.join(recipeRoot, style, 'page.json'), 'utf8');
    const html = renderPage(style as StyleSlug, JSON.parse(raw));
    hashes[style] = createHash('sha256').update(html, 'utf8').digest('hex');
  }
  return hashes;
}

async function main(): Promise<void> {
  await runScript(async () => {
    const write = process.argv.includes('--write');
    const recipeRoot = path.resolve(process.cwd(), 'examples/recipes');
    const hashes = await recipePageHashes(recipeRoot);
    const target = path.resolve(process.cwd(), 'test/fixtures/recipe-page-hashes.json');
    if (write) {
      await writeFile(target, JSON.stringify(hashes, null, 2) + '\n', 'utf8');
      console.log(`wrote ${Object.keys(hashes).length} hashes to ${path.relative(process.cwd(), target)}`);
    } else {
      console.log(JSON.stringify(hashes, null, 2));
    }
  });
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]).endsWith('recipe-page-hashes.ts');
if (invokedDirectly) {
  void main();
}
