import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMotion, motionChecks } from '../src/motion.js';

test('motion renders an animated, reduced-motion SVG with a scene', () => {
  const svg = renderMotion({
    style: 'nature',
    title: 'El jardín de las horas lentas',
    subtitle: 'Una hoja prensada también es una forma de mirar el tiempo.',
    scene: 'bloom',
    size: 'landscape',
    duration: 14,
    maxxing: true,
  });
  assert.match(svg, /<svg/);
  assert.match(svg, /@keyframes/);
  assert.match(svg, /prefers-reduced-motion/);
  assert.match(svg, /bloom-stage/);
  assert.ok(motionChecks(svg, 'bloom').every((check) => check.passed));
});


test('illustration composes a garden cast as animated vector paper', () => {
  const svg = renderMotion({
    style: 'papercraft',
    title: 'El jardín de los conejos',
    scene: 'illustration',
    illustration: { kind: 'garden', characters: ['rabbit', 'farmer', 'bird'], props: ['cabbage', 'fence', 'wheelbarrow'] },
    size: 'landscape',
    duration: 16,
    maxxing: true,
  });
  assert.match(svg, /illustration-stage/);
  assert.match(svg, /pc-bird/);
  assert.match(svg, /pc-cloud/);
  assert.match(svg, /prefers-reduced-motion/);
  assert.ok(motionChecks(svg, 'illustration').every((check) => check.passed));
});
