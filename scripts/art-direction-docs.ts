import path from 'node:path';
import { ART_DIRECTION, artDirectionMarkdown } from '../src/styles/art-direction.js';
import { ensureDir, writeTextFile } from './lib/fs.js';
import { runScript } from './lib/run.js';

const root = process.cwd();

async function main(): Promise<void> {
  await ensureDir(path.join(root, 'docs', 'art-direction'));
  for (const slug of Object.keys(ART_DIRECTION)) {
    await writeTextFile(path.join(root, 'docs', 'art-direction', `${slug}.md`), artDirectionMarkdown(slug as keyof typeof ART_DIRECTION));
  }
  console.log(`Wrote ${Object.keys(ART_DIRECTION).length} art-direction docs`);
}

runScript(main);
