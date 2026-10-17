import type { StylePreset } from '../types.js';

const forbidden = ['Inter', 'Roboto', 'Arial', 'Helvetica', 'system-ui', 'Georgia'];
const copy = [
  'Voice: precise, curious, never jokey. Explain the subject, not the studio.',
  'Headline: 2–6 words. One word may carry the accent colour.',
  'Body: one idea per paragraph, concrete nouns, no filler.',
];
const dontBase = ['No lorem ipsum.', 'No emoji.', 'No stock photography.', 'No gradients that fake depth unless the style calls for them.'];

export const artDeco: StylePreset = {
  slug: 'artdeco',
  name: 'Art Deco',
  epithet: 'A lacquered machine for looking upward',
  description:
    'Black lacquer, champagne lines and a sunburst geometry. Symmetrical, vertical, cinematic: a lobby for a future that never quite arrived.',
  bestFor: ['architecture', 'jazz and nightlife', 'timelines', 'luxury brands', 'city histories'],
  avoid: ['children', 'dense data', 'informal community pages'],
  palette: {
    bg: '#0E0E10',
    surface: '#17171B',
    ink: '#F4EBD9',
    muted: '#B9C0C4',
    accent: '#C8A45C',
    accent2: '#1F5C4A',
    accent3: '#6E1F2B',
    accent4: '#D9A6A0',
    deep: '#050506',
  },
  fonts: {
    display: 'Poiret One',
    body: 'Josefin Sans',
    mono: 'Josefin Sans',
    googleHref:
      'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;600&family=Poiret+One&display=swap',
  },
  rules: {
    radius: [0, 2],
    borderWidths: [1, 2],
    borderStyles: ['solid'],
    motion: [0.4, 1.4],
    requiredFonts: ['Poiret One', 'Josefin Sans'],
    forbiddenFonts: forbidden,
    shadow: 'No shadow: depth comes from gold hairlines and nested stepped frames.',
    shadowPattern: 'none',
  },
  signature: ['Gold sunburst with stepped rays', 'Symmetrical black-and-champagne frame', 'Vertical chevrons and stepped corners', 'Poiret One spaced caps'],
  guidance: {
    typography: [
      'Display: Poiret One 400 at 88–148px, uppercase, letter-spacing .06em, line-height .9. Never bold it.',
      'Body: Josefin Sans 300/400 at 16–18px, line-height 1.7. Labels: Josefin Sans 600 at 11px, uppercase, letter-spacing .22em.',
      'One champagne italic is allowed for a single word; everything else stays geometric.',
    ],
    color: [
      'Black #0E0E10 is 75% of the page. Champagne #C8A45C is a 1px line, a sun, a numeral; never a large fill.',
      'Emerald #1F5C4A and burgundy #6E1F2B are deep accents in small fields. Ivory #F4EBD9 is the only text colour.',
      'No pastel gradients. Gold may glow only through opacity, not a soft radial haze.',
    ],
    layout: [
      'Symmetry is the point: a centred axis, mirrored steps, a tall hero. Break it once with an off-centre caption.',
      'Use nested frames: 1px outer, 8px gap, 1px inner. Corners may step, never round.',
      'Cards are vertical panels with a stepped top, not floating rectangles.',
    ],
    motion: ['A slow 24s sun rotation; 900ms gold line draw; hover lifts a card by 2px and brightens the hairline.', 'Nothing bounces. No spring.'],
    imagery: ['Original SVG: sunburst, stepped arch, chevrons, fans, a skyscraper silhouette. Hard edges, no photos.', 'Gold lines at 1px; deep green and burgundy only as flat fields.'],
    copy,
    dont: [...dontBase, 'No rounded corners.', 'No sans-serif body other than Josefin Sans.', 'No rainbow palette.', 'No centred-everything without one asymmetry.'],
  },
  cssMarkers: ["font-family:'Poiret One'", "font-family:'Josefin Sans'", 'letter-spacing:.06em', 'border:1px solid'],
};

export const isotype: StylePreset = {
  slug: 'isotype',
  name: 'Isotype',
  epithet: 'A city explained with pictograms',
  description:
    'Vienna, 1925: cream paper, black rules and a red pictogram that counts. Data as a public language, not a dashboard.',
  bestFor: ['data and economics', 'civic history', 'mathematics', 'public health', 'explanatory journalism'],
  avoid: ['luxury', 'romance', 'atmospheric fiction'],
  palette: {
    bg: '#F2EBDD',
    surface: '#E7DFC9',
    ink: '#1C1C1C',
    muted: '#6F6A5E',
    accent: '#D23B2E',
    accent2: '#2A7F7A',
    accent3: '#D9A441',
    accent4: '#8C8C8C',
    deep: '#1C1C1C',
  },
  fonts: {
    display: 'Jost',
    body: 'IBM Plex Sans',
    mono: 'IBM Plex Sans',
    googleHref:
      'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500&family=Jost:wght@400;500;700&display=swap',
  },
  rules: {
    radius: [0, 2],
    borderWidths: [1, 2, 3],
    borderStyles: ['solid'],
    motion: [0.3, 1.2],
    requiredFonts: ['Jost', 'IBM Plex Sans'],
    forbiddenFonts: forbidden,
    shadow: 'No shadow. The grid and the pictograms do the work.',
    shadowPattern: 'none',
  },
  signature: ['One pictogram = one unit', 'Visible counting grid', 'Cream, black and signal red', 'Hand-cut silhouettes, not icons'],
  guidance: {
    typography: [
      'Display: Jost 500 at 72–128px, line-height .95, tight tracking -.02em. It must look drawn, not branded.',
      'Body: IBM Plex Sans 400 at 16–18px, line-height 1.65. Labels: IBM Plex Sans 500 at 11px, uppercase, letter-spacing .14em.',
      'Numbers are display: tabular, large, black; one number may be red.',
    ],
    color: [
      'Cream #F2EBDD is paper. Black #1C1C1C is ink. Signal red #D23B2E marks one quantity, never decoration.',
      'Teal #2A7F7A and mustard #D9A441 are secondary series. Grey #8C8C8C is the grid.',
      'No gradients, no shadows, no glass. The page is printed.',
    ],
    layout: [
      'Visible 12-column grid with a 1px rule. Asymmetry comes from data, not from arbitrary offsets.',
      'A pictogram row is a paragraph: repeat the same silhouette, never mix three icon families.',
      'Tables are allowed and should look like tables. Do not turn every number into a card.',
    ],
    motion: ['Counters tick once on reveal; bars grow 400ms from zero. No looping animation.', 'Respect reduced motion; show the final number.'],
    imagery: ['Original pictograms: person, house, tree, factory, book, water drop. Flat silhouettes on the grid.', 'No isometric 3D, no rounded icon packs.'],
    copy,
    dont: [...dontBase, 'No rounded cards.', 'No drop shadows.', 'No more than two pictogram families.', 'No fake statistics.'],
  },
  cssMarkers: ["font-family:'Jost'", "font-family:'IBM Plex Sans'", 'grid-template-columns', 'border-top:1px solid'],
};

export const opart: StylePreset = {
  slug: 'opart',
  name: 'Op Art',
  epithet: 'Your eye is the medium',
  description:
    'Black and bone, a pattern that refuses to sit still. The page is an instrument for perception: your movement completes the image.',
  bestFor: ['perception', 'geometry', 'physics', 'music posters', 'experimental education'],
  avoid: ['long reading', 'formal finance', 'accessibility-critical content without a static fallback'],
  palette: {
    bg: '#0A0A0A',
    surface: '#F7F7F2',
    ink: '#F7F7F2',
    muted: '#A6A6A6',
    accent: '#E03C31',
    accent2: '#1F4FD8',
    accent3: '#E8FF3A',
    accent4: '#9A9A9A',
    deep: '#F7F7F2',
  },
  fonts: {
    display: 'Archivo Black',
    body: 'Space Grotesk',
    mono: 'Space Grotesk',
    googleHref:
      'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@400;500&display=swap',
  },
  rules: {
    radius: [0, 0],
    borderWidths: [1, 2, 3],
    borderStyles: ['solid'],
    motion: [0.2, 1.0],
    requiredFonts: ['Archivo Black', 'Space Grotesk'],
    forbiddenFonts: forbidden,
    shadow: 'No shadow. Contrast and repetition create depth.',
    shadowPattern: 'none',
  },
  signature: ['Moiré field that moves with the pointer', 'Black/white/red with one acid accent', 'Hard geometric type', 'Static fallback for reduced motion'],
  guidance: {
    typography: [
      'Display: Archivo Black at 82–150px, uppercase, line-height .82, letter-spacing -.03em. Let it collide with the pattern.',
      'Body: Space Grotesk 400 at 16–18px. Labels: Space Grotesk 500 at 11px, uppercase, tracked .16em.',
      'Do not use more than two weights. The pattern is the third voice.',
    ],
    color: [
      'Black #0A0A0A and bone #F7F7F2 are the pattern. Red #E03C31 is a warning or a single number.',
      'Blue #1F4FD8 and acid #E8FF3A appear in one band each, never together in a gradient.',
      'No soft shadows; no grey haze.',
    ],
    layout: [
      'Full-bleed pattern behind or beside the type. The grid should be visible and slightly wrong.',
      'Alternate dense and empty bands. Give the eye a rest every second screen.',
      'One rotated element is enough; rotating everything cancels the effect.',
    ],
    motion: ['The moiré follows the pointer at 0.04 damping; a toggle freezes it. Never strobe above 3 Hz.', 'Reveal is a hard cut or a 240ms wipe, not a fade.'],
    imagery: ['Original CSS/SVG patterns: concentric rings, warped grids, checkerboards, interference lines.', 'No stock optical illusions; build the pattern.'],
    copy,
    dont: [...dontBase, 'No rounded corners.', 'No soft shadows.', 'No more than 3 Hz.', 'No pattern without a pause.'],
  },
  cssMarkers: ["font-family:'Archivo Black'", "font-family:'Space Grotesk'", 'repeating-linear-gradient', 'mix-blend-mode'],
};

export const ukiyoe: StylePreset = {
  slug: 'ukiyoe',
  name: 'Ukiyo-e',
  epithet: 'The floating world, printed on paper',
  description:
    'Prussian blue, washi cream and a vermilion seal. Flat planes, a great wave and a vertical cartouche: the world seen from the edge of the water.',
  bestFor: ['oceanography', 'Japanese history', 'poetry', 'climate', 'art history'],
  avoid: ['fast product launches', 'dense dashboards', 'ironic memes'],
  palette: {
    bg: '#F3E9D2',
    surface: '#DCE6E3',
    ink: '#22201D',
    muted: '#5B6B73',
    accent: '#1B3A5C',
    accent2: '#C8402A',
    accent3: '#5B7C99',
    accent4: '#6E7F5C',
    deep: '#1B3A5C',
  },
  fonts: {
    display: 'Shippori Mincho B1',
    body: 'Zen Kaku Gothic New',
    mono: 'Zen Kaku Gothic New',
    googleHref:
      'https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@400;700&family=Zen+Kaku+Gothic+New:wght@400;500&display=swap',
  },
  rules: {
    radius: [0, 2],
    borderWidths: [1, 2],
    borderStyles: ['solid'],
    motion: [0.6, 1.6],
    requiredFonts: ['Shippori Mincho B1', 'Zen Kaku Gothic New'],
    forbiddenFonts: forbidden,
    shadow: 'No shadow. Paper and ink are flat.',
    shadowPattern: 'none',
  },
  signature: ['Layered wave planes with foam claws', 'Vertical title cartouche', 'Vermilion seal', 'Washi grain and a low horizon'],
  guidance: {
    typography: [
      'Display: Shippori Mincho B1 700 at 62–112px, line-height 1.02, vertical rhythm. One word can be set vertically.',
      'Body: Zen Kaku Gothic New 400 at 16–18px, line-height 1.75. Labels: Zen Kaku 500 at 11px, letter-spacing .16em.',
      'Use the seal as punctuation, not as a logo.',
    ],
    color: [
      'Washi #F3E9D2 is 55%. Prussian #1B3A5C is the sea and the type. Vermilion #C8402A is the seal and one accent.',
      'Mist #DCE6E3 and moss #6E7F5C are distant planes; never gradients.',
      'No gold, no neon, no pure white.',
    ],
    layout: [
      'A low horizon and a large negative sky. The composition should feel like a print cropped by the page.',
      'Title in a narrow vertical cartouche on the left or right; body text on the opposite side.',
      'Bands are flat and overlap like printed layers.',
    ],
    motion: ['Waves drift 8–16px on scroll; foam appears once. No bounce.', 'The seal can breathe opacity 0.9→1 over 6s.'],
    imagery: ['Original SVG: waves, foam, a distant mountain, a boat, a crane. Flat shapes, no outlines-only clip art.', 'Paper grain and misregistration are welcome.'],
    copy,
    dont: [...dontBase, 'No rounded corners.', 'No 3D or drop shadows.', 'No cherry-blossom clip art.', 'No faux-Japanese lettering.'],
  },
  cssMarkers: ["font-family:'Shippori Mincho B1'", "font-family:'Zen Kaku Gothic New'", 'writing-mode', 'background-image'],
};

export const bestiary: StylePreset = {
  slug: 'bestiary',
  name: 'Illuminated bestiary',
  epithet: 'A field guide for animals that never existed',
  description:
    'Parchment, iron-gall ink and a single lapis blue. A manuscript page with an illuminated initial, marginalia and a creature that watches back.',
  bestFor: ['biology and taxonomy', 'fable and literature', 'mythology', 'natural history', 'slow essays'],
  avoid: ['sports', 'SaaS', 'breaking news'],
  palette: {
    bg: '#E8D9B8',
    surface: '#F2E6C9',
    ink: '#2B2118',
    muted: '#6A5745',
    accent: '#C9A227',
    accent2: '#A63A2B',
    accent3: '#2E4A7D',
    accent4: '#4E7A63',
    deep: '#2B2118',
  },
  fonts: {
    display: 'UnifrakturMaguntia',
    body: 'IM Fell English',
    mono: 'IM Fell English',
    googleHref:
      'https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=UnifrakturMaguntia&display=swap',
  },
  rules: {
    radius: [0, 4],
    borderWidths: [1, 2],
    borderStyles: ['solid'],
    motion: [0.5, 1.4],
    requiredFonts: ['UnifrakturMaguntia', 'IM Fell English'],
    forbiddenFonts: forbidden,
    shadow: 'No shadow. The manuscript is flat; use a 1px ink rule.',
    shadowPattern: 'none',
  },
  signature: ['Illuminated initial with a creature', 'Two-column manuscript grid', 'Gold leaf as a flat shape, not a gradient', 'Marginalia and a red rubric'],
  guidance: {
    typography: [
      'Display: UnifrakturMaguntia 400 at 54–94px, sentence case. It is a display face; never set body copy in it.',
      'Body: IM Fell English 400 at 18–21px, line-height 1.7. Italic for marginalia. Labels: IM Fell English 400 at 12px, small caps.',
      'Drop caps: 4 lines, lapis or vermilion, with a 12px gold rule.',
    ],
    color: [
      'Parchment #E8D9B8 is the page. Iron-gall #2B2118 is the text. Lapis #2E4A7D is the sacred blue, ≤10%.',
      'Gold #C9A227 is flat leaf, never a gradient. Vermilion #A63A2B is a rubric or a wound.',
      'No white backgrounds, no neon, no photographic texture.',
    ],
    layout: [
      'Two columns with a wide gutter and generous lower margin. The initial breaks the first column.',
      'Marginalia sits outside the text block, rotated 90° only if it is short.',
      'Frames are drawn with 1px rules and small corner fleurons, not thick borders.',
    ],
    motion: ['The creature blinks every 7s; gold glints once on reveal. No floating.', 'Hovering a marginal note reveals its translation.'],
    imagery: ['Original SVG: a hare-headed bird, a two-tailed fox, a botanical border, a gold sun. Hand-drawn silhouette, no clip art.', 'Texture from CSS grain, not a photo.'],
    copy,
    dont: [...dontBase, 'No blackletter body copy.', 'No glossy gradients.', 'No modern sans-serif.', 'No generic fantasy dragons.'],
  },
  cssMarkers: ["font-family:'UnifrakturMaguntia'", "font-family:'IM Fell English'", 'columns:', '::first-letter'],
};

export const psychedelic: StylePreset = {
  slug: 'psychedelic',
  name: 'Psychedelic poster',
  epithet: 'A poster that refuses to sit still',
  description:
    'Night blue, magenta and orange, liquid shapes and a headline that bends. A 1967 concert poster for a subject that deserves a trip.',
  bestFor: ['music', 'biology', 'chemistry', 'festivals', 'consciousness'],
  avoid: ['legal', 'medical instructions', 'conservative finance'],
  palette: {
    bg: '#1B1B3A',
    surface: '#2A1A5E',
    ink: '#F7E8C8',
    muted: '#B9A7FF',
    accent: '#E5197F',
    accent2: '#FF6B1A',
    accent3: '#F5E13B',
    accent4: '#00A6A6',
    deep: '#5B2A86',
  },
  fonts: {
    display: 'Bungee Shade',
    body: 'Space Grotesk',
    mono: 'Space Grotesk',
    googleHref:
      'https://fonts.googleapis.com/css2?family=Bungee+Shade&family=Space+Grotesk:wght@400;500&display=swap',
  },
  rules: {
    radius: [0, 40],
    borderWidths: [0, 1, 2, 4],
    borderStyles: ['solid'],
    motion: [0.3, 1.4],
    requiredFonts: ['Bungee Shade', 'Space Grotesk'],
    forbiddenFonts: forbidden,
    shadow: 'Hard offset shadows in magenta or orange are allowed; no soft grey shadows.',
    shadowPattern: '4px 4px 0',
  },
  signature: ['Liquid blobs that follow the pointer', 'Bungee Shade headline with a hard offset', 'Acid yellow and hot magenta', 'A poster that fills the viewport'],
  guidance: {
    typography: [
      'Display: Bungee Shade at 68–120px, uppercase, line-height .88. It is already decorative; do not add another display face.',
      'Body: Space Grotesk 400 at 16–18px, line-height 1.6. Labels: Space Grotesk 500 at 11px, tracked .14em.',
      'One word can be set in a curved arc or rotated 3°; not the whole headline.',
    ],
    color: [
      'Night #1B1B3A is the ground. Magenta #E5197F and orange #FF6B1A are the hot pair. Acid #F5E13B is a single hit.',
      'Teal #00A6A6 and violet #5B2A86 are cool pauses. Cream #F7E8C8 is text.',
      'Gradients are allowed only inside blobs; keep type on flat colour.',
    ],
    layout: [
      'All-over composition: blobs, rings and type overlap. Leave one quiet corner for the CTA.',
      'Cards are poster panels, not UI cards: thick black keylines and a hard offset.',
      'The fold or crop can cut a shape; do not center everything.',
    ],
    motion: ['Blobs drift 20–40px over 9s; hover expands a blob 4%. No strobing.', 'Reduced motion freezes the blobs and keeps the poster.'],
    imagery: ['Original SVG: liquid blobs, concentric rings, a sun with a face, mushrooms? no: abstract cells and eyes.', 'No stock psychedelic art, no AI-glow.'],
    copy,
    dont: [...dontBase, 'No soft shadows.', 'No more than three hot colours.', 'No illegible body copy.', 'No strobing above 3 Hz.'],
  },
  cssMarkers: ["font-family:'Bungee Shade'", "font-family:'Space Grotesk'", 'border-radius:40px', 'mix-blend-mode'],
};

export const memphis: StylePreset = {
  slug: 'memphis',
  name: 'Memphis',
  epithet: 'A deliberate case of bad taste',
  description:
    'Milan, 1981: squiggles, terrazzo, cobalt and pink. Postmodern play with a straight face, held together by a black keyline.',
  bestFor: ['design history', 'music', 'workshops', 'creative education', 'events'],
  avoid: ['hospitals', 'luxury', 'solemn memorials'],
  palette: {
    bg: '#F5F0E6',
    surface: '#FFFFFF',
    ink: '#111111',
    muted: '#6B6B6B',
    accent: '#F2A6B3',
    accent2: '#9FD8C8',
    accent3: '#2E4FD8',
    accent4: '#F4D35E',
    deep: '#B9A7E0',
  },
  fonts: {
    display: 'Bricolage Grotesque',
    body: 'DM Sans',
    mono: 'DM Sans',
    googleHref:
      'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=DM+Sans:wght@400;500&display=swap',
  },
  rules: {
    radius: [0, 48],
    borderWidths: [1, 2, 3],
    borderStyles: ['solid'],
    motion: [0.3, 1.2],
    requiredFonts: ['Bricolage Grotesque', 'DM Sans'],
    forbiddenFonts: forbidden,
    shadow: 'Hard black offset shadows (6px 6px 0) are the point; no soft blur.',
    shadowPattern: '6px 6px 0',
  },
  signature: ['Squiggles and terrazzo', 'Hard 6px black offset shadows', 'Rotated cards with a 3px keyline', 'Cobalt, pink, mint and butter'],
  guidance: {
    typography: [
      'Display: Bricolage Grotesque 700 at 72–128px, line-height .92, tight tracking -.03em.',
      'Body: DM Sans 400 at 16–18px, line-height 1.6. Labels: DM Sans 500 at 11px, uppercase, tracked .12em.',
      'One word can be on a pink highlight; do not rainbow the headline.',
    ],
    color: [
      'Bone #F5F0E6 is the table. Black #111111 is the keyline. Pink #F2A6B3, mint #9FD8C8, cobalt #2E4FD8 and butter #F4D35E are flat shapes.',
      'Lilac #B9A7E0 is a fifth accent; use it sparingly.',
      'No gradients, no soft shadows, no beige minimalism.',
    ],
    layout: [
      'Asymmetrical, rotated 1–4°, overlapping. A 3px black keyline keeps the chaos legible.',
      'Cards can be different widths; the grid is a suggestion. Do not align everything.',
      'Use one giant squiggle and one terrazzo field per page.',
    ],
    motion: ['Click “shuffle” to re-scatter shapes with a 300ms transform. Squiggles draw in 700ms.', 'Hover lifts a card 4px and increases the hard shadow to 8px.'],
    imagery: ['Original SVG: squiggles, terrazzo chips, a checkerboard, a wavy vase, a star.', 'No Memphis Group scans; draw the vocabulary.'],
    copy,
    dont: [...dontBase, 'No soft shadows.', 'No rounded sans-only look without a keyline.', 'No more than five accents.', 'No aligning everything.'],
  },
  cssMarkers: ["font-family:'Bricolage Grotesque'", "font-family:'DM Sans'", 'border:3px solid', 'box-shadow:6px 6px 0'],
};

export const vaporwave: StylePreset = {
  slug: 'vaporwave',
  name: 'Vaporwave / Y2K',
  epithet: 'A window into a future that already expired',
  description:
    'Violet dusk, chrome type and a perspective grid. A desktop from 1999, half-remembered, with a cursor that still works.',
  bestFor: ['internet history', 'media studies', 'music', 'digital culture', 'nostalgia'],
  avoid: ['serious policy', 'health', 'legal'],
  palette: {
    bg: '#1B1035',
    surface: '#2B3A8F',
    ink: '#FFFFFF',
    muted: '#B9A7FF',
    accent: '#FF4FA3',
    accent2: '#4FE3E3',
    accent3: '#C9D1D9',
    accent4: '#FFD6F2',
    deep: '#2B3A8F',
  },
  fonts: {
    display: 'Press Start 2P',
    body: 'Space Grotesk',
    mono: 'Space Grotesk',
    googleHref:
      'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Grotesk:wght@400;500&display=swap',
  },
  rules: {
    radius: [0, 6],
    borderWidths: [1, 2, 3],
    borderStyles: ['solid'],
    motion: [0.2, 1.4],
    requiredFonts: ['Press Start 2P', 'Space Grotesk'],
    forbiddenFonts: forbidden,
    shadow: 'Chrome bevels and 2px hard inset edges; no soft ambient shadow.',
    shadowPattern: 'inset 2px 2px 0',
  },
  signature: ['Draggable 1999 window', 'Perspective grid and a striped sun', 'Chrome gradient title', 'Glitch on hover'],
  guidance: {
    typography: [
      'Display: Press Start 2P at 28–56px, uppercase, line-height 1.35. It is a pixel face: keep lines short.',
      'Body: Space Grotesk 400 at 16–18px. Labels: Space Grotesk 500 at 10px, uppercase, tracked .14em.',
      'Chrome is a gradient on the title only; body text stays white or lavender.',
    ],
    color: [
      'Violet #1B1035 is the desktop. Hot pink #FF4FA3, cyan #4FE3E3 and chrome #C9D1D9 are UI accents.',
      'Blue #2B3A8F is the window title bar. White #FFFFFF is body text.',
      'Gradients are allowed in the sky and chrome, never behind body copy.',
    ],
    layout: [
      'A fake OS window with a title bar, three buttons and a status bar. The page is the desktop.',
      'Perspective grid on the lower third; sun on the horizon. Do not center the window exactly.',
      'Cards are file windows or tiles, not rounded SaaS cards.',
    ],
    motion: ['The grid scrolls slowly; the sun’s stripes drift; the window can be dragged. Glitch is a 120ms RGB split on hover.', 'No flashing above 3 Hz.'],
    imagery: ['Original CSS/SVG: chrome gradient, grid, sun, pixel cursor, window chrome, floppy disk.', 'No lifted Windows screenshots.'],
    copy,
    dont: [...dontBase, 'No soft shadows.', 'No modern SaaS cards.', 'No illegible pixel body copy.', 'No flashing.'],
  },
  cssMarkers: ["font-family:'Press Start 2P'", "font-family:'Space Grotesk'", 'linear-gradient', 'text-shadow'],
};

export const galactic: StylePreset = {
  slug: 'galactic',
  name: 'Galactic Futurism',
  epithet: 'A planetarium for the things we remember',
  description:
    'Deep-space navy, chrome ivory and one slow planet. Michroma, orbital rings and the silence before a bassline: less sci-fi blockbuster, more planetarium after closing time.',
  bestFor: ['music rooms', 'space and astronomy', 'memory and technology', 'film essays', 'album tributes'],
  avoid: ['fast commerce', 'children’s worksheets', 'cluttered dashboards'],
  palette: {
    bg: '#05060A',
    surface: '#0D1020',
    ink: '#F2F4FF',
    muted: '#9BA6C4',
    accent: '#79E8FF',
    accent2: '#B388FF',
    accent3: '#F5C86B',
    accent4: '#FF6FAE',
    deep: '#02030A',
  },
  fonts: {
    display: 'Michroma',
    body: 'Space Grotesk',
    mono: 'Space Grotesk',
    googleHref:
      'https://fonts.googleapis.com/css2?family=Michroma&family=Space+Grotesk:wght@300;400;500&display=swap',
  },
  rules: {
    radius: [0, 2],
    borderWidths: [1, 2],
    borderStyles: ['solid'],
    motion: [0.4, 1.8],
    requiredFonts: ['Michroma', 'Space Grotesk'],
    forbiddenFonts: forbidden,
    shadow: 'No box shadow: depth comes from the starfield, orbital lines and black space.',
    shadowPattern: 'none',
  },
  signature: ['One planet, three orbits', 'Chrome Michroma caps', 'Cyan and solar gold on void black', 'A music room with an original track'],
  guidance: {
    typography: [
      'Display: Michroma 400 at 42–92px, uppercase, letter-spacing .01em, line-height 1.08. It is wide: keep headlines short.',
      'Body: Space Grotesk 300/400 at 16–18px, line-height 1.7. Labels: Space Grotesk 500 at 10px, uppercase, tracked .18em.',
      'One chrome-gradient word is allowed. Never chrome the whole headline.',
    ],
    color: [
      'Void #05060A is 70% of the page. Chrome ivory #F2F4FF is the text. Cyan #79E8FF is a line or a planet rim, never a fill.',
      'Violet #B388FF and solar gold #F5C86B are secondary orbital accents. Magenta #FF6FAE is a single event.',
      'No rainbow nebula. No purple-to-pink gradient across everything. Space is mostly black.',
    ],
    layout: [
      'One planet, three orbits, one headline. The page should feel like a room with a very large window.',
      'Asymmetric: copy on one side, a planet that bleeds off the other. Generous negative space is the luxury.',
      'Cards are instruments, not glassmorphism: 1px cyan rule, black field, small technical labels.',
    ],
    motion: ['Orbits rotate over 40–80s; the planet breathes 4px; stars twinkle at 6s. No warp speed.', 'Audio player is user-initiated; never autoplay.'],
    imagery: ['Original SVG: ringed planet, thin orbital ellipses, a small moon, a starfield. No NASA photos, no Star Wars ships, no lens flares.', 'A single grain layer keeps the black from feeling flat.'],
    copy,
    dont: [...dontBase, 'No rounded cards.', 'No neon rainbow.', 'No autoplay audio.', 'No sci-fi logos or fake alien alphabets.'],
  },
  cssMarkers: ["font-family:'Michroma'", "font-family:'Space Grotesk'", 'border:1px solid', 'radial-gradient'],
};
