import type { ExperienceBrief, ExperienceItem, ExperienceKind, ExperienceRoom, StylePreset } from '../types.js';
import { esc, normalizeBrief, safeHref, shell, t, REVEAL_SCRIPT } from './common.js';
import { sceneArt } from '../art.js';

const KIND_LABEL: Record<ExperienceKind, { es: string; en: string }> = {
  restaurant: { es: 'Restaurante', en: 'Restaurant' },
  museum: { es: 'Museo digital', en: 'Digital museum' },
  history: { es: 'Historia', en: 'History' },
  studio: { es: 'Estudio', en: 'Studio' },
  club: { es: 'Club', en: 'Club' },
  garden: { es: 'Jardín', en: 'Garden' },
};

function cleanRoom(room: ExperienceRoom, index: number): ExperienceRoom {
  const display = room.display ?? (room.items?.length ? 'objects' : room.quote ? 'quote' : 'scene');
  return {
    kicker: room.kicker?.trim().slice(0, 42) || `${String(index + 1).padStart(2, '0')} / sala`,
    title: room.title?.trim().slice(0, 92) || `Sala ${index + 1}`,
    body: room.body?.trim().slice(0, 700) || undefined,
    display,
    items: (room.items ?? []).slice(0, 6).map((item) => ({
      label: item.label?.trim().slice(0, 80) || '—',
      detail: item.detail?.trim().slice(0, 180) || undefined,
      value: item.value?.trim().slice(0, 24) || undefined,
    })),
    quote: room.quote?.text
      ? { text: room.quote.text.trim().slice(0, 260), author: room.quote.author?.trim().slice(0, 60) || undefined }
      : undefined,
    note: room.note?.trim().slice(0, 180) || undefined,
  };
}

function normalizeExperience(input: Partial<ExperienceBrief>): {
  brief: ReturnType<typeof normalizeBrief>;
  kind: ExperienceKind;
  rooms: ExperienceRoom[];
  hours?: string;
  address?: string;
  source?: string;
  closing?: string;
} {
  const brief = normalizeBrief(input);
  const kind: ExperienceKind = input.kind && KIND_LABEL[input.kind] ? input.kind : 'studio';
  const sourceRooms = input.rooms?.length
    ? input.rooms
    : (input.sections ?? []).map((section) => ({
        kicker: section.kicker,
        title: section.title,
        body: section.body,
      }));
  const rooms = sourceRooms.slice(0, 8).map(cleanRoom);
  if (rooms.length < 3) {
    // A room sequence needs an entrance, at least one room and an exit.
    while (rooms.length < 3) {
      rooms.push({
        kicker: `${String(rooms.length + 1).padStart(2, '0')} / sala`,
        title: rooms.length === 0 ? 'Entrada' : rooms.length === 1 ? 'Sala principal' : 'Salida',
        body: rooms.length === 0 ? brief.tagline : undefined,
        display: rooms.length === 2 ? 'quote' : 'scene',
        items: [],
        quote: rooms.length === 2 ? { text: 'Una habitación se recuerda por lo que deja mirar.', author: brief.brand } : undefined,
      });
    }
  }
  return {
    brief,
    kind,
    rooms,
    hours: input.hours?.trim().slice(0, 140) || undefined,
    address: input.address?.trim().slice(0, 140) || undefined,
    source: input.source?.trim().slice(0, 240) || undefined,
    closing: input.closing?.trim().slice(0, 220) || undefined,
  };
}

function itemMarkup(item: ExperienceItem, index: number): string {
  return `<li class="xp-item">
    <span class="xp-item-index">${String(index + 1).padStart(2, '0')}</span>
    <div>${item.value ? `<strong class="xp-item-value">${esc(item.value)}</strong>` : ''}<span class="xp-item-label">${esc(item.label)}</span>${item.detail ? `<p>${esc(item.detail)}</p>` : ''}</div>
  </li>`;
}

function roomBody(room: ExperienceRoom, locale: 'es' | 'en'): string {
  const paragraphs = (room.body ?? '').split(/\n{2,}/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('');
  const quote = room.quote?.text
    ? `<figure class="xp-quote"><blockquote>“${esc(room.quote.text)}”</blockquote>${room.quote.author ? `<figcaption>${esc(room.quote.author)}</figcaption>` : ''}</figure>`
    : '';
  const items = room.items?.length
    ? `<ul class="xp-items xp-items-${room.display}">${room.items.map(itemMarkup).join('')}</ul>`
    : '';
  return `<div class="xp-copy">
    <p class="xp-kicker">${esc(room.kicker ?? '')}</p>
    <h2>${esc(room.title)}</h2>
    ${paragraphs}
    ${quote}
    ${items}
    ${room.note ? `<p class="xp-note">${esc(room.note)}</p>` : ''}
  </div>`;
}

export function renderExperience(briefInput: Partial<ExperienceBrief>, preset: StylePreset): string {
  const { brief, kind, rooms, hours, address, source, closing } = normalizeExperience(briefInput);
  const locale = brief.locale ?? 'es';
  const brand = brief.brand || brief.title;
  const kindLabel = t(locale, KIND_LABEL[kind].es, KIND_LABEL[kind].en);
  const line = preset.rules.borderWidths[0] ?? 1;
  const radius = preset.rules.radius[1] ?? 0;
  const type = preset.typeSystem;
  const roomCount = String(rooms.length).padStart(2, '0');
  const cta = brief.cta ?? { label: t(locale, 'Entrar', 'Enter'), href: '#sala-1' };

  const body = `<header class="xp-top">
    <a class="xp-brand" href="#entrada">${esc(brand)}</a>
    <p class="xp-kind">${esc(kindLabel)} <span>·</span> ${roomCount} ${t(locale, 'salas', 'rooms')}</p>
    <a class="xp-enter" href="#sala-1">${t(locale, 'Entrar', 'Enter')} <span aria-hidden="true">↓</span></a>
  </header>

  <main class="xp" id="entrada">
    <section class="xp-hero" aria-labelledby="xp-title">
      <div class="xp-hero-copy reveal">
        <p class="xp-eyebrow">${esc(brief.eyebrow || `${kindLabel} · ${new Date().getFullYear()}`)}</p>
        <h1 id="xp-title">${esc(brief.title)}</h1>
        ${brief.tagline ? `<p class="xp-tagline">${esc(brief.tagline)}</p>` : ''}
        ${brief.intro ? `<p class="xp-intro">${esc(brief.intro)}</p>` : ''}
        <a class="xp-button" href="${safeHref(cta.href)}">${esc(cta.label)} ${arrow()}</a>
        <p class="xp-hint">${t(locale, 'Desplazate para recorrer las salas', 'Scroll through the rooms')} <span aria-hidden="true">↓</span></p>
      </div>
      <div class="xp-hero-art reveal" style="--i:1">${sceneArt(preset, 0)}</div>
    </section>

    ${rooms.map((room, index) => `<section class="xp-room ${index % 2 ? 'is-reverse' : ''}" id="sala-${index + 1}" data-room="${index + 1}" aria-labelledby="room-${index + 1}">
      <div class="xp-room-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</div>
      <div class="xp-room-art reveal" style="--i:1">${sceneArt(preset, index + 1)}</div>
      <div class="xp-room-copy reveal"><p class="xp-kicker">${esc(room.kicker ?? '')}</p><h2 id="room-${index + 1}">${esc(room.title)}</h2>${(room.body ?? '').split(/\n{2,}/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('')}${room.quote?.text ? `<figure class="xp-quote"><blockquote>“${esc(room.quote.text)}”</blockquote>${room.quote.author ? `<figcaption>${esc(room.quote.author)}</figcaption>` : ''}</figure>` : ''}${room.items?.length ? `<ul class="xp-items xp-items-${room.display}">${room.items.map(itemMarkup).join('')}</ul>` : ''}${room.note ? `<p class="xp-note">${esc(room.note)}</p>` : ''}</div>
    </section>`).join('')}

    <section class="xp-outro" aria-labelledby="xp-outro">
      <p class="xp-kicker">${t(locale, 'Salida', 'Exit')}</p>
      <h2 id="xp-outro">${esc(closing || t(locale, 'La visita termina cuando algo se queda con vos.', 'The visit ends when something stays with you.'))}</h2>
      ${hours ? `<p class="xp-fact"><span>${t(locale, 'Horario', 'Hours')}</span>${esc(hours)}</p>` : ''}
      ${address ? `<p class="xp-fact"><span>${t(locale, 'Dirección', 'Address')}</span>${esc(address)}</p>` : ''}
      ${source ? `<p class="xp-fact"><span>${t(locale, 'Fuente', 'Source')}</span>${esc(source)}</p>` : ''}
      ${brief.audio ? `<div class="xp-audio"><p class="xp-kicker">${esc(brief.audio.title)}</p>${brief.audio.subtitle ? `<p>${esc(brief.audio.subtitle)}</p>` : ''}<audio controls preload="none" src="${esc(brief.audio.src)}"></audio></div>` : ''}
      <a class="xp-button" href="${safeHref(cta.href)}">${esc(cta.label)} ${arrow()}</a>
      <p class="xp-credit">${esc(brief.footer || `${brand} · ${kindLabel}`)}</p>
    </section>
  </main>

  <nav class="xp-rail" aria-label="${t(locale, 'Salas', 'Rooms')}">
    ${rooms.map((room, index) => `<a href="#sala-${index + 1}" data-nav="${index + 1}" aria-label="${esc(`${index + 1}. ${room.title}`)}"><span>${String(index + 1).padStart(2, '0')}</span><i></i></a>`).join('')}
  </nav>
  <div class="xp-progress" aria-hidden="true"><i></i></div>`;

  const css = `:root{--bg:${preset.palette.bg};--ink:${preset.palette.ink};--muted:${preset.palette.muted};--accent:${preset.palette.accent};--xp-bg:${preset.palette.bg};--xp-surface:${preset.palette.surface};--xp-ink:${preset.palette.ink};--xp-muted:${preset.palette.muted};--xp-accent:${preset.palette.accent};--xp-accent2:${preset.palette.accent2};--xp-accent3:${preset.palette.accent3};--xp-accent4:${preset.palette.accent4};--xp-deep:${preset.palette.deep};--line:${line}px;--xp-line:${line}px;--xp-rule:${preset.rules.borderWidths.includes(1) ? 1 : line}px;--xp-radius:${radius}px;--xp-display:'${preset.fonts.display}',sans-serif;--xp-body:'${preset.fonts.body}',sans-serif;--xp-mono:'${preset.fonts.mono}',monospace}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body.xp .motion-toggle{right:auto;left:12px;bottom:12px}
body.xp{margin:0;background:var(--xp-bg);color:var(--xp-ink);font-family:'${preset.fonts.body}',sans-serif;font-family:var(--xp-body);font-size:${type?.bodySize ?? '18px'};line-height:${type?.bodyLeading ?? '1.65'};-webkit-font-smoothing:antialiased}
body.xp a{color:inherit;text-decoration:none}
.xp-top{font-family:'${preset.fonts.mono}',monospace;position:fixed;inset:0 0 auto;z-index:50;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:14px clamp(18px,4vw,56px);border-bottom:var(--xp-line) solid color-mix(in srgb,var(--xp-ink) 25%,transparent);background:color-mix(in srgb,var(--xp-bg) 88%,transparent);backdrop-filter:blur(10px);font-family:var(--xp-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase}
.xp-brand{font-weight:700;letter-spacing:.16em}.xp-kind{color:var(--xp-muted);margin:0}.xp-kind span{color:var(--xp-accent)}.xp-enter{border-bottom:var(--xp-rule) solid var(--xp-accent);padding-bottom:3px;white-space:nowrap}
.xp{overflow:hidden}
.xp-hero{min-height:100svh;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);align-items:center;gap:clamp(24px,5vw,80px);padding:clamp(110px,14vh,170px) clamp(18px,7vw,110px) clamp(40px,8vh,90px)}
.xp-eyebrow,.xp-kicker{margin:0 0 16px;font-family:var(--xp-mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--xp-muted)}
.xp-hero h1,.xp-room h2,.xp-outro h2{font-family:'${preset.fonts.display}',sans-serif;font-family:var(--xp-display);font-weight:400;letter-spacing:${type?.displayTracking ?? 'normal'};line-height:${type?.displayLeading ?? '.94'};text-transform:${type?.displayCase ?? 'none'};margin:0;text-wrap:balance}
.xp-hero h1{font-size:clamp(44px,6.2vw,100px);max-width:16ch}
.xp-tagline{font-size:clamp(20px,2.3vw,30px);line-height:1.3;max-width:28ch;margin:28px 0 0}
.xp-intro{max-width:44ch;margin:20px 0 0;color:var(--xp-muted);font-size:17px}
.xp-button{display:inline-flex;align-items:center;gap:12px;margin-top:30px;padding:13px 18px;background:var(--xp-accent);color:var(--xp-bg);border:var(--xp-line) solid var(--xp-accent);font-family:var(--xp-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;transition:transform .25s var(--motion-ease),background .25s,color .25s}
.xp-button:hover{transform:translateY(-2px)}
.xp-hint{margin-top:34px;color:var(--xp-muted);font-family:var(--xp-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase}
.xp-hero-art{min-height:min(70vh,700px);position:relative}
.scene-art{position:relative;overflow:hidden;width:100%;height:100%;min-height:320px;background:var(--xp-surface);border:var(--line) solid color-mix(in srgb,var(--xp-ink) 28%,transparent);border-radius:var(--xp-radius)}
.scene-art svg{display:block;width:100%;height:100%;min-height:inherit}

.xp-room{position:relative;min-height:100svh;display:grid;grid-template-columns:minmax(0,1.03fr) minmax(0,.97fr);align-items:center;gap:clamp(24px,5vw,86px);padding:clamp(80px,10vh,130px) clamp(18px,7vw,110px);border-top:var(--xp-line) solid color-mix(in srgb,var(--xp-ink) 22%,transparent)}
.xp-room.is-reverse .xp-room-art{order:2}.xp-room.is-reverse .xp-room-copy{order:1}
.xp-room-art{min-height:min(66vh,660px)}
.xp-room-copy{max-width:620px;position:relative;z-index:2}
.xp-room h2{font-size:clamp(38px,6vw,92px);max-width:13ch}
.xp-room-copy>p:not(.xp-kicker):not(.xp-note){max-width:47ch;margin:24px 0 0;font-size:clamp(18px,1.35vw,21px)}
.xp-room-number{writing-mode:vertical-rl;position:absolute;right:4vw;top:9vh;z-index:0;font-family:var(--xp-display);font-size:clamp(90px,15vw,240px);line-height:.7;color:var(--xp-accent);opacity:.08;pointer-events:none}
.xp-items{list-style:none;margin:32px 0 0;padding:0;border-top:var(--xp-rule) solid color-mix(in srgb,var(--xp-ink) 25%,transparent)}
.xp-item{display:grid;grid-template-columns:42px 1fr;gap:14px;align-items:start;padding:14px 0;border-bottom:var(--xp-rule) solid color-mix(in srgb,var(--xp-ink) 18%,transparent)}
.xp-item-index{font-family:var(--xp-mono);font-size:9px;letter-spacing:.12em;color:var(--xp-muted);padding-top:5px}
.xp-item-value{display:block;font-family:var(--xp-display);font-size:clamp(25px,2.7vw,42px);line-height:1;color:var(--xp-accent2)}
.xp-item-label{display:block;font-family:var(--xp-mono);font-size:12px;letter-spacing:.05em;text-transform:uppercase;margin-top:4px}
.xp-item p{margin:5px 0 0;color:var(--xp-muted);font-size:15px;line-height:1.5}
.xp-quote{margin:32px 0 0;padding:22px 0 0;border-top:var(--xp-rule) solid var(--xp-accent)}
.xp-quote blockquote{margin:0;font-family:var(--xp-display);font-size:clamp(25px,3.5vw,48px);line-height:1.1;text-wrap:balance}
.xp-quote figcaption{margin-top:14px;font-family:var(--xp-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--xp-muted)}
.xp-note{margin:24px 0 0;padding-left:14px;border-left:var(--xp-rule) solid var(--xp-accent);font-size:15px;color:var(--xp-muted)}
.xp-outro{min-height:82svh;display:flex;flex-direction:column;justify-content:center;padding:clamp(80px,12vh,150px) clamp(18px,10vw,180px);border-top:var(--xp-line) solid var(--xp-accent);background:var(--xp-surface)}
.xp-outro h2{font-size:clamp(42px,7vw,108px);max-width:14ch}
.xp-fact{display:flex;gap:16px;flex-wrap:wrap;margin:18px 0 0;font-size:15px;color:var(--xp-muted)}.xp-fact span{font-family:var(--xp-mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;min-width:80px;color:var(--xp-accent2)}
.xp-audio{margin:26px 0 0;padding:18px 0;border-top:var(--xp-rule) solid color-mix(in srgb,var(--xp-ink) 22%,transparent);border-bottom:var(--xp-rule) solid color-mix(in srgb,var(--xp-ink) 22%,transparent)}.xp-audio audio{width:min(460px,100%);margin-top:10px}
.xp-credit{margin:38px 0 0;color:var(--xp-muted);font-family:var(--xp-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase}
.xp-rail{position:fixed;right:16px;bottom:16px;z-index:60;display:flex;flex-direction:column;gap:7px;padding:9px;background:color-mix(in srgb,var(--xp-bg) 84%,transparent);border:var(--xp-line) solid color-mix(in srgb,var(--xp-ink) 22%,transparent);backdrop-filter:blur(8px)}
.xp-rail a{display:flex;align-items:center;gap:8px;font-family:var(--xp-mono);font-size:9px;letter-spacing:.1em;color:var(--xp-muted);text-decoration:none}.xp-rail a i{display:block;width:4px;height:4px;background:currentColor;border-radius:50%}.xp-rail a[aria-current="true"]{color:var(--xp-accent2)}.xp-rail a[aria-current="true"] i{width:12px;height:4px;border-radius:0}
.xp-progress{position:fixed;top:0;left:0;height:2px;width:100%;z-index:70;background:transparent;pointer-events:none}.xp-progress i{display:block;height:100%;width:0;background:var(--xp-accent2)}
${preset.slug === 'brutalist' ? '.scene-art,.xp-room-art .scene-art{box-shadow:8px 8px 0 var(--xp-ink)}' : preset.slug === 'papercraft' ? '.scene-art{box-shadow:0 18px 30px rgba(74,58,50,.18)}' : ''}

@media (prefers-reduced-motion:no-preference){.scene-art svg{transform-origin:center;animation:scene-breathe 14s ease-in-out infinite alternate}@keyframes scene-breathe{from{transform:scale(1)}to{transform:scale(1.015)}}}
@media (prefers-reduced-motion:reduce){.scene-art svg{animation:none!important;transform:none!important}}
@media(max-width:880px){.xp-hero h1{font-size:clamp(38px,11.5vw,68px)}.xp-top{position:absolute;background:transparent}.xp-kind{display:none}.xp-hero,.xp-room{grid-template-columns:1fr;min-height:auto;padding-top:90px}.xp-hero-art{min-height:52vh}.xp-room-art{min-height:44vh}.xp-room.is-reverse .xp-room-art,.xp-room.is-reverse .xp-room-copy{order:0}.xp-room-number{top:auto;bottom:2vh;right:6vw}.xp-rail{right:8px;bottom:8px;gap:4px;padding:6px}.xp-rail a span{display:none}.xp-rail a i{width:8px;height:8px}.xp-outro{min-height:60vh}}
@media print{.xp-top,.xp-rail,.xp-progress,.xp-hint,.xp-button,.motion-toggle{display:none!important}.xp-hero,.xp-room,.xp-outro{min-height:auto;page-break-after:always;padding:48px}.scene-art{min-height:300px}}
@media(prefers-reduced-motion:no-preference){.xp-room-art,.xp-hero-art{transition:transform .8s var(--motion-ease)}.xp-room:hover .xp-room-art{transform:translateY(-4px)}}
@media(prefers-reduced-motion:reduce){.xp-rail a i,.xp-room-art,.xp-hero-art{transition:none!important;animation:none!important}}`;

  const script = `(() => {
  const rooms = Array.from(document.querySelectorAll('[data-room]'));
  const links = Array.from(document.querySelectorAll('[data-nav]'));
  const progress = document.querySelector('.xp-progress i');
  if (!rooms.length) return;
  const setActive = (id) => {
    links.forEach((link) => link.setAttribute('aria-current', link.dataset.nav === id ? 'true' : 'false'));
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.dataset.room); });
  }, { threshold: 0.35, rootMargin: '-15% 0px -35% 0px' });
  rooms.forEach((room) => io.observe(room));
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = (max > 0 ? Math.min(1, scrollY / max) : 0) * 100 + '%';
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
  addEventListener('keydown', (event) => {
    if (/^[1-9]$/.test(event.key) && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
      const target = document.getElementById('sala-' + event.key);
      if (target) target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  });
})();`;

  return shell({
    lang: locale,
    title: `${brief.title} — ${brand}`,
    description: brief.tagline || brief.intro || `${kindLabel} ${brief.title}`,
    preset,
    css,
    body,
    bodyClass: `xp style-${preset.slug} kind-${kind}`,
    script: `${script}\n${REVEAL_SCRIPT}`,
  });
}

function arrow(): string {
  return `<span aria-hidden="true">↗</span>`;
}
