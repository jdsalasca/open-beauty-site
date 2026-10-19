import assert from 'node:assert/strict';
import test from 'node:test';
import { planArtifact } from '../src/plan.js';

const message = 'Una guía puede traer una fila completamente duplicada; una validación la detecta y rechaza esa entrada; la persona recibe una indicación para corregirla.';

test('plan distributes clauses verbatim across gif scenes', () => {
  const result = planArtifact({
    format: 'gif',
    style: 'brutalist',
    audience: 'Producto',
    purpose: 'Explicar validación',
    message,
  });
  assert.equal(result.storyboard.length, 3);
  assert.deepEqual(result.storyboard.map((item) => item.purpose), ['Problema', 'Solución', 'Highlight']);
  assert.equal(result.storyboard[0].draftText, 'Una guía puede traer una fila completamente duplicada');
  assert.equal(result.storyboard[1].draftText, 'una validación la detecta y rechaza esa entrada');
  assert.equal(result.storyboard[2].draftText, 'la persona recibe una indicación para corregirla');
  assert.equal(new Set(result.storyboard.map((item) => item.draftText)).size, 3);
});

test('plan leaves leftover parts null instead of duplicating', () => {
  const result = planArtifact({
    format: 'web',
    style: 'papercraft',
    audience: 'Producto',
    purpose: 'Explicar',
    message: 'Solo una cláusula.',
  });
  assert.equal(result.storyboard[0].draftText, 'Solo una cláusula');
  assert.equal(result.storyboard[1].draftText, null);
  assert.equal(result.storyboard[2].draftText, null);
  assert.equal(result.storyboard[3].draftText, null);
  assert.ok(result.missing.some((entry) => entry.includes('section-2.draftText')));
});

test('lengthNote and null headlineSuggestion for long clauses', () => {
  const result = planArtifact({
    format: 'gif',
    style: 'papercraft',
    audience: 'Producto',
    purpose: 'Explicar',
    message: 'Una guía puede traer una fila completamente duplicada; ok.',
  });
  assert.ok(result.storyboard[0].lengthNote);
  assert.equal(result.storyboard[0].headlineSuggestion, null);
});

test('suggested candidates are unconfirmed and do not override explicit entities', () => {
  const withExplicit = planArtifact({
    format: 'gif',
    style: 'papercraft',
    audience: 'Producto',
    purpose: 'Explicar',
    message,
    entities: ['guía', 'fila'],
    actions: ['detectar', 'rechazar'],
  });
  assert.deepEqual(withExplicit.entities, ['guía', 'fila']);
  assert.deepEqual(withExplicit.actions, ['detectar', 'rechazar']);
  assert.ok(withExplicit.suggested.entities.every((item) => item.confirmed === false));
  assert.ok(withExplicit.suggested.actions.every((item) => item.confirmed === false));
  assert.ok(withExplicit.brief.suggestions);
  const unconfirmed = (withExplicit.brief.suggestions as any).entities[0]._unconfirmed;
  assert.equal(unconfirmed, true);

  const withoutExplicit = planArtifact({
    format: 'gif',
    style: 'papercraft',
    audience: 'Producto',
    purpose: 'Explicar',
    message,
  });
  assert.deepEqual(withoutExplicit.entities, []);
  assert.deepEqual(withoutExplicit.actions, []);
  assert.ok(withoutExplicit.suggested.entities.length > 0);
  assert.ok(withoutExplicit.suggested.actions.some((item) => item.label === 'detecta' || item.label === 'rechaza'));
});

test('verbose flag includes full cell list, default omits it', () => {
  const plain = planArtifact({
    format: 'gif',
    style: 'papercraft',
    audience: 'Producto',
    purpose: 'Explicar',
    message: 'Hola.',
  });
  assert.equal(plain.capabilities.primitives, undefined);
  const verbose = planArtifact({
    format: 'gif',
    style: 'papercraft',
    audience: 'Producto',
    purpose: 'Explicar',
    message: 'Hola.',
    verbose: true,
  });
  assert.equal(verbose.capabilities.primitives?.length, 24);
});

test('bad input surfaces content lint warnings and no fabricated metrics', () => {
  const result = planArtifact({
    format: 'web',
    style: 'papercraft',
    audience: 'Producto',
    purpose: 'Explicar',
    message: 'Ticket ABC-123 en staging, PR #42, redujo errores 40%',
  });
  const joined = result.warnings.join(' ');
  assert.match(joined, /Jira/);
  assert.match(joined, /PR/);
  assert.match(joined, /staging/);
  assert.match(joined, /40%/);
});

test('english heuristics extract candidates', () => {
  const result = planArtifact({
    format: 'web',
    style: 'papercraft',
    audience: 'Product',
    purpose: 'Explain',
    message: 'A guide may contain a fully duplicated row; a validator detects and rejects that entry; the person receives a prompt to fix it.',
  });
  const entityLabels = result.suggested.entities.map((item) => item.label);
  const actionLabels = result.suggested.actions.map((item) => item.label);
  assert.ok(entityLabels.includes('guide'));
  assert.ok(entityLabels.includes('row'));
  assert.ok(actionLabels.includes('detects'));
  assert.ok(actionLabels.includes('rejects'));
  assert.deepEqual(result.storyboard.map((item) => item.draftText), [
    'A guide may contain a fully duplicated row',
    'a validator detects and rejects that entry',
    'the person receives a prompt to fix it',
    null,
  ]);
});

test('conflating claims produce warning', () => {
  const result = planArtifact({
    format: 'gif',
    style: 'papercraft',
    audience: 'Producto',
    purpose: 'Explicar',
    message: 'El sistema elimina automáticamente los duplicados y soluciona todos los errores.',
  });
  assert.ok(result.warnings.some((warning) => /action claims/i.test(warning)));
});

test('clean json omits deprecated aliases', () => {
  const result = planArtifact({
    format: 'gif',
    style: 'papercraft',
    audience: 'Producto',
    purpose: 'Explicar',
    message: 'Hola.',
  }) as any;
  assert.equal(result.capabilityCheck, undefined);
  assert.equal(result.briefSkeleton, undefined);
  assert.equal(result.skeleton, undefined);
  assert.equal(result.command, undefined);
  assert.equal(result.recommendedNextCommand, undefined);
  assert.equal(result.storyboard[0].text, undefined);
});