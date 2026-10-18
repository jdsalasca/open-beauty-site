# Sequence skill

A sequence is a **storyboard that becomes an SVG and a GIF**. You draw each frame with the same open canvas brushes; the tool gives each frame a duration, a palette, a transition and an accessible credit block.

Call `beauty_create_sequence` with:

```json
{
  "style": "papercraft",
  "title": "Pedro, el conejo que no escuchó",
  "author": "Inspirado en Beatrix Potter, 1902",
  "license": "Dominio público · texto original",
  "size": "landscape",
  "fps": 12,
  "frames": [
    {
      "id": "01",
      "duration": 2.6,
      "layers": [
        { "kind": "rect", "x": 0, "y": 0, "width": 1600, "height": 1000, "fill": "@surface" },
        { "kind": "circle", "cx": 1240, "cy": 210, "r": 95, "fill": "@accent4" },
        { "kind": "text", "text": "Pedro no escuchó.", "x": 90, "y": 820, "size": 92, "font": "display", "fill": "@ink" }
      ]
    }
  ]
}
```

## Rule of the sequence

- **2–12 frames.** Each frame must have at least one layer.
- **One visual turn per frame.** A frame is not a slide with a title and three bullets; it is an image that changes the story.
- **Duration:** 0.3–12 seconds per frame. A GIF is short; a sequence is a rhythm.
- **Text inside the frame:** use `text` layers. Keep the words short enough to read in the time the frame is on screen.
- **No narrator box.** If the story needs a sentence, draw it as type.
- **Assets:** every `image` needs `alt`; `caption` and `source` appear in metadata and credits.
- **Palette:** use `@bg`, `@surface`, `@ink`, `@muted`, `@accent`, `@accent2`, `@accent3`, `@accent4`, `@deep`. No colour outside the style.
- **Reduced motion:** the first frame remains as a still.
- **License:** if the story is public domain, say it; if it is original, say CC0 or the licence you choose. Never call a copyrighted story public domain.

## Animation

Canvas layers can still use `drift`, `float`, `sway`, `spin`, `breathe`, `pulse`, `draw`, `reveal`. For sequences, the frame itself is the main motion: the transition between frames is a cut or a fade, not a zoom.

## Output

The tool writes:

- `title.svg` — a loopable animated SVG with one group per frame;
- `title.gif` — the same frames rasterised from the SVG, with the chosen FPS;
- checks for frames, alt, palette, keyframes, reduced motion and GIF bytes.

Open the SVG and the GIF. If the story only works in the SVG and not in the GIF, the art is too detailed for the frame time. Simplify, not decorate.
