# Filter Change Handler Details — app.js

**Source:** `src/public/app.js` (10,506 lines; last modified 2026-08-24, commit `31bc458`)
**Extracted:** 2026-08-26 · **Bead:** vista-ad03bc5f · **Method:** direct source verification (brace-matched function extents, every binding checked live)

> Line numbers in older filter docs (`temp-filter-change-handlers-list.md`,
> `temp-filter-handler-functions.md`, and partially `docs/filter-change-handlers-catalog.md`)
> are **stale** — app.js grew ~427–481 lines since they were written. See
> [Line-number drift](#6-line-number-drift-vs-older-docs) at the bottom for the
> old → new mapping. The numbers below are current.

A "filter change handler" here means: a function (or inline listener) that reacts
to a change on a filter/filtering control, or that mutates the filter state that
controls which platform previews render. Handlers split into three tiers: the
primary preview-filter state tier, the smart-ordering guard tier that
coordinates them, and component-local filter tiers that never touch preview
state.

---

## 1. Primary filter state handlers (preview visibility & What If)

These mutate the state that decides what `renderPreviews()` draws. All live in
the **Platform Customization** section (banner at line 8186) or the **What If
Toggle** section (banner at line 8598), except `importPreferences`'s binding.

| # | Function | Lines | Wired via | Purpose (what it filters) | Guard behavior |
|---|----------|-------|-----------|---------------------------|----------------|
| 1 | `toggleFavorite(pid)` | 8348–8364 | click in favorites list (8489); card context menu `toggle-favorite` (10308); exposed as `window.toggleFavorite` (5483) | Adds/removes `pid` from `platformPrefs.favorites`, persists via `savePlatformPrefs()`, refreshes favorites list UI | `guardWrapper` — queues behind smart ordering; **clears `isSmartOrderingActive`** (manual override); no re-render |
| 2 | `toggleHidden(pid)` | 8458–8469 | click in hidden list (8511); context menu `toggle-hidden` (10305); `window.toggleHidden` (5482) | Adds/removes `pid` from `platformPrefs.hidden`, persists, refreshes hidden list, re-renders previews to apply hiding | `guardWrapperWithRender` — sets `isFilterOperation` around `renderPreviews(currentData)`, cleared via `setTimeout(...,0)` |
| 3 | `importPreferences(e)` | 8538–8596 | `'change'` on `#importPrefsInput` file input (7312) | Replaces favorites/hidden/columnCount/smartOrdering from an imported JSON file — bulk filter-state load | Inline guard: if `isSmartOrdering()` → queues an `applyImportedPrefs` closure; else sets `isFilterOperation`, re-renders, `setTimeout` clear; clears `isSmartOrderingActive` |
| 4 | `toggleWhatIfMode()` | 8602–8643 | click on `#whatIfToggleBtn` (8815) | Enters/exits What If simulation mode; on exit clears `disabledTags` and the `?without=` hash param and removes the panel | When disabling during smart ordering, queues `applyWhatIfReset` via `queueFilterOperation` (8629) |
| 5 | `applyWhatIfChanges()` | 8722–8761 | click on `#whatIfApply` (8701); auto-invoked from hash restore (575) and `applyPendingWhatIfTags` (8789) | Applies the checked tag filter — deletes every `disabledTags` entry from a copy of `currentData.meta` and re-renders so cards show fallback behavior | Inline `isFilterOperation = true` → `renderPreviews(modifiedData)` → `setTimeout` clear; announces via screen reader; shows missing-tag warnings; updates hash |
| 6 | `resetWhatIfToggles()` | 8714–8720 | click on `#whatIfReset` (8700) | Clears the tag filter — empties `disabledTags`, re-checks all panel toggles, updates hash | none (panel-local state reset) |
| 7 | `updateFavoritesList()` | 8471–8491 | called by 1, 3 | Renders the favorites filter list; attaches the per-item `toggleFavorite` click handlers (8489) | none (UI refresh) |
| 8 | `updateHiddenList()` | 8493–8513 | called by 2, 3 | Renders the hidden filter list; attaches the per-item `toggleHidden` click handlers (8511) | none (UI refresh) |
| 9 | `applyPendingWhatIfTags()` | 8767–8793 | called after data load when `?without=` was restored before data existed | Replays a URL-persisted tag filter: enables What If mode, unchecks the named tags, auto-applies | delegates to `applyWhatIfChanges` |

**Supporting (same section):** `showWhatIfPanel()` 8645–8702 builds the panel DOM
and binds its tag-filter `'change'` listener (see §4 What If); `closeWhatIfPanel()`
8704–8712 removes the panel, deliberately preserving mode/tag state.

---

## 2. Guard-system functions (smart-ordering coordination)

Section banner: `// ── Centralized guard functions for filter operations during smart ordering ──` (line 8366). These are not themselves handlers; every primary handler above routes through them.

| Function | Lines | Purpose |
|----------|-------|---------|
| `shouldDeferFilterOperation()` | 8372–8374 | Returns `isSmartOrderingActive` (runtime-only check) |
| `isSmartOrdering()` | 8414–8416 | Returns `platformPrefs.smartOrdering && isSmartOrderingActive` — preference **and** runtime state; the primary pre-check |
| `queueFilterOperation(operation, description)` | 8423–8428 | Pushes `{operation, description}` onto `pendingFilterOperations` |
| `processPendingFilterOperations()` | 8433–8456 | Drains the queue (copy, clear, execute each with error isolation) once smart ordering completes |
| `guardWrapper(name, fn)` | **`filter-guard-wrapper.js:47`** | Wraps a handler: if `isSmartOrdering()` → queue; else run now. Used by `toggleFavorite` |
| `guardWrapperWithRender(name, fn)` | **`filter-guard-wrapper.js:79`** | `guardWrapper` + sets/clears `isFilterOperation` around the render and clears `isSmartOrderingActive`. Used by `toggleHidden` |

A read-only mirror of the predicate trio also exists in `src/public/guard-utils.js`
(`window.isSmartOrdering` etc.), for code that cannot assume app.js globals.

---

## 3. Component-local filter handlers (never touch preview filter state)

### 3a. Cropper — Crop Visualizer section (banner 3788)

Filters *which platforms' crop overlays* are drawn.

| Handler | Lines | Wired via | Purpose |
|---------|-------|-----------|---------|
| inline group-toggle listener | 3908–3918 | `'change'` on `.cropper-group-toggle` checkboxes | Checks/unchecks every platform checkbox in the group, then re-syncs |
| inline platform-toggle listener | 3924–3930 | `'change'` on `.cropper-platform-toggle input` | Single platform on/off, then re-syncs |
| `syncGroupToggles(groups)` | 3957–3976 | called by both listeners | Re-derives each group header's checked/indeterminate state from its children |
| `updateEnabledPlatforms()` | 3978–3988 | called by every toggle path | Rebuilds `cropperState.enabledPlatforms` from checked boxes; refreshes category legend |
| `updateCropperOverlay()` | 4027–4103 | called by every toggle path | Redraws the crop rectangles for enabled platforms on the canvas |

### 3b. Raw Tags viewer — Raw Tags/Metadata Viewer section (banner 4218)

| Handler | Lines | Wired via | Purpose |
|---------|-------|-----------|---------|
| `renderMetadataTable(filter = '')` | 4368–4422 | re-invoked by its own input listener | Renders the meta-tag table filtered by case-insensitive substring over tag **and** value; shows "N of M tags" count |
| inline filter listener | 4418–4421 | `'input'` on `#metadataFilterInput` | Calls `renderMetadataTable(e.target.value)` per keystroke |

### 3c. Badge modal — Badge Modal section (banner 5148)

| Handler | Lines | Wired via | Purpose |
|---------|-------|-----------|---------|
| `updateBadgePreview()` | 5192–5214 | `'change'` on `#badgeStyleSelect` (382) | Rebuilds `/api/badge.svg?...&style=` URL, preview `<img>`, embed code, direct URL from selected badge style |

### 3d. OG Generator — OG Generator section (banner 5497)

Filters *which background/logo controls* are relevant and redraws the canvas.

| Handler | Lines | Wired via | Purpose |
|---------|-------|-----------|---------|
| `handleBgTypeChange()` | 5531–5540 | `'change'` on `#oggenBgType` (396) | Sets `oggenState.bgType`; shows only the matching bg control row (solid/gradient/image); redraws |
| `handleBgImageUpload(e)` | 5542–5556 | `'change'` on `#oggenBgImageInput` (401) | FileReader → `oggenState.bgImage` → redraw |
| `handleLogoPosChange()` | 5558–5563 | `'change'` on `#oggenLogoPos` (407) | Sets `logoPos`; toggles logo-upload row visibility; redraws |
| `handleLogoUpload(e)` | 5565–5579 | `'change'` on `#oggenLogoInput` (408) | FileReader → `oggenState.logoImage` → redraw |
| `updateOggenCanvas()` | 5581–5599 | `'change'` on `#oggenGradientDir` (400), `#oggenBgImageSize` (402), `#oggenFont` (405) | Full 1200×630 canvas redraw (background, content, logo) |

### 3e. Sitemap heatmap — Sitemap Mode section (banner 6356)

| Handler | Lines | Wired via | Purpose |
|---------|-------|-----------|---------|
| `handleHeatmapSort()` | 6582–6604 | `'change'` on `#heatmapSort` (418) | Sorts `sitemapResults` by `score-asc/score-desc/url-asc/url-desc`, re-renders heatmap table |

### 3f. Editor — Phase 2: Editor section (banner 6690)

| Handler | Lines | Wired via | Purpose |
|---------|-------|-----------|---------|
| `handleEditorInput(e)` | 7070–7092 | `'input'` on per-tag editor fields | Records edits into `editorState.edited`, toggles `.modified`, updates char counts, debounced (300 ms) `updatePreviewsWithEdits()` |

### 3g. Code snippet generator — Code Snippet Generator section (banner 7333)

| Handler | Lines | Wired via | Purpose |
|---------|-------|-----------|---------|
| `generateCodeSnippet()` | 7334–7383 | `'change'` on `#snippetFramework` (7294) | Emits framework-specific meta snippet (html/nextjs/nuxt/…) from current or edited metadata |

### 3h. Command palette — Command Palette section (banner 9529)

| Handler | Lines | Wired via | Purpose |
|---------|-------|-----------|---------|
| `filterCommands(e)` | 9658–9673 | `'input'` on `#commandInput` (9566) | Filters `COMMANDS` by substring over label/category, resets selected index, re-renders list |

---

## 4. What If tag-filter listener (inline, within `showWhatIfPanel`)

| Listener | Lines | Wired via | Purpose |
|----------|-------|-----------|---------|
| inline tag-toggle listener | 8686–8694 | `'change'` on `.what-if-toggle input[data-tag]` | Adds/removes the tag in `disabledTags`, then `updateHash()` so `?without=` reflects the filter live |

---

## 5. Event-binding index (all change/filter bindings in app.js)

| Line | Event | Element | Handler |
|------|-------|---------|---------|
| 123 | change | `matchMedia('(prefers-color-scheme: light)')` | inline — theme follow (adjacent, not a content filter) |
| 382 | change | `#badgeStyleSelect` | `updateBadgePreview` |
| 396 | change | `#oggenBgType` | `handleBgTypeChange` |
| 400 | change | `#oggenGradientDir` | `updateOggenCanvas` |
| 401 | change | `#oggenBgImageInput` | `handleBgImageUpload` |
| 402 | change | `#oggenBgImageSize` | `updateOggenCanvas` |
| 405 | change | `#oggenFont` | `updateOggenCanvas` |
| 407 | change | `#oggenLogoPos` | `handleLogoPosChange` |
| 408 | change | `#oggenLogoInput` | `handleLogoUpload` |
| 418 | change | `#heatmapSort` | `handleHeatmapSort` |
| 3908 | change | `.cropper-group-toggle` | inline (group on/off) |
| 3924 | change | `.cropper-platform-toggle input` | inline (platform on/off) |
| 4418 | input | `#metadataFilterInput` | inline → `renderMetadataTable(value)` |
| 7294 | change | `#snippetFramework` | `generateCodeSnippet` |
| 7312 | change | `#importPrefsInput` | `importPreferences` |
| 8688 | change | `.what-if-toggle input` | inline (tag disable filter) |
| 9566 | input | `#commandInput` | `filterCommands` |

Click-wired filter handlers (not `change` events): `toggleWhatIfMode` (8815),
`applyWhatIfChanges` (8701), `resetWhatIfToggles` (8700), `toggleFavorite`
(8489, 10308), `toggleHidden` (8511, 10305).

---

## 6. Line-number drift vs older docs

app.js grew (most recently the messaging-frames work, last touching app.js
2026-08-24). Handlers shifted **+427 to +481** lines. Correction table for the
most-referenced handlers:

| Function | Old (stale) docs say | Actual (verified) |
|----------|----------------------|-------------------|
| `renderMetadataTable` | 3941 | **4368** |
| `updateBadgePreview` | 4765 | **5192** |
| `handleBgTypeChange` | 5106 | **5531** |
| `handleLogoPosChange` | 5133 | **5558** |
| `updateOggenCanvas` | 5156 | **5581** |
| `handleHeatmapSort` | 6101 | **6582** |
| `handleEditorInput` | 6589 (bf-1mztb) | **7070** |
| `generateCodeSnippet` | 6589 (summary) / 6853 | **7334** |
| `toggleFavorite` | 7867 | **8348** |
| `shouldDeferFilterOperation` | 7891 | **8372** |
| `isSmartOrdering` | 7933 | **8414** |
| `queueFilterOperation` | 7942 | **8423** |
| `processPendingFilterOperations` | 7952 | **8433** |
| `toggleHidden` | 7977 | **8458** |
| `updateFavoritesList` | 7990 | **8471** |
| `updateHiddenList` | 8012 | **8493** |
| `importPreferences` | 8057 | **8538** |
| `toggleWhatIfMode` | 8121 | **8602** |
| `applyWhatIfChanges` | 8241 | **8722** |
| `filterCommands` | 9177 | **9658** |

Behavioral drift worth noting vs the 2026-07-24 extraction: `toggleFavorite` and
`toggleHidden` no longer hand-roll the guard — they use `guardWrapper` /
`guardWrapperWithRender` from `filter-guard-wrapper.js`, and the guard flag is
cleared with `setTimeout(..., 0)` rather than inline after `renderPreviews()`.
