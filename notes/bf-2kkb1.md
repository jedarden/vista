# bf-2kkb1 — Verify theme state propagation & no stale frames

**Verdict:** ✅ PASS — all four acceptance criteria verified across all 7 platforms
(facebook, twitter, linkedin, reddit, youtube, instagram, tiktok).

Verification harness: `verify-theme-propagation-bf-2kkb1.js` (Puppeteer driving the real
`index.html` through the genuine app paths: `#globalThemeToggle` → `toggleGlobalTheme` →
`applyTheme`, and `renderPlatformWithContext` for frame construction).

## Acceptance criteria — how each was proven

1. **A context frame rendered AFTER a theme switch appears in the active theme (no
   double-toggle).** Phase 1 toggles dark→light, then renders *new* frames through the
   real theme source (`cardContextState[pid].theme`, which `applyTheme` keeps synced to
   the global theme). Every new frame is born `light-theme` with `data-theme="light"` and
   the light `--frame-bg`. Phase 2 repeats dark→light→dark in the other direction. No
   second toggle is ever applied.
2. **Zero `.context-frame[data-platform]` elements carry the previous theme class.**
   Phase 3 scans all 21 frames in the document (3 hosts × 7 platforms): all carry the
   current theme class, none carry the previous one.
3. **`document.documentElement` `data-theme` stays in sync with every frame.** Phase 4
   asserts every frame's `data-theme` equals the root `data-theme` — no drift.
4. **No FOUC.** Phase 5a proves the in-place re-theme is *synchronous* (`applyTheme(target)`
   has already swapped every frame's class before any `await`/settle). Phase 5b proves new
   frames are themed *at construction time* — the returned HTML string already carries the
   active-theme class, `data-theme`, and inline `--frame-bg` before insertion.

## Fix applied to the harness

The harness originally assumed the page started in `dark`. Headless Chrome reports
`prefers-color-scheme: light`, so `initTheme()` (app.js:103) starts the page in `light`,
which made the Phase-1 toggle go light→dark and the wait-for-`light` time out. Added a
deterministic `applyTheme('dark')` baseline before any frames are rendered, so every
assertion's expectation is well-defined regardless of the ambient system color-scheme.
This exercises the real `applyTheme` path — no test-only bypass.

## Pre-existing page errors (flagged, NOT caused by this change, out of scope)

The harness surfaces page console errors. None affect theme propagation (every theme
function is defined and every check passes). Recorded here so they can be triaged
separately:

- **`net::ERR_FAILED`** — intentional. The harness aborts non-`file://` requests (the two
  jsDelivr CDN scripts at `index.html:36-37`) to run fully offline. Not a defect.
- **`Identifier 'PLATFORM_NAMES' has already been declared`** — real, pre-existing bug.
  `app.js:1392` and `app-features.js:507` both declare top-level `const PLATFORM_NAMES`.
  `app-features.js` loads after `app.js`, so its declaration throws and aborts the entire
  script. Unrelated to the theme system (theme code lives in `app.js` / `platform-frames.js`
  / `frames-theme.js`, loaded earlier and still fully functional). Belongs in its own bead.
- **`missing ) after argument list`** — pre-existing, also in the non-theme path.

## Result

`node verify-theme-propagation-bf-2kkb1.js` → `✅ ALL CHECKS PASSED — theme state
propagates, no stale frames, no FOUC`.
