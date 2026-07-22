# bf-iat3 — Hook Editor Change Events to Trigger Recalculation

## Outcome: COMPLETE (verified)

The editor change → scoring recalculation chain is fully wired in
`src/public/app.js`. This bead's acceptance criteria are met by existing code:

- **Event listener attached to editor** — `app.js:6322-6325` selects all
  `.editor-input`, `.editor-textarea`, `.editor-select` fields and attaches an
  `input` change listener to each (`addEventListener('input', handleEditorInput)`).
- **Editor changes trigger a callback** — `handleEditorInput` (`app.js:6235`)
  fires on every content edit, records the edit into `editorState.edited[tag]`,
  and marks the field dirty/modified.
- **Callback triggers recalculation** — `handleEditorInput` schedules a debounced
  (300 ms) call to `updatePreviewsWithEdits` (`app.js:6259`), which builds the
  modified meta object and calls `scoreAll(modifiedMeta, currentData.imageProbe)`
  (`app.js:6288-6289`) to recalculate the score and announce grade changes.
- **Scoring callback reachable at runtime** — `scoring-simulator.js` (which
  defines `scoreAll`, dependency bead bf-4wp8) is loaded before `app.js` in
  `index.html` (lines 863 vs 871), so the global is available when the listener
  fires.

## Added

`test-editor-change-recalc.js` — a source-inspection regression test (matching
the repo's existing `test-verify-scoring-integration.js` idiom) that asserts all
four links of the chain above. All checks pass (`node test-editor-change-recalc.js`).
