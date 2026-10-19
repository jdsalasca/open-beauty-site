import { narrativeCapabilityReport } from './narrative/capabilities.js';
import { ART_DIRECTION } from './styles/art-direction.js';
import type { PlanInput, PlanResult, PlanStoryboardItem } from './types/plan.js';

const JIRA_RE = /\b[A-Z][A-Z0-9]+-\d+\b/g;
const PR_RE = /\bPR\s*#?\d+\b|#\d+/gi;
const ENV_RE = /\b(prod(?:uction)?|staging|stage|dev(?:elopment)?|test|qa|uat|sandbox)\b/gi;
const METRIC_RE = /\b\d+(?:\.\d+)?\s*%|\b\d+\s*(?:users?|requests?|ms|seconds?|minutes?|hours?|days?)\b/gi;

function firstSentence(message: string): string {
  const trimmed = message.trim();
  const match = trimmed.match(/^[^.!?]+/);
  return (match ? match[0] : trimmed).trim() || trimmed;
}

function truncate(value: string, limit: number): string {
  return value.length <= limit ? value : value.slice(0, limit);
}

function lintContent(texts: string[]): PlanResult['contentLint'] {
  const joined = texts.join('\n');
  const jiraIds = Array.from(new Set(joined.match(JIRA_RE) ?? []));
  const prNumbers = Array.from(new Set((joined.match(PR_RE) ?? []).map((value) => value.trim())));
  const environments = Array.from(new Set((joined.match(ENV_RE) ?? []).map((value) => value.toLowerCase())));
  const metrics = Array.from(new Set(joined.match(METRIC_RE) ?? []));
  const warnings: string[] = [];
  if (jiraIds.length) warnings.push(`Content lint: possible Jira ids found (${jiraIds.join(', ')}). Remove internal ticket ids from user-facing copy.`);
  if (prNumbers.length) warnings.push(`Content lint: possible PR references found (${prNumbers.join(', ')}). Remove pull request numbers from user-facing copy.`);
  if (environments.length) warnings.push(`Content lint: environment-like words found (${environments.join(', ')}). Remove internal environment names unless they are part of the message.`);
  if (metrics.length) warnings.push(`Content lint: possible invented metrics found (${metrics.join(', ')}). Only state measured results with evidence.`);
  return { jiraIds, prNumbers, environments, metrics, warnings };
}

function storyboardFor(input: PlanInput, first: string, entity: string, action: string): PlanStoryboardItem[] {
  if (input.format === 'gif') {
    return [
      { id: 'scene-1', kind: 'scene', purpose: 'Problema', text: first, draftText: first, visual: entity, entity },
      { id: 'scene-2', kind: 'scene', purpose: 'Cambio', text: first, draftText: first, visual: entity, entity, action },
      { id: 'scene-3', kind: 'scene', purpose: 'Resultado', text: first, draftText: first, visual: entity, entity },
    ];
  }
  if (input.format === 'deck') {
    const items: PlanStoryboardItem[] = [
      { id: 'slide-1', kind: 'slide', purpose: 'Portada', text: first, draftText: first, visual: entity, entity },
      { id: 'slide-2', kind: 'slide', purpose: 'Problema', text: first, draftText: first, visual: entity, entity },
      { id: 'slide-3', kind: 'slide', purpose: 'Solución', text: first, draftText: first, visual: entity, entity, action },
      { id: 'slide-4', kind: 'slide', purpose: 'Ejemplo', text: first, draftText: first, visual: entity, entity },
      { id: 'slide-5', kind: 'slide', purpose: 'Resultado', text: first, draftText: first, visual: entity, entity },
      { id: 'slide-6', kind: 'slide', purpose: 'Próximos pasos', text: first, draftText: first, visual: entity, entity },
    ];
    return items;
  }
  return [
    { id: 'section-1', kind: 'section', purpose: 'Problema', text: first, draftText: first, visual: entity, entity },
    { id: 'section-2', kind: 'section', purpose: 'Solución', text: first, draftText: first, visual: entity, entity, action },
    { id: 'section-3', kind: 'section', purpose: 'Ejemplo', text: first, draftText: first, visual: entity, entity },
    { id: 'section-4', kind: 'section', purpose: 'Próximos pasos', text: first, draftText: first, visual: entity, entity },
  ];
}

export function planArtifact(input: PlanInput): PlanResult {
  const entities = input.entities ?? [];
  const actions = input.actions ?? [];
  const first = firstSentence(input.message);
  const entity = entities[0] ?? 'TODO: entity';
  const action = actions[0] ?? 'TODO: action';

  const report = narrativeCapabilityReport({ style: input.style as any });
  const ad = ART_DIRECTION[input.style as keyof typeof ART_DIRECTION];
  const cells = report.cells.map((cell) => ({
    primitive: cell.primitive,
    aspect: cell.aspect,
    locale: cell.locale,
    status: cell.status,
    reason: cell.reason,
  }));
  const summary = report.summary;

  const formatSupport = {
    status: 'supported' as const,
    reason: ad.adaptation[input.format === 'web' ? 'web' : input.format === 'deck' ? 'slides' : 'gif'].description,
  };
  const capabilities: PlanResult['capabilities'] = {
    format: input.format,
    style: input.style,
    formatSupport,
    status: formatSupport.status,
    reason: formatSupport.reason,
    primitives: cells,
    summary,
  };

  const storyboard = storyboardFor(input, first, entity, action).map((item) => ({
    ...item,
    visual: entities.length ? entities[0] : (item.visual ?? 'TODO: entity'),
    entity: entities.length ? entities[0] : (item.entity ?? 'TODO: entity'),
    action: actions.length ? actions[0] : item.action,
    text: truncate(item.text ?? first, 160),
    draftText: truncate(item.draftText ?? first, 160),
  })) as PlanStoryboardItem[];

  const lintTexts = [input.message, input.audience, input.purpose, ...entities, ...actions];
  const contentLint = lintContent(lintTexts);

  const warnings: string[] = [];
  warnings.push(...contentLint.warnings);
  if (input.style && ad.intent.limits.length) {
    warnings.push(`Style limits for ${input.style}: ${ad.intent.limits.join('; ')}.`);
  }
  if (!entities.length) warnings.push('No entities provided: the visual object is a TODO placeholder; add entities to avoid generic illustration.');
  if (!actions.length && input.format !== 'web') warnings.push('No actions provided: state transitions are unspecified; add actions to describe the change.');

  const textLengthGuidelines = [
    'Title <= 120 characters.',
    'Tagline <= 200 characters.',
    'Intro <= 900 characters.',
    'Page sections <= 6; each body <= 900 characters.',
    'Deck slides <= 8 content slides; slide title <= 120, body <= 300.',
    'GIF text <= 48 characters (legacy gif) and narrative labels <= 80.',
    'One idea per scene/slide/section; keep draft text to one line.',
  ];

  const missing: string[] = [];
  const title = first.length <= 120 ? first : 'TODO: title (<=120 chars)';
  if (title.startsWith('TODO')) missing.push('title');
  const tagline = 'TODO: tagline (<=200 chars)';
  missing.push('tagline');
  const intro = 'TODO: intro (<=900 chars)';
  missing.push('intro');

  let brief: Record<string, unknown>;
  if (input.format === 'web') {
    brief = {
      style: input.style,
      title,
      tagline,
      intro,
      sections: storyboard.map((item) => ({ title: item.purpose, body: item.draftText })),
      cta: { label: 'TODO: cta label', href: 'TODO: cta href' },
      locale: 'es',
    };
    missing.push('cta.label', 'cta.href');
  } else if (input.format === 'deck') {
    brief = {
      style: input.style,
      title,
      tagline,
      slides: storyboard.slice(1).map((item) => ({ layout: 'statement', title: item.purpose, body: item.draftText })),
      locale: 'es',
    };
    missing.push('tagline');
  } else {
    brief = {
      style: input.style,
      brief: {
        style: input.style,
        kind: 'narrative-gif',
        locale: 'es',
        audience: input.audience,
        title,
        workflowStatus: 'in-review',
        outcome: { mode: 'expected' },
        illustrative: true,
        phases: storyboard.map((item, index) => ({
          id: index === 0 ? 'before' : index === 1 ? 'change' : 'result',
          label: item.purpose,
          text: item.draftText,
          visual: { kind: 'TODO: comparison|checklist', state: 'TODO: unreviewed|flagged|review-ready' },
        })),
      },
    };
    missing.push('visual.kind', 'visual.state');
  }

  if (!entities.length) missing.push('entities');
  if (!actions.length) missing.push('actions');

  const nextCommand =
    input.format === 'web'
      ? `beauty page --style ${input.style} --brief plan.json --out out/${input.style}.html`
      : input.format === 'deck'
        ? `beauty deck --style ${input.style} --brief plan.json --out out/${input.style}-deck.html`
        : `beauty narrative --style ${input.style} --brief plan.json --out out/${input.style}`;

  const result: PlanResult = {
    format: input.format,
    style: input.style,
    audience: input.audience,
    purpose: input.purpose,
    message: input.message,
    entities,
    actions,
    capabilities,
    capabilityCheck: capabilities,
    artDirection: {
      intent: ad.intent.personality,
      suitableFor: ad.intent.suitableFor,
      limits: ad.intent.limits,
      adaptation: ad.adaptation[input.format === 'web' ? 'web' : input.format === 'deck' ? 'slides' : 'gif'].description,
    },
    storyboard,
    warnings,
    contentLint,
    textLengthGuidelines,
    recommendedNextCommand: nextCommand,
    nextCommand,
    command: nextCommand,
    brief,
    briefSkeleton: brief,
    skeleton: brief,
    missing,
    todo: missing.map((field) => `TODO: ${field}`),
  };
  return result;
}
