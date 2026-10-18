# Canvas skill

You are the artist. The tool gives you a canvas, a palette, a set of brushes and an animation clock; it does **not** choose a scene, a character or a composition for you.

Call `beauty_create_canvas` with a `layers` array. Every layer is independent. You can paint a landscape, a typographic poster, an abstract field, a diagram, a collage or something stranger.

## The palette is the style

Use **tokens**, not arbitrary colour:

`@bg`, `@surface`, `@ink`, `@muted`, `@accent`, `@accent2`, `@accent3`, `@accent4`, `@deep`.

The renderer resolves them to the chosen style. If you pass a hex, it must be one of that style's exact palette values; otherwise the canvas is rejected. That is how a composition stays inside a style without flattening your choices.

## Brushes

| Layer | What it is |
| --- | --- |
| `rect` | field, panel, band, window |
| `circle` / `ellipse` | sun, moon, eye, coin, orbit, soft shape |
| `path` | the main brush: any SVG path, thin line or filled shape |
| `polygon` | crystal, roof, mountain, shard |
| `line` | rule, thread, horizon, connection |
| `text` | a word or a line of type; `font` is `display`, `body` or `mono` |
| `group` | move, fade, rotate or animate a family of layers together |
| `image` | a real asset, with `alt`, `caption`, `source` |

Every layer can have:

```json
{
  "opacity": 0.8,
  "blend": "multiply",
  "animation": "drift",
  "delay": 0.4,
  "speed": 0.8,
  "transform": { "x": 40, "y": -20, "rotate": -3, "scale": 1.1 }
}
```

## Animation

`none`, `drift`, `float`, `sway`, `spin`, `breathe`, `pulse`, `draw`, `reveal`.

- `draw` is for strokes; it uses `stroke-dashoffset`.
- `reveal` is for type or a foreground panel.
- `drift`/`float` are slow; `spin` is for a ring or a sun.
- A canvas can be still. Motion is an ingredient, not a requirement.

The renderer adds `prefers-reduced-motion` automatically.

## Compose

- Start with a **field** (rect or path), then one **focal shape**, then one **detail** and, if needed, one **word**.
- Leave empty space. The canvas is not a dashboard.
- Use scale contrast: one very large shape, one tiny mark, one line.
- Keep text readable. Put it on a calm field or give it a solid plate.
- A loop should survive a minute. Slow is almost always better.
- If you use an image, `alt` is required; `caption` and `source` are strongly encouraged. The renderer puts them in the SVG metadata and, when present, in a small credit line.

## Example

```json
{
  "style": "nature",
  "title": "Carta al mar",
  "size": "landscape",
  "texture": "paper",
  "duration": 16,
  "layers": [
    { "kind": "rect", "x": 0, "y": 0, "width": 1600, "height": 1000, "fill": "@surface" },
    { "kind": "path", "d": "M0 640 C 260 560 420 720 680 620 S 1160 680 1600 560 V1000 H0Z", "fill": "@accent3", "animation": "drift", "speed": 0.7 },
    { "kind": "circle", "cx": 1200, "cy": 250, "r": 100, "fill": "@accent4", "animation": "breathe" },
    { "kind": "text", "text": "Carta al mar", "x": 80, "y": 820, "size": 96, "font": "display", "fill": "@ink" }
  ]
}
```

## What not to do

- Do not ask the tool for a pre-made character or a fixed scene. Paint one with paths, circles and groups if you want it.
- Do not use a colour outside the palette.
- Do not animate every layer.
- Do not put text under a busy wave without checking contrast.
- Do not call an external script, a stock image or a video. The canvas is SVG.
