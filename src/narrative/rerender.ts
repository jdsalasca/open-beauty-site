import { createHash } from 'node:crypto';
import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { NarrativeBriefInput } from '../types/narrative.js';
import { narrativeReviewLedgerSchema, type NarrativeFeedback } from '../types/narrative-review.js';
import { createNarrative } from './create.js';
import { refreshNarrativeReviewMetadata } from './review.js';
import { verifyNarrativeGif } from './verify-gif.js';

interface RerenderManifest {
  brief: NarrativeBriefInput;
  artOnly?: boolean;
  files?: { gif?: string };
  decoded?: { frameCount?: number };
}

export interface FeedbackRegionDiff {
  pixelsChanged: number;
  ratio: number;
}

export function measureFeedbackRegionDiff(
  beforeRgb: Uint8Array,
  afterRgb: Uint8Array,
  width: number,
  height: number,
  region: NarrativeFeedback['region'],
): FeedbackRegionDiff {
  if (beforeRgb.length !== width * height * 3 || afterRgb.length !== beforeRgb.length) return { pixelsChanged: 0, ratio: 0 };
  const x0 = Math.max(0, Math.floor(region.x));
  const y0 = Math.max(0, Math.floor(region.y));
  const x1 = Math.min(width, Math.ceil(region.x + region.w));
  const y1 = Math.min(height, Math.ceil(region.y + region.h));
  let pixelsChanged = 0;
  let total = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const offset = (y * width + x) * 3;
      const delta = Math.abs(beforeRgb[offset]! - afterRgb[offset]!)
        + Math.abs(beforeRgb[offset + 1]! - afterRgb[offset + 1]!)
        + Math.abs(beforeRgb[offset + 2]! - afterRgb[offset + 2]!);
      if (delta > 24) pixelsChanged += 1;
      total += 1;
    }
  }
  return { pixelsChanged, ratio: total ? pixelsChanged / total : 0 };
}

export function applyMeasuredFeedbackChanges(
  feedback: NarrativeFeedback[],
  diffs: Map<string, FeedbackRegionDiff>,
  fixedInHash: string,
): NarrativeFeedback[] {
  return feedback.map((item) => {
    const diff = diffs.get(item.id);
    if (item.status !== 'open' || !diff || diff.ratio < 0.001) return item;
    return { ...item, status: 'fixed', fixedInHash };
  });
}

function manifestPathFor(pack: string): string {
  const resolved = path.resolve(pack);
  if (resolved.endsWith('.manifest.json')) return resolved;
  return resolved.replace(/\.(gif|png)$/i, '.manifest.json') + (resolved.endsWith('.gif') || resolved.endsWith('.png') ? '' : '.manifest.json');
}

function assetPath(manifestPath: string, value: string | undefined, extension: string): string {
  if (value) return path.isAbsolute(value) ? value : path.resolve(path.dirname(manifestPath), value);
  return manifestPath.replace(/\.manifest\.json$/i, `.${extension}`);
}

function reviewPathFor(manifestPath: string): string {
  return manifestPath.replace(/\.manifest\.json$/i, '.review.json');
}

async function sha256(data: Uint8Array): Promise<string> {
  return createHash('sha256').update(data).digest('hex');
}

function countChangedFrames(before: ReturnType<typeof verifyNarrativeGif>, after: ReturnType<typeof verifyNarrativeGif>): number[] {
  const beforeFrames = new Map(before.sampledFrames.map((frame) => [frame.index, frame.rgb]));
  const afterFrames = new Map(after.sampledFrames.map((frame) => [frame.index, frame.rgb]));
  const changed: number[] = [];
  for (const [index, a] of beforeFrames) {
    const b = afterFrames.get(index);
    if (!b || a.length !== b.length) { changed.push(index); continue; }
    let different = false;
    for (let offset = 0; offset < a.length; offset += 3) {
      if (Math.abs(a[offset]! - b[offset]!) + Math.abs(a[offset + 1]! - b[offset + 1]!) + Math.abs(a[offset + 2]! - b[offset + 2]!) > 24) {
        different = true;
        break;
      }
    }
    if (different) changed.push(index);
  }
  return changed;
}

export async function rerenderNarrativePack(pack: string, options: { applyFeedback?: boolean } = {}): Promise<{
  manifestPath: string;
  fromHash: string;
  toHash: string;
  changedFrames: number[];
  changedRegions: Array<{ feedbackId: string; pixelsChanged: number; ratio: number }>;
  feedbackFixed: string[];
  renderTimeMs: number;
  bytes: { before: number; after: number };
  reviewState: string;
}> {
  const manifestPath = manifestPathFor(pack);
  const previousManifest = JSON.parse(await readFile(manifestPath, 'utf8')) as RerenderManifest;
  const gifPath = assetPath(manifestPath, previousManifest.files?.gif, 'gif');
  const beforeBytes = await readFile(gifPath);
  const beforeStat = await stat(gifPath);
  const priorDecoded = verifyNarrativeGif(beforeBytes, Array.from({ length: previousManifest.decoded?.frameCount ?? 0 }, (_, index) => index), { retainSamples: true });
  if (!priorDecoded.integrity.valid) throw new Error(`Cannot rerender from an invalid GIF: ${priorDecoded.integrity.errors.join('; ')}`);

  const ledgerFile = reviewPathFor(manifestPath);
  let ledger: ReturnType<typeof narrativeReviewLedgerSchema.parse> = { schemaVersion: 1, records: [], changes: [] };
  try { ledger = narrativeReviewLedgerSchema.parse(JSON.parse(await readFile(ledgerFile, 'utf8'))); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error(`Invalid review ledger ${ledgerFile}: ${(error as Error).message}`);
  }
  const latest = ledger.records.at(-1);
  const openFeedback = latest?.feedback.filter((item) => item.status === 'open') ?? [];
  const start = performance.now();
  const rendered = await createNarrative(previousManifest.brief, { outputDir: path.dirname(manifestPath), artOnly: previousManifest.artOnly ?? false });
  const renderTimeMs = Math.round(performance.now() - start);
  const afterBytes = await readFile(rendered.paths.gif);
  const afterDecoded = verifyNarrativeGif(afterBytes, Array.from({ length: rendered.frames }, (_, index) => index), { retainSamples: true });
  if (!afterDecoded.integrity.valid) throw new Error(`Rerender produced an invalid GIF: ${afterDecoded.integrity.errors.join('; ')}`);
  const changedFrames = countChangedFrames(priorDecoded, afterDecoded);
  const oldFrames = new Map(priorDecoded.sampledFrames.map((frame) => [frame.index, frame.rgb]));
  const newFrames = new Map(afterDecoded.sampledFrames.map((frame) => [frame.index, frame.rgb]));
  const regionMeasurements = openFeedback.map((item) => {
    const before = oldFrames.get(item.frameIndex);
    const after = newFrames.get(item.frameIndex);
    const diff = before && after ? measureFeedbackRegionDiff(before, after, afterDecoded.width, afterDecoded.height, item.region) : { pixelsChanged: 0, ratio: 0 };
    return { feedbackId: item.id, pixelsChanged: diff.pixelsChanged, ratio: diff.ratio };
  });
  const toHash = await sha256(afterBytes);
  const fromHash = await sha256(beforeBytes);
  const diffById = new Map(regionMeasurements.map((item) => [item.feedbackId, { pixelsChanged: item.pixelsChanged, ratio: item.ratio }]));
  const fixed = options.applyFeedback ? applyMeasuredFeedbackChanges(openFeedback, diffById, toHash) : openFeedback;
  const feedbackFixed = fixed.filter((item) => item.status === 'fixed').map((item) => item.id);
  if (latest && options.applyFeedback) latest.feedback = latest.feedback.map((item) => fixed.find((candidate) => candidate.id === item.id) ?? item);
  ledger.changes.push({
    fromHash,
    toHash,
    date: new Date().toISOString(),
    feedbackIds: feedbackFixed,
    diff: {
      changedFrames,
      changedRegions: regionMeasurements,
      summary: `${changedFrames.length} decoded frame(s) changed; ${regionMeasurements.filter((item) => item.pixelsChanged > 0).length}/${regionMeasurements.length} feedback region(s) changed above decoder threshold.`,
    },
    renderTimeMs,
    bytes: { before: beforeStat.size, after: afterBytes.length },
  });
  await writeFile(ledgerFile, `${JSON.stringify(narrativeReviewLedgerSchema.parse(ledger), null, 2)}\n`, 'utf8');
  const currentReview = await refreshNarrativeReviewMetadata(rendered.paths.manifest);
  return {
    manifestPath: rendered.paths.manifest,
    fromHash,
    toHash,
    changedFrames,
    changedRegions: regionMeasurements,
    feedbackFixed,
    renderTimeMs,
    bytes: { before: beforeStat.size, after: afterBytes.length },
    reviewState: currentReview.reviewState,
  };
}
