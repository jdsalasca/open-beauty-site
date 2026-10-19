import type { SKRSContext2D } from '@napi-rs/canvas';
import type { NarrativeFontRole, NarrativePhase, NarrativeRenderContext } from '../../types/narrative.js';
import { drawText } from './common.js';

export type StageCComposition = 'comparison' | 'checklist';

export function compositionFor(phases: NarrativePhase[]): StageCComposition {
  const kind = phases[0]!.visual.kind.toLowerCase();
  return /checklist|process|lista|proceso/u.test(kind) ? 'checklist' : 'comparison';
}

/** A normalized 0–2 state path, with interpolation only while a transition runs. */
export function phasePosition(context: NarrativeRenderContext, ease: (progress: number) => number): number {
  const last = Math.max(1, context.brief.phases.length - 1);
  const from = (context.frame.fromPhaseIndex / last) * 2;
  const to = (context.frame.toPhaseIndex / last) * 2;
  if (context.frame.kind === 'transition' || context.frame.kind === 'loop-bridge') {
    return from + (to - from) * ease(context.frame.progress);
  }
  if (context.frame.kind === 'entry') return (context.frame.phaseIndex / last) * 2;
  return (context.phaseIndex / last) * 2;
}

export function drawRoleText(ctx: SKRSContext2D, text: string, x: number, baseline: number, role: NarrativeFontRole, size: number, color: string): void {
  drawText(ctx, text, x, baseline, role.family, role.weight, size, color);
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

export function mix(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}
