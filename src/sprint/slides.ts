import type { DeckBrief, DeckPoint, DeckSlide, DeckStat, StylePreset } from '../types.js';
import { t as translate } from '../page/common.js';
import type { SprintData } from './data.js';
import { sprintBrand } from './data.js';
import {
  backlogBlock,
  burndownChart,
  capacityChart,
  retroActions,
  retroColumns,
  risksBlock,
  storiesTable,
  velocityChart,
  type RetroColumns,
} from './charts.js';

export interface SprintBlock {
  token: string;
  html: string;
}

export interface SprintDocument {
  kind: 'review' | 'retro' | 'planning';
  brief: Partial<DeckBrief>;
  blocks: SprintBlock[];
}

const WORD_BUDGET = 50;
const MAX_AUTHORED_SLIDES = 8;
export const TOKEN_PREFIX = '[[sprint:';

/**
 * Word count exactly as validateDeck computes it, so a slide that fits here
 * never triggers `deck-word-count`.
 */
export function wordsOf(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.split(' ').length : 0;
}

interface TokenSlide {
  slide: DeckSlide;
  block: SprintBlock;
}

function tokenSlide(kicker: string, title: string, token: string, html: string): TokenSlide {
  return {
    slide: {
      layout: 'statement',
      kicker,
      title,
      body: `${TOKEN_PREFIX}${token}]]`,
    },
    block: { token: `${TOKEN_PREFIX}${token}]]`, html },
  };
}

/**
 * Split `items` into page sizes whose rendered block plus the slide chrome
 * stays under the validator word limit. The greedy loop tries the whole
 * remainder first and shrinks until the page fits.
 */
function paginate(items: number, render: (offset: number, size: number) => string, fixedWords: number): number[] {
  const sizes: number[] = [];
  let offset = 0;
  let guard = 0;
  while (offset < items && guard < 40) {
    let size = items - offset;
    while (size > 1 && fixedWords + wordsOf(render(offset, size)) > WORD_BUDGET) size -= 1;
    sizes.push(size);
    offset += size;
    guard += 1;
  }
  return sizes;
}

function baseBrief(data: SprintData, title: string, closing: string): Partial<DeckBrief> {
  const range =
    data.sprint.start || data.sprint.end
      ? `${data.sprint.start ?? ''}${data.sprint.start && data.sprint.end ? ' → ' : ''}${data.sprint.end ?? ''}`
      : data.date;
  return {
    title,
    tagline: range,
    brand: sprintBrand(data),
    eyebrow: `Sprint ${data.sprint.id}`,
    locale: data.locale,
    maxxing: data.maxxing,
    subfamily: data.subfamily,
    cta: { label: translate(data.locale, 'Abrir el sprint', 'Open the sprint'), href: '#slide-1' },
    closing,
  };
}

function pointsFrom(items: string[], fallback: string, locale: 'es' | 'en'): DeckPoint[] {
  const source = items.length ? items : [fallback];
  return source
    .slice(0, 3)
    .map((title) => ({ title, body: translate(locale, 'Una práctica, no una anécdota.', 'A practice, not an anecdote.') }));
}

function statsFrom(data: SprintData): DeckStat[] {
  if (data.metrics.length) return data.metrics.slice(0, 3).map((metric) => ({ label: metric.label, value: metric.value }));
  const done = data.stories.filter((story) => story.status === 'done');
  const carried = data.stories.filter((story) => story.status === 'carried');
  const points = done.reduce((sum, story) => sum + (story.points ?? 0), 0);
  return [
    { label: translate(data.locale, 'Historias cerradas', 'Stories done'), value: String(done.length) },
    { label: translate(data.locale, 'Puntos hechos', 'Points done'), value: String(points) },
    { label: translate(data.locale, 'Arrastradas', 'Carried'), value: String(carried.length) },
  ];
}

function assemble(
  data: SprintData,
  kind: SprintDocument['kind'],
  title: string,
  closing: string,
  slides: DeckSlide[],
  blocks: SprintBlock[],
): SprintDocument {
  const keptSlides = slides.slice(0, MAX_AUTHORED_SLIDES);
  const keptTokens = new Set(
    keptSlides.map((slide) => slide.body ?? '').filter((body) => body.startsWith(TOKEN_PREFIX)),
  );
  return {
    kind,
    brief: { ...baseBrief(data, title, closing), slides: keptSlides },
    blocks: blocks.filter((block) => keptTokens.has(block.token)),
  };
}

/* ------------------------------------------------------------------ */
/* Review                                                              */
/* ------------------------------------------------------------------ */

export function buildReviewDocument(preset: StylePreset, data: SprintData): SprintDocument {
  const id = data.sprint.id;
  const slides: DeckSlide[] = [
    {
      layout: 'statement',
      kicker: `Sprint ${id} · ${translate(data.locale, 'Review', 'Review')}`,
      title:
        data.summary ||
        data.sprint.goal ||
        translate(data.locale, `Lo que cambió en el sprint ${id}.`, `What changed in sprint ${id}.`),
      body: data.sprint.goal
        ? translate(data.locale, 'La meta era una pregunta; esto es lo que respondió el sprint.', 'The goal was a question; this is what the sprint answered.')
        : translate(
            data.locale,
            'Una conversación sobre lo que se envió, lo que se aprendió y lo que sigue.',
            'A conversation about what shipped, what we learned and what comes next.',
          ),
    },
  ];
  const blocks: SprintBlock[] = [];

  if (data.velocity.length) {
    const block = tokenSlide(
      translate(data.locale, 'La evidencia', 'The evidence'),
      translate(data.locale, 'Comprometido frente a hecho', 'Committed versus done'),
      'velocity',
      velocityChart(preset, data),
    );
    slides.push(block.slide);
    blocks.push(block.block);
  }

  if (data.burndown.length >= 2) {
    const block = tokenSlide(
      translate(data.locale, 'El pulso del sprint', 'The pulse of the sprint'),
      translate(data.locale, 'Burndown: puntos restantes', 'Burndown: points remaining'),
      'burndown',
      burndownChart(preset, data),
    );
    slides.push(block.slide);
    blocks.push(block.block);
  }

  if (data.stories.length) {
    const fixed =
      wordsOf(translate(data.locale, 'Historias', 'Stories')) +
      wordsOf(translate(data.locale, 'El estado real del backlog', 'The real shape of the backlog')) +
      4;
    const sizes = paginate(
      data.stories.length,
      (offset, size) => storiesTable(preset, data.locale, data.stories.slice(offset, offset + size), true),
      fixed,
    );
    let cursor = 0;
    sizes.forEach((size, page) => {
      const chunk = data.stories.slice(cursor, cursor + size);
      cursor += size;
      const suffix = sizes.length > 1 ? ` ${page + 1}/${sizes.length}` : '';
      const block = tokenSlide(
        translate(data.locale, 'Historias', 'Stories'),
        `${translate(data.locale, 'El estado real del backlog', 'The real shape of the backlog')}${suffix}`,
        `stories-${page + 1}`,
        storiesTable(preset, data.locale, chunk, true),
      );
      slides.push(block.slide);
      blocks.push(block.block);
    });
  }

  if (data.risks.length) {
    const fixed =
      wordsOf(translate(data.locale, 'Riesgos', 'Risks')) +
      wordsOf(translate(data.locale, 'Lo que puede romper el próximo sprint', 'What can break the next sprint')) +
      5;
    const sizes = paginate(
      data.risks.length,
      (offset, size) => risksBlock(preset, data.locale, data.risks.slice(offset, offset + size), true),
      fixed,
    );
    let cursor = 0;
    sizes.forEach((size, page) => {
      const chunk = data.risks.slice(cursor, cursor + size);
      cursor += size;
      const suffix = sizes.length > 1 ? ` ${page + 1}/${sizes.length}` : '';
      const block = tokenSlide(
        translate(data.locale, 'Riesgos', 'Risks'),
        `${translate(data.locale, 'Lo que puede romper el próximo sprint', 'What can break the next sprint')}${suffix}`,
        `risks-${page + 1}`,
        risksBlock(preset, data.locale, chunk, true),
      );
      slides.push(block.slide);
      blocks.push(block.block);
    });
  }

  slides.push({
    layout: 'stats',
    kicker: translate(data.locale, 'El sprint en cifras', 'The sprint in numbers'),
    title: translate(data.locale, 'Lo que se movió', 'What moved'),
    stats: statsFrom(data),
  });

  if (data.quote) {
    slides.push({
      layout: 'quote',
      kicker: translate(data.locale, 'Una voz del equipo', 'A voice from the team'),
      title: translate(data.locale, 'La frase que queda', 'The line that stays'),
      quote: data.quote,
    });
  }

  return assemble(
    data,
    'review',
    `Sprint ${id} · ${translate(data.locale, 'Review', 'Review')}`,
    translate(data.locale, 'La conversación sigue.', 'The conversation continues.'),
    slides,
    blocks,
  );
}

/* ------------------------------------------------------------------ */
/* Retrospective                                                       */
/* ------------------------------------------------------------------ */

export function buildRetroDocument(preset: StylePreset, data: SprintData): SprintDocument {
  const id = data.sprint.id;
  const slides: DeckSlide[] = [
    {
      layout: 'statement',
      kicker: `Sprint ${id} · ${translate(data.locale, 'Retrospectiva', 'Retrospective')}`,
      title: translate(data.locale, 'Qué aprendimos cuando el plan se movió.', 'What we learned when the plan moved.'),
      body: translate(
        data.locale,
        'Una lectura del sistema: lo que funcionó, lo que dolió y lo que probamos después.',
        'A reading of the system: what worked, what hurt and what we try next.',
      ),
    },
  ];
  const blocks: SprintBlock[] = [];
  const retro = data.retro;
  const richRetro = retro.wentWell.length > 0 || retro.toImprove.length > 0 || retro.actions.length > 0;

  if (richRetro) {
    const rows = Math.max(retro.wentWell.length, retro.toImprove.length, retro.actions.length);
    const fixed =
      wordsOf(translate(data.locale, 'La lectura', 'The read')) +
      wordsOf(translate(data.locale, 'Funcionó, mejorar, acciones', 'Went well, to improve, actions')) +
      4;
    const slices = (offset: number, size: number): RetroColumns => ({
      wentWell: retro.wentWell.slice(offset, offset + size),
      toImprove: retro.toImprove.slice(offset, offset + size),
      actions: retro.actions.slice(offset, offset + size).map((action) => action.what),
    });
    const sizes = paginate(rows, (offset, size) => retroColumns(preset, data.locale, slices(offset, size), true), fixed);
    let cursor = 0;
    sizes.forEach((size, page) => {
      const columns = slices(cursor, size);
      cursor += size;
      const suffix = sizes.length > 1 ? ` ${page + 1}/${sizes.length}` : '';
      const block = tokenSlide(
        translate(data.locale, 'La lectura', 'The read'),
        `${translate(data.locale, 'Funcionó, mejorar, acciones', 'Went well, to improve, actions')}${suffix}`,
        `retro-columns-${page + 1}`,
        retroColumns(preset, data.locale, columns, true),
      );
      slides.push(block.slide);
      blocks.push(block.block);
    });

    if (retro.actions.length) {
      const fixed =
        wordsOf(translate(data.locale, 'Compromisos', 'Commitments')) +
        wordsOf(translate(data.locale, 'Acciones con responsable y fecha', 'Actions with owner and date')) +
        5;
      const sizes = paginate(
        retro.actions.length,
        (offset, size) => retroActions(preset, data.locale, retro.actions.slice(offset, offset + size), true),
        fixed,
      );
      let cursor = 0;
      sizes.forEach((size, page) => {
        const chunk = retro.actions.slice(cursor, cursor + size);
        cursor += size;
        const suffix = sizes.length > 1 ? ` ${page + 1}/${sizes.length}` : '';
        const block = tokenSlide(
          translate(data.locale, 'Compromisos', 'Commitments'),
          `${translate(data.locale, 'Acciones con responsable y fecha', 'Actions with owner and date')}${suffix}`,
          `retro-actions-${page + 1}`,
          retroActions(preset, data.locale, chunk, true),
        );
        slides.push(block.slide);
        blocks.push(block.block);
      });
    }
  } else {
    slides.push({
      layout: 'points',
      kicker: translate(data.locale, 'Funcionó', 'Worked'),
      title: translate(data.locale, 'Lo que queremos repetir', 'What we want to repeat'),
      points: pointsFrom(data.highlights, translate(data.locale, 'Decir la verdad a tiempo', 'Telling the truth early'), data.locale),
    });
    slides.push({
      layout: 'points',
      kicker: translate(data.locale, 'Dolió', 'Hurt'),
      title: translate(data.locale, 'Lo que no queremos normalizar', 'What we will not normalise'),
      points: pointsFrom(data.blockers, translate(data.locale, 'Trabajar sin contexto', 'Working without context'), data.locale),
    });
    slides.push({
      layout: 'points',
      kicker: translate(data.locale, 'Probamos', 'We try'),
      title: translate(data.locale, 'El próximo experimento', 'The next experiment'),
      points: pointsFrom(data.next, translate(data.locale, 'Una revisión más corta y más honesta', 'A shorter, more honest review'), data.locale),
    });
  }

  if (data.quote) {
    slides.push({
      layout: 'quote',
      kicker: translate(data.locale, 'Una voz del equipo', 'A voice from the team'),
      title: translate(data.locale, 'La frase que queda', 'The line that stays'),
      quote: data.quote,
    });
  }

  return assemble(
    data,
    'retro',
    `Sprint ${id} · ${translate(data.locale, 'Retrospectiva', 'Retrospective')}`,
    translate(data.locale, 'Lo que sigue se construye entre todos.', 'What comes next is built together.'),
    slides,
    blocks,
  );
}

/* ------------------------------------------------------------------ */
/* Planning                                                            */
/* ------------------------------------------------------------------ */

export function buildPlanningDocument(preset: StylePreset, data: SprintData): SprintDocument {
  const id = data.sprint.id;
  const goal = data.nextGoal || data.sprint.goal;
  const slides: DeckSlide[] = [
    {
      layout: 'statement',
      kicker: `Sprint ${id} · ${translate(data.locale, 'Planning', 'Planning')}`,
      title: goal || translate(data.locale, 'El próximo sprint no empieza en cero.', 'The next sprint does not start from zero.'),
      body:
        data.summary ||
        translate(
          data.locale,
          'Lo que quedó abierto no es deuda: es material para una hipótesis mejor.',
          'What stayed open is not debt: it is material for a better hypothesis.',
        ),
    },
  ];
  const blocks: SprintBlock[] = [];

  if (data.capacity.length) {
    const fixed =
      wordsOf(translate(data.locale, 'Capacidad', 'Capacity')) +
      wordsOf(translate(data.locale, 'El espacio real', 'The real room')) +
      4;
    const sizes = paginate(
      data.capacity.length,
      (offset, size) => capacityChart(preset, data, data.capacity.slice(offset, offset + size)),
      fixed,
    );
    let cursor = 0;
    sizes.forEach((size, page) => {
      const chunk = data.capacity.slice(cursor, cursor + size);
      cursor += size;
      const suffix = sizes.length > 1 ? ` ${page + 1}/${sizes.length}` : '';
      const block = tokenSlide(
        translate(data.locale, 'Capacidad', 'Capacity'),
        `${translate(data.locale, 'El espacio real', 'The real room')}${suffix}`,
        `capacity-${page + 1}`,
        capacityChart(preset, data, chunk),
      );
      slides.push(block.slide);
      blocks.push(block.block);
    });
  }

  const carried = data.stories.filter((story) => story.status === 'carried');
  if (carried.length) {
    const fixed =
      wordsOf(translate(data.locale, 'Backlog', 'Backlog')) +
      wordsOf(translate(data.locale, 'Lo que viene del sprint anterior', 'What comes from the previous sprint')) +
      5;
    const sizes = paginate(
      carried.length,
      (offset, size) => storiesTable(preset, data.locale, carried.slice(offset, offset + size), true),
      fixed,
    );
    let cursor = 0;
    sizes.forEach((size, page) => {
      const chunk = carried.slice(cursor, cursor + size);
      cursor += size;
      const suffix = sizes.length > 1 ? ` ${page + 1}/${sizes.length}` : '';
      const block = tokenSlide(
        translate(data.locale, 'Backlog', 'Backlog'),
        `${translate(data.locale, 'Lo que viene del sprint anterior', 'What comes from the previous sprint')}${suffix}`,
        `backlog-${page + 1}`,
        backlogBlock(preset, data.locale, chunk, true),
      );
      slides.push(block.slide);
      blocks.push(block.block);
    });
  }

  const bets = data.next.length ? data.next : data.retro.actions.map((action) => action.what);
  if (bets.length) {
    slides.push({
      layout: 'points',
      kicker: translate(data.locale, 'Apuestas', 'Bets'),
      title: translate(data.locale, 'Tres apuestas para el próximo sprint', 'Three bets for the next sprint'),
      points: pointsFrom(bets, translate(data.locale, 'La apuesta más pequeña que cambia una decisión', 'The smallest bet that changes a decision'), data.locale),
    });
  }

  if (data.capacity.length) {
    const days = data.capacity.reduce((sum, item) => sum + item.days, 0);
    const carriedPoints = carried.reduce((sum, story) => sum + (story.points ?? 0), 0);
    slides.push({
      layout: 'stats',
      kicker: translate(data.locale, 'El plan en cifras', 'The plan in numbers'),
      title: translate(data.locale, 'Con qué contamos', 'What we have'),
      stats: [
        { label: translate(data.locale, 'Personas', 'People'), value: String(data.capacity.length) },
        { label: translate(data.locale, 'Días de foco', 'Focus days'), value: String(days) },
        { label: translate(data.locale, 'Puntos arrastrados', 'Carried points'), value: String(carriedPoints) },
      ],
    });
  } else {
    slides.push({
      layout: 'stats',
      kicker: translate(data.locale, 'Capacidad', 'Capacity'),
      title: translate(data.locale, 'El espacio real', 'The real room'),
      stats: statsFrom(data),
    });
  }

  const quote = data.quote ?? {
    text: translate(
      data.locale,
      'Si no cabe en una frase, todavía no es una prioridad.',
      'If it does not fit in one sentence, it is not a priority yet.',
    ),
    author: sprintBrand(data),
  };
  slides.push({
    layout: 'quote',
    kicker: translate(data.locale, 'La regla', 'The rule'),
    title: translate(data.locale, 'Una frase para el sprint', 'One sentence for the sprint'),
    quote,
  });

  return assemble(
    data,
    'planning',
    `Sprint ${id} · ${translate(data.locale, 'Planning', 'Planning')}`,
    translate(data.locale, 'El próximo sprint empieza con una pregunta.', 'The next sprint starts with a question.'),
    slides,
    blocks,
  );
}
