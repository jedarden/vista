#!/usr/bin/env node
'use strict';

/**
 * Unit tests for src/scorer.js — platform grade computation.
 *
 * Exercises scoreAll() (and the per-platform results it returns) across a
 * spread of representative meta-tag inputs: perfect metadata, missing tags,
 * over-length tags, HTTP vs HTTPS images, undersized images, and a couple of
 * platform-specific rules (Pinterest's vertical preference, Discord's
 * theme-color check). Expected grades/scores are hand-computed from the
 * deduction branches in src/scorer.js.
 *
 * Plain-node style — no test framework, exits non-zero on any failure.
 */

const { scoreAll, PLATFORMS } = require('../../src/scorer');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function test(description, fn) {
  try {
    fn();
    console.log(`✓ ${description}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${description}`);
    console.log(`  Error: ${err.message}`);
    failed++;
  }
}

// scoreAll() scores every platform; pull a single platform's result out.
function score(platformId, meta, imageProbe) {
  return scoreAll(meta, imageProbe).scores[platformId];
}

// meta() guarantees the nested og/twitter objects scorePlatform() reads.
function meta(overrides) {
  return Object.assign({ og: {}, twitter: {} }, overrides);
}

// True if any issue/fix string for a result contains substr.
function mentions(result, substr) {
  const haystack = [...result.issues, ...result.fixes].join('\n');
  return haystack.includes(substr);
}

// ── Google: <title> + <meta name="description"> ──

test('google: full valid metadata → A+ / 100, no issues', () => {
  const r = score('google', meta({ title: 'Hello World', description: 'A meta description.' }));
  assert(r.grade === 'A+', `expected A+, got ${r.grade}`);
  assert(r.score === 100, `expected 100, got ${r.score}`);
  assert(r.issues.length === 0, `expected no issues, got ${JSON.stringify(r.issues)}`);
});

test('google: missing title AND description → F / 20, two issues + two fixes', () => {
  const r = score('google', meta());
  assert(r.grade === 'F', `expected F, got ${r.grade}`);
  assert(r.score === 20, `expected 20 (100-50-30), got ${r.score}`);
  assert(r.issues.length === 2, `expected 2 issues, got ${r.issues.length}`);
  assert(mentions(r, 'Missing <title>'), 'should flag missing <title>');
  assert(mentions(r, 'Missing <meta name="description">'), 'should flag missing description');
  assert(r.fixes.length === 2, 'should offer 2 fixes');
});

test('google: over-length title (>60) and description (>158) → C / 65', () => {
  const r = score('google', meta({ title: 'A'.repeat(80), description: 'B'.repeat(200) }));
  assert(r.grade === 'C', `expected C, got ${r.grade}`);
  assert(r.score === 65, `expected 65 (100-20-15), got ${r.score}`);
  assert(mentions(r, 'Title is 80 chars'), 'should flag 80-char title');
  assert(mentions(r, 'Description is 200 chars'), 'should flag 200-char description');
});

// ── Facebook: og:title / og:description / og:image ──

test('facebook: HTTPS image meeting 1200×630 → A+ / 100', () => {
  const r = score(
    'facebook',
    meta({ og: { title: 'FB', description: 'Desc', image: 'https://example.com/i.jpg' } }),
    { width: 1200, height: 630 }
  );
  assert(r.grade === 'A+', `expected A+, got ${r.grade}`);
  assert(r.score === 100, `expected 100, got ${r.score}`);
});

test('facebook: missing og:image → B / 70', () => {
  const r = score('facebook', meta({ og: { title: 'FB', description: 'Desc' } }));
  assert(r.grade === 'B', `expected B, got ${r.grade}`);
  assert(r.score === 70, `expected 70 (100-30), got ${r.score}`);
  assert(mentions(r, 'Missing og:image'), 'should flag missing og:image');
});

test('facebook: HTTP image (non-HTTPS) at recommended size → A / 90', () => {
  const r = score(
    'facebook',
    meta({ og: { title: 'FB', description: 'Desc', image: 'http://example.com/i.jpg' } }),
    { width: 1200, height: 630 }
  );
  assert(r.grade === 'A', `expected A, got ${r.grade}`);
  assert(r.score === 90, `expected 90 (100-10 HTTPS), got ${r.score}`);
  assert(mentions(r, 'og:image should use HTTPS'), 'should flag non-HTTPS image');
});

// ── Twitter (X): twitter:card + effective title/description/image ──

test('twitter: full twitter:* + og:image → A+ / 100', () => {
  const r = score(
    'twitter',
    meta({
      og: { title: 'T', description: 'D', image: 'https://example.com/i.jpg' },
      twitter: { card: 'summary_large_image', image: 'https://example.com/i.jpg' },
    })
  );
  assert(r.grade === 'A+', `expected A+, got ${r.grade}`);
  assert(r.score === 100, `expected 100, got ${r.score}`);
});

test('twitter: missing card and image → C / 65', () => {
  const r = score('twitter', meta({ og: { title: 'T', description: 'D' } }));
  assert(r.grade === 'C', `expected C, got ${r.grade}`);
  assert(r.score === 65, `expected 65 (100-15 card-20 image), got ${r.score}`);
  assert(mentions(r, 'Missing twitter:card'), 'should flag missing twitter:card');
  assert(mentions(r, 'No image'), 'should flag missing image');
});

// ── Platform-specific rules ──

test('pinterest: horizontal image penalized → A / 90', () => {
  const r = score(
    'pinterest',
    meta({ og: { title: 'P', image: 'https://example.com/i.jpg' } }),
    { width: 1200, height: 630 }
  );
  assert(r.grade === 'A', `expected A, got ${r.grade}`);
  assert(r.score === 90, `expected 90 (100-10 horizontal), got ${r.score}`);
  assert(mentions(r, 'Pinterest prefers vertical 2:3'), 'should recommend vertical image');
});

test('discord: everything present except theme-color → A+ / 95', () => {
  const r = score(
    'discord',
    meta({ og: { title: 'D', image: 'https://example.com/i.jpg' } }),
    { width: 1200, height: 630 }
  );
  assert(r.grade === 'A+', `expected A+, got ${r.grade}`);
  assert(r.score === 95, `expected 95 (100-5 theme-color), got ${r.score}`);
  assert(mentions(r, 'Missing theme-color'), 'should flag missing theme-color');
});

// ── scoreAll(): aggregate / overall grade ──

test('scoreAll: perfect metadata → every platform A+, overall A+', () => {
  // 1200×1200 satisfies the 1200×630 recommended size AND is not horizontal,
  // so Pinterest does not deduct — every platform scores a clean 100.
  const result = scoreAll(
    meta({
      title: 'Perfect Page',
      description: 'A great page.',
      themeColor: '#ff0000',
      og: {
        title: 'Perfect Page',
        description: 'A great page.',
        image: 'https://example.com/og.png',
        url: 'https://example.com/',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Perfect Page',
        description: 'A great page.',
        image: 'https://example.com/og.png',
      },
    }),
    { width: 1200, height: 1200 }
  );

  assert(result.overall.grade === 'A+', `overall expected A+, got ${result.overall.grade}`);
  assert(result.summary.passing === PLATFORMS.length, `all ${PLATFORMS.length} platforms should pass`);
  assert(result.summary.warning === 0, `expected 0 warnings, got ${result.summary.warning}`);
  assert(result.summary.failing === 0, `expected 0 failing, got ${result.summary.failing}`);

  // Every individual platform is A+ with a perfect score.
  for (const id of Object.keys(result.scores)) {
    assert(result.scores[id].grade === 'A+', `${id} expected A+, got ${result.scores[id].grade}`);
    assert(result.scores[id].score === 100, `${id} expected 100, got ${result.scores[id].score}`);
  }
});

test('scoreAll: empty metadata → no platform passes, overall failing', () => {
  const result = scoreAll(meta(), undefined);
  assert(result.summary.passing === 0, `expected 0 passing, got ${result.summary.passing}`);
  assert(result.summary.failing > 0, 'expected at least one failing platform');
  assert(['D', 'F'].includes(result.overall.grade), `expected low overall grade, got ${result.overall.grade}`);
});

// ── Summary ──

console.log(`\n${'─'.repeat(70)}`);
console.log(`scorer tests: ${passed} passed, ${failed} failed`);
console.log('─'.repeat(70));

process.exit(failed === 0 ? 0 : 1);
