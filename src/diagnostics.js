'use strict';

/**
 * Common mistakes detector.
 * Runs structural checks on the fetched HTML and extracted metadata.
 * Returns an array of diagnostic findings: { severity, code, message, fix, platforms }.
 */
function detectMistakes(html, meta, imageProbe, responseHeaders, redirectChain) {
  const findings = [];

  // ── Wrong attribute (name= instead of property= for OG tags) ──
  const wrongAttrRegex = /<meta\s+name=["'](og:[^"']+)["']/gi;
  let m;
  while ((m = wrongAttrRegex.exec(html)) !== null) {
    findings.push({
      severity: 'error',
      code: 'og-wrong-attribute',
      message: `\`<meta name="${m[1]}">\` should use \`property\` not \`name\` for Open Graph tags`,
      fix: `Change to: <meta property="${m[1]}" content="...">`,
      platforms: 'All platforms',
    });
  }

  // ── Relative image URLs ──
  const rawOgImage = getRawAttributeValue(html, 'og:image');
  if (rawOgImage && !rawOgImage.match(/^https?:\/\//i)) {
    findings.push({
      severity: 'error',
      code: 'relative-image-url',
      message: `\`og:image\` uses a relative URL ("${rawOgImage}") — no platform resolves relative URLs`,
      fix: 'Use a full absolute URL: https://example.com/image.jpg',
      platforms: 'All platforms',
    });
  }

  // ── HTTP (non-HTTPS) image URLs ──
  if (meta.og.image && meta.og.image.startsWith('http://')) {
    findings.push({
      severity: 'error',
      code: 'http-image-url',
      message: `\`og:image\` uses HTTP ("${meta.og.image}") — WhatsApp, Signal, and others silently ignore non-HTTPS images`,
      fix: 'Serve your image over HTTPS',
      platforms: 'WhatsApp, Signal, iMessage, LinkedIn',
    });
  }

  // ── Tags past 32 KB (Slack) ──
  const firstOgPos = html.indexOf('og:');
  const htmlBytes = Buffer.byteLength(html, 'utf8');
  if (firstOgPos !== -1) {
    const ogByteOffset = Buffer.byteLength(html.slice(0, firstOgPos), 'utf8');
    if (ogByteOffset > 32 * 1024) {
      findings.push({
        severity: 'error',
        code: 'tags-past-32kb',
        message: 'Open Graph tags appear after the 32 KB mark — Slack only reads the first 32 KB of HTML',
        fix: 'Move <meta> tags to the <head> section, before any large scripts or style blocks',
        platforms: 'Slack',
      });
    }
  }

  // ── Tags past 750 KB ──
  if (htmlBytes > 750 * 1024 && firstOgPos !== -1) {
    const ogByteOffset = Buffer.byteLength(html.slice(0, firstOgPos), 'utf8');
    if (ogByteOffset > 750 * 1024) {
      findings.push({
        severity: 'warning',
        code: 'tags-past-750kb',
        message: 'Open Graph tags appear after the 750 KB mark — Google Chat and Gmail stop reading after 750 KB',
        fix: 'Move <meta> tags to the top of <head>',
        platforms: 'Google Chat, Gmail',
      });
    }
  }

  // ── Duplicate OG tags ──
  for (const key of ['title', 'description', 'image', 'url']) {
    const allValues = meta.og[`_all_${key}`];
    if (allValues && allValues.length > 1) {
      const unique = [...new Set(allValues)];
      if (unique.length > 1) {
        findings.push({
          severity: 'warning',
          code: `duplicate-og-${key}`,
          message: `Multiple \`og:${key}\` tags with different values: ${unique.map(v => `"${v}"`).join(', ')}`,
          fix: 'Keep only one og:' + key + ' tag. Platforms vary on which value they use (first vs. last).',
          platforms: 'All platforms',
        });
      }
    }
  }

  // ── Missing protocol in og:url ──
  if (meta.og.url && !meta.og.url.match(/^https?:\/\//i)) {
    findings.push({
      severity: 'warning',
      code: 'og-url-missing-protocol',
      message: `\`og:url\` is missing the protocol ("${meta.og.url}") — use a full absolute URL`,
      fix: `Change to: https://${meta.og.url}`,
      platforms: 'All platforms',
    });
  }

  // ── Empty og tags ──
  const emptyTagRegex = /<meta\s+property=["'](og:[^"']+)["']\s+content=["']["']/gi;
  let e;
  while ((e = emptyTagRegex.exec(html)) !== null) {
    findings.push({
      severity: 'warning',
      code: 'empty-og-tag',
      message: `\`${e[1]}\` has an empty content attribute — worse than missing; some platforms treat it as "no value" instead of falling back`,
      fix: `Either remove the tag or set a meaningful value`,
      platforms: 'All platforms',
    });
  }

  // ── Missing twitter:card ──
  if (!meta.twitter.card) {
    findings.push({
      severity: 'warning',
      code: 'missing-twitter-card',
      message: '`twitter:card` is missing — X/Twitter will use default "summary" card type',
      fix: `Add: <meta name="twitter:card" content="${meta.og.image ? 'summary_large_image' : 'summary'}" />`,
      platforms: 'X (Twitter)',
    });
  }

  // ── Missing og:image ──
  if (!meta.og.image) {
    findings.push({
      severity: 'error',
      code: 'missing-og-image',
      message: '`og:image` is missing — most platforms will not show a preview image',
      fix: 'Add: <meta property="og:image" content="https://example.com/image.jpg" />',
      platforms: 'Facebook, X, LinkedIn, Slack, Discord, WhatsApp, Telegram, and more',
    });
  }

  // ── Missing og:title ──
  if (!meta.og.title && !meta.title) {
    findings.push({
      severity: 'error',
      code: 'missing-title',
      message: 'No title found — neither `og:title` nor `<title>` tag',
      fix: 'Add: <title>Your Page Title</title> and <meta property="og:title" content="Your Page Title" />',
      platforms: 'All platforms',
    });
  }

  // ── Image probe diagnostics ──
  if (imageProbe && !imageProbe.error) {
    if (imageProbe.responseTime > 3000) {
      findings.push({
        severity: 'warning',
        code: 'image-slow',
        message: `OG image took ${imageProbe.responseTime}ms to respond — some platforms time out at 3 seconds`,
        fix: 'Serve your image from a CDN or optimize your server response time',
        platforms: 'Multiple platforms',
      });
    }

    if (imageProbe.contentLength && imageProbe.contentLength > 8 * 1024 * 1024) {
      findings.push({
        severity: 'error',
        code: 'image-too-large-facebook',
        message: `OG image is ${(imageProbe.contentLength / 1024 / 1024).toFixed(1)} MB — exceeds Facebook's 8 MB limit`,
        fix: 'Compress or resize the image to under 1 MB for best cross-platform support',
        platforms: 'Facebook',
      });
    } else if (imageProbe.contentLength && imageProbe.contentLength > 5 * 1024 * 1024) {
      findings.push({
        severity: 'error',
        code: 'image-too-large-twitter',
        message: `OG image is ${(imageProbe.contentLength / 1024 / 1024).toFixed(1)} MB — exceeds X/Twitter's 5 MB limit`,
        fix: 'Compress the image to under 1 MB for best cross-platform support',
        platforms: 'X (Twitter), Telegram',
      });
    } else if (imageProbe.contentLength && imageProbe.contentLength > 300 * 1024) {
      findings.push({
        severity: 'warning',
        code: 'image-too-large-whatsapp',
        message: `OG image is ${(imageProbe.contentLength / 1024).toFixed(0)} KB — exceeds WhatsApp's ~300 KB recommendation`,
        fix: 'Compress the image to under 300 KB for WhatsApp and Line compatibility',
        platforms: 'WhatsApp, Line',
      });
    }

    if (imageProbe.width && imageProbe.height) {
      if (imageProbe.width < 200 || imageProbe.height < 200) {
        findings.push({
          severity: 'error',
          code: 'image-too-small',
          message: `OG image is ${imageProbe.width}×${imageProbe.height}px — below the 200×200px minimum for Facebook`,
          fix: 'Use an image of at least 1200×630px for best results across all platforms',
          platforms: 'Facebook, Reddit, LinkedIn',
        });
      } else if (imageProbe.width < 600 || imageProbe.height < 315) {
        findings.push({
          severity: 'warning',
          code: 'image-suboptimal-size',
          message: `OG image is ${imageProbe.width}×${imageProbe.height}px — below the recommended 1200×630px`,
          fix: 'Use 1200×630px for best results across all platforms',
          platforms: 'Multiple platforms',
        });
      }
    }

    const ct = imageProbe.contentType;
    if (ct && !ct.match(/image\/(jpeg|jpg|png|webp|gif)/i)) {
      findings.push({
        severity: 'warning',
        code: 'image-wrong-type',
        message: `OG image has unexpected Content-Type: "${ct}"`,
        fix: 'Ensure the image is served as image/jpeg or image/png',
        platforms: 'Multiple platforms',
      });
    }
  }

  // ── Response header checks ──
  if (responseHeaders) {
    const ct = responseHeaders['content-type'] || '';
    if (!ct.includes('text/html')) {
      findings.push({
        severity: 'warning',
        code: 'wrong-content-type',
        message: `Page Content-Type is "${ct}" — some crawlers skip non-HTML responses`,
        fix: 'Ensure the page is served with Content-Type: text/html',
        platforms: 'Multiple platforms',
      });
    }

    const cacheControl = responseHeaders['cache-control'];
    if (cacheControl) {
      if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
        findings.push({
          severity: 'info',
          code: 'cache-control-no-cache',
          message: `Cache-Control: "${cacheControl}" — platforms will re-fetch frequently, which may cause stale previews or slower unfurling`,
          fix: 'Consider setting a longer cache TTL for social crawlers',
          platforms: 'All caching platforms',
        });
      }
    }

    const xframe = responseHeaders['x-frame-options'];
    if (xframe && (xframe === 'DENY' || xframe === 'SAMEORIGIN')) {
      findings.push({
        severity: 'info',
        code: 'x-frame-options',
        message: `X-Frame-Options: "${xframe}" — some platforms may not render interactive iframe previews`,
        fix: 'This is generally fine for social card previews (which use metadata, not iframes)',
        platforms: 'Interactive embed platforms',
      });
    }
  }

  // ── Redirect chain warnings ──
  if (redirectChain && redirectChain.length > 1) {
    const finalHop = redirectChain[redirectChain.length - 1];
    const hops = redirectChain.length;
    if (hops > 3) {
      findings.push({
        severity: 'warning',
        code: 'redirect-chain-long',
        message: `URL has ${hops - 1} redirect(s) — some platforms give up after 3 hops`,
        fix: 'Reduce redirect chain length or use direct canonical URLs',
        platforms: 'Multiple platforms',
      });
    }
    for (const hop of redirectChain) {
      if (hop.warning) {
        findings.push({
          severity: 'warning',
          code: 'redirect-warning',
          message: hop.warning,
          fix: 'Review redirect configuration',
          platforms: 'Multiple platforms',
        });
      }
    }
  }

  return findings;
}

/**
 * Extract the raw content attribute value from a meta property tag
 * (before URL resolution, etc.)
 */
function getRawAttributeValue(html, property) {
  const re = new RegExp(
    `<meta[^>]+property=["']${property.replace(':', '\\:')}["'][^>]+content=["']([^"']*)["']`,
    'i'
  );
  const m = re.exec(html);
  if (m) return m[1];

  // Also check content first order
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property.replace(':', '\\:')}["']`,
    'i'
  );
  const m2 = re2.exec(html);
  return m2 ? m2[1] : null;
}

module.exports = { detectMistakes };
