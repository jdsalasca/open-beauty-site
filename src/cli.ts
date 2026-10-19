#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Brief, DeckBrief, ExperienceBrief, SequenceBrief, SprintBrief, StoryBrief, StyleSlug } from './types.js';
import { VERSION } from './index.js';
import { createCanvas, createDeck, createExperience, createGifFile, createMotion, createPage, createSequence, createStory, slugify, timestamp } from './generate.js';
import { createGifPoster } from './gif.js';
import { createSprintKit } from './sprint.js';
import { formatValidation } from './validate.js';
import { auditArtifact, meetsStrictBar, repairArtifact, locatePlaywright } from './visual.js';
import { gifHelpOptions, gifUsage } from './types/gif.js';
import { sprintHelpOptions, SPRINT_BRIEF_EXAMPLE } from './types/sprint.js';
import { getStyle, isStyleSlug, styleSlugs } from './styles/presets.js';
import { makeArtifact } from './make.js';
import { MAKE_KINDS, isMakeKind } from './types/make.js';
import { styleGuideMarkdown, stylesOverview } from './guide.js';
import { ensureFonts } from './canvas.js';
import { packageRoot } from './paths.js';
import { createNarrative, narrativeFailure } from './narrative/create.js';
import { NARRATIVE_BRIEF_EXAMPLE, narrativeHelpOptions } from './narrative/brief.js';
import { narrativeCapabilityReport } from './narrative/capabilities.js';
import { NarrativeError } from './types/narrative.js';
import { createNarrativeGallery, createNarrativeCompareGallery } from './narrative/gallery.js';
import { NARRATIVE_REVIEW_LEVELS, type NarrativeFeedback, type NarrativeReviewer, type NarrativeReviewCriterion, type NarrativeReviewLevel, type NarrativeReviewVerdict } from './types/narrative-review.js';
import { NARRATIVE_REVIEW_HELP, NARRATIVE_RERENDER_HELP, reviewNarrativeArtifact, getNarrativeReviewState } from './narrative/review.js';
import { rerenderNarrativePack } from './narrative/rerender.js';
import { planArtifact } from './plan.js';
import { planInputSchema } from './types/plan.js';

type Flags = Record<string, string | boolean | string[]>;

interface CommandHelpEntry {
  summary: string;
  usage: string;
  options: string[];
  example: string;
}

const COMMAND_HELP: Record<string, CommandHelpEntry> = {
  styles: {
    summary: 'List the thirteen styles.',
    usage: 'beauty styles',
    options: ['  (none)'],
    example: 'beauty styles',
  },
  guide: {
    summary: 'Read the exact tokens and rules for one style.',
    usage: 'beauty guide <style> [--json]',
    options: ['  --json        Print the raw preset JSON instead of Markdown'],
    example: 'beauty guide nature',
  },
  make: {
    summary: 'Create page|deck|gif|story|experience|motion in one shot.',
    usage: 'beauty make <kind> --style <s> --idea "one sentence" [--locale es|en] [--idea-file idea.txt] [--out path]',
    options: [
      '  --idea "..."       One sentence describing the artefact',
      '  --idea-file path   Read the idea from a file (avoids long command lines)',
      '  --locale es|en     Language of the generated copy',
      '  --title "..."      Short headline (default: derived from the idea, at most 5 words)',
      '  --tagline "..."    One-line tagline under the headline',
      '  --out path         Where to write the artefact',
    ],
    example: 'beauty make gif --style brutalist --idea "a poster for a night market"',
  },
  page: {
    summary: 'Create a full HTML page.',
    usage: 'beauty page --style <s> --title "..." [--brief brief.json | --brief -] [--out file.html]',
    options: [
      '  --title "..."      Headline (or use a brief file with a title)',
      '  --brief path       Read the brief from a JSON file',
      '  --brief -          Read the brief JSON from stdin',
      '  --tagline / --intro / --eyebrow / --brand / --footer "..."',
      '  --locale es|en     Language of the generated copy',
      '  --maxxing          Full art direction',
      '  --out path         Where to write the HTML',
    ],
    example: 'beauty page --style nature --brief examples/recipes/nature/page.json --out out/nature.html',
  },
  deck: {
    summary: 'Create an animated 16:9 presentation.',
    usage: 'beauty deck --style <s> --title "..." --brief deck.json [--brief -] [--subfamily orbital] [--maxxing] [--out deck.html]',
    options: [
      '  --title "..."      Deck title on the cover',
      '  --brief path       Read the deck brief from a JSON file',
      '  --brief -          Read the deck brief JSON from stdin',
      '  --subfamily slug   Curated structural family from the style guide',
      '  --maxxing          Full art direction',
      '  --out path         Where to write the HTML',
    ],
    example: 'beauty deck --style nature --brief examples/recipes/nature/deck.json --out out/nature-deck.html',
  },
  experience: {
    summary: 'Create a 3–8 room experience.',
    usage: 'beauty experience --style <s> --brief exp.json [--brief -] [--maxxing] [--out file.html]',
    options: [
      '  --brief path       Read the experience brief from a JSON file',
      '  --brief -          Read the experience brief JSON from stdin',
      '  --maxxing          Full art direction',
      '  --out path         Where to write the HTML',
    ],
    example: 'beauty experience --style galactic --brief examples/recipes/galactic/experience.json --out out/galactic-exp.html',
  },
  story: {
    summary: 'Create a chaptered story or lesson.',
    usage: 'beauty story --style <s> --brief story.json [--brief -] [--maxxing] [--out file.html]',
    options: [
      '  --brief path       Read the story brief from a JSON file',
      '  --brief -          Read the story brief JSON from stdin',
      '  --maxxing          Full art direction',
      '  --out path         Where to write the HTML',
    ],
    example: 'beauty story --style papercraft --brief examples/recipes/papercraft/story.json --out out/papercraft-story.html',
  },
  sprint: {
    summary: 'Create review + retrospective + planning + 3 GIFs.',
    usage: 'beauty sprint --style <s> --brief sprint.json [--brief -] [--size 640] [--fps 12] [--frames 29] [--out folder]',
    options: sprintHelpOptions(),
    example: `beauty sprint --style isotype --brief sprint.json\n\n${SPRINT_BRIEF_EXAMPLE}`,
  },
  sequence: {
    summary: 'Create an SVG story + GIF from frames.',
    usage: 'beauty sequence --style <s> --brief seq.json [--brief -] [--out base]',
    options: [
      '  --brief path       Read the sequence brief from a JSON file (2–12 frames)',
      '  --brief -          Read the sequence brief JSON from stdin',
      '  --out path         Base path; writes .svg and .gif',
    ],
    example: 'beauty sequence --style papercraft --brief seq.json --out out/sequence',
  },
  narrative: {
    summary: 'Create a narrative GIF pack with separate evaluation levels.',
    usage: 'beauty narrative --style <s> --brief brief.json [--out dir]',
    options: narrativeHelpOptions(),
    example: `beauty narrative --style papercraft --brief narrative.json --out out/narrative\n\n${NARRATIVE_BRIEF_EXAMPLE}`,
  },
  capabilities: {
    summary: 'Inspect the narrative renderer capability registry.',
    usage: 'beauty capabilities [--style <s>] [--json]',
    options: [
      '  --style <s>        Filter to one of the thirteen narrative scenes',
      '  --json             Print the complete machine-readable capability matrix',
    ],
    example: 'beauty capabilities --style papercraft --json',
  },
  plan: {
    summary: 'Plan an artifact without rendering: capabilities, storyboard, lint warnings and brief skeleton.',
    usage: 'beauty plan --format web|deck|gif --style <s> --audience "..." --purpose "..." --message "..." [--entities "a,b"] [--actions "x,y"] [--brief plan-input.json]',
    options: [
      '  --format web|deck|gif  Artifact format to plan',
      '  --style <s>            One of the thirteen styles',
      '  --audience "..."       Intended audience',
      '  --purpose "..."       Purpose of the artifact',
      '  --message "..."       Core message to convey',
      '  --entities "a,b"      Comma-separated entities/objects',
      '  --actions "x,y"       Comma-separated actions/transitions',
      '  --brief path          Read the plan input JSON from a file or stdin',
      '  --out path            Where to write the plan JSON (default: stdout)',
    ],
    example: 'beauty plan --format gif --style papercraft --audience "Producto" --purpose "Explicar validaci�n" --message "Una gu�a duplicada se detecta y se rechaza." --entities "gu�a,fila" --actions "detectar,rechazar"',
  },
  gallery: {
    summary: 'Build a self-contained review or before/after comparison gallery.',
    usage: 'beauty gallery <dir> [--compare compare-dir] [--out gallery.html] [--title "..."]',
    options: [
      '  <dir>              Scan this folder tree for narrative manifests and their packs',
      '  --compare dir      Read compare/index.json and build a comparative gallery',
      '  --out path         Write the one-file HTML gallery (default: gallery.html)',
      '  --title "..."      Gallery heading and document title',
    ],
    example: 'beauty gallery docs/narrative-gif --out docs/narrative-gif/GALLERY.html --title "Sprint Review"',
  },
  review: {
    summary: 'Record a hash-bound narrative review and structured feedback.',
    usage: NARRATIVE_REVIEW_HELP.split('\n')[0]!,
    options: NARRATIVE_REVIEW_HELP.split('\n').slice(1),
    example: 'beauty review out/narrative/example.manifest.json --reviewer reviewer-1:Ada --criterion thumbnailIdentity=pass --criterion loopRestart=revise --frames',
  },
  'review-state': {
    summary: 'Check whether a review still matches the current GIF, PNG and manifest.',
    usage: 'beauty review-state <pack-or-manifest>',
    options: ['  <pack-or-manifest>  Narrative manifest or pack path'],
    example: 'beauty review-state out/narrative/example.manifest.json',
  },
  rerender: {
    summary: 'Rerender a pack from its stored normalized brief and seed.',
    usage: NARRATIVE_RERENDER_HELP.split('\n')[0]!,
    options: NARRATIVE_RERENDER_HELP.split('\n').slice(1),
    example: 'beauty rerender out/narrative/example.manifest.json --apply-feedback',
  },
  canvas: {
    summary: 'Create an open animated SVG canvas.',
    usage: 'beauty canvas --style <s> --brief canvas.json [--brief -] [--out file.svg]',
    options: [
      '  --brief path       Read the canvas brief from a JSON file (layers)',
      '  --brief -          Read the canvas brief JSON from stdin',
      '  --title "..."      Accessible title',
      '  --maxxing          Full art direction',
      '  --out path         Where to write the SVG',
    ],
    example: 'beauty canvas --style nature --brief canvas.json --out out/canvas.svg',
  },
  motion: {
    summary: 'Create an animated SVG loop.',
    usage: 'beauty motion --style <s> --title "..." [--scene orbit] [--size square] [--duration 14] [--maxxing] [--out loop.svg]',
    options: [
      '  --title "..."      2–6 word headline',
      '  --scene name       orbit|bloom|tide|papercut|constellation|ribbon|rain|type',
      '  --size name        square|portrait|landscape',
      '  --duration n       Seconds (6–24)',
      '  --maxxing          Full art direction',
      '  --out path         Where to write the SVG',
    ],
    example: 'beauty motion --style nature --title "El jardín de las horas lentas" --scene bloom',
  },
  gif: {
    summary: 'Create a looping GIF.',
    usage: gifUsage(),
    options: gifHelpOptions(),
    example: 'beauty gif --style artdeco --text "Subir" --subtitle "1930" --poster',
  },
  validate: {
    summary: 'Audit HTML and return a grade, issues and fixes.',
    usage: 'beauty validate <file> --style <s> [--strict] [--visual] [--shots dir]',
    options: [
      '  <file>             HTML file to audit',
      '  --style <s>        Style the file must obey',
      '  --visual           Load it in Chromium at 360x780 and 1440x900',
      '  --shots <dir>      Write visual-360.png and visual-1440.png (implies --visual)',
      '  --strict           Exit 1 unless craft A (90+), vision 4/4 and no open warning',
      '  Exit codes: 0 ok · 1 below the strict bar or an error · a skipped visual check never fails',
    ],
    example: 'beauty validate out/nature.html --style nature --strict --visual',
  },
  fix: {
    summary: 'Apply safe repairs and re-validate with the same options as validate.',
    usage: 'beauty fix <file> --style <s> [--out f.html] [--strict] [--visual] [--shots dir]',
    options: [
      '  <file>             HTML file to repair',
      '  --style <s>        Style the file must obey',
      '  --out path         Write to a new file instead of overwriting',
      '  --visual           Re-validate in Chromium and repair visual issues too',
      '  --shots <dir>      Write visual-360.png and visual-1440.png (implies --visual)',
      '  --strict           Exit 1 unless craft A (90+), vision 4/4 and no open warning',
      '  Exit codes: 0 ok · 1 below the strict bar or an error · a skipped visual check never fails',
    ],
    example: 'beauty fix out/nature.html --style nature --visual',
  },
  examples: {
    summary: 'Show reference output paths.',
    usage: 'beauty examples',
    options: ['  (none)'],
    example: 'beauty examples',
  },
  doctor: {
    summary: 'Check fonts, runtime, dist freshness, canvas and Playwright.',
    usage: 'beauty doctor',
    options: ['  (none)'],
    example: 'beauty doctor',
  },
  mcp: {
    summary: 'Start the MCP server over stdio.',
    usage: 'beauty mcp',
    options: ['  (none)'],
    example: 'beauty mcp',
  },
  version: {
    summary: 'Print the package version.',
    usage: 'beauty version',
    options: ['  (none)'],
    example: 'beauty version',
  },
};

function parseArgs(argv: string[]): { positionals: string[]; flags: Flags } {
  const positionals: string[] = [];
  const flags: Flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] ?? '';
    if (token.startsWith('--')) {
      const body = token.slice(2);
      const equals = body.indexOf('=');
      if (equals >= 0) {
        const name = body.slice(0, equals);
        const value = body.slice(equals + 1);
        const previous = flags[name];
        flags[name] = previous === undefined ? value : Array.isArray(previous) ? [...previous, value] : [String(previous), value];
      } else {
        const next = argv[index + 1];
        if (next && !next.startsWith('--')) {
          const previous = flags[body];
          flags[body] = previous === undefined ? next : Array.isArray(previous) ? [...previous, next] : [String(previous), next];
          index += 1;
        } else {
          const previous = flags[body];
          flags[body] = previous === undefined ? true : Array.isArray(previous) ? [...previous, 'true'] : [String(previous), 'true'];
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
  return typeof value === 'string' ? value : Array.isArray(value) ? value.at(-1) : undefined;
}

function stringFlags(flags: Flags, name: string): string[] {
  const value = flags[name];
  return typeof value === 'string' ? [value] : Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
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

function parsedPairs(values: string[], label: string, allowed: readonly string[]): Record<string, NarrativeReviewVerdict> {
  const result: Record<string, NarrativeReviewVerdict> = {};
  for (const value of values) {
    const split = value.lastIndexOf('=');
    if (split < 1) throw new Error(`Invalid --${label} "${value}"; expected name=pass|revise|not-evaluated.`);
    const name = value.slice(0, split);
    const verdict = value.slice(split + 1);
    if (!allowed.includes(name)) throw new Error(`Unknown --${label} "${name}". Valid values: ${allowed.join(', ')}.`);
    if (!['pass', 'revise', 'not-evaluated'].includes(verdict)) throw new Error(`Invalid --${label} verdict "${verdict}".`);
    result[name] = verdict as NarrativeReviewVerdict;
  }
  return result;
}

function requireStyle(value: string | undefined): StyleSlug {
  if (!value || !isStyleSlug(value)) {
    throw new Error(`Pass --style <${styleSlugs.join('|')}>.`);
  }
  return value;
}

/** Absolute path of the compiled CLI, used by the dist guard and doctor. */
export function distCliPath(): string {
  return path.join(packageRoot(), 'dist', 'cli.js');
}

/** The exact one-line fix printed when the compiled CLI is missing. */
export function distFixMessage(): string {
  return 'dist/cli.js is missing. Run `pnpm build` to compile it (or `pnpm setup` to install, build and test).';
}

/** True when the compiled CLI exists next to the package root. */
export function ensureDistBuilt(): boolean {
  return existsSync(distCliPath());
}

/** Build only when dist/cli.js is missing. Safe to run from `pnpm install`. */
export function runPrepare(): void {
  if (ensureDistBuilt()) return;
  const root = packageRoot();
  const tsc = path.join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  if (existsSync(tsc)) {
    spawnSync(process.execPath, [tsc, '-p', 'tsconfig.json'], { cwd: root, stdio: 'inherit' });
    return;
  }
  console.error(`beauty: ${distFixMessage()}`);
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function loadBrief<T extends Partial<Brief>>(value: string | undefined): Promise<T> {
  if (!value) return {} as T;
  if (value === '-') {
    return JSON.parse((await readStdin()).trim()) as T;
  }
  const raw = value.trim().startsWith('{') ? value : await readFile(path.resolve(process.cwd(), value), 'utf8');
  return JSON.parse(raw) as T;
}

async function readIdeaFile(value: string | undefined): Promise<string | undefined> {
  if (!value) return undefined;
  return (await readFile(path.resolve(process.cwd(), value), 'utf8')).trim();
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

function commandHelp(command: string, entry: CommandHelpEntry): string {
  return `beauty ${command} — ${entry.summary}

Usage:
  ${entry.usage}

Options:
${entry.options.join('\n')}

Example:
  ${entry.example}

Run \`beauty help\` for the full command list, or \`beauty <command> --help\` for one command.`;
}

function help(): string {
  return `open-beauty-site ${VERSION}
A design harness for small models: HTML pages + GIFs with an editorial line.

Usage:
  beauty <command> [options]          Run a command
  beauty <command> --help | -h        Show one command's options and an example
  beauty help <command>               Same as above

Commands:
  beauty styles                              List the thirteen styles
  beauty guide <style> [--json]              Read the exact tokens and rules
  beauty make <kind> --style <s> --idea "one sentence"
      Create everything in one shot: page|deck|gif|story|experience|motion
      [--idea-file idea.txt] [--locale es|en] [--out path]
  beauty page --style <s> --title "..."      Create a full HTML page
      [--brief brief.json] or [--brief -] reads the brief from a file or stdin
      [--tagline "..."] [--intro "..."] [--brand "..."] [--locale es|en]
      [--maxxing] [--out file.html]
  beauty deck --style <s> --title "..."      Create an animated 16:9 presentation
      --brief deck.json [--brief -] [--subfamily orbital] [--maxxing] [--out deck.html]
  beauty experience --style <s> --brief exp.json  Create a 3–8 room experience [--maxxing]
  beauty story --style <s> --brief story.json     Create a chaptered story/lesson [--maxxing]
  beauty sprint --style <s> --brief sprint.json   Create review + retrospective + planning + 3 GIFs
      [--out dir]
  beauty sequence --style <s> --brief seq.json   Create an SVG story + GIF from frames
  beauty narrative --style <s> --brief brief.json [--out dir]  Create a narrative GIF pack
  beauty capabilities [--style <s>] [--json]  Inspect narrative options before writing a brief
  beauty gallery <dir> [--out gallery.html] [--title "..."]  Build a static review gallery
  beauty review <pack> [--criterion name=pass|revise|not-evaluated] ...  Record a visual review
  beauty review-state <pack>                    Check hash freshness and verdict
  beauty rerender <manifest> [--apply-feedback] Rerender and measure feedback regions
  beauty canvas --style <s> --brief canvas.json  Create an open animated SVG canvas
  beauty motion --style <s> --title "..."      Create an animated SVG loop
      [--scene orbit|bloom|tide|papercut|constellation|ribbon|rain|type]
      [--size square|portrait|landscape] [--duration 14] [--maxxing] [--out loop.svg]
  beauty gif --style <s> --text "..."        Create a looping GIF
      [--subtitle "..."] [--template title|loop|poster] [--fps 20] [--duration 2.4]
      [--width 800] [--height 800] [--maxxing] [--poster] [--out file.gif]
  beauty validate <file> --style <s> [--strict] [--visual] [--shots dir]
  beauty fix <file> --style <s> [--out f.html] [--strict] [--visual]
                                             Apply safe repairs and re-validate
  beauty examples                            Show reference output
  beauty doctor                              Check dist, fonts, runtime and Playwright
  beauty mcp                                 Start the MCP server (stdio)
  beauty version                             Print the package version

Styles: ${styleSlugs.join(', ')}
Exit codes for validate/fix: 0 ok · 1 below the strict bar (craft A/90 + vision 4/4) or an error.
`;
}

async function doctorReport(): Promise<void> {
  console.log(`open-beauty-site ${VERSION}`);
  console.log(`node ${process.version}`);
  console.log(`package root ${packageRoot()}`);

  const distCli = distCliPath();
  if (existsSync(distCli)) {
    const minutes = Math.max(0, Math.round((Date.now() - statSync(distCli).mtimeMs) / 60000));
    console.log(`dist/cli.js present (built ${minutes} min ago)`);
  } else {
    console.log(`dist/cli.js missing · fix: ${distFixMessage()}`);
  }

  const major = Number(process.versions.node.split('.')[0]);
  if (major < 22) {
    console.log(`node ${process.version} is below the required 22 · fix: install Node 22+ from https://nodejs.org`);
  } else {
    console.log(`node ${process.version} (>=22 ok)`);
  }

  try {
    ensureFonts();
    console.log('fonts: registered (EB Garamond, Archivo Black, Space Mono, Fraunces, Nunito Sans)');
  } catch (error) {
    console.log(`fonts: error · ${(error as Error).message} · fix: pnpm install`);
  }

  try {
    // The narrative GIF engine uses the real per-style families, not only the five above.
    const { checkAllNarrativeFonts } = await import('./narrative/fonts.js');
    const checks = checkAllNarrativeFonts();
    const families = new Set(checks.map((check) => check.family));
    const synthetic = checks.filter((check) => check.syntheticBold || check.syntheticItalic).length;
    console.log(`narrative fonts: ok · ${checks.length} style/role checks · ${families.size} families (Spanish glyphs verified)${synthetic ? ` · ${synthetic} synthetic face(s)` : ''}`);
  } catch (error) {
    console.log(`narrative fonts: error · ${(error as Error).message} · fix: pnpm fonts:check`);
  }

  try {
    const { canvas } = await import('./canvas.js').then((mod) => mod.canvasFor(2, 2));
    console.log(`native canvas: ok (${canvas.width}×${canvas.height})`);
  } catch (error) {
    console.log(`native canvas: error · ${(error as Error).message} · fix: pnpm install`);
  }

  const playwright = locatePlaywright();
  if (playwright) {
    console.log(`playwright: found at ${playwright.root} (${playwright.source}) · visual checks enabled`);
  } else {
    console.log(
      'playwright: not installed · fix: set BEAUTY_PLAYWRIGHT_ROOT to a playwright folder, or run pnpm add -D playwright && pnpm exec playwright install chromium',
    );
  }

  console.log('status: ready');
}

async function main(): Promise<void> {
  const { positionals: rawPositionals, flags } = parseArgs(process.argv.slice(2));
  const wantsHelp =
    flags.help === true || rawPositionals.includes('-h') || rawPositionals.includes('--help');
  const positionals = rawPositionals.filter((token) => token !== '-h' && token !== '--help');
  const command = positionals[0] ?? 'help';

  if (flags.prepare === true) {
    runPrepare();
    return;
  }

  if (wantsHelp) {
    const target = command === 'help' ? positionals[1] : command;
    if (!target || target === 'help') {
      console.log(help());
      return;
    }
    const entry = COMMAND_HELP[target];
    if (!entry) {
      console.error(`Unknown command "${target}".`);
      process.exitCode = 1;
      return;
    }
    console.log(commandHelp(target, entry));
    return;
  }

  if (flags.version === true) {
    console.log(VERSION);
    return;
  }

  if (!ensureDistBuilt()) {
    console.error(`beauty: ${distFixMessage()}`);
  }

  switch (command) {
    case 'help': {
      const target = positionals[1];
      if (!target) {
        console.log(help());
        return;
      }
      const entry = COMMAND_HELP[target];
      if (!entry) {
        console.error(`Unknown command "${target}".`);
        process.exitCode = 1;
        return;
      }
      console.log(commandHelp(target, entry));
      return;
    }

    case 'version':
    case '--version':
    case '-v':
      console.log(VERSION);
      return;

    case 'styles':
    case 'list': {
      const overview = stylesOverview().replace(
        /Next: call beauty_get_style with one slug\./,
        'Next: run `beauty guide <style>` to read one style, then `beauty page --style <style> --brief <file>`.',
      );
      console.log(overview);
      return;
    }

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
      const idea = stringFlag(flags, 'idea') ?? (await readIdeaFile(stringFlag(flags, 'idea-file'))) ?? '';
      const result = await makeArtifact({
        kind,
        style,
        idea,
        locale: localeFlag === 'en' ? 'en' : localeFlag === 'es' ? 'es' : undefined,
        title: stringFlag(flags, 'title'),
        tagline: stringFlag(flags, 'tagline'),
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
      for (const warning of result.warnings) console.log(`warning: ${warning}`);
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

    case 'sequence': {
      const style = requireStyle(stringFlag(flags, 'style'));
      const brief = (await loadBrief(stringFlag(flags, 'brief'))) as Partial<SequenceBrief>;
      if (!Array.isArray(brief.frames) || brief.frames.length < 2) {
        throw new Error('Pass a sequence brief with at least two frames; each frame needs layers.');
      }
      brief.style = style;
      const output = stringFlag(flags, 'out') ?? path.join('beauty-output', `${style}-sequence-${slugify(brief.title || 'sequence')}-${timestamp()}`);
      const result = await createSequence({ style, brief, output });
      console.log(`${getStyle(style).name} sequence · ${result.frames} frames · ${result.width}×${result.height} · ${result.fps} fps · ${result.duration.toFixed(1)}s`);
      console.log(result.pathSvg);
      console.log(result.pathGif ?? 'no GIF');
      console.log(result.checks.map((check) => `${check.passed ? 'ok' : 'missing'} ${check.name}`).join(' · '));
      return;
    }

    case 'narrative': {
      const style = requireStyle(stringFlag(flags, 'style'));
      const brief = (await loadBrief<Partial<Brief>>(stringFlag(flags, 'brief'))) as unknown;
      const briefStyle = brief && typeof brief === 'object' ? (brief as Record<string, unknown>).style : undefined;
      if (briefStyle !== style) {
        const failure = narrativeFailure(new NarrativeError('INVALID_STATE', `--style ${style} must match brief.style ${String(briefStyle ?? '(missing)')}.`, 'Set the same registered style in the flag and the brief.', 'style'));
        console.log(JSON.stringify(failure, null, 2));
        process.exitCode = 1;
        return;
      }
      try {
        const result = await createNarrative(brief, { outputDir: stringFlag(flags, 'out'), artOnly: booleanFlag(flags, 'art-only') });
        console.log(JSON.stringify(result, null, 2));
      } catch (error) {
        console.log(JSON.stringify(narrativeFailure(error), null, 2));
        process.exitCode = 1;
      }
      return;
    }

    case 'capabilities': {
      const styleValue = stringFlag(flags, 'style');
      if (styleValue && !isStyleSlug(styleValue)) {
        throw new Error(`Unknown style "${styleValue}". Choose one of: ${styleSlugs.join(', ')}.`);
      }
      const report = narrativeCapabilityReport(styleValue ? { style: styleValue as StyleSlug } : {});
      if (booleanFlag(flags, 'json')) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }
      console.log(`Narrative capabilities · ${report.cells.length} cells · supported ${report.summary.supported} · fallback ${report.summary.fallback} · unsupported ${report.summary.unsupported}`);
      for (const style of [...new Set(report.cells.map((cell) => cell.style))]) {
        const cells = report.cells.filter((cell) => cell.style === style);
        const states = [...new Set(cells.flatMap((cell) => cell.allowed.visualStates.map((entry) => entry.value)))].join(', ');
        const semantic = cells.filter((cell) => cell.aspect === '16:9' && cell.locale === 'es').map((cell) => {
          const statesByKind = Object.entries(cell.allowed.semanticStates).map(([kind, values]) => `${kind}[${values?.join('|') ?? ''}]`).join(',');
          const actionsByKind = Object.entries(cell.allowed.semanticActions).map(([kind, values]) => `${kind}[${values?.join('|') ?? ''}]`).join(',');
          return `${cell.primitive}=${cell.status}; entities ${cell.allowed.semanticEntityKinds.join('|')}; states ${statesByKind}; actions ${actionsByKind}`;
        }).join(' · ');
        console.log(`${style}: ${cells.filter((cell) => cell.status === 'supported').length} supported · ${cells.filter((cell) => cell.status === 'fallback').length} fallback · ${cells.filter((cell) => cell.status === 'unsupported').length} unsupported · visual states ${states} · ${semantic}`);
      }
      return;
    }

    case 'plan': {
      const fileBrief = await loadBrief(stringFlag(flags, 'brief'));
      const raw: Record<string, unknown> = fileBrief ? { ...(fileBrief as Record<string, unknown>) } : {};
      if (stringFlag(flags, 'format')) raw.format = stringFlag(flags, 'format');
      if (stringFlag(flags, 'style')) raw.style = stringFlag(flags, 'style');
      if (stringFlag(flags, 'audience')) raw.audience = stringFlag(flags, 'audience');
      if (stringFlag(flags, 'purpose')) raw.purpose = stringFlag(flags, 'purpose');
      if (stringFlag(flags, 'message')) raw.message = stringFlag(flags, 'message');
      const entitiesFlag = stringFlag(flags, 'entities');
      if (entitiesFlag) raw.entities = entitiesFlag.split(',').map((value) => value.trim()).filter(Boolean);
      const actionsFlag = stringFlag(flags, 'actions');
      if (actionsFlag) raw.actions = actionsFlag.split(',').map((value) => value.trim()).filter(Boolean);
      const parsed = planInputSchema.safeParse(raw);
      if (!parsed.success) throw new Error(`Invalid plan input: ${parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
      const result = planArtifact(parsed.data);
      const output = stringFlag(flags, 'out');
      const text = JSON.stringify(result, null, 2);
      if (output) await writeFile(path.resolve(process.cwd(), output), text, 'utf8');
      else console.log(text);
      return;
    }

    case 'gallery': {
      const directory = positionals[1];
      if (!directory) throw new Error('Pass the folder tree that contains narrative manifests: beauty gallery <dir>.');
      const output = stringFlag(flags, 'out') ?? 'gallery.html';
      const compareDirectory = stringFlag(flags, 'compare');
      if (compareDirectory) {
        const result = await createNarrativeCompareGallery({ directory: compareDirectory, output, title: stringFlag(flags, 'title') });
        console.log(`Galería comparativa · ${result.pieceCount} pares y fixtures · ${result.styles.length} estilos`);
        console.log(result.path);
        return;
      }
      const result = await createNarrativeGallery({ directory, output, title: stringFlag(flags, 'title') });
      console.log(`Galería narrativa · ${result.pieceCount} piezas · ${result.styles.length} estilos`);
      console.log(result.path);
      return;
    }

    case 'review': {
      const pack = positionals[1];
      if (!pack) throw new Error('Pass a narrative pack or manifest to beauty review.');
      const rawReviewer = stringFlag(flags, 'reviewer') ?? 'reviewer:Reviewer';
      const colon = rawReviewer.indexOf(':');
      const reviewerId = colon < 0 ? rawReviewer : rawReviewer.slice(0, colon);
      const reviewerName = colon < 0 ? rawReviewer : rawReviewer.slice(colon + 1);
      const kind = stringFlag(flags, 'reviewer-kind') ?? 'human';
      if (kind !== 'human' && kind !== 'model') throw new Error('--reviewer-kind must be human or model.');
      let reviewer: NarrativeReviewer;
      if (kind === 'human') reviewer = { id: reviewerId, name: reviewerName, kind: 'human' };
      else {
        const model = { id: stringFlag(flags, 'model-id') ?? '', version: stringFlag(flags, 'model-version') ?? '', criteria: stringFlag(flags, 'model-criteria') ?? '' };
        if (!model.id || !model.version || !model.criteria) throw new Error('Model reviews require --model-id, --model-version and --model-criteria.');
        reviewer = { id: reviewerId, name: reviewerName, kind: 'model', model };
      }
      const criterionAliases: Record<string, NarrativeReviewCriterion> = {
        thumbnailIdentity: 'thumbnailIdentity', 'thumbnail-identity': 'thumbnailIdentity',
        cardSizeReading: 'cardSizeReading', 'reading-at-card-size': 'cardSizeReading',
        styleMaterial: 'styleMaterial', 'style-material': 'styleMaterial',
        phaseContinuity: 'phaseContinuity', 'phase-continuity': 'phaseContinuity',
        loopRestart: 'loopRestart', 'loop-restart': 'loopRestart',
        artOnlyTransformationUnderstood: 'artOnlyTransformationUnderstood', 'art-only-transformation-understood': 'artOnlyTransformationUnderstood',
      };
      const criteriaInput: Record<string, NarrativeReviewVerdict> = {};
      const rawCriteria = parsedPairs(stringFlags(flags, 'criterion'), 'criterion', Object.keys(criterionAliases));
      for (const [name, verdict] of Object.entries(rawCriteria)) criteriaInput[criterionAliases[name]!] = verdict;
      const levelsInput = parsedPairs(stringFlags(flags, 'level'), 'level', NARRATIVE_REVIEW_LEVELS);
      let feedback: unknown[] | undefined;
      const feedbackFile = stringFlag(flags, 'feedback');
      if (feedbackFile) {
        const parsed = JSON.parse(await readFile(path.resolve(process.cwd(), feedbackFile), 'utf8')) as unknown;
        feedback = Array.isArray(parsed) ? parsed : (parsed as { feedback?: unknown[] }).feedback;
        if (!Array.isArray(feedback)) throw new Error('--feedback JSON must be an array or an object with a feedback array.');
      }
      const result = await reviewNarrativeArtifact({
        manifestPath: pack,
        reviewer,
        criteria: criteriaInput as Partial<Record<NarrativeReviewCriterion, NarrativeReviewVerdict>>,
        qualityLevels: levelsInput as Partial<Record<NarrativeReviewLevel, NarrativeReviewVerdict>>,
        feedback: feedback as NarrativeFeedback[] | undefined,
        extractFrames: booleanFlag(flags, 'frames'),
        overallNote: stringFlag(flags, 'note'),
      });
      console.log(JSON.stringify({ reviewPath: result.reviewPath, ...result.assessment }, null, 2));
      return;
    }

    case 'review-state': {
      const pack = positionals[1];
      if (!pack) throw new Error('Pass a narrative pack or manifest to beauty review-state.');
      console.log(JSON.stringify(await getNarrativeReviewState(pack), null, 2));
      return;
    }

    case 'rerender': {
      const manifest = positionals[1];
      if (!manifest) throw new Error('Pass a narrative manifest to beauty rerender.');
      const result = await rerenderNarrativePack(manifest, { applyFeedback: booleanFlag(flags, 'apply-feedback') });
      console.log(JSON.stringify(result, null, 2));
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
      if (booleanFlag(flags, 'poster')) {
        const posterPath = result.path.replace(/\.gif$/i, '.png');
        await createGifPoster(
          style,
          {
            text,
            subtitle: stringFlag(flags, 'subtitle'),
            width: numberFlag(flags, 'width'),
            height: numberFlag(flags, 'height'),
            seed: numberFlag(flags, 'seed'),
            maxxing: booleanFlag(flags, 'maxxing'),
          },
          posterPath,
        );
        console.log(posterPath);
      }
      return;
    }

    case 'sprint': {
      const style = requireStyle(stringFlag(flags, 'style'));
      const brief = mergeBrief(await loadBrief<Partial<SprintBrief>>(stringFlag(flags, 'brief')), flags);
      if (!brief.sprint) throw new Error('Pass a sprint brief with { "sprint": "15", "style": "nature", ... }. See `beauty sprint --help` for the schema.');
      const result = await createSprintKit({ ...brief, sprint: brief.sprint, style }, stringFlag(flags, 'out'), {
        size: numberFlag(flags, 'size'),
        fps: numberFlag(flags, 'fps'),
        frames: numberFlag(flags, 'frames'),
      });
      for (const item of [result.review, result.retro, result.planning]) {
        console.log(`${item.grade} ${item.score}/100 · vision ${item.vision}/4 · ${item.html}`);
        console.log(`GIF · ${item.gif}`);
      }
      for (const issue of result.issues) console.log(`${issue.severity.toUpperCase()} ${issue.code} · ${issue.message}`);
      console.log(result.directory);
      return;
    }

    case 'validate': {
      const file = positionals[1];
      if (!file) throw new Error('Pass an HTML file to validate.');
      const style = requireStyle(stringFlag(flags, 'style'));
      const source = path.resolve(process.cwd(), file);
      const html = await readFile(source, 'utf8');
      const shots = stringFlag(flags, 'shots');
      const visual = booleanFlag(flags, 'visual') || shots !== undefined;
      const report = await auditArtifact(html, style, { visual, shots, filePath: source });
      console.log(formatValidation(report.result));
      console.log(`stats: ${JSON.stringify(report.result.stats)}`);
      if (visual && report.visual.status === 'skipped' && report.visual.message) console.log(report.visual.message);
      if (report.visual.shots?.length) console.log(`shots: ${report.visual.shots.join(', ')}`);
      if (booleanFlag(flags, 'strict') && !meetsStrictBar(report.result)) process.exitCode = 1;
      return;
    }

    case 'fix': {
      const file = positionals[1];
      if (!file) throw new Error('Pass an HTML file to fix.');
      const style = requireStyle(stringFlag(flags, 'style'));
      const source = path.resolve(process.cwd(), file);
      const html = await readFile(source, 'utf8');
      const shots = stringFlag(flags, 'shots');
      const visual = booleanFlag(flags, 'visual') || shots !== undefined;
      const result = await repairArtifact(html, style, { visual, shots, filePath: source });
      const out = stringFlag(flags, 'out');
      const target = out ? path.resolve(process.cwd(), out) : source;
      await writeFile(target, result.html, 'utf8');
      console.log(`${style} · ${result.before.score} → ${result.after.score} (${result.before.grade} → ${result.after.grade})`);
      console.log(`${result.fixes.length} repair(s): ${result.fixes.join(', ') || 'none'}`);
      console.log(`post-check: ${formatValidation(result.afterResult).split('\n')[0]} · ${result.afterResult.issues.length} issue(s) remaining`);
      if (visual && result.visual.status === 'skipped' && result.visual.message) console.log(result.visual.message);
      if (result.visual.shots?.length) console.log(`shots: ${result.visual.shots.join(', ')}`);
      console.log(target);
      if (booleanFlag(flags, 'strict') && !meetsStrictBar(result.afterResult)) process.exitCode = 1;
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
      await doctorReport();
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

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  main().catch((error) => {
    console.error(`beauty: ${(error as Error).message}`);
    process.exitCode = 1;
  });
}
