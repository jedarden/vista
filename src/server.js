'use strict';

const express = require('express');
const path = require('path');
const { fetchUrl, parseMetaTags, probeImage } = require('./fetcher');
const { detectMistakes } = require('./diagnostics');
const { scoreAll, PLATFORMS } = require('./scorer');
const { generateScreenshot, checkRateLimit, isValidPlatform } = require('./screenshot');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

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

/**
 * GET /api/preview?url=https://...
 * POST /api/preview with Content-Type: text/html body (and optional ?base=https://...)
 */
app.get('/api/preview', async (req, res) => {
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

    res.json(result);
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(502).json({ error: `Failed to fetch URL: ${err.message}` });
  }
});

app.post('/api/preview', async (req, res) => {
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
  res.json({ platforms: PLATFORMS });
});

/**
 * GET /api/sitemap?url=https://...sitemap.xml
 * Parse sitemap and return all URLs with coverage scores
 */
app.get('/api/sitemap', async (req, res) => {
  const sitemapUrl = req.query.url;
  if (!sitemapUrl) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  // Validate URL
  try {
    const parsed = new URL(sitemapUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Only http and https URLs are supported' });
    }
  } catch (_) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    // Fetch sitemap
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      const fetch = require('node-fetch');
      response = await fetch(sitemapUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VISTA/1.0; +https://github.com/vista-tool)', Accept: 'application/xml,text/xml,*/*' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      return res.status(502).json({ error: `Failed to fetch sitemap: ${response.status} ${response.statusText}` });
    }

    const xml = await response.text();

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
 * POST /api/screenshot — Generate PNG screenshot of a platform card
 */
app.post('/api/screenshot', async (req, res) => {
  const { platform, url, meta, imageProbe, withFrame = false, format = 'svg' } = req.body;

  // Rate limiting
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const rateLimit = checkRateLimit(clientIp, 30);
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
      return res.status(502).json({ error: `Failed to fetch URL: ${err.message}` });
    }
  }

  if (!finalMeta) {
    return res.status(400).json({ error: 'Missing metadata. Provide either meta object or url.' });
  }

  try {
    // Generate screenshot
    const screenshot = generateScreenshot(
      platform,
      finalMeta,
      finalImageProbe,
      finalUrl || url,
      { withFrame, format }
    );

    // Set response headers
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());

    if (format === 'png') {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${platform}-card.png"`);
    } else {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${platform}-card.svg"`);
    }

    res.send(screenshot.buffer);
  } catch (err) {
    console.error('Screenshot generation error:', err.message);
    res.status(500).json({ error: `Failed to generate screenshot: ${err.message}` });
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

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

app.listen(PORT, () => {
  console.log(`VISTA running on port ${PORT}`);
});
