import { createHash } from 'node:crypto';
import { z } from 'zod';
import { styleSlugs } from '../styles/presets.js';
import {
  NarrativeError,
  type NarrativeBriefInput,
  type NarrativeLocale,
  type NarrativeOutcomeMode,
  type NarrativeOutputPreset,
  type NormalizedNarrativeBrief,
} from '../types/narrative.js';
import { getNarrativeScene } from './scene.js';
import { normalizeSemanticPhases, narrativeSemanticSceneSchema } from './semantic.js';
import { upgradeLegacyNarrativePhases, type NarrativeUpgradeMetadata } from './legacy-upgrade.js';

const PRESET_SIZE: Record<NarrativeOutputPreset, [number, number]> = {
  'review-1280x720': [1280, 720],
  'card-640x360': [640, 360],
  'square-1080': [1080, 1080],
  'story-1080x1920': [1080, 1920],
};

const phaseSchema = z.object({
  id: z.string().trim().min(1).max(48).describe('Stable unique identifier for this phase.'),
  label: z.string().trim().min(1).max(80).describe('Short visible phase label; the final label is derived from outcome.mode.'),
  text: z.string().max(8_000).describe('Visible narrative copy for the phase.'),
  visual: z.object({
    kind: z.string().trim().min(1).max(64).describe('Must be declared for this style; query beauty_get_capabilities.'),
    state: z.string().trim().min(1).max(64).describe('Must be declared for this style; query beauty_get_capabilities.'),
    action: z.string().trim().min(1).max(64).optional().describe('Future or renderer-declared action; unknown actions fail validation.'),
    semantic: narrativeSemanticSceneSchema.optional().describe('Optional style-neutral entities, relations, per-phase states and actions.'),
  }).strict().describe('Visual composition state; validation happens before rendering.'),
  holdMs: z.number().finite().positive().optional().describe('Optional explicit hold in milliseconds; floor depends on playback.preset.'),
}).strict();

const evidenceRefSchema = z.object({
  id: z.string().trim().min(1).max(120).describe('Stable identifier for the evidence item.'),
  label: z.string().trim().min(1).max(200).describe('Human-readable name for the evidence item.'),
  source: z.string().trim().min(1).max(500).optional().describe('Path, URL, record or owner for locating the evidence.'),
  date: z.string().trim().min(1).max(80).optional().describe('Date or date range when the evidence was produced.'),
}).strict();

const outcomeSchema = z.object({
  mode: z.enum(['expected', 'observed']).describe('expected is an unmeasured benefit; observed requires evidence and an exclusion scope note.'),
  evidenceRefs: z.array(evidenceRefSchema).min(1).optional().describe('Identifiable evidence references required for observed mode.'),
  scopeNote: z.string().trim().min(1).max(500).optional().describe('For observed mode, explicitly say what the evidence does not claim.'),
}).strict().describe('Outcome evidence is separate from workflowStatus.');

export const narrativeBriefSchema = z.object({
  style: z.enum(styleSlugs).describe(`Narrative renderer style. Registered scenes: ${styleSlugs.join(', ')}.`),
  subfamily: z.enum(['editorial', 'documentary', 'poster']).optional().describe('papercraft: editorial; brutalist: documentary (default) or poster.'),
  kind: z.literal('narrative-gif').describe('Must be "narrative-gif".'),
  locale: z.enum(['es', 'en']).default('es').describe('Scene text locale; defaults to Spanish.'),
  audience: z.string().trim().min(1).max(120).describe('Who needs to understand the story.'),
  title: z.string().trim().min(1).max(160).describe('Shared title; keep it concise for the card layout.'),
  status: z.enum(['open', 'in-review', 'done']).optional().describe('Deprecated v1 alias for workflowStatus.'),
  workflowStatus: z.enum(['open', 'in-review', 'done']).optional().describe('Work status only; does not imply an observed outcome.'),
  outcome: outcomeSchema.optional().describe('Expected or observed result; observed requires evidenceRefs and a scopeNote naming excluded claims.'),
  illustrative: z.boolean().optional().describe('Mark synthetic or demonstration content; defaults to true for v1 migration.'),
  legacyArt: z.boolean().optional().describe('Keep the previous legacy illustration instead of upgrading a kind/state-only brief to semantic scene entities.'),
  badgePolicy: z.enum(['none', 'custom', 'workflow']).default('workflow').describe('none|custom|workflow; workflow preserves v1 stamps by default.'),
  badgeText: z.string().trim().min(1).max(64).optional().describe('Required only with badgePolicy=custom.'),
  phases: z.array(phaseSchema).min(3).max(5).describe('3–5 { id, label, text, visual: { kind, state, action? }, holdMs? } phases.'),
  playback: z.object({
    preset: z.enum(['readable', 'concise']).optional().describe('readable defaults to a 5000ms floor; concise allows 2000ms explicit holds.'),
    minReadableHoldMs: z.number().finite().positive().optional().describe('Minimum hold in milliseconds; cannot undercut the preset floor.'),
    transitionMs: z.number().finite().positive().default(650).describe('Transition duration in milliseconds; remains separate from holds.'),
    loop: z.boolean().default(true).describe('Adds a result-to-before bridge when enabled.'),
    totalDurationBudgetMs: z.number().finite().positive().optional().describe('Warning budget for complete decoded duration, including transitions and loop bridge.'),
  }).strict().default({ transitionMs: 650, loop: true }).describe('readable keeps the 5000ms floor; concise allows explicit holds from 2000ms. Durations are milliseconds.'),
  output: z.object({
    width: z.number().finite().int().positive().optional().describe('Pixel width; provide with height and choose a supported aspect.'),
    height: z.number().finite().int().positive().optional().describe('Pixel height; provide with width and choose a supported aspect.'),
    formats: z.array(z.enum(['gif', 'png'])).min(1).default(['gif', 'png']).describe('Both GIF and PNG are required by the narrative pack.'),
    preset: z.enum(['review-1280x720', 'card-640x360', 'square-1080', 'story-1080x1920']).default('review-1280x720').describe('Base dimensions; use capabilities to confirm the style supports its aspect.'),
  }).strict().default({ formats: ['gif', 'png'], preset: 'review-1280x720' }).describe('Width and height must use a renderer-supported aspect; output is not cropped or stretched.'),
  seed: z.number().finite().int().min(0).max(4_294_967_295).default(7).describe('Integer seed for deterministic scene variation; defaults to 7.'),
}).strict();

export const NARRATIVE_FIELD_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  Object.entries(narrativeBriefSchema.shape).map(([key, field]) => [key, field.description ?? 'See the narrative brief schema.']),
);

export function narrativeHelpOptions(): string[] {
  return [
    '  --style <s>        artdeco, bestiary, brutalist, galactic, isotype, memphis, nature, opart, papercraft, psychedelic, renaissance, ukiyoe or vaporwave',
    '  --brief <file>     Read the JSON narrative brief',
    '  --out <dir>        Output folder (GIF, PNG, contact sheet and manifest)',
    '  --art-only         Export a review copy without narrative title, labels or body text',
    '  --legacy-art       Keep the previous illustration for a legacy kind/state-only brief',
    '',
    '  JSON brief fields:',
    ...Object.keys(narrativeBriefSchema.shape).map((key) => `  ${key.padEnd(18)} ${NARRATIVE_FIELD_DESCRIPTIONS[key] ?? 'See the narrative brief schema.'}`),
  ];
}

export const NARRATIVE_BRIEF_EXAMPLE = `{
  "style": "papercraft",
  "subfamily": "editorial",
  "kind": "narrative-gif",
  "locale": "es",
  "audience": "Producto",
  "title": "Guías claras",
  "workflowStatus": "in-review",
  "outcome": { "mode": "expected" },
  "illustrative": true,
  "badgePolicy": "workflow",
  "phases": [
    { "id": "before", "label": "Antes", "text": "La medida llegaba sin aviso.", "visual": { "kind": "comparison", "state": "unreviewed" } },
    { "id": "change", "label": "Cambio", "text": "Ahora aparece una señal de revisión.", "visual": { "kind": "comparison", "state": "flagged" } },
    { "id": "result", "label": "Resultado esperado", "text": "Detectar el problema antes de publicar.", "visual": { "kind": "comparison", "state": "review-ready" } }
  ],
  "playback": { "preset": "readable", "transitionMs": 650, "loop": true },
  "output": { "width": 1280, "height": 720, "formats": ["gif", "png"], "preset": "review-1280x720" },
  "seed": 7
}`;

export type NarrativeBriefSchemaInput = z.input<typeof narrativeBriefSchema>;

export function narrativeResultLabelMatches(label: string, mode: NarrativeOutcomeMode, locale: NarrativeLocale): boolean {
  if (locale === 'en') {
    return mode === 'observed' ? /\bobserved\s+result\b/i.test(label) : /\bexpected\s+result\b/i.test(label);
  }
  return mode === 'observed' ? /\bresultado\s+observad[oa]\b/i.test(label) : /\bresultado\s+esperad[oa]\b/i.test(label);
}

function nonFinitePath(value: unknown, path = '$', visited = new WeakSet<object>()): string | undefined {
  if (typeof value === 'number' && !Number.isFinite(value)) return path;
  if (!value || typeof value !== 'object' || visited.has(value)) return undefined;
  visited.add(value);
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const result = nonFinitePath(value[index], `${path}[${index}]`, visited);
      if (result) return result;
    }
    return undefined;
  }
  for (const [key, child] of Object.entries(value)) {
    const result = nonFinitePath(child, `${path}.${key}`, visited);
    if (result) return result;
  }
  return undefined;
}

function fail(code: ConstructorParameters<typeof NarrativeError>[0], message: string, suggestion: string, field?: string, details?: ConstructorParameters<typeof NarrativeError>[4]): never {
  throw new NarrativeError(code, message, suggestion, field, details);
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function assertAllowedAspect(width: number, height: number): void {
  const ratio = width / height;
  const supported = [16 / 9, 1, 9 / 16].some((target) => Math.abs(ratio - target) / target < 0.015);
  if (!supported) {
    fail('UNSUPPORTED_ASPECT', `Output ${width}×${height} has unsupported aspect ${ratio.toFixed(3)}. Supported ratios are 16:9, 1:1 and 9:16.`, 'Choose one supported aspect ratio; dimensions are not cropped or distorted.', 'output');
  }
}

export interface ParsedNarrativeBrief {
  brief: NormalizedNarrativeBrief;
  hash: string;
  outputHash: string;
  upgrade: NarrativeUpgradeMetadata;
}

export interface ContentSource<TPayload> {
  read(): TPayload | Promise<TPayload>;
}

export type ContentSourceAdapter<TPayload> = (payload: TPayload) => NarrativeBriefInput | unknown | Promise<NarrativeBriefInput | unknown>;

export function normalizeNarrativeBrief(input: unknown): ParsedNarrativeBrief {
  const invalidNumber = nonFinitePath(input);
  if (invalidNumber) {
    const isDuration = /^\$\.playback\.(minReadableHoldMs|transitionMs|totalDurationBudgetMs)$|^\$\.phases\[\d+\]\.holdMs$/u.test(invalidNumber);
    fail(isDuration ? 'BAD_DURATION' : 'NOT_FINITE', `${invalidNumber} must be a finite number; NaN and Infinity are not accepted.`, 'Provide a finite numeric millisecond value.', invalidNumber);
  }

  if (input && typeof input === 'object') {
    const candidate = input as Record<string, unknown>;
    for (const field of ['status', 'workflowStatus'] as const) {
      const status = candidate[field];
      if (status !== undefined && !['open', 'in-review', 'done'].includes(String(status))) {
        fail('INVALID_STATE', `${field} must be open, in-review or done; received ${String(status)}.`, 'Set the work status that is supported by evidence.', field);
      }
    }
    if (Array.isArray(candidate.phases)) {
      candidate.phases.forEach((value, index) => {
        const phaseText = value && typeof value === 'object' ? (value as { text?: unknown }).text : undefined;
        if (typeof phaseText === 'string' && !phaseText.trim()) {
          fail('EMPTY_PHASE', `phases[${index}].text is empty.`, 'Add the phase fact or remove the phase while keeping 3–5 meaningful phases.', `phases[${index}].text`);
        }
      });
    }
    if (candidate.playback && typeof candidate.playback === 'object') {
      const playback = candidate.playback as Record<string, unknown>;
      for (const key of ['minReadableHoldMs', 'transitionMs', 'totalDurationBudgetMs'] as const) {
        const duration = playback[key];
        if (typeof duration === 'string') {
          fail('BAD_DURATION', `${key} must be a number of milliseconds, not "${duration}".`, 'Provide a positive numeric millisecond value, for example 7000.', `playback.${key}`);
        }
        if (typeof duration === 'number' && Number.isFinite(duration) && duration <= 0) {
          fail('BAD_DURATION', `${key} uses milliseconds and must be greater than 0; received ${duration}ms.`, 'Provide a positive millisecond duration.', `playback.${key}`);
        }
      }
    }
    if (Array.isArray(candidate.phases)) {
      candidate.phases.forEach((phase, index) => {
        const holdMs = phase && typeof phase === 'object' ? (phase as { holdMs?: unknown }).holdMs : undefined;
        if (typeof holdMs === 'string') {
          fail('BAD_DURATION', `phases[${index}].holdMs must be a number of milliseconds, not "${holdMs}".`, 'Provide a finite numeric millisecond value, for example 2000.', `phases[${index}].holdMs`);
        }
        if (typeof holdMs === 'number' && Number.isFinite(holdMs) && holdMs <= 0) {
          fail('BAD_DURATION', `phases[${index}].holdMs uses milliseconds and must be greater than 0; received ${holdMs}ms.`, 'Provide a positive numeric millisecond duration.', `phases[${index}].holdMs`);
        }
      });
    }
    if (candidate.output && typeof candidate.output === 'object') {
      const output = candidate.output as Record<string, unknown>;
      for (const key of ['width', 'height'] as const) {
        const dimension = output[key];
        if (typeof dimension === 'string') {
          fail('IMPOSSIBLE_SIZE', `output.${key} must be a number of pixels, not "${dimension}".`, 'Provide positive integer pixel dimensions without units.', `output.${key}`);
        }
        if (typeof dimension === 'number' && Number.isFinite(dimension) && dimension <= 0) {
          fail('IMPOSSIBLE_SIZE', `output.${key} must be positive pixels; received ${dimension}.`, 'Provide a positive integer pixel dimension within 320–4096.', `output.${key}`);
        }
      }
    }
  }

  const parsed = narrativeBriefSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path.join('.') || 'brief';
    if ((field.startsWith('playback.') || /^phases\.\d+\.holdMs$/u.test(field)) && issue?.code === 'invalid_type') {
      fail('BAD_DURATION', `${field} must be a numeric duration in milliseconds.`, 'Provide a finite positive number of milliseconds, for example 7000.', field);
    }
    if (field === 'output.width' || field === 'output.height') {
      fail('IMPOSSIBLE_SIZE', `${field} must be a positive integer pixel dimension.`, 'Provide positive integer pixel dimensions without units, within 320–4096.', field);
    }
    fail('INVALID_STATE', `${field}: ${issue?.message ?? 'brief does not match the narrative contract.'}`, 'Correct the named field and retry.', field);
  }
  const value = parsed.data;
  if (!styleSlugs.includes(value.style)) fail('INVALID_STATE', `Unknown style "${value.style}".`, `Choose one of: ${styleSlugs.join(', ')}.`, 'style');
  if (value.status && value.workflowStatus && value.status !== value.workflowStatus) {
    fail('INVALID_STATE', `status (${value.status}) conflicts with workflowStatus (${value.workflowStatus}).`, 'Use workflowStatus as the single source of work status; status remains a deprecated alias.', 'workflowStatus');
  }
  const workflowStatus = value.workflowStatus ?? value.status;
  if (!workflowStatus) fail('INVALID_STATE', 'workflowStatus is required (or use deprecated status for a v1 brief).', 'Set workflowStatus to open, in-review, or done.', 'workflowStatus');
  const scene = getNarrativeScene(value.style);
  const vocabulary = scene.vocabulary;
  if (!vocabulary) fail('INVALID_STATE', `Scene ${value.style} has no declared narrative vocabulary.`, 'Add a scene vocabulary declaration before rendering this style.', 'style');

  const checkDeclaredValue = (phase: typeof value.phases[number], phaseIndex: number, field: 'kind' | 'state' | 'action', declarations: typeof vocabulary.visualKinds): void => {
    const property = field === 'kind' ? 'visual.kind' : field === 'state' ? 'visual.state' : 'visual.action';
    const valueToCheck = phase.visual[field];
    if (valueToCheck === undefined) return;
    if (declarations.some((declaration) => declaration.value === valueToCheck)) return;
    const code = field === 'kind' ? 'UNSUPPORTED_VISUAL_KIND' : field === 'state' ? 'UNSUPPORTED_STATE' : 'UNSUPPORTED_ACTION';
    const validAlternatives = declarations.map((declaration) => declaration.value);
    fail(
      code,
      `${property} "${valueToCheck}" is not declared by style ${value.style} in phase ${phaseIndex}.`,
      `Choose a declared ${field}: ${validAlternatives.join(', ') || '(none declared)'}.`,
      `phases[${phaseIndex}].${property}`,
      { phaseIndex, style: value.style, value: valueToCheck, validAlternatives },
    );
  };
  for (const [phaseIndex, phase] of value.phases.entries()) {
    checkDeclaredValue(phase, phaseIndex, 'kind', vocabulary.visualKinds);
    checkDeclaredValue(phase, phaseIndex, 'state', vocabulary.states);
    checkDeclaredValue(phase, phaseIndex, 'action', vocabulary.actions);
  }

  const playbackPreset = value.playback.preset ?? 'readable';
  const holdFloorMs = playbackPreset === 'readable' ? 5_000 : 2_000;
  const minReadableHoldMs = value.playback.minReadableHoldMs ?? holdFloorMs;
  if (minReadableHoldMs < holdFloorMs) {
    fail('BAD_DURATION', `playback.minReadableHoldMs is ${minReadableHoldMs}ms; the ${playbackPreset} floor is ${holdFloorMs}ms.`, `Use at least ${holdFloorMs}ms for the ${playbackPreset} preset.`, 'playback.minReadableHoldMs');
  }
  for (const [phaseIndex, phase] of value.phases.entries()) {
    if (phase.holdMs !== undefined && phase.holdMs < holdFloorMs) {
      fail('BAD_DURATION', `phases[${phaseIndex}].holdMs is ${phase.holdMs}ms; the ${playbackPreset} floor is ${holdFloorMs}ms.`, `Use at least ${holdFloorMs}ms or omit holdMs to use the preset.`, `phases[${phaseIndex}].holdMs`);
    }
    if (phase.holdMs !== undefined && phase.holdMs > 655_350) {
      fail('BAD_DURATION', `phases[${phaseIndex}].holdMs exceeds the GIF delay limit of 655350ms.`, 'Shorten this hold; a GIF single-frame delay cannot exceed 655350ms.', `phases[${phaseIndex}].holdMs`);
    }
  }
  const totalDurationBudgetMs = value.playback.totalDurationBudgetMs ?? 30_000;
  const transitionMs = value.playback.transitionMs;
  const loop = value.playback.loop;
  const allowedSubfamilies = value.style === 'papercraft'
    ? ['editorial']
    : value.style === 'brutalist'
      ? ['documentary', 'poster']
      : undefined;
  if (value.subfamily && allowedSubfamilies && !allowedSubfamilies.includes(value.subfamily)) {
    fail('INVALID_STATE', `Subfamily "${value.subfamily}" is not available for ${value.style}.`, `Use one of: ${allowedSubfamilies.join(', ')}.`, 'subfamily');
  }
  if (value.phases.some((phase) => !phase.text.trim())) {
    const index = value.phases.findIndex((phase) => !phase.text.trim());
    fail('EMPTY_PHASE', `phases[${index}].text is empty.`, 'Add the phase fact or remove the phase while keeping 3–5 meaningful phases.', `phases[${index}].text`);
  }
  if (new Set(value.phases.map((phase) => phase.id)).size !== value.phases.length) {
    fail('INVALID_STATE', 'Phase ids must be unique.', 'Give each phase a distinct id.', 'phases');
  }
  const outcome = value.outcome ?? { mode: 'expected' as const };
  const evidenceRefs = outcome.evidenceRefs ?? [];
  if (outcome.mode === 'observed' && evidenceRefs.length === 0) {
    fail('INVALID_STATE', 'outcome.mode=observed requires at least one identifiable evidenceRef.', 'Add evidenceRefs with a stable id and label, or set outcome.mode to expected.', 'outcome.evidenceRefs');
  }
  if (outcome.mode === 'observed' && !outcome.scopeNote?.trim()) {
    fail('INVALID_STATE', 'outcome.mode=observed requires scopeNote to state what is not claimed.', 'Explain what the evidence does not establish, such as deployment, measurement, or user impact.', 'outcome.scopeNote');
  }
  if (outcome.mode === 'observed' && !/\b(?:no|not|without|does not|doesn't|cannot|can't|sin|no se|no implica|no demuestra|no mide|no incluye|no cubre|no permite)\b/iu.test(outcome.scopeNote ?? '')) {
    fail('INVALID_STATE', 'outcome.scopeNote must explicitly name an excluded claim using a negation (for example, no deployment, no measurement, or no user-impact claim).', 'State what the evidence does not establish.', 'outcome.scopeNote');
  }
  const illustrative = value.illustrative ?? true;
  if (outcome.mode === 'observed' && illustrative) {
    fail('INVALID_STATE', 'An observed outcome with evidence cannot also be declared illustrative.', 'Set illustrative to false for an evidence-backed observed outcome.', 'illustrative');
  }
  if (value.badgePolicy === 'custom' && !value.badgeText) {
    fail('INVALID_STATE', 'badgePolicy=custom requires badgeText.', 'Provide a short badgeText value or choose badgePolicy=workflow|none.', 'badgeText');
  }
  if (value.badgePolicy !== 'custom' && value.badgeText !== undefined) {
    fail('INVALID_STATE', 'badgeText is only valid with badgePolicy=custom.', 'Set badgePolicy=custom or remove badgeText.', 'badgeText');
  }
  if (minReadableHoldMs > 655_350 || transitionMs > 120_000 || totalDurationBudgetMs > 600_000) {
    fail('BAD_DURATION', 'Durations use milliseconds: holds must be at most 655350ms, transitions at most 120000ms, and the total budget at most 600000ms.', 'Shorten the requested duration or budget.', 'playback');
  }
  if (!value.output.formats.includes('gif') || !value.output.formats.includes('png')) {
    fail('INVALID_STATE', 'Narrative output requires both gif and png formats; the contact sheet is generated as a separate PNG.', 'Set output.formats to ["gif", "png"].', 'output.formats');
  }
  if ((value.output.width === undefined) !== (value.output.height === undefined)) {
    fail('IMPOSSIBLE_SIZE', 'Specify output.width and output.height together, or omit both to use the selected preset.', 'Provide both dimensions without relying on an inferred crop.', 'output');
  }

  const [presetWidth, presetHeight] = PRESET_SIZE[value.output.preset];
  const width = value.output.width ?? presetWidth;
  const height = value.output.height ?? presetHeight;
  if (width < 320 || height < 320 || width > 4096 || height > 4096) {
    fail('IMPOSSIBLE_SIZE', `Output ${width}×${height} is outside the supported 320–4096px dimension range.`, 'Choose a supported output preset or explicit dimensions within the range.', 'output');
  }
  if (width * height > 4_194_304) {
    fail('RESOURCE_LIMIT', `Output ${width}×${height} uses ${width * height} pixels; the per-frame budget is 4194304 pixels.`, 'Choose a smaller size; the renderer will not silently scale it down.', 'output');
  }
  assertAllowedAspect(width, height);

  const expectedLabel = value.locale === 'en' ? 'Expected result' : 'Resultado esperado';
  const observedLabel = value.locale === 'en' ? 'Observed result' : 'Resultado observado';
  const legacyUpgrade = upgradeLegacyNarrativePhases(value.phases, value.style, value.locale, value.legacyArt === true);
  const phases = normalizeSemanticPhases(legacyUpgrade.phases.map((phase) => ({ ...phase, text: phase.text.trim() })), illustrative, value.style);
  phases[phases.length - 1]!.label = outcome.mode === 'observed' ? observedLabel : expectedLabel;
  const brief: NormalizedNarrativeBrief = {
    ...value,
    status: workflowStatus,
    workflowStatus,
    outcome,
    illustrative,
    ...(value.legacyArt === true ? { legacyArt: true } : {}),
    badgePolicy: value.badgePolicy,
    ...(value.style === 'papercraft' ? { subfamily: value.subfamily ?? 'editorial' } : {}),
    ...(value.style === 'brutalist' ? { subfamily: value.subfamily ?? 'documentary' } : {}),
    phases,
    playback: {
      preset: playbackPreset,
      minReadableHoldMs,
      transitionMs,
      loop,
      totalDurationBudgetMs,
    },
    output: { ...value.output, width, height, formats: [...value.output.formats] },
    seed: value.seed,
  } as NormalizedNarrativeBrief;
  const hash = createHash('sha256').update(stableJson(brief)).digest('hex');
  const renderProjection = {
    style: brief.style,
    ...(brief.subfamily ? { subfamily: brief.subfamily } : {}),
    kind: brief.kind,
    locale: brief.locale,
    audience: brief.audience,
    title: brief.title,
    status: brief.workflowStatus,
    phases: brief.phases.map((phase) => ({
      id: phase.id,
      label: phase.label,
      text: phase.text,
      visual: phase.visual.semantic.primitive === 'legacy-illustration'
        ? { kind: phase.visual.kind, state: phase.visual.state, ...(phase.visual.action ? { action: phase.visual.action } : {}) }
        : phase.visual,
      ...(phase.holdMs === undefined ? {} : { holdMs: phase.holdMs }),
    })),
    playback: {
      minReadableHoldMs,
      transitionMs,
      loop,
      ...(playbackPreset === 'concise' ? { preset: playbackPreset } : {}),
    },
    output: brief.output,
    seed: brief.seed,
    ...(brief.badgePolicy === 'workflow' ? {} : { badgePolicy: brief.badgePolicy, ...(brief.badgeText ? { badgeText: brief.badgeText } : {}) }),
  };
  const outputHash = createHash('sha256').update(stableJson(renderProjection)).digest('hex');
  return { brief, hash, outputHash, upgrade: legacyUpgrade.upgrade };
}

export function parseNarrativeBrief(input: NarrativeBriefInput | unknown): ParsedNarrativeBrief {
  return normalizeNarrativeBrief(input);
}

/** Adapter seam for external systems. The core has no Jira or ticket-client dependency. */
export async function normalizeContentSource<TPayload>(source: ContentSource<TPayload>, adapter: ContentSourceAdapter<TPayload>): Promise<ParsedNarrativeBrief> {
  return normalizeNarrativeBrief(await adapter(await source.read()));
}

export function narrativePresetSize(preset: NarrativeOutputPreset): [number, number] {
  return [...PRESET_SIZE[preset]];
}
