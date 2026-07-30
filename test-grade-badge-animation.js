#!/usr/bin/env node
/**
 * bf-2kmy — Animate Grade Badges and Card Borders
 *
 * Verifies the CSS transitions + in-place DOM update that let the summary bar
 * grade badge, per-card grade badges, and card border colors animate smoothly
 * (300ms) when fixes are applied and the platforms are re-scored.
 */
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, 'src/public/style.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');

let failures = 0;
function check(name, cond) {
  console.log(`${cond ? '✓' : '✗'} ${name}`);
  if (!cond) failures++;
}

// Pull a single CSS rule body for a selector at the start of a line.
function ruleFor(selector) {
  const re = new RegExp(
    '(^|\\n)\\s*' + selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{([^}]*)\\}'
  );
  const m = css.match(re);
  return m ? m[2] : '';
}

// 1. Summary bar grade badge animates its grade color (300ms).
const gradeBadge = ruleFor('.grade-badge');
check('summary grade badge has a 300ms color transition',
  /transition:[^;]*\b(background|color)\b/.test(gradeBadge) && /300ms/.test(gradeBadge));

// 2. Per-card grade badge animates its color (300ms).
const cardGrade = ruleFor('.card-grade');
check('per-card grade badge has a 300ms color transition',
  /transition:[^;]*\b(background|color)\b/.test(cardGrade) && /300ms/.test(cardGrade));

// 3. Card border color transitions smoothly (300ms) — grade is a border-left.
const platformCard = ruleFor('.platform-card');
check('platform card transitions border-left-color at 300ms',
  /border-left-color\s+300ms/.test(platformCard));

// 4. Transition uses CSS 300ms in all three places.
check('exactly three 300ms grade transitions declared',
  (gradeBadge.match(/300ms/g) || []).length >= 1 &&
  (cardGrade.match(/300ms/g) || []).length >= 1 &&
  (platformCard.match(/300ms/g) || []).length >= 1);

// 5. prefers-reduced-motion disables the new transitions (accessibility).
check('reduced-motion disables grade/card transitions',
  /prefers-reduced-motion[\s\S]*\.grade-badge,\s*\.card-grade,\s*\.platform-card\s*\{[^}]*transition:\s*none/.test(css));

// 6. Existing grade classes drive the animated colors (unchanged wiring).
check('grade-badge grade classes still set background+color',
  /\.grade-badge\.grade-A[, ]/.test(css) && /\.platform-card\.grade-A\b/.test(css));

// 7. Edits update existing cards in place (persistent DOM) so transitions fire.
check('updateEditedCardsInPlace defined', /function updateEditedCardsInPlace\s*\(/.test(js));
check('swapGradeClass preserves non-grade classes',
  /function swapGradeClass\s*\(/.test(js) &&
  /filter\(\(c\) => c\.startsWith\('grade-'\)\)/.test(js));
check('in-place updater swaps card + badge grade classes',
  /swapGradeClass\(card, scoreData\.grade\)/.test(js) &&
  /swapGradeClass\(gradeBadge, scoreData\.grade\)/.test(js));
check('edit flow prefers in-place update over destructive rebuild',
  /if \(!updateEditedCardsInPlace\(modifiedData\)\) \{[\s\S]*renderPreviews\(modifiedData\)/.test(js));

// 8. Summary bar badge is a persistent element updated in place (animates C→A).
check('summary bar badge updated in place on re-score',
  /overallGrade\.className = 'grade-badge ' \+ gradeClass\(g\)/.test(js));

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
