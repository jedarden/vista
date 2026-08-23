#!/usr/bin/env node
'use strict';

/**
 * Unit tests for src/cloudflare-purge.js — the Cloudflare edge purge behind
 * POST /api/purge (plan.md ADR-001, vista-3797812c).
 *
 * Covers the behaviours the purge handler relies on:
 *   - buildPurgeUrls enumerates the exact edge-cache keys for a target URL
 *     (bare badge + all four styles on both the .svg and legacy paths, plus
 *     preview), with the target encoded
 *   - purgeCloudflareEdge skips (never errors) when unconfigured — no token,
 *     no PUBLIC_BASE_URL, or no resolvable zone
 *   - explicit CLOUDFLARE_ZONE_ID is used as-is (no lookup call)
 *   - CLOUDFLARE_ZONE_NAME is resolved via GET /zones?name=...
 *   - the purge call carries a Bearer token and the derived URL list
 *   - API errors (success:false / non-200) surface as status 'failed'
 *
 * All network calls go through an injected fake fetch that records requests
 * and replies with canned responses — no real Cloudflare traffic.
 */

const {
  buildPurgeUrls,
  resolveZoneId,
  purgeCloudflareEdge,
  BADGE_STYLES,
} = require('../../src/cloudflare-purge');

let failed = 0;
function check(name, condition) {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    console.error(`  ✗ ${name}`);
    failed++;
  }
}

// Fake fetch: routes on URL, records every call for assertions.
function makeFakeFetch(routes) {
  const calls = [];
  const impl = async (url, options = {}) => {
    calls.push({ url, options });
    for (const route of routes) {
      if (url.startsWith(route.match)) return route.reply(url, options);
    }
    throw new Error(`unexpected fetch: ${url}`);
  };
  return { impl, calls };
}

const jsonResponse = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

// 1. buildPurgeUrls: the exact URL set the edge cache keys on.
(function buildPurgeUrlsTest() {
  const urls = buildPurgeUrls('https://example.com/page?a=1&b=2', 'https://vista.jedarden.com/');
  check('returns 11 URLs (.svg bare + 4 styles, legacy bare + 4 styles, preview)', urls.length === 11);
  const target = encodeURIComponent('https://example.com/page?a=1&b=2');
  check('bare .svg badge URL first (the edge-cached form)', urls[0] === `https://vista.jedarden.com/api/badge.svg?url=${target}`);
  check('trailing slash stripped from base URL', urls[0].startsWith('https://vista.jedarden.com/api/'));
  check('all four .svg badge styles present', BADGE_STYLES.every((style) => urls.includes(`https://vista.jedarden.com/api/badge.svg?url=${target}&style=${style}`)));
  check('legacy bare badge URL included', urls.includes(`https://vista.jedarden.com/api/badge?url=${target}`));
  check('all four legacy badge styles present', BADGE_STYLES.every((style) => urls.includes(`https://vista.jedarden.com/api/badge?url=${target}&style=${style}`)));
  check('preview URL included', urls.includes(`https://vista.jedarden.com/api/preview?url=${target}`));
  check('empty base URL yields no URLs', buildPurgeUrls('https://example.com', '').length === 0);
  check('empty target yields no URLs', buildPurgeUrls('', 'https://vista.jedarden.com').length === 0);
})();

// 2. Skips when unconfigured — must never throw or report failure.
(async function skipWhenUnconfigured() {
  const { impl, calls } = makeFakeFetch([]);

  const noToken = await purgeCloudflareEdge('https://example.com', {
    apiToken: undefined,
    zoneId: 'zone123',
    baseUrl: 'https://vista.jedarden.com',
    fetchImpl: impl,
  });
  check('no token → skipped', noToken.status === 'skipped');
  check('no token detail names the token', /no server token/.test(noToken.detail));
  check('no token → no network calls', calls.length === 0);

  const noBase = await purgeCloudflareEdge('https://example.com', {
    apiToken: 'tok',
    zoneId: 'zone123',
    baseUrl: undefined,
    fetchImpl: impl,
  });
  check('no PUBLIC_BASE_URL → skipped', noBase.status === 'skipped');
  check('no PUBLIC_BASE_URL → no network calls', calls.length === 0);

  const noZone = await purgeCloudflareEdge('https://example.com', {
    apiToken: 'tok',
    zoneId: undefined,
    zoneName: undefined,
    baseUrl: 'https://vista.jedarden.com',
    fetchImpl: impl,
  });
  check('neither zone id nor zone name → skipped', noZone.status === 'skipped');
  check('zone-less config makes no network calls', calls.length === 0);
})();

// 3. Explicit zone id is used as-is; purge call carries token + URL list.
(async function explicitZoneId() {
  const { impl, calls } = makeFakeFetch([
    { match: 'https://api.cloudflare.com/client/v4/zones/zone123/purge_cache', reply: () => jsonResponse(200, { success: true }) },
  ]);
  const result = await purgeCloudflareEdge('https://example.com', {
    apiToken: 'tok',
    zoneId: 'zone123',
    baseUrl: 'https://vista.jedarden.com',
    fetchImpl: impl,
  });
  check('explicit zone id → purged', result.status === 'purged');
  check('exactly one network call (no zone lookup)', calls.length === 1);
  check('purge call is POST', calls[0].options.method === 'POST');
  check('purge call carries Bearer token', calls[0].options.headers.Authorization === 'Bearer tok');
  const body = JSON.parse(calls[0].options.body);
  check('purge payload lists the 11 derived URLs', Array.isArray(body.files) && body.files.length === 11);
  check('purge payload matches derived URLs', body.files[0] === result.urls[0]);
})();

// 4. Zone-name resolution: GET /zones?name=... → first result's id.
(async function zoneNameResolution() {
  const { impl, calls } = makeFakeFetch([
    { match: 'https://api.cloudflare.com/client/v4/zones?name=', reply: (url) => jsonResponse(200, { success: true, result: [{ id: 'resolved-zone', name: decodeURIComponent(url.split('name=')[1]) }] }) },
    { match: 'https://api.cloudflare.com/client/v4/zones/resolved-zone/purge_cache', reply: () => jsonResponse(200, { success: true }) },
  ]);
  const result = await purgeCloudflareEdge('https://example.com', {
    apiToken: 'tok',
    zoneName: 'jedarden.com',
    baseUrl: 'https://vista.jedarden.com',
    fetchImpl: impl,
  });
  check('zone name → resolved and purged', result.status === 'purged');
  check('lookup call encodes zone name', calls[0].url === 'https://api.cloudflare.com/client/v4/zones?name=jedarden.com');
  check('purge went to the resolved zone id', calls[1].url.endsWith('/zones/resolved-zone/purge_cache'));

  // resolveZoneId returns null for an empty result set.
  const { impl: emptyImpl } = makeFakeFetch([
    { match: 'https://api.cloudflare.com/client/v4/zones?name=', reply: () => jsonResponse(200, { success: true, result: [] }) },
  ]);
  const missing = await resolveZoneId({ zoneName: 'nope.example', apiToken: 'tok', fetchImpl: emptyImpl });
  check('unknown zone name resolves to null', missing === null);
})();

// 5. Cloudflare-side errors surface as 'failed', never as 'purged'.
(async function failurePaths() {
  const { impl: apiErrorImpl, calls: apiErrorCalls } = makeFakeFetch([
    { match: 'https://api.cloudflare.com/client/v4/zones/zone123/purge_cache', reply: () => jsonResponse(403, { success: false, errors: [{ message: 'foo' }] }) },
  ]);
  const apiError = await purgeCloudflareEdge('https://example.com', {
    apiToken: 'tok', zoneId: 'zone123', baseUrl: 'https://vista.jedarden.com', fetchImpl: apiErrorImpl,
  });
  check('API success:false → failed', apiError.status === 'failed');
  check('API error message surfaced', apiError.detail === 'foo');

  const { impl: httpErrorImpl } = makeFakeFetch([
    { match: 'https://api.cloudflare.com/client/v4/zones/zone123/purge_cache', reply: () => jsonResponse(500, {}) },
  ]);
  const httpError = await purgeCloudflareEdge('https://example.com', {
    apiToken: 'tok', zoneId: 'zone123', baseUrl: 'https://vista.jedarden.com', fetchImpl: httpErrorImpl,
  });
  check('HTTP 500 with no CF body → failed with status', httpError.status === 'failed' && httpError.detail === 'HTTP 500');

  const { impl: lookupFailImpl } = makeFakeFetch([
    { match: 'https://api.cloudflare.com/client/v4/zones?name=', reply: () => jsonResponse(502, {}) },
  ]);
  const lookupFail = await purgeCloudflareEdge('https://example.com', {
    apiToken: 'tok', zoneName: 'jedarden.com', baseUrl: 'https://vista.jedarden.com', fetchImpl: lookupFailImpl,
  });
  check('zone lookup HTTP failure → failed', lookupFail.status === 'failed' && /zone lookup failed/.test(lookupFail.detail));
  check('failed cases still attempted their calls', apiErrorCalls.length === 1);
})();

console.log('');
if (failed > 0) {
  console.error(`cloudflare-purge.test.js: ${failed} check(s) failed`);
  process.exit(1);
}
console.log('cloudflare-purge.test.js: all checks passed');
