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
}

export interface NarrativeGalleryOptions {
  directory: string;
  output: string;
  title?: string;
}

export interface NarrativeGalleryResult {
  path: string;
  pieceCount: number;
  styles: string[];
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

async function manifestsUnder(directory: string, excludedDirectory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory() && path.resolve(file) !== excludedDirectory) files.push(...await manifestsUnder(file, excludedDirectory));
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
  const levels = EVALUATION_LEVELS.map((level) => {
    const value = pack.evaluation[level];
    const emphasized = level === 'visual-review' && value === 'pending' ? ' level--pending' : '';
    return `<li class="evaluation-level${emphasized}"${level === 'visual-review' && value === 'pending' ? ' aria-label="visual-review: pending"' : ''}><span>${level}:</span><strong>${escapeHtml(value)}</strong></li>`;
  }).join('\n');
  return `<article class="piece" data-style="${escapeHtml(pack.style)}" aria-labelledby="${escapeHtml(id)}-title">
  <header class="piece-header">
    <h2 id="${escapeHtml(id)}-title">${escapeHtml(pack.title)}</h2>
    <span class="status-tag">Estado: ${status}</span>
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

  const manifestPaths = await manifestsUnder(sourceDirectory, path.join(sourceDirectory, 'art-only'));
  if (manifestPaths.length === 0) throw new Error(`Narrative gallery: no manifest files found under ${sourceDirectory}.`);
  const packs = await Promise.all(manifestPaths.map(readPack));
  packs.sort((a, b) => a.style.localeCompare(b.style, 'en') || a.title.localeCompare(b.title, 'es'));
  const title = options.title?.trim() || 'Galería de revisión narrativa';
  const { writeFile, mkdir } = await import('node:fs/promises');
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(output, galleryHtml(title, packs, outputDirectory), 'utf8');
  return { path: output, pieceCount: packs.length, styles: [...new Set(packs.map((pack) => pack.style))] };
}
