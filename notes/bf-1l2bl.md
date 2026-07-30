# bf-1l2bl — Verify all 44 platform frames have complete theme support

**Status: VERIFIED COMPLETE — closed instead of re-split.**

This bead hit `failure-count:3` and the auto-split routine fired, but the
work was already fully implemented and verified across the child beads
(bf-50jgi Google Search, bf-2e9hk generic template, plus the earlier
bf-1p2uq / bf-65tmk / bf-2foil / bf-12zpw / bf-5yeeq theme-variable beads).
Closing directly rather than decomposing into duplicate children.

## Acceptance criteria — all met

| Criterion | Result |
|-----------|--------|
| All platforms have `hasThemeSupport: true` | ✅ 46/46 |
| Theme toggle works for all platforms | ✅ 46/46 dynamic |
| Dark/light switching functional | ✅ dark vs light differ per platform |
| Verification documentation | ✅ this file + HTML page + 2 scripts |
| Screenshot evidence | ✅ 94 PNGs (every platform, both modes) |

> Bead title says "44"; actual count is **46** (the platform list grew as
> new frames were added). All entries pass.

## Verification evidence

### Static (config-level) — `verify-all-44-theme-static-bf-1l2bl.js`
`RESULT: ALL PLATFORMS PASS static theme verification.`
- 45/45 platforms with theme toggle support
- Generic template theme support: yes
- Total entries verified: 46
- Each platform: `hasThemeSupport === true`, all 12 theme vars defined for
  dark + light, and dark/light differ (10–12/12 vars differ per platform).

### Dynamic (runtime toggle) — `verify-all-44-theme-dynamic-bf-1l2bl.js`
`46/46 platforms PASS dynamic verification`
- Toggle driven through the real code path `FrameTheme.updateAllPlatformFrames()`.
- Captures a dark + light screenshot per platform.
- 1 runtime console error (a single 404 for a missing static asset — cosmetic,
  unrelated to theme switching).

### Screenshots — `notes/bf-1l2bl-shots/`
94 PNGs: `<platform>-dark.png` + `<platform>-light.png` for every platform,
plus `all-platforms-dark.png` / `all-platforms-light.png` grid overviews and
`results.json` (pass=46, fail=0, total=46).

### Verification page
`src/public/verify-all-44-theme-bf-1l2bl.html` — renders every platform frame
with a theme toggle for manual inspection.

## How to re-run
```bash
node verify-all-44-theme-static-bf-1l2bl.js    # config-level: no server
node verify-all-44-theme-dynamic-bf-1l2bl.js   # spins up :3399, drives toggle
```

Reversible: `br reopen bf-1l2bl`.
