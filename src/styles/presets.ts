import type { StylePreset, StyleSlug } from '../types.js';
import {
  artDeco,
  bestiary,
  galactic,
  isotype,
  memphis,
  opart,
  psychedelic,
  ukiyoe,
  vaporwave,
} from './showcase-presets.js';

const renaissance: StylePreset = {
  slug: 'renaissance',
  name: 'Renaissance',
  epithet: 'A chalky, asymmetric fresco system',
  description:
    'Plaster, pigment and ink. Flat pastel fields, one cinnabar event, a large arch plate and an asymmetric page: a fresco, not a wedding suite.',
  bestFor: ['portfolios', 'cultural institutions', 'editorial essays', 'weddings', 'long-form launches'],
  avoid: ['dashboards', 'dense product UI', 'playful youth brands', 'anything that needs to feel fast'],
  palette: {
    bg: '#F6EDDD',
    surface: '#E3E9E6',
    ink: '#2B211B',
    muted: '#6F5D50',
    accent: '#B08A4F',
    accent2: '#B4432C',
    accent3: '#AFC5D6',
    accent4: '#B9C4A6',
    deep: '#1C1611',
  },
  fonts: {
    display: 'EB Garamond',
    body: 'EB Garamond',
    mono: 'EB Garamond',
    googleHref:
      'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap',
  },
  rules: {
    radius: [0, 2],
    borderWidths: [1],
    borderStyles: ['solid'],
    motion: [0.6, 1.6],
    requiredFonts: ['EB Garamond'],
    forbiddenFonts: ['Inter', 'Roboto', 'Arial', 'Helvetica', 'Archivo Black', 'Space Mono', 'DM Serif Display', 'Lato', 'Fredoka', 'Varela Round'],
    shadow: 'None, or one long soft ambient shadow (0 24px 60px rgba(43,33,27,.08)). Never hard offset shadows.',
    shadowPattern: '0\\s+24px\\s+60px',
  },
  signature: [
    'Fixed double hairline frame around the viewport',
    'Arch plate with flat pastel fresco fields',
    'Drop cap on the manifesto',
    'Gold rule ornament that draws itself',
    'Flat fresco fields in powder blue, verdaccio and cinnabar',
  ],
  guidance: {
    typography: [
      'Display: EB Garamond 400 at clamp(64px,10.5vw,152px), line-height .87, sentence case. Italic is the only emphasis: put one or two words in italic cinnabar.',
      'Eyebrows and labels: EB Garamond 600, 12–13px, true small caps (font-feature-settings:"smcp" 1), letter-spacing .18em.',
      'Body: EB Garamond 400, 20–21px, line-height 1.62, max-width 62ch.',
      'Never use a sans-serif for a headline. Never use more than two weights on one screen.',
    ],
    color: [
      'Plaster #F6EDDD covers ~55% of the page. Powder blue #AFC5D6, verdaccio #B9C4A6 and cinnabar #B4432C are flat fresco fields in 10–25% doses.',
      'Ochre #B08A4F is for 1px rules, numerals and small ornaments, never for body text.',
      'The palette must feel chalky and sun-faded: pigment mixed with lime plaster, not candy and not a wedding suite.',
      'One hot event per page: cinnabar on ≤2% of the surface. Without it, pastel becomes papilla.',
      'Hairlines are rgba(43,33,27,.28), never flat grey.',
    ],
    layout: [
      'Asymmetric hero: copy on the left, a large plate on the right. Never center everything.',
      'Frame the page with a fixed double hairline: 18px from the edge, then 24px, 1px each.',
      'Use flat, hard-edged pastel fields per section, not gradients fading to transparency. A fresco has a plaster edge, not a vignette.',
      'The arch plate is the signature image container: min(660px,48vw). No rounded cards, no blobs, no grids of pills.',
      'Number sections with roman numerals in ochre small caps.',
    ],
    motion: [
      'Slow and dignified: 0.7–1.2s, cubic-bezier(.22,.61,.36,1). Fade plus a 16px rise, nothing else.',
      'Ornaments draw themselves once with stroke-dashoffset over 1.4s; rays stagger 40ms. Nothing loops except an almost invisible grain.',
      'Hover states are a colour shift or an underline that grows from the left. No scaling.',
    ],
    imagery: [
      'Fresco first, engraving second: flat fields of powder blue, verdaccio and cinnabar, with single-weight ink linework on top. Hills, cypress, sun, arches, laurel.',
      'No photos, emoji, 3D, neon and no gradients. Colour comes in flat fields with a hard edge.',
      'If an image is unavoidable, desaturate it to sepia and place it inside the arch.',
    ],
    copy: [
      'Voice: museum wall label, first person plural, no exclamation marks.',
      'Headline: 2–5 words, sentence case (never all caps).',
      'Body: one idea per paragraph, 2–3 sentences. Let white space finish the sentence.',
    ],
    dont: [
      'No border-radius above 2px.',
      'No hard offset shadows.',
      'No sans-serif headlines, no pure white, no purple.',
      'No soft gradient washes. Pastel must arrive as a flat field.',
      'No saturated primary colours. The pastels must stay chalky, never neon.',
      'No more than one italic phrase per screen.',
    ],
  },
  cssMarkers: ["font-family:'EB Garamond'", 'border:1px solid', 'font-feature-settings:"smcp" 1'],
};

const brutalist: StylePreset = {
  slug: 'brutalist',
  name: 'Brutalist',
  epithet: 'Concrete, ink and acid',
  description:
    'A loud poster that happens to be a website. Visible skeleton, 3px borders, hard shadows and one acid highlight per view.',
  bestFor: ['studios', 'launches', 'music', 'events', 'manifestos', 'portfolios that need to shout'],
  avoid: ['luxury hospitality', 'wellness', 'children', 'dense dashboards', 'formal finance'],
  palette: {
    bg: '#F2EFE4',
    surface: '#E6E2D3',
    ink: '#0B0B0B',
    muted: '#6D695C',
    accent: '#D8FF00',
    accent2: '#FF3D1F',
    accent3: '#2438FF',
    accent4: '#F2EFE4',
    deep: '#0B0B0B',
  },
  fonts: {
    display: 'Archivo Black',
    body: 'Space Mono',
    mono: 'Space Mono',
    googleHref:
      'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap',
  },
  rules: {
    radius: [0, 0],
    borderWidths: [3, 6],
    borderStyles: ['solid'],
    motion: [0.15, 0.7],
    requiredFonts: ['Archivo Black', 'Space Mono'],
    forbiddenFonts: ['Inter', 'Roboto', 'Arial', 'Helvetica', 'Crimson Text', 'DM Serif Display', 'Lato', 'Georgia'],
    shadow: 'Hard offset only: 8px 8px 0 #0B0B0B (zero blur). Hover can grow it to 12px 12px.',
    shadowPattern: '8px\\s+8px\\s+0',
  },
  signature: [
    '3px black borders on every surface',
    'Hard 8px offset shadows',
    'Acid highlighter block behind one phrase',
    'Marquee band between sections',
  ],
  guidance: {
    typography: [
      'Display: Archivo Black 400 at 96–148px, uppercase, line-height .82, letter-spacing -.03em. The headline is the layout.',
      'Labels, data and body: Space Mono. Labels 700 at 10–13px, uppercase, letter-spacing .12em. Body 400 at 15–17px, line-height 1.5.',
      'Mix one oversized line with tiny mono metadata. Avoid mid-size text.',
      'Never use a serif or a geometric sans. Never letterspace the display face.',
    ],
    color: [
      'Paper #F2EFE4 plus ink #0B0B0B are ~85%. Acid #D8FF00 is the highlighter: one block per view.',
      'Red #FF3D1F is a stamp (badge, number, dot). Blue #2438FF is a rare third accent, once per page maximum.',
      'Never put acid text on paper. Acid is a background; text on acid is always ink.',
      'No gradients, no translucency except a 6% black grid.',
    ],
    layout: [
      'Show the skeleton: 12 columns, sections sharing edges, full-bleed bands.',
      '3px borders everywhere; 6px only for the page frame or a hero divider.',
      'Hard offset shadows 8px 8px 0 ink with zero blur. No soft shadows, no blur.',
      'At least one marquee band and one oversized numeral.',
    ],
    motion: [
      'Fast and mechanical: .25–.5s, cubic-bezier(.2,.8,.2,1). Stagger 60ms.',
      'Marquee loops at 18–24s, linear. Buttons shift -2px/-2px and grow the shadow.',
      'No bounce, no fade-only entrances: elements should arrive with a hard stop.',
    ],
    imagery: [
      'Geometry only: squares, grids, arrows, crosses, barcodes, halftones. Inline SVG with 3px strokes.',
      'No photographs, no serif fonts, no rounded corners, no gradients, no emoji.',
      'A black panel with acid type counts as an image.',
    ],
    copy: [
      'Voice: poster, imperative, loud. Two to six words per headline, all caps.',
      'Use numerals, dates and coordinates as decoration ("EST. 2026 / 04°42′N").',
      'Body copy is short and declarative. No adjectives doing the work of ideas.',
    ],
    dont: [
      'No rounded corners.',
      'No soft or blurred shadows.',
      'No serif, no pastel, no centered-everything layouts.',
      'No more than one acid block and one red stamp per screen.',
    ],
  },
  cssMarkers: ["font-family:'Archivo Black'", "font-family:'Space Mono'", 'border:3px solid', 'text-transform:uppercase'],
};

const papercraft: StylePreset = {
  slug: 'papercraft',
  name: 'Paper Craft',
  epithet: 'A warm table covered in cut paper',
  description:
    'Cream, kraft and scissors. Layered paper shapes, soft shadows, tape and a gentle float: handmade but art-directed.',
  bestFor: ['crafts', 'food', 'education', 'community', 'personal projects', 'children', 'stationery'],
  avoid: ['fintech', 'enterprise SaaS', 'brutalist music', 'anything that needs to feel sharp'],
  palette: {
    bg: '#FBF1E2',
    surface: '#FFF8EA',
    ink: '#4A3A32',
    muted: '#7A5F50',
    accent: '#D9785B',
    accent2: '#A9C3A0',
    accent3: '#B8D4E0',
    accent4: '#F2C879',
    deep: '#7C5A72',
  },
  fonts: {
    display: 'Fraunces',
    body: 'Nunito Sans',
    mono: 'Nunito Sans',
    googleHref:
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=Nunito+Sans:opsz,wght@6..12,200..1000&display=swap',
  },
  rules: {
    radius: [10, 48],
    borderWidths: [1, 2],
    borderStyles: ['solid', 'dashed'],
    motion: [0.5, 1.2],
    requiredFonts: ['Fraunces', 'Nunito Sans'],
    forbiddenFonts: ['Inter', 'Roboto', 'Arial', 'Helvetica', 'Archivo Black', 'Space Mono', 'Crimson Text', 'Georgia', 'DM Serif Display', 'Lato', 'Fredoka', 'Varela Round'],
    shadow: 'Soft and warm: 0 22px 40px rgba(74,58,50,.20) plus a 0 2px 0 edge. Never a hard offset.',
    shadowPattern: '0\\s+22px\\s+40px',
  },
  signature: [
    'Fraunces Soft display with Nunito Sans body',
    'Cut-paper radii: 30px 12px 28px 14px',
    'Layered paper sheets behind each card',
    'Washi tape with torn ends and a 6–8° tilt',
    'Scalloped or torn band dividers',
  ],
  guidance: {
    typography: [
      'Display: Fraunces 560 with SOFT 100 / WONK 1 / opsz 144 at 64–124px, line-height .96, sentence case. A soft serif cut from paper, not a rounded sans.',
      'Body: Nunito Sans 400 at 18–19px, line-height 1.62. Labels: Nunito Sans 800 at 10–12px, uppercase, letter-spacing .12em.',
      'No italics: Fraunces is used upright here. Emphasis is a colour change plus a -1.2° rotation on one word.',
      'Never use a rounded geometric sans as display, never a monospace, never a second serif.',
    ],
    color: [
      'Cream #FBF1E2 is the table; paper #FFF8EA is the sheet. Terracotta #D9785B, sage #A9C3A0 and sky #B8D4E0 are the other three sheets; ink #4A3A32 is the pen.',
      'Butter #F2C879 is tape only, never a surface. Plum #7C5A72 is a tiny accent, never a button.',
      'Buttons are ink with cream text. Maximum three paper colours per screen plus cream.',
      'Shadows are warm brown rgba(74,58,50,.16–.20), never grey or black.',
    ],
    layout: [
      'Layered and off-grid but balanced: cards rotated -2° to 2°, overlapping 16–28px, with visible tape.',
      'Cut-paper geometry: 30px 12px 28px 14px (a ≥18px delta) and one 26px corner notch on the focal card. No stitched dashed borders.',
      'Stack a second coloured sheet 10px right / 8px down behind each card; give the sheet a 1px edge and a 2/14/30 blur hierarchy.',
      'One full-bleed band per page, with two sheets crossing the right margin. Vertical rhythm 96–140px.',
      'One focal paper object per screen; everything else supports it.',
    ],
    motion: [
      'Physical, not bouncy: 480ms cubic-bezier(.22,.9,.24,1), translateY(-22px) rotate(-2.5deg) → zero. Shadow settles 180ms later; tape follows 60ms after.',
      'Float by rotating ±.6° over 8s, delays 0/.9/1.7s. Hover lifts 3px, no scale, no spring.',
      'Stagger 90ms; respect reduced motion.',
    ],
    imagery: [
      'Paper cutout SVG: soft serif-like flowers, leaves, suns, waves, butterflies, confetti. Hard cut edges, no line art, no dashed stitching.',
      'No photos, no neon, no hard black borders, no brutalist grids.',
      'Tape has torn ends, 6–8° tilt and a 1px shadow; it is the signature detail, max five per page.',
    ],
    copy: [
      'Voice: warm, handmade, first person. Short sentences, sensory details.',
      'Headline: 3–6 words, sentence case; one word can shift colour and rotate.',
      'Body: concrete nouns, no corporate abstractions. Say "we folded 400 invitations", not "we deliver solutions".',
    ],
    dont: [
      'No 0px corners, no perfect rounded rectangles: the corner delta must be visible.',
      'No dashed stitching, no 3px black borders, no acid colours, no monospace.',
      'No rounded sans display, no hard shadows, no dark backgrounds.',
      'No serif-with-hairlines (DM Serif) and no rounded sans (Fredoka). Both read as stock.',
    ],
  },
  cssMarkers: ["font-family:'Fraunces'", "font-family:'Nunito Sans'", 'border-radius:30px 12px 28px 14px', 'box-shadow:0 18px 32px'],
};

export const presets: Record<StyleSlug, StylePreset> = {
  renaissance,
  brutalist,
  papercraft,
  artdeco: artDeco,
  isotype,
  opart,
  ukiyoe,
  bestiary,
  psychedelic,
  memphis,
  vaporwave,
  galactic,
};

export const styleSlugs = Object.keys(presets) as StyleSlug[];

export function isStyleSlug(value: string): value is StyleSlug {
  return (styleSlugs as string[]).includes(value);
}

export function getStyle(slug: StyleSlug): StylePreset {
  return presets[slug];
}
