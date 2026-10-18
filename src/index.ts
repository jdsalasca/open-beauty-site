export * from './types.js';
export { presets, styleSlugs, getStyle, isStyleSlug } from './styles/presets.js';
export { renderPage } from './page/index.js';
export { validateHtml, validateDeck, validateExperience, validateStory, formatValidation, contrastRatio, luminance } from './validate.js';
export { createGif } from './gif.js';
export { createPage, createDeck, createExperience, createStory, createGifFile, createMotion, createCanvas, createSequence, slugify, timestamp } from './generate.js';
export { renderCanvas, canvasChecks } from './canvas-art.js';
export { renderSequence } from './sequence.js';
export { renderMotion, MOTION_SCENES } from './motion.js';
export { renderDeck } from './deck.js';
export { renderExperience } from './page/experience.js';
export { renderStory } from './page/story.js';
export { createSprintKit } from './sprint.js';
export type { SprintKitResult, SprintKitFile } from './sprint.js';
export { sceneArt } from './art.js';
export { BeautyError } from './page/common.js';

export const VERSION = '0.1.0';
