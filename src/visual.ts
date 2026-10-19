import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { RichIssue, RichValidationResult } from './types/validation.js';
import type {
  AuditOptions,
  AuditReport,
  PlaywrightLocation,
  PlaywrightSource,
  VisualAuditOptions,
  VisualAuditReport,
  VisualFinding,
  VisualIssueCode,
  VisualViewport,
} from './types/visual.js';
import type { StyleSlug } from './types.js';
import { packageRoot } from './paths.js';
import { mergeIssues, validateDeck, validateExperience, validateHtml, validateStory } from './validate.js';
import { applyPatches, type FixResult } from './fix.js';

const SIBLING_PLAYWRIGHT =
  'C:\\Users\\jdsal\\Documents\\Programming-personal\\open-civic-signal-os\\node_modules\\playwright';

export const VISUAL_VIEWPORTS: VisualViewport[] = [
  { width: 360, height: 780, label: '360x780' },
  { width: 1440, height: 900, label: '1440x900' },
];

const VISUAL_SKIP_FIX =
  'set BEAUTY_PLAYWRIGHT_ROOT to a folder containing playwright/package.json, or run pnpm add -D playwright && pnpm exec playwright install chromium';

function readPackageName(dir: string): string | null {
  try {
    const pkg = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')) as { name?: string };
    return pkg.name ?? null;
  } catch {
    return null;
  }
}

function asPlaywrightRoot(candidate: string): string | null {
  const variants = [candidate, path.join(candidate, 'playwright'), path.join(candidate, 'node_modules', 'playwright')];
  for (const variant of variants) {
    if (readPackageName(variant) === 'playwright') return path.resolve(variant);
  }
  return null;
}

function moduleEntry(root: string): string {
  const esm = path.join(root, 'index.mjs');
  if (existsSync(esm)) return esm;
  const cjs = path.join(root, 'index.js');
  if (existsSync(cjs)) return cjs;
  return path.join(root, 'index.mjs');
}

function projectPlaywright(): string | null {
  try {
    const require = createRequire(path.join(packageRoot(), 'package.json'));
    const entry = require.resolve('playwright');
    let dir = path.dirname(entry);
    for (let depth = 0; depth < 8; depth += 1) {
      if (readPackageName(dir) === 'playwright') return dir;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    // Not installed next to the project; try the global and sibling locations.
  }
  return null;
}

function globalNodeModules(): string[] {
  const roots: string[] = [];
  const probe = spawnSync('npm', ['root', '-g'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    timeout: 5000,
  });
  if (probe.status === 0 && probe.stdout.trim()) roots.push(probe.stdout.trim());
  if (process.env.APPDATA) roots.push(path.join(process.env.APPDATA, 'npm', 'node_modules'));
  if (process.env.npm_config_prefix) roots.push(path.join(process.env.npm_config_prefix, 'lib', 'node_modules'));
  return [...new Set(roots)];
}

let locatorCache: PlaywrightLocation | null | undefined;

/**
 * One locator shared by `doctor`, `validate --visual` and `fix --visual`.
 * Order: explicit env var, the project node_modules, the global install, then
 * the shared sibling checkout used on this machine. Cached per process.
 */
export function locatePlaywright(): PlaywrightLocation | null {
  if (locatorCache !== undefined) return locatorCache;
  const attempts: Array<{ root: string | null; source: PlaywrightSource }> = [];
  const fromEnv = process.env.BEAUTY_PLAYWRIGHT_ROOT;
  if (fromEnv) attempts.push({ root: asPlaywrightRoot(fromEnv), source: 'env' });
  attempts.push({ root: projectPlaywright(), source: 'project' });
  for (const globalRoot of globalNodeModules()) {
    attempts.push({ root: asPlaywrightRoot(globalRoot), source: 'global' });
    attempts.push({ root: asPlaywrightRoot(path.join(globalRoot, 'playwright')), source: 'global' });
  }
  attempts.push({ root: asPlaywrightRoot(SIBLING_PLAYWRIGHT), source: 'sibling' });
  for (const attempt of attempts) {
    if (attempt.root) {
      locatorCache = { root: attempt.root, modulePath: moduleEntry(attempt.root), source: attempt.source };
      return locatorCache;
    }
  }
  locatorCache = null;
  return null;
}

export function visualSkipMessage(detail?: string): string {
  return `visual check skipped${detail ? ` · ${detail}` : ''} · fix: ${VISUAL_SKIP_FIX}`;
}

/** The single artifact dispatch shared by validate, fix, CLI and MCP. */
export function validateArtifact(html: string, style: StyleSlug): RichValidationResult {
  if (html.includes('class="deck')) return validateDeck(html, style);
  if (html.includes('class="xp ')) return validateExperience(html, style);
  if (html.includes('class="story-page')) return validateStory(html, style);
  return validateHtml(html, style);
}

/** The documented strict bar: craft A (90+), vision 4/4 and no open warning. */
export function meetsStrictBar(result: RichValidationResult): boolean {
  return result.grade === 'A' && result.score >= 90 && result.vision.score >= 4;
}

interface RawFinding {
  code: VisualIssueCode;
  selector: string;
  detail: string;
  text?: string;
}

interface PageLike {
  goto(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'; timeout?: number }): Promise<unknown>;
  addStyleTag(options: { content: string }): Promise<unknown>;
  evaluate<T, A>(fn: ((arg: A) => T) | string, arg: A): Promise<T>;
  waitForTimeout(milliseconds: number): Promise<void>;
  screenshot(options: { path: string; type?: 'png' }): Promise<unknown>;
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

const ANIMATION_RESET =
  '*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;caret-color:transparent!important}';

/**
 * Runs inside Chromium. It is deliberately self-contained: no imports and no
 * closures, because Playwright serialises the function into the page.
 */
function inspectPage(args: { label: string; small: boolean; occlusionOnly: boolean }): RawFinding[] {
  const out: RawFinding[] = [];
  const seen = new Set<string>();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const push = (code: VisualIssueCode, selector: string, detail: string, text?: string): void => {
    const key = `${code}|${selector}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ code, selector, detail, text });
  };

  const escapeIdent = (value: string): string =>
    typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(value)
      : value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');

  const selectorFor = (element: Element): string => {
    if (element === document.body) return 'body';
    if (element === document.documentElement) return 'html';
    const parts: string[] = [];
    let current: Element | null = element;
    while (current && current !== document.body && parts.length < 5) {
      if (current.id) {
        parts.unshift(`#${escapeIdent(current.id)}`);
        break;
      }
      let part = current.tagName.toLowerCase();
      const classes = Array.from(current.classList).filter(
        (name) => name && !/^(anim|reveal|is-|js-)/.test(name),
      );
      if (classes.length) part += `.${classes.slice(0, 3).map(escapeIdent).join('.')}`;
      const parent: Element | null = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((child) => child.tagName === current!.tagName);
        if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
      parts.unshift(part);
      current = current.parentElement;
    }
    return parts.length ? parts.join(' > ') : element.tagName.toLowerCase();
  };

  const isVisible = (element: Element): boolean => {
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) < 0.02) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const snippet = (value: string): string => value.replace(/\s+/g, ' ').trim().slice(0, 64);

  const textNodes: Array<{ node: Text; element: HTMLElement; rects: DOMRect[] }> = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const value = (node.nodeValue ?? '').trim();
    if (value.length < 2) continue;
    const element = node.parentElement;
    if (!element) continue;
    if (element.closest('script,style,noscript,template,svg,canvas,[aria-hidden="true"]')) continue;
    if (!isVisible(element)) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 1 && rect.height > 1);
    if (rects.length) textNodes.push({ node, element, rects });
  }

  const allElements = Array.from(document.querySelectorAll('body *'));

  const intersectionArea = (a: DOMRect, b: DOMRect): number => {
    const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return width * height;
  };

  const occluders = allElements.filter((element) => {
    const style = window.getComputedStyle(element);
    if (style.position !== 'fixed' && style.position !== 'sticky') return false;
    // Decorative backdrops (aria-hidden, pointer-events:none) paint behind the
    // text; only controls and panels that can actually cover copy are flagged.
    if (element.getAttribute('aria-hidden') === 'true' || style.pointerEvents === 'none') return false;
    return isVisible(element);
  });
  for (const occluder of occluders) {
    const rect = occluder.getBoundingClientRect();
    const clipped = new DOMRect(
      Math.max(0, rect.left),
      Math.max(0, rect.top),
      Math.min(viewportWidth, rect.right) - Math.max(0, rect.left),
      Math.min(viewportHeight, rect.bottom) - Math.max(0, rect.top),
    );
    if (clipped.width <= 0 || clipped.height <= 0) continue;
    for (const item of textNodes) {
      if (occluder.contains(item.element)) continue;
      for (const textRect of item.rects) {
        const area = intersectionArea(clipped, textRect);
        const textArea = Math.max(1, textRect.width * textRect.height);
        if (area >= 45 && area / textArea >= 0.12) {
          push(
            'fixed-sticky-element-occludes-text',
            selectorFor(occluder),
            `${window.getComputedStyle(occluder).position} element covers ${Math.round(area)}px² of text at scroll ${Math.round(window.scrollY)}`,
            snippet(item.node.nodeValue ?? ''),
          );
          break;
        }
      }
    }
  }
  if (args.occlusionOnly) return out;

  const documentOverflow = document.documentElement.scrollWidth - viewportWidth;
  if (documentOverflow > 1) {
    const candidates = allElements
      .filter((element) => {
        if (!isVisible(element)) return false;
        const rect = element.getBoundingClientRect();
        return rect.right > viewportWidth + 1 || rect.left < -1;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { element, overflow: Math.max(rect.right - viewportWidth, -rect.left) };
      })
      .sort((a, b) => b.overflow - a.overflow);
    if (candidates.length === 0) {
      push('horizontal-overflow', 'html', `document is ${document.documentElement.scrollWidth}px wide in a ${viewportWidth}px viewport`);
    }
    for (const candidate of candidates.slice(0, 3)) {
      push(
        'horizontal-overflow',
        selectorFor(candidate.element),
        `element extends ${Math.round(candidate.overflow)}px past the ${viewportWidth}px viewport`,
      );
    }
  }

  for (const element of allElements) {
    const style = window.getComputedStyle(element);
    if ((element.textContent ?? '').trim().length < 2 || !isVisible(element)) continue;
    if ((style.overflowX === 'hidden' || style.overflowX === 'clip') && element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1) {
      push(
        'clipped-text',
        selectorFor(element),
        `content is ${element.scrollWidth}px wide inside a ${element.clientWidth}px box with overflow-x:${style.overflowX}`,
        snippet(element.textContent ?? ''),
      );
    }
  }

  if (args.small) {
    for (const item of textNodes) {
      if (item.element.closest('select,option,small.sr-only')) continue;
      const size = Number.parseFloat(window.getComputedStyle(item.element).fontSize);
      if (Number.isFinite(size) && size < 12) {
        push(
          'text-too-small',
          selectorFor(item.element),
          `computed font-size is ${size.toFixed(1)}px at 360px (minimum 12px)`,
          snippet(item.node.nodeValue ?? ''),
        );
      }
    }
  }

  const splitTracks = (value: string): string[] => {
    const tracks: string[] = [];
    let depth = 0;
    let current = '';
    for (const character of value) {
      if (character === '(') depth += 1;
      if (character === ')') depth = Math.max(0, depth - 1);
      if (/\s/.test(character) && depth === 0) {
        if (current) tracks.push(current);
        current = '';
      } else {
        current += character;
      }
    }
    if (current) tracks.push(current);
    return tracks;
  };

  for (const element of allElements) {
    const style = window.getComputedStyle(element);
    if (style.display !== 'grid' && style.display !== 'inline-grid') continue;
    const columns = splitTracks(style.gridTemplateColumns).filter((track) => track && track !== 'none').length;
    if (columns < 2) continue;
    const children = Array.from(element.children).filter((child) => isVisible(child));
    if (children.length < 3) continue;
    const explicit = children.some((child) => {
      const childStyle = window.getComputedStyle(child);
      return childStyle.gridColumnStart !== 'auto' || childStyle.gridColumnEnd !== 'auto';
    });
    if (explicit) continue;
    if (children.length % columns !== 1) continue;
    const orphan = children[children.length - 1]!;
    push(
      'orphan-grid-item',
      selectorFor(element),
      `${children.length} items in ${columns} columns leave a single orphan in the last row`,
      snippet(orphan.textContent ?? ''),
    );
  }

  const decorationClass = /(?:^|[-_])(decor|ornament|orn|shape|blob|pattern|grain|arc|halo|frame|motif|stamp|seal|sun|orbit|ring|swoosh|wave|nebula|star|flower|petal|glyph)(?:[-_]|$)/i;
  const decorations = allElements.filter((element) => {
    const style = window.getComputedStyle(element);
    if (style.position !== 'absolute' || !isVisible(element)) return false;
    const ariaHidden = element.getAttribute('aria-hidden') === 'true' || element.getAttribute('role') === 'presentation';
    const classed = decorationClass.test(element.getAttribute('class') ?? '');
    if (!ariaHidden && !classed) return false;
    const rect = element.getBoundingClientRect();
    if (rect.width > viewportWidth * 0.75 && rect.height > viewportHeight * 0.75) return false;
    const painted =
      style.backgroundImage !== 'none' ||
      style.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
      style.boxShadow !== 'none' ||
      Number.parseFloat(style.borderTopWidth) > 0 ||
      element.querySelector('svg,img,canvas,picture') !== null;
    return painted;
  });
  for (const decoration of decorations) {
    const rect = decoration.getBoundingClientRect();
    for (const item of textNodes) {
      if (decoration.contains(item.element)) continue;
      for (const textRect of item.rects) {
        const area = intersectionArea(rect, textRect);
        const textArea = Math.max(1, textRect.width * textRect.height);
        if (area >= 240 && area / textArea >= 0.15) {
          push(
            'overlap-decoration-on-content',
            selectorFor(decoration),
            `decoration covers ${Math.round(area)}px² of text`,
            snippet(item.node.nodeValue ?? ''),
          );
          break;
        }
      }
    }
  }

  for (const item of textNodes) {
    const style = window.getComputedStyle(item.element);
    if (style.writingMode && style.writingMode !== 'horizontal-tb') continue;
    const transform = style.transform;
    if (transform && transform !== 'none') {
      const matrix = /matrix(?:3d)?\(([^)]+)\)/.exec(transform)?.[1]?.split(',').map(Number);
      if (matrix && (Math.abs(matrix[1] ?? 0) > 0.01 || Math.abs(matrix[2] ?? 0) > 0.01)) continue;
    }
    const wrap = style.overflowWrap === 'anywhere' || style.overflowWrap === 'break-word';
    const breakAll = style.wordBreak === 'break-all' || style.wordBreak === 'break-word';
    if (!wrap && !breakAll) continue;
    const text = item.node.nodeValue ?? '';
    const wordPattern = /\S+/g;
    let words = 0;
    let match: RegExpExecArray | null;
    while ((match = wordPattern.exec(text)) !== null) {
      const word = match[0];
      if (word.length < 3) continue;
      words += 1;
      if (words > 80) break;
      const start = match.index;
      const lines = new Set<number>();
      for (let index = 0; index < Math.min(word.length, 40); index += 1) {
        const range = document.createRange();
        range.setStart(item.node, start + index);
        range.setEnd(item.node, start + index + 1);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) lines.add(Math.round(rect.top / 2));
      }
      if (lines.size >= 2) {
        push(
          'mid-word-break',
          selectorFor(item.element),
          `"${word}" wraps inside the word across ${lines.size} lines`,
          word,
        );
        break;
      }
    }
  }

  return out;
}

function issueFor(finding: VisualFinding): RichIssue {
  const text = finding.text ? ` Text: "${finding.text}".` : '';
  const base = { severity: 'warn' as const, code: finding.code, where: `${finding.viewport} · ${finding.selector}` };
  switch (finding.code) {
    case 'horizontal-overflow':
      return {
        ...base,
        message: `The page overflows horizontally: ${finding.detail}.${text}`,
        why: 'A phone can pan sideways or hide the right edge; the reader loses the line and the page feels broken.',
        example: 'img{max-width:100%;height:auto} .row{min-width:0}',
        fix: 'Constrain the element with max-width:100%, min-width:0 or a fluid width.',
        patch: [
          { op: 'fit-wide-element', params: { selector: finding.selector } },
          { op: 'clamp-overflow' },
        ],
      };
    case 'fixed-sticky-element-occludes-text':
      return {
        ...base,
        message: `A fixed or sticky element covers readable text: ${finding.detail}.${text}`,
        why: 'A floating control that sits over a paragraph makes the sentence unreadable exactly where the reader is looking.',
        example: '@media(max-width:640px){.motion-toggle{position:static;margin:12px auto}}',
        fix: 'Reserve space for the control or take it out of the reading area on narrow screens.',
        patch: [{ op: 'reserve-fixed-space', params: { selector: finding.selector } }],
      };
    case 'orphan-grid-item':
      return {
        ...base,
        message: `The last grid row holds a single item: ${finding.detail}.${text}`,
        why: 'An orphan card reads as a missing element, not as a composition: the grid looks unfinished at desktop width.',
        example: '.works>:last-child{grid-column:1/-1}',
        fix: 'Make the last item span the full row, or use a number of items that fills the columns.',
        patch: [{ op: 'span-last-grid-item', params: { selector: finding.selector } }],
      };
    case 'clipped-text':
      return {
        ...base,
        message: `Text is clipped by its own box: ${finding.detail}.${text}`,
        why: 'Clipped words leave a sentence cut in half; the reader cannot recover the missing text.',
        example: '.tag{overflow:visible;white-space:normal;text-overflow:clip}',
        fix: 'Let the text wrap or grow instead of hiding its overflow.',
        patch: [{ op: 'unclip-text', params: { selector: finding.selector } }],
      };
    case 'text-too-small':
      return {
        ...base,
        message: `Text is below 12px on a phone: ${finding.detail}.${text}`,
        why: 'Under 12px the copy is no longer comfortably readable at arm length; labels become texture instead of information.',
        example: '.caption{font-size:12px}',
        fix: 'Raise the computed size to at least 12px at 360px, or remove the label.',
        patch: [{ op: 'raise-small-text', params: { selector: finding.selector } }],
      };
    case 'overlap-decoration-on-content':
      return {
        ...base,
        message: `A decorative element covers content: ${finding.detail}.${text}`,
        why: 'Ornament that sits on top of a paragraph competes with the words and makes the layout look accidental.',
        example: '.halo{display:none}',
        fix: 'Move the decoration out of the text column or remove it; decoration must never cover readable copy.',
        patch: [{ op: 'hide-decoration', params: { selector: finding.selector } }],
      };
    case 'mid-word-break': {
      const counter = /^\d/.test(finding.text ?? '') || /(?:^|[-_])(count|stat|metric|number|num|figure)(?:[-_]|$)/i.test(finding.selector);
      return {
        ...base,
        message: `A word breaks in the middle: ${finding.detail}.${text}`,
        why: 'Breaking inside a word turns a label into two fragments and is the classic sign of an overflow clamp applied to normal copy.',
        example: counter ? '.counter{white-space:nowrap}' : '.copy{overflow-wrap:normal;word-break:normal}',
        fix: counter ? 'Keep counters on one line with white-space:nowrap.' : 'Remove overflow-wrap:anywhere / word-break from readable words.',
        patch: [
          counter
            ? { op: 'nowrap-counters', params: { selector: finding.selector } }
            : { op: 'prevent-midword-break', params: { selector: finding.selector } },
        ],
      };
    }
    default: {
      const exhaustive: never = finding.code;
      return exhaustive;
    }
  }
}

function dedupeFindings(findings: VisualFinding[]): VisualFinding[] {
  const seen = new Set<string>();
  const out: VisualFinding[] = [];
  for (const finding of findings) {
    const key = `${finding.code}|${finding.selector}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(finding);
  }
  return out;
}

async function loadChromium(location: PlaywrightLocation): Promise<ChromiumLike> {
  const imported = (await import(pathToFileURL(location.modulePath).href)) as { chromium?: ChromiumLike };
  if (!imported.chromium) throw new Error('the playwright package has no chromium export');
  return imported.chromium;
}

async function auditViewport(
  browser: BrowserLike,
  file: string,
  viewport: VisualViewport,
  shots: string | undefined,
): Promise<{ findings: VisualFinding[]; shot?: string }> {
  const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
  try {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => true });
    });
    const page = await context.newPage();
    await page.goto(`${pathToFileURL(file).href}?static`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // tsx/esbuild's keepNames helper is not defined in the page context.
    await page.evaluate<unknown, undefined>('window.__name = function (fn) { return fn; };', undefined);
    await page.addStyleTag({ content: ANIMATION_RESET });
    await page.evaluate(
      () => Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))]),
      undefined,
    );
    const maxScroll = await page.evaluate(
      () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
      undefined,
    );
    const positions = [0, 0.25, 0.5, 0.75, 1].map((fraction) => Math.round(maxScroll * fraction));
    const findings: VisualFinding[] = [];
    for (const [index, top] of [...new Set(positions)].entries()) {
      await page.evaluate((scrollTop) => window.scrollTo(0, scrollTop), top);
      await page.waitForTimeout(60);
      const raw = await page.evaluate(inspectPage, {
        label: viewport.label,
        small: viewport.width <= 400,
        occlusionOnly: index > 0,
      });
      findings.push(...raw.map((finding) => ({ ...finding, viewport: viewport.label })));
    }
    let shot: string | undefined;
    if (shots) {
      await page.evaluate(() => window.scrollTo(0, 0), undefined);
      await page.waitForTimeout(60);
      shot = path.join(shots, `visual-${viewport.width}.png`);
      await page.screenshot({ path: shot, type: 'png' });
    }
    return { findings, shot };
  } finally {
    await context.close().catch(() => {});
  }
}

/** One file, every viewport, on a browser the caller already launched. */
async function collectFindings(
  browser: BrowserLike,
  file: string,
  viewports: VisualViewport[],
  shots: string | undefined,
): Promise<{ findings: VisualFinding[]; shots: string[] }> {
  const findings: VisualFinding[] = [];
  const shotPaths: string[] = [];
  for (const viewport of viewports) {
    const result = await auditViewport(browser, file, viewport, shots);
    findings.push(...result.findings);
    if (result.shot) shotPaths.push(result.shot);
  }
  return { findings: dedupeFindings(findings), shots: shotPaths };
}

export async function runVisualAudit(
  html: string,
  _style: StyleSlug,
  options: VisualAuditOptions = {},
): Promise<VisualAuditReport> {
  const location = options.playwright === undefined ? locatePlaywright() : options.playwright;
  if (!location) {
    return { status: 'skipped', message: visualSkipMessage(), issues: [], findings: [] };
  }

  let file = options.filePath ? path.resolve(options.filePath) : undefined;
  let tempDir: string | undefined;
  if (!file) {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'beauty-visual-'));
    file = path.join(tempDir, 'artifact.html');
    await writeFile(file, html, 'utf8');
  }

  if (options.shots) await mkdir(path.resolve(options.shots), { recursive: true });

  let browser: BrowserLike | undefined;
  try {
    const chromium = await loadChromium(location);
    browser = await chromium.launch({ headless: true });
    const { findings, shots } = await collectFindings(
      browser,
      file,
      options.viewports ?? VISUAL_VIEWPORTS,
      options.shots ? path.resolve(options.shots) : undefined,
    );
    return {
      status: 'ran',
      issues: findings.map(issueFor),
      findings,
      playwright: location,
      shots: shots.length ? shots : undefined,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
    return {
      status: 'skipped',
      message: visualSkipMessage(`playwright found at ${location.root} but Chromium failed: ${reason}`),
      issues: [],
      findings: [],
      playwright: location,
    };
  } finally {
    await browser?.close().catch(() => {});
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  }
}

export interface BatchAuditArtifact {
  html: string;
  style: StyleSlug;
  /** Stable, filesystem-safe name used for the temp file and the report. */
  label: string;
  /** Absolute path; when present the html is read from this file instead. */
  filePath?: string;
}

export interface BatchAuditOptions {
  /** Parallel pages sharing one browser. Defaults to 4. */
  concurrency?: number;
  viewports?: VisualViewport[];
}

export interface BatchAuditEntry {
  label: string;
  result: RichValidationResult;
  visual: VisualAuditReport;
}

/**
 * The same audit as `auditArtifact`, batched: one Chromium for the whole
 * matrix and a small pool of pages. Used by `pnpm visual:matrix` and its test
 * so 91 artefacts stay under a couple of minutes.
 */
export async function auditArtifactBatch(
  items: BatchAuditArtifact[],
  options: BatchAuditOptions = {},
): Promise<BatchAuditEntry[]> {
  const entries = new Array<BatchAuditEntry>(items.length);
  const location = locatePlaywright();
  if (!location) {
    items.forEach((item, index) => {
      entries[index] = {
        label: item.label,
        result: validateArtifact(item.html, item.style),
        visual: { status: 'skipped', message: visualSkipMessage(), issues: [], findings: [] },
      };
    });
    return entries;
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'beauty-visual-batch-'));
  const fileFor = async (item: BatchAuditArtifact): Promise<string> => {
    if (item.filePath) return path.resolve(item.filePath);
    const file = path.join(tempDir, `${item.label.replace(/[^a-z0-9_-]+/gi, '-')}.html`);
    await writeFile(file, item.html, 'utf8');
    return file;
  };

  let browser: BrowserLike | undefined;
  try {
    const chromium = await loadChromium(location);
    browser = await chromium.launch({ headless: true });
    const queue = items.map((item, index) => ({ item, index }));
    const concurrency = Math.max(1, Math.min(options.concurrency ?? 4, queue.length || 1));
    const worker = async (): Promise<void> => {
      for (;;) {
        const next = queue.shift();
        if (!next) return;
        const { item, index } = next;
        const file = await fileFor(item);
        const { findings } = await collectFindings(browser!, file, options.viewports ?? VISUAL_VIEWPORTS, undefined);
        const visual: VisualAuditReport = {
          status: 'ran',
          issues: findings.map(issueFor),
          findings,
          playwright: location,
        };
        const base = validateArtifact(item.html, item.style);
        entries[index] = {
          label: item.label,
          result: visual.issues.length ? mergeIssues(base, visual.issues) : base,
          visual,
        };
      }
    };
    await Promise.all(Array.from({ length: concurrency }, worker));
    return entries;
  } catch (error) {
    const reason = error instanceof Error ? error.message.split('\n')[0] : String(error);
    const skipped: VisualAuditReport = {
      status: 'skipped',
      message: visualSkipMessage(`playwright found at ${location.root} but Chromium failed: ${reason}`),
      issues: [],
      findings: [],
      playwright: location,
    };
    items.forEach((item, index) => {
      if (!entries[index]) {
        entries[index] = { label: item.label, result: validateArtifact(item.html, item.style), visual: skipped };
      }
    });
    return entries;
  } finally {
    await browser?.close().catch(() => {});
    await rm(tempDir, { recursive: true, force: true });
  }
}

/**
 * One audit entry for both `validate` and `fix`: same dispatch, same options,
 * so the two commands cannot grade the same file differently.
 */
export async function auditArtifact(
  html: string,
  style: StyleSlug,
  options: AuditOptions = {},
): Promise<AuditReport> {
  const base = validateArtifact(html, style);
  if (!options.visual) {
    return { result: base, visual: { status: 'skipped', issues: [], findings: [] } };
  }
  const visual = await runVisualAudit(html, style, {
    filePath: options.filePath,
    shots: options.shots,
  });
  if (visual.status === 'skipped' || visual.issues.length === 0) return { result: base, visual };
  return { result: mergeIssues(base, visual.issues), visual };
}

export interface AuditFixResult extends FixResult {
  beforeResult: RichValidationResult;
  afterResult: RichValidationResult;
  visual: VisualAuditReport;
}

/**
 * Repair loop used by `beauty fix` and the MCP tool. Every pass validates with
 * the same entry function and options as `beauty validate`, then re-validates
 * the final file before reporting before/after.
 */
export async function repairArtifact(
  html: string,
  style: StyleSlug,
  options: AuditOptions & { maxPasses?: number } = {},
): Promise<AuditFixResult> {
  const maxPasses = options.maxPasses ?? 3;
  // The browser pass must see the in-memory candidate, not the original file
  // on disk, so filePath is intentionally not forwarded inside the loop.
  const auditOptions: AuditOptions = { visual: options.visual, shots: options.shots };
  const before = await auditArtifact(html, style, auditOptions);
  let current = html;
  const fixes: string[] = [];

  for (let pass = 0; pass < maxPasses; pass += 1) {
    const report = await auditArtifact(current, style, auditOptions);
    const patches = report.result.issues.flatMap((issue) => issue.patch ?? []);
    if (patches.length === 0) break;
    const next = applyPatches(current, style, patches);
    if (next === current) break;
    current = next;
    for (const patch of patches) {
      const target = patch.params?.selector ?? patch.params?.family ?? patch.params?.token ?? patch.params?.tag ?? '';
      const label = `${patch.op}${target ? ` (${target})` : ''}`;
      if (!fixes.includes(label)) fixes.push(label);
    }
  }

  const after = await auditArtifact(current, style, auditOptions);
  const snapshot = (result: RichValidationResult) => ({
    score: result.score,
    grade: result.grade,
    errors: result.issues.filter((issue) => issue.severity === 'error').length,
    warnings: result.issues.filter((issue) => issue.severity === 'warn').length,
    infos: result.issues.filter((issue) => issue.severity === 'info').length,
  });

  return {
    html: current,
    changed: current !== html,
    before: snapshot(before.result),
    after: snapshot(after.result),
    beforeResult: before.result,
    afterResult: after.result,
    fixes,
    visual: after.visual.status === 'ran' ? after.visual : before.visual,
  };
}
