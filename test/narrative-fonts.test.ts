import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { bundledFontFace, bundledFontFaces } from '../src/canvas.js';
import { createNarrative } from '../src/narrative/create.js';
import { detectSyntheticFace, getNarrativeFontProfile, requireBundledNarrativeFace } from '../src/narrative/fonts.js';
import { styleSlugs } from '../src/styles/presets.js';
import type { NarrativeFontRoleName } from '../src/types/narrative.js';
import type { StyleSlug } from '../src/types.js';

const ROLE_ORDER: NarrativeFontRoleName[] = ['display', 'reading', 'label', 'figure', 'annotation'];

/** Guide families and the exact bundled weights each style role must use. */
const EXPECTED_ROLES: Record<StyleSlug, Array<[string, number]>> = {
  renaissance: [['EB Garamond', 600], ['EB Garamond', 400], ['EB Garamond', 600], ['EB Garamond', 600], ['EB Garamond', 400]],
  brutalist: [['Archivo Black', 400], ['Space Mono', 400], ['Space Mono', 700], ['Archivo Black', 400], ['Space Mono', 400]],
  papercraft: [['Fraunces', 560], ['Nunito Sans', 400], ['Nunito Sans', 800], ['Fraunces', 560], ['Space Mono', 400]],
  artdeco: [['Poiret One', 400], ['Josefin Sans', 400], ['Josefin Sans', 600], ['Poiret One', 400], ['Josefin Sans', 400]],
  isotype: [['Jost', 500], ['IBM Plex Sans', 400], ['IBM Plex Sans', 500], ['Jost', 500], ['IBM Plex Sans', 400]],
  opart: [['Archivo Black', 400], ['Space Grotesk', 400], ['Space Grotesk', 500], ['Archivo Black', 400], ['Space Grotesk', 400]],
  ukiyoe: [['Shippori Mincho B1', 700], ['Zen Kaku Gothic New', 400], ['Zen Kaku Gothic New', 500], ['Shippori Mincho B1', 700], ['Zen Kaku Gothic New', 400]],
  bestiary: [['UnifrakturMaguntia', 400], ['IM Fell English', 400], ['IM Fell English', 400], ['UnifrakturMaguntia', 400], ['IM Fell English', 400]],
  psychedelic: [['Bungee Shade', 400], ['Space Grotesk', 400], ['Space Grotesk', 500], ['Bungee Shade', 400], ['Space Grotesk', 400]],
  memphis: [['Bricolage Grotesque', 700], ['DM Sans', 400], ['DM Sans', 500], ['Bricolage Grotesque', 700], ['DM Sans', 400]],
  vaporwave: [['Press Start 2P', 400], ['Space Grotesk', 400], ['Space Grotesk', 500], ['Press Start 2P', 400], ['Space Grotesk', 400]],
  galactic: [['Michroma', 400], ['Space Grotesk', 400], ['Space Grotesk', 500], ['Michroma', 400], ['Space Grotesk', 400]],
  nature: [['Cormorant Garamond', 400], ['Karla', 400], ['Karla', 600], ['Cormorant Garamond', 400], ['Karla', 400]],
};

const PILOTS: Array<[StyleSlug, string, string]> = [
  ['papercraft', 'guias-mas-confiables', '5b289755'],
  ['papercraft', 'lectura-antes-del-cierre', '151ae214'],
  ['papercraft', 'observacion-registrada', 'e522212b'],
  ['brutalist', 'guias-mas-confiables', '693b6de2'],
  ['brutalist', 'lectura-antes-del-cierre', 'db393a39'],
  ['brutalist', 'observacion-registrada', 'dfb15b10'],
];

test('every style role points at its real guide family and guide weight', () => {
  for (const style of styleSlugs) {
    const profile = getNarrativeFontProfile(style);
    ROLE_ORDER.forEach((role, index) => {
      const [family, weight] = EXPECTED_ROLES[style][index]!;
      assert.deepEqual(profile.effective[role], { family, weight }, `${style}/${role}`);
      assert.deepEqual(profile.preferred[role], { family, weight }, `${style}/${role} preferred`);
    });
  }
});

test('every effective role has a bundled face registered at the exact weight', () => {
  const bundles = bundledFontFaces();
  assert.ok(bundles.length >= 31, `expected all packaged faces, got ${bundles.length}`);
  for (const style of styleSlugs) {
    const profile = getNarrativeFontProfile(style);
    for (const role of ROLE_ORDER) {
      const { family, weight } = profile.effective[role];
      assert.ok(bundledFontFace(family, weight), `missing bundled face ${family} ${weight} for ${style}/${role}`);
    }
  }
  assert.equal(new Set(bundles.map((face) => `${face.family}|${face.weight}|${face.style}`)).size, bundles.length);
});

test('a missing bundled face raises FONT_MISSING instead of falling back', () => {
  requireBundledNarrativeFace({ family: 'Jost', weight: 500 });
  assert.throws(() => requireBundledNarrativeFace({ family: 'Jost', weight: 700 }), (error: unknown) => {
    const failure = error as { code?: string; message?: string };
    assert.equal(failure.code, 'FONT_MISSING');
    assert.match(failure.message ?? '', /Jost/);
    return true;
  });
  assert.throws(() => requireBundledNarrativeFace({ family: 'Not A Bundled Family', weight: 400 }), (error: unknown) => {
    assert.equal((error as { code?: string }).code, 'FONT_MISSING');
    return true;
  });
});

test('synthetic bold and italic are detected from the bundled registry', () => {
  assert.deepEqual(detectSyntheticFace({ family: 'EB Garamond', weight: 600 }), { syntheticBold: false, syntheticItalic: false });
  assert.deepEqual(detectSyntheticFace({ family: 'EB Garamond', weight: 700 }), { syntheticBold: true, syntheticItalic: false });
  assert.deepEqual(detectSyntheticFace({ family: 'EB Garamond', weight: 600 }, true), { syntheticBold: false, syntheticItalic: true });
  assert.deepEqual(detectSyntheticFace({ family: 'Karla', weight: 600 }), { syntheticBold: false, syntheticItalic: false });
});

test('packaged woff2 faces stay under the 4 MB budget', async () => {
  let bytes = 0;
  for (const face of bundledFontFaces()) {
    bytes += (await stat(path.join(process.cwd(), 'fonts', face.file))).size;
  }
  assert.ok(bytes <= 4 * 1024 * 1024, `packaged faces weigh ${bytes} bytes`);
});

test('papercraft and brutalist pilots stay byte-identical to the committed review packs', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'narrative-font-parity-'));
  try {
    for (const [style, slug, hash] of PILOTS) {
      const raw = JSON.parse(await readFile(path.join('docs', 'narrative-gif', 'pilots', 'briefs', `${slug}-${style}.json`), 'utf8')) as Record<string, unknown>;
      const result = await createNarrative(raw, { outputDir: path.join(directory, `${style}-${slug}`) });
      const committed = path.join('docs', 'narrative-gif', 'pilots', style, slug);
      const gif = await readFile(result.paths.gif);
      assert.deepEqual(gif, await readFile(path.join(committed, `${slug}-${hash}.gif`)), `${style}/${slug} GIF`);
      assert.deepEqual(await readFile(result.paths.png), await readFile(path.join(committed, `${slug}-${hash}.png`)), `${style}/${slug} PNG`);
      assert.deepEqual(await readFile(result.paths.contactSheet), await readFile(path.join(committed, `${slug}-${hash}-contact-sheet.png`)), `${style}/${slug} contact sheet`);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
