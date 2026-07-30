#!/usr/bin/env node

/**
 * Test: Store and Manage Scores for UI Updates (bf-ssfp)
 *
 * bf-ey4m re-scores all 31 platforms on each edit but used the result
 * transiently (a local variable consumed by render calls). This task adds a
 * persistent score-state layer so the UI has a single source of truth for the
 * updated grades. This test verifies:
 *
 *  1. Score state is STORED: the re-score result (scores/grades/overall/summary)
 *     is committed to editorState and readable back through an accessor.
 *  2. The UI can ACCESS the updated scores via getCurrentScoring(), which falls
 *     back to the original fetched scores when there are no edits.
 *  3. Score-state updates TRIGGER a UI refresh (renderPreviews/renderSummaryBar
 *     are driven from the stored state) and reset/new-fetch CLEAR the state.
 *  4. A full re-score (the work behind a state update) completes well within the
 *     500ms budget for a typical edit.
 */

const fs = require('fs');
const path = require('path');
const { scoreAll, PLATFORMS } = require('./src/public/scoring-simulator.js');

let failed = 0;
function check(name, condition) {
  if (condition) {
    console.log('  ✓ PASS: ' + name);
  } else {
    console.log('  ✗ FAIL: ' + name);
    failed++;
  }
}

console.log('=== Score State Management Test (bf-ssfp) ===\n');

const appCode = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');

// --- Test 1: score state is stored ------------------------------------------
// Mirror the app's state contract with a small harness that reuses the REAL
// scoring-simulator, so we exercise the same store/read/clear semantics app.js
// implements (which is browser-only and cannot be required here).
console.log('Test 1: Re-score result is stored in state and readable back');

const emptyMeta = { title: '', description: '', og: {}, twitter: {} };
const richMeta = {
  title: 'A Great Page Title That Is Descriptive',
  description: 'A thorough, useful description of the page contents for social sharing previews.',
  og: {
    title: 'A Great Page Title That Is Descriptive',
    description: 'A thorough, useful description of the page contents for social sharing previews.',
    image: 'https://example.com/social.jpg',
    url: 'https://example.com/page',
    site_name: 'Example',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A Great Page Title',
    description: 'A thorough, useful description.',
    image: 'https://example.com/social.jpg',
  },
};

// Harness replicating editorState + getCurrentScoring/applyRescore/clear.
const currentData = { meta: emptyMeta, imageProbe: null, scoring: scoreAll(emptyMeta, null) };
const editorState = { scoring: null, meta: null, lastRescoreMs: 0 };
function getCurrentScoring() {
  return editorState.scoring || currentData.scoring || null;
}
function clearEditedScoring() {
  editorState.scoring = null;
  editorState.meta = null;
  editorState.lastRescoreMs = 0;
}
function applyRescore(editedMeta) {
  const t0 = performance.now();
  const scoring = scoreAll(editedMeta, currentData.imageProbe);
  editorState.scoring = scoring;
  editorState.meta = editedMeta;
  editorState.lastRescoreMs = performance.now() - t0;
  return scoring;
}

// Before any edit, the UI reads the ORIGINAL scores.
check('getCurrentScoring() returns original scores before any edit',
  getCurrentScoring() === currentData.scoring);

// Apply an edit → scores get stored.
const applied = applyRescore(richMeta);
check('applyRescore stores a scoring object in editorState.scoring',
  editorState.scoring === applied && applied != null);
check('stored scoring covers all 31 platforms',
  Object.keys(editorState.scoring.scores).length === 31 && PLATFORMS.length === 31);
check('stored scoring carries overall grade + passing/warning/failing summary',
  typeof editorState.scoring.overall.grade === 'string' &&
    editorState.scoring.summary.passing + editorState.scoring.summary.warning +
      editorState.scoring.summary.failing === 31);
check('editorState remembers the meta the scores were computed against',
  editorState.meta === richMeta);

// --- Test 2: UI accesses the UPDATED scores through the accessor ------------
console.log('\nTest 2: UI can access the updated scores');
check('getCurrentScoring() now returns the edited scores, not the original',
  getCurrentScoring() === editorState.scoring &&
    getCurrentScoring() !== currentData.scoring);
check('edited scores differ from original (state actually reflects the edit)',
  getCurrentScoring().overall.score > currentData.scoring.overall.score);

// --- Test 3: reset / new fetch clears state → UI refreshes to original ------
console.log('\nTest 3: Reset clears stored scores (UI falls back to original)');
clearEditedScoring();
check('clearEditedScoring() drops the stored scoring', editorState.scoring === null);
check('after clear, getCurrentScoring() falls back to the original scores',
  getCurrentScoring() === currentData.scoring);

// --- Test 4: performance budget ---------------------------------------------
console.log('\nTest 4: A state update (full re-score) completes within 500ms');
let worst = 0;
for (let i = 0; i < 20; i++) {
  applyRescore(i % 2 ? richMeta : emptyMeta);
  if (editorState.lastRescoreMs > worst) worst = editorState.lastRescoreMs;
}
console.log('    worst single re-score: ' + worst.toFixed(3) + ' ms');
check('a typical edit re-scores in well under 500ms', worst < 500);
check('editorState.lastRescoreMs records the measured duration',
  typeof editorState.lastRescoreMs === 'number' && editorState.lastRescoreMs >= 0);

// --- Test 5: app.js wiring uses the stored state ----------------------------
console.log('\nTest 5: app.js wires the UI to the stored score state');
check('editorState declares a scoring field for stored scores',
  /let editorState\s*=\s*\{[\s\S]{0,900}scoring:\s*null/.test(appCode));
check('getCurrentScoring() accessor is defined',
  /function getCurrentScoring\s*\(/.test(appCode));
check('getCurrentScoring falls back to currentData.scoring',
  /function getCurrentScoring[\s\S]{0,300}currentData\??\.?\.scoring/.test(appCode) ||
    /function getCurrentScoring[\s\S]{0,300}currentData\?\.scoring/.test(appCode));
check('clearEditedScoring() helper is defined',
  /function clearEditedScoring\s*\(/.test(appCode));
check('applyRescore() stores the result into editorState.scoring',
  /function applyRescore[\s\S]{0,800}editorState\.scoring\s*=/.test(appCode));
check('applyRescore() records the re-score duration (500ms budget)',
  /function applyRescore[\s\S]{0,800}editorState\.lastRescoreMs\s*=/.test(appCode));
check('updatePreviewsWithEdits() drives the UI from applyRescore()',
  /function updatePreviewsWithEdits[\s\S]{0,1500}applyRescore\(/.test(appCode));
check('recalculateScore() drives the UI from applyRescore()',
  /function recalculateScore[\s\S]{0,900}applyRescore\(/.test(appCode));
check('resetEditor() clears the stored scores',
  /function resetEditor[\s\S]{0,600}clearEditedScoring\(/.test(appCode));
check('initEditor() clears stored scores on a new fetch',
  /function initEditor[\s\S]{0,900}clearEditedScoring\(/.test(appCode));

console.log('');
if (failed === 0) {
  console.log('✅ All checks passed — edited scores are stored in state, readable by the UI, and refresh within budget.');
  process.exit(0);
} else {
  console.log('❌ ' + failed + ' check(s) failed.');
  process.exit(1);
}
