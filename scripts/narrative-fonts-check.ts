import { checkAllNarrativeFonts } from '../src/narrative/fonts.js';

try {
  const checks = checkAllNarrativeFonts();
  for (const check of checks) {
    console.log(`${check.style}/${check.role}: ${check.family} ${check.weight} · ${check.renderedPixels}/${check.glyphs} glyphs rendered · ${check.measured}/${check.glyphs} measured`);
  }
  console.log(`fonts:check passed · ${checks.length} style/role checks · ${new Set(checks.map((check) => check.style)).size} styles`);
} catch (error) {
  console.error(`fonts:check failed · ${(error as Error).message}`);
  process.exitCode = 1;
}
