#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Brief, StyleSlug } from './types.js';
import { VERSION } from './index.js';
import { createGifFile, createPage, slugify, timestamp } from './generate.js';
import { formatValidation, validateHtml } from './validate.js';
import { getStyle, isStyleSlug, styleSlugs } from './styles/presets.js';
import { styleGuideMarkdown, stylesOverview } from './guide.js';
import { ensureFonts } from './canvas.js';
import { packageRoot } from './paths.js';

type Flags = Record<string, string | boolean>;

function parseArgs(argv: string[]): { positionals: string[]; flags: Flags } {
  const positionals: string[] = [];
  const flags: Flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] ?? '';
    if (token.startsWith('--')) {
      const body = token.slice(2);
      const equals = body.indexOf('=');
      if (equals >= 0) {
        flags[body.slice(0, equals)] = body.slice(equals + 1);
      } else {
        const next = argv[index + 1];
        if (next && !next.startsWith('--')) {
          flags[body] = next;
          index += 1;
        } else {
          flags[body] = true;
        }
      }
    } else {
      positionals.push(token);
    }
  }
  return { positionals, flags };
}

function stringFlag(flags: Flags, name: string): string | undefined {
  const value = flags[name];
  return typeof value === 'string' ? value : undefined;
}

function numberFlag(flags: Flags, name: string): number | undefined {
  const value = stringFlag(flags, name);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function requireStyle(value: string | undefined): StyleSlug {
  if (!value || !isStyleSlug(value)) {
    throw new Error(`Pass --style <${styleSlugs.join('|')}>.`);
  }
  return value;
}

async function loadBrief(value: string | undefined): Promise<Partial<Brief>> {
  if (!value) return {};
  const raw = value.trim().startsWith('{') ? value : await readFile(path.resolve(process.cwd(), value), 'utf8');
  return JSON.parse(raw) as Partial<Brief>;
}

function mergeBrief(fileBrief: Partial<Brief>, flags: Flags): Partial<Brief> {
  const merged: Partial<Brief> = { ...fileBrief };
  if (stringFlag(flags, 'title')) merged.title = stringFlag(flags, 'title');
  if (stringFlag(flags, 'tagline')) merged.tagline = stringFlag(flags, 'tagline');
  if (stringFlag(flags, 'intro')) merged.intro = stringFlag(flags, 'intro');
  if (stringFlag(flags, 'eyebrow')) merged.eyebrow = stringFlag(flags, 'eyebrow');
  if (stringFlag(flags, 'brand')) merged.brand = stringFlag(flags, 'brand');
  if (stringFlag(flags, 'footer')) merged.footer = stringFlag(flags, 'footer');
  const locale = stringFlag(flags, 'locale');
  if (locale === 'es' || locale === 'en') merged.locale = locale;
  const seed = numberFlag(flags, 'seed');
  if (seed !== undefined) merged.seed = seed;
  return merged;
}

function help(): string {
  return `open-beauty-site ${VERSION}
A design harness for small models: HTML pages + GIFs with an editorial line.

Usage:
  beauty styles                              List the eleven styles
  beauty guide <style> [--json]              Read the exact tokens and rules
  beauty page --style <s> --title "..."      Create a full HTML page
      [--tagline "..."] [--intro "..."] [--brand "..."] [--locale es|en]
      [--brief brief.json] [--out file.html]
  beauty gif --style <s> --text "..."        Create a looping GIF
      [--subtitle "..."] [--template title|loop|poster] [--fps 20] [--duration 2.4]
      [--width 800] [--height 800] [--out file.gif]
  beauty validate <file> --style <s> [--strict]
  beauty examples                            Show reference output
  beauty doctor                              Check fonts and runtime
  beauty mcp                                 Start the MCP server (stdio)

Styles: ${styleSlugs.join(', ')}
`;
}

async function main(): Promise<void> {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const command = positionals[0] ?? 'help';

  switch (command) {
    case 'help':
    case '--help':
    case '-h':
      console.log(help());
      return;

    case 'version':
    case '--version':
    case '-v':
      console.log(VERSION);
      return;

    case 'styles':
    case 'list':
      console.log(stylesOverview());
      return;

    case 'guide': {
      const style = positionals[1];
      if (!style || !isStyleSlug(style)) {
        throw new Error(`Pass a style: ${styleSlugs.join(', ')}.`);
      }
      console.log(flags.json ? JSON.stringify(getStyle(style), null, 2) : styleGuideMarkdown(style));
      return;
    }

    case 'page':
    case 'new': {
      const style = requireStyle(stringFlag(flags, 'style'));
      const brief = mergeBrief(await loadBrief(stringFlag(flags, 'brief')), flags);
      if (!brief.title) throw new Error('Pass --title "..." or use --brief with a title.');
      const output =
        stringFlag(flags, 'out') ??
        path.join('beauty-output', `${style}-${slugify(brief.title)}-${timestamp()}.html`);
      const result = await createPage({ style, brief, output });
      console.log(`${getStyle(style).name} · ${result.validation.grade} ${result.validation.score}/100`);
      console.log(result.path);
      if (result.validation.issues.length) {
        console.log(formatValidation(result.validation));
      } else {
        console.log('No issues. The page follows the editorial system.');
      }
      return;
    }

    case 'gif': {
      const style = requireStyle(stringFlag(flags, 'style'));
      const text = stringFlag(flags, 'text');
      if (!text) throw new Error('Pass --text "..." for the GIF headline.');
      const output =
        stringFlag(flags, 'out') ??
        path.join('beauty-output', `${style}-${slugify(text)}-${timestamp()}.gif`);
      const templateFlag = stringFlag(flags, 'template');
      const template = templateFlag === 'loop' || templateFlag === 'poster' || templateFlag === 'title' ? templateFlag : undefined;
      const result = await createGifFile({
        style,
        text,
        subtitle: stringFlag(flags, 'subtitle'),
        template,
        width: numberFlag(flags, 'width'),
        height: numberFlag(flags, 'height'),
        fps: numberFlag(flags, 'fps'),
        duration: numberFlag(flags, 'duration'),
        output,
      });
      console.log(`${getStyle(style).name} GIF · ${result.width}×${result.height} · ${result.frames} frames · ${Math.round(result.bytes / 1024)} KB`);
      console.log(result.path);
      return;
    }

    case 'validate': {
      const file = positionals[1];
      if (!file) throw new Error('Pass an HTML file to validate.');
      const style = requireStyle(stringFlag(flags, 'style'));
      const html = await readFile(path.resolve(process.cwd(), file), 'utf8');
      const result = validateHtml(html, style);
      console.log(formatValidation(result));
      console.log(`stats: ${JSON.stringify(result.stats)}`);
      if (flags.strict && result.score < 90) process.exitCode = 1;
      return;
    }

    case 'examples': {
      const root = packageRoot();
      for (const style of styleSlugs) {
        console.log(`${getStyle(style).name}:`);
        console.log(`  page ${path.join(root, 'examples', style, 'index.html')}`);
        console.log(`  gif  ${path.join(root, 'examples', 'gifs', `${style}.gif`)}`);
      }
      return;
    }

    case 'doctor': {
      console.log(`open-beauty-site ${VERSION}`);
      console.log(`node ${process.version}`);
      console.log(`package root ${packageRoot()}`);
      ensureFonts();
      console.log('fonts registered: EB Garamond, Archivo Black, Space Mono, Fraunces, Nunito Sans');
      console.log('native canvas: ok');
      console.log('status: ready');
      return;
    }

    case 'mcp': {
      const { startBeautyServer } = await import('./mcp/server.js');
      await startBeautyServer();
      return;
    }

    default:
      console.error(`Unknown command "${command}".\n`);
      console.log(help());
      process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`beauty: ${(error as Error).message}`);
  process.exitCode = 1;
});
