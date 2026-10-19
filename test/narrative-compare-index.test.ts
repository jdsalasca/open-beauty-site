import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();
const DOCS = path.join(ROOT, 'docs', 'narrative-gif');
const COMPARE = path.join(DOCS, 'compare');
const BASE = '09bc6abbe4a9aac02416e7843a8acad12fa06faf';
const MAX_GIF_BYTES = 6 * 1024 * 1024;

function assetPath(relative: string): string {
  return path.resolve(COMPARE, relative);
}

test('committed before/after index covers every base brief and semantic fixture within the GIF budget', () => {
  const index = JSON.parse(readFileSync(path.join(COMPARE, 'index.json'), 'utf8'));
  assert.equal(index.baseCommit, BASE);
  assert.equal(index.pairs.length, 14, 'base commit contributes 8 gallery and 6 pilot briefs for the six requested styles');
  assert.equal(index.semanticFixtures.length, 12, 'all committed semantic briefs retain narrative and art-only variants');
  const styles = new Set(['papercraft', 'brutalist', 'isotype', 'opart', 'renaissance', 'ukiyoe']);
  for (const pair of index.pairs) {
    assert.ok(styles.has(pair.style));
    assert.equal(pair.before.metrics.seed ?? pair.seed, pair.seed);
    assert.equal(pair.after.metrics.seed ?? pair.seed, pair.seed);
    assert.match(pair.briefSha256, /^[a-f0-9]{64}$/u);
    for (const side of [pair.before, pair.after]) {
      assert.ok(side.metrics.gifBytes > 0 && side.metrics.gifBytes <= MAX_GIF_BYTES);
      assert.ok(side.metrics.frames > 0 && side.metrics.durationMs > 0);
      for (const kind of ['gif', 'png', 'contactSheet', 'manifest']) assert.equal(existsSync(assetPath(side.assets[kind])), true, `${pair.style}/${pair.composition} ${kind} exists`);
      assert.equal(side.metrics.phaseHolds.length, pair.phases.length, `${pair.style}/${pair.composition} records every decoded phase hold`);
      const manifest = JSON.parse(readFileSync(assetPath(side.assets.manifest), 'utf8'));
      assert.equal(manifest.seed, pair.seed, `${pair.style}/${pair.composition} manifest keeps the comparison seed`);
    }
    assert.equal(pair.phases.length, pair.before.metrics.phaseHolds.length);
    assert.equal(pair.phases.length, pair.after.metrics.phaseHolds.length);
    assert.equal(pair.before.transformations.length, 0, `${pair.style}/${pair.composition} historical baseline has no semantic transformation evidence`);
    assert.ok(pair.after.transformations.length > 0, `${pair.style}/${pair.composition} upgraded brief records decoded transformation controls`);
    assert.ok(pair.after.transformations.every((control: string) => control.startsWith('pass ·')), `${pair.style}/${pair.composition} decoded object controls pass`);
    assert.match(pair.after.objectRegionDiff, /^pass ·/u, `${pair.style}/${pair.composition} region diff passes from decoded object controls`);
    assert.match(pair.before.objectRegionDiff, /^pending ·/u, `${pair.style}/${pair.composition} legacy baseline remains honest about undeclared regions`);
  }
  for (const fixture of index.semanticFixtures) {
    assert.ok(styles.has(fixture.style));
    for (const side of [fixture.narrative, fixture.artOnly]) {
      for (const kind of ['gif', 'png', 'contactSheet', 'manifest']) assert.equal(existsSync(assetPath(side[kind])), true, `${fixture.style}/${fixture.title} ${kind} exists`);
      const manifest = JSON.parse(readFileSync(assetPath(side.manifest), 'utf8'));
      assert.equal(manifest.seed, fixture.seed);
      assert.ok(manifest.bytes.gif <= MAX_GIF_BYTES);
    }
    const artOnlyManifest = JSON.parse(readFileSync(assetPath(fixture.artOnly.manifest), 'utf8'));
    assert.equal(artOnlyManifest.artOnly, true);
    assert.equal(fixture.reviewState || 'pending', 'pending', 'no independently reviewed semantic fixture is auto-approved');
  }
  const binaries = readdirSync(COMPARE, { recursive: true }).filter((name) => typeof name === 'string' && /\.(?:gif|png)$/iu.test(name));
  const bytes = binaries.reduce((total, name) => total + statSync(path.join(COMPARE, name)).size, 0);
  assert.ok(bytes <= 25 * 1024 * 1024, `new binary payload stays under 25 MiB (actual ${bytes})`);
});
