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
