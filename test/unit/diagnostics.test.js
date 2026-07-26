#!/usr/bin/env node
'use strict';

/**
 * Unit tests for src/diagnostics.js — the "Common Mistakes" detector.
 *
 * Covers a representative slice of detectMistakes() checks against crafted
 * HTML + metadata:
 *   - og-wrong-attribute   (name= instead of property= on an OG tag)
 *   - relative-image-url   (og:image without an absolute URL)
 *   - http-image-url       (og:image served over plain HTTP)
 *   - missing-og-image     (no preview image at all)
 *   - clean page           (well-formed input → zero findings)
 *
 * Plain-node style — no test framework, exits non-zero on any failure.
 */

const { detectMistakes } = require('../../src/diagnostics');

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

// meta() guarantees the nested og/twitter objects detectMistakes() reads.
function meta(overrides) {
  return Object.assign({ og: {}, twitter: {} }, overrides);
}

// First finding with the given code, or undefined.
function findByCode(findings, code) {
  return findings.find((f) => f.code === code);
}

// ── og-wrong-attribute: <meta name="og:..."> should be property= ──

test('og-wrong-attribute: name= on an OG tag is flagged as error', () => {
  const html = `<head><meta name="og:title" content="Bad"><title>T</title></head>`;
  const m = meta({
    title: 'T',
    og: { image: 'https://example.com/i.jpg' },
    twitter: { card: 'summary_large_image' },
  });

  const findings = detectMistakes(html, m);
  const f = findByCode(findings, 'og-wrong-attribute');
  assert(f, 'expected an og-wrong-attribute finding');
  assert(f.severity === 'error', `expected severity error, got ${f.severity}`);
  assert(f.message.includes('og:title'), 'message should name the offending tag');
  assert(f.fix.includes('property'), 'fix should advise using property=');
});

// ── relative-image-url: og:image without an absolute URL ──

test('relative-image-url: relative og:image is flagged as error', () => {
  // The parser would resolve this to an absolute URL in meta.og.image, but the
  // raw HTML still carries the relative path the detector scans for.
  const html = `<head><meta property="og:image" content="/images/relative.jpg"><title>T</title></head>`;
  const m = meta({
    title: 'T',
    og: { image: 'https://example.com/images/relative.jpg' },
    twitter: { card: 'summary_large_image' },
  });

  const findings = detectMistakes(html, m);
  const f = findByCode(findings, 'relative-image-url');
  assert(f, 'expected a relative-image-url finding');
  assert(f.severity === 'error', `expected severity error, got ${f.severity}`);
  assert(f.message.includes('/images/relative.jpg'), 'message should quote the relative URL');
  assert(f.fix.includes('https://'), 'fix should advise an absolute https URL');
});

// ── http-image-url: og:image over plain HTTP ──

test('http-image-url: non-HTTPS og:image is flagged, not misclassified as relative', () => {
  const html = `<head><meta property="og:image" content="http://example.com/i.jpg"><title>T</title></head>`;
  const m = meta({
    title: 'T',
    og: { image: 'http://example.com/i.jpg' },
    twitter: { card: 'summary_large_image' },
  });

  const findings = detectMistakes(html, m);
  const f = findByCode(findings, 'http-image-url');
  assert(f, 'expected an http-image-url finding');
  assert(f.severity === 'error', `expected severity error, got ${f.severity}`);
  assert(/HTTP/.test(f.message), 'message should mention HTTP');
  // An http:// URL is absolute, so it must NOT also trip the relative check.
  assert(!findByCode(findings, 'relative-image-url'), 'http URL should not be flagged as relative');
});

// ── missing-og-image: no preview image at all ──

test('missing-og-image: absent og:image is flagged as error', () => {
  const html = `<head><title>T</title></head>`;
  const m = meta({ title: 'T', twitter: { card: 'summary_large_image' } });

  const findings = detectMistakes(html, m);
  const f = findByCode(findings, 'missing-og-image');
  assert(f, 'expected a missing-og-image finding');
  assert(f.severity === 'error', `expected severity error, got ${f.severity}`);
});

// ── Clean page: well-formed input yields no findings ──

test('clean page: well-formed head + metadata → zero findings', () => {
  const html = [
    '<head>',
    '<meta property="og:title" content="T">',
    '<meta property="og:description" content="D">',
    '<meta property="og:image" content="https://example.com/i.jpg">',
    '<meta property="og:url" content="https://example.com/">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<title>T</title>',
    '</head>',
  ].join('');
  const m = meta({
    title: 'T',
    description: 'D',
    og: {
      title: 'T',
      description: 'D',
      image: 'https://example.com/i.jpg',
      url: 'https://example.com/',
    },
    twitter: { card: 'summary_large_image' },
  });
  const imageProbe = {
    width: 1200,
    height: 630,
    contentType: 'image/jpeg',
    responseTime: 100,
    contentLength: 50000,
  };

  const findings = detectMistakes(html, m, imageProbe);
  assert(findings.length === 0, `expected no findings, got: ${JSON.stringify(findings, null, 2)}`);
});

// ── Summary ──

console.log(`\n${'─'.repeat(70)}`);
console.log(`diagnostics tests: ${passed} passed, ${failed} failed`);
console.log('─'.repeat(70));

process.exit(failed === 0 ? 0 : 1);
