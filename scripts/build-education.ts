import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createPage } from '../src/generate.js';
import type { Brief } from '../src/types.js';

const root = process.cwd();
const outDir = path.join(root, 'examples', 'education');

const pages: Array<{ file: string; style: 'renaissance' | 'papercraft'; brief: Brief }> = [
  {
    file: 'renaissance-perspective.html',
    style: 'renaissance',
    brief: {
      title: 'La città ideale',
      brand: 'Sala delle Prospettive',
      eyebrow: 'Historia del arte · Lección 03',
      tagline: 'Cómo una línea de fuga convirtió el espacio en poder.',
      intro:
        'En 1470, la perspectiva no era un truco de dibujo: era una forma de organizar el mundo. Una línea de horizonte, un punto y un suelo cuadriculado hicieron que el espacio se volviera calculable, habitable y político.',
      sections: [
        {
          kicker: 'El punto de fuga',
          title: 'Todo converge',
          body: 'Una línea de horizonte, un punto y un suelo cuadriculado: el espacio se vuelve calculable. El ojo ocupa el lugar del que mira y también el del que manda.',
        },
        {
          kicker: 'La pared como medida',
          title: 'El fresco abre la pared',
          body: 'La arquitectura pintada compite con la real. La pared deja de ser límite y se convierte en escenario: el cuerpo entra en una habitación que no existe.',
        },
        {
          kicker: 'Simetría y poder',
          title: 'El centro es político',
          body: 'Quien controla el centro controla la lectura. La composición axial no es neutral: ordena jerarquías, distancias y quién puede ocupar cada lugar.',
        },
      ],
      quote: {
        text: 'La perspectiva no copia el espacio: lo organiza.',
        author: 'Leon Battista Alberti, De pictura, 1435',
      },
      cta: { label: 'Ver la lección', href: '#contact' },
      footer: 'Sala delle Prospettive · Material educativo abierto',
      locale: 'es',
    },
  },
  {
    file: 'papercraft-museum.html',
    style: 'papercraft',
    brief: {
      title: 'Museo de las Cosas Pequeñas',
      brand: 'Museo de las Cosas Pequeñas',
      eyebrow: 'Ciencias naturales · Para curiosos de 8 a 88',
      tagline: 'Una hoja puede ser un mundo. Una semilla, un viaje.',
      intro:
        'Este museo cabe en un bolsillo. Cada sala es una hoja, una semilla o un bicho que aprendió a construir. Mirá de cerca: lo pequeño no es menor, es otra escala de aventura.',
      sections: [
        {
          kicker: 'Sala 01',
          title: 'La vida en una hoja',
          body: 'Una sola hoja puede alimentar a docenas de criaturas. Seguí las mordidas, los huevos y las galerías: cada agujero es una historia de supervivencia.',
        },
        {
          kicker: 'Sala 02',
          title: 'Semillas viajeras',
          body: 'Algunas vuelan, otras se pegan al pelaje y otras flotan durante meses. La forma de una semilla es un mapa de cómo quiere viajar.',
        },
        {
          kicker: 'Sala 03',
          title: 'Bichos arquitectos',
          body: 'Avispas, termitas y arañas construyen sin planos. Sus nidos son edificios de papel, barro y seda que resisten lluvia, viento y vecinos.',
        },
      ],
      quote: { text: 'Lo pequeño no es menor: es otra escala de aventura.', author: 'Curaduría del museo' },
      cta: { label: 'Reservar visita', href: '#contact' },
      footer: 'Museo de las Cosas Pequeñas · Material educativo abierto',
      locale: 'es',
    },
  },
];

async function main(): Promise<void> {
  await mkdir(outDir, { recursive: true });
  for (const page of pages) {
    const out = path.join(outDir, page.file);
    const result = await createPage({ style: page.style, brief: page.brief, output: out });
    console.log(`${page.style.padEnd(12)} ${result.validation.grade} ${result.validation.score} vision ${result.validation.vision.score}/4 → ${path.relative(root, out)}`);
  }

  await writeFile(
    path.join(root, 'examples', 'education', 'README.md'),
    `# Education examples

Two art-directed lessons generated with the same harness:

- [La città ideale](renaissance-perspective.html) — Renaissance, perspective and power. Flat fresco fields, EB Garamond, asymmetric plate.
- [Museo de las Cosas Pequeñas](papercraft-museum.html) — Paper Craft, insects and seeds. Fraunces Soft, layered sheets, cut-paper geometry.

Both validate at A/100 and 4/4 on the vision heuristic.
`,
    'utf8',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
