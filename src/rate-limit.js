'use strict';

/**
 * Generic per-IP rate limiting (in-memory token bucket).
 *
 * Per docs/plan/plan.md "Security": "Rate limiting: basic in-memory token bucket
 * (stateless — resets on restart, which is fine)". The store lives in process
 * memory only — it imposes no shared state and clears on every restart, which
 * is an accepted trade-off for this service.
 *
 * Each call consumes one token from the bucket keyed by (namespace, IP, hour).
 * Buckets are namespaced so a tight limit on one endpoint group does not starve
 * the budget of another: e.g. /api/sitemap (5/hr, ~100 downstream fetches per
 * request) gets its own bucket independent of /api/preview (30/hr, one fetch).
 * Without namespacing, all endpoints would share a single counter per IP and a
 * low per-endpoint limit would be meaningless.
 */

const rateLimitStore = new Map();

/**
 * Check (and consume) one rate-limit token for an IP within a namespace.
 *
 * @param {string} ip        Client IP address (bucket key).
 * @param {number} [limit=30] Maximum requests allowed per hour in this namespace.
 * @param {string} [namespace='default'] Bucket group — isolates budgets between
 *   endpoint groups. Callers should pass a stable label (e.g. 'preview',
 *   'screenshot', 'sitemap').
 * @returns {{ allowed: boolean, remaining: number }} `allowed` is false when the
 *   limit has been reached (no token consumed in that case); `remaining` is the
 *   number of tokens left after this call.
 */
function checkRateLimit(ip, limit = 30, namespace = 'default') {
  const now = Date.now();
  const hour = Math.floor(now / 3600000); // Current hour bucket

  const key = `${namespace}:${ip}:${hour}`;
  const count = rateLimitStore.get(key) || 0;

  if (count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  rateLimitStore.set(key, count + 1);
  return { allowed: true, remaining: limit - count - 1 };
}

module.exports = { checkRateLimit };
