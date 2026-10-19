import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { createNarrativeCompareGallery } from '../src/narrative/gallery.js';
import { browserTimeoutMs, launchWithRetry, loadChromium, locatePlaywrightRoot } from './support/browser.js';

const ROOT = process.cwd();

test('comparison gallery is keyboard operable, keeps reduced-motion static, and fits 360px without requesting GIFs early', { skip: !locatePlaywrightRoot() }, async () => {
  const chromium = await loadChromium();
  if (!chromium) return;
  const temp = await mkdtemp(path.join(os.tmpdir(), 'beauty-compare-browser-'));
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    const output = path.join(temp, 'COMPARE.html');
    const screenshots = process.env.BEAUTY_COMPARE_SCREENSHOT_DIR ?? temp;
    await mkdir(screenshots, { recursive: true });
    await createNarrativeCompareGallery({ directory: path.join(ROOT, 'docs', 'narrative-gif', 'compare'), output, title: 'Prueba de comparación' });
    browser = await launchWithRetry(chromium, { headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const gifRequests: string[] = [];
    page.on('request', (request) => { if (/\.gif(?:$|\?)/iu.test(request.url())) gifRequests.push(request.url()); });
    await page.goto(pathToFileURL(output).href, { timeout: browserTimeoutMs() });
    await page.getByRole('heading', { name: 'Prueba de comparación' }).waitFor();
    const first = page.locator('.pair .asset-card').first();
    const image = first.locator('.poster');
    assert.match((await image.getAttribute('src')) ?? '', /\.png$/u);
    await image.waitFor({ state: 'visible' });
    await image.evaluate((element) => (element as HTMLImageElement).decode());
    assert.equal(gifRequests.length, 0, 'no GIF is requested before an explicit play action');

    const play = first.getByRole('button', { name: 'Reproducir GIF Antes' });
    await play.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction((element) => (element as HTMLImageElement).src.endsWith('.gif') && (element as HTMLImageElement).complete, await image.elementHandle());
    assert.equal(gifRequests.length, 1);
    await page.keyboard.press('Tab');
    assert.equal(await first.getByRole('button', { name: 'Detener GIF Antes' }).evaluate((element) => element === document.activeElement), true, 'Tab moves between playback controls');
    await page.keyboard.press('Enter');
    assert.match((await image.getAttribute('src')) ?? '', /\.png$/u);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.getByRole('dialog').waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Ampliar Antes', 'Escape closes the native dialog and restores focus');
    await page.getByLabel('Modo tarjeta 640 × 360').check();
    assert.match(await page.locator('#toggle-status').textContent() ?? '', /640 × 360/u);
    await first.scrollIntoViewIfNeeded();
    const cardSize = await image.evaluate((element) => { const rect = element.getBoundingClientRect(); return [Math.round(rect.width), Math.round(rect.height)]; });
    assert.deepEqual(cardSize, [640, 360], 'card mode presents the native 640×360 review size');
    await page.screenshot({ path: path.join(screenshots, 'compare-1440.png') });
    await context.close();

    const mobile = await browser.newContext({ viewport: { width: 360, height: 780 }, reducedMotion: 'reduce' });
    const mobilePage = await mobile.newPage();
    const reducedGifRequests: string[] = [];
    mobilePage.on('request', (request) => { if (/\.gif(?:$|\?)/iu.test(request.url())) reducedGifRequests.push(request.url()); });
    await mobilePage.goto(pathToFileURL(output).href, { timeout: browserTimeoutMs() });
    const mobilePoster = mobilePage.locator('.pair .asset-card .poster').first();
    assert.match((await mobilePoster.getAttribute('src')) ?? '', /\.png$/u);
    assert.equal(await mobilePage.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false, 'document has no horizontal overflow at 360px');
    const mobilePosterSize = await mobilePoster.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width / rect.height;
    });
    assert.ok(Math.abs(mobilePosterSize - 16 / 9) < 0.02, 'mobile poster preserves its 16:9 frame instead of its 720px intrinsic height');
    assert.equal(reducedGifRequests.length, 0, 'reduced-motion view remains static until explicitly activated');
    await mobilePoster.scrollIntoViewIfNeeded();
    await mobilePage.screenshot({ path: path.join(screenshots, 'compare-360.png') });
    await mobile.close();
  } finally {
    await browser?.close();
    await rm(temp, { recursive: true, force: true });
  }
});
