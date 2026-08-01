# bf-3fihc — Consolidated 7-Platform Theme-Switching Acceptance Harness

**Type:** task · **Closes parent:** `bf-2k0os` (Implement theme switching for all platform frames)

## Deliverable

`src/public/acceptance-7-platform-theme-switching.html` — the **single authoritative**
end-to-end acceptance page for the entire 7-platform theme-switching chain.

It loads the same production modules the app uses
(`platform-frames.js`, `frames-theme.js`, `platform-frames-config.js`) and drives the
real toggle path (`<html data-theme>` → `FrameTheme.updateAllPlatformFrames()`) — it does
**not** stub or re-implement the theme code — then asserts every acceptance criterion of
the parent bead `bf-2k0os`:

1. Dark/light toggle affects all platform frames
2. Theme state propagates to all rendered frames
3. Each platform frame correctly renders in BOTH light and dark modes
4. Theme switching is synchronized across all platforms
5. No frames are left in the wrong (stale) theme state

## Verification result (headless run against served app, port 3939)

Executed via jsdom loading the live HTTP page (Playwright/Puppeteer Chromium could not
launch on this NixOS host — missing `libglib-2.0.so.0` and other system libs on the
loader path; jsdom runs the same DOM/script path faithfully).

```
BANNER:  PASS — all 36 assertions satisfied across the 7-platform theme-switching chain
COUNTS:  36 assertions: 36 passed, 0 failed, 0 skipped
FRAMES:  7                       (all 7 platforms rendered)
CARDS:   PASS 1 | PASS 2 | PASS 3 | PASS 4 | PASS 5
GROUPS:  PASS | PASS | PASS | PASS | PASS
LOGS(0): (no console errors/warnings)
```

All 7 platforms under test: `facebook, twitter, linkedin, reddit, youtube, instagram, tiktok`
(sourced from the centralized config via `getAllPlatformIds()`).

## Supersedes (removed in this commit)

The ad-hoc one-off scratch verifiers this harness replaces — the chain's per-bead
verifiers explicitly enumerated in the harness header, plus the untracked 7-platform
scratch batch:

- `verify-theme-switching-7-platforms-bf-2k0os.js` (bf-2k0os)
- `verify-theme-per-platform-bf-thvl6.js` + `test-7-platforms-theme-per-platform-bf-thvl6.json` (bf-thvl6)
- `verify-theme-propagation-bf-2kkb1.js` (bf-2kkb1)
- `test-7-platforms-theme-sweep-bf-662jl.js` (bf-662jl)
- untracked: `test-7-platforms-{complete,rendering,wiring}.js`, `test-7-platforms-report.json`,
  `verify-{complete-theme-system,platform-theme-system,platform-acceptance,platform-frames-wiring}.js`,
  `verify-theme-switching-functional.js`,
  `src/public/verify-7-platforms-{complete,rendering,theme-switching}.html`

**Out of scope / intentionally left:** `test-all-platforms-theme-switching.html`
(referenced by `screenshots/capture-{7-platforms,social-platforms}.js`), the
`verify-7-platforms-theme.html` 8-platform/pinterest page, and the broader non-chain
theme verifiers belonging to other beads.

Going forward, run the harness: serve `src/public/` (`npm start`) and open
`/acceptance-7-platform-theme-switching.html` — tests auto-run on load and also via the
"Run Acceptance Tests" button.
