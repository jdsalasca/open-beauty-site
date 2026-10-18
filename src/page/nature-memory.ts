import type { Brief, StylePreset } from '../types.js';
import { arrowSvg, esc, labels, normalizeBrief, safeHref, shell, splitAccent, t, REVEAL_SCRIPT } from './common.js';
import { sceneArt } from '../art.js';

function leafMark(): string {
  return `<svg class="leaf-mark" viewBox="0 0 120 40" aria-hidden="true"><path d="M4 34c18-2 30-13 38-30M42 6c12 2 22 9 28 21M14 30c8-9 18-13 30-12" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`;
}

export function renderNatureMemory(input: Partial<Brief>, preset: StylePreset): string {
  const brief = normalizeBrief(input);
  const locale = brief.locale ?? 'es';
  const l = labels(locale);
  const brand = brief.brand || brief.title;
  const split = splitAccent(brief.title);
  const subfamily = brief.subfamily ? preset.subfamilies?.find((item) => item.slug === brief.subfamily) : undefined;
  const accent = subfamily ? preset.palette[subfamily.accent] : preset.palette.accent;
  const line = preset.rules.borderWidths[0] ?? 1;
  const radius = preset.rules.radius[1] ?? 0;
  const sections = brief.sections ?? [];
  const year = new Date().getFullYear();
  const body = `<div class="nature-frame" aria-hidden="true"></div>
<header class="nature-top">
  <a class="nature-brand" href="#top">${esc(brand)}</a>
  <p class="nature-folio">${esc(t(locale, 'Herbario editorial', 'Editorial herbarium'))} · ${String(sections.length).padStart(2, '0')} ${esc(t(locale, 'pliegos', 'sheets'))} · ${year}</p>
  <nav aria-label="${esc(t(locale, 'Secciones', 'Sections'))}"><a href="#pliegos">${esc(l.works)}</a><a href="#manifiesto">${esc(l.manifesto)}</a><a href="#contacto">${esc(l.contact)}</a></nav>
</header>

<main id="top">
  <section class="nature-hero" aria-labelledby="nature-title">
    <div class="nature-copy reveal">
      <p class="nature-kicker">${esc(brief.eyebrow || t(locale, 'Archivo botánico · 2026', 'Botanical archive · 2026'))}</p>
      <h1 id="nature-title">${esc(split.main)}${split.accent ? `<br><em>${esc(split.accent)}</em>` : ''}</h1>
      ${brief.tagline ? `<p class="nature-tagline">${esc(brief.tagline)}</p>` : ''}
      ${brief.intro ? `<p class="nature-intro">${esc(brief.intro)}</p>` : ''}
      <div class="nature-actions"><a class="nature-button" href="${safeHref(brief.cta?.href || '#pliegos')}">${esc(brief.cta?.label || t(locale, 'Abrir el herbario', 'Open the herbarium'))} ${arrowSvg(16)}</a><a class="nature-quiet" href="#manifiesto">${esc(t(locale, 'Leer la nota', 'Read the note'))}</a></div>
    </div>
    <figure class="nature-plate reveal" style="--i:1">
      <div class="nature-plate-head"><span>${esc(t(locale, 'Lámina 01', 'Plate 01'))}</span><span>${esc(t(locale, 'Prensado / 2026', 'Pressed / 2026'))}</span></div>
      <div class="nature-plate-art">${sceneArt(preset, 0, brief.eyebrow || 'HERBARIUM', 'plant')}</div>
      <figcaption><span>${esc(t(locale, 'Espécimen de archivo', 'Archive specimen'))}</span><span>${esc(brand)}</span></figcaption>
    </figure>
  </section>

  <section class="nature-manifesto" id="manifiesto" aria-labelledby="manifesto-title">
    <div class="nature-section-label">${leafMark()}<span>${esc(t(locale, 'Nota de campo', 'Field note'))}</span></div>
    <div class="nature-manifesto-copy reveal"><h2 id="manifesto-title">${esc(sections[0]?.title || t(locale, 'Lo que se guarda también crece.', 'What is kept also grows.'))}</h2><p>${esc(brief.intro || t(locale, 'Un archivo no es un depósito: es una forma de seguir mirando. Cada hoja conserva una fecha, una sombra y una pregunta.', 'An archive is not a store: it is a way of looking again. Every leaf keeps a date, a shadow and a question.'))}</p></div>
    <aside class="nature-note reveal" style="--i:2"><span class="nature-vertical">${esc(t(locale, 'Herbario', 'Herbarium'))}</span><p>${esc(t(locale, 'La precisión no enfría la imagen: la vuelve habitable.', 'Precision does not cool the image: it makes it habitable.'))}</p></aside>
  </section>

  <section class="nature-drawers" id="pliegos" aria-labelledby="drawers-title">
    <div class="nature-section-head reveal"><div><p class="nature-kicker">${esc(t(locale, 'Pliegos / selección', 'Sheets / selection'))}</p><h2 id="drawers-title">${esc(t(locale, 'Tres formas de recordar una planta.', 'Three ways to remember a plant.'))}</h2></div><span class="nature-count">${String(sections.length).padStart(2, '0')} ${esc(t(locale, 'piezas', 'pieces'))}</span></div>
    <div class="nature-grid">${sections.map((section, index) => `<article class="nature-drawer reveal" style="--i:${index + 1}"><div class="nature-drawer-top"><span>${String(index + 1).padStart(2, '0')}</span>${leafMark()}</div><h3>${esc(section.title)}</h3><p>${esc(section.body)}</p><a href="#contacto">${esc(l.readMore)} ${arrowSvg(13)}</a></article>`).join('')}</div>
  </section>

  ${brief.quote?.text ? `<section class="nature-quote reveal"><span class="nature-quote-mark">“</span><blockquote>${esc(brief.quote.text)}</blockquote><cite>${esc(brief.quote.author || brand)}</cite></section>` : ''}

  <section class="nature-cta" id="contacto" aria-labelledby="cta-title">
    <div class="nature-cta-copy"><p class="nature-kicker">${esc(t(locale, 'Siguiente pliego', 'Next sheet'))}</p><h2 id="cta-title">${esc(t(locale, 'Traé una semilla. Nosotros ponemos el archivo.', 'Bring a seed. We bring the archive.'))}</h2><p>${esc(brief.tagline || t(locale, 'Una página puede ser un lugar para volver.', 'A page can be a place to return to.'))}</p></div>
    <a class="nature-button" href="${safeHref(brief.cta?.href || '#')}">${esc(brief.cta?.label || t(locale, 'Escribinos', 'Write to us'))} ${arrowSvg(16)}</a>
  </section>
</main>
<footer class="nature-foot"><span>${esc(brand)} · ${year}</span><span>${esc(brief.footer || t(locale, 'Archivo vivo · fuentes a la vista', 'Living archive · sources in view'))}</span><span><a href="#top">${esc(l.backToTop)} ↑</a></span></footer>`;

  const css = `:root{--bg:${preset.palette.bg};--surface:${preset.palette.surface};--ink:${preset.palette.ink};--muted:${preset.palette.muted};--accent:${accent};--accent2:${preset.palette.accent2};--accent3:${preset.palette.accent3};--accent4:${preset.palette.accent4};--deep:${preset.palette.deep};--line:${line}px;--radius:${radius}px;--display:'Cormorant Garamond',serif;--body:'Karla',sans-serif;--mono:'IBM Plex Mono',monospace;--ease:cubic-bezier(.22,.61,.36,1)}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body.nature-memory{margin:0;background:var(--bg);color:var(--ink);font-family:'Karla',sans-serif;font-size:18px;line-height:1.68;-webkit-font-smoothing:antialiased}
body.nature-memory a{color:inherit;text-decoration:none}
.nature-frame{position:fixed;inset:14px;z-index:40;border:var(--line) solid color-mix(in srgb,var(--ink) 30%,transparent);pointer-events:none}
.nature-top{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:26px clamp(24px,5vw,76px) 18px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--muted)}
.nature-brand{font-family:'Cormorant Garamond',serif;font-size:23px;letter-spacing:.03em;text-transform:none;color:var(--ink)}.nature-folio{margin:0;text-align:center}.nature-top nav{display:flex;gap:18px}.nature-top nav a{color:var(--muted);border-bottom:1px solid transparent;padding-bottom:2px}.nature-top nav a:hover{color:var(--ink);border-color:var(--accent)}
.nature-hero{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);gap:clamp(30px,6vw,90px);align-items:center;max-width:1320px;margin:0 auto;padding:clamp(50px,8vh,100px) clamp(24px,6vw,76px) clamp(64px,9vh,110px)}
.nature-kicker{margin:0 0 18px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent3)}
h1,h2,h3{font-family:'Cormorant Garamond',serif;font-weight:400;letter-spacing:.005em;line-height:1.02;margin:0;text-wrap:balance}
h1{font-size:clamp(50px,7.2vw,112px);max-width:12ch}h1 em{color:var(--accent);font-weight:400}
.nature-tagline{font-size:clamp(21px,2.1vw,28px);line-height:1.3;max-width:28ch;margin:26px 0 0;color:var(--ink)}
.nature-intro{max-width:48ch;margin:18px 0 0;color:var(--muted);font-size:17px}
.nature-actions{display:flex;align-items:center;gap:22px;flex-wrap:wrap;margin-top:30px}
.nature-button{display:inline-flex;align-items:center;gap:10px;padding:12px 16px;background:var(--accent);color:var(--bg);border:var(--line) solid var(--accent);font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;transition:transform .3s var(--ease),background .3s,color .3s}.nature-button:hover{transform:translateY(-2px);background:var(--ink);border-color:var(--ink);color:var(--bg)}
.nature-quiet{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;border-bottom:1px solid var(--muted);padding-bottom:3px;color:var(--muted)}
.nature-plate{margin:0;padding:14px;background:var(--surface);border:var(--line) solid color-mix(in srgb,var(--ink) 28%,transparent);border-radius:var(--radius);box-shadow:0 18px 40px rgba(36,48,38,.14);transform:rotate(1.2deg)}
.nature-plate-head{display:flex;justify-content:space-between;gap:12px;padding:0 2px 10px;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.nature-plate-art{overflow:hidden;border:var(--line) solid color-mix(in srgb,var(--ink) 28%,transparent);border-radius:calc(var(--radius) * .55);aspect-ratio:1/1}
.nature-plate-art .scene-art{min-height:100%;border:0;border-radius:0;height:100%}
.nature-plate figcaption{display:flex;justify-content:space-between;gap:12px;padding-top:10px;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.nature-manifesto{position:relative;display:grid;grid-template-columns:.35fr 1fr .5fr;gap:clamp(20px,5vw,70px);max-width:1200px;margin:0 auto;padding:clamp(60px,9vh,110px) clamp(24px,6vw,76px);border-top:var(--line) solid color-mix(in srgb,var(--ink) 24%,transparent)}
.nature-section-label{display:flex;align-items:flex-start;gap:12px;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent3)}.leaf-mark{width:90px;height:34px;color:var(--accent)}.nature-section-label .leaf-mark{width:48px}
.nature-manifesto-copy h2{font-size:clamp(38px,5.5vw,82px);max-width:12ch}.nature-manifesto-copy p{max-width:56ch;margin:24px 0 0;color:var(--muted);font-size:19px}
.nature-note{position:relative;align-self:stretch;border-left:var(--line) solid var(--accent2);padding-left:18px;color:var(--muted);font-size:15px}.nature-note p{margin:0;max-width:23ch}.nature-vertical{display:block;writing-mode:vertical-rl;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent2);margin-bottom:18px}
.nature-drawers{max-width:1320px;margin:0 auto;padding:clamp(60px,9vh,110px) clamp(24px,6vw,76px);border-top:var(--line) solid color-mix(in srgb,var(--ink) 24%,transparent)}
.nature-section-head{display:flex;justify-content:space-between;gap:24px;align-items:end;margin-bottom:42px}.nature-section-head h2{font-size:clamp(36px,5vw,72px);max-width:12ch}.nature-count{font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.nature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;border-top:var(--line) solid color-mix(in srgb,var(--ink) 34%,transparent)}
.nature-drawer{border-right:var(--line) solid color-mix(in srgb,var(--ink) 22%,transparent);padding:22px 24px 26px 0;min-height:260px;display:flex;flex-direction:column}.nature-drawer:last-child{border-right:0}.nature-drawer-top{display:flex;justify-content:space-between;align-items:start;color:var(--accent3);font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em}.nature-drawer-top .leaf-mark{width:54px;color:var(--accent)}.nature-drawer h3{font-size:clamp(28px,3vw,42px);margin:32px 0 10px;max-width:12ch}.nature-drawer p{color:var(--muted);font-size:16px;line-height:1.62;margin:0 0 24px}.nature-drawer a{margin-top:auto;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent3)}.nature-drawer a svg{transition:transform .3s var(--ease)}.nature-drawer a:hover svg{transform:translateX(4px)}
.nature-quote{max-width:1100px;margin:0 auto;padding:clamp(60px,9vh,110px) clamp(24px,7vw,90px);border-top:var(--line) solid color-mix(in srgb,var(--ink) 24%,transparent)}.nature-quote-mark{display:block;font-family:'Cormorant Garamond',serif;font-size:100px;line-height:.55;color:var(--accent2)}.nature-quote blockquote{max-width:21ch;margin:10px 0 0;font-family:'Cormorant Garamond',serif;font-size:clamp(34px,5vw,72px);line-height:1.04}.nature-quote cite{display:block;margin-top:22px;font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-style:normal}
.nature-cta{display:flex;justify-content:space-between;align-items:end;gap:30px;max-width:1200px;margin:0 auto;padding:clamp(60px,10vh,120px) clamp(24px,6vw,76px);border-top:var(--line) solid var(--accent)}.nature-cta h2{font-size:clamp(40px,6vw,92px);max-width:12ch}.nature-cta p:not(.nature-kicker){max-width:42ch;color:var(--muted);margin:20px 0 0}
.nature-foot{display:flex;justify-content:space-between;gap:18px;border-top:var(--line) solid color-mix(in srgb,var(--ink) 24%,transparent);padding:18px clamp(24px,5vw,76px);font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
@media(max-width:900px){.nature-top .nature-folio{display:none}.nature-hero{grid-template-columns:1fr;gap:34px}.nature-plate{max-width:560px;margin:0 auto;transform:none}.nature-manifesto{grid-template-columns:1fr}.nature-note{display:none}.nature-grid{grid-template-columns:1fr}.nature-drawer{border-right:0;border-bottom:var(--line) solid color-mix(in srgb,var(--ink) 22%,transparent);padding-right:0}.nature-cta{display:block}.nature-cta .nature-button{margin-top:26px}}
@media(max-width:560px){.nature-frame{inset:7px}.nature-top{padding-top:24px}.nature-top nav{gap:10px;font-size:9px}.nature-hero{padding-top:36px}.nature-plate{padding:9px}.nature-manifesto-copy h2{font-size:44px}.nature-foot{display:block;line-height:2}}
@media print{.nature-frame,.nature-top,.nature-drawer a,.nature-cta .nature-button,.motion-toggle{display:none!important}.nature-plate{transform:none;box-shadow:none}.nature-hero,.nature-manifesto,.nature-drawers,.nature-quote,.nature-cta{page-break-after:always;padding:34px}}`;

  const script = `${REVEAL_SCRIPT}\n(() => { const season = new URLSearchParams(location.search).get('season'); if (season) document.body.dataset.season = season; })();`;

  return shell({
    lang: locale,
    title: `${brief.title} — ${brand}`,
    description: brief.tagline || brief.intro || brief.title,
    preset,
    css,
    body,
    bodyClass: `nature-memory style-nature sub-${subfamily?.slug ?? 'herbarium'}`,
    script,
  });
}
