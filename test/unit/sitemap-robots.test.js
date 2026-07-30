'use strict';

/**
 * Unit tests for the sitemap robots.txt auto-detection fallback.
 *
 * Covers the three pure/orchestrating helpers exported from src/server.js:
 *   - parseRobotsSitemaps  (extract Sitemap: directives from robots.txt)
 *   - looksLikeSitemapXml  (recognize a valid sitemap body)
 *   - resolveSitemapUrl    (input → sitemap, with robots.txt fallback)
 *
 * resolveSitemapUrl is exercised with a mock fetch and a no-op SSRF
 * validator, so these tests need no network or DNS.
 */

const {
  parseRobotsSitemaps,
  looksLikeSitemapXml,
  resolveSitemapUrl,
} = require('../../src/server');

const URLSET = (locs) =>
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
  locs.map((l) => `<url><loc>${l}</loc></url>`).join('') +
  '</urlset>';

// Build a fetch mock from a url → { status, statusText?, body } map. Tracks
// which URLs were requested so tests can assert (e.g.) that robots.txt was
// *not* fetched when the input was already a valid sitemap. Unknown URLs
// throw (simulate a network error), as resolveSitemapUrl expects.
function mockFetch(routes) {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    const entry = routes[url];
    if (!entry) {
      throw new Error(`mock fetch: no route for ${url}`);
    }
    return {
      ok: entry.status >= 200 && entry.status < 300,
      status: entry.status,
      statusText: entry.statusText || '',
      text: async () => entry.body,
    };
  };
  fn.calls = calls;
  return fn;
}

const noOpValidate = async () => {};

function runTests() {
  console.log('Running sitemap robots.txt auto-detection tests...\n');

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

  async function testAsync(description, fn) {
    try {
      await fn();
      console.log(`✓ ${description}`);
      passed++;
    } catch (err) {
      console.log(`✗ ${description}`);
      console.log(`  Error: ${err.message}`);
      failed++;
    }
  }

  // ── parseRobotsSitemaps ──
  console.log('=== parseRobotsSitemaps ===');

  test('single Sitemap directive', () => {
    const r = parseRobotsSitemaps('User-agent: *\nDisallow:\nSitemap: https://a.com/sitemap.xml');
    assert(JSON.stringify(r) === JSON.stringify(['https://a.com/sitemap.xml']), `got ${JSON.stringify(r)}`);
  });

  test('multiple Sitemap directives preserved in order', () => {
    const txt = 'Sitemap: https://a.com/1.xml\nsitemap: https://a.com/2.xml\nSITEMAP: https://a.com/3.xml';
    const r = parseRobotsSitemaps(txt);
    assert(r.length === 3, `expected 3, got ${r.length}`);
    assert(r[0] === 'https://a.com/1.xml', `first wrong: ${r[0]}`);
    assert(r[2] === 'https://a.com/3.xml', `third wrong: ${r[2]}`);
  });

  test('case-insensitive field name', () => {
    const r = parseRobotsSitemaps('  SiTeMaP:   https://a.com/sitemap.xml  ');
    assert(r.length === 1 && r[0] === 'https://a.com/sitemap.xml', `got ${JSON.stringify(r)}`);
  });

  test('ignores commented-out directives', () => {
    const r = parseRobotsSitemaps('# Sitemap: https://a.com/old.xml\nSitemap: https://a.com/new.xml');
    assert(r.length === 1 && r[0] === 'https://a.com/new.xml', `got ${JSON.stringify(r)}`);
  });

  test('strips trailing inline comment from value', () => {
    const r = parseRobotsSitemaps('Sitemap: https://a.com/sitemap.xml # primary entry');
    assert(r.length === 1 && r[0] === 'https://a.com/sitemap.xml', `got ${JSON.stringify(r)}`);
  });

  test('returns [] when no Sitemap directive', () => {
    const r = parseRobotsSitemaps('User-agent: *\nDisallow: /private\n');
    assert(Array.isArray(r) && r.length === 0, `got ${JSON.stringify(r)}`);
  });

  test('returns [] for empty / null input', () => {
    assert(parseRobotsSitemaps('').length === 0, 'empty should be []');
    assert(parseRobotsSitemaps(null).length === 0, 'null should be []');
    assert(parseRobotsSitemaps(undefined).length === 0, 'undefined should be []');
  });

  // ── looksLikeSitemapXml ──
  console.log('\n=== looksLikeSitemapXml ===');

  test('urlset root → true', () => {
    assert(looksLikeSitemapXml(URLSET(['https://a.com/'])) === true, 'urlset should be true');
  });

  test('sitemapindex root → true', () => {
    const idx = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://a.com/1.xml</loc></sitemap></sitemapindex>';
    assert(looksLikeSitemapXml(idx) === true, 'sitemapindex should be true');
  });

  test('bare <url><loc> entries (no root) → true (lenient)', () => {
    assert(looksLikeSitemapXml('<url><loc>https://a.com/</loc></url>') === true, 'lenient match expected');
  });

  test('HTML page → false', () => {
    assert(looksLikeSitemapXml('<!DOCTYPE html><html><head><title>Home</title></head><body>hi</body></html>') === false, 'html should be false');
  });

  test('empty / non-string → false', () => {
    assert(looksLikeSitemapXml('') === false, 'empty false');
    assert(looksLikeSitemapXml(null) === false, 'null false');
    assert(looksLikeSitemapXml('just some plain text') === false, 'plain text false');
  });

  // ── resolveSitemapUrl (robots.txt fallback orchestration) ──
  console.log('\n=== resolveSitemapUrl ===');

  (async () => {
    const fetchOpts = { method: 'GET', headers: {} };

    await testAsync('ACCEPTANCE: bare domain + robots.txt Sitemap directive → crawls discovered sitemap', async () => {
      const fetchFn = mockFetch({
        'https://example.com': { status: 200, body: '<!DOCTYPE html><html><body>home page</body></html>' },
        'https://example.com/robots.txt': { status: 200, body: 'User-agent: *\nDisallow:\nSitemap: https://example.com/sitemap.xml' },
        'https://example.com/sitemap.xml': { status: 200, body: URLSET(['https://example.com/a', 'https://example.com/b']) },
      });

      const result = await resolveSitemapUrl({
        inputUrl: 'https://example.com',
        fetchFn,
        fetchOpts,
        validateFn: noOpValidate,
      });

      assert(result.sitemapUrl === 'https://example.com/sitemap.xml', `expected discovered URL, got ${result.sitemapUrl}`);
      assert(looksLikeSitemapXml(result.xml) === true, 'resolved xml should be a sitemap');
      // Confirms the fallback path ran end-to-end.
      assert(fetchFn.calls.includes('https://example.com/robots.txt'), 'robots.txt should have been fetched');
      assert(fetchFn.calls.includes('https://example.com/sitemap.xml'), 'discovered sitemap should have been fetched');
    });

    await testAsync('ACCEPTANCE: bare domain, robots.txt with no Sitemap directive → clear error', async () => {
      const fetchFn = mockFetch({
        'https://example.com': { status: 200, body: '<html><body>home</body></html>' },
        'https://example.com/robots.txt': { status: 200, body: 'User-agent: *\nDisallow: /private\n' },
      });

      let threw = null;
      try {
        await resolveSitemapUrl({ inputUrl: 'https://example.com', fetchFn, fetchOpts, validateFn: noOpValidate });
      } catch (err) {
        threw = err;
      }
      assert(threw, 'expected an error');
      assert(/no sitemap could be found/i.test(threw.message), `error should explain no sitemap found: "${threw.message}"`);
      assert(/no Sitemap directive/i.test(threw.message), `error should mention missing directive: "${threw.message}"`);
    });

    await testAsync('ACCEPTANCE: direct sitemap.xml URL → used directly, robots.txt NOT fetched (no regression)', async () => {
      const fetchFn = mockFetch({
        'https://example.com/sitemap.xml': { status: 200, body: URLSET(['https://example.com/page']) },
        // robots.txt intentionally absent — fetching it would throw in the mock.
        'https://example.com/robots.txt': { status: 200, body: 'User-agent: *\nDisallow:\n' },
      });

      const result = await resolveSitemapUrl({
        inputUrl: 'https://example.com/sitemap.xml',
        fetchFn,
        fetchOpts,
        validateFn: noOpValidate,
      });

      assert(result.sitemapUrl === 'https://example.com/sitemap.xml', `input should be returned as-is, got ${result.sitemapUrl}`);
      assert(looksLikeSitemapXml(result.xml) === true, 'xml should be the input sitemap');
      assert(!fetchFn.calls.includes('https://example.com/robots.txt'), 'robots.txt must NOT be fetched for a direct sitemap URL');
    });

    await testAsync('robots.txt unreachable (404) → clear error mentioning the status', async () => {
      const fetchFn = mockFetch({
        'https://example.com': { status: 200, body: '<html><body>home</body></html>' },
        'https://example.com/robots.txt': { status: 404, body: 'not found' },
      });
      let threw = null;
      try {
        await resolveSitemapUrl({ inputUrl: 'https://example.com', fetchFn, fetchOpts, validateFn: noOpValidate });
      } catch (err) {
        threw = err;
      }
      assert(threw && /no sitemap could be found/i.test(threw.message), 'expected descriptive error');
      assert(/404/.test(threw.message), `error should mention HTTP 404: "${threw.message}"`);
    });

    await testAsync('robots.txt points to a sitemap that returns invalid XML → clear error', async () => {
      const fetchFn = mockFetch({
        'https://example.com': { status: 200, body: '<html><body>home</body></html>' },
        'https://example.com/robots.txt': { status: 200, body: 'Sitemap: https://example.com/sitemap.xml' },
        'https://example.com/sitemap.xml': { status: 200, body: '<html><body>not actually xml</body></html>' },
      });
      let threw = null;
      try {
        await resolveSitemapUrl({ inputUrl: 'https://example.com', fetchFn, fetchOpts, validateFn: noOpValidate });
      } catch (err) {
        threw = err;
      }
      assert(threw && /did not contain valid sitemap XML/i.test(threw.message), `expected invalid-xml error: "${threw && threw.message}"`);
    });

    await testAsync('SSRF validator is consulted for the robots-discovered sitemap URL', async () => {
      const fetchFn = mockFetch({
        'https://example.com': { status: 200, body: '<html><body>home</body></html>' },
        'https://example.com/robots.txt': { status: 200, body: 'Sitemap: http://169.254.169.254/latest' },
        'http://169.254.169.254/latest': { status: 200, body: URLSET(['http://169.254.169.254/x']) },
      });
      const validateFn = async (url) => {
        if (/169\.254\.169\.254/.test(url)) {
          throw new Error('private/internal address');
        }
      };
      let threw = null;
      try {
        await resolveSitemapUrl({ inputUrl: 'https://example.com', fetchFn, fetchOpts, validateFn });
      } catch (err) {
        threw = err;
      }
      assert(threw, 'expected the SSRF validator to reject the discovered sitemap');
      // The validator should fire before the private URL is ever fetched.
      assert(!fetchFn.calls.includes('http://169.254.169.254/latest'), 'private sitemap must not be fetched');
    });

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
  })();
}

runTests();
