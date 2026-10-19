import type { StyleSlug, TypeSystem } from '../types.js';
import type { NarrativeSemanticScene, NarrativeSemanticSceneInput, NarrativeObjectRegion } from './narrative-scene.js';
export type { NarrativeObjectRegion, NarrativeObjectTextBox, NarrativeSemanticAction, NarrativeSemanticEntity, NarrativeSemanticEntityInput, NarrativeSemanticEntityKind, NarrativeSemanticPrimitive, NarrativeSemanticRelation, NarrativeSemanticScene, NarrativeSemanticSceneInput } from './narrative-scene.js';

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
  'UNSUPPORTED_STATE',
  'UNSUPPORTED_VISUAL_KIND',
  'UNSUPPORTED_ACTION',
  'UNSUPPORTED_ENTITY',
  'UNSUPPORTED_LAYOUT',
] as const;

export type NarrativeErrorCode = (typeof NARRATIVE_ERROR_CODES)[number];

export interface NarrativeErrorDetails {
  phaseIndex?: number;
  style?: StyleSlug;
  value?: string;
  validAlternatives?: string[];
}

export class NarrativeError extends Error {
  constructor(
    public readonly code: NarrativeErrorCode,
    message: string,
    public readonly suggestion?: string,
    public readonly field?: string,
    public readonly details?: NarrativeErrorDetails,
  ) {
    super(message);
    this.name = 'NarrativeError';
  }
}

export type NarrativeStatus = 'open' | 'in-review' | 'done';
export type NarrativeLocale = 'es' | 'en';
export type NarrativeOutcomeMode = 'expected' | 'observed';
export type NarrativeBadgePolicy = 'none' | 'custom' | 'workflow';
export type NarrativePlaybackPreset = 'readable' | 'concise' | 'product-review';
export type NarrativeSubfamily = 'editorial' | 'documentary' | 'poster';
export type NarrativeOutputPreset = 'review-1280x720' | 'card-640x360' | 'square-1080' | 'story-1080x1920';
export type NarrativeFormat = 'gif' | 'png';
export type NarrativeSceneLayout = 'object-left' | 'object-right' | 'object-top' | 'object-hero';

export interface NarrativePhase {
  id: string;
  label: string;
  text: string;
  visual: { kind: string; state: string; action?: string; semantic?: NarrativeSemanticSceneInput };
  /** Optional per-scene geometry; omitted keeps the style's current left-copy/right-object layout. */
  layout?: NarrativeSceneLayout;
  holdMs?: number;
}

export type NormalizedNarrativePhase = Omit<NarrativePhase, 'visual'> & {
  visual: Omit<NarrativePhase['visual'], 'semantic'> & { semantic: NarrativeSemanticScene };
};

export interface NarrativeEvidenceRef {
  id: string;
  label: string;
  source?: string;
  date?: string;
}

export interface NarrativeOutcome {
  mode: NarrativeOutcomeMode;
  evidenceRefs?: NarrativeEvidenceRef[];
  scopeNote?: string;
}

export interface NarrativeSceneValueDeclaration {
  value: string;
  status: 'supported' | 'fallback';
  reason: string;
}

export interface NarrativeSceneVocabulary {
  visualKinds: NarrativeSceneValueDeclaration[];
  states: NarrativeSceneValueDeclaration[];
  actions: NarrativeSceneValueDeclaration[];
  stateSemantics: 'value-driven' | 'phase-order-fallback';
}

export interface NarrativePlayback {
  preset: NarrativePlaybackPreset;
  minReadableHoldMs: number;
  transitionMs: number;
  loop: boolean;
  totalDurationBudgetMs: number;
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
  /** Deprecated alias for workflowStatus; retained in normalized briefs and manifests. */
  status?: NarrativeStatus;
  workflowStatus?: NarrativeStatus;
  outcome?: NarrativeOutcome;
  illustrative?: boolean;
  badgePolicy?: NarrativeBadgePolicy;
  badgeText?: string;
  phases: NarrativePhase[];
  playback?: Partial<NarrativePlayback>;
  output?: Partial<NarrativeOutput>;
  seed?: number;
}

export interface NormalizedNarrativeBrief extends Omit<NarrativeBriefInput, 'status' | 'workflowStatus' | 'outcome' | 'illustrative' | 'badgePolicy' | 'badgeText' | 'phases'> {
  status: NarrativeStatus;
  workflowStatus: NarrativeStatus;
  outcome: NarrativeOutcome;
  illustrative: boolean;
  badgePolicy: NarrativeBadgePolicy;
  badgeText?: string;
  subfamily?: NarrativeSubfamily;
  playback: NarrativePlayback;
  output: NarrativeOutput;
  seed: number;
  phases: NormalizedNarrativePhase[];
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

export interface NarrativeCopyPositions {
  titleY: number;
  labelY: number;
  bodyY: number;
  groupHeight: number;
}

export interface NarrativePhaseFrameLayout {
  layout: NarrativeSceneLayout;
  textArea: NarrativeRect;
  reservedArtArea: NarrativeRect;
  copyPositions: NarrativeCopyPositions;
  title: NarrativeTextBlock;
  label: NarrativeTextBlock;
  body: NarrativeTextBlock;
}

export interface NarrativeLayout {
  safeZone: NarrativeRect;
  textArea: NarrativeRect;
  reservedArtArea: NarrativeRect;
  copyPositions: NarrativeCopyPositions;
  title: NarrativeTextBlock;
  phases: NarrativePhaseLayout[];
  /** Per-scene resolved geometry; index matches `brief.phases`. */
  phaseFrames: NarrativePhaseFrameLayout[];
  cardScale: number;
  warnings: string[];
}

export interface NarrativeEditorialWarning {
  code: 'EDITORIAL_GUIDELINE' | 'CONTENT_LINT';
  message: string;
  suggestion: string;
  field?: string;
  phaseIndex?: number;
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
  semantic?: NarrativeSemanticScene;
}

export interface NarrativeScene {
  style: StyleSlug;
  version: string;
  /** Optional so third-party scenes compiled against the v1 contract remain source-compatible. */
  vocabulary?: NarrativeSceneVocabulary;
  supportsAspect(aspect: number): boolean;
  createObject(brief: NormalizedNarrativeBrief, rng: () => number): unknown;
  objectRegions?(context: NarrativeRenderContext): NarrativeObjectRegion[];
  renderFrame(context: NarrativeRenderContext): Uint8ClampedArray;
}

export type NarrativeLevelStatus = 'pass' | 'revise' | 'fail' | 'pending' | 'not-evaluated';

export interface NarrativeControlResult {
  name: string;
  passed: boolean;
  detail: string;
  source?: 'source' | 'pixels' | 'decoded' | 'human';
  severity?: 'warning' | 'error';
  status?: 'pass' | 'pending' | 'fail';
}

export interface NarrativeEvaluationLevel {
  status: NarrativeLevelStatus;
  controls: NarrativeControlResult[];
  note?: string;
}

export interface NarrativeAutomatedEvidence {
  balanceByFrame: Array<{
    frameIndex: number;
    phaseId: string;
    kind: 'hold' | 'transition' | 'loop-bridge';
    label: string;
    regions: NarrativeObjectRegion[];
    metrics: { emptyCellRatio: number; textColumnFillRatio: number; objectAreaRatio: number; largestEmptyRectangleRatio: number };
  }>;
  objectTransformationByFrame: Array<{
    frameIndex: number;
    phaseId: string;
    fromPhaseId?: string;
    kind: 'hold' | 'transition' | 'loop-bridge';
    measured: boolean;
    passed: boolean;
    regions: Array<{ entityId: string; bounds: NarrativeRect; fromState?: string; toState?: string; pixelDiffRatio: number; changed: boolean }>;
  }>;
}

export interface NarrativeEvaluation {
  'technical-integrity': NarrativeEvaluationLevel;
  'style-conformance': NarrativeEvaluationLevel & { sourceStatus: NarrativeLevelStatus; pixelStatus: NarrativeLevelStatus };
  'rendered-legibility': NarrativeEvaluationLevel;
  narrative: NarrativeEvaluationLevel;
  'visual-review': {
    status: 'pending' | 'not-evaluated' | 'approved' | 'revise' | 'stale' | `model:${string}` | 'human';
    criteria: string[];
    evidence?: string[];
    reviewer?: unknown;
    feedback?: unknown[];
  };
  publicationRecommendation: 'none' | 'consider-publication';
  automatedEvidence?: NarrativeAutomatedEvidence;
}
