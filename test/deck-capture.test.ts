import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderPage } from '../src/page/index.js';

/**
 * Capture regression test. Playwright is imported from an absolute path outside
 * this repo and skipped when it is not installed, so `pnpm test` stays green on
 * machines without browsers.
 */
const PLAYWRIGHT_ROOT =
  process.env.BEAUTY_PLAYWRIGHT_ROOT ??
  'C:\\Users\\jdsal\\Documents\\Programming-personal\\open-civic-signal-os\\node_modules\\playwright';

interface PageLike {
  goto(url: string, options?: { waitUntil?: string }): Promise<unknown>;
  $eval<T>(selector: string, fn: (element: Element) => T): Promise<T>;
  $$eval<T>(selector: string, fn: (elements: Element[]) => T): Promise<T>;
  evaluate<T>(fn: () => T): Promise<T>;
}

interface ContextLike {
  addInitScript(script: () => void): Promise<void>;
  newPage(): Promise<PageLike>;
  close(): Promise<void>;
}

interface BrowserLike {
  newContext(options?: { viewport?: { width: number; height: number } }): Promise<ContextLike>;
  close(): Promise<void>;
}

interface ChromiumLike {
  launch(options?: { headless?: boolean }): Promise<BrowserLike>;
}

let chromium: ChromiumLike | null = null;
try {
  const imported = (await import(pathToFileURL(path.join(PLAYWRIGHT_ROOT, 'index.mjs')).href)) as { chromium: ChromiumLike };
  chromium = imported.chromium;
} catch {
  chromium = null;
}

const html = renderPage('galactic', {
  title: 'Captura fiel',
  tagline: 'Todo el contenido visible sin scroll.',
  intro: 'Una página de prueba con secciones suficientes para que existan reveals bajo el pliegue.',
  sections: [
    { kicker: 'Uno', title: 'Primera', body: 'Un cuerpo breve.' },
    { kicker: 'Dos', title: 'Segunda', body: 'Otro cuerpo breve.' },
    { kicker: 'Tres', title: 'Tercera', body: 'Un tercer cuerpo breve.' },
  ],
  locale: 'es',
});

async function withBrowser(t: { skip(message: string): void }, run: (browser: BrowserLike) => Promise<void>): Promise<void> {
  if (!chromium) {
    t.skip(`playwright not installed at ${PLAYWRIGHT_ROOT}`);
    return;
  }
  let browser: BrowserLike;
  try {
    browser = await chromium.launch();
  } catch (error) {
    t.skip(`chromium unavailable: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`);
    return;
  }
  try {
    await run(browser);
  } finally {
    await browser.close().catch(() => {});
  }
}

async function writePage(): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'beauty-reveal-'));
  const file = path.join(dir, 'page.html');
  await writeFile(file, html, 'utf8');
  return file;
}

test('a webdriver page shows every reveal immediately, without scrolling', async (t) => {
  await withBrowser(t, async (browser) => {
    const file = await writePage();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => true });
      });
      const page = await context.newPage();
      await page.goto(pathToFileURL(file).href, { waitUntil: 'domcontentloaded' });
      const opacities = await page.$$eval('.reveal', (nodes) => nodes.map((node) => getComputedStyle(node).opacity));
      assert.ok(opacities.length > 0, 'expected .reveal nodes on the page');
      assert.deepEqual([...new Set(opacities)], ['1'], `reveals below the fold are hidden: ${JSON.stringify(opacities)}`);

      const skipDisplay = await page.$eval('.skip-link', (node) => getComputedStyle(node).display);
      assert.notEqual(skipDisplay, 'none');
      const skipTop = await page.$eval('.skip-link', (node) => node.getBoundingClientRect().top);
      assert.ok(skipTop < 0, `skip link must stay out of the viewport until focused, got top ${skipTop}`);

      await page.evaluate(() => document.documentElement.classList.add('is-capturing'));
      const captureDisplay = await page.$eval('.skip-link', (node) => getComputedStyle(node).display);
      assert.equal(captureDisplay, 'none', 'skip link must vanish in capture mode');
      await context.close();
    } finally {
      await rm(path.dirname(file), { recursive: true, force: true });
    }
  });
});

test('the ?static parameter reveals everything for humans too', async (t) => {
  await withBrowser(t, async (browser) => {
    const file = await writePage();
    try {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
      });
      const page = await context.newPage();
      await page.goto(`${pathToFileURL(file).href}?static`, { waitUntil: 'domcontentloaded' });
      const opacities = await page.$$eval('.reveal', (nodes) => nodes.map((node) => getComputedStyle(node).opacity));
      assert.ok(opacities.length > 0, 'expected .reveal nodes on the page');
      assert.deepEqual([...new Set(opacities)], ['1'], `?static did not reveal everything: ${JSON.stringify(opacities)}`);
      const isStatic = await page.evaluate(() => document.documentElement.classList.contains('is-static'));
      assert.equal(isStatic, true, '?static must mark the document as static');
      await context.close();
    } finally {
      await rm(path.dirname(file), { recursive: true, force: true });
    }
  });
});
