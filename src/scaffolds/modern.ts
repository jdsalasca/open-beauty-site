import type { StyleSlug } from '../types.js';
import type { StyleVoice } from '../types/make.js';

export const MODERN_VOICES: Partial<Record<StyleSlug, StyleVoice>> = {
  memphis: {
    brand: { es: 'Grupo Casi Serio', en: 'Almost Serious Group' },
    eyebrow: { es: 'CATÁLOGO DE OBJETOS ÚTILES', en: 'CATALOGUE OF USEFUL OBJECTS' },
    intro: {
      es: 'Diseñamos cosas que parecen un error y funcionan demasiado bien.',
      en: 'We design things that look like a mistake and work too well.',
    },
    sectionTitles: {
      es: ['La silla', 'La lámpara', 'La mesa'],
      en: ['The chair', 'The lamp', 'The table'],
    },
    quote: {
      es: { text: 'Si no se puede explicar, al menos que se recuerde.', author: 'Acta de taller' },
      en: { text: 'If it cannot be explained, at least let it be remembered.', author: 'Workshop minutes' },
    },
    cta: { es: 'VER LOS OBJETOS', en: 'SEE THE OBJECTS' },
    chapterTitles: {
      es: ['La silla', 'La lámpara', 'La mesa', 'La fiesta'],
      en: ['The chair', 'The lamp', 'The table', 'The party'],
    },
    details: {
      es: [
        'La silla tiene una pata distinta y por eso se recuerda.',
        'La lámpara ilumina en diagonal y no pide permiso.',
        'La mesa sostiene todo, incluso las discusiones.',
        'La fiesta empieza cuando nadie ordena los colores.',
      ],
      en: [
        'The chair has one different leg, which is why it is remembered.',
        'The lamp lights diagonally and asks no permission.',
        'The table holds everything, including arguments.',
        'The party starts when nobody sorts the colours.',
      ],
    },
    fact: {
      es: 'Una forma rara también puede ser una buena ergonomía.',
      en: 'An odd shape can also be good ergonomics.',
    },
    deckPoints: {
      es: [
        { title: 'SILLA', body: 'Una pata distinta y listo.' },
        { title: 'LÁMPARA', body: 'Luz en diagonal, sin permiso.' },
        { title: 'MESA', body: 'Sostiene todo, incluso el debate.' },
      ],
      en: [
        { title: 'CHAIR', body: 'One different leg and done.' },
        { title: 'LAMP', body: 'Diagonal light, no permission.' },
        { title: 'TABLE', body: 'Holds everything, even debate.' },
      ],
    },
    deckStats: {
      es: [
        { value: '05', label: 'objetos' },
        { value: '0', label: 'aburrimiento' },
      ],
      en: [
        { value: '05', label: 'objects' },
        { value: '0', label: 'boredom' },
      ],
    },
    roomTitles: {
      es: ['La entrada', 'Sala de objetos', 'Sala de colores', 'La salida'],
      en: ['Entrance', 'Objects room', 'Colour room', 'Exit'],
    },
    itemLabels: {
      es: ['Objeto', 'Muestra', 'Color'],
      en: ['Object', 'Sample', 'Colour'],
    },
    gifSubtitle: { es: 'UN ERROR BIEN HECHO.', en: 'A WELL-MADE MISTAKE.' },
    motionSubtitle: { es: 'CASI SERIO.', en: 'ALMOST SERIOUS.' },
    motionScene: 'rain',
    experienceKind: 'studio',
    storyKind: 'story',
    gifTemplate: 'loop',
  },

  vaporwave: {
    brand: { es: 'INTERFAZ 1998', en: 'INTERFACE 1998' },
    eyebrow: { es: 'MANUAL DEL USUARIO · V.2.0', en: 'USER MANUAL · V.2.0' },
    intro: {
      es: 'Un manual para una interfaz que prometió el futuro y entregó un pasillo infinito.',
      en: 'A manual for an interface that promised the future and delivered an endless corridor.',
    },
    sectionTitles: {
      es: ['El escritorio', 'La promesa', 'El error'],
      en: ['The desktop', 'The promise', 'The error'],
    },
    quote: {
      es: { text: 'El futuro también tiene nostalgia.', author: 'Nota de sistema' },
      en: { text: 'The future is nostalgic too.', author: 'System note' },
    },
    cta: { es: 'ABRIR LA VENTANA', en: 'OPEN THE WINDOW' },
    chapterTitles: {
      es: ['El arranque', 'La promesa', 'El error', 'El cierre'],
      en: ['The boot', 'The promise', 'The error', 'The shutdown'],
    },
    details: {
      es: [
        'El escritorio abre con un sonido de módem que ya nadie recuerda.',
        'La promesa era simple: todo a un clic y para siempre.',
        'El error aparece en gris, sin explicación y sin número.',
        'El cierre pregunta si querés guardar los cambios.',
      ],
      en: [
        'The desktop opens with a modem sound nobody remembers.',
        'The promise was simple: everything in one click, forever.',
        'The error appears in grey, with no explanation and no number.',
        'The shutdown asks if you want to save your changes.',
      ],
    },
    fact: {
      es: 'Un icono guarda más memoria que un archivo.',
      en: 'An icon holds more memory than a file.',
    },
    deckPoints: {
      es: [
        { title: 'ESCRITORIO', body: 'Todo empieza con un doble clic.' },
        { title: 'PROMESA', body: 'El futuro llegó con retraso.' },
        { title: 'ERROR', body: 'Gris, sin número, memorable.' },
      ],
      en: [
        { title: 'DESKTOP', body: 'It all starts with a double click.' },
        { title: 'PROMISE', body: 'The future arrived late.' },
        { title: 'ERROR', body: 'Grey, unnumbered, memorable.' },
      ],
    },
    deckStats: {
      es: [
        { value: '1998', label: 'versión' },
        { value: '∞', label: 'pasillo' },
      ],
      en: [
        { value: '1998', label: 'version' },
        { value: '∞', label: 'corridor' },
      ],
    },
    roomTitles: {
      es: ['La entrada', 'Sala del escritorio', 'Sala del error', 'La salida'],
      en: ['Entrance', 'Desktop room', 'Error room', 'Exit'],
    },
    itemLabels: {
      es: ['Icono', 'Ventana', 'Cursor'],
      en: ['Icon', 'Window', 'Cursor'],
    },
    gifSubtitle: { es: 'UNA VENTANA SIN SALIDA.', en: 'A WINDOW WITH NO EXIT.' },
    motionSubtitle: { es: 'EL FUTURO YA PASÓ.', en: 'THE FUTURE ALREADY HAPPENED.' },
    motionScene: 'constellation',
    experienceKind: 'club',
    storyKind: 'essay',
    gifTemplate: 'title',
  },

  galactic: {
    brand: { es: 'Planetario Íntimo', en: 'Intimate Planetarium' },
    eyebrow: { es: 'SESIÓN DE CÚPULA · 21:00', en: 'DOME SESSION · 21:00' },
    intro: {
      es: 'Una nota de planetario para las cosas que recordamos. El universo es la sala; la memoria, el tema.',
      en: 'A planetarium note for the things we remember. The universe is the room; memory is the subject.',
    },
    sectionTitles: {
      es: ['La órbita', 'La señal', 'El regreso'],
      en: ['The orbit', 'The signal', 'The return'],
    },
    quote: {
      es: { text: 'La distancia también es una forma de escuchar.', author: 'Nota de cúpula' },
      en: { text: 'Distance is also a way of listening.', author: 'Dome note' },
    },
    cta: { es: 'ENTRAR A LA CÚPULA', en: 'ENTER THE DOME' },
    chapterTitles: {
      es: ['La señal', 'La órbita', 'La espera', 'El regreso'],
      en: ['The signal', 'The orbit', 'The wait', 'The return'],
    },
    details: {
      es: [
        'La señal llegó con retraso y aún así nos encontró despiertos.',
        'La órbita es una costumbre: vuelve siempre al mismo punto.',
        'La espera se mide en canciones y en café frío.',
        'El regreso no es volver: es reconocer el mismo cielo.',
      ],
      en: [
        'The signal arrived late and still found us awake.',
        'The orbit is a habit: it always returns to the same point.',
        'The wait is measured in songs and cold coffee.',
        'The return is not going back: it is recognising the same sky.',
      ],
    },
    fact: {
      es: 'La luz de una estrella lejana es una carta con remitente viejo.',
      en: 'Light from a distant star is a letter with an old return address.',
    },
    deckPoints: {
      es: [
        { title: 'ÓRBITA', body: 'Una costumbre que vuelve siempre.' },
        { title: 'SEÑAL', body: 'Llegó tarde y aún así nos encontró.' },
        { title: 'REGRESO', body: 'Reconocer el mismo cielo.' },
      ],
      en: [
        { title: 'ORBIT', body: 'A habit that always comes back.' },
        { title: 'SIGNAL', body: 'It arrived late and still found us.' },
        { title: 'RETURN', body: 'Recognising the same sky.' },
      ],
    },
    deckStats: {
      es: [
        { value: '01', label: 'voz' },
        { value: '4.2', label: 'años luz' },
      ],
      en: [
        { value: '01', label: 'voice' },
        { value: '4.2', label: 'light years' },
      ],
    },
    roomTitles: {
      es: ['La entrada', 'Sala de la órbita', 'Sala de la señal', 'La salida'],
      en: ['Entrance', 'Orbit room', 'Signal room', 'Exit'],
    },
    itemLabels: {
      es: ['Mapa', 'Señal', 'Cúpula'],
      en: ['Map', 'Signal', 'Dome'],
    },
    gifSubtitle: { es: 'EL UNIVERSO ES LA SALA.', en: 'THE UNIVERSE IS THE ROOM.' },
    motionSubtitle: { es: 'UNA VOZ LEJANA.', en: 'A DISTANT VOICE.' },
    motionScene: 'orbit',
    experienceKind: 'museum',
    storyKind: 'story',
    gifTemplate: 'title',
  },

  nature: {
    brand: { es: 'Herbario Vivo', en: 'Living Herbarium' },
    eyebrow: { es: 'Cuaderno de campo · temporada húmeda', en: 'Field notebook · wet season' },
    intro: {
      es: 'Un herbario para lo que sigue creciendo. Observamos primero y nombramos después.',
      en: 'A herbarium for what keeps growing. We observe first and name later.',
    },
    sectionTitles: {
      es: ['La hoja', 'La raíz', 'La temporada'],
      en: ['The leaf', 'The root', 'The season'],
    },
    quote: {
      es: { text: 'Todo archivo vivo cambia de forma.', author: 'Cuaderno de campo' },
      en: { text: 'Every living archive changes shape.', author: 'Field notebook' },
    },
    cta: { es: 'ABRIR EL HERBARIO', en: 'OPEN THE HERBARIUM' },
    chapterTitles: {
      es: ['La semilla', 'La raíz', 'La lluvia', 'La sombra'],
      en: ['The seed', 'The root', 'The rain', 'The shadow'],
    },
    details: {
      es: [
        'La semilla pesa menos que la promesa que lleva adentro.',
        'La raíz avanza a ciegas y encuentra agua por olfato.',
        'La lluvia de octubre deja el cuaderno húmedo y legible.',
        'La sombra protege lo que todavía no tiene nombre.',
      ],
      en: [
        'The seed weighs less than the promise it carries.',
        'The root moves blind and finds water by smell.',
        'October rain leaves the notebook damp and legible.',
        'The shadow protects what does not yet have a name.',
      ],
    },
    fact: {
      es: 'Una hoja prensada conserva la forma pero pierde el color.',
      en: 'A pressed leaf keeps its shape but loses its colour.',
    },
    deckPoints: {
      es: [
        { title: 'HOJA', body: 'Una forma que se puede medir.' },
        { title: 'RAÍZ', body: 'Lo que sostiene no se ve.' },
        { title: 'TEMPORADA', body: 'El tiempo también es material.' },
      ],
      en: [
        { title: 'LEAF', body: 'A shape that can be measured.' },
        { title: 'ROOT', body: 'What holds it up stays hidden.' },
        { title: 'SEASON', body: 'Time is material too.' },
      ],
    },
    deckStats: {
      es: [
        { value: '12', label: 'especies' },
        { value: '01', label: 'cuaderno' },
      ],
      en: [
        { value: '12', label: 'species' },
        { value: '01', label: 'notebook' },
      ],
    },
    roomTitles: {
      es: ['La entrada', 'Sala de hojas', 'Sala de raíces', 'La salida'],
      en: ['Entrance', 'Leaf room', 'Root room', 'Exit'],
    },
    itemLabels: {
      es: ['Hoja', 'Semilla', 'Cuaderno'],
      en: ['Leaf', 'Seed', 'Notebook'],
    },
    gifSubtitle: { es: 'LO QUE CRECE, RECUERDA.', en: 'WHAT GROWS, REMEMBERS.' },
    motionSubtitle: { es: 'OBSERVAR SIN PRISA.', en: 'OBSERVE SLOWLY.' },
    motionScene: 'bloom',
    experienceKind: 'garden',
    storyKind: 'lesson',
    gifTemplate: 'title',
  },
};
