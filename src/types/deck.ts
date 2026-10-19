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
 * A deck brief as accepted by the generator. `author` and `date` already live
 * on `DeckBrief`; this alias exists so deck code does not import the whole
 * type soup for one signature.
 */
export type DeckBriefInput = Partial<DeckBrief>;
