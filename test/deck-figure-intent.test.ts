import assert from 'node:assert/strict';
import test from 'node:test';
import { renderDeck } from '../src/deck.js';
import { createDeck } from '../src/generate.js';
import { BeautyError } from '../src/page/common.js';
import { getStyle } from '../src/styles/presets.js';
import type { DeckFigure, DeckSlide } from '../src/types.js';

const STYLES = ['brutalist', 'nature', 'isotype', 'galactic'] as const;

function figureDeck(figures: DeckFigure[], style: (typeof STYLES)[number] = 'brutalist') {
  return renderDeck({
    style: getStyle(style),
    brief: {
      title: 'Escenas con intención',
      locale: 'es',
      slides: figures.map((figure, index) => ({
        layout: 'figure' as const,
        kicker: `ESCENA ${index + 1}`,
        title: `Figura ${index + 1}`,
        figure,
      })),
    },
  });
}

function figureBlock(html: string, index: number): string {
  const matches = html.match(/<figure class="deck-figure[^>]*>[\s\S]*?<\/figure>/g) ?? [];
  const block = matches[index];
  assert.ok(block, `figure ${index} missing`);
  return block;
}

test('every non-papercraft style draws the requested subject instead of a house', () => {
  const subjects = ['river', 'table', 'plant', 'window'] as const;
  for (const style of STYLES) {
    const deck = figureDeck(
      subjects.map((subject) => ({ subject, caption: `Escena ${subject}`, source: 'Original · CC0' }) as unknown as DeckFigure),
      style,
    );

    assert.equal(deck.warnings.length, 0, `${style}: direct subjects must not warn`);
    const blocks = subjects.map((_, index) => figureBlock(deck.html, index));
    for (const [index, subject] of subjects.entries()) {
      assert.match(blocks[index]!, new RegExp(`data-scene-subject="${subject}"`), `${style}: ${subject} marker`);
    }

    assert.equal(new Set(blocks).size, subjects.length, `${style}: every requested subject must draw a different SVG`);
    const houseMarker = /M-105 90V-40L0-125 105-40V90Z/;
    for (const [index, subject] of subjects.entries()) {
      if (subject === 'house') continue;
      assert.doesNotMatch(blocks[index]!, houseMarker, `${style}: ${subject} was silently replaced by a house`);
    }
  }
});

test('story scene kinds are adapted to a matching subject and lossy adapters are reported', async () => {
  const scenes = [
    { kind: 'river' as const },
    { kind: 'market' as const },
    { kind: 'night' as const },
    { kind: 'garden' as const },
  ];
  const expected = ['river', 'table', 'window', 'plant'];
  for (const style of STYLES) {
    const deck = figureDeck(scenes.map((scene) => ({ scene })), style);
    const blocks = expected.map((_, index) => figureBlock(deck.html, index));
    for (const [index, subject] of expected.entries()) {
      assert.match(blocks[index]!, new RegExp(`data-scene-subject="${subject}"`), `${style}: ${scenes[index]!.kind} → ${subject}`);
    }
    assert.equal(new Set(blocks).size, expected.length, `${style}: different scenes must draw different SVGs`);

    assert.equal(deck.warnings.length, 3, `${style}: river is exact; the other three adapters must be reported`);
    for (const warning of deck.warnings) {
      assert.match(warning, /market|night|garden/);
      assert.match(warning, /figure\.subject/);
    }
    const created = await createDeck({
      style,
      brief: {
        title: 'Escenas',
        locale: 'es',
        slides: scenes.map((scene, index) => ({ layout: 'figure' as const, title: `Figura ${index + 1}`, figure: { scene } })),
      },
    });
    assert.deepEqual(created.warnings, deck.warnings);
  }
});

test('a scene without a kind is reported instead of silently drawn as a house', () => {
  const deck = figureDeck([{ scene: { characters: ['fox'] } }]);
  const block = figureBlock(deck.html, 0);
  assert.match(block, /data-scene-subject="none"/);
  assert.doesNotMatch(block, /M-105 90V-40L0-125 105-40V90Z/);
  assert.equal(deck.warnings.length, 1);
  assert.match(deck.warnings[0]!, /without a kind/);
  assert.match(deck.warnings[0]!, /figure\.subject/);
});

test('an unknown figure scene fails with the slide, the value and the supported alternatives', () => {
  assert.throws(
    () =>
      figureDeck([
        {
          scene: { kind: 'volcano' as never },
        },
      ]),
    (error: unknown) => {
      assert.ok(error instanceof BeautyError, 'expected a BeautyError');
      assert.equal(error.code, 'DECK_UNKNOWN_FIGURE_SCENE');
      assert.match(error.message, /Figura 1/);
      assert.match(error.message, /volcano/);
      assert.match(error.message, /meadow/);
      assert.match(error.message, /figure\.subject/);
      assert.match(error.message, /river/);
      return true;
    },
  );
});

test('an unknown figure subject fails instead of falling back to a house', () => {
  assert.throws(
    () =>
      figureDeck([
        {
          subject: 'planet' as never,
        },
      ]),
    (error: unknown) => {
      assert.ok(error instanceof BeautyError, 'expected a BeautyError');
      assert.equal(error.code, 'DECK_UNKNOWN_FIGURE_SUBJECT');
      assert.match(error.message, /Figura 1/);
      assert.match(error.message, /planet/);
      for (const subject of ['table', 'vitrine', 'river', 'house', 'stage', 'plant', 'window']) {
        assert.match(error.message, new RegExp(subject));
      }
      return true;
    },
  );
});

test('a papercraft figure keeps rendering the requested story scene', () => {
  const deck = renderDeck({
    style: getStyle('papercraft'),
    brief: {
      title: 'Papel',
      locale: 'es',
      slides: [
        { layout: 'figure', title: 'Río', figure: { scene: { kind: 'river', characters: ['fox'] } } },
        { layout: 'figure', title: 'Noche', figure: { scene: { kind: 'night', characters: ['cat'] } } },
      ] as DeckSlide[],
    },
  });
  assert.notEqual(figureBlock(deck.html, 0), figureBlock(deck.html, 1));
  assert.match(figureBlock(deck.html, 0), /aria-label="river · fox"/);
  assert.match(figureBlock(deck.html, 1), /aria-label="night · cat"/);
});
