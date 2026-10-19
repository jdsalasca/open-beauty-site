import { narrativeCapabilityReport } from './narrative/capabilities.js';
import { ART_DIRECTION } from './styles/art-direction.js';
import type { PlanInput, PlanResult, PlanStoryboardItem, PlanSuggestedItem, PlanCapabilityCell } from './types/plan.js';

const JIRA_RE = /\b[A-Z][A-Z0-9]+-\d+\b/g;
const PR_RE = /\bPR\s*#?\d+\b|#\d+/gi;
const ENV_RE = /\b(prod(?:uction)?|staging|stage|dev(?:elopment)?|test|qa|uat|sandbox)\b/gi;
const METRIC_RE = /\b\d+(?:\.\d+)?\s*%|\b\d+\s*(?:users?|requests?|ms|seconds?|minutes?|hours?|days?)\b/gi;

const ARTICLES = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella', 'aquellos', 'aquellas',
  'a', 'an', 'the', 'this', 'that', 'these', 'those',
]);

const ACTION_PATTERNS: RegExp[] = [
  /detect\w*/i, /señal\w*/i, /rechaz\w*/i, /conserv\w*/i, /orden\w*/i, /agrup\w*/i, /gu[ií]\w*/i, /reintent\w*/i, /recuper\w*/i,
  /reject\w*/i, /preserv\w*/i, /keep\w*/i, /sort\w*/i, /group\w*/i, /guid\w*/i, /retry\w*/i, /recover\w*/i, /signal\w*/i, /point\w*/i,
];

const CLAIM_PATTERNS: RegExp[] = [
  /elimina\w*/i, /borra\w*/i, /limpia\s+autom[aá]ticamente/i, /soluciona\s+todos/i,
  /eliminat\w*/i, /delet\w*/i, /cleans?\s+automatically/i, /fixes?\s+all/i, /solves?\s+all/i,
];

function firstSentence(message: string): string {
  const trimmed = message.trim();
  const match = trimmed.match(/^[^.!?]+/);
  return (match ? match[0] : trimmed).trim() || trimmed;
}

function splitClauses(message: string): string[] {
  const normalized = message
    .replace(/ y luego /gi, '\n')
    .replace(/ and then /gi, '\n');
  return normalized
    .split(/[;.\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
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
  const claims = CLAIM_PATTERNS.map((pattern) => {
    const match = joined.match(pattern);
    return match ? match[0] : null;
  }).filter((value): value is string => Boolean(value));
  const uniqueClaims = Array.from(new Set(claims.map((value) => value.toLowerCase())));
  if (uniqueClaims.length) {
    warnings.push(`Content lint: action claims found (${uniqueClaims.join(', ')}). Actions are proposals, not guaranteed outcomes; do not promise automatic cleanup or total resolution.`);
  }
  return { jiraIds, prNumbers, environments, metrics, warnings };
}

function extractEntityCandidates(message: string): PlanSuggestedItem[] {
  const candidates: string[] = [];
  const seen = new Set<string>();
  const regex = /\b([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ-]*)/g;
  // article followed by noun: iterate tokens
  const MODIFIERS = new Set(['fully', 'completely', 'very', 'really', 'totally', 'duplicated', 'duplicada', 'completely']);
  const tokens = message.split(/(\s+)/);
  for (let i = 0; i < tokens.length - 2; i += 1) {
    const tokenI = tokens[i] ?? '';
    const word = tokenI.replace(/[^\wÁÉÍÓÚÜÑáéíóúüñ-]/g, '').toLowerCase();
    if (!ARTICLES.has(word)) continue;
    let k = i + 2;
    while (k < tokens.length) {
      const cand = (tokens[k] ?? '').replace(/[^\wÁÉÍÓÚÜÑáéíóúüñ-]/g, '').toLowerCase();
      if (!MODIFIERS.has(cand)) break;
      k += 2;
    }
    const tokenNext = tokens[k] ?? '';
    const next = tokenNext.replace(/[^\wÁÉÍÓÚÜÑáéíóúüñ-]/g, '');
    if (!next) continue;
    const isActionWord = ACTION_PATTERNS.some((pattern) => pattern.test(next));
    if (isActionWord) {
      const afterToken = (tokens[i + 4] ?? '').replace(/[^\wÁÉÍÓÚÜÑáéíóúüñ-]/g, '');
      const followedByVerb = /^(puede|pueden|es|son|tiene|tienen|debe|deben|va|van|será|serán|is|are|has|have|can|will|may|must)$/i.test(afterToken) ||
        ACTION_PATTERNS.some((pattern) => pattern.test(afterToken));
      if (!followedByVerb) continue;
    }
    const lower = next.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    candidates.push(next);
  }
  return candidates.map((label, index) => ({
    id: `entity-${index + 1}`,
    label,
    source: 'message',
    confirmed: false,
  }));
}

function extractActionCandidates(message: string): PlanSuggestedItem[] {
  const entityLabels = new Set(extractEntityCandidates(message).map((item) => item.label.toLowerCase()));
  const tokens = message.split(/(\s+)/);
  const seen = new Set<string>();
  const found: string[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const rawWord = tokens[i] ?? '';
    const word = rawWord.replace(/[^\wÁÉÍÓÚÜÑáéíóúüñ-]/g, '');
    if (!word) continue;
    if (!ACTION_PATTERNS.some((pattern) => pattern.test(word))) continue;
    if (entityLabels.has(word.toLowerCase())) continue;
    const lower = word.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    found.push(word);
  }
  return found.map((label, index) => ({
    id: `action-${index + 1}`,
    label,
    source: 'message',
    confirmed: false,
  }));
}

function isTooLong(clause: string): boolean {
  const words = clause.trim().split(/\s+/);
  return words.length > 7;
}

const STRUCTURE_PARTS: Record<PlanInput['format'], string[]> = {
  gif: ['Problema', 'Solución', 'Highlight'],
  deck: ['Portada', 'Problema', 'Solución', 'Ejemplo', 'Resultado', 'Próximos pasos'],
  web: ['Hero', 'Explicación', 'Comparación/proceso', 'CTA'],
};

export function planArtifact(input: PlanInput): PlanResult {
  const entities = input.entities ? [...input.entities] : [];
  const actions = input.actions ? [...input.actions] : [];
  const first = firstSentence(input.message);

  const suggestedEntities = extractEntityCandidates(input.message);
  const suggestedActions = extractActionCandidates(input.message);
  const suggested = { entities: suggestedEntities, actions: suggestedActions };

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
  const supportedPrimitives = Array.from(new Set(cells.filter((cell) => cell.status === 'supported').map((cell) => cell.primitive))).sort();
  const fallbackPrimitives = Array.from(new Set(cells.filter((cell) => cell.status === 'fallback').map((cell) => cell.primitive))).sort();
  const unsupportedAspects = Array.from(new Set(cells.filter((cell) => cell.status === 'unsupported').map((cell) => cell.aspect))).sort();
  const reasons = Array.from(new Set(cells.filter((cell) => cell.status !== 'supported').map((cell) => cell.reason)));
  const capabilities: PlanResult['capabilities'] = {
    format: input.format,
    style: input.style,
    formatSupport,
    status: formatSupport.status,
    reason: formatSupport.reason,
    supportedPrimitives,
    fallbackPrimitives,
    unsupportedAspects,
    reasons,
    primitives: input.verbose ? (cells as PlanCapabilityCell[]) : undefined,
    summary,
  };

  const clauses = splitClauses(input.message);
  const parts = STRUCTURE_PARTS[input.format];
  const storyboard: PlanStoryboardItem[] = parts.map((purpose, index) => {
    const clause = index < clauses.length ? (clauses[index] ?? null) : null;
    const item: PlanStoryboardItem = {
      id: input.format === 'gif' ? `scene-${index + 1}` : input.format === 'deck' ? `slide-${index + 1}` : `section-${index + 1}`,
      kind: input.format === 'gif' ? 'scene' : input.format === 'deck' ? 'slide' : 'section',
      purpose,
      draftText: clause,
      visual: entities.length ? entities[0]! : 'TODO: entity',
      entity: entities.length ? entities[0]! : 'TODO: entity',
      action: actions.length ? actions[0] : undefined,
      clauseIndex: index < clauses.length ? index : undefined,
      headlineSuggestion: null,
    };
    if (clause && isTooLong(clause)) {
      item.lengthNote = 'Clause exceeds the editorial guideline (headline 3-7 words, one short sentence). Split it into shorter clauses or write a separate short headline yourself; headlineSuggestion stays null (never auto-shortened).';
    } else {
      delete item.headlineSuggestion;
    }
    return item;
  });

  const lintTexts = [input.message, input.audience, input.purpose, ...entities, ...actions];
  const contentLint = lintContent(lintTexts);

  const warnings: string[] = [];
  warnings.push(...contentLint.warnings);
  if (input.style && ad.intent.limits.length) {
    warnings.push(`Style limits for ${input.style}: ${ad.intent.limits.join('; ')}.`);
  }
  if (!entities.length) warnings.push('No entities provided: the visual object is a TODO placeholder; add entities to avoid generic illustration.');
  if (!actions.length && input.format !== 'web') warnings.push('No actions provided: state transitions are unspecified; add actions to describe the change.');
  if (suggestedEntities.length && !entities.length) warnings.push('Suggested entities are unconfirmed proposals from the message; confirm or replace them before rendering.');
  if (suggestedActions.length && !actions.length) warnings.push('Suggested actions are unconfirmed proposals from the message; confirm or replace them before rendering.');

  const missing: string[] = [];
  const title = first.length <= 120 ? first : 'TODO: title (<=120 chars)';
  if (title.startsWith('TODO')) missing.push('title');
  const tagline = 'TODO: tagline (<=200 chars)';
  missing.push('tagline');
  const intro = 'TODO: intro (<=900 chars)';
  missing.push('intro');

  storyboard.forEach((item) => {
    if (item.draftText === null) {
      missing.push(`${item.id}.draftText: no clause provided for "${item.purpose}" (message has ${clauses.length} clause(s))`);
    }
  });

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
      suggestions: { entities: suggestedEntities.map((item) => ({ ...item, _unconfirmed: true })), actions: suggestedActions.map((item) => ({ ...item, _unconfirmed: true })) },
    };
    missing.push('cta.label', 'cta.href');
  } else if (input.format === 'deck') {
    brief = {
      style: input.style,
      title,
      tagline,
      slides: storyboard.slice(1).map((item) => ({ layout: 'statement', title: item.purpose, body: item.draftText })),
      locale: 'es',
      suggestions: { entities: suggestedEntities.map((item) => ({ ...item, _unconfirmed: true })), actions: suggestedActions.map((item) => ({ ...item, _unconfirmed: true })) },
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
      suggestions: { entities: suggestedEntities.map((item) => ({ ...item, _unconfirmed: true })), actions: suggestedActions.map((item) => ({ ...item, _unconfirmed: true })) },
    };
    missing.push('visual.kind', 'visual.state');
  }

  if (!entities.length) missing.push('entities');
  if (!actions.length) missing.push('actions');

  // headlineSuggestion TODO tracking
  storyboard.forEach((item) => {
    if (item.lengthNote) missing.push(`${item.id}.headline`);
  });

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
    suggested,
    suggestedEntities,
    suggestedActions,
    capabilities,
    artDirection: {
      intent: ad.intent.personality,
      suitableFor: ad.intent.suitableFor,
      limits: ad.intent.limits,
      adaptation: ad.adaptation[input.format === 'web' ? 'web' : input.format === 'deck' ? 'slides' : 'gif'].description,
    },
    storyboard,
    warnings,
    contentLint,
    textLengthGuidelines: [
      'Title <= 120 characters.',
      'Tagline <= 200 characters.',
      'Intro <= 900 characters.',
      'Page sections <= 6; each body <= 900 characters.',
      'Deck slides <= 8 content slides; slide title <= 120, body <= 300.',
      'GIF text <= 48 characters (legacy gif) and narrative labels <= 80.',
      'One idea per scene/slide/section; keep draft text to one line.',
    ],
    nextCommand,
    brief,
    missing,
    todo: missing.map((field) => `TODO: ${field}`),
  };
  return result;
}