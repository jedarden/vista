#!/usr/bin/env node

/**
 * Test: Full 31-Platform Re-Score Logic (bf-ey4m)
 *
 * Verifies the editor re-score path scores ALL 31 platforms via the
 * scoring-simulator (scoreAll) on each edit, rather than merely counting
 * fixed diagnostics:
 *
 *  1. scoreAll() returns a score/grade for every one of the 31 platforms.
 *  2. scoreAll() returns a recomputed overall grade and passing/warning/failing
 *     summary (the shape the summary bar renders).
 *  3. Editing content actually changes the returned scores (re-score, not a
 *     static count).
 *  4. app.js wires the editor recalculation through rescoreAllPlatforms() →
 *     scoreAll(), and no longer relies on the old "simple counter" placeholder.
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

console.log('=== Full 31-Platform Re-Score Test (bf-ey4m) ===\n');

// --- Test 1: all 31 platforms are scored ------------------------------------
console.log('Test 1: All 31 platforms scored (not just counted)');
check('PLATFORMS registry defines exactly 31 platforms', PLATFORMS.length === 31);

const emptyMeta = { title: '', description: '', og: {}, twitter: {} };
const poorScoring = scoreAll(emptyMeta, null);
const scoredIds = Object.keys(poorScoring.scores);
check('scoreAll returns a score entry for every platform', scoredIds.length === 31);
check(
  'every platform score has a grade and numeric score',
  scoredIds.every((id) => {
    const s = poorScoring.scores[id];
    return typeof s.grade === 'string' && typeof s.score === 'number';
  })
);
check(
  'every registered platform id is present in the scores',
  PLATFORMS.every((p) => poorScoring.scores[p.id] !== undefined)
);

// --- Test 2: overall grade + summary shape ----------------------------------
console.log('\nTest 2: Overall grade and passing/warning/failing summary');
check('overall grade + score present', !!poorScoring.overall && typeof poorScoring.overall.grade === 'string');
check(
  'summary has passing/warning/failing counts',
  poorScoring.summary &&
    typeof poorScoring.summary.passing === 'number' &&
    typeof poorScoring.summary.warning === 'number' &&
    typeof poorScoring.summary.failing === 'number'
);
check(
  'summary counts sum to 31 platforms',
  poorScoring.summary.passing + poorScoring.summary.warning + poorScoring.summary.failing === 31
);

// --- Test 3: editing content changes the scores (real re-score) -------------
console.log('\nTest 3: Editing content re-scores platforms');
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
const richScoring = scoreAll(richMeta, { width: 1200, height: 630, contentType: 'image/jpeg' });

check('rich content produces a higher overall score than empty content',
  richScoring.overall.score > poorScoring.overall.score);
check('rich content still scores all 31 platforms', Object.keys(richScoring.scores).length === 31);

let improvedCount = 0;
for (const id of scoredIds) {
  if (richScoring.scores[id].score > poorScoring.scores[id].score) improvedCount++;
}
check('at least one platform grade/score improves after edits', improvedCount > 0);

// --- Test 4: app.js wiring uses the real re-score, not the counter ----------
console.log('\nTest 4: app.js wires editor recalculation to scoreAll');
const appCode = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');
check('rescoreAllPlatforms() helper is defined', /function rescoreAllPlatforms\s*\(/.test(appCode));
check('rescoreAllPlatforms calls scoreAll()', /function rescoreAllPlatforms[\s\S]{0,600}scoreAll\(/.test(appCode));
check(
  'updatePreviewsWithEdits triggers rescoreAllPlatforms on edit',
  /function updatePreviewsWithEdits[\s\S]{0,3000}rescoreAllPlatforms\(/.test(appCode)
);
check(
  'recalculateScore performs a real re-score (no "simple score" placeholder)',
  /function recalculateScore[\s\S]{0,800}rescoreAllPlatforms\(/.test(appCode) &&
    !/Simple score recalculation/.test(appCode)
);

console.log('');
if (failed === 0) {
  console.log('✅ All checks passed — editor re-scores all 31 platforms on each edit.');
  process.exit(0);
} else {
  console.log('❌ ' + failed + ' check(s) failed.');
  process.exit(1);
}
