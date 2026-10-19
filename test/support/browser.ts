import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { browserTimeoutMs, isBrowserTimeoutError, launchWithRetry } from '../../src/browser.js';

export { browserTimeoutMs, isBrowserTimeoutError, launchWithRetry };

/**
 * Playwright lives outside this repository and is imported by absolute path
 * (BEAUTY_PLAYWRIGHT_ROOT overrides it). Browser suites skip gracefully when it
 * is missing. Every launch goes through `launchWithRetry` and every navigation
 * carries `browserTimeoutMs()`, so contention surfaces as a bounded timeout.
 */
export const DEFAULT_PLAYWRIGHT_ROOT =
  'C:\\Users\\jdsal\\Documents\\Programming-personal\\open-civic-signal-os\\node_modules\\playwright';

export interface PlaywrightChromium {
  // Playwright ships no usable types through the absolute-path import used here.
  launch(options?: { headless?: boolean; timeout?: number }): Promise<any>;
}

export function locatePlaywrightRoot(): string | null {
  const candidate = process.env.BEAUTY_PLAYWRIGHT_ROOT ?? DEFAULT_PLAYWRIGHT_ROOT;
  try {
    const pkg = JSON.parse(readFileSync(path.join(candidate, 'package.json'), 'utf8')) as { name?: string };
    return pkg.name === 'playwright' ? candidate : null;
  } catch {
    return null;
  }
}

export function playwrightEntry(root: string): string {
  return path.join(root, existsSync(path.join(root, 'index.mjs')) ? 'index.mjs' : 'index.js');
}

export async function loadChromium(root: string | null = locatePlaywrightRoot()): Promise<PlaywrightChromium | null> {
  if (!root) return null;
  try {
    const imported = (await import(pathToFileURL(playwrightEntry(root)).href)) as { chromium?: PlaywrightChromium };
    return imported.chromium ?? null;
  } catch {
    return null;
  }
}
