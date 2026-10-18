import type { StyleSlug } from '../types.js';

/** One graded axis of the critic. `score` is 0–100. */
export interface CriticCategory {
  name: string;
  label: string;
  score: number;
  findings: string[];
}

/** The editorial read of a page: structure is necessary but not sufficient. */
export interface CriticReport {
  style: StyleSlug;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  categories: CriticCategory[];
  /** The three highest-impact fixes, worst category first. */
  topFixes: string[];
}
