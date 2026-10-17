import type { StylePreset, StyleSlug } from '../types.js';

const renaissance: StylePreset = {
  slug: 'renaissance',
  name: 'Renaissance',
  epithet: 'A slow, gilded editorial system',
  description:
    'Parchment, ink and gold. Symmetrical, quiet and deliberate: the page behaves like a printed folio, not an app.',
  bestFor: ['portfolios', 'cultural institutions', 'editorial essays', 'weddings', 'long-form launches'],
  avoid: ['dashboards', 'dense product UI', 'playful youth brands', 'anything that needs to feel fast'],
  palette: {
    bg: '#F3EAD7',
    surface: '#EADFC8',
    ink: '#2B2118',
    muted: '#6E5C49',
    accent: '#B8892F',
    accent2: '#7A2E2A',
    accent3: '#7C8465',
    deep: '#1C1611',
  },
  fonts: {
    display: 'Crimson Text',
    body: 'Crimson Text',
    mono: 'Crimson Text',
    googleHref:
      'https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap',
  },
  rules: {
    radius: [0, 2],
    borderWidths: [1],
    borderStyles: ['solid'],
    motion: [0.6, 1.6],
    requiredFonts: ['Crimson Text'],
    forbiddenFonts: ['Inter', 'Roboto', 'Arial', 'Helvetica', 'Archivo Black', 'Space Mono', 'DM Serif Display', 'Lato'],
    shadow: 'None, or one long soft ambient shadow (0 24px 60px rgba(43,33,24,.08)). Never hard offset shadows.',
    shadowPattern: '0\\s+24px\\s+60px',
  },
  signature: [
    'Fixed double hairline frame around the viewport',
    'Arch-shaped engraving plate',
    'Drop cap on the manifesto',
    'Gold rule ornament that draws itself',
  ],
  guidance: {
    typography: [
      'Display: Crimson Text 400 at 96–132px, line-height .92, sentence case. Italic is the only emphasis: put one or two words in italic oxblood.',
      'Eyebrows and labels: Crimson Text 600, 11–13px, uppercase, letter-spacing .22em.',
      'Body: Crimson Text 400, 19–21px, line-height 1.65, max-width 62ch.',
      'Never use a sans-serif for a headline. Never use more than two weights on one screen.',
    ],
    color: [
      'Parchment #F3EAD7 covers ~70% of the page; ink #2B2118 ~20%; gold #B8892F and oxblood #7A2E2A only as punctuation (≤10%).',
      'Gold is for rules, numerals and small ornaments. Never for body text.',
      'Hairlines are rgba(43,33,24,.35), never a flat grey.',
      'Green #7C8465 is a whisper: one small detail at most.',
    ],
    layout: [
      'Symmetry, centered hero, generous margins (minimum 64px desktop). One idea per screen.',
      'Frame the page with a fixed double hairline: 18px from the edge, then 24px, 1px each.',
      'The arch plate is the signature image container. No rounded cards, no blobs, no grids of pills.',
      'Number sections with roman numerals in gold small caps.',
    ],
    motion: [
      'Slow and dignified: 0.8–1.2s, cubic-bezier(.22,.61,.36,1). Fade plus a 16px rise, nothing else.',
      'Ornaments may draw themselves once with stroke-dashoffset. Nothing loops except an almost invisible grain.',
      'Hover states are a colour shift or an underline that grows from the left. No scaling.',
    ],
    imagery: [
      'Line engravings only: single-weight strokes, hatching, laurel, sun, arches, hills. Ink plus gold.',
      'Avoid photos, emoji, 3D, neon and gradients with more than two stops.',
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
      'No more than one italic phrase per screen.',
    ],
  },
  cssMarkers: ["font-family:'Crimson Text'", 'border:1px solid', 'text-transform:uppercase'],
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
    bg: '#FBF3E4',
    surface: '#F4E6CE',
    ink: '#3A2E28',
    muted: '#6B5648',
    accent: '#C96F4A',
    accent2: '#8FA98A',
    accent3: '#A9C7D9',
    deep: '#6E4B63',
  },
  fonts: {
    display: 'DM Serif Display',
    body: 'Lato',
    mono: 'Lato',
    googleHref:
      'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Lato:ital,wght@0,400;0,700;0,900;1,400&display=swap',
  },
  rules: {
    radius: [14, 32],
    borderWidths: [1, 2],
    borderStyles: ['solid', 'dashed'],
    motion: [0.5, 1.2],
    requiredFonts: ['DM Serif Display', 'Lato'],
    forbiddenFonts: ['Inter', 'Roboto', 'Arial', 'Helvetica', 'Archivo Black', 'Space Mono', 'Crimson Text', 'Georgia'],
    shadow: 'Soft and warm: 0 18px 30px rgba(58,46,40,.18) plus a 0 2px 0 edge. Never a hard offset.',
    shadowPattern: '0\\s+18px\\s+30px',
  },
  signature: [
    'Layered paper cards rotated -3° to 3°',
    'Washi tape strips on the corners',
    'Scalloped or torn band dividers',
    'Soft float loop on decorative shapes',
  ],
  guidance: {
    typography: [
      'Display: DM Serif Display 400 at 84–120px, line-height .9, sentence case. It should feel cut, not typed.',
      'Body: Lato 400 at 17–19px, line-height 1.6. Labels: Lato 900 at 10–12px, uppercase, letter-spacing .18em.',
      'Italic only for one handwritten-feeling word; never all caps for the display.',
      'Never use monospace or a second serif.',
    ],
    color: [
      'Cream #FBF3E4 is the table. Terracotta #C96F4A, sage #8FA98A, sky #A9C7D9 and kraft #D9B98C are paper sheets; ink #3A2E28 is the pen.',
      'Use at most three paper colours per screen plus cream. Plum #6E4B63 only for tiny accents.',
      'Shadows are warm brown rgba(58,46,40,.18), never grey or black.',
      'No neon, no pure white, no acid.',
    ],
    layout: [
      'Layered and off-grid but balanced: cards rotated -3° to 3°, overlapping 12–24px, with visible tape.',
      'Radii 16–28px and asymmetric, e.g. 22px 18px 24px 16px. Never perfect circles for cards.',
      'Vertical rhythm 96–140px. Use a scalloped or torn divider between bands.',
      'One focal paper object per screen; everything else supports it.',
    ],
    motion: [
      'Gentle and physical: .6–.9s pop-in with cubic-bezier(.34,1.56,.64,1), then a 6s float loop with 12px amplitude.',
      'Stagger 90ms; parallax layers by 8–16px. Respect reduced motion.',
      'Hover lifts a card by 4px and deepens its shadow. No colour flashing.',
    ],
    imagery: [
      'Paper cutout SVG: flowers, leaves, suns, waves, confetti. Each shape gets a soft warm shadow and a slightly darker edge.',
      'No photos, no neon, no hard black borders, no brutalist grids.',
      'Tape is semi-transparent and slightly rotated; it is the signature detail.',
    ],
    copy: [
      'Voice: warm, handmade, first person. Short sentences, sensory details.',
      'Headline: 3–6 words, sentence case; one word can be italic.',
      'Body: concrete nouns, no corporate abstractions. Say "we folded 400 invitations", not "we deliver solutions".',
    ],
    dont: [
      'No 0px corners.',
      'No 3px black borders, no acid colours, no monospace.',
      'No uppercase display, no hard shadows, no dark backgrounds.',
      'No more than one italic phrase per screen.',
    ],
  },
  cssMarkers: ["font-family:'DM Serif Display'", "font-family:'Lato'", 'border-radius:22px', 'box-shadow:0 18px 30px'],
};

export const presets: Record<StyleSlug, StylePreset> = {
  renaissance,
  brutalist,
  papercraft,
};

export const styleSlugs = Object.keys(presets) as StyleSlug[];

export function isStyleSlug(value: string): value is StyleSlug {
  return (styleSlugs as string[]).includes(value);
}

export function getStyle(slug: StyleSlug): StylePreset {
  return presets[slug];
}
