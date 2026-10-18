import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PALETTE_TEXT_PAIRS,
  contrastRatio,
  paletteContrastFailures,
  relativeLuminance,
} from '../src/a11y.js';
import { getStyle, styleSlugs } from '../src/styles/presets.js';
import { renderPage } from '../src/page/index.js';
import { renderExperience } from '../src/page/experience.js';
import { renderStory } from '../src/page/story.js';
import { renderDeck } from '../src/deck.js';
import type { Brief } from '../src/types.js';

const brief: Brief = {
  title: 'Atelier Lumen',
  brand: 'Atelier Lumen',
  tagline: 'Objects that age well.',
  intro: 'We work with our hands and with time. Every piece starts with a drawing and a long conversation.',
  sections: [
    { kicker: 'One', title: 'Portraits', body: 'Three sessions: light, sketch and matter.' },
    { kicker: 'Two', title: 'Ceramics', body: 'Short series with ash glazes and visible fingerprints.' },
    { kicker: 'Three', title: 'Rooms', body: 'Fewer objects, better shadows.' },
  ],
  quote: { text: 'Beauty is discovered, not added.', author: 'Elena Varela' },
  cta: { label: 'Visit the studio', href: '#contact' },
  locale: 'en',
};

test('contrastRatio matches the WCAG reference values', () => {
  assert.equal(Number(contrastRatio('#000000', '#FFFFFF').toFixed(2)), 21);
  assert.equal(Number(contrastRatio('#FFFFFF', '#FFFFFF').toFixed(2)), 1);
  assert.ok(relativeLuminance('#FFFFFF') > relativeLuminance('#000000'));
});

test('every style palette meets WCAG AA text contrast', () => {
  for (const slug of styleSlugs) {
    const preset = getStyle(slug);
    const failures = paletteContrastFailures(preset.palette, PALETTE_TEXT_PAIRS[slug]);
    const detail = failures
      .map((f) => `${f.label} ${f.fg}/${f.bg} ${f.ratio.toFixed(2)} < ${f.required}`)
      .join('; ');
    assert.deepEqual(failures, [], `${slug}: ${detail}`);
  }
});

test('generated pages ship the accessibility affordances', () => {
  for (const slug of styleSlugs) {
    const html = renderPage(slug, brief);
    assert.match(html, /<meta name="color-scheme" content="(light|dark)"/, `${slug} color-scheme`);
    assert.match(html, /class="skip-link"/, `${slug} skip link`);
    assert.match(html, /<header[\s>]/, `${slug} header`);
    assert.match(html, /<main[\s>]/, `${slug} main`);
    assert.match(html, /<footer[\s>]/, `${slug} footer`);
    assert.match(html, /<nav[^>]*aria-label=/, `${slug} nav label`);
    assert.match(html, /:focus-visible/, `${slug} focus-visible`);
    assert.match(html, /prefers-reduced-motion/, `${slug} reduced motion`);
    assert.match(html, /@media print/, `${slug} print`);
    assert.match(html, /clamp\(/, `${slug} fluid type`);
    assert.match(html, /max-width:380px/, `${slug} narrow viewport`);
    assert.match(html, /overflow-x:hidden/, `${slug} no horizontal scroll`);
    assert.doesNotMatch(html, /role="img"[^>]*aria-hidden="true"/, `${slug} decorative art`);
  }
});

test('experiences and stories ship landmarks and a working skip target', () => {
  const xp = renderExperience(
    { title: 'Museo', tagline: 'Un recorrido', locale: 'en', rooms: [{ title: 'A' }, { title: 'B' }, { title: 'C' }] },
    getStyle('nature'),
  );
  assert.match(xp, /class="skip-link" href="#entrada"/);
  assert.match(xp, /<header[\s>]/);
  assert.match(xp, /<main[\s>]/);
  assert.match(xp, /<footer[\s>]/);
  assert.match(xp, /<nav[^>]*aria-label=/);
  assert.match(xp, /prefers-reduced-motion/);

  const story = renderStory(
    { title: 'Cuento', locale: 'en', chapters: [{ title: 'Uno', body: 'a' }, { title: 'Dos', body: 'b' }] },
    getStyle('nature'),
  );
  assert.match(story, /class="skip-link" href="#top"/);
  assert.match(story, /<header[\s>]/);
  assert.match(story, /<footer[\s>]/);
  assert.match(story, /<nav[^>]*aria-label=/);
});

test('decks ship the accessibility affordances', () => {
  const deck = renderDeck({ style: getStyle('brutalist'), brief });
  assert.match(deck.html, /class="skip-link"/);
  assert.match(deck.html, /<header[\s>]/);
  assert.match(deck.html, /<main[\s>]/);
  assert.match(deck.html, /<footer[\s>]/);
  assert.match(deck.html, /aria-live/);
  assert.match(deck.html, /prefers-reduced-motion/);
  assert.match(deck.html, /@media print/);
  assert.match(deck.html, /color-scheme/);
  assert.match(deck.html, /--accent-on:/);
});
