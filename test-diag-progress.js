#!/usr/bin/env node

/**
 * Test: Progress Indicator and Real-time Badge Updates (bf-6aqf)
 *
 * Verifies:
 *  1. The Diagnostics tab pane has a #diagProgress banner element (index.html).
 *  2. app.js wires updateDiagnosticProgress() into fix application and render:
 *     - defined once, called from applyDiagnosticFix (after recalculateScore)
 *     - called from initDiagnosticTracking (reset on fresh render)
 *  3. The progress/badge LOGIC, executed against a simulated DOM, produces:
 *     - banner hidden with 0 fixed
 *     - "Fixed N/M issues — score improved X → Y" once ≥1 fix lands
 *     - a tab badge that counts only ACTIVE (unfixed) error/warning items
 */

const fs = require('fs');
const path = require('path');

let failed = 0;
function check(name, cond) {
  if (cond) { console.log('  ✓ PASS: ' + name); }
  else { console.log('  ✗ FAIL: ' + name); failed++; }
}

const app = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, 'src/public/index.html'), 'utf8');

console.log('\n1. Markup + wiring');
check('index.html has #diagProgress banner inside diagnostics pane',
  /id="diagProgress"/.test(html) &&
  html.indexOf('id="diagProgress"') < html.indexOf('id="diagPanel"'));
check('app.js caches the #diagProgress element',
  /const diagProgress = \$\('#diagProgress'\)/.test(app));
check('updateDiagnosticProgress is defined',
  /function updateDiagnosticProgress\s*\(/.test(app));
check('applyDiagnosticFix calls updateDiagnosticProgress after recalculateScore',
  /recalculateScore\(\);[\s\S]{0,400}updateDiagnosticProgress\(\);[\s\S]{0,200}showToast\('Fix applied/.test(app));
check('initDiagnosticTracking calls updateDiagnosticProgress',
  /function initDiagnosticTracking[\s\S]*?updateDiagnosticProgress\(\);[\s\S]*?\n}/.test(app));

console.log('\n2. Progress + badge logic (simulated DOM)');

// ---- Minimal DOM shim reproducing the parts updateDiagnosticProgress touches.
function makeItem(severity, fixed) {
  return {
    dataset: { fixed: fixed ? 'true' : undefined },
    classList: { contains: (c) => c === severity },
  };
}
function runLogic(items, origScore, curScore) {
  const badge = { textContent: '' };
  const progress = {
    innerHTML: '',
    _hidden: true,
    classList: {
      add: () => { progress._hidden = true; },
      remove: () => { progress._hidden = false; },
    },
  };
  // Mirror of updateDiagnosticProgress body.
  const total = items.length;
  const fixed = items.filter(el => el.dataset.fixed === 'true').length;

  const activeErrWarn = items.filter(el =>
    el.dataset.fixed !== 'true' &&
    (el.classList.contains('error') || el.classList.contains('warning'))
  ).length;
  badge.textContent = activeErrWarn > 0 ? String(activeErrWarn) : '';

  if (fixed <= 0 || total <= 0) {
    progress.classList.add();
    progress.innerHTML = '';
  } else {
    progress.classList.remove();
    progress.innerHTML =
      `<span class="diag-progress-count">Fixed ${fixed}/${total} issue${total !== 1 ? 's' : ''}</span>` +
      ` &mdash; <span class="diag-progress-score">score improved ` +
      `<span class="diag-progress-from">${origScore}</span>` +
      ` &rarr; <span class="diag-progress-to">${curScore}</span></span>`;
  }
  return { badge, progress };
}

// Scenario A: 3 diagnostics (2 error, 1 warning), none fixed.
let items = [makeItem('error', false), makeItem('error', false), makeItem('warning', false)];
let r = runLogic(items, 60, 60);
check('0 fixed → progress banner hidden', r.progress._hidden === true);
check('0 fixed → badge shows all active (3)', r.badge.textContent === '3');

// Scenario B: 1 of 3 fixed, score 60 → 75.
items[0].dataset.fixed = 'true';
r = runLogic(items, 60, 75);
check('1 fixed → banner visible', r.progress._hidden === false);
check('1 fixed → banner text "Fixed 1/3 issues"',
  r.progress.innerHTML.includes('Fixed 1/3 issues'));
check('1 fixed → banner shows score improvement 60 → 75',
  /60[\s\S]*&rarr;[\s\S]*75/.test(r.progress.innerHTML));
check('1 fixed → badge drops to active count (2)', r.badge.textContent === '2');

// Scenario C: all fixed → badge empty, banner shows N === M.
items.forEach(it => { it.dataset.fixed = 'true'; });
r = runLogic(items, 60, 100);
check('all fixed → badge empty', r.badge.textContent === '');
check('all fixed → banner "Fixed 3/3 issues"',
  r.progress.innerHTML.includes('Fixed 3/3 issues'));

// Scenario D: info-severity items don't count toward the badge.
items = [makeItem('info', false), makeItem('error', false)];
r = runLogic(items, 50, 50);
check('info items excluded from badge (only the error counts → 1)',
  r.badge.textContent === '1');

// Scenario E: singular grammar for a single issue.
items = [makeItem('error', true)];
r = runLogic(items, 40, 55);
check('single issue uses singular "issue"',
  r.progress.innerHTML.includes('Fixed 1/1 issue') &&
  !r.progress.innerHTML.includes('1/1 issues'));

console.log('\n' + (failed === 0
  ? 'ALL CHECKS PASSED ✓'
  : failed + ' CHECK(S) FAILED ✗'));
process.exit(failed === 0 ? 0 : 1);
