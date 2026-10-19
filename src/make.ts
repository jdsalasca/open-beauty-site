import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  DeckBrief,
  DeckSlide,
  ExperienceBrief,
  ExperienceRoom,
  GifOptions,
  Locale,
  MotionBrief,
  PageBrief,
  SectionBrief,
  StoryBrief,
  StoryChapter,
  StylePreset,
  StyleSlug,
  ValidationResult,
} from './types.js';
import type { DerivedCopy, MakeInput, MakeIssue, MakeKind, MakeResult, MakeVisionCheck, StyleVoice } from './types/make.js';
import { isMakeKind } from './types/make.js';
import { createDeck, createExperience, createGifFile, createMotion, createPage, createStory, slugify } from './generate.js';
import { getStyle, isStyleSlug } from './styles/presets.js';
import { SHARED, styleVoice } from './scaffolds/index.js';

const IDEA_LIMIT = 600;

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
  // The style system draws its own marks, so emoji never reach the copy (the validator flags them).
  const collapsed = String(value ?? '')
    .replace(/\p{Emoji_Presentation}|‍|️/gu, '')
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

const TITLE_MAX_WORDS = 5;
const TITLE_MAX_CHARS = 60;
const TAGLINE_MAX_CHARS = 160;
const INTRO_MAX_CHARS = 760;

/**
 * Prompt-like phrasing: an artefact noun followed by a subject preposition.
 * "Landing editorial en español para X", "A landing page about X". The subject
 * is the capture, so the artefact scaffold never becomes the headline.
 */
const PROMPT_SUBJECT =
  /\b(?:landing|p[áa]gina|page|sitio|site|web|p[óo]ster|poster|cartel|deck|presentaci[óo]n|presentation|gif|historia|story|experiencia|experience|ensayo|essay|nota|note|cat[áa]logo|catalogue|catalog|informe|report|manual|gu[íi]a|guide)\b[\s\S]*?\b(?:para|for|sobre|about|de|of)\s+([^.!?…;:]+)/i;

const ABOUT_SUBJECT = /\b(?:sobre|about)\b\s+([^.!?…;:]+)/i;

const RELATIVE_CLAUSE = /\s+\b(?:que|quien|quienes|donde|cuando|como|that|which|who|whom|whose|where|when|with|without|con|sin)\b[\s\S]*$/i;

const LEADING_ARTICLE = /^(?:el|la|los|las|un|una|unos|unas|the|a|an)\s+/i;

const QUOTED = /"([^"]{2,})"|“([^”]{2,})”|«([^»]{2,})»|‘([^’]{2,})’/;

function cleanSubject(raw: string): string {
  return raw
    .trim()
    .split(/[;:—–]|\s+-\s+/)[0]!
    .replace(RELATIVE_CLAUSE, '')
    .replace(LEADING_ARTICLE, '')
    .replace(/[,;:.!?…\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function limitWords(value: string, max: number): string {
  return value.split(/\s+/).filter(Boolean).slice(0, max).join(' ');
}

/**
 * Turn a one-sentence idea into a short headline, a one-line tagline and the
 * remainder as the intro. Prompt-like phrasing ("Landing ... para X", "a page
 * about X"), quotes and the idea's own clause structure are understood so the
 * whole request never lands in the H1.
 */
export function deriveCopy(idea: string, locale: Locale): DerivedCopy {
  const firstSentence = idea.split(/[.!?…]/)[0] ?? idea;
  let subject = firstSentence;
  const prompt = idea.match(PROMPT_SUBJECT);
  const about = prompt ? null : idea.match(ABOUT_SUBJECT);
  if (prompt?.[1]) subject = prompt[1];
  else if (about?.[1]) subject = about[1];
  // A quoted span is the subject even when it sits before the preposition.
  const quoted = idea.match(QUOTED) ?? subject.match(QUOTED);
  const quotedText = quoted?.slice(1).find((part) => part !== undefined);
  if (quotedText) subject = quotedText;

  let title = limitWords(cleanSubject(subject), TITLE_MAX_WORDS);
  title = truncate(title, TITLE_MAX_CHARS).replace(/[,;:]+$/, '').trim();
  if (!title) title = locale === 'es' ? 'Una idea nueva' : 'A new idea';

  const boundary = idea.search(/[.!?…;:]/);
  let tagline = idea.trim();
  let intro = '';
  if (boundary >= 0) {
    tagline = idea.slice(0, boundary).trim() || tagline;
    intro = truncate(idea.slice(boundary + 1).trim(), INTRO_MAX_CHARS);
  }
  return { title, tagline: truncate(tagline, TAGLINE_MAX_CHARS), intro };
}

export function titleFromIdea(idea: string, locale: Locale): string {
  return deriveCopy(idea, locale).title;
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

/**
 * One template per card so a generated page never repeats the same filler
 * sentence in every section; the brief's own detail still carries the idea.
 */
const SECTION_BODIES: Record<Locale, Array<(detail: string) => string>> = {
  es: [
    (detail) => `Empezamos por lo concreto: ${detail}`,
    (detail) => `La medida aparece después: ${detail}`,
    (detail) => `Al final solo queda la prueba: ${detail}`,
  ],
  en: [
    (detail) => `We start with the concrete: ${detail}`,
    (detail) => `The measure arrives later: ${detail}`,
    (detail) => `At the end only the proof remains: ${detail}`,
  ],
};

function pageBrief(voice: StyleVoice, idea: string, locale: Locale): Partial<PageBrief> {
  const copy = deriveCopy(idea, locale);
  const titles = voice.sectionTitles[locale];
  const details = voice.details[locale];
  const kickers = SHARED.sectionKickers[locale];
  const bodies = SECTION_BODIES[locale];
  const sections: SectionBrief[] = titles.map((title, index) => ({
    kicker: kickers[index],
    title,
    body: wordsFrom(bodies[index % bodies.length]!(details[index] ?? '')),
  }));
  return {
    title: copy.title,
    tagline: copy.tagline,
    intro: copy.intro || voice.intro[locale],
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
  const copy = deriveCopy(idea, locale);
  const slides: DeckSlide[] = [
    {
      layout: 'statement',
      kicker: locale === 'es' ? '01 / La idea' : '01 / The idea',
      title: copy.title,
      body: truncate(copy.intro || voice.intro[locale], 280),
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
    title: copy.title,
    tagline: copy.tagline,
    intro: copy.intro || voice.intro[locale],
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
  const copy = deriveCopy(idea, locale);
  const titles = voice.chapterTitles[locale];
  const details = voice.details[locale];
  const frames = SHARED.storyFrames[locale];
  const chapters: StoryChapter[] = titles.map((title, index) => ({
    kicker: roman(index),
    title,
    body: fill(frames[index] ?? '', copy.tagline, details[index] ?? ''),
    fact: index === 1 ? voice.fact[locale] : undefined,
  }));
  return {
    title: copy.title,
    tagline: copy.tagline,
    intro: copy.intro || voice.intro[locale],
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
  const copy = deriveCopy(idea, locale);
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
      body: fill(bodies[0] ?? '', copy.tagline, details[0] ?? ''),
      display: 'quote',
      quote: { ...voice.quote[locale] },
    },
    {
      kicker: titles[1],
      title: titles[1],
      body: fill(bodies[1] ?? '', copy.tagline, details[0] ?? ''),
      display: kind === 'museum' ? 'exhibit' : 'objects',
      items,
    },
    {
      kicker: titles[2],
      title: titles[2],
      body: fill(bodies[2] ?? '', copy.tagline, details[1] ?? ''),
      display: 'scene',
    },
    {
      kicker: titles[3],
      title: titles[3],
      body: fill(bodies[3] ?? '', copy.tagline, details[2] ?? ''),
      display: 'scene',
    },
  ];
  return {
    title: copy.title,
    tagline: copy.tagline,
    intro: copy.intro || voice.intro[locale],
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
  const title = deriveCopy(idea, locale).title;
  const words = title.split(' ').slice(0, 6).join(' ');
  const text = truncate(preset.typeSystem?.displayCase === 'uppercase' ? words.toUpperCase() : words, 40) || title;
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
  const copy = deriveCopy(idea, locale);
  return {
    style: preset.slug,
    title: copy.title,
    subtitle: voice.motionSubtitle[locale],
    eyebrow: voice.eyebrow[locale],
    brand: voice.brand[locale],
    footer: truncate(copy.tagline, 110),
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

function gradeFor(score: number, warnings = 0): MakeResult['grade'] {
  const base: MakeResult['grade'] = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  return warnings > 0 && base === 'A' ? 'B' : base;
}

function warningCount(issues: MakeIssue[]): number {
  return issues.filter((issue) => issue.severity === 'warn').length;
}

function scoreFromIssues(issues: MakeIssue[]): number {
  const errors = issues.filter((issue) => issue.severity === 'error').length;
  const warnings = issues.filter((issue) => issue.severity === 'warn').length;
  const infos = issues.filter((issue) => issue.severity === 'info').length;
  return Math.max(0, Math.min(100, 100 - errors * 18 - warnings * 6 - infos));
}

function cleanOverride(value: string | undefined, max: number): string {
  return truncate(String(value ?? '').replace(/\s+/g, ' ').trim(), max);
}

function withOverrides<T extends { title?: string; tagline?: string }>(brief: T, input: MakeInput): T {
  const title = cleanOverride(input.title, 90);
  const tagline = cleanOverride(input.tagline, 160);
  if (title) brief.title = title;
  if (tagline) brief.tagline = tagline;
  return brief;
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
    grade: gradeFor(score, warningCount(issues)),
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
    grade: gradeFor(score, warningCount(issues)),
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
  const title = cleanOverride(input.title, 90) || titleFromIdea(idea, locale);
  const output = input.output ?? defaultOutput(input.kind, input.style, title);

  switch (input.kind) {
    case 'page': {
      const result = await createPage({ style: input.style, brief: withOverrides(pageBrief(voice, idea, locale), input), output });
      return fromValidation('page', input.style, locale, result.path ?? output, preset, result.validation);
    }
    case 'deck': {
      const result = await createDeck({ style: input.style, brief: withOverrides(deckBrief(voice, idea, locale), input), output });
      return fromValidation('deck', input.style, locale, result.path ?? output, preset, result.validation);
    }
    case 'story': {
      const result = await createStory({ style: input.style, brief: withOverrides(storyBrief(voice, idea, locale), input), output });
      return fromValidation('story', input.style, locale, result.path ?? output, preset, result.validation);
    }
    case 'experience': {
      const result = await createExperience({ style: input.style, brief: withOverrides(experienceBrief(voice, idea, locale), input), output });
      return fromValidation('experience', input.style, locale, result.path ?? output, preset, result.validation);
    }
    case 'gif':
      return runGif(input.style, locale, preset, voice, idea, output);
    case 'motion':
      return runMotion(input.style, locale, preset, voice, idea, output);
  }
}
