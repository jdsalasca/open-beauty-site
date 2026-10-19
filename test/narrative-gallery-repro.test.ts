import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { createNarrative } from '../src/narrative/create.js';
import {
  DEFAULT_NARRATIVE_COMPOSITION,
  NARRATIVE_COMPOSITION_BY_STYLE,
  NARRATIVE_LABEL_TONE_BY_STYLE,
  SEMANTIC_NARRATIVE_COMPOSITION,
  narrativeCompositionFor,
  type NarrativeComposition,
} from '../src/narrative/composition.js';
import { supportedNarrativeStyles } from '../src/narrative/scene.js';
import type { StyleSlug } from '../src/types.js';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPRO_WORKER = path.join(REPO_ROOT, 'test', 'support', 'narrative-repro-worker.ts');
const NARRATIVE_ROOT = path.join(REPO_ROOT, 'docs', 'narrative-gif');
const GALLERY_ROOT = path.join(REPO_ROOT, 'docs', 'narrative-gif', 'gallery');
const PILOTS_ROOT = path.join(REPO_ROOT, 'docs', 'narrative-gif', 'pilots');
const COMPOSITIONS = ['comparison', 'checklist'] as const;

const EXPECTED_COMPOSITIONS: Record<StyleSlug, NarrativeComposition> = {
  papercraft: { textWidthRatio: 0.57, artGapRatio: 0.02, artWidthRatio: 0.31, artY: 0.08, artHeight: 0.84 },
  brutalist: { textWidthRatio: 0.57, artGapRatio: 0.02, artWidthRatio: 0.31, artY: 0.08, artHeight: 0.84 },
  renaissance: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  artdeco: { textWidthRatio: 0.41, artGapRatio: 0.02, artWidthRatio: 0.47, artY: 0.05, artHeight: 0.90 },
  isotype: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  opart: { textWidthRatio: 0.41, artGapRatio: 0.02, artWidthRatio: 0.47, artY: 0.05, artHeight: 0.90 },
  vaporwave: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  galactic: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  nature: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  ukiyoe: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  bestiary: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  psychedelic: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
  memphis: { textWidthRatio: 0.43, artGapRatio: 0.02, artWidthRatio: 0.45, artY: 0.05, artHeight: 0.90 },
};

const EXPECTED_LABEL_TONES: Record<StyleSlug, 'ink' | 'accent'> = {
  artdeco: 'accent',
  bestiary: 'ink',
  brutalist: 'ink',
  galactic: 'accent',
  isotype: 'accent',
  memphis: 'ink',
  nature: 'accent',
  opart: 'accent',
  papercraft: 'accent',
  psychedelic: 'ink',
  renaissance: 'ink',
  ukiyoe: 'accent',
  vaporwave: 'accent',
};

type SourceBrief = {
  style: StyleSlug;
  title: string;
  phases: Array<{ visual: { kind: string } }>;
};

type CommittedPackage = {
  brief: SourceBrief;
  briefPath: string;
  packageDir: string;
  composition: string;
};

async function filesUnder(directory: string, accepts: (fileName: string) => boolean): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(entryPath, accepts));
    else if (entry.isFile() && accepts(entry.name)) result.push(entryPath);
  }
  return result;
}

async function readSourceBrief(briefPath: string, packageDir: string): Promise<CommittedPackage> {
  const brief = JSON.parse(await readFile(briefPath, 'utf8')) as SourceBrief;
  const composition = brief.phases[0]?.visual.kind;
  assert.ok(composition, `${briefPath} declares a visual composition`);
  assert.ok(brief.phases.every((phase) => phase.visual.kind === composition), `${briefPath} uses one composition throughout`);
  return { brief, briefPath, packageDir, composition };
}

async function committedPackages(): Promise<CommittedPackage[]> {
  const galleryBriefs = await filesUnder(GALLERY_ROOT, (fileName) => fileName === 'brief.json');
  const galleryPackages = await Promise.all(galleryBriefs.map((briefPath) => readSourceBrief(briefPath, path.dirname(briefPath))));

  const pilotBriefs = await filesUnder(path.join(PILOTS_ROOT, 'briefs'), (fileName) => fileName.endsWith('.json'));
  const pilotPackages = await Promise.all(pilotBriefs.map(async (briefPath) => {
    const brief = JSON.parse(await readFile(briefPath, 'utf8')) as SourceBrief;
    const suffix = `-${brief.style}.json`;
    const fileName = path.basename(briefPath);
    assert.ok(fileName.endsWith(suffix), `${briefPath} names its style suffix`);
    const slug = fileName.slice(0, -suffix.length);
    return readSourceBrief(briefPath, path.join(PILOTS_ROOT, brief.style, slug));
  }));

  return [...galleryPackages, ...pilotPackages];
}

test('the declarative style rules preserve every branch-specific value', () => {
  assert.deepEqual(NARRATIVE_COMPOSITION_BY_STYLE, EXPECTED_COMPOSITIONS);
  assert.deepEqual(DEFAULT_NARRATIVE_COMPOSITION, {
    textWidthRatio: 0.59,
    artGapRatio: 0.04,
    artWidthRatio: 0.27,
    artY: 0.17,
    artHeight: 0.66,
  });
  assert.deepEqual(NARRATIVE_LABEL_TONE_BY_STYLE, EXPECTED_LABEL_TONES);
  assert.deepEqual(Object.keys(NARRATIVE_COMPOSITION_BY_STYLE).sort(), supportedNarrativeStyles());
});

test('semantic papercraft and brutalist keep their enlarged art lane', () => {
  assert.deepEqual(SEMANTIC_NARRATIVE_COMPOSITION, {
    textWidthRatio: 0.43,
    artGapRatio: 0.02,
    artWidthRatio: 0.45,
    artY: 0.05,
    artHeight: 0.90,
  });
  for (const style of ['papercraft', 'brutalist'] as const) {
    assert.deepEqual(narrativeCompositionFor(style, true), SEMANTIC_NARRATIVE_COMPOSITION);
    assert.deepEqual(narrativeCompositionFor(style), EXPECTED_COMPOSITIONS[style]);
  }
  for (const style of ['isotype', 'opart'] as const) {
    assert.deepEqual(narrativeCompositionFor(style), EXPECTED_COMPOSITIONS[style]);
  }
});

test('every committed narrative pack regenerates byte-for-byte from its brief', async () => {
  const packages = await committedPackages();
  const galleryPackages = packages.filter((item) => item.briefPath.startsWith(GALLERY_ROOT));
  const pilotPackages = packages.filter((item) => item.briefPath.startsWith(path.join(PILOTS_ROOT, 'briefs')));
  const styles = supportedNarrativeStyles();
  const compositionRows = new Set(packages.map((item) => `${item.brief.style}/${item.composition}`));

  assert.equal(galleryPackages.length, 22, 'gallery has two committed packs for each of its 11 styles');
  assert.equal(pilotPackages.length, 6, 'the two pilot styles each retain three committed examples');
  assert.equal(packages.length, 28, 'all 22 gallery packs and 6 pilot packs are checked');
  assert.equal(compositionRows.size, 26, 'all 13 styles cover comparison and checklist');
  for (const style of styles) {
    for (const composition of COMPOSITIONS) {
      assert.ok(compositionRows.has(`${style}/${composition}`), `${style}/${composition} is indexed`);
    }
  }

  const manifestFiles = [
    ...await filesUnder(GALLERY_ROOT, (fileName) => fileName.endsWith('.manifest.json')),
    ...await filesUnder(PILOTS_ROOT, (fileName) => fileName.endsWith('.manifest.json')),
  ];
  const manifestDirectories = [...new Set(manifestFiles.map((fileName) => path.dirname(fileName)))].sort();
  const packageDirectories = [...new Set(packages.map((item) => item.packageDir))].sort();
  assert.deepEqual(packageDirectories, manifestDirectories, 'brief discovery accounts for every committed pack directory');

  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'narrative-gallery-repro-'));
  try {
    for (const [index, item] of packages.entries()) {
      const outputDir = path.join(tempRoot, `${index}-${item.brief.style}-${item.composition}`);
      const child = spawnSync(process.execPath, ['--import', 'tsx', REPRO_WORKER, item.briefPath, outputDir], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        timeout: 120_000,
        maxBuffer: 2 * 1024 * 1024,
        windowsHide: true,
      });
      assert.equal(child.status, 0, `${item.brief.style}/${item.composition} repro worker exited ${child.status}: ${child.stderr || child.stdout}`);
      const generated = { paths: {
        gif: path.join(outputDir, `${path.basename(item.briefPath, '.json')}.gif`),
        png: '',
        contactSheet: '',
      } };
      const outputFiles = await readdir(outputDir);
      const expectedBase = outputFiles.find((name) => name.endsWith('.manifest.json'))?.replace(/\.manifest\.json$/u, '');
      assert.ok(expectedBase, `${item.brief.style}/${item.composition} worker wrote a manifest`);
      const reproManifest = JSON.parse(await readFile(path.join(outputDir, `${expectedBase}.manifest.json`), 'utf8')) as {
        evaluation: { 'rendered-legibility': { controls: Array<{ name: string; detail: string }> } };
      };
      const balance = reproManifest.evaluation['rendered-legibility'].controls.find((control) => control.name === 'composition-balance');
      assert.ok(balance, `${item.brief.style}/${item.composition} reports decoded composition balance`);
      const fill = balance.detail.match(/text-column vertical fill ([\d.]+)%/u);
      assert.ok(fill, `${item.brief.style}/${item.composition} reports a text-column fill ratio`);
      assert.ok(Number(fill[1]) >= 60, `${item.brief.style}/${item.composition} fills at least 60% of the text column vertically`);
      generated.paths.gif = path.join(outputDir, `${expectedBase}.gif`);
      generated.paths.png = path.join(outputDir, `${expectedBase}.png`);
      generated.paths.contactSheet = path.join(outputDir, `${expectedBase}-contact-sheet.png`);
      const artifacts = [
        ['GIF', generated.paths.gif],
        ['PNG', generated.paths.png],
        ['contact sheet', generated.paths.contactSheet],
      ] as const;

      for (const [format, generatedPath] of artifacts) {
        const committedPath = path.join(item.packageDir, path.basename(generatedPath));
        const generatedBytes = await readFile(generatedPath);
        const committedBytes = await readFile(committedPath);
        assert.equal(generatedBytes.equals(committedBytes), true, `${item.brief.style}/${item.composition} ${format} matches ${item.briefPath}`);
      }
    }

    const artOnlyPackages = packages.filter((item) => item.brief.style === 'isotype' || item.brief.style === 'opart');
    for (const [index, item] of artOnlyPackages.entries()) {
      const style = item.brief.style;
      const outputDir = path.join(tempRoot, `art-only-${index}-${style}-${item.composition}`);
      const child = spawnSync(process.execPath, ['--import', 'tsx', REPRO_WORKER, item.briefPath, outputDir, '--art-only'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        timeout: 120_000,
        maxBuffer: 2 * 1024 * 1024,
        windowsHide: true,
      });
      assert.equal(child.status, 0, `${style}/${item.composition} art-only repro worker exited ${child.status}: ${child.stderr || child.stdout}`);
      const outputFiles = await readdir(outputDir);
      const expectedBase = outputFiles.find((name) => name.endsWith('.manifest.json'))?.replace(/\.manifest\.json$/u, '');
      assert.ok(expectedBase?.endsWith('-art-only'), `${style}/${item.composition} art-only worker wrote a separate manifest`);
      const manifest = JSON.parse(await readFile(path.join(outputDir, `${expectedBase}.manifest.json`), 'utf8')) as { artOnly: boolean };
      assert.equal(manifest.artOnly, true, `${style}/${item.composition} manifest records art-only mode`);
      for (const format of ['gif', 'png', 'contact-sheet.png']) {
        const generatedPath = path.join(outputDir, `${expectedBase}${format === 'contact-sheet.png' ? '-contact-sheet.png' : `.${format}`}`);
        const committedPath = path.join(item.packageDir, path.basename(generatedPath));
        const generatedBytes = await readFile(generatedPath);
        const committedBytes = await readFile(committedPath);
        assert.equal(generatedBytes.equals(committedBytes), true, `${style}/${item.composition} art-only ${format} matches ${item.briefPath}`);
      }
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

test('all committed narrative manifests reproduce GIF, PNG and contact sheet byte-for-byte', async () => {
  const manifestFiles = await filesUnder(NARRATIVE_ROOT, (fileName) => fileName.endsWith('.manifest.json'));
  assert.equal(manifestFiles.length, 60, 'all gallery, pilot, semantic and standalone art-only packs are enumerated');
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'narrative-all-manifest-repro-'));
  try {
    for (const [index, manifestPath] of manifestFiles.entries()) {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
        brief: unknown;
        artOnly?: boolean;
        style?: string;
        files: { gif: string; png: string; contactSheet: string };
      };
      assert.ok(manifest.brief, `${manifestPath} stores its source brief`);
      const outputDir = path.join(tempRoot, `${index}-${manifest.style ?? 'narrative'}`);
      const result = await createNarrative(manifest.brief, { outputDir, artOnly: manifest.artOnly === true });
      const artifacts = [
        ['GIF', result.paths.gif, manifest.files.gif],
        ['PNG', result.paths.png, manifest.files.png],
        ['contact sheet', result.paths.contactSheet, manifest.files.contactSheet],
      ] as const;
      for (const [format, generatedPath, committedPath] of artifacts) {
        const sourcePath = path.join(path.dirname(manifestPath), path.basename(committedPath));
        const generatedBytes = await readFile(generatedPath);
        const committedBytes = await readFile(sourcePath);
        assert.equal(generatedBytes.equals(committedBytes), true, `${format} reproduces ${manifestPath}`);
      }
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
