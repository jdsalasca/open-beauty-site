import assert from 'node:assert/strict';
import test from 'node:test';
import { renderDeck } from '../src/deck.js';
import { BeautyError } from '../src/page/common.js';
import { getStyle } from '../src/styles/presets.js';
import type { DeckBriefInput, DeckSlide } from '../src/types/deck.js';
import type { SectionBrief } from '../src/types.js';

const style = getStyle('brutalist');
const limits = {
  deckTitle: 120,
  tagline: 200,
  intro: 900,
  eyebrow: 60,
  brand: 50,
  author: 60,
  date: 40,
  closing: 120,
  ctaLabel: 40,
  ctaHref: 200,
  kicker: 40,
  slideTitle: 120,
  slideBody: 300,
  pointTitle: 80,
  pointBody: 180,
  statValue: 18,
  statLabel: 48,
  quoteText: 320,
  quoteAuthor: 90,
};

function text(length: number, ending = 'FINAL'): string {
  return 'x'.repeat(Math.max(0, length - ending.length)) + ending;
}

function render(brief: DeckBriefInput) {
  return renderDeck({ style, brief });
}

function slideBrief(slide: DeckSlide): DeckBriefInput {
  return { title: 'Auditoría', locale: 'es', slides: [slide] };
}

function expectTooLong(brief: DeckBriefInput, field: RegExp, count: number, limit: number, slide?: string) {
  assert.throws(
    () => render(brief),
    (error: unknown) => {
      assert.ok(error instanceof BeautyError, `expected a BeautyError for ${field}`);
      assert.equal(error.code, 'DECK_TEXT_TOO_LONG');
      assert.match(error.message, field);
      assert.match(error.message, new RegExp(`\\b${count}\\b`));
      assert.match(error.message, new RegExp(`\\b${limit}\\b`));
      if (slide) assert.match(error.message, new RegExp(slide));
      assert.match(error.message, /shorten|split|move/i);
      return true;
    },
  );
}

test('over-limit slide text fails loudly with slide, field, count, limit and how to split', () => {
  const cases: Array<{ name: string; slide: DeckSlide; field: RegExp; limit: number }> = [
    { name: 'kicker', slide: { title: 'Kicker', kicker: text(limits.kicker + 1) }, field: /kicker/i, limit: limits.kicker },
    { name: 'title', slide: { title: text(limits.slideTitle + 1) }, field: /title/i, limit: limits.slideTitle },
    { name: 'body', slide: { title: 'Body', body: text(limits.slideBody + 1) }, field: /body/i, limit: limits.slideBody },
    {
      name: 'point title',
      slide: { layout: 'points', title: 'Puntos', points: [{ title: text(limits.pointTitle + 1) }] },
      field: /points\[0\]\.title/,
      limit: limits.pointTitle,
    },
    {
      name: 'point body',
      slide: { layout: 'points', title: 'Puntos', points: [{ title: 'Punto', body: text(limits.pointBody + 1) }] },
      field: /points\[0\]\.body/,
      limit: limits.pointBody,
    },
    {
      name: 'stat value',
      slide: { layout: 'stats', title: 'Datos', stats: [{ value: text(limits.statValue + 1), label: 'Dato' }] },
      field: /stats\[0\]\.value/,
      limit: limits.statValue,
    },
    {
      name: 'stat label',
      slide: { layout: 'stats', title: 'Datos', stats: [{ value: '1', label: text(limits.statLabel + 1) }] },
      field: /stats\[0\]\.label/,
      limit: limits.statLabel,
    },
    {
      name: 'quote text',
      slide: { layout: 'quote', title: 'Cita', quote: { text: text(limits.quoteText + 1) } },
      field: /quote\.text/,
      limit: limits.quoteText,
    },
    {
      name: 'quote author',
      slide: { layout: 'quote', title: 'Cita', quote: { text: 'Una frase.', author: text(limits.quoteAuthor + 1) } },
      field: /quote\.author/,
      limit: limits.quoteAuthor,
    },
  ];

  for (const item of cases) {
    expectTooLong(slideBrief(item.slide), item.field, (text(item.limit + 1).length), item.limit, /slide|"Kicker"|"Puntos"|"Datos"|"Cita"/);
  }
});

test('over-limit cover and closing text fails loudly instead of being clipped', () => {
  const cases: Array<{ name: string; brief: DeckBriefInput; field: RegExp; limit: number }> = [
    { name: 'deck title', brief: { title: text(limits.deckTitle + 1) }, field: /title/i, limit: limits.deckTitle },
    { name: 'tagline', brief: { title: 'D', tagline: text(limits.tagline + 1) }, field: /tagline/i, limit: limits.tagline },
    { name: 'intro', brief: { title: 'D', intro: text(limits.intro + 1) }, field: /intro/i, limit: limits.intro },
    { name: 'eyebrow', brief: { title: 'D', eyebrow: text(limits.eyebrow + 1) }, field: /eyebrow/i, limit: limits.eyebrow },
    { name: 'brand', brief: { title: 'D', brand: text(limits.brand + 1) }, field: /brand/i, limit: limits.brand },
    { name: 'author', brief: { title: 'D', author: text(limits.author + 1) }, field: /author/i, limit: limits.author },
    { name: 'date', brief: { title: 'D', date: text(limits.date + 1) }, field: /date/i, limit: limits.date },
    { name: 'closing', brief: { title: 'D', closing: text(limits.closing + 1) }, field: /closing/i, limit: limits.closing },
    { name: 'cta label', brief: { title: 'D', cta: { label: text(limits.ctaLabel + 1), href: '#' } }, field: /cta\.label/i, limit: limits.ctaLabel },
    { name: 'cta href', brief: { title: 'D', cta: { label: 'Ir', href: `#${text(limits.ctaHref)}` } }, field: /cta\.href/i, limit: limits.ctaHref },
  ];

  for (const item of cases) {
    expectTooLong(item.brief, item.field, text(item.limit + 1).length, item.limit);
  }
});

test('the legacy sections fallback keeps all four sections and rejects a fifth', () => {
  const sections: SectionBrief[] = ['Uno', 'Dos', 'Tres', 'Cuatro'].map((title) => ({ title, body: `Cuerpo ${title}.` }));
  const deck = render({ title: 'Secciones', locale: 'es', sections });
  for (const section of sections) {
    assert.ok(deck.html.includes(section.title), `section "${section.title}" disappeared`);
    assert.ok(deck.html.includes(section.body), `section body "${section.body}" disappeared`);
  }

  assert.throws(
    () =>
      render({
        title: 'Secciones',
        locale: 'es',
        sections: [...sections, { title: 'Cinco', body: 'Cuerpo Cinco.' }],
      }),
    (error: unknown) => {
      assert.ok(error instanceof BeautyError, 'expected a BeautyError');
      assert.equal(error.code, 'DECK_TOO_MANY_SECTIONS');
      assert.match(error.message, /\b5\b/);
      assert.match(error.message, /\b4\b/);
      assert.match(error.message, /split/i);
      return true;
    },
  );
});

test('text exactly at every limit survives intact in the rendered deck', () => {
  const cases: Array<{ name: string; brief: DeckBriefInput; needle: string }> = [];
  const addSlide = (name: string, slide: DeckSlide, needle: string) => {
    cases.push({ name, brief: slideBrief(slide), needle });
  };

  const kicker = text(limits.kicker);
  addSlide('kicker', { title: 'Kicker', kicker }, kicker);
  const title = text(limits.slideTitle);
  addSlide('slide title', { title }, title);
  const body = text(limits.slideBody);
  addSlide('slide body', { title: 'Body', body }, body);
  const pointTitle = text(limits.pointTitle);
  addSlide('point title', { layout: 'points', title: 'Puntos', points: [{ title: pointTitle }] }, pointTitle);
  const pointBody = text(limits.pointBody);
  addSlide('point body', { layout: 'points', title: 'Puntos', points: [{ title: 'Punto', body: pointBody }] }, pointBody);
  const statValue = text(limits.statValue);
  addSlide('stat value', { layout: 'stats', title: 'Datos', stats: [{ value: statValue, label: 'Dato' }] }, statValue);
  const statLabel = text(limits.statLabel);
  addSlide('stat label', { layout: 'stats', title: 'Datos', stats: [{ value: '1', label: statLabel }] }, statLabel);
  const quoteText = text(limits.quoteText);
  addSlide('quote text', { layout: 'quote', title: 'Cita', quote: { text: quoteText } }, quoteText);
  const quoteAuthor = text(limits.quoteAuthor);
  addSlide('quote author', { layout: 'quote', title: 'Cita', quote: { text: 'Frase.', author: quoteAuthor } }, quoteAuthor);

  const deckTitle = text(limits.deckTitle);
  cases.push({ name: 'deck title', brief: { title: deckTitle }, needle: deckTitle });
  const tagline = text(limits.tagline);
  cases.push({ name: 'tagline', brief: { title: 'D', tagline }, needle: tagline });
  const intro = text(limits.intro);
  cases.push({ name: 'intro', brief: { title: 'D', intro }, needle: intro });
  const eyebrow = text(limits.eyebrow);
  cases.push({ name: 'eyebrow', brief: { title: 'D', eyebrow }, needle: eyebrow });
  const brand = text(limits.brand);
  cases.push({ name: 'brand', brief: { title: 'D', brand }, needle: brand });
  const author = text(limits.author);
  cases.push({ name: 'author', brief: { title: 'D', author }, needle: author });
  const date = text(limits.date);
  cases.push({ name: 'date', brief: { title: 'D', date }, needle: date });
  const closing = text(limits.closing);
  cases.push({ name: 'closing', brief: { title: 'D', closing }, needle: closing });
  const ctaLabel = text(limits.ctaLabel);
  cases.push({ name: 'cta label', brief: { title: 'D', cta: { label: ctaLabel, href: '#' } }, needle: ctaLabel });

  for (const item of cases) {
    const html = render(item.brief).html;
    assert.ok(html.includes(item.needle), `${item.name}: the original text was shortened`);
  }
});
