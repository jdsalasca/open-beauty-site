import assert from 'node:assert/strict';
import test from 'node:test';
import { renderPage } from '../src/page/index.js';
import { renderExperience } from '../src/page/experience.js';
import { renderStory } from '../src/page/story.js';
import { getStyle, styleSlugs } from '../src/styles/presets.js';
import type { Brief } from '../src/types.js';

const brief: Brief = {
  title: 'Captura fiel',
  tagline: 'Todo el contenido visible sin scroll.',
  intro: 'Una página de prueba con secciones suficientes para que existan reveals bajo el pliegue.',
  sections: [
    { kicker: 'Uno', title: 'Primera', body: 'Un cuerpo breve.' },
    { kicker: 'Dos', title: 'Segunda', body: 'Otro cuerpo breve.' },
    { kicker: 'Tres', title: 'Tercera', body: 'Un tercer cuerpo breve.' },
  ],
  locale: 'es',
};

test('every page style ships the capture and static reveal fallbacks', () => {
  for (const style of styleSlugs) {
    const html = renderPage(style, brief);
    assert.match(html, /navigator\.webdriver/, `${style}: webdriver fallback`);
    assert.match(html, /URLSearchParams/, `${style}: query param parsing`);
    assert.match(html, /params\.has\('static'\)/, `${style}: ?static handling`);
    assert.match(html, /html\.is-capturing \.reveal/, `${style}: capture class shows reveals`);
    assert.match(html, /prefers-reduced-motion/, `${style}: reduced motion fallback`);
    assert.match(html, /@media print/, `${style}: print fallback`);
  }
});

test('experiences and stories also ship the capture fallbacks', () => {
  const experience = renderExperience(
    { title: 'Museo', locale: 'es', rooms: [{ title: 'A', body: 'a' }, { title: 'B', body: 'b' }, { title: 'C', body: 'c' }] },
    getStyle('nature'),
  );
  const story = renderStory(
    { title: 'Cuento', locale: 'es', chapters: [{ title: 'Uno', body: 'a' }, { title: 'Dos', body: 'b' }] },
    getStyle('nature'),
  );
  for (const [label, html] of [['experience', experience], ['story', story]] as const) {
    assert.match(html, /navigator\.webdriver/, `${label}: webdriver fallback`);
    assert.match(html, /params\.has\('static'\)/, `${label}: ?static handling`);
    assert.match(html, /html\.is-capturing \.reveal/, `${label}: capture class`);
  }
});

test('the skip link stays off-canvas until focused and hides while capturing', () => {
  const html = renderPage('brutalist', brief);
  assert.match(html, /\.skip-link\{position:absolute/, 'skip link must scroll with the document');
  assert.match(html, /\.skip-link:focus,\.skip-link:focus-visible\{top:14px\}/, 'skip link appears on focus');
  assert.match(html, /html\.is-capturing \.skip-link\{display:none/, 'skip link must not appear in captures');
});
