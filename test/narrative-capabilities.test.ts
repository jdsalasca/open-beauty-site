import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { getNarrativeFontProfile } from '../src/narrative/fonts.js';
import { layoutNarrative } from '../src/narrative/layout.js';
import { narrativeCapabilityReport } from '../src/narrative/capabilities.js';
import { NARRATIVE_SCENE_TEXT_CATALOG, workflowBadgeText } from '../src/narrative/i18n.js';
import { getNarrativeScene, supportedNarrativeStyles } from '../src/narrative/scene.js';
import { normalizeNarrativeBrief } from '../src/narrative/brief.js';
import type { NarrativeLocale, NarrativeRenderContext } from '../src/types/narrative.js';

const ROOT = process.cwd();
const ASPECTS = [
  { id: '16:9', width: 1280, height: 720 },
  { id: '1:1', width: 1080, height: 1080 },
  { id: '9:16', width: 1080, height: 1920 },
] as const;

function fixture(style: string, locale: NarrativeLocale, width: number, height: number, workflowStatus = 'in-review', badgePolicy = 'workflow') {
  return normalizeNarrativeBrief({
    style,
    kind: 'narrative-gif',
    locale,
    audience: locale === 'en' ? 'Product' : 'Producto',
    title: locale === 'en' ? 'Guides' : 'Guías',
    workflowStatus,
    outcome: { mode: 'expected' },
    illustrative: true,
    badgePolicy,
    phases: [
      { id: 'before', label: locale === 'en' ? 'Before' : 'Antes', text: locale === 'en' ? 'Measure without cue.' : 'Medida sin señal.', visual: { kind: 'comparison', state: 'unreviewed' } },
      { id: 'change', label: locale === 'en' ? 'Change' : 'Cambio', text: locale === 'en' ? 'A cue appears.' : 'Ahora hay señal.', visual: { kind: 'comparison', state: 'flagged' } },
      { id: 'result', label: locale === 'en' ? 'Expected result' : 'Resultado esperado', text: locale === 'en' ? 'Review first.' : 'Revisar primero.', visual: { kind: 'comparison', state: 'review-ready' } },
    ],
    playback: { preset: 'concise', transitionMs: 160, loop: true },
    output: { width, height, preset: 'review-1280x720', formats: ['gif', 'png'] },
    seed: 7,
  }).brief;
}

function phasePixels(style: string, locale: NarrativeLocale, width: number, height: number, workflowStatus = 'in-review', badgePolicy = 'workflow'): Uint8ClampedArray {
  const brief = fixture(style, locale, width, height, workflowStatus, badgePolicy);
  const scene = getNarrativeScene(brief.style);
  const layout = layoutNarrative(brief);
  const fonts = getNarrativeFontProfile(brief.style);
  const object = scene.createObject(brief, () => 0.5);
  const phaseIndex = 2;
  const phase = brief.phases[phaseIndex]!;
  const context: NarrativeRenderContext = {
    brief,
    layout,
    frame: { kind: 'hold', phaseIndex, fromPhaseIndex: phaseIndex, toPhaseIndex: phaseIndex, progress: 1, delayMs: 2_000 },
    localTimeMs: 0,
    phaseIndex,
    phase,
    object,
    safeBoxes: { safe: layout.safeZone, text: layout.textArea, art: layout.reservedArtArea },
    fonts,
    rng: () => 0.5,
  };
  return scene.renderFrame(context);
}

test('capability registry is explicit and every fallback style/aspect/locale cell renders', () => {
  const report = narrativeCapabilityReport();
  assert.equal(report.contractVersion, 3);
  // papercraft 16 + brutalist 16 (4 primitives x 16:9,1:1 x es,en) + renaissance 4 + ukiyoe 4 (2 primitives x 16:9 x es,en)
  assert.deepEqual(report.summary, { supported: 40, unsupported: 96, fallback: 176 });
  assert.equal(report.cells.length, 312);
  const rendered = new Set<string>();

  for (const style of supportedNarrativeStyles()) {
    const scene = getNarrativeScene(style);
    assert.ok(scene.vocabulary, `${style} declares visual vocabulary`);
    for (const aspect of ASPECTS) {
      if (!scene.supportsAspect(aspect.width / aspect.height)) continue;
      for (const locale of ['es', 'en'] as const) {
        const pixels = phasePixels(style, locale, aspect.width, aspect.height);
        assert.equal(pixels.length, aspect.width * aspect.height * 4, `${style}/${aspect.id}/${locale} rendered RGBA`);
        rendered.add(`${style}/${aspect.id}/${locale}`);
      }
    }
  }

  for (const cell of report.cells.filter((item) => item.status === 'fallback')) {
    assert.ok(rendered.has(`${cell.style}/${cell.aspect}/${cell.locale}`), `fallback cell has render evidence: ${cell.style}/${cell.primitive}/${cell.aspect}/${cell.locale}`);
    assert.ok(cell.reason.length > 12);
    assert.ok(cell.allowed.visualKinds.length > 0);
    assert.ok(cell.allowed.visualStates.length > 0);
    assert.ok(Object.keys(cell.allowed.semanticStates).length > 0);
    assert.ok(Object.keys(cell.allowed.semanticActions).length > 0);
  }
  for (const cell of report.cells.filter((item) => item.status === 'supported')) {
    assert.ok(['papercraft', 'brutalist', 'renaissance', 'ukiyoe'].includes(cell.style));
    assert.match(cell.reason, /narrative-(?:semantic-render|style-semantic)\.test\.ts/u);
    assert.ok(cell.allowed.semanticEntityKinds.length > 0);
  }
  assert.ok(report.cells.filter((cell) => cell.status === 'unsupported').every((cell) => cell.reason.length > 12));
});

test('all fixed illustration copy is catalogued in both locales and no renderer draws hard-coded Spanish copy', async () => {
  assert.deepEqual(Object.keys(NARRATIVE_SCENE_TEXT_CATALOG).sort(), [...supportedNarrativeStyles()].sort());
  assert.equal(NARRATIVE_SCENE_TEXT_CATALOG.memphis.es.review, 'REVISIÓN');
  assert.equal(NARRATIVE_SCENE_TEXT_CATALOG.memphis.es.reviewAction, 'REVISAR');
  assert.equal(NARRATIVE_SCENE_TEXT_CATALOG.memphis.en.reviewAction, 'REVIEW');
  for (const style of supportedNarrativeStyles()) {
    const localized = NARRATIVE_SCENE_TEXT_CATALOG[style];
    assert.deepEqual(Object.keys(localized.es).sort(), Object.keys(localized.en).sort(), `${style} has matching es/en keys`);
    for (const key of Object.keys(localized.es)) {
      assert.notEqual(localized.en[key], localized.es[key], `${style}.${key} is translated`);
      assert.doesNotMatch(localized.en[key]!, /[áéíóúüñ]|\b(?:guía|lectura|señal|revisión|observación|archivo|pendiente|observar|anotar|archivar)\b/iu, `${style}.${key} is English in locale=en`);
    }
    if (Object.keys(localized.es).length > 0) {
      const spanishArt = phasePixels(style, 'es', 1280, 720);
      const englishArt = phasePixels(style, 'en', 1280, 720);
      assert.notDeepEqual(englishArt, spanishArt, `${style} changes rendered illustration pixels for locale=en`);
    }
    const source = await readFile(path.join(ROOT, 'src', 'narrative', 'scenes', `${style}.ts`), 'utf8');
    const hardCodedVisibleText = [
      ...Array.from(source.matchAll(/drawText\(ctx,\s*['"]([^'"]+)['"]/gu), (match) => match[1]!),
      ...Array.from(source.matchAll(/drawRoleText\(ctx,\s*['"]([^'"]+)['"]/gu), (match) => match[1]!),
      ...Array.from(source.matchAll(/\.fillText\(['"]([^'"]+)['"]/gu), (match) => match[1]!),
    ].filter((value) => value !== 'R');
    assert.deepEqual(hardCodedVisibleText, [], `${style} fixed illustration text goes through the locale catalog`);
  }
});

test('badgePolicy none makes every renderer independent of workflow stamps in every frame', () => {
  for (const style of supportedNarrativeStyles()) {
    const open = phasePixels(style, 'es', 1280, 720, 'open', 'none');
    const done = phasePixels(style, 'es', 1280, 720, 'done', 'none');
    assert.deepEqual(done, open, `${style} does not render workflow status when badgePolicy=none`);
  }
  assert.equal(workflowBadgeText('papercraft', 'en', 'done', 'none'), undefined);
  assert.equal(workflowBadgeText('brutalist', 'en', 'done', 'custom', 'Internal'), 'Internal');
});
