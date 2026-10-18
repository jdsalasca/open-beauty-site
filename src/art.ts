import type { StylePreset } from './types.js';
import { esc } from './page/common.js';

/**
 * Original inline scenes for experiences and stories. Each style has a
 * different composition, not a recolour of the same orbit.
 * The SVG uses only palette roles; the validator sees those hex values.
 */
export type SceneSubject = 'table' | 'vitrine' | 'river' | 'house' | 'stage' | 'plant' | 'window' | 'none';


function subjectMark(subject: SceneSubject, preset: StylePreset): string {
  const p = preset.palette;
  const lw = Math.max(2, preset.rules.borderWidths[0] || 2);
  const line = p.accent;
  const soft = p.accent2;
  switch (subject) {
    case 'table':
      return `<g transform="translate(400 610)" fill="none" stroke="${line}" stroke-width="${lw}" opacity=".9"><ellipse rx="110" ry="42"/><ellipse rx="78" ry="28" stroke="${soft}"/><path d="M145-40v96M160-40v96M180-30l10 70" /><path d="M-170-20h30v58a12 12 0 0 0 24 0V-20h30" stroke="${soft}"/></g>`;
    case 'vitrine':
      return `<g transform="translate(400 560)" fill="none" stroke="${line}" stroke-width="${lw}" opacity=".9"><path d="M-100 120h200M-80 120V-100M80 120V-100M-100-100h200V90H-100Z"/><circle cx="0" cy="-18" r="38" fill="${soft}" stroke="none" opacity=".75"/><path d="M-55 50h110" stroke="${soft}"/></g>`;
    case 'river':
      return `<g transform="translate(400 620)" fill="none" stroke="${line}" stroke-width="${lw}" opacity=".9"><path d="M-300 30c70-80 140 40 210-20s150-60 210 10 100 10 180-40"/><path d="M-300 58c70-80 140 40 210-20s150-60 210 10 100 10 180-40" stroke="${soft}" opacity=".7"/><path d="M-210-30v30M-60-15v30M90-30v30M240-45v30" stroke="${soft}" opacity=".8"/></g>`;
    case 'house':
      return `<g transform="translate(400 590)" fill="none" stroke="${line}" stroke-width="${lw}" opacity=".9"><path d="M-105 90V-40L0-125 105-40V90Z"/><path d="M-22 90V18h44v72" stroke="${soft}"/><path d="M-150 90h300" stroke="${soft}" opacity=".65"/></g>`;
    case 'stage':
      return `<g transform="translate(400 620)" fill="none" stroke="${line}" stroke-width="${lw}" opacity=".85"><path d="M-180 60a180 180 0 0 1 360 0"/><path d="M-120 60V-20M120 60V-20M0 60V-60" stroke="${soft}"/><circle cx="0" cy="-60" r="16" fill="${soft}" stroke="none"/></g>`;
    case 'plant':
      return `<g transform="translate(400 610)" fill="none" stroke="${line}" stroke-width="${lw}" opacity=".9"><path d="M0 90V-90M0-20c-55-5-82-45-82-82 55 5 82 45 82 82ZM0 20c55-5 82-45 82-82-55 5-82 45-82 82Z" stroke="${soft}"/><path d="M-70 90h140"/></g>`;
    case 'window':
      return `<g transform="translate(400 560)" fill="none" stroke="${line}" stroke-width="${lw}" opacity=".85"><path d="M-130-90h260v260H-130Z"/><path d="M-130 0h260M0-90v260" stroke="${soft}"/><circle cx="70" cy="-35" r="24" fill="${soft}" stroke="none" opacity=".55"/></g>`;
    default:
      return '';
  }
}

export function sceneArt(preset: StylePreset, index = 1, caption?: string, subject: SceneSubject = 'none'): string {
  const p = preset.palette;
  const n = Math.abs(index) % 3;
  const label = esc((caption || '').split('·')[0]?.trim().slice(0, 18));
  const svg = (() => {
    switch (preset.slug) {
      case 'renaissance':
        return `<svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="800" height="800" fill="${p.bg}"/>
          <path d="M110 760V342c0-170 130-300 290-300s290 130 290 300v418" fill="${n === 1 ? p.accent3 : p.surface}" stroke="${p.accent}" stroke-width="2"/>
          <circle cx="${n === 2 ? 530 : 455}" cy="330" r="92" fill="${p.accent2}"/>
          <g stroke="${p.accent}" stroke-width="2" opacity=".75">${Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const x1 = 455 + Math.cos(a) * 112;
            const y1 = 330 + Math.sin(a) * 112;
            const x2 = 455 + Math.cos(a) * 136;
            const y2 = 330 + Math.sin(a) * 136;
            return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
          }).join('')}</g>
          <path d="M110 610c90-50 160-50 240 0s160 48 240-2 90-28 110-16v168H110Z" fill="${p.accent3}" opacity=".9"/>
          <path d="M110 650c90-38 160-38 240 2s160 38 240-4 90-18 110-10v162H110Z" fill="${p.surface}" opacity=".8"/>
          <g stroke="${p.muted}" stroke-width="1.2" fill="none" opacity=".65">
            <path d="M300 280c20-16 40-16 60 0M390 250c16-12 32-12 48 0"/>
            <path d="M180 700c0-40 10-75 28-100M210 700c0-52 20-88 44-112"/>
          </g>
          <g fill="${p.accent4}"><path d="M620 640c0-55 12-100 34-135 22 35 34 80 34 135Z"/><path d="M680 640c0-38 9-70 24-98 15 28 24 60 24 98Z"/></g>
          <circle cx="665" cy="735" r="7" fill="${p.accent}"/>
        </svg>`;
      case 'brutalist':
        return `<svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="800" height="800" fill="${p.bg}"/>
          <defs><pattern id="bgrid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="${p.ink}" stroke-width="1" opacity=".18"/></pattern></defs>
          <rect width="800" height="800" fill="url(#bgrid)"/>
          <rect x="70" y="84" width="390" height="270" fill="${p.ink}"/>
          <rect x="70" y="84" width="390" height="24" fill="${p.accent}"/>
          <text x="96" y="260" font-family="Archivo Black, sans-serif" font-size="150" fill="${p.bg}">01</text>
          <circle cx="${n === 1 ? 560 : 610}" cy="300" r="150" fill="${p.accent}"/>
          <rect x="430" y="430" width="300" height="34" fill="${p.accent2}" transform="rotate(-8 430 430)"/>
          <rect x="90" y="500" width="620" height="8" fill="${p.ink}"/>
          <path d="M90 650h210v110H90zM320 600h150v160H320zM490 670h200v90H490z" fill="${p.ink}"/>
          <path d="M610 560 690 480 770 560 690 640Z" fill="${p.accent}"/>
          <text x="90" y="765" font-family="Space Mono, monospace" font-size="18" letter-spacing="4" fill="${p.ink}">OPEN / BEAUTY / 2026</text>
        </svg>`;
      case 'papercraft':
        return `<svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="800" height="800" fill="${p.bg}"/>
          <circle cx="200" cy="330" r="190" fill="${p.accent3}" opacity=".55"/>
          <g transform="rotate(-7 410 360)"><rect x="190" y="170" width="430" height="360" rx="28" fill="${p.surface}" stroke="${p.ink}" stroke-width="1.2"/><rect x="235" y="245" width="340" height="200" rx="12" fill="${p.bg}"/><circle cx="405" cy="345" r="58" fill="${p.accent2}"/><path d="M235 410c70-40 120-40 190 0s170 34 250-10v45H235Z" fill="${p.accent3}"/></g>
          <g transform="rotate(5 560 520)"><rect x="470" y="400" width="210" height="160" rx="18" fill="${p.accent2}" stroke="${p.ink}" stroke-width="1.2"/><circle cx="575" cy="470" r="38" fill="${p.bg}"/><path d="M575 432c14 0 26 8 26 20s-12 20-26 20-26-8-26-20 12-20 26-20Z" fill="${p.accent4}"/></g>
          <rect x="300" y="160" width="92" height="24" rx="3" fill="${p.accent}" transform="rotate(-4 300 160)"/>
          <path d="M0 700c150-100 300 40 450-30s260-30 350 25v105H0Z" fill="${p.accent3}"/>
          <path d="M0 735c150-70 300 25 450-10s260-20 350 20v55H0Z" fill="${p.accent}" opacity=".5"/>
          <g fill="${p.accent4}"><circle cx="130" cy="130" r="8"/><circle cx="700" cy="180" r="5"/><rect x="690" y="690" width="18" height="18" transform="rotate(15 690 690)"/></g>
        </svg>`;
      case 'artdeco':
        return `<svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="800" height="800" fill="${p.bg}"/>
          <g stroke="${p.accent}" fill="none" opacity=".8">${Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return `<line x1="400" y1="390" x2="${(400 + Math.cos(a) * 310).toFixed(1)}" y2="${(390 + Math.sin(a) * 310).toFixed(1)}" stroke-width="${i % 2 ? 1 : 2}"/>`;
          }).join('')}</g>
          <circle cx="400" cy="390" r="120" fill="${p.bg}" stroke="${p.accent}" stroke-width="2"/>
          <circle cx="400" cy="390" r="74" fill="${n === 1 ? p.accent2 : p.surface}" stroke="${p.accent}" stroke-width="1.2"/>
          <path d="M330 690V540h40v-50h30v50h40v-90h40v90h40v-50h30v50h40v150Z" fill="${p.deep}" stroke="${p.accent}" stroke-width="1.2"/>
          <g fill="${p.accent}"><rect x="150" y="160" width="18" height="18"/><rect x="632" y="160" width="18" height="18"/><rect x="150" y="622" width="18" height="18"/><rect x="632" y="622" width="18" height="18"/></g>
          <path d="M90 90h620v620H90Z" fill="none" stroke="${p.accent}" stroke-width="1" opacity=".7"/>
          <path d="M110 110h580v580H110Z" fill="none" stroke="${p.accent}" stroke-width="1" opacity=".45"/>
        </svg>`;
      case 'isotype':
        return `<svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="800" height="800" fill="${p.bg}"/>
          <g stroke="${p.muted}" stroke-width="1" opacity=".4"><path d="M0 170h800M0 300h800M0 430h800M0 560h800M0 690h800"/><path d="M120 0v800M250 0v800M380 0v800M510 0v800M640 0v800"/></g>
          <text x="60" y="96" font-family="Jost, sans-serif" font-size="28" letter-spacing="4" fill="${p.ink}">${esc(label || 'ARCHIVO / SERIE 01')}</text>
          <g fill="${p.accent}">${Array.from({ length: 7 }, (_, i) => `<path d="M70 ${220 + i * 62}h44v44H70z"/><path d="M88 ${214 + i * 62}l14-18 14 18Z"/>`).join('')}</g>
          <g fill="${p.accent2}">${Array.from({ length: 4 }, (_, i) => `<circle cx="${360 + i * 54}" cy="250" r="18"/>`).join('')}</g>
          <g fill="${p.accent3}">${Array.from({ length: 5 }, (_, i) => `<rect x="${390 + i * 44}" y="390" width="26" height="70"/>`).join('')}</g>
          <rect x="350" y="540" width="330" height="120" fill="none" stroke="${p.ink}" stroke-width="2"/>
          <text x="370" y="620" font-family="Jost, sans-serif" font-size="64" font-weight="700" fill="${p.ink}">68%</text>
          <text x="370" y="648" font-family="IBM Plex Sans, sans-serif" font-size="16" letter-spacing="2" fill="${p.muted}">SERIE / 01</text>
          <path d="M60 740h680" stroke="${p.accent}" stroke-width="8"/>
        </svg>`;
      case 'opart':
        return `<svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="800" height="800" fill="${p.bg}"/>
          <defs><pattern id="opcheck" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="${p.bg}"/><rect x="20" y="20" width="20" height="20" fill="${p.ink}"/></pattern></defs>
          <rect width="800" height="800" fill="url(#opcheck)" opacity=".9"/>
          <g fill="${p.accent}"><circle cx="400" cy="400" r="250"/><circle cx="400" cy="400" r="200" fill="${p.bg}"/><circle cx="400" cy="400" r="150" fill="${p.accent}"/><circle cx="400" cy="400" r="100" fill="${p.bg}"/><circle cx="400" cy="400" r="50" fill="${p.ink}"/></g>
          <g stroke="${p.bg}" stroke-width="12" opacity=".9"><path d="M0 400h800M400 0v800" transform="rotate(${n * 15} 400 400)"/></g>
          <text x="400" y="760" text-anchor="middle" font-family="Archivo Black, sans-serif" font-size="22" letter-spacing="8" fill="${p.bg}">MIRÁ / OTRA VEZ</text>
        </svg>`;
      case 'ukiyoe':
        return `<svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="800" height="800" fill="${p.bg}"/>
          <circle cx="${n === 2 ? 280 : 590}" cy="230" r="95" fill="${p.accent2}"/>
          <path d="M0 560c80-25 140-25 210 4s150 15 220-18 150-35 230-3 100 22 140 10v247H0Z" fill="${p.accent}"/>
          <path d="M0 620c100-45 180 12 260-8s160-55 250-12 170 25 290-10v210H0Z" fill="${p.surface}" opacity=".9"/>
          <path d="M0 690c80-25 150 4 230-8s170-32 250 3 190 20 320-8v123H0Z" fill="${p.accent}" opacity=".7"/>
          <g fill="${p.bg}" opacity=".8">${Array.from({ length: 28 }, (_, i) => {
            const x = 40 + i * 27;
            const y = 580 + (i % 5) * 14;
            return `<circle cx="${x}" cy="${y}" r="${2 + (i % 3)}"/>`;
          }).join('')}</g>
          <path d="M540 520c-40-30-48-90-18-120 18-18 48-18 66 0 12 12 16 30 12 48" fill="none" stroke="${p.ink}" stroke-width="3"/>
          <rect x="650" y="120" width="34" height="120" fill="${p.accent2}"/>
          <text x="667" y="196" text-anchor="middle" font-family="Shippori Mincho B1, serif" font-size="24" fill="${p.bg}" transform="rotate(90 667 196)">浮世</text>
        </svg>`;
      case 'bestiary':
        return `<svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="800" height="800" fill="${p.bg}"/>
          <path d="M130 120h540v560H130Z" fill="none" stroke="${p.accent}" stroke-width="1"/>
          <path d="M170 170h460v460H170Z" fill="none" stroke="${p.accent}" stroke-width="1" opacity=".5"/>
          <g fill="${p.ink}"><path d="M270 520c-35-45-25-130 45-170 52-30 130-20 165 30 28 40 22 100-8 130l38 40-40 35-34-36c-40 20-90 18-126-6l-24 34-30-32Z"/><path d="M300 330c-20-45 0-75 25-95 15 30 18 55 10 85Z"/></g>
          <circle cx="430" cy="405" r="24" fill="${p.bg}"/><circle cx="430" cy="405" r="11" fill="${p.accent2}"/>
          <path d="M320 470c30 18 62 22 96 10" fill="none" stroke="${p.bg}" stroke-width="4"/>
          <g fill="${p.accent2}"><path d="M590 600c0-50 18-90 48-120 16 32 22 72 16 120Z"/><path d="M640 600c0-34 12-60 32-82 10 24 14 52 10 82Z"/></g>
          <rect x="150" y="610" width="60" height="60" fill="${p.accent3}"/><text x="180" y="654" text-anchor="middle" font-family="UnifrakturMaguntia, serif" font-size="42" fill="${p.bg}">B</text>
          <path d="M560 180c40-28 80-28 120 0" fill="none" stroke="${p.accent}" stroke-width="1.5"/>
        </svg>`;
      case 'psychedelic':
        return `<svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="800" height="800" fill="${p.bg}"/>
          <path d="M-80 260C80 60 250 80 360 220s190 160 300 40 180-80 240 60v300c-100-120-200-130-310-10S390 760 260 650 20 620-80 720Z" fill="${p.accent}"/>
          <path d="M-60 600c120-160 230-170 340-40s190 120 300 0 170-100 270 20v220H-60Z" fill="${p.accent2}" opacity=".9"/>
          <g fill="none" stroke="${p.bg}" stroke-width="2" opacity=".8">${Array.from({ length: 9 }, (_, i) => `<circle cx="410" cy="390" r="${60 + i * 38}"/>`).join('')}</g>
          <g fill="${p.accent3}">${Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2;
            return `<circle cx="${(410 + Math.cos(a) * 300).toFixed(1)}" cy="${(390 + Math.sin(a) * 300).toFixed(1)}" r="7"/>`;
          }).join('')}</g>
          <path d="M400 240l30 100 100 30-100 30-30 100-30-100-100-30 100-30Z" fill="${p.bg}" opacity=".9"/>
        </svg>`;
      case 'memphis':
        return `<svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="800" height="800" fill="${p.bg}"/>
          <g fill="none" stroke="${p.ink}" stroke-width="2" opacity=".25"><path d="M0 100h800M0 300h800M0 500h800M0 700h800M100 0v800M300 0v800M500 0v800M700 0v800"/></g>
          <g transform="translate(400 390)">
            <rect x="-180" y="-160" width="360" height="320" fill="${p.surface}" stroke="${p.ink}" stroke-width="4"/>
            <circle cx="-70" cy="-40" r="70" fill="${p.accent}" stroke="${p.ink}" stroke-width="3"/>
            <path d="M40-110h120v120H40Z" fill="${p.accent3}" stroke="${p.ink}" stroke-width="3" transform="rotate(12 100 -50)"/>
            <path d="M-150 120c40-80 80 80 120 0s80 80 120 0" fill="none" stroke="${p.accent2}" stroke-width="16"/>
            <path d="M80 30l50 80H30Z" fill="${p.accent2}" stroke="${p.ink}" stroke-width="3"/>
          </g>
          <g fill="${p.accent2}"><circle cx="110" cy="650" r="22"/><circle cx="700" cy="150" r="16"/><circle cx="650" cy="680" r="26"/></g>
          <path d="M60 120l60-50 60 50-60 50Z" fill="${p.accent}" stroke="${p.ink}" stroke-width="3"/>
          <path d="M620 560c40 0 40-50 80-50s40 50 80 50" fill="none" stroke="${p.ink}" stroke-width="8"/>
        </svg>`;
      case 'vaporwave':
        return `<svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="800" height="800" fill="${p.bg}"/>
          <defs><linearGradient id="vsun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.accent3}"/><stop offset="1" stop-color="${p.accent2}"/></linearGradient></defs>
          <circle cx="400" cy="330" r="190" fill="url(#vsun)"/>
          <g fill="${p.bg}" opacity=".8">${Array.from({ length: 9 }, (_, i) => `<rect x="210" y="${240 + i * 24}" width="380" height="${6 + i * 2}"/>`).join('')}</g>
          <path d="M0 560h800v240H0Z" fill="${p.deep}"/>
          <g stroke="${p.accent}" stroke-width="1.5" opacity=".7">${Array.from({ length: 11 }, (_, i) => `<path d="M400 540 ${60 + i * 68} 800"/>`).join('')}${Array.from({ length: 7 }, (_, i) => `<path d="M0 ${570 + i * 34}h800"/>`).join('')}</g>
          <g transform="translate(170 120)"><rect width="460" height="190" fill="${p.surface}" stroke="${p.ink}" stroke-width="2"/><rect width="460" height="30" fill="${p.accent2}"/><text x="18" y="22" font-family="'Press Start 2P', monospace" font-size="10" fill="${p.ink}">MI_MUSEO.EXE</text><g fill="${p.bg}" stroke="${p.ink}" stroke-width="1"><rect x="390" y="7" width="16" height="16"/><rect x="412" y="7" width="16" height="16"/><rect x="434" y="7" width="16" height="16"/></g><text x="20" y="75" font-family="'Press Start 2P', monospace" font-size="9" fill="${p.ink}">C:\\MUSEO\\COSAS_PEQUENAS</text></g>
        </svg>`;
      case 'galactic':
        return `<svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="800" height="800" fill="${p.bg}"/>
          <g fill="${p.ink}">${Array.from({ length: 70 }, (_, i) => {
            const x = (i * 137) % 760 + 20;
            const y = (i * 223) % 700 + 40;
            return `<circle cx="${x}" cy="${y}" r="${i % 9 === 0 ? 2.2 : 1}" opacity="${i % 3 ? 0.8 : 0.35}"/>`;
          }).join('')}</g>
          <g fill="none" stroke="${p.accent}" opacity=".45"><ellipse cx="420" cy="390" rx="300" ry="120" transform="rotate(-18 420 390)"/><ellipse cx="420" cy="390" rx="250" ry="90" transform="rotate(24 420 390)"/><ellipse cx="420" cy="390" rx="210" ry="150" transform="rotate(62 420 390)"/></g>
          <defs><radialGradient id="gplanet" cx="34%" cy="28%" r="72%"><stop offset="0" stop-color="${p.accent2}"/><stop offset=".65" stop-color="${p.accent3}"/><stop offset="1" stop-color="${p.deep}"/></radialGradient></defs>
          <circle cx="${n === 1 ? 500 : 420}" cy="390" r="150" fill="url(#gplanet)"/>
          <ellipse cx="420" cy="390" rx="300" ry="42" fill="none" stroke="${p.accent}" stroke-width="2" transform="rotate(-18 420 390)"/>
          <circle cx="660" cy="240" r="14" fill="${p.accent3}"/>
          <text x="400" y="760" text-anchor="middle" font-family="Michroma, sans-serif" font-size="16" letter-spacing="9" fill="${p.muted}">${esc(label || 'MEMORIA / ORBITAL')}</text>
        </svg>`;
      case 'nature':
        return `<svg viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect width="800" height="800" fill="${p.bg}"/>
          <path d="M0 640c120-50 220 30 340-20s230-30 460 20v160H0Z" fill="${p.surface}"/>
          <path d="M400 700V180" stroke="${p.ink}" stroke-width="3" fill="none"/>
          <g fill="${p.accent}" opacity=".9"><path d="M400 250c-90 0-140-55-140-125 80 0 140 55 140 125Z"/><path d="M400 330c90 0 140-55 140-125-80 0-140 55-140 125Z"/><path d="M400 420c-75 0-120-45-120-105 70 0 120 45 120 105Z"/><path d="M400 500c75 0 120-45 120-105-70 0-120 45-120 105Z"/></g>
          <g fill="none" stroke="${p.accent3}" opacity=".8"><circle cx="650" cy="640" r="72"/><circle cx="650" cy="640" r="50"/><circle cx="650" cy="640" r="28"/><circle cx="650" cy="640" r="10"/></g>
          <g fill="${p.accent2}"><circle cx="260" cy="250" r="7"/><circle cx="300" cy="286" r="4"/><circle cx="525" cy="450" r="5"/><circle cx="555" cy="410" r="3"/></g>
          <path d="M130 120h150M130 145h100" stroke="${p.muted}" stroke-width="1" opacity=".6"/>
          <text x="130" y="100" font-family="IBM Plex Mono, monospace" font-size="14" letter-spacing="3" fill="${p.muted}">${esc(label || 'HERBARIUM / FOLIO 01')}</text>
          <rect x="400" y="700" width="32" height="52" fill="${p.accent4}" opacity=".8"/>
        </svg>`;
      default:
        return `<svg viewBox="0 0 800 800"><rect width="800" height="800" fill="${p.bg}"/><circle cx="400" cy="400" r="220" fill="${p.accent}"/></svg>`;
    }
  })();
  const marked = svg.replace(/<\/svg>\s*$/, `${subjectMark(subject, preset)}</svg>`);
  return `<div class="scene-art scene-${preset.slug} scene-v${n}" aria-hidden="true">${marked}</div>`;
}
