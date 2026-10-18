import type { StylePreset } from './types.js';

/**
 * Maxxing is a deliberate second art direction: one more layer of original
 * ornament, more typographic contrast and a slower ambient motion. It is
 * still flat, deterministic and palette-bound — never a stock texture.
 */

function svg(preset: StylePreset, body: string): string {
  return `<svg class="max-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="mx-drift">${body}</g></svg>`;
}

function maxArt(preset: StylePreset): string {
  const p = preset.palette;
  switch (preset.slug) {
    case 'renaissance':
      return svg(
        preset,
        `<g fill="none" stroke="${p.accent2}" stroke-width="1.2" opacity=".5"><path d="M1130 940V310c0-150 96-244 240-244s240 94 240 244v630"/><path d="M1180 940V330c0-124 80-202 190-202s190 78 190 202v610" opacity=".5"/></g>
         <circle cx="330" cy="240" r="150" fill="${p.accent}" opacity=".16"/><circle cx="330" cy="240" r="94" fill="none" stroke="${p.accent2}" stroke-width="1.2" opacity=".45"/>
         <g fill="${p.ink}" opacity=".42"><circle cx="1290" cy="760" r="4"/><circle cx="1340" cy="800" r="3"/><circle cx="1235" cy="820" r="2.5"/></g>`,
      );
    case 'brutalist':
      return svg(
        preset,
        `<g fill="${p.accent}" opacity=".7"><rect x="1110" y="0" width="490" height="54"/><rect x="1110" y="930" width="490" height="70"/><rect x="120" y="720" width="260" height="22"/></g>
         <g fill="none" stroke="${p.ink}" stroke-width="3" opacity=".22"><path d="M80 80h1440M80 920h1440"/><path d="M1240 120v760M1110 120v760"/></g>
         <text x="1120" y="810" font-family="Archivo Black, sans-serif" font-size="250" fill="none" stroke="${p.ink}" stroke-width="2" opacity=".15">MAX</text>`,
      );
    case 'papercraft':
      return svg(
        preset,
        `<g opacity=".55"><path d="M1130 130c90-54 224-10 250 86s-38 190-134 200-202-58-190-152 8-93 74-134Z" fill="${p.accent3}"/><path d="M1230 650c96-34 206 44 198 142s-104 174-202 146-150-118-110-198 52-66 114-90Z" fill="${p.accent4}"/></g>
         <g fill="none" stroke="${p.ink}" stroke-width="2" opacity=".28"><path d="M170 230c90-70 196-32 218 52s-48 156-132 154-142-64-128-138 24-52 42-68Z"/><path d="M230 760c70-48 148-8 150 62s-72 120-144 104-92-72-70-124 40-26 64-42Z"/></g>
         <g fill="${p.accent2}" opacity=".7"><circle cx="1040" cy="740" r="12"/><circle cx="1090" cy="790" r="7"/><circle cx="980" cy="820" r="5"/></g>`,
      );
    case 'artdeco':
      return svg(
        preset,
        `<g stroke="${p.accent}" stroke-width="1" opacity=".55"><path d="M800 1000 800 120M700 1000 920 120M560 1000 980 120M420 1000 1040 120M280 1000 1100 120M140 1000 1160 120M0 1000 1220 120M1600 1000 380 120"/></g>
         <g fill="none" stroke="${p.accent3}" stroke-width="1" opacity=".55"><circle cx="1220" cy="280" r="220"/><circle cx="1220" cy="280" r="150"/><path d="M1000 500h440M1000 540h440"/></g>
         <g fill="${p.accent2}" opacity=".7"><path d="M120 700h120l-60 70Z"/><path d="M280 700h120l-60 70Z"/><path d="M440 700h120l-60 70Z"/></g>`,
      );
    case 'isotype':
      return svg(
        preset,
        `<g fill="${p.accent}" opacity=".5"><circle cx="190" cy="210" r="34"/><circle cx="290" cy="210" r="34"/><circle cx="390" cy="210" r="34"/><rect x="190" y="290" width="68" height="68"/><rect x="290" y="290" width="68" height="68"/><rect x="390" y="290" width="68" height="68"/><path d="M190 770h68v68h-68zM290 770h68v68h-68z"/><circle cx="1190" cy="760" r="48"/><circle cx="1320" cy="760" r="48"/><circle cx="1450" cy="760" r="48"/></g>
         <g stroke="${p.ink}" stroke-width="1" opacity=".2"><path d="M100 620h1400M100 680h1400M100 740h1400M100 800h1400"/></g>`,
      );
    case 'opart':
      return svg(
        preset,
        `<g fill="none" stroke="${p.ink}" stroke-width="2" opacity=".3"><circle cx="1240" cy="430" r="280"/><circle cx="1240" cy="430" r="240"/><circle cx="1240" cy="430" r="200"/><circle cx="1240" cy="430" r="160"/><circle cx="1240" cy="430" r="120"/><circle cx="1240" cy="430" r="80"/><circle cx="1240" cy="430" r="40"/></g>
         <g fill="${p.accent2}" opacity=".6"><path d="M80 760h210v210H80z"/><path d="M330 760h210v210H330z"/></g>
         <g fill="${p.ink}" opacity=".45"><path d="M80 760h210l-210 210z"/><path d="M330 760h210l-210 210z"/></g>`,
      );
    case 'ukiyoe':
      return svg(
        preset,
        `<g fill="none" stroke="${p.accent3}" stroke-width="2" opacity=".55"><path d="M-40 850c160-110 270 40 410-30s250 20 390-40 300 10 480-60 220-40 400-100"/><path d="M-40 920c160-110 270 40 410-30s250 20 390-40 300 10 480-60 220-40 400-100" opacity=".6"/></g>
         <circle cx="1220" cy="230" r="126" fill="${p.accent2}" opacity=".45"/><g fill="${p.accent}" opacity=".55"><circle cx="210" cy="220" r="7"/><circle cx="270" cy="260" r="4"/><circle cx="330" cy="200" r="5"/></g>`,
      );
    case 'bestiary':
      return svg(
        preset,
        `<g fill="none" stroke="${p.accent}" stroke-width="1.2" opacity=".55"><circle cx="1230" cy="330" r="250"/><circle cx="1230" cy="330" r="180"/><circle cx="1230" cy="330" r="110"/><path d="M1000 580h460M1000 620h460M1000 660h460"/></g>
         <g fill="${p.accent2}" opacity=".45"><circle cx="260" cy="260" r="110"/><circle cx="330" cy="340" r="40"/><circle cx="190" cy="360" r="24"/></g>
         <path d="M120 760c90-40 180 40 270 0s180 40 270 0" fill="none" stroke="${p.ink}" stroke-width="2" opacity=".3"/>`,
      );
    case 'psychedelic':
      return svg(
        preset,
        `<g opacity=".45"><path d="M1150 210c100-80 260-20 280 100s-80 220-200 200-180-120-140-220 30-50 60-80Z" fill="${p.accent2}"/><path d="M1250 590c90-50 210 0 220 96s-80 170-180 160-150-100-120-180 40-50 80-76Z" fill="${p.accent3}"/></g>
         <g fill="none" stroke="${p.ink}" stroke-width="3" opacity=".3"><path d="M90 200c60-80 160-80 220 0s160 80 220 0 160-80 220 0"/><path d="M90 780c60-80 160-80 220 0s160 80 220 0 160-80 220 0"/></g>
         <g fill="${p.accent4}" opacity=".7"><circle cx="280" cy="520" r="15"/><circle cx="360" cy="560" r="7"/><circle cx="220" cy="580" r="5"/></g>`,
      );
    case 'memphis':
      return svg(
        preset,
        `<g fill="none" stroke="${p.accent}" stroke-width="3" opacity=".55"><path d="M1080 800c60-120 180-120 240 0s180 120 240 0"/><path d="M1140 180c40-70 130-70 170 0s130 70 170 0"/></g>
         <g fill="${p.accent2}" opacity=".55"><circle cx="210" cy="240" r="52"/><rect x="300" y="190" width="80" height="80" transform="rotate(14 340 230)"/><path d="M150 720h160v160H150z"/></g>
         <g fill="${p.accent3}" opacity=".55"><circle cx="1290" cy="530" r="28"/><circle cx="1370" cy="600" r="14"/><circle cx="1210" cy="640" r="9"/></g>`,
      );
    case 'vaporwave':
      return svg(
        preset,
        `<g stroke="${p.accent2}" stroke-width="1.5" opacity=".4"><path d="M0 680h1600M0 730h1600M0 780h1600M0 830h1600M0 880h1600M0 930h1600"/><path d="M200 680 80 1000M400 680 300 1000M600 680 520 1000M800 680 740 1000M1000 680 960 1000M1200 680 1180 1000M1400 680 1400 1000"/></g>
         <circle cx="1220" cy="250" r="160" fill="${p.accent2}" opacity=".35"/><g fill="${p.accent3}" opacity=".6"><rect x="200" y="200" width="60" height="200"/><rect x="300" y="160" width="60" height="240"/><rect x="400" y="240" width="60" height="160"/></g>`,
      );
    case 'galactic':
      return svg(
        preset,
        `<g fill="none" stroke="${p.accent3}" stroke-width="1.2" opacity=".55"><ellipse cx="1200" cy="350" rx="310" ry="110" transform="rotate(-18 1200 350)"/><ellipse cx="1200" cy="350" rx="250" ry="90" transform="rotate(32 1200 350)"/><ellipse cx="1200" cy="350" rx="190" ry="70" transform="rotate(-52 1200 350)"/></g>
         <circle cx="1200" cy="350" r="120" fill="${p.accent2}" opacity=".5"/><circle cx="1200" cy="350" r="72" fill="${p.deep}" opacity=".55"/>
         <g fill="${p.accent4}"><circle cx="300" cy="220" r="4"/><circle cx="450" cy="300" r="3"/><circle cx="370" cy="720" r="3"/><circle cx="1320" cy="760" r="5"/></g>`,
      );
    case 'nature':
      return svg(
        preset,
        `<g fill="none" stroke="${p.accent3}" stroke-width="1.2" opacity=".55"><circle cx="1230" cy="300" r="220"/><circle cx="1230" cy="300" r="160"/><circle cx="1230" cy="300" r="100"/><circle cx="1230" cy="300" r="40"/></g>
         <g fill="${p.accent}" opacity=".5"><path d="M1260 760c-150 0-240-90-240-220 140 0 240 90 240 220Z"/><path d="M1260 650c130 0 210-80 210-190-120 0-210 80-210 190Z"/></g>
         <path d="M1260 900V520" stroke="${p.ink}" stroke-width="3" opacity=".65"/><g fill="${p.accent2}" opacity=".7"><circle cx="300" cy="720" r="9"/><circle cx="340" cy="760" r="5"/><circle cx="260" cy="780" r="4"/></g>`,
      );
    default:
      return '';
  }
}

export function applyMaxxing(html: string, preset: StylePreset): string {
  if (html.includes('class="max-layer"')) return html;
  const layer = `<div class="max-layer" aria-hidden="true">${maxArt(preset)}</div>`;
  const withBody = html.replace(/<body([^>]*)>/i, (match, attrs: string) => {
    const classMatch = /class="([^"]*)"/.exec(attrs);
    const existing = classMatch?.[1] ?? '';
    const classes = ['maxxing', `style-${preset.slug}`, ...existing.split(/\s+/).filter(Boolean)].filter((value, index, all) => all.indexOf(value) === index).join(' ');
    const nextAttrs = classMatch
      ? attrs.replace(classMatch[0], `class="${classes}"`)
      : `${attrs} class="${classes}"`;
    return `<body${nextAttrs}>${layer}`;
  });
  return withBody.replace('</head>', `<style>${maxxingCss(preset)}</style></head>`);
}

function maxxingCss(preset: StylePreset): string {
  const p = preset.palette;
  return `
body.maxxing{--mx-ink:${p.ink};--mx-muted:${p.muted};--mx-accent:${p.accent};--mx-accent2:${p.accent2};--mx-accent3:${p.accent3};--mx-accent4:${p.accent4}}
body.maxxing .max-layer{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;mix-blend-mode:multiply}
body.maxxing .max-art{width:100%;height:100%;display:block;opacity:.44}
body.maxxing main,body.maxxing .deck,body.maxxing .xp-shell,body.maxxing .story-shell,body.maxxing .nature-top,body.maxxing .site-head{position:relative;z-index:1}
body.maxxing .mx-drift{animation:mx-drift 24s ease-in-out infinite alternate;transform-origin:50% 50%}
body.maxxing .mx-spin{animation:mx-spin 90s linear infinite;transform-origin:50% 50%}
body.maxxing .mx-pulse{animation:mx-pulse 9s ease-in-out infinite}
body.maxxing h1,body.maxxing .deck h1{font-optical-sizing:auto;font-variant-ligatures:common-ligatures discretionary-ligatures;font-feature-settings:'dlig' 1,'liga' 1,'kern' 1;text-wrap:balance}
body.maxxing h1 em,body.maxxing .deck h1 em{font-style:italic}
body.maxxing .reveal{transition-duration:1.1s}
body.maxxing .site-head,body.maxxing .nature-top{letter-spacing:.16em}
body.maxxing .page-frame,body.maxxing .nature-frame{opacity:.55}
body.maxxing .beauty-scroll{background:var(--mx-accent)}
body.maxxing .motion-toggle{color:var(--mx-ink)}
body.maxxing.style-brutalist h1,body.maxxing.style-brutalist .deck h1{letter-spacing:-.055em}
body.maxxing.style-renaissance h1 em,body.maxxing.style-renaissance .deck h1 em{letter-spacing:.01em}
body.maxxing.style-artdeco h1,body.maxxing.style-artdeco .deck h1{letter-spacing:.1em}
body.maxxing.style-ukiyoe h1,body.maxxing.style-ukiyoe .deck h1{letter-spacing:.035em}
body.maxxing.style-nature h1,body.maxxing.style-nature .deck h1{letter-spacing:.005em}
body.maxxing.style-vaporwave .max-art{opacity:.3}
body.maxxing.style-opart .max-art{opacity:.25}
body.maxxing.style-galactic .max-art{opacity:.4;mix-blend-mode:screen}
@keyframes mx-drift{from{transform:translate3d(-10px,6px,0) rotate(-.4deg)}to{transform:translate3d(12px,-10px,0) rotate(.5deg)}}
@keyframes mx-spin{to{transform:rotate(360deg)}}
@keyframes mx-pulse{0%,100%{opacity:.35}50%{opacity:.8}}
@media (prefers-reduced-motion:reduce){body.maxxing .mx-drift,body.maxxing .mx-spin,body.maxxing .mx-pulse{animation:none!important}}
@media print{body.maxxing .max-layer{display:none!important}}
`;
}
