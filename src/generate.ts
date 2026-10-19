import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ExperienceBrief, GifOptions, GifResult, PageBrief, StoryBrief, StyleSlug, ValidationResult } from './types.js';
import { renderPage } from './page/index.js';
import { validateDeck, validateExperience, validateHtml, validateStory } from './validate.js';
import { createGif } from './gif.js';
import { motionChecks, renderMotion } from './motion.js';
import { canvasChecks, renderCanvas } from './canvas-art.js';
import { renderSequence } from './sequence.js';
import { renderDeck } from './deck.js';
import { renderExperience } from './page/experience.js';
import { renderStory } from './page/story.js';
import { getStyle } from './styles/presets.js';

export interface PageResult {
  html: string;
  path?: string;
  validation: ValidationResult;
}

export interface CreatePageOptions {
  style: StyleSlug;
  brief: Partial<PageBrief>;
  /** Absolute path or a path relative to process.cwd(). Omit to return HTML only. */
  output?: string;
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56) || 'page';
}

export function timestamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export async function createPage({ style, brief, output }: CreatePageOptions): Promise<PageResult> {
  const html = renderPage(style, brief);
  const validation = validateHtml(html, style);

  if (!output) {
    return { html, validation };
  }

  const absolute = path.resolve(process.cwd(), output);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, html, 'utf8');
  return { html, path: absolute, validation };
}

export interface CreateGifFileOptions extends GifOptions {
  style: StyleSlug;
  output?: string;
}

export async function createGifFile({ style, output, ...options }: CreateGifFileOptions): Promise<GifResult> {
  const target = path.resolve(
    process.cwd(),
    output ?? path.join('beauty-output', `${style}-${slugify(options.text)}-${timestamp()}.gif`),
  );
  await mkdir(path.dirname(target), { recursive: true });
  return createGif(style, options, target);
}

export interface CreateSequenceOptions {
  style: StyleSlug;
  brief: Partial<import('./types.js').SequenceBrief>;
  output?: string;
}

export async function createSequence({ style, brief, output }: CreateSequenceOptions): Promise<import('./types.js').SequenceResult> {
  const rendered = await renderSequence({ ...brief, style });
  const requested = path.resolve(process.cwd(), output ?? path.join('beauty-output', `${style}-sequence-${slugify(brief.title || 'sequence')}-${timestamp()}`));
  const base = requested.toLowerCase().endsWith('.svg') ? requested.slice(0, -4) : requested;
  const pathSvg = `${base}.svg`;
  const pathGif = `${base}.gif`;
  await mkdir(path.dirname(pathSvg), { recursive: true });
  await writeFile(pathSvg, rendered.svg, 'utf8');
  if (rendered.gif) await writeFile(pathGif, rendered.gif);
  return {
    svg: rendered.svg,
    gif: rendered.gif ? pathGif : undefined,
    pathSvg,
    pathGif,
    width: rendered.width,
    height: rendered.height,
    frames: rendered.frames,
    fps: rendered.fps,
    duration: rendered.duration,
    bytesSvg: Buffer.byteLength(rendered.svg, 'utf8'),
    bytesGif: rendered.gif?.length,
    checks: rendered.checks,
  };
}

export interface CreateMotionOptions {
  style: StyleSlug;
  brief: import('./types.js').MotionBrief;
  output?: string;
}

export async function createMotion({ style, brief, output }: CreateMotionOptions): Promise<import('./types.js').MotionResult> {
  const svg = renderMotion({ ...brief, style });
  const target = path.resolve(
    process.cwd(),
    output ?? path.join('beauty-output', `${style}-motion-${slugify(brief.title)}-${timestamp()}.svg`),
  );
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, svg, 'utf8');
  const dimensions = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  return {
    path: target,
    width: Number(dimensions?.[1] ?? 1600),
    height: Number(dimensions?.[2] ?? 1000),
    scene: brief.scene ?? 'orbit',
    duration: brief.duration ?? 14,
    bytes: Buffer.byteLength(svg, 'utf8'),
    checks: motionChecks(svg, brief.scene ?? 'orbit'),
  };
}

export interface CreateCanvasOptions {
  style: StyleSlug;
  brief: Omit<import('./types.js').CanvasBrief, 'style'> & { style?: StyleSlug };
  output?: string;
}

export async function createCanvas({ style, brief, output }: CreateCanvasOptions): Promise<import('./types.js').CanvasResult> {
  const svg = renderCanvas({ ...brief, style });
  const target = path.resolve(
    process.cwd(),
    output ?? path.join('beauty-output', `${style}-canvas-${slugify(brief.title || 'canvas')}-${timestamp()}.svg`),
  );
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, svg, 'utf8');
  const dimensions = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  const assets = (brief.layers ?? []).flatMap(function all(layer: import('./types.js').CanvasLayer): Array<{ href: string; alt: string; caption?: string; source?: string }> {
    return layer.kind === 'group' ? layer.children.flatMap(all) : layer.kind === 'image' ? [{ href: layer.href, alt: layer.alt, caption: layer.caption, source: layer.source }] : [];
  });
  const count = (brief.layers ?? []).reduce((sum, layer) => sum + 1 + (layer.kind === 'group' ? layer.children.length : 0), 0);
  return {
    path: target,
    width: Number(dimensions?.[1] ?? 1600),
    height: Number(dimensions?.[2] ?? 1000),
    layerCount: count,
    bytes: Buffer.byteLength(svg, 'utf8'),
    assets,
    checks: canvasChecks(svg, brief),
  };
}

export interface CreateDeckOptions {
  style: StyleSlug;
  brief: import('./types/deck.js').DeckBriefInput;
  /** Absolute path or a path relative to process.cwd(). Omit to return HTML only. */
  output?: string;
}

export async function createDeck({ style, brief, output }: CreateDeckOptions): Promise<PageResult & { slideCount: number; subfamily: string; warnings: string[] }> {
  const deck = renderDeck({ style: getStyle(style), brief });
  const validation = validateDeck(deck.html, style);
  if (!output) {
    return { html: deck.html, validation, slideCount: deck.slideCount, subfamily: deck.subfamily.name, warnings: deck.warnings };
  }
  const absolute = path.resolve(process.cwd(), output);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, deck.html, 'utf8');
  return { html: deck.html, path: absolute, validation, slideCount: deck.slideCount, subfamily: deck.subfamily.name, warnings: deck.warnings };
}

export interface CreateExperienceOptions {
  style: StyleSlug;
  brief: Partial<ExperienceBrief>;
  output?: string;
}

export async function createExperience({ style, brief, output }: CreateExperienceOptions): Promise<PageResult & { roomCount: number; kind: string }> {
  const html = renderExperience(brief, getStyle(style));
  const validation = validateExperience(html, style);
  const roomCount = Math.min(8, Math.max(3, brief.rooms?.length ?? 3));
  const kind = brief.kind ?? 'studio';
  if (!output) return { html, validation, roomCount, kind };
  const absolute = path.resolve(process.cwd(), output);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, html, 'utf8');
  return { html, path: absolute, validation, roomCount, kind };
}

export interface CreateStoryOptions {
  style: StyleSlug;
  brief: Partial<StoryBrief>;
  output?: string;
}

export async function createStory({ style, brief, output }: CreateStoryOptions): Promise<PageResult & { chapterCount: number }> {
  const html = renderStory(brief, getStyle(style));
  const validation = validateStory(html, style);
  const chapterCount = Math.min(8, Math.max(2, brief.chapters?.length ?? 2));
  if (!output) return { html, validation, chapterCount };
  const absolute = path.resolve(process.cwd(), output);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, html, 'utf8');
  return { html, path: absolute, validation, chapterCount };
}

