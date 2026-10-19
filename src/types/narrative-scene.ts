import type { NarrativeRect } from './narrative.js';

export type NarrativeSemanticPrimitive = 'legacy-illustration' | 'table-rows' | 'card-collection' | 'counter' | 'file-download';
export type NarrativeSemanticEntityKind = 'illustration' | 'table' | 'row' | 'collection' | 'card' | 'counter' | 'file';

export interface NarrativeSemanticEntity {
  id: string;
  kind: NarrativeSemanticEntityKind;
  label?: string;
  value?: string | number;
  progress?: number;
  illustrative: boolean;
}

export interface NarrativeSemanticEntityInput extends Omit<NarrativeSemanticEntity, 'illustrative' | 'kind'> {
  kind: string;
  illustrative?: boolean;
}

export interface NarrativeSemanticRelation {
  kind: string;
  from: string;
  to: string;
}

export interface NarrativeSemanticAction {
  entityId: string;
  type: string;
  targetId?: string;
}

/** Style-neutral state of the same identified objects at one narrative phase. */
export interface NarrativeSemanticScene {
  primitive: NarrativeSemanticPrimitive;
  illustrative: boolean;
  /** Marks conservative semantics generated from a legacy kind/state-only brief. */
  legacyUpgrade?: boolean;
  entities: NarrativeSemanticEntity[];
  relations: NarrativeSemanticRelation[];
  states: Record<string, string>;
  actions: NarrativeSemanticAction[];
}

export interface NarrativeSemanticSceneInput {
  primitive: NarrativeSemanticPrimitive;
  illustrative?: boolean;
  legacyUpgrade?: boolean;
  entities: NarrativeSemanticEntityInput[];
  relations?: NarrativeSemanticRelation[];
  states: Record<string, string>;
  actions?: NarrativeSemanticAction[];
}

export interface NarrativeObjectRegion {
  entityId: string;
  bounds: NarrativeRect;
  /** Text actually drawn inside this object region; used for a measurable card-size legibility check. */
  textBoxes?: NarrativeObjectTextBox[];
}

export interface NarrativeObjectTextBox {
  text: string;
  bounds: NarrativeRect;
  fontSizePx: number;
  role: 'identifier' | 'label' | 'status' | 'headline';
}
