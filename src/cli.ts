#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Brief, DeckBrief, ExperienceBrief, SprintBrief, StoryBrief, StyleSlug } from './types.js';
import { VERSION } from './index.js';
import { createCanvas, createDeck, createExperience, createGifFile, createMotion, createPage, createStory, slugify, timestamp } from './generate.js';
import { createSprintKit } from './sprint.js';
import { formatValidation, validateDeck, validateExperience, validateHtml, validateStory } from './validate.js';
import { getStyle, isStyleSlug, styleSlugs } from './styles/presets.js';
import { makeArtifact } from './make.js';
import { MAKE_KINDS, isMakeKind } from './types/make.js';
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

function booleanFlag(flags: Flags, name: string): boolean {
  return flags[name] === true || flags[name] === 'true' || flags[name] === '1';
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

async function loadBrief<T extends Partial<Brief>>(value: string | undefined): Promise<T> {
  if (!value) return {} as T;
  const raw = value.trim().startsWith('{') ? value : await readFile(path.resolve(process.cwd(), value), 'utf8');
  return JSON.parse(raw) as T;
}

function mergeBrief<T extends Partial<Brief>>(fileBrief: T, flags: Flags): T {
  const merged: T = { ...fileBrief };
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
  const subfamily = stringFlag(flags, 'subfamily');
  if (subfamily) merged.subfamily = subfamily;
  if (booleanFlag(flags, 'maxxing')) merged.maxxing = true;
  return merged;
}

function help(): string {
  return `open-beauty-site ${VERSION}
A design harness for small models: HTML pages + GIFs with an editorial line.

Usage:
  beauty styles                              List the thirteen styles
  beauty guide <style> [--json]              Read the exact tokens and rules
  beauty make <kind> --style <s> --idea "one sentence"
      Create everything in one shot: page|deck|gif|story|experience|motion
      [--locale es|en] [--out path]
  beauty page --style <s> --title "..."      Create a full HTML page
      [--tagline "..."] [--intro "..."] [--brand "..."] [--locale es|en]
      [--maxxing] [--brief brief.json] [--out file.html]
  beauty deck --style <s> --title "..."      Create an animated 16:9 presentation
      --brief deck.json [--subfamily orbital] [--maxxing] [--out deck.html]
  beauty experience --style <s> --brief exp.json  Create a 3–8 room experience [--maxxing]
  beauty story --style <s> --brief story.json     Create a chaptered story/lesson [--maxxing]
  beauty sprint --style <s> --brief sprint.json   Create review + retrospective + planning + 3 GIFs
  beauty canvas --style <s> --brief canvas.json  Create an open animated SVG canvas
  beauty motion --style <s> --title "..."      Create an animated SVG loop
      [--scene orbit|bloom|tide|papercut|constellation|ribbon|rain|type]
      [--size square|portrait|landscape] [--duration 14] [--maxxing] [--out loop.svg]
  beauty gif --style <s> --text "..."        Create a looping GIF
      [--subtitle "..."] [--template title|loop|poster] [--fps 20] [--duration 2.4]
      [--width 800] [--height 800] [--maxxing] [--out file.gif]
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

    case 'make': {
      const kind = positionals[1] ?? stringFlag(flags, 'kind');
      if (!kind || !isMakeKind(kind)) {
        throw new Error(`Pass a kind: ${MAKE_KINDS.join('|')}. Example: beauty make gif --style brutalist --idea "a poster for a night market".`);
      }
      const style = requireStyle(stringFlag(flags, 'style'));
      const localeFlag = stringFlag(flags, 'locale');
      if (localeFlag && localeFlag !== 'es' && localeFlag !== 'en') {
        throw new Error('Pass --locale es|en.');
      }
      const result = await makeArtifact({
        kind,
        style,
        idea: stringFlag(flags, 'idea') ?? '',
        locale: localeFlag === 'en' ? 'en' : localeFlag === 'es' ? 'es' : undefined,
        output: stringFlag(flags, 'out'),
      });
      console.log(result.summary);
      console.log(result.path);
      for (const issue of result.issues) {
        console.log(`[${issue.severity}] ${issue.code}: ${issue.message}`);
        if (issue.fix) console.log(`  fix: ${issue.fix}`);
      }
      console.log(result.next_step);
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

    case 'deck': {
      const style = requireStyle(stringFlag(flags, 'style'));
      const brief = mergeBrief(await loadBrief<Partial<DeckBrief>>(stringFlag(flags, 'brief')), flags);
      if (!brief.title) throw new Error('Pass --title "..." or use --brief with a title.');
      const output =
        stringFlag(flags, 'out') ??
        path.join('beauty-output', `${style}-deck-${slugify(brief.title)}-${timestamp()}.html`);
      const result = await createDeck({ style, brief, output });
      console.log(`${getStyle(style).name} deck · ${result.slideCount} slides · ${result.subfamily}`);
      console.log(`${result.validation.grade} ${result.validation.score}/100 · vision ${result.validation.vision.score}/4`);
      console.log(result.path);
      if (result.validation.issues.length) console.log(formatValidation(result.validation));
      return;
    }

    case 'experience': {
      const style = requireStyle(stringFlag(flags, 'style'));
      const brief = mergeBrief(await loadBrief<Partial<ExperienceBrief>>(stringFlag(flags, 'brief')), flags);
      if (!brief.title) throw new Error('Pass --brief with a title and 3–8 rooms.');
      const output = stringFlag(flags, 'out') ?? path.join('beauty-output', `${style}-experience-${slugify(brief.title)}-${timestamp()}.html`);
      const result = await createExperience({ style, brief, output });
      console.log(`${getStyle(style).name} experience · ${result.roomCount} rooms · ${result.kind}`);
      console.log(`${result.validation.grade} ${result.validation.score}/100 · vision ${result.validation.vision.score}/4`);
      console.log(result.path);
      if (result.validation.issues.length) console.log(formatValidation(result.validation));
      return;
    }

    case 'story': {
      const style = requireStyle(stringFlag(flags, 'style'));
      const brief = mergeBrief(await loadBrief<Partial<StoryBrief>>(stringFlag(flags, 'brief')), flags);
      if (!brief.title) throw new Error('Pass --brief with a title and 2–8 chapters.');
      const output = stringFlag(flags, 'out') ?? path.join('beauty-output', `${style}-story-${slugify(brief.title)}-${timestamp()}.html`);
      const result = await createStory({ style, brief, output });
      console.log(`${getStyle(style).name} story · ${result.chapterCount} chapters`);
      console.log(`${result.validation.grade} ${result.validation.score}/100 · vision ${result.validation.vision.score}/4`);
      console.log(result.path);
      if (result.validation.issues.length) console.log(formatValidation(result.validation));
      return;
    }

    case 'canvas': {
      const style = requireStyle(stringFlag(flags, 'style'));
      const fileBrief = (await loadBrief(stringFlag(flags, 'brief'))) as any;
      if (!Array.isArray(fileBrief.layers) || !fileBrief.layers.length) {
        throw new Error('Pass a canvas brief with a non-empty layers array. Use @palette tokens for colour.');
      }
      if (stringFlag(flags, 'title')) fileBrief.title = stringFlag(flags, 'title');
      fileBrief.style = style;
      if (booleanFlag(flags, 'maxxing')) fileBrief.maxxing = true;
      const output = stringFlag(flags, 'out') ?? path.join('beauty-output', `${style}-canvas-${slugify(fileBrief.title || 'canvas')}-${timestamp()}.svg`);
      const result = await createCanvas({ style, brief: fileBrief, output });
      console.log(`${getStyle(style).name} canvas · ${result.width}×${result.height} · ${result.layerCount} layers`);
      console.log(result.path);
      console.log(result.checks.map((check) => `${check.passed ? 'ok' : 'missing'} ${check.name}`).join(' · '));
      return;
    }

    case 'motion': {
      const style = requireStyle(stringFlag(flags, 'style'));
      const title = stringFlag(flags, 'title');
      if (!title) throw new Error('Pass --title "..." for the motion SVG.');
      const sceneFlag = stringFlag(flags, 'scene');
      const scene = sceneFlag === 'orbit' || sceneFlag === 'bloom' || sceneFlag === 'tide' || sceneFlag === 'papercut' || sceneFlag === 'constellation' || sceneFlag === 'ribbon' || sceneFlag === 'rain' || sceneFlag === 'type' ? sceneFlag : undefined;
      const sizeFlag = stringFlag(flags, 'size');
      const size = sizeFlag === 'square' || sizeFlag === 'portrait' || sizeFlag === 'landscape' ? sizeFlag : undefined;
      const output = stringFlag(flags, 'out') ?? path.join('beauty-output', `${style}-motion-${slugify(title)}-${timestamp()}.svg`);
      const result = await createMotion({
        style,
        brief: {
          style,
          title,
          subtitle: stringFlag(flags, 'subtitle'),
          eyebrow: stringFlag(flags, 'eyebrow'),
          brand: stringFlag(flags, 'brand'),
          footer: stringFlag(flags, 'footer'),
          scene,
          size,
          duration: numberFlag(flags, 'duration'),
          seed: numberFlag(flags, 'seed'),
          maxxing: booleanFlag(flags, 'maxxing'),
        },
        output,
      });
      console.log(`${getStyle(style).name} motion · ${result.width}×${result.height} · ${result.scene} · ${result.duration}s`);
      console.log(result.path);
      console.log(result.checks.map((check) => `${check.passed ? 'ok' : 'missing'} ${check.name}`).join(' · '));
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
        maxxing: booleanFlag(flags, 'maxxing'),
        output,
      });
      console.log(`${getStyle(style).name} GIF · ${result.width}×${result.height} · ${result.frames} frames · ${Math.round(result.bytes / 1024)} KB`);
      console.log(result.path);
      return;
    }

    case 'sprint': {
      const style = requireStyle(stringFlag(flags, 'style'));
      const brief = mergeBrief(await loadBrief<Partial<SprintBrief>>(stringFlag(flags, 'brief')), flags);
      if (!brief.sprint) throw new Error('Pass a sprint brief with { "sprint": "15", "style": "nature", ... }.');
      const result = await createSprintKit({ ...brief, sprint: brief.sprint, style }, stringFlag(flags, 'out'));
      for (const item of [result.review, result.retro, result.planning]) {
        console.log(`${item.grade} ${item.score}/100 · vision ${item.vision}/4 · ${item.html}`);
        console.log(`GIF · ${item.gif}`);
      }
      console.log(result.directory);
      return;
    }

    case 'validate': {
      const file = positionals[1];
      if (!file) throw new Error('Pass an HTML file to validate.');
      const style = requireStyle(stringFlag(flags, 'style'));
      const html = await readFile(path.resolve(process.cwd(), file), 'utf8');
      const result = html.includes('class="deck')
        ? validateDeck(html, style)
        : html.includes('class="xp ')
          ? validateExperience(html, style)
          : html.includes('class="story-page')
            ? validateStory(html, style)
            : validateHtml(html, style);
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
