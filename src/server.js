'use strict';

const express = require('express');
const path = require('path');
const { fetchUrl, parseMetaTags, probeImage } = require('./fetcher');
const { detectMistakes } = require('./diagnostics');
const { scoreAll, PLATFORMS } = require('./scorer');

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

app.listen(PORT, () => {
  console.log(`VISTA running on port ${PORT}`);
});
