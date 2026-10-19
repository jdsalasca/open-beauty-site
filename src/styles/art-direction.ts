import type { StyleSlug } from '../types.js';
import type { ArtDirection } from '../types/art-direction.js';

const bundled = (
  family: string,
  weight: number | string,
  source: string,
  license = 'OFL-1.1',
): {
  family: string;
  weight: number | string;
  available: boolean;
  bundled: boolean;
  status: 'bundled' | 'unavailable';
  source: string;
  license: string;
} => ({
  family,
  weight,
  available: true,
  bundled: true,
  status: 'bundled',
  source,
  license,
});

const unavailable = (
  family: string,
  weight: number | string,
  note: string,
): {
  family: string;
  weight: number | string;
  available: boolean;
  bundled: boolean;
  status: 'bundled' | 'unavailable';
  source: string;
  license: string;
  note: string;
} => ({
  family,
  weight,
  available: false,
  bundled: false,
  status: 'unavailable',
  source: 'not present in fonts/ (see fonts/FONTS.md)',
  license: 'not bundled',
  note,
});

const adapt = (description: string, example: string) => ({
  description,
  example,
  paragraph: description,
  text: description,
  examplePath: example,
  path: example,
  file: example,
});

const FONTS = 'fonts/FONTS.md';

export const ART_DIRECTION: Record<StyleSlug, ArtDirection> = {
  renaissance: {
    intent: {
      personality: 'A chalky fresco: plaster, pigment and ink, asymmetric and slow, with one cinnabar event.',
      suitableFor: ['portfolios', 'cultural institutions', 'editorial essays', 'weddings', 'long-form launches'],
      limits: ['dashboards', 'dense product UI', 'playful youth brands', 'anything that needs to feel fast'],
    },
    composition: {
      grid: 'Asymmetric two-column hero: copy left, 48vw arch plate right; 12-column underlying grid with 18px/24px double hairline frame.',
      allowedAsymmetry: 'Copy vs. image sides may swap by seed; one off-centre cinnabar event; roman-numeral section offsets.',
      scale: 'Display clamp(64px,10.5vw,152px) against 20px body: a ≥7x jump; arch plate min(660px,48vw).',
      emptySpace: 'Generous plaster margins; white space finishes sentences; ~55% plaster ground.',
      alignment: 'Left-aligned copy, right plate; hairlines frame the viewport; no centred-everything.',
      density: 'Low-to-medium: one idea per paragraph, 2–3 sentences; avoid card grids.',
    },
    typography: {
      families: {
        display: bundled('EB Garamond', 600, FONTS),
        reading: bundled('EB Garamond', 400, FONTS),
        label: bundled('EB Garamond', 600, FONTS),
        figure: bundled('EB Garamond', 600, FONTS),
        annotation: bundled('EB Garamond', 400, FONTS),
      },
      display: bundled('EB Garamond', 600, FONTS),
      reading: bundled('EB Garamond', 400, FONTS),
      label: bundled('EB Garamond', 600, FONTS),
      figure: bundled('EB Garamond', 600, FONTS),
      annotation: bundled('EB Garamond', 400, FONTS),
      weights: { display: 600, reading: 400, label: 600, figure: 600, annotation: 400 },
      sizesByFormat: {
        web: 'Display clamp(64px,10.5vw,152px), body 20–21px, labels 12–13px',
        slide: 'Display 96–140px, body 20–24px, labels 12–16px',
        gif: 'Display ≥44px at 640×360, body ≥18px, labels ≥12px',
      },
      leading: 'Display .87, body 1.62, labels 1.2; italic emphasis only.',
      readingWidth: 'Body max 62ch on web, 40–48ch on slides, 24–32ch on GIF.',
      displayUsage: 'Sentence case, 2–5 words, one italic cinnabar phrase max; never all caps; never sans-serif.',
      explicitFallback: 'Approved glyph fallbacks: EB Garamond/Archivo Black/Space Mono for → and missing outlines (src/narrative/fonts.ts).',
    },
    color: {
      surfaces: ['#F6EDDD', '#E3E9E6'],
      text: '#2B211B',
      accents: ['#B08A4F', '#B4432C', '#AFC5D6', '#B9C4A6'],
      semanticStates: { ok: '#B9C4A6', warn: '#B08A4F', problem: '#B4432C', neutral: '#AFC5D6' },
      contrastNotes: 'Chalky sun-faded pigment on plaster; hairlines rgba(43,33,27,.28); cinnabar ≤2% of surface; verify text on pastel fields.',
    },
    materiality: {
      borders: '1px hairlines only; double frame 18px/24px from edge; no radius above 2px.',
      shadows: 'None or one long soft ambient shadow 0 24px 60px rgba(43,33,27,.08); never hard offset.',
      grain: 'Almost invisible grain; no photographic texture.',
      cutouts: 'Arch plate as image container; flat fresco fields with hard plaster edges.',
      depth: 'Flat planes of pigment; no radial gradients fading to transparent.',
      readabilityRule: 'Pastel must arrive as flat fields; text weight #2B211B keeps pastel from becoming papilla.',
    },
    illustration: {
      vocabulary: ['hills', 'cypress', 'sun', 'arches', 'laurel', 'fresco fields', 'single-weight ink linework'],
      rulesForEntities: 'Entities as flat fresco shapes inside the arch plate, desaturated to sepia if photographic.',
      rulesForRelations: 'Spatial relation through overlapping flat planes and arch framing; no arrows unless diagrammatic.',
      rulesForActions: 'Actions implied by placement and pigment change, not by icons or motion trails.',
    },
    motion: {
      entries: 'Slow 0.7–1.2s fade + 16px rise, cubic-bezier(.22,.61,.36,1).',
      transformations: 'Ornaments draw once via stroke-dashoffset over 1.4s; rays stagger 40ms.',
      continuity: 'Page transitions 1.2s; progress bar 2px; reveal script respects reduced motion.',
      restDuringReading: 'No loops except almost invisible grain; hover is colour shift or growing underline, no scaling.',
    },
    negativeRules: [
      'No border-radius above 2px.',
      'No hard offset shadows.',
      'No sans-serif headlines.',
      'No soft gradient washes; pastel must be a flat field.',
      'No more than one italic phrase per screen.',
    ],
    adaptation: {
      web: adapt('Asymmetric hero with copy left and arch plate right, flat fresco fields, double hairline frame, section numerals in ochre small caps; identity survives from hero to CTA.', 'examples/renaissance/index.html'),
      slides: adapt('1600×900 deck with 80px margins, one idea per slide, title 96–140px, figure or number every second slide; fresco fields as slide grounds.', 'examples/agents/round-2026/renaissance.html'),
      gif: adapt('Three-scene Problema→Solución→Highlight with one fresco event per scene; 2s/5s presets; pause and short transitions; PNGs and manifest.', 'examples/gifs/renaissance.gif'),
    },
  },

  brutalist: {
    intent: {
      personality: 'A loud public poster: concrete, ink and acid, mechanical and urgent.',
      suitableFor: ['studios', 'launches', 'music', 'events', 'manifestos', 'portfolios that need to shout'],
      limits: ['luxury hospitality', 'wellness', 'children', 'dense dashboards', 'formal finance'],
    },
    composition: {
      grid: 'Visible 12-column skeleton, sections sharing edges, full-bleed bands; 3px borders everywhere, 6px for page frame.',
      allowedAsymmetry: 'Centred hero variant allowed; at least one marquee band and one oversized numeral; one acid block.',
      scale: 'Display 96–148px against 15–17px mono body: a ≥6x jump; headline is the layout.',
      emptySpace: 'Low: dense poster surface, but one acid block per view to focus.',
      alignment: 'Left-aligned or centred mass; hard edges; no soft centering.',
      density: 'High text density in mono metadata; mix oversized line with tiny mono, avoid mid-size.',
    },
    typography: {
      families: {
        display: bundled('Archivo Black', 400, FONTS),
        reading: bundled('Space Mono', 400, FONTS),
        label: bundled('Space Mono', 700, FONTS),
        figure: bundled('Archivo Black', 400, FONTS),
        annotation: bundled('Space Mono', 400, FONTS),
      },
      display: bundled('Archivo Black', 400, FONTS),
      reading: bundled('Space Mono', 400, FONTS),
      label: bundled('Space Mono', 700, FONTS),
      figure: bundled('Archivo Black', 400, FONTS),
      annotation: bundled('Space Mono', 400, FONTS),
      weights: { display: 400, reading: 400, label: 700, figure: 400, annotation: 400 },
      sizesByFormat: {
        web: 'Display 96–148px uppercase, body 15–17px, labels 10–13px',
        slide: 'Display 96–140px, body 20–24px, labels 12–16px',
        gif: 'Display ≥40px at 640×360, body ≥16px, labels ≥12px',
      },
      leading: 'Display .82, body 1.5, labels 1.2.',
      readingWidth: 'Body 45–60ch on web; 36–44ch on slides; 24–32ch on GIF.',
      displayUsage: 'All caps, 2–6 words, letter-spacing -.03em; never letterspace more; never serif/sans display.',
      explicitFallback: 'Approved glyph fallbacks: Archivo Black/Space Mono for → (src/narrative/fonts.ts).',
    },
    color: {
      surfaces: ['#F2EFE4', '#E6E2D3'],
      text: '#0B0B0B',
      accents: ['#D8FF00', '#FF3D1F', '#2438FF'],
      semanticStates: { ok: '#D8FF00', warn: '#2438FF', problem: '#FF3D1F', neutral: '#F2EFE4' },
      contrastNotes: 'Paper + ink ~85%; acid is a background, text on acid is always ink; no translucency except 6% black grid.',
    },
    materiality: {
      borders: '3px solid black everywhere; 6px for page frame/hero divider; radius 0.',
      shadows: 'Hard offset only 8px 8px 0 #0B0B0B (zero blur); hover grows to 12px 12px.',
      grain: '6% black grid only; no photographic grain.',
      cutouts: 'None; blocks share edges; marquee bands.',
      depth: 'Flat; no gradients, no blur.',
      readabilityRule: 'Body 18/1.6 minimum; no monospaced tiny data floods; acid never as text on paper.',
    },
    illustration: {
      vocabulary: ['squares', 'grids', 'arrows', 'crosses', 'barcodes', 'halftones', 'acid block'],
      rulesForEntities: 'Entities as geometric blocks, stamps and numerals; black panel with acid type counts as image.',
      rulesForRelations: 'Relation through grid alignment, arrows and coordinates.',
      rulesForActions: 'Actions as imperatives, numerals and stamps; no decorative iconography.',
    },
    motion: {
      entries: 'Fast .25–.5s, cubic-bezier(.2,.8,.2,1), 20px cut, stagger 60ms.',
      transformations: 'Marquee loops 18–24s linear; buttons shift -2px/-2px and grow shadow.',
      continuity: 'Page 250ms; hard stops; no fade-only entrances.',
      restDuringReading: 'Marquee pauses on hover; reduced motion shows complete entrance; no bounce.',
    },
    negativeRules: [
      'No rounded corners.',
      'No soft or blurred shadows.',
      'No serif or pastel.',
      'No more than one acid block and one red stamp per screen.',
      'Do not confuse brutalism with misalignment.',
    ],
    adaptation: {
      web: adapt('Visible skeleton, full-bleed bands, marquee, oversized numeral, acid highlighter block; identity from hero to CTA.', 'examples/brutalist/index.html'),
      slides: adapt('Poster-like slides with 3px borders, hard shadows, marquee band, one acid block; large title and mono metadata.', 'examples/agents/round-2026/brutalist.html'),
      gif: adapt('Hard cuts, mechanical timing, marquee continuity; one acid event per scene; reduced-motion still frame.', 'examples/gifs/brutalist.gif'),
    },
  },

  papercraft: {
    intent: {
      personality: 'Warm cut paper on a table: handmade but art-directed, with coherent layers and shadows.',
      suitableFor: ['crafts', 'food', 'education', 'community', 'personal projects', 'children', 'stationery'],
      limits: ['fintech', 'enterprise SaaS', 'brutalist music', 'anything that needs to feel sharp'],
    },
    composition: {
      grid: 'Layered and off-grid but balanced: cards rotated -2° to 2°, overlapping 16–28px; one focal paper object per screen.',
      allowedAsymmetry: 'Off-grid collage by seed; second sheet 10px right/8px down; full-bleed band crossing right margin.',
      scale: 'Display 64–124px against 18–19px body; cut-paper geometry 30/12/28/14px with ≥18px delta and 26px notch.',
      emptySpace: 'Moderate warm table margins; one focal object; everything else supports it.',
      alignment: 'Balanced asymmetry; visible tape; scalloped/torn dividers.',
      density: 'Medium: concrete nouns, short sentences; no corporate abstractions.',
    },
    typography: {
      families: {
        display: bundled('Fraunces', 560, FONTS),
        reading: bundled('Nunito Sans', 400, FONTS),
        label: bundled('Nunito Sans', 800, FONTS),
        figure: bundled('Fraunces', 560, FONTS),
        annotation: bundled('Space Mono', 400, FONTS),
      },
      display: bundled('Fraunces', 560, FONTS),
      reading: bundled('Nunito Sans', 400, FONTS),
      label: bundled('Nunito Sans', 800, FONTS),
      figure: bundled('Fraunces', 560, FONTS),
      annotation: bundled('Space Mono', 400, FONTS),
      weights: { display: 560, reading: 400, label: 800, figure: 560, annotation: 400 },
      sizesByFormat: {
        web: 'Display 64–124px, body 18–19px, labels 10–12px',
        slide: 'Display 96–140px, body 20–24px, labels 12–16px',
        gif: 'Display ≥44px at 640×360, body ≥18px, labels ≥12px',
      },
      leading: 'Display .96, body 1.62, labels 1.2; no italics.',
      readingWidth: 'Body 55–62ch on web; 40–48ch on slides; 24–32ch on GIF.',
      displayUsage: 'Sentence case, 3–6 words; one word may shift colour and rotate -1.2°; no rounded sans display.',
      explicitFallback: 'Approved glyph fallbacks: Fraunces/Nunito Sans roles use EB Garamond and Space Mono fallbacks (src/narrative/fonts.ts).',
    },
    color: {
      surfaces: ['#FBF1E2', '#FFF8EA'],
      text: '#4A3A32',
      accents: ['#CE7256', '#A9C3A0', '#B8D4E0', '#F2C879'],
      semanticStates: { ok: '#A9C3A0', warn: '#F2C879', problem: '#CE7256', neutral: '#B8D4E0' },
      contrastNotes: 'Cream table #FBF1E2 vs paper sheet #FFF8EA; warm brown shadows rgba(74,58,50,.16–.20); butter is tape only.',
    },
    materiality: {
      borders: '1–2px warm edges; cut-paper radii 30/12/28/14px; no dashed stitching; no 3px black borders.',
      shadows: 'Soft warm 0 22px 40px rgba(74,58,50,.20) plus 0 2px 0 edge; no hard offset.',
      grain: 'Paper texture through layered sheets, not global noise.',
      cutouts: 'Cut geometry, 26px corner notch, washi tape with torn ends and 6–8° tilt; max five tape pieces.',
      depth: 'Layered paper sheets with 1px edge and 2/14/30 blur hierarchy.',
      readabilityRule: 'Irregularity lives in paper, not paragraphs; body 18/1.62; no rounded sans display.',
    },
    illustration: {
      vocabulary: ['soft serif-like flowers', 'leaves', 'suns', 'waves', 'butterflies', 'confetti', 'paper cutouts'],
      rulesForEntities: 'Entities as hard-cut paper silhouettes with soft edges; no line art, no dashed stitching.',
      rulesForRelations: 'Relation through overlap, tape and rotation; collage must stay readable.',
      rulesForActions: 'Actions as folded/cut paper pieces, not as generic stickers; one focal object per screen.',
    },
    motion: {
      entries: 'Physical 480ms cubic-bezier(.22,.9,.24,1), translateY(-22px) rotate(-2.5deg) → zero; shadow settles 180ms later; tape follows 60ms.',
      transformations: 'Float by rotating ±.6° over 8s, delays 0/.9/1.7s; hover lifts 3px, no scale/spring.',
      continuity: 'Stagger 90ms; page 800ms; respect reduced motion (pieces already placed).',
      restDuringReading: 'No spring bounce; ambient rotation tiny; reading layer stays still.',
    },
    negativeRules: [
      'No 0px corners or perfect rounded rectangles; corner delta must be visible.',
      'No dashed stitching, no 3px black borders, no acid colours, no monospace body.',
      'No rounded sans display (Fredoka) or serif-with-hairlines (DM Serif).',
      'No cinta and flowers repeated without relation to the theme.',
      'No tiny labels that affect reading.',
    ],
    adaptation: {
      web: adapt('Layered cut-paper collage, irregular radii, washi tape, scalloped dividers; hero collage can be fixed template or content-driven.', 'examples/papercraft/index.html'),
      slides: adapt('Paper-sheet slides with cut geometry, tape, layered shadows; one focal paper object per slide; no card grids.', 'examples/decks/kittens.html'),
      gif: adapt('Paper settles: 480ms ease, shadow settles later, tape follows; small ±.6° float; 2s/5s presets.', 'examples/gifs/papercraft.gif'),
    },
    profiles: {
      editorial: {
        name: 'Editorial',
        description: 'Current profile: Fraunces Soft display + Nunito Sans reading/labels, cut paper and warm shadows.',
        families: {
          display: { family: 'Fraunces', weight: 560, available: true, source: FONTS, license: 'OFL-1.1', note: 'Registered weight 560; canvas uses 400 for metrics.' },
          reading: { family: 'Nunito Sans', weight: 400, available: true, source: FONTS, license: 'OFL-1.1' },
          label: { family: 'Nunito Sans', weight: 800, available: true, source: FONTS, license: 'OFL-1.1' },
          annotation: { family: 'Space Mono', weight: 400, available: true, source: FONTS, license: 'OFL-1.1' },
        },
        available: true,
        license: 'OFL-1.1 (bundled)',
        source: 'fonts/Fraunces-Soft.ttf, fonts/NunitoSans-*.ttf',
        note: 'Matches the current papercraft preset and pilot packs.',
      },
      friendly: {
        name: 'Friendly',
        description: 'Rounded/friendly profile inspired by the reference: Fredoka, Nunito and Caveat with distinct roles; Caveat only for short annotations, never paragraphs.',
        families: {
          display: { family: 'Fredoka', weight: 600, available: false, source: 'not present in fonts/', license: 'not bundled', note: 'No Fredoka file in fonts/.' },
          reading: { family: 'Nunito', weight: 400, available: false, source: 'not present in fonts/', license: 'not bundled', note: 'Only Nunito Sans is bundled; Nunito is not.' },
          label: { family: 'Nunito', weight: 700, available: false, source: 'not present in fonts/', license: 'not bundled', note: 'Only Nunito Sans is bundled.' },
          annotation: { family: 'Caveat', weight: 400, available: false, source: 'not present in fonts/', license: 'not bundled', note: 'Caveat only for short annotations, never paragraphs; file absent.' },
        },
        available: false,
        license: 'not bundled (no OFL file present)',
        source: 'fonts/ (checked: no Fredoka/Nunito/Caveat files)',
        note: 'Spec only. Fredoka, Nunito and Caveat are not in fonts/ or src/narrative/fonts.ts; do not fake availability. Requires bundling + licence review before use.',
      },
    },
  },

  artdeco: {
    intent: {
      personality: 'A lacquered vertical lobby: geometry, symmetry and contained metallic accents.',
      suitableFor: ['architecture', 'jazz and nightlife', 'timelines', 'luxury brands', 'city histories'],
      limits: ['children', 'dense data', 'informal community pages'],
    },
    composition: {
      grid: 'Symmetrical centred axis with nested frames (1px outer, 8px gap, 1px inner); vertical panels; stepped corners.',
      allowedAsymmetry: 'Break symmetry once with an off-centre caption or epigraph; one stepped break.',
      scale: 'Display 88–148px against 16–18px body; ≥5x jump; tall hero.',
      emptySpace: 'Moderate: black ground dominates; gold is a line, not a fill.',
      alignment: 'Centred axis with vertical chevrons; mirrored steps.',
      density: 'Medium-low: one image, one fact, one date per block.',
    },
    typography: {
      families: {
        display: bundled('Poiret One', 400, FONTS),
        reading: bundled('Josefin Sans', 400, FONTS),
        label: bundled('Josefin Sans', 600, FONTS),
        figure: bundled('Poiret One', 400, FONTS),
        annotation: bundled('Josefin Sans', 400, FONTS),
      },
      display: bundled('Poiret One', 400, FONTS),
      reading: bundled('Josefin Sans', 400, FONTS),
      label: bundled('Josefin Sans', 600, FONTS),
      figure: bundled('Poiret One', 400, FONTS),
      annotation: bundled('Josefin Sans', 400, FONTS),
      weights: { display: 400, reading: 400, label: 600, figure: 400, annotation: 400 },
      sizesByFormat: { web: 'Display 88–148px uppercase tracked .06em, body 16–18px, labels 11px', slide: 'Display 96–140px, body 20–24px, labels 12–16px', gif: 'Display ≥40px at 640×360, body ≥18px, labels ≥12px' },
      leading: 'Display .9, body 1.7, labels 1.2.',
      readingWidth: 'Body 55–62ch on web; 40–48ch on slides; 24–32ch on GIF.',
      displayUsage: 'Uppercase spaced caps; never bold Poiret One; one champagne italic word allowed.',
      explicitFallback: 'Approved glyph fallbacks: Archivo Black/EB Garamond/Space Mono (src/narrative/fonts.ts).',
    },
    color: {
      surfaces: ['#0E0E10', '#17171B'],
      text: '#F4EBD9',
      accents: ['#C8A45C', '#1F5C4A', '#6E1F2B', '#D9A6A0'],
      semanticStates: { ok: '#1F5C4A', warn: '#C8A45C', problem: '#6E1F2B', neutral: '#B9C0C4' },
      contrastNotes: 'Black 75% of page; gold is 1px line/sun/numeral, never large fill; ivory text only.',
    },
    materiality: {
      borders: '1–2px gold hairlines; nested stepped frames; corners step, never round; no shadow.',
      shadows: 'No shadow; depth from gold hairlines and nested frames.',
      grain: 'None beyond flat lacquer.',
      cutouts: 'Stepped arches, chevrons, fans, skyscraper silhouettes.',
      depth: 'Flat lacquer; gold may glow only through opacity, not soft radial haze.',
      readabilityRule: 'Gold never large fill; body 16–18/1.7; no rainbow palette.',
    },
    illustration: {
      vocabulary: ['sunburst', 'stepped arch', 'chevrons', 'fans', 'skyscraper silhouette', 'gold lines'],
      rulesForEntities: 'Entities as geometric ornament and stepped frames; hard edges, no photos.',
      rulesForRelations: 'Relation through symmetry and vertical rhythm; one asymmetry breaks the rule.',
      rulesForActions: 'Actions as dates, names and material gestures; no perfume-ad copy.',
    },
    motion: {
      entries: 'Curtain 900ms, 12px rise, stagger 90ms; sun rotates 24–38s.',
      transformations: 'Gold line draws once; hover lifts card 2px and brightens hairline.',
      continuity: 'Page 1.1s; slow sun; reduced motion freezes rays and completes filetes.',
      restDuringReading: 'Nothing bounces; no spring; one mobile focus.',
    },
    negativeRules: [
      'No rounded corners.',
      'No large gold fills.',
      'No rainbow palette.',
      'No centred-everything without one asymmetry.',
      'Avoid Gatsby wedding invitation look.',
    ],
    adaptation: {
      web: adapt('Centred axis, nested stepped frames, sunburst hero, vertical panels; black dominant, gold as line.', 'examples/showcase/artdeco/index.html'),
      slides: adapt('Tall hero slides, nested frames, gold hairlines, stepped corners; one off-centre caption.', 'examples/agile/sprint-14-review.html'),
      gif: adapt('Slow sun rotation, gold line draw, curtain entrance; short transitions; reduced-motion stills.', 'examples/gifs/showcase-artdeco.gif'),
    },
  },

  isotype: {
    intent: {
      personality: 'Data as public language: cream paper, black rules, red pictograms that count.',
      suitableFor: ['data and economics', 'civic history', 'mathematics', 'public health', 'explanatory journalism'],
      limits: ['luxury', 'romance', 'atmospheric fiction'],
    },
    composition: {
      grid: 'Visible 12-column grid with 1px rules; pictogram rows as paragraphs; tables allowed.',
      allowedAsymmetry: 'Asymmetry from data, not arbitrary offsets; one red quantity.',
      scale: 'Display 72–128px against 16–18px body; numbers as display anchors.',
      emptySpace: 'Moderate: paper margins; grid visible.',
      alignment: 'Grid-aligned; pictogram rows repeat one silhouette.',
      density: 'Medium-high data density, but each number has unit and source.',
    },
    typography: {
      families: {
        display: bundled('Jost', 500, FONTS),
        reading: bundled('IBM Plex Sans', 400, FONTS),
        label: bundled('IBM Plex Sans', 500, FONTS),
        figure: bundled('Jost', 500, FONTS),
        annotation: bundled('IBM Plex Sans', 400, FONTS),
      },
      display: bundled('Jost', 500, FONTS),
      reading: bundled('IBM Plex Sans', 400, FONTS),
      label: bundled('IBM Plex Sans', 500, FONTS),
      figure: bundled('Jost', 500, FONTS),
      annotation: bundled('IBM Plex Sans', 400, FONTS),
      weights: { display: 500, reading: 400, label: 500, figure: 500, annotation: 400 },
      sizesByFormat: { web: 'Display 72–128px, body 16–18px, labels 11px', slide: 'Display 96–140px, body 20–24px, labels 12–16px', gif: 'Display ≥40px at 640×360, body ≥18px, labels ≥12px' },
      leading: 'Display .95, body 1.65, labels 1.2.',
      readingWidth: 'Body 55–62ch on web; 40–48ch on slides; 24–32ch on GIF.',
      displayUsage: 'Tabular numerals as visual anchor; Jost drawn not branded; never rounded icon packs.',
      explicitFallback: 'Approved glyph fallbacks: Archivo Black/EB Garamond/Space Mono (src/narrative/fonts.ts).',
    },
    color: {
      surfaces: ['#F2EBDD', '#E7DFC9'],
      text: '#1C1C1C',
      accents: ['#B53328', '#2A7F7A', '#D9A441', '#8C8C8C'],
      semanticStates: { ok: '#2A7F7A', warn: '#D9A441', problem: '#B53328', neutral: '#8C8C8C' },
      contrastNotes: 'Cream paper, black ink; red marks one quantity never decoration; no gradients/shadows.',
    },
    materiality: {
      borders: '1–3px solid rules; grid visible; no shadow.',
      shadows: 'No shadow; grid and pictograms do the work.',
      grain: 'Paper print feel via rules, not texture.',
      cutouts: 'Hand-cut silhouettes, one pictogram family per row.',
      depth: 'Flat printed page.',
      readabilityRule: 'One pictogram = one unit; never invent quantities; state unit, denominator, source.',
    },
    illustration: {
      vocabulary: ['person', 'house', 'tree', 'factory', 'book', 'water drop', 'flat silhouettes'],
      rulesForEntities: 'Entities as consistent silhouettes on the grid; no isometric 3D or rounded icon packs.',
      rulesForRelations: 'Relation through counting rows and grids; one silhouette per concept.',
      rulesForActions: 'Actions as counts and comparisons; numbers tick once on reveal.',
    },
    motion: {
      entries: 'Count 350ms, 10px rise, stagger 50ms; bars grow 400ms from zero.',
      transformations: 'Counters tick once; no looping animation.',
      continuity: 'Page 500ms; information arrives once and stays.',
      restDuringReading: 'Cifras finales without counting; reduced motion shows final number.',
    },
    negativeRules: [
      'No rounded cards.',
      'No drop shadows.',
      'No more than two pictogram families.',
      'No fake statistics.',
      'Do not turn every number into a card.',
    ],
    adaptation: {
      web: adapt('Visible grid, pictogram rows, tables, one red quantity; data-driven asymmetry.', 'examples/showcase/isotype/index.html'),
      slides: adapt('Counting slides with visible grid, pictogram rows, tables; one red number anchor.', 'examples/agile/sprint-15-planning.html'),
      gif: adapt('Counters tick once, bars grow; no looping; reduced motion final numbers.', 'examples/gifs/showcase-isotype.gif'),
    },
  },

  opart: {
    intent: {
      personality: 'Perception as argument: optical rhythm in delimited zones, stable reading.',
      suitableFor: ['perception', 'geometry', 'physics', 'music posters', 'experimental education'],
      limits: ['long reading', 'formal finance', 'accessibility-critical content without static fallback'],
    },
    composition: {
      grid: 'Full-bleed pattern behind/beside type; alternating dense and empty bands; visible grid slightly wrong.',
      allowedAsymmetry: 'One rotated element max; pattern a sangre with empty bands.',
      scale: 'Display 82–150px against 16–18px body; ≥5x jump.',
      emptySpace: 'Deliberate empty bands every second screen to rest the eye.',
      alignment: 'Hard geometric alignment; pattern and type collide intentionally.',
      density: 'Medium; pattern is the third voice; no more than two weights.',
    },
    typography: {
      families: {
        display: bundled('Archivo Black', 400, FONTS),
        reading: bundled('Space Grotesk', 400, FONTS),
        label: bundled('Space Grotesk', 500, FONTS),
        figure: bundled('Archivo Black', 400, FONTS),
        annotation: bundled('Space Grotesk', 400, FONTS),
      },
      display: bundled('Archivo Black', 400, FONTS),
      reading: bundled('Space Grotesk', 400, FONTS),
      label: bundled('Space Grotesk', 500, FONTS),
      figure: bundled('Archivo Black', 400, FONTS),
      annotation: bundled('Space Grotesk', 400, FONTS),
      weights: { display: 400, reading: 400, label: 500, figure: 400, annotation: 400 },
      sizesByFormat: { web: 'Display 82–150px uppercase, body 16–18px, labels 11px', slide: 'Display 96–140px, body 20–24px, labels 12–16px', gif: 'Display ≥40px at 640×360, body ≥18px, labels ≥12px' },
      leading: 'Display .82, body 1.6, labels 1.2.',
      readingWidth: 'Body 50–60ch on web; 38–46ch on slides; 24–32ch on GIF.',
      displayUsage: 'Uppercase, one displaced glyph, not whole title; pattern never behind paragraphs.',
      explicitFallback: 'Approved glyph fallbacks: Archivo Black/EB Garamond/Space Mono (src/narrative/fonts.ts).',
    },
    color: {
      surfaces: ['#0A0A0A', '#F7F7F2'],
      text: '#F7F7F2',
      accents: ['#E03C31', '#1F4FD8', '#E8FF3A'],
      semanticStates: { ok: '#E8FF3A', warn: '#1F4FD8', problem: '#E03C31', neutral: '#9A9A9A' },
      contrastNotes: 'Black/bone pattern; red warning; blue/acid one band each; never together in gradient; static fallback.',
    },
    materiality: {
      borders: '1–3px solid; no radius; no shadow; contrast and repetition create depth.',
      shadows: 'No shadow.',
      grain: 'None; optical pattern instead.',
      cutouts: 'Concentric rings, warped grids, checkerboards, interference lines.',
      depth: 'Flat; moiré follows pointer at 0.04 damping and can freeze.',
      readabilityRule: 'Pattern only in delimited zones; never stripes behind text; max 3 Hz; reading stable.',
    },
    illustration: {
      vocabulary: ['concentric rings', 'warped grids', 'checkerboards', 'interference lines', 'rotated elements'],
      rulesForEntities: 'Entities as geometric pattern modules; one rotated element enough.',
      rulesForRelations: 'Relation through interference and alignment; causal state must be explicit.',
      rulesForActions: 'Actions as state changes in pattern; reading layer stays still.',
    },
    motion: {
      entries: 'Hard cut 200ms, 0px distance, stagger 30ms.',
      transformations: 'Moiré follows pointer; toggle freezes; reduced motion static pattern.',
      continuity: 'Page 200ms; hard cuts; no strobe.',
      restDuringReading: 'Pattern freezes during reading; one static state; no autonomous moiré.',
    },
    negativeRules: [
      'No stripes behind text.',
      'No continuous optical movement during reading.',
      'No effects that hide what changed.',
      'No strobing above 3 Hz.',
      'No pattern without a pause.',
    ],
    adaptation: {
      web: adapt('Pattern in delimited zones, alternating dense/empty bands, hard cuts; static fallback.', 'examples/showcase/opart/index.html'),
      slides: adapt('Hard-cut slides, pattern only in zones, stable reading, one rotated element max.', 'examples/agents/round-2026/opart.html'),
      gif: adapt('Hard cuts, static frames, pointer-independent stills; no strobing.', 'examples/gifs/showcase-opart.gif'),
    },
  },

  ukiyoe: {
    intent: {
      personality: 'A printed landscape: flat colour planes, low horizon, Prussian blue and vermilion seal.',
      suitableFor: ['oceanography', 'Japanese history', 'poetry', 'climate', 'art history'],
      limits: ['fast product launches', 'dense dashboards', 'ironic memes'],
    },
    composition: {
      grid: 'Low horizon, large negative sky; title in vertical cartouche on one side, body opposite; flat overlapping bands.',
      allowedAsymmetry: 'Cartouche left or right; body opposite; one vermilion seal.',
      scale: 'Display 62–112px against 16–18px body; ≥4x jump.',
      emptySpace: 'Large sky negative space; print-cropped feel.',
      alignment: 'Flat planes overlap like printed layers; vertical rhythm.',
      density: 'Medium-low: one observed detail and consequence.',
    },
    typography: {
      families: {
        display: bundled('Shippori Mincho B1', 700, FONTS),
        reading: bundled('Zen Kaku Gothic New', 400, FONTS),
        label: bundled('Zen Kaku Gothic New', 500, FONTS),
        figure: bundled('Shippori Mincho B1', 700, FONTS),
        annotation: bundled('Zen Kaku Gothic New', 400, FONTS),
      },
      display: bundled('Shippori Mincho B1', 700, FONTS),
      reading: bundled('Zen Kaku Gothic New', 400, FONTS),
      label: bundled('Zen Kaku Gothic New', 500, FONTS),
      figure: bundled('Shippori Mincho B1', 700, FONTS),
      annotation: bundled('Zen Kaku Gothic New', 400, FONTS),
      weights: { display: 700, reading: 400, label: 500, figure: 700, annotation: 400 },
      sizesByFormat: { web: 'Display 62–112px, body 16–18px, labels 11px', slide: 'Display 96–140px, body 20–24px, labels 12–16px', gif: 'Display ≥40px at 640×360, body ≥18px, labels ≥12px' },
      leading: 'Display 1.02, body 1.75, labels 1.2.',
      readingWidth: 'Body 55–62ch on web; 40–48ch on slides; 24–32ch on GIF.',
      displayUsage: 'Vertical cartouche allowed; palt only in Japanese; Latin subset only, no CJK rendering.',
      explicitFallback: 'Approved glyph fallbacks: EB Garamond/Space Mono (src/narrative/fonts.ts); Latin subsets only.',
    },
    color: {
      surfaces: ['#F3E9D2', '#DCE6E3'],
      text: '#22201D',
      accents: ['#1B3A5C', '#BC3C27', '#5B7C99', '#6E7F5C'],
      semanticStates: { ok: '#6E7F5C', warn: '#5B7C99', problem: '#BC3C27', neutral: '#DCE6E3' },
      contrastNotes: 'Washi 55%; Prussian sea/type; vermilion seal and one accent; no gold/neon/pure white; flat planes.',
    },
    materiality: {
      borders: '1–2px; no shadow; paper and ink flat.',
      shadows: 'No shadow.',
      grain: 'Washi grain and misregistration welcome.',
      cutouts: 'Wave planes, foam claws, distant mountain, boat, crane.',
      depth: 'Flat printed layers; no 3D or drop shadows.',
      readabilityRule: 'Body 16–18/1.75; cartela vertical breve; no faux-Japanese lettering.',
    },
    illustration: {
      vocabulary: ['waves', 'foam', 'distant mountain', 'boat', 'crane', 'vermilion seal', 'flat planes'],
      rulesForEntities: 'Entities as flat colour planes; no outlines-only clip art; no cherry blossom.',
      rulesForRelations: 'Relation through overlapping printed layers and horizon.',
      rulesForActions: 'Actions as named coast, season, date; no exotization.',
    },
    motion: {
      entries: 'Rise 1.0s, 14px, stagger 90ms.',
      transformations: 'Waves drift 8–16px on scroll; foam appears once; seal breathes opacity 0.9→1 over 6s.',
      continuity: 'Page 1.2s; waves drift, paper stays still.',
      restDuringReading: 'Reduced motion: flat waves, no drift; nothing digital.',
    },
    negativeRules: [
      'No cherry-blossom clip art.',
      'No faux-Japanese lettering.',
      'No rounded corners or 3D/drop shadows.',
      'No applying waves and sun identically to every story.',
      'Do not use Japan as decoration.',
    ],
    adaptation: {
      web: adapt('Low horizon, large sky, vertical cartouche, flat wave planes, vermilion seal.', 'examples/showcase/ukiyoe/index.html'),
      slides: adapt('Printed-landscape slides, cartouche title, flat planes, low horizon.', 'examples/agents/round-2026/ukiyoe.html'),
      gif: adapt('Wave drift, foam once, seal breathes; paper stays still.', 'examples/gifs/showcase-ukiyoe.gif'),
    },
  },

  bestiary: {
    intent: {
      personality: 'A field-guide manuscript: parchment, iron-gall ink, illuminated initial, creature that watches back.',
      suitableFor: ['biology and taxonomy', 'fable and literature', 'mythology', 'natural history', 'slow essays'],
      limits: ['sports', 'SaaS', 'breaking news'],
    },
    composition: {
      grid: 'Two columns with wide gutter and generous lower margin; illuminated initial breaks first column; marginalia outside.',
      allowedAsymmetry: 'Marginalia rotated 90° only if short; one creature anchor.',
      scale: 'Display 54–94px against 18–21px body; drop cap 4 lines.',
      emptySpace: 'Generous lower margin; parchment breathes.',
      alignment: 'Manuscript columns; 1px ink rules; small corner fleurons.',
      density: 'Medium: observation before metaphor; one initial.',
    },
    typography: {
      families: {
        display: bundled('UnifrakturMaguntia', 400, FONTS),
        reading: bundled('IM Fell English', 400, FONTS),
        label: bundled('IM Fell English', 400, FONTS),
        figure: bundled('UnifrakturMaguntia', 400, FONTS),
        annotation: bundled('IM Fell English', 400, FONTS),
      },
      display: bundled('UnifrakturMaguntia', 400, FONTS),
      reading: bundled('IM Fell English', 400, FONTS),
      label: bundled('IM Fell English', 400, FONTS),
      figure: bundled('UnifrakturMaguntia', 400, FONTS),
      annotation: bundled('IM Fell English', 400, FONTS),
      weights: { display: 400, reading: 400, label: 400, figure: 400, annotation: 400 },
      sizesByFormat: { web: 'Display 54–94px, body 18–21px, labels 12px', slide: 'Display 96–140px, body 20–24px, labels 12–16px', gif: 'Display ≥40px at 640×360, body ≥18px, labels ≥12px' },
      leading: 'Display 1, body 1.7, labels 1.2; blackletter display only.',
      readingWidth: 'Body 55–62ch on web; 40–48ch on slides; 24–32ch on GIF.',
      displayUsage: 'Sentence case, never body copy; drop caps 4 lines in lapis/vermilion with gold rule.',
      explicitFallback: 'Approved glyph fallbacks: EB Garamond/Space Mono (src/narrative/fonts.ts).',
    },
    color: {
      surfaces: ['#E8D9B8', '#F2E6C9'],
      text: '#2B2118',
      accents: ['#C9A227', '#A63A2B', '#2E4A7D', '#4E7A63'],
      semanticStates: { ok: '#4E7A63', warn: '#C9A227', problem: '#A63A2B', neutral: '#2E4A7D' },
      contrastNotes: 'Parchment page, iron-gall text; lapis ≤10%; gold flat leaf not gradient; no white/neon.',
    },
    materiality: {
      borders: '1–2px ink rules; corner fleurons; no thick borders; no shadow.',
      shadows: 'No shadow; manuscript flat.',
      grain: 'CSS grain, not photo; no photographic texture.',
      cutouts: 'Illuminated initial, creature silhouette, botanical border, gold sun.',
      depth: 'Flat manuscript.',
      readabilityRule: 'Blackletter display only; body 18–21/1.7; one initial, not whole paragraph.',
    },
    illustration: {
      vocabulary: ['hare-headed bird', 'two-tailed fox', 'botanical border', 'gold sun', 'marginalia', 'red rubric'],
      rulesForEntities: 'Entities as hand-drawn silhouettes with anatomy/habitat/behaviour; mark invented as hypothesis.',
      rulesForRelations: 'Relation through marginal notes and two-column grid.',
      rulesForActions: 'Actions as observed traits; marginal translation, not replacement.',
    },
    motion: {
      entries: 'Illuminate 800ms, 12px rise, stagger 80ms.',
      transformations: 'Creature blinks every 7s; gold glints once on reveal; marginal note reveals translation on hover.',
      continuity: 'Page 1.0s; one blink/glint/translation.',
      restDuringReading: 'Manuscript otherwise still; reduced motion freezes eye/glint.',
    },
    negativeRules: [
      'No blackletter body copy.',
      'No glossy gradients.',
      'No modern sans-serif.',
      'No generic fantasy dragons.',
      'Do not call any dark dragon a bestiary.',
    ],
    adaptation: {
      web: adapt('Two-column manuscript, illuminated initial, marginalia, creature anchor.', 'examples/showcase/bestiary/index.html'),
      slides: adapt('Manuscript slides with initial, marginalia, creature; two-column grid.', 'examples/agents/round-2026/bestiary.html'),
      gif: adapt('Blink every 7s, glint once; otherwise still.', 'examples/gifs/showcase-bestiary.gif'),
    },
  },

  psychedelic: {
    intent: {
      personality: 'An expansive poster: liquid colour, rhythm and shock while subject stays recognisable.',
      suitableFor: ['music', 'biology', 'chemistry', 'festivals', 'consciousness'],
      limits: ['legal', 'medical instructions', 'conservative finance'],
    },
    composition: {
      grid: 'All-over composition: blobs, rings and type overlap; one quiet corner for CTA; poster panels with thick keylines.',
      allowedAsymmetry: 'Rotated 3° on one word; off-centre blobs; crop can cut a shape.',
      scale: 'Display 68–120px against 16–18px body; ≥4x jump.',
      emptySpace: 'One quiet corner reserved for CTA; otherwise dense.',
      alignment: 'Overlapping, not centred; poster fold allowed.',
      density: 'High visual density; body stays flat colour, never inside gradient.',
    },
    typography: {
      families: {
        display: bundled('Bungee Shade', 400, FONTS),
        reading: bundled('Space Grotesk', 400, FONTS),
        label: bundled('Space Grotesk', 500, FONTS),
        figure: bundled('Bungee Shade', 400, FONTS),
        annotation: bundled('Space Grotesk', 400, FONTS),
      },
      display: bundled('Bungee Shade', 400, FONTS),
      reading: bundled('Space Grotesk', 400, FONTS),
      label: bundled('Space Grotesk', 500, FONTS),
      figure: bundled('Bungee Shade', 400, FONTS),
      annotation: bundled('Space Grotesk', 400, FONTS),
      weights: { display: 400, reading: 400, label: 500, figure: 400, annotation: 400 },
      sizesByFormat: { web: 'Display 68–120px uppercase, body 16–18px, labels 11px', slide: 'Display 96–140px, body 20–24px, labels 12–16px', gif: 'Display ≥40px at 640×360, body ≥18px, labels ≥12px' },
      leading: 'Display .88, body 1.6, labels 1.2.',
      readingWidth: 'Body 50–60ch on web; 38–46ch on slides; 24–32ch on GIF.',
      displayUsage: 'Already decorative; no second display face; one word curved/rotated 3°; body flat colour.',
      explicitFallback: 'Approved glyph fallbacks: Archivo Black/EB Garamond/Space Mono (src/narrative/fonts.ts).',
    },
    color: {
      surfaces: ['#1B1B3A', '#2A1A5E'],
      text: '#F7E8C8',
      accents: ['#C7166E', '#FF6B1A', '#F5E13B', '#00A6A6'],
      semanticStates: { ok: '#00A6A6', warn: '#F5E13B', problem: '#C7166E', neutral: '#B9A7FF' },
      contrastNotes: 'Night ground; magenta/orange hot pair; acid single hit; gradients only inside blobs; type on flat colour.',
    },
    materiality: {
      borders: '0–4px; thick black keylines on poster panels; hard offset shadows magenta/orange allowed.',
      shadows: 'Hard offset in magenta/orange; no soft grey shadows.',
      grain: 'None specified; colour fields.',
      cutouts: 'Liquid blobs, concentric rings, sun with face, abstract cells/eyes.',
      depth: 'Blobs drift 20–40px over 9s; hover expands 4%; reduced motion freezes.',
      readabilityRule: 'Body flat colour; no illegible body; no strobing above 3 Hz; max three hot colours.',
    },
    illustration: {
      vocabulary: ['liquid blobs', 'concentric rings', 'sun with face', 'abstract cells', 'eyes', 'hard offset'],
      rulesForEntities: 'Entities as liquid blobs and rings; no stock psychedelic art or AI glow.',
      rulesForRelations: 'Relation through overlap and colour temperature.',
      rulesForActions: 'Actions as sensory verbs and plain explanations; CTA in quiet corner.',
    },
    motion: {
      entries: 'Swirl 550ms, 18px rise, stagger 60ms.',
      transformations: 'Blobs drift 20–40px over 9s; hover expands 4%; reduced motion freezes blobs.',
      continuity: 'Page 800ms; blobs drift like heat.',
      restDuringReading: 'Type stays readable; manchas fijas in reduced motion.',
    },
    negativeRules: [
      'No soft shadows.',
      'No more than three hot colours.',
      'No illegible body copy.',
      'No strobing above 3 Hz.',
      'Do not distort paragraphs.',
    ],
    adaptation: {
      web: adapt('All-over poster composition with liquid blobs, rings, type overlap, quiet CTA corner.', 'examples/showcase/psychedelic/index.html'),
      slides: adapt('Poster slides with thick keylines, hard offsets, one quiet CTA corner.', 'examples/agents/round-2026/psychedelic.html'),
      gif: adapt('Blobs drift 20–40px over 9s; reduced motion freezes; short transitions.', 'examples/gifs/showcase-psychedelic.gif'),
    },
  },

  memphis: {
    intent: {
      personality: 'Postmodern play with a straight face: squiggles, terrazzo, cobalt/pink, black keyline.',
      suitableFor: ['design history', 'music', 'workshops', 'creative education', 'events'],
      limits: ['hospitals', 'luxury', 'solemn memorials'],
    },
    composition: {
      grid: 'Asymmetrical, rotated 1–4°, overlapping; 3px black keyline keeps chaos legible; cards different widths.',
      allowedAsymmetry: 'Rotated cards, overlapping shapes, one giant squiggle and one terrazzo field.',
      scale: 'Display 72–128px against 16–18px body; ≥4x jump.',
      emptySpace: 'Moderate: bone table with scattered shapes.',
      alignment: 'Grid is a suggestion; do not align everything.',
      density: 'Medium: one dry observation under playful title.',
    },
    typography: {
      families: {
        display: bundled('Bricolage Grotesque', 700, FONTS),
        reading: bundled('DM Sans', 400, FONTS),
        label: bundled('DM Sans', 500, FONTS),
        figure: bundled('Bricolage Grotesque', 700, FONTS),
        annotation: bundled('DM Sans', 400, FONTS),
      },
      display: bundled('Bricolage Grotesque', 700, FONTS),
      reading: bundled('DM Sans', 400, FONTS),
      label: bundled('DM Sans', 500, FONTS),
      figure: bundled('Bricolage Grotesque', 700, FONTS),
      annotation: bundled('DM Sans', 400, FONTS),
      weights: { display: 700, reading: 400, label: 500, figure: 700, annotation: 400 },
      sizesByFormat: { web: 'Display 72–128px, body 16–18px, labels 11px', slide: 'Display 96–140px, body 20–24px, labels 12–16px', gif: 'Display ≥40px at 640×360, body ≥18px, labels ≥12px' },
      leading: 'Display .92, body 1.6, labels 1.2.',
      readingWidth: 'Body 50–60ch on web; 38–46ch on slides; 24–32ch on GIF.',
      displayUsage: 'One word on pink highlight; do not rainbow headline; tracking open on display.',
      explicitFallback: 'Approved glyph fallbacks: Archivo Black/EB Garamond/Space Mono (src/narrative/fonts.ts).',
    },
    color: {
      surfaces: ['#F5F0E6', '#FFFFFF'],
      text: '#111111',
      accents: ['#F2A6B3', '#9FD8C8', '#2E4FD8', '#F4D35E'],
      semanticStates: { ok: '#9FD8C8', warn: '#F4D35E', problem: '#F2A6B3', neutral: '#B9A7E0' },
      contrastNotes: 'Bone table; black keyline; flat shapes; no gradients/soft shadows; max five accents.',
    },
    materiality: {
      borders: '1–3px solid black keylines; radius 0–48px.',
      shadows: 'Hard black offset 6px 6px 0 (hover 8px); no soft blur.',
      grain: 'Terrazzo chips, not photo grain.',
      cutouts: 'Squiggles, terrazzo, checkerboard, wavy vase, star.',
      depth: 'Scatter with 300ms transform; squiggles draw 700ms.',
      readabilityRule: 'Keyline keeps chaos legible; body 16–18/1.6; no soft shadows.',
    },
    illustration: {
      vocabulary: ['squiggles', 'terrazzo chips', 'checkerboard', 'wavy vase', 'star', 'rotated cards'],
      rulesForEntities: 'Entities as postmodern shapes; no Memphis Group scans; draw vocabulary.',
      rulesForRelations: 'Relation through rotation/overlap; keyline holds hierarchy.',
      rulesForActions: 'Actions as dry precise observation under playful title; one shuffle per visit.',
    },
    motion: {
      entries: 'Scatter 300ms, 16px, stagger 45ms.',
      transformations: 'Shuffle rescatters shapes; squiggles draw 700ms; hover lifts 4px and shadow 8px.',
      continuity: 'Page 500ms; shapes land hard stop.',
      restDuringReading: 'Reduced motion places pieces; ambient only Revolver button.',
    },
    negativeRules: [
      'No soft shadows.',
      'No rounded sans-only look without keyline.',
      'No more than five accents.',
      'No aligning everything.',
      'Do not use squiggles as confetti.',
    ],
    adaptation: {
      web: adapt('Rotated cards, terrazzo field, giant squiggle, hard shadows, keylines.', 'examples/showcase/memphis/index.html'),
      slides: adapt('Memphis slides with rotated cards, terrazzo, hard shadows, keylines.', 'examples/agile/sprint-14-retro.html'),
      gif: adapt('Shuffle 300ms, hard stops, squiggle draw; reduced motion placed.', 'examples/gifs/showcase-memphis.gif'),
    },
  },

  vaporwave: {
    intent: {
      personality: 'A remembered desktop from 1999: violet dusk, chrome type, perspective grid.',
      suitableFor: ['internet history', 'media studies', 'music', 'digital culture', 'nostalgia'],
      limits: ['serious policy', 'health', 'legal'],
    },
    composition: {
      grid: 'Fake OS window with title bar, three buttons, status bar; page is desktop; perspective grid lower third; sun on horizon.',
      allowedAsymmetry: 'Window not exactly centred; grid and sun in lower third.',
      scale: 'Display 28–56px (pixel face) against 16–18px body; ≥2x jump but pixel face short lines.',
      emptySpace: 'Violet desktop margins; grid to horizon.',
      alignment: 'Windowed UI; cards are file windows/tiles.',
      density: 'Medium: body clean, pixel display reserved for small uses.',
    },
    typography: {
      families: {
        display: bundled('Press Start 2P', 400, FONTS),
        reading: bundled('Space Grotesk', 400, FONTS),
        label: bundled('Space Grotesk', 500, FONTS),
        figure: bundled('Press Start 2P', 400, FONTS),
        annotation: bundled('Space Grotesk', 400, FONTS),
      },
      display: bundled('Press Start 2P', 400, FONTS),
      reading: bundled('Space Grotesk', 400, FONTS),
      label: bundled('Space Grotesk', 500, FONTS),
      figure: bundled('Press Start 2P', 400, FONTS),
      annotation: bundled('Space Grotesk', 400, FONTS),
      weights: { display: 400, reading: 400, label: 500, figure: 400, annotation: 400 },
      sizesByFormat: { web: 'Display 28–56px uppercase, body 16–18px, labels 10px', slide: 'Display 40–72px, body 20–24px, labels 12–16px', gif: 'Display ≥24px at 640×360, body ≥18px, labels ≥12px' },
      leading: 'Display 1.35, body 1.65–1.7, labels 1.2.',
      readingWidth: 'Body 50–60ch on web; 38–46ch on slides; 24–32ch on GIF.',
      displayUsage: 'Pixel face only small display lines; never pixel paragraphs; chrome gradient on title only.',
      explicitFallback: 'Approved glyph fallbacks: Space Mono/EB Garamond (src/narrative/fonts.ts).',
    },
    color: {
      surfaces: ['#1B1035', '#2B3A8F'],
      text: '#FFFFFF',
      accents: ['#FF4FA3', '#4FE3E3', '#C9D1D9', '#FFD6F2'],
      semanticStates: { ok: '#4FE3E3', warn: '#FFD6F2', problem: '#FF4FA3', neutral: '#C9D1D9' },
      contrastNotes: 'Violet desktop; blue title bar; gradients only in sky/chrome; body text white/lavender; no glow excess.',
    },
    materiality: {
      borders: '1–3px; chrome bevels; 2px hard inset edges; no soft ambient shadow.',
      shadows: 'Chrome bevels and inset edges; no soft shadow.',
      grain: 'Pixel grid; no photo grain.',
      cutouts: 'chrome gradient, perspective grid, striped sun, window chrome, pixel cursor, floppy disk',
      depth: 'Grid scrolls slowly; sun stripes drift; window draggable; glitch 120ms RGB split on hover.',
      readabilityRule: 'Pixel reserved for display; body clean; no paragraphs pixelated; no flashing above 3 Hz.',
    },
    illustration: {
      vocabulary: ['chrome gradient', 'perspective grid', 'striped sun', 'window chrome', 'pixel cursor', 'floppy disk'],
      rulesForEntities: 'Entities as UI windows/tiles; no lifted OS screenshots.',
      rulesForRelations: 'Relation through windowed interface and grid.',
      rulesForActions: 'Actions as artefact, year, gesture of use; nostalgia tactile not neon.',
    },
    motion: {
      entries: 'Glitch 350ms, 8px, stagger 50ms.',
      transformations: 'Grid scrolls; sun stripes drift; window draggable; glitch 120ms RGB split on hover.',
      continuity: 'Page 600ms; desktop breathes; glitch short event not loop.',
      restDuringReading: 'Reduced motion: quiet window; grid/sun paused.',
    },
    negativeRules: [
      'No full paragraphs pixelated.',
      'No excess glow.',
      'No interface that obscures the product.',
      'No fake OS without history.',
      'No flashing above 3 Hz.',
    ],
    adaptation: {
      web: adapt('Fake OS window, title bar, perspective grid, striped sun, chrome title.', 'examples/showcase/vaporwave/index.html'),
      slides: adapt('Windowed slides, perspective grid, chrome title, clean body.', 'examples/agents/round-2026/vaporwave.html'),
      gif: adapt('Grid scroll, sun stripes drift, glitch 120ms; reduced motion still.', 'examples/gifs/showcase-vaporwave.gif'),
    },
  },

  galactic: {
    intent: {
      personality: 'An intimate planetarium: deep space, slow orbits, chrome ivory, one planet.',
      suitableFor: ['music rooms', 'space and astronomy', 'memory and technology', 'film essays', 'album tributes'],
      limits: ['fast commerce', 'children’s worksheets', 'cluttered dashboards'],
    },
    composition: {
      grid: 'Asymmetric: copy one side, planet bleeding off the other; one planet, three orbits; generous negative space.',
      allowedAsymmetry: 'Copy vs. planet sides; orbital ellipses; one chrome word.',
      scale: 'Display 42–92px (wide face) against 16–18px body; ≥3x jump; headlines short.',
      emptySpace: 'Generous: negative space is the luxury; void black 70%.',
      alignment: 'Orbital lines, 1px cyan rules, technical labels.',
      density: 'Low-medium: one remembered detail, one measured fact; room for audio.',
    },
    typography: {
      families: {
        display: bundled('Michroma', 400, FONTS),
        reading: bundled('Space Grotesk', 400, FONTS),
        label: bundled('Space Grotesk', 500, FONTS),
        figure: bundled('Michroma', 400, FONTS),
        annotation: bundled('Space Grotesk', 400, FONTS),
      },
      display: bundled('Michroma', 400, FONTS),
      reading: bundled('Space Grotesk', 400, FONTS),
      label: bundled('Space Grotesk', 500, FONTS),
      figure: bundled('Michroma', 400, FONTS),
      annotation: bundled('Space Grotesk', 400, FONTS),
      weights: { display: 400, reading: 400, label: 500, figure: 400, annotation: 400 },
      sizesByFormat: { web: 'Display 42–92px uppercase tracked .1em, body 16–18px, labels 10px', slide: 'Display 64–104px, body 20–24px, labels 12–16px', gif: 'Display ≥36px at 640×360, body ≥18px, labels ≥12px' },
      leading: 'Display 1.08, body 1.7, labels 1.2.',
      readingWidth: 'Body 50–60ch on web; 38–46ch on slides; 24–32ch on GIF.',
      displayUsage: 'Wide face, short headlines; one chrome-gradient word max; never chrome whole headline.',
      explicitFallback: 'Approved glyph fallbacks: Space Mono/EB Garamond (src/narrative/fonts.ts).',
    },
    color: {
      surfaces: ['#05060A', '#0D1020'],
      text: '#F2F4FF',
      accents: ['#79E8FF', '#B388FF', '#F5C86B', '#FF6FAE'],
      semanticStates: { ok: '#79E8FF', warn: '#F5C86B', problem: '#FF6FAE', neutral: '#9BA6C4' },
      contrastNotes: 'Void 70%; chrome ivory text; cyan line/rim not fill; no rainbow nebula; space mostly black.',
    },
    materiality: {
      borders: '1–2px cyan rules; instrument panels; no box shadow.',
      shadows: 'No box shadow; depth from starfield, orbital lines, black space.',
      grain: 'Single grain layer keeps black from feeling flat.',
      cutouts: 'ringed planet, orbital ellipses, small moon, starfield',
      depth: 'Orbits 40–80s; planet breathes 4px; stars twinkle 6s; no warp speed.',
      readabilityRule: 'Audio user-initiated; no autoplay; text layer anchored during ambient motion.',
    },
    illustration: {
      vocabulary: ['ringed planet', 'orbital ellipses', 'small moon', 'starfield', '1px cyan rules'],
      rulesForEntities: 'Entities as orbital diagrams; no NASA photos, ships, lens flares.',
      rulesForRelations: 'Relation through orbits and distance.',
      rulesForActions: 'Actions as remembered detail + measured fact; leave space for audio.',
    },
    motion: {
      entries: 'Orbit 800ms, 14px rise, stagger 80ms.',
      transformations: 'Orbits 40–80s; planet breathes 4px; stars twinkle 6s; reduced motion static sky.',
      continuity: 'Page 1.1s; reading layer anchored.',
      restDuringReading: 'Ambient slow; no warp speed; audio explicit.',
    },
    negativeRules: [
      'No rounded cards.',
      'No neon rainbow.',
      'No autoplay audio.',
      'No sci-fi logos or fake alien alphabets.',
      'Do not pile nebula/stars/chrome.',
    ],
    adaptation: {
      web: adapt('Copy one side, planet bleeding other, three orbits, generous negative space.', 'examples/showcase/galactic/index.html'),
      slides: adapt('Planetarium slides with orbital diagrams, 1px rules, audio explicit.', 'examples/decks/atlas-memoria.html'),
      gif: adapt('Slow orbit 48–62s, planet breathes 4px, static reading layer.', 'examples/gifs/showcase-galactic.gif'),
    },
  },

  nature: {
    intent: {
      personality: 'A herbarium archive: pressed specimens, field notes, growth rings, patient and exact.',
      suitableFor: ['botanical gardens', 'museums and archives', 'slow editorial', 'nature education', 'memory projects', 'seed libraries'],
      limits: ['nightlife', 'fast commerce', 'dense dashboards', 'ironic youth brands'],
    },
    composition: {
      grid: 'Asymmetric field sheet: copy one side, specimen plate other; plate can bleed; sections are drawers not cards.',
      allowedAsymmetry: 'Plate bleeds one edge; vertical herbarium label; seasonal bands.',
      scale: 'Display 64–132px against 18–20px body; ≥4x jump.',
      emptySpace: 'Moderate: paper margins; specimen plate large.',
      alignment: 'Field sheet with visible label: date, place, collector, source.',
      density: 'Medium-low: observation before metaphor; no five tiny cards on mobile.',
    },
    typography: {
      families: {
        display: bundled('Cormorant Garamond', 400, FONTS),
        reading: bundled('Karla', 400, FONTS),
        label: bundled('Karla', 600, FONTS),
        figure: bundled('Cormorant Garamond', 400, FONTS),
        annotation: bundled('Karla', 400, FONTS),
      },
      display: bundled('Cormorant Garamond', 400, FONTS),
      reading: bundled('Karla', 400, FONTS),
      label: bundled('Karla', 600, FONTS),
      figure: bundled('Cormorant Garamond', 400, FONTS),
      annotation: bundled('Karla', 400, FONTS),
      weights: { display: 400, reading: 400, label: 600, figure: 400, annotation: 400 },
      sizesByFormat: { web: 'Display 64–132px, body 18–20px, labels 10–11px', slide: 'Display 96–140px, body 20–24px, labels 12–16px', gif: 'Display ≥40px at 640×360, body ≥18px, labels ≥12px' },
      leading: 'Display 1.02, body 1.68, labels 1.2.',
      readingWidth: 'Body max 62ch on web; 40–48ch on slides; 24–32ch on GIF.',
      displayUsage: 'Sentence case; italic for field name/single turn, not paragraphs; old-style numerals for dates.',
      explicitFallback: 'Approved glyph fallbacks: EB Garamond/Space Mono (src/narrative/fonts.ts); Nature guide names IBM Plex Mono labels but packaging uses Karla 600/400.',
    },
    color: {
      surfaces: ['#EFE9D8', '#DCE4D2'],
      text: '#243026',
      accents: ['#606E3E', '#B55239', '#4B6B62', '#D8B56A'],
      semanticStates: { ok: '#606E3E', warn: '#D8B56A', problem: '#B55239', neutral: '#4B6B62' },
      contrastNotes: 'Parchment page, lichen field; moss lead; clay one warm event; no gradients faking light; soft botanical shadow.',
    },
    materiality: {
      borders: '1–2px; sections drawers; no hard offset; radius 0–22px.',
      shadows: 'Soft botanical 0 18px 40px rgba(36,48,38,.14); never hard offset.',
      grain: 'Paper texture from grain and thin rules, not global noise.',
      cutouts: 'stems, leaves, seed heads, roots, growth rings, single insect',
      depth: 'Slow botanical 900ms fade + 14px rise; leaf drift 16s; rings draw once.',
      readabilityRule: 'Body 18–20/1.68; no cottagecore clichés; invented specimens marked.',
    },
    illustration: {
      vocabulary: ['stems', 'leaves', 'seed heads', 'roots', 'growth rings', 'single insect', 'field label'],
      rulesForEntities: 'Entities as original botanical SVG with name, place, date or marked unknown.',
      rulesForRelations: 'Relation through field sheet and drawer sections.',
      rulesForActions: 'Actions as observation before metaphor; no fake Latin.',
    },
    motion: {
      entries: 'Rise 900ms, 14px, stagger 80ms.',
      transformations: 'Leaf drift 16s; growth rings draw once; hover underline/2px shift.',
      continuity: 'Page 1.1s; rings grow once; nothing loops faster than a season.',
      restDuringReading: 'Reduced motion shows final state and stops drift; no scaling.',
    },
    negativeRules: [
      'No cottagecore clichés or fake Latin.',
      'No hard offset shadows or neon.',
      'No stock forest/hand photos.',
      'No presenting invented specimen as fact.',
      'No five tiny cards on mobile.',
    ],
    adaptation: {
      web: adapt('Field sheet, specimen plate bleeding, drawer sections, vertical herbarium label.', 'examples/showcase/nature/index.html'),
      slides: adapt('Botanical slides with specimen plate, field label, drawer sections.', 'examples/decks/tea.html'),
      gif: adapt('Leaf drift 16s, rings draw once, slow botanical timing.', 'examples/gifs/showcase-nature.gif'),
    },
  },
};

export function artDirectionMarkdown(slug: StyleSlug): string {
  const ad = ART_DIRECTION[slug];
  const lines: string[] = [];
  lines.push(`# Art direction: ${slug}`);
  lines.push('');
  lines.push('## Intent');
  lines.push(`- Personality: ${ad.intent.personality}`);
  lines.push(`- Suitable for: ${ad.intent.suitableFor.join(', ')}`);
  lines.push(`- Limits: ${ad.intent.limits.join(', ')}`);
  lines.push('');
  lines.push('## Composition');
  lines.push(`- Grid: ${ad.composition.grid}`);
  lines.push(`- Allowed asymmetry: ${ad.composition.allowedAsymmetry}`);
  lines.push(`- Scale: ${ad.composition.scale}`);
  lines.push(`- Empty space: ${ad.composition.emptySpace}`);
  lines.push(`- Alignment: ${ad.composition.alignment}`);
  lines.push(`- Density: ${ad.composition.density}`);
  lines.push('');
  lines.push('## Typography');
  for (const role of ['display', 'reading', 'label', 'figure', 'annotation'] as const) {
    const r = ad.typography.families[role];
    lines.push(`- ${role}: ${r.family} ${r.weight} (${r.status})`);
  }
  lines.push(`- Sizes by format: web=${ad.typography.sizesByFormat.web}; slide=${ad.typography.sizesByFormat.slide}; gif=${ad.typography.sizesByFormat.gif}`);
  lines.push(`- Leading: ${ad.typography.leading}`);
  lines.push(`- Reading width: ${ad.typography.readingWidth}`);
  lines.push(`- Display usage: ${ad.typography.displayUsage}`);
  lines.push(`- Explicit fallback: ${ad.typography.explicitFallback}`);
  lines.push('');
  lines.push('## Color');
  lines.push(`- Surfaces: ${ad.color.surfaces.join(', ')}`);
  lines.push(`- Text: ${ad.color.text}`);
  lines.push(`- Accents: ${ad.color.accents.join(', ')}`);
  lines.push(`- Semantic states: ok=${ad.color.semanticStates.ok}, warn=${ad.color.semanticStates.warn}, problem=${ad.color.semanticStates.problem}, neutral=${ad.color.semanticStates.neutral}`);
  lines.push(`- Contrast notes: ${ad.color.contrastNotes}`);
  lines.push('');
  lines.push('## Materiality');
  lines.push(`- Borders: ${ad.materiality.borders}`);
  lines.push(`- Shadows: ${ad.materiality.shadows}`);
  lines.push(`- Grain: ${ad.materiality.grain}`);
  lines.push(`- Cutouts: ${ad.materiality.cutouts}`);
  lines.push(`- Depth: ${ad.materiality.depth}`);
  lines.push(`- Readability rule: ${ad.materiality.readabilityRule}`);
  lines.push('');
  lines.push('## Illustration');
  lines.push(`- Vocabulary: ${ad.illustration.vocabulary.join(', ')}`);
  lines.push(`- Entities: ${ad.illustration.rulesForEntities}`);
  lines.push(`- Relations: ${ad.illustration.rulesForRelations}`);
  lines.push(`- Actions: ${ad.illustration.rulesForActions}`);
  lines.push('');
  lines.push('## Motion');
  lines.push(`- Entries: ${ad.motion.entries}`);
  lines.push(`- Transformations: ${ad.motion.transformations}`);
  lines.push(`- Continuity: ${ad.motion.continuity}`);
  lines.push(`- Rest during reading: ${ad.motion.restDuringReading}`);
  lines.push('');
  lines.push('## Negative rules');
  for (const r of ad.negativeRules) lines.push(`- ${r}`);
  lines.push('');
  lines.push('## Adaptation');
  lines.push(`- Web: ${ad.adaptation.web.description} (example: ${ad.adaptation.web.example})`);
  lines.push(`- Slides: ${ad.adaptation.slides.description} (example: ${ad.adaptation.slides.example})`);
  lines.push(`- GIF: ${ad.adaptation.gif.description} (example: ${ad.adaptation.gif.example})`);
  if (ad.profiles) {
    lines.push('');
    lines.push('## Papercraft profiles');
    for (const [key, profile] of Object.entries(ad.profiles)) {
      lines.push(`### ${key}: ${profile.name}`);
      lines.push(`- Available: ${profile.available}`);
      lines.push(`- Description: ${profile.description}`);
      for (const [role, font] of Object.entries(profile.families)) {
        if (!font) continue;
        lines.push(`- ${role}: ${font.family} ${font.weight} (available=${font.available})`);
      }
      if (profile.note) lines.push(`- Note: ${profile.note}`);
      if (profile.source) lines.push(`- Source: ${profile.source}`);
      if (profile.license) lines.push(`- License: ${profile.license}`);
    }
  }
  lines.push('');
  return lines.join('\n');
}
