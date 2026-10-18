import path from 'node:path';
import { styleGuideMarkdown } from '../src/guide.js';
import { presets, styleSlugs } from '../src/styles/presets.js';
import { ensureDir, writeTextFile } from './lib/fs.js';
import { runScript } from './lib/run.js';

const root = process.cwd();

async function main(): Promise<void> {
  await ensureDir(path.join(root, 'skills'));
  await ensureDir(path.join(root, 'docs'));

  for (const slug of styleSlugs) {
    const preset = presets[slug];
    const body = `---
name: open-beauty-${slug}
description: Apply the ${preset.name} editorial system (${preset.epithet}) to a page or GIF with open-beauty-site.
---

# ${preset.name} skill

Use this skill together with \`beauty\` when the brief calls for ${preset.name.toLowerCase()}.
Never mix it with another style.

${styleGuideMarkdown(slug)}

## Before you ship

- Run \`beauty_validate\` and reach grade A.
- Check the page at 360px, 768px and 1440px.
- Remove every word that is not carrying information.
`;
    await writeTextFile(path.join(root, 'skills', `${slug}.md`), body);
  }

  const guide = `# open-beauty-site style guide

Twelve complete editorial systems. Every value here is normative: if a page uses another font, colour, border width or radius, the validator will flag it.

${styleSlugs.map((slug) => styleGuideMarkdown(slug)).join('\n\n---\n\n')}
`;
  await writeTextFile(path.join(root, 'docs', 'STYLEGUIDE.md'), guide);
  console.log(`Wrote ${styleSlugs.length} style skills and docs/STYLEGUIDE.md`);
}

runScript(main);
