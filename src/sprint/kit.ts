import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { getStyle } from '../styles/presets.js';
import { slugify } from '../generate.js';
import { renderDeck } from '../deck.js';
import { validateDeck } from '../validate.js';
import { parseSprintBrief, type SprintData } from './data.js';
import { applySprintCss, checkSprintFidelity, injectSprintBlocks, type SprintKitIssue } from './render.js';
import { buildPlanningDocument, buildRetroDocument, buildReviewDocument, type SprintDocument } from './slides.js';
import { createSprintGif, type SprintGifOptions } from './gif.js';
import { ensureMinTextSizeInHtml } from '../page/min-text.js';

export interface SprintKitFile {
  html: string;
  gif: string;
  grade: string;
  score: number;
  vision: number;
}

export interface SprintKitResult {
  directory: string;
  review: SprintKitFile;
  retro: SprintKitFile;
  planning: SprintKitFile;
  issues: SprintKitIssue[];
}

export interface SprintKitOptions extends SprintGifOptions {
  /** Injected in tests; defaults to a random UUID fragment. */
  runId?: string;
  /** Skip the three GIF encodes (the HTML kit is still written); used by the visual matrix. */
  skipGifs?: boolean;
}

const FILE_NAMES: Record<SprintDocument['kind'], { html: string; gif: string }> = {
  review: { html: 'review.html', gif: 'review.gif' },
  retro: { html: 'retro.html', gif: 'retro.gif' },
  planning: { html: 'planning.html', gif: 'planning.gif' },
};

/**
 * Unique per run: the team and sprint identify the kit, the short hash keeps
 * parallel runs of the same brief from colliding.
 */
function defaultDirectory(data: SprintData, runId: string): string {
  const team = slugify(data.team.name).slice(0, 24) || 'team';
  const sprint = slugify(data.sprint.id).slice(0, 16) || 'sprint';
  const hash = runId.replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'run';
  return path.resolve('beauty-output', `sprint-${team}-${sprint}-${hash}`);
}

function warningIssues(warnings: string[]): SprintKitIssue[] {
  return warnings.map((message) => ({
    severity: message.startsWith('Unknown field') ? 'warn' : 'info',
    code: message.startsWith('Unknown field') ? 'sprint-unknown-field' : 'sprint-brief-note',
    message,
  }));
}

/**
 * Build the review, retrospective and planning decks plus their data-driven
 * GIFs from one sprint brief. Every provided story/risk/action is verified in
 * the generated HTML and reported as an issue when it could not be shown.
 */
export async function createSprintKit(raw: unknown, output?: string, options: SprintKitOptions = {}): Promise<SprintKitResult> {
  const { data, warnings } = parseSprintBrief(raw);
  const preset = getStyle(data.style);
  const requested = output ?? data.output;
  const directory = requested ? path.resolve(requested) : defaultDirectory(data, options.runId ?? randomUUID());
  await mkdir(directory, { recursive: true });

  const documents: SprintDocument[] = [
    buildReviewDocument(preset, data),
    buildRetroDocument(preset, data),
    buildPlanningDocument(preset, data),
  ];

  const htmls: Partial<Record<SprintDocument['kind'], string>> = {};
  const files: Partial<Record<SprintDocument['kind'], SprintKitFile>> = {};

  for (const document of documents) {
    const rendered = renderDeck({ style: preset, brief: document.brief });
    const html = ensureMinTextSizeInHtml(applySprintCss(injectSprintBlocks(rendered.html, document.blocks)), {
      minPx: 12,
      maxWidth: 720,
    });
    const validation = validateDeck(html, data.style);
    const names = FILE_NAMES[document.kind];
    const htmlPath = path.join(directory, names.html);
    const gifPath = path.join(directory, names.gif);
    await writeFile(htmlPath, html, 'utf8');
    if (!options.skipGifs) await createSprintGif(data.style, document.kind, data, gifPath, options);
    htmls[document.kind] = html;
    files[document.kind] = {
      html: htmlPath,
      gif: gifPath,
      grade: validation.grade,
      score: validation.score,
      vision: validation.vision.score,
    };
  }

  const fidelity = checkSprintFidelity(data, {
    review: htmls.review ?? '',
    retro: htmls.retro ?? '',
    planning: htmls.planning ?? '',
  });

  return {
    directory,
    review: files.review!,
    retro: files.retro!,
    planning: files.planning!,
    issues: [...warningIssues(warnings), ...fidelity],
  };
}
