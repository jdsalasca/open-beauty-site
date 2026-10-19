import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { getStyle, isStyleSlug } from '../styles/presets.js';
import type { StyleSlug } from '../types.js';

const EVALUATION_LEVELS = [
  'technical-integrity',
  'style-conformance',
  'rendered-legibility',
  'narrative',
  'visual-review',
] as const;

type EvaluationLevel = (typeof EVALUATION_LEVELS)[number];

interface GalleryPack {
  style: string;
  title: string;
  status: string;
  evidenceClassification: 'illustrative' | 'measured' | 'expected';
  composition: string;
  width: number;
  height: number;
  assets: { gif: string; png: string; contactSheet: string; manifest: string };
  evaluation: Record<EvaluationLevel, string>;
  reviewState: 'none' | 'pending' | 'approved' | 'revise' | 'stale';
  openFeedbackCount: number;
  feedbackFrames: Array<{ id: string; phaseId: string; frameIndex: number; problem: string; severity: string; framePath?: string; cropPath?: string }>;
}

interface ManifestShape {
  style?: unknown;
  workflowStatus?: unknown;
  evidenceClassification?: unknown;
  illustrative?: unknown;
  outcome?: { mode?: unknown };
  brief?: {
    style?: unknown;
    title?: unknown;
    status?: unknown;
    workflowStatus?: unknown;
    illustrative?: unknown;
    outcome?: { mode?: unknown };
    phases?: Array<{ visual?: { kind?: unknown } }>;
  };
  dimensions?: { width?: unknown; height?: unknown };
  files?: Record<string, unknown>;
  evaluation?: Record<string, { status?: unknown }>;
  reviewState?: unknown;
  openFeedbackCount?: unknown;
  feedbackFrames?: unknown;
}

export interface NarrativeGalleryOptions {
  directory: string;
  output: string;
  title?: string;
}

export interface NarrativeCompareGalleryOptions {
  directory: string;
  output: string;
  title?: string;
}

export interface NarrativeGalleryResult {
  path: string;
  pieceCount: number;
  styles: string[];
}

interface CompareMetrics {
  gifBytes?: number;
  frames?: number;
  durationMs?: number;
  phaseHolds?: Array<{ phaseId: string; decodedMs?: number }>;
  renderMs?: number | null;
}

interface CompareSide {
  assets: { gif: string; png: string; contactSheet?: string; manifest?: string };
  metrics?: CompareMetrics;
  evaluation?: Record<string, string>;
  balance?: string;
  transformations?: string[];
  objectRegionDiff?: string;
  reviewState?: string;
  phaseEvaluation?: Array<{ phaseId: string; levels: Record<string, string> }>;
}

interface ComparePair {
  style: string;
  composition: string;
  seed: number;
  briefSha256: string;
  title: string;
  before: CompareSide;
  after: CompareSide;
  openFeedback?: Array<{ problem: string; phaseId: string; frameIndex: number; framePath?: string; cropPath?: string; side?: string }>;
  phases?: Array<{ id: string; label: string; beforeHoldMs: number | null; afterHoldMs: number | null; beforeEvaluation: Record<string, string>; afterEvaluation: Record<string, string> }>;
}

interface CompareSemanticFixture {
  style: string;
  composition: string;
  seed: number;
  title: string;
  narrative: { gif: string; png: string; contactSheet?: string };
  artOnly: { gif: string; png: string; contactSheet?: string };
  reviewState?: string;
  evaluation?: Record<string, string>;
  artOnlyEvaluation?: Record<string, string>;
  narrativeMetrics?: CompareMetrics;
  artOnlyMetrics?: CompareMetrics;
  balance?: string;
  transformations?: string[];
  objectRegionDiff?: string;
  artOnlyBalance?: string;
  artOnlyTransformations?: string[];
  artOnlyObjectRegionDiff?: string;
  phaseEvaluation?: Array<{ phaseId: string; levels: Record<string, string> }>;
  artOnlyPhaseEvaluation?: Array<{ phaseId: string; levels: Record<string, string> }>;
  openFeedback?: ComparePair['openFeedback'];
}

interface CompareIndex {
  schemaVersion: number;
  pairs: ComparePair[];
  semanticFixtures: CompareSemanticFixture[];
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function assetBasename(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const normalized = value.replaceAll('\\', '/');
  return path.posix.basename(normalized);
}

function relativeUrl(fromDirectory: string, file: string): string {
  const relative = path.relative(fromDirectory, file).split(path.sep).join('/');
  return relative.split('/').map((part) => encodeURIComponent(part)).join('/');
}

function levelStatus(manifest: ManifestShape, level: EvaluationLevel): string {
  const status = manifest.evaluation?.[level]?.status;
  return typeof status === 'string' && status.trim() ? status : 'not-evaluated';
}

async function manifestsUnder(directory: string, excludedDirectories: ReadonlySet<string>): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory() && !excludedDirectories.has(path.resolve(file))) files.push(...await manifestsUnder(file, excludedDirectories));
    else if (entry.isFile() && (entry.name === 'manifest.json' || entry.name.endsWith('.manifest.json'))) files.push(file);
  }
  return files.sort((a, b) => a.localeCompare(b, 'en'));
}

async function requiredAsset(directory: string, name: string, manifestPath: string): Promise<string> {
  const file = path.resolve(directory, name);
  try {
    if ((await stat(file)).isFile()) return file;
  } catch {
    // The error below points to the manifest that declared this missing asset.
  }
  throw new Error(`Narrative gallery: asset "${name}" is missing beside ${manifestPath}.`);
}

async function optionalPackAsset(directory: string, value: unknown): Promise<string | undefined> {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const file = path.resolve(directory, value);
  const relative = path.relative(directory, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return undefined;
  try { return (await stat(file)).isFile() ? file : undefined; }
  catch { return undefined; }
}

async function readPack(manifestPath: string): Promise<GalleryPack> {
  const raw = await readFile(manifestPath, 'utf8');
  let manifest: ManifestShape;
  try {
    manifest = JSON.parse(raw) as ManifestShape;
  } catch (error) {
    throw new Error(`Narrative gallery: invalid JSON in ${manifestPath}: ${(error as Error).message}`);
  }

  const styleValue = manifest.brief?.style ?? manifest.style;
  const title = manifest.brief?.title;
  if (typeof styleValue !== 'string' || typeof title !== 'string' || !title.trim()) {
    throw new Error(`Narrative gallery: ${manifestPath} must include brief.style and brief.title.`);
  }
  const style = styleValue;
  const phase = manifest.brief?.phases?.[0]?.visual?.kind;
  const composition = typeof phase === 'string' && phase.trim() ? phase : 'sin composición declarada';
  const base = path.basename(manifestPath).replace(/\.manifest\.json$|^manifest\.json$/i, '');
  const files = manifest.files ?? {};
  const directory = path.dirname(manifestPath);
  const names = {
    gif: assetBasename(files.gif, `${base}.gif`),
    png: assetBasename(files.png, `${base}.png`),
    contactSheet: assetBasename(files.contactSheet, `${base}-contact-sheet.png`),
  };
  const [gif, png, contactSheet] = await Promise.all([
    requiredAsset(directory, names.gif, manifestPath),
    requiredAsset(directory, names.png, manifestPath),
    requiredAsset(directory, names.contactSheet, manifestPath),
  ]);

  const width = typeof manifest.dimensions?.width === 'number' ? manifest.dimensions.width : 1280;
  const height = typeof manifest.dimensions?.height === 'number' ? manifest.dimensions.height : 720;
  const evaluationReview = manifest.evaluation?.['visual-review']?.status;
  const reviewState = ['none', 'pending', 'approved', 'revise', 'stale'].includes(String(manifest.reviewState))
    ? manifest.reviewState as GalleryPack['reviewState']
    : evaluationReview === 'approved' || evaluationReview === 'revise' || evaluationReview === 'stale'
      ? evaluationReview
      : evaluationReview === 'pending' ? 'pending' : 'none';
  const feedbackInput = Array.isArray(manifest.feedbackFrames) ? manifest.feedbackFrames : [];
  const feedbackFrames: GalleryPack['feedbackFrames'] = [];
  for (const entry of feedbackInput) {
    if (!entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    const [framePath, cropPath] = await Promise.all([
      optionalPackAsset(directory, item.framePath), optionalPackAsset(directory, item.cropPath),
    ]);
    feedbackFrames.push({
      id: String(item.id ?? ''), phaseId: String(item.phaseId ?? ''), frameIndex: Number(item.frameIndex ?? 0),
      problem: String(item.problem ?? ''), severity: String(item.severity ?? 'note'),
      ...(framePath ? { framePath } : {}), ...(cropPath ? { cropPath } : {}),
    });
  }
  return {
    style,
    title: title.trim(),
    status: typeof manifest.workflowStatus === 'string'
      ? manifest.workflowStatus
      : typeof manifest.brief?.status === 'string' ? manifest.brief.status : 'not-declared',
    evidenceClassification: manifest.evidenceClassification === 'illustrative' || manifest.evidenceClassification === 'measured' || manifest.evidenceClassification === 'expected'
      ? manifest.evidenceClassification
      : manifest.illustrative === true || manifest.brief?.illustrative === true
        ? 'illustrative'
        : manifest.outcome?.mode === 'observed' || manifest.brief?.outcome?.mode === 'observed' ? 'measured' : 'expected',
    composition,
    width,
    height,
    assets: { gif, png, contactSheet, manifest: manifestPath },
    evaluation: Object.fromEntries(EVALUATION_LEVELS.map((level) => [level, levelStatus(manifest, level)])) as Record<EvaluationLevel, string>,
    reviewState,
    openFeedbackCount: typeof manifest.openFeedbackCount === 'number' && Number.isFinite(manifest.openFeedbackCount) ? manifest.openFeedbackCount : feedbackFrames.length,
    feedbackFrames,
  };
}

function card(pack: GalleryPack, outputDirectory: string): string {
  const styleName = isStyleSlug(pack.style) ? getStyle(pack.style).name : pack.style;
  const poster = relativeUrl(outputDirectory, pack.assets.png);
  const gif = relativeUrl(outputDirectory, pack.assets.gif);
  const contact = relativeUrl(outputDirectory, pack.assets.contactSheet);
  const manifest = relativeUrl(outputDirectory, pack.assets.manifest);
  const id = `piece-${pack.style}-${path.basename(pack.assets.manifest).replace(/[^a-z0-9-]/gi, '-')}`;
  const status = escapeHtml(pack.status);
  const evidenceLabel = pack.evidenceClassification === 'illustrative' ? 'Ilustrativo' : pack.evidenceClassification === 'measured' ? 'Observado con evidencia' : 'Resultado esperado';
  const reviewLabels = { none: 'Sin revisión', pending: 'Pendiente', approved: 'Aprobada', revise: 'Requiere ajustes', stale: 'Desactualizada' };
  const openFeedback = pack.openFeedbackCount > 0
    ? `<section class="evaluation" aria-label="Comentarios abiertos de ${escapeHtml(pack.title)}"><h3>${pack.openFeedbackCount} comentario${pack.openFeedbackCount === 1 ? '' : 's'} abierto${pack.openFeedbackCount === 1 ? '' : 's'}</h3><ul>${pack.feedbackFrames.map((item) => `<li><strong>${escapeHtml(item.severity)} · ${escapeHtml(item.phaseId)} · frame ${item.frameIndex}:</strong> ${escapeHtml(item.problem)}${item.framePath ? ` <a href="${relativeUrl(outputDirectory, item.framePath)}">Ver frame</a>` : ''}${item.cropPath ? ` · <a href="${relativeUrl(outputDirectory, item.cropPath)}">Ver recorte</a>` : ''}</li>`).join('\n')}</ul></section>`
    : '';
  const levels = EVALUATION_LEVELS.map((level) => {
    const value = pack.evaluation[level];
    const emphasized = level === 'visual-review' && value === 'pending' ? ' level--pending' : '';
    return `<li class="evaluation-level${emphasized}"${level === 'visual-review' && value === 'pending' ? ' aria-label="visual-review: pending"' : ''}><span>${level}:</span><strong>${escapeHtml(value)}</strong></li>`;
  }).join('\n');
  return `<article class="piece" data-style="${escapeHtml(pack.style)}" aria-labelledby="${escapeHtml(id)}-title">
  <header class="piece-header">
    <h2 id="${escapeHtml(id)}-title">${escapeHtml(pack.title)}</h2>
    <span class="status-tag">Estado: ${status}</span>
    <span class="status-tag" aria-label="Estado de revisión visual">Revisión visual: ${reviewLabels[pack.reviewState]}</span>
    <span class="evidence-tag evidence-tag--${pack.evidenceClassification}">${escapeHtml(evidenceLabel)}</span>
  </header>
  <dl class="piece-meta">
    <div><dt>Estilo</dt><dd>${escapeHtml(styleName)}</dd></div>
    <div><dt>Composición</dt><dd>${escapeHtml(pack.composition)}</dd></div>
    <div><dt>Estado</dt><dd>${status}</dd></div>
    <div><dt>Resultado</dt><dd>${escapeHtml(evidenceLabel)}</dd></div>
  </dl>
  <figure class="artwork">
    <img class="poster" src="${poster}" data-poster="${poster}" data-gif="${gif}" width="${pack.width}" height="${pack.height}" alt="${escapeHtml(pack.title)} · ${escapeHtml(styleName)} · vista estática" loading="lazy">
    <figcaption>Vista estática · ${pack.width} × ${pack.height}. La animación solo carga cuando eliges Reproducir.</figcaption>
  </figure>
  <div class="playback-controls" role="group" aria-label="Controles de ${escapeHtml(pack.title)}">
    <button type="button" data-action="play" aria-label="Reproducir GIF manualmente. No comienza automáticamente; respeta movimiento reducido.">Reproducir</button>
    <button type="button" data-action="stop" aria-label="Detener y volver a la imagen estática">Detener</button>
    <a class="button-link" href="${gif}" download="${escapeHtml(path.basename(pack.assets.gif))}">Descargar GIF</a>
    <a class="button-link" href="${poster}" download="${escapeHtml(path.basename(pack.assets.png))}">Descargar PNG</a>
    <button type="button" data-action="enlarge" aria-label="Ampliar ${escapeHtml(pack.title)} a ${pack.width} por ${pack.height}">Ampliar</button>
  </div>
  <span class="piece-status visually-hidden" role="status" aria-live="polite"></span>
  <section class="evaluation" aria-label="Evaluación de ${escapeHtml(pack.title)}">
    <h3>Evaluación</h3>
    <ul>${levels}</ul>
  </section>
  ${openFeedback}
  <nav class="evidence-links" aria-label="Evidencia de ${escapeHtml(pack.title)}">
    <a href="${contact}">Hoja de contacto</a>
    <a href="${manifest}">Manifiesto</a>
  </nav>
</article>`;
}

function filters(styles: string[]): string {
  const chips = styles.map((style) => {
    const label = isStyleSlug(style) ? getStyle(style as StyleSlug).name : style;
    return `<button type="button" class="filter-chip" data-filter="${escapeHtml(style)}" aria-pressed="false">${escapeHtml(label)}</button>`;
  }).join('\n');
  return `<div class="filter-chips" role="group" aria-label="Filtrar piezas por estilo">
    <button type="button" class="filter-chip" data-filter="all" aria-pressed="true">Todos los estilos</button>
    ${chips}
  </div>`;
}

function galleryHtml(title: string, packs: GalleryPack[], outputDirectory: string): string {
  const styles = [...new Set(packs.map((pack) => pack.style))].sort((a, b) => a.localeCompare(b, 'en'));
  const cards = packs.map((pack) => card(pack, outputDirectory)).join('\n');
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; --paper: #FBF1E2; --surface: #FFF8EA; --ink: #4A3A32; --muted: #7A5F50; --line: #7A5F50; --accent: #CE7256; --accent-ink: #FFF8EA; --highlight: #F2C879; --pending-ink: #4A3A32; --focus: #4A3A32; font-family: 'Nunito Sans', 'Trebuchet MS', sans-serif; background: var(--paper); color: var(--ink); }
    * { box-sizing: border-box; }
    html, body { max-width: 100%; overflow-x: hidden; }
    body { margin: 0; min-width: 0; background: var(--paper); color: var(--ink); line-height: 1.55; }
    img, svg, video, canvas { display: block; max-width: 100%; }
    a { color: var(--ink); text-decoration-thickness: 0.1em; text-underline-offset: 0.18em; }
    button, .button-link, input { font: inherit; }
    :focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
    .skip-link { position: absolute; top: 0.5rem; left: 0.5rem; z-index: 5; transform: translateY(-160%); padding: 0.75rem 1rem; background: var(--surface); color: var(--ink); }
    .skip-link:focus { transform: translateY(0); }
    .site-header, main, .site-footer { width: min(100% - 2rem, 1440px); margin-inline: auto; }
    .site-header { padding-block: clamp(2rem, 6vw, 5rem) 1.5rem; border-bottom: 2px solid var(--ink); }
    .eyebrow { margin: 0 0 0.4rem; padding-left: 0.55rem; border-left: 2px solid var(--accent); color: var(--ink); font-size: 0.85rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
    h1, h2, h3, p { overflow-wrap: anywhere; }
    h1 { max-width: 18ch; margin: 0; font-family: 'Fraunces', Georgia, serif; font-size: 120px; line-height: 1.05; }
    .intro { max-width: 72ch; margin-block: 1rem 0; color: var(--muted); }
    main { padding-block: 1.5rem 4rem; }
    .toolbar { display: grid; gap: 1rem; margin-bottom: 1.5rem; }
    .toolbar h2 { margin: 0; font-size: 1.25rem; }
    .filter-chips { display: flex; flex-wrap: wrap; gap: 0.55rem; }
    .filter-chip, button, .button-link { min-height: 44px; border: 2px solid var(--ink); border-radius: 10px; padding: 0.55rem 0.85rem; background: var(--surface); color: var(--ink); font-weight: 700; cursor: pointer; text-align: center; }
    .filter-chip[aria-pressed="true"], button[data-action="play"], .button-link { background: var(--ink); color: var(--surface); }
    button:disabled { cursor: not-allowed; opacity: 0.65; }
    .preview-toggle { display: flex; align-items: flex-start; gap: 0.7rem; width: fit-content; padding: 0.6rem 0; font-weight: 700; }
    .preview-toggle input { width: 1.25rem; height: 1.25rem; margin: 0.15rem 0 0; accent-color: var(--accent); }
    .preview-note { margin: 0; color: var(--muted); }
    .gallery-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr); gap: 1rem; align-items: start; }
    .gallery-grid.size-preview { grid-template-columns: minmax(0, 720px); justify-content: center; }
    .piece { min-width: 0; padding: clamp(0.9rem, 2vw, 1.3rem); border: 2px solid var(--ink); border-radius: 10px; background-color: var(--surface); background-image: repeating-linear-gradient(135deg, var(--surface) 0 10px, var(--paper) 10px 11px); box-shadow: inset 0 1px 0 var(--surface), 0.3rem 0.35rem 0 var(--accent); }
    .piece:nth-child(4n + 2) { margin-top: 0.65rem; }
    .piece-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 0.5rem; }
    .piece h2 { margin: 0; font-size: clamp(1.2rem, 2.6vw, 1.65rem); line-height: 1.2; }
    .status-tag, .evidence-tag { padding: 0.18rem 0.55rem; border: 1px solid var(--ink); border-radius: 48px; font-size: 12px; font-weight: 700; }
    .evidence-tag--illustrative { border-style: dashed; }
    .evidence-tag--measured { background: var(--highlight); }
    .piece-meta { display: flex; flex-wrap: wrap; gap: 0.35rem 1rem; margin: 0.8rem 0; }
    .piece-meta div { display: flex; flex-wrap: wrap; gap: 0.25rem; min-width: 0; }
    .piece-meta dt { color: var(--muted); font-weight: 700; }
    .piece-meta dd { margin: 0; }
    .artwork { margin: 0; }
    .poster { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; border: 1px solid var(--line); background: var(--paper); object-fit: contain; }
    .artwork figcaption { margin-top: 0.35rem; color: var(--muted); font-size: 0.88rem; }
    .size-preview .poster { width: min(100%, 640px); height: auto; aspect-ratio: 16 / 9; }
    .playback-controls { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.8rem; }
    .button-link { display: inline-flex; justify-content: center; align-items: center; text-decoration: none; }
    .piece-status { margin: 0.75rem 0 0; padding: 0.65rem; border-left: 2px solid var(--accent); background: var(--highlight); color: var(--pending-ink); font-weight: 800; overflow-wrap: anywhere; }
    .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    .evaluation { margin-top: 0.85rem; }
    .evaluation h3 { margin: 0 0 0.45rem; font-size: 1rem; }
    .evaluation ul { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0.35rem; margin: 0; padding: 0; list-style: none; }
    .evaluation-level { display: flex; justify-content: space-between; gap: 0.5rem; min-width: 0; padding: 0.35rem 0.5rem; border: 1px solid var(--line); border-radius: 0.25rem; font-size: 0.84rem; overflow-wrap: anywhere; }
    .evaluation-level strong { flex: none; }
    .evaluation-level.level--pending { border: 2px solid var(--pending-ink); background: var(--highlight); color: var(--pending-ink); font-size: 1rem; }
    .evidence-links { display: flex; flex-wrap: wrap; gap: 0.7rem 1.2rem; margin-top: 0.8rem; }
    .site-footer { padding-block: 1rem 2rem; border-top: 1px solid var(--line); color: var(--muted); }
    dialog { width: min(1280px, calc(100vw - 2rem)); max-width: 1280px; max-height: calc(100dvh - 2rem); padding: 0.8rem; border: 2px solid var(--ink); border-radius: 10px; background: var(--surface); color: var(--ink); }
    dialog::backdrop { background: rgb(18 16 13 / 82%); }
    .dialog-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
    .dialog-header h2 { margin: 0; font-size: 1.1rem; }
    .dialog-art { display: block; width: min(1280px, 100%); height: auto; max-height: calc(100dvh - 7rem); margin-inline: auto; object-fit: contain; }
    @media (max-width: 1600px) { h1 { font-size: 72px; } }
    @media (max-width: 760px) { .gallery-grid { grid-template-columns: minmax(0, 1fr); } }
    @media (max-width: 520px) { .site-header, main, .site-footer { width: min(100% - 1.25rem, 1440px); } h1 { font-size: 36px; } .piece { box-shadow: inset 0 1px 0 var(--surface), 0.18rem 0.2rem 0 var(--accent); } .playback-controls > * { flex: 1 1 42%; } .piece-meta { display: grid; gap: 0.15rem; } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; } }
  </style>
</head>
<body>
  <a class="skip-link" href="#main-content">Saltar al contenido</a>
  <header class="site-header">
    <p class="eyebrow">Open Beauty · revisión editorial</p>
    <h1>${escapeHtml(title)}</h1>
    <p class="intro">Cada pieza abre como imagen fija. Reproduce el GIF solo cuando quieras revisar el ritmo. La galería distingue ejemplos ilustrativos, resultados esperados y resultados observados con evidencia; la revisión visual pendiente no aprueba la publicación.</p>
  </header>
  <main id="main-content">
    <section class="toolbar" aria-labelledby="filter-heading">
      <h2 id="filter-heading">Filtrar por estilo</h2>
      ${filters(styles)}
      <label class="preview-toggle"><input id="card-preview-toggle" type="checkbox"><span>Vista de tarjeta 640 × 360 · ampliar cada pieza para comprobar su lectura a ese tamaño</span></label>
      <p id="preview-note" class="preview-note" role="status" aria-live="polite">Vista de galería · todos los tamaños de tarjeta.</p>
    </section>
    <section id="gallery-grid" class="gallery-grid" aria-label="Piezas narrativas">
      ${cards}
    </section>
  </main>
  <footer class="site-footer">${packs.length} piezas · ${styles.length} estilos · cinco niveles de evaluación independientes.</footer>
  <dialog id="lightbox" aria-labelledby="lightbox-title">
    <div class="dialog-header"><h2 id="lightbox-title">Vista ampliada</h2><button type="button" data-action="close-dialog" aria-label="Cerrar vista ampliada">Cerrar</button></div>
    <img class="dialog-art" alt="" width="1280" height="720">
  </dialog>
  <script>
    (() => {
      const grid = document.getElementById('gallery-grid');
      const dialog = document.getElementById('lightbox');
      const dialogImage = dialog.querySelector('.dialog-art');
      const dialogTitle = document.getElementById('lightbox-title');
      const previewToggle = document.getElementById('card-preview-toggle');
      const previewNote = document.getElementById('preview-note');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

      document.addEventListener('click', (event) => {
        const target = event.target instanceof Element ? event.target.closest('[data-action], [data-filter]') : null;
        if (!target) return;
        if (target.hasAttribute('data-filter')) {
          const filter = target.getAttribute('data-filter');
          document.querySelectorAll('.filter-chip').forEach((chip) => chip.setAttribute('aria-pressed', String(chip === target)));
          grid.querySelectorAll('.piece').forEach((piece) => { piece.hidden = filter !== 'all' && piece.getAttribute('data-style') !== filter; });
          return;
        }

        const action = target.getAttribute('data-action');
        const piece = target.closest('.piece');
        if (action === 'close-dialog') { dialog.close(); return; }
        if (!piece) return;
        const image = piece.querySelector('.poster');
        const status = piece.querySelector('.piece-status');
        if (action === 'play') {
          image.src = image.dataset.gif;
          image.alt = image.alt.replace('vista estática', 'GIF animado');
          status.textContent = reducedMotion.matches
            ? 'GIF reproducido por acción explícita · movimiento reducido respetado.'
            : 'GIF en reproducción manual · nunca se inicia automáticamente.';
        } else if (action === 'stop') {
          image.src = image.dataset.poster;
          image.alt = image.alt.replace('GIF animado', 'vista estática');
          status.textContent = 'Vista estática · visual-review: ' + piece.querySelector('.level--pending strong')?.textContent + ' · la publicación no está aprobada automáticamente.';
        } else if (action === 'enlarge') {
          dialogTitle.textContent = piece.querySelector('h2').textContent + ' · ' + piece.querySelector('.piece-meta dd').textContent;
          dialogImage.src = image.currentSrc || image.src;
          dialogImage.alt = image.alt;
          dialogImage.width = Number(image.naturalWidth) || Number(image.getAttribute('width')) || 1280;
          dialogImage.height = Number(image.naturalHeight) || Number(image.getAttribute('height')) || 720;
          dialog.showModal();
        }
      });

      dialog.addEventListener('close', () => dialogImage.removeAttribute('src'));
      previewToggle.addEventListener('change', () => {
        grid.classList.toggle('size-preview', previewToggle.checked);
        previewNote.textContent = previewToggle.checked
          ? 'Vista de tarjeta activa · imágenes a 640 × 360; el diseño se adapta a pantallas estrechas.'
          : 'Vista de galería · todos los tamaños de tarjeta.';
      });
      document.querySelectorAll('[data-action="play"]').forEach((button) => {
        if (reducedMotion.matches) button.setAttribute('aria-label', 'Reproducir GIF manualmente con movimiento reducido. Solo inicia cuando pulsas este botón.');
      });
    })();
  </script>
</body>
</html>
`;
}

export async function createNarrativeGallery(options: NarrativeGalleryOptions): Promise<NarrativeGalleryResult> {
  const sourceDirectory = path.resolve(options.directory);
  const output = path.resolve(options.output);
  const outputDirectory = path.dirname(output);
  const sourceInfo = await stat(sourceDirectory);
  if (!sourceInfo.isDirectory()) throw new Error(`Narrative gallery: input is not a directory: ${sourceDirectory}`);

  const excludedDirectories = new Set([path.join(sourceDirectory, 'art-only'), path.join(sourceDirectory, 'compare')].map((directory) => path.resolve(directory)));
  const manifestPaths = await manifestsUnder(sourceDirectory, excludedDirectories);
  if (manifestPaths.length === 0) throw new Error(`Narrative gallery: no manifest files found under ${sourceDirectory}.`);
  const packs = await Promise.all(manifestPaths.map(readPack));
  packs.sort((a, b) => a.style.localeCompare(b.style, 'en') || a.title.localeCompare(b.title, 'es'));
  const title = options.title?.trim() || 'Galería de revisión narrativa';
  const { writeFile, mkdir } = await import('node:fs/promises');
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(output, galleryHtml(title, packs, outputDirectory), 'utf8');
  return { path: output, pieceCount: packs.length, styles: [...new Set(packs.map((pack) => pack.style))] };
}

function compareAssetUrl(compareDirectory: string, outputDirectory: string, asset: string): string {
  return relativeUrl(outputDirectory, path.resolve(compareDirectory, asset));
}

function metric(value: unknown, suffix = ''): string {
  return typeof value === 'number' && Number.isFinite(value) ? `${new Intl.NumberFormat('es-CO').format(value)}${suffix}` : 'No disponible';
}

function compareEvaluation(evaluation: Record<string, string> | undefined, side: string): string {
  const levels = EVALUATION_LEVELS.map((level) => {
    let status = evaluation?.[level];
    if (!status || status === 'none' || status === 'not-evaluated') status = level === 'visual-review' ? 'pending' : 'not-evaluated';
    return `<li><span>${escapeHtml(level)}</span><strong class="state state--${escapeHtml(status)}">${escapeHtml(status)}</strong></li>`;
  }).join('');
  return `<section class="eval" aria-label="Evaluación ${escapeHtml(side)}"><h4>Evaluación por nivel</h4><ul>${levels}</ul></section>`;
}

function controlState(values: Array<string | undefined>): string {
  const states = values.flatMap((value) => {
    const state = value?.trim().match(/^(pass|fail|pending)\b/i)?.[1]?.toLowerCase();
    return state ? [state] : [];
  });
  if (states.includes('fail')) return 'fail';
  if (states.includes('pending') || states.length === 0) return 'pending';
  return 'pass';
}

function compareControls(side: CompareSide): string {
  return `<dl class="controls"><div><dt>Balance visual (proxy)</dt><dd>${controlState([side.balance])}</dd></div><div><dt>Cambio del objeto</dt><dd>${controlState(side.transformations ?? [])}</dd></div><div><dt>Diferencia de región</dt><dd>${controlState([side.objectRegionDiff])}</dd></div><div><dt>Render mediano (3)</dt><dd>${escapeHtml(metric(side.metrics?.renderMs, ' ms'))}</dd></div></dl>`;
}

function compareHolds(pair: ComparePair): string {
  const before = new Map((pair.before.metrics?.phaseHolds ?? []).map((hold) => [hold.phaseId, hold.decodedMs]));
  const after = new Map((pair.after.metrics?.phaseHolds ?? []).map((hold) => [hold.phaseId, hold.decodedMs]));
  const phases = [...new Set([...before.keys(), ...after.keys()])];
  if (phases.length === 0) return '<p>Los holds decodificados están pendientes.</p>';
  return `<table><caption>Holds por fase (ms decodificados)</caption><thead><tr><th scope="col">Fase</th><th scope="col">Antes</th><th scope="col">Después</th><th scope="col">Δ</th></tr></thead><tbody>${phases.map((phase) => {
    const left = before.get(phase);
    const right = after.get(phase);
    const delta = typeof left === 'number' && typeof right === 'number' ? metric(right - left, ' ms') : 'No disponible';
    return `<tr><th scope="row">${escapeHtml(phase)}</th><td>${escapeHtml(metric(left, ' ms'))}</td><td>${escapeHtml(metric(right, ' ms'))}</td><td>${escapeHtml(delta)}</td></tr>`;
  }).join('')}</tbody></table>`;
}

function compareFeedback(pair: ComparePair, compareDirectory: string, outputDirectory: string): string {
  const feedback = pair.openFeedback ?? [];
  if (feedback.length === 0) return '<div class="pending" role="note">Sin comentarios abiertos · revisión pending.</div>';
  return `<ul class="feedback">${feedback.map((item) => `<li><strong>${item.side === 'before' ? 'Antes · ' : item.side === 'after' ? 'Después · ' : ''}${escapeHtml(item.phaseId)} · frame ${escapeHtml(item.frameIndex)}:</strong> ${escapeHtml(item.problem)}${item.framePath ? ` <a href="${compareAssetUrl(compareDirectory, outputDirectory, item.framePath)}">Abrir frame concreto</a>` : ''}${item.cropPath ? ` · <a href="${compareAssetUrl(compareDirectory, outputDirectory, item.cropPath)}">Abrir recorte</a>` : ''}</li>`).join('')}</ul>`;
}

function phaseEvaluationCards(pair: ComparePair): string {
  const phases = pair.phases ?? [];
  if (phases.length === 0) return '<section class="phase-evaluation"><h3>Evaluación por fase</h3><p class="pending">Pendiente: no hay resultados por fase en este registro.</p></section>';
  const renderSide = (label: string, hold: number | null, levels: Record<string, string>) => `<section><h5>${label} · hold ${escapeHtml(metric(hold, ' ms'))}</h5><ul>${['technical-integrity', 'narrative', 'visual-review'].map((level) => `<li><span>${escapeHtml(level)}</span><strong class="state state--${escapeHtml(levels[level] ?? 'pending')}">${escapeHtml(levels[level] ?? 'pending')}</strong></li>`).join('')}</ul></section>`;
  return `<section class="phase-evaluation" aria-label="Evaluación por fase"><h3>Evaluación por fase</h3>${phases.map((phase) => `<article class="phase-result"><h4>${escapeHtml(phase.label || phase.id)}</h4><div class="phase-sides">${renderSide('Antes', phase.beforeHoldMs, phase.beforeEvaluation)}${renderSide('Después', phase.afterHoldMs, phase.afterEvaluation)}</div></article>`).join('')}</section>`;
}

function compareAssetCard(pair: ComparePair, side: CompareSide, label: string, sideKey: 'before' | 'after', compareDirectory: string, outputDirectory: string): string {
  const poster = compareAssetUrl(compareDirectory, outputDirectory, side.assets.png);
  const gif = compareAssetUrl(compareDirectory, outputDirectory, side.assets.gif);
  const contact = side.assets.contactSheet ? `<a href="${compareAssetUrl(compareDirectory, outputDirectory, side.assets.contactSheet)}">Hoja de contacto</a>` : '';
  const manifest = side.assets.manifest ? `<a href="${compareAssetUrl(compareDirectory, outputDirectory, side.assets.manifest)}">Manifiesto</a>` : '';
  const id = `${sideKey}-${pair.style}-${pair.composition}-${pair.seed}`.replace(/[^a-z0-9-]/gi, '-');
  return `<article class="asset-card" aria-labelledby="${escapeHtml(id)}-heading">
    <h3 id="${escapeHtml(id)}-heading">${label}</h3>
    <figure><img class="poster" src="${poster}" data-poster="${poster}" data-gif="${gif}" width="1280" height="720" alt="${escapeHtml(pair.title)} · ${label} · imagen estática" loading="lazy"><figcaption>${escapeHtml(pair.title)} · GIF estático hasta pedir reproducción.</figcaption></figure>
    <div class="playback" role="group" aria-label="Reproducción ${label}"><button type="button" data-action="play" aria-label="Reproducir GIF ${label}">Reproducir</button><button type="button" data-action="stop" aria-label="Detener GIF ${label}">Detener</button><button type="button" data-action="enlarge" aria-label="Ampliar ${label}">Ampliar</button><a href="${gif}" download>Descargar GIF</a>${contact}${manifest}</div>
    <output class="status" role="status" aria-live="polite">Preparado · vista estática.</output>
    <dl class="metrics"><div><dt>Tamaño GIF</dt><dd>${escapeHtml(metric(side.metrics?.gifBytes, ' bytes'))}</dd></div><div><dt>Frames decodificados</dt><dd>${escapeHtml(metric(side.metrics?.frames))}</dd></div><div><dt>Duración decodificada</dt><dd>${escapeHtml(metric(side.metrics?.durationMs, ' ms'))}</dd></div><div><dt>Render</dt><dd>${escapeHtml(metric(side.metrics?.renderMs, ' ms'))}</dd></div><div><dt>Revisión visual</dt><dd>${escapeHtml(side.reviewState && side.reviewState !== 'none' ? side.reviewState : 'pending')}</dd></div></dl>
    ${compareControls(side)}${compareEvaluation(side.evaluation, label)}
  </article>`;
}

function comparePairHtml(pair: ComparePair, compareDirectory: string, outputDirectory: string): string {
  const beforeBytes = pair.before.metrics?.gifBytes;
  const afterBytes = pair.after.metrics?.gifBytes;
  const sizeDelta = typeof beforeBytes === 'number' && typeof afterBytes === 'number' ? metric(afterBytes - beforeBytes, ' bytes') : 'No disponible';
  const beforeDuration = pair.before.metrics?.durationMs;
  const afterDuration = pair.after.metrics?.durationMs;
  const durationDelta = typeof beforeDuration === 'number' && typeof afterDuration === 'number' ? metric(afterDuration - beforeDuration, ' ms') : 'No disponible';
  const openFeedback = compareFeedback(pair, compareDirectory, outputDirectory);
  return `<section class="pair" data-style="${escapeHtml(pair.style)}" aria-labelledby="pair-${escapeHtml(pair.style)}-${escapeHtml(pair.composition)}-${pair.seed}">
    <header class="pair-header"><p class="eyebrow">${escapeHtml(pair.style)} · ${escapeHtml(pair.composition)} · seed ${escapeHtml(pair.seed)}</p><h2 id="pair-${escapeHtml(pair.style)}-${escapeHtml(pair.composition)}-${pair.seed}">${escapeHtml(pair.title)}</h2><p>Brief SHA-256: <code>${escapeHtml(pair.briefSha256)}</code></p></header>
    <div class="sides">${compareAssetCard(pair, pair.before, 'Antes', 'before', compareDirectory, outputDirectory)}${compareAssetCard(pair, pair.after, 'Después', 'after', compareDirectory, outputDirectory)}</div>
    <section class="deltas" aria-label="Deltas medidos"><h3>Deltas decodificados</h3><dl><div><dt>Tamaño GIF · después menos antes</dt><dd>${escapeHtml(sizeDelta)}</dd></div><div><dt>Duración · después menos antes</dt><dd>${escapeHtml(durationDelta)}</dd></div></dl>${compareHolds(pair)}</section>
    ${phaseEvaluationCards(pair)}<section class="review"><h3>Revisión visual y problemas abiertos</h3>${openFeedback}</section>
  </section>`;
}

function semanticFixtureHtml(fixture: CompareSemanticFixture, compareDirectory: string, outputDirectory: string): string {
  const pair: ComparePair = {
    style: fixture.style, composition: fixture.composition, seed: fixture.seed, briefSha256: 'after-only', title: fixture.title,
    before: { assets: fixture.artOnly, evaluation: fixture.artOnlyEvaluation ?? fixture.evaluation, metrics: fixture.artOnlyMetrics, balance: fixture.artOnlyBalance ?? 'pending', transformations: fixture.artOnlyTransformations, objectRegionDiff: fixture.artOnlyObjectRegionDiff ?? 'pending', reviewState: 'pending', phaseEvaluation: fixture.artOnlyPhaseEvaluation },
    after: { assets: fixture.narrative, evaluation: fixture.evaluation, metrics: fixture.narrativeMetrics, balance: fixture.balance, transformations: fixture.transformations, objectRegionDiff: fixture.objectRegionDiff, reviewState: fixture.reviewState, phaseEvaluation: fixture.phaseEvaluation },
    openFeedback: fixture.openFeedback,
    phases: (fixture.phaseEvaluation ?? []).map((phase, index) => {
      const art = fixture.artOnlyPhaseEvaluation?.find((item) => item.phaseId === phase.phaseId);
      return { id: phase.phaseId, label: phase.phaseId, beforeHoldMs: fixture.artOnlyMetrics?.phaseHolds?.[index]?.decodedMs ?? null, afterHoldMs: fixture.narrativeMetrics?.phaseHolds?.[index]?.decodedMs ?? null, beforeEvaluation: art?.levels ?? {}, afterEvaluation: phase.levels };
    }),
  };
  return `<section class="semantic-pair" data-style="${escapeHtml(fixture.style)}"><p class="eyebrow">${escapeHtml(fixture.style)} · ${escapeHtml(fixture.composition)} · seed ${escapeHtml(fixture.seed)} · solo después</p><h3>${escapeHtml(fixture.title)}</h3><div class="sides">${compareAssetCard(pair, pair.after, 'Después · narrativo', 'after', compareDirectory, outputDirectory)}${compareAssetCard(pair, pair.before, 'Después · solo arte', 'before', compareDirectory, outputDirectory)}</div>${phaseEvaluationCards(pair)}<section class="review"><h4>Revisión visual y feedback registrado</h4>${compareFeedback(pair, compareDirectory, outputDirectory)}</section></section>`;
}

function comparisonHtml(index: CompareIndex, title: string, compareDirectory: string, outputDirectory: string): string {
  const styles = [...new Set([...index.pairs.map((pair) => pair.style), ...index.semanticFixtures.map((fixture) => fixture.style)])].sort();
  const pairCards = index.pairs.map((pair) => comparePairHtml(pair, compareDirectory, outputDirectory)).join('\n');
  const semanticCards = index.semanticFixtures.map((fixture) => semanticFixtureHtml(fixture, compareDirectory, outputDirectory)).join('\n');
  const filtersHtml = `<div class="filters" role="group" aria-label="Filtrar por estilo"><button class="filter" type="button" data-filter="all" aria-pressed="true">Todos</button>${styles.map((style) => `<button class="filter" type="button" data-filter="${escapeHtml(style)}" aria-pressed="false">${escapeHtml(isStyleSlug(style) ? getStyle(style as StyleSlug).name : style)}</button>`).join('')}</div>`;
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title>
<style>.card-mode .sides{grid-template-columns:repeat(2,minmax(0,1fr))}@media(max-width:760px){.card-mode .sides{grid-template-columns:minmax(0,1fr)}}.card-mode .asset-card{width:min(100%,668px);margin-inline:auto}.card-mode .poster{width:min(100%,640px);height:auto;aspect-ratio:16/9}</style>
<style>
:root{color-scheme:light;--paper:#FBF1E2;--surface:#FFF8EA;--ink:#4A3A32;--muted:#7A5F50;--line:#7A5F50;--accent:#CE7256;--highlight:#F2C879;--focus:#4A3A32;font-family:'Nunito Sans','Trebuchet MS',sans-serif;background:var(--paper);color:var(--ink)}*{box-sizing:border-box}html,body{max-width:100%;overflow-x:hidden}body{margin:0;line-height:1.5;background:var(--paper)}img{display:block;max-width:100%}a{color:var(--ink);text-underline-offset:.18em}button,input{font:inherit}button,a{min-height:44px}button{padding:.55rem .8rem;border:2px solid var(--ink);border-radius:10px;background:var(--surface);color:var(--ink);font-weight:800;cursor:pointer}button[data-action=play],.filter[aria-pressed=true]{background:var(--ink);color:var(--surface)}:focus-visible{outline:3px solid var(--accent);outline-offset:3px}.skip-link{position:absolute;top:.5rem;left:.5rem;z-index:4;transform:translateY(-160%);padding:.7rem;background:var(--surface)}.skip-link:focus{transform:translateY(0)}header.site,main,footer{width:min(100% - 2rem,1440px);margin-inline:auto}.site{padding-block:clamp(2rem,6vw,5rem) 1.5rem;border-bottom:2px solid var(--ink)}.eyebrow{margin:0;font-size:12px;color:var(--accent);font-weight:900;letter-spacing:.1em;text-transform:uppercase}.site h1{max-width:14ch;margin:.25rem 0;font-family:Fraunces,Georgia,serif;font-size:clamp(40px,8vw,120px);line-height:1.02}.intro{max-width:75ch;color:var(--muted)}main{padding-block:1.5rem 4rem}.toolbar{display:grid;gap:.8rem;margin-bottom:1.5rem}.filters{display:flex;flex-wrap:wrap;gap:.5rem}.toggle{display:flex;align-items:center;gap:.6rem;width:fit-content;font-weight:800}.toggle input{width:1.25rem;height:1.25rem;accent-color:var(--accent)}.pairs{display:grid;gap:2rem}.pair,.semantic-pair{min-width:0;padding:clamp(.9rem,2vw,1.4rem);border:2px solid var(--ink);border-radius:10px;background:var(--surface);background-image:repeating-linear-gradient(0deg,rgba(74,58,50,.018) 0 1px,transparent 1px 12px);box-shadow:0 18px 30px rgba(58,46,40,.18)}.pair-header{margin-bottom:1rem}.pair-header h2{margin:.2rem 0;font-size:clamp(1.4rem,3vw,2rem);overflow-wrap:anywhere}.pair-header code{overflow-wrap:anywhere}.sides{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;align-items:start}.asset-card{min-width:0;padding:.8rem;border:1px solid var(--line);border-radius:10px;background:#FBF1E2}.asset-card h3{margin:.2rem 0 .6rem}.poster{width:100%;height:auto;aspect-ratio:16/9;border:1px solid var(--line);background:var(--paper);object-fit:contain;filter:drop-shadow(0 2px 3px rgba(74,58,50,.12))}.asset-card figure{margin:0}.asset-card figcaption,.pending{color:var(--muted);font-size:.9rem}.playback{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.7rem}.playback a{display:inline-flex;align-items:center;padding:.4rem;color:var(--ink)}.status{display:block;margin:.5rem 0;padding:.45rem;border-left:2px solid var(--accent);background:#F2C879}.metrics,.controls,.deltas dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.4rem;margin:.7rem 0}.metrics{grid-template-columns:repeat(3,minmax(0,1fr))}.metrics div,.controls div,.deltas dl div{min-width:0;padding:.45rem;border:1px solid var(--line);border-radius:10px;overflow-wrap:anywhere}.metrics dt,.controls dt,.deltas dt{color:var(--muted);font-size:.85rem;font-weight:800}.metrics dd,.controls dd,.deltas dd{margin:.1rem 0 0;font-weight:800}.eval{margin-top:.8rem}.eval h4{margin:.4rem 0}.eval ul{display:grid;gap:.25rem;margin:0;padding:0;list-style:none}.eval li{display:flex;justify-content:space-between;gap:.4rem;padding:.35rem;border-bottom:1px solid var(--line);overflow-wrap:anywhere}.state--pending,.pending{font-weight:900}.deltas,.review{margin-top:1rem;padding-top:.6rem;border-top:1px solid var(--line)}.deltas h3,.review h3{margin:.2rem 0}.deltas table{width:100%;border-collapse:collapse;table-layout:fixed}.deltas caption{text-align:left;font-weight:800}.deltas th,.deltas td{padding:.4rem;border:1px solid var(--line);text-align:left;overflow-wrap:anywhere}.feedback{padding-left:1.2rem}.semantic{display:grid;gap:1rem;margin-top:3rem}.semantic h2{font-family:Fraunces,Georgia,serif;font-size:clamp(1.8rem,4vw,3rem)}.card-mode .asset-card{width:min(100%,668px);margin-inline:auto}.card-mode .poster{width:min(100%,640px);height:auto;aspect-ratio:16/9}footer{padding-block:1rem 2rem;color:var(--muted)}dialog{width:min(1280px,calc(100vw - 2rem));max-width:1280px;max-height:calc(100dvh - 2rem);padding:.8rem;border:2px solid var(--ink);border-radius:10px;background:var(--surface);color:var(--ink)}dialog::backdrop{background:rgb(18 16 13 / 82%)}.dialog-image{width:100%;height:auto;max-height:calc(100dvh - 7rem);object-fit:contain}.dialog-head{display:flex;justify-content:space-between;align-items:center;gap:1rem}@media(max-width:760px){.sides{grid-template-columns:minmax(0,1fr)}}@media(max-width:520px){header.site,main,footer{width:min(100% - 1.25rem,1440px)}.pair,.semantic-pair{box-shadow:.16rem .18rem 0 var(--accent)}.metrics,.controls,.deltas dl{grid-template-columns:minmax(0,1fr)}.playback>*{flex:1 1 40%}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
</style></head><body><a class="skip-link" href="#content">Saltar al contenido</a><header class="site"><p class="eyebrow">Open Beauty · issue 7</p><h1>${escapeHtml(title)}</h1><p class="intro">Comparación reproducible sobre briefs y seeds conservados. Las imágenes comienzan estáticas; cada GIF se solicita solo tras activar Reproducir. Los controles técnicos y la revisión visual se presentan por separado.</p></header>
<main id="content"><section class="toolbar" aria-label="Controles de comparación"><h2>Galería comparativa · Antes | Después</h2>${filtersHtml}<label class="toggle"><input id="card-mode" type="checkbox"><span>Modo tarjeta 640 × 360</span></label><p id="toggle-status" role="status">Vista comparativa completa.</p></section><section class="pairs" aria-label="Comparaciones antes y después">${pairCards}</section><section class="semantic" aria-labelledby="semantic-heading"><h2 id="semantic-heading">Fixtures semánticos: narrativo y solo arte</h2><p>Se muestran como sección solo después; no tienen un par histórico equivalente en el commit base. La revisión visual sin registro se marca pending.</p>${semanticCards}</section></main><footer>${index.pairs.length} pares históricos · ${index.semanticFixtures.length} fixtures semánticos · Seed y hash de brief visibles en cada ficha.</footer>
<dialog id="lightbox" aria-labelledby="dialog-title"><div class="dialog-head"><h2 id="dialog-title">Vista ampliada</h2><button type="button" data-action="close">Cerrar</button></div><img class="dialog-image" alt=""></dialog>
<script>(()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)');const dialog=document.getElementById('lightbox');const dialogImage=dialog.querySelector('img');const dialogTitle=document.getElementById('dialog-title');document.addEventListener('click',event=>{const target=event.target instanceof Element?event.target.closest('button[data-action],button[data-filter]'):null;if(!target)return;if(target.hasAttribute('data-filter')){const style=target.dataset.filter;document.querySelectorAll('.filter').forEach(button=>button.setAttribute('aria-pressed',String(button===target)));document.querySelectorAll('.pair,.semantic-pair').forEach(card=>card.hidden=style!=='all'&&card.dataset.style!==style);return}const action=target.dataset.action;if(action==='close'){dialog.close();return}const card=target.closest('.asset-card');if(!card)return;const image=card.querySelector('.poster');const status=card.querySelector('.status');if(action==='play'){image.src=image.dataset.gif;image.alt=image.alt.replace('imagen estática','GIF animado');status.textContent=reduced.matches?'GIF iniciado por acción explícita con movimiento reducido.':'GIF en reproducción manual.'}else if(action==='stop'){image.src=image.dataset.poster;image.alt=image.alt.replace('GIF animado','imagen estática');status.textContent='Vista estática · GIF detenido.'}else if(action==='enlarge'){dialogTitle.textContent=card.querySelector('h3').textContent;dialogImage.src=image.currentSrc||image.src;dialogImage.alt=image.alt;dialog.showModal()}});dialog.addEventListener('close',()=>dialogImage.removeAttribute('src'));document.getElementById('card-mode').addEventListener('change',event=>{const active=event.target.checked;document.querySelector('.pairs').classList.toggle('card-mode',active);document.querySelector('.semantic').classList.toggle('card-mode',active);document.getElementById('toggle-status').textContent=active?'Modo tarjeta activo: cada imagen se presenta a 640 × 360.':'Vista comparativa completa.'})})()</script></body></html>`;
}

export async function createNarrativeCompareGallery(options: NarrativeCompareGalleryOptions): Promise<NarrativeGalleryResult> {
  const compareDirectory = path.resolve(options.directory);
  const indexPath = path.join(compareDirectory, 'index.json');
  const output = path.resolve(options.output);
  let index: CompareIndex;
  try {
    index = JSON.parse(await readFile(indexPath, 'utf8')) as CompareIndex;
  } catch (error) {
    throw new Error(`Narrative comparison gallery: could not read ${indexPath}: ${(error as Error).message}`);
  }
  if (!index || index.schemaVersion !== 1 || !Array.isArray(index.pairs) || !Array.isArray(index.semanticFixtures)) {
    throw new Error(`Narrative comparison gallery: ${indexPath} must contain schemaVersion 1, pairs, and semanticFixtures.`);
  }
  const { mkdir, writeFile } = await import('node:fs/promises');
  const outputDirectory = path.dirname(output);
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(output, comparisonHtml(index, options.title?.trim() || 'Galería comparativa antes y después', compareDirectory, outputDirectory), 'utf8');
  return { path: output, pieceCount: index.pairs.length + index.semanticFixtures.length, styles: [...new Set([...index.pairs.map((pair) => pair.style), ...index.semanticFixtures.map((fixture) => fixture.style)])] };
}
