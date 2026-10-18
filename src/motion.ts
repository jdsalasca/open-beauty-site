import type { MotionBrief, MotionScene, MotionSize, StylePreset } from './types.js';
import { esc } from './page/common.js';
import { papercutScene } from './papercut.js';
import { getStyle } from './styles/presets.js';

export const MOTION_SCENES: MotionScene[] = ['orbit', 'bloom', 'tide', 'papercut', 'constellation', 'ribbon', 'rain', 'type'];

const SIZES: Record<MotionSize, [number, number]> = {
  square: [1200, 1200],
  portrait: [1000, 1400],
  landscape: [1600, 1000],
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function words(text: string, maxChars: number): string[] {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (!clean) return [''];
  const out: string[] = [];
  let line = '';
  for (const word of clean.split(' ')) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= maxChars) line += ` ${word}`;
    else {
      out.push(line);
      line = word;
    }
  }
  if (line) out.push(line);
  return out.slice(0, 4);
}

function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((char) => char + char).join('') : value;
  const channels = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

function textOn(background: string, colors: { ink: string; surface: string }): string {
  return contrast(colors.ink, background) >= contrast(colors.surface, background) ? colors.ink : colors.surface;
}

function titleBlock(preset: StylePreset, brief: MotionBrief, w: number, h: number, scene: MotionScene, maxxing: boolean, textColor: string): string {
  const title = brief.title.trim();
  const maxChars = scene === 'type' ? 11 : w > 1100 ? 18 : 12;
  const lines = words(title, maxChars);
  const base = scene === 'type' ? Math.min(w * 0.17, h * 0.18) : Math.min(w * 0.095, h * 0.13);
  const longest = Math.max(...lines.map((line) => line.length));
  const fit = (w * 0.78) / Math.max(6, longest * 0.9);
  const size = clamp(Math.min(base / (lines.length > 2 ? 1.1 : 1), fit), 44, scene === 'type' ? 220 : 150);
  const x = scene === 'type' ? w / 2 : w * 0.08;
  const y = scene === 'type' ? h * 0.52 : h * 0.72;
  const anchor = scene === 'type' ? 'middle' : 'start';
  const display = preset.fonts.display;
  const titleColor = textColor;
  const accent = preset.palette.accent;
  const kicker = brief.eyebrow || (maxxing ? 'OPEN/BEAUTY · MOTION' : 'OPEN/BEAUTY');
  const subtitle = brief.subtitle ? `<text class="subtitle anim" x="${x}" y="${y + size * 0.62 + 24}" text-anchor="${anchor}" font-family="${esc(preset.fonts.body)}" font-size="${Math.max(18, size * 0.19)}" fill="${titleColor}" opacity=".78">${esc(brief.subtitle)}</text>` : '';
  return `<g class="title-block">
    <text class="kicker anim" x="${x}" y="${y - size * (lines.length - 1) - size * 1.14}" text-anchor="${anchor}" font-family="${esc(preset.fonts.mono)}" font-size="${maxxing ? 15 : 13}" letter-spacing="4" fill="${titleColor}" opacity=".7">${esc(kicker)}</text>
    <text class="title anim" x="${x}" y="${y - size * (lines.length - 1)}" text-anchor="${anchor}" font-family="${esc(display)}" font-size="${size}" letter-spacing="${preset.typeSystem?.displayTracking ?? '0'}" fill="${titleColor}" style="text-transform:${preset.typeSystem?.displayCase ?? 'none'}">${lines.map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : size * 0.92}">${esc(line)}</tspan>`).join('')}</text>
    ${subtitle}
    <g class="rule anim" aria-hidden="true"><path d="M${x} ${y + size * 0.78 + 30}h${Math.min(170, w * 0.16)}" stroke="${accent}" stroke-width="${preset.rules.borderWidths[0] ?? 1}"/></g>
  </g>`;
}

function styleTexture(preset: StylePreset, w: number, h: number): string {
  const p = preset.palette;
  switch (preset.slug) {
    case 'brutalist':
      return `<g opacity=".16" stroke="${p.ink}" stroke-width="1"><path d="M0 ${h * 0.18}h${w}M0 ${h * 0.36}h${w}M0 ${h * 0.54}h${w}M0 ${h * 0.72}h${w}M0 ${h * 0.9}h${w}"/><path d="M${w * 0.16} 0v${h}M${w * 0.32} 0v${h}M${w * 0.48} 0v${h}M${w * 0.64} 0v${h}M${w * 0.8} 0v${h}"/></g>`;
    case 'isotype':
      return `<g fill="${p.accent}" opacity=".32">${Array.from({ length: 12 }, (_, i) => `<circle cx="${w * 0.08 + (i % 6) * w * 0.045}" cy="${h * 0.12 + Math.floor(i / 6) * h * 0.05}" r="${w * 0.009}"/>`).join('')}</g>`;
    case 'opart':
      return `<g stroke="${p.ink}" stroke-width="2" opacity=".2">${Array.from({ length: 22 }, (_, i) => `<path d="M${(i * w) / 22} 0  ${w - (i * w) / 22} ${h}"/>`).join('')}</g>`;
    case 'vaporwave':
      return `<g stroke="${p.accent2}" stroke-width="1" opacity=".25">${Array.from({ length: 7 }, (_, i) => `<path d="M0 ${h * (0.66 + i * 0.05)}h${w}"/>`).join('')}${Array.from({ length: 7 }, (_, i) => `<path d="M${w * (0.25 + i * 0.1)} ${h * 0.66}  ${w * (0.18 + i * 0.1)} ${h}"/>`).join('')}</g>`;
    case 'memphis':
      return `<g fill="none" stroke="${p.accent}" stroke-width="3" opacity=".3"><path d="M${w * 0.72} ${h * 0.12}c${w * 0.08}-${h * 0.08} ${w * 0.16} ${h * 0.08} ${w * 0.24} 0"/><path d="M${w * 0.08} ${h * 0.9}c${w * 0.06}-${h * 0.06} ${w * 0.12} ${h * 0.06} ${w * 0.18} 0"/></g>`;
    case 'galactic':
      return `<g fill="${p.surface}" opacity=".6">${Array.from({ length: 24 }, (_, i) => `<circle cx="${(i * 173) % w}" cy="${(i * 97) % h}" r="${1 + (i % 3)}"/>`).join('')}</g>`;
    case 'nature':
      return `<g fill="none" stroke="${p.accent3}" stroke-width="1" opacity=".35"><circle cx="${w * 0.86}" cy="${h * 0.2}" r="${w * 0.13}"/><circle cx="${w * 0.86}" cy="${h * 0.2}" r="${w * 0.09}"/><circle cx="${w * 0.86}" cy="${h * 0.2}" r="${w * 0.05}"/></g>`;
    case 'renaissance':
      return `<g fill="none" stroke="${p.accent2}" stroke-width="1.2" opacity=".38"><path d="M${w * 0.78} ${h}V${h * 0.34}c0-${h * 0.16} ${w * 0.1}-${h * 0.24} ${w * 0.16}-${h * 0.24}s${w * 0.16} ${h * 0.08} ${w * 0.16} ${h * 0.24}V${h}"/></g>`;
    case 'papercraft':
      return `<g opacity=".5"><circle cx="${w * 0.84}" cy="${h * 0.22}" r="${w * 0.12}" fill="${p.accent4}"/><circle cx="${w * 0.9}" cy="${h * 0.3}" r="${w * 0.05}" fill="${p.accent3}"/></g>`;
    case 'artdeco':
      return `<g stroke="${p.accent}" stroke-width="1" opacity=".3">${Array.from({ length: 12 }, (_, i) => `<path d="M${w * 0.5} ${h * 0.42} ${w * 0.5 + Math.cos((i / 12) * Math.PI * 2) * w * 0.55} ${h * 0.42 + Math.sin((i / 12) * Math.PI * 2) * w * 0.55}"/>`).join('')}</g>`;
    case 'ukiyoe':
      return `<g fill="none" stroke="${p.accent3}" stroke-width="2" opacity=".3"><path d="M-${w * 0.05} ${h * 0.74}c${w * 0.15}-${h * 0.12} ${w * 0.25} ${h * 0.08} ${w * 0.4}-${h * 0.04}s${w * 0.3} ${h * 0.04} ${w * 0.45}-${h * 0.04} ${w * 0.3} ${h * 0.02} ${w * 0.45}-${h * 0.06}"/></g>`;
    case 'bestiary':
      return `<g fill="none" stroke="${p.accent}" stroke-width="1.2" opacity=".35"><circle cx="${w * 0.8}" cy="${h * 0.25}" r="${w * 0.16}"/><circle cx="${w * 0.8}" cy="${h * 0.25}" r="${w * 0.11}"/><circle cx="${w * 0.8}" cy="${h * 0.25}" r="${w * 0.06}"/></g>`;
    case 'psychedelic':
      return `<g opacity=".32"><path d="M${w * 0.68} ${h * 0.08}c${w * 0.16}-${h * 0.06} ${w * 0.28} ${h * 0.1} ${w * 0.2} ${h * 0.22}s-${w * 0.2} ${h * 0.08}-${w * 0.26} ${h * 0.18}" fill="none" stroke="${p.accent2}" stroke-width="${w * 0.025}"/></g>`;
    default:
      return '';
  }
}

function sceneShapes(preset: StylePreset, scene: MotionScene, w: number, h: number, maxxing: boolean, seed: number): string {
  const p = preset.palette;
  const cx = w * 0.64;
  const cy = h * 0.44;
  const r = Math.min(w, h) * 0.22;
  const extra = maxxing ? `<g opacity=".35" fill="none" stroke="${p.accent4}" stroke-width="1.5"><circle cx="${cx}" cy="${cy}" r="${r * 1.45}"/><circle cx="${cx}" cy="${cy}" r="${r * 1.7}"/></g>` : '';
  switch (scene) {
    case 'orbit':
      return `<g class="orbit-stage">
        <g class="spin-slow" style="--dur:42s" transform-origin="${cx} ${cy}"><ellipse cx="${cx}" cy="${cy}" rx="${r * 1.7}" ry="${r * 0.52}" fill="none" stroke="${p.accent3}" stroke-width="2" transform="rotate(-18 ${cx} ${cy})"/><ellipse cx="${cx}" cy="${cy}" rx="${r * 1.35}" ry="${r * 0.4}" fill="none" stroke="${p.accent4}" stroke-width="1.4" transform="rotate(32 ${cx} ${cy})"/></g>
        <circle class="breathe" cx="${cx}" cy="${cy}" r="${r}" fill="${p.accent2}" opacity=".92"/>
        <circle cx="${cx - r * 0.24}" cy="${cy - r * 0.22}" r="${r * 0.5}" fill="${p.accent4}" opacity=".38"/>
        <g class="drift-slow" style="--dur:16s"><circle cx="${cx + r * 1.6}" cy="${cy - r * 0.85}" r="${r * 0.06}" fill="${p.accent4}"/><circle cx="${cx - r * 1.5}" cy="${cy + r * 0.6}" r="${r * 0.03}" fill="${p.accent3}"/></g>${extra}
      </g>`;
    case 'bloom':
      return `<g class="bloom-stage" transform-origin="${cx} ${cy}">
        ${[0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="${cx + Math.cos((i / 6) * Math.PI * 2) * r * 0.42}" cy="${cy + Math.sin((i / 6) * Math.PI * 2) * r * 0.42}" rx="${r * 0.42}" ry="${r * 0.19}" fill="${i % 2 ? p.accent : p.accent4}" opacity=".82" transform="rotate(${i * 60} ${cx} ${cy})" class="bloom-petal" style="--i:${i}"/>`).join('')}
        <circle cx="${cx}" cy="${cy}" r="${r * 0.22}" fill="${p.accent2}"/>${extra}
        <g class="drift-slow" style="--dur:18s"><path d="M${cx - w * 0.03} ${cy + r * 1.2}v${r * 0.9}" stroke="${p.ink}" stroke-width="2"/><path d="M${cx - w * 0.03} ${cy + r * 1.6}c-${r * 0.3} 0-${r * 0.4}-${r * 0.2}-${r * 0.4}-${r * 0.35} ${r * 0.2} 0 ${r * 0.4} ${r * 0.1} ${r * 0.4} ${r * 0.35}Z" fill="${p.accent3}"/></g>
      </g>`;
    case 'tide':
      return `<g class="tide-stage">${[0, 1, 2, 3].map((i) => `<path class="tide-band" style="--i:${i}" d="M-${w * 0.1} ${h * (0.58 + i * 0.07)}c${w * 0.18}-${h * 0.08} ${w * 0.3} ${h * 0.06} ${w * 0.48}-${h * 0.02}s${w * 0.3} ${h * 0.05} ${w * 0.48}-${h * 0.03} ${w * 0.28} ${h * 0.02} ${w * 0.44}-${h * 0.07}" fill="none" stroke="${i % 2 ? p.accent3 : p.accent2}" stroke-width="${maxxing ? 3 : 2}" opacity="${0.8 - i * 0.12}"/>`).join('')}<circle class="breathe" cx="${cx}" cy="${h * 0.28}" r="${r * 0.55}" fill="${p.accent4}" opacity=".7"/>${extra}</g>`;
    case 'papercut': {
      const nested = papercutScene(preset, { kind: 'meadow', characters: ['rabbit'], props: ['pine', 'tree', 'flowers'], caption: briefTitle(preset) }, seed);
      return `<g class="paper-stage"><svg x="${w * 0.02}" y="${h * 0.04}" width="${w * 0.96}" height="${h * 0.62}" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">${nested}</svg></g>`;
    }
    case 'constellation':
      return `<g class="constellation-stage">${Array.from({ length: 12 }, (_, i) => `<circle class="twinkle" style="--i:${i}" cx="${w * 0.12 + ((i * 137) % (w * 0.76))}" cy="${h * 0.1 + ((i * 83) % (h * 0.58))}" r="${2 + (i % 3)}" fill="${p.surface}" opacity=".85"/>`).join('')}<g fill="none" stroke="${p.accent3}" stroke-width="1" opacity=".4"><path d="M${w * 0.18} ${h * 0.22} ${w * 0.36} ${h * 0.4} ${w * 0.5} ${h * 0.28} ${w * 0.68} ${h * 0.46} ${w * 0.82} ${h * 0.3}"/></g>${extra}</g>`;
    case 'ribbon':
      return `<g class="ribbon-stage">${[0, 1, 2].map((i) => `<path class="ribbon" style="--i:${i}" d="M${w * (0.56 + i * 0.03)} ${h * 0.08}c${w * 0.2} ${h * 0.12}-${w * 0.16} ${h * 0.25} ${w * 0.02} ${h * 0.4}s${w * 0.2} ${h * 0.28} ${-w * 0.04} ${h * 0.44}" fill="none" stroke="${i % 2 ? p.accent2 : p.accent4}" stroke-width="${18 - i * 5}" opacity=".75"/>`).join('')}${extra}</g>`;
    case 'rain':
      return `<g class="rain-stage">${Array.from({ length: maxxing ? 28 : 18 }, (_, i) => `<path class="rain-drop" style="--i:${i}" d="M${w * 0.55 + ((i * 47) % (w * 0.4))} ${h * 0.08 + ((i * 73) % (h * 0.45))}v${18 + (i % 4) * 12}" stroke="${i % 3 ? p.accent3 : p.accent4}" stroke-width="2" opacity=".6"/>`).join('')}<circle class="pulse" cx="${cx}" cy="${cy}" r="${r * 0.6}" fill="none" stroke="${p.accent}" stroke-width="2"/>${extra}</g>`;
    case 'type':
    default:
      return `<g class="type-stage" opacity=".18"><text x="${w * 0.08}" y="${h * 0.3}" font-family="${esc(preset.fonts.display)}" font-size="${h * 0.13}" textLength="${w * 0.84}" lengthAdjust="spacingAndGlyphs" fill="${p.accent}">${esc(briefTitle(preset).toUpperCase())}</text><path d="M${w * 0.08} ${h * 0.34}h${w * 0.84}" stroke="${p.accent2}" stroke-width="2"/></g>`;
  }
}

function briefTitle(preset: StylePreset): string {
  return preset.name;
}

export function renderMotion(input: Partial<MotionBrief>): string {
  if (!input.style) throw new Error('Motion needs a style.');
  if (!input.title?.trim()) throw new Error('Motion needs a title.');
  const style = input.style;
  const preset = getStyle(style);
  const scene: MotionScene = input.scene && MOTION_SCENES.includes(input.scene) ? input.scene : 'orbit';
  const sizeName: MotionSize = input.size === 'portrait' || input.size === 'landscape' || input.size === 'square' ? input.size : 'landscape';
  const [w, h] = SIZES[sizeName];
  const duration = clamp(input.duration ?? 14, 6, 24);
  const maxxing = Boolean(input.maxxing);
  const seed = input.seed ?? 7;
  const p = preset.palette;
  const dark = scene === 'orbit' || scene === 'constellation' || scene === 'rain' || style === 'galactic' || style === 'vaporwave';
  const bg = dark ? p.deep : p.bg;
  const textColor = textOn(bg, p);
  const ink = textColor;
  const brief: MotionBrief = { style, title: input.title, subtitle: input.subtitle, eyebrow: input.eyebrow, brand: input.brand, scene, size: sizeName, duration, maxxing, footer: input.footer };
  const title = titleBlock(preset, brief, w, h, scene, maxxing, textColor);
  const stage = sceneShapes(preset, scene, w, h, maxxing, seed);
  const texture = styleTexture(preset, w, h);
  const brand = input.brand ? `<text x="${w * 0.92}" y="${h * 0.075}" text-anchor="end" font-family="${esc(preset.fonts.mono)}" font-size="13" letter-spacing="3" fill="${ink}" opacity=".7">${esc(input.brand)}</text>` : '';
  const footer = input.footer ? `<text x="${w * 0.08}" y="${h * 0.985}" font-family="${esc(preset.fonts.mono)}" font-size="12" letter-spacing="2" fill="${ink}" opacity=".6">${esc(input.footer)}</text>` : '';
  const fontImport = `@import url('${preset.fonts.googleHref.replace(/&/g, '&amp;')}');`;
  const grain = maxxing ? `<filter id="m-grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="${seed}"/><feColorMatrix type="saturate" values="0"/></filter><rect width="${w}" height="${h}" filter="url(#m-grain)" opacity=".035"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="m-title m-desc">
  <title id="m-title">${esc(input.title)}</title>
  <desc id="m-desc">${esc(input.subtitle || `${preset.name} motion loop`)}. Animated SVG; respects reduced motion.</desc>
  <style>${fontImport}${motionCss(duration, maxxing)}</style>
  <rect width="${w}" height="${h}" fill="${bg}"/>
  ${texture}
  <g class="stage">${stage}</g>
  ${title}
  ${brand}${footer}${grain}
</svg>`;
}


function motionCss(duration: number, maxxing: boolean): string {
  return `:root{--dur:${duration}s}
  .anim,.spin-slow,.drift-slow,.breathe,.twinkle,.rain-drop,.tide-band,.ribbon,.bloom-petal{transform-box:fill-box;transform-origin:center}
  .title{animation:title-in 1.2s cubic-bezier(.22,.61,.36,1) both}
  .kicker,.subtitle,.rule{animation:fade-in 1.4s ease both}
  .subtitle{animation-delay:.25s}.rule{animation-delay:.45s}
  .spin-slow{animation:spin var(--dur) linear infinite}
  .drift-slow{animation:drift var(--dur) ease-in-out infinite alternate}
  .breathe{animation:breathe calc(var(--dur) * .72) ease-in-out infinite}
  .twinkle{animation:twinkle calc(var(--dur) * .45) ease-in-out infinite;animation-delay:calc(var(--i) * -.4s)}
  .bloom-petal{animation:bloom calc(var(--dur) * .9) cubic-bezier(.22,.61,.36,1) infinite alternate;animation-delay:calc(var(--i) * -.18s)}
  .tide-band{animation:tide calc(var(--dur) * .8) ease-in-out infinite alternate;animation-delay:calc(var(--i) * -.6s)}
  .rain-drop{animation:rain calc(var(--dur) * .55) linear infinite;animation-delay:calc(var(--i) * -.2s)}
  .ribbon{animation:ribbon calc(var(--dur) * .9) ease-in-out infinite alternate;animation-delay:calc(var(--i) * -.5s)}
  .orbit-stage{animation:float calc(var(--dur) * 1.2) ease-in-out infinite alternate}
  @keyframes title-in{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
  @keyframes fade-in{from{opacity:0}to{opacity:1}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes drift{from{transform:translate3d(-8px,4px,0)}to{transform:translate3d(12px,-8px,0)}}
  @keyframes breathe{0%,100%{transform:scale(.96);opacity:.8}50%{transform:scale(1.04);opacity:1}}
  @keyframes twinkle{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
  @keyframes bloom{from{transform:scale(.86) rotate(-3deg)}to{transform:scale(1.06) rotate(3deg)}}
  @keyframes tide{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
  @keyframes rain{from{transform:translateY(-18px);opacity:.2}to{transform:translateY(22px);opacity:.8}}
  @keyframes ribbon{from{transform:rotate(-.5deg)}to{transform:rotate(.8deg)}}
  @keyframes float{from{transform:translateY(-4px)}to{transform:translateY(6px)}}
  @media (prefers-reduced-motion:reduce){.anim,.spin-slow,.drift-slow,.breathe,.twinkle,.rain-drop,.tide-band,.ribbon,.bloom-petal,.orbit-stage,.title,.kicker,.subtitle,.rule{animation:none!important;transform:none!important;opacity:1!important}}`;
}

export function motionChecks(svg: string, scene: MotionScene): { name: string; passed: boolean; detail: string }[] {
  return [
    { name: 'animated', passed: /@keyframes/.test(svg), detail: 'CSS keyframes present' },
    { name: 'reduced-motion', passed: /prefers-reduced-motion/.test(svg), detail: 'reduced motion fallback present' },
    { name: 'single-file', passed: !/(?:href|src)=["']https?:/i.test(svg), detail: 'no external assets' },
    { name: 'scene', passed: svg.includes(`stage`) && MOTION_SCENES.includes(scene), detail: `scene: ${scene}` },
  ];
}
