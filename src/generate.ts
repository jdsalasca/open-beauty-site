import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Brief, GifOptions, GifResult, StyleSlug, ValidationResult } from './types.js';
import { renderPage } from './page/index.js';
import { validateHtml } from './validate.js';
import { createGif } from './gif.js';

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
