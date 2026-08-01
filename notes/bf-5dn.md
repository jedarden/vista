# bf-5dn — Progressive Card Cascade: Platform-specific skeleton cards

## Status: COMPLETE (verified) — bug fix applied on top of prior implementation

## Background

The bulk of this bead's implementation was already committed in
`a2e6585 feat(bf-5dn): implement platform-specific skeleton loading cards`
(dated 2026-05-30, present on both `HEAD` and `origin/main`). The bead was
re-dispatched, so this run audited the prior work for correctness rather than
re-implementing it.

## What this run did

1. **Found and fixed a real bug** — `text_only` vs `text-only` mismatch.
   - Server `src/skeleton-types.js` defines `SKELETON_TYPES.TEXT_ONLY = 'text_only'`
     (underscore), and `/api/platforms` serves `platformSkeletonMap` with
     `google: 'text_only'` (verified via `curl http://localhost:3999/api/platforms`).
   - The client's `getSkeletonHtml()` and `renderCardBySkeletonType()` compare
     against the **hyphen** form (`skeletonType === 'text-only'`).
   - `getSkeletonType()` returned the raw server value, so on the normal path
     Google's `text_only` failed the hyphen check and Google rendered an
     **empty skeleton body** (and an empty text-only content card) — violating
     requirements #2/#3 (text-only skeleton for Google). The bug was masked in
     the fetch-failure path, whose hardcoded fallback uses the hyphen form.
   - **Fix:** normalize underscores → hyphens once at the source in
     `getSkeletonType()` (`(… || 'tall').replace(/_/g, '-')`). This makes every
     consumer (`getSkeletonHtml`, `renderPlatformCard` → `renderCardBySkeletonType`)
     receive the hyphen form. Proven with a node harness replicating both code
     paths: before → `google: EMPTY-BODY`, after → `google: skeleton-text-title`
     (and `text-only-content-card`). Fix confirmed live on the running server.

2. **Updated stale test expectations** in `src/skeleton-types-test.js`. The suite
     hardcoded counts for the original 31-platform set (11 tall / 19 short /
     1 text-only), but commit `bf-3kign` extended the module to 43 platforms
     (17 tall / 25 short / 1 text-only). Updated to the current reality; the
     suite now passes all 31 assertions. (Coverage, text-only count, and
     error-handling assertions were already passing — only the count checks
     were stale.)

## Requirement-by-requirement verification (all 7 satisfied)

| # | Requirement | Evidence |
|---|-------------|----------|
| 1 | Skeleton grid at 0ms, before fetch | `renderSkeletons()` is the first call in `inspectUrl`/`inspectHtml` (app.js:1035, 1049), ahead of `progressiveLoad()` |
| 2 | 3 skeleton types (tall / short / text-only) | `getSkeletonHtml()` builds `.skeleton-body-tall` / `-short` / `-text`; CSS in style.css:311+ |
| 3 | Correct type per platform | `PLATFORM_SKELETON_MAP` (skeleton-types.js); served via `/api/platforms` → `platformSkeletonMap`; spot-checked google=text_only, facebook/linkedin/reddit=tall, whatsapp/slack/notion=short |
| 4 | 50ms stagger (0, 50, 100…) | `renderSkeletons()`: `globalIndex * 50` ms via `--stagger-delay` (app.js:1682) |
| 5 | Crossfade opacity + translateY(4px), 150ms | `--skeleton-crossfade-duration:150ms`, `--skeleton-crossfade-distance:4px` (style.css:25-27); `.skeleton-fade-out` translateY; `updatePreviewsWithImages()` body transition (app.js:2090-2108) |
| 6 | Dominant color from OG image as placeholder | `extractDominantColor()` samples center pixel via canvas (app.js:5341); set on data before render (app.js:1151-1155, 786) |
| 7 | Respect prefers-reduced-motion | `prefersReducedMotion()` (app.js:10238); stagger set to 0 (app.js:1682); crossfade skipped (app.js:1177, 2089); `@media (prefers-reduced-motion)` zeroes duration (style.css:574, 576) |

## Files changed in this run
- `src/public/app.js` — normalize skeleton type in `getSkeletonType()`
- `src/skeleton-types-test.js` — update stale platform-count expectations to 43

## Note on test runner
`verify-skeleton-bf-5dn.js` (Playwright) could not execute in this environment
(Chromium missing `libglib-2.0.so.0`). Verification was done via static code
audit, a node harness replicating the exact branching logic, the
`skeleton-types-test.js` suite (green), and `curl` against the live server on
:3999.
