import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  Brief,
  DeckBrief,
  DeckSlide,
  ExperienceBrief,
  ExperienceRoom,
  GifOptions,
  Locale,
  MotionBrief,
  SectionBrief,
  StoryBrief,
  StoryChapter,
  StylePreset,
  StyleSlug,
  ValidationResult,
} from './types.js';
import type { MakeInput, MakeIssue, MakeKind, MakeResult, MakeVisionCheck, StyleVoice } from './types/make.js';
import { isMakeKind } from './types/make.js';
import { createDeck, createExperience, createGifFile, createMotion, createPage, createStory, slugify } from './generate.js';
import { getStyle, isStyleSlug } from './styles/presets.js';
import { SHARED, styleVoice } from './scaffolds/index.js';

const IDEA_LIMIT = 600;
const IDEA_SHORT = 140;

export class MakeError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'MakeError';
  }
}

function truncate(value: string, max: number): string {
  const points = Array.from(value);
  if (points.length <= max) return value;
  const cut = points.slice(0, max).join('');
  return cut.replace(/\s+\S*$/, '').trim() || cut.trim();
}

export function normalizeIdea(value: string): string {
  const collapsed = String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!collapsed) {
    throw new MakeError(
      'beauty make needs an idea: pass --idea "one sentence". For example: --idea "A neighborhood bakery that bakes sourdough at dawn."',
      'EMPTY_IDEA',
    );
  }
  return truncate(collapsed, IDEA_LIMIT);
}

export function titleFromIdea(idea: string, locale: Locale): string {
  const sentence = idea.split(/[.!?…;:]+/)[0] ?? idea;
  const clause = sentence.split(/\s+[—–]\s+/)[0] ?? sentence;
  const words = clause.split(' ').filter(Boolean).slice(0, 8).join(' ');
  const title = truncate(words, 72)
    .replace(/[,;:]+$/, '')
    .trim();
  return title || (locale === 'es' ? 'Una idea nueva' : 'A new idea');
}

function shortIdea(idea: string, max = IDEA_SHORT): string {
  return truncate(idea, max);
}

function fill(template: string, idea: string, detail: string): string {
  return template.replaceAll('{idea}', idea).replaceAll('{detail}', detail);
}

function roman(index: number): string {
  return ['I', 'II', 'III', 'IV', 'V', 'VI'][index] ?? String(index + 1);
}

function wordsFrom(value: string): string {
  return value.split(/\s+/).filter(Boolean).join(' ');
}

function pageBrief(voice: StyleVoice, idea: string, locale: Locale): Partial<Brief> {
  const titles = voice.sectionTitles[locale];
  const details = voice.details[locale];
  const kickers = SHARED.sectionKickers[locale];
  const sections: SectionBrief[] = titles.map((title, index) => ({
    kicker: kickers[index],
    title,
    body:
      locale === 'es'
        ? wordsFrom(`Empezamos por lo concreto: ${details[index] ?? ''} Después ajustamos la escala hasta que la idea se sostiene sola.`)
        : wordsFrom(`We start with the concrete: ${details[index] ?? ''} Then we tune the scale until the idea stands on its own.`),
  }));
  return {
    title: titleFromIdea(idea, locale),
    tagline: shortIdea(idea, 160),
    intro: voice.intro[locale],
    eyebrow: voice.eyebrow[locale],
    brand: voice.brand[locale],
    sections,
    quote: { ...voice.quote[locale] },
    cta: { label: voice.cta[locale], href: '#contact' },
    footer: SHARED.footer[locale],
    locale,
    seed: 0,
    maxxing: true,
  };
}

function deckBrief(voice: StyleVoice, idea: string, locale: Locale): Partial<DeckBrief> {
  const slides: DeckSlide[] = [
    {
      layout: 'statement',
      kicker: locale === 'es' ? '01 / La idea' : '01 / The idea',
      title: titleFromIdea(idea, locale),
      body: truncate(voice.intro[locale], 280),
    },
    {
      layout: 'points',
      kicker: locale === 'es' ? '02 / Los movimientos' : '02 / The movements',
      title: SHARED.deckPointsTitle[locale],
      points: voice.deckPoints[locale].map((point) => ({ title: point.title, body: point.body })),
    },
    {
      layout: 'stats',
      kicker: locale === 'es' ? '03 / La evidencia' : '03 / The evidence',
      title: SHARED.deckStatsTitle[locale],
      stats: voice.deckStats[locale].map((stat) => ({ ...stat })),
    },
    {
      layout: 'quote',
      kicker: locale === 'es' ? '04 / Una voz' : '04 / A voice',
      title: voice.quote[locale].author,
      quote: { ...voice.quote[locale] },
    },
  ];
  return {
    title: titleFromIdea(idea, locale),
    tagline: shortIdea(idea, 160),
    intro: voice.intro[locale],
    eyebrow: voice.eyebrow[locale],
    brand: voice.brand[locale],
    slides,
    closing: SHARED.closing[locale],
    cta: { label: voice.cta[locale], href: '#contact' },
    locale,
    maxxing: true,
  };
}

function storyBrief(voice: StyleVoice, idea: string, locale: Locale): Partial<StoryBrief> {
  const titles = voice.chapterTitles[locale];
  const details = voice.details[locale];
  const frames = SHARED.storyFrames[locale];
  const chapters: StoryChapter[] = titles.map((title, index) => ({
    kicker: roman(index),
    title,
    body: fill(frames[index] ?? '', shortIdea(idea), details[index] ?? ''),
    fact: index === 1 ? voice.fact[locale] : undefined,
  }));
  return {
    title: titleFromIdea(idea, locale),
    tagline: shortIdea(idea, 160),
    intro: voice.intro[locale],
    eyebrow: voice.eyebrow[locale],
    brand: voice.brand[locale],
    kind: voice.storyKind,
    format: voice.storybook ? 'storybook' : 'scroll',
    chapters,
    source: SHARED.storySource[locale],
    readingTime: SHARED.readingTime[locale],
    cta: { label: voice.cta[locale], href: '#top' },
    locale,
    maxxing: true,
  };
}

function experienceBrief(voice: StyleVoice, idea: string, locale: Locale): Partial<ExperienceBrief> {
  const titles = voice.roomTitles[locale];
  const details = voice.details[locale];
  const bodies = SHARED.roomBodies[locale];
  const itemDetails = SHARED.itemDetails[locale];
  const kind = voice.experienceKind;
  const items = voice.itemLabels[locale].map((label, index) => ({
    label,
    value: String(index + 1).padStart(2, '0'),
    detail: itemDetails[index] ?? '',
  }));
  const rooms: ExperienceRoom[] = [
    {
      kicker: titles[0],
      title: titles[0],
      body: fill(bodies[0] ?? '', shortIdea(idea), details[0] ?? ''),
      display: 'quote',
      quote: { ...voice.quote[locale] },
    },
    {
      kicker: titles[1],
      title: titles[1],
      body: fill(bodies[1] ?? '', shortIdea(idea), details[0] ?? ''),
      display: kind === 'museum' ? 'exhibit' : 'objects',
      items,
    },
    {
      kicker: titles[2],
      title: titles[2],
      body: fill(bodies[2] ?? '', shortIdea(idea), details[1] ?? ''),
      display: 'scene',
    },
    {
      kicker: titles[3],
      title: titles[3],
      body: fill(bodies[3] ?? '', shortIdea(idea), details[2] ?? ''),
      display: 'scene',
    },
  ];
  return {
    title: titleFromIdea(idea, locale),
    tagline: shortIdea(idea, 160),
    intro: voice.intro[locale],
    eyebrow: voice.eyebrow[locale],
    brand: voice.brand[locale],
    kind,
    rooms,
    closing: SHARED.closing[locale],
    cta: { label: voice.cta[locale], href: '#sala-1' },
    locale,
    maxxing: true,
  };
}

function gifOptions(voice: StyleVoice, preset: StylePreset, idea: string, locale: Locale, output: string): GifOptions & { style: StyleSlug; output: string } {
  const words = titleFromIdea(idea, locale).split(' ').slice(0, 6).join(' ');
  const text = truncate(preset.typeSystem?.displayCase === 'uppercase' ? words.toUpperCase() : words, 40) || titleFromIdea(idea, locale);
  return {
    style: preset.slug,
    text,
    subtitle: voice.gifSubtitle[locale],
    template: voice.gifTemplate,
    width: 800,
    height: 800,
    fps: 20,
    duration: 2.4,
    seed: 0,
    maxxing: true,
    output,
  };
}

function motionBrief(voice: StyleVoice, preset: StylePreset, idea: string, locale: Locale): MotionBrief {
  return {
    style: preset.slug,
    title: titleFromIdea(idea, locale),
    subtitle: voice.motionSubtitle[locale],
    eyebrow: voice.eyebrow[locale],
    brand: voice.brand[locale],
    footer: shortIdea(idea, 110),
    scene: voice.motionScene,
    size: 'landscape',
    duration: 14,
    seed: 0,
    maxxing: true,
  };
}

function extensionFor(kind: MakeKind): string {
  return kind === 'gif' ? 'gif' : kind === 'motion' ? 'svg' : 'html';
}

function defaultOutput(kind: MakeKind, style: StyleSlug, title: string): string {
  return path.join('beauty-output', `${style}-${kind}-${slugify(title)}.${extensionFor(kind)}`);
}

function gradeFor(score: number): MakeResult['grade'] {
  return score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
}

function scoreFromIssues(issues: MakeIssue[]): number {
  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.filter((issue) => issue.severity === 'warn').length;
  const infos = issues.filter((issue) => issue.severity === 'info').length;
  return Math.max(0, Math.min(100, 100 - errors * 18 - warnings * 6 - infos));
}

function cleanAdvice(value: string, max = 180): string {
  return truncate(
    value
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[.\s]+$/, ''),
    max,
  );
}

function nextStep(artifactPath: string, issues: MakeIssue[]): string {
  const first = issues[0];
  if (!first) {
    return `Open ${artifactPath} and share it; no changes are needed.`;
  }
  const advice = cleanAdvice(first.fix || first.message);
  return `Fix the first ${first.severity} "${first.code}" (${advice}) and run beauty make again with the same idea.`;
}

function fromValidation(kind: MakeKind, style: StyleSlug, locale: Locale, artifactPath: string, preset: StylePreset, validation: ValidationResult): MakeResult {
  const issues: MakeIssue[] = validation.issues.map((issue) => ({ ...issue }));
  const summary = `Created a ${preset.name} ${kind} · ${validation.grade} · ${validation.score}/100 · ${issues.length} issue${issues.length === 1 ? '' : 's'}.`;
  return {
    kind,
    style,
    locale,
    path: artifactPath,
    score: validation.score,
    grade: validation.grade,
    issues,
    vision: {
      score: validation.vision.score,
      checks: validation.vision.checks.map((check) => ({ ...check })),
    },
    summary,
    next_step: nextStep(artifactPath, issues),
  };
}

async function runGif(style: StyleSlug, locale: Locale, preset: StylePreset, voice: StyleVoice, idea: string, output: string): Promise<MakeResult> {
  const result = await createGifFile(gifOptions(voice, preset, idea, locale, output));
  const bytes = await readFile(result.path);
  const header = bytes.subarray(0, 6).toString('ascii');
  const checks: MakeVisionCheck[] = [
    { name: 'gif-format', passed: header === 'GIF89a', detail: `header ${header || 'empty'}` },
    { name: 'animated', passed: result.frames >= 2, detail: `${result.frames} frames` },
    { name: 'dimensions', passed: result.width >= 240 && result.height >= 240 && result.width <= 1200 && result.height <= 1200, detail: `${result.width}×${result.height}` },
    { name: 'non-empty', passed: result.bytes > 1024, detail: `${result.bytes} bytes` },
  ];
  const issues: MakeIssue[] = checks
    .filter((check) => !check.passed)
    .map((check) => ({
      severity: check.name === 'gif-format' ? 'error' : 'warn',
      code: `gif-${check.name}`,
      message: `The GIF failed the ${check.name} check: ${check.detail}.`,
      fix: 'Run beauty make gif again with a different --out path.',
    }));
  const score = scoreFromIssues(issues);
  return {
    kind: 'gif',
    style,
    locale,
    path: result.path,
    score,
    grade: gradeFor(score),
    issues,
    vision: { score: checks.filter((check) => check.passed).length, checks },
    summary: `Created a ${preset.name} GIF · ${result.width}×${result.height} · ${result.frames} frames · ${Math.round(result.bytes / 1024)} KB.`,
    next_step: nextStep(result.path, issues),
  };
}

async function runMotion(style: StyleSlug, locale: Locale, preset: StylePreset, voice: StyleVoice, idea: string, output: string): Promise<MakeResult> {
  const result = await createMotion({ style, brief: motionBrief(voice, preset, idea, locale), output });
  const issues: MakeIssue[] = result.checks
    .filter((check) => !check.passed)
    .map((check) => ({
      severity: 'warn',
      code: `motion-${check.name}`,
      message: `The SVG failed the ${check.name} check: ${check.detail}.`,
      fix: 'Run beauty make motion again with a different --out path.',
    }));
  const score = scoreFromIssues(issues);
  return {
    kind: 'motion',
    style,
    locale,
    path: result.path,
    score,
    grade: gradeFor(score),
    issues,
    vision: { score: result.checks.filter((check) => check.passed).length, checks: result.checks.map((check) => ({ ...check })) },
    summary: `Created an animated ${preset.name} SVG · ${result.scene} · ${result.duration}s.`,
    next_step: nextStep(result.path, issues),
  };
}

/**
 * One-shot entry point: turns kind + style + one sentence into a complete,
 * validated artefact. Deterministic for identical input.
 */
export async function makeArtifact(input: MakeInput): Promise<MakeResult> {
  if (!isMakeKind(input.kind)) {
    throw new MakeError('Pass a kind: page, deck, gif, story, experience or motion.', 'UNKNOWN_KIND');
  }
  if (!isStyleSlug(input.style)) {
    throw new MakeError('Pass a style slug; call beauty styles for the list.', 'UNKNOWN_STYLE');
  }
  const idea = normalizeIdea(input.idea);
  const locale: Locale = input.locale === 'en' ? 'en' : 'es';
  const preset = getStyle(input.style);
  const voice = styleVoice(input.style);
  const title = titleFromIdea(idea, locale);
  const output = input.output ?? defaultOutput(input.kind, input.style, title);

  switch (input.kind) {
    case 'page': {
      const result = await createPage({ style: input.style, brief: pageBrief(voice, idea, locale), output });
      return fromValidation('page', input.style, locale, result.path ?? output, preset, result.validation);
    }
    case 'deck': {
      const result = await createDeck({ style: input.style, brief: deckBrief(voice, idea, locale), output });
      return fromValidation('deck', input.style, locale, result.path ?? output, preset, result.validation);
    }
    case 'story': {
      const result = await createStory({ style: input.style, brief: storyBrief(voice, idea, locale), output });
      return fromValidation('story', input.style, locale, result.path ?? output, preset, result.validation);
    }
    case 'experience': {
      const result = await createExperience({ style: input.style, brief: experienceBrief(voice, idea, locale), output });
      return fromValidation('experience', input.style, locale, result.path ?? output, preset, result.validation);
    }
    case 'gif':
      return runGif(input.style, locale, preset, voice, idea, output);
    case 'motion':
      return runMotion(input.style, locale, preset, voice, idea, output);
  }
}
