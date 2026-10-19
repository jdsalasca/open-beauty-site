import { createHash } from 'node:crypto';
import { z } from 'zod';
import { styleSlugs } from '../styles/presets.js';
import {
  NarrativeError,
  type NarrativeBriefInput,
  type NarrativeOutputPreset,
  type NormalizedNarrativeBrief,
} from '../types/narrative.js';

const PRESET_SIZE: Record<NarrativeOutputPreset, [number, number]> = {
  'review-1280x720': [1280, 720],
  'card-640x360': [640, 360],
  'square-1080': [1080, 1080],
  'story-1080x1920': [1080, 1920],
};

const phaseSchema = z.object({
  id: z.string().trim().min(1).max(48),
  label: z.string().trim().min(1).max(80),
  text: z.string().max(8_000),
  visual: z.object({ kind: z.string().trim().min(1).max(64), state: z.string().trim().min(1).max(64) }).strict(),
}).strict();

export const narrativeBriefSchema = z.object({
  style: z.enum(styleSlugs),
  subfamily: z.enum(['editorial', 'documentary', 'poster']).optional(),
  kind: z.literal('narrative-gif'),
  locale: z.enum(['es', 'en']).default('es'),
  audience: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(160),
  status: z.enum(['open', 'in-review', 'done']),
  phases: z.array(phaseSchema).min(3).max(5),
  playback: z.object({
    minReadableHoldMs: z.number().finite().positive().default(5_000),
    transitionMs: z.number().finite().positive().default(650),
    loop: z.boolean().default(true),
  }).strict().default({ minReadableHoldMs: 5_000, transitionMs: 650, loop: true }),
  output: z.object({
    width: z.number().finite().int().positive().optional(),
    height: z.number().finite().int().positive().optional(),
    formats: z.array(z.enum(['gif', 'png'])).min(1).default(['gif', 'png']),
    preset: z.enum(['review-1280x720', 'card-640x360', 'square-1080', 'story-1080x1920']).default('review-1280x720'),
  }).strict().default({ formats: ['gif', 'png'], preset: 'review-1280x720' }),
  seed: z.number().finite().int().min(0).max(4_294_967_295).default(7),
}).strict();

const NARRATIVE_FIELD_HELP: Record<string, string> = {
  style: 'Narrative scenes: artdeco, bestiary, brutalist, galactic, isotype, memphis, nature, opart, papercraft, psychedelic, renaissance, ukiyoe, vaporwave.',
  subfamily: 'papercraft: editorial; brutalist: documentary (default) or poster. Poster preserves the existing high-contrast brutalist direction.',
  kind: 'Must be "narrative-gif".',
  locale: 'es|en; defaults to es.',
  audience: 'Who needs to understand the story.',
  title: 'Shared title; keep it concise for the card layout.',
  status: 'open|in-review|done; controls the final expected/observed label.',
  phases: '3–5 { id, label, text, visual: { kind, state } } phases.',
  playback: '{ minReadableHoldMs, transitionMs, loop }; holds default to 5000ms.',
  output: '{ width, height, formats, preset }; pilots support 16:9, 1:1 and 9:16; vaporwave, galactic and nature support 16:9 only.',
  seed: 'Integer seed for deterministic scene variation; defaults to 7.',
};

export function narrativeHelpOptions(): string[] {
  return [
    '  --style <s>        artdeco, bestiary, brutalist, galactic, isotype, memphis, nature, opart, papercraft, psychedelic, renaissance, ukiyoe or vaporwave',
    '  --brief <file>     Read the JSON narrative brief',
    '  --out <dir>        Output folder (GIF, PNG, contact sheet and manifest)',
    '',
    '  JSON brief fields:',
    ...Object.keys(narrativeBriefSchema.shape).map((key) => `  ${key.padEnd(12)} ${NARRATIVE_FIELD_HELP[key] ?? 'See the narrative brief schema.'}`),
  ];
}

export const NARRATIVE_BRIEF_EXAMPLE = `{
  "style": "papercraft",
  "subfamily": "editorial",
  "kind": "narrative-gif",
  "locale": "es",
  "audience": "Producto",
  "title": "Guías claras",
  "status": "in-review",
  "phases": [
    { "id": "before", "label": "Antes", "text": "La medida llegaba sin aviso.", "visual": { "kind": "document", "state": "unreviewed" } },
    { "id": "change", "label": "Cambio", "text": "Ahora aparece una señal de revisión.", "visual": { "kind": "document", "state": "flagged" } },
    { "id": "result", "label": "Resultado esperado", "text": "Detectar el problema antes de publicar.", "visual": { "kind": "document", "state": "review-ready" } }
  ],
  "playback": { "minReadableHoldMs": 5000, "transitionMs": 650, "loop": true },
  "output": { "width": 1280, "height": 720, "formats": ["gif", "png"], "preset": "review-1280x720" },
  "seed": 7
}`;

export type NarrativeBriefSchemaInput = z.input<typeof narrativeBriefSchema>;

export function narrativeResultLabelMatches(label: string, status: 'open' | 'in-review' | 'done', locale: 'es' | 'en'): boolean {
  if (locale === 'en') {
    return status === 'done' ? /\bobserved\s+result\b/i.test(label) : /\bexpected\s+result\b/i.test(label);
  }
  return status === 'done' ? /\bresultado\s+observad[oa]\b/i.test(label) : /\bresultado\s+esperad[oa]\b/i.test(label);
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

function fail(code: ConstructorParameters<typeof NarrativeError>[0], message: string, suggestion: string, field?: string): never {
  throw new NarrativeError(code, message, suggestion, field);
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
}

export interface ContentSource<TPayload> {
  read(): TPayload | Promise<TPayload>;
}

export type ContentSourceAdapter<TPayload> = (payload: TPayload) => NarrativeBriefInput | unknown | Promise<NarrativeBriefInput | unknown>;

export function normalizeNarrativeBrief(input: unknown): ParsedNarrativeBrief {
  const invalidNumber = nonFinitePath(input);
  if (invalidNumber) {
    fail('NOT_FINITE', `${invalidNumber} must be a finite number; NaN and Infinity are not accepted.`, 'Provide a finite numeric value.', invalidNumber);
  }

  if (input && typeof input === 'object') {
    const candidate = input as Record<string, unknown>;
    if (candidate.status !== undefined && !['open', 'in-review', 'done'].includes(String(candidate.status))) {
      fail('INVALID_STATE', `status must be open, in-review or done; received ${String(candidate.status)}.`, 'Set status to the work state that is supported by evidence.', 'status');
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
      for (const key of ['minReadableHoldMs', 'transitionMs'] as const) {
        const duration = playback[key];
        if (typeof duration === 'string') {
          fail('BAD_DURATION', `${key} must be a number of milliseconds, not "${duration}".`, 'Provide a positive numeric millisecond value, for example 7000.', `playback.${key}`);
        }
        if (typeof duration === 'number' && Number.isFinite(duration) && duration <= 0) {
          fail('BAD_DURATION', `${key} uses milliseconds and must be greater than 0; received ${duration}ms.`, 'Provide a positive millisecond duration.', `playback.${key}`);
        }
      }
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
    if (field.startsWith('playback.') && issue?.code === 'invalid_type') {
      fail('BAD_DURATION', `${field} must be a numeric duration in milliseconds.`, 'Provide a finite positive number of milliseconds, for example 7000.', field);
    }
    if (field === 'output.width' || field === 'output.height') {
      fail('IMPOSSIBLE_SIZE', `${field} must be a positive integer pixel dimension.`, 'Provide positive integer pixel dimensions without units, within 320–4096.', field);
    }
    fail('INVALID_STATE', `${field}: ${issue?.message ?? 'brief does not match the narrative contract.'}`, 'Correct the named field and retry.', field);
  }
  const value = parsed.data;
  if (!styleSlugs.includes(value.style)) {
    fail('INVALID_STATE', `Unknown style "${value.style}".`, `Choose one of: ${styleSlugs.join(', ')}.`, 'style');
  }
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
  if (value.playback.minReadableHoldMs < 5_000) {
    fail(
      'BAD_DURATION',
      `playback.minReadableHoldMs is ${value.playback.minReadableHoldMs}ms; narrative reading holds start at 5000ms (5 seconds). The unit is milliseconds, so 5 means 5ms, not 5 seconds.`,
      'Use at least 5000 for a five-second hold; larger values are accepted.',
      'playback.minReadableHoldMs',
    );
  }
  if (new Set(value.phases.map((phase) => phase.id)).size !== value.phases.length) {
    fail('INVALID_STATE', 'Phase ids must be unique.', 'Give each phase a distinct id.', 'phases');
  }
  const lastLabel = value.phases[value.phases.length - 1]!.label;
  const required = value.locale === 'en'
    ? value.status === 'done' ? 'Observed result' : 'Expected result'
    : value.status === 'done' ? 'Resultado observado' : 'Resultado esperado';
  if (!narrativeResultLabelMatches(lastLabel, value.status, value.locale)) {
    fail('INVALID_STATE', `The last phase label must say "${required}" for status "${value.status}"; received "${lastLabel}".`, `Use a label that explicitly distinguishes ${required.toLowerCase()} from an expected result.`, `phases.${value.phases.length - 1}.label`);
  }
  if (value.playback.minReadableHoldMs > 655_350 || value.playback.transitionMs > 120_000) {
    fail('BAD_DURATION', 'Durations are milliseconds: minReadableHoldMs must be at most 655350ms and transitionMs at most 120000ms.', 'Shorten the requested hold or transition; the GIF delay field cannot represent a longer single hold.', 'playback');
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

  const brief: NormalizedNarrativeBrief = {
    ...value,
    ...(value.style === 'papercraft' ? { subfamily: value.subfamily ?? 'editorial' } : {}),
    ...(value.style === 'brutalist' ? { subfamily: value.subfamily ?? 'documentary' } : {}),
    phases: value.phases.map((phase) => ({ ...phase, text: phase.text.trim() })),
    playback: { ...value.playback },
    output: { ...value.output, width, height, formats: [...value.output.formats] },
    seed: value.seed,
  } as NormalizedNarrativeBrief;
  const hash = createHash('sha256').update(stableJson(brief)).digest('hex');
  return { brief, hash };
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
