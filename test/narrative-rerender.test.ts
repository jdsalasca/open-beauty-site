import assert from 'node:assert/strict';
import test from 'node:test';
import { applyMeasuredFeedbackChanges, measureFeedbackRegionDiff } from '../src/narrative/rerender.js';
import type { NarrativeFeedback } from '../src/types/narrative-review.js';

const feedback: NarrativeFeedback = {
  id: 'fb-one', phaseId: 'change', frameIndex: 3, region: { x: 1, y: 1, w: 2, h: 2 },
  problem: 'El objeto no se distingue.', severity: 'major', evidence: { frameRef: 3 },
  allowedAdjustment: 'increase object size', status: 'open',
};

test('rerender marks feedback fixed only when decoded pixels change in its referenced region', () => {
  const before = new Uint8Array(4 * 4 * 3).fill(120);
  const unchanged = measureFeedbackRegionDiff(before, before.slice(), 4, 4, feedback.region);
  assert.equal(unchanged.pixelsChanged, 0);
  assert.equal(unchanged.ratio, 0);
  assert.equal(applyMeasuredFeedbackChanges([feedback], new Map([['fb-one', unchanged]]), 'f'.repeat(64))[0]?.status, 'open');

  const after = before.slice();
  const pixel = (1 * 4 + 1) * 3;
  after[pixel] = 240;
  const changed = measureFeedbackRegionDiff(before, after, 4, 4, feedback.region);
  assert.equal(changed.pixelsChanged, 1);
  assert.equal(changed.ratio, 0.25);
  const fixed = applyMeasuredFeedbackChanges([feedback], new Map([['fb-one', changed]]), 'f'.repeat(64))[0]!;
  assert.equal(fixed.status, 'fixed');
  assert.equal(fixed.fixedInHash, 'f'.repeat(64));
});

test('non-open feedback is never rewritten as fixed by a rerender measurement', () => {
  const wontfix = { ...feedback, status: 'wontfix' as const };
  const changed = { pixelsChanged: 4, ratio: 1 };
  assert.equal(applyMeasuredFeedbackChanges([wontfix], new Map([['fb-one', changed]]), 'f'.repeat(64))[0]?.status, 'wontfix');
});
