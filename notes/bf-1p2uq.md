# bf-1p2uq — Add productivity and note-taking platform frames

**Type:** task · **Status:** complete (CSS gap filled + verified)

## Task

Add context frames for 4 productivity / note-taking platforms:

- Notion (doc/page view)
- Evernote (note view)
- VS Code (editor window)
- JetBrains IDEs (code editor)

Each with platform-appropriate chrome, neutral placeholder content, and dark/light
mode support.

## What was already done (no JS changes needed)

The four platform entries in `src/public/platform-frames.js` were already complete and
committed in `b9bcf8a` (`feat(bf-12zpw)`, 3 days ago). Each has full `chrome`,
`neutralContent`, and `dark`+`light` `themeVars`:

| Platform | Line | Chrome | Distinct class prefix |
|----------|------|--------|-----------------------|
| Notion    | 2574 | page header + content blocks + callout; link-preview neutralContent | `.no-*` |
| Evernote  | 2642 | notebook header + note list; link-card neutralContent            | `.ev-*` |
| VS Code   | 2706 | activity bar + explorer + tabs + editor + terminal; comment neutralContent | `.vs-*` |
| JetBrains | 2787 | menu bar + file tree + tabs + editor + status bar; comment neutralContent   | `.jb-*` |

VS Code / JetBrains embed pasted content as a code `//` comment (so they intentionally
have no entry in the link-preview switch and fall to the default) — Notion / Evernote
render a link card and have explicit switch cases.

## The gap this bead filled — CSS theme variables

Per the recorded lesson in `bead-autosplit-fires-on-complete-work` (*"when work looks
complete, still grep for the gap... CSS vars referenced but never defined"*), a
`grep -- "--notion-bg:" src/public/frames-theme.css` came back **empty**. All four
platforms had `.X-context` hooks referencing `--notion-bg`, `--evernote-bg`,
`--vscode-bg`, `--jetbrains-bg` (and the other 11 properties) that were **never
defined** — so they silently fell back to the generic `--frame-*-global` tokens,
losing each platform's brand palette in any CSS-driven rendering path (the acceptance
harness, static renders, non-inline-style contexts). This is the same gap `bf-2foil`
fixed for Medium / Dev.to / Hacker News / Product Hunt / Pinterest.

Added `:root` (dark) + `[data-theme='light']` blocks for all 4 platforms in
`frames-theme.css`, values sourced verbatim from each platform's `themeVars` (the
single source of truth):

```
--notion-bg / --notion-surface / ... (12 properties × dark + light)
--evernote-bg / ...
--vscode-bg / ...
--jetbrains-bg / ...
```

+128 lines, matching the established GitHub/Reddit/Medium pattern. Brace balance
verified (139/139); each platform now has exactly 24 base-var definitions
(12 properties × 2 modes).

## Verification — render test (`~/scratch/verify-bf-1p2uq.js`)

Drives the real render API (`buildContextFrame`, `getInlineThemeStyles`,
`getThemeVars`, `hasThemeSupport`) for all 4 platforms in both themes:

```
Criteria 1 & 2 — frames present & visually distinct      (chrome markers, -context class)
Distinctness   — chrome markers unique per platform      (no cross-platform bleed)
Criterion 3    — dark/light mode works for all 4         (themeVars differ, inline --frame-bg correct, data-theme tags, light-theme class)
Completeness   — all 12 frame vars defined per platform/theme

RESULT: 84 passed, 0 failed
BANNER: PASS — all 4 platforms render correctly in both themes
```

## Acceptance criteria — all satisfied

| # | Criterion | Result |
|---|-----------|--------|
| 1 | All 4 platforms have context frames in `platform-frames.js` | ✅ (b9bcf8a / bf-12zpw) |
| 2 | Each frame is visually distinct & platform-appropriate | ✅ distinct `.no-/.ev-/.vs-/.jb-` chrome |
| 3 | Dark/light mode works for all 4 | ✅ themeVars (JS) **+** now-defined CSS vars |
| 4 | Each frame renders correctly | ✅ 84-assertion render test, 0 failures |
