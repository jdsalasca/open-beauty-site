import type { StyleSlug, TypeSystem } from '../types.js';

export const NARRATIVE_ERROR_CODES = [
  'EMPTY_PHASE',
  'INVALID_STATE',
  'IMPOSSIBLE_SIZE',
  'BAD_DURATION',
  'NOT_FINITE',
  'TOO_MANY_FRAMES',
  'RESOURCE_LIMIT',
  'UNSUPPORTED_ASPECT',
  'TEXT_OVERFLOW',
  'FONT_MISSING',
  'STYLE_NOT_SUPPORTED_YET',
] as const;

export type NarrativeErrorCode = (typeof NARRATIVE_ERROR_CODES)[number];

export class NarrativeError extends Error {
  constructor(
    public readonly code: NarrativeErrorCode,
    message: string,
    public readonly suggestion?: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'NarrativeError';
  }
}

export type NarrativeStatus = 'open' | 'in-review' | 'done';
export type NarrativeSubfamily = 'editorial' | 'documentary' | 'poster';
export type NarrativeOutputPreset = 'review-1280x720' | 'card-640x360' | 'square-1080' | 'story-1080x1920';
export type NarrativeFormat = 'gif' | 'png';

export interface NarrativePhase {
  id: string;
  label: string;
  text: string;
  visual: { kind: string; state: string };
}

export interface NarrativePlayback {
  minReadableHoldMs: number;
  transitionMs: number;
  loop: boolean;
}

export interface NarrativeOutput {
  width: number;
  height: number;
  formats: NarrativeFormat[];
  preset: NarrativeOutputPreset;
}

export interface NarrativeBriefInput {
  style: StyleSlug;
  subfamily?: NarrativeSubfamily;
  kind: 'narrative-gif';
  locale: 'es' | 'en';
  audience: string;
  title: string;
  status: NarrativeStatus;
  phases: NarrativePhase[];
  playback?: Partial<NarrativePlayback>;
  output?: Partial<NarrativeOutput>;
  seed?: number;
}

export interface NormalizedNarrativeBrief extends NarrativeBriefInput {
  subfamily?: NarrativeSubfamily;
  playback: NarrativePlayback;
  output: NarrativeOutput;
  seed: number;
}

export type NarrativeTimelineKind = 'entry' | 'hold' | 'transition' | 'loop-bridge';

export interface NarrativeTimelineFrame {
  kind: NarrativeTimelineKind;
  phaseIndex: number;
  fromPhaseIndex: number;
  toPhaseIndex: number;
  progress: number;
  delayMs: number;
}

export interface NarrativeTextBlock {
  sourceText: string;
  lines: string[];
  size: number;
  lineHeight: number;
  width: number;
  height: number;
  tracking: number;
  effectiveCardSize: number;
}

export interface NarrativePhaseLayout {
  label: NarrativeTextBlock;
  body: NarrativeTextBlock;
}

export interface NarrativeFontRole {
  family: string;
  weight: number;
}

export type NarrativeFontRoleName = 'display' | 'reading' | 'label' | 'figure' | 'annotation';

export interface NarrativeFontMap {
  display: NarrativeFontRole;
  reading: NarrativeFontRole;
  label: NarrativeFontRole;
  figure: NarrativeFontRole;
  annotation: NarrativeFontRole;
}

export interface NarrativeFontProfile {
  preferred: NarrativeFontMap;
  effective: NarrativeFontMap;
  approvedAlternative: NarrativeFontMap;
  typeSystem: TypeSystem;
  source: 'bundled-ofl';
}

export interface NarrativeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NarrativeLayout {
  safeZone: NarrativeRect;
  textArea: NarrativeRect;
  reservedArtArea: NarrativeRect;
  title: NarrativeTextBlock;
  phases: NarrativePhaseLayout[];
  cardScale: number;
  warnings: string[];
}

export interface NarrativeRenderContext {
  brief: NormalizedNarrativeBrief;
  layout: NarrativeLayout;
  frame: NarrativeTimelineFrame;
  localTimeMs: number;
  phaseIndex: number;
  phase: NarrativePhase;
  object: unknown;
  safeBoxes: { safe: NarrativeRect; text: NarrativeRect; art: NarrativeRect };
  fonts: NarrativeFontProfile;
  rng: () => number;
}

export interface NarrativeScene {
  style: StyleSlug;
  version: string;
  supportsAspect(aspect: number): boolean;
  createObject(brief: NormalizedNarrativeBrief, rng: () => number): unknown;
  renderFrame(context: NarrativeRenderContext): Uint8ClampedArray;
}

export type NarrativeLevelStatus = 'pass' | 'fail' | 'pending' | 'not-evaluated';

export interface NarrativeControlResult {
  name: string;
  passed: boolean;
  detail: string;
  source?: 'source' | 'pixels' | 'decoded' | 'human';
}

export interface NarrativeEvaluationLevel {
  status: NarrativeLevelStatus;
  controls: NarrativeControlResult[];
  note?: string;
}

export interface NarrativeEvaluation {
  'technical-integrity': NarrativeEvaluationLevel;
  'style-conformance': NarrativeEvaluationLevel & { sourceStatus: NarrativeLevelStatus; pixelStatus: NarrativeLevelStatus };
  'rendered-legibility': NarrativeEvaluationLevel;
  narrative: NarrativeEvaluationLevel;
  'visual-review': { status: 'pending' | 'not-evaluated' | `model:${string}` | 'human'; criteria: string[]; evidence?: string[] };
  publicationRecommendation: 'none';
}
