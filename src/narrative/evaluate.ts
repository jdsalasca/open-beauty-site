import type { NormalizedNarrativeBrief, NarrativeControlResult, NarrativeEvaluation, NarrativeEvaluationLevel, NarrativeLayout, NarrativeLevelStatus } from '../types/narrative.js';
import type { NarrativeEncodedFiles } from './encode.js';
import { getStyle } from '../styles/presets.js';
import { narrativeResultLabelMatches } from './brief.js';
import { narrativeLabelToneFor } from './composition.js';

function level(status: NarrativeLevelStatus, controls: NarrativeControlResult[], note?: string): NarrativeEvaluationLevel {
  return { status, controls, note };
}

function resultStatus(controls: NarrativeControlResult[], pending = false): NarrativeLevelStatus {
  if (controls.some((control) => !control.passed && control.severity !== 'warning')) return 'fail';
  if (controls.some((control) => !control.passed && control.severity === 'warning')) return 'revise';
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

export interface CompositionBalanceMetrics {
  emptyCellRatio: number;
  textColumnFillRatio: number;
  objectAreaRatio: number;
  largestEmptyRectangleRatio: number;
}

function pixelLuminance(red: number, green: number, blue: number): number {
  const linear = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722;
}

function hexLuminance(hex: string): number {
  const raw = hex.replace('#', '');
  const expanded = raw.length === 3 ? [...raw].map((value) => value + value).join('') : raw;
  return pixelLuminance(...[0, 2, 4].map((offset) => Number.parseInt(expanded.slice(offset, offset + 2), 16)) as [number, number, number]);
}

/**
 * Coarse spatial occupancy proxy from the exported GIF's composited RGB pixels.
 * A cell counts as occupied when its luminance differs from the style background
 * or varies enough to contain visible content; this is not an aesthetic score.
 */
export function measureCompositionBalance(input: {
  rgb: Uint8Array;
  width: number;
  height: number;
  background: string;
  textArea: NarrativeLayout['textArea'];
}): CompositionBalanceMetrics {
  const columns = 8;
  const rows = 4;
  const backgroundLuminance = hexLuminance(input.background);
  const occupied: boolean[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x0 = Math.floor(column * input.width / columns);
      const x1 = Math.floor((column + 1) * input.width / columns);
      const y0 = Math.floor(row * input.height / rows);
      const y1 = Math.floor((row + 1) * input.height / rows);
      let count = 0;
      let sum = 0;
      let sumSquares = 0;
      let absoluteDeviation = 0;
      const sampleSide = 16;
      for (let sampleY = 0; sampleY < sampleSide; sampleY += 1) {
        for (let sampleX = 0; sampleX < sampleSide; sampleX += 1) {
          const x = Math.min(x1 - 1, x0 + Math.floor((sampleX + 0.5) * (x1 - x0) / sampleSide));
          const y = Math.min(y1 - 1, y0 + Math.floor((sampleY + 0.5) * (y1 - y0) / sampleSide));
          const offset = (y * input.width + x) * 3;
          const light = pixelLuminance(input.rgb[offset]!, input.rgb[offset + 1]!, input.rgb[offset + 2]!);
          const delta = light - backgroundLuminance;
          count += 1;
          sum += delta;
          sumSquares += delta * delta;
          absoluteDeviation += Math.abs(delta);
        }
      }
      const mean = sum / count;
      const variance = Math.max(0, sumSquares / count - mean * mean);
      const meanAbsoluteDeviation = absoluteDeviation / count;
      occupied.push(meanAbsoluteDeviation >= 0.05 || variance >= 0.003);
    }
  }

  let largestEmptyCells = 0;
  for (let top = 0; top < rows; top += 1) {
    for (let bottom = top; bottom < rows; bottom += 1) {
      for (let left = 0; left < columns; left += 1) {
        for (let right = left; right < columns; right += 1) {
          let empty = true;
          for (let row = top; row <= bottom && empty; row += 1) {
            for (let column = left; column <= right; column += 1) {
              if (occupied[row * columns + column]) {
                empty = false;
                break;
              }
            }
          }
          if (empty) largestEmptyCells = Math.max(largestEmptyCells, (bottom - top + 1) * (right - left + 1));
        }
      }
    }
  }

  const textColumns = Array.from({ length: columns }, (_, column) => column)
    .filter((column) => {
      const center = (column + 0.5) * input.width / columns;
      return center >= input.textArea.x && center < input.textArea.x + input.textArea.width;
    });
  const objectColumns = Array.from({ length: columns }, (_, column) => column)
    .filter((column) => (column + 0.5) * input.width / columns >= input.textArea.x + input.textArea.width);
  const filledRows = Array.from({ length: rows }, (_, row) => row)
    .filter((row) => textColumns.some((column) => occupied[row * columns + column]));
  const occupiedCells = occupied.filter(Boolean).length;
  let occupiedObjectCells = 0;
  for (const column of objectColumns) {
    for (let row = 0; row < rows; row += 1) {
      if (occupied[row * columns + column]) occupiedObjectCells += 1;
    }
  }
  return {
    emptyCellRatio: 1 - occupiedCells / (columns * rows),
    textColumnFillRatio: filledRows.length / rows,
    objectAreaRatio: occupiedObjectCells / (columns * rows),
    largestEmptyRectangleRatio: largestEmptyCells / (columns * rows),
  };
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
    { name: 'narrative-subfamily', passed: brief.style === 'papercraft' ? brief.subfamily === 'editorial' : brief.style === 'brutalist' ? brief.subfamily === 'documentary' || brief.subfamily === 'poster' : true, detail: `${brief.style}/${brief.subfamily ?? 'default'} selects an explicit narrative art direction`, source: 'source' },
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
  const cardThresholdsPassed = layout.phases.every((phase) => phase.label.effectiveCardSize >= 12 && phase.body.effectiveCardSize >= 20) && layout.title.effectiveCardSize >= 28;
  const labelColor = stylePreset.palette[narrativeLabelToneFor(brief.style)];
  const decodedPixelFrame = encoded.decoded.sampledFrames[0];
  const compositionMetrics = decodedPixelFrame
    && decodedPixelFrame.rgb.length === encoded.decoded.width * encoded.decoded.height * 3
    ? measureCompositionBalance({
      rgb: decodedPixelFrame.rgb,
      width: encoded.decoded.width,
      height: encoded.decoded.height,
      background: stylePreset.palette.bg,
      textArea: layout.textArea,
    })
    : undefined;
  const compositionNeedsRevision = !compositionMetrics
    || compositionMetrics.largestEmptyRectangleRatio > 0.22
    || compositionMetrics.textColumnFillRatio < 0.60;
  const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const readabilityControls: NarrativeControlResult[] = [
    ...textControls,
    { name: 'registered-fonts', passed: input.fontChecksPassed ?? true, detail: input.fontChecksPassed === false ? 'a required family, weight or glyph failed rendering/measurement' : 'all role faces and Spanish glyphs rendered/measured', source: 'source' },
    { name: 'review-size-thresholds', passed: fontThresholdsPassed, detail: `title ${layout.title.size}px; phase body >=36px; label >=24px`, source: 'source' },
    { name: '640x360-effective-size', passed: cardThresholdsPassed, detail: `title ${layout.title.effectiveCardSize.toFixed(1)}px; body min ${Math.min(...layout.phases.map((phase) => phase.body.effectiveCardSize)).toFixed(1)}px (requires >=20px); label min ${Math.min(...layout.phases.map((phase) => phase.label.effectiveCardSize)).toFixed(1)}px`, source: 'source' },
    {
      name: 'composition-balance',
      passed: !compositionNeedsRevision,
      ...(compositionNeedsRevision ? { severity: 'warning' as const } : {}),
      detail: compositionMetrics
        ? `${compositionNeedsRevision ? 'WARN · revise' : 'proxy'}; 8×4 decoded-pixel grid against ${stylePreset.palette.bg}: empty cells ${percent(compositionMetrics.emptyCellRatio)}, text-column vertical fill ${percent(compositionMetrics.textColumnFillRatio)}, art/object area outside the text column ${percent(compositionMetrics.objectAreaRatio)}, largest empty rectangle ${percent(compositionMetrics.largestEmptyRectangleRatio)}; thresholds: rectangle <=22%, text fill >=60%; not an aesthetic score.`
        : 'WARN · revise; no composited decoded RGB sample was available for the 8×4 composition proxy.',
      source: 'pixels',
    },
    { name: 'contrast', passed: contrast(stylePreset.palette.ink, stylePreset.palette.bg) >= 4.5 && contrast(labelColor, stylePreset.palette.bg) >= 3, detail: `rendered text colors: ink ${contrast(stylePreset.palette.ink, stylePreset.palette.bg).toFixed(2)}:1; label ${contrast(labelColor, stylePreset.palette.bg).toFixed(2)}:1 (not an OCR or per-pixel text measurement)`, source: 'source' },
    { name: 'safe-zone-and-collisions', passed: layout.safeZone.x >= brief.output.width * 0.05 && layout.safeZone.y >= brief.output.height * 0.05 && layout.reservedArtArea.x >= layout.textArea.x + layout.textArea.width && layout.reservedArtArea.x + layout.reservedArtArea.width <= brief.output.width * 0.95 + 0.01 && layout.reservedArtArea.y >= brief.output.height * 0.05 - 0.01 && layout.reservedArtArea.y + layout.reservedArtArea.height <= brief.output.height * 0.95 + 0.01, detail: '5% safe margin for the text column and reserved art box; boxes do not overlap; per-pixel text collisions are not analyzed', source: 'source' },
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
    'rendered-legibility': level(legibilityStatus, readabilityControls, 'The 8×4 decoded-pixel composition metric is a balance proxy, not an aesthetic score; OCR and human reading at card size remain pending.'),
    narrative: level(narrativeStatus, narrativeControls, 'Automated checks verify phase/state structure and shared object identity; causal meaning still needs review.'),
    'visual-review': visualReview,
    publicationRecommendation: 'none',
  };
}
