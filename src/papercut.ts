import type { StoryScene, StoryCharacter, StoryProp, StylePreset } from './types.js';
import { esc } from './page/common.js';

interface Pt {
  x: number;
  y: number;
}

function character(kind: StoryCharacter, at: Pt, p: StylePreset['palette'], id: string, flip = false): string {
  const transform = `translate(${at.x} ${at.y})${flip ? ' scale(-1 1)' : ''}`;
  const ink = p.ink;
  const cream = p.surface;
  if (kind === 'farmer') {
    const ink = p.ink;
    const cream = p.surface;
    return `<g transform="${transform}" filter="url(#pc-cut-${id})"><ellipse cx="0" cy="42" rx="34" ry="8" fill="${ink}" opacity=".14"/><rect x="-20" y="4" width="40" height="44" rx="8" fill="${p.accent3}"/><rect x="-20" y="27" width="40" height="21" rx="6" fill="${p.deep}"/><path d="M-24 18h48M-14 8v19M14 8v19" stroke="${p.surface}" stroke-width="2" opacity=".55"/><circle cx="0" cy="-14" r="18" fill="${cream}" stroke="${ink}" stroke-width="1.4"/><path d="M-26-18h52l-8-14h-36Z" fill="${p.accent4}"/><path d="M-14-14h28" stroke="${ink}" stroke-width="3"/><circle cx="-7" cy="-13" r="1.8" fill="${ink}"/><circle cx="7" cy="-13" r="1.8" fill="${ink}"/><path d="M-14 44v10M14 44v10" stroke="${ink}" stroke-width="3" opacity=".6"/></g>`;
  }
  if (kind === 'bird') {
    return `<g transform="${transform} scale(1.55)"><g class="pc-bird"><path d="M-22 8c14-18 32-18 44 0-15-8-29-8-44 0Z" fill="${p.accent2}"/><circle cx="14" cy="-2" r="4" fill="${ink}"/><path d="M22 0l10 4-10 4" fill="${p.accent4}"/></g></g>`;
  }
  if (kind === 'child') {
    return `<g transform="${transform}"><rect x="-14" y="8" width="28" height="34" rx="8" fill="${p.accent}"/><circle cx="0" cy="-8" r="15" fill="${cream}" stroke="${ink}" stroke-width="1.4"/><path d="M-15 -9c2-14 26-16 31-2" fill="${p.deep}"/><circle cx="-5" cy="-9" r="1.8" fill="${ink}"/><circle cx="6" cy="-9" r="1.8" fill="${ink}"/></g>`;
  }
  const fur = kind === 'fox' ? p.accent : kind === 'cat' ? p.deep : p.surface;
  const ear = kind === 'rabbit' ? `<ellipse cx="-9" cy="-38" rx="6" ry="23" fill="${fur}" transform="rotate(-12 -9 -38)"/><ellipse cx="10" cy="-38" rx="6" ry="23" fill="${fur}" transform="rotate(13 10 -38)"/><ellipse cx="-9" cy="-38" rx="2.5" ry="15" fill="${p.accent3}" transform="rotate(-12 -9 -38)"/><ellipse cx="10" cy="-38" rx="2.5" ry="15" fill="${p.accent3}" transform="rotate(13 10 -38)"/>` : kind === 'fox' ? `<path d="M-24 -18 6-42l7 22Z" fill="${fur}"/><path d="M24 -18 6-42l-7 22Z" fill="${fur}"/>` : `<path d="M-24 -16 6-38l7 22Z" fill="${fur}"/><path d="M24 -16 6-38l-7 22Z" fill="${fur}"/>`;
  const tail = kind === 'rabbit' ? `<circle cx="34" cy="22" r="11" fill="${cream}"/>` : kind === 'fox' ? `<path d="M28 24c24-2 28-22 18-30-2 16-10 18-22 16Z" fill="${fur}"/>` : `<path d="M26 24c26 4 32-18 18-28-2 14-10 18-20 16Z" fill="${fur}"/>`;
  return `<g transform="${transform}" filter="url(#pc-cut-${id})">
    <ellipse cx="0" cy="36" rx="34" ry="9" fill="${ink}" opacity=".14"/>
    ${tail}${ear}
    <ellipse cx="0" cy="17" rx="27" ry="29" fill="${fur}"/>
    <circle cx="0" cy="-13" r="21" fill="${fur}"/>
    <ellipse cx="2" cy="3" rx="13" ry="10" fill="${cream}" opacity=".85"/>
    <circle cx="-8" cy="-16" r="2.2" fill="${ink}"/><circle cx="8" cy="-16" r="2.2" fill="${ink}"/>
    <path d="M-3 -8h6l-3 4Z" fill="${p.accent2}"/><path d="M-7 27v11M8 27v11" stroke="${ink}" stroke-width="2" stroke-linecap="round" opacity=".5"/>
  </g>`;
}

function prop(kind: StoryProp, at: Pt, p: StylePreset['palette'], id: string): string {
  const t = `translate(${at.x} ${at.y})`;
  if (kind === 'pine') {
    return `<g transform="${t}" filter="url(#pc-cut-${id})"><rect x="-6" y="38" width="12" height="32" fill="${p.deep}"/><path d="M0-62 40 0H-40Z" fill="${p.deep}"/><path d="M0-34 50 28H-50Z" fill="${p.deep}"/><path d="M0-2 58 62H-58Z" fill="${p.deep}"/><path d="M-2-58 10 0" stroke="${p.accent2}" stroke-width="2" opacity=".5"/></g>`;
  }
  if (kind === 'tree') {
    return `<g transform="${t}" filter="url(#pc-cut-${id})"><rect x="-7" y="28" width="14" height="42" fill="${p.deep}"/><circle cx="0" cy="-10" r="38" fill="${p.deep}"/><circle cx="-26" cy="6" r="24" fill="${p.deep}"/><circle cx="26" cy="6" r="24" fill="${p.deep}"/><circle cx="-10" cy="-8" r="13" fill="${p.accent2}" opacity=".55"/></g>`;
  }
  if (kind === 'house') {
    return `<g transform="${t}" filter="url(#pc-cut-${id})"><rect x="-52" y="-12" width="104" height="76" rx="4" fill="${p.surface}"/><path d="M-66-12 0-60l66 48Z" fill="${p.accent}"/><rect x="-12" y="22" width="24" height="42" fill="${p.accent3}"/><rect x="-42" y="4" width="20" height="20" fill="${p.accent4}"/></g>`;
  }
  if (kind === 'gate') {
    return `<g transform="${t}" filter="url(#pc-cut-${id})"><path d="M-44 50V-4M44 50V-4M-44 0c22-34 66-34 88 0" fill="none" stroke="${p.deep}" stroke-width="7"/><path d="M-40 20h80" stroke="${p.deep}" stroke-width="4"/></g>`;
  }
  if (kind === 'table') {
    return `<g transform="${t}" filter="url(#pc-cut-${id})"><ellipse cx="0" cy="8" rx="54" ry="18" fill="${p.accent4}"/><rect x="-5" y="10" width="10" height="40" fill="${p.deep}"/><rect x="-28" y="46" width="56" height="6" rx="3" fill="${p.deep}"/></g>`;
  }
  if (kind === 'lantern') {
    return `<g transform="${t}" filter="url(#pc-cut-${id})"><path d="M-16 20h32l-6 24h-20Z" fill="${p.accent4}"/><path d="M-12-6h24M0-6v26" stroke="${p.ink}" stroke-width="3"/><circle cx="0" cy="32" r="13" fill="${p.accent4}" opacity=".4"/></g>`;
  }
  if (kind === 'basket') {
    return `<g transform="${t}" filter="url(#pc-cut-${id})"><path d="M-30 0h60l-8 28h-44Z" fill="${p.accent}"/><path d="M-18 0c0-26 36-26 36 0" fill="none" stroke="${p.ink}" stroke-width="4"/></g>`;
  }
  if (kind === 'cabbage') {
    return `<g transform="${t}" filter="url(#pc-cut-${id})"><ellipse cx="0" cy="14" rx="23" ry="8" fill="${p.ink}" opacity=".12"/><circle cx="0" cy="0" r="22" fill="${p.accent2}"/><circle cx="-10" cy="-4" r="13" fill="${p.surface}" opacity=".6"/><circle cx="10" cy="2" r="10" fill="${p.accent3}" opacity=".7"/><path d="M0-20c-8 8-8 18 0 26 8-8 8-18 0-26Z" fill="${p.surface}" opacity=".55"/></g>`;
  }
  if (kind === 'fence') {
    return `<g transform="${t}" filter="url(#pc-cut-${id})"><path d="M-50 20h100M-42 34h84" stroke="${p.deep}" stroke-width="6"/><path d="M-38 0v46M-14 0v46M10 0v46M34 0v46" stroke="${p.deep}" stroke-width="5"/><path d="M-38 0l4-8 4 8M-14 0l4-8 4 8M10 0l4-8 4 8M34 0l4-8 4 8" fill="${p.deep}"/></g>`;
  }
  if (kind === 'wheelbarrow') {
    return `<g transform="${t}" filter="url(#pc-cut-${id})"><path d="M-38 8h64l-12 30h-40Z" fill="${p.accent}"/><circle cx="-12" cy="42" r="14" fill="${p.deep}"/><circle cx="-12" cy="42" r="5" fill="${p.surface}"/><path d="M26 12 58-4M50 8l10 4" stroke="${p.deep}" stroke-width="5"/></g>`;
  }
  if (kind === 'boat') {
    return `<g transform="${t}" filter="url(#pc-cut-${id})"><path d="M-58 0h116l-18 28h-80Z" fill="${p.accent}"/><path d="M0-4V-72l42 68Z" fill="${p.surface}"/><path d="M-6-4V-60l-34 56Z" fill="${p.accent2}"/></g>`;
  }
  return `<g transform="${t}" filter="url(#pc-cut-${id})"><g class="pc-sway">${[0, 1, 2].map((i) => `<circle cx="${(i - 1) * 18}" cy="${-i * 5}" r="7" fill="${i % 2 ? p.accent3 : p.accent4}"/><path d="M${(i - 1) * 18} 8v22" stroke="${p.accent2}" stroke-width="3"/>`).join('')}</g>`;
}

function defaultProps(kind: StoryScene['kind']): StoryProp[] {
  if (kind === 'forest') return ['pine', 'pine', 'pine', 'tree'];
  if (kind === 'garden') return ['cabbage', 'cabbage', 'cabbage', 'fence', 'wheelbarrow'];
  if (kind === 'house') return ['house', 'tree', 'flowers'];
  if (kind === 'river') return ['boat', 'tree', 'flowers'];
  if (kind === 'market') return ['house', 'basket', 'table'];
  if (kind === 'room') return ['table', 'lantern', 'flowers'];
  if (kind === 'night') return ['pine', 'pine', 'lantern'];
  return ['pine', 'tree', 'flowers'];
}

export function papercutScene(preset: StylePreset, scene: StoryScene = {}, index = 0): string {
  const p = preset.palette;
  const id = `pc-${index}`;
  const kind = scene.kind ?? 'meadow';
  const defaultCharacters: StoryCharacter[] = kind === 'garden' ? ['rabbit', 'bird'] : ['rabbit'];
  const characters: StoryCharacter[] = (scene.characters?.length ? scene.characters : defaultCharacters).slice(0, 4);
  const props = (scene.props?.length ? scene.props : defaultProps(kind)).slice(0, 6);
  const night = kind === 'night';
  const sky = night ? p.deep : p.accent3;
  const far = night ? p.muted : p.accent2;
  const ground = night ? p.ink : p.accent2;
  const sun = night ? p.surface : p.accent4;
  const stars = night
    ? Array.from({ length: 14 }, (_, i) => `<circle cx="${90 + ((i * 97) % 650)}" cy="${38 + ((i * 61) % 180)}" r="${1 + (i % 3)}" fill="${p.surface}" opacity=".8"/>`).join('')
    : '';
  const clouds = night
    ? `<ellipse cx="240" cy="90" rx="70" ry="18" fill="${p.surface}" opacity=".18"/><ellipse cx="550" cy="130" rx="95" ry="22" fill="${p.surface}" opacity=".12"/>`
    : `<g class="pc-cloud" fill="${p.surface}" opacity=".85"><ellipse cx="180" cy="96" rx="70" ry="22"/><ellipse cx="240" cy="86" rx="48" ry="18"/><ellipse cx="560" cy="120" rx="86" ry="24"/><ellipse cx="620" cy="110" rx="42" ry="16"/></g>`;
  const groundPositions: Pt[] = [
    { x: 245, y: 390 },
    { x: 360, y: 405 },
    { x: 470, y: 400 },
    { x: 575, y: 410 },
  ];
  const skyPositions: Pt[] = [
    { x: 330, y: 170 },
    { x: 475, y: 120 },
    { x: 590, y: 195 },
    { x: 250, y: 110 },
  ];
  const positions = characters.map((kind, i) => (kind === 'bird' ? skyPositions[i] ?? skyPositions[0]! : groundPositions[i] ?? groundPositions[0]!));
  const cast = characters.map((characterKind, i) => character(characterKind, positions[i] ?? positions[0]!, p, id, i % 2 === 1)).join('');
  const propPositions: Record<StoryProp, Pt> = {
    pine: { x: 130, y: 315 },
    tree: { x: 675, y: 320 },
    house: { x: 640, y: 300 },
    gate: { x: 600, y: 350 },
    table: { x: 620, y: 390 },
    lantern: { x: 700, y: 350 },
    basket: { x: 290, y: 405 },
    flowers: { x: 180, y: 410 },
    boat: { x: 610, y: 390 },
    cabbage: { x: 190, y: 420 },
    fence: { x: 630, y: 330 },
    wheelbarrow: { x: 470, y: 410 },
  };
  const scenery = props.map((kind, i) => {
    const same = props.slice(0, i).filter((item) => item === kind).length;
    const total = props.filter((item) => item === kind).length;
    const base = propPositions[kind];
    const x = base.x + (same - (total - 1) / 2) * 105;
    const y = base.y - (i % 2) * 18;
    return prop(kind, { x, y }, p, id);
  }).join('');
  const hills = kind === 'river'
    ? `<path d="M0 300c120-30 200 20 300-8s210-10 500 8v200H0Z" fill="${far}"/><path d="M0 345c160-30 280 22 430-8s230 0 370 14v149H0Z" fill="${ground}"/><g stroke="${p.surface}" stroke-width="2" opacity=".55"><path d="M150 390h130M430 375h180M620 420h90"/></g>`
    : kind === 'garden'
      ? `<rect y="270" width="800" height="230" fill="${p.accent2}"/><rect y="320" width="800" height="180" fill="${p.muted}"/><g stroke="${p.accent2}" stroke-width="2" opacity=".55">${[0, 1, 2, 3, 4].map((i) => `<path d="M40 ${360 + i * 26}h720"/>`).join('')}</g><path d="M0 320c160-18 260 8 400-4s260 6 400 10" fill="none" stroke="${p.surface}" stroke-width="2" opacity=".45"/>`
    : kind === 'room'
      ? `<rect y="300" width="800" height="200" fill="${p.surface}"/><rect x="70" y="55" width="220" height="185" rx="6" fill="${p.accent3}"/><path d="M180 55v185M70 150h220" stroke="${p.surface}" stroke-width="8"/>`
      : `<path d="M0 300c130-45 220 25 330-5s240-20 470 12v193H0Z" fill="${far}"/><path d="M0 355c160-30 260 20 400-5s260 8 400 18v132H0Z" fill="${ground}"/>`;
  return `<svg viewBox="0 0 800 500" role="img" aria-label="${esc(scene.caption || sceneLabel(kind, characters))}" preserveAspectRatio="xMidYMid slice">
    <style>.pc-cloud{animation:pc-cloud 26s ease-in-out infinite alternate}.pc-bird{animation:pc-bird 7s ease-in-out infinite alternate}.pc-sway{animation:pc-sway 6s ease-in-out infinite alternate}@keyframes pc-cloud{to{transform:translateX(18px)}}@keyframes pc-bird{to{transform:translateY(-7px)}}@keyframes pc-sway{to{transform:rotate(1.5deg)}}@media(prefers-reduced-motion:reduce){.pc-cloud,.pc-bird,.pc-sway{animation:none!important}}</style>
    <defs>
      <filter id="pc-paper-${id}" x="-8%" y="-8%" width="116%" height="126%"><feTurbulence baseFrequency=".035" numOctaves="2" seed="${24 + index}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3"/></filter>
      <filter id="pc-cut-${id}" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="1" dy="4" stdDeviation="1.8" flood-color="${p.ink}" flood-opacity=".26"/></filter>
      <filter id="pc-grain-${id}"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="${index + 7}"/><feColorMatrix type="saturate" values="0"/></filter>
    </defs>
    <rect width="800" height="500" fill="${sky}"/>
    <g filter="url(#pc-paper-${id})">
      ${clouds}${stars}
      <circle cx="${kind === 'room' ? 720 : 680}" cy="86" r="42" fill="${sun}" opacity="${night ? '.9' : '.95'}"/>
      ${hills}
      <path d="M0 300c130-45 220 25 330-5s240-20 470 12" fill="none" stroke="${p.surface}" stroke-width="2" opacity=".45"/>
      ${scenery}
      <g fill="none" stroke="${p.surface}" stroke-width="2" opacity=".7"><path d="M40 430c16-24 30-24 46 0M700 450c14-22 28-22 42 0M350 455c12-20 24-20 36 0"/></g>
      ${cast}
      <rect width="800" height="500" filter="url(#pc-grain-${id})" opacity=".045"/>
    </g>
  </svg>`;
}

function sceneLabel(kind: StoryScene['kind'], characters: StoryCharacter[]): string {
  const cast = characters.join(', ');
  return `${kind ?? 'meadow'} · ${cast}`;
}
