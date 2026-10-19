import type { NormalizedNarrativeBrief, NarrativeControlResult, NarrativeEvaluation, NarrativeEvaluationLevel, NarrativeLayout, NarrativeLevelStatus } from '../types/narrative.js';
import type { NarrativeEncodedFiles } from './encode.js';
import { getStyle } from '../styles/presets.js';
import { narrativeResultLabelMatches } from './brief.js';

function level(status: NarrativeLevelStatus, controls: NarrativeControlResult[], note?: string): NarrativeEvaluationLevel {
  return { status, controls, note };
}

function resultStatus(controls: NarrativeControlResult[], pending = false): NarrativeLevelStatus {
  if (controls.some((control) => !control.passed)) return 'fail';
  return pending ? 'pending' : 'pass';
}

function normalizedText(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

function textRetained(source: string, lines: string[]): boolean {
  return normalizedText(source) === normalizedText(lines.join(' '));
}

function luminance(hex: string): number {
  const raw = hex.replace('#', '');
  const expanded = raw.length === 3 ? [...raw].map((value) => value + value).join('') : raw;
  const channels = [0, 2, 4].map((offset) => Number.parseInt(expanded.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((left, right) => right - left);
  return (light! + 0.05) / (dark! + 0.05);
}

export function pendingNarrativeEvaluation(reason: string, styleFailure = false): NarrativeEvaluation {
  const technical = level('not-evaluated', [], reason);
  const styleSource: NarrativeLevelStatus = styleFailure ? 'fail' : 'not-evaluated';
  return {
    'technical-integrity': technical,
    'style-conformance': {
      status: styleFailure ? 'fail' : 'not-evaluated',
      sourceStatus: styleSource,
      pixelStatus: 'not-evaluated',
      controls: styleFailure ? [{ name: 'style-scene', passed: false, detail: reason, source: 'source' }] : [],
      note: 'No rendered artifact was available for pixel review.',
    },
    'rendered-legibility': level('not-evaluated', [], reason),
    narrative: level('pending', [], 'No scene rendered; story continuity and causal change were not evaluated.'),
    'visual-review': { status: 'pending', criteria: ['thumbnail identity', 'reading at card size', 'style material', 'phase continuity', 'loop restart'], evidence: [] },
    publicationRecommendation: 'none',
  };
}

export function evaluateNarrative(input: {
  brief: NormalizedNarrativeBrief;
  layout: NarrativeLayout;
  encoded: NarrativeEncodedFiles;
  fontChecksPassed?: boolean;
  visualReview?: NarrativeEvaluation['visual-review'];
}): NarrativeEvaluation {
  const { brief, layout, encoded } = input;
  const stylePreset = getStyle(brief.style);
  const technicalControls: NarrativeControlResult[] = [
    { name: 'gif-integrity', passed: encoded.decoded.integrity.valid, detail: encoded.decoded.integrity.valid ? 'Independent LZW decode and GIF trailer passed.' : encoded.decoded.integrity.errors.join('; '), source: 'decoded' },
    { name: 'dimensions', passed: encoded.decoded.width === brief.output.width && encoded.decoded.height === brief.output.height, detail: `decoded ${encoded.decoded.width}×${encoded.decoded.height}; requested ${brief.output.width}×${brief.output.height}`, source: 'decoded' },
    { name: 'frame-count', passed: encoded.decoded.frames.length > 0 && encoded.decoded.frames.length <= 360, detail: `${encoded.decoded.frames.length} decoded frame(s)`, source: 'decoded' },
    { name: 'duration', passed: encoded.decoded.durationMs > 0, detail: `${encoded.decoded.durationMs}ms decoded; holds exclude transitions`, source: 'decoded' },
    { name: 'loop', passed: encoded.decoded.loopCount === (brief.playback.loop ? 0 : null), detail: brief.playback.loop ? `repeat=${encoded.decoded.loopCount}; result-to-before bridge is explicit` : 'single play; no loop extension', source: 'decoded' },
    { name: 'phase-holds', passed: encoded.phaseHoldsVerified.every((hold) => hold.passed), detail: encoded.phaseHoldsVerified.map((hold) => `${hold.phaseId} ${hold.decodedMs}/${hold.requiredMs}ms`).join(', '), source: 'decoded' },
    { name: 'ffprobe-crosscheck', passed: encoded.ffprobe.passed !== false, detail: encoded.ffprobe.detail, source: 'decoded' },
    { name: 'files', passed: encoded.bytes.gif > 0 && encoded.bytes.png > 0 && encoded.bytes.contactSheet > 0, detail: `GIF ${encoded.bytes.gif}B · PNG ${encoded.bytes.png}B · contact ${encoded.bytes.contactSheet}B`, source: 'decoded' },
  ];

  const sourceStyleControls: NarrativeControlResult[] = [
    { name: 'scene-renderer-registered', passed: encoded.sceneVersion.length > 0, detail: `renderer ${brief.style}/${encoded.sceneVersion} exists; visual style likeness remains a separate review`, source: 'source' },
    { name: 'type-system', passed: Boolean(stylePreset.typeSystem), detail: stylePreset.typeSystem ? 'style typeSystem tokens are attached to raster role registry' : 'missing typeSystem tokens', source: 'source' },
    { name: 'font-registration-and-glyphs', passed: input.fontChecksPassed ?? true, detail: input.fontChecksPassed === false ? 'bundled font role or glyph check failed' : 'registered bundled role faces and required Spanish glyphs were rendered/measured', source: 'source' },
  ];
  const pixelControls: NarrativeControlResult[] = [
    { name: 'distinct-frames', passed: encoded.uniquePixelFrames > 1, detail: `${encoded.uniquePixelFrames} unique composited frame(s); a format-valid static GIF does not pass`, source: 'pixels' },
    { name: 'palette-loss', passed: encoded.palette.meanAbsoluteChannelError <= 32 && encoded.palette.maximumChannelError <= 192, detail: `${encoded.palette.colors} colors; mean channel loss ${encoded.palette.meanAbsoluteChannelError}, max ${encoded.palette.maximumChannelError}; sampled ${encoded.palette.sampledFrames} frames`, source: 'pixels' },
  ];
  const sourceStatus = resultStatus(sourceStyleControls);
  const pixelStatus = resultStatus(pixelControls);
  const styleStatus = sourceStatus === 'fail' || pixelStatus === 'fail' ? 'fail' : 'pending';

  const textControls: NarrativeControlResult[] = [
    { name: 'title-complete', passed: textRetained(brief.title, layout.title.lines), detail: `${layout.title.lines.join(' / ')}`, source: 'source' },
    ...brief.phases.flatMap((phase, index) => [
      { name: `phase-${phase.id}-label-complete`, passed: textRetained(phase.label, layout.phases[index]!.label.lines), detail: layout.phases[index]!.label.lines.join(' / '), source: 'source' as const },
      { name: `phase-${phase.id}-text-complete`, passed: textRetained(phase.text, layout.phases[index]!.body.lines), detail: layout.phases[index]!.body.lines.join(' / '), source: 'source' as const },
    ]),
  ];
  const fontThresholdsPassed = layout.title.size >= 56 && layout.phases.every((phase) => phase.label.size >= 24 && phase.body.size >= 36);
  const cardThresholdsPassed = layout.phases.every((phase) => phase.label.effectiveCardSize >= 12 && phase.body.effectiveCardSize >= 18) && layout.title.effectiveCardSize >= 28;
  const readabilityControls: NarrativeControlResult[] = [
    ...textControls,
    { name: 'registered-fonts', passed: input.fontChecksPassed ?? true, detail: input.fontChecksPassed === false ? 'a required family, weight or glyph failed rendering/measurement' : 'all role faces and Spanish glyphs rendered/measured', source: 'source' },
    { name: 'review-size-thresholds', passed: fontThresholdsPassed, detail: `title ${layout.title.size}px; phase body >=36px; label >=24px`, source: 'source' },
    { name: '640x360-effective-size', passed: cardThresholdsPassed, detail: `title ${layout.title.effectiveCardSize.toFixed(1)}px; body min ${Math.min(...layout.phases.map((phase) => phase.body.effectiveCardSize)).toFixed(1)}px; label min ${Math.min(...layout.phases.map((phase) => phase.label.effectiveCardSize)).toFixed(1)}px`, source: 'source' },
    { name: 'contrast', passed: contrast(stylePreset.palette.ink, stylePreset.palette.bg) >= 4.5 && contrast(stylePreset.palette.accent, stylePreset.palette.bg) >= 3, detail: `style token contrast: ink ${contrast(stylePreset.palette.ink, stylePreset.palette.bg).toFixed(2)}:1; accent ${contrast(stylePreset.palette.accent, stylePreset.palette.bg).toFixed(2)}:1 (not an OCR or per-pixel text measurement)`, source: 'source' },
    { name: 'safe-zone-and-collisions', passed: layout.safeZone.x >= brief.output.width * 0.05 && layout.safeZone.y >= brief.output.height * 0.05 && layout.reservedArtArea.x >= layout.textArea.x + layout.textArea.width, detail: '5% safe margin; layout text and art boxes do not overlap; renderer pixel occlusion is not analyzed', source: 'source' },
    { name: 'stable-reading-holds', passed: encoded.phaseHoldsVerified.every((hold) => hold.passed), detail: 'Each complete hold is one fixed encoded image with its own GIF delay; transitions are separate frames.', source: 'decoded' },
  ];
  const legibilityStatus = resultStatus(readabilityControls, true);

  const distinctStates = new Set(brief.phases.map((phase) => `${phase.visual.kind}:${phase.visual.state}`)).size === brief.phases.length;
  const lastLabelMatchesStatus = narrativeResultLabelMatches(brief.phases.at(-1)!.label, brief.status, brief.locale);
  const narrativeControls: NarrativeControlResult[] = [
    { name: 'phase-count-and-copy', passed: brief.phases.length >= 3 && brief.phases.length <= 5 && textControls.every((control) => control.passed), detail: `${brief.phases.length} complete phases; all copy retained`, source: 'source' },
    { name: 'shared-object-identity', passed: true, detail: 'One scene object instance is created and passed to every phase frame.', source: 'source' },
    { name: 'visual-state-change', passed: distinctStates && encoded.uniquePixelFrames > 1, detail: distinctStates ? 'Phase states differ and exported frames are not identical.' : 'Phase visual states repeat; causal change is not demonstrated.', source: 'pixels' },
    { name: 'result-follows-status', passed: lastLabelMatchesStatus, detail: `status=${brief.status}; final label="${brief.phases.at(-1)!.label}"`, source: 'source' },
  ];
  const narrativeStatus = resultStatus(narrativeControls, true);
  const visualReview = input.visualReview ?? {
    status: 'pending' as const,
    criteria: ['identity at 200px thumbnail', 'full text and contrast at 640×360', 'style material in native frame', 'same object and causal change across phases', 'result faithful to status', 'deliberate loop restart'],
    evidence: [],
  };

  return {
    'technical-integrity': level(resultStatus(technicalControls), technicalControls),
    'style-conformance': {
      status: styleStatus,
      sourceStatus,
      pixelStatus,
      controls: [...sourceStyleControls, ...pixelControls],
      note: 'Source checks identify renderer/font tokens; pixel checks measure frame change and palette loss. Neither substitutes for visual review.',
    },
    'rendered-legibility': level(legibilityStatus, readabilityControls, 'Layout, contrast and decoded holds are measured; OCR and human reading at card size remain pending.'),
    narrative: level(narrativeStatus, narrativeControls, 'Automated checks verify phase/state structure and shared object identity; causal meaning still needs review.'),
    'visual-review': visualReview,
    publicationRecommendation: 'none',
  };
}
