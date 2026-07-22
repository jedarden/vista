'use strict';

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { validateUrlOrThrow } = require('./ssrf-guard');

const USER_AGENT =
  'Mozilla/5.0 (compatible; VISTA/1.0; +https://github.com/vista-tool)';

const MAX_REDIRECTS = 10;
const FETCH_TIMEOUT_MS = 15000;
const MAX_BODY_BYTES = 1024 * 1024; // 1 MB read limit for HTML

/**
 * Fetch a URL following redirects manually so we can record each hop.
 * Returns { html, redirectChain, finalUrl, responseHeaders, statusCode }.
 *
 * ## Redirect Chain Structure
 * Each hop captures:
 * - url: The current URL
 * - statusCode: HTTP status code
 * - headers: Response headers as an object
 * - redirectsTo: For redirect hops (301/302/etc), the next URL
 * - warning: Warnings about redirect behavior (HTTP→HTTPS, 302 caching, etc)
 * - isFinal: Boolean flag for the final hop
 * - html: HTML response content (for all HTML responses, including 3xx redirects)
 * - metaTags: Array of all meta tags with name/content or property/content pairs
 * - meta: Critical meta tags (title, og:*, twitter:*, canonical, robots) for 200 HTML responses
 * - metaDiff: Diff from previous hop's meta (changed/added/removed fields, plus
 *   `stripped` when all meaningful meta tags are lost and `noindexRemoved` when
 *   a noindex directive disappears). Computed across consecutive HTML hops.
 * - metaError: Error message if meta parsing failed
 *
 * ## Redirect Resolver
 * The main while loop (hops < MAX_REDIRECTS) handles each redirect hop:
 * 1. Fetch with redirect:'manual' to intercept each hop
 * 2. Build hop object with url, statusCode, headers
 * 3. Parse meta tags for HTML responses (see HTML CAPTURE HOOK below)
 * 4. Check if redirect (301/302/etc) and either continue or finalize
 *
 * ## HTML/Meta Capture Hooks
 * HTML capture and meta tag parsing are implemented at two points:
 * - Primary hook: Lines 51-70 (during redirect loop, for HTML responses)
 * - Final response: Lines 119-126 (for final hop if not already captured)
 *
 * The capture flow:
 * - readBodyLimited() reads up to MAX_BODY_BYTES (1 MB)
 * - parseMetaTags() extracts all meta tags via cheerio and stores in metaTags array
 * - extractCriticalMetaTags() simplifies to critical fields for meta object
 * - calculateMetaDiff() compares with previous hop
 */
async function fetchUrl(url) {
  // SSRF protection: validate the initial URL
  await validateUrlOrThrow(url);

  const redirectChain = [];
  let currentUrl = url;
  let hops = 0;
  let lastResponse = null;
  // Track the previous HTML hop's critical meta + meaningful-tag count so we
  // can diff meta tags across consecutive hops (any status, not just 200→200).
  let lastCriticalMeta = null;
  let lastMeaningfulTagCount = 0;

  while (hops < MAX_REDIRECTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*;q=0.8' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');

    const hop = {
      url: currentUrl,
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
    };

    // ===== HTML/META CAPTURE HOOK (during redirect loop) =====
    // For HTML responses, capture body and parse meta tags.
    // This is the primary hook where HTML is read and meta tags are extracted.
    // The captured data is used for:
    // - Per-hop meta tag storage (hop.meta, hop.metaTags)
    // - Diff calculation between hops (hop.metaDiff)
    // - Social share preview analysis
    // - HTML content storage for each hop (hop.html)
    let hopMeta = null;
    let hopHtml = null; // save html so we don't read the body stream twice
    if (isHtml) {
      try {
        const buffer = await readBodyLimited(response, MAX_BODY_BYTES);
        hopHtml = buffer.toString('utf8');
        hopMeta = parseMetaTags(hopHtml, currentUrl);

        // Store all meta tags for this hop (for all HTML responses)
        hop.metaTags = hopMeta.rawTags || [];

        // Critical meta is computed for every HTML hop so we can diff across
        // consecutive hops; it is only *exposed* on the hop for 200 responses
        // (the downstream scoring/preview contract for `hop.meta`).
        const critical = extractCriticalMetaTags(hopMeta);
        const meaningfulCount = countMeaningfulMetaTags(hop.metaTags);
        if (response.status === 200) {
          hop.meta = critical;
        }

        // Diff vs the previous HTML hop (any status). This is what makes
        // meta-tag changes/stripping between redirect hops observable.
        if (lastCriticalMeta !== null) {
          hop.metaDiff = calculateMetaDiff(lastCriticalMeta, critical);
          // "All tags lost": previous hop had meaningful meta tags, this one
          // has none.
          if (lastMeaningfulTagCount > 0 && meaningfulCount === 0) {
            hop.metaDiff.stripped = true;
          }
        }
        lastCriticalMeta = critical;
        lastMeaningfulTagCount = meaningfulCount;
      } catch (e) {
        // If we fail to read body, continue without meta
        hop.metaError = e.message;
        hop.metaTags = [];
      }
    } else {
      // Ensure metaTags is initialized for non-HTML responses
      hop.metaTags = [];
    }

    const isRedirect = [301, 302, 303, 307, 308].includes(response.status);

    // For redirect responses, attempt to read body even if not explicitly text/html
    // Some redirects return HTML (error pages, "click here" messages) without proper Content-Type
    if (isRedirect && !hopHtml) {
      try {
        const buffer = await readBodyLimited(response, MAX_BODY_BYTES);
        hopHtml = buffer.toString('utf8');
      } catch (e) {
        // Failed to read body - leave hopHtml as null
      }
    }

    if (isRedirect) {
      const location = response.headers.get('location');
      if (!location) {
        hop.warning = 'Redirect with no Location header';
        hop.html = hopHtml;
        redirectChain.push(hop);
        break;
      }
      // Resolve relative redirects
      const nextUrl = new URL(location, currentUrl).toString();

      // SSRF protection: validate the redirect URL before following
      try {
        await validateUrlOrThrow(nextUrl);
      } catch (ssrfErr) {
        // Add a special error to the redirect chain and stop
        hop.warning = `Redirect blocked by SSRF protection: ${ssrfErr.message}`;
        hop.html = hopHtml;
        redirectChain.push(hop);
        throw new Error(`Redirect to ${nextUrl} blocked by SSRF protection: ${ssrfErr.message}`);
      }

      hop.redirectsTo = nextUrl;

      // Warn on HTTP → HTTPS upgrade
      if (currentUrl.startsWith('http://') && nextUrl.startsWith('https://')) {
        hop.warning = 'Redirect from HTTP to HTTPS — some platforms may not follow this';
      }
      if (response.status === 302) {
        hop.warning =
          (hop.warning ? hop.warning + '; ' : '') +
          '302 (temporary) redirect — platforms may cache the redirect URL instead of the final URL';
      }

      // Store HTML content for this redirect hop (will be undefined if no HTML)
      hop.html = hopHtml;

      redirectChain.push(hop);
      currentUrl = nextUrl;
      hops++;
      lastResponse = response;
      continue;
    }

    // Non-redirect response
    hop.isFinal = true;

    // Store HTML content for the final hop (will be undefined if no HTML)
    hop.html = hopHtml;

    redirectChain.push(hop);
    lastResponse = response;

    if (hops >= 5) {
      hop.warning = `Chain is ${hops + 1} hops deep — some platforms give up after 3`;
    }

    // Use already-read body if available, otherwise read now
    let html;
    if (hopHtml !== null) {
      html = hopHtml;
    } else {
      const buffer = await readBodyLimited(response, MAX_BODY_BYTES);
      html = buffer.toString('utf8');
    }

    // ===== HTML/META CAPTURE HOOK (final response) =====
    // For the final hop, parse meta tags if not already captured above.
    // This handles cases where:
    // - Final response is HTML but wasn't captured in the redirect loop
    // - Non-200 final responses that still have HTML
    if (!hopMeta && isHtml) {
      try {
        const finalMeta = parseMetaTags(html, currentUrl);
        hop.metaTags = finalMeta.rawTags || [];
        const critical = extractCriticalMetaTags(finalMeta);
        hop.meta = critical;
        const meaningfulCount = countMeaningfulMetaTags(hop.metaTags);
        if (lastCriticalMeta !== null) {
          hop.metaDiff = calculateMetaDiff(lastCriticalMeta, critical);
          if (lastMeaningfulTagCount > 0 && meaningfulCount === 0) {
            hop.metaDiff.stripped = true;
          }
        }
        lastCriticalMeta = critical;
        lastMeaningfulTagCount = meaningfulCount;
      } catch (e) {
        hop.metaError = e.message;
        hop.metaTags = [];
      }
    }

    // Ensure metaTags exists for all hops (including non-HTML)
    if (!hop.metaTags) {
      hop.metaTags = [];
    }

    return {
      html,
      redirectChain,
      finalUrl: currentUrl,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      statusCode: response.status,
    };
  }

  throw new Error(`Too many redirects (> ${MAX_REDIRECTS}) for ${url}`);
}

/**
 * Extract critical meta tags for redirect chain diff analysis.
 * Returns a simplified object with only the most important tags.
 */
function extractCriticalMetaTags(meta) {
  return {
    title: meta.title || null,
    description: meta.description || null,
    ogTitle: meta.og.title || null,
    ogDescription: meta.og.description || null,
    ogImage: meta.og.image || null,
    ogType: meta.og.type || null,
    ogUrl: meta.og.url || null,
    twitterCard: meta.twitter.card || null,
    twitterTitle: meta.twitter.title || null,
    twitterDescription: meta.twitter.description || null,
    twitterImage: meta.twitter.image || null,
    canonical: meta.canonical || null,
    robots: meta.robots || null,
  };
}

/**
 * Count "meaningful" meta tags — tags identified by a name or property that
 * carry content. Charset-only and empty tags are excluded. Used to detect when
 * a hop strips *all* meta tags relative to the previous hop.
 * @param {Array} metaTags - hop.metaTags (raw tag list from parseMetaTags)
 * @returns {number}
 */
function countMeaningfulMetaTags(metaTags) {
  if (!Array.isArray(metaTags)) return 0;
  let count = 0;
  for (const tag of metaTags) {
    const key = tag.name || tag.property;
    if (key && tag.content) count++;
  }
  return count;
}

/**
 * Calculate diff between two meta tag objects.
 * Returns an object showing which tags changed.
 *
 * Flags:
 *   - hasImageChange: an og:image / twitter:image value changed
 *   - stripped:       set by the caller when all meaningful tags are lost
 *   - noindexRemoved: a robots noindex directive was present before and is
 *                     gone now (the page became indexable) — high-signal change
 */
function calculateMetaDiff(prevMeta, currentMeta) {
  const diff = {
    changed: [],
    added: [],
    removed: [],
  };

  const criticalFields = [
    'title', 'description',
    'ogTitle', 'ogDescription', 'ogImage', 'ogType', 'ogUrl',
    'twitterCard', 'twitterTitle', 'twitterDescription', 'twitterImage',
    'canonical', 'robots',
  ];

  for (const field of criticalFields) {
    const prevVal = prevMeta[field];
    const currVal = currentMeta[field];

    if (prevVal && !currVal) {
      diff.removed.push({ field, value: prevVal });
    } else if (!prevVal && currVal) {
      diff.added.push({ field, value: currVal });
    } else if (prevVal && currVal && prevVal !== currVal) {
      diff.changed.push({ field, from: prevVal, to: currVal });
    }
  }

  // Check for critical image changes
  const imageChange = diff.changed.find(c => c.field === 'ogImage' || c.field === 'twitterImage');
  if (imageChange) {
    diff.hasImageChange = true;
  }

  // noindex removal: the previous hop blocked indexing, the current one does not.
  const prevNoindex = /\bnoindex\b/i.test(prevMeta.robots || '');
  const currNoindex = /\bnoindex\b/i.test(currentMeta.robots || '');
  if (prevNoindex && !currNoindex) {
    diff.noindexRemoved = true;
  }

  return diff;
}

/**
 * Read body up to maxBytes, return Buffer.
 */
async function readBodyLimited(response, maxBytes) {
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    chunks.push(chunk);
    total += chunk.length;
    if (total >= maxBytes) break;
  }
  return Buffer.concat(chunks);
}

/**
 * Parse meta tags from HTML string.
 * Returns a structured metadata object.
 */
function parseMetaTags(html, baseUrl) {
  const $ = cheerio.load(html);

  const meta = {
    title: null,
    description: null,
    og: {},
    twitter: {},
    jsonLd: [],
    favicon: null,
    themeColor: null,
    robots: null,
    // raw list for diagnostics
    rawTags: [],
  };

  // <title>
  meta.title = $('head title').first().text().trim() || null;

  // <meta name="description">
  meta.description =
    $('meta[name="description"]').attr('content')?.trim() || null;

  // <meta name="robots">
  meta.robots = $('meta[name="robots"]').attr('content')?.trim() || null;

  // <meta name="theme-color">
  meta.themeColor = $('meta[name="theme-color"]').attr('content')?.trim() || null;

  // Favicon
  const faviconHref =
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    '/favicon.ico';
  meta.favicon = resolveUrl(faviconHref, baseUrl);

  // Collect ALL meta tags for diagnostics
  $('meta').each((i, el) => {
    const tag = {
      index: i,
      name: $(el).attr('name') || null,
      property: $(el).attr('property') || null,
      content: $(el).attr('content') || null,
      httpEquiv: $(el).attr('http-equiv') || null,
      charset: $(el).attr('charset') || null,
      // Store raw HTML for comparison with rendered DOM
      rawHtml: $.html(el),
    };
    meta.rawTags.push(tag);

    const prop = tag.property?.toLowerCase();
    const name = tag.name?.toLowerCase();
    const content = tag.content;

    if (!content && !tag.charset) return;

    // Open Graph
    if (prop?.startsWith('og:')) {
      const key = prop.slice(3);
      if (!meta.og[key]) {
        meta.og[key] = content;
      }
      // Store array for duplicates
      if (!meta.og[`_all_${key}`]) meta.og[`_all_${key}`] = [];
      meta.og[`_all_${key}`].push(content);
    }

    // Twitter Card
    if (name?.startsWith('twitter:') || prop?.startsWith('twitter:')) {
      const key = (name || prop).slice(8);
      if (key === 'image') {
        // X picks up the LAST twitter:image tag
        meta.twitter[key] = content;
      } else if (!meta.twitter[key]) {
        meta.twitter[key] = content;
      }
    }
  });

  // Resolve OG image URL
  if (meta.og.image) {
    meta.og.image = resolveUrl(meta.og.image, baseUrl);
  }
  if (meta.twitter.image) {
    meta.twitter.image = resolveUrl(meta.twitter.image, baseUrl);
  }

  // JSON-LD
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const json = JSON.parse($(el).html());
      meta.jsonLd.push(json);
    } catch (_) {
      // ignore malformed JSON-LD
    }
  });

  return meta;
}

function resolveUrl(href, baseUrl) {
  if (!href) return null;
  try {
    return new URL(href, baseUrl).toString();
  } catch (_) {
    return href;
  }
}

/**
 * Probe image dimensions via HTTP HEAD then partial GET.
 * Returns { width, height, contentType, contentLength, responseTime, error }.
 */
async function probeImage(imageUrl) {
  const start = Date.now();

  // SSRF protection: validate the image URL before issuing any request.
  // og:image / twitter:image come from the fetched page's content and are
  // attacker-controlled, so they must be validated exactly like page URLs.
  // Both the HEAD fetch and the probe-image-size GET below use this same
  // URL, so validating once here guards both egress requests. On rejection
  // we return a graceful "blocked" result instead of throwing — probeImage
  // failures are non-fatal to the caller, and we must not let an SSRF
  // attempt silently proceed or crash the surrounding request.
  try {
    await validateUrlOrThrow(imageUrl);
  } catch (ssrfErr) {
    return {
      url: imageUrl,
      blocked: true,
      error: `Image URL blocked by SSRF protection: ${ssrfErr.message}`,
      responseTime: Date.now() - start,
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    let response;
    try {
      response = await fetch(imageUrl, {
        method: 'HEAD',
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
        redirect: 'follow',
      });
    } finally {
      clearTimeout(timer);
    }

    const responseTime = Date.now() - start;
    const contentType = response.headers.get('content-type') || null;
    const contentLengthStr = response.headers.get('content-length');
    const contentLength = contentLengthStr ? parseInt(contentLengthStr, 10) : null;
    const corsHeader = response.headers.get('access-control-allow-origin') || null;

    // Try to get dimensions via probe-image-size (partial GET)
    let width = null;
    let height = null;
    try {
      const probe = require('probe-image-size');
      const result = await probe(imageUrl, {
        timeout: 5000,
        headers: { 'User-Agent': USER_AGENT },
      });
      width = result.width;
      height = result.height;
    } catch (_) {
      // non-fatal: dimensions just won't be available
    }

    return {
      url: imageUrl,
      width,
      height,
      contentType,
      contentLength,
      responseTime,
      cors: corsHeader,
      statusCode: response.status,
    };
  } catch (err) {
    return {
      url: imageUrl,
      error: err.message,
      responseTime: Date.now() - start,
    };
  }
}

/**
 * Fetch meta tags from rendered DOM (after JS execution).
 * Uses Playwright to render the page and extract meta tags.
 * Returns the same structure as parseMetaTags() for comparison.
 */
async function fetchRenderedMetaTags(url, options = {}) {
  const { chromium } = require('playwright');
  const timeout = options.timeout || 10000;

  let browser = null;
  try {
    browser = await chromium.launch({
      headless: true,
    });

    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 720 },
    });

    const page = await context.newPage();

    // Set navigation timeout
    page.setDefaultTimeout(timeout);

    // Navigate to URL and wait for network idle to ensure JS has executed
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

    // Wait a bit more for dynamic content to load
    await page.waitForTimeout(1000);

    // Extract meta tags from rendered DOM
    const renderedMeta = await page.evaluate(() => {
      const meta = {
        title: null,
        description: null,
        og: {},
        twitter: {},
        rawTags: [],
      };

      // Get title
      meta.title = document.querySelector('head title')?.textContent?.trim() || null;

      // Get description
      const descMeta = document.querySelector('meta[name="description"]');
      meta.description = descMeta?.getAttribute('content')?.trim() || null;

      // Get all meta tags
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach((el, i) => {
        const tag = {
          index: i,
          name: el.getAttribute('name') || null,
          property: el.getAttribute('property') || null,
          content: el.getAttribute('content') || null,
          httpEquiv: el.getAttribute('http-equiv') || null,
          charset: el.getAttribute('charset') || null,
          // Store raw HTML for comparison with source HTML
          rawHtml: el.outerHTML,
        };
        meta.rawTags.push(tag);

        const prop = tag.property?.toLowerCase();
        const name = tag.name?.toLowerCase();
        const content = tag.content;

        if (!content && !tag.charset) return;

        // Open Graph
        if (prop?.startsWith('og:')) {
          const key = prop.slice(3);
          if (!meta.og[key]) {
            meta.og[key] = content;
          }
          if (!meta.og[`_all_${key}`]) meta.og[`_all_${key}`] = [];
          meta.og[`_all_${key}`].push(content);
        }

        // Twitter Card
        if (name?.startsWith('twitter:') || prop?.startsWith('twitter:')) {
          const key = (name || prop).slice(8);
          if (key === 'image') {
            meta.twitter[key] = content;
          } else if (!meta.twitter[key]) {
            meta.twitter[key] = content;
          }
        }
      });

      return meta;
    });

    await context.close();
    return renderedMeta;
  } catch (err) {
    throw new Error(`Failed to fetch rendered meta tags: ${err.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { fetchUrl, parseMetaTags, probeImage, resolveUrl, extractCriticalMetaTags, calculateMetaDiff, countMeaningfulMetaTags, fetchRenderedMetaTags };
