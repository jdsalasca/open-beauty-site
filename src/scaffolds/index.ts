import type { StyleSlug } from '../types.js';
import type { StyleVoice } from '../types/make.js';
import { CLASSIC_VOICES } from './classic.js';
import { GRAPHIC_VOICES } from './graphic.js';
import { MODERN_VOICES } from './modern.js';
import { SHARED } from './shared.js';

const VOICES = {
  ...CLASSIC_VOICES,
  ...GRAPHIC_VOICES,
  ...MODERN_VOICES,
};

export function styleVoice(slug: StyleSlug): StyleVoice {
  const voice = VOICES[slug];
  if (!voice) {
    throw new Error(`No make scaffold for style "${slug}".`);
  }
  return voice;
}

export { SHARED };
