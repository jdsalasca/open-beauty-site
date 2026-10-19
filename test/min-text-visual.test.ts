import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditArtifactBatch, locatePlaywright, type BatchAuditArtifact } from '../src/visual.js';
import { renderPage } from '../src/page/index.js';
import { renderDeck } from '../src/deck.js';
import { renderStory } from '../src/page/story.js';
import { renderExperience } from '../src/page/experience.js';
import { getStyle, styleSlugs } from '../src/styles/presets.js';
import type { ExperienceBrief, PageBrief, StoryBrief, StyleSlug } from '../src/types.js';
import type { DeckBriefInput } from '../src/types/deck.js';

/**
 * Phone readability contract for the recipes the harness ships: every page,
 * deck, story and experience must render zero `text-too-small` findings through
 * the real product validator at 360px. Playwright is locate()d through the same
 * chain as `beauty validate --visual` (env, project, global, sibling) and the
 * test skips instead of failing when Chromium is unavailable.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KINDS = ['page', 'deck', 'story', 'experience'] as const;
type Kind = (typeof KINDS)[number];

async function recipe(style: StyleSlug, kind: Kind): Promise<Record<string, unknown>> {
  const raw = await readFile(path.join(root, 'examples', 'recipes', style, `${kind}.json`), 'utf8');
  return JSON.parse(raw) as Record<string, unknown>;
}

function render(kind: Kind, style: StyleSlug, brief: Record<string, unknown>): string {
  switch (kind) {
    case 'page':
      return renderPage(style, brief as Partial<PageBrief>);
    case 'deck':
      return renderDeck({ style: getStyle(style), brief: brief as DeckBriefInput }).html;
    case 'story':
      return renderStory(brief as Partial<StoryBrief>, getStyle(style));
    case 'experience':
      return renderExperience(brief as Partial<ExperienceBrief>, getStyle(style));
  }
}

test('every recipe renders zero text-too-small findings at 360px', async (t) => {
  if (!locatePlaywright()) {
    t.skip('playwright not found via BEAUTY_PLAYWRIGHT_ROOT, project, global or sibling path');
    return;
  }
  const items: BatchAuditArtifact[] = [];
  for (const kind of KINDS) {
    for (const style of styleSlugs) {
      const html = render(kind, style, await recipe(style, kind));
      items.push({ html, style, label: `${kind}-${style}` });
    }
  }
  // One Chromium for the whole matrix: 52 audits in a single browser with a
  // small page pool instead of 52 separate launches.
  const entries = await auditArtifactBatch(items, { concurrency: 4 });
  const failures: string[] = [];
  let audits = 0;
  for (const entry of entries) {
    if (entry.visual.status !== 'ran') {
      t.skip(entry.visual.message ?? 'playwright located but Chromium is unavailable');
      return;
    }
    audits += 1;
    for (const finding of entry.visual.findings.filter((item) => item.code === 'text-too-small')) {
      failures.push(`${entry.label}: ${finding.selector} · ${finding.detail} · "${finding.text ?? ''}"`);
    }
  }
  assert.equal(audits, styleSlugs.length * KINDS.length, 'every recipe must be audited in a real browser');
  assert.deepEqual(failures, [], `recipes render text below 12px at 360px:\n${failures.join('\n')}`);
});
