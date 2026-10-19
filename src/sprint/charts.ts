import type { StylePreset } from '../types.js';
import { esc, t as translate } from '../page/common.js';
import type { SprintCapacity, SprintData, SprintRetroAction, SprintRisk, SprintStory } from './data.js';

/**
 * Inline SVG charts for the sprint kit. They use only the style palette and
 * type tokens (no chart library), so every deck keeps the identity of its
 * editorial system. Values are real data, never decoration.
 */

export type SprintLocale = 'es' | 'en';

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function styleTokens(preset: StylePreset): { sw: number; rx: number } {
  return {
    sw: Math.max(1, preset.rules.borderWidths[0] ?? 1),
    rx: Math.min(Math.max(preset.rules.radius[0] ?? 0, 0), 10),
  };
}

function legend(p: StylePreset['palette'], preset: StylePreset, x: number, y: number, locale: SprintLocale): string {
  const label = preset.fonts.mono;
  return `<g font-family="${label}, monospace" font-size="11" letter-spacing="1">
    <rect x="${x}" y="${y - 9}" width="12" height="12" fill="none" stroke="${p.accent}" stroke-width="2"/>
    <text x="${x + 18}" y="${y}" fill="${p.muted}">${esc(translate(locale, 'comprometido', 'committed'))}</text>
    <rect x="${x + 140}" y="${y - 9}" width="12" height="12" fill="${p.accent}"/>
    <text x="${x + 158}" y="${y}" fill="${p.muted}">${esc(translate(locale, 'hecho', 'done'))}</text>
  </g>`;
}

export function velocityChart(preset: StylePreset, data: SprintData): string {
  const p = preset.palette;
  const { sw, rx } = styleTokens(preset);
  const items = data.velocity.slice(-5);
  const width = 720;
  const height = 320;
  const left = 52;
  const right = 20;
  const top = 52;
  const bottom = 46;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const baseline = height - bottom;
  const max = Math.max(1, ...items.map((item) => Math.max(item.committed, item.done)));
  const groupWidth = plotWidth / Math.max(1, items.length);
  const barWidth = Math.min(30, groupWidth * 0.26);
  const bars = items
    .map((item, index) => {
      const center = left + groupWidth * (index + 0.5);
      const committedX = center - barWidth - 3;
      const doneX = center + 3;
      const committedH = (item.committed / max) * plotHeight;
      const doneH = (item.done / max) * plotHeight;
      const labelY = baseline + 22;
      return `<g>
        <rect x="${round(committedX)}" y="${round(baseline - committedH)}" width="${round(barWidth)}" height="${round(committedH)}" rx="${rx}" fill="${p.surface}" stroke="${p.accent}" stroke-width="${sw}"/>
        <rect x="${round(doneX)}" y="${round(baseline - doneH)}" width="${round(barWidth)}" height="${round(doneH)}" rx="${rx}" fill="${p.accent}"/>
        <text x="${round(committedX + barWidth / 2)}" y="${round(baseline - committedH - 7)}" text-anchor="middle" font-family="${preset.fonts.mono}, monospace" font-size="12" fill="${p.muted}">${round(item.committed)}</text>
        <text x="${round(doneX + barWidth / 2)}" y="${round(baseline - doneH - 7)}" text-anchor="middle" font-family="${preset.fonts.mono}, monospace" font-size="12" fill="${p.ink}">${round(item.done)}</text>
        <text x="${round(center)}" y="${labelY}" text-anchor="middle" font-family="${preset.fonts.mono}, monospace" font-size="13" fill="${p.ink}">${esc(item.sprint)}</text>
      </g>`;
    })
    .join('');
  return `<svg class="sprint-chart" data-sprint="velocity" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(
    translate(data.locale, 'Velocidad comprometida frente a completada por sprint', 'Committed versus done velocity per sprint'),
  )}">
    <rect width="${width}" height="${height}" fill="${p.surface}" opacity=".55"/>
    <line x1="${left}" y1="${baseline}" x2="${width - right}" y2="${baseline}" stroke="${p.ink}" stroke-width="${sw}"/>
    <line x1="${left}" y1="${top - 14}" x2="${left}" y2="${baseline}" stroke="${p.muted}" stroke-width="1" opacity=".6"/>
    <text x="${left - 10}" y="${top - 8}" text-anchor="end" font-family="${preset.fonts.mono}, monospace" font-size="11" fill="${p.muted}">${round(max)}</text>
    <text x="${left - 10}" y="${baseline}" text-anchor="end" font-family="${preset.fonts.mono}, monospace" font-size="11" fill="${p.muted}">0</text>
    ${legend(p, preset, left, 24, data.locale)}
    ${bars}
  </svg>`;
}

export function burndownChart(preset: StylePreset, data: SprintData): string {
  const p = preset.palette;
  const { sw } = styleTokens(preset);
  const items = data.burndown;
  const width = 720;
  const height = 320;
  const left = 52;
  const right = 24;
  const top = 34;
  const bottom = 50;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const baseline = height - bottom;
  const max = Math.max(1, ...items.map((item) => item.remaining));
  const step = items.length > 1 ? plotWidth / (items.length - 1) : 0;
  const points = items.map((item, index) => ({
    x: round(left + step * index),
    y: round(baseline - (item.remaining / max) * plotHeight),
    item,
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const dots = points
    .map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4.5" fill="${p.accent}"/>`)
    .join('');
  const labels = points
    .map((point, index) => {
      if (index !== 0 && index !== points.length - 1 && index !== Math.floor(points.length / 2)) return '';
      return `<text x="${point.x}" y="${baseline + 22}" text-anchor="middle" font-family="${preset.fonts.mono}, monospace" font-size="12" fill="${p.ink}">${esc(point.item.day)}</text>`;
    })
    .join('');
  const last = items[items.length - 1];
  return `<svg class="sprint-chart" data-sprint="burndown" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(
    translate(data.locale, 'Línea de burn down: puntos restantes por día', 'Burndown line: remaining points per day'),
  )}">
    <rect width="${width}" height="${height}" fill="${p.surface}" opacity=".55"/>
    <line x1="${left}" y1="${baseline}" x2="${width - right}" y2="${baseline}" stroke="${p.ink}" stroke-width="${sw}"/>
    <line x1="${left}" y1="${top - 8}" x2="${left}" y2="${baseline}" stroke="${p.muted}" stroke-width="1" opacity=".6"/>
    <text x="${left - 10}" y="${top}" text-anchor="end" font-family="${preset.fonts.mono}, monospace" font-size="11" fill="${p.muted}">${round(max)}</text>
    <text x="${left - 10}" y="${baseline}" text-anchor="end" font-family="${preset.fonts.mono}, monospace" font-size="11" fill="${p.muted}">0</text>
    <polyline points="${line}" fill="none" stroke="${p.accent}" stroke-width="${Math.max(2, sw)}" stroke-linejoin="round"/>
    ${dots}
    ${labels}
    ${
      last
        ? `<text x="${width - right}" y="${top}" text-anchor="end" font-family="${preset.fonts.mono}, monospace" font-size="12" fill="${p.muted}">${esc(
            translate(data.locale, `cierre: ${round(last.remaining)} puntos restantes`, `close: ${round(last.remaining)} points left`),
          )}</text>`
        : ''
    }
  </svg>`;
}

export function capacityChart(preset: StylePreset, data: SprintData, items: SprintCapacity[]): string {
  const p = preset.palette;
  const { sw, rx } = styleTokens(preset);
  const width = 720;
  const rowHeight = 46;
  const height = 56 + items.length * rowHeight;
  const labelWidth = 172;
  const barWidth = width - labelWidth - 120;
  const max = Math.max(1, ...items.map((item) => item.days));
  const rows = items
    .map((item, index) => {
      const y = 34 + index * rowHeight;
      const length = (item.days / max) * barWidth;
      return `<g>
        <text x="${labelWidth - 14}" y="${y + 15}" text-anchor="end" font-family="${preset.fonts.display}, sans-serif" font-size="15" fill="${p.ink}">${esc(item.person)}</text>
        <rect x="${labelWidth}" y="${y}" width="${round(barWidth)}" height="20" rx="${rx}" fill="${p.surface}" stroke="${p.muted}" stroke-width="1"/>
        <rect x="${labelWidth}" y="${y}" width="${round(length)}" height="20" rx="${rx}" fill="${p.accent3}" stroke="${p.ink}" stroke-width="${sw}" opacity=".9"/>
        <text x="${labelWidth + round(barWidth) + 10}" y="${y + 15}" font-family="${preset.fonts.mono}, monospace" font-size="13" fill="${p.ink}">${round(item.days)}</text>
        ${item.focus ? `<text x="${labelWidth}" y="${y + 34}" font-family="${preset.fonts.mono}, monospace" font-size="11" fill="${p.muted}">${esc(item.focus)}</text>` : ''}
      </g>`;
    })
    .join('');
  return `<svg class="sprint-chart" data-sprint="capacity" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(
    translate(data.locale, 'Capacidad en días por persona para el próximo sprint', 'Capacity in days per person for the next sprint'),
  )}">
    <rect width="${width}" height="${height}" fill="${p.surface}" opacity=".55"/>
    <text x="${labelWidth - 14}" y="20" text-anchor="end" font-family="${preset.fonts.mono}, monospace" font-size="11" fill="${p.muted}">${esc(
      translate(data.locale, 'persona', 'person'),
    )}</text>
    <text x="${labelWidth}" y="20" font-family="${preset.fonts.mono}, monospace" font-size="11" fill="${p.muted}">${esc(
      translate(data.locale, 'días de foco', 'focus days'),
    )}</text>
    ${rows}
  </svg>`;
}

export function storiesTable(preset: StylePreset, locale: SprintLocale, stories: SprintStory[], withHeader: boolean): string {
  const status: Record<SprintStory['status'], string> = {
    done: translate(locale, 'hecha', 'done'),
    carried: translate(locale, 'arrastrada', 'carried'),
    dropped: translate(locale, 'descartada', 'dropped'),
  };
  const rows = stories
    .map(
      (story) => `<tr>
        <td class="sprint-id">${esc(story.id ?? '—')}</td>
        <td>${esc(story.title)}</td>
        <td><span class="sprint-chip" data-status="${story.status}">${esc(status[story.status])}</span></td>
        <td>${esc(story.owner ?? '—')}</td>
        <td class="sprint-num">${story.points === undefined ? '—' : round(story.points)}</td>
      </tr>`,
    )
    .join('');
  const head = withHeader
    ? `<thead><tr><th>${esc(translate(locale, 'id', 'id'))}</th><th>${esc(translate(locale, 'historia', 'story'))}</th><th>${esc(
        translate(locale, 'estado', 'status'),
      )}</th><th>${esc(translate(locale, 'responsable', 'owner'))}</th><th>${esc(translate(locale, 'pts', 'pts'))}</th></tr></thead>`
    : '';
  const cls = (preset.rules.borderWidths[0] ?? 1) >= 3 ? 'sprint-table is-hard' : 'sprint-table';
  return `<div class="sprint-block" data-sprint="stories"><table class="${cls}">${head}<tbody>${rows}</tbody></table></div>`;
}

function riskCard(risk: SprintRisk, locale: SprintLocale): string {
  return `<article class="sprint-risk">
        <h3>${esc(risk.title)}</h3>
        ${risk.impact ? `<p>${esc(risk.impact)}</p>` : ''}
        ${risk.mitigation ? `<p class="sprint-mitigation">${esc(translate(locale, 'Mitigación', 'Mitigation'))}: ${esc(risk.mitigation)}</p>` : ''}
        ${risk.owner ? `<span>${esc(translate(locale, 'responsable', 'owner'))} · ${esc(risk.owner)}</span>` : ''}
      </article>`;
}

export function risksBlock(preset: StylePreset, locale: SprintLocale, risks: SprintRisk[], withHeader: boolean): string {
  const items = risks.map((risk) => riskCard(risk, locale)).join('');
  const head = withHeader
    ? `<p class="sprint-block-label">${esc(translate(locale, 'riesgos del sprint', 'sprint risks'))}</p>`
    : '';
  return `<div class="sprint-block" data-sprint="risks">${head}<div class="sprint-risks">${items}</div></div>`;
}

/** Legacy `blockers[]`: rendered as a compact risk-like list instead of disappearing. */
export function blockersBlock(locale: SprintLocale, blockers: string[], withHeader: boolean): string {
  const items = blockers.map((blocker) => riskCard({ title: blocker }, locale)).join('');
  const head = withHeader
    ? `<p class="sprint-block-label">${esc(translate(locale, 'bloqueos del sprint', 'sprint blockers'))}</p>`
    : '';
  return `<div class="sprint-block" data-sprint="blockers">${head}<div class="sprint-risks">${items}</div></div>`;
}

export interface RetroColumns {
  wentWell: string[];
  toImprove: string[];
  actions: string[];
}

export function retroColumns(preset: StylePreset, locale: SprintLocale, columns: RetroColumns, withHeader: boolean): string {
  const labels = [
    translate(locale, 'funcionó', 'went well'),
    translate(locale, 'a mejorar', 'to improve'),
    translate(locale, 'acciones', 'actions'),
  ];
  const lists = [columns.wentWell, columns.toImprove, columns.actions];
  const body = labels
    .map(
      (label, index) => `<div class="sprint-col"><h3>${esc(label)}</h3><ul>${(lists[index] ?? [])
        .map((item) => `<li>${esc(item)}</li>`)
        .join('')}</ul></div>`,
    )
    .join('');
  const head = withHeader
    ? `<p class="sprint-block-label">${esc(translate(locale, 'la lectura del sprint', 'the sprint read'))}</p>`
    : '';
  const cls = (preset.rules.borderWidths[0] ?? 1) >= 3 ? 'sprint-columns is-hard' : 'sprint-columns';
  return `<div class="sprint-block" data-sprint="retro-columns">${head}<div class="${cls}">${body}</div></div>`;
}

export function retroActions(preset: StylePreset, locale: SprintLocale, actions: SprintRetroAction[], withHeader: boolean): string {
  const rows = actions
    .map(
      (action) => `<tr><td>${esc(action.what)}</td><td>${esc(action.owner ?? '—')}</td><td class="sprint-id">${esc(action.due ?? '—')}</td></tr>`,
    )
    .join('');
  const head = withHeader
    ? `<thead><tr><th>${esc(translate(locale, 'acción', 'action'))}</th><th>${esc(translate(locale, 'responsable', 'owner'))}</th><th>${esc(
        translate(locale, 'fecha', 'due'),
      )}</th></tr></thead>`
    : '';
  const cls = (preset.rules.borderWidths[0] ?? 1) >= 3 ? 'sprint-table is-hard' : 'sprint-table';
  return `<div class="sprint-block" data-sprint="retro-actions"><table class="${cls}">${head}<tbody>${rows}</tbody></table></div>`;
}

export function backlogBlock(preset: StylePreset, locale: SprintLocale, stories: SprintStory[], withHeader: boolean): string {
  return `<div data-sprint="backlog">${storiesTable(preset, locale, stories, withHeader)}</div>`;
}

/** CSS for the injected blocks. Palette tokens only: no literal hex values. */
export function sprintKitCss(): string {
  return `
.sprint-block{margin:16px 0 0}
.sprint-block-label{margin:0 0 10px;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.sprint-chart{width:100%;height:auto;display:block;border:var(--line) solid color-mix(in srgb,var(--ink) 24%,transparent);background:color-mix(in srgb,var(--surface) 88%,transparent)}
.sprint-table{width:100%;border-collapse:collapse;table-layout:fixed}
.sprint-table th{font-size:9px;letter-spacing:.14em;text-transform:uppercase;text-align:left;color:var(--muted);border-bottom:var(--line) solid var(--muted);padding:6px 8px}
.sprint-table td{padding:7px 8px;border-bottom:var(--line) solid color-mix(in srgb,var(--muted) 32%,transparent);font-size:13px;line-height:1.32;color:var(--ink);overflow-wrap:anywhere}
.sprint-table.is-hard td,.sprint-table.is-hard th{border-bottom-width:3px}
.sprint-id{font-family:var(--mono,monospace);font-size:11px;letter-spacing:.06em;color:var(--muted)}
.sprint-num{text-align:right}
.sprint-chip{display:inline-block;font-size:8px;letter-spacing:.12em;text-transform:uppercase;border:var(--line) solid var(--muted);padding:2px 6px;color:var(--muted)}
.sprint-chip[data-status="done"]{background:var(--accent);border-color:var(--accent);color:var(--accent-on)}
.sprint-chip[data-status="carried"]{border-color:var(--accent);color:var(--accent-text)}
.sprint-chip[data-status="dropped"]{text-decoration:line-through}
.sprint-risks{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.sprint-risk{border:var(--line) solid color-mix(in srgb,var(--muted) 55%,transparent);padding:12px 14px;background:color-mix(in srgb,var(--surface) 82%,transparent)}
.sprint-risk h3{margin:0 0 6px;font-size:15px;line-height:1.25}
.sprint-risk p{margin:0 0 6px;font-size:12px;line-height:1.45;color:var(--muted)}
.sprint-risk .sprint-mitigation{color:var(--ink)}
.sprint-risk span{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.sprint-columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.sprint-columns.is-hard{gap:6px}
.sprint-col{border-top:var(--line) solid var(--accent);padding-top:10px}
.sprint-columns.is-hard .sprint-col{border-top-width:3px}
.sprint-col h3{margin:0 0 8px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.sprint-col ul{margin:0;padding:0 0 0 16px}
.sprint-col li{font-size:13px;line-height:1.45;margin-bottom:7px;color:var(--ink)}
@media (max-width:820px){.sprint-columns{grid-template-columns:1fr}.sprint-risks{grid-template-columns:1fr}}
`;
}
