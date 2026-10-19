# Issue 3 audit: current branch versus the 84c54b4 snapshot

## Scope and evidence

The issue's static audit targeted `84c54b413d94a28b24f9275015c0fe694454da00`. This worktree started at `04e87ee` (`docs: snapshot issue 3...`), so source reproductions below use that task-entry commit where a pre-fix baseline is needed. The sequence regression tests were committed red at `9442fb2` and fixed at `4c2c096`; current-code outcomes are reported separately. No production narrative scene is registered. The URL `https://grid.adminml.com/d/01M50F2X7P22EER1R9VSX68F9S/view` is behind Google sign-in and was **not accessed**. No claims below imply that the board or a production narrative GIF was visually reviewed.

To compare the reference once access is available, please provide: (1) a full-board screenshot with its section labels and surrounding context, (2) native-size close-ups of the Renaissance, Paper Craft and documentary Brutalist examples, (3) a 640×360 card view showing the smallest text, and (4) a short capture or frame sequence showing entry, reading hold, transitions and loop restart. These let us judge hierarchy, material, type and timing without guessing the reference content.

## Nine findings

Verdicts refer to the worktree at close. The reproduction column records commands actually run and the observed result; commands that inspect the old source explicitly pin `04e87ee`.

| # | Verdict | Reproduction command and observed output | Decision / remaining limit |
|---|---|---|---|
| 1 | **PARTIAL** | `git show 04e87ee:src/gif.ts \| Select-String -Pattern 'function frameShowcase\|  (artdeco\|isotype\|opart\|ukiyoe\|bestiary\|psychedelic\|memphis\|vaporwave\|galactic\|nature): frameShowcase'` → one `frameShowcase` function and ten registry entries; its title family branches only to Space Mono, EB Garamond or Archivo Black. `pnpm fonts:check` → 65 style/role checks across 13 styles pass. | Raster font roles now have per-style preferred/effective maps and glyph checks. The legacy GIF still shares `frameShowcase` for ten styles, and narrative has no production scenes, so no style-specific narrative composition is claimed. |
| 2 | **PARTIAL** | `pnpm dev gif --style brutalist --text "Un mensaje que sigue siendo legible" --width 1400 --height 720 --fps 6 --duration 15 --out "$env:TEMP/open-beauty-narrative-audit/simple.gif"` → `Brutalist GIF · 1200×720 · 48 frames`. `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,nb_frames,duration -show_entries format=duration -of json "$env:TEMP/open-beauty-narrative-audit/simple.gif"` → 1200×720, 48 frames, 6.240s. | The legacy single-title path still clamps dimensions/duration. The narrative brief can express phases, 1280×720 and long holds, but a production request currently returns `STYLE_NOT_SUPPORTED_YET`; renderable narrative output remains partial. |
| 3 | **REFUTED** | `git show 04e87ee:src/gif.ts \| Select-String -Pattern 'function layoutTitle','slice(0, options.maxLines)' -Context 0,25` → old fallback ended with `.slice(0, options.maxLines)`. `pnpm exec tsx --test test/gif-quality.test.ts` → 18/18 pass after the change. | Legacy layout now retains every wrapped line and reports `gif-title-overflow` through its optional diagnostics sink. The narrative layout returns typed `TEXT_OVERFLOW`; it does not lower text under its minimum sizes. |
| 4 | **CONFIRMED** | `pnpm exec tsx --test test/make.test.ts` → the `make gif` matrix asserts vision checks are exactly `gif-format`, `animated`, `dimensions`, `non-empty`, reports 4/4, and says “no changes are needed” for a clean result. `pnpm dev make gif --style brutalist --idea "Un aviso acompana la revision documental" --out "$env:TEMP/open-beauty-narrative-audit/make.gif"` → wrote an 800×800, 48-frame file. | This remains the legacy `make` contract, not visual approval. The new narrative evaluator exposes five separate levels and never recommends publication; unsupported scenes fail before generating files. |
| 5 | **PARTIAL** | `git show 04e87ee:src/canvas.ts \| Select-String -SimpleMatch -Pattern 'Archivo Black','Space Mono','EB Garamond','Fraunces','Nunito Sans'` → five registered families. `pnpm fonts:check` → every registered role rendered/measured all 22 required glyphs in each of 13 styles (65 roles). | Guide families unavailable as bundled raster faces use explicit approved alternatives in `src/narrative/fonts.ts` and `fonts/FONTS.md`. No new package or font file was added. The alternatives have not received per-style visual approval; missing faces/glyphs fail `FONT_MISSING`. |
| 6 | **REFUTED** | `git show 04e87ee:src/sequence.ts \| Select-String -SimpleMatch -Pattern 'let palette','quantize(pixels','const count' -Context 0,2` → baseline sequence palette initialized from its first scene. `pnpm exec tsx --test test/sequence.test.ts` → current sequence uses 3 frames / `[500,500,500]ms` for three 0.5s scenes and 2 frames / `[7600,7600]ms` for two 7.6s scenes; the palette samples all authored scenes. Narrative encoding samples every timeline frame and records measured palette loss. | The first-scene-only palette finding no longer describes the current sequence or narrative foundation. Palette sampling and measured color loss do not guarantee retention of every semantically critical color; there are no production scenes to review yet. |
| 7 | **PARTIAL** | `git show 04e87ee:skills/beauty.md \| Select-String -SimpleMatch -Pattern 'beauty make','beauty fix','coming soon'` → `make` and `fix` are already documented; no “coming soon” hit. `git show 04e87ee:src/gif.ts \| Select-String -Pattern 'createRadialGradient\('` → three Renaissance radial gradients. | The stale-skill subfinding is refuted; the Renaissance glow still conflicts with `docs/ART-DIRECTION.md`'s flat-field rule. This foundation does not alter that production renderer. |
| 8 | **REFUTED** | Baseline: `$env:NARRATIVE_BASELINE_ROOT = "$env:TEMP/open-beauty-issue3-baseline-04e87ee"; pnpm exec tsx scripts/audit-sequence-baseline.ts` → `3x0.5s@6fps`: returned 3, decoded 360 frames, delays 360×170ms, effective 61,200ms vs 1,500ms declared. `2x7.6s@24fps`: returned 2, decoded 364 frames, delays 364×40ms, effective 14,560ms vs 15,200ms declared. Current: `pnpm exec tsx --test test/sequence.test.ts` → those cases decode to exactly 3×500ms and 2×7600ms. | Removed repeat inflation, kept one raster per authored scene, encoded holds as delays and sampled palette across all authored scenes. The SVG animation remains a sequence of static scene states; it does not interpolate transitions. |
| 9 | **PARTIAL** | `git show 04e87ee:src/sequence.ts \| Select-String -Pattern 'frameTime: 0.86|staticFrame: true|const repeats|for \(let n' -Context 0,1` → each scene used a fixed frame time, then repeated raster pixels. Current `pnpm exec tsx --test test/sequence.test.ts` → one encoded frame per authored scene. | Duplicate raster frames are gone, but the legacy sequence still contains authored static states without intermediate transitions. Narrative timeline creates explicit transitions and a loop bridge; visual motion depends on a future style scene implementation. |

### Reproducing the sequence baseline probe

The probe ran against an external temporary archive of `04e87ee`; it did not modify this worktree. `scripts/audit-sequence-baseline.ts` imports that snapshot's `renderSequence` and `test/support/gif-frames.ts`, builds the two cases above, decodes the returned bytes, groups the delay histogram and prints the declared/decoded duration. To reproduce after checkout:

```powershell
$baseline = Join-Path $env:TEMP 'open-beauty-issue3-baseline-04e87ee'
New-Item -ItemType Directory -Force $baseline | Out-Null
git archive 04e87ee | tar -xf - -C $baseline
New-Item -ItemType Junction -Path (Join-Path $baseline 'node_modules') -Target (Join-Path (Get-Location) 'node_modules')
$env:NARRATIVE_BASELINE_ROOT = $baseline
pnpm exec tsx scripts/audit-sequence-baseline.ts
Remove-Item Env:NARRATIVE_BASELINE_ROOT
```

The probe uses the existing sequence API and test decoder; it is deliberately not a second GIF encoder. The committed regression and corrected-output checks are `test/sequence.test.ts`.

## Independent decoder and ffprobe cross-check

`pnpm exec tsx --test test/narrative.test.ts` → 10/10 pass, including independent LZW integrity/delay checks, decoded five-second phase holds and the optional `ffprobe-crosscheck` control. A test-only scene emitted a 640×360, 33-frame GIF with 17,190ms duration; `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,nb_frames,duration -of json "$env:TEMP/open-beauty-narrative-audit/e2e/guias-claras-114b1385.gif"` returned width 640, height 360, 33 frames, duration 17.190000s, matching the independent decoder. The test also loaded the PNG and contact sheet. This verifies the harness fixture only, not a production style scene or its visual quality.

## Per-style scene/font audit

Each style below was passed to the narrative CLI with a valid three-phase brief. This PowerShell reproduction was run for all 13 slugs:

```powershell
$root = Join-Path $env:TEMP 'open-beauty-narrative-style-audit-20261019'
New-Item -ItemType Directory -Force $root | Out-Null
$styles = @('renaissance','brutalist','papercraft','artdeco','isotype','opart','ukiyoe','bestiary','psychedelic','memphis','vaporwave','galactic','nature')
foreach ($style in $styles) {
  $briefPath = Join-Path $root "$style.json"
  $outPath = Join-Path $root "narrative-$style"
  $brief = @{
    style=$style; kind='narrative-gif'; locale='en'; audience='Review'; title='Narrative'; status='in-review'
    phases=@(
      @{id='before';label='Before';text='The first state.';visual=@{kind='document';state='before'}},
      @{id='change';label='Change';text='The second state.';visual=@{kind='document';state='change'}},
      @{id='result';label='Expected result';text='Awaiting review.';visual=@{kind='document';state='expected'}}
    )
    playback=@{minReadableHoldMs=5000;transitionMs=650;loop=$true}
    output=@{width=640;height=360;formats=@('gif','png');preset='card-640x360'}; seed=7
  } | ConvertTo-Json -Depth 8
  Set-Content -LiteralPath $briefPath -Value $brief -Encoding utf8
  & pnpm exec tsx src/cli.ts narrative --style $style --brief $briefPath --out $outPath
  "exit=$LASTEXITCODE"
}
```

**Observed for each of the 13:** process exit 1; JSON diagnostic `STYLE_NOT_SUPPORTED_YET` with message `Narrative GIF scene for <style> is not implemented yet. Supported styles: none.` No output folder was created. The source comparison command `git show 04e87ee:src/gif.ts | Select-String -Pattern '  (renaissance|brutalist|papercraft|artdeco|isotype|opart|ukiyoe|bestiary|psychedelic|memphis|vaporwave|galactic|nature): frame'` returned the renderer mapping in the “legacy renderer” column. `pnpm fonts:check` returned 65/65 role checks and 22/22 glyphs for every role. The table records code/font facts, not aesthetic ratings.

| Style | Legacy GIF renderer | Effective display / reading font | Narrative verdict / observed result |
|---|---|---|---|
| Renaissance | `frameRenaissance` | EB Garamond / EB Garamond | PARTIAL · unsupported scene |
| Brutalist | `frameBrutalist` | Archivo Black / Space Mono | PARTIAL · unsupported scene |
| Papercraft | `framePapercraft` | Nunito Sans / Nunito Sans | PARTIAL · unsupported scene |
| Art Deco | shared `frameShowcase` | Archivo Black / EB Garamond | PARTIAL · unsupported scene |
| Isotype | shared `frameShowcase` | Archivo Black / Nunito Sans | PARTIAL · unsupported scene |
| Op Art | shared `frameShowcase` | Archivo Black / Nunito Sans | PARTIAL · unsupported scene |
| Ukiyo-e | shared `frameShowcase` | EB Garamond / Nunito Sans | PARTIAL · unsupported scene |
| Bestiary | shared `frameShowcase` | EB Garamond / EB Garamond | PARTIAL · unsupported scene |
| Psychedelic | shared `frameShowcase` | Archivo Black / Nunito Sans | PARTIAL · unsupported scene |
| Memphis | shared `frameShowcase` | Nunito Sans / Nunito Sans | PARTIAL · unsupported scene |
| Vaporwave | shared `frameShowcase` | Space Mono / Nunito Sans | PARTIAL · unsupported scene |
| Galactic | shared `frameShowcase` | Space Mono / Nunito Sans | PARTIAL · unsupported scene |
| Nature Memory | shared `frameShowcase` | EB Garamond / Nunito Sans | PARTIAL · unsupported scene |

`fonts/FONTS.md` contains every display/reading/label/figure/annotation role and guide-preferred family. Full-size production narrative GIF/PNG/contact-sheet captures, a 200px identity matrix, 640×360 reading review, motion/loop review and visual comparison against the sign-in-gated reference are **not evaluated** in Stage A+B foundations.
