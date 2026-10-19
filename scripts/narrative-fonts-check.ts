import { checkAllNarrativeFonts } from '../src/narrative/fonts.js';

try {
  const checks = checkAllNarrativeFonts();
  for (const check of checks) {
    const synthetic = [check.syntheticBold ? 'synthetic bold' : '', check.syntheticItalic ? 'synthetic italic' : ''].filter(Boolean);
    console.log(
      `${check.style}/${check.role}: ${check.family} ${check.weight} · ${check.renderedPixels}/${check.glyphs} glyphs rendered · ${check.measured}/${check.glyphs} measured · glyph fallback: ${check.fallbackGlyphs.join(' ') || 'none'} · ${synthetic.join(', ') || 'real face'}`,
    );
  }

  const families = new Map<string, { family: string; weight: number; roles: string[]; fallback: Set<string>; synthetic: Set<string> }>();
  for (const check of checks) {
    const key = `${check.family} ${check.weight}`;
    const entry = families.get(key) ?? { family: check.family, weight: check.weight, roles: [], fallback: new Set<string>(), synthetic: new Set<string>() };
    entry.roles.push(`${check.style}/${check.role}`);
    for (const glyph of check.fallbackGlyphs) entry.fallback.add(glyph);
    if (check.syntheticBold) entry.synthetic.add('bold');
    if (check.syntheticItalic) entry.synthetic.add('italic');
    families.set(key, entry);
  }
  for (const entry of [...families.values()].sort((left, right) => `${left.family}${left.weight}`.localeCompare(`${right.family}${right.weight}`))) {
    console.log(
      `family · ${entry.family} ${entry.weight} · ${entry.roles.length} role(s) · fallback glyphs: ${[...entry.fallback].join(' ') || 'none'} · synthetic: ${[...entry.synthetic].join(', ') || 'none'}`,
    );
  }

  const fallbackRoles = checks.filter((check) => check.fallbackGlyphs.length > 0).length;
  const syntheticFaces = checks.filter((check) => check.syntheticBold || check.syntheticItalic).length;
  console.log(
    `fonts:check passed · ${checks.length} style/role checks · ${new Set(checks.map((check) => check.style)).size} styles · ${families.size} family/weight faces · ${fallbackRoles} role(s) with per-glyph fallback · ${syntheticFaces} synthetic face(s)`,
  );
} catch (error) {
  console.error(`fonts:check failed · ${(error as Error).message}`);
  process.exitCode = 1;
}
