import assert from 'node:assert/strict';
import test from 'node:test';
import { validateHtml } from '../src/validate.js';
import { renderPage } from '../src/page/index.js';

function pageWithBodies(bodies: string[]): string {
  return renderPage('nature', {
    title: 'Repetición',
    locale: 'es',
    sections: bodies.map((body, index) => ({ title: `Sección ${index + 1}`, body })),
  });
}

test('three identical card bodies are reported as repeated filler', () => {
  const body = 'Publicar una lectura común cada viernes con el equipo completo.';
  const result = validateHtml(pageWithBodies([body, body, body]), 'nature');
  const issue = result.issues.find((item) => item.code === 'repeated-filler');
  assert.ok(issue, 'expected repeated-filler');
  assert.equal(issue.severity, 'warn');
  assert.equal(result.grade, 'B', 'an open warning caps the grade below A');
  assert.equal(result.score, 94);
});

test('near-identical bodies (punctuation and case) still count as repetition', () => {
  const result = validateHtml(
    pageWithBodies([
      'Publicar una lectura común cada viernes con el equipo completo.',
      'publicar una lectura común cada viernes con el equipo completo!',
      'Publicar la lectura común cada viernes con el equipo completo',
    ]),
    'nature',
  );
  assert.ok(result.issues.some((item) => item.code === 'repeated-filler'));
});

test('two repeated bodies are not flagged', () => {
  const body = 'Publicar una lectura común cada viernes con el equipo completo.';
  const result = validateHtml(pageWithBodies([body, body, 'Rotar el rol de estación móvil entre las dos sedes.']), 'nature');
  assert.equal(result.issues.some((item) => item.code === 'repeated-filler'), false);
});

test('short repeated labels are ignored: the check targets paragraphs and card bodies', () => {
  const result = validateHtml(pageWithBodies(['Leer', 'Leer', 'Leer']), 'nature');
  assert.equal(result.issues.some((item) => item.code === 'repeated-filler'), false);
});
