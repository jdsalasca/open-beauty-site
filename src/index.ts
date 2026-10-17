export * from './types.js';
export { presets, styleSlugs, getStyle, isStyleSlug } from './styles/presets.js';
export { renderPage } from './page/index.js';
export { validateHtml, formatValidation, contrastRatio, luminance } from './validate.js';
export { createGif } from './gif.js';
export { createPage, createGifFile, slugify, timestamp } from './generate.js';
export { BeautyError } from './page/common.js';

export const VERSION = '0.1.0';
