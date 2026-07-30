# bf-2e9hk — Enable generic template theme toggle support

**Type:** task · **Scope:** single flag flip in `platform-frames.js`

## Change

`src/public/platform-frames.js` — the `generic` fallback template already had full
`themeVars` defined for **both** dark and light modes, but `hasThemeSupport` was
`false`, which excluded it from the theme system. Flipped the flag:

```diff
   // Generic template for platforms without custom context frames
   generic: {
     name: 'Generic Platform',
     category: 'other',
-    hasThemeSupport: false,
+    hasThemeSupport: true,
```

This enables the theme toggle for platforms that have no custom context frame and fall
through to the generic renderer (`getPlatformFrame()` returns the generic frame for any
unrecognized `platformId`).

## Why this is sufficient (data-flow trace)

The theme toggle UI is gated entirely by `hasThemeSupport` in `platform-frames.js`:

- `app.js:2318` — `PLATFORMS_WITH_THEME = getPlatformsWithThemeSupport()` (derived from
  the `hasThemeSupport` flag across `PLATFORM_FRAMES`).
- `app.js:2013` / `app.js:2193` — `const supportsTheme = PLATFORMS_WITH_THEME.includes(pid)`;
  the `.card-theme-toggle` button is only rendered when `supportsTheme` is true.
- `platform-frames.js:3384` `hasThemeSupport(id)` and `:3404`
  `getPlatformsWithThemeSupport()` both read the same flag.

With the flag now `true`, `generic` appears in `getPlatformsWithThemeSupport()` and the
generic frame receives a working theme toggle whose dark/light CSS custom properties are
already defined.

Note: `platform-frames-config.js` (the 1:1 mirror of `src/platform-frames.config.ts`) is a
separate, narrower system — the canonical list of 7 *wired* platforms with `frameType`s.
It has no `generic` entry and is not the target of this bead; the generic fallback lives
exclusively in `platform-frames.js`.

## Verification (node, `~/scratch/verify-generic-theme-bf-2e9hk.js`)

Required `platform-frames.js` (it has a `module.exports` block) and exercised the real
helper API. 7/7 checks passed:

```
[PASS] Generic hasThemeSupport === true — actual: true
[PASS] hasThemeSupport('generic') === true — actual: true
[PASS] hasThemeSupport('totally-unknown-platform') === true (generic fallback) — actual: true
[PASS] 'generic' is in getPlatformsWithThemeSupport() — list length: 46
[PASS] Generic dark themeVars defined (--frame-bg present) — --frame-bg: #1a1a2e
[PASS] Generic light themeVars defined (--frame-bg present) — --frame-bg: #ffffff
[PASS] Generic dark/light --frame-bg differ (switching has effect) — dark: #1a1a2e | light: #ffffff

7/7 checks passed
```

These confirm all three acceptance criteria:
1. Generic `hasThemeSupport` set to `true` ✓
2. Generic theme toggle wired (generic is in the theme-support list the UI reads) ✓
3. Dark/light mode switching has a real effect (distinct `--frame-bg` per mode) ✓
