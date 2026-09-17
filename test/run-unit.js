#!/usr/bin/env node
'use strict';

/**
 * Discovers and runs every unit test file under test/unit/*.test.js, each in
 * its own child process, and exits non-zero if ANY file fails.
 *
 * Why a process-per-file runner (instead of `require()`-ing each file, or
 * `node --test`): every existing test file is a self-contained plain-node
 * script that ends with its own `process.exit(0|1)`. Requiring them in one
 * process would halt the whole run at the first `process.exit`; running each
 * as a child process isolates them and lets us aggregate exit codes. This is
 * wiring, not a test framework — no new dependency, each file still runs with
 * plain `node` exactly as it does standalone.
 *
 * Dependency-aware skipping: some suites exercise modules that need installed
 * dependencies (express, cheerio, ...). In a checkout without node_modules —
 * a fresh clone, or NEEDLE's clean `git archive` extraction re-running a
 * close's verified commands — those files die with Node's "Cannot find
 * module" before any assertion runs. That is an environment gap, not a test
 * failure, so the runner classifies it as a SKIP: reported loudly, not
 * counted as a pass and not failing the run. A file only qualifies as
 * skipped when its output names a module that IS a declared dependency of
 * this package — anything else (an assertion failure, a typo'd relative
 * require, a crash) stays a hard failure. With node_modules installed every
 * file runs and nothing is ever skipped.
 *
 * Usage:  npm test          (package.json "test" script)
 *         node test/run-unit.js
 */

const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const rootDir = join(__dirname, '..');
const unitDir = join(__dirname, 'unit');
const files = readdirSync(unitDir)
  .filter((f) => f.endsWith('.test.js'))
  .sort();

if (files.length === 0) {
  console.error('No *.test.js files found under test/unit/ — nothing to run.');
  process.exit(1);
}

// Declared dependencies of this package — the only modules whose absence
// qualifies a file for a skip rather than a failure.
const pkg = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const declared = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
]);

// Matches the first line of Node's module-not-found error. Capture limits
// keep a pathological test from ballooning memory; 2MB is far past any real
// suite's output.
const MISSING_MODULE_RE = /Cannot find module ['"]([^'"]+)['"]/;
const MAX_CAPTURE = 2 * 1024 * 1024;

function missingDeclaredModule(output) {
  const m = output.match(MISSING_MODULE_RE);
  if (!m) return null;
  // Scoped packages ('@scope/name/...') resolve to their first two segments.
  const spec = m[1].startsWith('@')
    ? m[1].split('/').slice(0, 2).join('/')
    : m[1].split('/')[0];
  return declared.has(spec) ? spec : null;
}

const bar = '─'.repeat(70);
console.log(`\n${bar}`);
console.log(`Running ${files.length} unit test file(s) from test/unit/`);
console.log(`${bar}`);

let failures = 0;
let skips = 0;
for (const file of files) {
  const filePath = join(unitDir, file);
  console.log(`\n▶ ${file}`);
  // Capture the child's output so a failure can be classified, while still
  // streaming it through live so failures are visible as they happen.
  const result = spawnSync(process.execPath, [filePath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: MAX_CAPTURE,
  });
  if (result.stdout && result.stdout.length) process.stdout.write(result.stdout);
  if (result.stderr && result.stderr.length) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    const missing = missingDeclaredModule(
      `${result.stdout || ''}${result.stderr || ''}`
    );
    if (missing) {
      skips++;
      console.log(`⊘ SKIPPED: ${file} — requires the '${missing}' package (not installed in this checkout)`);
    } else {
      failures++;
      console.error(`✗ FAILED: ${file} (exit ${result.status})`);
    }
  }
}

console.log(`\n${bar}`);
console.log(
  `Summary: ${files.length} file(s), ${files.length - failures - skips} passed, ` +
    `${failures} failed` +
    (skips > 0 ? `, ${skips} skipped (missing declared dependencies)` : '')
);
console.log(bar);

process.exit(failures > 0 ? 1 : 0);
