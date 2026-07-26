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
 * Usage:  npm test          (package.json "test" script)
 *         node test/run-unit.js
 */

const { readdirSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const unitDir = join(__dirname, 'unit');
const files = readdirSync(unitDir)
  .filter((f) => f.endsWith('.test.js'))
  .sort();

if (files.length === 0) {
  console.error('No *.test.js files found under test/unit/ — nothing to run.');
  process.exit(1);
}

const bar = '─'.repeat(70);
console.log(`\n${bar}`);
console.log(`Running ${files.length} unit test file(s) from test/unit/`);
console.log(`${bar}`);

let failures = 0;
for (const file of files) {
  const filePath = join(unitDir, file);
  console.log(`\n▶ ${file}`);
  // stdio: 'inherit' streams each file's output live so failures are visible.
  const result = spawnSync(process.execPath, [filePath], { stdio: 'inherit' });
  if (result.status !== 0) {
    failures++;
    console.error(`✗ FAILED: ${file} (exit ${result.status})`);
  }
}

console.log(`\n${bar}`);
console.log(
  `Summary: ${files.length} file(s), ${files.length - failures} passed, ${failures} failed`
);
console.log(bar);

process.exit(failures > 0 ? 1 : 0);
