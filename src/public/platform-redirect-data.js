'use strict';

// =============================================================================
// VISTA Platform Redirect Behavior Data
//
// Documented redirect-following behavior for the crawlers that generate social
// link previews (Facebook, X/Twitter, LinkedIn, iMessage, Slack, Discord).
//
// ## Honesty about provenance (read this before editing)
// No social platform officially publishes a hard "maximum redirects followed"
// number. The figures below are community-observed and trace to the underlying
// HTTP client each crawler uses:
//
//   HTTP_CLIENT_DEFAULT = 5
//     The de-facto redirect cap for most general-purpose HTTP clients —
//     Node's global fetch, Python `requests`, .NET HttpClient. Facebook,
//     Twitter, and LinkedIn crawlers behave this way (~5 hops).
//
//   CURL_DEFAULT = 20
//     libcurl's hardcoded CURLOPT_MAXREDIRS default — the source of the famous
//     "Maximum (20) redirects followed" error. Slack and other libcurl-based
//     unfurlers inherit this.
//
// Each platform entry carries a `confidence` ('documented' | 'observed' | 'low')
// and a `source` string so the UI can present the number with the right
// caveats instead of false precision.
// =============================================================================

// Wrap the module body in an IIFE so its top-level `const`s (PLATFORMS,
// REDIRECT_CACHING, …) are scoped here, NOT the global lexical environment.
// scoring-simulator.js (also loaded via <script>) declares its own top-level
// `const PLATFORMS`; without this IIFE the browser throws
// "SyntaxError: Identifier 'PLATFORMS' has already been declared" when this
// script loads, breaking window.PLATFORM_REDIRECT_DATA and the redirect UI.
(function () {
/** De-facto redirect cap for most HTTP clients (Node fetch, Python requests, …). */
const HTTP_CLIENT_DEFAULT = 5;

/** libcurl's CURLOPT_MAXREDIRS hardcoded default. */
const CURL_DEFAULT = 20;

/**
 * The hop count at which the MAJORITY of social crawlers give up. Used for the
 * headline hop-count warning banner. Equals HTTP_CLIENT_DEFAULT — the strictest
 * broadly-applicable limit a real chain is likely to hit.
 */
const COMMON_GIVEUP_LIMIT = 5;

/**
 * Platform redirect-following behavior.
 * @typedef {Object} PlatformRedirectInfo
 * @property {string} id              - slug, stable for tests
 * @property {string} name            - display name
 * @property {string} bot             - crawler user-agent substring(s)
 * @property {number} maxRedirects    - observed max redirects followed
 * @property {number} [extraRedirects] - extra hops the platform injects before
 *        the chain (e.g. Twitter's t.co wrapper = 1). Defaults to 0.
 * @property {boolean} followsRedirects
 * @property {string} caching         - 'aggressive' | 'moderate' | 'light'
 * @property {string} cacheDetail     - what gets cached + how to bust it
 * @property {('documented'|'observed'|'low')} confidence
 * @property {string} source          - provenance of maxRedirects
 */
const PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook / Meta',
    bot: 'facebookexternalhit, meta-externalagent',
    maxRedirects: 5,
    followsRedirects: true,
    caching: 'aggressive',
    cacheDetail:
      'Caches the resolved final URL and scraped Open Graph data (~30 days). ' +
      'A 301 pins the cached destination, so changing the target later ' +
      'propagates slowly — force a re-scrape via the Sharing Debugger.',
    confidence: 'observed',
    source:
      'No official number published. Crawler behaves like a standard HTTP client (~5); widely community-tested.',
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    bot: 'Twitterbot',
    maxRedirects: 5,
    // t.co wraps every shared URL, so the crawler walks one extra redirect
    // (t.co/... → your URL) on top of this chain before it even reaches hop 1.
    // The view module adds this to the effective redirect count for Twitter.
    extraRedirects: 1,
    followsRedirects: true,
    caching: 'moderate',
    cacheDetail:
      't.co wraps every shared URL (adds one hop on top of your chain). ' +
      'Cards are cached ~7 days. A 302 can leave the cached card pointing at ' +
      'the redirect URL rather than the final page.',
    confidence: 'observed',
    source:
      'No official number published. Crawler behaves like a standard HTTP client (~5).',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    bot: 'LinkedInBot',
    maxRedirects: 5,
    followsRedirects: true,
    caching: 'moderate',
    cacheDetail:
      'The Post Inspector renders a "URL redirect trail". Long or looping ' +
      'chains throw "We encountered a server error". Re-run the Post ' +
      'Inspector to refresh a stale preview.',
    confidence: 'observed',
    source:
      'No official number published. ~5 hops observed before server errors; recommended chains are 1–2 hops.',
  },
  {
    id: 'imessage',
    name: 'iMessage / Apple',
    bot: 'AppleBot',
    maxRedirects: 10,
    followsRedirects: true,
    caching: 'moderate',
    cacheDetail:
      'AppleBot generates the Messages/iMessage rich preview. Follows ' +
      'redirects more liberally than most crawlers, but the limit is not ' +
      'officially documented.',
    confidence: 'low',
    source: 'Apple does not document a redirect limit for AppleBot.',
  },
  {
    id: 'slack',
    name: 'Slack',
    bot: 'Slackbot (unfurler)',
    maxRedirects: 20,
    followsRedirects: true,
    caching: 'moderate',
    cacheDetail:
      'Unfurls are cached per-channel. The underlying fetcher is ' +
      'libcurl-based, so it inherits the 20-redirect default — the most ' +
      'forgiving of the major platforms.',
    confidence: 'observed',
    source:
      'libcurl CURLOPT_MAXREDIRS default (20). No Slack-published override is documented.',
  },
  {
    id: 'discord',
    name: 'Discord',
    bot: 'Discordbot',
    maxRedirects: 10,
    followsRedirects: true,
    caching: 'moderate',
    cacheDetail:
      'Caches embeds per-message. Follows redirects; no officially ' +
      'documented limit — behaves like a standard HTTP client.',
    confidence: 'low',
    source: 'No official number published.',
  },
];

/**
 * Caching semantics by HTTP redirect status code (RFC 9111 + observed platform
 * behavior). Drives the "301 vs 302 caching" warnings.
 * @typedef {Object} RedirectCachingInfo
 * @property {string} label      - human label
 * @property {boolean} cacheable - whether the redirect is cacheable per spec
 * @property {string} detail     - practical impact on social previews
 */
const REDIRECT_CACHING = {
  301: {
    label: 'Permanent',
    cacheable: true,
    detail:
      'Cached aggressively by browsers and crawlers. The destination is ' +
      'remembered and re-used on later visits — great for moved pages, but ' +
      'later changes to the target propagate slowly. Force a re-scrape on ' +
      'each platform after editing a 301.',
  },
  302: {
    label: 'Temporary',
    cacheable: false,
    detail:
      'Not cached by default — clients re-check the original URL each visit. ' +
      'BUT some social crawlers cache the redirect URL itself instead of ' +
      'following through to the final page, so the preview can pin to an ' +
      'intermediate hop. Prefer 301 for canonical moves.',
  },
  303: {
    label: 'See Other',
    cacheable: false,
    detail:
      'Redirects a POST to a GET. Rarely cached; not relevant to link previews.',
  },
  307: {
    label: 'Temporary (method-preserving)',
    cacheable: false,
    detail: 'Like 302 but preserves the request method. Rarely cached.',
  },
  308: {
    label: 'Permanent (method-preserving)',
    cacheable: true,
    detail: 'Like 301 but preserves the request method. Cached as permanent.',
  },
};

// Browser: expose as window.PLATFORM_REDIRECT_DATA so the renderer module (and
// app.js) can read it without relying on top-level `const` global visibility.
// Node: module.exports for unit tests.
if (typeof window !== 'undefined') {
  window.PLATFORM_REDIRECT_DATA = {
    PLATFORMS,
    REDIRECT_CACHING,
    HTTP_CLIENT_DEFAULT,
    CURL_DEFAULT,
    COMMON_GIVEUP_LIMIT,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PLATFORMS,
    REDIRECT_CACHING,
    HTTP_CLIENT_DEFAULT,
    CURL_DEFAULT,
    COMMON_GIVEUP_LIMIT,
  };
}

})();
