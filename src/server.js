'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const { fetchUrl, parseMetaTags, probeImage } = require('./fetcher');
const { validateUrlOrThrow } = require('./ssrf-guard');
const { detectMistakes } = require('./diagnostics');
const { scoreAll, PLATFORMS } = require('./scorer');
const { generateScreenshot, isValidPlatform } = require('./screenshot');
const { checkRateLimit } = require('./rate-limit');
const { analyzeResponseHeaders } = require('./header-analyzer');
const cheerio = require('cheerio');
const { ZipArchive } = require('archiver');
const { generateSnippet, getSupportedFormats } = require('./snippet-gen');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory cache for badge URL results (1 hour TTL)
const badgeCache = new Map();
const BADGE_CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Check if an error is an SSRF-related error
 * SSRF errors should return 400, not 502
 */
function isSsrfError(err) {
  const msg = err.message || '';
  return msg.includes('SSRF protection') ||
         msg.includes('private/internal address') ||
         msg.includes('loopback address') ||
         msg.includes('link-local address') ||
         msg.includes('localhost') ||
         msg.includes('not allowed') ||
         msg.includes('protocol') && msg.includes('not supported');
}

/**
 * Handle fetch errors and return appropriate response
 */
function handleFetchError(res, err, context = 'Failed to fetch URL') {
  console.error('Fetch error:', err.message);
  if (isSsrfError(err)) {
    res.status(400).json({ error: err.message });
  } else {
    res.status(502).json({ error: `${context}: ${err.message}` });
  }
}

app.use(express.json({ limit: '5mb' }));
app.use(express.text({ type: 'text/html', limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CORS for development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// --- Rate-limit policy (per docs/plan.md "Security": in-memory token bucket,
// resets on restart). Each namespace below is an independent per-IP/hour bucket
// (see src/rate-limit.js), so a tight limit on a costly endpoint does not
// consume the budget of a cheaper one.
//
//   preview    30/hr  GET/POST /api/preview{,/meta,/headers,/images},
//                     GET /api/compare, GET /api/badge (url mode).
//                     One request triggers 1-2 downstream page fetches — the
//                     same cost class as a screenshot, so it reuses the 30/hr
//                     budget the screenshot endpoints already had.
//   screenshot 30/hr  GET /api/screenshot, GET /api/screenshots, POST /api/screenshot.
//                     Existing limit, kept as-is; migrated to an explicit
//                     namespace so the policy reads uniformly.
//   sitemap     5/hr  GET /api/sitemap. A single request fans out to up to 100
//                     downstream page fetches (5 at a time), so it is roughly
//                     20x costlier per request than one preview. 5/hr (vs 30)
//                     still allows legitimate audits while preventing a single
//                     client from launching unbounded 100-URL crawls. Each
//                     crawl counts as ONE token regardless of URL count, to
//                     avoid double-penalizing a legitimate large-site audit.
const RATE_LIMIT_PREVIEW = 30;
const RATE_LIMIT_SCREENSHOT = 30;
const RATE_LIMIT_SITEMAP = 5;

/**
 * Enforce per-IP rate limiting for a request.
 *
 * On limit breach, sends HTTP 429 with the same { error, message, retryAfter }
 * shape used by the screenshot endpoints (for consistency) and returns true;
 * the caller should `return` immediately. When the request is allowed, returns
 * false and the caller proceeds.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {number} limit     Max requests/hour for this namespace.
 * @param {string} namespace Bucket group (see constants above).
 * @returns {boolean} true if the request was rejected (429 already sent).
 */
function rateLimited(req, res, limit, namespace) {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const check = checkRateLimit(clientIp, limit, namespace);
  if (!check.allowed) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: 3600,
    });
    return true;
  }
  return false;
}

/**
 * GET /api/preview?url=https://...
 * POST /api/preview with Content-Type: text/html body (and optional ?base=https://...)
 */
app.get('/api/preview', async (req, res) => {
  if (rateLimited(req, res, RATE_LIMIT_PREVIEW, 'preview')) return;
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only http and https URLs are supported' });
    }
  } catch (_) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const { html, redirectChain, finalUrl, responseHeaders, statusCode } =
      await fetchUrl(url);

    const result = await buildPreviewResult({
      html,
      baseUrl: finalUrl,
      redirectChain,
      responseHeaders,
      statusCode,
      sourceUrl: url,
    });

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json(result);
  } catch (err) {
    return handleFetchError(res, err, 'Failed to fetch URL');
  }
});

app.post('/api/preview', async (req, res) => {
  if (rateLimited(req, res, RATE_LIMIT_PREVIEW, 'preview')) return;
  const baseUrl = req.query.base || 'https://example.com';
  let html;

  if (typeof req.body === 'string') {
    html = req.body;
  } else if (req.body && req.body.html) {
    html = req.body.html;
  } else {
    return res.status(400).json({ error: 'POST body must be HTML text or JSON { html: "..." }' });
  }

  try {
    const result = await buildPreviewResult({
      html,
      baseUrl,
      redirectChain: [],
      responseHeaders: {},
      statusCode: 200,
      sourceUrl: baseUrl,
    });
    res.json(result);
  } catch (err) {
    console.error('Parse error:', err.message);
    res.status(500).json({ error: `Failed to parse HTML: ${err.message}` });
  }
});

/**
 * GET /api/platforms — return the list of supported platforms
 */
app.get('/api/platforms', (req, res) => {
  const { SKELETON_TYPES, PLATFORM_SKELETON_MAP } = require('./skeleton-types');
  res.json({
    platforms: PLATFORMS,
    skeletonTypes: SKELETON_TYPES,
    platformSkeletonMap: PLATFORM_SKELETON_MAP
  });
});

/**
 * GET /api/preview/meta?url=https://...
 * POST /api/preview/meta with Content-Type: text/html body (and optional ?base=https://...)
 * Fast endpoint that returns text-based data without image probing.
 * Returns: score, meta tags, text-based card previews.
 */
app.get('/api/preview/meta', async (req, res) => {
  if (rateLimited(req, res, RATE_LIMIT_PREVIEW, 'preview')) return;
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only http and https URLs are supported' });
    }
  } catch (_) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const { html, redirectChain, finalUrl, responseHeaders, statusCode } =
      await fetchUrl(url);

    const result = await buildMetaPreviewResult({
      html,
      baseUrl: finalUrl,
      redirectChain,
      responseHeaders,
      statusCode,
      sourceUrl: url,
    });

    res.json(result);
  } catch (err) {
    return handleFetchError(res, err, 'Failed to fetch URL');
  }
});

app.post('/api/preview/meta', async (req, res) => {
  if (rateLimited(req, res, RATE_LIMIT_PREVIEW, 'preview')) return;
  const baseUrl = req.query.base || 'https://example.com';
  let html;

  if (typeof req.body === 'string') {
    html = req.body;
  } else if (req.body && req.body.html) {
    html = req.body.html;
  } else {
    return res.status(400).json({ error: 'POST body must be HTML text or JSON { html: "..." }' });
  }

  try {
    const result = await buildMetaPreviewResult({
      html,
      baseUrl,
      redirectChain: [],
      responseHeaders: {},
      statusCode: 200,
      sourceUrl: baseUrl,
    });
    res.json(result);
  } catch (err) {
    console.error('Parse error:', err.message);
    res.status(500).json({ error: `Failed to parse HTML: ${err.message}` });
  }
});

/**
 * GET /api/preview/headers?url=https://...
 * POST /api/preview/headers with Content-Type: text/html body (and optional ?base=https://...)
 * HTTP header analysis endpoint that returns comprehensive header diagnostics.
 * Fast operation that analyzes security headers, CORS headers, server info, and performance headers.
 * Runs independently and can be called in parallel with image probe.
 */
app.get('/api/preview/headers', async (req, res) => {
  if (rateLimited(req, res, RATE_LIMIT_PREVIEW, 'preview')) return;
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only http and https URLs are supported' });
    }
  } catch (_) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const { html, redirectChain, finalUrl, responseHeaders, statusCode } =
      await fetchUrl(url);

    const result = await buildHeadersPreviewResult({
      html,
      baseUrl: finalUrl,
      redirectChain,
      responseHeaders,
      statusCode,
      sourceUrl: url,
    });

    res.json(result);
  } catch (err) {
    return handleFetchError(res, err, 'Failed to fetch URL');
  }
});

app.post('/api/preview/headers', async (req, res) => {
  if (rateLimited(req, res, RATE_LIMIT_PREVIEW, 'preview')) return;
  const baseUrl = req.query.base || 'https://example.com';
  let html;

  if (typeof req.body === 'string') {
    html = req.body;
  } else if (req.body && req.body.html) {
    html = req.body.html;
  } else {
    return res.status(400).json({ error: 'POST body must be HTML text or JSON { html: "..." }' });
  }

  try {
    const result = await buildHeadersPreviewResult({
      html,
      baseUrl,
      redirectChain: [],
      responseHeaders: {},
      statusCode: 200,
      sourceUrl: baseUrl,
    });
    res.json(result);
  } catch (err) {
    console.error('Parse error:', err.message);
    res.status(500).json({ error: `Failed to parse HTML: ${err.message}` });
  }
});

/**
 * GET /api/preview/images?url=https://...
 * POST /api/preview/images with Content-Type: text/html body (and optional ?base=https://...)
 * Image probing endpoint that returns image dimensions, crop ratios, and card-specific data.
 * Slower operation (~1-3s), runs after meta loads.
 * Probes: og:image, twitter:image, favicon, and any hero.png references.
 */
app.get('/api/preview/images', async (req, res) => {
  if (rateLimited(req, res, RATE_LIMIT_PREVIEW, 'preview')) return;
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only http and https URLs are supported' });
    }
  } catch (_) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const { html, redirectChain, finalUrl, responseHeaders, statusCode } =
      await fetchUrl(url);

    const result = await buildImagePreviewResult({
      html,
      baseUrl: finalUrl,
      redirectChain,
      responseHeaders,
      statusCode,
      sourceUrl: url,
    });

    res.json(result);
  } catch (err) {
    return handleFetchError(res, err, 'Failed to fetch URL');
  }
});

app.post('/api/preview/images', async (req, res) => {
  if (rateLimited(req, res, RATE_LIMIT_PREVIEW, 'preview')) return;
  const baseUrl = req.query.base || 'https://example.com';
  let html;

  if (typeof req.body === 'string') {
    html = req.body;
  } else if (req.body && req.body.html) {
    html = req.body.html;
  } else {
    return res.status(400).json({ error: 'POST body must be HTML text or JSON { html: "..." }' });
  }

  try {
    const result = await buildImagePreviewResult({
      html,
      baseUrl,
      redirectChain: [],
      responseHeaders: {},
      statusCode: 200,
      sourceUrl: baseUrl,
    });
    res.json(result);
  } catch (err) {
    console.error('Parse error:', err.message);
    res.status(500).json({ error: `Failed to parse HTML: ${err.message}` });
  }
});

/**
 * GET /api/sitemap?url=<sitemap-or-domain>
 *
 * Accepts either a direct sitemap XML URL (e.g.
 * https://example.com/sitemap.xml) OR a bare domain/origin (e.g.
 * https://example.com). When the input is not itself valid sitemap XML, the
 * handler falls back to fetching {origin}/robots.txt and follows any
 * `Sitemap:` directive(s) it finds there (per RFC 9309), then crawls the
 * discovered sitemap. Returns all URLs with per-platform coverage scores.
 */
app.get('/api/sitemap', async (req, res) => {
  // One rate-limit token per request (NOT per crawled URL) — a single sitemap
  // audit consumes exactly one token even though it may fan out to ~100 page
  // fetches, so a legitimate large-site audit is not double-penalized. The
  // sitemap namespace gets a tighter 5/hr budget (vs 30 for preview) because
  // each request is ~20x costlier downstream. See policy block above.
  if (rateLimited(req, res, RATE_LIMIT_SITEMAP, 'sitemap')) return;
  const inputUrl = req.query.url;
  if (!inputUrl) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  // Validate URL
  try {
    const parsed = new URL(inputUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Only http and https URLs are supported' });
    }
  } catch (_) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // SSRF protection: validate the resolved IP before fetching. The protocol
  // check above only allows http/https — this rejects private/loopback/
  // link-local hosts (e.g. http://127.0.0.1/... or http://169.254.169.254/...).
  // Matches the 400 pattern used for the other validation failures above.
  try {
    await validateUrlOrThrow(inputUrl);
  } catch (ssrfErr) {
    return res.status(400).json({ error: `URL blocked by SSRF protection: ${ssrfErr.message}` });
  }

  const fetch = require('node-fetch');
  const fetchHeaders = {
    'User-Agent': 'Mozilla/5.0 (compatible; VISTA/1.0; +https://github.com/vista-tool)',
    Accept: 'application/xml,text/xml,*/*',
  };

  try {
    // The controller/timeout guards the sitemap *fetching* (resolve +
    // top-level + nested sitemap-index expansion). The per-URL crawl below
    // uses fetchUrl(), which has its own timeouts.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const fetchOpts = { method: 'GET', headers: fetchHeaders, signal: controller.signal };

    let sitemapUrl;
    let xml;
    try {
      // Resolve which sitemap to crawl. If the input URL is not itself valid
      // sitemap XML, this falls back to {origin}/robots.txt and follows any
      // Sitemap: directive. Throws a descriptive Error when no sitemap can be
      // located, which we surface as a 400.
      const resolved = await resolveSitemapUrl({
        inputUrl,
        fetchFn: fetch,
        fetchOpts,
        validateFn: validateUrlOrThrow,
      });
      sitemapUrl = resolved.sitemapUrl;
      xml = resolved.xml;
    } catch (resolveErr) {
      clearTimeout(timer);
      return res.status(400).json({ error: resolveErr.message });
    }
    clearTimeout(timer);

    // Parse sitemap
    const urls = await parseSitemap(xml, sitemapUrl);

    // If this returned sitemap index URLs (nested sitemaps), fetch them recursively
    let allUrls = urls;
    if (urls.length > 0 && urls[0].includes('sitemap')) {
      // Check if these are sitemap URLs (vs page URLs)
      const isSitemapIndex = urls.some(u => u.includes('sitemap'));
      if (isSitemapIndex) {
        // Fetch all nested sitemaps
        allUrls = [];
        for (const nestedSitemapUrl of urls.slice(0, 10)) { // Limit to 10 nested sitemaps
          try {
            // SSRF protection: skip (do not fetch) any nested sitemap whose
            // URL resolves to a private/loopback/link-local address. On
            // rejection we continue the crawl rather than aborting the whole
            // request, consistent with how this loop already tolerates
            // individual fetch failures via the surrounding try/catch.
            try {
              await validateUrlOrThrow(nestedSitemapUrl);
            } catch (ssrfErr) {
              console.error('Skipping nested sitemap blocked by SSRF protection:', nestedSitemapUrl, ssrfErr.message);
              continue;
            }
            const nestedResp = await fetch(nestedSitemapUrl, {
              method: 'GET',
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VISTA/1.0; +https://github.com/vista-tool)', Accept: 'application/xml,text/xml,*/*' },
              signal: controller.signal,
            });
            if (nestedResp.ok) {
              const nestedXml = await nestedResp.text();
              const nestedUrls = await parseSitemap(nestedXml, nestedSitemapUrl);
              allUrls.push(...nestedUrls);
            }
          } catch (e) {
            console.error('Failed to fetch nested sitemap:', nestedSitemapUrl, e.message);
          }
        }
      }
    }

    if (allUrls.length === 0) {
      return res.status(400).json({ error: 'No URLs found in sitemap' });
    }

    // Limit to first 100 URLs to prevent overwhelming the server
    const limitedUrls = allUrls.slice(0, 100);

    // Crawl each URL with concurrency limit
    const concurrency = 5;
    const results = [];
    const errors = [];

    for (let i = 0; i < limitedUrls.length; i += concurrency) {
      const batch = limitedUrls.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(
        batch.map(async (url) => {
          try {
            const { html, redirectChain, finalUrl, responseHeaders, statusCode } =
              await fetchUrl(url);

            const meta = parseMetaTags(html, finalUrl);

            // Probe image dimensions
            let imageProbe = null;
            const imageUrl = meta.og.image || meta.twitter.image;
            if (imageUrl) {
              try {
                imageProbe = await probeImage(imageUrl);
              } catch (_) {
                // non-fatal
              }
            }

            // Scoring
            const scoring = scoreAll(meta, imageProbe);

            return {
              url,
              finalUrl,
              statusCode,
              title: meta.title || meta.og.title || '',
              description: meta.description || meta.og.description || '',
              image: meta.og.image || meta.twitter.image || '',
              scores: scoring.scores,
              overallGrade: scoring.overall.grade,
              overallScore: scoring.overall.score,
              platformCount: Object.keys(scoring.scores).length,
            };
          } catch (err) {
            return {
              url,
              error: err.message,
            };
          }
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          if (result.value.error) {
            errors.push(result.value);
          } else {
            results.push(result.value);
          }
        } else {
          errors.push({ error: result.reason.message });
        }
      }
    }

    res.json({
      sitemapUrl,
      totalFound: allUrls.length,
      crawled: results.length,
      errors: errors.length,
      results,
      hasMore: allUrls.length > 100,
    });
  } catch (err) {
    console.error('Sitemap error:', err.message);
    res.status(502).json({ error: `Failed to process sitemap: ${err.message}` });
  }
});

/**
 * GET /api/screenshot — Generate PNG screenshot of a platform card
 * Query params: url, platform, theme (light|dark), scale (1x|2x), format (svg|png)
 */
app.get('/api/screenshot', async (req, res) => {
  // PNG is the primary deliverable of this endpoint (per docs/plan.md "Card
  // Screenshot API" — response is image/png via SVG→sharp). format=svg remains
  // an explicit opt-in for callers who want raw SVG. (bf-25mc)
  const { url, platform, theme = 'dark', scale = '1x', format = 'png' } = req.query;

  // Rate limiting
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const rateLimit = checkRateLimit(clientIp, RATE_LIMIT_SCREENSHOT, 'screenshot');
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many screenshot requests. Please try again later.',
      retryAfter: 3600
    });
  }

  // Validate platform
  if (!platform || !isValidPlatform(platform)) {
    return res.status(400).json({
      error: 'Invalid platform',
      message: `Platform must be one of: ${PLATFORMS.map(p => p.id).join(', ')}`
    });
  }

  // Validate theme
  if (!['light', 'dark'].includes(theme)) {
    return res.status(400).json({
      error: 'Invalid theme',
      message: 'Theme must be either "light" or "dark"'
    });
  }

  // Validate scale
  if (!['1x', '2x'].includes(scale)) {
    return res.status(400).json({
      error: 'Invalid scale',
      message: 'Scale must be either "1x" or "2x"'
    });
  }

  // Validate format
  if (!['svg', 'png'].includes(format)) {
    return res.status(400).json({
      error: 'Invalid format',
      message: 'Format must be either "svg" or "png"'
    });
  }

  // URL is required for GET endpoint
  if (!url) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  // Validate URL
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only http and https URLs are supported' });
    }
  } catch (_) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const { html, finalUrl, redirectChain, responseHeaders, statusCode } =
      await fetchUrl(url);

    const meta = parseMetaTags(html, finalUrl);

    // Probe image dimensions
    let imageProbe = null;
    const imageUrl = meta.og.image || meta.twitter.image;
    if (imageUrl) {
      try {
        imageProbe = await probeImage(imageUrl);
      } catch (_) {
        // non-fatal
      }
    }

    // Generate screenshot
    const screenshot = await generateScreenshot(
      platform,
      meta,
      imageProbe,
      finalUrl,
      { withFrame: false, format, theme, scale }
    );

    // Set response headers
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');

    if (format === 'png') {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${platform}-card.png"`);
      res.send(screenshot.buffer);
    } else {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${platform}-card.svg"`);
      res.send(screenshot.svg);
    }
  } catch (err) {
    return handleFetchError(res, err, 'Failed to generate screenshot');
  }
});

/**
 * GET /api/screenshots — Generate ZIP of PNG screenshots for multiple platforms
 * Query params: url, platforms (comma-separated), theme (light|dark), scale (1x|2x), format (svg|png)
 */
app.get('/api/screenshots', async (req, res) => {
  const { url, platforms, theme = 'dark', scale = '1x', format = 'png' } = req.query;

  // Validate platforms first (before rate limit check)
  if (!platforms) {
    return res.status(400).json({
      error: 'Missing platforms parameter',
      message: 'Provide ?platforms=twitter,facebook,linkedin (comma-separated)'
    });
  }

  const requestedPlatforms = platforms.split(',').map(p => p.trim()).filter(p => p);
  const invalidPlatforms = requestedPlatforms.filter(p => !isValidPlatform(p));

  if (invalidPlatforms.length > 0) {
    return res.status(400).json({
      error: 'Invalid platforms',
      message: `Invalid platform(s): ${invalidPlatforms.join(', ')}. Valid platforms: ${PLATFORMS.map(p => p.id).join(', ')}`
    });
  }

  if (requestedPlatforms.length === 0) {
    return res.status(400).json({
      error: 'No platforms specified',
      message: 'Provide at least one platform'
    });
  }

  // Limit bulk requests to 20 platforms max
  if (requestedPlatforms.length > 20) {
    return res.status(400).json({
      error: 'Too many platforms',
      message: 'Maximum 20 platforms per bulk request'
    });
  }

  // Rate limiting for bulk requests - consume one token per platform
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const rateLimit = checkRateLimit(clientIp, RATE_LIMIT_SCREENSHOT, 'screenshot');

  // For bulk requests, we need to check if we have enough capacity
  // We'll check multiple times and consume tokens for each platform
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many screenshot requests. Please try again later.',
      retryAfter: 3600
    });
  }

  // Consume additional tokens for remaining platforms (1st was consumed above)
  let finalRateLimit = rateLimit;
  for (let i = 1; i < requestedPlatforms.length; i++) {
    const additionalCheck = checkRateLimit(clientIp, RATE_LIMIT_SCREENSHOT, 'screenshot');
    if (!additionalCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many screenshot requests. You can generate ${i} screenshots in this batch.`,
        retryAfter: 3600
      });
    }
    finalRateLimit = additionalCheck;
  }

  // Validate theme
  if (!['light', 'dark'].includes(theme)) {
    return res.status(400).json({
      error: 'Invalid theme',
      message: 'Theme must be either "light" or "dark"'
    });
  }

  // Validate scale
  if (!['1x', '2x'].includes(scale)) {
    return res.status(400).json({
      error: 'Invalid scale',
      message: 'Scale must be either "1x" or "2x"'
    });
  }

  // Validate format
  if (!['svg', 'png'].includes(format)) {
    return res.status(400).json({
      error: 'Invalid format',
      message: 'Format must be either "svg" or "png"'
    });
  }

  // URL is required
  if (!url) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  // Validate URL
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only http and https URLs are supported' });
    }
  } catch (_) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const { html, finalUrl, redirectChain, responseHeaders, statusCode } =
      await fetchUrl(url);

    const meta = parseMetaTags(html, finalUrl);

    // Probe image dimensions
    let imageProbe = null;
    const imageUrl = meta.og.image || meta.twitter.image;
    if (imageUrl) {
      try {
        imageProbe = await probeImage(imageUrl);
      } catch (_) {
        // non-fatal
      }
    }

    // Set response headers for ZIP download
    res.setHeader('X-RateLimit-Remaining', finalRateLimit.remaining.toString());
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="screenshots-${Date.now()}.zip"`);

    // Create ZIP stream
    const zip = new ZipArchive({
      zlib: { level: 9 } // Maximum compression
    });

    // Handle errors
    zip.on('error', (err) => {
      console.error('ZIP error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to create ZIP file' });
      }
    });

    // Pipe ZIP to response
    zip.pipe(res);

    // Generate screenshots for each platform
    const fileExtension = format === 'png' ? 'png' : 'svg';
    const errors = [];

    for (const platformId of requestedPlatforms) {
      try {
        const screenshot = await generateScreenshot(
          platformId,
          meta,
          imageProbe,
          finalUrl,
          { withFrame: false, format, theme, scale }
        );

        const fileData = format === 'png' ? screenshot.buffer : screenshot.svg;
        const fileName = `${platformId}-card.${fileExtension}`;

        zip.append(fileData, { name: fileName });
      } catch (err) {
        console.error(`Failed to generate screenshot for ${platformId}:`, err.message);
        errors.push({ platform: platformId, error: err.message });
      }
    }

    // Add a manifest file if there were any errors
    if (errors.length > 0) {
      const manifest = JSON.stringify({
        url,
        finalUrl,
        theme,
        scale,
        format,
        requestedPlatforms,
        successful: requestedPlatforms.length - errors.length,
        failed: errors.length,
        errors,
      }, null, 2);
      zip.append(manifest, { name: 'manifest.json' });
    }

    // Finalize the ZIP
    await new Promise((resolve, reject) => {
      zip.on('close', resolve);
      zip.on('error', reject);
      zip.finalize();
    });
  } catch (err) {
    console.error('Bulk screenshot generation error:', err.message);
    if (!res.headersSent) {
      if (isSsrfError(err)) {
        res.status(400).json({ error: err.message });
      } else {
        res.status(502).json({ error: `Failed to generate screenshots: ${err.message}` });
      }
    }
  }
});

/**
 * POST /api/screenshot — Generate PNG screenshot of a platform card
 * Body params: platform, url, meta, imageProbe, withFrame, format, theme, scale
 */
app.post('/api/screenshot', async (req, res) => {
  // PNG is the default here too, matching the GET endpoint and the plan's
  // "PNG primary deliverable"; format=svg is an explicit opt-in. (bf-25mc)
  const { platform, url, meta, imageProbe, withFrame = false, format = 'png', theme = 'dark', scale = '1x' } = req.body;

  // Rate limiting
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const rateLimit = checkRateLimit(clientIp, RATE_LIMIT_SCREENSHOT, 'screenshot');
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many screenshot requests. Please try again later.',
      retryAfter: 3600
    });
  }

  // Validate platform
  if (!platform || !isValidPlatform(platform)) {
    return res.status(400).json({
      error: 'Invalid platform',
      message: `Platform must be one of: ${PLATFORMS.map(p => p.id).join(', ')}`
    });
  }

  // Validate theme
  if (theme && !['light', 'dark'].includes(theme)) {
    return res.status(400).json({
      error: 'Invalid theme',
      message: 'Theme must be either "light" or "dark"'
    });
  }

  // Validate scale
  if (scale && !['1x', '2x'].includes(scale)) {
    return res.status(400).json({
      error: 'Invalid scale',
      message: 'Scale must be either "1x" or "2x"'
    });
  }

  // If URL is provided, fetch the metadata
  let finalMeta = meta;
  let finalImageProbe = imageProbe;
  let finalUrl = url;

  if (url && !meta) {
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: 'Only http and https URLs are supported' });
      }

      const { html, finalUrl: fetchedUrl, redirectChain, responseHeaders, statusCode } =
        await fetchUrl(url);

      finalMeta = parseMetaTags(html, fetchedUrl);
      finalUrl = fetchedUrl;

      // Probe image dimensions
      const imageUrl = finalMeta.og.image || finalMeta.twitter.image;
      if (imageUrl) {
        try {
          finalImageProbe = await probeImage(imageUrl);
        } catch (_) {
          // non-fatal
        }
      }
    } catch (err) {
      return handleFetchError(res, err, 'Failed to fetch URL');
    }
  }

  if (!finalMeta) {
    return res.status(400).json({ error: 'Missing metadata. Provide either meta object or url.' });
  }

  try {
    // Generate screenshot
    const screenshot = await generateScreenshot(
      platform,
      finalMeta,
      finalImageProbe,
      finalUrl || url,
      { withFrame, format, theme, scale }
    );

    // Set response headers
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());

    if (format === 'png') {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${platform}-card.png"`);
      res.send(screenshot.buffer);
    } else {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${platform}-card.svg"`);
      res.send(screenshot.svg);
    }
  } catch (err) {
    console.error('Screenshot generation error:', err.message);
    res.status(500).json({ error: `Failed to generate screenshot: ${err.message}` });
  }
});

/**
 * GET /api/badge?score=25&platforms=31&style=flat
 * GET /api/badge?url=https://example.com&style=flat
 * Generate SVG badge showing platform score
 * If ?url= is provided, fetch and score the URL (with 1-hour cache)
 */
app.get('/api/badge', async (req, res) => {
  const url = req.query.url;
  const style = req.query.style || 'flat';

  // Validate style
  const validStyles = ['flat', 'flat-square', 'plastic', 'for-the-badge'];
  if (!validStyles.includes(style)) {
    return res.status(400).json({ error: `Invalid style. Must be one of: ${validStyles.join(', ')}` });
  }

  let score, platforms;

  if (url) {
    // Rate-limit only url mode — it fetches+scores a live page. The legacy
    // ?score=&platforms= mode does no network I/O, so it stays unlimited.
    if (rateLimited(req, res, RATE_LIMIT_PREVIEW, 'preview')) return;
    // Validate URL
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: 'Only http and https URLs are supported' });
      }
    } catch (_) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Check cache
    const cached = badgeCache.get(url);
    const now = Date.now();

    if (cached && (now - cached.timestamp < BADGE_CACHE_TTL)) {
      score = cached.score;
      platforms = cached.platforms;
    } else {
      // Fetch and score the URL
      try {
        const { html, finalUrl } = await fetchUrl(url);
        const meta = parseMetaTags(html, finalUrl);

        // Probe image dimensions
        let imageProbe = null;
        const imageUrl = meta.og.image || meta.twitter.image;
        if (imageUrl) {
          try {
            imageProbe = await probeImage(imageUrl);
          } catch (_) {
            // non-fatal
          }
        }

        const scoring = scoreAll(meta, imageProbe);
        score = scoring.overall.score;
        platforms = Object.keys(scoring.scores).length;

        // Cache the result
        badgeCache.set(url, { score, platforms, timestamp: now });

        // Clean up old cache entries periodically (simple LRU cleanup)
        if (badgeCache.size > 1000) {
          for (const [key, value] of badgeCache.entries()) {
            if (now - value.timestamp >= BADGE_CACHE_TTL) {
              badgeCache.delete(key);
            }
          }
        }
      } catch (err) {
        console.error('Badge fetch error:', err.message);
        return handleFetchError(res, err, 'Failed to fetch URL');
      }
    }
  } else {
    // Legacy mode: use score and platforms from query params
    score = parseInt(req.query.score || '0', 10);
    platforms = parseInt(req.query.platforms || '0', 10);
  }

  // Validate score range
  const clampedScore = Math.max(0, Math.min(100, score));
  const grade = getGradeForScore(clampedScore);
  const color = getGradeColor(grade);

  // Generate SVG
  const svg = generateBadgeSvg(clampedScore, platforms, style, color);

  // Set cache headers (1 hour)
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=7200');
  res.setHeader('X-RateLimit-Remaining', '999');

  res.send(svg);
});

/**
 * GET /api/compare?a=...&b=...
 * Compare two URLs by fetching both previews in parallel
 */
app.get('/api/compare', async (req, res) => {
  if (rateLimited(req, res, RATE_LIMIT_PREVIEW, 'preview')) return;
  const urlA = req.query.a;
  const urlB = req.query.b;

  if (!urlA || !urlB) {
    return res.status(400).json({ error: 'Missing ?a= or ?b= parameter (both URLs are required)' });
  }

  // Validate both URLs
  for (const [name, url] of [['a', urlA], ['b', urlB]]) {
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: `Only http and https URLs are supported (invalid URL in ?${name}=)` });
      }
    } catch (_) {
      return res.status(400).json({ error: `Invalid URL in ?${name}=` });
    }
  }

  try {
    // Fetch both URLs in parallel
    const [resultA, resultB] = await Promise.all([
      (async () => {
        try {
          const { html, redirectChain, finalUrl, responseHeaders, statusCode } = await fetchUrl(urlA);
          return {
            success: true,
            data: await buildPreviewResult({
              html,
              baseUrl: finalUrl,
              redirectChain,
              responseHeaders,
              statusCode,
              sourceUrl: urlA,
            }),
          };
        } catch (err) {
          return { success: false, error: err.message, url: urlA };
        }
      })(),
      (async () => {
        try {
          const { html, redirectChain, finalUrl, responseHeaders, statusCode } = await fetchUrl(urlB);
          return {
            success: true,
            data: await buildPreviewResult({
              html,
              baseUrl: finalUrl,
              redirectChain,
              responseHeaders,
              statusCode,
              sourceUrl: urlB,
            }),
          };
        } catch (err) {
          return { success: false, error: err.message, url: urlB };
        }
      })(),
    ]);

    // If both failed, return error
    if (!resultA.success && !resultB.success) {
      return res.status(502).json({
        error: 'Failed to fetch both URLs',
        urlA: { error: resultA.error },
        urlB: { error: resultB.error },
      });
    }

    // Return results (even if one failed)
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.json({
      a: resultA.success ? resultA.data : { error: resultA.error, url: resultA.url },
      b: resultB.success ? resultB.data : { error: resultB.error, url: resultB.url },
    });
  } catch (err) {
    console.error('Compare error:', err.message);
    res.status(500).json({ error: `Comparison failed: ${err.message}` });
  }
});

/**
 * POST /api/purge
 * Server-side cache invalidation for a URL
 * Body: { url: string, platforms?: string[] }
 * Clears server-side in-memory cache and optionally purges external platform caches
 */
app.post('/api/purge', async (req, res) => {
  const { url, platforms } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing url in request body' });
  }

  // Validate URL
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only http and https URLs are supported' });
    }
  } catch (_) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const results = {
    url,
    purged: [],
    failed: [],
    skipped: [],
  };

  // Clear server-side in-memory badge cache
  const hadCachedBadge = badgeCache.delete(url);
  if (hadCachedBadge) {
    results.purged.push('server-badge-cache');
  } else {
    results.skipped.push('server-badge-cache');
  }

  // Platform-specific cache purging
  const platformsToPurge = platforms || ['facebook'];
  const serverFbToken = process.env.FACEBOOK_APP_TOKEN;

  for (const platform of platformsToPurge) {
    try {
      if (platform === 'facebook') {
        if (serverFbToken) {
          // Server-side Facebook cache purge
          const fbUrl = `https://graph.facebook.com/v18.0/?id=${encodeURIComponent(url)}&scrape=true&access_token=${encodeURIComponent(serverFbToken)}`;
          const response = await fetch(fbUrl, { method: 'POST' });
          const data = await response.json();

          if (data.error) {
            results.failed.push({ platform, error: data.error.message });
          } else {
            results.purged.push('facebook-cache');
          }
        } else {
          // No server token configured - skip but inform
          results.skipped.push('facebook-cache (no server token configured)');
        }
      } else {
        results.skipped.push(`${platform}-cache (not supported server-side yet)`);
      }
    } catch (err) {
      results.failed.push({ platform, error: err.message });
    }
  }

  res.json(results);
});

/**
 * GET /api/snippet?format=nextjs&url=https://...
 * Generate framework code snippet for meta tags
 */
app.get('/api/snippet', async (req, res) => {
  const { format, url } = req.query;

  // Validate format parameter
  if (!format) {
    return res.status(400).json({
      error: 'Missing format parameter',
      message: `Provide ?format= with one of: ${getSupportedFormats().join(', ')}`
    });
  }

  // Validate format is supported
  const supportedFormats = getSupportedFormats();
  if (!supportedFormats.includes(format)) {
    return res.status(400).json({
      error: 'Invalid format',
      message: `Format must be one of: ${supportedFormats.join(', ')}`
    });
  }

  let meta;

  // If URL is provided, fetch and parse meta tags
  if (url) {
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return res.status(400).json({ error: 'Only http and https URLs are supported' });
      }

      const { html, finalUrl } = await fetchUrl(url);
      meta = parseMetaTags(html, finalUrl);
    } catch (err) {
      console.error('Fetch error:', err.message);
      return res.status(502).json({ error: `Failed to fetch URL: ${err.message}` });
    }
  } else {
    // No URL provided, return empty template
    meta = {
      title: '',
      description: '',
      og: { title: '', description: '', image: '', type: 'website' },
      twitter: { card: 'summary_large_image', title: '', description: '', image: '' }
    };
  }

  try {
    // Generate code snippet
    const snippet = generateSnippet(format, meta, url || '');

    res.json({
      format,
      url: url || null,
      meta,
      snippet
    });
  } catch (err) {
    console.error('Snippet generation error:', err.message);
    res.status(500).json({ error: `Failed to generate snippet: ${err.message}` });
  }
});

/**
 * GET /api/templates
 * List all available meta tag templates
 */
app.get('/api/templates', (req, res) => {
  const templatesDir = path.join(__dirname, 'templates');

  // Read all JSON files from templates directory
  let templateFiles;
  try {
    templateFiles = fs.readdirSync(templatesDir)
      .filter(file => file.endsWith('.json'))
      .sort();
  } catch (err) {
    console.error('Failed to read templates directory:', err.message);
    return res.status(500).json({ error: 'Failed to read templates directory' });
  }

  // Load each template
  const templates = [];
  for (const file of templateFiles) {
    try {
      const filePath = path.join(templatesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const template = JSON.parse(content);

      // Return only essential fields for listing
      templates.push({
        id: template.id,
        icon: template.icon,
        title: template.title,
        desc: template.desc,
        tags: template.tags || []
      });
    } catch (err) {
      console.error(`Failed to load template ${file}:`, err.message);
      // Skip failed templates, don't fail entire request
    }
  }

  res.json({
    count: templates.length,
    templates
  });
});

/**
 * GET /api/templates/:name
 * Get a specific template by name (without .json extension)
 */
app.get('/api/templates/:name', (req, res) => {
  const { name } = req.params;

  // Security check: prevent path traversal
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    return res.status(400).json({ error: 'Invalid template name' });
  }

  const templatePath = path.join(__dirname, 'templates', `${name}.json`);

  // Check if file exists
  if (!fs.existsSync(templatePath)) {
    return res.status(404).json({
      error: 'Template not found',
      message: `Template "${name}" does not exist`,
      availableTemplates: fs.readdirSync(path.join(__dirname, 'templates'))
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
    });
  }

  try {
    const content = fs.readFileSync(templatePath, 'utf-8');
    const template = JSON.parse(content);

    res.json(template);
  } catch (err) {
    console.error(`Failed to load template ${name}:`, err.message);
    res.status(500).json({ error: `Failed to load template: ${err.message}` });
  }
});

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

/**
 * GET /api/badge/preview - Preview badge HTML for current URL
 * Returns embed code for the badge
 */
app.get('/api/badge/preview', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'Only http and https URLs are supported' });
    }
  } catch (_) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const { html, finalUrl } = await fetchUrl(url);
    const { scoreAll } = require('./scorer');
    const { parseMetaTags } = require('./fetcher');
    const { probeImage } = require('./fetcher');

    const meta = parseMetaTags(html, finalUrl);

    // Probe image dimensions
    let imageProbe = null;
    const imageUrl = meta.og.image || meta.twitter.image;
    if (imageUrl) {
      try {
        imageProbe = await probeImage(imageUrl);
      } catch (_) {
        // non-fatal
      }
    }

    const scoring = scoreAll(meta, imageProbe);
    const score = scoring.overall.score;
    const platformCount = Object.keys(scoring.scores).length;

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      url,
      score,
      platforms: platformCount,
      grade: scoring.overall.grade,
      embedCode: generateEmbedCode(url, score, platformCount, baseUrl),
    });
  } catch (err) {
    return handleFetchError(res, err, 'Failed to fetch URL');
  }
});

// Badge utility functions

function getGradeForScore(score) {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}

function getGradeColor(grade) {
  const colors = {
    'A+': '#4c1', 'A': '#4c1', 'A-': '#4c1',
    'B+': '#97ca00', 'B': '#97ca00', 'B-': '#97ca00',
    'C+': '#dfb317', 'C': '#dfb317', 'C-': '#dfb317',
    'D+': '#fe7d37', 'D': '#fe7d37', 'D-': '#fe7d37',
    'F': '#e05d44'
  };
  return colors[grade] || '#9f9f9f';
}

function generateBadgeSvg(score, platforms, style, color) {
  const label = 'platform score';
  const message = `${score}/100`;
  const width = calculateBadgeWidth(label, message, style);

  if (style === 'for-the-badge') {
    return generateForTheBadge(label, message, color);
  } else if (style === 'plastic') {
    return generatePlastic(label, message, color);
  } else if (style === 'flat-square') {
    return generateFlatSquare(label, message, color);
  }
  return generateFlat(label, message, color);
}

function calculateBadgeWidth(label, message, style) {
  // Approximate character widths (average)
  const labelWidth = label.length * 7;
  const messageWidth = message.length * 7;
  const padding = style === 'for-the-badge' ? 10 : 13;
  return labelWidth + messageWidth + (padding * 3);
}

function generateFlat(label, message, color) {
  const labelWidth = Math.ceil(label.length * 7) + 13;
  const messageWidth = Math.ceil(message.length * 7) + 13;
  const totalWidth = labelWidth + messageWidth;
  const height = 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalWidth}" height="${height}">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="${totalWidth}" height="${height}" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#555" d="M0 0h${labelWidth}v${height}H0z"/>
    <path fill="${color}" d="M${labelWidth} 0h${messageWidth}v${height}H${labelWidth}z"/>
    <path fill="url(#b)" d="M0 0h${totalWidth}v${height}H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + messageWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${message}</text>
    <text x="${labelWidth + messageWidth / 2}" y="14">${message}</text>
  </g>
</svg>`;
}

function generateFlatSquare(label, message, color) {
  const labelWidth = Math.ceil(label.length * 7) + 13;
  const messageWidth = Math.ceil(message.length * 7) + 13;
  const totalWidth = labelWidth + messageWidth;
  const height = 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <g shape-rendering="crispEdges">
    <path fill="#555" d="M0 0h${labelWidth}v${height}H0z"/>
    <path fill="${color}" d="M${labelWidth} 0h${messageWidth}v${height}H${labelWidth}z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + messageWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${message}</text>
    <text x="${labelWidth + messageWidth / 2}" y="14">${message}</text>
  </g>
</svg>`;
}

function generatePlastic(label, message, color) {
  const labelWidth = Math.ceil(label.length * 7) + 13;
  const messageWidth = Math.ceil(message.length * 7) + 13;
  const totalWidth = labelWidth + messageWidth;
  const height = 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <defs>
    <linearGradient id="a" x2="0" y2="100%">
      <stop offset="0" stop-color="#fff" stop-opacity=".4"/>
      <stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>
      <stop offset=".9" stop-color="#000" stop-opacity=".3"/>
      <stop offset="1" stop-color="#000" stop-opacity=".5"/>
    </linearGradient>
  </defs>
  <g>
    <path fill="#555" d="M0 0h${labelWidth}v${height}H0z"/>
    <path fill="${color}" d="M${labelWidth} 0h${messageWidth}v${height}H${labelWidth}z"/>
    <path fill="url(#a)" d="M0 0h${totalWidth}v${height}H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15">${label}</text>
    <text x="${labelWidth + messageWidth / 2}" y="15">${message}</text>
  </g>
</svg>`;
}

function generateForTheBadge(label, message, color) {
  const labelWidth = Math.ceil(label.length * 8.5) + 10;
  const messageWidth = Math.ceil(message.length * 8.5) + 10;
  const totalWidth = labelWidth + messageWidth;
  const height = 28;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <g shape-rendering="crispEdges">
    <path fill="#555" d="M0 0h${labelWidth}v${height}H0z"/>
    <path fill="${color}" d="M${labelWidth} 0h${messageWidth}v${height}H${labelWidth}z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" text-transform="uppercase" font-size="10">
    <text x="${labelWidth / 2}" y="18" font-weight="bold">${label}</text>
    <text x="${labelWidth + messageWidth / 2}" y="18" font-weight="bold">${message}</text>
  </g>
</svg>`;
}

function generateEmbedCode(url, score, platforms, baseUrl) {
  // Prefer ?url= parameter for dynamic badges
  if (url) {
    return `<a href="${baseUrl}/?url=${encodeURIComponent(url)}">
  <img src="${baseUrl}/api/badge?url=${encodeURIComponent(url)}" alt="VISTA Platform Score" />
</a>`;
  }
  // Fallback to legacy ?score=&platforms= parameters
  return `<a href="${baseUrl}/api/badge?score=${score}&platforms=${platforms}">
  <img src="${baseUrl}/api/badge?score=${score}&platforms=${platforms}" alt="Platform Score Badge" />
</a>`;
}

app.get('/health', (req, res) => res.json({ ok: true }));

// Core logic

async function buildPreviewResult({ html, baseUrl, redirectChain, responseHeaders, statusCode, sourceUrl }) {
  const meta = parseMetaTags(html, baseUrl);

  // Probe image dimensions
  let imageProbe = null;
  const imageUrl = meta.og.image || meta.twitter.image;
  if (imageUrl) {
    imageProbe = await probeImage(imageUrl);
  }

  // Diagnostics
  const diagnostics = detectMistakes(html, meta, imageProbe, responseHeaders, redirectChain);

  // Scoring
  const scoring = scoreAll(meta, imageProbe);

  // Auto-fixes
  const autoFixes = buildAutoFixes(meta, diagnostics, scoring);

  // Header analysis
  const headerAnalysis = analyzeResponseHeaders(responseHeaders, imageProbe, meta);

  return {
    url: sourceUrl,
    finalUrl: baseUrl,
    statusCode,
    meta,
    imageProbe,
    diagnostics,
    scoring,
    autoFixes,
    redirectChain,
    responseHeaders,
    headerAnalysis,
    // Include raw HTML for client-side verification (max 500KB to avoid overloading)
    html: html.slice(0, 500 * 1024),
    // Include rawTags array from parseMetaTags for client-side diagnostics
    rawTags: meta.rawTags,
  };
}

function buildAutoFixes(meta, diagnostics, scoring) {
  const fixes = [];
  const seen = new Set();

  const addFix = (code, message, tag, platforms) => {
    if (seen.has(code)) return;
    seen.add(code);
    fixes.push({ code, message, tag, platforms });
  };

  for (const d of diagnostics) {
    if (d.severity === 'error' || d.severity === 'warning') {
      addFix(d.code, d.message, d.fix, d.platforms);
    }
  }

  for (const [pid, result] of Object.entries(scoring.scores)) {
    for (let i = 0; i < result.fixes.length; i++) {
      addFix(`${pid}-fix-${i}`, result.issues[i] || result.fixes[i], result.fixes[i], result.platform.name);
    }
  }

  return fixes;
}

/**
 * Build headers-only preview result (HTTP header analysis).
 * Fast response for header diagnostics including security headers, CORS, server info, and performance headers.
 */
async function buildHeadersPreviewResult({ html, baseUrl, redirectChain, responseHeaders, statusCode, sourceUrl }) {
  const meta = parseMetaTags(html, baseUrl);

  // Header analysis
  const headerAnalysis = analyzeResponseHeaders(responseHeaders, null, meta);

  // Extract and categorize all headers
  const categorizedHeaders = categorizeHeaders(responseHeaders);

  // Security score assessment
  const securityScore = assessSecurityHeaders(responseHeaders);

  // Performance assessment
  const performanceAssessment = assessPerformanceHeaders(responseHeaders);

  // Diagnostics — the full /api/preview endpoint computes detectMistakes()
  // with html+meta+imageProbe+responseHeaders+redirectChain. The split /headers
  // endpoint has everything EXCEPT the probed image (which lives in /images),
  // so it computes the text/header/redirect diagnostics with imageProbe=null.
  // This populates the Diagnostics tab at ~600ms — before image probing
  // (1–3s) finishes — matching the plan's progressive loading sequence. The
  // image-dimension findings are layered in later by /images, whose diagnostics
  // mergeData prefers as a superset. Without this, the progressive flow always
  // rendered an empty diagnostics tab ([] from mergeData's default). (bf-59t)
  const diagnostics = detectMistakes(html, meta, null, responseHeaders, redirectChain);
  const scoring = scoreAll(meta, null);
  const autoFixes = buildAutoFixes(meta, diagnostics, scoring);

  return {
    url: sourceUrl,
    finalUrl: baseUrl,
    statusCode,
    // Categorized headers
    headers: categorizedHeaders,
    // Security header analysis
    security: {
      score: securityScore.score,
      grade: securityScore.grade,
      headers: securityScore.headers,
      issues: securityScore.issues,
      recommendations: securityScore.recommendations,
    },
    // CORS analysis
    cors: {
      origin: responseHeaders['access-control-allow-origin'] || null,
      allowHeaders: responseHeaders['access-control-allow-headers'] || null,
      exposeHeaders: responseHeaders['access-control-expose-headers'] || null,
      credentials: responseHeaders['access-control-allow-credentials'] || null,
      maxAge: responseHeaders['access-control-max-age'] || null,
      methods: responseHeaders['access-control-allow-methods'] || null,
      analysis: analyzeCorsHeaders(responseHeaders),
    },
    // Server information
    server: {
      software: responseHeaders['server'] || null,
      xPoweredBy: responseHeaders['x-powered-by'] || null,
      xGenerator: responseHeaders['generator'] || null,
      xAspNetVersion: responseHeaders['x-aspnet-version'] || null,
      xPhpVersion: responseHeaders['x-php-version'] || null,
      analysis: analyzeServerHeaders(responseHeaders),
    },
    // Performance headers
    performance: {
      cacheControl: responseHeaders['cache-control'] || null,
      expires: responseHeaders['expires'] || null,
      etag: responseHeaders['etag'] || null,
      lastModified: responseHeaders['last-modified'] || null,
      contentEncoding: responseHeaders['content-encoding'] || null,
      transferEncoding: responseHeaders['transfer-encoding'] || null,
      assessment: performanceAssessment,
    },
    // Full analysis from header-analyzer
    analysis: headerAnalysis,
    // Exposed under both keys: `analysis` is this endpoint's own label,
    // `headerAnalysis` is the key the full /api/preview endpoint and the
    // client's renderRedirects() read. (bf-59t)
    headerAnalysis,
    // Raw response headers — renderRedirects() and the redirect-chain view
    // consume data.responseHeaders; previously absent in the progressive flow.
    responseHeaders,
    // Diagnostics (text/header/redirect; imageProbe=null) + derived fixes,
    // so the Diagnostics tab and Fix buttons populate at the headers step.
    diagnostics,
    autoFixes,
    redirectChain,
  };
}

/**
 * Build meta-only preview result (no image probing).
 * Fast response for text-based data only.
 */
async function buildMetaPreviewResult({ html, baseUrl, redirectChain, responseHeaders, statusCode, sourceUrl }) {
  const meta = parseMetaTags(html, baseUrl);

  // Scoring WITHOUT image probing (pass null for imageProbe)
  // This gives us a score without blocking on image dimension checks
  const scoring = scoreAll(meta, null);

  // Text-based card previews
  const previews = buildTextPreviews(meta, baseUrl);

  return {
    url: sourceUrl,
    finalUrl: baseUrl,
    statusCode,
    // Meta tags
    meta: {
      title: meta.title || null,
      description: meta.description || null,
      og: {
        title: meta.og.title || null,
        description: meta.og.description || null,
        image: meta.og.image || null,
        url: meta.og.url || null,
        type: meta.og.type || null,
        siteName: meta.og.site_name || null,
      },
      twitter: {
        card: meta.twitter.card || null,
        title: meta.twitter.title || null,
        description: meta.twitter.description || null,
        image: meta.twitter.image || null,
        site: meta.twitter.site || null,
      },
      favicon: meta.favicon || null,
      themeColor: meta.themeColor || null,
      // rawTags (the tags a crawler sees in the raw HTML, pre-JS) are needed by
      // verifyClientSideTags() in app.js to diff against the post-JS DOM. The
      // full /api/preview endpoint carries these; the progressive /meta endpoint
      // must too, or the client-side-only tag detector never has server-side
      // data to compare against and silently no-ops. (bf-4p8p)
      rawTags: meta.rawTags || [],
    },
    // Scoring (without image dimension data)
    scoring: {
      overall: scoring.overall,
      summary: scoring.summary,
      gradeCounts: scoring.gradeCounts,
      // Per-platform scores keyed as `scores` — the shape scoreAll() returns
      // and the full /api/preview endpoint emits. The client reads
      // data.scoring.scores[pid] in a dozen places (renderTextPreviewsOnly,
      // renderPreviews, applySmartOrdering, …); an earlier `platformScores` key
      // was never read by anything, so every read returned undefined and threw
      // inside renderTextPreviewsOnly — aborting progressiveLoad before
      // verifyClientSideTags() could run and leaving the JS-injection detector
      // unreachable. (bf-4p8p)
      scores: scoring.scores,
    },
    // Text-based card previews
    previews,
    redirectChain,
    // Raw HTML (capped, same as /api/preview) so verifyClientSideTags() can
    // render it in a hidden iframe, execute the page's JS, and diff the
    // resulting DOM meta tags against rawTags above. (bf-4p8p)
    html: html.slice(0, 500 * 1024),
  };
}

/**
 * Build image-only preview result (image probing with dimensions and crop ratios).
 * Slower response (~1-3s) for image-specific data.
 */
async function buildImagePreviewResult({ html, baseUrl, redirectChain, responseHeaders, statusCode, sourceUrl }) {
  const meta = parseMetaTags(html, baseUrl);

  // Collect all image URLs to probe
  const imageUrls = new Set();

  // Open Graph image
  if (meta.og.image) {
    imageUrls.add(meta.og.image);
  }

  // Twitter image
  if (meta.twitter.image) {
    imageUrls.add(meta.twitter.image);
  }

  // Favicon
  if (meta.favicon) {
    imageUrls.add(meta.favicon);
  }

  // Look for hero.png references in the HTML
  const heroPattern = /hero\.png(?:\?[^'\"]*)?/gi;
  const heroMatches = html.match(heroPattern) || [];
  for (const match of heroMatches) {
    const heroUrl = resolveUrl(match, baseUrl);
    imageUrls.add(heroUrl);
  }

  // Also check for og:image with .png extension
  if (meta.og.image && meta.og.image.toLowerCase().includes('.png')) {
    // Already added above
  }

  // Probe all images in parallel
  const imageProbes = await Promise.allSettled(
    Array.from(imageUrls).map(async (imageUrl) => {
      return {
        url: imageUrl,
        probe: await probeImage(imageUrl),
      };
    })
  );

  // Process results and categorize by type
  const results = {
    ogImage: null,
    twitterImage: null,
    favicon: null,
    heroImages: [],
    allImages: [],
  };

  for (const result of imageProbes) {
    if (result.status === 'rejected') continue;

    const { url, probe } = result.value;

    // Add to all images list
    const imageData = {
      url,
      ...probe,
      cropRatios: calculateCropRatios(probe),
    };
    results.allImages.push(imageData);

    // Categorize by type
    if (url === meta.og.image) {
      results.ogImage = imageData;
    } else if (url === meta.twitter.image) {
      results.twitterImage = imageData;
    } else if (url === meta.favicon) {
      results.favicon = imageData;
    } else if (url.toLowerCase().includes('hero.png')) {
      results.heroImages.push(imageData);
    }
  }

  // Build card-specific recommendations
  const cardRecommendations = buildCardRecommendations(meta, results);

  // imageProbe — the full /api/preview endpoint returns a single probe of the
  // og:image under `imageProbe`, and the client reads data.imageProbe in ~12
  // places (renderPlatformCard, renderImageInfo, post-edit re-scoring via
  // scoreAll(modifiedMeta, currentData.imageProbe), screenshots). The split
  // /images endpoint exposes that same probe under images.og — but with an
  // extra cropRatios field. Strip it so the shape matches the full endpoint
  // exactly, then surface it at the top level so mergeData() can bridge it.
  // Previously mergeData read imagesData.imageProbe (always undefined), so the
  // probed dimensions were fetched then discarded and cards never filled in.
  // (bf-59t)
  let imageProbe = null;
  if (results.ogImage) {
    const { cropRatios, ...probeWithoutRatios } = results.ogImage;
    imageProbe = probeWithoutRatios;
  }

  // Diagnostics computed WITH the real imageProbe (image dimensions, file
  // size, response time, content-type findings) plus responseHeaders and
  // redirectChain — a superset of the /headers diagnostics. mergeData prefers
  // this when available so the Diagnostics tab gains image findings once
  // probing completes. (bf-59t)
  const diagnostics = detectMistakes(html, meta, imageProbe, responseHeaders, redirectChain);
  const scoring = scoreAll(meta, imageProbe);
  const autoFixes = buildAutoFixes(meta, diagnostics, scoring);

  return {
    url: sourceUrl,
    finalUrl: baseUrl,
    statusCode,
    // Top-level imageProbe bridges to the client's existing data.imageProbe
    // contract (same shape as the full /api/preview endpoint).
    imageProbe,
    // Image probe results
    images: {
      og: results.ogImage,
      twitter: results.twitterImage,
      favicon: results.favicon,
      hero: results.heroImages,
      all: results.allImages,
    },
    // Card-specific recommendations based on image dimensions
    recommendations: cardRecommendations,
    // Full diagnostics (with imageProbe) + derived fixes, layered in once
    // image probing completes.
    diagnostics,
    autoFixes,
    redirectChain,
  };
}

/**
 * Calculate crop ratios for common platform card sizes.
 * Returns an object with ratios for different card types.
 */
function calculateCropRatios(probe) {
  if (!probe.width || !probe.height) {
    return {
      landscape: null,
      square: null,
      portrait: null,
    };
  }

  const width = probe.width;
  const height = probe.height;
  const aspectRatio = width / height;

  return {
    aspectRatio: parseFloat(aspectRatio.toFixed(3)),
    landscape: {
      ratio: '16:9',
      recommended: { width: 1200, height: 675 },
      actual: { width, height },
      willCrop: aspectRatio < 1.778,
    },
    square: {
      ratio: '1:1',
      recommended: { width: 1080, height: 1080 },
      actual: { width, height },
      willCrop: aspectRatio !== 1.0,
    },
    portrait: {
      ratio: '4:5',
      recommended: { width: 1080, height: 1350 },
      actual: { width, height },
      willCrop: aspectRatio < 0.8 || aspectRatio > 0.8,
    },
  };
}

/**
 * Build card-specific recommendations based on image dimensions.
 */
function buildCardRecommendations(meta, imageResults) {
  const recommendations = [];

  const ogImage = imageResults.ogImage;
  const twitterImage = imageResults.twitterImage;

  if (ogImage && ogImage.width && ogImage.height) {
    const aspectRatio = ogImage.width / ogImage.height;

    // Twitter Large Card: 16:9 (recommended: 1200x675)
    if (aspectRatio < 1.5) {
      recommendations.push({
        platform: 'twitter',
        cardType: 'large',
        issue: 'aspect_ratio_too_narrow',
        message: `Image aspect ratio ${aspectRatio.toFixed(2)} is too narrow for Twitter Large Card (16:9). Image may be cropped.`,
        recommended: { width: 1200, height: 675, ratio: '16:9' },
        current: { width: ogImage.width, height: ogImage.height, ratio: aspectRatio.toFixed(2) },
      });
    }

    // Facebook/LinkedIn: 16:9 to 4:5
    if (aspectRatio < 0.8 || aspectRatio > 2.0) {
      recommendations.push({
        platform: 'facebook,linkedin',
        cardType: 'opengraph',
        issue: 'aspect_ratio_out_of_range',
        message: `Image aspect ratio ${aspectRatio.toFixed(2)} is outside optimal range (0.8-2.0) for Open Graph cards.`,
        recommended: { ratio: '16:9 (1.78)', min: '4:5 (0.8)', max: '2:1 (2.0)' },
        current: { width: ogImage.width, height: ogImage.height, ratio: aspectRatio.toFixed(2) },
      });
    }

    // Minimum size check
    if (ogImage.width < 1200 || ogImage.height < 630) {
      recommendations.push({
        platform: 'facebook,linkedin',
        cardType: 'opengraph',
        issue: 'image_too_small',
        message: `Image dimensions (${ogImage.width}x${ogImage.height}) are below recommended minimum (1200x630).`,
        recommended: { width: 1200, height: 630 },
        current: { width: ogImage.width, height: ogImage.height },
      });
    }
  }

  if (twitterImage && twitterImage.width && twitterImage.height) {
    const aspectRatio = twitterImage.width / twitterImage.height;

    // Twitter Summary Card: 1:1 or close to square
    if (aspectRatio < 0.8 || aspectRatio > 1.25) {
      recommendations.push({
        platform: 'twitter',
        cardType: 'summary',
        issue: 'aspect_ratio_not_square',
        message: `Image aspect ratio ${aspectRatio.toFixed(2)} is not optimal for Twitter Summary Card (1:1).`,
        recommended: { width: 800, height: 800, ratio: '1:1' },
        current: { width: twitterImage.width, height: twitterImage.height, ratio: aspectRatio.toFixed(2) },
      });
    }
  }

  // Check if og:image and twitter:image are the same
  if (ogImage && twitterImage && ogImage.url === twitterImage.url) {
    recommendations.push({
      platform: 'twitter',
      cardType: 'large,summary',
      issue: 'same_image_for_both_cards',
      message: 'Using the same image for both og:image and twitter:image. Consider using Twitter-specific images for optimal display.',
      ogImage: { width: ogImage.width, height: ogImage.height },
      twitterImage: { width: twitterImage.width, height: twitterImage.height },
    });
  }

  return recommendations;
}

/**
 * Helper function to resolve URLs (copied from fetcher.js for local use)
 */
function resolveUrl(href, baseUrl) {
  if (!href) return null;
  try {
    return new URL(href, baseUrl).toString();
  } catch (_) {
    return href;
  }
}

/**
 * Build text-based card previews for various platforms.
 * Returns object with Google SERP and Twitter card text representations.
 */
function buildTextPreviews(meta, url) {
  const title = meta.og.title || meta.title || '';
  const description = meta.og.description || meta.description || '';
  const domain = new URL(url).hostname;
  const displayUrl = formatDisplayUrl(url);

  // Google SERP preview
  const googleSerp = {
    type: 'google-serp',
    title: truncateText(title, 60),
    url: displayUrl,
    description: truncateText(description, 158),
  };

  // Twitter/X card preview
  const twitterCard = {
    type: 'twitter-card',
    cardType: meta.twitter.card || 'summary',
    title: truncateText(meta.twitter.title || meta.og.title || meta.title || '', 70),
    description: truncateText(
      meta.twitter.description || meta.og.description || meta.description || '',
      70
    ),
    image: meta.twitter.image || meta.og.image || null,
    domain,
  };

  // Facebook/LinkedIn card preview (same format)
  const openGraphCard = {
    type: 'opengraph-card',
    title: truncateText(meta.og.title || meta.title || '', 100),
    description: truncateText(meta.og.description || meta.description || '', 160),
    image: meta.og.image || null,
    domain,
    url: displayUrl,
  };

  // Slack/Discord preview
  const messagingCard = {
    type: 'messaging-card',
    title: truncateText(meta.og.title || meta.title || '', 100),
    description: truncateText(meta.og.description || meta.description || '', 150),
    image: meta.og.image || null,
    domain,
  };

  return {
    google: googleSerp,
    twitter: twitterCard,
    facebook: openGraphCard,
    linkedin: openGraphCard,
    slack: messagingCard,
    discord: messagingCard,
  };
}

/**
 * Format URL for display in search results (like Google does).
 * Shows protocol + domain + truncated path.
 */
function formatDisplayUrl(url) {
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol === 'https:' ? 'https' : 'http';
    const domain = parsed.hostname;
    const path = parsed.pathname + parsed.search;

    // Truncate path if too long
    let displayPath = path;
    if (displayPath.length > 35) {
      displayPath = displayPath.substring(0, 32) + '...';
    }

    return `${protocol}://${domain}${displayPath}`;
  } catch (_) {
    return url;
  }
}

/**
 * Truncate text to max length, adding ellipsis if truncated.
 */
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Parse sitemap XML and extract all URLs.
 * Supports sitemap index (nested sitemaps).
 */
async function parseSitemap(xml, baseUrl) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const urls = [];

  // Check if this is a sitemap index
  const sitemapIndex = $('sitemapindex');
  if (sitemapIndex.length > 0) {
    // This is a sitemap index - get all sitemap URLs
    const locs = $('sitemap > loc').map((_, el) => $(el).text()).get();
    return locs;
  }

  // Regular sitemap - extract all URLs
  const locs = $('url > loc').map((_, el) => $(el).text()).get();
  return locs;
}

/**
 * Determine whether a fetched body looks like sitemap XML. Recognizes both a
 * sitemap index (<sitemapindex>) and a regular URL set (<urlset>), and also
 * accepts bodies that contain <url><loc> entries directly (lenient match for
 * sitemaps that omit or namespace the root element).
 *
 * @param {string} xml - raw response body
 * @returns {boolean}
 */
function looksLikeSitemapXml(xml) {
  if (!xml || typeof xml !== 'string') return false;
  const $ = cheerio.load(xml, { xmlMode: true });
  if ($('sitemapindex').length > 0) return true;
  if ($('urlset').length > 0) return true;
  if ($('url > loc').length > 0) return true;
  return false;
}

/**
 * Extract Sitemap: directive URLs from a robots.txt body.
 *
 * Per RFC 9309 the field name is case-insensitive, there may be multiple
 * Sitemap directives, and a '#' begins a comment. Returns the discovered
 * URLs in document order (the primary entry point is conventionally first).
 *
 * @param {string} robotsTxt - raw robots.txt body
 * @returns {string[]}
 */
function parseRobotsSitemaps(robotsTxt) {
  if (!robotsTxt || typeof robotsTxt !== 'string') return [];
  const sitemaps = [];
  for (const rawLine of robotsTxt.split(/\r?\n/)) {
    const hashIdx = rawLine.indexOf('#');
    const line = (hashIdx >= 0 ? rawLine.slice(0, hashIdx) : rawLine).trim();
    if (!line) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx < 0) continue;
    const field = line.slice(0, colonIdx).trim().toLowerCase();
    const value = line.slice(colonIdx + 1).trim();
    if (field === 'sitemap' && value) {
      sitemaps.push(value);
    }
  }
  return sitemaps;
}

/**
 * Resolve the effective sitemap URL to crawl, with a robots.txt fallback.
 *
 * 1. Fetch the input URL. If its body is valid sitemap XML, use it directly.
 * 2. Otherwise fetch {origin}/robots.txt and follow any Sitemap: directive,
 *    fetching the first discovered sitemap URL.
 *
 * `fetchFn` and `validateFn` are injected so this can be unit-tested with a
 * mock fetch (no network/DNS) and a no-op SSRF validator. `validateFn` is
 * awaited for every URL before it is fetched, so a robots.txt-discovered
 * sitemap on a private host is rejected just like a directly-supplied one.
 *
 * @param {object} opts
 * @param {string} opts.inputUrl - user-supplied URL (already protocol-checked)
 * @param {Function} opts.fetchFn - fetch implementation
 * @param {object} opts.fetchOpts - options forwarded to fetchFn (method/headers/signal)
 * @param {Function} [opts.validateFn] - async SSRF validator (url) => void; default no-op
 * @returns {Promise<{sitemapUrl: string, xml: string}>}
 * @throws {Error} when no sitemap can be located via the URL or robots.txt
 */
async function resolveSitemapUrl({ inputUrl, fetchFn, fetchOpts, validateFn }) {
  validateFn = validateFn || (async () => {});

  // 1. Try the input URL itself.
  let inputResp = null;
  try {
    inputResp = await fetchFn(inputUrl, fetchOpts);
  } catch (_) {
    // Network/abort error — fall through to the robots.txt fallback.
  }

  if (inputResp && inputResp.ok) {
    const xml = await inputResp.text();
    if (looksLikeSitemapXml(xml)) {
      return { sitemapUrl: inputUrl, xml };
    }
  }

  // 2. Fall back to {origin}/robots.txt auto-detection.
  const robotsUrl = new URL('/robots.txt', inputUrl).href;
  await validateFn(robotsUrl);

  let robotsResp = null;
  try {
    robotsResp = await fetchFn(robotsUrl, fetchOpts);
  } catch (_) {
    // unreachable robots.txt is reported below
  }

  let sitemaps = [];
  if (robotsResp && robotsResp.ok) {
    const robotsTxt = await robotsResp.text();
    sitemaps = parseRobotsSitemaps(robotsTxt);
  }

  if (sitemaps.length === 0) {
    let reason;
    if (!robotsResp) {
      reason = `could not fetch ${robotsUrl}`;
    } else if (!robotsResp.ok) {
      reason = `${robotsUrl} returned HTTP ${robotsResp.status}`;
    } else {
      reason = `no Sitemap directive was found in ${robotsUrl}`;
    }
    throw new Error(
      `No sitemap could be found: "${inputUrl}" did not return valid sitemap XML and ${reason}. ` +
        'Provide a direct sitemap.xml URL.'
    );
  }

  // 3. Fetch the first discovered sitemap.
  const sitemapUrl = sitemaps[0];
  await validateFn(sitemapUrl);

  let smResp;
  try {
    smResp = await fetchFn(sitemapUrl, fetchOpts);
  } catch (e) {
    throw new Error(
      `No sitemap could be found: robots.txt pointed to ${sitemapUrl} but it was unreachable (${e.message}).`
    );
  }
  if (!smResp.ok) {
    throw new Error(
      `No sitemap could be found: robots.txt pointed to ${sitemapUrl} but it returned HTTP ${smResp.status} ${smResp.statusText}.`
    );
  }
  const xml = await smResp.text();
  if (!looksLikeSitemapXml(xml)) {
    throw new Error(
      `No sitemap could be found: robots.txt pointed to ${sitemapUrl} but it did not contain valid sitemap XML.`
    );
  }
  return { sitemapUrl, xml };
}

/**
 * Categorize HTTP response headers by type.
 */
function categorizeHeaders(headers) {
  const categories = {
    security: [],
    cors: [],
    performance: [],
    server: [],
    content: [],
    other: [],
  };

  const securityHeaders = [
    'content-security-policy',
    'strict-transport-security',
    'x-frame-options',
    'x-content-type-options',
    'x-xss-protection',
    'referrer-policy',
    'permissions-policy',
    'cross-origin-resource-policy',
    'cross-origin-opener-policy',
    'cross-origin-embedder-policy',
  ];

  const corsHeaders = [
    'access-control-allow-origin',
    'access-control-allow-methods',
    'access-control-allow-headers',
    'access-control-allow-credentials',
    'access-control-expose-headers',
    'access-control-max-age',
  ];

  const performanceHeaders = [
    'cache-control',
    'expires',
    'etag',
    'last-modified',
    'age',
    'cache-status',
    'content-encoding',
    'transfer-encoding',
    'vary',
  ];

  const serverHeaders = [
    'server',
    'x-powered-by',
    'x-generator',
    'x-aspnet-version',
    'x-php-version',
    'x-ua-compatible',
  ];

  const contentHeaders = [
    'content-type',
    'content-length',
    'content-disposition',
    'content-language',
    'location',
    'content-location',
  ];

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    let categorized = false;

    if (securityHeaders.includes(lowerKey)) {
      categories.security.push({ name: key, value });
      categorized = true;
    }
    if (corsHeaders.includes(lowerKey)) {
      categories.cors.push({ name: key, value });
      categorized = true;
    }
    if (performanceHeaders.includes(lowerKey)) {
      categories.performance.push({ name: key, value });
      categorized = true;
    }
    if (serverHeaders.includes(lowerKey)) {
      categories.server.push({ name: key, value });
      categorized = true;
    }
    if (contentHeaders.includes(lowerKey)) {
      categories.content.push({ name: key, value });
      categorized = true;
    }
    if (!categorized) {
      categories.other.push({ name: key, value });
    }
  }

  return categories;
}

/**
 * Assess security headers and provide a score with recommendations.
 */
function assessSecurityHeaders(headers) {
  const score = { raw: 100, deductions: [], headers: {}, issues: [], recommendations: [] };

  // Check HSTS
  const hsts = headers['strict-transport-security'];
  if (hsts) {
    score.headers.hsts = { present: true, value: hsts };
    const hasMaxAge = hsts.includes('max-age=');
    const hasIncludeSubdomains = hsts.includes('includeSubDomains');
    const hasPreload = hsts.includes('preload');

    if (!hasMaxAge) {
      score.deductions.push({ header: 'HSTS', reason: 'Missing max-age directive', deduction: 10 });
      score.raw -= 10;
      score.issues.push({
        severity: 'warning',
        header: 'strict-transport-security',
        message: 'HSTS is present but missing max-age directive',
        recommendation: 'Add max-age=31536000 (1 year) to enable HSTS properly',
      });
    }
    if (!hasIncludeSubdomains) {
      score.recommendations.push({
        header: 'strict-transport-security',
        message: 'Consider adding includeSubdomains to protect all subdomains',
        recommendation: 'Add includeSubdomains to your HSTS header',
      });
    }
  } else {
    score.deductions.push({ header: 'HSTS', reason: 'Missing HSTS header', deduction: 20 });
    score.raw -= 20;
    score.issues.push({
      severity: 'warning',
      header: 'strict-transport-security',
      message: 'Missing HSTS header',
      recommendation: 'Add Strict-Transport-Security: max-age=31536000; includeSubDomains to enforce HTTPS',
      affectedPlatforms: ['All'],
    });
  }

  // Check CSP
  const csp = headers['content-security-policy'];
  if (csp) {
    score.headers.csp = { present: true, value: csp };
    const hasDefaultSrc = csp.includes('default-src');
    const hasScriptSrc = csp.includes('script-src');
    const hasObjectSrc = csp.includes('object-src');
    const hasUpgradeInsecure = csp.includes('upgrade-insecure-requests');

    if (!hasDefaultSrc && !hasScriptSrc) {
      score.deductions.push({ header: 'CSP', reason: 'CSP missing key directives', deduction: 5 });
      score.raw -= 5;
    }
    if (!hasUpgradeInsecure) {
      score.recommendations.push({
        header: 'content-security-policy',
        message: 'Consider adding upgrade-insecure-requests to CSP',
        recommendation: 'Add upgrade-insecure-requests to ensure all content is loaded over HTTPS',
      });
    }
  } else {
    score.deductions.push({ header: 'CSP', reason: 'Missing CSP header', deduction: 15 });
    score.raw -= 15;
    score.issues.push({
      severity: 'info',
      header: 'content-security-policy',
      message: 'Missing Content-Security-Policy header',
      recommendation: 'Add a CSP header to control which resources can be loaded',
      affectedPlatforms: ['All'],
    });
  }

  // Check X-Frame-Options
  const xFrameOptions = headers['x-frame-options'];
  if (xFrameOptions) {
    score.headers.xFrameOptions = { present: true, value: xFrameOptions };
    if (xFrameOptions !== 'DENY' && xFrameOptions !== 'SAMEORIGIN') {
      score.recommendations.push({
        header: 'x-frame-options',
        message: 'X-Frame-Options is present but not set to DENY or SAMEORIGIN',
        recommendation: 'Set X-Frame-Options to DENY or SAMEORIGIN to prevent clickjacking',
      });
    }
  } else {
    score.recommendations.push({
      header: 'x-frame-options',
      message: 'Missing X-Frame-Options header',
      recommendation: 'Add X-Frame-Options: SAMEORIGIN to prevent clickjacking (deprecated but still supported)',
    });
  }

  // Check X-Content-Type-Options
  const xContentTypeOptions = headers['x-content-type-options'];
  if (xContentTypeOptions) {
    score.headers.xContentTypeOptions = { present: true, value: xContentTypeOptions };
    if (xContentTypeOptions !== 'nosniff') {
      score.recommendations.push({
        header: 'x-content-type-options',
        message: 'X-Content-Type-Options should be set to nosniff',
        recommendation: 'Set X-Content-Type-Options: nosniff to prevent MIME type sniffing',
      });
    }
  } else {
    score.recommendations.push({
      header: 'x-content-type-options',
      message: 'Missing X-Content-Type-Options header',
      recommendation: 'Add X-Content-Type-Options: nosniff to prevent MIME type sniffing',
    });
  }

  // Check Referrer-Policy
  const referrerPolicy = headers['referrer-policy'];
  if (!referrerPolicy) {
    score.recommendations.push({
      header: 'referrer-policy',
      message: 'Missing Referrer-Policy header',
      recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin to control referrer information',
    });
  } else {
    score.headers.referrerPolicy = { present: true, value: referrerPolicy };
  }

  // Check for information disclosure
  const server = headers['server'];
  const xPoweredBy = headers['x-powered-by'];
  if (server && server.length > 30) {
    score.recommendations.push({
      header: 'server',
      message: 'Server header exposes detailed version information',
      recommendation: 'Minimize server header to avoid information disclosure',
    });
  }
  if (xPoweredBy) {
    score.recommendations.push({
      header: 'x-powered-by',
      message: 'X-Powered-By header exposes technology stack',
      recommendation: 'Remove X-Powered-By header to hide technology information',
    });
  }

  // Calculate grade
  let grade;
  if (score.raw >= 90) grade = 'A';
  else if (score.raw >= 80) grade = 'B';
  else if (score.raw >= 70) grade = 'C';
  else if (score.raw >= 60) grade = 'D';
  else grade = 'F';

  score.grade = grade;
  score.score = Math.max(0, score.raw);

  return score;
}

/**
 * Analyze CORS headers for configuration issues.
 */
function analyzeCorsHeaders(headers) {
  const analysis = {
    configured: false,
    public: false,
    restricted: false,
    issues: [],
    recommendations: [],
  };

  const origin = headers['access-control-allow-origin'];
  const credentials = headers['access-control-allow-credentials'];
  const methods = headers['access-control-allow-methods'];
  const exposedHeaders = headers['access-control-expose-headers'];

  if (origin) {
    analysis.configured = true;

    if (origin === '*') {
      analysis.public = true;
      if (credentials === 'true') {
        analysis.issues.push({
          severity: 'warning',
          message: 'CORS allows all origins (*) but credentials are enabled',
          detail: 'This is an invalid configuration - browsers will reject this combination',
          recommendation: 'Either remove credentials or specify a specific origin instead of *',
        });
      }
    } else {
      analysis.restricted = true;
      analysis.recommendations.push({
        message: 'CORS is restricted to specific origins',
        detail: `Origin is set to: ${origin}`,
        recommendation: 'Ensure this matches your expected frontend domain',
      });
    }
  } else {
    analysis.recommendations.push({
      message: 'No CORS headers present',
      detail: 'Cross-origin requests will be blocked by browsers',
      recommendation: 'Add Access-Control-Allow-Origin if you want to allow cross-origin requests',
    });
  }

  if (methods && methods.includes('*')) {
    analysis.recommendations.push({
      message: 'CORS allows all methods (*)',
      recommendation: 'Consider restricting to specific methods (GET, POST, etc.) for better security',
    });
  }

  if (!exposedHeaders) {
    analysis.recommendations.push({
      message: 'No CORS exposed headers configured',
      detail: 'Custom headers will not be readable by JavaScript in cross-origin requests',
      recommendation: 'Add Access-Control-Expose-Headers for custom headers you want to expose',
    });
  }

  return analysis;
}

/**
 * Analyze server headers for information disclosure.
 */
function analyzeServerHeaders(headers) {
  const analysis = {
    software: null,
    version: null,
    framework: null,
    disclosureLevel: 'none',
    issues: [],
    recommendations: [],
  };

  const server = headers['server'];
  const xPoweredBy = headers['x-powered-by'];
  const xGenerator = headers['generator'];
  const xAspNetVersion = headers['x-aspnet-version'];
  const xPhpVersion = headers['x-php-version'];

  if (server) {
    analysis.software = server;
    // Try to extract version
    const versionMatch = server.match(/\/?\s*[\d.]+/);
    if (versionMatch) {
      analysis.version = versionMatch[0].trim();
      analysis.disclosureLevel = 'high';
      analysis.issues.push({
        severity: 'info',
        message: 'Server header exposes version information',
        detail: `Server: ${server}`,
        recommendation: 'Configure server to send minimal Server header (e.g., "Server" without version)',
      });
    } else {
      analysis.disclosureLevel = 'medium';
    }
  }

  if (xPoweredBy) {
    analysis.framework = xPoweredBy;
    analysis.issues.push({
      severity: 'info',
      message: 'X-Powered-By header exposes framework',
      detail: `X-Powered-By: ${xPoweredBy}`,
      recommendation: 'Disable X-Powered-By header in server configuration',
    });
  }

  if (xGenerator) {
    analysis.issues.push({
      severity: 'info',
      message: 'Generator header exposes CMS or tool information',
      detail: `Generator: ${xGenerator}`,
      recommendation: 'Remove or obscure generator meta tag and header',
    });
  }

  if (xAspNetVersion) {
    analysis.issues.push({
      severity: 'info',
      message: 'X-AspNet-Version header exposes .NET version',
      detail: `X-AspNet-Version: ${xAspNetVersion}`,
      recommendation: 'Disable X-AspNet-Version header in web.config',
    });
  }

  if (xPhpVersion) {
    analysis.issues.push({
      severity: 'info',
      message: 'X-PHP-Version header exposes PHP version',
      detail: `X-PHP-Version: ${xPhpVersion}`,
      recommendation: 'Disable expose_php in php.ini',
    });
  }

  return analysis;
}

/**
 * Assess performance-related headers.
 */
function assessPerformanceHeaders(headers) {
  const assessment = {
    caching: 'none',
    compression: false,
    optimization: 'none',
    score: 0,
    recommendations: [],
  };

  const cacheControl = headers['cache-control'];
  const expires = headers['expires'];
  const etag = headers['etag'];
  const contentEncoding = headers['content-encoding'];
  const transferEncoding = headers['transfer-encoding'];
  const vary = headers['vary'];

  // Assess caching
  if (cacheControl) {
    const directives = cacheControl.toLowerCase().split(',').map(d => d.trim());
    const hasNoStore = directives.includes('no-store');
    const hasNoCache = directives.includes('no-cache');
    const hasPublic = directives.includes('public');
    const hasPrivate = directives.includes('private');
    const hasMaxAge = directives.find(d => d.startsWith('max-age='));

    if (hasNoStore) {
      assessment.caching = 'disabled';
      assessment.recommendations.push({
        header: 'cache-control',
        message: 'Caching is disabled with no-store',
        detail: 'Content will never be cached by browsers or CDNs',
        recommendation: 'Consider using max-age with a reasonable TTL for public content',
      });
    } else if (hasNoCache) {
      assessment.caching = 'validation-required';
      assessment.recommendations.push({
        header: 'cache-control',
        message: 'Cache requires revalidation with no-cache',
        detail: 'Content must be revalidated before each use',
        recommendation: 'Consider using max-age for better performance',
      });
    } else if (hasMaxAge) {
      const match = hasMaxAge.match(/max-age=(\d+)/);
      if (match) {
        const maxAge = parseInt(match[1], 10);
        if (maxAge >= 3600) {
          assessment.caching = 'good';
          assessment.score += 40;
        } else if (maxAge >= 300) {
          assessment.caching = 'short';
          assessment.score += 20;
        } else {
          assessment.caching = 'very-short';
          assessment.score += 10;
        }
      }
    }

    if (hasPrivate) {
      assessment.recommendations.push({
        header: 'cache-control',
        message: 'Cache is set to private',
        detail: 'Shared caches (CDNs, proxies) will not store this content',
        recommendation: 'Use public for content that can be cached by CDNs',
      });
    }
  } else if (expires) {
    assessment.caching = 'legacy';
    assessment.recommendations.push({
      header: 'expires',
      message: 'Using legacy Expires header instead of Cache-Control',
      recommendation: 'Migrate to Cache-Control with max-age for better control',
    });
  } else {
    assessment.recommendations.push({
      header: 'cache-control',
      message: 'No caching headers present',
      detail: 'Browsers may use heuristic caching',
      recommendation: 'Add Cache-Control header with max-age for better performance',
    });
  }

  // Check compression
  if (contentEncoding === 'gzip' || contentEncoding === 'br' || contentEncoding === 'deflate') {
    assessment.compression = true;
    assessment.score += 30;
  } else {
    assessment.recommendations.push({
      header: 'content-encoding',
      message: 'No compression detected',
      detail: 'Responses are not being compressed',
      recommendation: 'Enable gzip or Brotli compression for text-based content',
    });
  }

  // Check ETag for validation
  if (etag) {
    assessment.score += 15;
  } else {
    assessment.recommendations.push({
      header: 'etag',
      message: 'No ETag header present',
      detail: 'Clients cannot efficiently validate cached content',
      recommendation: 'Add ETag header for conditional requests',
    });
  }

  // Check Vary header for proper caching
  if (vary) {
    const varyHeaders = vary.toLowerCase().split(',').map(v => v.trim());
    if (varyHeaders.includes('accept-encoding')) {
      assessment.score += 15;
    } else {
      assessment.recommendations.push({
        header: 'vary',
        message: 'Vary header should include Accept-Encoding',
        detail: 'Ensures different compressed versions are cached separately',
        recommendation: 'Add Accept-Encoding to Vary header',
      });
    }
  }

  return assessment;
}

// Export the response builder for unit tests so we can assert the shape of the
// preview result (e.g. that rawTags is included for client-side diagnostics)
// without binding a port. The sitemap helpers are exported so the robots.txt
// auto-detection fallback can be unit-tested with a mock fetch (no network).
// The server only listens when run directly.
module.exports = {
  buildPreviewResult,
  parseRobotsSitemaps,
  looksLikeSitemapXml,
  resolveSitemapUrl,
};

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`VISTA running on port ${PORT}`);
  });
}
