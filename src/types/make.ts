import type {
  ExperienceKind,
  GifTemplate,
  Locale,
  MotionScene,
  QuoteBrief,
  SectionBrief,
  StoryBrief,
  StyleSlug,
} from '../types.js';

export type MakeKind = 'page' | 'deck' | 'gif' | 'story' | 'experience' | 'motion';

export const MAKE_KINDS: MakeKind[] = ['page', 'deck', 'gif', 'story', 'experience', 'motion'];

export function isMakeKind(value: string): value is MakeKind {
  return (MAKE_KINDS as string[]).includes(value);
}

export interface MakeInput {
  kind: MakeKind;
  style: StyleSlug;
  /** One sentence describing the subject or goal. */
  idea: string;
  /** Microcopy language; defaults to Spanish. */
  locale?: Locale;
  /** File path or folder. Defaults to a deterministic beauty-output path. */
  output?: string;
}

export interface MakeIssue {
  severity: 'error' | 'warn' | 'info';
  code: string;
  message: string;
  fix?: string;
}

export interface MakeVisionCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface MakeResult {
  kind: MakeKind;
  style: StyleSlug;
  locale: Locale;
  path: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: MakeIssue[];
  vision: { score: number; checks: MakeVisionCheck[] };
  summary: string;
  next_step: string;
}

export type Localized<T> = Record<Locale, T>;

export interface ScaffoldPoint {
  title: string;
  body: string;
}

export interface ScaffoldStat {
  value: string;
  label: string;
}

export interface ScaffoldChapter {
  title: string;
  detail: string;
}

export interface ScaffoldRoom {
  title: string;
  body: string;
}

export interface ScaffoldItem {
  label: string;
  value: string;
  detail: string;
}

export interface ScaffoldQuote {
  text: string;
  author: string;
}

/**
 * Everything a weak model should never have to invent: one voice per style with
 * titles, details and wording already written in both languages.
 */
export interface StyleVoice {
  brand: Localized<string>;
  eyebrow: Localized<string>;
  intro: Localized<string>;
  sectionTitles: Localized<[string, string, string]>;
  quote: Localized<ScaffoldQuote>;
  cta: Localized<string>;
  chapterTitles: Localized<[string, string, string, string]>;
  details: Localized<[string, string, string, string]>;
  fact: Localized<string>;
  deckPoints: Localized<[ScaffoldPoint, ScaffoldPoint, ScaffoldPoint]>;
  deckStats: Localized<[ScaffoldStat, ScaffoldStat]>;
  roomTitles: Localized<[string, string, string, string]>;
  itemLabels: Localized<[string, string, string]>;
  gifSubtitle: Localized<string>;
  motionSubtitle: Localized<string>;
  motionScene: MotionScene;
  experienceKind: ExperienceKind;
  storyKind: NonNullable<StoryBrief['kind']>;
  gifTemplate: GifTemplate;
  /** Papercut storybook layouts look best with a printed chapter per spread. */
  storybook?: boolean;
}

export type ScaffoldSection = SectionBrief;
export type ScaffoldQuoteBrief = QuoteBrief;
