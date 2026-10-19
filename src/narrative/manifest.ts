import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { NarrativeControlResult, NarrativeEvaluation, NormalizedNarrativeBrief } from '../types/narrative.js';
import type { NarrativeEncodedFiles } from './encode.js';
import type { NarrativeTimeline } from './timeline.js';

export const NARRATIVE_FONT_BUNDLE_VERSION = 'repo-bundled-ofl-1';

export interface NarrativeManifest {
  schemaVersion: 2;
  commit: string | null;
  brief: NormalizedNarrativeBrief;
  briefSha256: string;
  style: string;
  subfamily: string | null;
  workflowStatus: NormalizedNarrativeBrief['workflowStatus'];
  outcome: NormalizedNarrativeBrief['outcome'];
  evidenceClassification: 'illustrative' | 'measured' | 'expected';
  illustrative: boolean;
  seed: number;
  renderer: { narrative: string; canvas: string; gif: string; scene: string };
  fonts: { bundleVersion: string; roles: NarrativeEncodedFiles['fonts']['effective'] };
  dimensions: { width: number; height: number };
  formats: string[];
  decoded: { width: number; height: number; frameCount: number; delaysMs: number[]; durationMs: number; loopCount: number; integrity: boolean };
  ffprobe: NarrativeEncodedFiles['ffprobe'];
  bytes: NarrativeEncodedFiles['bytes'];
  hashes: { briefSha256: string; gifSha256: string; pngSha256: string; contactSheetSha256: string };
  files: NarrativeEncodedFiles['paths'];
  controls: NarrativeControlResult[];
  evaluation: NarrativeEvaluation;
  phaseCaptures: Array<{ phaseId: string; labels: string[]; contactSheet: string }>;
  palette: NarrativeEncodedFiles['palette'];
  phaseHoldsVerified: NarrativeEncodedFiles['phaseHoldsVerified'];
  timing: {
    preset: NormalizedNarrativeBrief['playback']['preset'];
    holdsRequestedMs: number;
    holdsDecodedMs: number;
    transitionsMs: number;
    loopBridgeMs: number;
    entryMs: number;
    totalDecodedMs: number;
    totalDurationBudgetMs: number;
    phaseHolds: Array<{ phaseId: string; requestedMs: number; encodedMs: number; decodedMs: number }>;
    warnings: NarrativeTimeline['warnings'];
  };
  resourceEstimate: NarrativeEncodedFiles['resourceEstimate'];
  deterministicScope: string;
}

function currentCommit(): string | null {
  try {
    const value = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return /^[0-9a-f]{40}$/i.test(value) ? value : null;
  } catch {
    return null;
  }
}

async function sha256File(file: string): Promise<string> {
  const { readFile } = await import('node:fs/promises');
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

export async function createNarrativeManifest(input: {
  brief: NormalizedNarrativeBrief;
  briefHash: string;
  encoded: NarrativeEncodedFiles;
  timeline: NarrativeTimeline;
  controls: NarrativeControlResult[];
  evaluation: NarrativeEvaluation;
  outputDir: string;
}): Promise<{ manifest: NarrativeManifest; path: string }> {
  const { brief, briefHash, encoded, timeline, controls, evaluation, outputDir } = input;
  const phaseCaptures = brief.phases.map((phase, index) => ({
    phaseId: phase.id,
    labels: [
      ...encoded.captureLabels.filter((label) => label.startsWith(`${phase.id} ·`)),
      ...(index === 0 && encoded.captureLabels.includes('reinicio del loop') ? ['reinicio del loop'] : []),
    ],
    contactSheet: encoded.paths.contactSheet,
  }));
  const manifest: NarrativeManifest = {
    schemaVersion: 2,
    commit: currentCommit(),
    brief,
    briefSha256: briefHash,
    style: brief.style,
    subfamily: brief.subfamily ?? null,
    workflowStatus: brief.workflowStatus,
    outcome: brief.outcome,
    evidenceClassification: brief.illustrative ? 'illustrative' : brief.outcome.mode === 'observed' ? 'measured' : 'expected',
    illustrative: brief.illustrative,
    seed: brief.seed,
    renderer: { narrative: encoded.rendererVersion, canvas: '@napi-rs/canvas@1.0.11', gif: 'gifenc@1.0.3', scene: encoded.sceneVersion },
    fonts: { bundleVersion: NARRATIVE_FONT_BUNDLE_VERSION, roles: encoded.fonts.effective },
    dimensions: { width: brief.output.width, height: brief.output.height },
    formats: [...brief.output.formats],
    decoded: {
      width: encoded.decoded.width,
      height: encoded.decoded.height,
      frameCount: encoded.decoded.frames.length,
      delaysMs: encoded.decoded.delaysMs,
      durationMs: encoded.decoded.durationMs,
      loopCount: encoded.decoded.loopCount ?? -1,
      integrity: encoded.decoded.integrity.valid,
    },
    ffprobe: encoded.ffprobe,
    bytes: encoded.bytes,
    hashes: {
      briefSha256: briefHash,
      gifSha256: encoded.finalSha256,
      pngSha256: await sha256File(encoded.paths.png),
      contactSheetSha256: await sha256File(encoded.paths.contactSheet),
    },
    files: encoded.paths,
    controls,
    evaluation,
    phaseCaptures,
    palette: encoded.palette,
    phaseHoldsVerified: encoded.phaseHoldsVerified,
    timing: {
      preset: brief.playback.preset,
      holdsRequestedMs: timeline.durationBreakdown.holdsRequestedMs,
      holdsDecodedMs: timeline.holds.reduce((sum, hold) => sum + (encoded.decoded.delaysMs[hold.frameIndex] ?? 0), 0),
      transitionsMs: timeline.frames.reduce((sum, frame, index) => sum + (frame.kind === 'transition' ? encoded.decoded.delaysMs[index] ?? 0 : 0), 0),
      loopBridgeMs: timeline.frames.reduce((sum, frame, index) => sum + (frame.kind === 'loop-bridge' ? encoded.decoded.delaysMs[index] ?? 0 : 0), 0),
      entryMs: timeline.frames.reduce((sum, frame, index) => sum + (frame.kind === 'entry' ? encoded.decoded.delaysMs[index] ?? 0 : 0), 0),
      totalDecodedMs: encoded.decoded.durationMs,
      totalDurationBudgetMs: brief.playback.totalDurationBudgetMs,
      phaseHolds: timeline.holds.map((hold) => ({
        phaseId: hold.phaseId,
        requestedMs: hold.requestedMs,
        encodedMs: hold.encodedMs,
        decodedMs: encoded.decoded.delaysMs[hold.frameIndex] ?? 0,
      })),
      warnings: timeline.warnings,
    },
    resourceEstimate: encoded.resourceEstimate,
    deterministicScope: 'Byte-for-byte determinism is verified on the same OS and architecture, Node runtime, pnpm-lock.yaml dependency graph and @napi-rs/canvas/gifenc versions; cross-platform byte equality is not claimed.',
  };
  const manifestPath = path.join(outputDir, `${path.basename(encoded.paths.gif, '.gif')}.manifest.json`);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return { manifest, path: manifestPath };
}
