import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchWithRetry, loadChromium, locatePlaywrightRoot } from './browser.js';

/**
 * Shared browser geometry harness. Playwright lives outside this repository and
 * is imported by absolute path (BEAUTY_PLAYWRIGHT_ROOT overrides it). When the
 * module or Chromium is unavailable every caller skips gracefully.
 */
export interface GeometryPage {
  goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<unknown>;
  evaluate<T, Arg = undefined>(fn: (arg: Arg) => T | Promise<T>, arg?: Arg): Promise<T>;
  waitForTimeout(ms: number): Promise<void>;
}

export interface GeometryContext {
  addInitScript(script: () => void): Promise<void>;
  newPage(): Promise<GeometryPage>;
  close(): Promise<void>;
}

export interface GeometryBrowser {
  newContext(options?: {
    viewport?: { width: number; height: number };
    reducedMotion?: 'reduce' | 'no-preference';
  }): Promise<GeometryContext>;
  close(): Promise<void>;
}

interface ChromiumLike {
  launch(options?: { headless?: boolean; timeout?: number }): Promise<GeometryBrowser>;
}

export async function withGeometryBrowser(
  t: { skip(message: string): void },
  run: (browser: GeometryBrowser) => Promise<void>,
): Promise<void> {
  const chromium = (await loadChromium()) as ChromiumLike | null;
  if (!chromium) {
    t.skip(`playwright not installed at ${locatePlaywrightRoot() ?? 'BEAUTY_PLAYWRIGHT_ROOT'}`);
    return;
  }
  let browser: GeometryBrowser;
  try {
    browser = await launchWithRetry(chromium, { headless: true });
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

const tempRoots: string[] = [];

/** Writes a page into a temp folder outside the repository and returns its URL. */
export function writeTempPage(html: string, name = 'page.html'): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'beauty-geometry-'));
  tempRoots.push(dir);
  const file = path.join(dir, name);
  writeFileSync(file, html, 'utf8');
  return pathToFileURL(file).href;
}

export function cleanupTempPages(): void {
  for (const dir of tempRoots.splice(0)) rmSync(dir, { recursive: true, force: true });
}

export type GeometryIssueKind =
  | 'overflow-x'
  | 'overlap'
  | 'clipped-text'
  | 'orphan-grid'
  | 'split-word'
  | 'two-column'
  | 'counter-split'
  | 'dangling-separator';

export interface GeometryIssue {
  kind: GeometryIssueKind;
  detail: string;
}

/**
 * In-page geometry audit. Self-contained so Playwright can serialize it; it
 * returns readable violations for the tests and the before/after report:
 *   - horizontal document/body overflow
 *   - fixed or sticky elements covering visible text at several scroll states
 *   - text clipped by an overflow hidden/clip container
 *   - a single orphan item on the last row of a multi-column grid
 *   - a word broken in the middle even though it fits its container
 */
export function pageAudit(fractions: number[]): GeometryIssue[] {
  const issues: GeometryIssue[] = [];
  const push = (kind: GeometryIssueKind, detail: string): void => {
    if (!issues.some((item) => item.kind === kind && item.detail === detail)) issues.push({ kind, detail });
  };

  const viewport = window.innerWidth;
  const documentElement = document.documentElement;
  const body = document.body;

  const isVisible = (element: Element): boolean => {
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return Number(style.opacity) > 0.05;
  };

  const describe = (element: Element): string => {
    const tag = element.tagName.toLowerCase();
    const className =
      typeof element.className === 'string' ? element.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
    const text = (element.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 32);
    return `${tag}${className ? `.${className}` : ''}${text ? ` "${text}"` : ''}`;
  };

  const textRects = (): DOMRect[] => {
    const rects: DOMRect[] = [];
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const text = node.nodeValue ?? '';
      const parent = node.parentElement;
      if (text.trim() && parent && !parent.closest('[aria-hidden="true"]') && !parent.closest('svg') && isVisible(parent)) {
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of Array.from(range.getClientRects())) {
          if (rect.width > 0.5 && rect.height > 0.5) rects.push(rect);
        }
      }
      node = walker.nextNode();
    }
    return rects;
  };

  if (documentElement.scrollWidth > viewport + 1) {
    push('overflow-x', `document scrollWidth ${documentElement.scrollWidth} > viewport ${viewport}`);
  }
  if (body.scrollWidth > viewport + 1) {
    push('overflow-x', `body scrollWidth ${body.scrollWidth} > viewport ${viewport}`);
  }

  const blockers = Array.from(body.querySelectorAll('*')).filter((element) => {
    const style = getComputedStyle(element);
    if (style.position !== 'fixed' && style.position !== 'sticky') return false;
    if (style.pointerEvents === 'none') return false;
    if (element.closest('[aria-hidden="true"]') || !isVisible(element)) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1;
  });
  const maxScroll = Math.max(0, documentElement.scrollHeight - window.innerHeight);
  const overlapKeys = new Set<string>();
  for (const fraction of fractions) {
    window.scrollTo(0, Math.round(maxScroll * fraction));
    const rects = textRects();
    for (const blocker of blockers) {
      const box = blocker.getBoundingClientRect();
      if (box.bottom <= 0 || box.top >= window.innerHeight) continue;
      const key = `${describe(blocker)}@${fraction}`;
      if (overlapKeys.has(key)) continue;
      for (const rect of rects) {
        const overlapX = Math.min(box.right, rect.right) - Math.max(box.left, rect.left);
        const overlapY = Math.min(box.bottom, rect.bottom) - Math.max(box.top, rect.top);
        if (overlapX > 2 && overlapY > 2) {
          overlapKeys.add(key);
          push('overlap', `${describe(blocker)} covers text at scroll ${window.scrollY}px (${Math.round(overlapX)}×${Math.round(overlapY)}px)`);
          break;
        }
      }
    }
  }
  window.scrollTo(0, 0);

  for (const element of Array.from(body.querySelectorAll('*'))) {
    const style = getComputedStyle(element);
    if (style.overflowX !== 'hidden' && style.overflowX !== 'clip') continue;
    if (element.scrollWidth <= element.clientWidth + 1) continue;
    if (!(element.textContent ?? '').trim()) continue;
    if (element.closest('[aria-hidden="true"]')) continue;
    push('clipped-text', `${describe(element)} hides text: scrollWidth ${element.scrollWidth} > clientWidth ${element.clientWidth}`);
  }

  for (const element of Array.from(body.querySelectorAll('*'))) {
    const style = getComputedStyle(element);
    if (style.display !== 'grid' && style.display !== 'inline-grid') continue;
    const children = Array.from(element.children).filter((child) => isVisible(child));
    if (children.length < 3) continue;
    const tracks = style.gridTemplateColumns.split(' ').filter((track) => track !== '0px' && track !== 'none' && track !== '');
    if (tracks.length < 2) continue;
    if (children.length % tracks.length !== 1) continue;
    const tops: number[] = [];
    for (const child of children) {
      const top = Math.round(child.getBoundingClientRect().top);
      if (!tops.some((value) => Math.abs(value - top) <= 2)) tops.push(top);
    }
    const expectedRows = Math.ceil(children.length / tracks.length);
    if (tops.length !== expectedRows) continue;
    const widths = children.map((child) => child.getBoundingClientRect().width);
    if (Math.max(...widths) - Math.min(...widths) > 2) continue;
    push('orphan-grid', `${describe(element)} leaves one item alone in ${tracks.length} columns (${children.length} items)`);
  }

  // Two-column compositions must collapse to a single column on a phone.
  if (viewport <= 720) {
    for (const element of Array.from(body.querySelectorAll('*'))) {
      const style = getComputedStyle(element);
      if (style.display !== 'grid' && style.display !== 'inline-grid') continue;
      const children = Array.from(element.children).filter((child) => isVisible(child));
      if (children.length < 2) continue;
      const tracks = style.gridTemplateColumns
        .split(' ')
        .map((track) => Number.parseFloat(track))
        .filter((track) => Number.isFinite(track) && track > 0);
      if (tracks.length < 2 || !tracks.every((track) => track >= 120)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width < viewport * 0.6) continue;
      push('two-column', `${describe(element)} keeps ${tracks.length} columns at ${viewport}px`);
    }
  }

  // Counters and separators must stay on one line; a dangling separator is
  // always a defect, a wrapped counter reads as two numbers.
  const COUNTERS =
    '.works-count,.nature-count,.nature-folio,.iso-head span,.iso-foot span,.works-meta,.aside>span,.section-head>span,.folio,.est,.sec-num,.galaxy-coord,.galaxy-scale,.vapor-status span,.vapor-bar span';
  for (const element of Array.from(body.querySelectorAll(COUNTERS))) {
    const text = (element.textContent ?? '').trim();
    if (!text || element.closest('[aria-hidden="true"]') || !isVisible(element)) continue;
    const range = document.createRange();
    range.selectNodeContents(element);
    const lines = new Set(Array.from(range.getClientRects()).map((rect) => Math.round(rect.top)));
    if (lines.size > 1) push('counter-split', `${describe(element)} wrapped onto ${lines.size} lines`);
  }
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const text = node.nodeValue ?? '';
    const parent = node.parentElement;
    if (text.trim() && parent && !parent.closest('[aria-hidden="true"]') && !parent.closest('svg') && isVisible(parent)) {
      const style = getComputedStyle(parent);
      if (style.whiteSpace !== 'nowrap') {
        const words = Array.from(text.matchAll(/\S+/g));
        const lines = new Map<number, string[]>();
        for (const match of words) {
          const word = match[0] ?? '';
          const start = match.index ?? 0;
          const range = document.createRange();
          range.setStart(node, start);
          range.setEnd(node, start + word.length);
          const rect = Array.from(range.getClientRects()).find((item) => item.width > 0.5);
          if (!rect) continue;
          const top = Math.round(rect.top);
          const key = Array.from(lines.keys()).find((value) => Math.abs(value - top) <= 2) ?? top;
          lines.set(key, [...(lines.get(key) ?? []), word]);
        }
        for (const wordsOnLine of lines.values()) {
          if (wordsOnLine.length === 1 && /^[·•—–|/¦]+$/.test(wordsOnLine[0] ?? '')) {
            push('dangling-separator', `separator "${wordsOnLine[0]}" sits alone on a line in ${describe(parent)}`);
          }
        }
      }
    }
    node = walker.nextNode();
  }

  const walkerWords = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  node = walkerWords.nextNode();
  while (node) {
    const text = node.nodeValue ?? '';
    const parent = node.parentElement;
    if (text.trim() && parent && !parent.closest('[aria-hidden="true"]') && !parent.closest('svg') && isVisible(parent)) {
      const style = getComputedStyle(parent);
      if (style.whiteSpace !== 'nowrap' && !style.whiteSpace.startsWith('pre')) {
        for (const match of text.matchAll(/\S+/g)) {
          const word = match[0] ?? '';
          if (word.length < 2) continue;
          const start = match.index ?? 0;
          const range = document.createRange();
          range.setStart(node, start);
          range.setEnd(node, start + word.length);
          if (range.getClientRects().length <= 1) continue;
          const mirror = document.createElement('span');
          mirror.textContent = word;
          mirror.style.position = 'absolute';
          mirror.style.visibility = 'hidden';
          mirror.style.whiteSpace = 'pre';
          mirror.style.left = '-9999px';
          mirror.style.top = '0';
          mirror.style.fontFamily = style.fontFamily;
          mirror.style.fontSize = style.fontSize;
          mirror.style.fontWeight = style.fontWeight;
          mirror.style.fontStyle = style.fontStyle;
          mirror.style.fontStretch = style.fontStretch;
          mirror.style.letterSpacing = style.letterSpacing;
          mirror.style.wordSpacing = style.wordSpacing;
          mirror.style.textTransform = style.textTransform;
          mirror.style.fontFeatureSettings = style.fontFeatureSettings;
          mirror.style.fontKerning = style.fontKerning;
          parent.appendChild(mirror);
          const wordWidth = mirror.getBoundingClientRect().width;
          mirror.remove();
          let container: Element | null = parent;
          while (container && container !== body) {
            const containerStyle = getComputedStyle(container);
            if (containerStyle.display !== 'inline' && container.clientWidth > 0) break;
            container = container.parentElement;
          }
          let available = container ? container.clientWidth : viewport;
          if (container) {
            const containerStyle = getComputedStyle(container);
            available -=
              Number.parseFloat(containerStyle.paddingLeft || '0') + Number.parseFloat(containerStyle.paddingRight || '0');
          }
          const allowed = wordWidth > available + 1.5 || word.includes('-');
          if (!allowed) {
            push('split-word', `"${word}" broke mid-word in ${describe(parent)} (word ${wordWidth.toFixed(1)}px, available ${available.toFixed(1)}px)`);
          }
        }
      }
    }
    node = walker.nextNode();
  }

  return issues;
}

export async function geometryIssues(page: GeometryPage, fractions: number[] = [0, 0.25, 0.5, 0.75, 1]): Promise<GeometryIssue[]> {
  return page.evaluate(pageAudit, fractions);
}

/**
 * Opens a context with reduced motion and a `__name` stub. tsx/esbuild wraps
 * serialized helpers with `__name(...)`, which would not exist in the page.
 */
export async function openGeometryPage(
  browser: GeometryBrowser,
  viewport: { width: number; height: number },
): Promise<{ page: GeometryPage; close(): Promise<void> }> {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  await context.addInitScript(() => {
    const scope = window as unknown as Record<string, unknown>;
    scope.__name ??= (fn: unknown) => fn;
  });
  const page = await context.newPage();
  return { page, close: () => context.close() };
}
