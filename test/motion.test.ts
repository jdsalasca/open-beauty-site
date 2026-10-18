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
