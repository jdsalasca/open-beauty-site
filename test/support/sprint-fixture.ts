export const RICH_SPRINT = {
  style: 'isotype',
  locale: 'es',
  team: { name: 'Cuadrilla Umbral', brand: 'Umbral' },
  sprint: {
    id: 'S14',
    start: '2026-09-28',
    end: '2026-10-09',
    goal: 'Cerrar el ciclo de lecturas del norte',
  },
  summary: 'Un sprint que ordenó la lectura del territorio.',
  stories: [
    { id: 'SC-101', title: 'Muestreo desigual del río', points: 5, status: 'done', owner: 'Lucía Rojas' },
    { id: 'SC-102', title: 'Mapa de sombras del valle', points: 3, status: 'done', owner: 'Mateo Gil' },
    { id: 'SC-103', title: 'Publicar una lectura común', points: 5, status: 'carried', owner: 'Sombra Común' },
    { id: 'SC-104', title: 'Calibrar la estación de niebla', points: 2, status: 'carried', owner: 'Lucía Rojas' },
    { id: 'SC-105', title: 'Podar el tablero heredado', points: 3, status: 'dropped', owner: 'Mateo Gil' },
  ],
  velocity: [
    { sprint: 'S10', committed: 13, done: 10 },
    { sprint: 'S11', committed: 15, done: 11 },
    { sprint: 'S12', committed: 14, done: 14 },
    { sprint: 'S13', committed: 18, done: 12 },
    { sprint: 'S14', committed: 18, done: 15 },
  ],
  burndown: [
    { day: '28/09', remaining: 18 },
    { day: '30/09', remaining: 16 },
    { day: '02/10', remaining: 15 },
    { day: '04/10', remaining: 11 },
    { day: '06/10', remaining: 7 },
    { day: '08/10', remaining: 3 },
    { day: '09/10', remaining: 0 },
  ],
  risks: [
    {
      title: 'Muestreo desigual',
      impact: 'mediciones de octubre poco comparables',
      mitigation: 'repetir el transecto con doble lectura',
      owner: 'Lucía Rojas',
    },
    {
      title: 'Dependencia de una sola estación',
      impact: 'lecturas frágiles de niebla',
      mitigation: 'sumar una estación móvil',
      owner: 'Mateo Gil',
    },
  ],
  retro: {
    wentWell: ['Leer el río antes de medir', 'Preguntas cortas al final del día'],
    toImprove: ['Menos tableros paralelos', 'Cerrar acuerdos por escrito'],
    actions: [
      { what: 'Publicar una lectura común cada viernes', owner: 'Sombra Común', due: '2026-10-16' },
      { what: 'Rotar el rol de estación móvil', owner: 'Lucía Rojas', due: '2026-10-23' },
    ],
  },
  capacity: [
    { person: 'Lucía Rojas', days: 8, focus: 'campo' },
    { person: 'Mateo Gil', days: 6, focus: 'mapas' },
    { person: 'Sombra Común', days: 4, focus: 'archivo' },
  ],
  nextGoal: 'Una lectura común del norte, publicada y discutida.',
} as const;

/**
 * A brief dense enough to overflow the old eight-slide cap: ten stories and
 * three detailed risks used to leave only one risk card in the review.
 */
export const LONG_SPRINT = {
  ...RICH_SPRINT,
  stories: [
    ...RICH_SPRINT.stories,
    { id: 'SC-106', title: 'Conciliar el archivo del valle', points: 3, status: 'done', owner: 'Lucía Rojas' },
    { id: 'SC-107', title: 'Nombrar las estaciones de niebla', points: 5, status: 'done', owner: 'Mateo Gil' },
    { id: 'SC-108', title: 'Publicar el mapa de sombras', points: 2, status: 'carried', owner: 'Sombra Común' },
    { id: 'SC-109', title: 'Revisar el tablero de campo', points: 3, status: 'done', owner: 'Lucía Rojas' },
    { id: 'SC-110', title: 'Cerrar la lectura del norte', points: 5, status: 'dropped', owner: 'Mateo Gil' },
  ],
  risks: [
    {
      title: 'Mezclar cortes y fallas',
      impact: 'las mediciones de octubre no se pueden comparar entre sí',
      mitigation: 'repetir el transecto con doble lectura y registrar la hora',
      owner: 'Lucía Rojas',
    },
    {
      title: 'Dependencia de una sola estación',
      impact: 'las lecturas de niebla quedan frágiles y sin contraste',
      mitigation: 'sumar una estación móvil al recorrido del norte',
      owner: 'Mateo Gil',
    },
    {
      title: 'Tablero duplicado',
      impact: 'el equipo mantiene dos fuentes de verdad para el mismo dato',
      mitigation: 'cerrar el tablero heredado y archivar sus datos',
      owner: 'Sombra Común',
    },
  ],
} as const;
