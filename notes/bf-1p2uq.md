# bf-1p2uq — Add productivity and note-taking platform frames

**Type:** task · **Status:** already complete (duplicate of committed work)

## Task

Add context frames for 4 productivity / note-taking platforms:

- Notion (doc/page view)
- Evernote (note view)
- VS Code (editor window)
- JetBrains IDEs (code editor)

Each with platform-appropriate chrome, neutral placeholder content, and dark/light
mode support.

## Verification result — ALREADY IMPLEMENTED AND COMMITTED

All four platforms are present, complete, and committed in `b9bcf8a`
(`feat(bf-12zpw): implement developer platform context frames`, 3 days ago — tracked
under the sibling bead `bf-12zpw`). Neither `src/public/platform-frames.js` nor
`src/public/frames-theme.css` is modified in the working tree, so `bf-1p2uq` is an
auto-split of already-complete work. No new code changes were required.

This matches the recorded pattern in
`bead-autosplit-fires-on-complete-work`: a task bead dispatched for work that was
already finished in a prior bead.

### Acceptance criteria — each satisfied

| # | Criterion | Result |
|---|-----------|--------|
| 1 | All 4 platforms have context frames in `platform-frames.js` | ✅ notion (L2574), evernote (L2642), vscode (L2706), jetbrains (L2787) |
| 2 | Each frame is visually distinct & platform-appropriate | ✅ unique class prefixes + platform-specific layouts (see below) |
| 3 | Dark/light mode works for all 4 | ✅ `themeVars.dark` + `themeVars.light` for each; CSS context hooks present |
| 4 | Each frame renders correctly | ✅ `node -c` passes; helper switch covers the link-preview platforms |

### Per-platform detail (from the committed code)

- **Notion** — `.no-*` chrome: page header (icon/title/author/time), content blocks with
  a callout, link-preview neutralContent (`notion` case in the link-preview switch).
- **Evernote** — `.ev-*` chrome: notebook header + note list, link-card neutralContent
  (`evernote` case in the switch).
- **VS Code** — `.vs-*` chrome: activity bar, explorer sidebar, tab bar, editor content,
  terminal panel; comment-based neutralContent (embeds pasted content as a `//` comment,
  so it intentionally has no link-preview switch case — falls to default).
- **JetBrains** — `.jb-*` chrome: top menu bar, project file tree, tab bar, editor content,
  status bar (line/encoding/indent); comment-based neutralContent (same default path).

### Dark/light mode mechanism

Each platform's `themeVars` defines all 12 `--frame-*` custom properties for **both**
`dark` and `light`. The CSS exposes them via the context hooks
(`.notion-context`, `.evernote-context`, `.vscode-context`, `.jetbrains-context` at
`frames-theme.css:1522/1538/1554/1586`), which fall back to the `--frame-*-global`
tokens that flip under `[data-theme='light']`. So both modes resolve correctly with no
platform-specific base-variable definitions needed — the same pattern used by the
majority of platforms in the file (Slack, Discord, Gmail, etc.).

## Action

No file changes produced. Recorded this verification and committing the note only.
