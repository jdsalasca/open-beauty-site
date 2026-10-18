# Motion skill

An animated SVG is a **poster that moves**, not a page with a video. One idea, one focal movement, one loop. The model chooses a **style**, a **scene** and a **title**; the renderer owns the craft.

## Choose the scene

| Scene | Use it when | What moves |
| --- | --- | --- |
| `orbit` | space, memory, a system with satellites | rings rotate slowly; a planet breathes |
| `bloom` | nature, growth, a garden, a season | petals open and settle |
| `tide` | sea, time, a city by water | wave bands drift; a sun breathes |
| `papercut` | a storybook, a museum, a place with characters | layered paper scene and a slow stage float |
| `constellation` | archives, maps, memory, a night sky | stars twinkle; lines hold the constellation |
| `ribbon` | a launch, an identity, a manifesto | ribbons curl behind the type |
| `rain` | data, weather, a city, a mood | drops travel; a pulse ring breathes |
| `type` | a title, a quote, a one-word poster | a giant ghost word and a rule |
| `illustration` | a storybook garden, a farm, a scene with characters | layered paper vector scene; clouds drift, birds fly, flowers sway |

Pick the scene that already carries the meaning. Do not use `orbit` for a restaurant or `bloom` for a database. One scene per SVG; do not mix.

## Illustration

Use `scene: "illustration"` with an `illustration` object when the piece needs a **drawing**, not an abstract field:

```json
{
  "scene": "illustration",
  "illustration": {
    "kind": "garden",
    "characters": ["rabbit", "farmer", "bird"],
    "props": ["cabbage", "cabbage", "cabbage", "fence", "wheelbarrow"],
    "caption": "El huerto al mediodía"
  }
}
```

Kinds: `meadow | forest | garden | house | river | night | market | room`. Characters: `rabbit | cat | fox | bird | child | farmer`. Props: `pine | tree | house | gate | table | lantern | basket | flowers | boat | cabbage | fence | wheelbarrow`. The renderer draws the scene in the style palette; it is original vector paper, not stock and not a character IP. The art is a **composition**, not arbitrary drawing: choose the setting and cast that carry the story.

## Compose

- **Title:** 2–6 words. The renderer wraps it and fits the width; do not add line breaks yourself.
- **Subtitle:** optional, one line, max 90 characters. It is a caption, not a second paragraph.
- **Eyebrow/brand:** the small coordinates of the poster (e.g. `ARCHIVO PÚBLICO · 2026`).
- **Footer:** source, place or a quiet note. Max 120 characters.
- **Size:** `landscape` (1600×1000) for a screen, `square` (1200×1200) for a feed, `portrait` (1000×1400) for a poster.
- **Duration:** 6–24 seconds. 14 is the default. Slower is usually better.
- **Seed:** changes ornament placement deterministically.

## Motion rules

1. One focal movement, one supporting drift, one reveal. Nothing else.
2. Nothing moves faster than a season. The fastest loop is a twinkle; the stage never jitters.
3. The title is readable in the first second and at the end. If a scene hides the title, change the scene.
4. `prefers-reduced-motion` must show the final composition, with no animation.
5. No external images, no stock, no autoplay audio, no text smaller than 12 px.
6. The loop must be seamless enough to leave on screen for a minute.

## Maxxing

Pass `maxxing: true` for a hero loop. It adds grain, extra rings or particles and more type contrast. It never adds a new palette or a second scene.

## Brief

```json
{
  "style": "nature",
  "title": "El jardín de las horas lentas",
  "subtitle": "Una hoja prensada también es una forma de mirar el tiempo",
  "eyebrow": "ARCHIVO BOTÁNICO · 2026",
  "brand": "HERBARIO ERIDU",
  "scene": "bloom",
  "size": "landscape",
  "duration": 14,
  "maxxing": true,
  "footer": "SVG original · sin stock"
}
```

Then call `beauty_create_motion`. It returns the `.svg`, dimensions, scene, duration and checks. Open it in a browser; do not judge it from the file alone.

## What not to do

- Do not use a GIF as a substitute for a poster; use `beauty_create_motion` when the artefact is an SVG loop.
- Do not add a second title or a paragraph; the SVG is not a landing.
- Do not animate every layer; motion is hierarchy.
- Do not claim the loop is a video, a Lottie file or a stock animation.
