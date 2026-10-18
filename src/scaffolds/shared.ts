import type { Localized } from '../types/make.js';

/**
 * Copy that is identical in every style. Style-specific words live in the
 * voice files; these are the connective sentences that turn a one-line idea
 * into a complete brief without inventing facts.
 */
export const SHARED: {
  deckPointsTitle: Localized<string>;
  deckStatsTitle: Localized<string>;
  sectionKickers: Localized<[string, string, string]>;
  storySource: Localized<string>;
  storyFrames: Localized<[string, string, string, string]>;
  roomBodies: Localized<[string, string, string, string]>;
  itemDetails: Localized<[string, string, string]>;
  closing: Localized<string>;
  footer: Localized<string>;
  readingTime: Localized<string>;
} = {
  deckPointsTitle: { es: 'Tres movimientos', en: 'Three movements' },
  deckStatsTitle: { es: 'En números', en: 'In numbers' },
  sectionKickers: {
    es: ['Movimiento 01', 'Movimiento 02', 'Movimiento 03'],
    en: ['Movement 01', 'Movement 02', 'Movement 03'],
  },
  storySource: {
    es: 'Ficción original · taller del estudio',
    en: 'Original fiction · studio workshop',
  },
  storyFrames: {
    es: [
      'Todo empezó con una frase que no supimos soltar: «{idea}». {detail} Al principio fue una molestia; después, una costumbre; al final, la única forma de mirar.',
      'La segunda vez ya no hubo sorpresa, solo atención. {detail} Alguien tomó nota, otro midió el silencio y el resto aprendió a esperar. La libreta quedó abierta en la misma página.',
      'Hay un momento en que la materia decide por nosotros. {detail} No fue un hallazgo: fue una consecuencia, y por eso importó. Lo anotamos con la fecha exacta y seguimos.',
      'Al cerrar quedó una puerta abierta y una lista de cosas por probar. {detail} Lo que sigue no es un final: es la próxima visita al mismo lugar. Nadie se despidió del todo.',
    ],
    en: [
      'It all began with a sentence we could not put down: “{idea}”. {detail} At first it was a nuisance; later a habit; in the end, the only way to look.',
      'The second time there was no surprise, only attention. {detail} Someone took notes, someone else measured the silence, and the rest learned to wait. The notebook stayed open on the same page.',
      'There comes a moment when the material decides for us. {detail} It was not a discovery but a consequence, and that is why it mattered. We wrote down the exact date and moved on.',
      'At closing time a door was left open and a list of things to try. {detail} What follows is not an ending: it is the next visit to the same place. Nobody said goodbye properly.',
    ],
  },
  roomBodies: {
    es: [
      'La visita empieza cuando bajás el volumen. {idea}',
      'Entramos por lo concreto: {detail}',
      'El detalle que importa: {detail}',
      'Antes de salir, {detail}',
    ],
    en: [
      'The visit begins when you turn the volume down. {idea}',
      'We enter through the concrete: {detail}',
      'The detail that matters: {detail}',
      'Before leaving, {detail}',
    ],
  },
  itemDetails: {
    es: [
      'Pieza documentada en el archivo del estudio.',
      'Material original, sin reproducciones.',
      'Se exhibe con luz baja y sin flash.',
    ],
    en: [
      'Piece documented in the studio archive.',
      'Original material, no reproductions.',
      'Shown under low light, no flash.',
    ],
  },
  closing: {
    es: 'La conversación sigue.',
    en: 'The conversation continues.',
  },
  footer: {
    es: 'Obra original · hecha con open-beauty-site',
    en: 'Original work · made with open-beauty-site',
  },
  readingTime: { es: '6 min', en: '6 min' },
};
