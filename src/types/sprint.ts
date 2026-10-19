import { z } from 'zod';
import { styleSlugs } from '../styles/presets.js';
import type { StyleSlug } from '../types.js';

/**
 * The sprint brief schema. It is deliberately permissive with legacy briefs
 * (a `sprint` string, a `team` string, metrics/highlights/blockers/next) and
 * strict with types: every wrong value fails with a field-level message, and
 * every unknown field produces a warning instead of being silently ignored.
 */

const text = (max: number) => z.string().min(1).max(max);
const optionalText = (max: number) => z.string().max(max).optional();

export const sprintStoryStatuses = ['done', 'carried', 'dropped'] as const;
export type SprintStoryStatus = (typeof sprintStoryStatuses)[number];

export const sprintTeamSchema = z.object({
  name: text(60),
  brand: optionalText(60),
});

export const sprintInfoSchema = z.object({
  id: text(40),
  start: optionalText(40),
  end: optionalText(40),
  goal: optionalText(240),
});

export const sprintStorySchema = z.object({
  id: optionalText(40),
  title: text(160),
  points: z.number().min(0).max(100).optional(),
  status: z.enum(sprintStoryStatuses, { error: 'Expected one of: done, carried, dropped.' }),
  owner: optionalText(60),
});

export const sprintVelocitySchema = z.object({
  sprint: text(40),
  committed: z.number().min(0),
  done: z.number().min(0),
});

export const sprintBurndownSchema = z.object({
  day: text(40),
  remaining: z.number().min(0),
});

export const sprintRiskSchema = z.object({
  title: text(160),
  impact: optionalText(200),
  mitigation: optionalText(200),
  owner: optionalText(60),
});

export const sprintRetroActionSchema = z.object({
  what: text(160),
  owner: optionalText(60),
  due: optionalText(40),
});

export const sprintRetroSchema = z.object({
  wentWell: z.array(text(160)).max(8).optional(),
  toImprove: z.array(text(160)).max(8).optional(),
  actions: z.array(sprintRetroActionSchema).max(12).optional(),
});

export const sprintCapacitySchema = z.object({
  person: text(60),
  days: z.number().min(0).max(60),
  focus: optionalText(80),
});

export const sprintMetricSchema = z.object({
  label: text(60),
  value: text(40),
});

export const sprintBriefSchema = z.object({
  style: z.enum(styleSlugs as [StyleSlug, ...StyleSlug[]]).optional(),
  locale: z.enum(['es', 'en']).optional(),
  maxxing: z.boolean().optional(),
  subfamily: optionalText(40),
  /** Rich form: { id, start, end, goal }. Legacy form: a string id. */
  sprint: z.union([text(40), sprintInfoSchema], {
    error: 'Expected a sprint id string or an object { id, start?, end?, goal? }.',
  }),
  /** Rich form: { name, brand? }. Legacy form: a team name string. */
  team: z
    .union([text(60), sprintTeamSchema], {
      error: 'Expected a team name string or an object { name, brand? }.',
    })
    .optional(),
  date: optionalText(40),
  summary: optionalText(240),
  metrics: z.array(sprintMetricSchema).max(6).optional(),
  highlights: z.array(text(160)).max(8).optional(),
  blockers: z.array(text(160)).max(8).optional(),
  next: z.array(text(160)).max(8).optional(),
  quote: z.object({ text: text(320), author: optionalText(90) }).optional(),
  stories: z.array(sprintStorySchema).max(40).optional(),
  velocity: z.array(sprintVelocitySchema).max(12).optional(),
  burndown: z.array(sprintBurndownSchema).max(40).optional(),
  risks: z.array(sprintRiskSchema).max(12).optional(),
  retro: sprintRetroSchema.optional(),
  capacity: z.array(sprintCapacitySchema).max(20).optional(),
  nextGoal: optionalText(240),
  /** Accepted when a whole MCP argument object is forwarded; the kit uses it as the output folder. */
  output: optionalText(260),
});

export type SprintBriefInput = z.infer<typeof sprintBriefSchema>;

export interface SprintFieldIssue {
  path: string;
  message: string;
}

/**
 * Flatten a zod error into field-level issues. Union branches are expanded so
 * the reader sees `stories.0.points: expected number, received string` instead
 * of a generic "Invalid input".
 */
export function sprintIssuesFromError(error: z.ZodError): SprintFieldIssue[] {
  const out: SprintFieldIssue[] = [];
  const seen = new Set<string>();
  const push = (path: (string | number | symbol)[], message: string): void => {
    const field = path.length ? path.map(String).join('.') : '(root)';
    const key = `${field}:${message}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ path: field, message });
  };
  const walk = (issue: z.core.$ZodIssue, base: (string | number | symbol)[]): void => {
    const branches = (issue as { errors?: z.core.$ZodIssue[][] }).errors;
    if (issue.code === 'invalid_union' && Array.isArray(branches)) {
      for (const branch of branches) {
        for (const sub of branch) walk(sub, [...base, ...issue.path]);
      }
      return;
    }
    push([...base, ...issue.path], issue.message);
  };
  for (const issue of error.issues) walk(issue, []);
  return out;
}

export class SprintBriefError extends Error {
  readonly code = 'SPRINT_BRIEF_INVALID';
  readonly issues: SprintFieldIssue[];

  constructor(issues: SprintFieldIssue[]) {
    super(`Invalid sprint brief:\n${issues.map((issue) => `  - ${issue.path}: ${issue.message}`).join('\n')}`);
    this.name = 'SprintBriefError';
    this.issues = issues;
  }
}

/* ------------------------------------------------------------------ */
/* Unknown-field detection                                             */
/* ------------------------------------------------------------------ */

type FieldShape = { [key: string]: FieldShape | null } | [FieldShape] | null;

const SPRINT_SHAPE: FieldShape = {
  style: null,
  locale: null,
  maxxing: null,
  subfamily: null,
  output: null,
  sprint: { id: null, start: null, end: null, goal: null },
  team: { name: null, brand: null },
  date: null,
  summary: null,
  metrics: [{ label: null, value: null }],
  highlights: null,
  blockers: null,
  next: null,
  quote: { text: null, author: null },
  stories: [{ id: null, title: null, points: null, status: null, owner: null }],
  velocity: [{ sprint: null, committed: null, done: null }],
  burndown: [{ day: null, remaining: null }],
  risks: [{ title: null, impact: null, mitigation: null, owner: null }],
  retro: {
    wentWell: null,
    toImprove: null,
    actions: [{ what: null, owner: null, due: null }],
  },
  capacity: [{ person: null, days: null, focus: null }],
  nextGoal: null,
};

function walkUnknown(value: unknown, shape: FieldShape, path: string, out: string[]): void {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    const itemShape = Array.isArray(shape) ? shape[0] : null;
    if (itemShape === null) return;
    for (let index = 0; index < value.length; index += 1) {
      walkUnknown(value[index], itemShape, `${path}.${index}`, out);
    }
    return;
  }
  if (shape === null || Array.isArray(shape)) return;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const childPath = path ? `${path}.${key}` : key;
    if (!Object.prototype.hasOwnProperty.call(shape, key)) {
      out.push(`Unknown field "${childPath}" was ignored.`);
    } else {
      walkUnknown(item, shape[key] ?? null, childPath, out);
    }
  }
}

/** Every field the schema does not recognise, as human-readable warnings. */
export function unknownSprintFields(raw: unknown): string[] {
  const out: string[] = [];
  walkUnknown(raw, SPRINT_SHAPE, '', out);
  return out;
}
