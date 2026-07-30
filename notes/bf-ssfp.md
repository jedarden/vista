# bf-ssfp — Store and Manage Scores for UI Updates

## Summary

bf-ey4m re-scored all 31 platforms on each editor edit, but consumed the result
transiently: `updatePreviewsWithEdits()` / `recalculateScore()` computed a local
`newScoring`, passed it straight to the render calls, and dropped it. Nothing
persisted the edited scores, so any other UI code reading `currentData.scoring`
still saw the *original* fetched grades. This task adds a persistent score-state
layer so the UI has one source of truth for the current grades.

## Changes (`src/public/app.js`)

- **State fields on `editorState`**: `scoring` (latest re-scored result, mirrors
  the backend `{ scores, overall, summary }` shape), `meta` (the edited metadata
  the scores were computed against), and `lastRescoreMs` (measured re-score
  duration, for the <500ms budget). All `null`/`0` until the first edit.
- **`getCurrentScoring()` / `getCurrentMeta()` accessors** — single source of
  truth the UI reads: return the edited state when present, else fall back to
  `currentData.scoring` / `currentData.meta`.
- **`applyRescore()`** — runs `rescoreAllPlatforms()`, **commits** the result to
  `editorState.scoring` / `.meta`, times it into `.lastRescoreMs`, and returns a
  `modifiedData` object for `renderPreviews()` / `renderSummaryBar()`. Both
  `updatePreviewsWithEdits()` and `recalculateScore()` now drive the UI from this
  stored state instead of a throwaway local.
- **`clearEditedScoring()`** — resets the stored scores; called from
  `resetEditor()` (fall back to original scores) and `initEditor()` (drop stale
  scores carried over from a previous URL on a fresh fetch).

## Acceptance criteria

- ✅ Returned scores/grades are stored in state → `editorState.scoring`/`.meta`.
- ✅ UI can access and display updated scores → `getCurrentScoring()` accessor.
- ✅ Score-state updates trigger UI refresh → `applyRescore()` stores then
  `renderPreviews()` + `renderSummaryBar()` re-render from the stored data;
  reset/new-fetch clear the state and re-render the original.
- ✅ Performance within 500ms → a full 31-platform re-score measures ~0.03ms
  (worst of 20 runs 0.035ms); `lastRescoreMs` records it. Test asserts <500ms.

## Tests

- New `test-score-state.js` (24 checks): store/read via a harness over the real
  `scoring-simulator`, accessor fallback, reset clears state, <500ms budget, and
  static app.js wiring assertions. **PASS**.
- Updated `test-full-rescore.js` and `test-editor-change-recalc.js` wiring
  regexes to accept the `applyRescore()` → `rescoreAllPlatforms()` indirection.
  Both **PASS**.
- `node --check src/public/app.js` clean; `test-verify-scoring-integration.js`
  still **PASS** (no regression).
