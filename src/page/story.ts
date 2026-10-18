import type { StoryBrief, StoryChapter, StoryScene, StylePreset } from '../types.js';
import { esc, normalizeBrief, safeHref, shell, t, REVEAL_SCRIPT } from './common.js';
import { sceneArt } from '../art.js';
import { papercutScene } from '../papercut.js';
import { applyMaxxing } from '../maxxing.js';

function cleanChapter(chapter: StoryChapter, index: number): StoryChapter {
  return {
    kicker: chapter.kicker?.trim().slice(0, 48) || `${String(index + 1).padStart(2, '0')} / capítulo`,
    title: chapter.title?.trim().slice(0, 120) || `Capítulo ${index + 1}`,
    body: (chapter.body ?? '').trim().slice(0, 5000),
    quote: chapter.quote?.text
      ? { text: chapter.quote.text.trim().slice(0, 300), author: chapter.quote.author?.trim().slice(0, 60) || undefined }
      : undefined,
    fact: chapter.fact?.trim().slice(0, 220) || undefined,
    scene: chapter.scene,
  };
}

function normalizeStory(input: Partial<StoryBrief>): {
  brief: ReturnType<typeof normalizeBrief>;
  chapters: StoryChapter[];
  source?: string;
  readingTime?: string;
} {
  const brief = normalizeBrief(input);
  const chapters = (input.chapters ?? []).slice(0, 8).map(cleanChapter);
  if (chapters.length < 2) {
    const sections = input.sections ?? [];
    for (const section of sections.slice(0, 2)) {
      chapters.push(cleanChapter({ kicker: section.kicker, title: section.title, body: section.body }, chapters.length));
    }
  }
  while (chapters.length < 2) {
    chapters.push(
      cleanChapter(
        {
          title: chapters.length ? 'La segunda orilla' : 'El comienzo',
          body: chapters.length
            ? 'Toda historia tiene una segunda orilla: el momento en que lo que parecía lejano se vuelve inevitable.'
            : 'Todo comienza con una imagen que no termina de irse.',
        },
        chapters.length,
      ),
    );
  }
  return { brief, chapters, source: input.source?.trim().slice(0, 300) || undefined, readingTime: input.readingTime?.trim().slice(0, 40) || undefined };
}

function paragraphs(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, index) => `<p${index === 0 ? ' class="story-lede"' : ''}>${esc(p)}</p>`)
    .join('');
}

export function renderStory(input: Partial<StoryBrief>, preset: StylePreset): string {
  const { brief, chapters, source, readingTime } = normalizeStory(input);
  const storyKind = input.kind ?? 'story';
  const storybook = input.format === 'storybook';
  const locale = brief.locale ?? 'es';
  const subject = storyKind === 'history' ? 'river' : storyKind === 'lesson' ? 'window' : storyKind === 'essay' ? 'window' : 'house';
  const storyLabel = storyKind === 'history' ? t(locale, 'Historia', 'History') : storyKind === 'lesson' ? t(locale, 'Lección', 'Lesson') : t(locale, 'Cuento', 'Story');
  const brand = brief.brand || brief.title;
  const line = preset.rules.borderWidths[0] ?? 1;
  const radius = preset.rules.radius[1] ?? 0;
  const type = preset.typeSystem;
  const chapterLabel = t(locale, 'capítulos', 'chapters');
  const time = readingTime || `${Math.max(3, Math.round(chapters.reduce((sum, c) => sum + c.body.split(/\s+/).length, 0) / 180))} min`;
  const cta = brief.cta ?? { label: t(locale, 'Volver al inicio', 'Back to top'), href: '#top' };
  const body = `<header class="story-top">
    <a class="story-brand" href="#top">${esc(brand)}</a>
    <p>${esc(brief.eyebrow || t(locale, 'Una historia', 'A story'))} <span>·</span> ${chapters.length} ${esc(chapterLabel)} <span>·</span> ${esc(time)}</p>
  </header>

  <main class="story" id="top">
    <section class="story-cover" aria-labelledby="story-title">
      <div class="story-cover-copy reveal">
        <p class="story-kicker">${esc(brief.eyebrow || t(locale, 'Una historia', 'A story'))}</p>
        <h1 id="story-title">${esc(brief.title)}</h1>
        ${brief.tagline ? `<p class="story-tagline">${esc(brief.tagline)}</p>` : ''}
        ${brief.intro ? `<p class="story-intro">${esc(brief.intro)}</p>` : ''}
        <a class="story-button" href="#chapter-1">${t(locale, 'Empezar a leer', 'Start reading')} <span aria-hidden="true">↓</span></a>
      </div>
      <figure class="story-cover-art reveal" style="--i:1">${storybook ? papercutScene(preset, { kind: 'meadow', characters: ['rabbit'], props: ['pine', 'tree', 'flowers'], caption: brief.title }, 0) : sceneArt(preset, 0, storyLabel, subject)}<figcaption>${esc(brief.eyebrow || '')}</figcaption></figure>
    </section>

    <nav class="story-nav" aria-label="${t(locale, 'Capítulos', 'Chapters')}">
      ${chapters.map((chapter, index) => `<a href="#chapter-${index + 1}" data-chapter="${index + 1}"><span>${String(index + 1).padStart(2, '0')}</span>${esc(chapter.title)}</a>`).join('')}
    </nav>

    ${chapters.map((chapter, index) => {
      const scene: StoryScene = chapter.scene ?? { kind: index === chapters.length - 1 ? 'house' : index % 2 ? 'garden' : 'meadow', characters: ['rabbit'], props: index === chapters.length - 1 ? ['house', 'tree', 'flowers'] : ['pine', 'tree', 'flowers'] } as const;
      const art = preset.slug === 'papercraft' ? papercutScene(preset, scene, index + 1) : sceneArt(preset, index + 1, storyLabel, subject);
      const head = `<div class="story-chapter-head reveal"><p class="story-kicker">${esc(chapter.kicker ?? '')}</p><h2 id="chapter-title-${index + 1}">${esc(chapter.title)}</h2></div>`;
      const prose = `<div class="story-prose reveal">${paragraphs(chapter.body)}</div>`;
      const extras = `${chapter.quote?.text ? `<figure class="story-quote reveal"><blockquote>“${esc(chapter.quote.text)}”</blockquote>${chapter.quote.author ? `<figcaption>${esc(chapter.quote.author)}</figcaption>` : ''}</figure>` : ''}${chapter.fact ? `<aside class="story-fact reveal"><p class="story-kicker">${t(locale, 'Dato al margen', 'Margin note')}</p><p>${esc(chapter.fact)}</p></aside>` : ''}`;
      if (storybook) {
        return `<article class="story-chapter storybook-page ${index % 2 ? 'is-reverse' : ''}" id="chapter-${index + 1}" data-chapter="${index + 1}" aria-labelledby="chapter-title-${index + 1}">
          <figure class="storybook-art reveal">${art}<figcaption>${esc(scene.caption || `${chapter.kicker || ''} · ${chapter.title}`)}</figcaption></figure>
          <div class="storybook-text">${head}${prose}${extras}<p class="storybook-folio">${String(index + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}</p><a class="storybook-next" href="${index + 1 < chapters.length ? `#chapter-${index + 2}` : '#story-outro'}">${t(locale, 'Siguiente', 'Next')} <span aria-hidden="true">→</span></a></div>
        </article>`;
      }
      return `<article class="story-chapter ${index % 2 ? 'is-reverse' : ''}" id="chapter-${index + 1}" data-chapter="${index + 1}" aria-labelledby="chapter-title-${index + 1}">
      ${head}${prose}${extras}
      ${index === 0 || index === Math.floor(chapters.length / 2) ? `<figure class="story-plate reveal">${sceneArt(preset, index + 1, storyLabel, subject)}<figcaption>${esc(chapter.kicker || '')} · ${esc(chapter.title)}</figcaption></figure>` : ''}
    </article>`;
    }).join('')}

    <footer class="story-outro" aria-labelledby="story-outro">
      <p class="story-kicker">${t(locale, 'Fin', 'The end')}</p>
      <h2 id="story-outro">${esc(brief.footer || t(locale, 'Toda historia deja una puerta abierta.', 'Every story leaves a door open.'))}</h2>
      ${source ? `<p class="story-source"><span>${t(locale, 'Fuente', 'Source')}</span>${esc(source)}</p>` : ''}
      <a class="story-button" href="${safeHref(cta.href)}">${esc(cta.label)} <span aria-hidden="true">↗</span></a>
      <p class="story-credit">${esc(brand)} · ${chapters.length} ${esc(chapterLabel)} · ${esc(time)}</p>
    </footer>
  </main>

  <div class="story-progress" aria-hidden="true"><i></i></div>`;

  const css = `:root{--bg:${preset.palette.bg};--ink:${preset.palette.ink};--muted:${preset.palette.muted};--accent:${preset.palette.accent};--st-bg:${preset.palette.bg};--st-surface:${preset.palette.surface};--st-ink:${preset.palette.ink};--st-muted:${preset.palette.muted};--st-accent:${preset.palette.accent};--st-accent2:${preset.palette.accent2};--st-accent3:${preset.palette.accent3};--st-accent4:${preset.palette.accent4};--st-deep:${preset.palette.deep};--line:${line}px;--st-line:${line}px;--st-rule:${preset.rules.borderWidths.includes(1) ? 1 : line}px;--st-radius:${radius}px;--st-display:'${preset.fonts.display}',sans-serif;--st-body:'${preset.fonts.body}',sans-serif;--st-mono:'${preset.fonts.mono}',monospace}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body.story-page .motion-toggle{right:auto;left:12px;bottom:12px}
body.story-page{margin:0;background:var(--st-bg);color:var(--st-ink);font-family:'${preset.fonts.body}',sans-serif;font-family:var(--st-body);font-size:${type?.bodySize ?? '18px'};line-height:${type?.bodyLeading ?? '1.7'};-webkit-font-smoothing:antialiased}
body.story-page a{color:inherit;text-decoration:none}
.story-top{font-family:'${preset.fonts.mono}',monospace;position:fixed;inset:0 0 auto;z-index:50;display:flex;justify-content:space-between;align-items:center;gap:20px;padding:14px clamp(18px,4vw,56px);border-bottom:var(--st-line) solid color-mix(in srgb,var(--st-ink) 24%,transparent);background:color-mix(in srgb,var(--st-bg) 88%,transparent);backdrop-filter:blur(10px);font-family:var(--st-mono);font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:var(--st-muted)}
.story-brand{color:var(--st-ink);font-weight:700;letter-spacing:.16em}.story-top p{margin:0}.story-top p span{color:var(--st-accent2)}
.story-cover{min-height:100svh;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);align-items:center;gap:clamp(24px,5vw,82px);padding:clamp(110px,14vh,170px) clamp(18px,7vw,110px) clamp(50px,8vh,100px)}
.story-kicker{margin:0 0 16px;font-family:var(--st-mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--st-muted)}
.story-cover h1,.story-chapter h2,.story-outro h2{font-family:'${preset.fonts.display}',sans-serif;font-family:var(--st-display);font-weight:400;letter-spacing:${type?.displayTracking ?? 'normal'};line-height:${type?.displayLeading ?? '.94'};text-transform:${type?.displayCase ?? 'none'};margin:0;text-wrap:balance}
.story-cover h1{font-size:clamp(56px,10vw,156px);max-width:11ch}
.story-tagline{font-size:clamp(21px,2.4vw,32px);line-height:1.28;max-width:28ch;margin:26px 0 0}
.story-intro{max-width:44ch;margin:20px 0 0;color:var(--st-muted);font-size:17px}
.story-button{display:inline-flex;align-items:center;gap:12px;margin-top:30px;padding:13px 18px;background:var(--st-accent);color:var(--st-bg);border:var(--st-line) solid var(--st-accent);font-family:var(--st-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;transition:transform .25s var(--motion-ease),background .25s,color .25s}
.story-button:hover{transform:translateY(-2px)}
.story-cover-art{min-height:min(70vh,700px);margin:0}.story-cover-art figcaption,.story-plate figcaption{margin:10px 0 0;padding:0 2px;font-family:var(--st-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--st-muted)}
.story-nav{position:sticky;top:0;z-index:40;display:flex;gap:0;overflow:auto;border-top:var(--st-line) solid color-mix(in srgb,var(--st-ink) 24%,transparent);border-bottom:var(--st-line) solid color-mix(in srgb,var(--st-ink) 24%,transparent);background:var(--st-bg);scrollbar-width:thin}
.story-nav a{flex:0 0 auto;display:flex;align-items:center;gap:9px;padding:12px 18px;border-right:var(--st-rule) solid color-mix(in srgb,var(--st-ink) 16%,transparent);font-family:var(--st-mono);font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:var(--st-muted);white-space:nowrap}
.story-nav a span{color:var(--st-accent2)}.story-nav a[aria-current="true"]{background:var(--st-surface);color:var(--st-ink)}
.story-chapter{max-width:1180px;margin:0 auto;padding:clamp(64px,10vh,130px) clamp(18px,7vw,76px);border-bottom:var(--st-line) solid color-mix(in srgb,var(--st-ink) 20%,transparent);display:grid;grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr);gap:clamp(26px,5vw,80px);align-items:start;position:relative}
.story-chapter.is-reverse .story-chapter-head{order:2}.story-chapter.is-reverse .story-prose{order:1}
.story-chapter h2{font-size:clamp(38px,5.6vw,88px);max-width:12ch}
.story-prose{max-width:62ch;font-size:clamp(19px,1.35vw,22px);line-height:1.72}
.story-prose p{margin:0 0 1.3em}.story-prose .story-lede{font-size:1.18em;line-height:1.58;color:var(--st-ink)}
.story-lede:first-letter{float:left;font-family:var(--st-display);font-size:4.1em;line-height:.78;padding:.08em .12em 0 0;color:var(--st-accent2)}
.story-quote{grid-column:2;margin:28px 0 0;padding:24px 0 0;border-top:var(--st-rule) solid var(--st-accent)}
.story-chapter.is-reverse .story-quote{grid-column:1}
.story-quote blockquote{margin:0;font-family:var(--st-display);font-size:clamp(25px,3.4vw,46px);line-height:1.12;text-wrap:balance}
.story-quote figcaption{margin-top:12px;font-family:var(--st-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--st-muted)}
.story-fact{grid-column:1;grid-row:2;margin:20px 0 0;padding:16px 0 0;border-top:var(--st-rule) solid color-mix(in srgb,var(--st-ink) 24%,transparent);font-size:15px;color:var(--st-muted);max-width:40ch}
.story-fact p:last-child{margin:0}.story-fact .story-kicker{margin-bottom:8px;color:var(--st-accent2)}
.story-plate{grid-column:1/-1;margin-top:46px;min-height:min(48vh,460px);border:var(--st-line) solid color-mix(in srgb,var(--st-ink) 24%,transparent);border-radius:var(--st-radius);overflow:hidden}
.story-plate .scene-art{height:100%;min-height:inherit;border:0}
.story-outro{max-width:1180px;margin:0 auto;padding:clamp(80px,12vh,150px) clamp(18px,7vw,76px);display:flex;flex-direction:column;justify-content:center;min-height:62vh}
.story-outro h2{font-size:clamp(42px,7vw,110px);max-width:14ch}
.story-source{display:flex;gap:18px;flex-wrap:wrap;margin:28px 0 0;color:var(--st-muted);font-size:15px;max-width:62ch}.story-source span{font-family:var(--st-mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--st-accent2)}
.story-chapter:after{content:'open/beauty';position:absolute;right:10px;top:80px;writing-mode:vertical-rl;font-family:var(--st-mono);font-size:8px;letter-spacing:.22em;text-transform:uppercase;color:var(--st-muted);opacity:.55;pointer-events:none}
.story-credit{margin:40px 0 0;font-family:var(--st-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--st-muted)}
.story-progress{position:fixed;top:0;left:0;height:2px;width:100%;z-index:70;pointer-events:none}.story-progress i{display:block;height:100%;width:0;background:var(--st-accent2)}
.scene-art{position:relative;overflow:hidden;width:100%;height:100%;min-height:320px;background:var(--st-surface);border:var(--line) solid color-mix(in srgb,var(--st-ink) 28%,transparent);border-radius:var(--st-radius)}
.scene-art svg{display:block;width:100%;height:100%;min-height:inherit}
${preset.slug === 'brutalist' ? '.scene-art,.story-plate{box-shadow:8px 8px 0 var(--st-ink)}' : preset.slug === 'papercraft' ? '.scene-art{box-shadow:0 18px 30px rgba(74,58,50,.18)}' : ''}

@media (prefers-reduced-motion:no-preference){.scene-art svg{transform-origin:center;animation:scene-breathe 14s ease-in-out infinite alternate}@keyframes scene-breathe{from{transform:scale(1)}to{transform:scale(1.015)}}}
@media (prefers-reduced-motion:reduce){.scene-art svg{animation:none!important;transform:none!important}}
body.storybook{background:var(--st-surface)}
body.storybook .story-top{position:relative;background:var(--st-bg);border-bottom:var(--st-line) solid color-mix(in srgb,var(--st-ink) 22%,transparent)}
body.storybook .story-cover{min-height:calc(100svh - 58px);grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr);gap:clamp(26px,4vw,64px);max-width:1320px;margin:0 auto;padding:clamp(40px,6vh,72px) clamp(20px,4vw,54px) clamp(40px,7vh,80px)}
body.storybook .story-cover-art{min-height:0;border:var(--st-line) solid color-mix(in srgb,var(--st-ink) 28%,transparent);border-radius:var(--st-radius);background:var(--st-surface);padding:10px;transform:rotate(-.6deg)}
body.storybook .story-cover-art svg{width:100%;height:auto;aspect-ratio:8/5;min-height:0;border-radius:calc(var(--st-radius) * .65);display:block}
body.storybook .story-cover-art figcaption{font-size:8px}
body.storybook .story-cover h1{font-size:clamp(52px,7.2vw,112px)}
body.storybook .story-nav{position:sticky;top:0;background:var(--st-surface);border-color:color-mix(in srgb,var(--st-ink) 22%,transparent)}
body.storybook .story-chapter{max-width:1320px;margin:clamp(20px,3vw,42px) auto;padding:clamp(20px,3vw,36px);background:var(--st-bg);border:var(--st-line) solid color-mix(in srgb,var(--st-ink) 26%,transparent);border-radius:var(--st-radius);grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);gap:clamp(22px,3.4vw,44px);align-items:start;display:grid}
body.storybook .story-chapter.is-reverse .storybook-art{order:2}
body.storybook .story-chapter.is-reverse .storybook-text{order:1}
body.storybook .storybook-art{margin:0;padding:9px;background:var(--st-surface);border:var(--st-line) solid color-mix(in srgb,var(--st-ink) 28%,transparent);border-radius:calc(var(--st-radius) * .8);transform:rotate(-.45deg)}
body.storybook .storybook-art svg{display:block;width:100%;aspect-ratio:8/5;border-radius:calc(var(--st-radius) * .55)}
body.storybook .storybook-art figcaption{margin-top:8px;padding:0 2px;font-family:var(--st-mono);font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--st-muted)}
body.storybook .storybook-text{min-width:0;padding:clamp(2px,1vw,14px) 0}
body.storybook .story-chapter-head .story-kicker{margin-bottom:10px}
body.storybook .story-chapter h2{font-size:clamp(34px,4.2vw,62px);max-width:13ch;margin-bottom:16px}
body.storybook .story-prose{font-size:clamp(17px,1.1vw,19px);line-height:1.72;max-width:54ch}
body.storybook .story-prose .story-lede:first-letter{font-size:4.5em;float:left;line-height:.78;padding:.08em .12em 0 0;color:var(--st-accent2)}
body.storybook .story-quote{grid-column:auto;margin:16px 0 0;padding:14px 0 0;border-top:var(--st-rule) solid var(--st-accent)}
body.storybook .story-quote blockquote{font-size:clamp(22px,2.2vw,30px)}
body.storybook .story-fact{grid-column:auto;grid-row:auto;margin:14px 0 0;padding-top:12px;font-size:13px}
body.storybook-folio{margin:20px 0 0;font-family:var(--st-mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--st-muted)}
.storybook-next{display:inline-flex;align-items:center;gap:8px;margin-top:14px;font-family:var(--st-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--st-accent2);border-bottom:var(--st-line) solid var(--st-accent2);padding-bottom:3px}
body.storybook .story-outro{max-width:1000px;margin:clamp(20px,3vw,42px) auto;padding:clamp(42px,7vh,84px);background:var(--st-bg);border:var(--st-line) solid color-mix(in srgb,var(--st-ink) 26%,transparent);border-radius:var(--st-radius)}
${preset.slug === 'papercraft' ? 'body.storybook.style-papercraft .story-cover-art{box-shadow:0 22px 40px rgba(74,58,50,.18)}body.storybook.style-papercraft .story-chapter{box-shadow:0 22px 40px rgba(74,58,50,.16)}body.storybook.style-papercraft .storybook-art{box-shadow:0 18px 30px rgba(74,58,50,.18)}body.storybook.style-papercraft .story-outro{box-shadow:0 22px 40px rgba(74,58,50,.14)}' : ''}
@media(max-width:880px){body.storybook .story-cover{grid-template-columns:1fr;padding-top:24px}body.storybook .story-cover-art{min-height:42vh}body.storybook .story-chapter{grid-template-columns:1fr;margin:14px 10px;padding:16px}body.storybook .story-chapter.is-reverse .storybook-art,body.storybook .story-chapter.is-reverse .storybook-text{order:0}}
@media print{body.storybook .story-cover-art,body.storybook .storybook-art{transform:none!important}body.storybook .story-chapter{break-after:page}}
@media(max-width:880px){.story-top{position:absolute;background:transparent}.story-top p{display:none}.story-cover{grid-template-columns:1fr;min-height:auto;padding-top:100px}.story-cover-art{min-height:48vh}.story-chapter{grid-template-columns:1fr;gap:28px}.story-chapter.is-reverse .story-chapter-head,.story-chapter.is-reverse .story-prose,.story-quote,.story-chapter.is-reverse .story-quote,.story-fact{order:0;grid-column:1;grid-row:auto}.story-plate{min-height:36vh}.story-prose{font-size:19px}}
@media print{.story-top,.story-nav,.story-progress,.story-button,.motion-toggle{display:none!important}.story-cover,.story-chapter,.story-outro{min-height:auto;page-break-after:always;padding:48px}.story-prose{font-size:12pt}.scene-art{min-height:300px}}
@media(prefers-reduced-motion:reduce){.story-cover-art,.story-plate .scene-art{animation:none!important;transition:none!important}}`;

  const script = `(() => {
  const chapters = Array.from(document.querySelectorAll('[data-chapter]'));
  const links = Array.from(document.querySelectorAll('[data-chapter]'));
  const progress = document.querySelector('.story-progress i');
  const navLinks = Array.from(document.querySelectorAll('.story-nav [data-chapter]'));
  if (chapters.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => link.setAttribute('aria-current', link.dataset.chapter === entry.target.dataset.chapter ? 'true' : 'false'));
        }
      });
    }, { threshold: 0.2, rootMargin: '-10% 0px -55% 0px' });
    chapters.forEach((chapter) => { if (chapter.classList.contains('story-chapter')) io.observe(chapter); });
  }
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = (max > 0 ? Math.min(1, scrollY / max) : 0) * 100 + '%';
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
})();`;

  const html = shell({
    lang: locale,
    title: `${brief.title} — ${brand}`,
    description: brief.tagline || brief.intro || brief.title,
    preset,
    css,
    body,
    bodyClass: `story-page ${storybook ? 'storybook' : ''} style-${preset.slug}`,
    script: `${script}\n${REVEAL_SCRIPT}`,
  });
  return brief.maxxing ? applyMaxxing(html, preset) : html;
}
