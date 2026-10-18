import type { StylePreset } from '../types.js';

export const nature: StylePreset = {
  slug: 'nature',
  name: 'Nature Memory',
  epithet: 'A herbarium for the living archive',
  description:
    'Pressed leaves, field notes, growth rings and a palette of moss, clay and pollen. An archive that remembers it was alive: botanical, patient, exact.',
  bestFor: ['botanical gardens', 'museums and archives', 'slow editorial', 'nature education', 'memory projects', 'seed libraries'],
  avoid: ['nightlife', 'fast commerce', 'dense dashboards', 'ironic youth brands'],
  palette: {
    bg: '#EFE9D8',
    surface: '#DCE4D2',
    ink: '#243026',
    muted: '#5A6450',
    accent: '#606E3E',
    accent2: '#B55239',
    accent3: '#4B6B62',
    accent4: '#D8B56A',
    deep: '#141B15',
  },
  fonts: {
    display: 'Cormorant Garamond',
    body: 'Karla',
    mono: 'IBM Plex Mono',
    googleHref:
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400&family=Karla:wght@300;400;600&display=swap',
  },
  rules: {
    radius: [0, 22],
    borderWidths: [1, 2],
    borderStyles: ['solid'],
    motion: [0.5, 1.8],
    requiredFonts: ['Cormorant Garamond', 'Karla'],
    forbiddenFonts: ['Inter', 'Roboto', 'Arial', 'Helvetica', 'Archivo Black', 'Space Mono', 'DM Serif Display', 'Lato', 'Fredoka', 'Varela Round', 'Poiret One'],
    shadow: 'Soft botanical shadow: 0 18px 40px rgba(36,48,38,.14). Never hard offset.',
    shadowPattern: '0\\s+18px\\s+40px',
  },
  signature: [
    'Pressed-specimen plate with a hand-written field label',
    'Growth rings as a quiet diagram, never a generic target',
    'Seasonal bands: moss, clay, rain and pollen in flat fields',
    'Vertical herbarium label with date and place',
    'Botanical linework on paper, no stock photography',
  ],
  guidance: {
    typography: [
      'Display: Cormorant Garamond 400 at 64–132px, sentence case, line-height 1.02. Italic is for a field name or a single turn, not for whole paragraphs.',
      'Body: Karla 300/400 at 18–20px, line-height 1.68, max-width 62ch. Labels: IBM Plex Mono 400 at 10–11px, uppercase, tracking .16em.',
      'Use old-style numerals for dates and specimen numbers; tabular figures for measurements. Never set a whole page in italic.',
    ],
    color: [
      'Parchment #EFE9D8 is the page; lichen #DCE4D2 is a pressed field; moss #7A8B4F is the lead accent; clay #B55239 is the one warm event.',
      'Rain #4B6B62 is a secondary field; pollen #D8B56A is for labels and small marks, not body text. Deep #141B15 is for a dark archive only.',
      'No gradients that fake light. A seasonal field is flat, with a hard paper edge.',
    ],
    layout: [
      'Asymmetric field sheet: copy on one side, a specimen plate on the other. The plate can bleed off one edge.',
      'Use a visible herbarium label: date, place, collector, source. If the source is unknown, say unknown.',
      'Sections are drawers, not cards: a thin rule, a number, a specimen title, a short note.',
      'On mobile, the plate becomes a full-width pressed sheet; never stack five tiny cards.',
    ],
    motion: [
      'Slow and botanical: 900ms fade + 14px rise; stagger 80ms. A pressed leaf does not bounce.',
      'Ambient: a 16s drift of one leaf, growth rings drawing once. Nothing loops faster than a season.',
      'Hover: underline or a 2px shift; no scaling. Reduced motion shows the final state and stops the drift.',
    ],
    imagery: [
      'Original botanical SVG: stems, leaves, seed heads, roots, growth rings, a single insect. Flat ink and muted fills.',
      'No stock photos, no fake Latin, no generic monstera. Every specimen has a name, a place and a date, or is marked as unknown.',
      'Paper texture comes from grain and thin rules, not a global noise overlay.',
    ],
    copy: [
      'Voice: a field notebook written for a visitor, not a perfume ad. Precise, patient, first person plural.',
      'Headline: 2–6 words, sentence case; one botanical image, one measured fact.',
      'Body: observation before metaphor. Name what you can see, then what it might mean. Never invent a species or a date.',
    ],
    dont: [
      'No cottagecore clichés, fake Latin, pressed-flower stickers or "organic" gradients.',
      'No hard offset shadows, no neon, no pure white.',
      'No stock photography of forests or hands.',
      'Never present an invented specimen as a fact; mark fiction and uncertainty.',
    ],
  },
  cssMarkers: ["font-family:'Cormorant Garamond'", "font-family:'Karla'", 'border:1px solid', 'writing-mode:vertical-rl'],
};
