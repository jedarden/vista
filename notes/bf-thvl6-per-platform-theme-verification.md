# bf-thvl6 — Per-platform theme verification (light + dark)

**Bead:** bf-thvl6 — Verify each platform frame renders correctly in light and dark themes.
**Result:** ✅ PASS — 160/160 checks. All 7 platforms verified in BOTH themes.
**Verification script:** `verify-theme-per-platform-bf-thvl6.js`
**Results artifact:** `test-7-platforms-theme-per-platform-bf-thvl6.json`

## Scope vs. sibling bead bf-662jl

- **bf-662jl** proved the *mechanism*: `FrameTheme.updateAllPlatformFrames(theme)`
  reaches all 7 platform frames in the aggregate — every frame gets *a* theme
  class, *a* `data-theme` attribute, *some* CSS vars re-applied.
- **bf-thvl6 (this bead)** proves per-platform *content correctness*: for each of
  the 7 platforms, individually, the sweep applies *that platform's own* theme
  variables (not the generic default fallback) and the result is legible in
  both dark and light.

## What was verified (acceptance criteria)

For each of **reddit, twitter, facebook, linkedin, instagram, youtube, tiktok**,
in BOTH dark and light:

| AC | Check |
|----|-------|
| AC1 | Frame gains the correct `{theme}-theme` class and drops the other theme's class on toggle |
| AC2 | `data-theme` AND `data-frame-theme` both update to the active theme |
| AC3 | All 12 platform chrome vars applied to the frame **exactly** equal `PLATFORM_FRAMES[p].themeVars[theme]` — only possible if `getPlatformThemeVars` returned the platform's own vars (not the default fallback) |
| AC4 | Chrome is legible: all 12 vars defined; bg dark/light inversion correct; text/bg contrast clears WCAG AA (≥ 4.5); no leftover `{{...}}` template tokens (no broken/unthemed elements) |

Additionally verified:
- **First paint**: the inline styles `buildContextFrame` emits via
  `getInlineThemeStyles` match the platform's dark themeVars, so the initial
  render is correct before any toggle.
- **Round-trip**: dark→light→dark restores `dark-theme` class + both attributes
  on every frame.

## How it runs

Plain Node (no jsdom/puppeteer). Loads the **real** `frames-theme.js` +
`platform-frames.js` modules, exposes the real `PLATFORM_FRAMES` global (so
`getPlatformThemeVars` takes the platform-specific path), drives a small DOM
shim built from the real markup `buildContextFrame` emits, and runs the real
`updateAllPlatformFrames` sweep over it. Exercises production logic against
production frame markup + production theme vars.

## Per-platform contrast (text-primary vs bg), WCAG AA ≥ 4.5

| Platform | dark | light |
|----------|------|-------|
| reddit   | 13.67 | 17.04 |
| twitter  | 17.24 | 18.51 |
| facebook | 12.30 | 20.38 |
| linkedin | 21.00 | 21.00 |
| instagram| 21.00 | 21.00 |
| youtube  | 19.17 | 19.17 |
| tiktok   | 21.00 | 17.40 |

All far exceed the 4.5 AA threshold — chrome is legible in both themes.

## Conclusion

Every one of the 7 platform frames swaps its theme class, theme attributes, and
platform-specific CSS variables correctly on toggle, and renders legible chrome
in both dark and light. Acceptance criteria fully met.
