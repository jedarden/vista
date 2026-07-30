# bf-2j2jr — Light-mode Twitter/X screenshot was a byte-identical copy of dark

**Type:** task · **Discovered during:** `bf-2tjzy` verification

## Problem

The committed `notes/vista-twitter-x-light-mode.png` was a **byte-identical** copy of
the dark-mode screenshot — both 58,424 bytes, same MD5, identical timestamps. The light
capture had been grabbed by the ADB-on-Pixel-6 pipeline *before* the theme toggle had
actually applied to the DOM/CSS, so the second shot was still dark.

```
HEAD (broken):   dark 58424 bytes  ==  light 58424 bytes   (identical)
```

## Fix

`capture-vista-twitter-x-modes.js` replaces the fragile ADB capture with a **deterministic
headless** capture that drives the real theme path and *verifies* the theme applied before
each shot. Both screenshots come from the same rendering pipeline, so the only difference
between them is the theme.

It clicks the real `#themeToggle` button in `test-twitter-frame.html` (the same handler the
UI uses — `html[data-theme]` flip + CSS-variable repaint) and asserts, before each capture:

1. **Initial state** — `data-theme === 'dark'`, body background `rgb(0,0,0)`.
2. **After toggle** — `data-theme === 'light'` (via `waitForFunction`, 5s timeout) **and**
   the computed `.twitter-context` frame background is white-ish (every RGB channel ≥ 240),
   proving the CSS variables actually repainted — not just the attribute flipping.
3. **Divergence** — the two PNGs have different MD5s; the script throws if they match.

## Verification result (re-run, reproducible)

```
bf-2j2jr: capturing Twitter/X dark + light screenshots
DARK  : data-theme=dark  bodyBg=rgb(0, 0, 0)       frames=3
clicking #themeToggle
LIGHT : data-theme=light bodyBg=rgb(255, 255, 255)  frames=3
dark  md5=cc8d9c92b2381a68e60ee4c4c980cbbc (547793 bytes)
light md5=a56c77840f0fc50e1efa0812ba3b2d66 (510993 bytes)
PASS: dark and light screenshots differ
```

Visual confirmation (image analysis) agrees:
- `vista-twitter-x-dark-mode.png`  — dark theme, black background.
- `vista-twitter-x-light-mode.png` — light theme, white background.

## Acceptance criteria — all met

- [x] Light-mode screenshot shows the actual light theme (white background)
- [x] Screenshots are visually different (dark vs light)
- [x] Theme toggle verified working (`data-theme` flip + computed-bg repaint)
- [x] Both screenshots committed to git (this commit)
- [x] Visual verification can be completed (unblocks `bf-2tjzy`)
