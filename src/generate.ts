import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Brief, DeckBrief, ExperienceBrief, GifOptions, GifResult, StoryBrief, StyleSlug, ValidationResult } from './types.js';
import { renderPage } from './page/index.js';
import { validateDeck, validateExperience, validateHtml, validateStory } from './validate.js';
import { createGif } from './gif.js';
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
  brief: Partial<Brief>;
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

export interface CreateDeckOptions {
  style: StyleSlug;
  brief: Partial<DeckBrief>;
  /** Absolute path or a path relative to process.cwd(). Omit to return HTML only. */
  output?: string;
}

export async function createDeck({ style, brief, output }: CreateDeckOptions): Promise<PageResult & { slideCount: number; subfamily: string }> {
  const deck = renderDeck({ style: getStyle(style), brief });
  const validation = validateDeck(deck.html, style);
  if (!output) {
    return { html: deck.html, validation, slideCount: deck.slideCount, subfamily: deck.subfamily.name };
  }
  const absolute = path.resolve(process.cwd(), output);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, deck.html, 'utf8');
  return { html: deck.html, path: absolute, validation, slideCount: deck.slideCount, subfamily: deck.subfamily.name };
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

