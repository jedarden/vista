'use strict';

/**
 * Fixture-driven tests for metadata extraction (src/fetcher.js parseMetaTags).
 *
 * Every fixture is a self-contained HTML string exercising one documented
 * extraction behaviour, so a regression names the exact tag shape that broke:
 *
 *   - <title> and <meta name="description"> basics (trim, first-wins, nulls)
 *   - Open Graph: the og:* set, case-insensitive properties, duplicate
 *     first-wins plus the `_all_<key>` duplicate arrays, relative og:image
 *     resolved against the fetch baseUrl
 *   - Twitter Cards: name= and property= both match, twitter:image takes the
 *     LAST duplicate (X behaviour) while every other key takes the first
 *   - JSON-LD: every parseable block collected in order (objects and arrays),
 *     malformed blocks silently skipped
 *   - rawTags: the diagnostics list — every <meta> in document order with
 *     name/property/content/http-equiv/charset and the re-serialized rawHtml
 *   - missing metadata: empty/whitespace/head-less/garbage documents yield the
 *     all-null shape (favicon falls back to baseUrl + /favicon.ico)
 *   - malformed metadata: broken markup and empty/whitespace content never
 *     throw and never leak into og/twitter maps
 *   - precedence rules: which duplicate wins per tag family
 *   - HTML escaping: entities are decoded into extracted values while rawHtml
 *     preserves the escaped source form
 *
 * The last two sections prove the extracted shape is what the rest of the app
 * consumes:
 *   - scoring: scoreAll() runs directly on parseMetaTags output
 *   - previews: POST /api/preview/meta with the same fixtures (the express app
 *     bound to an ephemeral loopback port, exactly like http-api.test.js; no
 *     mocking needed — that endpoint parses the posted HTML in-process with no
 *     fetch and no image probe)
 */

const FETCHER_PATH = require.resolve('../../src/fetcher');
const { parseMetaTags } = require(FETCHER_PATH);
const { scoreAll } = require('../../src/scorer');

// Loaded only for the preview-consumption section; the server listens only
// when run directly (require.main === module), so requiring is side-effect
// free apart from binding the route table.
let app;
try {
  app = require('../../src/server').app;
} catch (err) {
  app = null; // sections below report this as a failed precondition test
}

const BASE = 'https://example.test/page';

// --- harness (plain-node style, mirroring the sibling test files) -----------

let passed = 0;
let failed = 0;

function test(desc, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`✓ ${desc}`);
      passed++;
    })
    .catch((err) => {
      console.log(`✗ ${desc}`);
      console.log(`  Error: ${err && err.message ? err.message : err}`);
      failed++;
    });
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(
      (msg || 'assertEqual failed') +
        ` — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertDeepEqual(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error((msg || 'assertDeepEqual failed') + ` — expected ${b}, got ${a}`);
  }
}

// --- fixtures ---------------------------------------------------------------

// One of everything, with realistic values (lengths chosen to score cleanly).
const COMPLETE_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Example Page Title</title>
  <meta name="description" content="Example description used by SERP snippets.">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#4287f5">
  <link rel="icon" href="/icons/favicon.ico">
  <meta property="og:title" content="Example OG Title">
  <meta property="og:description" content="Example OG description.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://example.test/page">
  <meta property="og:image" content="https://cdn.example.test/images/og.png">
  <meta property="og:site_name" content="Example Site">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Example Twitter Title">
  <meta name="twitter:description" content="Example Twitter description.">
  <meta name="twitter:image" content="https://cdn.example.test/images/twitter.png">
  <meta name="twitter:site" content="@examplesite">
  <script type="application/ld+json">
    {"@context":"https://schema.org","@type":"Article","headline":"Example Article"}
  </script>
</head>
<body><h1>Hello</h1></body>
</html>`;

// --- parseMetaTags fixtures -------------------------------------------------

async function runTests() {
  console.log('Running metadata extraction fixture tests...\n');

  // === <title> ===
  console.log('=== <title> ===');

  await test('extracts a simple head title', () => {
    assertEqual(parseMetaTags(COMPLETE_PAGE, BASE).title, 'Example Page Title');
  });

  await test('trims surrounding whitespace from the title', () => {
    const meta = parseMetaTags('<html><head><title>   Padded Title\n  </title></head></html>', BASE);
    assertEqual(meta.title, 'Padded Title');
  });

  await test('takes the FIRST <title> when several are present', () => {
    const meta = parseMetaTags(
      '<html><head><title>First</title><title>Second</title></head></html>',
      BASE
    );
    assertEqual(meta.title, 'First');
  });

  await test('returns null when the title is empty', () => {
    const meta = parseMetaTags('<html><head><title></title></head></html>', BASE);
    assertEqual(meta.title, null);
  });

  await test('returns null for a <title> outside <head> (selector is head-scoped)', () => {
    const meta = parseMetaTags('<html><body><title>Body Title</title></body></html>', BASE);
    assertEqual(meta.title, null);
  });

  // === <meta name="description"> ===
  console.log('\n=== <meta name="description"> ===');

  await test('extracts the meta description', () => {
    const meta = parseMetaTags(COMPLETE_PAGE, BASE);
    assertEqual(meta.description, 'Example description used by SERP snippets.');
  });

  await test('trims surrounding whitespace from the description', () => {
    const meta = parseMetaTags(
      '<html><head><meta name="description" content="  trimmed desc  "></head></html>',
      BASE
    );
    assertEqual(meta.description, 'trimmed desc');
  });

  await test('returns null when the description is absent', () => {
    const meta = parseMetaTags('<html><head><title>T</title></head></html>', BASE);
    assertEqual(meta.description, null);
  });

  await test('returns null for a whitespace-only description', () => {
    const meta = parseMetaTags(
      '<html><head><meta name="description" content="   "></head></html>',
      BASE
    );
    assertEqual(meta.description, null);
  });

  // === Open Graph ===
  console.log('\n=== Open Graph ===');

  await test('extracts the full og:* set', () => {
    const og = parseMetaTags(COMPLETE_PAGE, BASE).og;
    assertEqual(og.title, 'Example OG Title');
    assertEqual(og.description, 'Example OG description.');
    assertEqual(og.type, 'website');
    assertEqual(og.url, 'https://example.test/page');
    assertEqual(og.image, 'https://cdn.example.test/images/og.png');
    assertEqual(og.site_name, 'Example Site');
  });

  await test('matches og: properties case-insensitively (PROPERTY="OG:TITLE")', () => {
    const meta = parseMetaTags(
      '<html><head><meta PROPERTY="OG:TITLE" content="Upper"></head></html>',
      BASE
    );
    assertEqual(meta.og.title, 'Upper');
  });

  await test('resolves a relative og:image against the baseUrl', () => {
    const meta = parseMetaTags(
      '<html><head><meta property="og:image" content="/img/og.png"></head></html>',
      BASE
    );
    assertEqual(meta.og.image, 'https://example.test/img/og.png');
  });

  await test('resolves a protocol-relative og:image onto the base scheme', () => {
    const meta = parseMetaTags(
      '<html><head><meta property="og:image" content="//cdn.example.test/x.png"></head></html>',
      BASE
    );
    assertEqual(meta.og.image, 'https://cdn.example.test/x.png');
  });

  await test('leaves an absolute og:image untouched', () => {
    const meta = parseMetaTags(COMPLETE_PAGE, BASE);
    assertEqual(meta.og.image, 'https://cdn.example.test/images/og.png');
  });

  await test('keeps og:image:secure_url as its own key without clobbering og:image', () => {
    const meta = parseMetaTags(
      `<html><head>
        <meta property="og:image" content="https://cdn.example.test/a.png">
        <meta property="og:image:secure_url" content="https://cdn.example.test/a-secure.png">
      </head></html>`,
      BASE
    );
    assertEqual(meta.og.image, 'https://cdn.example.test/a.png');
    assertEqual(meta.og['image:secure_url'], 'https://cdn.example.test/a-secure.png');
  });

  await test('only the canonical og:* keys are resolved as URLs (site_name left as-is)', () => {
    // og:image resolution must not mangle non-image og values.
    const meta = parseMetaTags(COMPLETE_PAGE, BASE);
    assertEqual(meta.og.site_name, 'Example Site');
  });

  // === Twitter Cards ===
  console.log('\n=== Twitter Cards ===');

  await test('extracts the twitter:* set from name= attributes', () => {
    const twitter = parseMetaTags(COMPLETE_PAGE, BASE).twitter;
    assertEqual(twitter.card, 'summary_large_image');
    assertEqual(twitter.title, 'Example Twitter Title');
    assertEqual(twitter.description, 'Example Twitter description.');
    assertEqual(twitter.image, 'https://cdn.example.test/images/twitter.png');
    assertEqual(twitter.site, '@examplesite');
  });

  await test('matches twitter: tags written with property= too', () => {
    const meta = parseMetaTags(
      `<html><head>
        <meta property="twitter:card" content="summary">
        <meta property="twitter:title" content="Prop Title">
      </head></html>`,
      BASE
    );
    assertEqual(meta.twitter.card, 'summary');
    assertEqual(meta.twitter.title, 'Prop Title');
  });

  await test('twitter:image takes the LAST duplicate (X crawlers do this)', () => {
    const meta = parseMetaTags(
      `<html><head>
        <meta name="twitter:image" content="https://cdn.example.test/first.png">
        <meta name="twitter:image" content="https://cdn.example.test/last.png">
      </head></html>`,
      BASE
    );
    assertEqual(meta.twitter.image, 'https://cdn.example.test/last.png');
  });

  await test('non-image twitter: keys take the FIRST duplicate', () => {
    const meta = parseMetaTags(
      `<html><head>
        <meta name="twitter:title" content="First">
        <meta name="twitter:title" content="Second">
      </head></html>`,
      BASE
    );
    assertEqual(meta.twitter.title, 'First');
  });

  await test('resolves a relative twitter:image against the baseUrl', () => {
    const meta = parseMetaTags(
      '<html><head><meta name="twitter:image" content="img/tw.png"></head></html>',
      BASE
    );
    assertEqual(meta.twitter.image, 'https://example.test/img/tw.png');
  });

  // === JSON-LD ===
  console.log('\n=== JSON-LD ===');

  await test('parses a single JSON-LD block into jsonLd[0]', () => {
    const meta = parseMetaTags(COMPLETE_PAGE, BASE);
    assertEqual(meta.jsonLd.length, 1);
    assertEqual(meta.jsonLd[0]['@type'], 'Article');
    assertEqual(meta.jsonLd[0].headline, 'Example Article');
  });

  await test('collects every JSON-LD block in document order', () => {
    const meta = parseMetaTags(
      `<html><head>
        <script type="application/ld+json">{"@type":"Organization","name":"Acme"}</script>
        <script type="application/ld+json">{"@type":"WebSite","url":"https://example.test"}</script>
      </head></html>`,
      BASE
    );
    assertEqual(meta.jsonLd.length, 2);
    assertEqual(meta.jsonLd[0]['@type'], 'Organization');
    assertEqual(meta.jsonLd[1]['@type'], 'WebSite');
  });

  await test('finds JSON-LD blocks placed in <body> as well as <head>', () => {
    const meta = parseMetaTags(
      '<html><body><script type="application/ld+json">{"@type":"Thing"}</script></body></html>',
      BASE
    );
    assertEqual(meta.jsonLd.length, 1);
    assertEqual(meta.jsonLd[0]['@type'], 'Thing');
  });

  await test('preserves array-shaped JSON-LD payloads intact', () => {
    const meta = parseMetaTags(
      `<html><head>
        <script type="application/ld+json">[{"@type":"WebPage"},{"@type":"BreadcrumbList"}]</script>
      </head></html>`,
      BASE
    );
    assertEqual(meta.jsonLd.length, 1);
    assertEqual(meta.jsonLd[0].length, 2);
    assertEqual(meta.jsonLd[0][1]['@type'], 'BreadcrumbList');
  });

  await test('skips malformed JSON-LD without throwing and keeps the valid blocks', () => {
    const meta = parseMetaTags(
      `<html><head>
        <script type="application/ld+json">{broken json!!!</script>
        <script type="application/ld+json">{"@type":"Valid"}</script>
        <script type="application/ld+json"></script>
      </head></html>`,
      BASE
    );
    assertEqual(meta.jsonLd.length, 1);
    assertEqual(meta.jsonLd[0]['@type'], 'Valid');
  });

  await test('ignores scripts that are not ld+json', () => {
    const meta = parseMetaTags(
      `<html><head>
        <script type="text/javascript">var notJsonLd = {"a":1};</script>
        <script>{"@type":"NoTypeAttr"}</script>
      </head></html>`,
      BASE
    );
    assertEqual(meta.jsonLd.length, 0);
  });

  // === rawTags ===
  console.log('\n=== rawTags ===');

  await test('records EVERY meta tag in document order with index', () => {
    const meta = parseMetaTags(COMPLETE_PAGE, BASE);
    // charset + description + robots + theme-color + 6 og + 5 twitter = 15
    assertEqual(meta.rawTags.length, 15);
    assertEqual(meta.rawTags[0].index, 0);
    meta.rawTags.forEach((t, i) => assertEqual(t.index, i, `rawTags[${i}].index`));
    assertEqual(meta.rawTags[4].property, 'og:title');
  });

  await test('captures charset-only and http-equiv tags with their dedicated fields', () => {
    const meta = parseMetaTags(
      `<html><head>
        <meta charset="utf-8">
        <meta http-equiv="refresh" content="30">
      </head></html>`,
      BASE
    );
    assertEqual(meta.rawTags.length, 2);
    assertEqual(meta.rawTags[0].charset, 'utf-8');
    assertEqual(meta.rawTags[1].httpEquiv, 'refresh');
    assertEqual(meta.rawTags[1].content, '30');
    assertEqual(meta.rawTags[0].name, null);
    assertEqual(meta.rawTags[1].property, null);
  });

  await test('rawHtml preserves the escaped source form of the tag', () => {
    const meta = parseMetaTags(
      '<html><head><meta name="description" content="Fish &amp; Chips"></head></html>',
      BASE
    );
    assertEqual(
      meta.rawTags[0].rawHtml,
      '<meta name="description" content="Fish &amp; Chips">'
    );
  });

  await test('includes tags the structured extractors reject (empty content, unknown name)', () => {
    const meta = parseMetaTags(
      `<html><head>
        <meta property="og:title">
        <meta name="custom-thing" content="kept">
      </head></html>`,
      BASE
    );
    assertEqual(meta.rawTags.length, 2);
    // og:title with no content lands in rawTags but not in the og map…
    assertEqual(meta.og.title, undefined);
    // …and the unknown name= tag is recorded with its name and content.
    assertEqual(meta.rawTags[1].name, 'custom-thing');
    assertEqual(meta.rawTags[1].content, 'kept');
  });

  await test('does not treat link/theme-color/robots as rawTags (meta elements only)', () => {
    const meta = parseMetaTags(COMPLETE_PAGE, BASE);
    // theme-color and robots ARE meta tags; the favicon link is not.
    assertEqual(meta.themeColor, '#4287f5');
    assertEqual(meta.robots, 'index, follow');
    assert(meta.rawTags.every((t) => t.name !== null || t.property !== null || t.charset || t.httpEquiv),
      'every rawTag carries an identifying attribute');
  });

  // === Missing metadata ===
  console.log('\n=== Missing metadata ===');

  await test('an empty document yields the all-null/empty shape', () => {
    const meta = parseMetaTags('<html><head></head></html>', BASE);
    assertEqual(meta.title, null);
    assertEqual(meta.description, null);
    assertDeepEqual(meta.og, {});
    assertDeepEqual(meta.twitter, {});
    assertDeepEqual(meta.jsonLd, []);
    assertEqual(meta.themeColor, null);
    assertEqual(meta.robots, null);
    assertDeepEqual(meta.rawTags, []);
  });

  await test('a document with no head at all still parses cleanly', () => {
    const meta = parseMetaTags('<html><body><p>only content</p></body></html>', BASE);
    assertEqual(meta.title, null);
    assertEqual(meta.description, null);
    assertDeepEqual(meta.rawTags, []);
  });

  await test('a whitespace-only document parses cleanly', () => {
    const meta = parseMetaTags('   \n\t  ', BASE);
    assertEqual(meta.title, null);
    assertDeepEqual(meta.rawTags, []);
  });

  await test('garbage input parses cleanly instead of throwing', () => {
    const meta = parseMetaTags('garbage < not html <<<>>>', BASE);
    assertEqual(meta.title, null);
    assertDeepEqual(meta.rawTags, []);
    assertEqual(meta.jsonLd.length, 0);
  });

  await test('favicon falls back to /favicon.ico resolved against the baseUrl', () => {
    const meta = parseMetaTags('<html><head></head></html>', BASE);
    assertEqual(meta.favicon, 'https://example.test/favicon.ico');
  });

  await test('prefers rel=icon over rel="shortcut icon" and resolves the href', () => {
    const both = parseMetaTags(
      `<html><head>
        <link rel="shortcut icon" href="/b.ico">
        <link rel="icon" href="/a.ico">
      </head></html>`,
      BASE
    );
    assertEqual(both.favicon, 'https://example.test/a.ico');
    const shortcutOnly = parseMetaTags(
      '<html><head><link rel="shortcut icon" href="/fav2.ico"></head></html>',
      BASE
    );
    assertEqual(shortcutOnly.favicon, 'https://example.test/fav2.ico');
  });

  // === Malformed metadata ===
  console.log('\n=== Malformed metadata ===');

  await test('markup missing its closing body/html tags still yields every tag', () => {
    const meta = parseMetaTags(
      '<html><head><title>Broken Page</title>' +
        '<meta name="description" content="desc survives">' +
        '</head><body>',
      BASE
    );
    assertEqual(meta.title, 'Broken Page');
    assertEqual(meta.description, 'desc survives');
  });

  await test('a dangling unterminated meta tag is dropped, not fatal', () => {
    // <meta property="og:title" with no closing > is discarded by the parser;
    // the well-formed tags around it survive.
    const meta = parseMetaTags(
      '<html><head><title>Broken</title><meta name="description" content="d">' +
        '<meta property="og:title"',
      BASE
    );
    assertEqual(meta.title, 'Broken');
    assertEqual(meta.description, 'd');
    assertEqual(meta.rawTags.length, 1);
    assertEqual(meta.og.title, undefined);
  });

  await test('a name= value with different case is not matched by the description selector', () => {
    // Attribute-selector VALUES are case-sensitive: name="DESCRIPTION" does
    // not satisfy meta[name="description"]. The tag must still be recorded in
    // rawTags so diagnostics can surface it.
    const meta = parseMetaTags(
      '<html><head><meta name="DESCRIPTION" content="upper"></head></html>',
      BASE
    );
    assertEqual(meta.description, null);
    assertEqual(meta.rawTags.length, 1);
    assertEqual(meta.rawTags[0].name, 'DESCRIPTION');
  });

  await test('og/twitter tags with no content are excluded from the structured maps', () => {
    const meta = parseMetaTags(
      `<html><head>
        <meta property="og:title">
        <meta name="twitter:card" content="">
      </head></html>`,
      BASE
    );
    assertEqual(meta.og.title, undefined);
    assertEqual(meta.twitter.card, undefined);
    assertEqual(meta.rawTags.length, 2);
  });

  await test('a charset-only tag never leaks into the og/twitter maps', () => {
    const meta = parseMetaTags('<html><head><meta charset="utf-8"></head></html>', BASE);
    assertDeepEqual(meta.og, {});
    assertDeepEqual(meta.twitter, {});
    assertEqual(meta.rawTags.length, 1);
  });

  await test('relative og:image with an unresolvable baseUrl still returns something usable', () => {
    // resolveUrl falls back to the raw href when URL construction fails.
    const meta = parseMetaTags(
      '<html><head><meta property="og:image" content="https://ok.example.test/x.png"></head></html>',
      'not-a-base-url'
    );
    assertEqual(meta.og.image, 'https://ok.example.test/x.png');
  });

  // === Precedence rules ===
  console.log('\n=== Precedence rules ===');

  await test('og:* duplicates: the FIRST occurrence wins but all are kept in _all_<key>', () => {
    const meta = parseMetaTags(
      `<html><head>
        <meta property="og:title" content="First">
        <meta property="og:title" content="Second">
        <meta property="OG:TITLE" content="Third">
      </head></html>`,
      BASE
    );
    assertEqual(meta.og.title, 'First');
    assertDeepEqual(meta.og._all_title, ['First', 'Second', 'Third']);
  });

  await test('twitter:card: first occurrence wins across name= and property= spellings', () => {
    const meta = parseMetaTags(
      `<html><head>
        <meta property="twitter:card" content="summary_large_image">
        <meta name="twitter:card" content="summary">
      </head></html>`,
      BASE
    );
    assertEqual(meta.twitter.card, 'summary_large_image');
  });

  await test('duplicate twitter:image: last wins, unlike every other key', () => {
    const meta = parseMetaTags(
      `<html><head>
        <meta name="twitter:title" content="first-title">
        <meta name="twitter:title" content="second-title">
        <meta name="twitter:image" content="/one.png">
        <meta name="twitter:image" content="/two.png">
      </head></html>`,
      BASE
    );
    assertEqual(meta.twitter.title, 'first-title');
    assertEqual(meta.twitter.image, 'https://example.test/two.png');
  });

  await test('description selector takes the first matching tag', () => {
    const meta = parseMetaTags(
      `<html><head>
        <meta name="description" content="first description">
        <meta name="description" content="second description">
      </head></html>`,
      BASE
    );
    assertEqual(meta.description, 'first description');
  });

  // === HTML escaping ===
  console.log('\n=== HTML escaping ===');

  await test('named and numeric entities are decoded in the title', () => {
    const meta = parseMetaTags(
      '<html><head><title>Fish &amp; Chips &#8212; A &#39;Quoted&#39; Title</title></head></html>',
      BASE
    );
    assertEqual(meta.title, "Fish & Chips — A 'Quoted' Title");
  });

  await test('entities are decoded in meta content values', () => {
    const meta = parseMetaTags(
      '<html><head><meta name="description" content="AT&amp;T – “curly” quotes"></head></html>',
      BASE
    );
    assertEqual(meta.description, 'AT&T – “curly” quotes');
  });

  await test('decoded og values stay decoded (no double-escaping) end to end', () => {
    const meta = parseMetaTags(
      '<html><head><meta property="og:title" content="Q&amp;A Session"></head></html>',
      BASE
    );
    assertEqual(meta.og.title, 'Q&A Session');
    const scoring = scoreAll(meta, null);
    // The decoded value is what reaches the scorer: a short og:title scores
    // full marks with no truncation complaint.
    assert(!scoring.scores.facebook.issues.some((i) => i.includes('60 chars')),
      'decoded title must not be measured with its escaped form');
  });

  // === Output consumed by scoring (scoreAll on parseMetaTags output) ===
  console.log('\n=== Scoring consumption ===');

  await test('a complete page scores 100/A+ on Google with no issues', () => {
    const meta = parseMetaTags(COMPLETE_PAGE, BASE);
    const scoring = scoreAll(meta, null);
    assertEqual(scoring.scores.google.grade, 'A+');
    assertEqual(scoring.scores.google.score, 100);
    assertDeepEqual(scoring.scores.google.issues, []);
  });

  await test('a complete page scores 100/A+ on X/Twitter (card, title, description, image)', () => {
    const meta = parseMetaTags(COMPLETE_PAGE, BASE);
    const scoring = scoreAll(meta, null);
    assertEqual(scoring.scores.twitter.grade, 'A+');
    assertEqual(scoring.scores.twitter.score, 100);
    assertDeepEqual(scoring.scores.twitter.issues, []);
  });

  await test('a page with no metadata at all fails hard (google: missing title + description)', () => {
    const meta = parseMetaTags('<html><head></head></html>', BASE);
    const scoring = scoreAll(meta, null);
    assertEqual(scoring.scores.google.grade, 'F');
    assertEqual(scoring.scores.google.score, 20); // −50 title, −30 description
    assert(scoring.scores.google.issues.includes('Missing <title> tag'),
      'missing-title issue reported');
    assert(scoring.scores.google.issues.includes('Missing <meta name="description">'),
      'missing-description issue reported');
    assertEqual(scoring.overall.grade, 'F');
  });

  await test('twitter scoring falls back through twitter:* → og:* (og-only page)', () => {
    const meta = parseMetaTags(
      `<html><head>
        <meta property="og:title" content="OG Title">
        <meta property="og:description" content="OG description.">
        <meta property="og:image" content="https://cdn.example.test/og.png">
      </head></html>`,
      BASE
    );
    const scoring = scoreAll(meta, null);
    // Title, description and image all resolve via the og fallbacks…
    assert(!scoring.scores.twitter.issues.includes('No title'), 'og:title satisfies title');
    assert(!scoring.scores.twitter.issues.includes('No description'), 'og:description satisfies description');
    assert(!scoring.scores.twitter.issues.includes('No image'), 'og:image satisfies image');
    // …leaving only the absent twitter:card deduction (−15).
    assertDeepEqual(scoring.scores.twitter.issues, ['Missing twitter:card']);
    assertEqual(scoring.scores.twitter.score, 85);
  });

  await test('twitter:title takes precedence over og:title when scoring X cards', () => {
    // Short og:title, >70-char twitter:title: the truncation issue can only
    // fire if the scorer measured the TWITTER title.
    const meta = parseMetaTags(
      `<html><head>
        <meta property="og:title" content="Short OG">
        <meta name="twitter:title" content="This twitter title is definitely longer than seventy characters in total length">
      </head></html>`,
      BASE
    );
    const issues = scoreAll(meta, null).scores.twitter.issues;
    assert(issues.includes('Title may truncate on X (>70 chars)'),
      'twitter:title (not og:title) drives the truncation check');
  });

  await test('og:title takes precedence over <title> for Open Graph consumers', () => {
    // Long <title> (would trip Facebook's 60-char check) with a short og:title
    // must NOT produce the truncation issue.
    const meta = parseMetaTags(
      `<html><head>
        <title>This plain title is far longer than sixty characters so it would truncate if it were measured at all</title>
        <meta property="og:title" content="Short OG">
        <meta property="og:image" content="https://cdn.example.test/og.png">
      </head></html>`,
      BASE
    );
    const issues = scoreAll(meta, null).scores.facebook.issues;
    assert(!issues.some((i) => i.includes('60 chars')),
      'og:title (not <title>) drives the Facebook title check');
  });

  // === Output consumed by previews (POST /api/preview/meta) ===
  console.log('\n=== Preview consumption (POST /api/preview/meta) ===');

  if (!app) {
    await test('express app unavailable — preview consumption NOT verified', () => {
      throw new Error('could not require ../../src/server (app export missing)');
    });
  } else {
    const server = await new Promise((resolve, reject) => {
      const s = app.listen(0, '127.0.0.1');
      s.once('listening', () => resolve(s));
      s.once('error', reject);
    });
    const port = server.address().port;

    const req = async (pathAndQuery, opts) => {
      const res = await fetch(`http://127.0.0.1:${port}${pathAndQuery}`, opts);
      const body = Buffer.from(await res.arrayBuffer());
      return { status: res.status, text: body.toString('utf8'), json: JSON.parse(body.toString('utf8')) };
    };

    const HTML_TYPE = { 'Content-Type': 'text/html' };

    try {
      await test('the endpoint returns the extracted meta shape for the complete page', async () => {
        const res = await req('/api/preview/meta?base=https://example.test/page', {
          method: 'POST',
          headers: HTML_TYPE,
          body: COMPLETE_PAGE,
        });
        assertEqual(res.status, 200, 'status');
        const data = res.json;
        assertEqual(data.meta.title, 'Example Page Title');
        assertEqual(data.meta.description, 'Example description used by SERP snippets.');
        assertEqual(data.meta.og.title, 'Example OG Title');
        assertEqual(data.meta.og.siteName, 'Example Site'); // og:site_name → siteName
        assertEqual(data.meta.og.image, 'https://cdn.example.test/images/og.png');
        assertEqual(data.meta.twitter.card, 'summary_large_image');
        assertEqual(data.meta.twitter.site, '@examplesite');
        assertEqual(data.meta.themeColor, '#4287f5');
      });

      await test('rawTags from the extractor ride through to the preview response', async () => {
        const res = await req('/api/preview/meta?base=https://example.test/page', {
          method: 'POST',
          headers: HTML_TYPE,
          body: COMPLETE_PAGE,
        });
        assertEqual(res.status, 200, 'status');
        const rawTags = res.json.meta.rawTags;
        assert(Array.isArray(rawTags) && rawTags.length === 15, 'all 15 meta tags carried');
        assertEqual(rawTags[0].charset, 'utf-8');
        assert(rawTags.every((t) => typeof t.rawHtml === 'string'), 'rawHtml present per tag');
      });

      await test('preview cards apply the precedence chains (og beats title, twitter beats og)', async () => {
        const res = await req('/api/preview/meta?base=https://example.test/page', {
          method: 'POST',
          headers: HTML_TYPE,
          body: COMPLETE_PAGE,
        });
        const previews = res.json.previews;
        // Google SERP: og:title > <title>
        assertEqual(previews.google.title, 'Example OG Title');
        assertEqual(previews.google.description, 'Example OG description.');
        // X card: twitter:* > og:* > <title>
        assertEqual(previews.twitter.title, 'Example Twitter Title');
        assertEqual(previews.twitter.description, 'Example Twitter description.');
        assertEqual(previews.twitter.cardType, 'summary_large_image');
        assertEqual(previews.twitter.image, 'https://cdn.example.test/images/twitter.png');
        // Facebook/LinkedIn/Slack/Discord all consume the og:* card
        assertEqual(previews.facebook.title, 'Example OG Title');
        assertEqual(previews.facebook.image, 'https://cdn.example.test/images/og.png');
        assertEqual(previews.linkedin.title, 'Example OG Title');
        assertEqual(previews.slack.title, 'Example OG Title');
        assertEqual(previews.discord.title, 'Example OG Title');
      });

      await test('scoring in the preview response is derived from the same extraction', async () => {
        const res = await req('/api/preview/meta?base=https://example.test/page', {
          method: 'POST',
          headers: HTML_TYPE,
          body: COMPLETE_PAGE,
        });
        const scoring = res.json.scoring;
        assertEqual(scoring.scores.google.grade, 'A+');
        assertEqual(scoring.scores.google.score, 100);
        assertEqual(scoring.overall.grade, 'A+');
        assert(scoring.scores && scoring.scores.twitter, 'per-platform scores keyed as `scores`');
      });

      await test('a relative og:image is resolved through ?base= in the preview response', async () => {
        const html = '<html><head><meta property="og:image" content="/img/rel.png"></head></html>';
        const res = await req('/api/preview/meta?base=https://example.test/page', {
          method: 'POST',
          headers: HTML_TYPE,
          body: html,
        });
        assertEqual(res.status, 200, 'status');
        assertEqual(res.json.meta.og.image, 'https://example.test/img/rel.png');
        assertEqual(res.json.previews.facebook.image, 'https://example.test/img/rel.png');
      });

      await test('decoded entities flow into the preview cards unescaped', async () => {
        const html =
          '<html><head><title>Plain Title</title>' +
          '<meta property="og:title" content="Q&amp;A Session">' +
          '</head></html>';
        const res = await req('/api/preview/meta?base=https://example.test/page', {
          method: 'POST',
          headers: HTML_TYPE,
          body: html,
        });
        assertEqual(res.json.previews.google.title, 'Q&A Session');
      });

      await test('a metadata-less page previews with empty strings and still scores', async () => {
        const res = await req('/api/preview/meta?base=https://example.test/page', {
          method: 'POST',
          headers: HTML_TYPE,
          body: '<html><head></head></html>',
        });
        assertEqual(res.status, 200, 'status');
        const data = res.json;
        assertEqual(data.meta.title, null);
        assertEqual(data.meta.og.title, null);
        assertEqual(data.previews.google.title, '');
        assertEqual(data.previews.twitter.title, '');
        assertEqual(data.scoring.scores.google.grade, 'F');
      });
    } finally {
      server.close();
    }
  }

  // --- summary ---
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
