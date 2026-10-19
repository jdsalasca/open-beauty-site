import type { StyleSlug } from '../types.js';
import { getNarrativeScene, supportedNarrativeStyles } from './scene.js';
import type { NarrativeLocale, NarrativeSceneLayout, NarrativeSceneValueDeclaration } from '../types/narrative.js';
import type { NarrativeSemanticEntityKind } from '../types/narrative-scene.js';
import { narrativeLayoutsFor } from './composition.js';
import { NARRATIVE_PRIMITIVE_ENTITY_KINDS, NARRATIVE_SEMANTIC_ACTIONS, NARRATIVE_SEMANTIC_STATES } from './semantic.js';

export { narrativeLayoutsFor } from './composition.js';

export const NARRATIVE_PRIMITIVES = ['table-rows', 'card-collection', 'counter', 'file-download'] as const;
export type NarrativePrimitive = (typeof NARRATIVE_PRIMITIVES)[number];
export type NarrativeAspect = '16:9' | '1:1' | '9:16';
export type NarrativeCapabilityStatus = 'supported' | 'unsupported' | 'fallback';

const ASPECTS: Array<{ id: NarrativeAspect; width: number; height: number }> = [
  { id: '16:9', width: 1280, height: 720 },
  { id: '1:1', width: 640, height: 640 },
  { id: '9:16', width: 360, height: 640 },
];

const PRIMITIVE_REASONS: Record<NarrativePrimitive, string> = {
  'table-rows': 'This renderer does not yet draw identified semantic rows or row-level actions.',
  'card-collection': 'This renderer does not yet draw identified cards or collection membership.',
  counter: 'This renderer does not yet draw a count tied to visible semantic elements.',
  'file-download': 'This renderer does not yet draw file identity, progress, failure and retry state.',
};

const SEMANTIC_STYLE_PRIMITIVES: Partial<Record<StyleSlug, ReadonlySet<NarrativePrimitive>>> = {
  papercraft: new Set(NARRATIVE_PRIMITIVES),
  brutalist: new Set(NARRATIVE_PRIMITIVES),
  renaissance: new Set(['card-collection', 'counter']),
  ukiyoe: new Set(['card-collection', 'file-download']),
  isotype: new Set(['counter', 'card-collection']),
  opart: new Set(['card-collection']),
};

function fallbackReason(style: StyleSlug, primitive: NarrativePrimitive): string {
  if (style === 'isotype' && primitive === 'table-rows') return 'Isotype represents each row as one countable pictogram; it does not claim table-cell or row-action semantics. Use counter or card-collection.';
  if (style === 'isotype' && primitive === 'file-download') return 'File progress has no natural mapping to Isotype pictogram counts; the style keeps its legacy illustration fallback.';
  if (style === 'opart' && primitive === 'table-rows') return 'Op Art groups optical motifs rather than records; the renderer does not represent tabular rows.';
  if (style === 'opart' && primitive === 'counter') return 'The optical pattern is qualitative and does not encode a numeric count.';
  if (style === 'opart' && primitive === 'file-download') return 'File progress does not map to the style\'s optical grouping; the renderer keeps its legacy fallback.';
  return `${style} fallback: ${PRIMITIVE_REASONS[primitive]}`;
}

const SEMANTIC_ALL_ASPECT_STYLES = new Set<StyleSlug>(['papercraft', 'brutalist', 'isotype', 'opart']);

function semanticRenderTest(style: StyleSlug): string {
  if (style === 'isotype' || style === 'opart') return 'narrative-semantic-style-render';
  if (style === 'papercraft' || style === 'brutalist') return 'narrative-semantic-render';
  return 'narrative-style-semantic';
}

export interface NarrativeCapabilityCell {
  style: StyleSlug;
  primitive: NarrativePrimitive;
  aspect: NarrativeAspect;
  locale: NarrativeLocale;
  status: NarrativeCapabilityStatus;
  /** Explicit per-style/aspect layout hints; unsupported hints return UNSUPPORTED_LAYOUT. */
  layouts: NarrativeSceneLayout[];
  reason: string;
  allowed: {
    visualKinds: NarrativeSceneValueDeclaration[];
    visualStates: NarrativeSceneValueDeclaration[];
    actions: NarrativeSceneValueDeclaration[];
    semanticEntityKinds: NarrativeSemanticEntityKind[];
    semanticStates: Partial<Record<NarrativeSemanticEntityKind, string[]>>;
    semanticActions: Partial<Record<NarrativeSemanticEntityKind, string[]>>;
  };
}

export interface NarrativeCapabilityReport {
  contractVersion: 3;
  cells: NarrativeCapabilityCell[];
  summary: Record<NarrativeCapabilityStatus, number>;
}

export interface NarrativeCapabilityFilter {
  style?: StyleSlug;
}

export function narrativeCapabilityReport(filter: NarrativeCapabilityFilter = {}): NarrativeCapabilityReport {
  const styles = filter.style ? [filter.style] : supportedNarrativeStyles();
  const cells = styles.flatMap((style) => {
    const scene = getNarrativeScene(style);
    const vocabulary = scene.vocabulary;
    const visualAllowed = {
      visualKinds: vocabulary?.visualKinds ?? [],
      visualStates: vocabulary?.states ?? [],
      actions: vocabulary?.actions ?? [],
    };
    return NARRATIVE_PRIMITIVES.flatMap((primitive) => ASPECTS.flatMap((aspect) => (['es', 'en'] as const).map((locale) => {
      const supportsAspect = scene.supportsAspect(aspect.width / aspect.height);
      // Papercraft/brutalist support each scene aspect; Isotype/Op Art have decoded proof for all three;
      // Renaissance/Ukiyoe only claim 16:9, where their style-semantic render tests run.
      const semanticSupported = Boolean(SEMANTIC_STYLE_PRIMITIVES[style]?.has(primitive))
        && supportsAspect
        && (SEMANTIC_ALL_ASPECT_STYLES.has(style) || aspect.id === '16:9');
      const status: NarrativeCapabilityStatus = !supportsAspect ? 'unsupported' : semanticSupported ? 'supported' : 'fallback';
      const semanticEntityKinds = NARRATIVE_PRIMITIVE_ENTITY_KINDS[primitive];
      const semanticKinds = semanticEntityKinds.filter((kind): kind is Exclude<NarrativeSemanticEntityKind, 'illustration'> => kind !== 'illustration');
      const allowed = {
        ...visualAllowed,
        semanticEntityKinds,
        semanticStates: Object.fromEntries(semanticKinds.map((kind) => [kind, NARRATIVE_SEMANTIC_STATES[kind]])),
        semanticActions: Object.fromEntries(semanticKinds.map((kind) => [kind, NARRATIVE_SEMANTIC_ACTIONS[kind]])),
      };
      const reason = !supportsAspect
        ? `${style} has no narrative renderer for ${aspect.id}; the primitive cannot be rendered in this aspect.`
        : semanticSupported
          ? `${style} renders ${primitive} with stable entity regions; decoded state changes are exercised in test/${semanticRenderTest(style)}.test.ts for ${aspect.id}/${locale}.`
          : fallbackReason(style, primitive);
      return { style, primitive, aspect: aspect.id, locale, status, layouts: narrativeLayoutsFor(style, aspect.width / aspect.height), reason, allowed };
    })));
  });
  const summary: Record<NarrativeCapabilityStatus, number> = { supported: 0, unsupported: 0, fallback: 0 };
  for (const cell of cells) summary[cell.status] += 1;
  return { contractVersion: 3, cells, summary };
}

export function narrativeCapabilities(style?: StyleSlug): NarrativeCapabilityReport {
  return narrativeCapabilityReport(style ? { style } : {});
}
