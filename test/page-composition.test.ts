import assert from 'node:assert/strict';
import test from 'node:test';
import { renderPage } from '../src/page/index.js';
import { styleSlugs } from '../src/styles/presets.js';
import { validateHtml } from '../src/validate.js';
import type { PageBrief, SectionBrief, StyleSlug } from '../src/types.js';

const sections: SectionBrief[] = [
  { kicker: '01 / Guía', title: 'Guía', body: 'Una fila completamente duplicada espera la validación.' },
  { kicker: '02 / Validación', title: 'Validación', body: 'La validación detecta la fila repetida y la rechaza.' },
  { kicker: '03 / Aviso', title: 'Aviso', body: 'La persona recibe una indicación clara para corregir la fila.' },
  { kicker: '04 / Cierre', title: 'Cierre', body: 'Nada se borra: la fila corregida vuelve a revisarse.' },
];

function page(style: StyleSlug, extra: Partial<PageBrief>): string {
  return renderPage(style, { title: 'Guía de validación', tagline: 'Una historia sobre una fila duplicada.', sections, ...extra });
}

test('a supported scene drives the hero illustration for every style', () => {
  for (const style of styleSlugs) {
    const html = page(style, { scene: 'table' });
    assert.match(html, /class="scene-art scene-/, `${style}: scene art missing for scene "table"`);
    assert.doesNotMatch(html, /data-composition-warning/, `${style}: supported scene must not warn`);
  }
});

test('papercraft keeps the collage as an explicit heroArt option', () => {
  const collage = page('papercraft', { heroArt: 'collage' });
  assert.match(collage, /class="collage"/, 'heroArt:"collage" must keep the fixed collage');
  assert.doesNotMatch(collage, /class="scene-art/, 'heroArt:"collage" must not draw a scene');

  const scene = page('papercraft', { scene: 'river' });
  assert.match(scene, /class="scene-art scene-papercraft/, 'a scene must replace the collage');
});

test('an unsupported scene is reported, never silently substituted', () => {
  for (const style of styleSlugs) {
    const html = page(style, { scene: 'dragon' });
    assert.match(html, /data-composition-warning/, `${style}: unsupported scene must render a visible warning`);
    assert.match(html, /role="note"/, `${style}: warning must be announced as a note`);
    if (style !== 'nature') {
      assert.doesNotMatch(html, /class="scene-art/, `${style}: an unsupported scene must not draw a random scene`);
    }
  }
  const papercraft = page('papercraft', { scene: 'dragon' });
  assert.match(papercraft, /class="collage"/, 'the default illustration stays explicit');
});

test('composition variants add the section types below the hero for every style', () => {
  for (const style of styleSlugs) {
    const split = page(style, { composition: 'split' });
    assert.match(split, /data-composition="split"/, `${style}: split variant missing`);
    assert.match(split, /data-section="explanation"/, `${style}: explanation section missing`);
    assert.match(split, /data-section="comparison"/, `${style}: comparison section missing`);
    assert.match(split, /data-section="cta"/, `${style}: CTA section missing`);

    const stepper = page(style, { composition: 'stepper' });
    assert.match(stepper, /data-composition="stepper"/, `${style}: stepper variant missing`);
    assert.match(stepper, /data-section="process"/, `${style}: process section missing`);
    assert.match(stepper, /data-section="cta"/, `${style}: CTA section missing`);

    const editorial = page(style, {});
    assert.doesNotMatch(editorial, /class="composition-band"/, `${style}: editorial must not add a band`);
  }
});

test('a CTA without a destination renders a visible limitation state', () => {
  for (const style of styleSlugs) {
    for (const href of [undefined, '', '#', 'https://example.com', 'placeholder']) {
      const html = page(style, { cta: { label: 'Empezar', href } });
      assert.match(html, /aria-disabled="true"/, `${style}: missing limitation state for href ${JSON.stringify(href)}`);
      assert.match(html, /role="note"/, `${style}: limitation state needs a note`);
      assert.doesNotMatch(
        html,
        /<a\b[^>]*class="[^"]*\bcta\b[^"]*"[^>]*href=""/i,
        `${style}: an empty-href CTA link must not be published`,
      );
    }
  }
});

test('a CTA with a real destination stays a link', () => {
  const html = page('nature', { composition: 'split', cta: { label: 'Escribinos', href: '#contact' } });
  assert.match(html, /<a class="comp-cta comp-cta-button" href="#contact">Escribinos<\/a>/);
});

test('the validator flags a CTA with an empty or placeholder href', () => {
  const style: StyleSlug = 'papercraft';
  const valid = renderPage(style, { title: 'X', sections, cta: { label: 'Empezar', href: '#contact' } });

  for (const href of ['', 'https://example.com']) {
    const bad = valid.replace('class="nav-cta" href="#contact"', `class="nav-cta" href="${href}"`);
    assert.notEqual(bad, valid, 'the CTA anchor must exist for the validator fixture');
    const result = validateHtml(bad, style);
    assert.ok(
      result.issues.some((issue) => issue.code === 'cta-no-destination'),
      `a CTA href ${JSON.stringify(href)} must be flagged`,
    );
  }
});

test('the rendered page never publishes a broken CTA anchor', () => {
  for (const style of styleSlugs) {
    const html = page(style, { cta: { label: 'Empezar', href: 'placeholder' } });
    assert.doesNotMatch(html, /<a\b[^>]*class="[^"]*\b(?:cta|btn|button|nav-cta)\b[^"]*"[^>]*href="(?:#|placeholder)"/i);
    assert.doesNotMatch(validateHtml(html, style).issues.map((issue) => issue.code).join(','), /cta-no-destination/);
  }
});

test('composition variants keep semantic HTML and ordered headings', () => {
  for (const style of styleSlugs) {
    for (const composition of ['editorial', 'split', 'stepper'] as const) {
      const html = page(style, { composition });
      assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `${style}/${composition}: exactly one h1`);
      for (const landmark of ['<header', '<main', '<section', '<footer']) {
        assert.ok(html.includes(landmark), `${style}/${composition}: missing ${landmark}`);
      }
      const headings = Array.from(html.matchAll(/<h([1-3])\b/gi)).map((match) => Number(match[1]));
      assert.ok(headings.length > 1, `${style}/${composition}: needs headings`);
      for (let index = 1; index < headings.length; index += 1) {
        assert.ok(
          headings[index]! <= headings[index - 1]! + 1,
          `${style}/${composition}: heading level jumps from h${headings[index - 1]} to h${headings[index]}`,
        );
      }
    }
  }
});
