import type { RichIssue, RichValidationResult } from './validation.js';
import type { StyleSlug } from '../types.js';

/**
 * Real-browser checks. The static validator reads the markup and the CSS; it
 * cannot see what a 360px phone actually renders. These codes are the ones the
 * Playwright pass can prove with geometry.
 */
export type VisualIssueCode =
  | 'horizontal-overflow'
  | 'fixed-sticky-element-occludes-text'
  | 'orphan-grid-item'
  | 'clipped-text'
  | 'text-too-small'
  | 'overlap-decoration-on-content'
  | 'mid-word-break';

export interface VisualViewport {
  width: number;
  height: number;
  label: string;
}

export interface VisualFinding {
  code: VisualIssueCode;
  selector: string;
  detail: string;
  text?: string;
  viewport: string;
}

export type PlaywrightSource = 'env' | 'project' | 'global' | 'sibling';

export interface PlaywrightLocation {
  root: string;
  modulePath: string;
  source: PlaywrightSource;
}

export interface VisualAuditReport {
  /** `ran` means Chromium loaded the page; `skipped` is never a silent pass. */
  status: 'ran' | 'skipped';
  message?: string;
  issues: RichIssue[];
  findings: VisualFinding[];
  playwright?: PlaywrightLocation;
  shots?: string[];
}

export interface VisualAuditOptions {
  filePath?: string;
  shots?: string;
  playwright?: PlaywrightLocation | null;
  viewports?: VisualViewport[];
}

export interface AuditOptions {
  visual?: boolean;
  shots?: string;
  filePath?: string;
}

/** Per-slide findings for a deck at presentation size. */
export interface DeckSlideAudit {
  /** 1-based slide number, matching the deck counter. */
  index: number;
  findings: VisualFinding[];
}

export interface DeckAuditReport {
  status: 'ran' | 'skipped';
  message?: string;
  viewport: VisualViewport;
  slides: DeckSlideAudit[];
  findings: VisualFinding[];
  playwright?: PlaywrightLocation;
}

export interface DeckAuditArtifact {
  html: string;
  style: StyleSlug;
  label: string;
  filePath?: string;
}

export interface DeckAuditOptions {
  viewport?: VisualViewport;
  /** Parallel pages sharing one browser. Defaults to 4. */
  concurrency?: number;
  /** Minimum computed font size inside a slide. Defaults to 12px. */
  minFontPx?: number;
}

export interface DeckAuditEntry {
  label: string;
  report: DeckAuditReport;
}

/** A validation result plus the provenance of the optional browser pass. */
export interface AuditReport {
  result: RichValidationResult;
  visual: VisualAuditReport;
}
