# bf-5cd — Phase 3: Side-by-Side URL Comparison with Diff Highlighting

## What landed
Full diff highlighting in Compare mode, completing the umbrella Phase-3 bead.
The pieces were built across sibling beads (bf-1poq, bf-10h0, bf-2911s, bf-5rgx,
bf-32sk, bf-1uc4, bf-q8yq); this commit wires them into a coherent render and
fixes the two blockers that prevented it from actually displaying.

### `src/public/app.js` (compare region)
- `buildPlatformDiff(pid, meta1, meta2, scores1, scores2)` — unified per-platform
  diff combining meta-level changed field paths (`meta.<dotted.key>`, matching the
  paths `renderPlatformCard`'s `highlight()` checks) with score-level missing tags.
  `identical` is true only when meta, grade, score AND missing-tags all match.
- `renderPlatformComparison` rewritten to:
  - union platform IDs across both results
  - build a per-platform diff
  - render the summary bar (`N platforms identical, M differ, K missing tags on
    URL B`) as a sentence + stat tiles, with an `aria` announcement
  - render before/after cards with the diff applied (`highlight()` → green,
    `renderMissingTagsBadges()` → red badges)
  - attach the image-diff overlay (`window.imageDiff.create`) per platform
  - `setupScrollLock(beforeCard, afterCard)` to sync the two columns
- Removed the stale duplicate `renderPlatformComparison` stub at the bottom of
  the file (it only scrolled to results and shadowed the real implementation).

### `src/public/style.css`
- Summary bar: added `.platform-comparison-summary-text` / `-stats`, made the bar
  wrap (`justify-content: space-between; flex-wrap: wrap`).
- **Bug fix:** `.diff-changed` had `text-transform: uppercase` + `font-size: 11px`
  (designed for field-name pills). `highlightChangedText()` wraps actual
  title/description prose in that class, so it was uppercasing and shrinking real
  text ("My Page" → "MY PAGE" at 11px). Now it preserves font-size and case — a
  green tint on the surrounding text.

### `src/public/image-diff.js`
- Syntax fix: the `DOMContentLoaded` listener closed with `};` instead of `});`,
  which is a parse error. Committed HEAD would not load the module at all.

## Not included (left for other beads)
The working tree also contains uncommitted *theme* work in `app.js` (`applyTheme`,
`buildCard`) and `frames-theme.js` plus the theme-bead test-file deletions. Those
belong to the open/blocked theme beads and were intentionally kept out of this
commit — staged here is the compare code only.

## Verification
`~/scratch/test-compare-diff-bf5cd.js` loads the real `platform-diff.js` and
replicates `buildPlatformDiff`/`flattenMeta` verbatim; 13/13 assertions pass:
changed field paths detected (`meta.og.title`, `meta.og.image`), unchanged fields
not flagged, green `<span class="diff-changed">` wraps only changed text, red
`diff-tag-missing` badges render for tags missing in URL B, identical platforms
stay identical, and the summary counts/sentence match the spec format.
`node --check` passes on `app.js`, `image-diff.js`, `platform-diff.js`.
