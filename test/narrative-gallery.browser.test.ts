import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { createNarrativeGallery } from '../src/narrative/gallery.js';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';

const ROOT = process.cwd();
const DEFAULT_PLAYWRIGHT_ROOT = 'C:\\Users\\jdsal\\Documents\\Programming-personal\\open-civic-signal-os\\node_modules\\playwright';
const candidate = process.env.BEAUTY_PLAYWRIGHT_ROOT ?? DEFAULT_PLAYWRIGHT_ROOT;
const playwrightPackage = path.join(candidate, 'package.json');
const playwrightRoot = existsSync(playwrightPackage) && JSON.parse(readFileSync(playwrightPackage, 'utf8')).name === 'playwright'
  ? candidate
  : null;
const playwrightEntry = playwrightRoot
  ? path.join(playwrightRoot, existsSync(path.join(playwrightRoot, 'index.mjs')) ? 'index.mjs' : 'index.js')
  : null;
const playwrightModule = playwrightEntry ? import(pathToFileURL(playwrightEntry).href) : null;

test('gallery playback, keyboard lightbox, downloads and mobile layout work in Chromium', { skip: !playwrightModule }, async () => {
  const { chromium } = await playwrightModule!;
  const temp = await mkdtemp(path.join(os.tmpdir(), 'beauty-gallery-browser-'));
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    const output = path.join(temp, 'gallery.html');
    await createNarrativeGallery({ directory: path.join(ROOT, 'docs', 'narrative-gif'), output, title: 'Prueba de galería' });
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const gifRequests: string[] = [];
    page.on('request', (request) => {
      if (/\.gif(?:$|\?)/i.test(request.url())) gifRequests.push(request.url());
    });
    await page.goto(pathToFileURL(output).href);
    await page.getByRole('heading', { name: 'Prueba de galería' }).waitFor();
    const card = page.locator('article.piece').first();
    const poster = card.locator('img.poster');
    const pngSrc = await poster.getAttribute('src');
    assert.match(pngSrc ?? '', /\.png$/);
    assert.equal(gifRequests.length, 0, 'no GIF is requested while the poster is static');

    const play = card.getByRole('button', { name: /Reproducir/ });
    await play.focus();
    await page.keyboard.press('Tab');
    assert.equal(await card.getByRole('button', { name: 'Detener' }).evaluate((button) => button === document.activeElement), true, 'Tab reaches the next playback button');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    await page.waitForFunction((image) => (image as HTMLImageElement).src.endsWith('.gif'), await poster.elementHandle());
    await page.waitForFunction((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0, await poster.elementHandle());
    assert.equal(gifRequests.length, 1, 'the GIF is requested only after explicit playback');
    await card.getByRole('button', { name: 'Detener' }).click();
    assert.equal(await poster.getAttribute('src'), pngSrc);

    await card.getByRole('button', { name: 'Ampliar' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible' });
    assert.deepEqual(await dialog.locator('img').evaluate((image) => [(image as HTMLImageElement).naturalWidth, (image as HTMLImageElement).naturalHeight]), [1280, 720]);
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => (document.activeElement as HTMLElement).textContent?.trim()), 'Ampliar');

    const downloads = await card.locator('a[download]').evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).download));
    assert.equal(downloads.length, 2);
    assert.equal(downloads.some((name) => name.endsWith('.gif')), true);
    assert.equal(downloads.some((name) => name.endsWith('.png')), true);
    await page.getByLabel(/Vista de tarjeta 640/).check();
    assert.equal(await page.locator('#gallery-grid').getAttribute('class').then((value) => value?.includes('size-preview')), true);
    await page.getByRole('button', { name: 'Paper Craft' }).click();
    assert.equal(await page.locator('#gallery-grid .piece:visible').count(), 15, 'style filter includes papercraft packs and semantic review variants');
    await page.getByRole('button', { name: 'Todos los estilos' }).click();
    await page.setViewportSize({ width: 360, height: 780 });
    await page.waitForTimeout(100);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    assert.equal(overflow, false, 'gallery has no horizontal overflow at 360px');
    await context.close();

    const reduced = await browser.newContext({ viewport: { width: 360, height: 780 }, reducedMotion: 'reduce' });
    const reducedPage = await reduced.newPage();
    await reducedPage.goto(pathToFileURL(output).href);
    const reducedCard = reducedPage.locator('article.piece').first();
    const reducedImage = reducedCard.locator('img.poster');
    assert.match((await reducedImage.getAttribute('src')) ?? '', /\.png$/);
    assert.equal(await reducedPage.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    assert.equal(await reducedPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
    assert.equal(await reducedCard.getByRole('button', { name: /Reproducir/ }).getAttribute('aria-label').then((value) => value?.includes('manual')), true);
    await reduced.close();
  } finally {
    await browser?.close();
    await rm(temp, { recursive: true, force: true });
  }
});
