'use strict';

/**
 * Card Screenshot API
 * Generates PNG screenshots of platform cards from metadata
 */

const { PLATFORMS } = require('./scorer');

/**
 * Rate limiting store (in-memory, resets every hour)
 */
const rateLimitStore = new Map();

/**
 * Check rate limit for an IP address
 * Returns { allowed: boolean, remaining: number }
 */
function checkRateLimit(ip, limit = 30) {
  const now = Date.now();
  const hour = Math.floor(now / 3600000); // Current hour bucket

  const key = `${ip}:${hour}`;
  const count = rateLimitStore.get(key) || 0;

  if (count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  rateLimitStore.set(key, count + 1);
  return { allowed: true, remaining: limit - count - 1 };
}

/**
 * Escape HTML for SVG content
 */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Truncate text with ellipsis
 */
function trunc(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '\u2026' : str;
}

/**
 * Get domain from URL
 */
function getDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return '';
  }
}

/**
 * Generate SVG for a platform card
 */
function generateCardSVG(platformId, meta, imageProbe, baseUrl, options = {}) {
  const { withFrame = false, width = 800, height = 450 } = options;

  const ogTitle = meta.og.title || meta.title || '';
  const ogDesc = meta.og.description || meta.description || '';
  const ogImage = meta.og.image || meta.twitter.image || '';
  const ogSite = meta.og.site_name || '';
  const domain = getDomain(baseUrl);
  const themeColor = meta.themeColor || '#5865f2';

  // Base SVG header
  const svgHeader = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`;

  // Background gradient for all cards
  const background = `
    <defs>
      <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1a1a2e"/>
        <stop offset="100%" style="stop-color:#16213e"/>
      </linearGradient>
      <clipPath id="card-clip">
        <rect width="${width}" height="${height}" rx="12"/>
      </clipPath>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg-gradient)" rx="12"/>
  `;

  // Platform-specific card content
  const cardContent = generatePlatformCardContent(platformId, ogTitle, ogDesc, ogImage, domain, ogSite, themeColor, width, height);

  // Platform badge
  const platformName = PLATFORMS.find(p => p.id === platformId)?.name || platformId;
  const badge = `
    <g transform="translate(20, 20)">
      <rect width="120" height="28" rx="6" fill="rgba(255,255,255,0.15)"/>
      <text x="60" y="19" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="white" text-anchor="middle">${escHtml(platformName)}</text>
    </g>
  `;

  // VISTA watermark
  const watermark = `
    <text x="${width - 60}" y="${height - 15}" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="rgba(255,255,255,0.3)" text-anchor="middle">VISTA</text>
  `;

  return `${svgHeader}${background}${badge}${cardContent}${watermark}</svg>`;
}

/**
 * Generate platform-specific card content SVG
 */
function generatePlatformCardContent(platformId, title, desc, image, domain, site, themeColor, width, height) {
  const imgWidth = width - 40;
  const imgHeight = Math.min(height * 0.5, imgWidth * 0.5625);
  const hasImage = !!image;

  const imageSection = hasImage ? `
    <g transform="translate(20, 60)">
      <rect width="${imgWidth}" height="${imgHeight}" rx="8" fill="#2a2a4a"/>
      <image href="${escHtml(image)}" width="${imgWidth}" height="${imgHeight}" preserveAspectRatio="xMidYMid slice" clip-path="inset(0px round 8px)"/>
    </g>
  ` : `
    <g transform="translate(20, 60)">
      <rect width="${imgWidth}" height="${imgHeight}" rx="8" fill="#2a2a4a"/>
      <text x="${imgWidth / 2}" y="${imgHeight / 2}" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.3)" text-anchor="middle">No image</text>
    </g>
  `;

  const textY = hasImage ? 60 + imgHeight + 25 : 80;
  const textWidth = width - 40;

  const titleSection = title ? `
    <text x="20" y="${textY}" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="white" width="${textWidth}">
      ${escHtml(trunc(title, 60))}
    </text>
  ` : '';

  const descY = textY + (title ? 28 : 0);
  const descSection = desc ? `
    <text x="20" y="${descY}" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="rgba(255,255,255,0.7)" width="${textWidth}">
      ${escHtml(trunc(desc, 120))}
    </text>
  ` : '';

  const domainY = descY + (desc ? 24 : 0);
  const domainSection = domain ? `
    <text x="20" y="${domainY}" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="rgba(255,255,255,0.4)">
      ${escHtml(domain)}
    </text>
  ` : '';

  // Platform-specific variations
  switch (platformId) {
    case 'google':
      return `
        <g transform="translate(20, 70)">
          <circle cx="12" cy="12" r="12" fill="#4285f4"/>
          <text x="12" y="17" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="white" text-anchor="middle">G</text>
        </g>
        <text x="50" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.6)">${escHtml(domain)}</text>
        <text x="20" y="115" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="#8ab4f8">${escHtml(trunc(title || metaTitle, 60))}</text>
        ${desc ? `<text x="20" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="rgba(255,255,255,0.7)" width="${width - 40}">${escHtml(trunc(desc, 150))}</text>` : ''}
      `;

    case 'facebook':
    case 'threads':
      return `
        ${imageSection}
        <g transform="translate(20, ${textY})">
          <text font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="rgba(255,255,255,0.5)" font-weight="600">${escHtml(domain.toUpperCase())}</text>
          <text y="24" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="white" width="${textWidth}">${escHtml(trunc(title, 60))}</text>
          ${desc ? `<text y="50" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" width="${textWidth}">${escHtml(trunc(desc, 160))}</text>` : ''}
        </g>
      `;

    case 'twitter':
      return `
        ${imageSection}
        <g transform="translate(20, ${textY})">
          <text font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="white" width="${textWidth}">${escHtml(trunc(title, 70))}</text>
          ${desc ? `<text y="26" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" width="${textWidth}">${escHtml(trunc(desc, 200))}</text>` : ''}
          <text y="${desc ? 54 : 28}" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="rgba(255,255,255,0.5)">${escHtml(domain)}</text>
        </g>
      `;

    case 'linkedin':
      return `
        ${imageSection}
        <g transform="translate(20, ${textY})">
          <text font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="white" width="${textWidth}">${escHtml(trunc(title, 60))}</text>
          <text y="26" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="rgba(255,255,255,0.5)">${escHtml(domain)}</text>
        </g>
      `;

    case 'whatsapp':
      return `
        ${imageSection}
        <g transform="translate(20, ${textY})">
          <text font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="white" width="${textWidth}">${escHtml(trunc(title, 60))}</text>
          ${desc ? `<text y="26" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" width="${textWidth}">${escHtml(trunc(desc, 160))}</text>` : ''}
        </g>
      `;

    case 'slack':
      return `
        <rect x="20" y="60" width="${width - 40}" height="4" fill="${themeColor}"/>
        ${imageSection}
        <g transform="translate(20, ${textY})">
          <text font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="white" width="${textWidth}">${escHtml(trunc(title, 70))}</text>
          ${desc ? `<text y="26" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" width="${textWidth}">${escHtml(trunc(desc, 200))}</text>` : ''}
        </g>
      `;

    case 'discord':
      return `
        <rect x="20" y="60" width="${width - 40}" height="4" fill="${themeColor}"/>
        ${imageSection}
        <g transform="translate(20, ${textY})">
          <text font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="white" width="${textWidth}">${escHtml(trunc(title, 70))}</text>
        </g>
      `;

    case 'imessage':
      return `
        ${imageSection}
        <g transform="translate(20, ${textY})">
          <text font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="white" width="${textWidth}">${escHtml(trunc(title, 60))}</text>
        </g>
      `;

    case 'telegram':
      return `
        ${imageSection}
        <g transform="translate(20, ${textY})">
          <text font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="white" width="${textWidth}">${escHtml(trunc(title, 70))}</text>
          ${desc ? `<text y="26" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" width="${textWidth}">${escHtml(trunc(desc, 200))}</text>` : ''}
        </g>
      `;

    case 'reddit':
      return `
        ${imageSection}
        <g transform="translate(20, ${textY})">
          <text font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="white" width="${textWidth}">${escHtml(trunc(title, 90))}</text>
          ${desc ? `<text y="26" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.7)" width="${textWidth}">${escHtml(trunc(desc, 200))}</text>` : ''}
          <text y="${desc ? 54 : 28}" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="rgba(255,255,255,0.5)">${escHtml(domain)}</text>
        </g>
      `;

    default:
      // Default card layout for all other platforms
      return `
        ${imageSection}
        <g transform="translate(20, ${textY})">
          ${title ? `<text font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="white" width="${textWidth}">${escHtml(trunc(title, 70))}</text>` : ''}
          ${desc ? `<text y="${title ? 26 : 0}" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)" width="${textWidth}">${escHtml(trunc(desc, 160))}</text>` : ''}
          ${domain ? `<text y="${title || desc ? 52 : 0}" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="rgba(255,255,255,0.5)">${escHtml(domain)}</text>` : ''}
        </g>
      `;
  }
}

/**
 * Convert SVG to PNG using canvas
 * For a pure Node.js solution, we'll return the SVG directly
 * The frontend can convert to PNG if needed
 */
function svgToPng(svgString) {
  // For now, return the SVG as-is
  // In a production environment, you'd use sharp or similar to convert
  return Buffer.from(svgString);
}

/**
 * Generate screenshot data
 */
function generateScreenshot(platformId, meta, imageProbe, baseUrl, options = {}) {
  const svgString = generateCardSVG(platformId, meta, imageProbe, baseUrl, options);
  return {
    svg: svgString,
    buffer: svgToPng(svgString),
    mimeType: options.format === 'png' ? 'image/png' : 'image/svg+xml',
  };
}

/**
 * Validate platform ID
 */
function isValidPlatform(platformId) {
  return PLATFORMS.some(p => p.id === platformId);
}

module.exports = {
  generateCardSVG,
  generateScreenshot,
  checkRateLimit,
  isValidPlatform,
};
