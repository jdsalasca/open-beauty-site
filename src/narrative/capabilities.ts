import type { StyleSlug } from '../types.js';
import { getNarrativeScene, supportedNarrativeStyles } from './scene.js';
import type { NarrativeLocale, NarrativeSceneValueDeclaration } from '../types/narrative.js';

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
  'table-rows': 'The current scene provides its existing comparison or checklist composition; semantic rows and row-level actions are deferred to a later stage.',
  'card-collection': 'The current scene provides its existing illustration; identified cards and collection membership are not represented yet.',
  counter: 'The current scene provides its existing illustration; no count is derived or shown for this primitive.',
  'file-download': 'The current scene provides its existing illustration; download state, file identity, and failure recovery are not represented yet.',
};

export interface NarrativeCapabilityCell {
  style: StyleSlug;
  primitive: NarrativePrimitive;
  aspect: NarrativeAspect;
  locale: NarrativeLocale;
  status: NarrativeCapabilityStatus;
  reason: string;
  allowed: {
    visualKinds: NarrativeSceneValueDeclaration[];
    visualStates: NarrativeSceneValueDeclaration[];
    actions: NarrativeSceneValueDeclaration[];
  };
}

export interface NarrativeCapabilityReport {
  contractVersion: 2;
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
    const allowed = {
      visualKinds: vocabulary?.visualKinds ?? [],
      visualStates: vocabulary?.states ?? [],
      actions: vocabulary?.actions ?? [],
    };
    return NARRATIVE_PRIMITIVES.flatMap((primitive) => ASPECTS.flatMap((aspect) => (['es', 'en'] as const).map((locale) => {
      const supportsAspect = scene.supportsAspect(aspect.width / aspect.height);
      const status: NarrativeCapabilityStatus = supportsAspect ? 'fallback' : 'unsupported';
      const reason = supportsAspect
        ? PRIMITIVE_REASONS[primitive]
        : `${style} has no narrative renderer for ${aspect.id}; the primitive cannot be rendered in this aspect.`;
      return { style, primitive, aspect: aspect.id, locale, status, reason, allowed };
    })));
  });
  const summary: Record<NarrativeCapabilityStatus, number> = { supported: 0, unsupported: 0, fallback: 0 };
  for (const cell of cells) summary[cell.status] += 1;
  return { contractVersion: 2, cells, summary };
}

export function narrativeCapabilities(style?: StyleSlug): NarrativeCapabilityReport {
  return narrativeCapabilityReport(style ? { style } : {});
}
