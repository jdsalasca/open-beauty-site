export type StyleSlug =
  | 'renaissance'
  | 'brutalist'
  | 'papercraft'
  | 'artdeco'
  | 'isotype'
  | 'opart'
  | 'ukiyoe'
  | 'bestiary'
  | 'psychedelic'
  | 'memphis'
  | 'vaporwave'
  | 'galactic'
  | 'nature';

export type Locale = 'es' | 'en';

export interface SectionBrief {
  /** Short label above the heading, e.g. "01 — Ritual". */
  kicker?: string;
  title: string;
  body: string;
}

export interface QuoteBrief {
  text: string;
  author?: string;
}

export type SlideLayout = 'statement' | 'points' | 'stats' | 'quote' | 'figure';

export interface DeckPoint {
  title: string;
  body?: string;
}

export interface DeckStat {
  value: string;
  label: string;
}

export interface DeckFigure {
  /** Papercut scene for a figure slide. */
  scene?: StoryScene;
  caption?: string;
  source?: string;
}

export interface DeckSlide {
  layout?: SlideLayout;
  kicker?: string;
  title: string;
  body?: string;
  points?: DeckPoint[];
  stats?: DeckStat[];
  quote?: QuoteBrief;
  figure?: DeckFigure;
}


export type ExperienceKind = 'restaurant' | 'museum' | 'history' | 'studio' | 'club' | 'garden';

export interface ExperienceItem {
  label: string;
  detail?: string;
  value?: string;
}

export interface ExperienceRoom {
  kicker?: string;
  title: string;
  body?: string;
  display?: 'scene' | 'menu' | 'exhibit' | 'timeline' | 'quote' | 'objects';
  items?: ExperienceItem[];
  quote?: QuoteBrief;
  note?: string;
}

export interface ExperienceBrief extends Brief {
  kind?: ExperienceKind;
  rooms?: ExperienceRoom[];
  hours?: string;
  address?: string;
  source?: string;
  closing?: string;
}

export type StorySceneKind = 'meadow' | 'forest' | 'garden' | 'house' | 'river' | 'night' | 'market' | 'room';
export type StoryCharacter = 'rabbit' | 'cat' | 'fox' | 'bird' | 'child';
export type StoryProp = 'pine' | 'tree' | 'house' | 'gate' | 'table' | 'lantern' | 'basket' | 'flowers' | 'boat';

export interface StoryScene {
  kind?: StorySceneKind;
  /** A small cast. The renderer draws paper silhouettes, not character IP. */
  characters?: StoryCharacter[];
  props?: StoryProp[];
  /** Optional exact caption; defaults to a short scene label. */
  caption?: string;
}

export interface StoryChapter {
  kicker?: string;
  title: string;
  body: string;
  quote?: QuoteBrief;
  fact?: string;
  /** Optional papercut scene for the illustrated storybook format. */
  scene?: StoryScene;
}

export interface StoryBrief extends Brief {
  kind?: 'story' | 'history' | 'lesson' | 'essay';
  chapters?: StoryChapter[];
  source?: string;
  readingTime?: string;
  /** `storybook` adds an illustrated page per chapter; `scroll` is the default. */
  format?: 'scroll' | 'storybook';
}

export interface SprintMetric {
  label: string;
  value: string;
}

export interface SprintBrief {
  /** Sprint number or name, e.g. "15" or "Orbital". */
  sprint: string;
  team?: string;
  date?: string;
  style: StyleSlug;
  maxxing?: boolean;
  /** One sentence that opens the review. */
  summary?: string;
  metrics?: SprintMetric[];
  highlights?: string[];
  blockers?: string[];
  next?: string[];
  quote?: QuoteBrief;
  subfamily?: string;
}

export interface DeckBrief extends Brief {
  slides?: DeckSlide[];
  /** Optional closing headline; defaults to a generic door. */
  closing?: string;
}


export interface TypeSystem {
  displayCase: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  displayTracking: string;
  displayLeading: string;
  bodySize: string;
  bodyLeading: string;
  labelTracking: string;
  labelCase: 'uppercase' | 'none';
  features: string;
  wrap: 'balance' | 'pretty';
}

export interface MotionSystem {
  enter: string;
  distance: string;
  stagger: string;
  easing: string;
  page: string;
  reveal: 'rise' | 'cut' | 'settle' | 'curtain' | 'count' | 'glitch' | 'swirl' | 'scatter' | 'orbit' | 'illuminate';
  ambient: 'draw' | 'marquee' | 'float' | 'sun' | 'none' | 'moire' | 'drift' | 'blink' | 'grid' | 'orbit';
  ambientDuration: string;
  hover: 'lift' | 'shift' | 'underline' | 'glow' | 'none';
  note: string;
}

export interface StyleSubfamily {
  slug: string;
  name: string;
  description: string;
  /** Palette role used as the lead accent. */
  accent: 'accent' | 'accent2' | 'accent3' | 'accent4';
  /** Optional palette role used for the slide ground. */
  ground?: 'bg' | 'surface' | 'deep';
  /** Structural mode for decks: default room, cabinet or poster. */
  composition?: 'sala' | 'gabinete' | 'cartel';
}

export interface Brief {
  title: string;
  /** One sentence under the title. */
  tagline?: string;
  /** Longer paragraph used as the manifesto / statement. */
  intro?: string;
  /** Small text above the title. */
  eyebrow?: string;
  /** Brand or studio name in the header. */
  brand?: string;
  /** Up to 6 cards. If omitted, the page renders without a works grid. */
  sections?: SectionBrief[];
  quote?: QuoteBrief;
  /** Optional original audio track, used by the Galactic Futurism style. */
  audio?: {
    src: string;
    title: string;
    subtitle?: string;
    note?: string;
  };
  cta?: { label: string; href: string };
  footer?: string;
  locale?: Locale;
  /** Deterministic ornament variation. */
  seed?: number;
  /** Optional curated subfamily slug; see the style guide. */
  subfamily?: string;
  /** Push art direction, typography and motion to the maximum. */
  maxxing?: boolean;
}

export interface StyleFonts {
  display: string;
  body: string;
  mono: string;
  /** Google Fonts CSS URL. */
  googleHref: string;
}

export interface StylePalette {
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  accent2: string;
  accent3: string;
  accent4: string;
  deep: string;
}

export interface StyleRules {
  /** Allowed border-radius range in px. */
  radius: [number, number];
  /** Allowed border widths in px. */
  borderWidths: number[];
  /** Allowed border styles. */
  borderStyles: string[];
  /** Motion duration range in seconds. */
  motion: [number, number];
  /** Required font-family names. */
  requiredFonts: string[];
  /** Fonts that immediately break the style. */
  forbiddenFonts: string[];
  /** Human-readable shadow rule. */
  shadow: string;
  /** Regex (as string) that a valid shadow declaration should match. */
  shadowPattern: string;
}

export interface StyleGuidance {
  typography: string[];
  color: string[];
  layout: string[];
  motion: string[];
  imagery: string[];
  copy: string[];
  dont: string[];
}

export interface StylePreset {
  slug: StyleSlug;
  name: string;
  epithet: string;
  description: string;
  bestFor: string[];
  avoid: string[];
  palette: StylePalette;
  fonts: StyleFonts;
  rules: StyleRules;
  /** Recognisable moves that make the style readable at a glance. */
  signature: string[];
  guidance: StyleGuidance;
  /** CSS snippets that must appear in generated pages. */
  cssMarkers: string[];
  /** Curated tonal families inside the style. Do not add new hex values. */
  subfamilies?: StyleSubfamily[];
  /** Typography tokens consumed by the shared shell and the style guide. */
  typeSystem?: TypeSystem;
  /** Motion tokens consumed by the shared shell and the style guide. */
  motionSystem?: MotionSystem;
}

export interface ValidationIssue {
  severity: 'error' | 'warn' | 'info';
  code: string;
  message: string;
  fix?: string;
}

export interface VisionCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface VisionReport {
  score: number;
  checks: VisionCheck[];
  note: string;
}

export interface ValidationResult {
  style: StyleSlug;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: ValidationIssue[];
  vision: VisionReport;
  stats: {
    bytes: number;
    colors: number;
    fonts: string[];
    radii: number[];
    durations: number[];
  };
}

export type GifTemplate = 'title' | 'loop' | 'poster';

export interface GifOptions {
  text: string;
  subtitle?: string;
  template?: GifTemplate;
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  /** Deterministic variation. */
  seed?: number;
  /** More layers, richer motion and a poster-grade frame. */
  maxxing?: boolean;
}

export interface GifResult {
  path: string;
  width: number;
  height: number;
  fps: number;
  frames: number;
  bytes: number;
}
