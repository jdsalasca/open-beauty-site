import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createGifFile, createPage } from '../src/generate.js';
import type { Brief, StyleSlug } from '../src/types.js';

const root = process.cwd();
const examples = path.join(root, 'examples');

const pages: Array<{ style: StyleSlug; brief: Brief; dir: string }> = [
  {
    style: 'renaissance',
    dir: 'renaissance',
    brief: {
      title: 'Atelier Lumen',
      brand: 'Atelier Lumen',
      eyebrow: 'Taller de arte · Buenos Aires',
      tagline: 'Pintura, cerámica y objetos que envejecen bien.',
      intro:
        'Trabajamos con las manos y con el tiempo. Cada pieza nace de un dibujo, una conversación y la paciencia de un material que no tiene apuro.',
      sections: [
        {
          kicker: 'Retratos',
          title: 'Retratos al óleo',
          body: 'Sesiones de tres encuentros: luz, boceto y materia. Un retrato que se parece a quien lo mira.',
        },
        {
          kicker: 'Cerámica',
          title: 'Cerámica de autor',
          body: 'Series cortas, esmaltes de ceniza y formas que conservan la huella del torno.',
        },
        {
          kicker: 'Interiores',
          title: 'Interiores quietos',
          body: 'Casas que se piensan desde el silencio: pocos objetos, mejores sombras.',
        },
      ],
      quote: {
        text: 'La belleza no se agrega: se descubre cuando se quita lo que sobra.',
        author: 'Elena Varela, fundadora',
      },
      cta: { label: 'Visitar el taller', href: '#contact' },
      footer: 'Buenos Aires · Desde MMXXVI',
      locale: 'es',
    },
  },
  {
    style: 'brutalist',
    dir: 'brutalist',
    brief: {
      title: 'Concrete Poetry',
      brand: 'Concrete/Poetry',
      eyebrow: 'Independent studio',
      tagline: 'A studio for loud ideas, hard edges and work that refuses to whisper.',
      intro:
        'We build identities, websites and motion for people who would rather be remembered than liked. No templates. No soft edges. No filler.',
      sections: [
        {
          kicker: 'Identity',
          title: 'Identity systems',
          body: 'Logos, type and rules that survive contact with the real world.',
        },
        {
          kicker: 'Web',
          title: 'Web experiences',
          body: 'Sites built like posters: fast, loud and impossible to confuse.',
        },
        {
          kicker: 'Motion',
          title: 'Motion / GIF',
          body: 'Loops with a pulse. Frame by frame, no plugins, no excuses.',
        },
      ],
      quote: { text: "If it doesn't stop you, it isn't finished.", author: 'Studio manifesto' },
      cta: { label: 'Start a project', href: '#contact' },
      footer: 'Buenos Aires · 34°36′S / 58°22′W',
      locale: 'en',
    },
  },
  {
    style: 'papercraft',
    dir: 'papercraft',
    brief: {
      title: 'Taller Papel',
      brand: 'Taller Papel',
      eyebrow: 'Papel, tijera y pantalla',
      tagline: 'Cosas lindas hechas con las manos, para gente que todavía mira los detalles.',
      intro:
        'Cortamos, pegamos y probamos hasta que una idea se vuelve un objeto. Hacemos identidades, invitaciones y sitios que se sienten como abrir un cuaderno nuevo.',
      sections: [
        {
          kicker: 'Identidad',
          title: 'Identidades de papel',
          body: 'Marcas que se pueden tocar: texturas, sellos y colores que no gritan.',
        },
        {
          kicker: 'Invitaciones',
          title: 'Invitaciones bordadas',
          body: 'Para casamientos, ferias y cumpleaños que merecen algo más que un link.',
        },
        {
          kicker: 'Sitios',
          title: 'Sitios con textura',
          body: 'Páginas que huelen a taller y se navegan despacio, como una revista.',
        },
      ],
      quote: { text: 'Lo hecho a mano tiene un error que lo hace único.', author: 'Mora y Juli, taller' },
      cta: { label: 'Escribinos', href: '#contact' },
      footer: 'Taller de papel y pantalla · MMXXVI',
      locale: 'es',
    },
  },
];

async function main(): Promise<void> {
  for (const page of pages) {
    const out = path.join(examples, page.dir, 'index.html');
    const result = await createPage({ style: page.style, brief: page.brief, output: out });
    console.log(
      `${page.style.padEnd(12)} ${result.validation.grade} ${String(result.validation.score).padStart(3)} ` +
        `${result.validation.issues.length} issues → ${path.relative(root, result.path ?? out)}`,
    );
    for (const issue of result.validation.issues) {
      console.log(`  [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  const gifs: Array<{ style: StyleSlug; text: string; subtitle: string; template: 'title' | 'loop'; file: string }> = [
    { style: 'renaissance', text: 'Atelier Lumen', subtitle: 'Pintura · cerámica · objetos', template: 'title', file: 'renaissance.gif' },
    { style: 'brutalist', text: 'Concrete Poetry', subtitle: 'No soft edges', template: 'loop', file: 'brutalist.gif' },
    { style: 'papercraft', text: 'Taller Papel', subtitle: 'Hecho a mano', template: 'title', file: 'papercraft.gif' },
  ];

  await mkdir(path.join(examples, 'gifs'), { recursive: true });
  for (const gif of gifs) {
    const out = path.join(examples, 'gifs', gif.file);
    const result = await createGifFile({
      style: gif.style,
      text: gif.text,
      subtitle: gif.subtitle,
      template: gif.template,
      width: 800,
      height: 800,
      fps: 20,
      duration: 2.4,
      output: out,
    });
    console.log(`${gif.style.padEnd(12)} gif ${result.frames}f ${Math.round(result.bytes / 1024)}KB → ${path.relative(root, result.path)}`);
  }

  await writeFile(
    path.join(examples, 'README.md'),
    `# Examples

Generated with \`pnpm examples\`. Open the HTML files directly; the GIFs loop forever.

| Style | Page | GIF | Preview |
| --- | --- | --- | --- |
| Renaissance | [renaissance/index.html](renaissance/index.html) | [gifs/renaissance.gif](gifs/renaissance.gif) | [previews/renaissance.png](previews/renaissance.png) |
| Brutalist | [brutalist/index.html](brutalist/index.html) | [gifs/brutalist.gif](gifs/brutalist.gif) | [previews/brutalist.png](previews/brutalist.png) |
| Paper Craft | [papercraft/index.html](papercraft/index.html) | [gifs/papercraft.gif](gifs/papercraft.gif) | [previews/papercraft.png](previews/papercraft.png) |

## Produced by agents

These files were generated by models calling the harness, with no hand-written HTML:

- [agents/luna-brutalist.html](agents/luna-brutalist.html) — Codex CLI, \`gpt-6-luna\`, effort \`max\` (A 100/100).
- [agents/luna-papercraft-v2.html](agents/luna-papercraft-v2.html) — Codex CLI, new art direction (A 100/100 · vision 4/4).
- [agents/luna-papercraft.html](agents/luna-papercraft.html) — \`colmena-mcp\` worker \`luna-max\`, v1 (A 100/100).
- [agents/hive-renaissance.html](agents/hive-renaissance.html) — free \`max-hive\` worker, LongCat 2.5 (A 100/100).

## Education

Generated with \`pnpm education\`:

- [education/renaissance-perspective.html](education/renaissance-perspective.html) — \`La città ideale\` (A/100 · vision 4/4).
- [education/papercraft-museum.html](education/papercraft-museum.html) — \`Museo de las Cosas Pequeñas\` (A/100 · vision 4/4).

## Ten new directions

Generated with \`pnpm showcase\`:

- [showcase/index.html](showcase/index.html) — gallery of the ten new styles.
- [compare.html](compare.html) — my brief vs Luna 6 Max, side by side.
- [luna-deck/memory-future.html](luna-deck/memory-future.html) — 8-slide animated deck by Luna 6 Max (A/100 · vision 4/4).
- [experiences/casa-perla.html](experiences/casa-perla.html) — restaurant sequence, papercraft.
- [experiences/museo-invisible.html](experiences/museo-invisible.html) — museum sequence, galactic.
- [stories/casa-respira.html](stories/casa-respira.html) — five-chapter story, Renaissance.
- [stories/rio-1870.html](stories/rio-1870.html) — history lesson, Isotype.
- [agile/sprint-14-review.html](agile/sprint-14-review.html) — Sprint review deck + GIF.
- [agile/sprint-14-retro.html](agile/sprint-14-retro.html) — retrospective deck + GIF.
- [agile/sprint-15-planning.html](agile/sprint-15-planning.html) — planning deck + GIF.
- [experiences/black-clover.html](experiences/black-clover.html) — Nature Memory museum room; fan tribute.
- [experiences/museo-estaciones.html](experiences/museo-estaciones.html) — six-room Nature Memory maxxing museum.
- [stories/archivo-hojas.html](stories/archivo-hojas.html) — six-chapter Nature Memory maxxing essay.
- [stories/liebre-sombrero.html](stories/liebre-sombrero.html) — illustrated papercut storybook, CC0.
- [decks/atlas-memoria.html](decks/atlas-memoria.html) — eight-slide Galactic maxxing deck.
- [agile/sprint-16/sprint-16-review.html](agile/sprint-16/sprint-16-review.html) — Sprint 16 review (kit of three decks + GIFs).
- [gifs/maxxing/index.html](gifs/maxxing/index.html) — 13 maxxing GIFs, one per style.
- [motions/index.html](motions/index.html) — 13 animated SVG posters, one per style and scene.
- [canvas/index.html](canvas/index.html) — open canvas: 4 original layered SVG artworks with assets.
- [decks/tea.html](decks/tea.html) — tea presentation, Nature Memory.
- [decks/kittens.html](decks/kittens.html) — kittens presentation, Paper Craft.
- [stories/dominio-publico.html](stories/dominio-publico.html) — CC0 open-domain story, Paper Craft.
- [gifs/luna13/index.html](gifs/luna13/index.html) — 13 GIFs, one per style.
- Art Deco, Isotype, Op Art, Ukiyo-e, Bestiario, Psicodelia, Memphis, Vaporwave, Galactic Futurism and Nature Memory. Every page is A/100 · vision 4/4, with an original SVG/CSS illustration, interaction and a GIF in \`gifs/showcase-<style>.gif\`.

The grammar is fixed; the composition changes with \`seed\` and the copy changes with the brief. Copy is not design.
`,
    'utf8',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
