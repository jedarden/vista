#!/usr/bin/env node
'use strict';

/**
 * Unit tests for src/rate-limit.js — the per-IP in-memory token bucket that
 * backs every rate-limited endpoint. (bf-8c39)
 *
 * Covers the behaviours the server relies on:
 *   - limit enforcement (allowed flips to false past the limit)
 *   - `remaining` counts down to 0
 *   - namespace isolation (a full 'preview' bucket does not starve 'screenshot'
 *     or 'sitemap' for the same IP — the reason the namespace param exists)
 *   - per-IP isolation (one IP hitting its limit does not affect another)
 *   - default limit (30) and default namespace
 *
 * The store is a module-level Map keyed by `${namespace}:${ip}:${hour}`. Tests
 * use a unique IP per case so they never collide on the shared current-hour
 * bucket (the module exposes no reset, by design — it is meant to be stateless
 * per-process).
 */

const { checkRateLimit } = require('../../src/rate-limit');

let failed = 0;
function check(name, condition) {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    console.error(`  ✗ ${name}`);
    failed++;
  }
}

// 1. Allows up to `limit`, then denies; `remaining` counts down.
(function limitEnforced() {
  const ip = '10.0.0.1';
  let last;
  for (let i = 0; i < 30; i++) {
    last = checkRateLimit(ip, 30, 'preview');
    check(`preview call #${i + 1} allowed`, last.allowed === true);
    check(`preview call #${i + 1} remaining === ${30 - i - 1}`, last.remaining === 30 - i - 1);
  }
  const over = checkRateLimit(ip, 30, 'preview');
  check('31st preview call denied', over.allowed === false);
  check('denied call reports 0 remaining', over.remaining === 0);
})();

// 2. Namespace isolation: exhausting 'preview' must NOT block other namespaces.
(function namespaceIsolation() {
  const ip = '10.0.0.2';
  for (let i = 0; i < 30; i++) checkRateLimit(ip, 30, 'preview');
  check('preview exhausted for ip', checkRateLimit(ip, 30, 'preview').allowed === false);
  check('screenshot still allowed (separate namespace)', checkRateLimit(ip, 30, 'screenshot').allowed === true);
  check('sitemap still allowed (separate namespace)', checkRateLimit(ip, 5, 'sitemap').allowed === true);
})();

// 3. Per-IP isolation: one IP at its limit does not affect a different IP.
(function perIpIsolation() {
  const a = '10.0.0.3';
  for (let i = 0; i < 30; i++) checkRateLimit(a, 30, 'preview');
  check('ip-a exhausted', checkRateLimit(a, 30, 'preview').allowed === false);
  check('ip-b unaffected', checkRateLimit('10.0.0.4', 30, 'preview').allowed === true);
})();

// 4. Defaults: limit=30, namespace='default'.
(function defaults() {
  const r = checkRateLimit('10.0.0.5');
  check('default call allowed', r.allowed === true);
  check('default call remaining === 29', r.remaining === 29);
})();

// 5. Lower limit (sitemap-style 5/hr) denies after exactly 5.
(function lowerLimit() {
  const ip = '10.0.0.6';
  for (let i = 0; i < 5; i++) {
    check(`sitemap call #${i + 1} allowed`, checkRateLimit(ip, 5, 'sitemap').allowed === true);
  }
  check('6th sitemap call denied', checkRateLimit(ip, 5, 'sitemap').allowed === false);
})();

console.log(failed === 0 ? '\nAll rate-limit tests passed.' : `\n${failed} rate-limit test(s) failed.`);
process.exit(failed === 0 ? 0 : 1);
