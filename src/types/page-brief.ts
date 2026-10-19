import type { Brief } from '../types.js';

/**
 * Closing call-to-action fields for a page brief. They let the brief set the
 * final headline and body instead of relying on the style default, and mirror
 * the deck `closing` field. All fields are optional; a renderer falls back to
 * its own copy when they are missing.
 */
export interface PageClosingBrief {
  /** Headline for the closing section. Length-aware sizing applies on mobile. */
  title?: string;
  /** Supporting sentence under the closing headline. */
  text?: string;
  /** Optional label/href override for the closing button. */
  cta?: {
    label?: string;
    href?: string;
  };
}

/**
 * Page brief with an optional `closing` block. Kept separate from `Brief`
 * because deck and experience briefs already own a string `closing`.
 */
export interface PageBrief extends Brief {
  closing?: PageClosingBrief;
}
