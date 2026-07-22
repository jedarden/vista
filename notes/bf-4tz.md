# bf-4tz — Diagnostic Resolution Tracking: live re-score + animated grade update

**Status: COMPLETE (verified)**

This is the umbrella "explore" bead for full diagnostic resolution tracking with
live score animation. Its six task items were delivered across the child beads
`bf-ssfp`, `bf-5q49`, `bf-2kmy`, `bf-4mdk`, and `bf-6aqf`. This note records the
end-to-end verification that every requirement is met in the current tree.

## Requirement → implementation map

1. **Re-run full scoring via scoring-simulator.js client-side**
   - `rescoreAllPlatforms()` / `applyRescore()` call `scoreAll(meta, imageProbe)`
     over the edited metadata, scoring all 31 platforms (not a counter).
   - `src/public/app.js:6341`, `:6363`; result stored in `editorState.scoring`.

2. **Animate summary bar grade badge to new grade**
   - `.grade-badge { transition: background 300ms ease, color 300ms ease }`.
   - `renderSummaryBar()` swaps the `grade-*` class → color crossfades C→A.
   - `src/public/style.css:185`, `src/public/app.js:1188`.

3. **Update per-card grade badges and border colors as fixes are applied**
   - `updateEditedCardsInPlace()` updates cards in place (DOM persists) and calls
     `swapGradeClass()` on both the `.card-grade` badge and the `.platform-card`.
   - `.platform-card` transitions `border-left-color 300ms ease`; per-grade
     `border-left` colors drive the red/yellow→green animation.
   - `src/public/app.js:6402`, `src/public/style.css:249,253-258`.

4. **Progress indicator at top of diagnostics panel**
   - `#diagProgress` is a sibling of `#diagPanel` (so re-rendering the list does
     not wipe it). `updateDiagnosticProgress()` renders
     "Fixed N/M issues — score improved X → Y" and hides it until ≥1 fix lands.
   - `src/public/index.html:289`, `src/public/app.js:8042`,
     `src/public/style.css:2597`.

5. **Strikethrough + fade resolved diagnostics, move to bottom of list**
   - `.diag-item.fixed`: `text-decoration: line-through` on `.diag-body`,
     `opacity: 0.5`, `order: 100` (bottom of the flex-column `.diag-panel`), and
     a green `✓` swapped in via `.diag-icon::before`.
   - `flipReorderDiagnostics()` runs the reorder inside a FLIP animation so items
     visibly slide to the bottom (respects `prefers-reduced-motion`).
   - `src/public/style.css:2618-2640,986`, `src/public/app.js:7876,7910`.

6. **Update diagnostics tab badge count in real-time**
   - `updateDiagnosticProgress()` recomputes the active (unfixed) error/warning
     count from the live DOM and writes it to `diagBadge` after each fix.
   - `src/public/app.js:8048`.

## Notes

- Client-side JS syntax could not be re-checked with `node` (no JS runtime in
  this environment); verification was by source inspection. The files are
  browser-side and were previously exercised by the child beads.
- Unrelated uncommitted changes to `src/server.js` belong to `bf-59t` (headers
  endpoint diagnostics) and were intentionally left out of this commit.
