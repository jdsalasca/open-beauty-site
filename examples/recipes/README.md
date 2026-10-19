# Recipe briefs

Starter briefs for all 13 styles. Change the words, keep the tokens.

| Style | page | deck | story | experience | sprint |
| --- | --- | --- | --- | --- | --- |
| renaissance | [page](renaissance/page.json) | [deck](renaissance/deck.json) | [story](renaissance/story.json) | [experience](renaissance/experience.json) | [sprint](renaissance/sprint.json) |
| brutalist | [page](brutalist/page.json) | [deck](brutalist/deck.json) | [story](brutalist/story.json) | [experience](brutalist/experience.json) | [sprint](brutalist/sprint.json) |
| papercraft | [page](papercraft/page.json) | [deck](papercraft/deck.json) | [story](papercraft/story.json) | [experience](papercraft/experience.json) | [sprint](papercraft/sprint.json) |
| artdeco | [page](artdeco/page.json) | [deck](artdeco/deck.json) | [story](artdeco/story.json) | [experience](artdeco/experience.json) | [sprint](artdeco/sprint.json) |
| isotype | [page](isotype/page.json) | [deck](isotype/deck.json) | [story](isotype/story.json) | [experience](isotype/experience.json) | [sprint](isotype/sprint.json) |
| opart | [page](opart/page.json) | [deck](opart/deck.json) | [story](opart/story.json) | [experience](opart/experience.json) | [sprint](opart/sprint.json) |
| ukiyoe | [page](ukiyoe/page.json) | [deck](ukiyoe/deck.json) | [story](ukiyoe/story.json) | [experience](ukiyoe/experience.json) | [sprint](ukiyoe/sprint.json) |
| bestiary | [page](bestiary/page.json) | [deck](bestiary/deck.json) | [story](bestiary/story.json) | [experience](bestiary/experience.json) | [sprint](bestiary/sprint.json) |
| psychedelic | [page](psychedelic/page.json) | [deck](psychedelic/deck.json) | [story](psychedelic/story.json) | [experience](psychedelic/experience.json) | [sprint](psychedelic/sprint.json) |
| memphis | [page](memphis/page.json) | [deck](memphis/deck.json) | [story](memphis/story.json) | [experience](memphis/experience.json) | [sprint](memphis/sprint.json) |
| vaporwave | [page](vaporwave/page.json) | [deck](vaporwave/deck.json) | [story](vaporwave/story.json) | [experience](vaporwave/experience.json) | [sprint](vaporwave/sprint.json) |
| galactic | [page](galactic/page.json) | [deck](galactic/deck.json) | [story](galactic/story.json) | [experience](galactic/experience.json) | [sprint](galactic/sprint.json) |
| nature | [page](nature/page.json) | [deck](nature/deck.json) | [story](nature/story.json) | [experience](nature/experience.json) | [sprint](nature/sprint.json) |

## Sprint briefs

Every `sprint.json` carries the same data-driven contract: team, sprint dates
and goal, stories with status (`done` / `carried` / `dropped`), velocity,
burndown, risks, retros with owners and capacity. The kit turns each file into
a review, a retrospective and a planning deck plus three GIFs that animate the
numbers.

```bash
node dist/cli.js sprint --style isotype --brief examples/recipes/isotype/sprint.json --out out/isotype-sprint
node dist/cli.js validate out/isotype-sprint/review.html --style isotype --strict
```

Fields (all optional except `sprint` and `style`):

```json
{
  "style": "nature",
  "locale": "es",
  "team": { "name": "Cuadrilla Umbral", "brand": "Umbral" },
  "sprint": { "id": "I31", "start": "2026-09-28", "end": "2026-10-09", "goal": "Publicar una lectura común" },
  "summary": "Una frase honesta para abrir la review.",
  "stories": [{ "id": "UM-301", "title": "Contar los puntos de muestreo", "points": 3, "status": "done", "owner": "Lucía Rojas" }],
  "velocity": [{ "sprint": "I29", "committed": 17, "done": 12 }],
  "burndown": [{ "day": "28/09", "remaining": 16 }],
  "risks": [{ "title": "Muestreo desigual", "impact": "series incomparables", "mitigation": "doble lectura", "owner": "Lucía Rojas" }],
  "retro": { "wentWell": ["Leer antes de medir"], "toImprove": ["Menos tableros"], "actions": [{ "what": "Publicar cada viernes", "owner": "Sombra Común", "due": "2026-10-16" }] },
  "capacity": [{ "person": "Mateo Gil", "days": 6, "focus": "mapas" }],
  "nextGoal": "Una lectura que cualquiera pueda repetir."
}
```

Legacy minimal briefs (`{ "sprint": "15", "style": "nature", "team": "Equipo", "metrics": [...], "highlights": [...], "blockers": [...], "next": [...] }`) keep working. Wrong types fail with a field-level message (for example `stories.0.points: expected number, received string`); unknown fields are reported as warnings, never ignored silently.

Run with the CLI:

```bash
node dist/cli.js page --style <slug> --brief examples/recipes/<slug>/page.json --out out/<slug>.html
```
