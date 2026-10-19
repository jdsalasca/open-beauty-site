import { createHash } from 'node:crypto';
import { createCanvas } from '@napi-rs/canvas';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  NARRATIVE_REVIEW_CRITERIA, NARRATIVE_REVIEW_LEVELS, narrativeFeedbackSchema,
  narrativeReviewLedgerSchema, narrativeReviewRecordSchema,
  type NarrativeFeedback, type NarrativeReviewCriteria, type NarrativeReviewHashes,
  type NarrativeReviewLedger, type NarrativeReviewLevels, type NarrativeReviewer,
  type NarrativeReviewRecord, type NarrativeReviewVerdict,
} from '../types/narrative-review.js';
import { verifyNarrativeGif } from './verify-gif.js';

type ReviewState = 'none' | 'pending' | 'approved' | 'revise' | 'stale';
type PublicationRecommendation = 'none' | 'consider-publication';
interface ReviewManifest extends Record<string, unknown> {
  brief?: { phases?: Array<{ id?: string }> };
  files?: { gif?: string; png?: string };
  hashes?: { gifSha256?: string; pngSha256?: string };
  dimensions?: { width?: number; height?: number };
  decoded?: { frameCount?: number };
  generatedBy?: string;
  evaluation?: Record<string, unknown>;
}

export interface NarrativeReviewAssessment {
  reviewState: ReviewState;
  publicationRecommendation: PublicationRecommendation;
  stale: boolean;
  record?: NarrativeReviewRecord;
}

export interface ExtractedFeedbackFrame {
  id: string;
  frameIndex: number;
  framePath: string;
  cropPath: string;
  region: NarrativeFeedback['region'];
}

const emptyCriteria = Object.fromEntries(NARRATIVE_REVIEW_CRITERIA.map((key) => [key, { verdict: 'not-evaluated' as const }])) as NarrativeReviewCriteria;
const emptyLevels = Object.fromEntries(NARRATIVE_REVIEW_LEVELS.map((key) => [key, 'not-evaluated' as const])) as NarrativeReviewLevels;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !['reviewState', 'openFeedbackCount', 'feedbackFrames', 'publicationRecommendation', 'visual-review'].includes(key))
      .sort(([a], [b]) => a.localeCompare(b, 'en'));
    const normalized = Object.fromEntries(entries.map(([key, entry]) => [key, entry]));
    return `{${Object.entries(normalized).map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function narrativeManifestReviewHash(manifest: unknown): string {
  return createHash('sha256').update(canonical(manifest)).digest('hex');
}

function assess(input: {
  reviewer: NarrativeReviewer;
  criteria: NarrativeReviewCriteria;
  qualityLevels: NarrativeReviewLevels;
  hashes: NarrativeReviewHashes;
  currentHashes: NarrativeReviewHashes;
  generatedBy: string;
  recordsExist?: boolean;
  record?: NarrativeReviewRecord;
}): NarrativeReviewAssessment {
  const stale = input.hashes.gifSha256 !== input.currentHashes.gifSha256
    || input.hashes.pngSha256 !== input.currentHashes.pngSha256
    || input.hashes.manifestSha256 !== input.currentHashes.manifestSha256;
  if (stale) return { reviewState: input.recordsExist ? 'stale' : 'none', publicationRecommendation: 'none', stale: true, ...(input.record ? { record: input.record } : {}) };
  const verdicts = Object.values(input.criteria).map((criterion) => criterion.verdict);
  const hasRevision = verdicts.includes('revise');
  const allCriteriaPass = verdicts.length === NARRATIVE_REVIEW_CRITERIA.length && verdicts.every((value) => value === 'pass');
  const independent = input.reviewer.id !== input.generatedBy;
  const reviewState: ReviewState = hasRevision ? 'revise' : allCriteriaPass && independent ? 'approved' : input.recordsExist ? 'pending' : 'none';
  const publicationRecommendation: PublicationRecommendation = input.reviewer.kind === 'human'
    && independent && allCriteriaPass && Object.values(input.qualityLevels).every((value) => value === 'pass')
    ? 'consider-publication'
    : 'none';
  return { reviewState, publicationRecommendation, stale: false, ...(input.record ? { record: input.record } : {}) };
}

/** Pure state check used by tests and review tooling; technical controls never enter this decision. */
export function assessNarrativeReview(input: {
  reviewer: NarrativeReviewer;
  criteria: NarrativeReviewCriteria;
  qualityLevels: NarrativeReviewLevels;
  hashes: NarrativeReviewHashes;
  currentHashes?: NarrativeReviewHashes;
  generatedBy: string;
  recordsExist?: boolean;
  record?: NarrativeReviewRecord;
}): NarrativeReviewAssessment {
  return assess({ ...input, recordsExist: input.recordsExist ?? true, currentHashes: input.currentHashes ?? input.hashes });
}

function resolveManifestPath(packOrManifest: string): string {
  const input = path.resolve(packOrManifest);
  if (input.endsWith('.manifest.json')) return input;
  if (input.endsWith('.gif') || input.endsWith('.png')) return input.replace(/\.(gif|png)$/i, '.manifest.json');
  return `${input}.manifest.json`;
}

function resolveAsset(manifestPath: string, value: unknown, extension: string): string {
  if (typeof value === 'string' && value.length) return path.isAbsolute(value) ? value : path.resolve(path.dirname(manifestPath), value);
  const base = path.basename(manifestPath).replace(/\.manifest\.json$/i, '');
  return path.join(path.dirname(manifestPath), `${base}.${extension}`);
}

function ledgerPath(manifestPath: string): string {
  return manifestPath.replace(/\.manifest\.json$/i, '.review.json');
}

function framesDirectory(manifestPath: string): string {
  return manifestPath.replace(/\.manifest\.json$/i, '.frames');
}

async function hashesFor(manifestPath: string, manifest: ReviewManifest): Promise<NarrativeReviewHashes> {
  const gif = resolveAsset(manifestPath, manifest.files?.gif, 'gif');
  const png = resolveAsset(manifestPath, manifest.files?.png, 'png');
  const [gifBytes, pngBytes] = await Promise.all([readFile(gif), readFile(png)]);
  return {
    gifSha256: createHash('sha256').update(gifBytes).digest('hex'),
    pngSha256: createHash('sha256').update(pngBytes).digest('hex'),
    manifestSha256: narrativeManifestReviewHash(manifest),
  };
}

async function readManifest(manifestPath: string): Promise<ReviewManifest> {
  return JSON.parse(await readFile(manifestPath, 'utf8')) as ReviewManifest;
}

async function readLedger(file: string): Promise<NarrativeReviewLedger> {
  try {
    return narrativeReviewLedgerSchema.parse(JSON.parse(await readFile(file, 'utf8')));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { schemaVersion: 1, records: [], changes: [] };
    throw new Error(`Invalid narrative review ledger ${file}: ${(error as Error).message}`);
  }
}

function latestAssessment(manifest: ReviewManifest, hashes: NarrativeReviewHashes, ledger: NarrativeReviewLedger): NarrativeReviewAssessment {
  const record = ledger.records.at(-1);
  if (!record) return { reviewState: 'none', publicationRecommendation: 'none', stale: false };
  return assess({
    reviewer: record.reviewer,
    criteria: record.criteria,
    qualityLevels: record.qualityLevels,
    hashes: record.hashes,
    currentHashes: hashes,
    generatedBy: manifest.generatedBy ?? 'open-beauty-site',
    recordsExist: true,
    record,
  });
}

function feedbackFrameLinks(ledger: NarrativeReviewLedger, manifestPath: string): Array<Record<string, unknown>> {
  const feedback = ledger.records.at(-1)?.feedback ?? [];
  return feedback.filter((item) => item.status === 'open' && item.evidence.framePath && item.evidence.cropPath).map((item) => ({
    id: item.id, phaseId: item.phaseId, frameIndex: item.frameIndex, problem: item.problem, severity: item.severity,
    framePath: item.evidence.framePath, cropPath: item.evidence.cropPath,
  }));
}

async function writeDerivedManifestState(manifestPath: string, manifest: ReviewManifest, assessment: NarrativeReviewAssessment, ledger: NarrativeReviewLedger): Promise<void> {
  const openFeedback = feedbackFrameLinks(ledger, manifestPath);
  manifest.reviewState = assessment.reviewState;
  manifest.openFeedbackCount = openFeedback.length;
  manifest.feedbackFrames = openFeedback;
  manifest.publicationRecommendation = assessment.publicationRecommendation;
  const evaluation = (manifest.evaluation && typeof manifest.evaluation === 'object' ? manifest.evaluation : {}) as Record<string, unknown>;
  evaluation['visual-review'] = {
    status: assessment.reviewState === 'approved' ? 'approved' : assessment.reviewState === 'revise' ? 'revise' : assessment.reviewState === 'stale' ? 'stale' : 'pending',
    reviewer: assessment.record?.reviewer ?? null,
    criteria: assessment.record?.criteria ?? emptyCriteria,
    feedback: openFeedback,
    evidence: openFeedback.map((entry) => entry.framePath),
  };
  manifest.evaluation = evaluation;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

export async function getNarrativeReviewState(packOrManifest: string): Promise<NarrativeReviewAssessment> {
  const manifestPath = resolveManifestPath(packOrManifest);
  const manifest = await readManifest(manifestPath);
  const hashes = await hashesFor(manifestPath, manifest);
  const ledger = await readLedger(ledgerPath(manifestPath));
  return latestAssessment(manifest, hashes, ledger);
}

function normalizeCriteria(input?: Partial<Record<keyof NarrativeReviewCriteria, NarrativeReviewVerdict | { verdict: NarrativeReviewVerdict; note?: string }>>): NarrativeReviewCriteria {
  return Object.fromEntries(NARRATIVE_REVIEW_CRITERIA.map((key) => {
    const value = input?.[key];
    return [key, typeof value === 'string' ? { verdict: value } : value ?? emptyCriteria[key]];
  })) as NarrativeReviewCriteria;
}

export async function reviewNarrativeArtifact(input: {
  manifestPath: string;
  reviewer: NarrativeReviewer;
  criteria?: Partial<Record<keyof NarrativeReviewCriteria, NarrativeReviewVerdict | { verdict: NarrativeReviewVerdict; note?: string }>>;
  qualityLevels?: Partial<NarrativeReviewLevels>;
  feedback?: NarrativeFeedback[];
  overallNote?: string;
  extractFrames?: boolean;
  reviewedAt?: string;
}): Promise<{ reviewPath: string; assessment: NarrativeReviewAssessment; record: NarrativeReviewRecord }> {
  const manifestPath = resolveManifestPath(input.manifestPath);
  const manifest = await readManifest(manifestPath);
  const hashes = await hashesFor(manifestPath, manifest);
  const criteria = normalizeCriteria(input.criteria);
  const qualityLevels = { ...emptyLevels, ...input.qualityLevels };
  const feedback = (input.feedback ?? []).map((item) => narrativeFeedbackSchema.parse(item));
  const frameCount = manifest.decoded?.frameCount ?? 0;
  const phaseIds = new Set((manifest.brief?.phases ?? []).map((phase) => phase.id).filter((id): id is string => Boolean(id)));
  const width = manifest.dimensions?.width ?? 0;
  const height = manifest.dimensions?.height ?? 0;
  for (const item of feedback) {
    if (!phaseIds.has(item.phaseId)) throw new Error(`Feedback ${item.id} references unknown phase ${item.phaseId}.`);
    if (item.frameIndex >= frameCount) throw new Error(`Feedback ${item.id} references frame ${item.frameIndex}, but this GIF has ${frameCount} frames.`);
    if (item.region.x + item.region.w > width || item.region.y + item.region.h > height) throw new Error(`Feedback ${item.id} region exceeds the native ${width}×${height} frame.`);
  }
  let finalFeedback = feedback;
  if (input.extractFrames && feedback.length) {
    const extracted = await extractFeedbackFrames(manifestPath, feedback);
    const byId = new Map(extracted.map((frame) => [frame.id, frame]));
    finalFeedback = feedback.map((item) => {
      const frame = byId.get(item.id)!;
      return { ...item, evidence: { ...item.evidence, frameRef: item.frameIndex, framePath: path.relative(path.dirname(manifestPath), frame.framePath).split(path.sep).join('/'), cropPath: path.relative(path.dirname(manifestPath), frame.cropPath).split(path.sep).join('/') } };
    });
  }
  const ledgerFile = ledgerPath(manifestPath);
  const ledger = await readLedger(ledgerFile);
  const record = narrativeReviewRecordSchema.parse({
    schemaVersion: 1,
    reviewer: input.reviewer,
    reviewedAt: input.reviewedAt ?? new Date().toISOString(),
    hashes,
    generatedBy: manifest.generatedBy ?? 'open-beauty-site',
    criteria,
    qualityLevels,
    feedback: finalFeedback,
    ...(input.overallNote ? { overallNote: input.overallNote } : {}),
  });
  ledger.records.push(record);
  await writeFile(ledgerFile, `${JSON.stringify(narrativeReviewLedgerSchema.parse(ledger), null, 2)}\n`, 'utf8');
  const assessment = assess({ reviewer: record.reviewer, criteria: record.criteria, qualityLevels: record.qualityLevels, hashes, currentHashes: hashes, generatedBy: record.generatedBy, recordsExist: true, record });
  await writeDerivedManifestState(manifestPath, manifest, assessment, ledger);
  return { reviewPath: ledgerFile, assessment, record };
}

function rgbPng(rgb: Uint8Array, width: number, height: number): Buffer {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  const image = context.createImageData(width, height);
  for (let source = 0, target = 0; source < rgb.length; source += 3, target += 4) {
    image.data[target] = rgb[source]!;
    image.data[target + 1] = rgb[source + 1]!;
    image.data[target + 2] = rgb[source + 2]!;
    image.data[target + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  return canvas.toBuffer('image/png');
}

function cropRgb(rgb: Uint8Array, width: number, height: number, region: NarrativeFeedback['region']): { rgb: Uint8Array; width: number; height: number } {
  const x = Math.max(0, Math.min(width, region.x));
  const y = Math.max(0, Math.min(height, region.y));
  const w = Math.max(1, Math.min(region.w, width - x));
  const h = Math.max(1, Math.min(region.h, height - y));
  const result = new Uint8Array(w * h * 3);
  for (let row = 0; row < h; row += 1) {
    const source = ((y + row) * width + x) * 3;
    result.set(rgb.subarray(source, source + w * 3), row * w * 3);
  }
  return { rgb: result, width: w, height: h };
}

/** Extract full composited frames and native-pixel crops using the independent GIF decoder. */
export async function extractFeedbackFrames(packOrManifest: string, feedback: NarrativeFeedback[]): Promise<ExtractedFeedbackFrame[]> {
  const manifestPath = resolveManifestPath(packOrManifest);
  const manifest = await readManifest(manifestPath);
  const gifPath = resolveAsset(manifestPath, manifest.files?.gif, 'gif');
  const frameIndices = [...new Set(feedback.map((item) => item.frameIndex))];
  const decoded = verifyNarrativeGif(await readFile(gifPath), frameIndices, { retainSamples: true });
  if (!decoded.integrity.valid) throw new Error(`Cannot extract review frames from invalid GIF: ${decoded.integrity.errors.join('; ')}`);
  const sampled = new Map(decoded.sampledFrames.map((frame) => [frame.index, frame.rgb]));
  const directory = framesDirectory(manifestPath);
  await mkdir(directory, { recursive: true });
  const fullWritten = new Set<number>();
  const results: ExtractedFeedbackFrame[] = [];
  for (const item of feedback) {
    const rgb = sampled.get(item.frameIndex);
    if (!rgb) throw new Error(`Frame ${item.frameIndex} was not returned by the independent GIF decoder.`);
    const framePath = path.join(directory, `frame-${String(item.frameIndex).padStart(4, '0')}.png`);
    const cropPath = path.join(directory, `feedback-${item.id}-crop.png`);
    if (!fullWritten.has(item.frameIndex)) {
      await writeFile(framePath, rgbPng(rgb, decoded.width, decoded.height));
      fullWritten.add(item.frameIndex);
    }
    const crop = cropRgb(rgb, decoded.width, decoded.height, item.region);
    await writeFile(cropPath, rgbPng(crop.rgb, crop.width, crop.height));
    results.push({ id: item.id, frameIndex: item.frameIndex, framePath, cropPath, region: item.region });
  }
  return results;
}

/** Recompute derived manifest review metadata after a render overwrites its artefacts. */
export async function refreshNarrativeReviewMetadata(manifestPath: string): Promise<NarrativeReviewAssessment> {
  const resolved = resolveManifestPath(manifestPath);
  const manifest = await readManifest(resolved);
  const hashes = await hashesFor(resolved, manifest);
  const ledger = await readLedger(ledgerPath(resolved));
  const assessment = latestAssessment(manifest, hashes, ledger);
  await writeDerivedManifestState(resolved, manifest, assessment, ledger);
  return assessment;
}

export function reviewDefaults(): { criteria: NarrativeReviewCriteria; qualityLevels: NarrativeReviewLevels } {
  return { criteria: structuredClone(emptyCriteria), qualityLevels: structuredClone(emptyLevels) };
}
