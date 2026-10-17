import type { Brief, StyleSlug } from '../types.js';
import { getStyle } from '../styles/presets.js';
import { renderRenaissance } from './renaissance.js';
import { renderBrutalist } from './brutalist.js';
import { renderPapercraft } from './papercraft.js';

export function renderPage(style: StyleSlug, brief: Partial<Brief>): string {
  const preset = getStyle(style);
  switch (style) {
    case 'renaissance':
      return renderRenaissance(brief, preset);
    case 'brutalist':
      return renderBrutalist(brief, preset);
    case 'papercraft':
      return renderPapercraft(brief, preset);
    default: {
      const exhaustive: never = style;
      throw new Error(`Unknown style: ${String(exhaustive)}`);
    }
  }
}
