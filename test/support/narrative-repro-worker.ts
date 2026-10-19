import { readFile } from 'node:fs/promises';
import { createNarrative } from '../../src/narrative/create.js';

const [briefPath, outputDir, ...modes] = process.argv.slice(2);
if (!briefPath || !outputDir) throw new Error('Usage: narrative-repro-worker <brief.json> <output-dir>');
const brief = JSON.parse(await readFile(briefPath, 'utf8')) as unknown;
await createNarrative(brief, { outputDir, artOnly: modes.includes('--art-only'), legacyArt: modes.includes('--legacy-art') });
