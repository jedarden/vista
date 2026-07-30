'use strict';

// =============================================================================
// VISTA Platform Redirect View (bf-4kts)
//
// Pure renderer that turns a captured redirectChain into platform-behavior
// warnings and a "Platform view" section showing what each social crawler
// (Facebook, X/Twitter, LinkedIn, iMessage, Slack, Discord) would actually see.
//
// It is a peer of redirect-diagram.js: a pure (chain, opts) => HTML-string
// module with no DOM access, so it is unit-testable in Node exactly like
// scoring-simulator.js and redirect-diagram.js.
//
// ## Redirect-count model (read this before editing the math)
// A chain of N hops (indices 0..N-1) contains `redirectCount = N - 1` redirect
// responses. A platform that follows at most `maxRedirects` and injects
// `extraRedirects` front hops (e.g. Twitter's t.co wrapper) reaches hop `i`
// once it has followed `i + extraRedirects` redirects. So:
//
//   landingIndex   = clamp(N-1, 0, maxRedirects - extraRedirects)
//   reachedFinal   = landingIndex === N - 1
//   effectiveCount = redirectCount + extraRedirects   (redirects followed to
//                                                    reach the FINAL hop)
//   atLimit        = reachedFinal && effectiveCount === maxRedirects
//
// When `effectiveCount > maxRedirects` the platform gives up at `landingIndex`
// — short of the final page — and locks its preview onto that intermediate hop.
// =============================================================================

// Wrap the module body in an IIFE so its top-level `const`s (PLATFORMS,
// REDIRECT_CACHING, COMMON_GIVEUP_LIMIT) are scoped here rather than the global
// lexical environment. platform-redirect-data.js and scoring-simulator.js also
// declare top-level `const PLATFORMS`; without this IIFE the browser throws
// "SyntaxError: Identifier 'PLATFORMS' has already been declared" when this
// script loads, leaving the renderer functions app.js calls undefined.
(function () {
// Resolve the shared platform/caching data in both browser and Node.
let DATA;
if (typeof window !== 'undefined' && window.PLATFORM_REDIRECT_DATA) {
  DATA = window.PLATFORM_REDIRECT_DATA;
} else if (typeof require === 'function') {
  DATA = require('./platform-redirect-data');
}

const PLATFORMS = (DATA && DATA.PLATFORMS) || [];
const REDIRECT_CACHING = (DATA && DATA.REDIRECT_CACHING) || {};
const COMMON_GIVEUP_LIMIT = (DATA && DATA.COMMON_GIVEUP_LIMIT) || 5;

// Fields that contribute to a meaningful link preview. Mirrors the field list
// in app.js renderHopMeta() so "tagCount" reflects what a crawler would render.
const PREVIEW_FIELDS = [
  'title',
  'description',
  'ogTitle',
  'ogDescription',
  'ogImage',
  'ogType',
  'ogUrl',
  'twitterCard',
  'twitterTitle',
  'twitterDescription',
  'twitterImage',
];

// ---------------------------------------------------------------------------
// Small pure helpers (module-local; redirect-diagram.js keeps its own copies
// so neither module depends on the other for primitives).
// ---------------------------------------------------------------------------

/** HTML-escape a string for safe interpolation into innerHTML. */
function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Truncate to `max` chars with an ellipsis; returns '' for empty input. */
function truncateValue(str, max) {
  if (!str) return '';
  const s = String(str);
  const limit = max || 50;
  return s.length <= limit ? s : s.substring(0, limit - 1) + '…';
}

/** Truncate a URL preserving scheme/host head and path tail. */
function truncateUrl(url) {
  if (!url) return '';
  if (url.length <= 60) return url;
  return url.substring(0, 30) + '…' + url.substring(url.length - 25);
}

// ---------------------------------------------------------------------------
// Chain analysis
// ---------------------------------------------------------------------------

/**
 * Number of redirect responses in the chain (one less than the hop count).
 * @param {Array} chain
 * @returns {number}
 */
function chainRedirectCount(chain) {
  if (!chain || chain.length === 0) return 0;
  return chain.length - 1;
}

/**
 * Whether the chain exceeds the common platform give-up limit — i.e. a
 * standard HTTP client (5 redirects) gives up BEFORE the final hop.
 * @param {Array} chain
 * @returns {boolean}
 */
function chainExceedsCommonLimit(chain) {
  return chainRedirectCount(chain) > COMMON_GIVEUP_LIMIT;
}

/**
 * Whether the chain sits exactly at the common limit — crawlers reach the
 * final page but only just (borderline).
 * @param {Array} chain
 * @returns {boolean}
 */
function chainAtCommonLimit(chain) {
  return chainRedirectCount(chain) === COMMON_GIVEUP_LIMIT;
}

/**
 * The hop index where a standard HTTP client (maxRedirects = COMMON_GIVEUP_LIMIT,
 * no front hops) lands. Meaningful only when the chain exceeds the limit.
 * @param {Array} chain
 * @returns {number}
 */
function commonGiveupLandingIndex(chain) {
  if (!chain || chain.length === 0) return 0;
  return Math.min(chain.length - 1, COMMON_GIVEUP_LIMIT);
}

/**
 * Compute where a given platform lands in the chain.
 *
 * @param {Array} chain               - redirectChain array.
 * @param {object} platform           - a PLATFORMS entry.
 * @param {number} platform.maxRedirects
 * @param {number} [platform.extraRedirects=0]
 * @returns {{landingIndex:number, reachedFinal:boolean, atLimit:boolean,
 *            redirectCount:number, effectiveRedirectCount:number,
 *            extraRedirects:number, maxRedirects:number}}
 */
function getPlatformLanding(chain, platform) {
  const max = platform && typeof platform.maxRedirects === 'number' ? platform.maxRedirects : COMMON_GIVEUP_LIMIT;
  const extra = (platform && typeof platform.extraRedirects === 'number') ? platform.extraRedirects : 0;
  const redirectCount = chainRedirectCount(chain);

  // Largest hop index reachable within `max` total redirects.
  const reachable = max - extra;
  const last = chain && chain.length > 0 ? chain.length - 1 : 0;
  const landingIndex = Math.max(0, Math.min(last, reachable));

  const reachedFinal = landingIndex === last;
  const effectiveRedirectCount = redirectCount + extra;
  const atLimit = reachedFinal && effectiveRedirectCount === max;

  return {
    landingIndex,
    reachedFinal,
    atLimit,
    redirectCount,
    effectiveRedirectCount,
    extraRedirects: extra,
    maxRedirects: max,
  };
}

/**
 * Collect the distinct 3xx redirect status codes used in the chain, in order
 * of first appearance. Excludes 304 (Not Modified) and 300 (Multiple Choices)
 * which are not redirects crawlers follow for previews.
 * @param {Array} chain
 * @returns {number[]}
 */
function distinctRedirectStatuses(chain) {
  if (!chain) return [];
  const out = [];
  const seen = Object.create(null);
  for (const hop of chain) {
    const sc = hop && hop.statusCode;
    if (typeof sc !== 'number') continue;
    if (sc === 304 || sc === 300) continue;
    if (sc < 300 || sc >= 400) continue;
    if (!seen[sc]) {
      seen[sc] = true;
      out.push(sc);
    }
  }
  return out;
}

/**
 * Summarize the previewable meta a crawler would lock onto at a hop.
 * @param {object} [meta] - hop.meta (may be null/undefined on bare redirects).
 * @returns {{title:string, hasOgImage:boolean, hasTwitterImage:boolean,
 *            tagCount:number}|null}  null when there is no previewable meta.
 */
function summarizeHopMeta(meta) {
  if (!meta) return null;
  let tagCount = 0;
  for (const k of PREVIEW_FIELDS) {
    if (meta[k]) tagCount++;
  }
  if (tagCount === 0) return null;
  return {
    title: meta.title || meta.ogTitle || '',
    hasOgImage: !!meta.ogImage,
    hasTwitterImage: !!meta.twitterImage,
    tagCount,
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * Render the platform-behavior banner: hop-count warning (when the chain
 * meets/exceeds the common limit) + 301-vs-302 caching notes (whenever there
 * are redirects). Returns '' for chains with no redirects.
 *
 * @param {Array} chain
 * @returns {string} HTML markup (without a heading).
 */
function renderPlatformRedirectBanner(chain) {
  const redirectCount = chainRedirectCount(chain);
  if (redirectCount < 1) return '';

  const rows = [];

  // --- Hop-count warning (only when at/exceeding the common limit) ---
  if (chainExceedsCommonLimit(chain)) {
    rows.push(
      '<div class="platform-banner-row warn">' +
        '<span class="pb-icon" aria-hidden="true">⬢</span> ' +
        `<span><strong>${redirectCount} redirects</strong> — exceeds the common ` +
        `${COMMON_GIVEUP_LIMIT}-redirect limit. Most social crawlers ` +
        '(Facebook, X, LinkedIn) give up before your final page and lock their ' +
        'preview onto an intermediate hop.</span>' +
        '</div>'
    );
  } else if (chainAtCommonLimit(chain)) {
    rows.push(
      '<div class="platform-banner-row caution">' +
        '<span class="pb-icon" aria-hidden="true">⬢</span> ' +
        `<span><strong>${redirectCount} redirects</strong> — right at the common ` +
        `${COMMON_GIVEUP_LIMIT}-redirect limit. Most crawlers reach the final ` +
        'page, but only just; any extra hop (e.g. X\'s t.co wrapper) tips them over.</span>' +
        '</div>'
    );
  }

  // --- 301 vs 302 caching notes (for each distinct redirect code present) ---
  const codes = distinctRedirectStatuses(chain);
  if (codes.length > 0) {
    const chips = codes
      .map((sc) => {
        const info = REDIRECT_CACHING[sc];
        if (!info) return '';
        // Reuse the diagram's status-badge classes so the code chip's color
        // matches the hop badge for the same status.
        const cls = `hop-status s${sc}`;
        return (
          `<span class="pb-caching-chip"><span class="${cls}">${sc} ${escHtml(info.label)}</span>` +
          ` <span class="pb-caching-detail">${escHtml(info.detail)}</span></span>`
        );
      })
      .join('');
    if (chips) {
      rows.push(
        '<div class="platform-banner-row caching">' +
          '<span class="pb-label">Redirect caching:</span> ' +
          chips +
          '</div>'
      );
    }
  }

  if (rows.length === 0) return '';

  return (
    '<div class="platform-banner">' +
    '<div class="platform-banner-title">⚠ Platform redirect behavior</div>' +
    rows.join('') +
    '</div>'
  );
}

/**
 * Render a single line describing the meta a platform would see at its landing
 * hop, or a muted "no preview" note when the hop has no previewable meta.
 * @param {Array} chain
 * @param {number} landingIndex
 * @returns {string}
 */
function renderLandingMetaSummary(chain, landingIndex) {
  const hop = chain && chain[landingIndex];
  const summary = hop ? summarizeHopMeta(hop.meta) : null;
  if (!summary) {
    return (
      '<div class="pvc-meta muted">No previewable meta tags at this hop — the ' +
      'crawler renders an empty or bare-redirect preview.</div>'
    );
  }
  const parts = [];
  if (summary.title) {
    parts.push(`&ldquo;${escHtml(truncateValue(summary.title, 50))}&rdquo;`);
  }
  parts.push(`og:image ${summary.hasOgImage ? '✓' : '✗'}`);
  if (summary.hasTwitterImage) parts.push('twitter:image ✓');
  parts.push(`${summary.tagCount} ${summary.tagCount === 1 ? 'tag' : 'tags'}`);
  return `<div class="pvc-meta">Sees: ${parts.join(' · ')}</div>`;
}

/**
 * Render the "Platform view" section: one card per documented platform showing
 * the hop it lands on, whether it reaches the final page, and the meta it would
 * lock onto. Returns '' when there are no redirects (the section adds no value
 * for a direct response).
 *
 * @param {Array} chain
 * @returns {string} HTML markup including the section heading.
 */
function renderPlatformView(chain) {
  const redirectCount = chainRedirectCount(chain);
  if (redirectCount < 1) return '';

  const total = chain.length;

  const cards = PLATFORMS.map((p) => {
    const landing = getPlatformLanding(chain, p);
    const hopNum = landing.landingIndex + 1;
    const landingHop = chain[landing.landingIndex];
    const landingUrl = landingHop ? landingHop.url : '';

    let statusClass;
    let statusLabel;
    if (landing.atLimit) {
      statusClass = 'atlimit';
      statusLabel = 'At the limit';
    } else if (landing.reachedFinal) {
      statusClass = 'reaches';
      statusLabel = 'Reaches final';
    } else {
      statusClass = 'givesup';
      statusLabel = 'Gives up';
    }

    // Landing line: hop number, "of total", and whether it's the final hop.
    const isFinalHop = landing.landingIndex === total - 1;
    const landingDesc = isFinalHop
      ? `hop ${hopNum} (final page)`
      : `hop ${hopNum} of ${total} — stops short of the final page`;

    // Effective redirect note: mention injected front hops when relevant.
    let followLine = `Follows up to <strong>${p.maxRedirects}</strong> redirects`;
    if (landing.extraRedirects > 0) {
      followLine += ` (plus ${landing.extraRedirects} from this platform's URL wrapper)`;
    }

    return (
      `<div class="platform-view-card ${statusClass}">` +
      '<div class="pvc-head">' +
      `<span class="pvc-name">${escHtml(p.name)}</span>` +
      `<span class="pvc-status ${statusClass}">${statusLabel}</span>` +
      '</div>' +
      `<div class="pvc-follow">${followLine} ` +
      `<span class="pvc-confidence ${escHtml(p.confidence)}" title="${escHtml(p.source)}">${escHtml(p.confidence)}</span></div>` +
      `<div class="pvc-landing">Lands on ${landingDesc}` +
      (landingUrl ? ` — <code>${escHtml(truncateUrl(landingUrl))}</code>` : '') +
      '</div>' +
      renderLandingMetaSummary(chain, landing.landingIndex) +
      `<div class="pvc-cache">${escHtml(p.cacheDetail)}</div>` +
      `<div class="pvc-bot">Crawler: <code>${escHtml(p.bot)}</code></div>` +
      '</div>'
    );
  }).join('');

  return (
    '<h2 class="section-heading">Platform view — what each crawler sees</h2>' +
    '<p class="platform-view-intro">Each social crawler follows redirects up to ' +
    `its own limit. With <strong>${redirectCount} redirect${redirectCount === 1 ? '' : 's'}</strong> ` +
    'in this chain, here is where each one stops and which meta tags it would ' +
    'lock its preview onto.</p>' +
    `<div class="platform-view-grid">${cards}</div>`
  );
}

/**
 * Render the in-diagram give-up marker for a hop. Returns '' unless this is the
 * hop where a standard HTTP client (COMMON_GIVEUP_LIMIT) stops AND the chain
 * actually exceeds that limit — otherwise the marker would be misleading.
 *
 * Passed to buildRedirectChainDiagram() as opts.renderHopNote so the warning is
 * integrated directly into the chain diagram (acceptance criterion).
 *
 * @param {object} _hop   - the hop (unused; signature matches the diagram callback).
 * @param {number} i      - hop index.
 * @param {Array} chain   - the full chain.
 * @returns {string} HTML markup, or '' when no marker applies.
 */
function renderHopGiveupNote(_hop, i, chain) {
  if (!chain || chain.length === 0) return '';
  if (!chainExceedsCommonLimit(chain)) return '';
  if (i !== commonGiveupLandingIndex(chain)) return '';

  const total = chain.length;
  return (
    '<div class="hop-giveup-note">' +
    '<span class="hop-giveup-icon" aria-hidden="true">⬢</span> ' +
    '<span><strong>Common platform give-up point</strong> — crawlers that follow ' +
    `~${COMMON_GIVEUP_LIMIT} redirects (Facebook, X, LinkedIn) stop here at ` +
    `hop ${i + 1} of ${total} and never reach your final page.</span>` +
    '</div>'
  );
}

// Expose the renderer functions to app.js in the browser. app.js calls them as
// bare globals (renderPlatformRedirectBanner(chain), …) which resolve to
// window.* properties — so attach them explicitly here.
if (typeof window !== 'undefined') {
  window.renderPlatformRedirectBanner = renderPlatformRedirectBanner;
  window.renderPlatformView = renderPlatformView;
  window.renderHopGiveupNote = renderHopGiveupNote;
}

// Export for Node unit tests.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // analysis
    chainRedirectCount,
    chainExceedsCommonLimit,
    chainAtCommonLimit,
    commonGiveupLandingIndex,
    getPlatformLanding,
    distinctRedirectStatuses,
    summarizeHopMeta,
    // rendering
    renderPlatformRedirectBanner,
    renderPlatformView,
    renderHopGiveupNote,
    renderLandingMetaSummary,
    // constants re-exported for tests
    COMMON_GIVEUP_LIMIT,
    // primitives
    escHtml,
    truncateValue,
    truncateUrl,
  };
}

})();
