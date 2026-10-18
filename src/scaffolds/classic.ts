import type { StyleSlug } from '../types.js';
import type { StyleVoice } from '../types/make.js';

export const CLASSIC_VOICES: Partial<Record<StyleSlug, StyleVoice>> = {
  renaissance: {
    brand: { es: 'Taller del Fresco', en: 'The Fresco Workshop' },
    eyebrow: { es: 'Fresco · oficio · memoria', en: 'Fresco · craft · memory' },
    intro: {
      es: 'Trabajamos despacio, con pigmento y cal. Cada encargo empieza con una conversación y termina en una pared que respira.',
      en: 'We work slowly, with pigment and lime. Every commission starts as a conversation and ends as a wall that breathes.',
    },
    sectionTitles: {
      es: ['La primera capa', 'Un rojo que dura', 'La luz de la tarde'],
      en: ['The first coat', 'A red that lasts', 'The afternoon light'],
    },
    quote: {
      es: { text: 'La belleza se descubre, no se agrega.', author: 'Elena Varela' },
      en: { text: 'Beauty is discovered, not added.', author: 'Elena Varela' },
    },
    cta: { es: 'Visitar el taller', en: 'Visit the workshop' },
    chapterTitles: {
      es: ['La pared desnuda', 'El pigmento', 'La grieta', 'La visita'],
      en: ['The bare wall', 'The pigment', 'The crack', 'The visit'],
    },
    details: {
      es: [
        'La cal se aplica en capas finas y cada una seca a distinto ritmo.',
        'El rojo se muele a mano y cambia de tono con la luz.',
        'Una grieta puede ser un dibujo si se mira a tiempo.',
        'La obra se termina cuando la tarde la deja en paz.',
      ],
      en: [
        'Lime goes on in thin coats and each one dries to its own rhythm.',
        'The red is ground by hand and shifts tone with the light.',
        'A crack can be a drawing if you look in time.',
        'The work is finished when the afternoon leaves it alone.',
      ],
    },
    fact: {
      es: 'El fresco se pinta sobre cal húmeda: el pigmento se fija mientras la pared seca.',
      en: 'A fresco is painted on wet lime: the pigment sets as the wall dries.',
    },
    deckPoints: {
      es: [
        { title: 'Escuchar', body: 'La pared ya estaba diciendo algo.' },
        { title: 'Medir', body: 'La proporción es una forma de respeto.' },
        { title: 'Esperar', body: 'El color necesita su tiempo.' },
      ],
      en: [
        { title: 'Listen', body: 'The wall was already saying something.' },
        { title: 'Measure', body: 'Proportion is a form of respect.' },
        { title: 'Wait', body: 'Colour needs its own time.' },
      ],
    },
    deckStats: {
      es: [
        { value: '7', label: 'capas de cal' },
        { value: '1', label: 'rojo por muro' },
      ],
      en: [
        { value: '7', label: 'lime coats' },
        { value: '1', label: 'red per wall' },
      ],
    },
    roomTitles: {
      es: ['Entrada', 'Sala del pigmento', 'Sala de la grieta', 'Salida'],
      en: ['Entrance', 'Pigment room', 'Crack room', 'Exit'],
    },
    itemLabels: {
      es: ['Pigmento', 'Paleta', 'Muro'],
      en: ['Pigment', 'Palette', 'Wall'],
    },
    gifSubtitle: { es: 'Pigmento sobre cal.', en: 'Pigment on lime.' },
    motionSubtitle: { es: 'Una pared que respira.', en: 'A wall that breathes.' },
    motionScene: 'bloom',
    experienceKind: 'museum',
    storyKind: 'history',
    gifTemplate: 'title',
  },

  brutalist: {
    brand: { es: 'CONCRETO / ESTUDIO', en: 'CONCRETE / STUDIO' },
    eyebrow: { es: 'PÓSTER · OBRA · SEÑAL', en: 'POSTER · WORK · SIGNAL' },
    intro: {
      es: 'Una idea, un muro y cero adornos. El resto es ruido.',
      en: 'One idea, one wall, zero decoration. The rest is noise.',
    },
    sectionTitles: {
      es: ['EL ENCARGO', 'EL MÉTODO', 'LA OBRA'],
      en: ['THE BRIEF', 'THE METHOD', 'THE WORK'],
    },
    quote: {
      es: { text: 'MENOS DECORACIÓN. MÁS DECISIÓN.', author: 'MANIFIESTO 04' },
      en: { text: 'LESS DECORATION. MORE DECISION.', author: 'MANIFESTO 04' },
    },
    cta: { es: 'VER EL TRABAJO', en: 'SEE THE WORK' },
    chapterTitles: {
      es: ['EL MURO', 'LA GRIETA', 'EL RUIDO', 'LA FIRMA'],
      en: ['THE WALL', 'THE CRACK', 'THE NOISE', 'THE SIGNATURE'],
    },
    details: {
      es: [
        'El hormigón se deja ver: la junta también es dibujo.',
        'Una grieta honesta dice más que un acabado perfecto.',
        'El ruido se apaga cuando la jerarquía está clara.',
        'La firma es lo último: primero está la estructura.',
      ],
      en: [
        'Concrete is left visible: the joint is a drawing too.',
        'An honest crack says more than a perfect finish.',
        'Noise dies down once the hierarchy is clear.',
        'The signature comes last: structure comes first.',
      ],
    },
    fact: {
      es: 'Un muro portante no necesita disculparse.',
      en: 'A load-bearing wall does not apologise.',
    },
    deckPoints: {
      es: [
        { title: 'MENOS', body: 'Una idea por pantalla.' },
        { title: 'MÁS GRANDE', body: 'El título manda.' },
        { title: 'SILENCIO', body: 'El aire también habla.' },
      ],
      en: [
        { title: 'LESS', body: 'One idea per screen.' },
        { title: 'BIGGER', body: 'The headline leads.' },
        { title: 'SILENCE', body: 'Air speaks too.' },
      ],
    },
    deckStats: {
      es: [
        { value: '3px', label: 'BORDES' },
        { value: '01', label: 'ACENTO' },
      ],
      en: [
        { value: '3px', label: 'BORDERS' },
        { value: '01', label: 'ACCENT' },
      ],
    },
    roomTitles: {
      es: ['ENTRADA', 'SALA DE HORMIGÓN', 'SALA DE SEÑAL', 'SALIDA'],
      en: ['ENTRANCE', 'CONCRETE ROOM', 'SIGNAL ROOM', 'EXIT'],
    },
    itemLabels: {
      es: ['PLACA', 'MURO', 'SEÑAL'],
      en: ['PLATE', 'WALL', 'SIGN'],
    },
    gifSubtitle: { es: 'SIN SOMBRAS BLANDAS.', en: 'NO SOFT SHADOWS.' },
    motionSubtitle: { es: 'LA ESTRUCTURA HABLA.', en: 'THE STRUCTURE SPEAKS.' },
    motionScene: 'type',
    experienceKind: 'studio',
    storyKind: 'essay',
    gifTemplate: 'poster',
  },

  papercraft: {
    brand: { es: 'Papel & Tijera', en: 'Paper & Scissors' },
    eyebrow: { es: 'Hecho a mano · edición limitada', en: 'Handmade · limited edition' },
    intro: {
      es: 'Doblamos, cortamos y pegamos hasta que la idea tiene cuerpo. Nada se imprime dos veces igual.',
      en: 'We fold, cut and glue until the idea has a body. Nothing prints the same way twice.',
    },
    sectionTitles: {
      es: ['La mesa', 'El pliegue', 'La entrega'],
      en: ['The table', 'The fold', 'The delivery'],
    },
    quote: {
      es: { text: 'Una hoja en blanco también es una promesa.', author: 'Taller de papel' },
      en: { text: 'A blank sheet is also a promise.', author: 'Paper workshop' },
    },
    cta: { es: 'Pedir una edición', en: 'Request an edition' },
    chapterTitles: {
      es: ['El claro', 'El bosque', 'La casa', 'La sombra'],
      en: ['The clearing', 'The forest', 'The house', 'The shadow'],
    },
    details: {
      es: [
        'La primera sombra fue un recorte de prueba que nadie quiso tirar.',
        'Cada capa de papel cambia el color de la anterior.',
        'La casa se armó en una mesa, con paciencia de domingo.',
        'La sombra aprendió a quedarse cuando el sol se fue.',
      ],
      en: [
        'The first shadow was a test cut nobody wanted to throw away.',
        'Each layer of paper changes the colour of the one below.',
        'The house was assembled on a table, with Sunday patience.',
        'The shadow learned to stay after the sun left.',
      ],
    },
    fact: {
      es: 'Seis capas de papel bastan para simular profundidad.',
      en: 'Six layers of paper are enough to fake depth.',
    },
    deckPoints: {
      es: [
        { title: 'DOBLAR', body: 'La línea primero, el volumen después.' },
        { title: 'CORTAR', body: 'Cada corte deja una sombra.' },
        { title: 'PEGAR', body: 'Unir es decidir.' },
      ],
      en: [
        { title: 'FOLD', body: 'Line first, volume later.' },
        { title: 'CUT', body: 'Every cut leaves a shadow.' },
        { title: 'GLUE', body: 'Joining is deciding.' },
      ],
    },
    deckStats: {
      es: [
        { value: '400', label: 'invitaciones' },
        { value: '6', label: 'capas' },
      ],
      en: [
        { value: '400', label: 'invitations' },
        { value: '6', label: 'layers' },
      ],
    },
    roomTitles: {
      es: ['La entrada', 'La mesa de corte', 'La casa de papel', 'La salida'],
      en: ['The entrance', 'The cutting table', 'The paper house', 'The exit'],
    },
    itemLabels: {
      es: ['Tijera', 'Pliego', 'Sombra'],
      en: ['Scissors', 'Sheet', 'Shadow'],
    },
    gifSubtitle: { es: 'Papel, tijera y paciencia.', en: 'Paper, scissors, patience.' },
    motionSubtitle: { es: 'Una sombra de papel.', en: 'A paper shadow.' },
    motionScene: 'papercut',
    experienceKind: 'garden',
    storyKind: 'story',
    gifTemplate: 'loop',
    storybook: true,
  },

  artdeco: {
    brand: { es: 'ATELIER ORFEO', en: 'ATELIER ORFEO' },
    eyebrow: { es: 'PROGRAMA · SALA 07', en: 'PROGRAMME · SALON 07' },
    intro: {
      es: 'Una noche de mármol y latón. La idea entra por la puerta grande y se queda en la barra.',
      en: 'A night of marble and brass. The idea enters through the main door and stays at the bar.',
    },
    sectionTitles: {
      es: ['El vestíbulo', 'La sala', 'La salida'],
      en: ['The lobby', 'The salon', 'The exit'],
    },
    quote: {
      es: { text: 'Todo lo que sube merece una línea.', author: 'Programa de sala' },
      en: { text: 'Everything that rises deserves a line.', author: 'House programme' },
    },
    cta: { es: 'RESERVAR UNA MESA', en: 'RESERVE A TABLE' },
    chapterTitles: {
      es: ['El vestíbulo', 'La escalera', 'La orquesta', 'El alba'],
      en: ['The lobby', 'The staircase', 'The orchestra', 'Dawn'],
    },
    details: {
      es: [
        'El latón se pule hasta que la luz lo confunde con oro.',
        'La escalera sube en zigzag y obliga a mirar hacia arriba.',
        'La orquesta toca bajo y la sala se inclina.',
        'El alba encuentra las copas todavía tibias.',
      ],
      en: [
        'The brass is polished until the light mistakes it for gold.',
        'The staircase climbs in zigzags and forces you to look up.',
        'The orchestra plays low and the salon leans in.',
        'Dawn finds the glasses still warm.',
      ],
    },
    fact: {
      es: 'El mármol conserva el frío de la noche anterior.',
      en: 'Marble keeps the cold of the night before.',
    },
    deckPoints: {
      es: [
        { title: 'ENTRADA', body: 'La puerta grande hace el trabajo.' },
        { title: 'ASCENSO', body: 'Todo sube en línea recta.' },
        { title: 'BRILLO', body: 'El latón, con moderación.' },
      ],
      en: [
        { title: 'ENTRANCE', body: 'The main door does the work.' },
        { title: 'ASCENT', body: 'Everything rises in a straight line.' },
        { title: 'SHINE', body: 'Brass, in moderation.' },
      ],
    },
    deckStats: {
      es: [
        { value: '07', label: 'salas' },
        { value: '2:00', label: 'cierre' },
      ],
      en: [
        { value: '07', label: 'salons' },
        { value: '2:00', label: 'closing' },
      ],
    },
    roomTitles: {
      es: ['El vestíbulo', 'La sala de latón', 'La terraza', 'El guardarropa'],
      en: ['The lobby', 'The brass salon', 'The terrace', 'The cloakroom'],
    },
    itemLabels: {
      es: ['Copa', 'Latón', 'Programa'],
      en: ['Glass', 'Brass', 'Programme'],
    },
    gifSubtitle: { es: 'UNA NOCHE DE LATÓN.', en: 'A NIGHT OF BRASS.' },
    motionSubtitle: { es: 'TODO SUBE.', en: 'EVERYTHING RISES.' },
    motionScene: 'orbit',
    experienceKind: 'club',
    storyKind: 'history',
    gifTemplate: 'title',
  },
};
