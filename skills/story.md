# Story skill

Use `beauty_create_story` for a **cuento**, a narrative essay, a history lesson or a chaptered museum text. The output is a single-file long-form page: cover, chapter nav, prose, a drop cap, plates, margin facts and a source.

Read `beauty_get_skill({ format: "story" })` and `beauty_get_style` before the brief.

## The shape

```json
{
  "style": "renaissance",
  "kind": "story",
  "title": "La casa que aprendió a respirar",
  "tagline": "Un cuento sobre una casa que creció alrededor de una conversación.",
  "eyebrow": "Cuento · 2026",
  "brand": "OPEN/BEAUTY",
  "chapters": [
    { "kicker": "I", "title": "La puerta", "body": "La casa tenía una puerta que no daba a ningún lado.\n\nUn día, el pasillo olió a lluvia." },
    { "kicker": "II", "title": "El cuarto de las cosas que vuelven", "body": "En el cuarto había una silla vacía. La silla se movía cuando la casa recordaba." },
    { "kicker": "III", "title": "La casa respira", "body": "La casa no se fue. Aprendió a respirar con quien la habitaba." }
  ]
}
```

## Rules

- **2–8 chapters.** A chapter is a scene, not a section of an essay. It must change what the reader knows, fears or wants.
- **80–250 words per chapter.** Less is a vignette; more is a different chapter.
- **One turn per chapter.** If the chapters can be reordered without loss, it is a list.
- **Facts are facts.** For history, every date, name, quote and attribution must come from the brief/source. Mark uncertainty explicitly. Never invent a primary quote.
- **A margin fact** (`fact`) is one concrete, sourced detail, not a moral.
- **A source** is required for history/lesson; for fiction it is optional and can name the author.
- **Drop cap, plates and progress are generated.** Do not ask for custom CSS or images.

## Recipes

### Cuento

Cover (image + promise) → chapter 1: a door → chapter 2: an obstacle or a strange object → chapter 3: a turn → chapter 4: a return that is not the same. One image per two chapters. The last line opens a door; it does not explain the moral.

### Storybook de papel

Para un cuento ilustrado, pasá `format: "storybook"`. Cada capítulo puede llevar una `scene`:

```json
{ "kind": "meadow", "characters": ["rabbit"], "props": ["pine", "tree", "flowers"], "caption": "El sombrero en el camino" }
```

`kind`: `meadow | forest | garden | house | river | night | market | room`. `characters`: `rabbit | cat | fox | bird | child | farmer`. `props`: `pine | tree | house | gate | table | lantern | basket | flowers | boat | cabbage | fence | wheelbarrow`. El renderer dibuja una escena de papel original; no hay personajes con derechos. Usalo en Paper Craft; en otros estilos la misma escena se adapta a la paleta.

## Historia

Use `"kind": "history"` so the art uses a river/map register and the validator treats the source as essential. Cover (place + date) → chapter 1: the world before → 2: the event → 3: who was excluded → 4: what changed and what did not. Add a `fact` with a date and a source. End with a question and a bibliography.

### Lección

Cover (one question) → 1: a concrete object → 2: the concept → 3: a transfer to another case → 4: a short activity (a comparison or a written observation). Use `fact` for the evidence and `source` for the reading.

### Ensayo narrativo

One "I" and one subject; a scene every 300 words; no listicles. The style is the room, not the argument.

## Self-check

1. Does every chapter change the story?
2. Could a reader retell it in three sentences?
3. Is the ending a door, not a summary?
4. Is every fact traceable, or marked as unknown?
5. Does it read well at 390 px and in print?

If 1 or 4 fails, do not render yet.
