import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createDeck, createExperience, createPage, createStory } from '../src/generate.js';
import { createSprintKit } from '../src/sprint.js';
import { styleSlugs } from '../src/styles/presets.js';
import type { StyleSlug } from '../src/types.js';
import {
  auditArtifactBatch,
  locatePlaywright,
  visualSkipMessage,
  type BatchAuditArtifact,
  type BatchAuditEntry,
} from '../src/visual.js';
import { runScript } from './lib/run.js';

/**
 * The quality bar as a matrix: every style × every kind, generated from the
 * recipe briefs and audited with the real browser. A cell is only OK when the
 * product audit says A 100 and the Playwright pass left no open finding.
 *
 *   pnpm visual:matrix                 # all 13 styles × 7 kinds (91 artefacts)
 *   pnpm visual:matrix --style nature  # one style while iterating
 *   pnpm visual:matrix --kind page,deck
 */

export const VISUAL_MATRIX_KINDS = ['page', 'deck', 'story', 'experience', 'review', 'retro', 'planning'] as const;
export type VisualMatrixKind = (typeof VISUAL_MATRIX_KINDS)[number];

export type VisualMatrixStatus = 'A100' | 'below' | 'skipped' | 'error';

export interface VisualMatrixCell {
  kind: VisualMatrixKind;
  status: VisualMatrixStatus;
  score: number;
  grade: string;
  /** Deduped finding codes, sorted, so the report stays scannable. */
  findings: string[];
  /** Render or audit failure message when status is `error`/`skipped`. */
  detail?: string;
}

export interface VisualMatrixRow {
  style: StyleSlug;
  cells: VisualMatrixCell[];
}

export interface VisualMatrixOptions {
  styles?: StyleSlug[];
  kinds?: VisualMatrixKind[];
  /** Artifacts and reports land here; a temp dir is used and removed when omitted. */
  workDir?: string;
  recipeRoot?: string;
  /** Parallel pages on one browser. Defaults to 4. */
  concurrency?: number;
}

export function isPerfectCell(cell: VisualMatrixCell): boolean {
  return cell.status === 'A100';
}

export function matrixFailed(rows: VisualMatrixRow[]): boolean {
  return rows.some((row) => row.cells.some((cell) => !isPerfectCell(cell)));
}

export function summarizeMatrix(rows: VisualMatrixRow[]): { total: number; ok: number; failed: number } {
  const cells = rows.flatMap((row) => row.cells);
  const ok = cells.filter(isPerfectCell).length;
  return { total: cells.length, ok, failed: cells.length - ok };
}

export function formatVisualMatrix(rows: VisualMatrixRow[]): string {
  const header = ['style', ...VISUAL_MATRIX_KINDS].map((value) => value.padEnd(9)).join(' ');
  const lines = rows.map((row) => {
    const cells = VISUAL_MATRIX_KINDS.map((kind) => {
      const cell = row.cells.find((item) => item.kind === kind);
      if (!cell) return '·'.padEnd(9);
      if (cell.status === 'error') return 'ERR'.padEnd(9);
      if (cell.status === 'skipped') return '--'.padEnd(9);
      return String(cell.score).padEnd(9);
    });
    return [row.style.padEnd(9), ...cells].join(' ');
  });
  const { total, ok, failed } = summarizeMatrix(rows);
  const problems = rows.flatMap((row) =>
    row.cells
      .filter((cell) => !isPerfectCell(cell))
      .map((cell) => {
        const detail = cell.detail ? ` — ${cell.detail}` : '';
        const findings = cell.findings.length ? ` [${cell.findings.join(', ')}]` : '';
        return `${row.style}/${cell.kind}: ${cell.grade} ${cell.score}/100${findings}${detail}`;
      }),
  );
  return [
    header,
    ...lines,
    '',
    `${ok}/${total} cells A100 (${failed} below the bar)`,
    ...(problems.length ? ['', ...problems] : []),
  ].join('\n');
}

function isStyleSlugValue(value: string): value is StyleSlug {
  return (styleSlugs as readonly string[]).includes(value);
}

function parseKinds(raw: string | undefined): VisualMatrixKind[] {
  if (!raw) return [...VISUAL_MATRIX_KINDS];
  const requested = raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => (VISUAL_MATRIX_KINDS as readonly string[]).includes(value));
  return requested.length ? (requested as VisualMatrixKind[]) : [...VISUAL_MATRIX_KINDS];
}

function parseStyles(raw: string | undefined): StyleSlug[] {
  if (!raw) return [...styleSlugs];
  const requested = raw
    .split(',')
    .map((value) => value.trim())
    .filter(isStyleSlugValue);
  return requested.length ? requested : [...styleSlugs];
}

async function readRecipe(recipeRoot: string, style: StyleSlug, kind: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path.join(recipeRoot, style, `${kind}.json`), 'utf8')) as Record<string, unknown>;
}

interface RenderedArtifact {
  label: string;
  style: StyleSlug;
  kind: VisualMatrixKind;
  html?: string;
  error?: string;
}

async function renderArtifacts(style: StyleSlug, kinds: VisualMatrixKind[], recipeRoot: string, workDir: string): Promise<RenderedArtifact[]> {
  const outcomes: RenderedArtifact[] = [];
  const push = async (kind: VisualMatrixKind, render: () => Promise<string>): Promise<void> => {
    try {
      outcomes.push({ label: `${style}-${kind}`, style, kind, html: await render() });
    } catch (error) {
      outcomes.push({ label: `${style}-${kind}`, style, kind, error: error instanceof Error ? error.message : String(error) });
    }
  };

  for (const kind of kinds) {
    if (kind === 'page') await push(kind, async () => (await createPage({ style, brief: await readRecipe(recipeRoot, style, 'page') })).html);
    else if (kind === 'deck') await push(kind, async () => (await createDeck({ style, brief: await readRecipe(recipeRoot, style, 'deck') })).html);
    else if (kind === 'story') await push(kind, async () => (await createStory({ style, brief: await readRecipe(recipeRoot, style, 'story') })).html);
    else if (kind === 'experience') await push(kind, async () => (await createExperience({ style, brief: await readRecipe(recipeRoot, style, 'experience') })).html);
  }

  const sprintKinds = kinds.filter((kind): kind is 'review' | 'retro' | 'planning' => kind === 'review' || kind === 'retro' || kind === 'planning');
  if (sprintKinds.length) {
    try {
      const kit = await createSprintKit(await readRecipe(recipeRoot, style, 'sprint'), path.join(workDir, `sprint-${style}`), { skipGifs: true });
      for (const kind of sprintKinds) {
        const file = kit[kind];
        outcomes.push({ label: `${style}-${kind}`, style, kind, html: await readFile(file.html, 'utf8') });
      }
    } catch (error) {
      for (const kind of sprintKinds) {
        outcomes.push({ label: `${style}-${kind}`, style, kind, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  const order = new Map(kinds.map((kind, index) => [kind, index]));
  return outcomes.sort((a, b) => (order.get(a.kind) ?? 0) - (order.get(b.kind) ?? 0));
}

export async function runVisualMatrix(options: VisualMatrixOptions = {}): Promise<VisualMatrixRow[]> {
  const styles = options.styles ?? [...styleSlugs];
  const kinds = options.kinds ?? [...VISUAL_MATRIX_KINDS];
  const recipeRoot = options.recipeRoot ?? path.resolve(process.cwd(), 'examples/recipes');
  const ownsWorkDir = !options.workDir;
  const workDir = options.workDir ?? (await mkdtemp(path.join(os.tmpdir(), 'beauty-visual-matrix-')));

  try {
    const rows: VisualMatrixRow[] = [];
    for (const style of styles) {
      const rendered = await renderArtifacts(style, kinds, recipeRoot, workDir);
      const auditable: BatchAuditArtifact[] = [];
      for (const item of rendered) {
        if (typeof item.html !== 'string') continue;
        const filePath = path.join(workDir, `${item.label}.html`);
        await writeFile(filePath, item.html, 'utf8');
        auditable.push({ html: item.html, style: item.style, label: item.label, filePath });
      }
      const entries = await auditArtifactBatch(auditable, { concurrency: options.concurrency });
      const byLabel = new Map(entries.map((entry) => [entry.label, entry]));
      rows.push({
        style,
        cells: rendered.map((item) => {
          const entry = byLabel.get(item.label);
          return entry
            ? cellFor(item.kind, entry)
            : { kind: item.kind, status: 'error', score: 0, grade: '-', findings: [], detail: item.error ?? 'render failed' };
        }),
      });
    }
    return rows;
  } finally {
    if (ownsWorkDir) await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

function cellFor(kind: VisualMatrixKind, entry: BatchAuditEntry): VisualMatrixCell {
  const findings = [...new Set(entry.visual.findings.map((finding) => finding.code))].sort();
  if (entry.visual.status !== 'ran') {
    return {
      kind,
      status: 'skipped',
      score: entry.result.score,
      grade: entry.result.grade,
      findings,
      detail: entry.visual.message ?? visualSkipMessage(),
    };
  }
  const perfect = entry.result.grade === 'A' && entry.result.score === 100 && findings.length === 0;
  return {
    kind,
    status: perfect ? 'A100' : 'below',
    score: entry.result.score,
    grade: entry.result.grade,
    findings,
  };
}

interface CliFlags {
  styles?: string;
  kinds?: string;
  concurrency?: number;
  workDir?: string;
  keep: boolean;
}

function parseFlags(argv: string[]): CliFlags {
  const flags: CliFlags = { keep: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (arg === '--style' || arg === '--styles') flags.styles = argv[index + 1];
    else if (arg === '--kind' || arg === '--kinds') flags.kinds = argv[index + 1];
    else if (arg === '--concurrency') flags.concurrency = Number(argv[index + 1]) || undefined;
    else if (arg === '--work-dir') flags.workDir = argv[index + 1];
    else if (arg === '--keep') flags.keep = true;
  }
  return flags;
}

function main(): void {
  runScript(async () => {
    const flags = parseFlags(process.argv.slice(2));
    if (!locatePlaywright()) {
      console.error(`visual matrix cannot run: ${visualSkipMessage()}`);
      process.exitCode = 1;
      return;
    }
    const workDir = flags.keep || flags.workDir ? flags.workDir ?? path.resolve('beauty-visual-matrix') : undefined;
    const rows = await runVisualMatrix({
      styles: parseStyles(flags.styles),
      kinds: parseKinds(flags.kinds),
      concurrency: flags.concurrency,
      workDir,
    });
    console.log(formatVisualMatrix(rows));
    if (flags.keep && workDir) console.log(`\nartefacts kept in ${path.resolve(workDir)}`);
    if (matrixFailed(rows)) process.exitCode = 1;
  });
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]).endsWith('visual-matrix.ts');
if (invokedDirectly) {
  main();
}
