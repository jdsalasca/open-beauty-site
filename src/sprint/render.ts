import { esc } from '../page/common.js';
import { sprintKitCss } from './charts.js';
import type { SprintData } from './data.js';
import type { SprintBlock } from './slides.js';

export interface SprintKitIssue {
  severity: 'error' | 'warn' | 'info';
  code: string;
  message: string;
}

/** Replace every chart/table placeholder with its data block. */
export function injectSprintBlocks(html: string, blocks: SprintBlock[]): string {
  let out = html;
  for (const block of blocks) {
    const slide = `<p class="deck-body anim" style="--a:2">${block.token}</p>`;
    if (!out.includes(slide)) {
      throw new Error(`Sprint kit: the deck template did not expose a slide for ${block.token}.`);
    }
    out = out.replace(slide, block.html);
  }
  return out;
}

/** Append the block CSS to the deck's own style element. */
export function applySprintCss(html: string): string {
  const index = html.indexOf('</style>');
  if (index < 0) return html;
  return `${html.slice(0, index)}\n${sprintKitCss()}\n${html.slice(index)}`;
}

/**
 * Data fidelity: every provided story title, risk and action must be visible
 * in the document built for it. Anything the deck cap could not fit is
 * reported as an issue instead of disappearing silently.
 */
export function checkSprintFidelity(
  data: SprintData,
  pages: { review: string; retro: string; planning: string },
): SprintKitIssue[] {
  const issues: SprintKitIssue[] = [];
  const has = (html: string, value: string): boolean => html.includes(esc(value));
  for (const story of data.stories) {
    if (!has(pages.review, story.title)) {
      const label = story.id ? `${story.id} · ${story.title}` : story.title;
      issues.push({
        severity: 'error',
        code: 'sprint-fidelity',
        message: `Story "${label}" is missing from the review document.`,
      });
    }
  }
  for (const risk of data.risks) {
    if (!has(pages.review, risk.title)) {
      issues.push({
        severity: 'error',
        code: 'sprint-fidelity',
        message: `Risk "${risk.title}" is missing from the review document.`,
      });
    }
  }
  for (const action of data.retro.actions) {
    if (!has(pages.retro, action.what)) {
      issues.push({
        severity: 'error',
        code: 'sprint-fidelity',
        message: `Action "${action.what}" is missing from the retrospective document.`,
      });
    }
  }
  return issues;
}
