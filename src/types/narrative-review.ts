import { z } from 'zod';

export const NARRATIVE_REVIEW_CRITERIA = [
  'thumbnailIdentity',
  'cardSizeReading',
  'styleMaterial',
  'phaseContinuity',
  'loopRestart',
  'artOnlyTransformationUnderstood',
] as const;

export const NARRATIVE_REVIEW_LEVELS = [
  'technical-integrity',
  'style-conformance',
  'rendered-legibility',
  'narrative',
  'visual-review',
] as const;

export const reviewVerdictSchema = z.enum(['pass', 'revise', 'not-evaluated']);
const criterionSchema = z.object({ verdict: reviewVerdictSchema, note: z.string().max(2_000).optional() }).strict();
export const reviewCriteriaSchema = z.object({
  thumbnailIdentity: criterionSchema,
  cardSizeReading: criterionSchema,
  styleMaterial: criterionSchema,
  phaseContinuity: criterionSchema,
  loopRestart: criterionSchema,
  artOnlyTransformationUnderstood: criterionSchema,
}).strict();

export const reviewLevelsSchema = z.object({
  'technical-integrity': reviewVerdictSchema,
  'style-conformance': reviewVerdictSchema,
  'rendered-legibility': reviewVerdictSchema,
  narrative: reviewVerdictSchema,
  'visual-review': reviewVerdictSchema,
}).strict();

const reviewerBase = { id: z.string().min(1).max(160), name: z.string().min(1).max(160) };
export const reviewerSchema = z.discriminatedUnion('kind', [
  z.object({ ...reviewerBase, kind: z.literal('human') }).strict(),
  z.object({
    ...reviewerBase,
    kind: z.literal('model'),
    model: z.object({ id: z.string().min(1), version: z.string().min(1), criteria: z.string().min(1).max(2_000) }).strict(),
  }).strict(),
]);

export const feedbackRegionSchema = z.object({
  x: z.number().int().nonnegative(), y: z.number().int().nonnegative(),
  w: z.number().int().positive(), h: z.number().int().positive(),
}).strict();

export const narrativeFeedbackSchema = z.object({
  id: z.string().min(1).max(120),
  phaseId: z.string().min(1).max(120),
  frameIndex: z.number().int().nonnegative(),
  region: feedbackRegionSchema,
  problem: z.string().min(1).max(2_000),
  severity: z.enum(['blocker', 'major', 'minor', 'note']),
  evidence: z.object({
    frameRef: z.number().int().nonnegative().optional(), snapshotPath: z.string().min(1).max(500).optional(),
    framePath: z.string().min(1).max(500).optional(), cropPath: z.string().min(1).max(500).optional(),
  })
    .strict().refine((value) => value.frameRef !== undefined || value.snapshotPath !== undefined, 'Provide frameRef or snapshotPath.'),
  allowedAdjustment: z.string().min(1).max(1_000),
  status: z.enum(['open', 'fixed', 'wontfix']),
  fixedInHash: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
}).strict().superRefine((item, context) => {
  if (item.evidence.frameRef !== undefined && item.evidence.frameRef !== item.frameIndex) {
    context.addIssue({ code: 'custom', path: ['evidence', 'frameRef'], message: 'frameRef must match frameIndex.' });
  }
});

export const narrativeReviewHashesSchema = z.object({
  gifSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  pngSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  manifestSha256: z.string().regex(/^[a-f0-9]{64}$/i),
}).strict();

export const narrativeReviewRecordSchema = z.object({
  schemaVersion: z.literal(1),
  reviewer: reviewerSchema,
  reviewedAt: z.string().datetime({ offset: true }),
  hashes: narrativeReviewHashesSchema,
  generatedBy: z.string().min(1).max(160),
  criteria: reviewCriteriaSchema,
  qualityLevels: reviewLevelsSchema,
  feedback: z.array(narrativeFeedbackSchema),
  overallNote: z.string().max(4_000).optional(),
}).strict();

export const narrativeChangeLogSchema = z.object({
  fromHash: z.string().regex(/^[a-f0-9]{64}$/i),
  toHash: z.string().regex(/^[a-f0-9]{64}$/i),
  date: z.string().datetime({ offset: true }),
  feedbackIds: z.array(z.string()),
  diff: z.object({
    changedFrames: z.array(z.number().int().nonnegative()),
    changedRegions: z.array(z.object({ feedbackId: z.string(), pixelsChanged: z.number().int().nonnegative(), ratio: z.number().min(0).max(1) }).strict()),
    summary: z.string(),
  }).strict(),
  renderTimeMs: z.number().nonnegative(),
  bytes: z.object({ before: z.number().int().nonnegative(), after: z.number().int().nonnegative() }).strict(),
}).strict();

export const narrativeReviewLedgerSchema = z.object({
  schemaVersion: z.literal(1),
  records: z.array(narrativeReviewRecordSchema),
  changes: z.array(narrativeChangeLogSchema),
}).strict();

export type NarrativeReviewCriterion = (typeof NARRATIVE_REVIEW_CRITERIA)[number];
export type NarrativeReviewVerdict = z.infer<typeof reviewVerdictSchema>;
export type NarrativeReviewCriteria = z.infer<typeof reviewCriteriaSchema>;
export type NarrativeReviewLevel = (typeof NARRATIVE_REVIEW_LEVELS)[number];
export type NarrativeReviewLevels = z.infer<typeof reviewLevelsSchema>;
export type NarrativeReviewer = z.infer<typeof reviewerSchema>;
export type NarrativeFeedback = z.infer<typeof narrativeFeedbackSchema>;
export type NarrativeReviewHashes = z.infer<typeof narrativeReviewHashesSchema>;
export type NarrativeReviewRecord = z.infer<typeof narrativeReviewRecordSchema>;
export type NarrativeChangeLogEntry = z.infer<typeof narrativeChangeLogSchema>;
export type NarrativeReviewLedger = z.infer<typeof narrativeReviewLedgerSchema>;

export const REVIEW_CRITERION_LABELS: Record<NarrativeReviewCriterion, string> = {
  thumbnailIdentity: 'Identidad de miniatura',
  cardSizeReading: 'Lectura a tamaño de tarjeta',
  styleMaterial: 'Material y lenguaje del estilo',
  phaseContinuity: 'Continuidad entre fases',
  loopRestart: 'Reinicio del loop',
  artOnlyTransformationUnderstood: 'Transformación entendible sin texto',
};
