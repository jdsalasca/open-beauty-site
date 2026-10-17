---
name: open-beauty-presentation
description: Build a 16:9 animated presentation with open-beauty-site. Use when the user asks for a deck, slides, a keynote or a visual presentation instead of a page.
---

# Presentation skill

A deck is not a page cut into rectangles. It is a sequence of **one-idea rooms**.

For sprint review, retrospective or planning, read `skills/agile.md` too: the deck is the room, the GIF is the door. Real numbers only; no fake metrics.

## The brief

- **5–8 slides total**, including the cover and closing that the tool generates.
- `title` ≤8 words; `tagline` ≤1 sentence.
- One content slide = one idea. If a slide needs more than 35 words, split it.
- Choose one `subfamily` from `beauty_get_style`. A subfamily changes accent, ground and composition (`sala`, `gabinete`, `cartel`); it does not add fonts, colors or radii.

## Slide types

| Layout | Use it for | Shape |
| --- | --- | --- |
| `statement` | a thesis, a question, a turn | short title + one short paragraph |
| `points` | a method, three examples, a taxonomy | 2–4 cards, each ≤12 words |
| `stats` | scale, a date, a number that matters | 1–3 values + labels |
| `quote` | a primary source, a room note | ≤25 words + author |

Omit `layout` and the renderer infers it from `points`, `stats` or `quote`.

## Copy

- Titles are sentences without filler: "El archivo respira", not "Introducción".
- Bodies are one or two clauses. No bullet lists inside a paragraph.
- Numbers must be real or explicitly conceptual. Never invent a statistic.
- The closing is a door, not a summary: a CTA or a final question.

## Animation and navigation

The deck owns:

- entrance: fade + 14px rise, 0.7s, staggered;
- slide transition: fade + 22px, 0.7s;
- progress bar, arrows, `← → / space`, Home/End, `F` fullscreen, touch swipe;
- `prefers-reduced-motion`.

Do not ask for custom transitions, parallax libraries or autoplay video. The deck should work without animation.

## Accessibility

- One `h1` on the cover; `h2` on content slides.
- Body ≥18px equivalent; contrast comes from the preset.
- Never rely on color alone for the order.
- The deck is keyboard-navigable and prints all slides.

## Self-check

1. Can you read the deck with animations off?
2. Is there exactly one idea per slide?
3. Does the title of slide N make you want slide N+1?
4. Is the closing a real next step?
5. Does the subfamily feel like a room, not a recolour?

If the answer to 1, 2 or 5 is no, change the brief before touching the CSS.
