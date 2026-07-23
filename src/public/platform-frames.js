'use strict';

/**
 * Platform Context Frames Architecture
 *
 * This module provides a standardized data structure for platform context frames
 * and helper functions to generate them programmatically.
 *
 * A platform frame consists of:
 * - chrome: The UI chrome (header, sidebar, navigation, etc.)
 * - neutralContent: Generic placeholder content (fake posts, messages, etc.)
 * - themeVars: CSS custom properties for dark/light mode theming
 *
 * Adding a new platform frame:
 * 1. Add an entry to PLATFORM_FRAMES with the platform ID as key
 * 2. Define chrome HTML template with {{placeholder}} markers for dynamic content
 * 3. Define neutralContent HTML template (generic post/message placeholders)
 * 4. Define themeVars with CSS custom properties for dark/light modes
 * 5. Add corresponding CSS classes to style.css for .{platform}-context
 */

// ============================================================================
// DATA STRUCTURE
// ============================================================================

/**
 * CSS variable names that should be defined per platform/theme
 * Used for consistent theming across all platform frames
 */
const THEME_VAR_NAMES = [
  '--frame-bg',           // Frame background color
  '--frame-surface',      // Surface/card background color
  '--frame-border',       // Border color
  '--frame-text-primary', // Primary text color
  '--frame-text-secondary', // Secondary text color
  '--frame-text-muted',   // Muted/disabled text color
  '--frame-accent',       // Accent/brand color
  '--frame-accent-bg',    // Accent background color
  '--frame-link-color',   // Link color
  '--frame-divider',      // Divider line color
  '--frame-input-bg',     // Input background color
  '--frame-overlay',      // Overlay/shadow color
];

/**
 * Platform frame definitions
 *
 * Each platform has:
 * - name: Display name
 * - category: Platform category (social, messaging, collaboration, content, email, rss)
 * - hasThemeSupport: Whether the platform supports dark/light mode toggle
 * - aspectRatio: Preferred card aspect ratio (for context frame sizing)
 * - chrome: HTML template for the platform UI chrome (surrounds the link preview)
 * - neutralContent: HTML template for neutral placeholder content
 * - themeVars: CSS custom properties for dark and light modes
 */
const PLATFORM_FRAMES = {
  // Social & Microblogging
  google: {
    name: 'Google Search',
    category: 'social',
    hasThemeSupport: false,
    aspectRatio: 'variable',
    chrome: `
      <div class="google-search-bar">
        <span class="search-icon">🔍</span>
        <span class="search-text">Search...</span>
      </div>
      <div class="google-results">
        {{mainResult}}
        <div class="google-result-item google-result-dim">
          <div class="google-breadcrumb"><span class="google-favicon">📄</span><span class="google-domain">Another result</span></div>
          <div class="google-title">Related Search Result</div>
        </div>
        <div class="google-result-item google-result-dim">
          <div class="google-breadcrumb"><span class="google-favicon">📄</span><span class="google-domain">More results</span></div>
          <div class="google-title">Additional Result Link</div>
        </div>
      </div>
    `,
    neutralContent: `
      <div class="google-result-item">
        <div class="google-breadcrumb">
          <span class="google-favicon">🌐</span>
          <span class="google-domain">{{domain}}</span>
        </div>
        <div class="google-title">{{title}}</div>
        <div class="google-desc">{{description}}</div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#202124',
        '--frame-surface': '#303134',
        '--frame-border': '#5f6368',
        '--frame-text-primary': '#bdc1c6',
        '--frame-text-secondary': '#9aa0a6',
        '--frame-text-muted': '#5f6368',
        '--frame-accent': '#8ab4f8',
        '--frame-accent-bg': '#1a73e8',
        '--frame-link-color': '#8ab4f8',
        '--frame-divider': '#3c4043',
        '--frame-input-bg': '#303134',
        '--frame-overlay': 'rgba(0, 0, 0, 0.5)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f1f3f4',
        '--frame-border': '#dadce0',
        '--frame-text-primary': '#202124',
        '--frame-text-secondary': '#5f6368',
        '--frame-text-muted': '#9aa0a6',
        '--frame-accent': '#1a73e8',
        '--frame-accent-bg': '#e8f0fe',
        '--frame-link-color': '#1a73e8',
        '--frame-divider': '#dadce0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  facebook: {
    name: 'Facebook',
    category: 'social',
    hasThemeSupport: false,
    aspectRatio: '1.91:1',
    chrome: `
      <div class="fb-post-header">
        <div class="fb-avatar"></div>
        <div class="fb-post-meta">
          <span class="fb-author-name">Jane Smith</span>
          <span class="fb-post-time">2h · 🌍</span>
        </div>
        <span class="fb-menu">•••</span>
      </div>
      <div class="fb-post-content">Check out this interesting article!</div>
      {{linkPreview}}
      <div class="fb-post-stats">👍 24 · 💬 8 · 🔗 5</div>
    `,
    neutralContent: '', // No neutral content needed - link preview is the main content
    themeVars: {
      dark: {
        '--frame-bg': '#242526',
        '--frame-surface': '#3a3b3c',
        '--frame-border': '#3e4042',
        '--frame-text-primary': '#e4e6eb',
        '--frame-text-secondary': '#b0b3b8',
        '--frame-text-muted': '#65676b',
        '--frame-accent': '#2d88ff',
        '--frame-accent-bg': '#2d88ff',
        '--frame-link-color': '#2d88ff',
        '--frame-divider': '#3e4042',
        '--frame-input-bg': '#3a3b3c',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f0f2f5',
        '--frame-border': '#ced0d4',
        '--frame-text-primary': '#050505',
        '--frame-text-secondary': '#65676b',
        '--frame-text-muted': '#b0b3b8',
        '--frame-accent': '#1877f2',
        '--frame-accent-bg': '#e7f3ff',
        '--frame-link-color': '#1877f2',
        '--frame-divider': '#ced0d4',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  twitter: {
    name: 'X (Twitter)',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    chrome: `
      <div class="tw-post-header">
        <div class="tw-avatar"></div>
        <div class="tw-post-meta">
          <span class="tw-author-name">Alex Johnson</span>
          <span class="tw-author-handle">@alexj</span>
          <span class="tw-post-time">· 2h</span>
        </div>
        <span class="tw-verified">✓</span>
      </div>
      <div class="tw-post-content">You have to see this! 🔗</div>
      {{linkCard}}
      <div class="tw-post-actions">💬 12 · 🔁 34 · ❤️ 128</div>
    `,
    neutralContent: '',
    themeVars: {
      dark: {
        '--frame-bg': '#000000',
        '--frame-surface': '#16181c',
        '--frame-border': '#2f3336',
        '--frame-text-primary': '#e7e9ea',
        '--frame-text-secondary': '#71767b',
        '--frame-text-muted': '#71767b',
        '--frame-accent': '#1d9bf0',
        '--frame-accent-bg': '#1d9bf0',
        '--frame-link-color': '#1d9bf0',
        '--frame-divider': '#2f3336',
        '--frame-input-bg': '#202327',
        '--frame-overlay': 'rgba(91, 112, 131, 0.4)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f7f9f9',
        '--frame-border': '#eff3f4',
        '--frame-text-primary': '#0f1419',
        '--frame-text-secondary': '#536471',
        '--frame-text-muted': '#536471',
        '--frame-accent': '#1d9bf0',
        '--frame-accent-bg': '#e8f5fe',
        '--frame-link-color': '#1d9bf0',
        '--frame-divider': '#eff3f4',
        '--frame-input-bg': '#eff3f4',
        '--frame-overlay': 'rgba(0, 0, 0, 0.08)',
      },
    },
  },

  linkedin: {
    name: 'LinkedIn',
    category: 'social',
    hasThemeSupport: true,
    aspectRatio: '1.91:1',
    chrome: `
      <div class="li-post-header">
        <div class="li-avatar"></div>
        <div class="li-post-meta">
          <span class="li-author-name">Sarah Chen</span>
          <span class="li-post-headline">Product Manager at Tech Corp</span>
          <span class="li-post-time">2h · 🌐</span>
        </div>
      </div>
      <div class="li-post-content">Great article on industry trends!</div>
      {{linkPreview}}
      <div class="li-post-stats">👍 45 · 💬 12 · 🔁 8</div>
    `,
    neutralContent: '',
    themeVars: {
      dark: {
        '--frame-bg': '#000000',
        '--frame-surface': '#1a1a1b',
        '--frame-border': '#2d2d2d',
        '--frame-text-primary': '#ffffff',
        '--frame-text-secondary': '#a8b3ba',
        '--frame-text-muted': '#666666',
        '--frame-accent': '#0a66c2',
        '--frame-accent-bg': '#0a66c2',
        '--frame-link-color': '#0a66c2',
        '--frame-divider': '#2d2d2d',
        '--frame-input-bg': '#1a1a1b',
        '--frame-overlay': 'rgba(0, 0, 0, 0.7)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f3f5f7',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#000000',
        '--frame-text-secondary': '#666666',
        '--frame-text-muted': '#999999',
        '--frame-accent': '#0a66c2',
        '--frame-accent-bg': '#e0f1ff',
        '--frame-link-color': '#0a66c2',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  slack: {
    name: 'Slack',
    category: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="slack-sidebar">
        <div class="slack-workspace">Acme Co</div>
        <div class="slack-channel"># general</div>
        <div class="slack-channel"># random</div>
      </div>
      <div class="slack-main">
        <div class="slack-channel-header"># general</div>
        <div class="slack-messages">
          <div class="slack-message slack-message-dim">
            <div class="slack-msg-avatar"></div>
            <div class="slack-msg-content">
              <span class="slack-msg-author">Mike</span>
              <span class="slack-msg-time">10:30 AM</span>
              <p>Has anyone seen this?</p>
            </div>
          </div>
          {{userMessage}}
        </div>
      </div>
    `,
    neutralContent: `
      <div class="slack-message">
        <div class="slack-msg-avatar"></div>
        <div class="slack-msg-content">
          <span class="slack-msg-author">You</span>
          <span class="slack-msg-time">10:32 AM</span>
          <div class="slack-link-preview">
            <div class="slack-site">{{site}}</div>
            <div class="slack-title">{{title}}</div>
            <div class="slack-desc">{{description}}</div>
            {{imageSection}}
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#1a1d23',
        '--frame-surface': '#23262c',
        '--frame-border': '#3a3d44',
        '--frame-text-primary': '#e0e0e0',
        '--frame-text-secondary': '#b0b0b0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#2ac7de',
        '--frame-accent-bg': '#2ac7de',
        '--frame-link-color': '#2ac7de',
        '--frame-divider': '#3a3d44',
        '--frame-input-bg': '#23262c',
        '--frame-overlay': 'rgba(0, 0, 0, 0.5)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f8f8f8',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#1a1a1a',
        '--frame-text-secondary': '#616061',
        '--frame-text-muted': '#9a9a9a',
        '--frame-accent': '#2ac7de',
        '--frame-accent-bg': '#e0f7fa',
        '--frame-link-color': '#2ac7de',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  discord: {
    name: 'Discord',
    category: 'messaging',
    hasThemeSupport: true,
    aspectRatio: 'variable',
    chrome: `
      <div class="discord-sidebar">
        <div class="discord-server">Gaming Hub</div>
        <div class="discord-channel"># general</div>
        <div class="discord-channel"># off-topic</div>
      </div>
      <div class="discord-main">
        <div class="discord-channel-header"># general</div>
        <div class="discord-messages">
          <div class="discord-message discord-message-dim">
            <div class="discord-msg-avatar"></div>
            <div class="discord-msg-content">
              <span class="discord-msg-author">GameMaster</span>
              <span class="discord-msg-time">Today at 10:30 AM</span>
              <p>Check this out everyone!</p>
            </div>
          </div>
          {{userMessage}}
        </div>
      </div>
    `,
    neutralContent: `
      <div class="discord-message">
        <div class="discord-msg-avatar"></div>
        <div class="discord-msg-content">
          <span class="discord-msg-author">You</span>
          <span class="discord-msg-time">Today at 10:31 AM</span>
          <div class="discord-link-preview" style="border-left-color:{{themeColor}}">
            {{siteSection}}
            <div class="discord-title">{{title}}</div>
            <div class="discord-desc">{{description}}</div>
            {{imageSection}}
          </div>
        </div>
      </div>
    `,
    themeVars: {
      dark: {
        '--frame-bg': '#313338',
        '--frame-surface': '#2b2d31',
        '--frame-border': '#3f4147',
        '--frame-text-primary': '#dbdee1',
        '--frame-text-secondary': '#949ba4',
        '--frame-text-muted': '#4e5058',
        '--frame-accent': '#5865f2',
        '--frame-accent-bg': '#5865f2',
        '--frame-link-color': '#00a8fc',
        '--frame-divider': '#3f4147',
        '--frame-input-bg': '#383a40',
        '--frame-overlay': 'rgba(0, 0, 0, 0.6)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f2f3f5',
        '--frame-border': '#e3e5e8',
        '--frame-text-primary': '#060607',
        '--frame-text-secondary': '#4e5058',
        '--frame-text-muted': '#949ba4',
        '--frame-accent': '#5865f2',
        '--frame-accent-bg': '#e8f0ff',
        '--frame-link-color': '#00a8fc',
        '--frame-divider': '#e3e5e8',
        '--frame-input-bg': '#f8f9fa',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },

  // Generic template for platforms without custom context frames
  generic: {
    name: 'Generic Platform',
    category: 'other',
    hasThemeSupport: false,
    aspectRatio: 'variable',
    chrome: `
      <div class="context-header"><span class="context-title">{{platformName}}</span></div>
      {{cardContent}}
    `,
    neutralContent: '', // Card content is injected directly
    themeVars: {
      dark: {
        '--frame-bg': '#1a1a2e',
        '--frame-surface': '#16213e',
        '--frame-border': '#3a3a5c',
        '--frame-text-primary': '#e0e0e0',
        '--frame-text-secondary': '#b0b0b0',
        '--frame-text-muted': '#6a6a6a',
        '--frame-accent': '#4a9eff',
        '--frame-accent-bg': '#4a9eff',
        '--frame-link-color': '#4a9eff',
        '--frame-divider': '#3a3a5c',
        '--frame-input-bg': '#23263a',
        '--frame-overlay': 'rgba(0, 0, 0, 0.5)',
      },
      light: {
        '--frame-bg': '#ffffff',
        '--frame-surface': '#f8f9fa',
        '--frame-border': '#e0e0e0',
        '--frame-text-primary': '#1a1a1a',
        '--frame-text-secondary': '#666666',
        '--frame-text-muted': '#999999',
        '--frame-accent': '#0066cc',
        '--frame-accent-bg': '#e6f2ff',
        '--frame-link-color': '#0066cc',
        '--frame-divider': '#e0e0e0',
        '--frame-input-bg': '#ffffff',
        '--frame-overlay': 'rgba(0, 0, 0, 0.1)',
      },
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get platform frame definition
 * @param {string} platformId - Platform ID (e.g., 'twitter', 'slack')
 * @returns {object} Platform frame definition or generic fallback
 */
function getPlatformFrame(platformId) {
  return PLATFORM_FRAMES[platformId] || { ...PLATFORM_FRAMES.generic, name: platformId };
}

/**
 * Check if platform supports theme toggle
 * @param {string} platformId - Platform ID
 * @returns {boolean} True if platform supports dark/light mode
 */
function hasThemeSupport(platformId) {
  const frame = getPlatformFrame(platformId);
  return frame.hasThemeSupport || false;
}

/**
 * Get theme variables for a platform
 * @param {string} platformId - Platform ID
 * @param {string} theme - 'dark' or 'light'
 * @returns {object} CSS custom properties for the theme
 */
function getThemeVars(platformId, theme = 'dark') {
  const frame = getPlatformFrame(platformId);
  return frame.themeVars?.[theme] || frame.themeVars?.dark || {};
}

/**
 * Get platforms that support theme toggle
 * @returns {string[]} Array of platform IDs
 */
function getPlatformsWithThemeSupport() {
  return Object.entries(PLATFORM_FRAMES)
    .filter(([_, frame]) => frame.hasThemeSupport)
    .map(([id, _]) => id);
}

/**
 * Generate CSS for theme variables
 * @param {string} platformId - Platform ID
 * @param {string} theme - 'dark' or 'light'
 * @returns {string} CSS style string
 */
function generateThemeCSS(platformId, theme = 'dark') {
  const vars = getThemeVars(platformId, theme);
  const cssVars = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
  return `.${platformId}-context.${theme}-theme {\n${cssVars}\n}`;
}

/**
 * Generate all theme CSS for a platform (both dark and light)
 * @param {string} platformId - Platform ID
 * @returns {string} Complete CSS with theme classes
 */
function generateAllThemeCSS(platformId) {
  let css = `/* Theme variables for ${platformId} */\n`;

  if (hasThemeSupport(platformId)) {
    css += generateThemeCSS(platformId, 'dark') + '\n\n';
    css += generateThemeCSS(platformId, 'light') + '\n';
  } else {
    // For platforms without theme support, use dark as default
    css += generateThemeCSS(platformId, 'dark') + '\n';
  }

  return css;
}

/**
 * Apply theme variables to an element
 * @param {HTMLElement} element - DOM element to apply styles to
 * @param {string} platformId - Platform ID
 * @param {string} theme - 'dark' or 'light'
 */
function applyThemeToElement(element, platformId, theme = 'dark') {
  const vars = getThemeVars(platformId, theme);
  Object.entries(vars).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
}

/**
 * Interpolate template variables in a string
 * @param {string} template - Template string with {{placeholders}}
 * @param {object} vars - Variables to interpolate
 * @returns {string} Interpolated string
 */
function interpolateTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return vars[key] !== undefined ? String(vars[key]) : '';
  });
}

/**
 * Build complete context frame HTML
 * @param {string} platformId - Platform ID
 * @param {object} content - Content data (title, description, image, etc.)
 * @param {string} theme - 'dark' or 'light'
 * @returns {string} Complete context frame HTML
 */
function buildContextFrame(platformId, content, theme = 'dark') {
  const frame = getPlatformFrame(platformId);
  const themeSuffix = hasThemeSupport(platformId) ? ` ${theme}-theme` : '';

  // Build the main content/card HTML
  let mainContent = '';
  if (frame.neutralContent) {
    // Use neutral content template
    mainContent = interpolateTemplate(frame.neutralContent, {
      ...content,
      themeColor: content.themeColor || getThemeVars(platformId, theme)['--frame-accent'],
    });
  }

  // Build link preview section
  let linkPreview = '';
  if (content.title) {
    linkPreview = buildLinkPreviewHTML(platformId, content, theme);
  }

  // Build complete frame
  const frameHTML = interpolateTemplate(frame.chrome, {
    mainResult: mainContent,
    userMessage: mainContent,
    linkPreview,
    linkCard: linkPreview,
    cardContent: content.cardHTML || '',
    ...content,
  });

  return `<div class="context-frame ${platformId}-context${themeSuffix}" style="${getInlineThemeStyles(platformId, theme)}">${frameHTML}</div>`;
}

/**
 * Get inline theme styles as a CSS string
 * @param {string} platformId - Platform ID
 * @param {string} theme - 'dark' or 'light'
 * @returns {string} Inline style string
 */
function getInlineThemeStyles(platformId, theme = 'dark') {
  const vars = getThemeVars(platformId, theme);
  return Object.entries(vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
}

/**
 * Build link preview HTML for a platform
 * @param {string} platformId - Platform ID
 * @param {object} content - Content data
 * @param {string} theme - Theme mode
 * @returns {string} Link preview HTML
 */
function buildLinkPreviewHTML(platformId, content, theme = 'dark') {
  const { title, description, image, domain, dominantColor, site } = content;
  const trunc = (str, n) => str && str.length > n ? str.slice(0, n) + '…' : (str || '');
  const esc = (str) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Platform-specific link preview formats
  switch (platformId) {
    case 'facebook':
    case 'threads':
      return `
        <div class="fb-link-preview">
          <div class="fb-context-domain">${esc((site || domain || '').toUpperCase())}</div>
          <div class="fb-context-title">${esc(trunc(title, 60))}</div>
          ${description ? `<div class="fb-context-desc">${esc(trunc(description, 100))}</div>` : ''}
          ${image ? `<div class="fb-context-image img-loading-container" style="background:${dominantColor || '#e0e0e0'}"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="fb-context-placeholder"></div>'}
        </div>
      `;

    case 'twitter':
      return `
        <div class="tw-link-card">
          ${image ? `<div class="tw-context-image img-loading-container" style="background:${dominantColor || '#e0e0e0'}"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="tw-context-placeholder"></div>'}
          <div class="tw-context-meta">
            <div class="tw-context-title">${esc(trunc(title, 60))}</div>
            <div class="tw-context-domain">${esc(domain)}</div>
          </div>
        </div>
      `;

    case 'linkedin':
      return `
        <div class="li-link-preview">
          ${image ? `<div class="li-context-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="li-context-placeholder"></div>'}
          <div class="li-context-meta">
            <div class="li-context-title">${esc(trunc(title, 80))}</div>
            <div class="li-context-domain">${esc(domain)}</div>
          </div>
        </div>
      `;

    default:
      // Generic link preview
      return `
        <div class="generic-link-preview">
          ${image ? `<div class="generic-context-image img-loading-container"><img src="${esc(image)}" alt="" onerror="this.parentElement.style.display='none'" loading="lazy" /></div>` : '<div class="generic-context-placeholder"></div>'}
          <div class="generic-context-meta">
            <div class="generic-context-title">${esc(trunc(title, 70))}</div>
            ${description ? `<div class="generic-context-desc">${esc(trunc(description, 160))}</div>` : ''}
            <div class="generic-context-domain">${esc(domain)}</div>
          </div>
        </div>
      `;
  }
}

/**
 * Get list of all supported platform IDs
 * @returns {string[]} Array of platform IDs
 */
function getSupportedPlatforms() {
  return Object.keys(PLATFORM_FRAMES).filter(id => id !== 'generic');
}

/**
 * Export for use in other modules
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PLATFORM_FRAMES,
    THEME_VAR_NAMES,
    getPlatformFrame,
    hasThemeSupport,
    getThemeVars,
    getPlatformsWithThemeSupport,
    generateThemeCSS,
    generateAllThemeCSS,
    applyThemeToElement,
    buildContextFrame,
    buildLinkPreviewHTML,
    getSupportedPlatforms,
    interpolateTemplate,
    getInlineThemeStyles,
  };
}
