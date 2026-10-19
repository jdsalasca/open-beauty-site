import { NarrativeError, type NormalizedNarrativeBrief, type NarrativeTimelineFrame } from '../types/narrative.js';

export const NARRATIVE_TRANSITION_FPS = 12;
export const NARRATIVE_MAX_FRAMES = 360;
export const NARRATIVE_MAX_PIXEL_FRAMES = 96_000_000;
export const NARRATIVE_MAX_MEMORY_BYTES = 256 * 1024 * 1024;
const GIF_DELAY_QUANTUM_MS = 10;
const TRANSITION_DELAY_MS = 80;
const ENTRY_DELAY_MS = 80;
const MEMORY_BYTES_PER_PIXEL_FRAME = 2;
const RENDER_WORKING_BYTES_PER_PIXEL = 32;
const MEMORY_FIXED_OVERHEAD_BYTES = 16 * 1024 * 1024;
const SAMPLE_BYTES_PER_FRAME = 16_384;

export interface NarrativePhaseHold {
  phaseIndex: number;
  phaseId: string;
  requestedMs: number;
  encodedMs: number;
  frameIndex: number;
}

export interface NarrativeTimeline {
  frames: NarrativeTimelineFrame[];
  holds: NarrativePhaseHold[];
  transitionFramesPerStep: number;
  durationMs: number;
  estimatedMemoryBytes: number;
}

function readingHoldMs(brief: NormalizedNarrativeBrief, text: string): number {
  const words = text.trim().split(/\s+/u).filter(Boolean).length;
  const requested = Math.max(brief.playback.minReadableHoldMs, words * 300);
  if (!Number.isFinite(requested) || requested > 655_350) {
    throw new NarrativeError(
      'BAD_DURATION',
      `A phase needs ${Math.ceil(requested)}ms of reading time, above the GIF single-frame delay limit of 655350ms.`,
      'Shorten the phase text or lower minReadableHoldMs; the requested duration will not be clamped.',
      'playback.minReadableHoldMs',
    );
  }
  return Math.ceil(requested / GIF_DELAY_QUANTUM_MS) * GIF_DELAY_QUANTUM_MS;
}

function transitionDelays(transitionMs: number): number[] {
  // GIF delays use centiseconds. Split the requested (quantized) duration over
  // enough frames that no transition interval exceeds 80ms (12.5fps).
  const duration = Math.ceil(transitionMs / GIF_DELAY_QUANTUM_MS) * GIF_DELAY_QUANTUM_MS;
  const count = Math.max(1, Math.ceil(duration / TRANSITION_DELAY_MS));
  const base = Math.floor(duration / count / GIF_DELAY_QUANTUM_MS) * GIF_DELAY_QUANTUM_MS;
  const longerFrames = Math.round((duration - base * count) / GIF_DELAY_QUANTUM_MS);
  return Array.from({ length: count }, (_, index) => base + (index < longerFrames ? GIF_DELAY_QUANTUM_MS : 0));
}

function timelineFrame(
  kind: NarrativeTimelineFrame['kind'],
  phaseIndex: number,
  fromPhaseIndex: number,
  toPhaseIndex: number,
  progress: number,
  delayMs: number,
): NarrativeTimelineFrame {
  return { kind, phaseIndex, fromPhaseIndex, toPhaseIndex, progress, delayMs };
}

export function buildNarrativeTimeline(brief: NormalizedNarrativeBrief): NarrativeTimeline {
  const frames: NarrativeTimelineFrame[] = [];
  const holds: NarrativePhaseHold[] = [];
  const transitionFrameDelays = transitionDelays(brief.playback.transitionMs);
  for (let index = 0; index < brief.phases.length; index += 1) {
    frames.push(timelineFrame('entry', index, index, index, 0, ENTRY_DELAY_MS));
    const requestedMs = Math.max(
      brief.playback.minReadableHoldMs,
      brief.phases[index]!.text.trim().split(/\s+/u).filter(Boolean).length * 300,
    );
    const encodedMs = readingHoldMs(brief, brief.phases[index]!.text);
    holds.push({ phaseIndex: index, phaseId: brief.phases[index]!.id, requestedMs, encodedMs, frameIndex: frames.length });
    frames.push(timelineFrame('hold', index, index, index, 1, encodedMs));

    if (index < brief.phases.length - 1) {
      const next = index + 1;
      for (let step = 1; step <= transitionFrameDelays.length; step += 1) {
        frames.push(timelineFrame('transition', next, index, next, step / transitionFrameDelays.length, transitionFrameDelays[step - 1]!));
      }
    }
  }
  if (brief.playback.loop) {
    const last = brief.phases.length - 1;
    for (let step = 1; step <= transitionFrameDelays.length; step += 1) {
      frames.push(timelineFrame('loop-bridge', 0, last, 0, step / transitionFrameDelays.length, transitionFrameDelays[step - 1]!));
    }
  }

  if (frames.length > NARRATIVE_MAX_FRAMES) {
    throw new NarrativeError(
      'TOO_MANY_FRAMES',
      `The requested timeline needs ${frames.length} encoded frames; the limit is ${NARRATIVE_MAX_FRAMES}.`,
      'Reduce transitionMs or phase count. Reading holds remain encoded as delays and are not shortened.',
      'playback.transitionMs',
    );
  }
  const pixelFrames = brief.output.width * brief.output.height * frames.length;
  if (pixelFrames > NARRATIVE_MAX_PIXEL_FRAMES) {
    throw new NarrativeError(
      'RESOURCE_LIMIT',
      `The requested ${brief.output.width}×${brief.output.height} timeline uses ${pixelFrames} pixel-frames; the work limit is ${NARRATIVE_MAX_PIXEL_FRAMES}.`,
      'Choose a smaller supported preset or reduce transitionMs; phase holds will not be dropped.',
      'output',
    );
  }
  const framePixels = brief.output.width * brief.output.height;
  const estimatedMemoryBytes = pixelFrames * MEMORY_BYTES_PER_PIXEL_FRAME
    + framePixels * RENDER_WORKING_BYTES_PER_PIXEL
    + frames.length * SAMPLE_BYTES_PER_FRAME
    + MEMORY_FIXED_OVERHEAD_BYTES;
  if (estimatedMemoryBytes > NARRATIVE_MAX_MEMORY_BYTES) {
    throw new NarrativeError(
      'RESOURCE_LIMIT',
      `The requested timeline needs an estimated ${(estimatedMemoryBytes / 1_048_576).toFixed(1)}MiB working set; the memory budget is 256MiB.`,
      'Choose a smaller output preset, fewer phases or shorter transitions; the renderer will not silently reduce dimensions or drop holds.',
      'output',
    );
  }

  return {
    frames,
    holds,
    transitionFramesPerStep: transitionFrameDelays.length,
    durationMs: frames.reduce((sum, frame) => sum + frame.delayMs, 0),
    estimatedMemoryBytes,
  };
}
