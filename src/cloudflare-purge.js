'use strict';

/**
 * Cloudflare edge-cache purge support for POST /api/purge (plan.md ADR-001).
 *
 * VISTA's /api/* responses are cached at the Cloudflare edge keyed on the
 * full request URL — e.g. https://vista.jedarden.com/api/badge.svg?url=<target>&style=flat
 * — so "purge this target URL" means enumerating the vista API URLs built
 * from that target and asking Cloudflare to drop exactly those
 * (purge_cache `files`, exact-URL match).
 *
 * Purged variants: /api/badge.svg in every style plus the bare (style-less)
 * form — the README badge embed is the feature "refresh my badge" exists
 * for and carries the longest TTL (1h), and the .svg path is the one
 * Cloudflare's default extension-based cache actually holds (the
 * extension-less /api/badge alias reports cf-cache-status: DYNAMIC unless a
 * zone Cache Rule is added — see plan.md ADR-001). The legacy /api/badge
 * forms are purged too, so they are covered if that rule ever lands.
 * /api/preview (5min) is included; /api/screenshot (platform × theme ×
 * scale × format combinations) and /api/compare (two-URL cache key) are
 * deliberately not enumerated: both carry 5-minute TTLs and self-heal
 * faster than a purge round-trip.
 *
 * Configuration, all optional — when anything is unset the caller reports a
 * skip, mirroring the FACEBOOK_APP_TOKEN pattern in the purge handler:
 *   CLOUDFLARE_API_TOKEN   token with Zone > Cache Purge > Purge on the zone
 *                          (add Zone > Zone > Read if resolving by name)
 *   CLOUDFLARE_ZONE_ID     zone id — preferred, avoids the lookup call
 *   CLOUDFLARE_ZONE_NAME   e.g. "jedarden.com", resolved via the API when
 *                          CLOUDFLARE_ZONE_ID is absent
 *   PUBLIC_BASE_URL        base of the purge URLs, e.g. "https://vista.jedarden.com"
 */

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';
const REQUEST_TIMEOUT_MS = 10000;

// Mirrors the style validation list in the /api/badge handler.
const BADGE_STYLES = ['flat', 'flat-square', 'plastic', 'for-the-badge'];

/**
 * Build the vista API URLs whose edge-cache entries cover a target URL.
 *
 * @param {string} targetUrl - the inspected/scored URL (cache-key parameter)
 * @param {string} baseUrl - this deployment's public base URL
 * @returns {string[]} purge URLs (empty if either argument is unusable)
 */
function buildPurgeUrls(targetUrl, baseUrl) {
  if (!targetUrl || !baseUrl) return [];
  const base = String(baseUrl).replace(/\/+$/, '');
  const target = encodeURIComponent(targetUrl);
  const urls = [
    `${base}/api/badge.svg?url=${target}`,
    ...BADGE_STYLES.map((style) => `${base}/api/badge.svg?url=${target}&style=${style}`),
    `${base}/api/badge?url=${target}`,
    ...BADGE_STYLES.map((style) => `${base}/api/badge?url=${target}&style=${style}`),
    `${base}/api/preview?url=${target}`,
  ];
  return urls;
}

/**
 * Resolve the Cloudflare zone id from an explicit id or a zone name.
 *
 * @returns {Promise<string|null>} zone id, or null when the configuration is
 *   absent/ambiguous (caller treats null as a skip, not a failure)
 */
async function resolveZoneId({ zoneId, zoneName, apiToken, fetchImpl = fetch }) {
  if (zoneId) return zoneId;
  if (!zoneName || !apiToken) return null;

  const response = await fetchImpl(
    `${CF_API_BASE}/zones?name=${encodeURIComponent(zoneName)}`,
    {
      headers: { Authorization: `Bearer ${apiToken}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );
  if (!response.ok) {
    throw new Error(`zone lookup returned HTTP ${response.status}`);
  }
  const data = await response.json();
  const zone = Array.isArray(data.result) ? data.result[0] : null;
  return zone && zone.id ? zone.id : null;
}

/**
 * Purge the Cloudflare edge-cache entries for a target URL.
 *
 * @returns {Promise<{status: 'purged'|'skipped'|'failed', detail: string, urls: string[]}>}
 *   purged  — Cloudflare accepted the purge for the derived URLs
 *   skipped — not configured (missing token / base URL / zone); nothing attempted
 *   failed  — configured and attempted, but Cloudflare errored
 */
async function purgeCloudflareEdge(
  targetUrl,
  { apiToken, zoneId, zoneName, baseUrl, fetchImpl = fetch } = {}
) {
  const urls = buildPurgeUrls(targetUrl, baseUrl);

  if (!apiToken) {
    return { status: 'skipped', detail: 'no server token configured', urls };
  }
  if (urls.length === 0) {
    return { status: 'skipped', detail: 'no PUBLIC_BASE_URL configured', urls };
  }

  let resolvedZoneId;
  try {
    resolvedZoneId = await resolveZoneId({ zoneId, zoneName, apiToken, fetchImpl });
  } catch (err) {
    return { status: 'failed', detail: `zone lookup failed: ${err.message}`, urls };
  }
  if (!resolvedZoneId) {
    return { status: 'skipped', detail: 'zone not configured or not found', urls };
  }

  try {
    const response = await fetchImpl(
      `${CF_API_BASE}/zones/${resolvedZoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: urls }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.success) {
      return { status: 'purged', detail: `${urls.length} URL(s) purged at edge`, urls };
    }
    const cfError = data.errors && data.errors[0] ? data.errors[0].message : '';
    const detail = cfError || `HTTP ${response.status}`;
    return { status: 'failed', detail, urls };
  } catch (err) {
    return { status: 'failed', detail: err.message, urls };
  }
}

module.exports = { buildPurgeUrls, resolveZoneId, purgeCloudflareEdge, BADGE_STYLES };
