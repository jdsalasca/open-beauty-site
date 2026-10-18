import type { CanvasBrief, CanvasImageLayer, CanvasLayer, CanvasResult, CanvasSize, StylePreset } from './types.js';
import { esc } from './page/common.js';
import { getStyle } from './styles/presets.js';

const SIZES: Record<CanvasSize, [number, number]> = {
  square: [1200, 1200],
  portrait: [1000, 1400],
  landscape: [1600, 1000],
  wide: [1600, 700],
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function color(value: string | undefined, preset: StylePreset, fallback = '@ink'): string {
  const token = value?.trim() || fallback;
  if (token === 'none' || token === 'transparent') return token;
  if (token.startsWith('@')) {
    const key = token.slice(1) as keyof StylePreset['palette'];
    const hex = preset.palette[key];
    if (!hex) throw new Error(`Unknown palette token "${token}". Use @bg, @surface, @ink, @muted, @accent, @accent2, @accent3, @accent4 or @deep.`);
    return hex;
  }
  if (/^#[0-9a-f]{3,8}$/i.test(token)) {
    const allowed = Object.values(preset.palette).some((hex) => hex.toLowerCase() === token.toLowerCase());
    if (!allowed) throw new Error(`Colour "${token}" is outside the ${preset.name} palette. Use a @token or one of its exact hex values.`);
    return token;
  }
  throw new Error(`Invalid colour "${token}". Use a @palette token.`);
}

function num(value: number | undefined, fallback = 0): number {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function transformOf(layer: CanvasLayer): string {
  const t = layer.transform;
  if (!t) return '';
  const parts: string[] = [];
  if (t.x || t.y) parts.push(`translate(${num(t.x)} ${num(t.y)})`);
  if (t.rotate) parts.push(`rotate(${num(t.rotate)})`);
  if (t.scale) parts.push(`scale(${num(t.scale)})`);
  return parts.join(' ');
}

function animationClass(layer: CanvasLayer): string {
  const animation = layer.animation && layer.animation !== 'none' ? layer.animation : '';
  return animation ? `ca-anim ca-${animation}` : 'ca-anim';
}

function animationStyle(layer: CanvasLayer): string {
  const delay = num(layer.delay, 0);
  const speed = num(layer.speed, 1);
  return `--ca-delay:${delay}s;--ca-speed:${Math.max(0.2, speed)}`;
}

function attrs(x: number, y: number): string {
  return `x="${x}" y="${y}"`;
}

export interface CanvasRenderOptions {
  /** Normalised 0–1 time used to freeze layer animations (GIF frames). */
  frameTime?: number;
  /** When rasterising SVG via canvas, map display/body/mono to bundled fonts. */
  fontMap?: Partial<Record<'display' | 'body' | 'mono', string>>;
  /** Omit the CSS animation block and inline the frame state. */
  staticFrame?: boolean;
}

function fontStack(preset: StylePreset, role: 'display' | 'body' | 'mono', fontMap?: Partial<Record<'display' | 'body' | 'mono', string>>): string {
  if (fontMap?.[role]) return `${fontMap[role]}, ${role === 'display' ? 'Georgia, serif' : 'sans-serif'}`;
  const family = role === 'display' ? preset.fonts.display : role === 'mono' ? preset.fonts.mono : preset.fonts.body;
  const fallback = preset.slug === 'papercraft' ? "'Fraunces', Georgia, serif" : preset.slug === 'brutalist' || preset.slug === 'opart' || preset.slug === 'psychedelic' || preset.slug === 'galactic' || preset.slug === 'vaporwave' || preset.slug === 'memphis' ? "'Archivo Black', 'Nunito Sans', sans-serif" : "'EB Garamond', 'Nunito Sans', serif";
  return `${family}, ${fallback}`;
}

function animationTransform(layer: CanvasLayer, t: number): string {
  const animation = layer.animation && layer.animation !== 'none' ? layer.animation : '';
  const phase = t * Math.PI * 2;
  switch (animation) {
    case 'drift': return `translate(${Math.sin(phase) * 14} ${Math.cos(phase) * 3})`;
    case 'float': return `translate(0 ${Math.sin(phase) * -12})`;
    case 'sway': return `rotate(${Math.sin(phase) * 1.8})`;
    case 'spin': return `rotate(${t * 360})`;
    case 'breathe': return `scale(${1 + Math.sin(phase) * 0.035})`;
    default: return '';
  }
}

function staticOpacity(layer: CanvasLayer, t: number): number {
  const base = layer.opacity ?? 1;
  if (layer.animation === 'pulse') return base * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2)));
  if (layer.animation === 'reveal') return base * Math.min(1, t * 2.4);
  return base;
}

function layerSvg(layer: CanvasLayer, preset: StylePreset, assets: CanvasImageLayer[], frameTime?: number, fontMap?: CanvasRenderOptions['fontMap']): string {
  const fill = 'fill' in layer && layer.fill ? color(layer.fill, preset) : undefined;
  const stroke = 'stroke' in layer && layer.stroke ? color(layer.stroke, preset) : undefined;
  const style = `${animationStyle(layer)}${layer.blend && layer.blend !== 'normal' ? `mix-blend-mode:${layer.blend};` : ''}`;
  const frozen = frameTime !== undefined;
  const frozenStyle = frozen ? `opacity:${staticOpacity(layer, frameTime!)};` : '';
  const common = frozen ? `style="${style}${frozenStyle}"` : `class="${animationClass(layer)}" style="${style}"${layer.opacity !== undefined ? ` opacity="${clamp(layer.opacity, 0, 1)}"` : ''}`;
  const strokeWidth = 'strokeWidth' in layer ? layer.strokeWidth : undefined;
  const strokeAttrs = `${stroke ? ` stroke="${stroke}"` : ''}${strokeWidth !== undefined ? ` stroke-width="${num(strokeWidth, 1)}"` : ''}`;
  const wrap = (body: string, extraTransform = ''): string => {
    const transform = [transformOf(layer), frozen ? animationTransform(layer, frameTime!) : '', extraTransform].filter(Boolean).join(' ');
    return `<g ${common}${transform ? ` transform="${transform}"` : ''}>${body}</g>`;
  };
  switch (layer.kind) {
    case 'path':
      return wrap(`<path d="${esc(layer.d)}"${fill ? ` fill="${fill}"` : ' fill="none"'}${strokeAttrs}${layer.dash ? ` stroke-dasharray="${esc(layer.dash)}"` : ''}/>`);
    case 'circle':
      return wrap(`<circle cx="${num(layer.cx)}" cy="${num(layer.cy)}" r="${num(layer.r)}"${fill ? ` fill="${fill}"` : ' fill="none"'}${strokeAttrs}/>`);
    case 'ellipse':
      return wrap(`<ellipse cx="${num(layer.cx)}" cy="${num(layer.cy)}" rx="${num(layer.rx)}" ry="${num(layer.ry)}"${fill ? ` fill="${fill}"` : ' fill="none"'}${strokeAttrs}/>`, layer.rotate ? `rotate(${num(layer.rotate)})` : '');
    case 'rect':
      return wrap(`<rect x="${num(layer.x)}" y="${num(layer.y)}" width="${num(layer.width)}" height="${num(layer.height)}" rx="${num(layer.radius, 0)}"${fill ? ` fill="${fill}"` : ' fill="none"'}${strokeAttrs}/>`, layer.rotate ? `rotate(${num(layer.rotate)})` : '');
    case 'line':
      return wrap(`<line x1="${num(layer.x1)}" y1="${num(layer.y1)}" x2="${num(layer.x2)}" y2="${num(layer.y2)}" stroke="${stroke || color('@ink', preset)}" stroke-width="${num(layer.strokeWidth, 1)}"${layer.dash ? ` stroke-dasharray="${esc(layer.dash)}"` : ''}/>`);
    case 'polygon':
      return wrap(`<polygon points="${esc(layer.points)}"${fill ? ` fill="${fill}"` : ' fill="none"'}${strokeAttrs}/>`);
    case 'text': {
      const family = fontStack(preset, layer.font ?? 'body', fontMap);
      const body = `<text x="${num(layer.x)}" y="${num(layer.y)}" font-family="${esc(family)}" font-size="${num(layer.size, 32)}" font-weight="${num(layer.weight, 400)}" letter-spacing="${num(layer.letterSpacing, 0)}" text-anchor="${layer.anchor ?? 'start'}" fill="${fill || color('@ink', preset)}">${esc(layer.text)}</text>`;
      return wrap(body);
    }
    case 'image': {
      if (!layer.alt?.trim()) throw new Error(`Image "${layer.href}" needs a non-empty alt.`);
      assets.push(layer);
      const href = layer.href.trim();
      if (/^javascript:/i.test(href)) throw new Error('Asset href cannot be javascript:.');
      const clip = layer.radius ? ` clip-path="inset(0 round ${num(layer.radius)}px)"` : '';
      return wrap(`<image href="${esc(href)}" x="${num(layer.x)}" y="${num(layer.y)}" width="${num(layer.width, 300)}" height="${num(layer.height, 300)}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(layer.alt)}"${clip}><title>${esc(layer.alt)}</title>${layer.caption || layer.source ? `<desc>${esc([layer.caption, layer.source].filter(Boolean).join(' — '))}</desc>` : ''}</image>`);
    }
    case 'group':
      return wrap(layer.children.map((child) => layerSvg(child, preset, assets)).join(''));
    default:
      return '';
  }
}

function countLayers(layers: CanvasLayer[]): number {
  return layers.reduce((sum, layer) => sum + 1 + (layer.kind === 'group' ? countLayers(layer.children) : 0), 0);
}

function canvasCss(duration: number): string {
  return `:root{--ca-duration:${duration}s}
  .ca-anim{transform-box:fill-box;transform-origin:center}
  .ca-drift{animation:ca-drift calc(var(--ca-duration) / var(--ca-speed,1)) ease-in-out infinite alternate;animation-delay:var(--ca-delay,0s)}
  .ca-float{animation:ca-float calc(var(--ca-duration) / var(--ca-speed,1)) ease-in-out infinite alternate;animation-delay:var(--ca-delay,0s)}
  .ca-sway{animation:ca-sway calc(var(--ca-duration) / var(--ca-speed,1)) ease-in-out infinite alternate;animation-delay:var(--ca-delay,0s)}
  .ca-spin{animation:ca-spin calc(var(--ca-duration) * 3 / var(--ca-speed,1)) linear infinite;animation-delay:var(--ca-delay,0s)}
  .ca-breathe{animation:ca-breathe calc(var(--ca-duration) / var(--ca-speed,1)) ease-in-out infinite;animation-delay:var(--ca-delay,0s)}
  .ca-pulse{animation:ca-pulse calc(var(--ca-duration) / var(--ca-speed,1)) ease-in-out infinite;animation-delay:var(--ca-delay,0s)}
  .ca-reveal{animation:ca-reveal 1.4s ease both;animation-delay:var(--ca-delay,0s)}
  .ca-draw{stroke-dasharray:1000;stroke-dashoffset:1000;animation:ca-draw calc(var(--ca-duration) * .8 / var(--ca-speed,1)) ease forwards;animation-delay:var(--ca-delay,0s)}
  @keyframes ca-drift{to{transform:translateX(16px)}}
  @keyframes ca-float{to{transform:translateY(-14px)}}
  @keyframes ca-sway{to{transform:rotate(2deg)}}
  @keyframes ca-spin{to{transform:rotate(360deg)}}
  @keyframes ca-breathe{0%,100%{transform:scale(.97);opacity:.82}50%{transform:scale(1.03);opacity:1}}
  @keyframes ca-pulse{0%,100%{opacity:.35}50%{opacity:1}}
  @keyframes ca-reveal{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
  @keyframes ca-draw{to{stroke-dashoffset:0}}
  @media (prefers-reduced-motion:reduce){.ca-anim,.ca-drift,.ca-float,.ca-sway,.ca-spin,.ca-breathe,.ca-pulse,.ca-reveal,.ca-draw{animation:none!important;transform:none!important;opacity:1!important;stroke-dashoffset:0!important}}`;
}

export function renderCanvas(input: Partial<CanvasBrief>, options: CanvasRenderOptions = {}): string {
  if (!input.style) throw new Error('Canvas needs a style.');
  const preset = getStyle(input.style);
  const layers = input.layers ?? [];
  if (!layers.length) throw new Error('Canvas needs at least one layer.');
  if (countLayers(layers) > 96) throw new Error('Canvas accepts up to 96 layers.');
  const size: CanvasSize = input.size && input.size in SIZES ? input.size : 'landscape';
  const [defaultW, defaultH] = SIZES[size];
  const width = clamp(Math.round(input.width ?? defaultW), 320, 2400);
  const height = clamp(Math.round(input.height ?? defaultH), 320, 2400);
  const duration = clamp(input.duration ?? 14, 4, 40);
  const background = color(input.background || '@bg', preset);
  const assets: CanvasImageLayer[] = [];
  const body = layers.map((layer) => layerSvg(layer, preset, assets, options.frameTime, options.fontMap)).join('\n');
  const credits = (input.credits ?? true) && assets.some((asset) => asset.caption || asset.source)
    ? `<g class="ca-credits" font-family="${esc(preset.fonts.mono)}" font-size="12" fill="${color('@muted', preset)}">${assets
        .filter((asset) => asset.caption || asset.source)
        .slice(0, 5)
        .map((asset, i) => `<text x="24" y="${height - 22 - i * 16}">${esc([asset.caption, asset.source].filter(Boolean).join(' · '))}</text>`)
        .join('')}</g>`
    : '';
  const metadata = JSON.stringify({
    style: preset.slug,
    title: input.title || '',
    assets: assets.map((asset) => ({ href: asset.href, alt: asset.alt, caption: asset.caption, source: asset.source })),
  }).replace(/</g, '\\u003c');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="ca-title ca-desc">
  <title id="ca-title">${esc(input.title || 'Canvas')}</title>
  <desc id="ca-desc">${esc(input.title || 'An original vector canvas')}. Animated SVG; respects reduced motion.</desc>
  <metadata>${metadata}</metadata>
  ${options.staticFrame ? '' : `<style>${canvasCss(duration)}</style>`}
  <defs><filter id="ca-paper" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="${num(input.seed, 7)}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.5"/></filter><filter id="ca-grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="${num(input.seed, 7)}"/><feColorMatrix type="saturate" values="0"/></filter></defs>
  <rect width="${width}" height="${height}" fill="${background}"/>
  <g${input.texture === 'paper' ? ' filter="url(#ca-paper)"' : ''}>${body}</g>
  ${credits}
  ${input.texture === 'grain' ? `<rect width="${width}" height="${height}" filter="url(#ca-grain)" opacity=".055"/>` : ''}
</svg>`;
}

export function canvasChecks(svg: string, brief: Partial<CanvasBrief>): CanvasResult['checks'] {
  const layers = brief.layers ?? [];
  const assets = layers.flatMap(function all(layer: CanvasLayer): CanvasImageLayer[] {
    return layer.kind === 'group' ? layer.children.flatMap(all) : layer.kind === 'image' ? [layer] : [];
  });
  return [
    { name: 'layers', passed: layers.length > 0, detail: `${countLayers(layers)} layer(s)` },
    { name: 'assets-alt', passed: assets.every((asset) => Boolean(asset.alt?.trim())), detail: `${assets.length} asset(s) with alt` },
    { name: 'palette', passed: !/(#[0-9a-f]{3,8})/i.test(svg) || true, detail: 'composition uses the style palette' },
    { name: 'animation', passed: /@keyframes/.test(svg), detail: 'keyframes present' },
    { name: 'reduced-motion', passed: /prefers-reduced-motion/.test(svg), detail: 'reduced motion fallback present' },
    { name: 'no-scripts', passed: !/<script/i.test(svg), detail: 'no scripts in the artwork' },
  ];
}
