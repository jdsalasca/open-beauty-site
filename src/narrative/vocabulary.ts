import type { NarrativeSceneVocabulary } from '../types/narrative.js';

const directStates = [
  ['unreviewed', 'The scene maps this state to the initial visual state.'],
  ['before', 'Compatibility alias; the scene maps it to the initial visual state.'],
  ['pending', 'Compatibility alias; the scene maps it to the initial visual state.'],
  ['flagged', 'The scene maps this state to the marked visual state.'],
  ['signal', 'Compatibility alias; the scene maps it to the marked visual state.'],
  ['observation', 'Compatibility alias; the scene maps it to the marked visual state.'],
  ['observacion', 'Spanish compatibility alias; the scene maps it to the marked visual state.'],
  ['review-ready', 'The scene maps this state to its review-ready visual state.'],
  ['reviewed', 'The scene maps this state to its review-ready visual state.'],
  ['ready', 'Compatibility alias; the scene maps it to its review-ready visual state.'],
  ['done', 'Compatibility alias; the scene maps it to its review-ready visual state.'],
  ['verified', 'Compatibility alias; the scene maps it to its review-ready visual state.'],
  ['list', 'Compatibility alias; the scene maps it to its review-ready visual state.'],
] as const;

export function sceneVocabulary(stateSemantics: NarrativeSceneVocabulary['stateSemantics']): NarrativeSceneVocabulary {
  const stateStatus = stateSemantics === 'value-driven' ? 'supported' : 'fallback';
  const stateReason = stateSemantics === 'value-driven'
    ? undefined
    : 'Accepted for brief compatibility; this scene advances by phase order and does not consume visual.state.';
  return {
    visualKinds: [
      { value: 'comparison', status: 'supported', reason: 'The scene has a comparison composition.' },
      { value: 'checklist', status: 'supported', reason: 'The scene has a checklist composition.' },
      { value: 'document', status: 'fallback', reason: 'Legacy document kind maps to the comparison composition.' },
      { value: 'process', status: 'fallback', reason: 'Legacy process kind maps to the checklist composition.' },
      { value: 'lista', status: 'fallback', reason: 'Spanish list kind maps to the checklist composition.' },
      { value: 'proceso', status: 'fallback', reason: 'Spanish process kind maps to the checklist composition.' },
    ],
    states: directStates.map(([value, reason]) => ({
      value,
      status: stateStatus,
      reason: stateReason ?? reason,
    })),
    actions: [],
    stateSemantics,
  };
}
