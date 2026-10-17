---
name: open-beauty-education
description: Use open-beauty-site to build beautiful educational pages, lessons, museum rooms and explainers. Fits history, science, literature, art and maths without turning them into a corporate landing page.
---

# Education skill

An educational page is not a landing page with a syllabus. It has one job: make one idea unavoidable, then give the reader a way to use it.

## The brief

Before writing titles, define:

1. **One learning objective.** "After this page, the reader can explain why perspective made space political."
2. **One misconception.** What does the reader probably believe that is wrong? Write it down; the page should break it.
3. **One concrete detail.** A date, a measurement, a species, a line of a poem. Specificity is what makes it art.
4. **One source.** A book, a museum, a paper. Put it in the footer or the quote author. Do not invent citations.

Then choose a style:

- `renaissance` — art history, literature, architecture, religion, long-form essays.
- `papercraft` — biology, natural history, children's museums, crafts, food.
- `brutalist` — design, music, manifestos, events, data with attitude.

## The page as a room

Use `sections` as rooms, not features:

| Section | Job | Copy shape |
| --- | --- | --- |
| 1 | Hook | A concrete image or question. No definitions yet. |
| 2 | Concept | The idea, in one sentence, then one example. |
| 3 | Use | A small exercise, a comparison, or a "look closer" prompt. |

If you need four or five sections, use the same rhythm: hook → concept → example → exercise. Do not write three cards that all say "we are passionate".

A section body is one or two sentences. Put the nuance in the quote or the intro, not in a card.

## The missing blocks

The renderer currently gives you `title`, `tagline`, `intro`, `sections`, `quote` and `cta`. Treat them as:

- `intro` = the wall label. Two or three sentences, no "welcome".
- `sections` = the didactic sequence. Each `kicker` is a room number or a question.
- `quote` = the primary source. Always name the author and the work.
- `cta` = the next action: "Ver la lección", "Reservar visita", "Descargar la guía".

If the topic needs a figure, a definition box or a process diagram, write the figure as an inline SVG in a hand-edited page and validate it. Do not add a fake image URL.

## Slide version

For a lesson in 16:9, call `beauty_create_deck` (not `beauty_create_page`). The deck generates the cover, closing, navigation and animations. Use 4–6 content slides:

- hook (`statement`), three rooms (`points`), a primary source (`quote`), and one number or scale (`stats`).
- One idea per slide; title ≤8 words; body ≤35 words.
- A number or a source every second slide.
- The closing is the next action, not a summary.

The deck renderer does not have a `figure` field yet; use a `statement` with the number or a `quote` with the source and keep the artefact honest.

Static spec for a hand-built deck:
## Accessibility

- Reading level: short sentences, one clause per idea.
- Contrast: body text at least 4.5:1. Pastel fields are for text only when the validator's contrast check passes.
- Motion: respect `prefers-reduced-motion`; no flashing above 3 Hz.
- Alt text: describe what the figure teaches, not what it looks like.
- Language: set `locale` correctly; do not mix Spanish and English in one paragraph.

## Three briefs that work

### Art history / Renaissance
- Title: "La città ideale"
- Objective: explain how the vanishing point organizes power.
- Misconception: perspective is a neutral copy of reality.
- Sections: "Todo converge", "El fresco abre la pared", "El centro es político".
- Source: Alberti, *De pictura*, 1435.

### Natural history / Paper Craft
- Title: "Museo de las Cosas Pequeñas"
- Objective: show three strategies of seed dispersal.
- Misconception: seeds are passive.
- Sections: "La vida en una hoja", "Semillas viajeras", "Bichos arquitectos".
- Source: a local botanical garden or a field guide.

### Design / Brutalist
- Title: "El cartel que te detiene"
- Objective: explain figure/ground and scale in a poster.
- Misconception: a poster is a page with a big logo.
- Sections: "Una idea por pared", "El ojo primero", "El texto después".
- Source: a poster archive or a design museum.

## Never

- Lorem ipsum, fake quotes, invented dates, "en la era digital".
- Three cards that all say the same thing.
- A hero image that has nothing to do with the lesson.
- A CTA that says "Contáctanos" when the lesson is free.
- Vision below 4/4. If the page is obedient but forgettable, change the composition or the scale, not the adjectives.
