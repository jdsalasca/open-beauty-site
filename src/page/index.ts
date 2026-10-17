import type { Brief, StyleSlug } from '../types.js';
import { getStyle } from '../styles/presets.js';
import { renderRenaissance } from './renaissance.js';
import { renderBrutalist } from './brutalist.js';
import { renderPapercraft } from './papercraft.js';
import { renderArtDeco, renderIsotype, renderOpArt, renderUkiyoe } from './showcase-a.js';
import { renderBestiary, renderGalactic, renderMemphis, renderPsychedelic, renderVaporwave } from './showcase-b.js';

export function renderPage(style: StyleSlug, brief: Partial<Brief>): string {
  const preset = getStyle(style);
  switch (style) {
    case 'renaissance':
      return renderRenaissance(brief, preset);
    case 'brutalist':
      return renderBrutalist(brief, preset);
    case 'papercraft':
      return renderPapercraft(brief, preset);
    case 'artdeco':
      return renderArtDeco(brief, preset);
    case 'isotype':
      return renderIsotype(brief, preset);
    case 'opart':
      return renderOpArt(brief, preset);
    case 'ukiyoe':
      return renderUkiyoe(brief, preset);
    case 'bestiary':
      return renderBestiary(brief, preset);
    case 'psychedelic':
      return renderPsychedelic(brief, preset);
    case 'memphis':
      return renderMemphis(brief, preset);
    case 'vaporwave':
      return renderVaporwave(brief, preset);
    case 'galactic':
      return renderGalactic(brief, preset);
    default: {
      const exhaustive: never = style;
      throw new Error(`Unknown style: ${String(exhaustive)}`);
    }
  }
}
