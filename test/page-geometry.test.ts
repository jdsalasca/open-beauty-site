import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../src/page/index.js';
import { styleSlugs } from '../src/styles/presets.js';
import type { Brief, SectionBrief, StyleSlug } from '../src/types.js';
import { browserTimeoutMs } from './support/browser.js';
import { cleanupTempPages, geometryIssues, openGeometryPage, withGeometryBrowser, writeTempPage } from './support/geometry.js';

/**
 * Real-browser mobile/desktop contract for every `beauty page` output built
 * from the recipe briefs. Skips when Playwright is not installed.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function recipeBrief(style: StyleSlug): Promise<Partial<Brief>> {
  const raw = await readFile(path.join(root, 'examples', 'recipes', style, 'page.json'), 'utf8');
  return JSON.parse(raw) as Partial<Brief>;
}

function withExtraSections(brief: Partial<Brief>, count: number): Partial<Brief> {
  const base: SectionBrief[] = brief.sections ?? [];
  const filler: SectionBrief[] = [
    { kicker: '04 / Atelier', title: 'Atelier', body: 'A fourth study with its own material and its own light.' },
    { kicker: '05 / Archive', title: 'Archive', body: 'A fifth study kept open for the next visit and the next question.' },
    { kicker: '06 / School', title: 'School', body: 'A sixth study that shares the method instead of guarding it.' },
  ];
  return {
    ...brief,
    sections: [...base, ...filler].slice(0, count),
    closing: {
      title: 'Cada semilla, con fecha.',
      text: 'Una nota de cierre breve para el archivo.',
      cta: { label: 'Abrir el archivo' },
    },
  };
}

const MAIN_WIDTHS: Array<[number, number]> = [
  [320, 780],
  [360, 780],
  [390, 844],
  [768, 900],
  [1024, 900],
  [1440, 900],
];

const STRESS_WIDTHS: Array<[number, number]> = [
  [360, 780],
  [1024, 900],
  [1440, 900],
];

async function settle(page: { evaluate<T, Arg = undefined>(fn: (arg: Arg) => T | Promise<T>, arg?: Arg): Promise<T> }): Promise<void> {
  await page.evaluate(() =>
    Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1200))]),
  );
}

test('every style page passes the geometry contract from 320px to 1440px', async (t) => {
  await withGeometryBrowser(t, async (browser) => {
    try {
      for (const style of styleSlugs) {
        const html = renderPage(style, await recipeBrief(style));
        const url = writeTempPage(html, `${style}.html`);
        for (const [width, height] of MAIN_WIDTHS) {
          const { page, close } = await openGeometryPage(browser, { width, height });
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: browserTimeoutMs() });
          await settle(page);
          const issues = await geometryIssues(page);
          assert.deepEqual(
            issues,
            [],
            `${style} @ ${width}×${height}: ${issues.length} geometry violation(s)\n${issues
              .map((issue) => `- [${issue.kind}] ${issue.detail}`)
              .join('\n')}`,
          );
          await close();
        }
      }
    } finally {
      cleanupTempPages();
    }
  });
});

test('four and five card grids never leave a single orphan item', async (t) => {
  await withGeometryBrowser(t, async (browser) => {
    try {
      for (const style of styleSlugs) {
        const recipe = await recipeBrief(style);
        for (const count of [4, 5]) {
          const html = renderPage(style, withExtraSections(recipe, count));
          const url = writeTempPage(html, `${style}-${count}.html`);
          for (const [width, height] of STRESS_WIDTHS) {
            const { page, close } = await openGeometryPage(browser, { width, height });
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: browserTimeoutMs() });
            await settle(page);
            const issues = await geometryIssues(page);
            assert.deepEqual(
              issues,
              [],
              `${style} with ${count} cards @ ${width}×${height}: ${issues.length} geometry violation(s)\n${issues
                .map((issue) => `- [${issue.kind}] ${issue.detail}`)
                .join('\n')}`,
            );
            await close();
          }
        }
      }
    } finally {
      cleanupTempPages();
    }
  });
});
