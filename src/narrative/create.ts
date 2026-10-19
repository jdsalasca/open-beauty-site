import path from 'node:path';
import { NarrativeError, type NarrativeBriefInput, type NarrativeEvaluation, type NarrativeScene } from '../types/narrative.js';
import { evaluateNarrative, pendingNarrativeEvaluation } from './evaluate.js';
import { encodeNarrative } from './encode.js';
import { layoutNarrative } from './layout.js';
import { createNarrativeManifest } from './manifest.js';
import { normalizeNarrativeBrief } from './brief.js';
import { resolveNarrativeScene } from './scene.js';
import { buildNarrativeTimeline } from './timeline.js';
import { refreshNarrativeReviewMetadata } from './review.js';

export interface CreateNarrativeOptions {
  outputDir?: string;
  artOnly?: boolean;
  /** Injection seam for isolated renderer tests; production styles use the registry. */
  scene?: NarrativeScene;
}

export interface NarrativeGenerationResult {
  ok: true;
  brief: ReturnType<typeof normalizeNarrativeBrief>['brief'];
  briefHash: string;
  paths: { gif: string; png: string; contactSheet: string; manifest: string };
  frames: number;
  durationMs: number;
  diagnostics: Array<{ code: string; message: string; suggestion?: string; phaseIndex?: number; value?: string; style?: string; validAlternatives?: string[] }>;
  evaluation: NarrativeEvaluation;
}

export async function createNarrative(input: NarrativeBriefInput | unknown, options: CreateNarrativeOptions = {}): Promise<NarrativeGenerationResult> {
  const { brief, hash, outputHash } = normalizeNarrativeBrief(input);
  const scene = resolveNarrativeScene(brief.style, options.scene);
  if (!scene.supportsAspect(brief.output.width / brief.output.height)) {
    throw new NarrativeError(
      'UNSUPPORTED_ASPECT',
      `Scene ${brief.style} does not support ${brief.output.width}×${brief.output.height} (${(brief.output.width / brief.output.height).toFixed(3)}).`,
      'Choose an aspect ratio explicitly supported by this scene.',
      'output',
    );
  }
  const layout = layoutNarrative(brief);
  const timeline = buildNarrativeTimeline(brief);
  const outputDir = path.resolve(process.cwd(), options.outputDir ?? path.join('beauty-output', 'narrative', `${brief.style}-${outputHash.slice(0, 8)}`));
  const encoded = await encodeNarrative(brief, outputHash, layout, timeline, scene, outputDir, options.artOnly ?? false);
  const evaluation = evaluateNarrative({ brief, layout, encoded, fontChecksPassed: true });
  const controls = [
    ...evaluation['technical-integrity'].controls,
    ...evaluation['style-conformance'].controls,
    ...evaluation['rendered-legibility'].controls,
    ...evaluation.narrative.controls,
  ];
  const { path: manifestPath } = await createNarrativeManifest({ brief, briefHash: hash, encoded, timeline, controls, evaluation, outputDir });
  await refreshNarrativeReviewMetadata(manifestPath);
  encoded.decoded.sampledFrames.length = 0;
  const diagnostics = [
    ...timeline.warnings.map((warning) => ({ code: warning.code, message: warning.message })),
    ...layout.warnings.map((message) => ({ code: 'LAYOUT_WARNING', message })),
    ...(evaluation['style-conformance'].status === 'pending' ? [{ code: 'STYLE_REVIEW_PENDING', message: 'Source and pixel controls do not replace human review of the rendered style.' }] : []),
    ...(evaluation['rendered-legibility'].status === 'pending' ? [{ code: 'LEGIBILITY_REVIEW_PENDING', message: 'OCR and human reading at 640×360 have not been evaluated.' }] : []),
    ...(evaluation.narrative.status === 'pending' ? [{ code: 'NARRATIVE_REVIEW_PENDING', message: 'Automated checks cannot decide whether the visual change proves a causal story.' }] : []),
    ...controls.filter((control) => !control.passed && control.severity === 'warning').map((control) => ({ code: 'COMPOSITION_REVISE', message: `${control.name}: ${control.detail}` })),
    ...controls.filter((control) => !control.passed && control.severity !== 'warning').map((control) => ({ code: 'CONTROL_FAILED', message: `${control.name}: ${control.detail}` })),
    { code: 'PUBLICATION_REVIEW_REQUIRED', message: 'No automatic recommendation to publish is made.' },
  ];
  return {
    ok: true,
    brief,
    briefHash: hash,
    paths: { ...encoded.paths, manifest: manifestPath },
    frames: encoded.decoded.frames.length,
    durationMs: encoded.decoded.durationMs,
    diagnostics,
    evaluation,
  };
}

export function narrativeFailure(error: unknown): {
  ok: false;
  diagnostics: Array<{ code: string; message: string; suggestion?: string; phaseIndex?: number; value?: string; style?: string; validAlternatives?: string[] }>;
  evaluation: NarrativeEvaluation;
} {
  const narrativeError = error instanceof NarrativeError
    ? error
    : new NarrativeError('INVALID_STATE', error instanceof Error ? error.message : String(error), 'Correct the brief and retry.');
  return {
    ok: false,
    diagnostics: [{
      code: narrativeError.code,
      message: narrativeError.message,
      suggestion: narrativeError.suggestion,
      ...narrativeError.details,
    }],
    evaluation: pendingNarrativeEvaluation(narrativeError.message, narrativeError.code === 'STYLE_NOT_SUPPORTED_YET'),
  };
}
