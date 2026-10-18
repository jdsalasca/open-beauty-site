import type { Brief, StylePreset } from '../types.js';
import { renderShowcase } from './showcase.js';

export function renderArtDeco(brief: Partial<Brief>, preset: StylePreset): string {
  const art = `<svg class="deco-art" viewBox="0 0 620 660" role="img" aria-label="Sol de oro Art Deco sobre una ciudad escalonada">
  <g fill="none" stroke="var(--accent)" stroke-width="1">
    <rect x="14" y="14" width="592" height="632"/>
    <rect x="26" y="26" width="568" height="608" opacity=".55"/>
  </g>
  <g class="deco-rays" stroke="var(--accent)" stroke-width="1" opacity=".65">
    <path d="M310 310V45"/><path d="M310 310L430 78"/><path d="M310 310L512 160"/><path d="M310 310L548 310"/>
    <path d="M310 310L512 460"/><path d="M310 310L430 542"/><path d="M310 310V575"/><path d="M310 310L190 542"/>
    <path d="M310 310L108 460"/><path d="M310 310L72 310"/><path d="M310 310L108 160"/><path d="M310 310L190 78"/>
  </g>
  <circle cx="310" cy="310" r="176" fill="none" stroke="var(--accent)" stroke-width="2" opacity=".8"/>
  <circle cx="310" cy="310" r="152" fill="var(--accent)" opacity=".14"/>
  <circle cx="310" cy="310" r="118" fill="var(--surface)" stroke="var(--accent)" stroke-width="1"/>
  <path d="M310 208L370 310L310 412L250 310Z" fill="none" stroke="var(--accent)" stroke-width="1.5"/>
  <path d="M310 238L344 310L310 382L276 310Z" fill="var(--accent)" opacity=".85"/>
  <g fill="var(--surface)" stroke="var(--accent)" stroke-width="1">
    <path d="M120 590V500H158V464H190V500H218V590Z"/>
    <path d="M232 590V470H264V430H292V470H318V590Z"/>
    <path d="M334 590V520H362V486H390V520H418V590Z"/>
    <path d="M434 590V446H464V402H494V446H522V590Z"/>
  </g>
  <g stroke="var(--accent)" stroke-width="1" opacity=".7">
    <path d="M120 590H530"/><path d="M102 604H548"/>
    <path d="M148 520H190M148 540H190M148 560H190M260 490H290M260 510H290M260 530H290M360 540H390M360 560H390M458 466H494M458 486H494M458 506H494"/>
  </g>
  <g fill="var(--accent)">
    <path d="M96 120H120V144H96Z"/><path d="M500 120H524V144H500Z"/>
    <path d="M96 476H120V500H96Z"/><path d="M500 476H524V500H500Z"/>
  </g>
</svg>`;
  const css = `
.style-artdeco{background:var(--bg);color:var(--ink)}
.style-artdeco body,.style-artdeco p,.style-artdeco .tagline{font-family:'Josefin Sans',sans-serif}
.style-artdeco h1,.style-artdeco .statement,.style-artdeco .brand,.style-artdeco .card h3,.style-artdeco .quote blockquote,.style-artdeco .cta h2,.style-artdeco .section-head h2{font-family:'Poiret One',cursive}
.style-artdeco .top{border-bottom:1px solid rgba(200,164,92,.45);padding-top:18px;padding-bottom:18px}
.style-artdeco .top nav a{color:var(--muted)}
.style-artdeco .brand{letter-spacing:.18em;font-size:18px}
.style-artdeco .hero{grid-template-columns:1.05fr .95fr;gap:24px;padding-top:34px;padding-bottom:54px;align-items:center}
.style-artdeco .hero-copy{position:relative;z-index:3}
.style-artdeco h1{font-size:clamp(64px,10.2vw,148px);line-height:.88;text-transform:uppercase;letter-spacing:.055em;max-width:8ch}
.style-artdeco h1 em{display:block;color:var(--accent);font-style:normal;letter-spacing:.13em;font-size:.72em}
.style-artdeco .tagline{color:var(--muted);max-width:420px}
.style-artdeco .btn{background:var(--accent);color:var(--bg);border-radius:0;letter-spacing:.2em}
.style-artdeco .btn:hover{background:var(--ink);color:var(--bg)}
.style-artdeco .nav-cta{border-color:var(--accent);color:var(--accent)}
.style-artdeco .hero-art{position:relative;z-index:1}
.style-artdeco .deco-art{width:100%;filter:drop-shadow(0 0 24px rgba(200,164,92,.12))}
.style-artdeco .hero::before{content:"";position:absolute;inset:14px 20px 14px 20px;border:1px solid rgba(200,164,92,.35);pointer-events:none}
.style-artdeco .deco-rays{transform-origin:310px 310px;animation:deco-spin 38s linear infinite}
@keyframes deco-spin{to{transform:rotate(360deg)}}
.style-artdeco .manifesto{border-top:1px solid rgba(200,164,92,.3);border-bottom:1px solid rgba(200,164,92,.3);max-width:1180px}
.style-artdeco .statement{font-size:clamp(28px,3.2vw,44px);line-height:1.14;letter-spacing:.015em}
.style-artdeco .kicker{color:var(--accent);letter-spacing:.24em}
.style-artdeco .works{padding-top:54px}
.style-artdeco .section-head{border-color:var(--accent)}
.style-artdeco .card{background:var(--surface);border:1px solid rgba(200,164,92,.55);min-height:260px;border-radius:0}
.style-artdeco .card::before{content:"";position:absolute;left:18px;right:18px;top:12px;height:1px;background:var(--accent);opacity:.5}
.style-artdeco .card:hover{background:var(--deep);border-color:var(--accent);transform:translateY(-3px)}
.style-artdeco .card h3{font-size:30px;color:var(--ink);letter-spacing:.03em}
.style-artdeco .card:hover h3,.style-artdeco .card:hover p{color:var(--ink)}
.style-artdeco .card-link{color:var(--accent)}
.style-artdeco .quote{background:var(--surface);border-top:1px solid var(--accent);border-bottom:1px solid var(--accent);max-width:100%;padding-top:56px;padding-bottom:56px}
.style-artdeco .quote blockquote{color:var(--ink);font-size:clamp(30px,4vw,52px);letter-spacing:.02em}
.style-artdeco .quote cite{color:var(--accent)}
.style-artdeco .cta{background:var(--accent);border:1px solid var(--accent);color:var(--bg);max-width:1080px}
.style-artdeco .cta .kicker,.style-artdeco .cta h2{color:var(--bg)}
.style-artdeco .cta .btn{background:var(--deep);color:var(--accent);border:1px solid var(--accent)}
.style-artdeco .cta .btn:hover{background:var(--accent);color:var(--deep)}
.style-artdeco .foot{border-color:rgba(200,164,92,.35)}
@media (max-width:980px){.style-artdeco .hero{grid-template-columns:1fr;text-align:center}.style-artdeco h1{max-width:12ch;margin-left:auto;margin-right:auto}.style-artdeco .eyebrow,.style-artdeco .hero-actions{justify-content:center}.style-artdeco .hero-art{max-width:520px;margin:0 auto}.style-artdeco .deco-art{max-height:430px;margin:0 auto}}
@media (prefers-reduced-motion:reduce){.style-artdeco .deco-rays{animation:none}}
`;
  return renderShowcase(brief, preset, {
    art,
    css,
    eyebrow: brief.eyebrow || 'Una lección en oro y negro · 1925',
    heroNote: '01 — Art Deco / Nueva York · París',
    sectionTitle: { es: 'Tres maneras de mirar hacia arriba', en: 'Three ways of looking up' },
  });
}

export function renderIsotype(brief: Partial<Brief>, preset: StylePreset): string {
  const person = `<svg class="picto" viewBox="0 0 20 30" aria-hidden="true"><circle cx="10" cy="4" r="3.2"/><path d="M6 10h8l2 9h-3l-1 11h-2l-1-11-1 11H6L5 19H2z"/></svg>`;
  const house = `<svg class="picto" viewBox="0 0 26 26" aria-hidden="true"><path d="M2 12L13 3l11 9h-3v11h-6v-7h-4v7H5V12z"/></svg>`;
  const tree = `<svg class="picto" viewBox="0 0 24 30" aria-hidden="true"><path d="M12 2c5 0 8 4 8 8 0 3-2 5-4 7h-2v11h-4V17H8c-2-2-4-4-4-7 0-4 3-8 8-8z"/></svg>`;
  const art = `<div class="iso-board">
  <div class="iso-head"><span>WIEN · 1925</span><span>SOZIALBAUTEN</span></div>
  <div class="iso-tabs" role="tablist" aria-label="Año del censo">
    <button class="is-active" data-tab="1925">1925</button>
    <button data-tab="1934">1934</button>
  </div>
  <div class="iso-view is-active" data-view="1925">
    <div class="iso-row"><span class="iso-label">VIVIENDA</span><div class="iso-pictos">${house.repeat(7)}</div><b data-count="68" data-suffix="%">0%</b></div>
    <div class="iso-row"><span class="iso-label">ESCUELAS</span><div class="iso-pictos">${house.repeat(4)}</div><b data-count="42" data-suffix="%">0%</b></div>
    <div class="iso-row"><span class="iso-label">PARQUES</span><div class="iso-pictos">${tree.repeat(3)}</div><b data-count="31" data-suffix="%">0%</b></div>
  </div>
  <div class="iso-view" data-view="1934">
    <div class="iso-row"><span class="iso-label">VIVIENDA</span><div class="iso-pictos">${house.repeat(9)}</div><b data-count="81" data-suffix="%">0%</b></div>
    <div class="iso-row"><span class="iso-label">ESCUELAS</span><div class="iso-pictos">${house.repeat(6)}</div><b data-count="57" data-suffix="%">0%</b></div>
    <div class="iso-row"><span class="iso-label">PARQUES</span><div class="iso-pictos">${tree.repeat(5)}</div><b data-count="49" data-suffix="%">0%</b></div>
  </div>
  <div class="iso-foot"><span>1 pictograma = 10.000 unidades</span><span>01 / 03</span></div>
</div>`;
  const css = `
.style-isotype{background:var(--bg);color:var(--ink)}
.style-isotype body,.style-isotype p{font-family:'IBM Plex Sans',sans-serif}
.style-isotype h1,.style-isotype .statement,.style-isotype .brand,.style-isotype .card h3,.style-isotype .quote blockquote,.style-isotype .cta h2,.style-isotype .section-head h2{font-family:'Jost',sans-serif}
.style-isotype .top{border-bottom:1px solid var(--ink);padding-top:14px;padding-bottom:14px}
.style-isotype .brand{text-transform:none;font-size:22px;letter-spacing:-.02em}
.style-isotype .brand .mark{color:var(--accent)}
.style-isotype .hero{grid-template-columns:1.06fr .94fr;padding-top:44px;padding-bottom:46px}
.style-isotype h1{font-size:clamp(62px,8.6vw,122px);line-height:.88;letter-spacing:-.035em;max-width:9ch;font-weight:700}
.style-isotype h1 em{color:var(--accent);font-weight:500}
.style-isotype .tagline{max-width:430px}
.style-isotype .btn{background:var(--ink);color:var(--bg);border-radius:0}
.style-isotype .btn:hover{background:var(--accent);color:var(--bg)}
.style-isotype .nav-cta{border:1px solid var(--ink);background:var(--accent);color:var(--bg)}
.style-isotype .iso-board{background:var(--surface);border:1px solid var(--ink);padding:18px 18px 14px;font-family:'IBM Plex Sans',sans-serif;box-shadow:8px 8px 0 var(--ink)}
.style-isotype .iso-head,.style-isotype .iso-foot{display:flex;justify-content:space-between;gap:10px;font-size:9px;letter-spacing:.12em;text-transform:uppercase}
.style-isotype .iso-head{border-bottom:1px solid var(--ink);padding-bottom:10px}
.style-isotype .iso-foot{border-top:1px solid var(--ink);padding-top:10px;margin-top:16px;color:var(--muted)}
.style-isotype .iso-tabs{display:flex;gap:0;margin:12px 0 4px}
.style-isotype .iso-tabs button{border:1px solid var(--ink);padding:5px 12px;font-size:10px;letter-spacing:.08em;background:transparent;color:var(--ink)}
.style-isotype .iso-tabs button+button{border-left:0}
.style-isotype .iso-tabs button.is-active{background:var(--ink);color:var(--bg)}
.style-isotype .iso-view{display:none;padding-top:8px}
.style-isotype .iso-view.is-active{display:block}
.style-isotype .iso-row{display:grid;grid-template-columns:88px 1fr 50px;align-items:center;gap:10px;border-bottom:1px solid rgba(28,28,28,.2);padding:11px 0}
.style-isotype .iso-label{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.style-isotype .iso-pictos{display:flex;gap:5px;flex-wrap:wrap;color:var(--accent)}
.style-isotype .iso-pictos .picto{width:15px;height:22px;fill:currentColor}
.style-isotype .iso-row:nth-child(2) .iso-pictos{color:var(--accent2)}
.style-isotype .iso-row:nth-child(3) .iso-pictos{color:var(--accent3)}
.style-isotype .iso-row b{font-family:'Jost',sans-serif;font-size:22px;font-weight:500;text-align:right;font-variant-numeric:tabular-nums}
.style-isotype .manifesto{border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);background:var(--surface)}
.style-isotype .statement{font-size:clamp(26px,3vw,40px);line-height:1.18;font-weight:500}
.style-isotype .kicker{color:var(--accent)}
.style-isotype .works{padding-top:50px}
.style-isotype .cards{gap:0;border-top:1px solid var(--ink)}
.style-isotype .card{border:0;border-bottom:1px solid var(--ink);background:transparent;min-height:190px;display:grid;grid-template-columns:38px 1fr;grid-template-rows:auto auto 1fr auto;column-gap:16px;padding:18px 12px}
.style-isotype .card-num{grid-row:1/5;font-family:'Jost',sans-serif;font-size:13px;color:var(--accent);border-right:1px solid var(--ink);padding-right:10px}
.style-isotype .card-kicker{grid-column:2;margin:0}
.style-isotype .card h3{grid-column:2;font-size:25px;margin:6px 0 8px}
.style-isotype .card p{grid-column:2;font-size:13px;margin:0 0 12px}
.style-isotype .card-link{grid-column:2;color:var(--accent)}
.style-isotype .card:hover{background:var(--surface);transform:none}
.style-isotype .quote{background:var(--accent);color:var(--bg);max-width:100%;padding-top:50px;padding-bottom:50px}
.style-isotype .quote blockquote{font-weight:500;letter-spacing:-.025em}
.style-isotype .quote cite{color:var(--bg)}
.style-isotype .cta{border:1px solid var(--ink);background:var(--surface);box-shadow:10px 10px 0 var(--accent)}
.style-isotype .cta .btn{background:var(--ink)}
.style-isotype .cta .btn:hover{background:var(--accent);color:var(--bg)}
.style-isotype .foot{border-color:var(--ink)}
@media (max-width:980px){.style-isotype .hero{grid-template-columns:1fr}.style-isotype .iso-board{max-width:560px;margin:0 auto}}
`;
  return renderShowcase(brief, preset, {
    art,
    css,
    eyebrow: brief.eyebrow || 'Instituto de Viena · Método Isotype',
    heroNote: '02 — Wien / 1925–1934',
    sectionTitle: { es: 'La ciudad, contada en unidades', en: 'The city, counted in units' },
  });
}

export function renderOpArt(brief: Partial<Brief>, preset: StylePreset): string {
  const art = `<div class="op-field">
  <div class="op-layer op-a"></div>
  <div class="op-layer op-b"></div>
  <div class="op-disc"></div>
  <div class="op-core">MIRA<br>ME</div>
  <button class="op-toggle" type="button" data-toggle="is-paused">CONGELAR</button>
  <span class="op-caption">FIG. 01 — INTERFERENCIA</span>
</div>`;
  const css = `
.style-opart{background:var(--bg);color:var(--ink)}
.style-opart body,.style-opart p{font-family:'Space Grotesk',sans-serif}
.style-opart h1,.style-opart .statement,.style-opart .brand,.style-opart .card h3,.style-opart .quote blockquote,.style-opart .cta h2,.style-opart .section-head h2{font-family:'Archivo Black',sans-serif}
.style-opart .top{border-bottom:1px solid rgba(247,247,242,.32)}
.style-opart .brand{letter-spacing:.03em;font-size:18px}
.style-opart .hero{grid-template-columns:1.02fr .98fr;padding-top:36px;padding-bottom:54px}
.style-opart h1{font-size:clamp(62px,9.8vw,142px);line-height:.82;letter-spacing:-.045em;text-transform:uppercase;max-width:8ch}
.style-opart h1 em{color:var(--accent);font-style:normal;display:block;transform:translateX(8%)}
.style-opart .tagline{max-width:410px;color:var(--muted)}
.style-opart .btn{background:var(--accent);color:var(--bg);clip-path:polygon(0 0,100% 0,100% 72%,92% 100%,0 100%)}
.style-opart .btn:hover{background:var(--accent3);color:var(--bg);transform:translate(-3px,-3px)}
.style-opart .nav-cta{border:2px solid var(--ink)}
.style-opart .op-field{position:relative;aspect-ratio:1;overflow:hidden;background:var(--surface);border:2px solid var(--ink);isolation:isolate}
.style-opart .op-layer{position:absolute;inset:-22%;transition:transform .08s linear;will-change:transform}
.style-opart .op-a{background:repeating-linear-gradient(45deg,var(--bg) 0 10px,var(--surface) 10px 20px);transform:translate(calc(var(--mx,0) * 14px),calc(var(--my,0) * 14px))}
.style-opart .op-b{background:repeating-linear-gradient(-45deg,var(--bg) 0 13px,var(--surface) 13px 26px);mix-blend-mode:difference;transform:translate(calc(var(--mx,0) * -20px),calc(var(--my,0) * -20px))}
.style-opart .op-disc{position:absolute;inset:26%;border-radius:50%;background:repeating-radial-gradient(circle at 50% 50%,var(--accent) 0 6px,var(--surface) 6px 13px);border:2px solid var(--ink);mix-blend-mode:difference}
.style-opart .op-core{position:absolute;inset:42% 30%;display:grid;place-items:center;text-align:center;font-family:'Archivo Black',sans-serif;font-size:22px;line-height:.9;color:var(--bg);background:var(--accent3);border:2px solid var(--bg);transform:rotate(-6deg)}
.style-opart .op-toggle{position:absolute;left:12px;bottom:12px;z-index:3;background:var(--bg);color:var(--ink);border:2px solid var(--bg);padding:7px 10px;font-family:'Space Grotesk',sans-serif;font-size:9px;letter-spacing:.14em}
.style-opart .op-caption{position:absolute;right:12px;bottom:14px;z-index:3;font-family:'Space Grotesk',sans-serif;font-size:8px;letter-spacing:.14em;color:var(--bg)}
.style-opart.is-paused .op-layer,.style-opart.is-paused .op-disc{transform:none!important}
.style-opart .manifesto{border-top:2px solid var(--bg);border-bottom:2px solid var(--bg);background:var(--surface);color:var(--bg)}
.style-opart .statement{font-size:clamp(28px,3.2vw,42px);line-height:1.12}
.style-opart .works{padding-top:44px}
.style-opart .section-head{border-color:var(--accent)}
.style-opart .card{background:var(--surface);color:var(--bg);border:2px solid var(--bg);min-height:250px;border-radius:0}
.style-opart .card:nth-child(2){background:var(--accent);}
.style-opart .card:nth-child(3){background:var(--accent3)}\n.style-opart .card:nth-child(2) p,.style-opart .card:nth-child(3) p{color:var(--bg)}\n.style-opart .card:nth-child(2) .card-link,.style-opart .card:nth-child(3) .card-link{color:var(--bg)}
.style-opart .card::after{content:"";position:absolute;left:0;right:0;top:0;height:12px;background:repeating-linear-gradient(90deg,var(--ink) 0 8px,transparent 8px 16px);opacity:.4}
.style-opart .card:hover{transform:translate(-4px,-4px);box-shadow:8px 8px 0 var(--accent)}
.style-opart .card-num,.style-opart .card-link,.style-opart .aside span{color:var(--bg)}
.style-opart .quote{background:var(--accent);color:var(--bg);max-width:100%;padding-top:50px;padding-bottom:50px}
.style-opart .quote blockquote{font-size:clamp(30px,4vw,52px);text-transform:uppercase;letter-spacing:-.03em}
.style-opart .quote cite{color:var(--bg)}
.style-opart .cta{border:2px solid var(--bg);background:var(--surface);color:var(--bg);max-width:1000px}
.style-opart .cta .btn{background:var(--ink);color:var(--surface)}
.style-opart .cta .btn:hover{background:var(--accent);color:var(--ink)}
.style-opart .foot{border-color:rgba(247,247,242,.32)}
@media (max-width:980px){.style-opart .hero{grid-template-columns:1fr}.style-opart .op-field{max-width:560px;margin:0 auto}.style-opart h1{font-size:clamp(54px,12vw,92px)}}
@media (prefers-reduced-motion:reduce){.style-opart .op-layer{transition:none}}
`;
  return renderShowcase(brief, preset, {
    art,
    css,
    eyebrow: brief.eyebrow || 'Un ensayo sobre la percepción · Serie óptica',
    heroNote: '03 — Op Art / Londres · 1964',
    sectionTitle: { es: 'El ojo completa la imagen', en: 'The eye completes the image' },
  });
}

export function renderUkiyoe(brief: Partial<Brief>, preset: StylePreset): string {
  const art = `<div class="ukiyo-wrap">
  <div class="ukiyo-cartouche">浮世絵</div>
  <svg class="ukiyo-art" viewBox="0 0 900 700" role="img" aria-label="Ola de estilo ukiyo-e con espuma y un sol rojo">
    <rect width="900" height="700" fill="var(--surface)"/>
    <circle cx="700" cy="168" r="62" fill="var(--accent2)"/>
    <g fill="var(--accent3)" opacity=".35">
      <path d="M0 310c120-34 220 20 310-6s210-70 330-38 190 22 260-6v440H0Z"/>
    </g>
    <g class="ukiyo-wave ukiyo-wave-back">
      <path d="M-40 430c140-84 232 4 350-34s212-104 340-70 196 72 290 12v362H-40Z" fill="var(--accent3)" opacity=".7"/>
      <path d="M-40 470c150-66 230 22 348-14s224-84 340-46 190 58 292 4v286H-40Z" fill="var(--accent)" opacity=".9"/>
    </g>
    <g class="ukiyo-wave ukiyo-wave-front">
      <path d="M-40 545c128-74 238 18 354-22s220-96 338-56 198 66 288 12v221H-40Z" fill="var(--accent)"/>
      <path d="M-40 590c150-50 250 14 360-18s232-64 338-32 188 42 282 2v158H-40Z" fill="var(--accent4)"/>
    </g>
    <g class="ukiyo-foam" fill="none" stroke="var(--bg)" stroke-width="6" stroke-linecap="round">
      <path d="M74 548c24-42 60-54 100-42 30 9 38 32 24 50-12 16-36 14-42-2-7-20 22-30 38-14"/>
      <path d="M300 536c20-36 52-50 88-40 26 7 34 28 22 43-11 14-32 13-38-2-6-17 19-26 32-12"/>
      <path d="M548 552c26-40 62-52 102-40 28 8 36 31 22 47-12 14-34 12-40-2-6-18 21-28 36-13"/>
      <path d="M744 600c18-30 46-40 76-32 22 6 30 24 20 36-9 11-26 10-32-2-4-13 15-21 27-10"/>
    </g>
    <g fill="var(--bg)" opacity=".9">
      <circle cx="112" cy="548" r="5"/><circle cx="150" cy="566" r="3"/><circle cx="332" cy="534" r="4"/><circle cx="374" cy="548" r="3"/><circle cx="590" cy="550" r="5"/><circle cx="628" cy="564" r="3"/>
    </g>
    <path d="M0 642h900" stroke="var(--accent)" stroke-width="2" opacity=".5"/>
    <g fill="var(--accent)" opacity=".85">
      <path d="M90 140h16v34H90zM114 122h12v52h-12zM700 600h22v12h-22z"/>
    </g>
  </svg>
</div>`;
  const css = `
.style-ukiyoe{background:var(--bg);color:var(--ink)}
.style-ukiyoe body,.style-ukiyoe p{font-family:'Zen Kaku Gothic New',sans-serif}
.style-ukiyoe h1,.style-ukiyoe .statement,.style-ukiyoe .brand,.style-ukiyoe .card h3,.style-ukiyoe .quote blockquote,.style-ukiyoe .cta h2,.style-ukiyoe .section-head h2{font-family:'Shippori Mincho B1',serif}
.style-ukiyoe .top{border-bottom:1px solid rgba(34,32,29,.25)}
.style-ukiyoe .brand{text-transform:none;letter-spacing:.08em}
.style-ukiyoe .brand .mark{color:var(--accent2)}
.style-ukiyoe .hero{grid-template-columns:1fr 1.08fr;gap:20px;padding-top:28px;padding-bottom:18px;max-width:1360px}
.style-ukiyoe h1{font-size:clamp(58px,8.2vw,112px);line-height:1.02;letter-spacing:-.03em;font-weight:700;max-width:9ch}
.style-ukiyoe h1 em{color:var(--accent);font-style:normal;display:block}
.style-ukiyoe .tagline{max-width:390px;color:var(--muted)}
.style-ukiyoe .btn{background:var(--accent);color:var(--bg)}
.style-ukiyoe .btn:hover{background:var(--accent2);color:var(--bg)}
.style-ukiyoe .nav-cta{border:1px solid var(--accent);color:var(--accent)}
.style-ukiyoe .hero-art{position:relative}
.style-ukiyoe .ukiyo-wrap{position:relative;margin-right:calc((100vw - 1280px) / -2 + 10px)}
.style-ukiyoe .ukiyo-art{width:100%;height:auto;border:1px solid rgba(34,32,29,.25)}
.style-ukiyoe .ukiyo-cartouche{position:absolute;right:14px;top:12px;z-index:3;writing-mode:vertical-rl;font-family:'Shippori Mincho B1',serif;font-size:17px;letter-spacing:.22em;color:var(--accent2);background:var(--bg);padding:10px 7px;border:1px solid var(--accent2)}
.style-ukiyoe .ukiyo-wave-back{animation:ukiyo-drift 12s ease-in-out infinite}
.style-ukiyoe .ukiyo-wave-front{animation:ukiyo-drift 9s ease-in-out infinite reverse}
@keyframes ukiyo-drift{0%,100%{transform:translateX(0)}50%{transform:translateX(-12px)}}
.style-ukiyoe .ukiyo-foam{animation:foam 6s ease-in-out infinite}
@keyframes foam{0%,100%{opacity:.7}50%{opacity:1}}
.style-ukiyoe .manifesto{border-top:1px solid rgba(34,32,29,.25);border-bottom:1px solid rgba(34,32,29,.25);max-width:1180px}
.style-ukiyoe .statement{font-size:clamp(28px,3.2vw,42px);line-height:1.24;font-weight:400}
.style-ukiyoe .kicker{color:var(--accent2)}
.style-ukiyoe .works{padding-top:44px}
.style-ukiyoe .section-head{border-color:var(--accent)}
.style-ukiyoe .cards{gap:0}
.style-ukiyoe .card{background:transparent;border:0;border-top:1px solid var(--accent);padding:20px 22px 16px;min-height:220px}
.style-ukiyoe .card:nth-child(2){border-top-color:var(--accent2)}
.style-ukiyoe .card:nth-child(3){border-top-color:var(--accent4)}
.style-ukiyoe .card:hover{background:rgba(220,230,227,.35);transform:none}
.style-ukiyoe .card h3{font-size:28px;letter-spacing:0}
.style-ukiyoe .quote{background:var(--accent);color:var(--bg);max-width:100%;padding-top:50px;padding-bottom:50px}
.style-ukiyoe .quote blockquote{font-size:clamp(28px,3.8vw,48px);font-weight:400}
.style-ukiyoe .quote cite{color:var(--bg);opacity:.75}
.style-ukiyoe .cta{background:var(--surface);border:1px solid var(--accent);max-width:1000px}
.style-ukiyoe .cta .btn{background:var(--accent2);color:var(--bg)}
.style-ukiyoe .cta .btn:hover{background:var(--accent);color:var(--bg)}
.style-ukiyoe .foot{border-color:rgba(34,32,29,.3)}
@media (max-width:980px){.style-ukiyoe .hero{grid-template-columns:1fr}.style-ukiyoe .ukiyo-wrap{margin-right:0}.style-ukiyoe .ukiyo-art{max-height:520px}.style-ukiyoe .ukiyo-cartouche{font-size:13px}.style-ukiyoe .ukiyo-wave-back,.style-ukiyoe .ukiyo-wave-front,.style-ukiyoe .ukiyo-foam{animation:none}}
@media (prefers-reduced-motion:reduce){.style-ukiyoe .ukiyo-wave-back,.style-ukiyoe .ukiyo-wave-front,.style-ukiyoe .ukiyo-foam{animation:none!important}}
`;
  return renderShowcase(brief, preset, {
    art,
    css,
    eyebrow: brief.eyebrow || 'Estampa del mundo flotante · Edición Meiji',
    heroNote: '04 — Ukiyo-e / Edo · 1831',
    sectionTitle: { es: 'El mundo flotante, en tres estampas', en: 'The floating world, in three prints' },
  });
}
