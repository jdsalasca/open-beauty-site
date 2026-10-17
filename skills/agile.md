# Agile rooms skill

Use the harness for **sprint review, retrospective and planning** without turning them into a corporate template. A deck is a room; a GIF is the door.

Read `beauty_get_skill({ format: "deck" })` and `beauty_get_style` first. Use `beauty_create_deck` for the room and `beauty_create_gif` for a 2–5 word teaser.

## Sprint review

A review is evidence, not a status meeting. 6–8 content slides:

1. `statement` — the promise of the sprint in one sentence.
2. `stats` — three real numbers: shipped, learned, still open.
3. `points` — three things that changed for the user (not tasks).
4. `compare` or `points` — planned vs. actually shipped.
5. `quote` — one user/customer voice, with source or "internal".
6. `statement` — the decision the room has to make.
7. `closing` — the next bet and who owns it.

Never invent a metric. If a number is unknown, use a question or a range, not a fake percentage.

## Retrospective

A retro is a room for honesty. 5–7 content slides:

1. `statement` — the question: “What did this sprint teach us?”
2. `points` — keep / stop / try, three cards max each.
3. `stats` — one fact about flow (cycle time, WIP, interruptions) or omit.
4. `quote` — one anonymous line from the team.
5. `statement` — one experiment for the next sprint, with an owner.
6. `closing` — the door: check-in date.

Do not use a “temperature check” emoji. Use a word, a number or a silence.

## Sprint planning

A plan is a bet, not a wish list. 6–8 content slides:

1. `statement` — the one outcome the sprint is buying.
2. `points` — three bets, each with a user outcome.
3. `stats` — capacity and one constraint (real days, people, budget).
4. `points` — what we are explicitly **not** doing.
5. `quote` — a principle or a prior learning.
6. `statement` — the first checkpoint and the decision rule.
7. `closing` — who does what by when.

## GIF teaser

`beauty_create_gif` with `text: "Sprint 14"` (or “Review”, “Retro”, “Plan”) and a subtitle such as `"Viernes 10:00 · Sala 2"`. Template `title`. 800×800. The GIF is a door, not the agenda.

## Tone

- Verbs, numbers, names. No “synergy”, “alignment”, “journey”, “unlock”.
- One accent per deck. One idea per slide.
- The room must still work with the animations off.
- A deck that could belong to any company is a missed opportunity: use the style’s voice, but keep the facts plain.
