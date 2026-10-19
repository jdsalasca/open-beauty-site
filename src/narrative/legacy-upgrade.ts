import { NarrativeError, type NarrativePhase } from '../types/narrative.js';
import type { NarrativeSemanticEntityInput, NarrativeSemanticPrimitive, NarrativeSemanticSceneInput } from '../types/narrative-scene.js';
import type { StyleSlug } from '../types.js';
import { sceneText } from './i18n.js';

export interface NarrativeUpgradeMetadata {
  applied: boolean;
  mapping: string;
  reason: string;
}

export interface LegacyUpgradeResult {
  phases: NarrativePhase[];
  upgrade: NarrativeUpgradeMetadata;
}

const STYLE_PRIMITIVES: Partial<Record<StyleSlug, { comparison: NarrativeSemanticPrimitive; checklist: NarrativeSemanticPrimitive }>> = {
  papercraft: { comparison: 'table-rows', checklist: 'card-collection' },
  brutalist: { comparison: 'table-rows', checklist: 'card-collection' },
  isotype: { comparison: 'card-collection', checklist: 'card-collection' },
  opart: { comparison: 'card-collection', checklist: 'card-collection' },
  renaissance: { comparison: 'card-collection', checklist: 'card-collection' },
  ukiyoe: { comparison: 'card-collection', checklist: 'card-collection' },
};

function compositionFor(kind: string): 'comparison' | 'checklist' {
  return /checklist|process|lista|proceso/iu.test(kind) ? 'checklist' : 'comparison';
}

function conservativeState(state: string, phaseIndex: number, style: StyleSlug): string {
  switch (state.toLowerCase()) {
    case 'unreviewed':
    case 'before':
    case 'pending':
    case 'list':
      return 'pending';
    case 'flagged':
    case 'signal':
    case 'observation':
    case 'observacion':
      return 'flagged';
    case 'review-ready':
    case 'reviewed':
    case 'ready':
    case 'done':
    case 'verified':
      return 'ready-for-review';
    default:
      throw new NarrativeError(
        'UNSUPPORTED_STATE',
        `Legacy visual state "${state}" has no conservative semantic mapping for ${style}.`,
        'Use a declared visual state with a documented legacy upgrade mapping.',
        `phases[${phaseIndex}].visual.state`,
        { phaseIndex, style, value: state },
      );
  }
}

function illustrativeEntities(style: StyleSlug, locale: 'es' | 'en', primitive: NarrativeSemanticPrimitive): NarrativeSemanticEntityInput[] {
  if (primitive === 'table-rows') {
    return [
      { id: 'legacy-records', kind: 'table', label: sceneText(style, locale, 'legacyRecords'), illustrative: true },
      ...['legacy-record-a', 'legacy-record-b', 'legacy-record-c', 'legacy-record-d'].map((id) => ({
        id, kind: 'row', label: sceneText(style, locale, 'legacyRecord'), illustrative: true,
      })),
    ];
  }
  return [
    { id: 'legacy-collection', kind: 'collection', label: sceneText(style, locale, 'legacyCollection'), illustrative: true },
    ...['legacy-item-a', 'legacy-item-b', 'legacy-item-c', 'legacy-item-d'].map((id) => ({
      id, kind: 'card', label: sceneText(style, locale, 'legacyItem'), illustrative: true,
    })),
  ];
}

function legacySemantic(phase: NarrativePhase, phaseIndex: number, style: StyleSlug, locale: 'es' | 'en', primitive: NarrativeSemanticPrimitive): NarrativeSemanticSceneInput {
  const state = conservativeState(phase.visual.state, phaseIndex, style);
  const entities = illustrativeEntities(style, locale, primitive);
  const statefulKind = primitive === 'table-rows' ? 'row' : 'card';
  return {
    primitive,
    illustrative: true,
    legacyUpgrade: true,
    entities,
    relations: [],
    states: Object.fromEntries(entities.map((entity) => [entity.id, entity.kind === statefulKind ? state : 'default'])),
    actions: [],
  };
}

export function upgradeLegacyNarrativePhases(
  phases: NarrativePhase[],
  style: StyleSlug,
  locale: 'es' | 'en',
  legacyArt: boolean,
): LegacyUpgradeResult {
  if (legacyArt) {
    return { phases, upgrade: { applied: false, mapping: 'legacy-art-opt-out', reason: 'Explicit legacyArt opt-out keeps the previous illustration.' } };
  }

  const normalizedLegacyIllustration = phases.every((phase) => phase.visual.semantic?.primitive === 'legacy-illustration' && !phase.visual.semantic.legacyUpgrade);
  const hasSemanticInput = phases.some((phase) => phase.visual.semantic !== undefined) && !normalizedLegacyIllustration;
  if (hasSemanticInput) {
    const replayingUpgrade = phases.every((phase) => phase.visual.semantic?.legacyUpgrade === true);
    const kind = phases[0]!.visual.kind;
    const primitive = STYLE_PRIMITIVES[style]?.[compositionFor(kind)];
    const mapping = replayingUpgrade && primitive ? `legacy-state-v1:${style}:${compositionFor(kind)}` : 'native-semantic';
    return {
      phases,
      upgrade: replayingUpgrade && primitive
        ? { applied: true, mapping, reason: 'Replayed the deterministic semantic upgrade recorded in the normalized brief.' }
        : { applied: false, mapping, reason: 'The brief already supplies semantic scene entities; they are retained as authored.' },
    };
  }

  const primitives = STYLE_PRIMITIVES[style];
  if (!primitives) {
    return { phases, upgrade: { applied: false, mapping: 'legacy-renderer', reason: 'This style has no semantic scene; the legacy illustration path is preserved.' } };
  }

  const kind = phases[0]!.visual.kind;
  const composition = compositionFor(kind);
  const primitive = primitives[composition];
  const mapping = `legacy-state-v1:${style}:${composition}`;
  return {
    phases: phases.map((phase, phaseIndex) => ({
      ...phase,
      visual: { ...phase.visual, semantic: legacySemantic(phase, phaseIndex, style, locale, primitive) },
    })),
    upgrade: {
      applied: true,
      mapping,
      reason: `${style} maps legacy ${composition} states to generic illustrative ${primitive} entities without counts, figures, or changes to narrative copy.`,
    },
  };
}
