#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { Brief, StyleSlug } from '../types.js';
import { VERSION } from '../index.js';
import { createGifFile, createPage, timestamp } from '../generate.js';
import { formatValidation, validateHtml } from '../validate.js';
import { presets, styleSlugs } from '../styles/presets.js';
import { SKILL_FALLBACK, styleGuideMarkdown, stylesOverview } from '../guide.js';
import { packageRoot } from '../paths.js';

const styleEnum = z.enum(['renaissance', 'brutalist', 'papercraft']);
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
};

function briefFromArgs(args: Record<string, unknown>): Partial<Brief> {
  return {
    title: args.title as string,
    tagline: args.tagline as string | undefined,
    intro: args.intro as string | undefined,
    eyebrow: args.eyebrow as string | undefined,
    brand: args.brand as string | undefined,
    sections: args.sections as Brief['sections'],
    quote: args.quote as Brief['quote'],
    cta: args.cta as Brief['cta'],
    footer: args.footer as string | undefined,
    locale: args.locale as Brief['locale'],
    seed: args.seed as number | undefined,
  };
}

function text(value: string) {
  return { content: [{ type: 'text' as const, text: value }] };
}

export function createBeautyServer(): McpServer {
  const server = new McpServer(
    { name: 'open-beauty-site', version: VERSION },
    {
      instructions: `open-beauty-site is a design harness. It exists so a small model can produce a page or GIF that looks art-directed instead of generated.

MANDATORY WORKFLOW
1. Call beauty_list_styles.
2. Call beauty_get_style for the chosen style and follow its hard tokens. Never invent fonts, hex colours, border widths or radii.
3. Call beauty_create_page with a real title, a one-sentence tagline, an optional intro and 2–3 sections.
4. Call beauty_validate on the output file. Reach craft A (90+) and vision 4/4. If craft is lower, read the fix lines and adjust the brief or the HTML. If vision is 3/4, change the composition (seed), the image scale or the material.
5. For motion, call beauty_create_gif with the same style.

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
      title: 'List the three editorial systems',
      description:
        'Start here. Returns the three available styles (renaissance, brutalist, papercraft) with when to use each one and the exact display font.',
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
        style: styleEnum.describe('One of renaissance, brutalist or papercraft.'),
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
      },
    },
    async ({ style }) => {
      let skill = SKILL_FALLBACK;
      try {
        skill = await readFile(path.join(packageRoot(), 'skills', 'beauty.md'), 'utf8');
      } catch {
        // The generated fallback is intentionally equivalent.
      }
      if (style) {
        return text(`${skill}\n\n---\n\n${styleGuideMarkdown(style)}`);
      }
      return text(skill);
    },
  );

  server.registerTool(
    'beauty_create_page',
    {
      title: 'Create a complete HTML page',
      description:
        'Renders a full, responsive, animated single-file page from a short brief. Only style and title are required. Returns the file path, grade and fixes.',
      inputSchema: {
        style: styleEnum.describe('Editorial system to use.'),
        ...briefFields,
        output: z
          .string()
          .max(260)
          .optional()
          .describe('File path. Defaults to ./beauty-output/<style>-<slug>-<timestamp>.html.'),
        include_html: z.boolean().optional().describe('Also return the full HTML in the tool response.'),
      },
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
        return { content: [{ type: 'text' as const, text: `Create failed: ${(error as Error).message}` }], isError: true };
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
        output: z.string().max(260).optional().describe('File path. Defaults to ./beauty-output/<style>-<slug>-<timestamp>.gif.'),
      },
    },
    async (args) => {
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
          output: args.output,
        });
        return text(
          `Created a ${presets[args.style].name} GIF.\nfile: ${result.path}\n${result.width}×${result.height} · ${result.frames} frames · ${result.fps} fps · ${Math.round(result.bytes / 1024)} KB\nNext: preview it, or call beauty_validate on a page that uses the same style.`,
        );
      } catch (error) {
        return { content: [{ type: 'text' as const, text: `GIF failed: ${(error as Error).message}` }], isError: true };
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
        const result = validateHtml(source, style);
        return text(`${formatValidation(result)}\n\nstats: ${JSON.stringify(result.stats)}`);
      } catch (error) {
        return { content: [{ type: 'text' as const, text: `Validate failed: ${(error as Error).message}` }], isError: true };
      }
    },
  );

  server.registerTool(
    'beauty_examples',
    {
      title: 'List reference output',
      description: 'Returns the paths of the three example pages and GIFs shipped with the repo.',
      inputSchema: {},
    },
    async () => {
      const root = packageRoot();
      const lines = styleSlugs.map((slug) => {
        const page = path.join(root, 'examples', slug, 'index.html');
        const gif = path.join(root, 'examples', 'gifs', `${slug}.gif`);
        return `- ${presets[slug].name}: page ${page} · gif ${gif}`;
      });
      return text(`# Reference output\n\n${lines.join('\n')}\n\nOpen the pages in a browser. Compare your result against them.`);
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
      let text = SKILL_FALLBACK;
      try {
        text = await readFile(path.join(packageRoot(), 'skills', 'beauty.md'), 'utf8');
      } catch {
        // Keep the fallback if the file is unavailable.
      }
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text }] };
    },
  );

  server.registerResource(
    'beauty-education-skill',
    'beauty://skills/education.md',
    { title: 'Educational page skill', mimeType: 'text/markdown' },
    async (uri) => {
      let text =
        '# Education skill\n\nOne learning objective, one misconception, one concrete detail, one source. Sections as rooms: hook → concept → use. Quote the primary source.';
      try {
        text = await readFile(path.join(packageRoot(), 'skills', 'education.md'), 'utf8');
      } catch {
        // Keep the compact fallback.
      }
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text }] };
    },
  );

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
