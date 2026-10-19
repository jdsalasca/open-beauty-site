import assert from 'node:assert/strict';
import test from 'node:test';
import { renderDeck } from '../src/deck.js';
import { createDeck } from '../src/generate.js';
import { validateDeck } from '../src/validate.js';
import { BeautyError } from '../src/page/common.js';
import { getStyle, styleSlugs } from '../src/styles/presets.js';
import { DECK_CONTENT_SLIDE_LIMIT, DECK_POINT_LIMIT, DECK_STAT_LIMIT, DECK_WORD_LIMIT } from '../src/types/deck.js';
import type { DeckSlide } from '../src/types.js';

function contentSlides(count: number): DeckSlide[] {
  return Array.from({ length: count }, (_, index) => ({
    layout: 'statement' as const,
    kicker: `${String(index + 1).padStart(2, '0')} / Bloque`,
    title: `Lámina ${index + 1}`,
    body: `Idea breve de la lámina ${index + 1}.`,
  }));
}

function statsSlide(count: number): DeckSlide {
  return {
    layout: 'stats',
    kicker: 'La evidencia',
    title: 'Cifras del sprint',
    stats: Array.from({ length: count }, (_, index) => ({
      value: `${index + 1}0%`,
      label: `Indicador ${index + 1}`,
    })),
  };
}

function plainDeckHtml(blocks: string[]): string {
  return `<!doctype html><html lang="es"><head><title>Prueba</title></head><body class="deck"><main class="deck-stage">${blocks.join('')}</main></body></html>`;
}

test('a ten-slide brief renders twelve slides and reports the real count', async () => {
  const brief = { title: 'Diez pasos', locale: 'es' as const, slides: contentSlides(10) };
  const deck = renderDeck({ style: getStyle('galactic'), brief });
  assert.equal(deck.slideCount, 12);
  assert.equal((deck.html.match(/<section class="slide/g) ?? []).length, 12);
  for (let index = 1; index <= 10; index += 1) {
    assert.ok(deck.html.includes(`Lámina ${index}`), `missing authored slide ${index}`);
  }

  const created = await createDeck({ style: 'galactic', brief });
  assert.equal(created.slideCount, 12);
});

test('fourteen content slides are the honest maximum and none is dropped', () => {
  const deck = renderDeck({
    style: getStyle('nature'),
    brief: { title: 'Catorce', locale: 'es', slides: contentSlides(DECK_CONTENT_SLIDE_LIMIT) },
  });
  assert.equal(deck.slideCount, DECK_CONTENT_SLIDE_LIMIT + 2);
  for (let index = 1; index <= DECK_CONTENT_SLIDE_LIMIT; index += 1) {
    assert.ok(deck.html.includes(`Lámina ${index}`), `missing authored slide ${index}`);
  }
});

test('fifteen content slides fail loudly with count, limit and how to split', () => {
  assert.throws(
    () => renderDeck({ style: getStyle('galactic'), brief: { title: 'Demasiado', locale: 'es', slides: contentSlides(15) } }),
    (error: unknown) => {
      assert.ok(error instanceof BeautyError, 'expected a BeautyError');
      assert.equal(error.code, 'DECK_TOO_MANY_SLIDES');
      assert.match(error.message, /15 content slides/);
      assert.match(error.message, new RegExp(`at most ${DECK_CONTENT_SLIDE_LIMIT}`));
      assert.match(error.message, /split/i);
      return true;
    },
  );
});

test('stats slides render every item from three to six without losing any', () => {
  for (let count = 3; count <= DECK_STAT_LIMIT; count += 1) {
    const deck = renderDeck({
      style: getStyle('isotype'),
      brief: {
        title: 'Panel',
        locale: 'es',
        slides: [
          { layout: 'statement', title: 'Antes', body: 'Una idea breve.' },
          statsSlide(count),
          { layout: 'quote', title: 'Cierre', quote: { text: 'Una frase.', author: 'Equipo' } },
        ],
      },
    });
    assert.equal((deck.html.match(/class="stat anim"/g) ?? []).length, count, `${count} stats rendered`);
    for (let index = 1; index <= count; index += 1) {
      assert.ok(deck.html.includes(`Indicador ${index}`), `stat ${index} missing with ${count} supplied`);
    }
  }
});

test('the stats grid is responsive in every style', () => {
  for (const style of styleSlugs) {
    const html = renderDeck({ style: getStyle(style), brief: { title: 'Panel', locale: 'es', slides: [statsSlide(6)] } }).html;
    assert.match(html, /\.stat-grid\{display:grid;grid-template-columns:repeat\(auto-fit,minmax\(min\(190px,100%\),1fr\)\)/, `${style} stats grid`);
    assert.equal((html.match(/class="stat anim"/g) ?? []).length, 6, `${style} dropped stats`);
  }
});

test('more than six stats fails loudly instead of dropping cards', () => {
  assert.throws(
    () => renderDeck({ style: getStyle('isotype'), brief: { title: 'Panel', locale: 'es', slides: [statsSlide(DECK_STAT_LIMIT + 1)] } }),
    (error: unknown) => {
      assert.ok(error instanceof BeautyError, 'expected a BeautyError');
      assert.match(error.message, new RegExp(`${DECK_STAT_LIMIT + 1} stats`));
      assert.match(error.message, new RegExp(`at most ${DECK_STAT_LIMIT}`));
      return true;
    },
  );
});

test('more than four points fails loudly instead of dropping cards', () => {
  assert.throws(
    () =>
      renderDeck({
        style: getStyle('brutalist'),
        brief: {
          title: 'Cinco',
          locale: 'es',
          slides: [
            {
              layout: 'points',
              title: 'Los cinco puntos',
              points: ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco'].map((title) => ({ title })),
            },
          ],
        },
      }),
    (error: unknown) => {
      assert.ok(error instanceof BeautyError, 'expected a BeautyError');
      assert.match(error.message, /5 points/);
      assert.match(error.message, new RegExp(`at most ${DECK_POINT_LIMIT}`));
      return true;
    },
  );
});

test('the word-count warning names the slide, counts labels, states the limit and how to fix it', () => {
  const body = Array.from({ length: 60 }, (_, index) => `palabra${index + 1}`).join(' ');
  const html = plainDeckHtml([
    `<section class="slide layout-statement" data-index="1"><p class="kicker">Rótulo visible</p><h2>El argumento</h2><p>${body}</p></section>`,
  ]);
  const issue = validateDeck(html, 'galactic').issues.find((candidate) => candidate.code === 'deck-word-count');
  assert.ok(issue, 'expected a deck-word-count issue');
  const words = `${'Rótulo visible'.split(' ').length + 'El argumento'.split(' ').length + 60}`;
  assert.match(issue.message, /Slide 1/);
  assert.match(issue.message, /El argumento/);
  assert.match(issue.message, new RegExp(`\\b${words}\\b`));
  assert.match(issue.message, new RegExp(`\\b${DECK_WORD_LIMIT}\\b`));
  assert.match(issue.message, /labels include|including labels/i);
  assert.match(issue.fix, new RegExp(`${DECK_WORD_LIMIT} words or split it into two slides`));
});

test('the points warning names the slide, the card count and the limit', () => {
  const cards = ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco']
    .map((title, index) => `<article class="point anim" style="--a:${index + 2}"><span>0${index + 1}</span><h3>${title}</h3></article>`)
    .join('');
  const html = plainDeckHtml([
    `<section class="slide layout-points" data-index="1"><p class="kicker">Tres ideas</p><h2>Los cinco puntos</h2><div class="point-grid">${cards}</div></section>`,
  ]);
  const issue = validateDeck(html, 'galactic').issues.find((candidate) => candidate.code === 'deck-too-many-points');
  assert.ok(issue, 'expected a deck-too-many-points issue');
  assert.match(issue.message, /Slide 1/);
  assert.match(issue.message, /Los cinco puntos/);
  assert.match(issue.message, /\b5\b/);
  assert.match(issue.message, new RegExp(`\\b${DECK_POINT_LIMIT}\\b`));
});

test('four points are allowed and the grid container is not counted as a card', () => {
  const cards = ['Uno', 'Dos', 'Tres', 'Cuatro']
    .map((title, index) => `<article class="point anim" style="--a:${index + 2}"><span>0${index + 1}</span><h3>${title}</h3></article>`)
    .join('');
  const html = plainDeckHtml([
    `<section class="slide layout-points" data-index="1"><h2>Cuatro puntos</h2><div class="point-grid">${cards}</div></section>`,
  ]);
  const issues = validateDeck(html, 'galactic').issues;
  assert.ok(!issues.some((issue) => issue.code === 'deck-too-many-points'), 'four cards must not be flagged');
});

test('a stats slide with more than six cards is flagged and six pass', () => {
  const cards = (count: number) =>
    `<div class="stat-grid">${Array.from(
      { length: count },
      (_, index) => `<div class="stat anim" style="--a:${index + 2}"><strong>${index + 1}0</strong><span>Dato ${index + 1}</span></div>`,
    ).join('')}</div>`;
  const seven = validateDeck(plainDeckHtml([`<section class="slide layout-stats" data-index="1"><h2>Panel</h2>${cards(7)}</section>`]), 'galactic');
  assert.ok(seven.issues.some((issue) => issue.code === 'deck-too-many-stats'));
  const six = validateDeck(plainDeckHtml([`<section class="slide layout-stats" data-index="1"><h2>Panel</h2>${cards(6)}</section>`]), 'galactic');
  assert.ok(!six.issues.some((issue) => issue.code === 'deck-too-many-stats'), 'six stats are within the limit');
});

test('a within-limits deck still scores A with no deck warnings', () => {
  const deck = renderDeck({
    style: getStyle('memphis'),
    brief: {
      title: 'Un deck correcto',
      tagline: 'Dentro de los límites.',
      locale: 'es',
      slides: [
        { layout: 'statement', kicker: '01', title: 'La idea', body: 'Una idea breve que se sostiene sola.' },
        statsSlide(6),
        {
          layout: 'points',
          kicker: '03',
          title: 'Los movimientos',
          points: ['Uno', 'Dos', 'Tres'].map((title) => ({ title, body: 'Una práctica concreta.' })),
        },
        { layout: 'quote', kicker: '04', title: 'Una voz', quote: { text: 'Menos, pero mejor.', author: 'Equipo' } },
      ],
    },
  });
  const result = validateDeck(deck.html, 'memphis');
  assert.deepEqual(result.issues.filter((issue) => issue.code.startsWith('deck-')), []);
  assert.equal(result.grade, 'A');
});

test('the cover carries title, tagline, author, date and the brief brand in all thirteen styles', () => {
  for (const style of styleSlugs) {
    const deck = renderDeck({
      style: getStyle(style),
      brief: {
        title: 'Órbita Sur',
        tagline: 'Una lectura del territorio',
        author: 'Colectivo Faro',
        date: 'octubre 2026',
        locale: 'es',
      },
    });
    for (const value of ['Órbita Sur', 'Una lectura del territorio', 'Colectivo Faro', 'octubre 2026']) {
      assert.ok(deck.html.includes(value), `${style}: cover missing "${value}"`);
    }
    assert.doesNotMatch(deck.html, /OPEN\/BEAUTY/, `${style}: invented a house brand`);
  }
});

test('the brand falls back to the title and respects an explicit brand', () => {
  const fallback = renderDeck({ style: getStyle('artdeco'), brief: { title: 'Órbita Sur', locale: 'es' } }).html;
  assert.match(fallback, /class="deck-brand">Órbita Sur<span>/);
  assert.doesNotMatch(fallback, /OPEN\/BEAUTY/);

  const explicit = renderDeck({ style: getStyle('artdeco'), brief: { title: 'Órbita Sur', brand: 'Faro Norte', locale: 'es' } }).html;
  assert.match(explicit, /class="deck-brand">Faro Norte<span>/);

  const house = renderDeck({ style: getStyle('artdeco'), brief: { title: 'Página aliada', brand: 'OPEN/BEAUTY', locale: 'es' } }).html;
  assert.match(house, /OPEN\/BEAUTY/);
});
