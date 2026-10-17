import type { StyleSlug, StyleSubfamily } from '../types.js';

/**
 * Subfamilies are tonal, not new styles. They may change the lead accent and the
 * ground within the existing palette; they never add a new hex value, font or
 * radius. Names are curated to read like rooms, not like preset dropdowns.
 */
export const SUBFAMILIES: Record<StyleSlug, StyleSubfamily[]> = {
  renaissance: [
    { slug: 'fresco', name: 'Fresco', description: 'Powder-blue ground, cinnabar only in the margin.', accent: 'accent3' },
    { slug: 'incarnato', name: 'Incarnato', description: 'Warm plaster and a cinnabar event; the most human room.', accent: 'accent2' },
    { slug: 'notte', name: 'Notte', description: 'A darker sacristy: umber ground, gold line, one blue window.', accent: 'accent' },
  ],
  brutalist: [
    { slug: 'concrete', name: 'Concrete', description: 'Paper, ink and acid: the original control room.', accent: 'accent' },
    { slug: 'signal', name: 'Signal', description: 'Red warning stripe on a bone field. Louder, not busier.', accent: 'accent2' },
    { slug: 'terminal', name: 'Terminal', description: 'Blue telemetry and monospace; a control room after hours.', accent: 'accent3' },
  ],
  papercraft: [
    { slug: 'picnic', name: 'Picnic', description: 'Sage tablecloth, terracotta card, butter tape.', accent: 'accent2' },
    { slug: 'carnival', name: 'Carnival', description: 'Terracotta lead, sky secondary, confetti kept small.', accent: 'accent' },
    { slug: 'museum', name: 'Museum', description: 'Sky-blue label, paper white, plum only in the seal.', accent: 'accent3' },
  ],
  artdeco: [
    { slug: 'lacquer', name: 'Lacquer', description: 'Champagne line on black; the default lobby.', accent: 'accent' },
    { slug: 'emerald', name: 'Emerald', description: 'Deep green ground and a gold sun; a cinema foyer.', accent: 'accent2' },
    { slug: 'cinema', name: 'Cinema', description: 'Rose-gold light, burgundy shadow, one white screen.', accent: 'accent4' },
  ],
  isotype: [
    { slug: 'vienna', name: 'Vienna', description: 'Signal red pictograms on cream; the 1925 room.', accent: 'accent' },
    { slug: 'civic', name: 'Civic', description: 'Teal series, mustard secondary, counting grid.', accent: 'accent2' },
    { slug: 'archive', name: 'Archive', description: 'Mustard index cards and grey rules; quieter data.', accent: 'accent3' },
  ],
  opart: [
    { slug: 'interference', name: 'Interference', description: 'Black and bone with a red warning line.', accent: 'accent' },
    { slug: 'electric', name: 'Electric', description: 'Blue interference and a single acid pause.', accent: 'accent2' },
    { slug: 'acid', name: 'Acid', description: 'Acid core, black field, red only as an error.', accent: 'accent3' },
  ],
  ukiyoe: [
    { slug: 'prussian', name: 'Prussian', description: 'The classic deep blue sea and a vermilion seal.', accent: 'accent' },
    { slug: 'vermilion', name: 'Vermilion', description: 'Red sun, blue shadow, washi sky.', accent: 'accent2' },
    { slug: 'mist', name: 'Mist', description: 'Grey-blue distance; the horizon disappears.', accent: 'accent3' },
  ],
  bestiary: [
    { slug: 'scriptorium', name: 'Scriptorium', description: 'Old gold and iron gall; the room lit by one candle.', accent: 'accent' },
    { slug: 'lapis', name: 'Lapis', description: 'A blue initial and a gold rule; the sacred page.', accent: 'accent3' },
    { slug: 'rubric', name: 'Rubric', description: 'Vermilion marginalia and a green vine.', accent: 'accent2' },
  ],
  psychedelic: [
    { slug: 'magenta', name: 'Magenta', description: 'Hot pink lead, orange shadow, acid only as punctuation.', accent: 'accent' },
    { slug: 'acid', name: 'Acid', description: 'Yellow lead on violet; the poster under blacklight.', accent: 'accent3' },
    { slug: 'teal', name: 'Teal', description: 'Cool teal and violet; the after-hours version.', accent: 'accent4' },
  ],
  memphis: [
    { slug: 'cobalt', name: 'Cobalt', description: 'Blue keyline, pink squiggle, bone ground.', accent: 'accent3' },
    { slug: 'pink', name: 'Pink', description: 'Pink field, mint object, cobalt detail.', accent: 'accent' },
    { slug: 'mint', name: 'Mint', description: 'Mint ground, butter shape, black keyline.', accent: 'accent2' },
  ],
  vaporwave: [
    { slug: 'chrome', name: 'Chrome', description: 'Cyan chrome, violet desktop, magenta accent.', accent: 'accent2' },
    { slug: 'hot-pink', name: 'Hot pink', description: 'Pink window, cyan grid, chrome type.', accent: 'accent' },
    { slug: 'terminal', name: 'Terminal', description: 'Chrome text on blue; the quiet server room.', accent: 'accent3' },
  ],
  galactic: [
    { slug: 'orbital', name: 'Orbital', description: 'Cyan orbit, violet planet, chrome ivory.', accent: 'accent' },
    { slug: 'deep-field', name: 'Deep field', description: 'Violet nebula and a gold moon; less interface.', accent: 'accent2', ground: 'deep' },
    { slug: 'solar', name: 'Solar', description: 'Gold sun, black space, cyan only as a line.', accent: 'accent3' },
  ],
};
