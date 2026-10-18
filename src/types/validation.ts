import type { ValidationIssue, ValidationResult } from '../types.js';

/**
 * A machine-applicable repair. `validate` emits these alongside an issue; the
 * `fix` command replays them so validation and repair can never drift apart.
 * The `params` bag is intentionally small: each op is a well-known, safe move.
 */
export type PatchOp =
  | 'set-lang'
  | 'ensure-title'
  | 'ensure-viewport'
  | 'add-alt'
  | 'normalize-headings'
  | 'ensure-skip-link'
  | 'ensure-main'
  | 'snap-palette-colors'
  | 'replace-hex'
  | 'clamp-overflow'
  | 'radius-to-range'
  | 'border-width'
  | 'replace-font'
  | 'replace-shadow'
  | 'brutalist-shadow'
  | 'papercraft-shadow'
  | 'remove-element'
  | 'strip-emoji'
  | 'strip-placeholder'
  | 'ensure-reduced-motion'
  | 'cap-duration';

export interface Patch {
  op: PatchOp;
  params?: Record<string, string>;
}

/**
 * A validator issue written for a small model: where it is, why it matters, how
 * to fix it, a concrete before/after example and, when it is safe, a patch.
 */
export interface RichIssue extends ValidationIssue {
  /** Human-readable location, e.g. "the <style> block", "the first <img> in <main>". */
  where: string;
  /** Why the page is worse with this problem. */
  why: string;
  /** A minimal corrected snippet the model can copy. */
  example: string;
  /** Required plain-language fix; kept for compatibility with `ValidationIssue`. */
  fix: string;
  /** Ordered, idempotent repair steps. Empty when no safe automatic move exists. */
  patch: Patch[];
}

/** `ValidationResult` whose issues carry the teaching fields. */
export interface RichValidationResult extends ValidationResult {
  issues: RichIssue[];
}

/** Compact before/after snapshot used by the fix loop and the CLI/MCP tools. */
export interface ScoreSnapshot {
  score: number;
  grade: ValidationResult['grade'];
  errors: number;
  warnings: number;
  infos: number;
}
