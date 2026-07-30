# Bead bf-5rlu: Audit and Fix Mobile Tap Target Sizes

## Task
Ensure all interactive elements meet minimum tap-target size (≥44×44 CSS px,
WCAG 2.5.5 Target Size) with adequate spacing on mobile viewports.

## Changes
All work is in `src/public/style.css`, scoped to `@media (max-width: 768px)` so
the desktop aesthetic is untouched. Selectors are deliberately type/role-based so
they also cover JS-built widgets (toasts, context menu, command palette, char
gauges, template cards, feedback FAB):

1. **Generic floor** — `button`, `[role=button]`, `[role=tab]`, `[role=menuitem]`,
   `[role=option]`, `[role=link]`, `summary` → `min-height: 44px`.
2. **Inline text-link buttons** — `.toggle-link` → vertical padding so the hit
   strip reads as a comfortable 44 px row.
3. **Icon-only / square controls** — `.theme-toggle`, `.modal-close`,
   `.layout-btn`, `.rating-btn`, `.platform-item-remove`, `.suggestion-dismiss`,
   `.card-context-toggle`, `.card-theme-toggle`, `.card-screenshot-btn`,
   `.copy-btn`, `.toast-dismiss`, `.what-if-close`, `.cachehub-link` →
   `min-width/min-height: 44px`.
4. **Standalone `<a>` controls** — `a.logo`, `.skip-link` → `min-height: 44px`
   (native anchors have no implicit `role`, so the role-based rule misses them).
5. **Form text controls** — `input[type=url|text|number|search|email|tel|password]`,
   `select`, `textarea` → `min-height: 44px`. `input[type=color|file]` → 44×44.
6. **Checkboxes/radios** → 24×24 (AA minimum) + 6 px margin; labeled toggle rows
   (`.what-if-toggle`, `.cropper-platform-toggle`) → full 44 px hit area.
7. **Spacing** — `.feedback-rating` gap 8px, `.card-header-controls` wrap+4px,
   `.summary-actions` wrap, `.tabs-inner` gap 6px.

## Audit / Verification
Measured every interactive element's rendered rect + adjacent-target gap with
Playwright/Chromium at a 390×844 (iPhone-class) viewport, after revealing every
hidden section/modal and injecting representative instances of the JS-built
dynamic widgets.

- **PASS SIZE:** all 121 interactive elements ≥ 44×44 px
  (inline-prose `<a>` links exempt under WCAG 2.5.8 Inline exception).
- **PASS SPACING:** no horizontally-adjacent targets closer than 4 px in dense groups.

Verified both via `file://` load and against the live Express server — identical
results. Reproduce with:
`node /home/coding/scratch/verify-tap-targets-5rlu.js`

## Out-of-scope observation (pre-existing, flagged not fixed)
While auditing, Playwright reported a JS error present on `main` regardless of
this bead: `SyntaxError: Identifier 'PLATFORM_NAMES' has already been declared`.
It is a pre-existing duplicate top-level `const` across two classic scripts —
`app.js:1243` and `app-features.js:505` (`window.PLATFORM_NAMES || {}`). It is
**already committed at HEAD** (eee8c79), unrelated to tap targets, and does not
affect CSS tap-target sizing (the stylesheet loads independently). Tracked here so
it is not lost; deserves its own bead.

## Commit
See git log for the bf-5rlu commit on `src/public/style.css`.
