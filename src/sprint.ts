import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { SprintBrief } from './types.js';
import { createDeck, createGifFile } from './generate.js';

export interface SprintKitFile {
  html: string;
  gif: string;
  grade: string;
  score: number;
  vision: number;
}

export interface SprintKitResult {
  directory: string;
  review: SprintKitFile;
  retro: SprintKitFile;
  planning: SprintKitFile;
}

function clean(value: string, fallback: string, max = 120): string {
  return String(value ?? '').trim().slice(0, max) || fallback;
}

function folderFor(brief: SprintBrief, requested?: string): string {
  if (requested) return path.resolve(requested);
  const slug = clean(brief.sprint, 'sprint', 32).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return path.resolve('beauty-output', `sprint-${slug || 'sin-numero'}`);
}

function slidesForReview(brief: SprintBrief) {
  const metrics = (brief.metrics ?? []).slice(0, 3);
  const highlights = (brief.highlights ?? []).filter(Boolean).slice(0, 4);
  return [
    {
      layout: 'statement' as const,
      kicker: `Sprint ${brief.sprint} · Review`,
      title: brief.summary || `Lo que cambió en el sprint ${brief.sprint}.`,
      body: brief.date ? `Cierre del ${brief.date}. Una conversación sobre lo que se envió, lo que se aprendió y lo que sigue.` : 'Una conversación sobre lo que se envió, lo que se aprendió y lo que sigue.',
    },
    {
      layout: 'stats' as const,
      kicker: 'La evidencia',
      title: 'Lo que se movió',
      stats: metrics.length ? metrics : [{ label: 'Historias cerradas', value: '—' }],
    },
    {
      layout: 'points' as const,
      kicker: 'Lo que existe ahora',
      title: 'Tres cosas que no estaban antes',
      points: (highlights.length ? highlights : ['Una entrega que se puede usar']).map((title) => ({ title, body: 'Demostrado en la review, no en el tablero.' })),
    },
    {
      layout: 'quote' as const,
      kicker: 'Una voz del equipo',
      title: 'La frase que queda',
      quote: brief.quote || { text: 'La conversación sigue.', author: brief.team || 'Equipo' },
    },
  ].slice(0, 4);
}

function slidesForRetro(brief: SprintBrief) {
  const worked = (brief.highlights ?? []).filter(Boolean).slice(0, 3);
  const hurt = (brief.blockers ?? []).filter(Boolean).slice(0, 3);
  const tried = (brief.next ?? []).filter(Boolean).slice(0, 3);
  return [
    {
      layout: 'statement' as const,
      kicker: `Sprint ${brief.sprint} · Retrospectiva`,
      title: 'Qué aprendimos cuando el plan se movió.',
      body: 'Una retrospectiva no es un juicio: es una lectura del sistema. Lo que funcionó, lo que dolió y lo que probamos después.',
    },
    {
      layout: 'points' as const,
      kicker: 'Funcionó',
      title: 'Lo que queremos repetir',
      points: (worked.length ? worked : ['Decir la verdad a tiempo']).map((title) => ({ title, body: 'Una práctica, no una anécdota.' })),
    },
    {
      layout: 'points' as const,
      kicker: 'Dolió',
      title: 'Lo que no queremos normalizar',
      points: (hurt.length ? hurt : ['Trabajar sin contexto']).map((title) => ({ title, body: 'Un problema del sistema, no de una persona.' })),
    },
    {
      layout: 'points' as const,
      kicker: 'Probamos',
      title: 'El próximo experimento',
      points: (tried.length ? tried : ['Una revisión más corta y más honesta']).map((title) => ({ title, body: 'Pequeño, medible, reversible.' })),
    },
  ].slice(0, 4);
}

function slidesForPlanning(brief: SprintBrief) {
  const next = (brief.next ?? []).filter(Boolean).slice(0, 3);
  return [
    {
      layout: 'statement' as const,
      kicker: `Sprint ${brief.sprint} · Planning`,
      title: 'El próximo sprint no empieza en cero.',
      body: brief.summary || 'Lo que quedó abierto no es deuda: es material para una hipótesis mejor.',
    },
    {
      layout: 'points' as const,
      kicker: 'Prioridades',
      title: 'Tres apuestas para el próximo sprint',
      points: (next.length ? next : ['La apuesta más pequeña que cambia una decisión']).map((title) => ({ title, body: 'Una hipótesis, no una lista de deseos.' })),
    },
    {
      layout: 'stats' as const,
      kicker: 'Capacidad',
      title: 'El espacio real',
      stats: (brief.metrics ?? []).slice(0, 3).length ? (brief.metrics ?? []).slice(0, 3) : [{ label: 'Días de foco', value: '—' }],
    },
    {
      layout: 'quote' as const,
      kicker: 'La regla',
      title: 'Una frase para el sprint',
      quote: brief.quote || { text: 'Si no cabe en una frase, todavía no es una prioridad.', author: brief.team || 'Equipo' },
    },
  ].slice(0, 4);
}

export async function createSprintKit(brief: SprintBrief, output?: string): Promise<SprintKitResult> {
  if (!brief.style) throw new Error('A sprint kit needs a style.');
  if (!brief.sprint) throw new Error('A sprint kit needs a sprint number or name.');
  const directory = folderFor(brief, output);
  await mkdir(directory, { recursive: true });

  const base = {
    maxxing: brief.maxxing,
    subfamily: brief.subfamily,
    locale: 'es' as const,
    brand: brief.team || 'Open Beauty',
  };

  const common = {
    tagline: `Sprint ${brief.sprint}${brief.date ? ` · ${brief.date}` : ''}`,
    closing: 'La conversación sigue.',
    cta: { label: 'Abrir el sprint', href: '#slide-1' },
  };
  const slug = clean(brief.sprint, 'sprint', 24).replace(/[^a-zA-Z0-9_-]+/g, '-');

  const review = await createDeck({
    style: brief.style,
    brief: {
      ...base,
      ...common,
      title: `Sprint ${brief.sprint} · Review`,
      slides: slidesForReview(brief),
    },
    output: path.join(directory, `sprint-${slug}-review.html`),
  });
  const retro = await createDeck({
    style: brief.style,
    brief: {
      ...base,
      ...common,
      title: `Sprint ${brief.sprint} · Retrospectiva`,
      slides: slidesForRetro(brief),
      closing: 'Lo que sigue se construye entre todos.',
    },
    output: path.join(directory, `sprint-${slug}-retro.html`),
  });
  const planning = await createDeck({
    style: brief.style,
    brief: {
      ...base,
      ...common,
      title: `Sprint ${brief.sprint} · Planning`,
      slides: slidesForPlanning(brief),
      closing: 'El próximo sprint empieza con una pregunta.',
    },
    output: path.join(directory, `sprint-${slug}-planning.html`),
  });

  const gifBase = {
    style: brief.style,
    subtitle: brief.team || 'Open Beauty',
    template: 'title' as const,
    width: 800,
    height: 800,
    fps: 20,
    duration: 2.4,
    maxxing: brief.maxxing,
  };

  const gifReview = await createGifFile({
    ...gifBase,
    text: `Sprint ${brief.sprint}`,
    subtitle: 'Review',
    output: path.join(directory, `sprint-${slug}-review.gif`),
  });
  const gifRetro = await createGifFile({
    ...gifBase,
    text: `Sprint ${brief.sprint}`,
    subtitle: 'Retro',
    output: path.join(directory, `sprint-${slug}-retro.gif`),
  });
  const gifPlanning = await createGifFile({
    ...gifBase,
    text: `Sprint ${brief.sprint}`,
    subtitle: 'Plan',
    output: path.join(directory, `sprint-${slug}-planning.gif`),
  });

  const file = (result: typeof review, gif: string): SprintKitFile => ({
    html: result.path ?? '',
    gif,
    grade: result.validation.grade,
    score: result.validation.score,
    vision: result.validation.vision.score,
  });

  return {
    directory,
    review: file(review, gifReview.path),
    retro: file(retro, gifRetro.path),
    planning: file(planning, gifPlanning.path),
  };
}
