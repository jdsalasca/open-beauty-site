/**
 * Sprint kit facade. The implementation lives in `src/sprint/*`:
 * data validation, chart primitives, slide composition, HTML injection,
 * fidelity checks and the data-driven GIFs.
 */
export { createSprintKit } from './sprint/kit.js';
export type { SprintKitFile, SprintKitResult, SprintKitOptions } from './sprint/kit.js';
export { parseSprintBrief, sprintBrand } from './sprint/data.js';
export type {
  ParsedSprintBrief,
  SprintBurndown,
  SprintCapacity,
  SprintData,
  SprintInfo,
  SprintRetro,
  SprintRetroAction,
  SprintRisk,
  SprintStory,
  SprintTeam,
  SprintVelocity,
} from './sprint/data.js';
export { SprintBriefError } from './types/sprint.js';
export type { SprintFieldIssue } from './types/sprint.js';
export { checkSprintFidelity, injectSprintBlocks } from './sprint/render.js';
export type { SprintKitIssue } from './sprint/render.js';
export { createSprintGif, drawSprintFrame } from './sprint/gif.js';
export type { SprintGifKind, SprintGifOptions } from './sprint/gif.js';
