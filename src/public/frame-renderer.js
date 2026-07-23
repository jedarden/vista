/**
 * Unified Frame Renderer
 *
 * Integration layer that brings together:
 * - frames-theme.js (theme management)
 * - platform-frames.js (platform definitions)
 * - app.js rendering logic
 *
 * This provides a unified API for rendering platform frames with:
 * - Automatic theme switching (dark/light)
 * - Platform-specific styling and layouts
 * - Responsive container structure for different platform types
 * - Shared utilities for spacing, typography, and components
 */

'use strict';

/* ============================================================================
   FRAME TYPE CLASSIFICATIONS
   ============================================================================ */

/**
 * Frame layout types - 3 main categories for different platform layouts
 * 1. CARD: Standard link preview card (Facebook, LinkedIn, etc.)
 * 2. MESSAGE: Messaging/chat interface (Slack, Discord)
 * 3. SEARCH: Search results listing (Google)
 */
const FRAME_TYPES = {
  CARD: 'card',
  MESSAGE: 'message',
  SEARCH: 'search'
};

/**
 * Platform to frame type mapping
 */
const PLATFORM_FRAME_TYPES = {
  // Search layout
  google: FRAME_TYPES.SEARCH,

  // Messaging layouts
  slack: FRAME_TYPES.MESSAGE,
  discord: FRAME_TYPES.MESSAGE,

  // Standard card layouts (default)
  facebook: FRAME_TYPES.CARD,
  twitter: FRAME_TYPES.CARD,
  linkedin: FRAME_TYPES.CARD,
  generic: FRAME_TYPES.CARD
};

/**
 * Get frame type for a platform
 * @param {string} platform - Platform ID
 * @returns {string} Frame type
 */
function getFrameType(platform) {
  return PLATFORM_FRAME_TYPES[platform] || FRAME_TYPES.CARD;
}

/* ============================================================================
   UNIFIED FRAME RENDERER
   ============================================================================ */

/**
 * Render a platform frame with full theme support and layout structure
 * @param {Object} options - Rendering options
 * @param {string} options.platform - Platform ID (required)
 * @param {string} options.title - Link title (required)
 * @param {string} options.description - Link description (optional)
 * @param {string} options.domain - Link domain (required)
 * @param {string} options.image - Image URL (optional)
 * @param {string} options.siteName - Site name (optional)
 * @param {string} options.theme - Theme ('dark', 'light', 'auto') (default: 'auto')
 * @param {string} options.frameId - Frame ID (default: auto-generated)
 * @param {Object} options.meta - Additional metadata (favicon, themeColor, etc.)
 * @returns {string} Complete frame HTML
 */
function renderPlatformFrame(options) {
  const {
    platform,
    title,
    description = '',
    domain,
    image = '',
    siteName = '',
    theme = 'auto',
    frameId = null,
    meta = {}
  } = options;

  if (!platform || !title || !domain) {
    throw new Error('renderPlatformFrame requires platform, title, and domain');
  }

  const id = frameId || `frame-${platform}-${Date.now()}`;
  const frameType = getFrameType(platform);

  // Generate frame header based on platform
  const header = generatePlatformHeader(platform, siteName || domain);

  // Generate frame body based on frame type
  const body = generateFrameBody({
    frameType,
    platform,
    title,
    description,
    domain,
    image,
    meta
  });

  // Generate frame footer based on platform
  const footer = generatePlatformFooter(platform);

  // Use frames-theme.js generateFrameHTML if available
  if (typeof FrameTheme !== 'undefined' && FrameTheme.generateFrameHTML) {
    return FrameTheme.generateFrameHTML({
      id,
      platform,
      theme,
      className: `${frameType}-frame`,
      header,
      body,
      footer
    });
  }

  // Fallback: generate basic frame structure
  return generateFallbackFrame({
    id,
    platform,
    theme,
    header,
    body,
    footer
  });
}

/**
 * Generate platform-specific header
 * @param {string} platform - Platform ID
 * @param {string} siteName - Site name or domain
 * @returns {string} Header HTML
 */
function generatePlatformHeader(platform, siteName) {
  const headers = {
    google: `<span class="google-logo">G</span><span>Search Result</span>`,
    facebook: `<span class="fb-icon">📘</span><span>Facebook Preview</span>`,
    twitter: `<span class="tw-icon">𝕏</span><span>Twitter Preview</span>`,
    linkedin: `<span class="li-icon">💼</span><span>LinkedIn Preview</span>`,
    slack: `<span class="slack-icon">💼</span><span>Slack Message</span>`,
    discord: `<span class="discord-icon">🎮</span><span>Discord Embed</span>`,
    generic: `<span class="generic-icon">🔗</span><span>Link Preview</span>`
  };

  const headerHTML = headers[platform] || headers.generic;

  // Use frames-theme.js generateFrameHeader if available
  if (typeof FrameTheme !== 'undefined' && FrameTheme.generateFrameHeader) {
    return FrameTheme.generateFrameHeader({
      title: siteName,
      icon: headerHTML
    });
  }

  return headerHTML;
}

/**
 * Generate frame body based on frame type
 * @param {Object} options - Body generation options
 * @returns {string} Body HTML
 */
function generateFrameBody(options) {
  const { frameType, platform, title, description, domain, image, meta } = options;

  switch (frameType) {
    case FRAME_TYPES.SEARCH:
      return generateSearchBody({ platform, title, description, domain, meta });

    case FRAME_TYPES.MESSAGE:
      return generateMessageBody({ platform, title, description, domain, image, meta });

    case FRAME_TYPES.CARD:
    default:
      return generateCardBody({ platform, title, description, domain, image, meta });
  }
}

/**
 * Generate search-style body (Google)
 * @param {Object} options - Search body options
 * @returns {string} Search body HTML
 */
function generateSearchBody(options) {
  const { platform, title, description, domain, meta } = options;
  const favicon = meta.favicon || '';

  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');

  return `
    <div class="frame-search-result">
      <div class="frame-search-breadcrumb">
        ${favicon ? `<img src="${escHtml(favicon)}" alt="" class="frame-favicon" loading="lazy" onerror="this.style.display='none'" />` : '<span class="frame-icon">🌐</span>'}
        <span class="frame-search-domain">${escHtml(domain)}</span>
      </div>
      <div class="frame-search-title">${escHtml(trunc(title, 60))}</div>
      ${description ? `<div class="frame-search-desc">${escHtml(trunc(description, 158))}</div>` : ''}
    </div>
  `;
}

/**
 * Generate message-style body (Slack, Discord)
 * @param {Object} options - Message body options
 * @returns {string} Message body HTML
 */
function generateMessageBody(options) {
  const { platform, title, description, domain, image, meta } = options;
  const siteName = meta.siteName || domain;
  const themeColor = meta.themeColor || '#5865f2';

  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');

  return `
    <div class="frame-message-content">
      ${siteName ? `<div class="frame-message-site">${escHtml(siteName)}</div>` : ''}
      <div class="frame-message-title">${escHtml(trunc(title, platform === 'discord' ? 256 : 80))}</div>
      ${description ? `<div class="frame-message-desc">${escHtml(trunc(description, platform === 'discord' ? 300 : 150))}</div>` : ''}
      ${image ? `
        <div class="frame-message-image">
          <div class="mock-image" style="height:${platform === 'discord' ? 180 : 160}px;aspect-ratio:auto">
            <img src="${escHtml(image)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='🖼️'" />
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Generate card-style body (Facebook, LinkedIn, etc.)
 * @param {Object} options - Card body options
 * @returns {string} Card body HTML
 */
function generateCardBody(options) {
  const { platform, title, description, domain, image } = options;

  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');

  // Use frames-theme.js generateLinkPreview if available
  if (typeof FrameTheme !== 'undefined' && FrameTheme.generateLinkPreview) {
    return FrameTheme.generateLinkPreview({
      domain,
      title,
      description,
      image
    });
  }

  // Fallback card HTML
  return `
    <div class="frame-link-preview">
      <div class="frame-link-preview-header">${escHtml(domain)}</div>
      <div class="frame-link-preview-title">${escHtml(trunc(title, 70))}</div>
      ${description ? `<div class="frame-link-preview-desc">${escHtml(trunc(description, 200))}</div>` : ''}
      ${image ? `
        <img class="frame-link-preview-image" src="${escHtml(image)}" alt="" loading="lazy" onerror="this.style.display='none'" />
      ` : '<div class="frame-link-preview-placeholder">🖼️</div>'}
    </div>
  `;
}

/**
 * Generate platform-specific footer
 * @param {string} platform - Platform ID
 * @returns {string} Footer HTML
 */
function generatePlatformFooter(platform) {
  const footers = {
    google: ['🔍 Search results preview'],
    facebook: ['👍 Like', '💬 Comment', '🔗 Share'],
    twitter: ['💬 Reply', '🔄 Retweet', '❤️ Like'],
    linkedin: ['👍 Like', '💬 Comment', '🔗 Share'],
    slack: ['💬 Reply', '✨ React'],
    discord: ['💬 Reply'],
    generic: ['🔗 Link preview']
  };

  const items = footers[platform] || footers.generic;

  // Use frames-theme.js generateFrameFooter if available
  if (typeof FrameTheme !== 'undefined' && FrameTheme.generateFrameFooter) {
    return FrameTheme.generateFrameFooter({ items });
  }

  return '';
}

/**
 * Generate fallback frame structure (when frames-theme.js is not available)
 * @param {Object} options - Fallback frame options
 * @returns {string} Frame HTML
 */
function generateFallbackFrame(options) {
  const { id, platform, theme, header, body, footer } = options;

  return `
    <div
      id="${id}"
      class="frame-base ${platform}-context"
      data-platform="${platform}"
      data-frame-theme="${theme}"
      role="article"
      aria-label="${platform} context frame"
    >
      ${header ? `<header class="frame-header">${header}</header>` : ''}
      <div class="frame-body">
        ${body}
      </div>
      ${footer ? `<footer class="frame-footer">${footer}</footer>` : ''}
    </div>
  `;
}

/* ============================================================================
   THEME INTEGRATION
   ============================================================================ */

/**
 * Apply platform-specific theme to all frames of a platform
 * @param {string} platform - Platform ID
 * @param {string} theme - Theme ('dark' or 'light')
 */
function applyPlatformTheme(platform, theme) {
  if (typeof FrameTheme !== 'undefined' && FrameTheme.applyPlatformTheme) {
    FrameTheme.applyPlatformTheme(platform, theme);
  }
}

/**
 * Toggle theme for a specific frame
 * @param {string} frameId - Frame ID
 * @param {string} fallbackTheme - Theme to use if current is 'auto'
 */
function toggleFrameTheme(frameId, fallbackTheme = 'dark') {
  if (typeof FrameTheme !== 'undefined' && FrameTheme.toggleFrameTheme) {
    FrameTheme.toggleFrameTheme(frameId, fallbackTheme);
  }
}

/**
 * Initialize unified frame renderer with theme system
 * @param {string} globalTheme - Initial global theme
 */
function initFrameRenderer(globalTheme = 'dark') {
  if (typeof FrameTheme !== 'undefined' && FrameTheme.initFrameThemeSystem) {
    FrameTheme.initFrameThemeSystem(globalTheme);
  }
}

/* ============================================================================
   UTILITY FUNCTIONS
   ============================================================================ */

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Get domain from URL
 * @param {string} url - URL string
 * @returns {string} Domain
 */
function getDomain(url) {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Get all frames on the page
 * @returns {NodeListOf<HTMLElement>}
 */
function getAllFrames() {
  return document.querySelectorAll('.frame-base');
}

/**
 * Get frames by platform
 * @param {string} platform - Platform ID
 * @returns {NodeListOf<HTMLElement>}
 */
function getFramesByPlatform(platform) {
  return document.querySelectorAll(`.${platform}-context`);
}

/**
 * Get frames by type
 * @param {string} frameType - Frame type (card, message, search)
 * @returns {NodeListOf<HTMLElement>}
 */
function getFramesByType(frameType) {
  return document.querySelectorAll(`.${frameType}-frame`);
}

/* ============================================================================
   EXPORTS
   ============================================================================ */

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FRAME_TYPES,
    getFrameType,
    renderPlatformFrame,
    generatePlatformHeader,
    generateFrameBody,
    generatePlatformFooter,
    applyPlatformTheme,
    toggleFrameTheme,
    initFrameRenderer,
    getAllFrames,
    getFramesByPlatform,
    getFramesByType
  };
}

// Browser: expose to global scope
if (typeof window !== 'undefined') {
  window.FrameRenderer = {
    FRAME_TYPES,
    getFrameType,
    renderPlatformFrame,
    generatePlatformHeader,
    generateFrameBody,
    generatePlatformFooter,
    applyPlatformTheme,
    toggleFrameTheme,
    initFrameRenderer,
    getAllFrames,
    getFramesByPlatform,
    getFramesByType
  };

  // Auto-initialize with saved theme
  const savedTheme = localStorage.getItem('vista-theme') || 'dark';
  initFrameRenderer(savedTheme);
}
