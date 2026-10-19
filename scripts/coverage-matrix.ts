import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  createDeck,
  createExperience,
  createPage,
  createStory,
} from '../src/generate.js';
import { createGif } from '../src/gif.js';
import { renderMotion } from '../src/motion.js';
import { renderCanvas } from '../src/canvas-art.js';
import { createSprintKit } from '../src/sprint.js';
import { validateDeck, validateExperience, validateHtml, validateStory } from '../src/validate.js';
import { getStyle, styleSlugs } from '../src/styles/presets.js';
import type { StyleSlug } from '../src/types.js';
import { runScript } from './lib/run.js';

export type FormatId = 'page' | 'deck' | 'story' | 'experience' | 'canvas' | 'motion' | 'gif' | 'sprint';

export const FORMAT_IDS: FormatId[] = ['page', 'deck', 'story', 'experience', 'canvas', 'motion', 'gif', 'sprint'];

export type CellStatus = 'OK' | 'FAIL' | 'GAP';

export interface CellResult {
  format: FormatId;
  status: CellStatus;
  reason: string;
  ms: number;
}

export interface MatrixOptions {
  /** Small GIF settings keep the matrix fast; determinism is covered by the GIF tests. */
  gifWidth?: number;
  gifHeight?: number;
  gifFps?: number;
  gifDuration?: number;
  workDir?: string;
}

const PAGE_BRIEF = {
  title: 'Atelier Lumen',
  tagline: 'Objects that age well.',
  intro: 'We work with our hands and with time. Every piece starts with a drawing and a long conversation.',
  eyebrow: 'Estudio · 2026',
  brand: 'Atelier Lumen',
  sections: [
    { kicker: 'One', title: 'Portraits', body: 'Three sessions: light, sketch and matter.' },
    { kicker: 'Two', title: 'Ceramics', body: 'Short series with ash glazes and visible fingerprints.' },
    { kicker: 'Three', title: 'Rooms', body: 'Fewer objects, better shadows.' },
  ],
  quote: { text: 'Beauty is discovered, not added.', author: 'Elena Varela' },
  cta: { label: 'Visit the studio', href: 'https://atelier.example/visit' },
  footer: 'Atelier Lumen · Madrid',
  locale: 'en' as const,
  seed: 7,
};

const STORY_BRIEF = {
  title: 'La casa del río',
  tagline: 'A story in three chapters.',
  chapters: [
    { kicker: 'Uno', title: 'La orilla', body: 'Todo comienza con una imagen que no termina de irse.\n\nEl río guarda las cosas que le devolvemos.' },
    { kicker: 'Dos', title: 'La corriente', body: 'La corriente decide más que los barqueros.\n\nAprendimos a leer el agua antes que el mapa.' },
    { kicker: 'Tres', title: 'La segunda orilla', body: 'Toda historia tiene una segunda orilla: el momento en que lo que parecía lejano se vuelve inevitable.' },
  ],
  locale: 'es' as const,
};

const EXPERIENCE_BRIEF = {
  title: 'Museo de las cosas pequeñas',
  tagline: 'Three rooms, one quiet hour.',
  kind: 'museum' as const,
  rooms: [
    { kicker: 'Sala 01', title: 'La vitrina', display: 'objects' as const, items: [
      { label: 'Semillas', detail: 'Del archivo botánico.', value: '12' },
      { label: 'Pliegos', detail: 'Herbarios prensados.', value: '30' },
    ] },
    { kicker: 'Sala 02', title: 'La mesa de dibujo', display: 'scene' as const, body: 'Aquí se dibujan las especies antes de nombrarlas.' },
    { kicker: 'Sala 03', title: 'La cita', display: 'quote' as const, quote: { text: 'Una habitación se recuerda por lo que deja mirar.', author: 'El archivo' } },
  ],
  locale: 'es' as const,
};

const SPRINT_BRIEF = {
  sprint: '15',
  team: 'Equipo Open Beauty',
  date: '2026-10-18',
  summary: 'Lo que cambió en el sprint 15.',
  metrics: [{ label: 'Historias cerradas', value: '8' }, { label: 'Fotogramas / seg', value: '24' }],
  highlights: ['Una entrega que se puede usar', 'GIFs con paleta global'],
  blockers: ['Trabajar sin contexto'],
  next: ['La apuesta más pequeña que cambia una decisión'],
  quote: { text: 'La conversación sigue.', author: 'Equipo' },
  locale: 'es' as const,
};

async function cell(
  format: FormatId,
  fn: () => string | Promise<string>,
  options: MatrixOptions,
  workDir: string,
): Promise<CellResult> {
  const started = performance.now();
  try {
    const reason = await fn();
    return { format, status: 'OK', reason: reason || 'ok', ms: Math.round(performance.now() - started) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { format, status: 'FAIL', reason: message, ms: Math.round(performance.now() - started) };
  }
}

function gap(format: FormatId, reason: string): CellResult {
  return { format, status: 'GAP', reason, ms: 0 };
}

async function checkPage(style: StyleSlug): Promise<string> {
  const preset = getStyle(style);
  const html = (await createPage({ style, brief: PAGE_BRIEF })).html;
  if (!html.includes(`style-${style}`)) return `missing style-${style} marker`;
  if (!html.includes(preset.fonts.display)) return `missing display font ${preset.fonts.display}`;
  if (!html.includes(preset.palette.accent)) return `missing accent ${preset.palette.accent}`;
  if (!html.includes('Atelier Lumen')) return 'title missing';
  if (/undefined|NaN|\{\{/.test(html)) return 'placeholder leak';
  const validation = validateHtml(html, style);
  if (validation.score < 90 || validation.grade !== 'A') return `validation ${validation.grade} ${validation.score}/100`;
  if (validation.vision.score !== 4) return `vision ${validation.vision.score}/4`;
  return '';
}

async function checkDeck(style: StyleSlug): Promise<string> {
  const html = (await createDeck({ style, brief: PAGE_BRIEF })).html;
  if (!html.includes(`deck style-${style}`)) return `missing deck style-${style} marker`;
  if (/undefined|NaN/.test(html)) return 'placeholder leak';
  const validation = validateDeck(html, style);
  if (validation.score < 90) return `validation ${validation.score}/100`;
  return '';
}

async function checkStory(style: StyleSlug): Promise<string> {
  const result = await createStory({ style, brief: STORY_BRIEF });
  if (!result.html.includes(`style-${style}`)) return `missing style-${style} marker`;
  if (result.chapterCount < 2) return `only ${result.chapterCount} chapters`;
  const validation = validateStory(result.html, style);
  if (validation.score < 90) return `validation ${validation.score}/100`;
  return '';
}

async function checkExperience(style: StyleSlug): Promise<string> {
  const result = await createExperience({ style, brief: EXPERIENCE_BRIEF });
  if (!result.html.includes(`style-${style}`)) return `missing style-${style} marker`;
  if (result.roomCount < 3) return `only ${result.roomCount} rooms`;
  const validation = validateExperience(result.html, style);
  if (validation.score < 90) return `validation ${validation.score}/100`;
  return '';
}

function checkCanvas(style: StyleSlug): string {
  const preset = getStyle(style);
  const svg = renderCanvas({
    style,
    title: 'Lienzo de prueba',
    size: 'square',
    layers: [
      { kind: 'rect', x: 0, y: 0, width: 1200, height: 1200, fill: '@bg' },
      { kind: 'circle', cx: 600, cy: 600, r: 220, fill: '@accent' },
      { kind: 'rect', x: 120, y: 900, width: 420, height: 90, fill: '@accent2' },
      { kind: 'text', text: 'Lienzo', x: 120, y: 860, size: 64, font: 'display', fill: '@ink' },
    ],
  });
  if (!svg.includes(preset.palette.accent)) return `missing accent ${preset.palette.accent}`;
  if (!svg.includes(preset.fonts.display)) return `missing display font`;
  if (!svg.includes('@keyframes')) return 'missing animation';
  return '';
}

function checkMotion(style: StyleSlug): string {
  const preset = getStyle(style);
  const svg = renderMotion({ style, title: 'Lienzo en movimiento', seed: 7 });
  if (!svg.includes(preset.fonts.display)) return `missing display font`;
  if (!svg.includes(preset.palette.accent)) return `missing accent`;
  if (!svg.includes('@keyframes')) return 'missing animation';
  return '';
}

function gifOptions(style: StyleSlug, options: MatrixOptions) {
  return {
    text: 'Luz y papel',
    subtitle: 'Cobertura',
    template: 'loop' as const,
    width: options.gifWidth ?? 320,
    height: options.gifHeight ?? 320,
    fps: options.gifFps ?? 12,
    duration: options.gifDuration ?? 1.5,
    seed: 7,
  };
}

async function checkGif(style: StyleSlug, options: MatrixOptions, workDir: string): Promise<string> {
  const target = path.join(workDir, `${style}.gif`);
  const result = await createGif(style, gifOptions(style, options), target);
  if (!existsSync(target)) return 'gif file not written';
  if (result.bytes < 1024) return `suspiciously small (${result.bytes} bytes)`;
  if (result.frames < 8) return `only ${result.frames} frames`;
  const head = readFileSync(target).subarray(0, 6).toString('latin1');
  if (!head.startsWith('GIF8')) return 'not a GIF stream';
  return '';
}

async function checkSprint(style: StyleSlug, options: MatrixOptions, workDir: string): Promise<string> {
  const directory = path.join(workDir, `sprint-${style}`);
  const kit = await createSprintKit({ ...SPRINT_BRIEF, style }, directory);
  for (const item of [kit.review, kit.retro, kit.planning]) {
    if (!existsSync(item.html)) return `missing ${path.basename(item.html)}`;
    if (!existsSync(item.gif)) return `missing ${path.basename(item.gif)}`;
  }
  return '';
}

export async function runCoverageMatrix(
  options: MatrixOptions = {},
): Promise<Array<{ style: StyleSlug; cells: CellResult[] }>> {
  const workDir = options.workDir ?? mkdtempSync(path.join(os.tmpdir(), 'beauty-coverage-'));
  const rows: Array<{ style: StyleSlug; cells: CellResult[] }> = [];
  for (const style of styleSlugs) {
    rows.push({
      style,
      cells: [
        await cell('page', () => checkPage(style), options, workDir),
        await cell('deck', () => checkDeck(style), options, workDir),
        await cell('story', () => checkStory(style), options, workDir),
        await cell('experience', () => checkExperience(style), options, workDir),
        await cell('canvas', () => checkCanvas(style), options, workDir),
        await cell('motion', () => checkMotion(style), options, workDir),
        await cell('gif', () => checkGif(style, options, workDir), options, workDir),
        await cell('sprint', () => checkSprint(style, options, workDir), options, workDir),
      ],
    });
  }
  if (!options.workDir) {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
  return rows;
}

export function formatMatrix(rows: Array<{ style: StyleSlug; cells: CellResult[] }>): string {
  const header = ['style', ...FORMAT_IDS].map((value) => value.padEnd(11)).join(' ');
  const lines = rows.map((row) => {
    const cells = row.cells.map((cell) => {
      const tag = cell.status === 'OK' ? 'OK  ' : cell.status === 'FAIL' ? 'FAIL' : 'GAP ';
      return `${tag} `.padEnd(11);
    });
    return [row.style.padEnd(11), ...cells].join(' ');
  });
  const problems = rows.flatMap((row) =>
    row.cells
      .filter((cell) => cell.status !== 'OK')
      .map((cell) => `${row.style}/${cell.format}: ${cell.status} — ${cell.reason}`),
  );
  const total = rows.length * FORMAT_IDS.length;
  const ok = rows.reduce((sum, row) => sum + row.cells.filter((cell) => cell.status === 'OK').length, 0);
  const summary = `${ok}/${total} cells OK (${total - ok} not OK)`;
  return [header, ...lines, '', summary, ...(problems.length ? ['', ...problems] : [])].join('\n');
}

function main(): void {
  runScript(async () => {
    const rows = await runCoverageMatrix();
    console.log(formatMatrix(rows));
    const failed = rows.some((row) => row.cells.some((item) => item.status !== 'OK'));
    if (failed) process.exitCode = 1;
  });
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]).endsWith('coverage-matrix.ts');
if (invokedDirectly) {
  main();
}
