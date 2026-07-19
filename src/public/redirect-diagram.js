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
// Diagram features:
//   - Numbered hop badges (1, 2, 3, ...) with a "Final" tag on the last hop
//   - Down-arrow connectors between hops
//   - Color-coded HTTP status badges (301=blue, 302=yellow, 307=teal, ...)
//   - Truncated URLs for long paths
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
 * Build the visual redirect-chain diagram as an HTML string.
 *
 * @param {Array} chain - redirectChain array (may be null/empty).
 * @param {object} [opts]
 * @param {function} [opts.renderMeta] - optional (hop) => HTML string to render
 *        per-hop meta-tag detail (e.g. app.js renderHopMeta). Omit to skip.
 * @returns {string} HTML markup for the diagram (without the section heading).
 */
function buildRedirectChainDiagram(chain, opts) {
  opts = opts || {};
  const renderMeta = opts.renderMeta || null;

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
    statusBadgeClass,
    truncateUrl,
    escHtml,
    STATUS_BADGE_CLASS,
  };
}
