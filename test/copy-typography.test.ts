import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { deriveCopy, makeArtifact } from '../src/make.js';
import { fixHtml } from '../src/fix.js';
import { validateHtml } from '../src/validate.js';
import { criticReport } from '../src/critic.js';
import { renderPage } from '../src/page/index.js';
import { styleSlugs } from '../src/styles/presets.js';
import { longestWordLength } from '../src/a11y.js';
import type { Locale } from '../src/types.js';

const LONG_IDEA: Record<Locale, string> = {
  es: 'Landing editorial en español para el piloto Noche polinizadora: caminatas nocturnas vecinales que registran paisajes sonoros de jardines sin afirmar especies sin revisión; explicar consentimiento, luz baja, método de fichas y convocatoria.',
  en: 'A landing page about a night-pollinating pilot: nocturnal neighbourhood walks that record garden soundscapes without claiming species; explain consent, low light and the method.',
};

const LONG_WORD_IDEA: Record<Locale, string> = {
  es: 'Contemplación de la orilla: un cuaderno de campo.',
  en: 'Extraordinariamente slow: a field notebook for the shore.',
};

const NEUTRAL_IDEA: Record<Locale, string> = {
  es: 'Un cuaderno de campo sobre las mareas y la memoria del barrio.',
  en: 'A field notebook about tides and the memory of a neighbourhood.',
};

const FOREIGN_TOKENS = [
  'wien',
  'sozialbauten',
  'meiji',
  '1831',
  'milano',
  '1981',
  'san francisco',
  'londres',
  'nueva york',
  'parís',
  'scriptorium',
  'siglo xiii',
  'liber bestiarum',
  'fol. xii',
  'mi_museo',
  'cosas_pequeñas',
  'semillas.bmp',
  'bichos.exe',
  'lección_01',
  'serie 1967',
  '1967',
  '1964',
  '1999',
  'buenos aires',
  '34°36',
  '149 597 870',
  'ra 05h',
  'viena',
];

let dir: string;

before(async () => {
  dir = await mkdtemp(path.join(os.tmpdir(), 'beauty-copy-'));
});

after(async () => {
  await rm(dir, { recursive: true, force: true });
});

function h1Text(html: string): string {
  const match = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  return (match?.[1] ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fitPx(html: string): number | undefined {
  const match = /--headline-fit\s*:\s*(\d+(?:\.\d+)?)px/i.exec(html);
  return match ? Number(match[1]) : undefined;
}

function fitRatio(html: string): number {
  const match = /--headline-ratio\s*:\s*(\d+(?:\.\d+)?)/i.exec(html);
  return match ? Number(match[1]) : 0.62;
}

test('deriveCopy understands prompt-like phrasing, quotes and clause structure', () => {
  assert.equal(deriveCopy('Landing editorial en español para el piloto Noche polinizadora: caminatas.', 'es').title, 'piloto Noche polinizadora');
  assert.equal(deriveCopy('A landing page about a neighborhood bakery that bakes at dawn.', 'en').title, 'neighborhood bakery');
  assert.equal(deriveCopy('Un cartel "Noche polinizadora" para el barrio.', 'es').title, 'Noche polinizadora');
  const copy = deriveCopy('Contemplación: una práctica para mirar despacio.', 'es');
  assert.equal(copy.title, 'Contemplación');
  assert.equal(copy.tagline, 'Contemplación');
  assert.match(copy.intro, /una práctica/);
});

test('long prompt-like ideas produce a short headline in every style and locale', async () => {
  for (const style of styleSlugs) {
    for (const locale of ['es', 'en'] as const) {
      const output = path.join(dir, 'title', `${style}-${locale}.html`);
      const result = await makeArtifact({ kind: 'page', style, locale, idea: LONG_IDEA[locale], output });
      assert.ok(!result.issues.some((issue) => issue.code === 'idea-as-title'), `${style}/${locale}: idea-as-title`);
      const html = await readFile(result.path, 'utf8');
      const title = h1Text(html);
      assert.ok(title.split(/\s+/).filter(Boolean).length <= 5, `${style}/${locale}: h1 "${title}" is too long`);
      assert.ok(Array.from(title).length <= 60, `${style}/${locale}: h1 "${title}" is too many characters`);
      assert.ok(!/landing (editorial|page)/i.test(title), `${style}/${locale}: the prompt leaked into the h1`);
      assert.match(html, locale === 'es' ? /Noche polinizadora/ : /night-pollinating pilot/, `${style}/${locale}: the subject left the page`);
    }
  }
});

test('title and tagline overrides win over the derivation', async () => {
  const output = path.join(dir, 'override.html');
  const result = await makeArtifact({
    kind: 'page',
    style: 'nature',
    locale: 'es',
    idea: 'Una idea larga que debería acortarse para el titular y no caber entera en él.',
    title: 'Titular propio',
    tagline: 'Línea propia.',
    output,
  });
  const html = await readFile(result.path, 'utf8');
  assert.match(html, /Titular propio/);
  assert.match(html, /Línea propia/);
  assert.equal(h1Text(html), 'Titular propio');
});

test('the longest headline word fits 360px in every style and locale', async () => {
  for (const style of styleSlugs) {
    for (const locale of ['es', 'en'] as const) {
      const output = path.join(dir, 'fit', `${style}-${locale}.html`);
      const result = await makeArtifact({ kind: 'page', style, locale, idea: LONG_WORD_IDEA[locale], output });
      assert.ok(!result.issues.some((issue) => issue.code === 'headline-fits'), `${style}/${locale}: headline-fits`);
      const html = await readFile(result.path, 'utf8');
      const title = h1Text(html);
      const fit = fitPx(html);
      assert.ok(fit, `${style}/${locale}: no --headline-fit emitted`);
      const longest = longestWordLength(title);
      assert.ok(longest >= 13, `${style}/${locale}: expected a long word, got ${longest} ("${title}")`);
      const rendered = Math.min(fit!, (360 * 12) / 100);
      const ratio = fitRatio(html);
      assert.ok(longest * ratio * rendered <= 360, `${style}/${locale}: ${longest} letters at ${rendered}px (ratio ${ratio}) overflows 360px`);
    }
  }
});

test('a prompt-length h1 is flagged as idea-as-title and cannot score an A', () => {
  const html = renderPage('nature', {
    title: 'Una frase larguísima que parece un prompt entero y no un titular corto',
    locale: 'es',
  });
  const result = validateHtml(html, 'nature');
  assert.ok(result.issues.some((issue) => issue.code === 'idea-as-title'), 'expected idea-as-title');
  assert.notEqual(result.grade, 'A');
});

test('the critic warns when brief fields never reach the page', () => {
  const brief = {
    title: 'Atelier Lumen',
    locale: 'en' as const,
    tagline: 'Objects that age well.',
    sections: [{ title: 'Objects', body: 'A short card body with enough words to read as a section.' }],
  };
  const html = renderPage('nature', brief);
  const complete = criticReport(html, 'nature', brief).categories.find((category) => category.name === 'brief-fidelity');
  assert.ok(complete, 'expected a brief-fidelity category');
  assert.equal(complete!.score, 100, `complete brief scored ${complete!.score}`);

  const partial = criticReport(html, 'nature', { ...brief, tagline: 'A line that never appears in the page at all.' })
    .categories.find((category) => category.name === 'brief-fidelity');
  assert.ok(partial!.findings.some((finding) => /tagline/i.test(finding)), 'expected a tagline finding');
  assert.ok(partial!.score < 100);
});

test('generated pages carry no foreign demo data in any style or locale', async () => {
  for (const style of styleSlugs) {
    for (const locale of ['es', 'en'] as const) {
      const output = path.join(dir, 'foreign', `${style}-${locale}.html`);
      const result = await makeArtifact({ kind: 'page', style, locale, idea: NEUTRAL_IDEA[locale], output });
      const html = (await readFile(result.path, 'utf8')).toLowerCase();
      for (const token of FOREIGN_TOKENS) {
        assert.ok(!html.includes(token), `${style}/${locale}: foreign demo data "${token}"`);
      }
    }
  }
});

test('an open palette warning cannot score an A and beauty fix resolves it', () => {
  const base = renderPage('isotype', {
    title: 'Atelier Lumen',
    locale: 'en',
    sections: [{ title: 'One', body: 'A short card body with enough words to read as a section.' }],
  });
  const html = base.replace('</head>', '<style>body{background:#123456}</style></head>');
  const result = validateHtml(html, 'isotype');
  assert.ok(result.issues.some((issue) => issue.code === 'color-outside-palette'), 'expected a palette warning');
  assert.ok(result.issues.some((issue) => issue.severity === 'warn'), 'expected an open warning');
  assert.notEqual(result.grade, 'A', `an open warning scored ${result.grade} ${result.score}`);
  assert.ok(result.score >= 90, 'the score still reflects the weighted penalty');

  const fixed = fixHtml(html, 'isotype');
  assert.ok(
    !validateHtml(fixed.html, 'isotype').issues.some((issue) => issue.code === 'color-outside-palette'),
    'fix left a palette warning',
  );
  assert.equal(fixed.after.grade, 'A');
});
