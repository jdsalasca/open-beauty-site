import type { DeckBrief, DeckPurpose } from '../types.js';

/**
 * Deck limits shared by the generator and the validator so a deck can never
 * silently drop or exceed content: the generator fails loudly and the
 * validator reports the same numbers.
 */

/** Purpose-driven compositions accepted by the deck engine. */
export const DECK_PURPOSES: readonly DeckPurpose[] = [
  'cover',
  'problem',
  'comparison',
  'process',
  'example',
  'result',
  'next-steps',
  'table',
];

/** Maximum authored content slides; the cover and closing are added on top. */
export const DECK_CONTENT_SLIDE_LIMIT = 14;

/** Maximum total slides in the rendered deck (content + cover + closing). */
export const DECK_TOTAL_SLIDE_LIMIT = DECK_CONTENT_SLIDE_LIMIT + 2;

/** Maximum stat cards accepted by the stats layout. */
export const DECK_STAT_LIMIT = 6;

/** Maximum words allowed on one content slide, labels included. */
export const DECK_WORD_LIMIT = 55;

/** Maximum points allowed on one points slide. */
export const DECK_POINT_LIMIT = 4;

/** The process composition is a path, so it accepts 3–5 steps. */
export const DECK_STEP_MIN = 3;
export const DECK_STEP_LIMIT = 5;

/** A deck table stays simple: at most 6 rows × 4 columns. */
export const DECK_TABLE_ROW_LIMIT = 6;
export const DECK_TABLE_COLUMN_LIMIT = 4;

/**
 * Character limits for authored deck copy. They match the MCP schemas and are
 * enforced with a structured error: the renderer never clips user text.
 */
export const DECK_TEXT_LIMITS = {
  deckTitle: 120,
  tagline: 200,
  intro: 900,
  eyebrow: 60,
  brand: 50,
  author: 60,
  date: 40,
  closing: 120,
  ctaLabel: 40,
  ctaHref: 200,
  kicker: 40,
  slideTitle: 120,
  slideBody: 300,
  pointTitle: 80,
  pointBody: 180,
  statValue: 18,
  statLabel: 48,
  quoteText: 320,
  quoteAuthor: 90,
  tableCaption: 120,
  tableColumn: 40,
  tableCell: 80,
} as const;

export type { DeckPurpose } from '../types.js';

/**
 * A deck brief as accepted by the generator. `author` and `date` already live
 * on `DeckBrief`; this alias exists so deck code does not import the whole
 * type soup for one signature.
 */
export type DeckBriefInput = Partial<DeckBrief>;
