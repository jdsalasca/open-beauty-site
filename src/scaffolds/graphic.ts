import type { StyleSlug } from '../types.js';
import type { StyleVoice } from '../types/make.js';

export const GRAPHIC_VOICES: Partial<Record<StyleSlug, StyleVoice>> = {
  isotype: {
    brand: { es: 'Oficina de datos', en: 'Data Office' },
    eyebrow: { es: 'CENSO VISUAL · SERIE 03', en: 'VISUAL CENSUS · SERIES 03' },
    intro: {
      es: 'Contamos lo que se puede contar y lo dibujamos para que se entienda sin explicación.',
      en: 'We count what can be counted and draw it so it reads without explanation.',
    },
    sectionTitles: {
      es: ['La pregunta', 'El conteo', 'La lectura'],
      en: ['The question', 'The count', 'The reading'],
    },
    quote: {
      es: { text: 'Un número sin escala es una opinión.', author: 'Nota de método' },
      en: { text: 'A number without scale is an opinion.', author: 'Method note' },
    },
    cta: { es: 'LEER EL INFORME', en: 'READ THE REPORT' },
    chapterTitles: {
      es: ['La pregunta', 'La escala', 'El mapa', 'La fuente'],
      en: ['The question', 'The scale', 'The map', 'The source'],
    },
    details: {
      es: [
        'Cada pictograma equivale a cien personas y se dibuja igual.',
        'La escala se declara antes de mirar el mapa.',
        'El mapa ordena por cercanía, no por importancia.',
        'La fuente se cita al pie, con fecha y método.',
      ],
      en: [
        'Each pictogram equals one hundred people and is drawn the same way.',
        'The scale is declared before you look at the map.',
        'The map sorts by proximity, not importance.',
        'The source is cited at the foot, with date and method.',
      ],
    },
    fact: {
      es: 'Sin denominador no hay comparación posible.',
      en: 'Without a denominator there is no comparison.',
    },
    deckPoints: {
      es: [
        { title: 'QUÉ', body: 'Primero el sujeto, después el signo.' },
        { title: 'CUÁNTOS', body: 'Cada marca declara su escala.' },
        { title: 'DÓNDE', body: 'El mapa también es un argumento.' },
      ],
      en: [
        { title: 'WHAT', body: 'Subject first, sign second.' },
        { title: 'HOW MANY', body: 'Every mark declares its scale.' },
        { title: 'WHERE', body: 'The map is an argument too.' },
      ],
    },
    deckStats: {
      es: [
        { value: '1:100', label: 'escala' },
        { value: '03', label: 'series' },
      ],
      en: [
        { value: '1:100', label: 'scale' },
        { value: '03', label: 'series' },
      ],
    },
    roomTitles: {
      es: ['La entrada', 'La sala del censo', 'La sala del mapa', 'La salida'],
      en: ['Entrance', 'Census room', 'Map room', 'Exit'],
    },
    itemLabels: {
      es: ['Pictograma', 'Tabla', 'Mapa'],
      en: ['Pictogram', 'Table', 'Map'],
    },
    gifSubtitle: { es: 'CADA SIGNO CUENTA.', en: 'EVERY SIGN COUNTS.' },
    motionSubtitle: { es: 'CONTAR ES MIRAR.', en: 'COUNTING IS LOOKING.' },
    motionScene: 'type',
    experienceKind: 'history',
    storyKind: 'lesson',
    gifTemplate: 'poster',
  },

  opart: {
    brand: { es: 'Estudio Óptico', en: 'Optical Studio' },
    eyebrow: { es: 'PRUEBA DE PERCEPCIÓN · 01', en: 'PERCEPTION TEST · 01' },
    intro: {
      es: 'Una pregunta sobre lo que ves. La respuesta tarda un segundo y no siempre es la misma.',
      en: 'A question about what you see. The answer takes a second and is not always the same.',
    },
    sectionTitles: {
      es: ['La línea', 'El temblor', 'La pausa'],
      en: ['The line', 'The tremor', 'The pause'],
    },
    quote: {
      es: { text: 'Mira dos veces: la primera es solo costumbre.', author: 'Nota de sala' },
      en: { text: 'Look twice: the first time is just habit.', author: 'Room note' },
    },
    cta: { es: 'ENTRAR AL PATRÓN', en: 'ENTER THE PATTERN' },
    chapterTitles: {
      es: ['La cuadrícula', 'El temblor', 'El borde', 'La pausa'],
      en: ['The grid', 'The tremor', 'The edge', 'The pause'],
    },
    details: {
      es: [
        'Las líneas paralelas parecen inclinarse cuando el fondo también lo hace.',
        'El temblor no está en la imagen: está en el ojo.',
        'El borde decide dónde termina el patrón y empieza el aire.',
        'La pausa es parte del diseño: sin ella, todo vibra.',
      ],
      en: [
        'Parallel lines seem to lean when the ground leans too.',
        'The tremor is not in the image: it is in the eye.',
        'The edge decides where the pattern ends and the air begins.',
        'The pause is part of the design: without it, everything vibrates.',
      ],
    },
    fact: {
      es: 'La ilusión depende de la distancia: a dos pasos, el patrón se ordena.',
      en: 'The illusion depends on distance: two steps back and the pattern settles.',
    },
    deckPoints: {
      es: [
        { title: 'MIRAR', body: 'La primera impresión es un borrador.' },
        { title: 'DUDAR', body: 'Si no dudás, no estás mirando.' },
        { title: 'PAUSAR', body: 'El ojo necesita un descanso.' },
      ],
      en: [
        { title: 'LOOK', body: 'The first impression is a draft.' },
        { title: 'DOUBT', body: 'If you do not doubt, you are not looking.' },
        { title: 'PAUSE', body: 'The eye needs a rest.' },
      ],
    },
    deckStats: {
      es: [
        { value: '2', label: 'direcciones' },
        { value: '0', label: 'reposo' },
      ],
      en: [
        { value: '2', label: 'directions' },
        { value: '0', label: 'rest' },
      ],
    },
    roomTitles: {
      es: ['La entrada', 'Sala de líneas', 'Sala del borde', 'La salida'],
      en: ['Entrance', 'Line room', 'Edge room', 'Exit'],
    },
    itemLabels: {
      es: ['Patrón', 'Lente', 'Borde'],
      en: ['Pattern', 'Lens', 'Edge'],
    },
    gifSubtitle: { es: 'EL OJO HACE EL RESTO.', en: 'THE EYE DOES THE REST.' },
    motionSubtitle: { es: 'MIRA OTRA VEZ.', en: 'LOOK AGAIN.' },
    motionScene: 'ribbon',
    experienceKind: 'museum',
    storyKind: 'essay',
    gifTemplate: 'loop',
  },

  ukiyoe: {
    brand: { es: 'Taller de la marea', en: 'Tide Workshop' },
    eyebrow: { es: 'Estampa de viaje · otoño húmedo', en: 'Travel print · wet autumn' },
    intro: {
      es: 'Registramos un lugar con paciencia de estampa: el clima, la distancia y una figura humana que cruza.',
      en: 'We record a place with the patience of a print: the weather, the distance and one human figure crossing.',
    },
    sectionTitles: {
      es: ['La costa', 'La lluvia', 'El regreso'],
      en: ['The coast', 'The rain', 'The return'],
    },
    quote: {
      es: { text: 'El paisaje cambia cuando alguien lo cruza.', author: 'Diario de viaje' },
      en: { text: 'A landscape changes when someone crosses it.', author: 'Travel diary' },
    },
    cta: { es: 'VER LA ESTAMPA', en: 'VIEW THE PRINT' },
    chapterTitles: {
      es: ['La costa', 'La lluvia', 'La barca', 'El regreso'],
      en: ['The coast', 'The rain', 'The boat', 'The return'],
    },
    details: {
      es: [
        'La costa se dibuja con tres líneas y una mancha de sal.',
        'La lluvia cae en diagonal para que el viento se note.',
        'La barca espera cargada de redes y de silencio.',
        'El regreso es la misma costa, mirada al revés.',
      ],
      en: [
        'The coast is drawn with three lines and a stain of salt.',
        'The rain falls diagonally so the wind is visible.',
        'The boat waits, loaded with nets and silence.',
        'The return is the same coast, seen backwards.',
      ],
    },
    fact: {
      es: 'Una estampa se imprime con pocos bloques y mucha humedad.',
      en: 'A print is pulled with few blocks and plenty of damp.',
    },
    deckPoints: {
      es: [
        { title: 'COSTA', body: 'Tres líneas y una mancha de sal.' },
        { title: 'LLUVIA', body: 'El viento también se imprime.' },
        { title: 'REGRESO', body: 'Volver es mirar al revés.' },
      ],
      en: [
        { title: 'COAST', body: 'Three lines and a stain of salt.' },
        { title: 'RAIN', body: 'The wind gets printed too.' },
        { title: 'RETURN', body: 'Returning is looking backwards.' },
      ],
    },
    deckStats: {
      es: [
        { value: '1', label: 'viajero' },
        { value: '36', label: 'vistas' },
      ],
      en: [
        { value: '1', label: 'traveller' },
        { value: '36', label: 'views' },
      ],
    },
    roomTitles: {
      es: ['La entrada', 'Sala de la costa', 'Sala de la lluvia', 'La salida'],
      en: ['Entrance', 'Coast room', 'Rain room', 'Exit'],
    },
    itemLabels: {
      es: ['Sello', 'Tinta', 'Papel'],
      en: ['Block', 'Ink', 'Paper'],
    },
    gifSubtitle: { es: 'LA MAREA RECUERDA.', en: 'THE TIDE REMEMBERS.' },
    motionSubtitle: { es: 'MIRAR EL CLIMA.', en: 'WATCH THE WEATHER.' },
    motionScene: 'tide',
    experienceKind: 'garden',
    storyKind: 'story',
    gifTemplate: 'title',
  },

  bestiary: {
    brand: { es: 'Gabinete de especies imposibles', en: 'Cabinet of impossible species' },
    eyebrow: { es: 'Lámina XI · especie hipotética', en: 'Plate XI · hypothetical species' },
    intro: {
      es: 'Un catálogo de animales que nadie ha visto. Observamos antes de imaginar y anotamos cada duda.',
      en: 'A catalogue of animals nobody has seen. We observe before imagining and note every doubt.',
    },
    sectionTitles: {
      es: ['Anatomía', 'Hábitat', 'Conducta'],
      en: ['Anatomy', 'Habitat', 'Behaviour'],
    },
    quote: {
      es: { text: 'Lo que no existe también deja huellas.', author: 'Nota de campo' },
      en: { text: 'What does not exist also leaves tracks.', author: 'Field note' },
    },
    cta: { es: 'CONSULTAR LA LÁMINA', en: 'CONSULT THE PLATE' },
    chapterTitles: {
      es: ['La lámina', 'La huella', 'El hábitat', 'La duda'],
      en: ['The plate', 'The track', 'The habitat', 'The doubt'],
    },
    details: {
      es: [
        'El animal tiene seis patas y una cola que usa como péndulo.',
        'La huella mide dos palmos y siempre aparece junto al agua.',
        'Habita cornisas altas donde el viento deja semillas.',
        'Nadie lo ha visto de frente: solo queda su sombra.',
      ],
      en: [
        'The animal has six legs and a tail it uses as a pendulum.',
        'The track spans two handspans and always appears near water.',
        'It lives on high ledges where the wind leaves seeds.',
        'Nobody has seen it head-on: only its shadow remains.',
      ],
    },
    fact: {
      es: 'Una especie se describe por sus medidas, no por su leyenda.',
      en: 'A species is described by its measurements, not its legend.',
    },
    deckPoints: {
      es: [
        { title: 'ANATOMÍA', body: 'Medidas antes que metáforas.' },
        { title: 'HÁBITAT', body: 'Dónde deja huella y cuándo.' },
        { title: 'CONDUCTA', body: 'Qué hace cuando nadie mira.' },
      ],
      en: [
        { title: 'ANATOMY', body: 'Measurements before metaphors.' },
        { title: 'HABITAT', body: 'Where it leaves tracks, and when.' },
        { title: 'BEHAVIOUR', body: 'What it does when nobody looks.' },
      ],
    },
    deckStats: {
      es: [
        { value: 'XI', label: 'lámina' },
        { value: '00', label: 'avistamientos' },
      ],
      en: [
        { value: 'XI', label: 'plate' },
        { value: '00', label: 'sightings' },
      ],
    },
    roomTitles: {
      es: ['La entrada', 'Sala de anatomía', 'Sala de huellas', 'La salida'],
      en: ['Entrance', 'Anatomy room', 'Tracks room', 'Exit'],
    },
    itemLabels: {
      es: ['Lámina', 'Huella', 'Lupa'],
      en: ['Plate', 'Track', 'Lens'],
    },
    gifSubtitle: { es: 'ESPECIE HIPOTÉTICA.', en: 'HYPOTHETICAL SPECIES.' },
    motionSubtitle: { es: 'OBSERVAR ANTES DE IMAGINAR.', en: 'OBSERVE BEFORE IMAGINING.' },
    motionScene: 'bloom',
    experienceKind: 'museum',
    storyKind: 'lesson',
    gifTemplate: 'poster',
  },

  psychedelic: {
    brand: { es: 'Cartel Caleidoscopio', en: 'Kaleidoscope Poster' },
    eyebrow: { es: 'SESIÓN ÚNICA · PUERTAS 20:00', en: 'ONE NIGHT ONLY · DOORS 20:00' },
    intro: {
      es: 'Un cartel que se mueve aunque esté quieto. Una idea, tres colores y ninguna prisa.',
      en: 'A poster that moves even when still. One idea, three colours and no hurry.',
    },
    sectionTitles: {
      es: ['El pulso', 'La espiral', 'La salida'],
      en: ['The pulse', 'The spiral', 'The exit'],
    },
    quote: {
      es: { text: 'Lo que gira también encuentra su centro.', author: 'Nota de cartel' },
      en: { text: 'What spins also finds its centre.', author: 'Poster note' },
    },
    cta: { es: 'RESERVAR LUGAR', en: 'SAVE A SEAT' },
    chapterTitles: {
      es: ['La espiral', 'El pulso', 'El centro', 'La salida'],
      en: ['The spiral', 'The pulse', 'The centre', 'The exit'],
    },
    details: {
      es: [
        'La espiral empieza en una esquina y termina en el ojo.',
        'El pulso repite cada cuatro tiempos, como una respiración.',
        'En el centro hay un círculo quieto que ordena todo.',
        'La salida es un borde que no termina de cerrarse.',
      ],
      en: [
        'The spiral starts in a corner and ends in the eye.',
        'The pulse repeats every four beats, like breathing.',
        'At the centre there is a still circle that orders everything.',
        'The exit is an edge that never quite closes.',
      ],
    },
    fact: {
      es: 'Tres colores saturados bastan para que el ojo invente el cuarto.',
      en: 'Three saturated colours are enough for the eye to invent a fourth.',
    },
    deckPoints: {
      es: [
        { title: 'PULSO', body: 'Cuatro tiempos y otra vez.' },
        { title: 'ESPIRAL', body: 'De la esquina al centro.' },
        { title: 'SALIDA', body: 'El borde nunca cierra del todo.' },
      ],
      en: [
        { title: 'PULSE', body: 'Four beats, then again.' },
        { title: 'SPIRAL', body: 'From the corner to the centre.' },
        { title: 'EXIT', body: 'The edge never quite closes.' },
      ],
    },
    deckStats: {
      es: [
        { value: '1', label: 'noche' },
        { value: '03', label: 'colores' },
      ],
      en: [
        { value: '1', label: 'night' },
        { value: '03', label: 'colours' },
      ],
    },
    roomTitles: {
      es: ['La entrada', 'Sala del pulso', 'Sala de la espiral', 'La salida'],
      en: ['Entrance', 'Pulse room', 'Spiral room', 'Exit'],
    },
    itemLabels: {
      es: ['Cartel', 'Tinta', 'Luz'],
      en: ['Poster', 'Ink', 'Light'],
    },
    gifSubtitle: { es: 'NO TE QUEDES QUIETO.', en: 'DO NOT STAND STILL.' },
    motionSubtitle: { es: 'GIRA DESPACIO.', en: 'SPIN SLOWLY.' },
    motionScene: 'ribbon',
    experienceKind: 'club',
    storyKind: 'story',
    gifTemplate: 'loop',
  },
};
