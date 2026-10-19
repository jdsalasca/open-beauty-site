# check:all report

- Generated: 2026-10-19T20:26:39.112Z
- Node: v24.21.0 · win32 x64 · 8 CPUs
- Browser timeout: 60000 ms (BEAUTY_BROWSER_TIMEOUT_MS unset → default 60000)
- Overall: PASS

## Steps

| Step | Command | Status | Duration | Tests | Pass | Fail | Skipped | Timeout mentions |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| check | `pnpm check` | PASS | 1.5s | — | — | — | — | 0 |
| build | `pnpm build` | PASS | 2.0s | — | — | — | — | 0 |
| check:scripts | `pnpm check:scripts` | PASS | 1.4s | — | — | — | — | 0 |
| test:unit | `pnpm test:unit` | PASS | 346.5s | 439 | 439 | 0 | 0 | 0 |
| test:browser | `pnpm test:browser` | PASS | 273.7s | 21 | 21 | 0 | 0 | 0 |

## Failures

None: every step exited 0.

## check output (tail)

```text
$ tsc -p tsconfig.json --noEmit
```

## build output (tail)

```text
$ tsc -p tsconfig.json
```

## check:scripts output (tail)

```text
$ tsc -p tsconfig.scripts.json --noEmit
```

## test:unit output (tail)

```text
✔ default output folders never collide between parallel runs (650.9483ms)
✔ the same brief and output produce byte-identical HTML and GIFs (812.6772ms)
✔ every style produces an A kit with its data and GIFs (4844.3818ms)
✔ the review GIF animates the velocity data, not only the decoration (24.1428ms)
✔ the review renders every risk even when the stories fill the deck (293.7014ms)
✔ legacy blockers are rendered as a risk-like list, not dropped (285.0521ms)
✔ the retrospective title is derived from the team and sprint (293.7272ms)
✔ every sprint GIF opens composed and wraps within 1.5x the median step (6445.7112ms)
✔ one style of sprint GIFs stays under 2.5 MiB at default settings (28212.4285ms)
✔ sprint GIF size, fps and frame count are clamped (167.7489ms)
✔ fidelity issues list every missing story, risk and action (1.9269ms)
✔ a legacy minimal brief still parses (13.6092ms)
✔ legacy team strings and dates keep working (0.9701ms)
✔ a rich brief normalizes every field (8.0296ms)
✔ velocity keeps only the last five sprints (0.7036ms)
✔ wrong types produce field-level errors, never [object Object] (2.1256ms)
✔ an invalid story status names the field and the allowed values (1.2901ms)
✔ a team object without a name fails on team.name (0.9683ms)
✔ unknown fields warn instead of disappearing silently (0.4964ms)
✔ legacy blockers accept up to 300 characters with a clear limit (1.8708ms)
✔ the sprint id is required to be non-empty (1.8939ms)
✔ every registered style renders a well-formed document in both locales (96.2595ms)
✔ every registered style escapes injected markup and hostile hrefs (25.6527ms)
✔ every registered style is deterministic for the same brief (95.6158ms)
✔ every registered subfamily renders a well-formed deterministic deck (132.4278ms)
✔ every issue teaches with code, severity, where, why, fix and example (12.9432ms)
✔ repairable rules carry a machine-applicable patch (2.9352ms)
✔ multiple h1 and papercraft hard shadows also carry patches (3.6765ms)
✔ clean generated pages carry no issues and no patches (102.624ms)
✔ the nearest palette token is offered for an off-palette colour (0.7722ms)
ℹ tests 439
ℹ suites 0
ℹ pass 439
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 345415.3896
$ tsx scripts/test-suite.ts unit
```

## test:browser output (tail)

```text
✔ a webdriver page shows every reveal immediately, without scrolling (754.4775ms)
✔ the ?static parameter reveals everything for humans too (531.7452ms)
(node:24068) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
✔ every recipe renders zero text-too-small findings at 360px (32108.0675ms)
✔ comparison gallery is keyboard operable, keeps reduced-motion static, and fits 360px without requesting GIFs early (2285.5518ms)
✔ gallery playback, keyboard lightbox, downloads and mobile layout work in Chromium (1874.1298ms)
✔ every style page passes the geometry contract from 320px to 1440px (73240.1376ms)
✔ four and five card grids never leave a single orphan item (64267.0643ms)
(node:11536) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
✔ summarizeMatrix counts perfect cells only (3.0658ms)
✔ formatVisualMatrix prints the score table and the finding codes (1.1062ms)
✔ formatVisualMatrix reports cells near the bar with their codes (0.5871ms)
✔ every recipe artefact scores A 100 in the full visual matrix (86118.7938ms)
(node:35916) [DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities, as the arguments are not escaped, only concatenated.
(Use `node --trace-deprecation ...` to show where the warning was created)
✔ visual rule horizontal-overflow reports its code and selector (2237.2586ms)
✔ visual rule fixed-sticky-element-occludes-text reports its code and selector (0.4362ms)
✔ visual rule orphan-grid-item reports its code and selector (0.1996ms)
✔ visual rule clipped-text reports its code and selector (0.1666ms)
✔ visual rule text-too-small reports its code and selector (0.1344ms)
✔ visual rule overlap-decoration-on-content reports its code and selector (0.0977ms)
✔ visual rule mid-word-break reports its code and selector (0.0898ms)
✔ visual issues count in the score and cap the grade below A (2072.0694ms)
✔ visual repairs are automatic and idempotent (4624.2735ms)
✔ the strict bar requires craft A, 90+ and vision 4/4 (0.7137ms)
ℹ tests 21
ℹ suites 0
ℹ pass 21
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 272708.8829
$ tsx scripts/test-suite.ts browser
```
