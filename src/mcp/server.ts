#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { Brief, CanvasLayer, DeckBrief, StyleSlug } from '../types.js';
import { VERSION } from '../index.js';
import { createCanvas, createDeck, createExperience, createGifFile, createMotion, createPage, createStory, timestamp } from '../generate.js';
import { createSprintKit } from '../sprint.js';
import { formatValidation, validateDeck, validateExperience, validateHtml, validateStory } from '../validate.js';
import { fixHtml } from '../fix.js';
import { presets, styleSlugs } from '../styles/presets.js';
import { makeArtifact } from '../make.js';
import { SKILL_FALLBACK, styleGuideMarkdown, stylesOverview } from '../guide.js';
import { packageRoot } from '../paths.js';

const styleEnum = z.enum([
  'renaissance',
  'brutalist',
  'papercraft',
  'artdeco',
  'isotype',
  'opart',
  'ukiyoe',
  'bestiary',
  'psychedelic',
  'memphis',
  'vaporwave',
  'galactic',
  'nature',
]);

const canvasShared = {
  id: z.string().max(40).optional(),
  opacity: z.number().min(0).max(1).optional(),
  blend: z.enum(['normal', 'multiply', 'screen']).optional(),
  animation: z.enum(['none', 'drift', 'float', 'sway', 'spin', 'breathe', 'pulse', 'draw', 'reveal']).optional(),
  delay: z.number().min(0).max(20).optional(),
  speed: z.number().min(0.2).max(4).optional(),
  transform: z.object({ x: z.number().optional(), y: z.number().optional(), rotate: z.number().optional(), scale: z.number().optional() }).optional(),
};

const canvasLayerSchema: z.ZodTypeAny = z.lazy(() => z.union([
  z.object({ ...canvasShared, kind: z.literal('path'), d: z.string().min(2).max(12000), fill: z.string().max(30).optional(), stroke: z.string().max(30).optional(), strokeWidth: z.number().optional(), dash: z.string().max(80).optional() }),
  z.object({ ...canvasShared, kind: z.literal('circle'), cx: z.number(), cy: z.number(), r: z.number(), fill: z.string().max(30).optional(), stroke: z.string().max(30).optional(), strokeWidth: z.number().optional() }),
  z.object({ ...canvasShared, kind: z.literal('ellipse'), cx: z.number(), cy: z.number(), rx: z.number(), ry: z.number(), rotate: z.number().optional(), fill: z.string().max(30).optional(), stroke: z.string().max(30).optional(), strokeWidth: z.number().optional() }),
  z.object({ ...canvasShared, kind: z.literal('rect'), x: z.number(), y: z.number(), width: z.number(), height: z.number(), radius: z.number().optional(), rotate: z.number().optional(), fill: z.string().max(30).optional(), stroke: z.string().max(30).optional(), strokeWidth: z.number().optional() }),
  z.object({ ...canvasShared, kind: z.literal('line'), x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number(), stroke: z.string().max(30).optional(), strokeWidth: z.number().optional(), dash: z.string().max(80).optional() }),
  z.object({ ...canvasShared, kind: z.literal('polygon'), points: z.string().min(4).max(2000), fill: z.string().max(30).optional(), stroke: z.string().max(30).optional(), strokeWidth: z.number().optional() }),
  z.object({ ...canvasShared, kind: z.literal('text'), text: z.string().min(1).max(160), x: z.number(), y: z.number(), size: z.number().min(6).max(320), font: z.enum(['display', 'body', 'mono']).optional(), fill: z.string().max(30).optional(), anchor: z.enum(['start', 'middle', 'end']).optional(), weight: z.number().optional(), letterSpacing: z.number().optional() }),
  z.object({ ...canvasShared, kind: z.literal('image'), href: z.string().min(1).max(500), alt: z.string().min(1).max(240), caption: z.string().max(160).optional(), source: z.string().max(120).optional(), x: z.number(), y: z.number(), width: z.number(), height: z.number(), radius: z.number().optional() }),
  z.object({ ...canvasShared, kind: z.literal('group'), children: z.array(canvasLayerSchema).min(1).max(48) }),
]));

const localeEnum = z.enum(['es', 'en']);

const sectionSchema = z.object({
  kicker: z.string().max(40).optional().describe('Tiny label above the card title.'),
  title: z.string().min(1).max(80).describe('Card title.'),
  body: z.string().min(1).max(400).describe('One or two sentences.'),
});

const quoteSchema = z.object({
  text: z.string().min(1).max(320),
  author: z.string().max(90).optional(),
});

const ctaSchema = z.object({
  label: z.string().min(1).max(40),
  href: z.string().max(200),
});

const deckPointSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().max(180).optional(),
});

const deckStatSchema = z.object({
  value: z.string().min(1).max(18),
  label: z.string().min(1).max(48),
});

const deckSlideSchema = z.object({
  layout: z.enum(['statement', 'points', 'stats', 'quote', 'figure']).optional(),
  kicker: z.string().max(40).optional(),
  title: z.string().min(1).max(120),
  body: z.string().max(300).optional(),
  points: z.array(deckPointSchema).max(4).optional(),
  stats: z.array(deckStatSchema).max(3).optional(),
  quote: quoteSchema.optional(),
  figure: z.object({
    caption: z.string().max(140).optional(),
    source: z.string().max(120).optional(),
    scene: z.object({
      kind: z.enum(['meadow', 'forest', 'garden', 'house', 'river', 'night', 'market', 'room']).optional(),
      characters: z.array(z.enum(['rabbit', 'cat', 'fox', 'bird', 'child'])).max(4).optional(),
      props: z.array(z.enum(['pine', 'tree', 'house', 'gate', 'table', 'lantern', 'basket', 'flowers', 'boat'])).max(8).optional(),
      caption: z.string().max(120).optional(),
    }).optional(),
  }).optional().describe('Figure layout: papercut scene with caption and source.'),
});

const experienceItemSchema = z.object({
  label: z.string().min(1).max(80),
  detail: z.string().max(180).optional(),
  value: z.string().max(24).optional(),
});

const experienceRoomSchema = z.object({
  kicker: z.string().max(42).optional(),
  title: z.string().min(1).max(92),
  body: z.string().max(700).optional(),
  display: z.enum(['scene', 'menu', 'exhibit', 'timeline', 'quote', 'objects']).optional(),
  items: z.array(experienceItemSchema).max(6).optional(),
  quote: quoteSchema.optional(),
  note: z.string().max(180).optional(),
});

const storySceneSchema = z.object({
  kind: z.enum(['meadow', 'forest', 'garden', 'house', 'river', 'night', 'market', 'room']).optional(),
  characters: z.array(z.enum(['rabbit', 'cat', 'fox', 'bird', 'child'])).max(4).optional(),
  props: z.array(z.enum(['pine', 'tree', 'house', 'gate', 'table', 'lantern', 'basket', 'flowers', 'boat'])).max(8).optional(),
  caption: z.string().max(120).optional(),
});

const storyChapterSchema = z.object({
  kicker: z.string().max(48).optional(),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(5000),
  quote: quoteSchema.optional(),
  fact: z.string().max(220).optional(),
  scene: storySceneSchema.optional().describe('Papercut scene for format=storybook.'),
});


const briefFields = {
  title: z.string().min(1).max(120).describe('Page headline. This is the only required field besides style.'),
  tagline: z.string().max(200).optional().describe('One sentence under the headline.'),
  intro: z.string().max(900).optional().describe('Longer manifesto paragraph, 2–3 sentences.'),
  eyebrow: z.string().max(60).optional().describe('Small uppercase label above the headline.'),
  brand: z.string().max(50).optional().describe('Studio or project name for the header and footer.'),
  sections: z.array(sectionSchema).max(6).optional().describe('2–3 cards work best. Omit for a one-screen page.'),
  quote: quoteSchema.optional(),
  cta: ctaSchema.optional().describe('Final call to action. Defaults to a sensible label.'),
  footer: z.string().max(160).optional(),
  locale: localeEnum.optional().describe('Microcopy language. Defaults to Spanish.'),
  seed: z.number().int().min(0).max(9999).optional().describe('Changes decorative variation deterministically.'),
  subfamily: z.string().max(40).optional().describe('Curated subfamily slug from beauty_get_style.'),
  audio: z.object({ src: z.string().max(300), title: z.string().max(80), subtitle: z.string().max(100).optional(), note: z.string().max(180).optional() }).optional().describe('Optional original audio, user-initiated.'),
  maxxing: z.boolean().optional().describe('Push ornament, type and motion to the maximum; still palette-bound.'),
};

const pageInputSchema = z.object({
  style: styleEnum.describe('Editorial system to use.'),
  ...briefFields,
  output: z
    .string()
    .max(260)
    .optional()
    .describe('File path. Defaults to ./beauty-output/<style>-<slug>-<timestamp>.html.'),
  include_html: z.boolean().optional().describe('Also return the full HTML in the tool response.'),
});

type PageInput = z.infer<typeof pageInputSchema>;

const deckInputSchema = z.object({
  style: styleEnum.describe('Editorial system to use.'),
  title: z.string().min(1).max(120),
  tagline: z.string().max(200).optional(),
  intro: z.string().max(900).optional(),
  eyebrow: z.string().max(60).optional(),
  brand: z.string().max(50).optional(),
  slides: z.array(deckSlideSchema).min(1).max(8).describe('Content slides. The cover and closing are generated automatically.'),
  closing: z.string().max(120).optional().describe('Closing headline; defaults to "La conversación sigue."'),
  subfamily: z.string().max(40).optional().describe('Curated subfamily slug from beauty_get_style.'),
  maxxing: z.boolean().optional().describe('Richer ornament, type contrast and motion.'),
  cta: ctaSchema.optional(),
  locale: localeEnum.optional(),
  output: z.string().max(260).optional().describe('File path. Defaults to ./beauty-output/<style>-deck-<timestamp>.html.'),
  include_html: z.boolean().optional(),
});

type DeckInput = z.infer<typeof deckInputSchema>;

const experienceInputSchema = z.object({
  style: styleEnum,
  kind: z.enum(['restaurant', 'museum', 'history', 'studio', 'club', 'garden']).optional(),
  title: z.string().min(1).max(120),
  tagline: z.string().max(200).optional(),
  intro: z.string().max(700).optional(),
  eyebrow: z.string().max(60).optional(),
  brand: z.string().max(50).optional(),
  rooms: z.array(experienceRoomSchema).min(3).max(8),
  hours: z.string().max(140).optional(),
  address: z.string().max(140).optional(),
  source: z.string().max(240).optional(),
  closing: z.string().max(220).optional(),
  maxxing: z.boolean().optional().describe('Richer ornament, type contrast and motion.'),
  cta: ctaSchema.optional(),
  locale: localeEnum.optional(),
  output: z.string().max(260).optional(),
  include_html: z.boolean().optional(),
});

type ExperienceInput = z.infer<typeof experienceInputSchema>;

const storyInputSchema = z.object({
  style: styleEnum,
  kind: z.enum(['story', 'history', 'lesson', 'essay']).optional().describe('story = cuento; history = lección histórica; lesson = explicador.'),
  title: z.string().min(1).max(120),
  tagline: z.string().max(200).optional(),
  intro: z.string().max(700).optional(),
  eyebrow: z.string().max(60).optional(),
  brand: z.string().max(50).optional(),
  chapters: z.array(storyChapterSchema).min(2).max(8),
  source: z.string().max(300).optional(),
  readingTime: z.string().max(40).optional(),
  format: z.enum(['scroll', 'storybook']).optional().describe('storybook = illustrated papercut page per chapter.'),
  maxxing: z.boolean().optional().describe('Richer ornament, type contrast and motion.'),
  cta: ctaSchema.optional(),
  locale: localeEnum.optional(),
  output: z.string().max(260).optional(),
  include_html: z.boolean().optional(),
});

type StoryInput = z.infer<typeof storyInputSchema>;

function briefFromArgs(args: PageInput): Partial<Brief> {
  return {
    title: args.title,
    tagline: args.tagline,
    intro: args.intro,
    eyebrow: args.eyebrow,
    brand: args.brand,
    sections: args.sections,
    quote: args.quote,
    cta: args.cta,
    footer: args.footer,
    locale: args.locale,
    seed: args.seed,
    subfamily: args.subfamily,
    audio: args.audio,
    maxxing: args.maxxing,
  };
}

function deckBriefFromArgs(args: DeckInput): Partial<DeckBrief> {
  return {
    title: args.title,
    tagline: args.tagline,
    intro: args.intro,
    eyebrow: args.eyebrow,
    brand: args.brand,
    slides: args.slides,
    closing: args.closing,
    cta: args.cta,
    locale: args.locale,
    subfamily: args.subfamily,
    maxxing: args.maxxing,
  };
}

function slugFromTitle(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'piece';
}

function text(value: string) {
  return { content: [{ type: 'text' as const, text: value }] };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errorResult(message: string) {
  return { content: [{ type: 'text' as const, text: message }], isError: true };
}

export function createBeautyServer(): McpServer {
  const server = new McpServer(
    { name: 'open-beauty-site', version: VERSION },
    {
      instructions: `open-beauty-site is a design harness. It exists so a small model can produce a page, a 16:9 presentation or a GIF that looks art-directed instead of generated.

MANDATORY WORKFLOW
1. Call beauty_list_styles.
2. Call beauty_get_style for the chosen style and follow its hard tokens. Never invent fonts, hex colours, border widths or radii.
3. Shortest path: call beauty_make with kind, style and one idea sentence; it expands the brief, generates and validates in one step. Otherwise choose the artefact: beauty_create_page for a landing, beauty_create_deck for a talk, beauty_create_experience for a place with rooms, beauty_create_story for a cuento or history lesson.
4. Call beauty_validate on the output file. Reach craft A (90+) and vision 4/4. If craft is lower, call beauty_fix to apply the safe automatic repairs (lang/title/viewport, alt, headings, landmarks, Never-list elements, palette snap, overflow clamps), then beauty_validate again. If vision is 3/4, change the composition (seed), the image scale or the material.
5. For motion, call beauty_create_gif with the same style. Add maxxing: true when the brief deserves the full art direction. Use beauty_get_skill({ format: "deck" | "experience" | "story" | "agile" | "sprint" }) before briefing. For a coordinated sprint review/retro/planning kit, use beauty_create_sprint.

QUALITY BAR
- No lorem ipsum, no placeholder names, no emoji, no stock photography.
- One accent per screen; whitespace is part of the layout.
- Pastel is a flat field with a hard edge, not a gradient aura.
- Headlines must remain readable at 360px wide.
- Do not mix two styles in one artefact.
- If a tool fails, report the exact error; do not silently fall back to generic design.`,
    },
  );

  server.registerTool(
    'beauty_list_styles',
    {
      title: 'List the thirteen editorial systems',
      description:
        'Start here. Returns the thirteen available styles with when to use each one, the exact display font, and the curated subfamilies.',
      inputSchema: {},
    },
    async () => text(stylesOverview()),
  );

  server.registerTool(
    'beauty_get_style',
    {
      title: 'Read one complete style guide',
      description:
        'Returns the exact fonts, palette, border widths, radii, motion window, layout rules and do/don\'t list. Call this before creating anything.',
      inputSchema: {
        style: styleEnum.describe('One of the 13 art directions. Call beauty_list_styles for the full list.'),
        format: z.enum(['markdown', 'json']).optional().describe('Markdown for reading, JSON for programmatic use.'),
      },
    },
    async ({ style, format }) => {
      if (format === 'json') {
        return text(JSON.stringify(presets[style], null, 2));
      }
      return text(styleGuideMarkdown(style));
    },
  );

  server.registerTool(
    'beauty_get_skill',
    {
      title: 'Read the ready-to-use agent skill',
      description:
        'Returns a copy-paste skill/prompt that teaches an agent the mandatory workflow and the quality bar. Optionally includes one style guide.',
      inputSchema: {
        style: styleEnum.optional().describe('Include a specific style guide after the skill instructions.'),
        format: z.enum(['page', 'deck', 'experience', 'story', 'agile', 'sprint', 'motion', 'canvas']).optional().describe('Append the matching format skill.'),
      },
    },
    async ({ style, format }) => {
      let skill = SKILL_FALLBACK;
      try {
        skill = await readFile(path.join(packageRoot(), 'skills', 'beauty.md'), 'utf8');
      } catch {
        // The generated fallback is intentionally equivalent.
      }
      if (format && format !== 'page') {
        const file = format === 'deck' ? 'presentation.md' : format === 'experience' ? 'experience.md' : format === 'story' ? 'story.md' : format === 'motion' ? 'motion.md' : format === 'canvas' ? 'canvas.md' : 'agile.md';
        try {
          skill += `\n\n---\n\n${await readFile(path.join(packageRoot(), 'skills', file), 'utf8')}`;
        } catch {
          skill += format === 'experience'
            ? '\n\nUse beauty_create_experience with 3–8 rooms, one idea per room, objects for utility.'
            : format === 'story'
              ? '\n\nUse beauty_create_story with 2–8 chapters, one scene and one turn per chapter.'
              : format === 'agile'
                ? '\n\nUse beauty_create_deck for sprint review, retrospective or planning; use beauty_create_gif for the teaser.'
                : '\n\nUse beauty_create_deck with 4–8 content slides, one subfamily and 5–8 total slides.';
        }
      }
      if (style) {
        return text(`${skill}\n\n---\n\n${styleGuideMarkdown(style)}`);
      }
      return text(skill);
    },
  );

  const makeInputSchema = z.object({
    kind: z
      .enum(['page', 'deck', 'gif', 'story', 'experience', 'motion'])
      .describe('What to create: "page", "deck", "gif", "story", "experience" or "motion". Example: "gif".'),
    style: styleEnum.describe('One of the 13 art directions; call beauty_list_styles first. Example: "nature".'),
    idea: z
      .string()
      .describe('One sentence describing the subject or goal. Example: "A neighborhood bakery that bakes sourdough at dawn."'),
    locale: localeEnum.optional().describe('Microcopy language: "es" (default) or "en". Example: "en".'),
    output: z
      .string()
      .max(260)
      .optional()
      .describe('File path for the result. Omit it for a deterministic ./beauty-output path. Example: "out/bakery.gif".'),
  });

  server.registerTool(
    'beauty_make',
    {
      title: 'Create a complete artefact from one sentence',
      description:
        'One-shot entry point for small models: pass kind, style and one idea sentence and get a complete, validated artefact. It expands the idea with per-style copy (es/en), runs the matching generator, validates it, and returns { path, grade, score, issues[], next_step }. Example: beauty_make({ kind: "page", style: "nature", idea: "Un jardín que guarda la lluvia de octubre.", locale: "en" }).',
      inputSchema: makeInputSchema,
    },
    async (args) => {
      try {
        const result = await makeArtifact(args);
        return text(
          JSON.stringify(
            {
              path: result.path,
              grade: result.grade,
              score: result.score,
              issues: result.issues,
              next_step: result.next_step,
              kind: result.kind,
              style: result.style,
              locale: result.locale,
              summary: result.summary,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        return errorResult(`Make failed: ${errorMessage(error)}`);
      }
    },
  );

  server.registerTool(
    'beauty_create_page',
    {
      title: 'Create a complete HTML page',
      description:
        'Renders a full, responsive, animated single-file page from a short brief. Only style and title are required. Returns the file path, grade and fixes.',
      inputSchema: pageInputSchema,
    },
    async (args) => {
      try {
        const style = args.style;
        const output =
          args.output ??
          path.join('beauty-output', `${style}-${args.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)}-${timestamp()}.html`);
        const result = await createPage({ style, brief: briefFromArgs(args), output });
        const issues = result.validation.issues
          .slice(0, 6)
          .map((issue) => `- [${issue.severity}] ${issue.code}: ${issue.message}${issue.fix ? `\n  fix: ${issue.fix}` : ''}`)
          .join('\n');
        const summary = [
          `Created a ${presets[style].name} page.`,
          `file: ${result.path}`,
          `grade: ${result.validation.grade} (${result.validation.score}/100)`,
          `vision: ${result.validation.vision.score}/4 (${result.validation.vision.checks.map((check) => `${check.name}:${check.passed ? 'ok' : 'missing'}`).join(' · ')})`,
          `fonts: ${result.validation.stats.fonts.join(', ')}`,
          `issues: ${result.validation.issues.length}`,
          issues ? `\n${issues}` : '\nNo craft issues. The page follows the editorial system.',
          `\nNext: open the file, or call beauty_validate if you edit it. If vision is below 4/4, the page is obedient but may not be art.`,
        ].join('\n');
        return text(args.include_html ? `${summary}\n\n--- HTML ---\n${result.html}` : summary);
      } catch (error) {
        return errorResult(`Create failed: ${errorMessage(error)}`);
      }
    },
  );

  server.registerTool(
    'beauty_create_deck',
    {
      title: 'Create an animated 16:9 presentation',
      description:
        'Builds a complete keyboard-navigable deck with transitions, progress, cover and closing. Use 4–8 slides, one idea per slide, 1–2 sentences per body. Supports curated subfamilies. Returns craft/vision and the file path.',
      inputSchema: deckInputSchema,
    },
    async (args) => {
      try {
        const style = args.style;
        const output =
          args.output ??
          path.join('beauty-output', `${style}-deck-${args.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)}-${timestamp()}.html`);
        const result = await createDeck({ style, brief: deckBriefFromArgs(args), output });
        const summary = [
          `Created a ${result.slideCount}-slide ${presets[style].name} presentation (${result.subfamily} subfamily).`,
          `file: ${result.path}`,
          `grade: ${result.validation.grade} (${result.validation.score}/100)`,
          `vision: ${result.validation.vision.score}/4 (${result.validation.vision.checks.map((check) => `${check.name}:${check.passed ? 'ok' : 'missing'}`).join(' · ')})`,
          `issues: ${result.validation.issues.length}`,
          `\nNavigation: ← → / space, Home/End, F for fullscreen, swipe on touch.`,
          `\nNext: open the file, or call beauty_validate if you edit it.`,
        ].join('\n');
        return text(args.include_html ? `${summary}\n\n--- HTML ---\n${result.html}` : summary);
      } catch (error) {
        return errorResult(`Deck failed: ${errorMessage(error)}`);
      }
    },
  );

  server.registerTool(
    'beauty_create_sprint',
    {
      title: 'Create a sprint review, retrospective and planning kit',
      description:
        'Corpo pack: one brief produces three coordinated decks (review, retrospective, planning) and three matching GIFs in one folder. Use maxxing for the full art direction. Metrics are evidence, not decoration.',
      inputSchema: {
        style: styleEnum.describe('Editorial system for the whole kit.'),
        sprint: z.string().min(1).max(40).describe('Sprint number or name.'),
        team: z.string().max(50).optional(),
        date: z.string().max(40).optional(),
        maxxing: z.boolean().optional().describe('Richer ornament, type contrast and motion.'),
        summary: z.string().max(240).optional().describe('One honest sentence that opens the review.'),
        metrics: z.array(z.object({ label: z.string().max(40), value: z.string().max(18) })).max(3).optional(),
        highlights: z.array(z.string().max(120)).max(4).optional().describe('Things that now exist; what the team can demo.'),
        blockers: z.array(z.string().max(120)).max(4).optional().describe('Systemic friction, not personal blame.'),
        next: z.array(z.string().max(120)).max(4).optional().describe('Small bets for the next sprint.'),
        quote: quoteSchema.optional(),
        subfamily: z.string().max(40).optional(),
        output: z.string().max(260).optional().describe('Output folder. Defaults to ./beauty-output/sprint-<sprint>.'),
      },
    },
    async (args) => {
      try {
        const result = await createSprintKit(
          {
            style: args.style,
            sprint: args.sprint,
            team: args.team,
            date: args.date,
            maxxing: args.maxxing,
            summary: args.summary,
            metrics: args.metrics,
            highlights: args.highlights,
            blockers: args.blockers,
            next: args.next,
            quote: args.quote,
            subfamily: args.subfamily,
          },
          args.output,
        );
        const lines = [
          `Sprint kit created in ${result.directory}`,
          `review: ${result.review.grade} ${result.review.score}/100 · vision ${result.review.vision}/4`,
          `retro: ${result.retro.grade} ${result.retro.score}/100 · vision ${result.retro.vision}/4`,
          `planning: ${result.planning.grade} ${result.planning.score}/100 · vision ${result.planning.vision}/4`,
          `gifs: 3`,
          `\nNext: open the three decks, then drop the GIFs into the sprint channel.`,
        ];
        return text(lines.join('\n'));
      } catch (error) {
        return errorResult(`Sprint kit failed: ${errorMessage(error)}`);
      }
    },
  );

  server.registerTool(
    'beauty_create_experience',
    {
      title: 'Create a digital experience with rooms',
      description:
        'Builds a multi-room, single-file experience for a restaurant, museum, history room, studio or club. Each room has a procedural scene, copy, optional objects and an exit. Use 3–8 rooms; add source/hours/address when the place needs utility.',
      inputSchema: experienceInputSchema,
    },
    async (args) => {
      try {
        const output =
          args.output ??
          path.join('beauty-output', `${args.style}-${args.kind ?? 'experience'}-${slugFromTitle(args.title)}-${timestamp()}.html`);
        const result = await createExperience({
          style: args.style,
          brief: {
            title: args.title,
            tagline: args.tagline,
            intro: args.intro,
            eyebrow: args.eyebrow,
            brand: args.brand,
            kind: args.kind,
            rooms: args.rooms,
            hours: args.hours,
            address: args.address,
            source: args.source,
            closing: args.closing,
            maxxing: args.maxxing,
            cta: args.cta,
            locale: args.locale,
          },
          output,
        });
        const summary = [
          `Created a ${result.roomCount}-room ${presets[args.style].name} experience (${result.kind}).`,
          `file: ${result.path}`,
          `grade: ${result.validation.grade} (${result.validation.score}/100)`,
          `vision: ${result.validation.vision.score}/4`,
          `issues: ${result.validation.issues.length}`,
          `\nRooms share a scene system, a room rail, scroll progress and reduced-motion.`,
        ].join('\n');
        return text(args.include_html ? `${summary}\n\n--- HTML ---\n${result.html}` : summary);
      } catch (error) {
        return errorResult(`Experience failed: ${errorMessage(error)}`);
      }
    },
  );

  server.registerTool(
    'beauty_create_story',
    {
      title: 'Create a long-form story or history lesson',
      description:
        'Builds a chaptered, single-file story: cover, chapter nav, prose, a drop cap, plates, margin facts and a source. Use it for cuentos, history lessons and narrative essays. Aim for 2–8 chapters, 80–250 words each.',
      inputSchema: storyInputSchema,
    },
    async (args) => {
      try {
        const output =
          args.output ??
          path.join('beauty-output', `${args.style}-story-${slugFromTitle(args.title)}-${timestamp()}.html`);
        const result = await createStory({
          style: args.style,
          brief: {
            title: args.title,
            kind: args.kind,
            tagline: args.tagline,
            intro: args.intro,
            eyebrow: args.eyebrow,
            brand: args.brand,
            chapters: args.chapters,
            source: args.source,
            readingTime: args.readingTime,
            format: args.format,
            maxxing: args.maxxing,
            cta: args.cta,
            locale: args.locale,
          },
          output,
        });
        const summary = [
          `Created a ${result.chapterCount}-chapter ${presets[args.style].name} story.`,
          `file: ${result.path}`,
          `grade: ${result.validation.grade} (${result.validation.score}/100)`,
          `vision: ${result.validation.vision.score}/4`,
          `issues: ${result.validation.issues.length}`,
          `\nReading structure: cover, chapter nav, drop cap, plates, margin facts, source.`,
        ].join('\n');
        return text(args.include_html ? `${summary}\n\n--- HTML ---\n${result.html}` : summary);
      } catch (error) {
        return errorResult(`Story failed: ${errorMessage(error)}`);
      }
    },
  );

  server.registerTool(
    'beauty_create_gif',
    {
      title: 'Create a looping GIF',
      description:
        'Renders an animated GIF with the same editorial system: title reveal, loop or poster. Text should be short (2–6 words).',
      inputSchema: {
        style: styleEnum,
        text: z.string().min(1).max(48).describe('Short headline for the GIF.'),
        subtitle: z.string().max(64).optional().describe('Small caption below the title.'),
        template: z.enum(['title', 'loop', 'poster']).optional().describe('title = reveal, loop = seamless marquee/float, poster = ambient shapes.'),
        width: z.number().int().min(240).max(1200).optional(),
        height: z.number().int().min(240).max(1200).optional(),
        fps: z.number().int().min(8).max(30).optional(),
        duration: z.number().min(1).max(6).optional(),
        maxxing: z.boolean().optional().describe('Additional art marks and ambient movement.'),
        output: z.string().max(260).optional().describe('File path. Defaults to ./beauty-output/<style>-<slug>-<timestamp>.gif.'),
      },
    },
    async (args, extra) => {
      if (extra.signal?.aborted) {
        return errorResult('GIF cancelled before rendering.');
      }
      try {
        const result = await createGifFile({
          style: args.style,
          text: args.text,
          subtitle: args.subtitle,
          template: args.template,
          width: args.width,
          height: args.height,
          fps: args.fps,
          duration: args.duration,
          maxxing: args.maxxing,
          output: args.output,
        });
        return text(
          `Created a ${presets[args.style].name} GIF.\nfile: ${result.path}\n${result.width}×${result.height} · ${result.frames} frames · ${result.fps} fps · ${Math.round(result.bytes / 1024)} KB\nNext: preview it, or call beauty_validate on a page that uses the same style.`,
        );
      } catch (error) {
        return errorResult(`GIF failed: ${errorMessage(error)}`);
      }
    },
  );

  server.registerTool(
    'beauty_create_canvas',
    {
      title: 'Create an open animated SVG canvas',
      description:
        'You are the artist: draw with paths, circles, ellipses, rects, lines, polygons, text, groups and images. Use @palette tokens so every colour belongs to the chosen style. Animate individual layers with drift, float, sway, spin, breathe, pulse, draw or reveal. Images require alt; caption and source are preserved. No fixed scenes, characters or poses are imposed.',
      inputSchema: {
        style: styleEnum.describe('Palette and type system for the canvas.'),
        title: z.string().max(120).optional().describe('Accessible title and metadata; optional.'),
        size: z.enum(['square', 'portrait', 'landscape', 'wide']).optional(),
        width: z.number().min(320).max(2400).optional(),
        height: z.number().min(320).max(2400).optional(),
        background: z.string().max(30).optional().describe('Palette token, e.g. @bg or @deep.'),
        duration: z.number().min(4).max(40).optional().describe('Animation duration in seconds.'),
        seed: z.number().int().min(0).max(9999).optional(),
        texture: z.enum(['none', 'paper', 'grain']).optional(),
        credits: z.boolean().optional().describe('Render caption/source for image assets; defaults to true.'),
        layers: z.array(canvasLayerSchema).min(1).max(96).describe('The painting. At least one layer; group nests up to 48 children per group.'),
        output: z.string().max(260).optional().describe('File path. Defaults to ./beauty-output/<style>-canvas-<slug>-<timestamp>.svg.'),
        include_svg: z.boolean().optional(),
      },
    },
    async (args) => {
      try {
        const output = args.output ?? path.join('beauty-output', `${args.style}-canvas-${slugFromTitle(args.title || 'canvas')}-${timestamp()}.svg`);
        const result = await createCanvas({
          style: args.style,
          brief: {
            style: args.style,
            title: args.title,
            size: args.size,
            width: args.width,
            height: args.height,
            background: args.background,
            duration: args.duration,
            seed: args.seed,
            texture: args.texture,
            credits: args.credits,
            layers: args.layers as CanvasLayer[],
          },
          output,
        });
        const ok = result.checks.every((check) => check.passed);
        const summary = [
          `Created an open ${presets[args.style].name} canvas.`,
          `file: ${result.path}`,
          `${result.width}×${result.height} · ${result.layerCount} layers · ${result.bytes} bytes`,
          `assets: ${result.assets.length}${result.assets.length ? ` (${result.assets.map((asset) => asset.alt).join(' · ')})` : ''}`,
          `checks: ${result.checks.map((check) => `${check.name}:${check.passed ? 'ok' : 'missing'}`).join(' · ')}`,
          ok ? '\nOpen it in a browser; animation respects prefers-reduced-motion.' : '\nOne check failed; inspect the SVG.',
        ].join('\n');
        return text(args.include_svg ? `${summary}\n\n--- SVG ---\n${await readFile(result.path, 'utf8')}` : summary);
      } catch (error) {
        return { content: [{ type: 'text' as const, text: `Canvas failed: ${(error as Error).message}` }], isError: true };
      }
    },
  );

  server.registerTool(
    'beauty_create_motion',
    {
      title: 'Create an animated SVG poster',
      description:
        'Creates a single-file, looping animated SVG with the chosen style and a scene vocabulary: orbit, bloom, tide, papercut, constellation, ribbon, rain or type. Includes CSS motion, reduced-motion fallback, title, caption and source. Use maxxing for a hero loop.',
      inputSchema: {
        style: styleEnum.describe('Editorial system.'),
        title: z.string().min(1).max(90).describe('2–6 words; the renderer fits the width.'),
        subtitle: z.string().max(120).optional(),
        eyebrow: z.string().max(60).optional(),
        brand: z.string().max(50).optional(),
        footer: z.string().max(120).optional(),
        scene: z.enum(['orbit', 'bloom', 'tide', 'papercut', 'constellation', 'ribbon', 'rain', 'type']).optional(),
        size: z.enum(['square', 'portrait', 'landscape']).optional(),
        duration: z.number().min(6).max(24).optional(),
        seed: z.number().int().min(0).max(9999).optional(),
        maxxing: z.boolean().optional(),
        output: z.string().max(260).optional().describe('File path. Defaults to ./beauty-output/<style>-motion-<slug>-<timestamp>.svg.'),
        include_svg: z.boolean().optional(),
      },
    },
    async (args) => {
      try {
        const output = args.output ?? path.join('beauty-output', `${args.style}-motion-${slugFromTitle(args.title)}-${timestamp()}.svg`);
        const result = await createMotion({
          style: args.style,
          brief: {
            style: args.style,
            title: args.title,
            subtitle: args.subtitle,
            eyebrow: args.eyebrow,
            brand: args.brand,
            footer: args.footer,
            scene: args.scene,
            size: args.size,
            duration: args.duration,
            seed: args.seed,
            maxxing: args.maxxing,
          },
          output,
        });
        const ok = result.checks.every((check) => check.passed);
        const summary = [
          `Created an animated ${presets[args.style].name} SVG (${result.scene}).`,
          `file: ${result.path}`,
          `${result.width}×${result.height} · ${result.duration}s`,
          `checks: ${result.checks.map((check) => `${check.name}:${check.passed ? 'ok' : 'missing'}`).join(' · ')}`,
          ok ? '\nOpen it in a browser; the loop respects prefers-reduced-motion.' : '\nOne check failed; inspect the SVG.',
        ].join('\n');
        return text(args.include_svg ? `${summary}\n\n--- SVG ---\n${await readFile(result.path, 'utf8')}` : summary);
      } catch (error) {
        return { content: [{ type: 'text' as const, text: `Motion failed: ${(error as Error).message}` }], isError: true };
      }
    },
  );

  server.registerTool(
    'beauty_validate',
    {
      title: 'Audit a page against one style',
      description:
        'Scores an HTML file from 0–100 and lists exact fixes for fonts, palette, borders, radii, shadows, motion, markup and contrast. Use this after any manual edit.',
      inputSchema: {
        style: styleEnum,
        path: z.string().max(260).optional().describe('Path to an HTML file.'),
        html: z.string().optional().describe('Raw HTML, if you do not have a file.'),
      },
    },
    async ({ style, path: filePath, html }) => {
      try {
        const source = html ?? (filePath ? await readFile(path.resolve(process.cwd(), filePath), 'utf8') : '');
        if (!source) {
          return { content: [{ type: 'text' as const, text: 'Pass either path or html.' }], isError: true };
        }
        const result = source.includes('class="deck')
      ? validateDeck(source, style)
      : source.includes('class="xp ')
        ? validateExperience(source, style)
        : source.includes('class="story-page')
          ? validateStory(source, style)
          : validateHtml(source, style);
        return text(`${formatValidation(result)}\n\nstats: ${JSON.stringify(result.stats)}`);
      } catch (error) {
        return errorResult(`Validate failed: ${errorMessage(error)}`);
      }
    },
  );

  server.registerTool(
    'beauty_fix',
    {
      title: 'Apply safe automatic repairs and re-validate',
      description:
        'Replays the machine-applicable patches from beauty_validate: missing lang/title/viewport, empty alt, heading order, skip link and landmarks, forbidden Never-list elements, off-palette colours snapped to the nearest token and text-overflow clamps. Returns before/after scores and is idempotent. Write with output when you want a file on disk.',
      inputSchema: {
        style: styleEnum,
        path: z.string().max(260).optional().describe('Path to an HTML file.'),
        html: z.string().optional().describe('Raw HTML, if you do not have a file.'),
        output: z.string().max(260).optional().describe('Write the repaired HTML to this path.'),
        include_html: z.boolean().optional().describe('Also return the repaired HTML.'),
      },
    },
    async ({ style, path: filePath, html, output, include_html }) => {
      try {
        const source = html ?? (filePath ? await readFile(path.resolve(process.cwd(), filePath), 'utf8') : '');
        if (!source) {
          return { content: [{ type: 'text' as const, text: 'Pass either path or html.' }], isError: true };
        }
        const result = fixHtml(source, style);
        if (output) {
          await writeFile(path.resolve(process.cwd(), output), result.html, 'utf8');
        }
        const summary = [
          `Repaired a ${presets[style].name} page.`,
          `score: ${result.before.score} (${result.before.grade}) → ${result.after.score} (${result.after.grade})`,
          `errors: ${result.before.errors} → ${result.after.errors} · warnings: ${result.before.warnings} → ${result.after.warnings}`,
          `repairs: ${result.fixes.length}${result.fixes.length ? ` (${result.fixes.join(', ')})` : ' — already clean'}`,
          output ? `file: ${path.resolve(process.cwd(), output)}` : 'No file written (pass output to save).',
          `Next: call beauty_validate to confirm the repairs.`,
        ].join('\n');
        return text(include_html ? `${summary}\n\n--- HTML ---\n${result.html}` : summary);
      } catch (error) {
        return errorResult(`Fix failed: ${errorMessage(error)}`);
      }
    },
  );

  server.registerTool(
    'beauty_examples',
    {
      title: 'List reference output',
      description: 'Returns the paths of the thirteen example pages and GIFs shipped with the repo.',
      inputSchema: {},
    },
    async () => {
      const root = packageRoot();
      const showcase = new Set<StyleSlug>(['artdeco', 'isotype', 'opart', 'ukiyoe', 'bestiary', 'psychedelic', 'memphis', 'vaporwave', 'galactic', 'nature']);
      const lines = styleSlugs.map((slug) => {
        const page = showcase.has(slug)
          ? path.join(root, 'examples', 'showcase', slug, 'index.html')
          : path.join(root, 'examples', slug, 'index.html');
        const gif = showcase.has(slug)
          ? path.join(root, 'examples', 'gifs', `showcase-${slug}.gif`)
          : path.join(root, 'examples', 'gifs', `${slug}.gif`);
        return `- ${presets[slug].name}: page ${page} · gif ${gif}`;
      });
      const extra = ([
        ['Casa Perla (restaurant)', 'examples/experiences/casa-perla.html'],
        ['Museo de lo invisible (museum)', 'examples/experiences/museo-invisible.html'],
        ['La casa que aprendió a respirar (story)', 'examples/stories/casa-respira.html'],
        ['El río que cambió de ciudad (history)', 'examples/stories/rio-1870.html'],
        ['Motion SVG posters', 'examples/motions/index.html'],
        ['Atlas Sprint 14 review', 'examples/agile/sprint-14-review.html'],
        ['Atlas Sprint 14 retrospective', 'examples/agile/sprint-14-retro.html'],
        ['Atlas Sprint 15 planning', 'examples/agile/sprint-15-planning.html'],
      ] as const).map(([label, file]) => `- ${label}: ${path.join(root, file)}`);
      return text(`# Reference output\n\n${lines.join('\n')}\n\n## Recent experiences\n\n${extra.join('\n')}\n\nOpen the pages in a browser. Compare your result against them.`);
    },
  );

  for (const slug of styleSlugs) {
    const preset = presets[slug];
    server.registerResource(
      `style-${slug}`,
      `beauty://styles/${slug}`,
      { title: `${preset.name} style tokens`, mimeType: 'application/json', description: preset.epithet },
      async (uri) => ({
        contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(preset, null, 2) }],
      }),
    );
  }

  server.registerResource(
    'beauty-skill',
    'beauty://skills/beauty.md',
    { title: 'open-beauty-site agent skill', mimeType: 'text/markdown' },
    async (uri) => {
      let body = SKILL_FALLBACK;
      try {
        body = await readFile(path.join(packageRoot(), 'skills', 'beauty.md'), 'utf8');
      } catch {
        // Keep the fallback if the file is unavailable.
      }
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: body }] };
    },
  );

  server.registerResource(
    'beauty-education-skill',
    'beauty://skills/education.md',
    { title: 'Educational page skill', mimeType: 'text/markdown' },
    async (uri) => {
      let body =
        '# Education skill\n\nOne learning objective, one misconception, one concrete detail, one source. Sections as rooms: hook → concept → use. Quote the primary source.';
      try {
        body = await readFile(path.join(packageRoot(), 'skills', 'education.md'), 'utf8');
      } catch {
        // Keep the compact fallback.
      }
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: body }] };
    },
  );

  server.registerResource(
    'beauty-presentation-skill',
    'beauty://skills/presentation.md',
    { title: 'Animated presentation skill', mimeType: 'text/markdown' },
    async (uri) => {
      let body = '# Presentation skill\n\n5–8 slides. One idea per slide. 35 words max. Use beauty_create_deck with a curated subfamily.';
      try {
        body = await readFile(path.join(packageRoot(), 'skills', 'presentation.md'), 'utf8');
      } catch {
        // Keep the compact fallback.
      }
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: body }] };
    },
  );

  for (const [slug, title, fallback] of [
    ['experience', 'Experience skill', '# Experience skill\n\n3–8 rooms, one idea each. Use beauty_create_experience.'],
    ['story', 'Story skill', '# Story skill\n\n2–8 chapters, one scene and one turn each. Use beauty_create_story.'],
    ['agile', 'Agile rooms skill', '# Agile skill\n\nSprint review, retrospective and planning decks with real numbers; GIF teaser.'],
  ] as const) {
    server.registerResource(
      `beauty-${slug}-skill`,
      `beauty://skills/${slug}.md`,
      { title, mimeType: 'text/markdown' },
      async (uri) => {
        let body: string = fallback;
        try {
          body = await readFile(path.join(packageRoot(), 'skills', `${slug}.md`), 'utf8');
        } catch {
          // Keep the compact fallback.
        }
        return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: body }] };
      },
    );
  }

  return server;
}

export async function startBeautyServer(): Promise<void> {
  const server = createBeautyServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

const isMain = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
if (isMain) {
  startBeautyServer().catch((error) => {
    console.error('open-beauty-site MCP failed:', error);
    process.exit(1);
  });
}
