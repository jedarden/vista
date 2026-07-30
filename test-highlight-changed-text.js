/**
 * Test the highlightChangedText helper function
 */

// Load the platform-diff module
const { highlightChangedText, changedFields } = require('./src/public/platform-diff.js');

// Test data
const meta1 = {
  score: 85,
  grade: 'A',
  meta: {
    'og:title': 'Original Title',
    'og:description': 'Original description'
  }
};

const meta2 = {
  score: 90, // changed
  grade: 'A', // unchanged
  meta: {
    'og:title': 'New Title', // changed
    'og:description': 'Original description' // unchanged
  }
};

const changedFieldList = changedFields(meta1, meta2);
console.log('Changed fields:', changedFieldList);
// Expected: ['score', 'meta.og:title']

// Test the highlight function
console.log('\n=== Test highlightChangedText ===\n');

// Test 1: Changed field (score)
const scoreValue = meta2.score;
const highlightedScore = highlightChangedText(scoreValue, changedFieldList, 'score');
console.log(`Field 'score' (changed):`);
console.log(`  Input: ${scoreValue}`);
console.log(`  Output: ${highlightedScore}`);
console.log(`  Expected: <span class="diff-changed">90</span>`);
console.log(`  Pass: ${highlightedScore === '<span class="diff-changed">90</span>' ? '✓' : '✗'}\n`);

// Test 2: Unchanged field (grade)
const gradeValue = meta2.grade;
const highlightedGrade = highlightChangedText(gradeValue, changedFieldList, 'grade');
console.log(`Field 'grade' (unchanged):`);
console.log(`  Input: ${gradeValue}`);
console.log(`  Output: ${highlightedGrade}`);
console.log(`  Expected: A`);
console.log(`  Pass: ${highlightedGrade === 'A' ? '✓' : '✗'}\n`);

// Test 3: Changed nested field (meta.og:title)
const titleValue = meta2.meta['og:title'];
const highlightedTitle = highlightChangedText(titleValue, changedFieldList, 'meta.og:title');
console.log(`Field 'meta.og:title' (changed):`);
console.log(`  Input: ${titleValue}`);
console.log(`  Output: ${highlightedTitle}`);
console.log(`  Expected: <span class="diff-changed">New Title</span>`);
console.log(`  Pass: ${highlightedTitle === '<span class="diff-changed">New Title</span>' ? '✓' : '✗'}\n`);

// Test 4: Unchanged nested field (meta.og:description)
const descValue = meta2.meta['og:description'];
const highlightedDesc = highlightChangedText(descValue, changedFieldList, 'meta.og:description');
console.log(`Field 'meta.og:description' (unchanged):`);
console.log(`  Input: ${descValue}`);
console.log(`  Output: ${highlightedDesc}`);
console.log(`  Expected: Original description`);
console.log(`  Pass: ${highlightedDesc === 'Original description' ? '✓' : '✗'}\n`);

// Test 5: Null value on changed field (should wrap empty string)
const nullValue = null;
const highlightedNull = highlightChangedText(nullValue, changedFieldList, 'score');
console.log(`Null value on changed field:`);
console.log(`  Input: ${nullValue}`);
console.log(`  Output: ${highlightedNull}`);
console.log(`  Expected: <span class="diff-changed"></span>`);
console.log(`  Pass: ${highlightedNull === '<span class="diff-changed"></span>' ? '✓' : '✗'}\n`);

// Test 5b: Null value on unchanged field (should return empty string)
const nullValueUnchanged = highlightChangedText(nullValue, changedFieldList, 'grade');
console.log(`Null value on unchanged field:`);
console.log(`  Input: ${nullValue}`);
console.log(`  Output: ${nullValueUnchanged}`);
console.log(`  Expected: `);
console.log(`  Pass: ${nullValueUnchanged === '' ? '✓' : '✗'}\n`);

// Test 6: Number handling
const numValue = 123;
const highlightedNum = highlightChangedText(numValue, changedFieldList, 'score');
console.log(`Number value handling:`);
console.log(`  Input: ${numValue}`);
console.log(`  Output: ${highlightedNum}`);
console.log(`  Expected: <span class="diff-changed">123</span>`);
console.log(`  Pass: ${highlightedNum === '<span class="diff-changed">123</span>' ? '✓' : '✗'}\n`);

console.log('=== All tests completed ===');
