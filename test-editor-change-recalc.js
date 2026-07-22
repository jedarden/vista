#!/usr/bin/env node

/**
 * Test: Hook Editor Change Events to Trigger Recalculation (bf-iat3)
 *
 * Verifies the editor-change → scoring-recalculation wiring in app.js:
 * 1. Editor inputs get a change/input event listener attached
 * 2. The listener invokes a callback (handleEditorInput) on content edits
 * 3. That callback triggers a scoring recalculation (scoreAll) via
 *    updatePreviewsWithEdits
 * 4. scoring-simulator.js (scoreAll) loads before app.js so the callback
 *    can reach it at runtime
 */

const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src/public/app.js');
const indexPath = path.join(__dirname, 'src/public/index.html');

console.log('=== Editor Change → Recalculation Hook Test (bf-iat3) ===\n');

const appCode = fs.readFileSync(appPath, 'utf8');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

let failed = 0;
function check(name, condition) {
  if (condition) {
    console.log('  ✓ PASS: ' + name);
  } else {
    console.log('  ✗ FAIL: ' + name);
    failed++;
  }
}

// Test 1: Event listener attached to editor inputs
console.log('Test 1: Change event listener attached to editor');
check(
  "editor inputs selected via .editor-input/.editor-textarea/.editor-select",
  /querySelectorAll\(\s*['"`]\.editor-input,\s*\.editor-textarea,\s*\.editor-select['"`]\s*\)/.test(appCode)
);
check(
  "an 'input' change event listener is added to editor inputs",
  /addEventListener\(\s*['"`]input['"`]\s*,\s*handleEditorInput\s*\)/.test(appCode)
);

// Test 2: Callback invoked on content edits
console.log('\nTest 2: Callback invoked on content edits');
check('handleEditorInput callback is defined', /function handleEditorInput\s*\(/.test(appCode));
check(
  'handleEditorInput records the edit into editorState',
  /function handleEditorInput[\s\S]{0,400}editorState\.edited\[tag\]\s*=/.test(appCode)
);
check(
  'handleEditorInput triggers updatePreviewsWithEdits (recalculation)',
  /function handleEditorInput[\s\S]{0,600}updatePreviewsWithEdits\(\)/.test(appCode)
);

// Test 3: Recalculation actually calls the scoring function
console.log('\nTest 3: Recalculation invokes scoring callback');
check('updatePreviewsWithEdits is defined', /function updatePreviewsWithEdits\s*\(/.test(appCode));
check(
  'updatePreviewsWithEdits triggers a full re-score (applyRescore()->rescoreAllPlatforms())',
  /function updatePreviewsWithEdits[\s\S]{0,3000}(applyRescore|rescoreAllPlatforms)\(/.test(appCode)
);
check(
  'rescoreAllPlatforms calls scoreAll() to re-score all platforms',
  /function rescoreAllPlatforms[\s\S]{0,600}scoreAll\(/.test(appCode)
);

// Test 4: Load order — scoring-simulator.js before app.js
console.log('\nTest 4: scoring-simulator.js available to the callback');
const simIdx = indexHtml.indexOf('scoring-simulator.js');
const appIdx = indexHtml.indexOf('src="app.js"');
check('scoring-simulator.js is loaded in index.html', simIdx !== -1);
check('scoring-simulator.js loads before app.js', simIdx !== -1 && appIdx !== -1 && simIdx < appIdx);

console.log('');
if (failed === 0) {
  console.log('✅ All checks passed — editor change events trigger recalculation.');
  process.exit(0);
} else {
  console.log(`❌ ${failed} check(s) failed.`);
  process.exit(1);
}
