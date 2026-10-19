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
    const reason = cell.reason.replace(/test\/[A-Za-z0-9-]+\.test\.ts/gu, 'the linked render test').replaceAll('row-level', 'row level');
    const proofLink = proof === '—'
      ? '—'
      : `<a href="../../${html(proof)}" aria-label="Prueba: ${html(proof)}" title="${html(proof)}">Prueba</a>`;
    const evidenceBrief = `${evidence}/brief.json`;
    return `<tr><th scope="row">${html(cell.style)}</th><td>${html(cell.primitive)}</td><td>${html(cell.aspect)}</td><td>${html(cell.locale)}</td><td><strong>${html(cell.status)}</strong></td><td>${html(reason)}</td><td>${proofLink}</td><td><a href="${html(evidenceBrief.replace('docs/narrative-gif/', ''))}" aria-label="Pack de evidencia: ${html(evidence)}" title="${html(evidence)}">Pack</a></td></tr>`;
  }).join('\n');
  const styles = `
:root{color-scheme:light;--paper:#FBF1E2;--surface:#FFF8EA;--ink:#4A3A32;--muted:#7A5F50;--line:#7A5F50;--accent:#CE7256;font-family:'Nunito Sans','Trebuchet MS',sans-serif;background:var(--paper);color:var(--ink)}
*{box-sizing:border-box}
html,body{max-width:100%;overflow-x:hidden}
body{margin:0;line-height:1.55;background:var(--paper)}
header,main,footer{width:min(100% - 2rem,1440px);margin-inline:auto}
header{position:relative;padding-block:3rem 1rem;border-bottom:2px solid var(--ink)}
.edition-stamp{position:absolute;top:2.5rem;right:0;display:grid;gap:.25rem;padding:.7rem 1rem;border:2px solid var(--ink);border-left:2px solid var(--accent);background:var(--surface);box-shadow:0 12px 20px rgba(58,46,40,.18);filter:drop-shadow(0 6px 3px rgba(58,46,40,.16));transform:rotate(2deg)}
.edition-stamp strong{font-family:'Fraunces',Georgia,serif;font-size:1.5rem}
.edition-stamp span{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
h1{max-width:14ch;margin:0;font-family:'Fraunces',Georgia,serif;font-size:clamp(48px,7vw,120px);line-height:1.05}
h2{margin:.35rem 0 .8rem;font-family:'Fraunces',Georgia,serif;font-size:1.35rem}
p{max-width:80ch}
.summary{display:flex;flex-wrap:wrap;gap:.3rem 1.2rem;margin-block:1rem}
.summary p{display:flex;align-items:baseline;gap:.4rem;margin:.2rem 0;padding-left:.7rem;border-left:2px solid var(--accent)}
.summary strong{font-family:'Fraunces',Georgia,serif;font-size:clamp(1.5rem,2.5vw,2.2rem);line-height:1}
main{padding-block:1.5rem 4rem}
.upgrade-map{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1fr);gap:1rem;align-items:stretch;max-width:1120px;margin:1.75rem 0 2rem}
.upgrade-step{position:relative;min-height:10rem;padding:1rem 1.2rem;border:1px solid var(--ink);background:var(--surface);box-shadow:0 14px 22px rgba(58,46,40,.18)}
.upgrade-step::after{position:absolute;top:-1px;right:-1px;width:1.25rem;aspect-ratio:1;content:'';background:var(--accent);clip-path:polygon(0 0,100% 100%,100% 0)}
.upgrade-step:nth-of-type(2){transform:translateY(1rem);border-top:2px solid var(--accent)}
.step-index{display:block;color:var(--accent);font-family:'Fraunces',Georgia,serif;font-size:2rem;line-height:1}
.field-pair,.state-rail{display:flex;flex-wrap:wrap;gap:.45rem}
.field-pair code,.state-rail span{padding:.25rem .5rem;border:1px solid var(--line);background:var(--paper);font-size:.875rem}
.map-arrow{align-self:center;color:var(--accent);font-family:'Fraunces',Georgia,serif;font-size:2rem}
.legend{max-width:70ch;padding:1rem;border-left:2px solid var(--accent);background:var(--surface);font-weight:700;box-shadow:0 18px 30px rgba(58,46,40,.18)}
.skip-link{position:absolute;z-index:10;top:.5rem;left:.5rem;padding:.5rem .8rem;transform:translateY(-160%);background:var(--surface);color:var(--ink)}
.skip-link:focus{transform:translateY(0)}
.table-wrap{overflow:auto;max-width:100%;border:1px solid var(--line);background:var(--surface);box-shadow:0 18px 30px rgba(58,46,40,.18)}
table{width:100%;min-width:1100px;border-collapse:collapse}
caption{text-align:left;padding:.7rem;font-weight:800}
th,td{padding:.55rem .65rem;border:1px solid var(--line);vertical-align:top;text-align:left}
thead{position:sticky;top:0;background:var(--ink);color:var(--surface)}
tbody tr:nth-child(even){background:#FBF1E2}
td:nth-child(6){min-width:28rem;overflow-wrap:anywhere}
td:nth-child(7),td:nth-child(8){min-width:7rem}
a{color:var(--ink);text-underline-offset:.15em}
:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
footer{padding-block:1rem 2rem;color:var(--muted)}
@media(max-width:640px){header,main,footer{width:calc(100% - 1rem)}header{padding-top:1rem}.edition-stamp{position:relative;top:auto;right:auto;width:max-content;margin:.5rem 0 1rem auto}.summary{gap:.25rem .7rem}.upgrade-map{grid-template-columns:1fr;gap:.5rem;margin-block:1rem}.upgrade-step:nth-of-type(2){transform:none}.map-arrow{justify-self:center;transform:rotate(90deg)}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>Matriz de capacidades narrativas</title><style>${styles}</style></head><body><a class="skip-link" href="#main">Saltar al contenido</a><header><p class="eyebrow">Open Beauty · contrato v${report.contractVersion}</p><aside class="edition-stamp" aria-label="Contrato narrativo v${report.contractVersion}"><strong>v${report.contractVersion}</strong><span>Contrato<br>narrativo</span></aside><h1>Matriz de capacidades</h1><div class="summary" aria-label="Resumen de resultados"><p><strong>${report.cells.length}</strong><span>celdas</span></p><p><strong>${report.summary.supported}</strong><span>supported</span></p><p><strong>${report.summary.fallback}</strong><span>fallback</span></p><p><strong>${report.summary.unsupported}</strong><span>unsupported</span></p></div><p class="legend">No evidence = not approved. Una celda sin evidencia de pack y prueba no se considera aprobada. Los estados técnicos no equivalen a aprobación visual independiente.</p><p>Los briefs legacy se actualizan a escenas semánticas solo en papercraft, brutalist, isotype, opart, renaissance y ukiyoe; legacyArt:true conserva el arte previo. Los otros siete estilos siguen en la ruta heredada. La conversión no promueve capacidades nuevas.</p></header><section class="upgrade-map" aria-label="Cómo cambia un brief heredado"><article class="upgrade-step"><span class="step-index">01</span><h2>Brief heredado</h2><p>Describe el tipo visual y su estado.</p><div class="field-pair"><code>visual.kind</code><code>visual.state</code></div></article><span class="map-arrow" aria-hidden="true">→</span><article class="upgrade-step"><span class="step-index">02</span><h2>Escena semántica</h2><p>Entidades ilustrativas conservan la secuencia descrita.</p><div class="state-rail"><span>pendiente</span><span>señalada</span><span>lista para revisión</span></div></article><span class="map-arrow" aria-hidden="true">→</span><article class="upgrade-step"><span class="step-index">03</span><h2>Opt-out disponible</h2><p><code>legacyArt:true</code> conserva la ilustración anterior.</p></article></section><main id="main"><div class="table-wrap" role="region" aria-label="Matriz estilo por primitiva, aspecto e idioma" tabindex="0"><table><caption>Matriz estilo × primitiva × aspecto × locale</caption><thead><tr><th>Estilo</th><th>Primitiva</th><th>Aspecto</th><th>Locale</th><th>Estado</th><th>Razón</th><th>Prueba</th><th>Pack de evidencia</th></tr></thead><tbody>${rows}</tbody></table></div></main><footer>Fuente de estado y razones: <code>beauty capabilities --json</code>. Generada localmente desde el registro narrativo.</footer></body></html>\n`;
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
