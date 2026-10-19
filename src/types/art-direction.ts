import type { StyleSlug } from '../types.js';

export type ArtDirectionFormat = 'web' | 'slide' | 'gif';

export interface ArtDirectionIntent {
  personality: string;
  suitableFor: string[];
  limits: string[];
}

export interface ArtDirectionComposition {
  grid: string;
  allowedAsymmetry: string;
  scale: string;
  emptySpace: string;
  alignment: string;
  density: string;
}

export interface ArtDirectionFontRole {
  family: string;
  weight: number | string;
  available: boolean;
  bundled: boolean;
  status: 'bundled' | 'unavailable';
  source?: string;
  license?: string;
  note?: string;
}

export interface ArtDirectionTypography {
  families: {
    display: ArtDirectionFontRole;
    reading: ArtDirectionFontRole;
    label: ArtDirectionFontRole;
    figure: ArtDirectionFontRole;
    annotation: ArtDirectionFontRole;
  };
  // Convenience aliases for the same role objects.
  display: ArtDirectionFontRole;
  reading: ArtDirectionFontRole;
  label: ArtDirectionFontRole;
  figure: ArtDirectionFontRole;
  annotation: ArtDirectionFontRole;
  weights: Record<'display' | 'reading' | 'label' | 'figure' | 'annotation', number | string>;
  sizesByFormat: { web: string; slide: string; gif: string };
  leading: string;
  readingWidth: string;
  displayUsage: string;
  explicitFallback: string;
}

export interface ArtDirectionColor {
  surfaces: string[];
  text: string;
  accents: string[];
  semanticStates: {
    ok: string;
    warn: string;
    problem: string;
    neutral: string;
  };
  contrastNotes: string;
}

export interface ArtDirectionMateriality {
  borders: string;
  shadows: string;
  grain: string;
  cutouts: string;
  depth: string;
  readabilityRule: string;
}

export interface ArtDirectionIllustration {
  vocabulary: string[];
  rulesForEntities: string;
  rulesForRelations: string;
  rulesForActions: string;
}

export interface ArtDirectionMotion {
  entries: string;
  transformations: string;
  continuity: string;
  restDuringReading: string;
}

export interface ArtDirectionAdaptationEntry {
  description: string;
  example: string;
  // Aliases kept for compatibility with alternate readers.
  paragraph?: string;
  text?: string;
  examplePath?: string;
  path?: string;
  file?: string;
}

export interface ArtDirectionAdaptation {
  web: ArtDirectionAdaptationEntry;
  slides: ArtDirectionAdaptationEntry;
  gif: ArtDirectionAdaptationEntry;
}

export interface PapercraftProfileFont {
  family: string;
  weight: number | string;
  available: boolean;
  source?: string;
  license?: string;
  note?: string;
}

export interface PapercraftProfile {
  name: string;
  description: string;
  families: {
    display: PapercraftProfileFont;
    reading: PapercraftProfileFont;
    label: PapercraftProfileFont;
    annotation?: PapercraftProfileFont;
  };
  available: boolean;
  license?: string;
  source?: string;
  note?: string;
}

export interface ArtDirection {
  intent: ArtDirectionIntent;
  composition: ArtDirectionComposition;
  typography: ArtDirectionTypography;
  color: ArtDirectionColor;
  materiality: ArtDirectionMateriality;
  illustration: ArtDirectionIllustration;
  motion: ArtDirectionMotion;
  negativeRules: string[];
  adaptation: ArtDirectionAdaptation;
  profiles?: Record<string, PapercraftProfile>;
}
