import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { renderDeck } from '../src/deck.js';
import { getStyle, styleSlugs } from '../src/styles/presets.js';
import type { DeckBriefInput } from '../src/types/deck.js';
import { auditDeckSlidesBatch, locatePlaywright, DECK_SLIDE_VIEWPORT } from '../src/visual.js';
import { validateDeck } from '../src/validate.js';

/**
 * Presentation-size audit: every slide is activated through the deck's own
 * navigation and checked for overflow, clipped text, tiny text and occlusion.
 * The fixtures are the 13 realistic Spanish briefs in examples/.
 */

const DIRECTORY = path.resolve('examples/decks/composition-library');
const EXPECTED_PURPOSES = ['problem', 'comparison', 'example', 'result', 'next-steps'];

async function loadBrief(style: string): Promise<DeckBriefInput> {
  return JSON.parse(await readFile(path.join(DIRECTORY, `${style}.json`), 'utf8')) as DeckBriefInput;
}

function purposeMarkers(html: string): string[] {
  return [...html.matchAll(/data-composition="([a-z-]+)"/g)].map((match) => match[1]!);
}

function failuresFor(entries: Awaited<ReturnType<typeof auditDeckSlidesBatch>>): string[] {
  return entries.flatMap((entry) =>
    entry.report.slides.flatMap((slide) =>
      slide.findings.map(
        (finding) =>
          `${entry.label} slide ${slide.index}: ${finding.code} · ${finding.selector}${finding.text ? ` · "${finding.text}"` : ''}`,
      ),
    ),
  );
}

test('the six-slide composition deck passes every slide audit in all thirteen styles', async (t) => {
  if (!locatePlaywright()) {
    t.skip('playwright not found via BEAUTY_PLAYWRIGHT_ROOT, project, global or sibling path');
    return;
  }

  const items = [];
  for (const style of styleSlugs) {
    const brief = await loadBrief(style);
    const deck = renderDeck({ style: getStyle(style), brief });
    assert.deepEqual(purposeMarkers(deck.html), EXPECTED_PURPOSES, `${style}: five purpose compositions plus cover/closing`);
    assert.equal(deck.slideCount, 7, `${style}: cover + five purpose slides + closing`);
    assert.deepEqual(deck.warnings, [], `${style}: examples must not rely on lossy adapters`);
    const validation = validateDeck(deck.html, style);
    assert.equal(validation.grade, 'A', `${style}: grade ${validation.grade} (${validation.score})`);
    assert.equal(validation.score, 100, `${style}: score ${validation.score}`);
    assert.deepEqual(
      validation.issues.filter((issue) => issue.code.startsWith('deck-')),
      [],
      `${style}: open deck diagnostics`,
    );
    items.push({ html: deck.html, style, label: `${style}-composition` });
  }

  const entries = await auditDeckSlidesBatch(items, { viewport: DECK_SLIDE_VIEWPORT, concurrency: 4 });
  const skipped = entries.find((entry) => entry.report.status !== 'ran');
  if (skipped) {
    t.skip(skipped.report.message ?? 'Chromium unavailable');
    return;
  }
  for (const entry of entries) {
    assert.equal(entry.report.slides.length, 7, `${entry.label}: every slide must be audited`);
  }
  assert.deepEqual(failuresFor(entries), []);
});

test('process and table compositions pass the per-slide audit in all thirteen styles', async (t) => {
  if (!locatePlaywright()) {
    t.skip('playwright not found via BEAUTY_PLAYWRIGHT_ROOT, project, global or sibling path');
    return;
  }

  const brief: DeckBriefInput = {
    title: 'Proceso y tabla',
    eyebrow: 'Revisión de guías',
    brand: 'Mesa de despacho',
    locale: 'es',
    slides: [
      {
        purpose: 'process',
        kicker: '01 · El proceso',
        title: 'Cómo se corrige la guía',
        steps: [
          { title: 'Detectar', body: 'La validación encuentra la fila duplicada.' },
          { title: 'Rechazar', body: 'La entrada no se procesa.' },
          { title: 'Señalar', body: 'La fila queda marcada en la guía.' },
          { title: 'Corregir', body: 'La persona ajusta la fila.' },
          { title: 'Reenviar', body: 'La guía vuelve a validarse.' },
        ],
      },
      {
        purpose: 'table',
        kicker: '02 · La tabla',
        title: 'Estados de la guía',
        table: {
          caption: 'Recorrido de la guía',
          columns: ['Estado', 'Quién actúa', 'Qué ocurre'],
          rows: [
            ['Detectada', 'Validación', 'La fila duplicada queda señalada.'],
            ['Rechazada', 'Validación', 'La entrada no se procesa.'],
            ['Corregida', 'Persona', 'La fila se ajusta y se reenvía.'],
          ],
        },
      },
    ],
  };

  const items = styleSlugs.map((style) => {
    const deck = renderDeck({ style: getStyle(style), brief });
    const validation = validateDeck(deck.html, style);
    assert.equal(validation.grade, 'A', `${style}: grade ${validation.grade} (${validation.score})`);
    return { html: deck.html, style, label: `${style}-process-table` };
  });

  const entries = await auditDeckSlidesBatch(items, { viewport: DECK_SLIDE_VIEWPORT, concurrency: 4 });
  const skipped = entries.find((entry) => entry.report.status !== 'ran');
  if (skipped) {
    t.skip(skipped.report.message ?? 'Chromium unavailable');
    return;
  }
  for (const entry of entries) {
    assert.equal(entry.report.slides.length, 4, `${entry.label}: cover + process + table + closing`);
  }
  assert.deepEqual(failuresFor(entries), []);
});
