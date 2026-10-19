import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { narrativeCapabilityReport } from '../src/narrative/capabilities.js';
import type { NarrativeCapabilityReport, NarrativePrimitive } from '../src/narrative/capabilities.js';
import type { StyleSlug } from '../src/types.js';

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, 'docs', 'narrative-gif');

const PROOF_BY_STYLE: Partial<Record<StyleSlug, string>> = {
  papercraft: 'test/narrative-semantic-render.test.ts',
  brutalist: 'test/narrative-semantic-render.test.ts',
  isotype: 'test/narrative-semantic-style-render.test.ts',
  opart: 'test/narrative-semantic-style-render.test.ts',
  renaissance: 'test/narrative-style-semantic.test.ts',
  ukiyoe: 'test/narrative-style-semantic.test.ts',
};

export interface CapabilityMarkdownRow {
  key: string;
  status: string;
  reason: string;
  proof: string;
  evidence: string;
}

function escapeMarkdown(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function proofFile(style: StyleSlug, status: string): string {
  return status === 'supported' ? PROOF_BY_STYLE[style] ?? '—' : '—';
}

function evidencePath(style: StyleSlug): string {
  if (style === 'papercraft' || style === 'brutalist') return `docs/narrative-gif/semantic/${style}/filas-duplicadas/es`;
  return `docs/narrative-gif/gallery/${style}/comparison`;
}

export function capabilitiesMarkdown(report: NarrativeCapabilityReport): string {
  const header = [
    '# Matriz de capacidades narrativas',
    '',
    `Generada desde beauty capabilities --json · contrato v${report.contractVersion} · ${report.cells.length} celdas.`,
    '',
    '**Leyenda:** `supported` = implementación con evidencia y prueba enlazada; `fallback` = se conserva la ilustración heredada; `unsupported` = renderer o aspecto no disponible. **No evidence = not approved**: una celda solo cuenta como aprobada cuando el CLI la declara supported y el pack y la prueba citados existen.',
    '',
    'Compatibilidad: los briefs legacy de papercraft, brutalist, isotype, opart, renaissance y ukiyoe se actualizan a escenas semánticas; `legacyArt: true` conserva su arte previo. Artdeco, bestiary, galactic, memphis, nature, psychedelic y vaporwave siguen en la ruta heredada. Esta conversión no cambia el estado de ninguna celda ni aprueba una capacidad nueva.',
    '',
    `Resumen: supported ${report.summary.supported} · fallback ${report.summary.fallback} · unsupported ${report.summary.unsupported}.`,
    '',
    '| Estilo | Primitiva | Aspecto | Locale | Estado | Razón del registro CLI | Prueba que acredita supported | Pack de evidencia |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  const rows = report.cells.map((cell) => {
    const evidence = evidencePath(cell.style);
    const proof = proofFile(cell.style, cell.status);
    return `| ${cell.style} | ${cell.primitive as NarrativePrimitive} | ${cell.aspect} | ${cell.locale} | ${cell.status} | ${escapeMarkdown(cell.reason)} | ${proof === '—' ? proof : `\`${proof}\``} | \`${evidence}\` |`;
  });
  return `${[...header, ...rows, '', 'La matriz describe contratos técnicos por celda; no sustituye revisión visual independiente.'].join('\n')}\n`;
}

function html(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function capabilitiesHtml(report: NarrativeCapabilityReport): string {
  const rows = report.cells.map((cell) => {
    const proof = proofFile(cell.style, cell.status);
    const evidence = evidencePath(cell.style);
    const proofLink = proof === '—' ? '—' : `<a href="../../${html(proof)}">${html(proof)}</a>`;
    const evidenceBrief = evidence.endsWith('/comparison') ? `${evidence}/brief.json` : `${evidence}/brief.json`;
    return `<tr><th scope="row">${html(cell.style)}</th><td>${html(cell.primitive)}</td><td>${html(cell.aspect)}</td><td>${html(cell.locale)}</td><td><strong>${html(cell.status)}</strong></td><td>${html(cell.reason)}</td><td>${proofLink}</td><td><a href="${html(evidenceBrief.replace('docs/narrative-gif/', ''))}">${html(evidence)}</a></td></tr>`;
  }).join('\n');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>Matriz de capacidades narrativas</title><style>
:root{color-scheme:light;--paper:#FBF1E2;--surface:#FFF8EA;--ink:#4A3A32;--muted:#7A5F50;--line:#B59A82;--accent:#CE7256;font-family:'Nunito Sans','Trebuchet MS',sans-serif;background:var(--paper);color:var(--ink)}*{box-sizing:border-box}body{margin:0;line-height:1.5}header,main,footer{width:min(100% - 2rem,1440px);margin:auto}header{padding-block:3rem 1rem;border-bottom:2px solid var(--ink)}h1{font:clamp(2.4rem,7vw,6rem)/1.05 Fraunces,Georgia,serif;margin:0}p{max-width:80ch}main{padding-block:1.5rem 4rem}.legend{padding:1rem;border-left:4px solid var(--accent);background:var(--surface);font-weight:700}.table-wrap{overflow:auto;max-width:100%;border:1px solid var(--line);background:var(--surface)}table{width:100%;min-width:1100px;border-collapse:collapse}caption{text-align:left;padding:.7rem;font-weight:800}th,td{padding:.55rem .65rem;border:1px solid var(--line);vertical-align:top;text-align:left}thead{position:sticky;top:0;background:var(--ink);color:var(--surface)}tbody tr:nth-child(even){background:#FBF1E2}td:nth-child(6){min-width:28rem}td:nth-child(7),td:nth-child(8){min-width:15rem;overflow-wrap:anywhere}a{color:var(--ink);text-underline-offset:.15em}:focus-visible{outline:3px solid var(--accent);outline-offset:2px}footer{padding-block:1rem 2rem;color:var(--muted)}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
</style></head><body><header><p class="eyebrow">Open Beauty · contrato v${report.contractVersion}</p><h1>Matriz de capacidades</h1><p>${report.cells.length} celdas · supported ${report.summary.supported} · fallback ${report.summary.fallback} · unsupported ${report.summary.unsupported}.</p><p class="legend">No evidence = not approved. Una celda sin evidencia de pack y prueba no se considera aprobada. Los estados técnicos no equivalen a aprobación visual independiente.</p><p>Los briefs legacy se actualizan a escenas semánticas solo en papercraft, brutalist, isotype, opart, renaissance y ukiyoe; legacyArt:true conserva el arte previo. Los otros siete estilos siguen en la ruta heredada. La conversión no promueve capacidades nuevas.</p></header><main><div class="table-wrap" role="region" aria-label="Matriz estilo por primitiva, aspecto e idioma" tabindex="0"><table><caption>Estilo × primitiva × aspecto × locale</caption><thead><tr><th>Estilo</th><th>Primitiva</th><th>Aspecto</th><th>Locale</th><th>Estado</th><th>Razón</th><th>Prueba</th><th>Pack de evidencia</th></tr></thead><tbody>${rows}</tbody></table></div></main><footer>Fuente de estado y razones: <code>beauty capabilities --json</code>. Generada localmente desde el registro narrativo.</footer></body></html>\n`;
}

export function parseCapabilitiesMarkdown(markdown: string): CapabilityMarkdownRow[] {
  return markdown.split(/\r?\n/u).filter((line) => line.startsWith('|') && !/^\|\s*-{3,}/u.test(line)).slice(1).map((line) => {
    const fields = line.slice(1, -1).split(/(?<!\\)\|/u).map((field) => field.trim().replaceAll('\\|', '|').replaceAll('\\\\', '\\'));
    return {
      key: `${fields[0]}/${fields[1]}/${fields[2]}/${fields[3]}`,
      status: fields[4] ?? '',
      reason: fields[5] ?? '',
      proof: (fields[6] ?? '').replaceAll('`', ''),
      evidence: (fields[7] ?? '').replaceAll('`', ''),
    };
  });
}

export async function generateCapabilitiesMatrix(report: NarrativeCapabilityReport = narrativeCapabilityReport()): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all([
    writeFile(path.join(OUTPUT_DIR, 'CAPABILITIES.md'), capabilitiesMarkdown(report), 'utf8'),
    writeFile(path.join(OUTPUT_DIR, 'CAPABILITIES.html'), capabilitiesHtml(report), 'utf8'),
  ]);
  console.log(`CAPABILITIES.md y CAPABILITIES.html · ${report.cells.length} celdas · ${report.summary.supported} supported, ${report.summary.fallback} fallback, ${report.summary.unsupported} unsupported.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await generateCapabilitiesMatrix();
