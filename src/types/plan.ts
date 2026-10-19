import { z } from 'zod';

export const PLAN_FORMATS = ['web', 'deck', 'gif'] as const;
export type PlanFormat = (typeof PLAN_FORMATS)[number];

export const STYLE_SLUGS = [
  'renaissance',
  'brutalist',
  'papercraft',
  'artdeco',
  'isotype',
  'opart',
  'ukiyoe',
  'bestiary',
  'psychedelic',
  'memphis',
  'vaporwave',
  'galactic',
  'nature',
] as const;

export const planInputSchema = z.object({
  format: z.enum(PLAN_FORMATS),
  style: z.enum(STYLE_SLUGS),
  audience: z.string().min(1).max(200),
  purpose: z.string().min(1).max(300),
  message: z.string().min(1).max(1000),
  entities: z.array(z.string().min(1).max(120)).max(12).optional(),
  actions: z.array(z.string().min(1).max(80)).max(12).optional(),
});

export type PlanInput = z.infer<typeof planInputSchema>;

export interface PlanStoryboardItem {
  id: string;
  kind: 'section' | 'slide' | 'scene';
  purpose: string;
  text: string;
  draftText: string;
  visual: string;
  entity: string;
  action?: string;
}

export interface PlanCapabilityCell {
  primitive: string;
  aspect: string;
  locale: string;
  status: 'supported' | 'fallback' | 'unsupported';
  reason: string;
}

export interface PlanCapabilityCheck {
  format: PlanFormat;
  style: string;
  formatSupport: {
    status: 'supported' | 'fallback' | 'unsupported';
    reason: string;
  };
  status: 'supported' | 'fallback' | 'unsupported';
  reason: string;
  primitives: PlanCapabilityCell[];
  summary: { supported: number; fallback: number; unsupported: number };
}

export interface PlanResult {
  format: PlanFormat;
  style: string;
  audience: string;
  purpose: string;
  message: string;
  entities: string[];
  actions: string[];
  capabilities: PlanCapabilityCheck;
  capabilityCheck: PlanCapabilityCheck;
  artDirection: {
    intent: string;
    suitableFor: string[];
    limits: string[];
    adaptation: string;
  };
  storyboard: PlanStoryboardItem[];
  warnings: string[];
  contentLint: {
    jiraIds: string[];
    prNumbers: string[];
    environments: string[];
    metrics: string[];
    warnings: string[];
  };
  textLengthGuidelines: string[];
  recommendedNextCommand: string;
  nextCommand: string;
  command: string;
  brief: Record<string, unknown>;
  briefSkeleton: Record<string, unknown>;
  skeleton: Record<string, unknown>;
  missing: string[];
  todo: string[];
}
