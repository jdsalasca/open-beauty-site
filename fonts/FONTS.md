# Raster font registry

The narrative renderer registers repository-bundled OFL faces through `src/canvas.ts`. The original five families remain registered unchanged; the sixteen guide families that were previously proxied now ship as real faces. Every face is Latin-subset `.woff2`, obtained from the npm registry via `@fontsource/*` packages, copied into this directory and then removed from `package.json`/`pnpm-lock.yaml`. No font was downloaded from another URL and no system font is used as a substitute.

Total added font weight: **415,984 bytes (406.2 KiB)** across 21 files, below the 4 MB budget.

| Family | Bundled faces | Source package | Version | License | Bytes |
|---|---|---|---|---|---|
| Poiret One | 400 | `@fontsource/poiret-one` | 5.3.0 | `OFL-poiretone.txt` | 7,824 |
| Josefin Sans | 400, 600 | `@fontsource/josefin-sans` | 5.3.0 | `OFL-josefinsans.txt` | 24,704 |
| Jost | 500 | `@fontsource/jost` | 5.3.0 | `OFL-jost.txt` | 10,476 |
| IBM Plex Sans | 400, 500 | `@fontsource/ibm-plex-sans` | 5.3.0 | `OFL-ibmplexsans.txt` | 46,772 |
| Space Grotesk | 400, 500 | `@fontsource/space-grotesk` | 5.3.0 | `OFL-spacegrotesk.txt` | 26,700 |
| Shippori Mincho B1 | 700 (Latin subset only) | `@fontsource/shippori-mincho-b1` | 5.3.0 | `OFL-shipporiminchob1.txt` | 32,652 |
| Zen Kaku Gothic New | 400, 500 (Latin subset only) | `@fontsource/zen-kaku-gothic-new` | 5.3.1 | `OFL-zenkakugothicnew.txt` | 19,340 |
| UnifrakturMaguntia | 400 | `@fontsource/unifrakturmaguntia` | 5.3.0 | `OFL-unifrakturmaguntia.txt` | 26,512 |
| IM Fell English | 400 | `@fontsource/im-fell-english` | 5.3.0 | `OFL-imfellenglish.txt` | 59,880 |
| Bungee Shade | 400 | `@fontsource/bungee-shade` | 5.3.0 | `OFL-bungeeshade.txt` | 30,368 |
| Bricolage Grotesque | 700 | `@fontsource/bricolage-grotesque` | 5.3.0 | `OFL-bricolagegrotesque.txt` | 22,384 |
| DM Sans | 400, 500 | `@fontsource/dm-sans` | 5.3.0 | `OFL-dmsans.txt` | 28,504 |
| Press Start 2P | 400 | `@fontsource/press-start-2p` | 5.3.0 | `OFL-pressstart2p.txt` | 12,512 |
| Michroma | 400 | `@fontsource/michroma` | 5.3.0 | `OFL-michroma.txt` | 17,908 |
| Cormorant Garamond | 400 | `@fontsource/cormorant-garamond` | 5.3.0 | `OFL-cormorantgaramond.txt` | 22,876 |
| Karla | 400, 600 | `@fontsource/karla` | 5.3.0 | `OFL-karla.txt` | 26,572 |

The original bundle remains unchanged:

| Family | Bundled faces | License text |
|---|---|---|
| Archivo Black | Regular | `OFL-archivoblack.txt` |
| EB Garamond | Regular, SemiBold, Italic | `OFL-ebgaramond.txt` |
| Fraunces (Soft) | Soft | `OFL-fraunces.txt` |
| Nunito Sans | Regular, Bold, ExtraBold | `OFL-nunitosans.txt` |
| Space Mono | Regular, Bold | `OFL-spacemono.txt` |

The original five files do not record upstream release versions; `repo-bundled-ofl-1` identifies this repository's baseline bundle, not an upstream release number. The new files keep the exact `@fontsource` versions above. `@napi-rs/canvas` registers both `.woff2` and `.woff`; `.woff2` was chosen for size and verified by `pnpm fonts:check`.

## Per-style role mapping

Role order is **display / reading / label / figure / annotation**. These are the effective guide families and weights used by stage C; papercraft and brutalist keep their pilot roles unchanged.

| Style | Display | Reading | Label | Figure | Annotation |
|---|---|---|---|---|---|
| Renaissance | EB Garamond 600 | EB Garamond 400 | EB Garamond 600 | EB Garamond 600 | EB Garamond 400 |
| Brutalist | Archivo Black 400 | Space Mono 400 | Space Mono 700 | Archivo Black 400 | Space Mono 400 |
| Papercraft | Fraunces 560 | Nunito Sans 400 | Nunito Sans 800 | Fraunces 560 | Space Mono 400 |
| Art Deco | Poiret One 400 | Josefin Sans 400 | Josefin Sans 600 | Poiret One 400 | Josefin Sans 400 |
| Isotype | Jost 500 | IBM Plex Sans 400 | IBM Plex Sans 500 | Jost 500 | IBM Plex Sans 400 |
| Op Art | Archivo Black 400 | Space Grotesk 400 | Space Grotesk 500 | Archivo Black 400 | Space Grotesk 400 |
| Ukiyo-e | Shippori Mincho B1 700 | Zen Kaku Gothic New 400 | Zen Kaku Gothic New 500 | Shippori Mincho B1 700 | Zen Kaku Gothic New 400 |
| Bestiary | UnifrakturMaguntia 400 | IM Fell English 400 | IM Fell English 400 | UnifrakturMaguntia 400 | IM Fell English 400 |
| Psychedelic | Bungee Shade 400 | Space Grotesk 400 | Space Grotesk 500 | Bungee Shade 400 | Space Grotesk 400 |
| Memphis | Bricolage Grotesque 700 | DM Sans 400 | DM Sans 500 | Bricolage Grotesque 700 | DM Sans 400 |
| Vaporwave | Press Start 2P 400 | Space Grotesk 400 | Space Grotesk 500 | Press Start 2P 400 | Space Grotesk 400 |
| Galactic | Michroma 400 | Space Grotesk 400 | Space Grotesk 500 | Michroma 400 | Space Grotesk 400 |
| Nature Memory | Cormorant Garamond 400 | Karla 400 | Karla 600 | Cormorant Garamond 400 | Karla 400 |

`src/narrative/fonts.ts` keeps the previous bundled alternatives as an explicit `approvedAlternative` map. They are used **only** for an individual glyph the primary bundled face does not paint, and every substitution is reported by `pnpm fonts:check` and in the manifest. A missing font *file* never reaches that map: registration fails with `FONT_MISSING` (via `FONTS_MISSING`). All bundled Latin subsets cover `á é í ó ú ü ñ ¿ ¡`, digits, `%` and `·`; the arrow `→` exists only in Archivo Black, EB Garamond and Space Mono, so the fallback face supplies it explicitly. Where an old alternative (for example Nunito Sans) also lacked `→`, the map points to one of those glyph-complete faces instead of silently letting Skia use a system font.

## Verification

`pnpm fonts:check` verifies all 65 style/role combinations by rendering and measuring every required glyph, reports per-family results, and flags synthetic faces. Synthetic bold/italic is detected against the bundled registry: a role whose exact family/weight (or requested italic) is not bundled fails rather than being drawn with Skia's synthetic style. The Fraunces Soft file is registered as weight 560 but raster drawing requests weight 400, because Canvas misreads its metrics at the exact registered weight; it is the same physical face. Shippori Mincho B1 and Zen Kaku Gothic New ship their Latin subsets only (no CJK glyphs); stage C must not render Japanese text with these packaged files. The Nature guide names IBM Plex Mono for labels; that family is not part of this packaging brief, so the label/annotation roles use the guide's reading family Karla (600/400). Papercraft (Fraunces Soft + Nunito Sans) and brutalist (Archivo Black + Space Mono) keep their pilot roles, and `test/narrative-fonts.test.ts` proves the six committed pilot packs stay byte-identical.
