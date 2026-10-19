import type { NarrativeEditorialWarning, NarrativePlaybackPreset } from '../types/narrative.js';

interface LintRule {
  pattern: RegExp;
  label: string;
  suggestion: string;
}

const CONTENT_LINT_RULES: readonly LintRule[] = [
  {
    pattern: /\b[A-Z][A-Z0-9]{1,9}-\d{1,6}\b/gu,
    label: 'internal ticket code',
    suggestion: 'Replace the ticket code with the user-visible fact it represents; this preset does not expose internal issue keys.',
  },
  {
    pattern: /\bPR\s*#?\s*\d+\b/giu,
    label: 'pull-request number',
    suggestion: 'Describe the change instead of its pull-request number; review GIFs should not depend on repository bookkeeping.',
  },
  {
    pattern: /\b(?:staging|prod|production|hotfix)\b/giu,
    label: 'environment or release term',
    suggestion: 'Name the product state in user language; staging, prod and hotfix are internal environment terms.',
  },
  {
    pattern: /\b(?:IN PROGRESS|TO DO|IN REVIEW|BACKLOG|DONE)\b/gu,
    label: 'Jira workflow state',
    suggestion: 'Keep internal workflow states out of the scene copy; state what the audience can see or do.',
  },
];

function words(value: string): string[] {
  return value.trim().split(/\s+/u).filter(Boolean);
}

function sentences(value: string): string[] {
  return value.split(/[.!?]+/u).map((sentence) => sentence.trim()).filter(Boolean);
}

/** Warnings only: this function never edits or truncates the supplied copy. */
export function lintNarrativeContent(phases: Array<{ text: string }>): NarrativeEditorialWarning[] {
  const warnings: NarrativeEditorialWarning[] = [];
  for (const [phaseIndex, phase] of phases.entries()) {
    for (const rule of CONTENT_LINT_RULES) {
      rule.pattern.lastIndex = 0;
      const matches = [...new Set(Array.from(phase.text.matchAll(rule.pattern), (match) => match[0]))];
      if (matches.length === 0) continue;
      warnings.push({
        code: 'CONTENT_LINT',
        message: `Phase ${phaseIndex + 1} text contains ${rule.label}: ${matches.join(', ')}.`,
        suggestion: rule.suggestion,
        field: `phases[${phaseIndex}].text`,
        phaseIndex,
      });
    }
  }
  return warnings;
}

export function editorialGuidelineWarnings(input: {
  playbackPreset: NarrativePlaybackPreset;
  title: string;
  phases: Array<{ label: string; text: string }>;
}): NarrativeEditorialWarning[] {
  if (input.playbackPreset !== 'product-review') return [];
  const warnings: NarrativeEditorialWarning[] = [];
  const titleWords = words(input.title);
  if (titleWords.length < 3 || titleWords.length > 7) {
    warnings.push({
      code: 'EDITORIAL_GUIDELINE',
      message: `The product-review headline has ${titleWords.length} word(s).`,
      suggestion: 'Aim for 3–7 words in the headline; this is an editorial guideline and the text is not shortened automatically.',
      field: 'title',
    });
  }
  for (const [phaseIndex, phase] of input.phases.entries()) {
    const labelWords = words(phase.label);
    if (labelWords.length > 7) {
      warnings.push({
        code: 'EDITORIAL_GUIDELINE',
        message: `Phase ${phaseIndex + 1} label has ${labelWords.length} words.`,
        suggestion: 'Keep the scene headline to 3–7 words; the engine will not cut it for you.',
        field: `phases[${phaseIndex}].label`,
        phaseIndex,
      });
    }
    const sentenceCount = sentences(phase.text).length;
    const wordCount = words(phase.text).length;
    if (sentenceCount > 1 || wordCount > 24) {
      warnings.push({
        code: 'EDITORIAL_GUIDELINE',
        message: `Phase ${phaseIndex + 1} text has ${sentenceCount} sentence(s) and ${wordCount} word(s).`,
        suggestion: 'Use one short sentence when possible; split or summarize the original instead of relying on an automatic cut.',
        field: `phases[${phaseIndex}].text`,
        phaseIndex,
      });
    }
  }
  return warnings;
}
