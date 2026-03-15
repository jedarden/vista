'use strict';

const express = require('express');
const path = require('path');
const { fetchUrl, parseMetaTags, probeImage } = require('./fetcher');
const { detectMistakes } = require('./diagnostics');
const { scoreAll, PLATFORMS } = require('./scorer');
const { generateScreenshot, checkRateLimit, isValidPlatform } = require('./screenshot');
const { analyzeResponseHeaders } = require('./header-analyzer');
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
 * GET /api/badge?score=25&platforms=31&style=flat
 * Generate SVG badge showing platform score
 */
app.get('/api/badge', (req, res) => {
  const score = parseInt(req.query.score || '0', 10);
  const platforms = parseInt(req.query.platforms || '0', 10);
  const style = req.query.style || 'flat';

  // Validate style
  const validStyles = ['flat', 'flat-square', 'plastic', 'for-the-badge'];
  if (!validStyles.includes(style)) {
    return res.status(400).json({ error: `Invalid style. Must be one of: ${validStyles.join(', ')}` });
  }

  // Validate score range
  const clampedScore = Math.max(0, Math.min(100, score));
  const grade = getGradeForScore(clampedScore);
  const color = getGradeColor(grade);

  // Generate SVG
  const svg = generateBadgeSvg(clampedScore, platforms, style, color);

  // Set cache headers (1 hour)
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
  res.setHeader('X-RateLimit-Remaining', '999');

  res.send(svg);
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
      embedCode: generateEmbedCode(score, platformCount, baseUrl),
    });
  } catch (err) {
    console.error('Badge preview error:', err.message);
    res.status(502).json({ error: `Failed to fetch URL: ${err.message}` });
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

function generateEmbedCode(score, platforms, baseUrl) {
  // Note: baseUrl should be provided from the client side
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
