import { NarrativeError, type NarrativeScene } from '../types/narrative.js';
import type { StyleSlug } from '../types.js';
import { artdecoNarrativeScene } from './scenes/artdeco.js';
import { brutalistNarrativeScene } from './scenes/brutalist.js';
import { isotypeNarrativeScene } from './scenes/isotype.js';
import { opartNarrativeScene } from './scenes/opart.js';
import { papercraftNarrativeScene } from './scenes/papercraft.js';
import { renaissanceNarrativeScene } from './scenes/renaissance.js';

const SCENES = new Map<StyleSlug, NarrativeScene>();
SCENES.set(brutalistNarrativeScene.style, brutalistNarrativeScene);
SCENES.set(papercraftNarrativeScene.style, papercraftNarrativeScene);
SCENES.set(renaissanceNarrativeScene.style, renaissanceNarrativeScene);
SCENES.set(artdecoNarrativeScene.style, artdecoNarrativeScene);
SCENES.set(isotypeNarrativeScene.style, isotypeNarrativeScene);
SCENES.set(opartNarrativeScene.style, opartNarrativeScene);

/** Register only production scene renderers. Test scenes should use the per-call injection. */
export function registerNarrativeScene(scene: NarrativeScene): void {
  SCENES.set(scene.style, scene);
}

export function supportedNarrativeStyles(): StyleSlug[] {
  return [...SCENES.keys()].sort();
}

export function getNarrativeScene(style: StyleSlug): NarrativeScene {
  const scene = SCENES.get(style);
  if (!scene) {
    const supported = supportedNarrativeStyles();
    throw new NarrativeError(
      'STYLE_NOT_SUPPORTED_YET',
      `Narrative GIF scene for ${style} is not implemented yet. Supported styles: ${supported.length ? supported.join(', ') : 'none'}.`,
      'Use an existing beauty gif/sequence tool for now, or add and review a scene renderer for this style.',
      'style',
    );
  }
  return scene;
}

export function resolveNarrativeScene(style: StyleSlug, injected?: NarrativeScene): NarrativeScene {
  const scene = injected ?? getNarrativeScene(style);
  if (scene.style !== style) {
    throw new NarrativeError('STYLE_NOT_SUPPORTED_YET', `Scene renderer ${scene.style} cannot render brief style ${style}.`, 'Provide a scene renderer for the same style as the brief.', 'style');
  }
  return scene;
}
