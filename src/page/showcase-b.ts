import type { Brief, StylePreset } from '../types.js';
import { esc } from './common.js';
import { renderShowcase } from './showcase.js';

export function renderBestiary(brief: Partial<Brief>, preset: StylePreset): string {
  const art = `<div class="bestiary-art">
  <svg viewBox="0 0 560 640" role="img" aria-label="Bestiario iluminado con una liebre alada">
    <rect x="12" y="12" width="536" height="616" fill="none" stroke="var(--accent)" stroke-width="2"/>
    <rect x="22" y="22" width="516" height="596" fill="none" stroke="var(--accent)" stroke-width="1" opacity=".6"/>
    <circle cx="280" cy="286" r="188" fill="var(--accent3)" opacity=".12" stroke="var(--accent3)" stroke-width="1"/>
    <circle cx="280" cy="286" r="164" fill="none" stroke="var(--accent)" stroke-width="1" stroke-dasharray="2 7"/>
    <g class="bestiary-beast" fill="var(--ink)">
      <path d="M190 392c-8-52 18-94 66-112 30-12 54-40 62-76 3-15 19-20 29-9 22 24 26 64 9 92-6 10-12 18-18 25 36 5 68 26 82 56 18 39-4 78-42 92-31 12-70 8-92-12-20-18-26-42-18-64-22 12-50 10-70-2-4-2-8-4-8 10Z"/>
      <path d="M238 238c-20-38-22-72-6-94 9-13 25-8 28 8 5 28 10 48 26 66" fill="none" stroke="var(--ink)" stroke-width="9" stroke-linecap="round"/>
      <path d="M330 236c20-36 48-54 70-48 16 4 18 20 4 30-22 15-42 26-58 34" fill="none" stroke="var(--ink)" stroke-width="8" stroke-linecap="round"/>
      <circle class="beast-eye" cx="276" cy="292" r="11" fill="var(--accent3)"/>
      <circle class="beast-eye" cx="318" cy="292" r="11" fill="var(--accent3)"/>
      <circle cx="278" cy="293" r="4" fill="var(--bg)"/>
      <circle cx="320" cy="293" r="4" fill="var(--bg)"/>
      <path d="M286 330c8 6 18 6 26 0" fill="none" stroke="var(--bg)" stroke-width="3" stroke-linecap="round"/>
    </g>
    <g fill="none" stroke="var(--accent4)" stroke-width="1.5">
      <path d="M78 420c-22-38-8-86 30-104M88 440c-32-22-42-64-28-98M470 160c26-18 52-8 64 16M480 180c32-4 56 18 54 46"/>
      <path d="M78 420c20-8 38-24 46-44M470 160c10 16 26 28 44 34"/>
    </g>
    <g fill="var(--accent)">
      <circle cx="78" cy="420" r="4"/><circle cx="470" cy="160" r="4"/><circle cx="280" cy="112" r="5"/>
    </g>
    <text x="280" y="590" text-anchor="middle" font-family="IM Fell English,serif" font-size="13" letter-spacing="3" fill="var(--muted)">${esc((brief.title || (brief.locale === 'en' ? 'Bestiary' : 'Bestiario')).toUpperCase().slice(0, 44))}</text>
  </svg>
</div>`;
  const css = `
.style-bestiary{background:var(--bg);color:var(--ink)}
.style-bestiary body,.style-bestiary p{font-family:'IM Fell English',serif}
.style-bestiary h1,.style-bestiary .brand,.style-bestiary .card h3,.style-bestiary .cta h2,.style-bestiary .section-head h2{font-family:'UnifrakturMaguntia',cursive}
.style-bestiary .top{border-bottom:1px double var(--ink);padding-top:16px;padding-bottom:16px}
.style-bestiary .brand{text-transform:none;font-size:25px;letter-spacing:.02em}
.style-bestiary .brand .mark{color:var(--accent2)}
.style-bestiary .hero{grid-template-columns:1.08fr .92fr;gap:26px;padding-top:36px;padding-bottom:30px}
.style-bestiary h1{font-size:clamp(54px,7.6vw,102px);line-height:1.02;letter-spacing:0;max-width:10ch}
.style-bestiary h1 em{color:var(--accent2);display:block}
.style-bestiary .tagline{max-width:430px;font-style:italic;color:var(--muted)}
.style-bestiary .btn{background:var(--accent2);color:var(--bg);font-family:'IM Fell English',serif;text-transform:none;letter-spacing:.04em}
.style-bestiary .btn:hover{background:var(--ink);color:var(--bg)}
.style-bestiary .nav-cta{border:1px solid var(--accent2);color:var(--accent2);font-family:'IM Fell English',serif;text-transform:none}
.style-bestiary .hero-art{position:relative}
.style-bestiary .bestiary-art{max-width:540px;margin-left:auto}
.style-bestiary .beast-eye{animation:blink 7s infinite}
@keyframes blink{0%,94%,100%{transform:scaleY(1)}96%,98%{transform:scaleY(.08)}}
.style-bestiary .manifesto{display:block;max-width:1080px;padding-top:44px;padding-bottom:44px}
.style-bestiary .manifesto>div{max-width:760px}
.style-bestiary .statement{font-family:'IM Fell English',serif;font-size:clamp(22px,2.3vw,30px);line-height:1.5;columns:2;column-gap:46px}
.style-bestiary .statement::first-letter{float:left;font-family:'UnifrakturMaguntia',cursive;font-size:72px;line-height:.7;padding:8px 10px 0 0;color:var(--accent3)}
.style-bestiary .kicker{color:var(--accent2);font-family:'IM Fell English',serif;letter-spacing:.2em}
.style-bestiary .aside{margin-top:28px;border-left:1px solid var(--accent2);max-width:340px}
.style-bestiary .works{padding-top:20px;border-top:1px solid var(--ink)}
.style-bestiary .section-head{border-color:var(--ink)}
.style-bestiary .section-head h2{font-size:clamp(38px,4.6vw,58px)}
.style-bestiary .cards{gap:0}
.style-bestiary .card{background:transparent;border:0;border-right:1px solid rgba(43,33,24,.25);padding:20px 24px;min-height:210px}
.style-bestiary .card:last-child{border-right:0}
.style-bestiary .card:hover{background:var(--surface);transform:none}
.style-bestiary .card h3{font-size:30px;font-family:'UnifrakturMaguntia',cursive}
.style-bestiary .card p{font-size:15px;line-height:1.55}
.style-bestiary .card-link{color:var(--accent2);text-transform:none;letter-spacing:.06em}
.style-bestiary .card-num,.style-bestiary .aside span{color:var(--accent2)}
.style-bestiary .quote{background:var(--surface);border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);max-width:100%;padding-top:46px;padding-bottom:46px}
.style-bestiary .quote blockquote{font-family:'IM Fell English',serif;font-style:italic;font-size:clamp(28px,3.6vw,46px)}
.style-bestiary .quote cite{color:var(--accent2);text-transform:none;letter-spacing:.08em}
.style-bestiary .cta{background:var(--deep);color:var(--bg);border:1px solid var(--accent)}
.style-bestiary .cta .kicker{color:var(--accent)}
.style-bestiary .cta .btn{background:var(--accent);color:var(--deep)}
.style-bestiary .cta .btn:hover{background:var(--bg);color:var(--deep)}
.style-bestiary .foot{border-color:var(--ink)}
@media (max-width:980px){.style-bestiary .hero{grid-template-columns:1fr}.style-bestiary .bestiary-art{max-width:440px;margin:0 auto}.style-bestiary .statement{columns:1}}
@media (prefers-reduced-motion:reduce){.style-bestiary .beast-eye{animation:none}}
`;
  return renderShowcase(brief, preset, {
    art,
    css,
    eyebrow: brief.eyebrow || 'Manuscrito iluminado',
    heroNote: '05 — Bestiario',
    sectionTitle: { es: 'Tres criaturas del margen', en: 'Three creatures from the margin' },
  });
}

export function renderPsychedelic(brief: Partial<Brief>, preset: StylePreset): string {
  const art = `<div class="psy-field">
  <svg viewBox="0 0 620 660" role="img" aria-label="Formas líquidas psicodélicas con ojos">
    <g class="psy-blob psy-blob-a" fill="var(--accent)" opacity=".9">
      <path d="M150 130c80-58 204-34 250 54 42 80 0 174-78 214-85 43-196 6-224-86-24-78 4-140 52-182Z"/>
    </g>
    <g class="psy-blob psy-blob-b" fill="var(--accent2)" opacity=".85">
      <path d="M380 260c66-22 140 16 156 86 15 66-32 132-100 144-74 13-140-38-142-108-1-58 34-104 86-122Z"/>
    </g>
    <g class="psy-blob psy-blob-c" fill="var(--accent4)" opacity=".8">
      <path d="M110 430c52-20 114 10 128 64 13 50-27 104-82 110-60 7-112-44-102-98 5-32 26-60 56-76Z"/>
    </g>
    <g fill="var(--ink)">
      <ellipse cx="272" cy="240" rx="45" ry="28"/><ellipse cx="392" cy="226" rx="54" ry="34"/>
      <circle cx="290" cy="234" r="15" fill="var(--accent3)"/><circle cx="414" cy="220" r="17" fill="var(--accent3)"/>
      <circle cx="294" cy="236" r="6" fill="var(--ink)"/><circle cx="418" cy="222" r="7" fill="var(--ink)"/>
      <path d="M250 322c24 24 60 26 84 2" fill="none" stroke="var(--ink)" stroke-width="7" stroke-linecap="round"/>
    </g>
    <g fill="none" stroke="var(--accent3)" stroke-width="3">
      <circle cx="310" cy="330" r="210" opacity=".7"/><circle cx="310" cy="330" r="238" opacity=".45"/><circle cx="310" cy="330" r="266" opacity=".25"/>
    </g>
    <g fill="var(--accent3)">
      <circle cx="100" cy="112" r="8"/><circle cx="512" cy="112" r="6"/><circle cx="540" cy="470" r="9"/><circle cx="72" cy="560" r="5"/>
    </g>
  </svg>
  <span class="psy-stamp">${esc(brief.locale === 'en' ? 'SERIES' : 'SERIE')}</span>
</div>`;
  const css = `
.style-psychedelic{background:var(--bg);color:var(--ink)}
.style-psychedelic body,.style-psychedelic p{font-family:'Space Grotesk',sans-serif}
.style-psychedelic h1,.style-psychedelic .brand,.style-psychedelic .card h3,.style-psychedelic .quote blockquote,.style-psychedelic .cta h2,.style-psychedelic .section-head h2{font-family:'Bungee Shade',cursive}
.style-psychedelic .top{border-bottom:1px solid rgba(247,232,200,.25)}
.style-psychedelic .brand{text-transform:uppercase;font-size:16px;letter-spacing:.04em}
.style-psychedelic .brand .mark{color:var(--accent2)}
.style-psychedelic .hero{grid-template-columns:1.05fr .95fr;gap:16px;padding-top:30px;padding-bottom:40px}
.style-psychedelic h1{font-size:clamp(54px,8vw,106px);line-height:.92;letter-spacing:-.02em;text-transform:uppercase;max-width:9ch;text-shadow:4px 4px 0 var(--accent)}
.style-psychedelic h1 em{color:var(--accent3);display:block;text-shadow:4px 4px 0 var(--accent2);transform:rotate(-2deg);transform-origin:left}
.style-psychedelic .tagline{max-width:410px;color:var(--muted)}
.style-psychedelic .btn{background:var(--accent3);color:var(--bg);border:4px solid var(--bg);box-shadow:5px 5px 0 var(--accent);font-family:'Space Grotesk',sans-serif;letter-spacing:.16em}
.style-psychedelic .btn:hover{background:var(--accent2);box-shadow:7px 7px 0 var(--accent3);transform:translate(-2px,-2px)}
.style-psychedelic .nav-cta{border:2px solid var(--accent3);color:var(--accent3)}
.style-psychedelic .hero-art{position:relative}
.style-psychedelic .psy-field{position:relative;min-height:530px}
.style-psychedelic .psy-field svg{width:100%;height:auto;overflow:visible}
.style-psychedelic .psy-blob-a{animation:psy-drift 9s ease-in-out infinite}
.style-psychedelic .psy-blob-b{animation:psy-drift 11s ease-in-out infinite reverse}
.style-psychedelic .psy-blob-c{animation:psy-drift 8s ease-in-out infinite}
@keyframes psy-drift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(calc(var(--mx,0)*18px),calc(var(--my,0)*-14px)) scale(1.03)}}
.style-psychedelic .psy-stamp{position:absolute;right:4%;bottom:8%;display:grid;place-items:center;width:82px;height:82px;border:4px solid var(--accent3);border-radius:50%;color:var(--accent3);font-family:'Space Grotesk',sans-serif;font-size:11px;line-height:1.2;letter-spacing:.14em;text-align:center;transform:rotate(14deg)}
.style-psychedelic .manifesto{background:var(--deep);border-top:4px solid var(--accent);border-bottom:4px solid var(--accent2);max-width:100%;padding-left:max(34px,calc((100vw - 1180px)/2));padding-right:max(34px,calc((100vw - 1180px)/2))}
.style-psychedelic .statement{color:var(--ink);font-family:'Space Grotesk',sans-serif;font-size:clamp(28px,3.4vw,44px);line-height:1.2;font-weight:500}
.style-psychedelic .kicker{color:var(--accent3)}
.style-psychedelic .works{padding-top:50px}
.style-psychedelic .section-head{border-color:var(--accent3)}
.style-psychedelic .card{background:var(--surface);border:4px solid var(--bg);box-shadow:8px 8px 0 var(--accent);min-height:245px;border-radius:0}
.style-psychedelic .card:nth-child(2){box-shadow:8px 8px 0 var(--accent2)}
.style-psychedelic .card:nth-child(3){box-shadow:8px 8px 0 var(--accent4)}
.style-psychedelic .card:hover{transform:translate(-3px,-3px);box-shadow:12px 12px 0 var(--accent3)}
.style-psychedelic .card h3{font-size:25px;letter-spacing:.01em;line-height:1.05}
.style-psychedelic .quote{background:var(--accent3);color:var(--bg);max-width:100%;padding-top:54px;padding-bottom:54px;transform:rotate(-1deg)}
.style-psychedelic .quote blockquote{font-size:clamp(28px,4vw,52px);text-shadow:3px 3px 0 var(--accent2)}
.style-psychedelic .quote cite{color:var(--bg)}
.style-psychedelic .cta{background:var(--accent);color:var(--ink);border:4px solid var(--ink);max-width:1000px;box-shadow:10px 10px 0 var(--accent2)}
.style-psychedelic .cta .btn{background:var(--ink);color:var(--ink);border-color:var(--ink);box-shadow:4px 4px 0 var(--accent3);color:var(--bg)}
.style-psychedelic .cta .btn:hover{background:var(--accent3);color:var(--bg)}
.style-psychedelic .foot{border-color:rgba(247,232,200,.25)}
.style-psychedelic .card-num,.style-psychedelic .card-link,.style-psychedelic .aside span{color:var(--accent3)}
@media (max-width:980px){.style-psychedelic .hero{grid-template-columns:1fr}.style-psychedelic .psy-field{min-height:0;max-width:520px;margin:0 auto}.style-psychedelic .quote{transform:none}}
@media (prefers-reduced-motion:reduce){.style-psychedelic .psy-blob-a,.style-psychedelic .psy-blob-b,.style-psychedelic .psy-blob-c{animation:none}}
`;
  return renderShowcase(brief, preset, {
    art,
    css,
    eyebrow: brief.eyebrow || 'Cartel de concierto · Serie psicodélica',
    heroNote: '06 — Psychedelic',
    sectionTitle: { es: 'Tres viajes sin retorno', en: 'Three trips, no return' },
  });
}

export function renderMemphis(brief: Partial<Brief>, preset: StylePreset): string {
  const art = `<div class="mem-field">
  <div class="mem-shape mem-pink" data-scatter></div>
  <div class="mem-shape mem-mint" data-scatter></div>
  <div class="mem-shape mem-cobalt" data-scatter></div>
  <div class="mem-shape mem-butter" data-scatter></div>
  <svg class="mem-squiggle" viewBox="0 0 520 180" aria-hidden="true"><path d="M10 120c40-80 80-80 120 0s80 80 120 0 80-80 120 0 80 80 120 0" fill="none" stroke="var(--ink)" stroke-width="10" stroke-linecap="round"/></svg>
  <svg class="mem-sketch" viewBox="0 0 340 340" aria-hidden="true">
    <circle cx="170" cy="170" r="118" fill="var(--accent2)" stroke="var(--ink)" stroke-width="4"/>
    <path d="M96 190c18-54 58-82 104-74 32 6 50 28 48 54-3 34-38 54-74 48-28-5-48-24-48-46 0-12 6-22 16-28" fill="none" stroke="var(--ink)" stroke-width="5"/>
    <circle cx="142" cy="146" r="8" fill="var(--ink)"/><circle cx="204" cy="146" r="8" fill="var(--ink)"/>
    <path d="M144 196c16 12 38 12 54 0" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
  </svg>
  <span class="mem-tag">${esc((brief.brand || (brief.locale === 'en' ? 'Workshop' : 'Taller')).toUpperCase().slice(0, 14))}</span>
  <button class="mem-shuffle" type="button" data-shuffle>REVOLVER ✳</button>
</div>`;
  const css = `
.style-memphis{background:var(--bg);color:var(--ink)}
.style-memphis body,.style-memphis p{font-family:'DM Sans',sans-serif}
.style-memphis h1,.style-memphis .statement,.style-memphis .brand,.style-memphis .card h3,.style-memphis .quote blockquote,.style-memphis .cta h2,.style-memphis .section-head h2{font-family:'Bricolage Grotesque',sans-serif}
.style-memphis .top{border-bottom:3px solid var(--ink);padding-top:14px;padding-bottom:14px}
.style-memphis .brand{text-transform:none;font-size:24px;letter-spacing:-.03em}
.style-memphis .brand .mark{color:var(--accent3)}
.style-memphis .hero{grid-template-columns:1fr 1fr;gap:20px;padding-top:32px;padding-bottom:40px}
.style-memphis h1{font-size:clamp(60px,9vw,128px);line-height:.86;letter-spacing:-.055em;max-width:8ch}
.style-memphis h1 em{display:inline-block;background:var(--accent);padding:0 .08em;color:var(--ink);border:3px solid var(--ink);transform:rotate(-2deg)}
.style-memphis .tagline{max-width:410px;color:var(--muted)}
.style-memphis .btn{background:var(--accent3);color:var(--bg);border:3px solid var(--ink);box-shadow:6px 6px 0 var(--ink);font-family:'DM Sans',sans-serif;letter-spacing:.1em}
.style-memphis .btn:hover{transform:translate(-2px,-2px);box-shadow:8px 8px 0 var(--ink);background:var(--accent)}
.style-memphis .nav-cta{border:3px solid var(--ink);background:var(--accent4);color:var(--ink);box-shadow:4px 4px 0 var(--ink)}
.style-memphis .hero-art{position:relative;min-height:540px}
.style-memphis .mem-field{position:relative;min-height:540px}
.style-memphis .mem-shape{position:absolute;border:3px solid var(--ink);transition:transform .3s var(--ease)}
.style-memphis .mem-pink{width:150px;height:150px;background:var(--accent);border-radius:50%;right:6%;top:6%}
.style-memphis .mem-mint{width:110px;height:210px;background:var(--accent2);right:38%;top:18%;transform:rotate(18deg)}
.style-memphis .mem-cobalt{width:180px;height:80px;background:var(--accent3);right:2%;bottom:22%;transform:rotate(-8deg)}
.style-memphis .mem-butter{width:120px;height:120px;background:var(--accent4);left:4%;bottom:12%;border-radius:0 48px 0 48px}
.style-memphis .mem-squiggle{position:absolute;left:0;bottom:2%;width:72%;transform:rotate(-6deg)}
.style-memphis .mem-sketch{position:absolute;right:8%;bottom:8%;width:58%;z-index:2}
.style-memphis .mem-tag{position:absolute;left:6%;top:8%;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:.16em;border:3px solid var(--ink);background:var(--accent4);padding:6px 8px;transform:rotate(-4deg)}
.style-memphis .mem-shuffle{position:absolute;right:4%;top:42%;z-index:4;border:3px solid var(--ink);background:var(--bg);padding:8px 11px;font-family:'DM Sans',sans-serif;font-size:10px;letter-spacing:.1em;box-shadow:4px 4px 0 var(--ink)}
.style-memphis .manifesto{border-top:3px solid var(--ink);border-bottom:3px solid var(--ink);background:var(--accent2);max-width:100%;padding-left:max(34px,calc((100vw - 1180px)/2));padding-right:max(34px,calc((100vw - 1180px)/2))}
.style-memphis .statement{font-size:clamp(28px,3.4vw,44px);line-height:1.1;letter-spacing:-.02em}\n.style-memphis .kicker{color:var(--ink)}\n.style-memphis .aside span{color:var(--ink)}\n.style-memphis .card p{color:var(--ink);opacity:.78}\n.style-memphis .card-link{color:var(--ink)}
.style-memphis .works{padding-top:50px}
.style-memphis .section-head{border-color:var(--ink)}
.style-memphis .card{background:var(--surface);border:3px solid var(--ink);box-shadow:6px 6px 0 var(--ink);border-radius:0 24px 0 24px;min-height:250px}
.style-memphis .card:nth-child(1){transform:rotate(-1.5deg)}
.style-memphis .card:nth-child(2){transform:rotate(1deg) translateY(8px);background:var(--accent)}
.style-memphis .card:nth-child(3){transform:rotate(-.6deg);background:var(--accent4)}
.style-memphis .card:hover{transform:translate(-3px,-3px) rotate(0);box-shadow:9px 9px 0 var(--ink)}
.style-memphis .card-num{color:var(--ink)}
.style-memphis .quote{background:var(--accent3);color:var(--bg);max-width:100%;padding-top:50px;padding-bottom:50px;border-top:3px solid var(--ink);border-bottom:3px solid var(--ink)}
.style-memphis .quote blockquote{font-size:clamp(30px,4vw,52px);letter-spacing:-.03em}
.style-memphis .quote cite{color:var(--bg)}
.style-memphis .cta{background:var(--accent);border:3px solid var(--ink);box-shadow:8px 8px 0 var(--ink);max-width:1000px;border-radius:0 34px 0 34px}
.style-memphis .cta .btn{background:var(--ink);color:var(--bg);box-shadow:4px 4px 0 var(--accent3)}
.style-memphis .cta .btn:hover{background:var(--accent3);color:var(--bg)}
.style-memphis .foot{border-color:var(--ink)}
@media (max-width:980px){.style-memphis .hero{grid-template-columns:1fr}.style-memphis .hero-art{min-height:440px;max-width:520px;margin:0 auto}.style-memphis .mem-field{min-height:440px}.style-memphis .card{transform:none!important}}
`;
  return renderShowcase(brief, preset, {
    art,
    css,
    eyebrow: brief.eyebrow || 'Postmodernismo doméstico · Taller de formas',
    heroNote: '07 — Memphis',
    sectionTitle: { es: 'Tres objetos con mala intención', en: 'Three objects with bad intentions' },
  });
}

export function renderVaporwave(brief: Partial<Brief>, preset: StylePreset): string {
  const locale = brief.locale === 'en' ? 'en' : 'es';
  // The desktop window is built from the brief, not from a fixed demo folder.
  const base = (brief.brand || brief.title || (locale === 'en' ? 'archive' : 'archivo')).trim();
  const winName = base.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 16) || 'ARCHIVO';
  const sections = (brief.sections ?? []).slice(0, 3);
  const fileNames = [0, 1, 2].map((index) => {
    const title = sections[index]?.title;
    if (!title) return `nota_0${index + 1}.txt`;
    return `${title.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 18) || `nota_0${index + 1}`}.txt`;
  });
  const files = fileNames
    .map((name, index) => `<div class="vapor-file${index === 1 ? ' is-selected' : ''}"><span class="vapor-icon">▣</span><span>${esc(name)}</span></div>`)
    .join('\n      ');
  const art = `<div class="vapor-scene">
  <div class="vapor-sun"></div>
  <div class="vapor-grid"></div>
  <div class="vapor-window" data-drag>
    <div class="vapor-bar"><span>${esc(winName)}.EXE</span><span class="vapor-dots"><i></i><i></i><i></i></span></div>
    <div class="vapor-body">
      <p class="vapor-path">C:\\${esc(winName)}\\</p>
      ${files}
      <div class="vapor-status"><span>${fileNames.length} ${esc(locale === 'es' ? 'objeto(s)' : 'item(s)')}</span></div>
    </div>
  </div>
  <span class="vapor-hint">ARRASTRÁ LA VENTANA_</span>
</div>`;
  const css = `
.style-vaporwave{background:var(--bg);color:var(--ink)}
.style-vaporwave body,.style-vaporwave p{font-family:'Space Grotesk',sans-serif}
.style-vaporwave h1,.style-vaporwave .brand,.style-vaporwave .card h3,.style-vaporwave .quote blockquote,.style-vaporwave .cta h2,.style-vaporwave .section-head h2{font-family:'Press Start 2P',monospace}
.style-vaporwave .top{border-bottom:2px solid rgba(255,255,255,.2);background:rgba(43,58,143,.35)}
.style-vaporwave .brand{font-size:13px;letter-spacing:.04em;line-height:1.6}
.style-vaporwave .brand .mark{color:var(--accent2)}
.style-vaporwave .hero{grid-template-columns:1.02fr .98fr;gap:12px;padding-top:26px;padding-bottom:30px;overflow:hidden}
.style-vaporwave .hero::before{content:"";position:absolute;left:50%;bottom:-2px;width:120vw;height:46%;transform:translateX(-50%) perspective(300px) rotateX(62deg);transform-origin:bottom;background-image:linear-gradient(rgba(79,227,227,.5) 2px,transparent 2px),linear-gradient(90deg,rgba(79,227,227,.5) 2px,transparent 2px);background-size:54px 36px;opacity:.55;pointer-events:none;z-index:0}
.style-vaporwave .hero-copy{position:relative;z-index:2}
.style-vaporwave h1{font-size:clamp(24px,3.2vw,40px);line-height:1.35;letter-spacing:-.02em;text-transform:uppercase;max-width:14ch;background:linear-gradient(180deg,var(--ink) 0%,var(--accent2) 38%,var(--accent3) 52%,var(--accent) 78%,var(--ink) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(3px 3px 0 var(--deep))}
.style-vaporwave h1 em{color:transparent;display:block;font-style:normal}
.style-vaporwave .tagline{max-width:400px;color:var(--muted);margin-top:18px}
.style-vaporwave .btn{background:var(--accent);color:var(--bg);box-shadow:inset 2px 2px 0 rgba(255,255,255,.55),inset -2px -2px 0 rgba(0,0,0,.35);border:2px solid var(--ink);font-family:'Space Grotesk',sans-serif;letter-spacing:.16em}
.style-vaporwave .btn:hover{background:var(--accent2);color:var(--bg);transform:translateY(-2px)}
.style-vaporwave .nav-cta{border:2px solid var(--accent2);color:var(--accent2);background:var(--deep)}
.style-vaporwave .hero-art{position:relative;z-index:2}
.style-vaporwave .vapor-scene{position:relative;min-height:530px;width:100%}
.style-vaporwave .vapor-sun{position:absolute;right:8%;top:3%;width:240px;height:240px;border-radius:50%;background:linear-gradient(180deg,var(--accent) 0 50%,var(--accent2) 50% 100%);opacity:.85;filter:blur(.2px)}
.style-vaporwave .vapor-sun::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(180deg,transparent 0 12px,var(--bg) 12px 18px);opacity:.6}
.style-vaporwave .vapor-grid{position:absolute;right:-30%;bottom:0;width:150%;height:45%;transform:perspective(300px) rotateX(60deg);transform-origin:bottom;background-image:linear-gradient(rgba(255,79,163,.5) 2px,transparent 2px),linear-gradient(90deg,rgba(79,227,227,.5) 2px,transparent 2px);background-size:48px 48px;opacity:.5}
.style-vaporwave .vapor-window{position:absolute;left:0;top:20%;width:92%;border:2px solid var(--ink);background:var(--accent3);box-shadow:6px 6px 0 var(--deep);cursor:grab;user-select:none}
.style-vaporwave .vapor-window:active{cursor:grabbing}
.style-vaporwave .vapor-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;background:linear-gradient(90deg,var(--deep),var(--accent));color:var(--ink);padding:6px 8px;font-family:'Space Grotesk',sans-serif;font-size:10px;letter-spacing:.08em;border-bottom:2px solid var(--ink)}
.style-vaporwave .vapor-dots{display:flex;gap:4px}.style-vaporwave .vapor-dots i{width:12px;height:12px;background:var(--accent3);border:1px solid var(--ink);display:block}
.style-vaporwave .vapor-body{background:var(--accent3);color:var(--ink);padding:9px;font-family:'Space Grotesk',sans-serif;font-size:11px}
.style-vaporwave .vapor-path{border:1px solid var(--ink);padding:4px 6px;margin:0 0 8px;font-size:9px;background:var(--bg);color:var(--ink);overflow:hidden;white-space:nowrap}
.style-vaporwave .vapor-file{display:flex;align-items:center;gap:8px;padding:4px 6px;border:1px solid transparent}
.style-vaporwave .vapor-file.is-selected{background:var(--accent);border-color:var(--ink);color:var(--bg)}
.style-vaporwave .vapor-icon{color:var(--deep);font-size:14px}
.style-vaporwave .vapor-status{display:flex;justify-content:space-between;border-top:1px solid var(--ink);margin-top:8px;padding-top:6px;font-size:8px;letter-spacing:.08em}
.style-vaporwave .vapor-hint{position:absolute;right:0;bottom:2%;font-family:'Space Grotesk',sans-serif;font-size:8px;letter-spacing:.14em;color:var(--accent2)}
.style-vaporwave .manifesto{background:var(--surface);border-top:2px solid var(--accent2);border-bottom:2px solid var(--accent);max-width:100%;padding-left:max(34px,calc((100vw - 1180px)/2));padding-right:max(34px,calc((100vw - 1180px)/2))}
.style-vaporwave .statement{color:var(--ink);font-family:'Space Grotesk',sans-serif;font-size:clamp(26px,3.2vw,40px);line-height:1.35;font-weight:500}
.style-vaporwave .kicker{color:var(--accent2)}
.style-vaporwave .works{padding-top:50px}
.style-vaporwave .section-head{border-color:var(--accent2)}
.style-vaporwave .section-head h2{font-size:clamp(22px,2.8vw,34px);line-height:1.4}
.style-vaporwave .card{background:var(--surface);border:2px solid var(--ink);box-shadow:inset 2px 2px 0 rgba(255,255,255,.5),inset -2px -2px 0 rgba(0,0,0,.35),5px 5px 0 var(--deep);border-radius:0;min-height:250px;color:var(--ink)}
.style-vaporwave .card h3{font-size:16px;line-height:1.5;letter-spacing:0}
.style-vaporwave .card p{color:var(--muted)}
.style-vaporwave .card:hover{transform:translate(-2px,-2px);box-shadow:inset 2px 2px 0 rgba(255,255,255,.5),inset -2px -2px 0 rgba(0,0,0,.35),7px 7px 0 var(--accent)}
.style-vaporwave .quote{background:var(--accent);color:var(--bg);max-width:100%;padding-top:50px;padding-bottom:50px}
.style-vaporwave .quote blockquote{font-size:clamp(16px,2.2vw,26px);line-height:1.8;letter-spacing:0;text-shadow:2px 2px 0 var(--accent2)}
.style-vaporwave .quote cite{color:var(--bg)}
.style-vaporwave .cta{background:var(--surface);border:2px solid var(--accent2);box-shadow:inset 2px 2px 0 rgba(255,255,255,.5),inset -2px -2px 0 rgba(0,0,0,.35),8px 8px 0 var(--accent);max-width:1000px;color:var(--ink)}
.style-vaporwave .cta h2{font-size:clamp(18px,2.4vw,28px);line-height:1.6;max-width:820px}
.style-vaporwave .cta .btn{background:var(--accent2);color:var(--bg)}
.style-vaporwave .cta .btn:hover{background:var(--accent);color:var(--bg)}
.style-vaporwave .foot{border-color:rgba(255,255,255,.2)}
.style-vaporwave .card-num,.style-vaporwave .card-link,.style-vaporwave .aside span{color:var(--accent2)}
@media (max-width:980px){.style-vaporwave .hero{grid-template-columns:1fr}.style-vaporwave .vapor-scene{min-height:460px;max-width:520px;margin:0 auto;width:100%}.style-vaporwave .vapor-window{top:15%}}
`;
  return renderShowcase(brief, preset, {
    art,
    css,
    eyebrow: brief.eyebrow || 'Archivo digital',
    heroNote: '08 — Vaporwave',
    sectionTitle: { es: 'Tres ventanas que no cierran', en: 'Three windows that will not close' },
    script: `
(() => {
  const win = document.querySelector('.vapor-window');
  if (!win) return;
  let dragging = false, ox = 0, oy = 0, x = 0, y = 0;
  win.addEventListener('pointerdown', (event) => {
    dragging = true; ox = event.clientX - x; oy = event.clientY - y;
    win.setPointerCapture(event.pointerId);
  });
  win.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    x = event.clientX - ox; y = event.clientY - oy;
    win.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  });
  win.addEventListener('pointerup', () => { dragging = false; });
})();`,
  });
}

export function renderGalactic(brief: Partial<Brief>, preset: StylePreset): string {
  const art = `<div class="galaxy-stage">
  <div class="galaxy-stars" aria-hidden="true"></div>
  <svg class="galaxy-svg" viewBox="0 0 760 760" role="img" aria-label="Planeta anillado con órbitas y estrellas">
    <defs>
      <radialGradient id="planetBody" cx="38%" cy="32%" r="72%">
        <stop offset="0" stop-color="#B388FF"/>
        <stop offset=".48" stop-color="#3A2669"/>
        <stop offset="1" stop-color="#0D1020"/>
      </radialGradient>
      <linearGradient id="planetRing" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#79E8FF"/>
        <stop offset=".55" stop-color="#F2F4FF"/>
        <stop offset="1" stop-color="#F5C86B"/>
      </linearGradient>
    </defs>
    <g class="orbit orbit-one" fill="none" stroke="#79E8FF" stroke-width="1" opacity=".55">
      <ellipse cx="380" cy="380" rx="330" ry="104" transform="rotate(-18 380 380)"/>
    </g>
    <g class="orbit orbit-two" fill="none" stroke="#B388FF" stroke-width="1" opacity=".42">
      <ellipse cx="380" cy="380" rx="292" ry="188" transform="rotate(28 380 380)"/>
    </g>
    <g class="orbit orbit-three" fill="none" stroke="#F5C86B" stroke-width="1" opacity=".35">
      <ellipse cx="380" cy="380" rx="228" ry="228"/>
    </g>
    <circle cx="380" cy="380" r="142" fill="url(#planetBody)"/>
    <path d="M244 380c0 26 61 47 136 47s136-21 136-47-61-47-136-47-136 21-136 47Z" fill="none" stroke="url(#planetRing)" stroke-width="4" transform="rotate(-18 380 380)"/>
    <path d="M238 354c28 36 80 58 142 58s114-22 142-58" fill="none" stroke="#F2F4FF" stroke-width="1.2" opacity=".55" transform="rotate(-18 380 380)"/>
    <circle cx="380" cy="380" r="142" fill="none" stroke="#79E8FF" stroke-width="1" opacity=".4"/>
    <g class="galaxy-moon" fill="#F5C86B">
      <circle cx="596" cy="238" r="9"/>
      <circle cx="596" cy="238" r="19" fill="none" stroke="#F5C86B" opacity=".35"/>
    </g>
    <g fill="#F2F4FF" opacity=".8">
      <circle cx="110" cy="150" r="1.4"/><circle cx="164" cy="98" r="1"/><circle cx="650" cy="116" r="1.6"/>
      <circle cx="690" cy="420" r="1.1"/><circle cx="94" cy="512" r="1.5"/><circle cx="210" cy="650" r="1.2"/>
      <circle cx="560" cy="650" r="1.3"/><circle cx="670" cy="584" r="1"/><circle cx="452" cy="92" r="1.2"/>
    </g>
  </svg>
  <span class="galaxy-coord">${esc((brief.brand || brief.title || (brief.locale === 'en' ? 'Dome' : 'Cúpula')).toUpperCase().slice(0, 24))}</span>
  <span class="galaxy-scale">${esc(brief.locale === 'en' ? 'ORBIT 01' : 'ÓRBITA 01')}</span>
</div>`;
  const css = `
.style-galactic{background:var(--bg);color:var(--ink)}
.style-galactic body,.style-galactic p,.style-galactic .tagline{font-family:'Space Grotesk',sans-serif;font-weight:300}
.style-galactic h1,.style-galactic .statement,.style-galactic .brand,.style-galactic .card h3,.style-galactic .quote blockquote,.style-galactic .cta h2,.style-galactic .section-head h2{font-family:'Michroma',sans-serif;font-weight:400}
.style-galactic .top{border-bottom:1px solid rgba(121,232,255,.26);background:rgba(5,6,10,.55);backdrop-filter:blur(10px)}
.style-galactic .brand{text-transform:uppercase;font-size:15px;letter-spacing:.12em}
.style-galactic .brand .mark{color:var(--accent)}
.style-galactic .top nav a{color:var(--muted)}
.style-galactic .hero{grid-template-columns:1.02fr .98fr;gap:10px;padding-top:36px;padding-bottom:58px;min-height:680px}
.style-galactic .hero-copy{position:relative;z-index:3}
.style-galactic .eyebrow{color:var(--accent);letter-spacing:.22em}
.style-galactic h1{font-size:clamp(40px,5.8vw,88px);line-height:1.16;letter-spacing:.01em;text-transform:uppercase;max-width:14ch}
.style-galactic h1 em{display:block;font-style:normal;background:linear-gradient(180deg,var(--ink) 0%,var(--accent) 54%,var(--accent2) 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.style-galactic .tagline{max-width:440px;color:var(--muted);font-size:17px;line-height:1.75}
.style-galactic .btn{background:var(--accent);color:var(--bg);font-family:'Michroma',sans-serif;font-size:9px;letter-spacing:.14em}
.style-galactic .btn:hover{background:var(--ink);color:var(--bg);transform:translateY(-2px)}
.style-galactic .nav-cta{border:1px solid var(--accent);color:var(--accent);background:rgba(121,232,255,.05)}
.style-galactic .hero-art{position:relative;z-index:2;min-width:0}
.style-galactic .galaxy-stage{position:relative;width:112%;max-width:760px;margin-left:-2%;aspect-ratio:1}
.style-galactic .galaxy-stars{position:absolute;inset:-20%;background-image:radial-gradient(circle at 18% 22%,rgba(242,244,255,.8) 0 1px,transparent 1.5px),radial-gradient(circle at 72% 16%,rgba(121,232,255,.8) 0 1px,transparent 1.6px),radial-gradient(circle at 84% 68%,rgba(242,244,255,.55) 0 1px,transparent 1.4px),radial-gradient(circle at 34% 82%,rgba(179,136,255,.65) 0 1px,transparent 1.5px);background-size:170px 190px,230px 210px,190px 240px,260px 200px;opacity:.8;animation:star-drift 70s linear infinite}
.style-galactic .galaxy-svg{position:relative;z-index:2;width:100%;height:auto;overflow:visible}
.style-galactic .orbit-one{transform-origin:380px 380px;animation:orbit 62s linear infinite}
.style-galactic .orbit-two{transform-origin:380px 380px;animation:orbit 44s linear infinite reverse}
.style-galactic .orbit-three{transform-origin:380px 380px;animation:orbit 80s linear infinite}
.style-galactic .galaxy-moon{animation:moon 14s ease-in-out infinite}
.style-galactic .galaxy-coord,.style-galactic .galaxy-scale{position:absolute;z-index:3;font-family:'Space Grotesk',sans-serif;font-size:8px;letter-spacing:.16em;color:var(--muted);text-transform:uppercase}
.style-galactic .galaxy-coord{left:2%;bottom:12%}
.style-galactic .galaxy-scale{right:0;bottom:8%}
@keyframes orbit{to{transform:rotate(360deg)}}
@keyframes moon{0%,100%{transform:translate(0,0)}50%{transform:translate(-8px,7px)}}
@keyframes star-drift{to{transform:translate(-40px,20px)}}
.style-galactic .manifesto{background:var(--surface);border-top:1px solid rgba(121,232,255,.2);border-bottom:1px solid rgba(121,232,255,.2);max-width:100%;padding-left:max(34px,calc((100vw - 1180px)/2));padding-right:max(34px,calc((100vw - 1180px)/2))}
.style-galactic .statement{font-size:clamp(20px,2.3vw,30px);line-height:1.62;letter-spacing:.005em;color:var(--ink);max-width:880px}
.style-galactic .kicker{color:var(--accent);letter-spacing:.2em}
.style-galactic .aside{border-left:1px solid var(--accent3)}
.style-galactic .aside span{color:var(--accent3)}
.style-galactic .works{padding-top:54px}
.style-galactic .section-head{border-color:rgba(121,232,255,.25)}
.style-galactic .card{background:rgba(13,16,32,.72);border:1px solid rgba(121,232,255,.28);min-height:250px;color:var(--ink)}
.style-galactic .card:hover{background:var(--surface);border-color:var(--accent);transform:translateY(-4px)}
.style-galactic .card-num{color:var(--accent3)}
.style-galactic .card h3{font-size:17px;line-height:1.45;letter-spacing:.02em;margin:10px 0 12px;text-transform:uppercase}
.style-galactic .card p{color:var(--muted);font-size:13px}
.style-galactic .card-link{color:var(--accent)}
.style-galactic .music-room{border-color:rgba(245,200,107,.4);background:linear-gradient(180deg,rgba(13,16,32,.5),rgba(5,6,10,0))}
.style-galactic .music-room h2{font-size:24px;text-transform:uppercase;letter-spacing:.04em;color:var(--accent3)}
.style-galactic .music-room .player{border-color:rgba(121,232,255,.5);background:rgba(2,3,10,.78);padding:16px;grid-template-columns:64px 1fr}
.style-galactic .play{border-color:var(--accent);color:var(--accent);border-radius:50%;width:52px;height:52px;background:rgba(121,232,255,.06)}
.style-galactic .play:hover{background:var(--accent);color:var(--bg)}
.style-galactic .bar{background:rgba(121,232,255,.16);height:2px}
.style-galactic .bar i{background:var(--accent3)}
.style-galactic .player-title{font-family:'Space Grotesk',sans-serif;font-weight:400;letter-spacing:.02em}
.style-galactic .player-note{color:var(--muted);opacity:.8}
.style-galactic .quote{max-width:100%;background:var(--surface);border-top:1px solid rgba(121,232,255,.2);border-bottom:1px solid rgba(121,232,255,.2);padding-top:52px;padding-bottom:52px}
.style-galactic .quote blockquote{font-size:clamp(18px,2.3vw,30px);line-height:1.55;text-transform:uppercase;letter-spacing:.02em;color:var(--ink)}
.style-galactic .quote cite{color:var(--accent)}
.style-galactic .cta{background:linear-gradient(180deg,rgba(13,16,32,.92),rgba(5,6,10,.98));border:1px solid var(--accent3);max-width:1100px;box-shadow:0 0 80px rgba(179,136,255,.08)}
.style-galactic .cta h2{font-size:clamp(20px,2.8vw,34px);line-height:1.45;text-transform:uppercase;letter-spacing:.04em}
.style-galactic .cta .btn{background:var(--accent3);color:var(--bg)}
.style-galactic .cta .btn:hover{background:var(--ink)}
.style-galactic .foot{border-color:rgba(121,232,255,.22);color:var(--muted)}
@media (max-width:980px){.style-galactic .hero{grid-template-columns:1fr;min-height:auto}.style-galactic .galaxy-stage{width:100%;max-width:560px;margin:0 auto}.style-galactic h1{max-width:16ch}.style-galactic .music-room{grid-template-columns:1fr}.style-galactic .music-room .player{grid-template-columns:56px 1fr}}
@media (prefers-reduced-motion:reduce){.style-galactic .orbit-one,.style-galactic .orbit-two,.style-galactic .orbit-three,.style-galactic .galaxy-moon,.style-galactic .galaxy-stars{animation:none}}
`;
  return renderShowcase(brief, preset, {
    art,
    css,
    eyebrow: brief.eyebrow || 'Sesión de cúpula · Sala 01',
    heroNote: 'GALACTIC FUTURISM · ÓRBITA 01',
    sectionTitle: { es: 'Tres ventanas al disco', en: 'Three windows into the record' },
    ctaHeading: { es: 'La memoria sigue sonando.', en: 'The memory keeps playing.' },
    music: brief.audio
      ? {
          src: brief.audio.src,
          title: brief.audio.title,
          subtitle: brief.audio.subtitle,
          note: brief.audio.note,
        }
      : undefined,
  });
}
