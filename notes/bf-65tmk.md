# bf-65tmk — Add project management / RSS platform frames

**Type:** task · **Status:** complete (CSS gap filled + verified)

## Task

Add context frames for 4 project-management / RSS platforms:

- Jira (issue/task view)
- Trello (kanban board)
- Asana (task list)
- Feedly (RSS reader)

Each with platform-appropriate chrome, neutral placeholder content, and
dark/light mode support.

## What was already done (no JS changes needed)

All four platform entries in `src/public/platform-frames.js` were already
complete. Each has full `chrome`, `neutralContent`, and `dark`+`light`
`themeVars`:

| Platform | Line | Chrome (distinct structure)                          | Class prefix | hasThemeSupport |
|----------|------|------------------------------------------------------|--------------|-----------------|
| Feedly   | 2511 | sidebar (feed title + unread) + article list         | `.fl-*`      | true            |
| Jira     | 2889 | issue header (key/title/status/priority/assignee) + activity stream | `.ji-*` | true   |
| Trello   | 2958 | board header + card list (labels, checklist, attachment) | `.tr-*`   | true            |
| Asana    | 3024 | task header (id/title/project/assignee/due) + comments | `.as-*`    | true            |

Platform-specific chrome styling already lives in `src/public/style.css`
(`.ji-` 21 selectors, `.tr-` 26, `.as-` 23, `.fl-` 12) plus 2 `.fl-`
selectors in `platform-frames-enhanced.css` — so the frames are visually
distinct and platform-appropriate. `feedly` also has an explicit render
switch case at `platform-frames.js:3780`.

## The gap this bead filled — CSS theme variables

Per the recorded lesson in `bead-autosplit-fires-on-complete-work`
(*"when work looks complete, still grep for the gap... CSS vars referenced
but never defined"*), a `grep -E "(--jira-bg|--trello-bg|--asana-bg|--feedly-bg)\s*:" src/public/frames-theme.css`
came back **empty**. All four platforms had `.X-context` hooks
(`.jira-context`, `.trello-context`, `.asana-context`, `.feedly-context`)
referencing `--jira-bg`, `--trello-bg`, `--asana-bg`, `--feedly-bg` (and the
other 11 properties each) that were **never defined** — so they silently fell
back to the generic `--frame-*-global` tokens, losing each platform's brand
palette in any CSS-driven rendering path. This is the same gap `bf-2foil` and
`bf-1p2uq` fixed for the content/social and productivity/notetaking platforms.

Added `:root` (dark) + `[data-theme='light']` blocks for all 4 platforms in
`frames-theme.css`, values sourced verbatim from each platform's `themeVars`
(the single source of truth in `platform-frames.js`):

```
--jira-bg   / --jira-surface   / ... (12 properties × dark + light)
--trello-bg / --trello-surface / ...
--asana-bg  / --asana-surface  / ...
--feedly-bg / --feedly-surface / ...
```

+128 lines, inserted after the JetBrains block, before the `BASE FRAME STRUCTURE`
separator — matching the established GitHub/Reddit/Notion pattern. Brace balance
verified (net depth 0); each platform now has exactly 24 base-var definitions
(12 properties × 2 modes).

## Verification

`verify-pm-platforms-bf-65tmk.js` cross-checks the CSS brand-variable values
against the JS `themeVars` source of truth:

```
PASS: 104   FAIL: 0   (total 104)
✓ All 4 platforms: brand CSS vars defined & match JS themeVars verbatim (dark + light).
```

104 = 4 platforms × (1 context-hook check + 24 var-match checks [12 props × 2
modes] + 1 dark≠light bg check). Confirms each `.X-context` hook now resolves
its own brand palette instead of the generic fallback, in both dark and light.
