import assert from 'node:assert/strict';
import test from 'node:test';
import { renderDeck } from '../src/deck.js';
import { renderExperience } from '../src/page/experience.js';
import { renderStory } from '../src/page/story.js';
import { getStyle, styleSlugs } from '../src/styles/presets.js';
import type { ExperienceKind, StorySceneKind } from '../src/types.js';
import {
  assertDocumentContract,
  assertInjectionSafe,
  checkTagBalance,
  findEmptyUrls,
  findTemplateLeaks,
  XSS_ATTR,
  XSS_SCRIPT,
  XSS_TITLE,
} from './support/html-contract.js';

const deckBrief = {
  title: 'The memory of the future',
  tagline: 'A deck rendered for the contract tests.',
  intro: 'One idea per slide. The rest is noise.',
  brand: 'OPEN/BEAUTY',
  locale: 'en' as const,
  slides: [
    { layout: 'statement' as const, title: 'One idea per slide.', body: 'The rest is noise.' },
    { layout: 'points' as const, title: 'Three rules', points: [{ title: 'Less', body: 'One idea.' }, { title: 'Bigger' }, { title: 'Silence', body: 'Air speaks too.' }] },
    { layout: 'stats' as const, title: 'Evidence', stats: [{ value: '68%', label: 'Less code' }, { value: '3', label: 'Sources' }] },
    { layout: 'quote' as const, title: 'A voice', quote: { text: 'Walking is also looking.', author: 'Field note' } },
    { layout: 'figure' as const, title: 'The meadow', figure: { caption: 'A rabbit crosses the meadow.', source: 'Original scene · CC0', scene: { kind: 'meadow' as const, characters: ['rabbit', 'fox'] as const, props: ['pine', 'flowers'] as const } } },
  ],
};

const roomBrief = {
  title: 'A museum of small things',
  tagline: 'A room sequence rendered for the contract tests.',
  brand: 'MUSEM',
  locale: 'en' as const,
  kind: 'museum' as ExperienceKind,
  hours: 'Tue–Sun 10–18',
  address: '12 Archive Lane',
  source: 'Museum archive',
  closing: 'The visit ends when something stays.',
  rooms: [
    { title: 'Entrance', body: 'A museum starts with the question you bring.', display: 'quote' as const, quote: { text: 'What does a house remember?', author: 'Room note' } },
    { title: 'The key without a door', body: 'A brass piece for a room that no longer exists.', display: 'exhibit' as const, items: [{ label: 'Object', value: '01', detail: 'Brass, 1930. Museum archive.' }, { label: 'Donor', value: '02' }] },
    { title: 'The long table', body: 'Objects wait for a hand that recognises them.', display: 'menu' as const, items: [{ label: 'Seat', value: '14' }], note: 'Do not touch the glass.' },
    { title: 'Exit', body: 'No shop: a window.', display: 'scene' as const },
  ],
};

const storyBrief = {
  title: 'The house that learned to breathe',
  tagline: 'A story rendered for the contract tests.',
  brand: 'Field Notebook',
  locale: 'en' as const,
  source: 'Original fiction · CC0 1.0',
  readingTime: '6 min',
  chapters: [
    { kicker: 'I', title: 'The door', body: 'A house learns to breathe when somebody lives in it.\n\nThe door creaks and the hallway smells of rain.', quote: { text: 'Houses remember habits.', author: 'Margin note' }, fact: 'Adobe walls regulate moisture.', scene: { kind: 'house' as StorySceneKind, characters: ['child'] as const, props: ['house', 'tree'] as const } },
    { kicker: 'II', title: 'The chair', body: 'A chair moves when memory returns. No ghosts: customs that fill space.', quote: { text: 'Walking is also looking.' }, scene: { kind: 'room' as StorySceneKind, props: ['table', 'lantern'] as const } },
    { kicker: 'III', title: 'The house', body: 'The house keeps its door open.', fact: 'A doorway is a promise.', scene: { kind: 'night' as StorySceneKind, characters: ['cat'] as const } },
  ],
};

test('the markup checker accepts the shapes the generator emits', () => {
  const html = `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>ok</title></head><body><!-- comment --><img src="x.svg"><br><svg viewBox="0 0 1 1"><path d="M0 0h1"/><circle cx="1" cy="1" r="1"/><text>hi</text></svg><p title="a > b">ok</p><script>if (a < b) { c(); }</script></body></html>`;
  assert.deepEqual(checkTagBalance(html), []);
  assert.deepEqual(findTemplateLeaks(html), []);
  assert.deepEqual(findEmptyUrls(html), []);
});

test('the markup checker reports unclosed, mismatched and stray markup', () => {
  assert.match(checkTagBalance('<div><p>hi</div>')[0] ?? '', /mismatched/);
  assert.match(checkTagBalance('<div><span>x</span>')[0] ?? '', /unclosed/);
  assert.match(checkTagBalance('<p>1 < 2</p>')[0] ?? '', /stray/);
});

test('leak detection flags placeholders and only real empty urls', () => {
  assert.deepEqual(findTemplateLeaks('<p>{{ title }}</p>'), ['{{']);
  assert.deepEqual(findTemplateLeaks('<p>undefined NaN [object Object]</p>'), ['undefined', 'NaN', '[object Object]']);
  assert.deepEqual(findEmptyUrls('<a href="">x</a><img src=" ">'), ['href=""', 'src=" "']);
  assert.deepEqual(findEmptyUrls('<script>const s = "src=\\"\\"";</script><img src="a.png">'), []);
});

test('every style renders every deck layout as a valid document', () => {
  for (const style of styleSlugs) {
    const { html } = renderDeck({ style: getStyle(style), brief: deckBrief });
    assertDocumentContract(html, { label: `deck/${style}`, locale: 'en' });
    for (const layout of ['statement', 'points', 'stats', 'quote', 'figure']) {
      assert.ok(html.includes(`layout-${layout}`), `deck/${style}: missing ${layout} layout`);
    }
  }
});

test('deck, experience and story generators escape injected content', () => {
  const hostileDeck = {
    ...deckBrief,
    title: XSS_TITLE,
    tagline: XSS_ATTR,
    brand: XSS_ATTR,
    cta: { label: XSS_SCRIPT, href: 'javascript:alert(1)' },
    slides: [
      { layout: 'statement' as const, title: `Slide ${XSS_SCRIPT}`, body: `Body ${XSS_ATTR}` },
      { layout: 'quote' as const, title: 'Quote', quote: { text: `Quote ${XSS_SCRIPT}`, author: XSS_ATTR } },
      { layout: 'points' as const, title: 'Points', points: [{ title: `Point ${XSS_SCRIPT}`, body: XSS_ATTR }] },
      { layout: 'stats' as const, title: 'Stats', stats: [{ value: '"><b>', label: XSS_SCRIPT }] },
    ],
  };
  const hostileRoom = {
    ...roomBrief,
    title: XSS_TITLE,
    tagline: XSS_ATTR,
    rooms: roomBrief.rooms.map((room, index) => ({ ...room, title: `Room ${index} ${XSS_SCRIPT}`, body: `Body ${XSS_ATTR}` })),
  };
  const hostileStory = {
    ...storyBrief,
    title: XSS_TITLE,
    tagline: XSS_ATTR,
    chapters: storyBrief.chapters.map((chapter, index) => ({ ...chapter, title: `Chapter ${index} ${XSS_SCRIPT}`, body: `Body ${XSS_ATTR}` })),
  };
  for (const style of styleSlugs) {
    const preset = getStyle(style);
    const deck = renderDeck({ style: preset, brief: hostileDeck }).html;
    const experience = renderExperience(hostileRoom, preset);
    const story = renderStory(hostileStory, preset);
    assertDocumentContract(deck, { label: `hostile deck/${style}`, locale: 'en' });
    assertDocumentContract(experience, { label: `hostile experience/${style}`, locale: 'en' });
    assertDocumentContract(story, { label: `hostile story/${style}`, locale: 'en' });
    assertInjectionSafe(deck, `hostile deck/${style}`);
    assertInjectionSafe(experience, `hostile experience/${style}`);
    assertInjectionSafe(story, `hostile story/${style}`);
  }
});

test('every style renders well-formed experiences for every kind', () => {
  const kinds: ExperienceKind[] = ['restaurant', 'museum', 'history', 'studio', 'club', 'garden'];
  for (const style of styleSlugs) {
    for (const kind of kinds) {
      const html = renderExperience({ ...roomBrief, kind }, getStyle(style));
      assertDocumentContract(html, { label: `experience/${style}/${kind}`, locale: 'en' });
    }
  }
});

test('every style renders scroll and storybook stories as valid documents', () => {
  for (const style of styleSlugs) {
    for (const format of ['scroll', 'storybook'] as const) {
      const html = renderStory({ ...storyBrief, format }, getStyle(style));
      assertDocumentContract(html, { label: `story/${style}/${format}`, locale: 'en' });
      assert.ok(html.includes('story-page'), `story/${style}: missing story-page body class`);
      if (format === 'storybook') assert.ok(html.includes('storybook'), `story/${style}: missing storybook layout`);
    }
  }
});

test('all generators are deterministic for identical briefs', () => {
  for (const style of styleSlugs) {
    const preset = getStyle(style);
    assert.equal(renderDeck({ style: preset, brief: deckBrief }).html, renderDeck({ style: preset, brief: deckBrief }).html, `deck/${style} not deterministic`);
    assert.equal(renderExperience(roomBrief, preset), renderExperience(roomBrief, preset), `experience/${style} not deterministic`);
    assert.equal(renderStory(storyBrief, preset), renderStory(storyBrief, preset), `story/${style} not deterministic`);
  }
});
