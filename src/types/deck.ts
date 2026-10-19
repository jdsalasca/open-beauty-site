import type { DeckBrief } from '../types.js';

/**
 * Deck limits shared by the generator and the validator so a deck can never
 * silently drop or exceed content: the generator fails loudly and the
 * validator reports the same numbers.
 */

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
} as const;

/**
 * A deck brief as accepted by the generator. `author` and `date` already live
 * on `DeckBrief`; this alias exists so deck code does not import the whole
 * type soup for one signature.
 */
export type DeckBriefInput = Partial<DeckBrief>;
