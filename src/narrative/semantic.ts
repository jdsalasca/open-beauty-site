import { z } from 'zod';
import { NarrativeError, type NarrativePhase, type NormalizedNarrativePhase } from '../types/narrative.js';
import type { StyleSlug } from '../types.js';
import type {
  NarrativeSemanticAction,
  NarrativeSemanticEntity,
  NarrativeSemanticEntityKind,
  NarrativeSemanticPrimitive,
  NarrativeSemanticRelation,
  NarrativeSemanticScene,
} from '../types/narrative-scene.js';

const entitySchema = z.object({
  id: z.string().trim().min(1).max(80),
  kind: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(120).optional(),
  value: z.union([z.string().max(120), z.number().finite()]).optional(),
  progress: z.number().finite().min(0).max(1).optional(),
  illustrative: z.boolean().optional(),
}).strict();

const relationSchema = z.object({
  kind: z.string().trim().min(1).max(40),
  from: z.string().trim().min(1).max(80),
  to: z.string().trim().min(1).max(80),
}).strict();

const actionSchema = z.object({
  entityId: z.string().trim().min(1).max(80),
  type: z.string().trim().min(1).max(40),
  targetId: z.string().trim().min(1).max(80).optional(),
}).strict();

export const narrativeSemanticSceneSchema = z.object({
  primitive: z.enum(['legacy-illustration', 'table-rows', 'card-collection', 'counter', 'file-download']),
  illustrative: z.boolean().optional(),
  entities: z.array(entitySchema).min(1).max(80),
  relations: z.array(relationSchema).max(120).default([]),
  states: z.record(z.string(), z.string().trim().min(1).max(64)),
  actions: z.array(actionSchema).max(80).default([]),
}).strict();

export const NARRATIVE_ENTITY_KINDS: NarrativeSemanticEntityKind[] = ['table', 'row', 'collection', 'card', 'counter', 'file'];

export const NARRATIVE_SEMANTIC_STATES: Record<Exclude<NarrativeSemanticEntityKind, 'illustration'>, string[]> = {
  table: ['default', 'open', 'reviewed'],
  row: ['default', 'original', 'duplicate', 'flagged', 'marked', 'accepted', 'rejected', 'merged', 'pending'],
  collection: ['default', 'open', 'counted'],
  card: ['default', 'member', 'selected', 'counted', 'pending'],
  counter: ['value', 'unchanged', 'increased', 'decreased', 'pending'],
  file: ['pending', 'downloading', 'failed', 'retrying', 'complete'],
};

export const NARRATIVE_SEMANTIC_ACTIONS: Record<Exclude<NarrativeSemanticEntityKind, 'illustration'>, string[]> = {
  table: [],
  row: ['detect', 'mark-duplicate', 'reject', 'prevent', 'merge-into'],
  collection: ['count-changes'],
  card: ['add-to-collection', 'remove-from-collection', 'count-changes'],
  counter: ['count-changes', 'set-count'],
  file: ['start-download', 'fail', 'retry', 'complete'],
};

export const NARRATIVE_PRIMITIVE_ENTITY_KINDS: Record<Exclude<NarrativeSemanticPrimitive, 'legacy-illustration'>, NarrativeSemanticEntityKind[]> = {
  'table-rows': ['table', 'row'],
  'card-collection': ['collection', 'card'],
  counter: ['counter', 'row', 'card'],
  'file-download': ['file'],
};

function invalid(code: 'UNSUPPORTED_ENTITY' | 'UNSUPPORTED_STATE' | 'UNSUPPORTED_ACTION', message: string, phaseIndex: number, style: StyleSlug, value: string, validAlternatives: string[]): never {
  throw new NarrativeError(
    code,
    message,
    `Use one of: ${validAlternatives.join(', ') || '(none declared)'}.`,
    `phases[${phaseIndex}].visual.semantic`,
    { phaseIndex, style, value, validAlternatives },
  );
}

function requireEntity(id: string, entities: Map<string, NarrativeSemanticEntity>, phaseIndex: number, style: StyleSlug): NarrativeSemanticEntity {
  const entity = entities.get(id);
  if (!entity) invalid('UNSUPPORTED_ENTITY', `Entity reference "${id}" is not declared in phase ${phaseIndex}.`, phaseIndex, style, id, [...entities.keys()].sort());
  return entity;
}

function assertPrimitiveKinds(primitive: NarrativeSemanticPrimitive, entities: NarrativeSemanticEntity[], phaseIndex: number, style: StyleSlug): void {
  const allowed: Record<NarrativeSemanticPrimitive, NarrativeSemanticEntityKind[]> = {
    'legacy-illustration': ['illustration'],
    ...NARRATIVE_PRIMITIVE_ENTITY_KINDS,
  };
  for (const entity of entities) {
    if (entity.kind !== 'illustration' && (!NARRATIVE_ENTITY_KINDS.includes(entity.kind) || !allowed[primitive].includes(entity.kind))) {
      invalid('UNSUPPORTED_ENTITY', `Entity kind "${entity.kind}" is not valid for ${primitive} in phase ${phaseIndex}.`, phaseIndex, style, entity.kind, allowed[primitive]);
    }
  }
}

function legacyScene(phase: NarrativePhase, illustrative: boolean): NarrativeSemanticScene {
  return {
    primitive: 'legacy-illustration',
    illustrative,
    entities: [{ id: 'legacy-object', kind: 'illustration', illustrative }],
    relations: [],
    states: { 'legacy-object': phase.visual.state },
    actions: [],
  };
}

/** Validate semantic references and attach a trivial stable scene for v1 visual briefs. */
export function normalizeSemanticPhases(phases: NarrativePhase[], illustrative: boolean, style: StyleSlug): NormalizedNarrativePhase[] {
  let identity: Map<string, NarrativeSemanticEntityKind> | undefined;
  let primitive: NarrativeSemanticPrimitive | undefined;
  return phases.map((phase, phaseIndex) => {
    const raw = phase.visual.semantic;
    const semantic: NarrativeSemanticScene = raw
      ? {
        ...raw,
        illustrative: raw.illustrative ?? illustrative,
        entities: raw.entities.map((entity) => ({ ...entity, illustrative: entity.illustrative ?? raw.illustrative ?? illustrative })) as NarrativeSemanticEntity[],
        relations: (raw.relations ?? []) as NarrativeSemanticRelation[],
        actions: (raw.actions ?? []) as NarrativeSemanticAction[],
      }
      : legacyScene(phase, illustrative);
    assertPrimitiveKinds(semantic.primitive, semantic.entities, phaseIndex, style);
    const entities = new Map<string, NarrativeSemanticEntity>();
    for (const entity of semantic.entities) {
      if (entities.has(entity.id)) invalid('UNSUPPORTED_ENTITY', `Entity id "${entity.id}" is repeated in phase ${phaseIndex}.`, phaseIndex, style, entity.id, [...entities.keys()].sort());
      entities.set(entity.id, entity);
    }
    const kinds = new Map([...entities].map(([id, entity]) => [id, entity.kind]));
    if (!identity) identity = kinds;
    else {
      for (const [id, kind] of kinds) {
        if (identity.get(id) !== kind) invalid('UNSUPPORTED_ENTITY', `Entity "${id}" is not part of the shared scene identity.`, phaseIndex, style, id, [...identity.keys()].sort());
      }
      for (const [id, kind] of identity) {
        if (kinds.get(id) !== kind) invalid('UNSUPPORTED_ENTITY', `Entity "${id}" must keep its id and kind across phases.`, phaseIndex, style, kinds.has(id) ? `${id}:${kinds.get(id)}` : id, [...identity].map(([entityId, entityKind]) => `${entityId}:${entityKind}`).sort());
      }
    }
    if (primitive === undefined) primitive = semantic.primitive;
    else if (primitive !== semantic.primitive) invalid('UNSUPPORTED_ENTITY', `Semantic primitive must remain ${primitive} across phases.`, phaseIndex, style, semantic.primitive, [primitive]);

    for (const entityId of Object.keys(semantic.states)) requireEntity(entityId, entities, phaseIndex, style);
    for (const entity of semantic.entities) {
      if (entity.kind === 'illustration') continue;
      const state = semantic.states[entity.id];
      if (!state) invalid('UNSUPPORTED_STATE', `Entity "${entity.id}" has no state in phase ${phaseIndex}.`, phaseIndex, style, '(missing)', NARRATIVE_SEMANTIC_STATES[entity.kind]);
      if (!NARRATIVE_SEMANTIC_STATES[entity.kind].includes(state)) invalid('UNSUPPORTED_STATE', `State "${state}" is not supported for ${entity.kind} entity "${entity.id}" in phase ${phaseIndex}.`, phaseIndex, style, state, NARRATIVE_SEMANTIC_STATES[entity.kind]);
    }
    for (const relation of semantic.relations) {
      const from = requireEntity(relation.from, entities, phaseIndex, style);
      const to = requireEntity(relation.to, entities, phaseIndex, style);
      const valid = relation.kind === 'duplicate-of' && from.kind === 'row' && to.kind === 'row'
        || relation.kind === 'member-of' && from.kind === 'card' && to.kind === 'collection'
        || relation.kind === 'counts' && from.kind === 'counter' && ['row', 'card', 'collection'].includes(to.kind);
      if (!valid) invalid('UNSUPPORTED_ENTITY', `Relation "${relation.kind}" is not valid for ${from.kind} → ${to.kind}.`, phaseIndex, style, relation.kind, ['duplicate-of (row → row)', 'member-of (card → collection)', 'counts (counter → rows/cards/collection)']);
    }
    if (semantic.primitive === 'table-rows') {
      for (const row of semantic.entities.filter((entity) => entity.kind === 'row' && semantic.states[entity.id] === 'duplicate')) {
        if (!semantic.relations.some((relation) => relation.kind === 'duplicate-of' && relation.from === row.id)) {
          invalid('UNSUPPORTED_ENTITY', `Duplicate row "${row.id}" requires an explicit duplicate-of relation.`, phaseIndex, style, row.id, semantic.entities.filter((entity) => entity.kind === 'row' && entity.id !== row.id).map((entity) => entity.id));
        }
      }
    }
    if (semantic.primitive === 'card-collection') {
      const collectionIds = new Set(semantic.entities.filter((entity) => entity.kind === 'collection').map((entity) => entity.id));
      for (const card of semantic.entities.filter((entity) => entity.kind === 'card')) {
        const collectionMembership = semantic.relations.filter((relation) => relation.kind === 'member-of' && relation.from === card.id && collectionIds.has(relation.to));
        if (collectionMembership.length > 1) invalid('UNSUPPORTED_ENTITY', `Card "${card.id}" has more than one collection membership in phase ${phaseIndex}.`, phaseIndex, style, card.id, [...collectionIds].sort());
      }
    }
    if (semantic.primitive === 'counter') {
      for (const counter of semantic.entities.filter((entity) => entity.kind === 'counter')) {
        const count = new Set(semantic.relations.filter((relation) => relation.kind === 'counts' && relation.from === counter.id).map((relation) => relation.to)).size;
        if (count === 0) invalid('UNSUPPORTED_ENTITY', `Counter "${counter.id}" must explicitly count visible entities.`, phaseIndex, style, counter.id, semantic.entities.filter((entity) => entity.id !== counter.id).map((entity) => entity.id));
        if (counter.value !== undefined && (typeof counter.value !== 'number' || counter.value !== count)) {
          invalid('UNSUPPORTED_STATE', `Counter "${counter.id}" value ${counter.value} must be the numeric count ${count} of its visible counts relations.`, phaseIndex, style, String(counter.value), [String(count)]);
        }
      }
    }
    for (const action of semantic.actions) {
      const entity = requireEntity(action.entityId, entities, phaseIndex, style);
      if (action.targetId) requireEntity(action.targetId, entities, phaseIndex, style);
      if (entity.kind === 'illustration' || !NARRATIVE_SEMANTIC_ACTIONS[entity.kind].includes(action.type)) {
        invalid('UNSUPPORTED_ACTION', `Action "${action.type}" is not supported for ${entity.kind} entity "${entity.id}" in phase ${phaseIndex}.`, phaseIndex, style, action.type, entity.kind === 'illustration' ? [] : NARRATIVE_SEMANTIC_ACTIONS[entity.kind]);
      }
    }
    return { ...phase, visual: { ...phase.visual, semantic } } as NormalizedNarrativePhase;
  });
}
