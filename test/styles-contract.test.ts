import assert from 'node:assert/strict';
import test from 'node:test';
import { renderPage } from '../src/page/index.js';
import { renderDeck } from '../src/deck.js';
import { getStyle, styleSlugs } from '../src/styles/presets.js';
import type { Brief } from '../src/types.js';
import {
  assertDocumentContract,
  assertInjectionSafe,
  XSS_ATTR,
  XSS_SCRIPT,
  XSS_TITLE,
} from './support/html-contract.js';

const brief: Brief = {
  title: 'Atelier Lumen',
  tagline: 'Objects that age well.',
  intro: 'We work with our hands and with time. Every piece starts with a drawing and a long conversation.',
  eyebrow: 'Estudio · 2026',
  brand: 'Atelier Lumen',
  sections: [
    { kicker: 'One', title: 'Portraits', body: 'Three sessions: light, sketch and matter.' },
    { kicker: 'Two', title: 'Ceramics', body: 'Short series with ash glazes and visible fingerprints.' },
    { kicker: 'Three', title: 'Rooms', body: 'Fewer objects, better shadows.' },
  ],
  quote: { text: 'Beauty is discovered, not added.', author: 'Elena Varela' },
  cta: { label: 'Visit the studio', href: 'https://atelier.example/visit' },
  footer: 'Atelier Lumen · Madrid',
  locale: 'en',
  seed: 7,
};

const hostile: Brief = {
  title: XSS_TITLE,
  tagline: `A page with ${XSS_ATTR} inside`,
  intro: `Manifesto ${XSS_SCRIPT} end`,
  eyebrow: `Kicker ${XSS_SCRIPT}`,
  brand: `Brand ${XSS_ATTR}`,
  sections: [
    { kicker: XSS_ATTR, title: `Card ${XSS_SCRIPT}`, body: `Body ${XSS_SCRIPT} and "quotes"` },
  ],
  quote: { text: `Quote ${XSS_SCRIPT}`, author: XSS_ATTR },
  cta: { label: `CTA ${XSS_SCRIPT}`, href: 'javascript:alert(1)' },
  footer: `Footer ${XSS_SCRIPT}`,
  locale: 'en',
};

test('every registered style renders a well-formed document in both locales', () => {
  for (const style of styleSlugs) {
    for (const locale of ['es', 'en'] as const) {
      const html = renderPage(style, { ...brief, locale });
      assertDocumentContract(html, { label: `${style}/${locale}`, locale });
    }
  }
});

test('every registered style escapes injected markup and hostile hrefs', () => {
  for (const style of styleSlugs) {
    const html = renderPage(style, hostile);
    assertDocumentContract(html, { label: `${style} hostile`, locale: 'en' });
    assertInjectionSafe(html, `${style} hostile`);
  }
});

test('every registered style is deterministic for the same brief', () => {
  for (const style of styleSlugs) {
    const first = renderPage(style, brief);
    const second = renderPage(style, brief);
    assert.equal(first, second, `${style} rendered differently for the same input`);
    const maxed = renderPage(style, { ...brief, maxxing: true });
    assert.equal(maxed, renderPage(style, { ...brief, maxxing: true }), `${style} maxxing is not deterministic`);
  }
});

test('every registered subfamily renders a well-formed deterministic deck', () => {
  for (const style of styleSlugs) {
    const preset = getStyle(style);
    const subfamilies = preset.subfamilies ?? [];
    assert.ok(subfamilies.length > 0, `${style} has no curated subfamilies`);
    for (const subfamily of subfamilies) {
      const input = {
        title: brief.title,
        tagline: brief.tagline,
        intro: brief.intro,
        brand: brief.brand,
        subfamily: subfamily.slug,
        locale: 'en' as const,
        slides: [
          { layout: 'statement' as const, title: 'One idea per slide.', body: 'The rest is noise.' },
          { layout: 'points' as const, title: 'Three rules', points: [{ title: 'Less' }, { title: 'Bigger' }, { title: 'Silence' }] },
        ],
      };
      const first = renderDeck({ style: preset, brief: input });
      const second = renderDeck({ style: preset, brief: input });
      const label = `${style}/${subfamily.slug}`;
      assert.equal(first.html, second.html, `${label}: deck is not deterministic`);
      assert.match(first.html, new RegExp(`sub-${subfamily.slug}\\b`), `${label}: subfamily class missing`);
      assertDocumentContract(first.html, { label, locale: 'en' });
    }
  }
});
