import type { QuoteBrief, StyleSlug } from '../types.js';
import type { SprintMetric } from '../types.js';
import {
  SprintBriefError,
  sprintBriefSchema,
  sprintIssuesFromError,
  unknownSprintFields,
  type SprintStoryStatus,
} from '../types/sprint.js';

export interface SprintTeam {
  name: string;
  brand?: string;
}

export interface SprintInfo {
  id: string;
  start?: string;
  end?: string;
  goal?: string;
}

export interface SprintStory {
  id?: string;
  title: string;
  points?: number;
  status: SprintStoryStatus;
  owner?: string;
}

export interface SprintVelocity {
  sprint: string;
  committed: number;
  done: number;
}

export interface SprintBurndown {
  day: string;
  remaining: number;
}

export interface SprintRisk {
  title: string;
  impact?: string;
  mitigation?: string;
  owner?: string;
}

export interface SprintRetroAction {
  what: string;
  owner?: string;
  due?: string;
}

export interface SprintRetro {
  wentWell: string[];
  toImprove: string[];
  actions: SprintRetroAction[];
}

export interface SprintCapacity {
  person: string;
  days: number;
  focus?: string;
}

export interface SprintData {
  style: StyleSlug;
  locale: 'es' | 'en';
  maxxing: boolean;
  subfamily?: string;
  team: SprintTeam;
  sprint: SprintInfo;
  date?: string;
  summary?: string;
  metrics: SprintMetric[];
  highlights: string[];
  blockers: string[];
  next: string[];
  quote?: QuoteBrief;
  stories: SprintStory[];
  velocity: SprintVelocity[];
  burndown: SprintBurndown[];
  risks: SprintRisk[];
  retro: SprintRetro;
  capacity: SprintCapacity[];
  nextGoal?: string;
  /** Output folder carried inside the brief (MCP convenience). */
  output?: string;
}

export interface ParsedSprintBrief {
  data: SprintData;
  warnings: string[];
}

const DEFAULT_TEAM = 'Open Beauty';
const VELOCITY_WINDOW = 5;

/**
 * Validate and normalise a sprint brief. Wrong types throw a
 * {@link SprintBriefError} with one line per field; unknown fields are
 * returned as warnings so nothing disappears silently.
 */
export function parseSprintBrief(raw: unknown): ParsedSprintBrief {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new SprintBriefError([{ path: '(root)', message: 'Expected an object with a sprint id and a style.' }]);
  }
  const warnings = unknownSprintFields(raw);
  const parsed = sprintBriefSchema.safeParse(raw);
  if (!parsed.success) {
    throw new SprintBriefError(sprintIssuesFromError(parsed.error));
  }
  const brief = parsed.data;

  if (!brief.style) {
    throw new SprintBriefError([
      {
        path: 'style',
        message: 'Expected a style slug (pass --style or include "style" in the brief).',
      },
    ]);
  }

  const sprint = typeof brief.sprint === 'string' ? { id: brief.sprint } : brief.sprint;
  const team =
    typeof brief.team === 'string'
      ? { name: brief.team }
      : brief.team ?? { name: DEFAULT_TEAM };

  if (brief.velocity && brief.velocity.length > VELOCITY_WINDOW) {
    warnings.push(
      `velocity: only the last ${VELOCITY_WINDOW} sprints are used; ${brief.velocity.length - VELOCITY_WINDOW} older entries were ignored.`,
    );
  }

  const data: SprintData = {
    style: brief.style,
    locale: brief.locale ?? 'es',
    maxxing: brief.maxxing ?? false,
    subfamily: brief.subfamily,
    team,
    sprint,
    date: brief.date,
    summary: brief.summary,
    metrics: brief.metrics ?? [],
    highlights: brief.highlights ?? [],
    blockers: brief.blockers ?? [],
    next: brief.next ?? [],
    quote: brief.quote,
    stories: brief.stories ?? [],
    velocity: brief.velocity?.slice(-VELOCITY_WINDOW) ?? [],
    burndown: brief.burndown ?? [],
    risks: brief.risks ?? [],
    retro: {
      wentWell: brief.retro?.wentWell ?? [],
      toImprove: brief.retro?.toImprove ?? [],
      actions: brief.retro?.actions ?? [],
    },
    capacity: brief.capacity ?? [],
    nextGoal: brief.nextGoal,
    output: brief.output,
  };

  return { data, warnings };
}

export function sprintBrand(data: SprintData): string {
  return data.team.brand?.trim() || data.team.name;
}
