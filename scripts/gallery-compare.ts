import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const DOCS_ROOT = path.join(ROOT, 'docs', 'narrative-gif');
const COMPARE_ROOT = path.join(DOCS_ROOT, 'compare');
const BASE = '09bc6abbe4a9aac02416e7843a8acad12fa06faf';
const TARGET_STYLES = new Set(['papercraft', 'brutalist', 'isotype', 'opart', 'renaissance', 'ukiyoe']);
const MAX_GIF_BYTES = 6 * 1024 * 1024;

type JsonRecord = Record<string, any>;
type ArtifactKind = 'gif' | 'png' | 'contactSheet' | 'manifest';
type ArtifactRef = Record<ArtifactKind, string>;

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function posix(value: string): string {
  return value.split(path.sep).join('/');
}

function baseShow(file: string): Buffer {
  return execFileSync('git', ['show', `${BASE}:${file}`], { cwd: ROOT, maxBuffer: 16 * 1024 * 1024 });
}

function fileListAtBase(): string[] {
  return execFileSync('git', ['ls-tree', '-r', '--name-only', BASE, '--', 'docs/narrative-gif/pilots', 'docs/narrative-gif/gallery'], { cwd: ROOT, encoding: 'utf8' })
    .split(/\r?\n/u).filter(Boolean);
}

async function walk(directory: string): Promise<string[]> {
  const files: string[] = [];
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return files; throw error; }
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

async function contentIndex(): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (const file of await walk(DOCS_ROOT)) {
    if (file.startsWith(`${COMPARE_ROOT}${path.sep}`) || file === COMPARE_ROOT) continue;
    const key = sha256(await readFile(file));
    const prior = result.get(key);
    if (!prior || posix(path.relative(DOCS_ROOT, file)).localeCompare(posix(path.relative(DOCS_ROOT, prior)), 'en') < 0) result.set(key, file);
  }
  return result;
}

function normalizedBaseManifest(packDirectory: string, folderFiles: string[]): { manifestPath: string; manifest: JsonRecord } {
  const manifestPath = folderFiles.find((candidate) => path.posix.dirname(candidate) === packDirectory && candidate.endsWith('.manifest.json'));
  if (!manifestPath) throw new Error(`No committed pack manifest in ${packDirectory} at ${BASE}.`);
  return { manifestPath, manifest: JSON.parse(baseShow(manifestPath).toString('utf8')) as JsonRecord };
}

function outputFolderForBrief(briefPath: string, style: string): string {
  if (briefPath.startsWith('docs/narrative-gif/gallery/')) return path.posix.dirname(briefPath);
  const name = path.posix.basename(briefPath);
  const suffix = `-${style}.json`;
  if (!name.endsWith(suffix)) throw new Error(`Pilot brief ${briefPath} does not end in ${suffix}.`);
  const slug = name.slice(0, -suffix.length);
  return `docs/narrative-gif/pilots/${style}/${slug}`;
}

function phaseAndComposition(brief: JsonRecord): { composition: string; phases: Array<{ id: string; label: string }> } {
  const phases = Array.isArray(brief.phases) ? brief.phases : [];
  const composition = phases[0]?.visual?.kind;
  if (typeof composition !== 'string' || !phases.every((phase: JsonRecord) => phase?.visual?.kind === composition)) {
    throw new Error(`Brief "${String(brief.title)}" must declare one composition across its phases.`);
  }
  return { composition, phases: phases.map((phase: JsonRecord) => ({ id: String(phase.id), label: String(phase.label ?? phase.id) })) };
}

function controlList(manifest: JsonRecord): JsonRecord[] {
  if (Array.isArray(manifest.controls)) return manifest.controls;
  return Object.values(manifest.evaluation ?? {}).flatMap((entry: any) => Array.isArray(entry?.controls) ? entry.controls : []);
}

function evaluationLevels(manifest: JsonRecord): Record<string, string> {
  const levels = ['technical-integrity', 'style-conformance', 'rendered-legibility', 'narrative', 'visual-review'];
  return Object.fromEntries(levels.map((level) => {
    const value = manifest.evaluation?.[level]?.status;
    const normalized = typeof value === 'string' && value && value !== 'none' ? value : level === 'visual-review' ? 'pending' : 'not-evaluated';
    return [level, normalized];
  }));
}

function decodedPhaseHolds(manifest: JsonRecord): Array<{ phaseId: string; decodedMs: number }> {
  const holds = manifest.timing?.phaseHolds;
  if (Array.isArray(holds)) return holds.map((hold: JsonRecord) => ({ phaseId: String(hold.phaseId), decodedMs: Number(hold.decodedMs) }));
  const legacy = manifest.phaseHoldsVerified;
  if (Array.isArray(legacy)) return legacy.map((hold: JsonRecord) => ({ phaseId: String(hold.phaseId), decodedMs: Number(hold.decodedMs) }));
  return [];
}

function controlResult(manifest: JsonRecord, match: (control: JsonRecord) => boolean): string {
  const control = controlList(manifest).find(match);
  return control ? `${control.passed ? 'pass' : 'fail'} · ${String(control.detail ?? control.name)}` : 'pending · sin evidencia de control';
}

function transformationControls(manifest: JsonRecord): string[] {
  return controlList(manifest).filter((control) => typeof control.name === 'string' && /semantic-object-(?:transformation|midpoint)/u.test(control.name))
    .map((control) => `${control.passed ? 'pass' : 'fail'} · ${String(control.name)} · ${String(control.detail ?? '')}`);
}

function phaseEvaluation(manifest: JsonRecord, phases: Array<{ id: string; label: string }>): Array<{ phaseId: string; levels: Record<string, string> }> {
  const controls = controlList(manifest);
  return phases.map(({ id, label }) => {
    const hold = Array.isArray(manifest.phaseHoldsVerified) ? manifest.phaseHoldsVerified.find((item: JsonRecord) => item.phaseId === id) : undefined;
    const controlsForPhase = controls.filter((control) => typeof control.name === 'string' && (control.name.includes(id) || control.name.includes(label)) && /semantic-object-(?:transformation|midpoint)/u.test(control.name));
    const narrative = controlsForPhase.length === 0 ? 'pending' : controlsForPhase.every((control) => control.passed) ? 'pass' : 'fail';
    return { phaseId: id, levels: {
      'technical-integrity': hold ? (hold.passed ? 'pass' : 'fail') : 'pending',
      narrative,
      'visual-review': evaluationLevels(manifest)['visual-review'] ?? 'pending',
    } };
  });
}

function baseAssetPath(manifest: JsonRecord, kind: ArtifactKind, manifestPath: string, folderFiles: string[]): string {
  const declared = manifest.files?.[kind];
  const basename = typeof declared === 'string' && declared ? path.posix.basename(declared.replaceAll('\\', '/')) : undefined;
  const folder = path.posix.dirname(manifestPath);
  const pathMatch = basename ? folderFiles.find((file) => path.posix.dirname(file) === folder && path.posix.basename(file) === basename) : undefined;
  if (pathMatch) return pathMatch;
  if (kind === 'contactSheet') {
    const match = folderFiles.find((file) => path.posix.dirname(file) === folder && /contact-sheet\.png$/u.test(file));
    if (match) return match;
  }
  const extension = kind === 'gif' ? '.gif' : kind === 'manifest' ? '.manifest.json' : '.png';
  const match = folderFiles.find((file) => path.posix.dirname(file) === folder && file.endsWith(extension));
  if (!match) throw new Error(`Could not locate ${kind} for ${manifestPath}.`);
  return match;
}

async function storeBytes(bytes: Buffer, name: string, folder: string, index: Map<string, string>): Promise<string> {
  const digest = sha256(bytes);
  const existing = index.get(digest);
  if (existing) return posix(path.relative(COMPARE_ROOT, existing));
  const relative = posix(path.join(folder, name));
  const destination = path.join(COMPARE_ROOT, ...relative.split('/'));
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, bytes);
  index.set(digest, destination);
  return relative;
}

async function storeGenerated(file: string, folder: string, index: Map<string, string>): Promise<string> {
  const bytes = await readFile(file);
  return storeBytes(bytes, path.basename(file), folder, index);
}

async function renderViaCli(brief: JsonRecord, outputDir: string, artOnly = false): Promise<{ manifest: JsonRecord; manifestPath: string; elapsedMs: number }> {
  const tempBrief = path.join(outputDir, 'source-brief.json');
  await mkdir(outputDir, { recursive: true });
  await writeFile(tempBrief, `${JSON.stringify(brief, null, 2)}\n`, 'utf8');
  const renderDir = path.join(outputDir, 'pack');
  const cli = path.join(ROOT, 'dist', 'cli.js');
  const args = [cli, 'narrative', '--style', String(brief.style), '--brief', tempBrief, '--out', renderDir];
  if (artOnly) args.push('--art-only');
  const started = performance.now();
  const child = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', timeout: 120_000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
  const elapsedMs = Math.round(performance.now() - started);
  if (child.error || child.status !== 0) throw new Error(`CLI render failed for ${String(brief.style)}/${String(brief.title)}: ${child.error?.message ?? child.stderr ?? child.stdout}`);
  const manifestFile = (await readdir(renderDir)).find((name) => name.endsWith('.manifest.json'));
  if (!manifestFile) throw new Error(`CLI render produced no manifest for ${String(brief.title)}.`);
  const manifestPath = path.join(renderDir, manifestFile);
  return { manifest: JSON.parse(await readFile(manifestPath, 'utf8')) as JsonRecord, manifestPath, elapsedMs };
}

async function generatedSide(manifest: JsonRecord, manifestPath: string, outputFolder: string, renderMs: number | null, index: Map<string, string>): Promise<JsonRecord> {
  const assets: Partial<ArtifactRef> = {};
  for (const kind of ['gif', 'png', 'contactSheet'] as const) {
    const declared = manifest.files?.[kind];
    const file = typeof declared === 'string' ? path.resolve(path.dirname(manifestPath), path.basename(declared.replaceAll('\\', '/'))) : undefined;
    if (!file) continue;
    assets[kind] = await storeGenerated(file, outputFolder, index);
  }
  const manifestRelative = posix(path.join(outputFolder, path.basename(manifestPath)));
  const manifestDirectory = path.dirname(path.resolve(COMPARE_ROOT, manifestRelative));
  const manifestCopy: JsonRecord = { ...manifest, files: { ...(manifest.files ?? {}) } };
  for (const kind of ['gif', 'png', 'contactSheet'] as const) {
    const asset = assets[kind];
    if (!asset) continue;
    manifestCopy.files[kind] = posix(path.relative(manifestDirectory, path.resolve(COMPARE_ROOT, asset)));
  }
  if (Array.isArray(manifestCopy.phaseCaptures)) {
    manifestCopy.phaseCaptures = manifestCopy.phaseCaptures.map((capture: JsonRecord) => ({
      ...capture,
      ...(assets.contactSheet ? { contactSheet: posix(path.relative(manifestDirectory, path.resolve(COMPARE_ROOT, assets.contactSheet))) } : {}),
    }));
  }
  assets.manifest = await storeBytes(Buffer.from(`${JSON.stringify(manifestCopy, null, 2)}\n`, 'utf8'), path.basename(manifestPath), outputFolder, index);
  const gifBytes = typeof manifest.bytes?.gif === 'number' ? manifest.bytes.gif : (await stat(path.resolve(path.dirname(manifestPath), path.basename(String(manifest.files?.gif ?? ''))))).size;
  if (gifBytes > MAX_GIF_BYTES) throw new Error(`Generated GIF exceeds 6 MiB (${gifBytes} bytes): ${manifest.brief?.title}`);
  const phases = Array.isArray(manifest.brief?.phases) ? manifest.brief.phases.map((phase: JsonRecord) => ({ id: String(phase.id), label: String(phase.label ?? phase.id) })) : [];
  const transformations = transformationControls(manifest);
  const objectDiff = controlList(manifest).filter((control) => typeof control.name === 'string' && control.name.startsWith('semantic-object-midpoint:'))
    .map((control) => String(control.detail ?? '')).filter((detail) => /decoded object diff/u.test(detail));
  return {
    assets,
    metrics: {
      gifBytes,
      frames: manifest.decoded?.frameCount,
      durationMs: manifest.decoded?.durationMs,
      phaseHolds: decodedPhaseHolds(manifest),
      renderMs,
    },
    evaluation: evaluationLevels(manifest),
    phaseEvaluation: phaseEvaluation(manifest, phases),
    balance: controlResult(manifest, (control) => control.name === 'composition-balance'),
    transformations,
    objectRegionDiff: objectDiff.length ? objectDiff.join(' | ') : 'pending · sin diff de región semántica',
    reviewState: manifest.reviewState && manifest.reviewState !== 'none' ? manifest.reviewState : 'pending',
    openFeedback: Array.isArray(manifest.feedbackFrames) ? manifest.feedbackFrames.filter((item: JsonRecord) => item.status === 'open' || item.open === true || item.problem)
      .map((item: JsonRecord) => ({ id: item.id, phaseId: item.phaseId, frameIndex: item.frameIndex, problem: item.problem, severity: item.severity, ...(item.framePath ? { framePath: String(item.framePath) } : {}), ...(item.cropPath ? { cropPath: String(item.cropPath) } : {}) })) : [],
  };
}

async function ensureAssets(manifest: JsonRecord, manifestPath: string, folderFiles: string[], outputFolder: string, index: Map<string, string>): Promise<ArtifactRef> {
  const assets = {} as ArtifactRef;
  for (const kind of ['gif', 'png', 'contactSheet', 'manifest'] as const) {
    const source = baseAssetPath(manifest, kind, manifestPath, folderFiles);
    const bytes = baseShow(source);
    if (kind === 'gif' && bytes.byteLength > MAX_GIF_BYTES) throw new Error(`Baseline GIF exceeds 6 MiB: ${source} (${bytes.byteLength} bytes).`);
    const reference = await storeBytes(bytes, path.posix.basename(source), outputFolder, index);
    assets[kind] = reference;
  }
  return assets;
}

async function createHistoricalPairs(temp: string, allBaseFiles: string[], index: Map<string, string>): Promise<JsonRecord[]> {
  const briefPaths = allBaseFiles.filter((file) => (file.startsWith('docs/narrative-gif/gallery/') && path.posix.basename(file) === 'brief.json')
    || (file.startsWith('docs/narrative-gif/pilots/briefs/') && file.endsWith('.json')));
  const selected = briefPaths.map((briefPath) => ({ briefPath, brief: JSON.parse(baseShow(briefPath).toString('utf8')) as JsonRecord }))
    .filter(({ brief }) => TARGET_STYLES.has(String(brief.style)));
  const pairs: JsonRecord[] = [];
  for (const { briefPath, brief } of selected) {
    const style = String(brief.style);
    const storageFolder = outputFolderForBrief(briefPath, style);
    const { composition, phases } = phaseAndComposition(brief);
    const { manifestPath, manifest: baseManifest } = normalizedBaseManifest(storageFolder, allBaseFiles);
    const beforeFolder = path.posix.join(style, composition, 'before');
    const beforeAssets = await ensureAssets(baseManifest, manifestPath, allBaseFiles, beforeFolder, index);
    const renderTimes: number[] = [];
    let last: { manifest: JsonRecord; manifestPath: string } | undefined;
    for (let run = 0; run < 3; run += 1) {
      const output = await renderViaCli(brief, path.join(temp, `pair-${pairs.length}-${run}`));
      renderTimes.push(output.elapsedMs);
      last = output;
    }
    if (!last) throw new Error(`No current render was produced for ${briefPath}.`);
    const median = [...renderTimes].sort((a, b) => a - b)[1]!;
    const afterFolder = path.posix.join(style, composition, 'after');
    const afterSide = await generatedSide(last.manifest, last.manifestPath, afterFolder, median, index);
    const baseGifBytes = baseShow(baseAssetPath(baseManifest, 'gif', manifestPath, allBaseFiles)).byteLength;
    const baseControls = controlList(baseManifest);
    const beforeSide = {
      assets: beforeAssets,
      metrics: {
        gifBytes: baseGifBytes,
        frames: baseManifest.decoded?.frameCount,
        durationMs: baseManifest.decoded?.durationMs,
        phaseHolds: decodedPhaseHolds(baseManifest),
        renderMs: null,
      },
      evaluation: evaluationLevels(baseManifest),
      phaseEvaluation: phaseEvaluation(baseManifest, phases),
      balance: controlResult(baseManifest, (control) => control.name === 'composition-balance'),
      transformations: transformationControls(baseManifest),
      objectRegionDiff: baseControls.filter((control) => typeof control.name === 'string' && control.name.startsWith('semantic-object-midpoint:')).map((control) => String(control.detail ?? '')).join(' | ') || 'pending · sin diff de región semántica',
      reviewState: baseManifest.reviewState && baseManifest.reviewState !== 'none' ? baseManifest.reviewState : 'pending',
      openFeedback: Array.isArray(baseManifest.feedbackFrames) ? baseManifest.feedbackFrames : [],
    };
    const baseGif = baseShow(baseAssetPath(baseManifest, 'gif', manifestPath, allBaseFiles));
    const afterGifRef = afterSide.assets.gif as string;
    const afterGifPath = path.resolve(COMPARE_ROOT, afterGifRef);
    const afterGifBytes = (await readFile(afterGifPath)).byteLength;
    if (baseGif.byteLength > MAX_GIF_BYTES || afterGifBytes > MAX_GIF_BYTES) throw new Error(`GIF size limit exceeded for ${style}/${composition}.`);
    const phaseHolds = afterSide.metrics.phaseHolds as Array<{ phaseId: string; decodedMs: number }>;
    pairs.push({
      style, composition, seed: Number(brief.seed ?? baseManifest.seed ?? 0), briefSha256: String(baseManifest.briefSha256 ?? baseManifest.hashes?.briefSha256 ?? sha256(Buffer.from(JSON.stringify(brief)))), title: String(brief.title),
      before: { ...beforeSide, assets: beforeAssets },
      after: { ...afterSide, assets: afterSide.assets },
      objectRegionDiff: afterSide.objectRegionDiff,
      openFeedback: [
        ...(Array.isArray(beforeSide.openFeedback) ? beforeSide.openFeedback.map((item: JsonRecord) => ({ ...item, side: 'before' })) : []),
        ...(Array.isArray(afterSide.openFeedback) ? afterSide.openFeedback.map((item: JsonRecord) => ({ ...item, side: 'after' })) : []),
      ],
      phases: phases.map((phase) => ({
        ...phase,
        beforeHoldMs: decodedPhaseHolds(baseManifest).find((hold) => hold.phaseId === phase.id)?.decodedMs ?? null,
        afterHoldMs: phaseHolds.find((hold) => hold.phaseId === phase.id)?.decodedMs ?? null,
        beforeEvaluation: (beforeSide.phaseEvaluation as Array<{ phaseId: string; levels: Record<string, string> }>).find((item) => item.phaseId === phase.id)?.levels ?? {},
        afterEvaluation: (afterSide.phaseEvaluation as Array<{ phaseId: string; levels: Record<string, string> }>).find((item) => item.phaseId === phase.id)?.levels ?? {},
      })),
    });
  }
  return pairs;
}

async function createSemanticFixtures(temp: string, index: Map<string, string>): Promise<JsonRecord[]> {
  const semanticRoot = path.join(DOCS_ROOT, 'semantic');
  const briefs = (await walk(semanticRoot)).filter((file) => path.basename(file) === 'brief.json' && !file.includes(`${path.sep}art-only${path.sep}`)).sort();
  const fixtures: JsonRecord[] = [];
  for (const [fixtureIndex, briefPath] of briefs.entries()) {
    const brief = JSON.parse(await readFile(briefPath, 'utf8')) as JsonRecord;
    const style = String(brief.style);
    const { composition } = phaseAndComposition(brief);
    const locale = String(brief.locale ?? 'es');
    const fixture = path.basename(path.dirname(path.dirname(briefPath)));
    const baseFolder = path.posix.join('semantic', style, fixture, locale);
    const narrative = await renderViaCli(brief, path.join(temp, `semantic-${fixtureIndex}`));
    const artOnly = await renderViaCli(brief, path.join(temp, `semantic-art-${fixtureIndex}`), true);
    const narrativeSide = await generatedSide(narrative.manifest, narrative.manifestPath, path.posix.join(baseFolder, 'narrative'), narrative.elapsedMs, index);
    const artOnlySide = await generatedSide(artOnly.manifest, artOnly.manifestPath, path.posix.join(baseFolder, 'art-only'), artOnly.elapsedMs, index);
    const fixtureSeed = Number(brief.seed ?? narrative.manifest.seed ?? 0);
    fixtures.push({
      style, composition, seed: fixtureSeed, locale, title: String(brief.title),
      narrative: narrativeSide.assets,
      artOnly: artOnlySide.assets,
      reviewState: narrativeSide.reviewState,
      evaluation: narrativeSide.evaluation,
      artOnlyEvaluation: artOnlySide.evaluation,
      phaseEvaluation: narrativeSide.phaseEvaluation,
      artOnlyPhaseEvaluation: artOnlySide.phaseEvaluation,
      narrativeMetrics: narrativeSide.metrics,
      artOnlyMetrics: artOnlySide.metrics,
      balance: narrativeSide.balance,
      transformations: narrativeSide.transformations,
      objectRegionDiff: narrativeSide.objectRegionDiff,
      artOnlyBalance: artOnlySide.balance,
      artOnlyTransformations: artOnlySide.transformations,
      artOnlyObjectRegionDiff: artOnlySide.objectRegionDiff,
      openFeedback: narrativeSide.openFeedback,
    });
  }
  return fixtures;
}

async function main(): Promise<void> {
  if (!await stat(path.join(ROOT, 'dist', 'cli.js')).then(() => true).catch(() => false)) throw new Error('Run pnpm build before pnpm gallery:compare.');
  const allBaseFiles = fileListAtBase();
  const index = await contentIndex();
  const temp = await import('node:fs/promises').then(({ mkdtemp }) => mkdtemp(path.join(os.tmpdir(), 'beauty-gallery-compare-')));
  try {
    await rm(COMPARE_ROOT, { recursive: true, force: true });
    await mkdir(COMPARE_ROOT, { recursive: true });
    const pairs = await createHistoricalPairs(temp, allBaseFiles, index);
    const semanticFixtures = await createSemanticFixtures(temp, index);
    const result = { schemaVersion: 1, baseCommit: BASE, maxGifBytes: MAX_GIF_BYTES, pairs, semanticFixtures };
    await writeFile(path.join(COMPARE_ROOT, 'index.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    const child = spawnSync(process.execPath, [path.join(ROOT, 'dist', 'cli.js'), 'gallery', DOCS_ROOT, '--compare', COMPARE_ROOT, '--out', path.join(DOCS_ROOT, 'COMPARE.html'), '--title', 'Issue 7 · Galería comparativa'], { cwd: ROOT, encoding: 'utf8', timeout: 120_000, maxBuffer: 2 * 1024 * 1024, windowsHide: true });
    if (child.error || child.status !== 0) throw new Error(`Could not build COMPARE.html: ${child.error?.message ?? child.stderr ?? child.stdout}`);
    const output = await walk(COMPARE_ROOT);
    const newPayloadBytes = (await Promise.all(output.filter((file) => /\.(?:gif|png)$/iu.test(file)).map(async (file) => (await stat(file)).size))).reduce((total, bytes) => total + bytes, 0);
    console.log(`Base ${BASE} · ${pairs.length} pares · ${semanticFixtures.length} fixtures semánticos · ${newPayloadBytes} bytes binarios nuevos · GIF máximo ${MAX_GIF_BYTES} bytes.`);
    console.log(child.stdout.trim());
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

await main();
