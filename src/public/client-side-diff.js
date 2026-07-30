'use strict';

// =============================================================================
// VISTA Client-Side Meta-Tag Diff
//
// Pure, dependency-free logic for comparing server-side raw meta tags (the
// HTML a crawler sees, before JavaScript runs) against browser-parsed DOM
// meta tags (the HTML after JavaScript executes). Used by verifyClientSideTags
// in app.js to detect tags that only exist after JS — i.e. tags a social
// crawler will never see.
//
// Mirrors the dual-export convention used by scoring-simulator.js: globals in
// the browser, module.exports under Node (for unit tests).
// =============================================================================

/**
 * Normalize a single meta tag into a comparable { key, content } pair.
 *
 * Accepts either shape produced by the two sides of the comparison:
 *   - a DOM Element (browser side): has a getAttribute() method
 *   - a rawTags entry from parseMetaTags(): { property, name, content, ... }
 *
 * Returns null for tags we don't compare:
 *   - non-og:/twitter: tags (we only diff the tags crawlers care about)
 *   - tags with no usable key or empty content (empty content is effectively
 *     absent to a crawler, so it must not mask a client-side injection)
 */
function normalizeMetaTag(tag) {
  if (!tag) return null;

  const isDom = typeof tag.getAttribute === 'function';
  const property = isDom ? tag.getAttribute('property') : tag.property;
  const name = isDom ? tag.getAttribute('name') : tag.name;
  const content = isDom ? tag.getAttribute('content') : tag.content;

  const rawKey = property || name || '';
  if (!rawKey) return null;
  if (content === null || content === undefined || content === '') return null;

  const key = rawKey.toLowerCase();
  // Only og:* and twitter:* participate in the client-side diff.
  if (!key.startsWith('og:') && !key.startsWith('twitter:')) return null;

  return { key, content };
}

/**
 * Build a multiset (counted set) of normalized meta tags.
 *
 * Returns a Map keyed on JSON.stringify([key, content]) (the JSON encoding is
 * collision-safe: a key containing a space can never be confused with content
 * containing a space), whose value is { key, content, count }. Using counts
 * (rather than a Map keyed only on the tag name) means:
 *   - duplicate tags are not collapsed — two identical <meta og:image> tags
 *     count as two, so a JS-injected duplicate is still detected
 *   - ordering is irrelevant — only the per-pair counts matter, so document
 *     order differences between raw HTML and the DOM never produce noise
 *
 * @param {Array} tags - iterable of DOM elements and/or rawTags objects
 * @returns {Map<string, {key:string, content:string, count:number}>}
 */
function buildMetaMultiset(tags) {
  const counts = new Map();
  if (!tags) return counts;

  for (const tag of tags) {
    const n = normalizeMetaTag(tag);
    if (!n) continue;
    const sk = JSON.stringify([n.key, n.content]);
    const existing = counts.get(sk);
    if (existing) {
      existing.count++;
    } else {
      counts.set(sk, { key: n.key, content: n.content, count: 1 });
    }
  }
  return counts;
}

/**
 * Compare server-side raw tags with browser-parsed DOM tags.
 *
 * Duplicate- and order-aware: counts each (key, content) pair on both sides
 * and reports only the genuine differences.
 *
 * A pair is classified as:
 *   - clientOnly (JS-injected): the tag KEY is entirely absent from the raw
 *     HTML, so a non-JS crawler will not see it at all. (severity: error)
 *   - differing  (JS-modified/added): the key exists in the raw HTML, but the
 *     DOM carries a value or extra copy that the raw HTML does not.
 *     (severity: warning)
 *
 * @param {Array} serverTags - rawTags from parseMetaTags() (raw HTML, no JS)
 * @param {Array} clientTags - meta elements parsed from the rendered DOM
 * @returns {{ clientOnlyTags: Array<{key:string,value:string,count:number}>,
 *             differingTags:  Array<{key:string,value:string,count:number}> }}
 */
function diffClientSideTags(serverTags, clientTags) {
  const server = buildMetaMultiset(serverTags);
  const client = buildMetaMultiset(clientTags);

  // Keys that appear anywhere in the raw (server) HTML — used to tell
  // "key entirely missing server-side" (injected) from "key present but
  // value differs" (modified).
  const serverKeys = new Set();
  for (const entry of server.values()) serverKeys.add(entry.key);

  const clientOnlyTags = [];
  const differingTags = [];

  for (const { key, content, count: clientCount } of client.values()) {
    const serverEntry = server.get(JSON.stringify([key, content]));
    const serverCount = serverEntry ? serverEntry.count : 0;
    if (clientCount <= serverCount) continue; // fully accounted for in raw HTML

    const extra = clientCount - serverCount;
    if (serverKeys.has(key)) {
      // Key exists server-side, but this value / extra copy only appears post-JS.
      differingTags.push({ key, value: content, count: extra });
    } else {
      // Key is entirely absent from the raw HTML → injected by JavaScript.
      clientOnlyTags.push({ key, value: content, count: extra });
    }
  }

  return { clientOnlyTags, differingTags };
}

// Export for use in app.js (browser) and unit tests (Node).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { normalizeMetaTag, buildMetaMultiset, diffClientSideTags };
}
