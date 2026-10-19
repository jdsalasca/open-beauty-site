# Raster font registry

The narrative renderer registers only these repository-bundled families through `src/canvas.ts`:

| Family | Bundled faces | License text |
|---|---|---|
| Archivo Black | Regular | `OFL-archivoblack.txt` |
| EB Garamond | Regular, SemiBold, Italic | `OFL-ebgaramond.txt` |
| Fraunces (Soft) | Soft | `OFL-fraunces.txt` |
| Nunito Sans | Regular, Bold, ExtraBold | `OFL-nunitosans.txt` |
| Space Mono | Regular, Bold | `OFL-spacemono.txt` |

No font package or font binary was added for this foundation. The existing font files do not record upstream release versions; `repo-bundled-ofl-1` identifies this repository's current bundle, not an upstream release number. `pnpm fonts:check` verifies registered family/weight and renders/measures Spanish glyphs before a raster role is used. Missing faces fail with `FONT_MISSING`; system fallback is not an approved substitute. Canvas misreads the bundled Fraunces Soft metrics when the exact registered CSS weight `560` is requested; raster drawing requests weight `400`, which selects the same bundled face with correct physical metrics. The runtime check confirms all 22 required Spanish glyphs, including digits and `·`, paint and measure without a substitute.

## Per-style role mapping

Role order is **display / reading / label / figure / annotation**. Guide families are preferences; the raster renderer uses the approved bundled alternative shown below. Weight is declared per role in `src/narrative/fonts.ts` and must match a registered face.

| Style | Guide preferred: display / reading | Approved bundled alternative: display / reading / label / figure / annotation |
|---|---|---|
| Renaissance | EB Garamond / EB Garamond | EB Garamond / EB Garamond / EB Garamond / EB Garamond / EB Garamond |
| Brutalist | Archivo Black / Space Mono | Archivo Black / Space Mono / Space Mono / Archivo Black / Space Mono |
| Papercraft | Fraunces Soft / Nunito Sans | Fraunces Soft / Nunito Sans / Nunito Sans / Fraunces Soft / Space Mono |
| Art Deco | Poiret One / Josefin Sans | Archivo Black / EB Garamond / Space Mono / EB Garamond / Space Mono |
| Isotype | Jost / IBM Plex Sans | Archivo Black / Nunito Sans / Nunito Sans / Archivo Black / Space Mono |
| Op Art | Archivo Black / Space Grotesk | Archivo Black / Nunito Sans / Nunito Sans / Archivo Black / Space Mono |
| Ukiyo-e | Shippori Mincho B1 / Zen Kaku Gothic New | EB Garamond / Nunito Sans / Nunito Sans / EB Garamond / Space Mono |
| Bestiary | UnifrakturMaguntia / IM Fell English | EB Garamond / EB Garamond / Space Mono / EB Garamond / Space Mono |
| Psychedelic | Bungee Shade / Space Grotesk | Archivo Black / Nunito Sans / Nunito Sans / Archivo Black / Space Mono |
| Memphis | Bricolage Grotesque / DM Sans | Nunito Sans / Nunito Sans / Nunito Sans / Nunito Sans / Space Mono |
| Vaporwave | Press Start 2P / Space Grotesk | Space Mono / Nunito Sans / Nunito Sans / Space Mono / Space Mono |
| Galactic | Michroma / Space Grotesk | Space Mono / Nunito Sans / Nunito Sans / Space Mono / Space Mono |
| Nature Memory | Cormorant Garamond / Karla | EB Garamond / Nunito Sans / Nunito Sans / EB Garamond / Space Mono |

Papercraft renders display and figure roles with bundled Fraunces Soft and reading/labels with bundled Nunito Sans. The remaining rows list effective bundled alternatives where the guide-preferred file is not present. The pilot review status is recorded per scene, separately from font registration.
