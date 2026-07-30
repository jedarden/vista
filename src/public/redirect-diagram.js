'use strict';

// =============================================================================
// VISTA Redirect Chain Diagram
//
// Pure renderer for the visual redirect-chain diagram shown in the Redirects
// tab. Builds an HTML string from a redirectChain array (as captured by the
// fetcher) — no DOM access, no side effects — so it is unit-testable in Node
// exactly like scoring-simulator.js.
//
// Hop shape (from src/fetcher.js):
//   { url, statusCode, headers, redirectsTo?, isFinal?, html?, meta?,
//     metaDiff?, metaError?, warning? }
//
// metaDiff shape (from src/fetcher.js calculateMetaDiff):
//   { changed: [{field, from, to}], added: [{field, value}],
//     removed: [{field, value}], hasImageChange?, stripped?, noindexRemoved? }
//
// Diagram features:
//   - Numbered hop badges (1, 2, 3, ...) with a "Final" tag on the last hop
//   - Down-arrow connectors between hops
//   - Color-coded HTTP status badges (301=blue, 302=yellow, 307=teal, ...)
//   - Truncated URLs for long paths
//   - Meta-tag diff badges per hop: "meta tags stripped", "noindex removed",
//     and a changed/added/removed summary (bf-13re)
// =============================================================================

/**
 * HTML-escape a string for safe interpolation into innerHTML.
 * @param {string} [str]
 * @returns {string}
 */
function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Truncate a URL for compact display, preserving scheme/host and tail.
 * URLs <= 60 chars are returned unchanged.
 * @param {string} [url]
 * @returns {string}
 */
function truncateUrl(url) {
  if (!url) return '';
  if (url.length <= 60) return url;
  return url.substring(0, 30) + '...' + url.substring(url.length - 25);
}

// Per-status badge colors. Specific codes win over range fallbacks.
// 301 → blue, 302 → yellow (per spec), plus sensible colors for the rest.
const STATUS_BADGE_CLASS = {
  200: 's200',
  201: 's2xx',
  204: 's2xx',
  301: 's301',
  302: 's302',
  303: 's303',
  304: 's304',
  307: 's307',
  308: 's308',
};

/**
 * Resolve the CSS badge class for an HTTP status code.
 * Specific codes map to dedicated classes; others fall back to 2xx/3xx/4xx/5xx.
 * @param {number} sc
 * @returns {string}
 */
function statusBadgeClass(sc) {
  if (STATUS_BADGE_CLASS[sc]) return STATUS_BADGE_CLASS[sc];
  if (sc >= 200 && sc < 300) return 's2xx';
  if (sc >= 300 && sc < 400) return 's3xx';
  if (sc >= 400 && sc < 500) return 's4xx';
  if (sc >= 500) return 's5xx';
  return 'sunk';
}

/**
 * Build the meta-tag diff badges for a hop as an HTML string (empty if there
 * is no diff or nothing to flag).
 *
 * Badges, in priority order:
 *   - "meta tags stripped"  — all meaningful meta tags were lost at this hop
 *   - "noindex removed"     — a robots noindex directive disappeared (page
 *                             became indexable); a high-signal SEO change
 *   - changed/added/removed — a compact summary when individual tags differ
 *
 * @param {object} [diff] - hop.metaDiff (may be null/undefined).
 * @returns {string} HTML markup ("" when nothing to flag).
 */
function renderMetaDiffBadges(diff) {
  if (!diff) return '';

  const badges = [];

  if (diff.stripped) {
    badges.push(
      '<span class="hop-meta-badge stripped">&#9888; Meta tags stripped — all tags lost at this hop</span>'
    );
  }

  if (diff.noindexRemoved) {
    badges.push(
      '<span class="hop-meta-badge noindex">noindex removed — page became indexable</span>'
    );
  }

  const changed = (diff.changed && diff.changed.length) || 0;
  const added = (diff.added && diff.added.length) || 0;
  const removed = (diff.removed && diff.removed.length) || 0;
  const total = changed + added + removed;

  // When all tags were stripped we already surface the headline badge; the
  // field-by-field summary is redundant there. Otherwise summarize the diffs.
  if (total > 0 && !diff.stripped) {
    const parts = [];
    if (changed) parts.push(`${changed} changed`);
    if (added) parts.push(`${added} added`);
    if (removed) parts.push(`${removed} removed`);
    badges.push(
      `<span class="hop-meta-badge changed">Meta diff: ${escHtml(parts.join(', '))} at this hop</span>`
    );
  }

  if (!badges.length) return '';
  return `<div class="hop-meta-badges">${badges.join('')}</div>`;
}

/**
 * Build the visual redirect-chain diagram as an HTML string.
 *
 * @param {Array} chain - redirectChain array (may be null/empty).
 * @param {object} [opts]
 * @param {function} [opts.renderMeta] - optional (hop) => HTML string to render
 *        per-hop meta-tag detail (e.g. app.js renderHopMeta). Omit to skip.
 * @param {function} [opts.renderHopNote] - optional (hop, index, chain) => HTML
 *        string rendered inline on a hop, used to surface platform-behavior
 *        callouts (e.g. the common give-up marker). Omit to skip.
 * @returns {string} HTML markup for the diagram (without the section heading).
 */
function buildRedirectChainDiagram(chain, opts) {
  opts = opts || {};
  const renderMeta = opts.renderMeta || null;
  const renderHopNote = opts.renderHopNote || null;

  if (!chain || chain.length === 0) {
    return '<p class="redirect-empty">No redirects — direct response.</p>';
  }

  let html = '<div class="redirect-chain">';

  chain.forEach((hop, i) => {
    const isLast = i === chain.length - 1;
    const isFinal = !!hop.isFinal;
    const sc = hop.statusCode || 0;
    const badgeCls = statusBadgeClass(sc);

    // Numbered badge for every hop (1-based); final hop is tagged "Final".
    const numberLabel = String(i + 1);

    html += `<div class="redirect-hop" data-hop-index="${i}" data-status="${sc}">`;

    // Connector column: numbered badge + arrow to next hop.
    html += '<div class="hop-connector">';
    html += `<div class="hop-number${isFinal ? ' final' : ''}" title="Hop ${numberLabel}${isFinal ? ' (final)' : ''}">${numberLabel}</div>`;
    html += isLast ? '' : '<div class="hop-arrow" aria-hidden="true">&#8595;</div>';
    html += '</div>';

    // Info column: status badge + URL, optional final tag, redirect target, meta.
    html += '<div class="hop-info">';
    html += '<div class="hop-url">';
    html += `<span class="hop-status ${badgeCls}" title="HTTP ${sc || 'unknown'}">${sc || '—'}</span>`;
    if (isFinal) html += '<span class="hop-final-tag">Final</span>';
    html += escHtml(truncateUrl(hop.url));
    html += '</div>';

    if (hop.warning) {
      html += `<div class="hop-warning">&#9888; ${escHtml(hop.warning)}</div>`;
    }

    // Optional inline platform-behavior callout for this hop (e.g. the common
    // give-up marker). Supplied by app.js via renderHopGiveupNote.
    if (renderHopNote) {
      const noteHtml = renderHopNote(hop, i, chain);
      if (noteHtml) html += noteHtml;
    }

    // Meta-tag diff badges (stripped / noindex removed / changed summary).
    const diffBadges = renderMetaDiffBadges(hop.metaDiff);
    if (diffBadges) html += diffBadges;

    if (hop.redirectsTo) {
      html += `<div class="hop-redirect"><span class="hop-arrow-inline" aria-hidden="true">&#8594;</span> ${escHtml(truncateUrl(hop.redirectsTo))}</div>`;
    }
    if (renderMeta) {
      const metaHtml = renderMeta(hop);
      if (metaHtml) html += metaHtml;
    }
    if (hop.metaError) {
      html += `<div class="hop-meta-error">Meta tags unavailable: ${escHtml(hop.metaError)}</div>`;
    }

    html += '</div>'; // .hop-info
    html += '</div>'; // .redirect-hop
  });

  html += '</div>'; // .redirect-chain
  return html;
}

// Export for both Node (unit tests) and browser (app.js) consumption.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildRedirectChainDiagram,
    renderMetaDiffBadges,
    statusBadgeClass,
    truncateUrl,
    escHtml,
    STATUS_BADGE_CLASS,
  };
}
