'use strict';

const fetch = require('node-fetch');
const cheerio = require('cheerio');

const USER_AGENT =
  'Mozilla/5.0 (compatible; VISTA/1.0; +https://github.com/vista-tool)';

const MAX_REDIRECTS = 10;
const FETCH_TIMEOUT_MS = 15000;
const MAX_BODY_BYTES = 1024 * 1024; // 1 MB read limit for HTML

/**
 * Fetch a URL following redirects manually so we can record each hop.
 * Returns { html, redirectChain, finalUrl, responseHeaders, statusCode }.
 *
 * Redirect chain now includes per-hop metadata for meta tag diff analysis.
 */
async function fetchUrl(url) {
  const redirectChain = [];
  let currentUrl = url;
  let hops = 0;
  let lastResponse = null;
  let lastMeta = null; // Track previous hop's meta tags for diff

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

    // Try to parse meta tags for this hop (for redirect analysis)
    let hopMeta = null;
    let hopHtml = null; // save html so we don't read the body stream twice
    if (isHtml && response.status === 200) {
      try {
        const buffer = await readBodyLimited(response, MAX_BODY_BYTES);
        hopHtml = buffer.toString('utf8');
        hopMeta = parseMetaTags(hopHtml, currentUrl);
        hop.meta = extractCriticalMetaTags(hopMeta);

        // Calculate diff from previous hop
        if (lastMeta) {
          hop.metaDiff = calculateMetaDiff(lastMeta, hop.meta);
        }
        lastMeta = hop.meta;
      } catch (e) {
        // If we fail to read body, continue without meta
        hop.metaError = e.message;
      }
    }

    const isRedirect = [301, 302, 303, 307, 308].includes(response.status);
    if (isRedirect) {
      const location = response.headers.get('location');
      if (!location) {
        hop.warning = 'Redirect with no Location header';
        redirectChain.push(hop);
        break;
      }
      // Resolve relative redirects
      const nextUrl = new URL(location, currentUrl).toString();
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

      redirectChain.push(hop);
      currentUrl = nextUrl;
      hops++;
      lastResponse = response;
      continue;
    }

    // Non-redirect response
    hop.isFinal = true;
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

    // Parse final meta tags if not already done
    if (!hopMeta && isHtml) {
      const finalMeta = parseMetaTags(html, currentUrl);
      hop.meta = extractCriticalMetaTags(finalMeta);
      if (lastMeta) {
        hop.metaDiff = calculateMetaDiff(lastMeta, hop.meta);
      }
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
  };
}

/**
 * Calculate diff between two meta tag objects.
 * Returns an object showing which tags changed.
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
    'canonical'
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

module.exports = { fetchUrl, parseMetaTags, probeImage, resolveUrl, extractCriticalMetaTags, calculateMetaDiff };
