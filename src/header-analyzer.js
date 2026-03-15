'use strict';

/**
 * Analyze HTTP response headers for potential issues related to social sharing.
 *
 * @param {Object} headers - Response headers object
 * @param {Object} imageProbe - Image probe result from probeImage()
 * @param {Object} meta - Parsed meta tags
 * @returns {Object} Header analysis with issues and recommendations
 */
function analyzeResponseHeaders(headers, imageProbe, meta) {
  const analysis = {
    headers: extractKeyHeaders(headers),
    issues: [],
    recommendations: [],
    imageHeaders: imageProbe ? extractImageHeaders(imageProbe) : null,
  };

  // Analyze CORS on og:image
  if (imageProbe) {
    const corsHeader = imageProbe.cors;
    const imageUrl = imageProbe.url;

    if (!corsHeader) {
      analysis.issues.push({
        severity: 'warning',
        code: 'MISSING_IMAGE_CORS',
        header: 'access-control-allow-origin',
        message: 'og:image URL is missing CORS headers',
        detail: 'Some platforms (like Facebook) may fail to display your image when shared.',
        recommendation: 'Add Access-Control-Allow-Origin: * to image responses',
        affectedPlatforms: ['Facebook', 'LinkedIn', 'Slack', 'Discord'],
      });
    } else if (corsHeader !== '*') {
      analysis.issues.push({
        severity: 'info',
        code: 'RESTRICTED_IMAGE_CORS',
        header: 'access-control-allow-origin',
        message: 'og:image URL has restricted CORS',
        detail: `CORS is set to "${corsHeader}" instead of "*"`,
        recommendation: 'Consider setting Access-Control-Allow-Origin: * for public images',
        affectedPlatforms: ['Facebook', 'LinkedIn', 'Slack', 'Discord'],
      });
    }
  }

  // Analyze CSP
  const csp = headers['content-security-policy'];
  if (csp) {
    const cspIssues = analyzeCSP(csp, meta);
    analysis.issues.push(...cspIssues.issues);
    analysis.recommendations.push(...cspIssues.recommendations);
  }

  // Analyze Cache-Control
  const cacheControl = headers['cache-control'];
  if (cacheControl) {
    const cacheIssues = analyzeCacheControl(cacheControl);
    analysis.issues.push(...cacheIssues.issues);
    analysis.recommendations.push(...cacheIssues.recommendations);
  }

  // Check Content-Type
  const contentType = headers['content-type'];
  if (contentType) {
    if (!contentType.includes('text/html')) {
      analysis.issues.push({
        severity: 'warning',
        code: 'NON_HTML_CONTENT_TYPE',
        header: 'content-type',
        message: `Content-Type is "${contentType.split(';')[0].trim()}"`,
        detail: 'Some platforms may not correctly parse meta tags from non-HTML responses.',
        recommendation: 'Ensure the page returns Content-Type: text/html',
        affectedPlatforms: ['Google', 'Facebook', 'Twitter'],
      });
    }
  } else {
    analysis.issues.push({
      severity: 'info',
      code: 'MISSING_CONTENT_TYPE',
      header: 'content-type',
      message: 'Content-Type header is missing',
      detail: 'Browsers may still render the page, but platforms expect explicit HTML content type.',
      recommendation: 'Add Content-Type: text/html; charset=utf-8',
      affectedPlatforms: ['All'],
    });
  }

  // Check for X-Frame-Options or frame-ancestors in CSP
  const xFrameOptions = headers['x-frame-options'];
  if (xFrameOptions && csp) {
    if (xFrameOptions === 'DENY' || xFrameOptions === 'SAMEORIGIN') {
      analysis.recommendations.push({
        code: 'DUPLICATE_FRAME_PROTECTION',
        message: 'Both X-Frame-Options and CSP frame-ancestors are set',
        detail: 'X-Frame-Options is deprecated; CSP frame-ancestors is preferred.',
        recommendation: 'Remove X-Frame-Options header and rely only on CSP frame-ancestors',
      });
    }
  }

  // Check Server header for information disclosure
  const serverHeader = headers['server'];
  if (serverHeader && serverHeader.length > 30) {
    analysis.recommendations.push({
      code: 'VERBOSE_SERVER_HEADER',
      message: 'Server header exposes detailed version information',
      detail: `Server: "${serverHeader}"`,
      recommendation: 'Consider minimizing server header to avoid information disclosure',
    });
  }

  return analysis;
}

/**
 * Extract key headers that are relevant for social sharing analysis.
 */
function extractKeyHeaders(headers) {
  const keyHeaders = [
    'content-type',
    'content-security-policy',
    'x-frame-options',
    'x-content-type-options',
    'cache-control',
    'expires',
    'etag',
    'last-modified',
    'server',
    'access-control-allow-origin',
    'access-control-allow-headers',
    'access-control-expose-headers',
    'strict-transport-security',
    'x-xss-protection',
  ];

  const extracted = {};
  for (const key of keyHeaders) {
    if (headers[key]) {
      extracted[key] = headers[key];
    }
  }

  return extracted;
}

/**
 * Extract headers from image probe result.
 */
function extractImageHeaders(imageProbe) {
  const headers = {
    url: imageProbe.url,
    statusCode: imageProbe.statusCode,
    contentType: imageProbe.contentType,
    contentLength: imageProbe.contentLength,
    cors: imageProbe.cors,
  };
  return headers;
}

/**
 * Analyze Content-Security-Policy for potential issues with social sharing.
 */
function analyzeCSP(csp, meta) {
  const issues = [];
  const recommendations = [];

  // Parse CSP directives
  const directives = parseCSP(csp);

  // Check img-src directive
  const imgSrc = directives['img-src'] || directives['default-src'];
  if (imgSrc) {
    const ogImage = meta.og?.image || meta.twitter?.image;
    if (ogImage) {
      try {
        const imageUrl = new URL(ogImage);
        const imageOrigin = imageUrl.origin;

        // Check if the image origin is allowed
        const isNone = imgSrc.includes("'none'");
        const isSelf = imgSrc.includes("'self'");
        const hasWildCard = imgSrc.includes('*') || imgSrc.includes('data:') || imgSrc.includes('blob:');

        if (isNone) {
          issues.push({
            severity: 'error',
            code: 'CSP_IMG_SRC_NONE',
            header: 'content-security-policy',
            message: "CSP img-src is set to 'none'",
            detail: 'Platforms will not be able to load your og:image.',
            recommendation: "Set img-src to allow your image domain or use 'self' if hosted on same origin",
            affectedPlatforms: ['All'],
          });
        } else if (isSelf && !isImageSameOrigin(ogImage, meta)) {
          recommendations.push({
            code: 'CSP_IMG_SRC_SELF_CHECK',
            message: 'CSP img-src is set to self-only',
            detail: 'Verify your og:image is hosted on the same origin as the page.',
            recommendation: 'If image is on CDN, add CDN domain to img-src directive',
          });
        }
      } catch (e) {
        // Invalid URL, skip analysis
      }
    }
  }

  // Check for overly restrictive frame-ancestors
  const frameAncestors = directives['frame-ancestors'];
  if (frameAncestors) {
    const isNone = frameAncestors.includes("'none'");
    if (isNone) {
      recommendations.push({
        code: 'CSP_FRAME_ANCESTORS_NONE',
        message: 'CSP frame-ancestors is set to none',
        detail: 'This prevents embedding in any iframe. Most social platforms fetch pages directly, so this is usually fine.',
        recommendation: 'No action needed unless you want to allow embedding',
      });
    }
  }

  // Check for missing upgrade-insecure-requests
  if (!directives['upgrade-insecure-requests']) {
    recommendations.push({
      code: 'CSP_MISSING_UPGRADE',
      message: 'CSP missing upgrade-insecure-requests',
      detail: 'This directive helps ensure all content is loaded over HTTPS.',
      recommendation: 'Add upgrade-insecure-requests to CSP for better security',
    });
  }

  return { issues, recommendations };
}

/**
 * Parse CSP string into directives object.
 */
function parseCSP(csp) {
  const directives = {};
  const parts = csp.split(';');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const spaceIndex = trimmed.indexOf(' ');
    if (spaceIndex === -1) {
      directives[trimmed] = '';
    } else {
      const name = trimmed.slice(0, spaceIndex).trim();
      const value = trimmed.slice(spaceIndex + 1).trim();
      directives[name] = value;
    }
  }

  return directives;
}

/**
 * Check if image URL is same origin as the page.
 */
function isImageSameOrigin(imageUrl, meta) {
  // This is a simplified check - in practice we'd need the page URL
  // For now, we'll skip this complex check
  return false;
}

/**
 * Analyze Cache-Control for social sharing implications.
 */
function analyzeCacheControl(cacheControl) {
  const issues = [];
  const recommendations = [];

  const directives = cacheControl.toLowerCase().split(',').map(d => d.trim());
  const hasNoCache = directives.includes('no-cache');
  const hasNoStore = directives.includes('no-store');
  const hasPrivate = directives.includes('private');
  const hasMaxAge = directives.find(d => d.startsWith('max-age='));

  if (hasNoStore) {
    issues.push({
      severity: 'warning',
      code: 'CACHE_NOSTORE',
      header: 'cache-control',
      message: 'Cache-Control includes no-store directive',
      detail: 'Some platforms and CDNs may not cache your content, affecting performance.',
      recommendation: 'Consider removing no-store unless content is highly sensitive',
      affectedPlatforms: ['CDNs', 'Some crawlers'],
    });
  } else if (hasNoCache) {
    recommendations.push({
      code: 'CACHE_NOCACHE',
      message: 'Cache-Control includes no-cache directive',
      detail: 'This requires revalidation before using cached content.',
      recommendation: 'For public content, consider using max-age with a reasonable TTL instead',
    });
  }

  if (hasPrivate) {
    recommendations.push({
      code: 'CACHE_PRIVATE',
      message: 'Cache-Control is set to private',
      detail: 'Shared caches (CDNs, proxies) will not store your content.',
      recommendation: 'For public content, use public or omit the directive',
    });
  }

  if (!hasMaxAge && !hasNoStore) {
    recommendations.push({
      code: 'CACHE_NO_MAX_AGE',
      message: 'Cache-Control missing max-age directive',
      detail: 'Without max-age, browsers may use heuristic caching which can be inconsistent.',
      recommendation: 'Add max-age=3600 or similar for better cache control',
    });
  }

  // Check for very short max-age
  if (hasMaxAge) {
    const match = hasMaxAge.match(/max-age=(\d+)/);
    if (match) {
      const maxAge = parseInt(match[1], 10);
      if (maxAge < 60) {
        recommendations.push({
          code: 'CACHE_SHORT_MAX_AGE',
          message: `Cache-Control max-age is very short (${maxAge}s)`,
          detail: 'Very short cache times increase server load.',
          recommendation: 'Consider a longer max-age (e.g., 3600s for 1 hour) for public content',
        });
      }
    }
  }

  return { issues, recommendations };
}

module.exports = {
  analyzeResponseHeaders,
  extractKeyHeaders,
  analyzeCSP,
  analyzeCacheControl,
};
