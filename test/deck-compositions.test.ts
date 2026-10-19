import assert from 'node:assert/strict';
import test from 'node:test';
import { renderDeck } from '../src/deck.js';
import { BeautyError } from '../src/page/common.js';
import { ART_DIRECTION } from '../src/styles/art-direction.js';
import { getStyle } from '../src/styles/presets.js';
import { validateDeck } from '../src/validate.js';
import type { DeckBriefInput, DeckPurpose, DeckSlide } from '../src/types/deck.js';

const style = getStyle('nature');

function render(slides: DeckSlide[], extra: Partial<DeckBriefInput> = {}) {
  return renderDeck({ style, brief: { title: 'Composición', locale: 'es', slides, ...extra } });
}

function contentBlock(html: string, index: number): string {
  const blocks = html.match(/<section class="slide[\s\S]*?<\/section>/g) ?? [];
  const block = blocks[index + 1];
  assert.ok(block, `content slide ${index} is missing`);
  return block;
}

function innerTag(block: string): string {
  const tag = block.match(/<div class="slide-inner[\s\S]*?>/)?.[0];
  assert.ok(tag, 'the slide has no inner container');
  return tag;
}

const comparisonPoints = [
  { title: 'Antes', body: 'La guía entra con una fila repetida.' },
  { title: 'Después', body: 'La validación rechaza la entrada y señala la fila.' },
];

const processSteps = [
  { title: 'Detectar', body: 'La validación encuentra la fila duplicada.' },
  { title: 'Rechazar', body: 'La entrada no se procesa.' },
  { title: 'Corregir', body: 'La persona recibe la indicación y ajusta la fila.' },
];

const table = {
  caption: 'Recorrido de la guía',
  columns: ['Estado', 'Qué ocurre'],
  rows: [
    ['Detectada', 'La validación señala la fila duplicada.'],
    ['Rechazada', 'La entrada no se procesa.'],
  ],
};

test('every purpose renders its own composition instead of a card grid', () => {
  const cases: Array<{ purpose: DeckPurpose; slide: DeckSlide; marker: RegExp; focus: string }> = [
    {
      purpose: 'cover',
      slide: { purpose: 'cover', kicker: 'Apertura', title: 'La guía bajo revisión', body: 'Una validación la detecta.' },
      marker: /comp-cover-grid/,
      focus: 'title',
    },
    {
      purpose: 'problem',
      slide: {
        purpose: 'problem',
        kicker: 'El problema',
        title: 'Una guía repite una fila completa',
        body: 'La validación la detecta y rechaza la entrada.',
        points: [{ title: 'Fila duplicada', body: 'Mismos datos en dos renglones.' }],
      },
      marker: /comp-signals/,
      focus: 'title',
    },
    {
      purpose: 'comparison',
      slide: { purpose: 'comparison', kicker: 'Antes y después', title: 'Qué cambia', points: comparisonPoints },
      marker: /comp-compare/,
      focus: 'after',
    },
    {
      purpose: 'process',
      slide: { purpose: 'process', kicker: 'El proceso', title: 'Tres pasos', steps: processSteps },
      marker: /comp-process/,
      focus: 'steps',
    },
    {
      purpose: 'example',
      slide: {
        purpose: 'example',
        kicker: 'El objeto',
        title: 'La guía señalada',
        body: 'La fila duplicada se marca antes de continuar.',
        figure: { subject: 'table', caption: 'Fila duplicada señalada', source: 'Original' },
      },
      marker: /comp-example-figure/,
      focus: 'object',
    },
    {
      purpose: 'result',
      slide: { purpose: 'result', kicker: 'El resultado', title: 'La entrada se corrige', body: 'Nada se modifica solo.', table },
      marker: /comp-result/,
      focus: 'statement',
    },
    {
      purpose: 'next-steps',
      slide: {
        purpose: 'next-steps',
        kicker: 'Próximos pasos',
        title: 'Qué sigue',
        points: [
          { title: 'Revisar la indicación', body: 'Operaciones · hoy' },
          { title: 'Corregir la fila', body: 'Persona responsable · al recibirla' },
        ],
      },
      marker: /comp-next/,
      focus: 'steps',
    },
    {
      purpose: 'table',
      slide: { purpose: 'table', kicker: 'La tabla', title: 'Estados de la guía', table },
      marker: /<table class="comp-table">/,
      focus: 'table',
    },
  ];

  for (const item of cases) {
    const html = render([item.slide]).html;
    const block = contentBlock(html, 0);
    const tag = innerTag(block);
    assert.match(tag, new RegExp(`data-composition="${item.purpose}"`), `${item.purpose}: composition marker`);
    assert.match(tag, new RegExp(`data-focus="${item.focus}"`), `${item.purpose}: single focus`);
    assert.match(block, item.marker, `${item.purpose}: expected its own structure`);
    assert.equal((block.match(/<h2[\s>]/g) ?? []).length, 1, `${item.purpose}: one heading`);
    assert.doesNotMatch(block, /class="point-grid"/, `${item.purpose}: must not fall back to the card grid`);
    assert.doesNotMatch(block, /class="point anim"/, `${item.purpose}: must not render cards`);
  }
});

test('an absent purpose keeps every legacy layout working unchanged', () => {
  const html = render([
    { layout: 'points', title: 'Tres puntos', points: [{ title: 'Uno' }, { title: 'Dos' }, { title: 'Tres' }] },
    { layout: 'statement', title: 'Una idea', body: 'Breve.' },
  ]).html;
  assert.match(contentBlock(html, 0), /class="point-grid"/);
  assert.doesNotMatch(innerTag(contentBlock(html, 0)), /data-composition/);
  assert.match(contentBlock(html, 1), /class="deck-body/);
  assert.doesNotMatch(innerTag(contentBlock(html, 1)), /data-composition/);
});

test('a purpose takes precedence over layout without removing the authored content', () => {
  const block = contentBlock(
    render([
      {
        layout: 'points',
        purpose: 'next-steps',
        title: 'Qué sigue',
        points: [{ title: 'Corregir la fila', body: 'Persona responsable · hoy' }],
      },
    ]).html,
    0,
  );
  assert.match(block, /data-composition="next-steps"/);
  assert.doesNotMatch(block, /point-grid/);
  assert.match(block, /Corregir la fila/);
  assert.match(block, /Persona responsable · hoy/);
});

test('comparison shows two columns with a visible divider and the after side in focus', () => {
  const html = render([{ purpose: 'comparison', title: 'Qué cambia', points: comparisonPoints }]).html;
  const block = contentBlock(html, 0);
  assert.equal((block.match(/class="compare-side/g) ?? []).length, 2);
  assert.match(block, /class="compare-divider"/);
  assert.match(block, /class="compare-role">Antes</);
  assert.match(block, /class="compare-role">Después</);
  assert.match(block, /class="compare-side is-focus"[^>]*>\s*<span class="compare-role">Después</, 'the after side is the focus');
  assert.match(html, /\.compare-divider\{[^}]*background:/, 'the divider is painted by CSS');
});

test('comparison keeps extra points as notes instead of dropping them', () => {
  const block = contentBlock(
    render([
      {
        purpose: 'comparison',
        title: 'Qué cambia',
        points: [...comparisonPoints, { title: 'Nota', body: 'La guía original queda intacta.' }],
      },
    ]).html,
    0,
  );
  assert.match(block, /class="compare-notes/);
  assert.match(block, /La guía original queda intacta/);
});

test('process accepts three to five steps as a path and rejects anything else loudly', () => {
  for (const count of [3, 4, 5]) {
    const steps = Array.from({ length: count }, (_, index) => ({
      title: `Paso ${index + 1}`,
      body: 'Una acción concreta.',
    }));
    const block = contentBlock(render([{ purpose: 'process', title: 'Proceso', steps }]).html, 0);
    assert.equal((block.match(/class="comp-step(?: |")/g) ?? []).length, count, `${count} steps rendered`);
    assert.doesNotMatch(block, /class="point anim"/);
  }

  assert.throws(
    () => render([{ purpose: 'process', title: 'Proceso', steps: processSteps.slice(0, 2) }]),
    (error: unknown) => {
      assert.ok(error instanceof BeautyError);
      assert.equal(error.code, 'DECK_PURPOSE_CONTENT');
      assert.match(error.message, /3/);
      assert.match(error.message, /steps/i);
      return true;
    },
  );
  assert.throws(
    () =>
      render([
        {
          purpose: 'process',
          title: 'Proceso',
          steps: Array.from({ length: 6 }, (_, index) => ({ title: `Paso ${index + 1}` })),
        },
      ]),
    (error: unknown) => {
      assert.ok(error instanceof BeautyError);
      assert.equal(error.code, 'DECK_TOO_MANY_STEPS');
      assert.match(error.message, /6/);
      assert.match(error.message, /5/);
      return true;
    },
  );
});

test('example needs a concrete figure and renders it large with its caption', () => {
  const html = render([
    {
      purpose: 'example',
      title: 'La guía señalada',
      body: 'La fila duplicada se marca antes de continuar.',
      figure: { subject: 'table', caption: 'Fila duplicada señalada', source: 'Original · SVG' },
    },
  ]).html;
  const block = contentBlock(html, 0);
  assert.match(block, /<figure class="comp-example-figure/);
  assert.match(block, /<figcaption>Fila duplicada señalada<span>Original · SVG<\/span><\/figcaption>/);
  assert.match(block, /data-scene-subject="table"/);
  assert.match(html, /\.comp-example\{[^}]*grid-template-columns:minmax\(0,1\.35fr\)/);

  assert.throws(
    () => render([{ purpose: 'example', title: 'Sin objeto', body: 'Nada que mostrar.' }]),
    (error: unknown) => error instanceof BeautyError && error.code === 'DECK_PURPOSE_CONTENT' && /figure/i.test(error.message),
  );
  assert.throws(
    () => render([{ purpose: 'example', title: 'Sin objeto', figure: {} }]),
    (error: unknown) => error instanceof BeautyError && error.code === 'DECK_PURPOSE_CONTENT' && /subject|scene/i.test(error.message),
  );
});

test('result renders one statement, a supporting line and an optional table', () => {
  const without = contentBlock(render([{ purpose: 'result', title: 'La entrada se corrige', body: 'Nada se modifica solo.' }]).html, 0);
  assert.match(without, /class="comp-result"/);
  assert.doesNotMatch(without, /table-scroll/);

  const withTable = contentBlock(
    render([{ purpose: 'result', title: 'La entrada se corrige', body: 'Nada se modifica solo.', table }]).html,
    0,
  );
  assert.match(withTable, /class="comp-result has-table"/);
  assert.match(withTable, /class="comp-result-statement"/);
  assert.match(withTable, /table-scroll/);
});

test('next-steps renders an ordered plain-text list with owner and time, not cards', () => {
  const block = contentBlock(
    render([
      {
        purpose: 'next-steps',
        title: 'Qué sigue',
        points: [
          { title: 'Revisar la indicación', body: 'Operaciones · hoy' },
          { title: 'Corregir la fila', body: 'Persona responsable · al recibirla' },
        ],
      },
    ]).html,
    0,
  );
  assert.match(block, /<ol class="comp-next">/);
  assert.equal((block.match(/class="comp-next-index"/g) ?? []).length, 2);
  assert.match(block, /Operaciones · hoy/);
  assert.match(block, /Persona responsable · al recibirla/);
  assert.doesNotMatch(block, /class="point anim"/);
  assert.doesNotMatch(block, /<article/);
});

test('table renders a semantic, captioned table inside its own horizontal scroller', () => {
  const html = render([{ purpose: 'table', title: 'Estados de la guía', table }]).html;
  const block = contentBlock(html, 0);
  assert.match(block, /<div class="table-scroll" role="region" aria-label="Tabla: Recorrido de la guía" tabindex="0">/);
  assert.match(block, /<table class="comp-table">/);
  assert.match(block, /<caption>Recorrido de la guía<\/caption>/);
  assert.match(block, /<th scope="col">Estado<\/th><th scope="col">Qué ocurre<\/th>/);
  assert.match(block, /<th scope="row">Detectada<\/th><td>La validación señala la fila duplicada.<\/td>/);
  assert.match(html, /\.table-scroll\{[^}]*overflow-x:auto/);
  assert.match(html, /\.comp-table\{[^}]*min-width:/);
});

test('tables enforce the 6 x 4 shape and never clip a cell', () => {
  const wrongWidth = {
    columns: ['Estado', 'Qué ocurre'],
    rows: [['Detectada', 'Señalada', 'Sobra']],
  };
  assert.throws(
    () => render([{ purpose: 'table', title: 'Tabla', table: wrongWidth }]),
    (error: unknown) => {
      assert.ok(error instanceof BeautyError);
      assert.equal(error.code, 'DECK_TABLE_SHAPE');
      assert.match(error.message, /3/);
      assert.match(error.message, /2/);
      return true;
    },
  );
  assert.throws(
    () => render([{ purpose: 'table', title: 'Tabla', table: { columns: ['A', 'B', 'C', 'D', 'E'], rows: [['1', '2', '3', '4', '5']] } }]),
    (error: unknown) => error instanceof BeautyError && error.code === 'DECK_TABLE_SHAPE' && /4/.test(error.message),
  );
  assert.throws(
    () =>
      render([
        {
          purpose: 'table',
          title: 'Tabla',
          table: { columns: ['A', 'B'], rows: Array.from({ length: 7 }, (_, index) => [`${index}`, 'x']) },
        },
      ]),
    (error: unknown) => error instanceof BeautyError && error.code === 'DECK_TABLE_SHAPE' && /6/.test(error.message),
  );
  assert.throws(
    () =>
      render([
        {
          purpose: 'table',
          title: 'Tabla',
          table: { columns: ['A', 'B'], rows: [['x'.repeat(81), 'y']] },
        },
      ]),
    (error: unknown) => {
      assert.ok(error instanceof BeautyError);
      assert.equal(error.code, 'DECK_TEXT_TOO_LONG');
      assert.match(error.message, /table\.rows\[0\]\[0\]/);
      return true;
    },
  );
});

test('a purpose slide without its required content fails with an actionable message', () => {
  const cases: Array<{ slide: DeckSlide; pattern: RegExp }> = [
    { slide: { purpose: 'comparison', title: 'Comparación', points: [{ title: 'Antes' }] }, pattern: /two points|2 points/i },
    { slide: { purpose: 'next-steps', title: 'Siguiente' }, pattern: /points/i },
    { slide: { purpose: 'table', title: 'Tabla' }, pattern: /table/i },
  ];
  for (const item of cases) {
    assert.throws(
      () => render([item.slide]),
      (error: unknown) => {
        assert.ok(error instanceof BeautyError, `${item.slide.purpose}: expected a BeautyError`);
        assert.equal(error.code, 'DECK_PURPOSE_CONTENT');
        assert.match(error.message, item.pattern);
        assert.match(error.message, new RegExp(String(item.slide.purpose)));
        return true;
      },
    );
  }
});

test('an unknown purpose fails with the supported names', () => {
  assert.throws(
    () => render([{ purpose: 'timeline' as never, title: 'Otro' }]),
    (error: unknown) => {
      assert.ok(error instanceof BeautyError);
      assert.equal(error.code, 'DECK_UNKNOWN_PURPOSE');
      assert.match(error.message, /timeline/);
      for (const purpose of ['cover', 'problem', 'comparison', 'process', 'example', 'result', 'next-steps', 'table']) {
        assert.match(error.message, new RegExp(purpose));
      }
      return true;
    },
  );
});

test('the same brief and seed render byte-identical decks; the seed only mirrors the axis', () => {
  const slides: DeckSlide[] = [
    { purpose: 'problem', title: 'Problema', body: 'La guía repite una fila.', points: [{ title: 'Fila duplicada' }] },
    { purpose: 'comparison', title: 'Qué cambia', points: comparisonPoints },
    { purpose: 'example', title: 'La guía', body: 'La fila se marca.', figure: { subject: 'table', caption: 'Fila señalada' } },
  ];
  const brief: Partial<DeckBriefInput> = { title: 'Ritmo', locale: 'es', slides };
  const first = renderDeck({ style, brief: { ...brief, seed: 0 } }).html;
  const repeat = renderDeck({ style, brief: { ...brief, seed: 0 } }).html;
  assert.equal(first, repeat, 'the composition must be reproducible');

  const mirrored = renderDeck({ style, brief: { ...brief, seed: 1 } }).html;
  assert.equal(
    first.replace(/\s?mirror/g, ''),
    mirrored.replace(/\s?mirror/g, ''),
    'the seed may only flip the equivalent mirrored variant',
  );
  const tags = (html: string) => (html.match(/<div class="slide-inner comp[\s\S]*?>/g) ?? []).map(innerTag);
  assert.doesNotMatch(tags(first)[0]!, /mirror/);
  assert.match(tags(first)[1]!, /mirror/);
  assert.match(tags(mirrored)[0]!, /mirror/);
  assert.doesNotMatch(tags(mirrored)[1]!, /mirror/);
});

test('the composition consumes art-direction density and allowedAsymmetry', () => {
  assert.match(ART_DIRECTION.renaissance.composition.density, /low/i);
  assert.match(ART_DIRECTION.brutalist.composition.density, /high/i);
  const airy = contentBlock(
    renderDeck({
      style: getStyle('renaissance'),
      brief: {
        title: 'Densidad',
        locale: 'es',
        slides: [{ purpose: 'next-steps', title: 'Qué sigue', points: [{ title: 'Corregir la fila' }] }],
      },
    }).html,
    0,
  );
  const dense = contentBlock(
    renderDeck({
      style: getStyle('brutalist'),
      brief: {
        title: 'Densidad',
        locale: 'es',
        slides: [{ purpose: 'next-steps', title: 'Qué sigue', points: [{ title: 'Corregir la fila' }] }],
      },
    }).html,
    0,
  );
  assert.match(innerTag(airy), /density-airy/);
  assert.match(innerTag(dense), /density-dense/);
});

test('each purpose slide alternates scale and density by index without changing the purpose', () => {
  const slides: DeckSlide[] = [
    { purpose: 'problem', title: 'Uno', body: 'Primera idea.' },
    { purpose: 'problem', title: 'Dos', body: 'Segunda idea.' },
    { purpose: 'problem', title: 'Tres', body: 'Tercera idea.' },
  ];
  const html = render(slides).html;
  assert.match(innerTag(contentBlock(html, 0)), /data-rhythm="even"/);
  assert.match(innerTag(contentBlock(html, 1)), /data-rhythm="odd"/);
  assert.match(innerTag(contentBlock(html, 2)), /data-rhythm="even"/);
  assert.match(html, /\[data-rhythm="odd"\] \.comp-title\{font-size:calc\(/);
});

test('a purpose slide over the word limit keeps the original text and suggests a summary slide', () => {
  const body = Array.from({ length: 60 }, () => 'uno').join(' ');
  const slide: DeckSlide = { purpose: 'result', title: 'El resultado', body };
  const html = render([slide]).html;
  assert.ok(html.includes(body), 'the original body must survive untouched');
  const issue = validateDeck(html, 'nature').issues.find((candidate) => candidate.code === 'deck-word-count');
  assert.ok(issue, 'expected the word-count diagnostic');
  assert.match(issue.fix ?? '', /split it into two slides/i);
  assert.match(issue.fix ?? '', /separate summary slide/i);
});
