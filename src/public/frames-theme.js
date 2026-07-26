/**
 * Frame Theme and Base Structure Module
 *
 * Provides utilities for:
 * - Theme switching for individual frames
 * - Base frame HTML structure generation
 * - Platform-specific frame configuration
 * - Coordinated theme management across all frames
 */

'use strict';

/* ============================================================================
   THEME MANAGEMENT
   ============================================================================ */

/**
 * Theme types supported by frames
 */
const THEME_TYPES = {
  DARK: 'dark',
  LIGHT: 'light',
  AUTO: 'auto'
};

/**
 * Current frame theme state
 * Each frame can have its own theme, or inherit from global theme
 */
const frameThemes = new Map(); // frameId -> theme

/**
 * Global theme (synced with app theme)
 */
let globalTheme = THEME_TYPES.DARK;

/**
 * Initialize the frame theme system
 * @param {string} currentGlobalTheme - Current app theme ('dark' or 'light')
 */
function initFrameThemeSystem(currentGlobalTheme = 'dark') {
  globalTheme = currentGlobalTheme;

  // Listen for global theme changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-theme') {
        const newTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        globalTheme = newTheme;
        // Update all frames that inherit global theme
        updateAllInheritingFrames();
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
}

/**
 * Set theme for a specific frame
 * @param {string} frameId - Frame element ID
 * @param {string} theme - Theme ('dark', 'light', or 'auto' for global)
 */
function setFrameTheme(frameId, theme) {
  const frame = document.getElementById(frameId);
  if (!frame) {
    console.warn(`Frame ${frameId} not found`);
    return;
  }

  frameThemes.set(frameId, theme);
  applyFrameTheme(frame, theme);
}

/**
 * Apply theme to a frame element
 * @param {HTMLElement} frame - Frame element
 * @param {string} theme - Theme ('dark', 'light', or 'auto')
 */
function applyFrameTheme(frame, theme) {
  const actualTheme = theme === THEME_TYPES.AUTO ? globalTheme : theme;
  frame.setAttribute('data-frame-theme', actualTheme);

  // Update platform-specific CSS variables
  updateFramePlatformVars(frame, actualTheme);
}

/**
 * Update all frames that inherit global theme
 */
function updateAllInheritingFrames() {
  frameThemes.forEach((theme, frameId) => {
    if (theme === THEME_TYPES.AUTO) {
      const frame = document.getElementById(frameId);
      if (frame) {
        applyFrameTheme(frame, THEME_TYPES.AUTO);
      }
    }
  });
}

/**
 * Update platform-specific CSS variables for a frame
 * @param {HTMLElement} frame - Frame element
 * @param {string} theme - Theme ('dark' or 'light')
 */
function updateFramePlatformVars(frame, theme) {
  const platform = frame.getAttribute('data-platform');
  if (!platform) return;

  // Get theme vars for this platform
  const themeVars = getPlatformThemeVars(platform, theme);
  if (!themeVars) return;

  // Apply CSS variables to the frame
  Object.entries(themeVars).forEach(([varName, value]) => {
    frame.style.setProperty(varName, value);
  });
}

/**
 * Get theme variables for a platform
 * @param {string} platform - Platform ID
 * @param {string} theme - Theme ('dark' or 'light')
 * @returns {Object|null} CSS variable name-value pairs
 */
function getPlatformThemeVars(platform, theme) {
  // Import from platform-frames.js if available
  if (typeof PLATFORM_FRAMES !== 'undefined' && PLATFORM_FRAMES[platform]) {
    return PLATFORM_FRAMES[platform].themeVars?.[theme] || null;
  }

  // Fallback to default theme vars
  return getDefaultThemeVars(theme);
}

/**
 * Get default theme variables
 * @param {string} theme - Theme ('dark' or 'light')
 * @returns {Object} CSS variable name-value pairs
 */
function getDefaultThemeVars(theme) {
  const defaults = {
    dark: {
      '--frame-bg': '#1a1a1e',
      '--frame-surface': '#25252a',
      '--frame-border': '#3a3a3f',
      '--frame-text-primary': '#e4e4e7',
      '--frame-text-secondary': '#a1a1aa',
      '--frame-text-muted': '#71717a',
      '--frame-accent': '#6366f1',
      '--frame-accent-bg': '#4f46e5',
      '--frame-link-color': '#818cf8',
      '--frame-divider': '#3a3a3f',
      '--frame-input-bg': '#2d2d33',
      '--frame-overlay': 'rgba(0, 0, 0, 0.5)'
    },
    light: {
      '--frame-bg': '#ffffff',
      '--frame-surface': '#f8f9fa',
      '--frame-border': '#e5e7eb',
      '--frame-text-primary': '#1f2937',
      '--frame-text-secondary': '#6b7280',
      '--frame-text-muted': '#9ca3af',
      '--frame-accent': '#4f46e5',
      '--frame-accent-bg': '#eef2ff',
      '--frame-link-color': '#4f46e5',
      '--frame-divider': '#e5e7eb',
      '--frame-input-bg': '#ffffff',
      '--frame-overlay': 'rgba(0, 0, 0, 0.1)'
    }
  };

  return defaults[theme] || defaults.dark;
}

/* ============================================================================
   BASE FRAME STRUCTURE GENERATORS
   ============================================================================ */

/**
 * Generate base frame HTML structure
 * @param {Object} options - Frame options
 * @param {string} options.id - Frame ID (required)
 * @param {string} options.platform - Platform ID (required)
 * @param {string} options.theme - Initial theme ('dark', 'light', 'auto') (default: 'auto')
 * @param {string} options.className - Additional CSS classes (default: '')
 * @param {string} options.header - Header HTML content (optional)
 * @param {string} options.body - Body HTML content (required)
 * @param {string} options.footer - Footer HTML content (optional)
 * @returns {string} Frame HTML
 */
function generateFrameHTML(options) {
  const {
    id,
    platform,
    theme = THEME_TYPES.AUTO,
    className = '',
    header = '',
    body,
    footer = ''
  } = options;

  if (!id || !platform || !body) {
    throw new Error('Frame requires id, platform, and body');
  }

  const themeAttr = theme === THEME_TYPES.AUTO ? '' : `data-frame-theme="${theme}"`;
  const classes = `frame-base ${platform}-context ${className}`.trim();

  return `
    <div
      id="${id}"
      class="${classes}"
      data-platform="${platform}"
      ${themeAttr}
      role="article"
      aria-label="${platform} context frame"
    >
      ${header ? `<header class="frame-header">${header}</header>` : ''}
      <div class="frame-body">
        ${body}
      </div>
      ${footer ? `<footer class="frame-footer">${footer}</footer>` : ''}
    </div>
  `.trim();
}

/**
 * Generate frame header HTML
 * @param {Object} options - Header options
 * @param {string} options.title - Header title (required)
 * @param {string} options.icon - Header icon/emoji (optional)
 * @param {string} options.className - Additional CSS classes (default: '')
 * @returns {string} Header HTML
 */
function generateFrameHeader(options) {
  const { title, icon = '', className = '' } = options;

  if (!title) {
    throw new Error('Frame header requires title');
  }

  const classes = `frame-header ${className}`.trim();

  return `
    <header class="${classes}">
      ${icon ? `<span class="frame-icon">${icon}</span>` : ''}
      <span class="frame-title">${title}</span>
    </header>
  `.trim();
}

/**
 * Generate frame footer HTML
 * @param {Object} options - Footer options
 * @param {Array<string>} options.items - Footer items (text/emoji) (required)
 * @param {string} options.className - Additional CSS classes (default: '')
 * @returns {string} Footer HTML
 */
function generateFrameFooter(options) {
  const { items = [], className = '' } = options;

  if (!items.length) {
    return '';
  }

  const classes = `frame-footer ${className}`.trim();
  const itemsHTML = items.map(item => `<span>${item}</span>`).join('');

  return `
    <footer class="${classes}">
      ${itemsHTML}
    </footer>
  `.trim();
}

/**
 * Generate avatar HTML
 * @param {Object} options - Avatar options
 * @param {string} options.size - Size ('sm', 'md', 'lg') (default: 'md')
 * @param {string} options.emoji - Avatar emoji/icon (default: '👤')
 * @param {string} options.className - Additional CSS classes (default: '')
 * @returns {string} Avatar HTML
 */
function generateAvatar(options = {}) {
  const {
    size = 'md',
    emoji = '👤',
    className = ''
  } = options;

  const sizeClass = size === 'sm' ? 'frame-avatar-sm' :
                    size === 'lg' ? 'frame-avatar-lg' : '';
  const classes = `frame-avatar ${sizeClass} ${className}`.trim();

  return `<div class="${classes}">${emoji}</div>`;
}

/**
 * Generate post header HTML
 * @param {Object} options - Post header options
 * @param {string} options.authorName - Author name (required)
 * @param {string} options.authorHandle - Author handle (optional)
 * @param {string} options.postTime - Post time (e.g., '2h') (required)
 * @param {string} options.avatarEmoji - Avatar emoji (default: '👤')
 * @param {string} options.verified - Verified badge (optional)
 * @param {string} options.className - Additional CSS classes (default: '')
 * @returns {string} Post header HTML
 */
function generatePostHeader(options) {
  const {
    authorName,
    authorHandle = '',
    postTime,
    avatarEmoji = '👤',
    verified = '',
    className = ''
  } = options;

  if (!authorName || !postTime) {
    throw new Error('Post header requires authorName and postTime');
  }

  const classes = `frame-post-header ${className}`.trim();
  const avatar = generateAvatar({ emoji: avatarEmoji });
  const handleHTML = authorHandle ? `<span class="frame-author-handle">${authorHandle}</span>` : '';
  const verifiedHTML = verified ? `<span class="frame-verified">${verified}</span>` : '';

  return `
    <div class="${classes}">
      ${avatar}
      <div class="frame-post-meta">
        <span class="frame-author-name">${authorName}</span>
        ${handleHTML}
        <span class="frame-post-time">${postTime}</span>
      </div>
      ${verifiedHTML}
    </div>
  `.trim();
}

/**
 * Generate link preview HTML
 * @param {Object} options - Link preview options
 * @param {string} options.domain - Link domain (required)
 * @param {string} options.title - Link title (required)
 * @param {string} options.description - Link description (optional)
 * @param {string} options.image - Image URL (optional)
 * @param {string} options.className - Additional CSS classes (default: '')
 * @returns {string} Link preview HTML
 */
function generateLinkPreview(options) {
  const {
    domain,
    title,
    description = '',
    image = '',
    className = ''
  } = options;

  if (!domain || !title) {
    throw new Error('Link preview requires domain and title');
  }

  const classes = `frame-link-preview ${className}`.trim();

  let html = `
    <div class="${classes}">
      <div class="frame-link-preview-header">${domain}</div>
      <div class="frame-link-preview-title">${title}</div>
  `;

  if (description) {
    html += `<div class="frame-link-preview-desc">${description}</div>`;
  }

  if (image) {
    html += `<img class="frame-link-preview-image" src="${image}" alt="" loading="lazy">`;
  } else {
    html += `<div class="frame-link-preview-placeholder">🖼️</div>`;
  }

  html += '</div>';

  return html;
}

/* ============================================================================
   UTILITY FUNCTIONS
   ============================================================================ */

/**
 * Get all frame elements on the page
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
 * Get theme for a frame
 * @param {string} frameId - Frame ID
 * @returns {string} Frame theme ('dark', 'light', or 'auto')
 */
function getFrameTheme(frameId) {
  return frameThemes.get(frameId) || THEME_TYPES.AUTO;
}

/**
 * Toggle theme for a frame
 * @param {string} frameId - Frame ID
 * @param {string} fallbackTheme - Theme to use if current is 'auto' (default: 'dark')
 */
function toggleFrameTheme(frameId, fallbackTheme = 'dark') {
  const currentTheme = getFrameTheme(frameId);
  let newTheme;

  if (currentTheme === THEME_TYPES.AUTO) {
    newTheme = fallbackTheme;
  } else if (currentTheme === THEME_TYPES.DARK) {
    newTheme = THEME_TYPES.LIGHT;
  } else {
    newTheme = THEME_TYPES.DARK;
  }

  setFrameTheme(frameId, newTheme);
}

/**
 * Apply platform-specific theme variables to all frames of a platform
 * @param {string} platform - Platform ID
 * @param {string} theme - Theme ('dark' or 'light')
 */
function applyPlatformTheme(platform, theme) {
  const frames = getFramesByPlatform(platform);
  frames.forEach(frame => {
    updateFramePlatformVars(frame, theme);
  });
}

/**
 * Update ALL rendered platform context frames to a theme, in place.
 *
 * Invoked when the global theme changes (see the theme observer in app.js).
 * Iterates every platform context frame currently in the DOM — the
 * `.context-frame[data-platform]` elements emitted by platform-frames.js
 * buildContextFrame — and re-themes each one: swaps the dark-theme/light-theme
 * class, updates the data-theme / data-frame-theme attributes, and reapplies
 * the platform's theme CSS variables.
 *
 * This guarantees the theme switch is synchronized across every platform
 * (facebook, twitter, linkedin, reddit, youtube, instagram, tiktok) and that
 * no frame is left rendering in the stale theme after a global toggle.
 *
 * @param {string} theme - Theme to apply ('dark' or 'light')
 * @returns {number} Number of frames updated
 */
function updateAllPlatformFrames(theme) {
  if (typeof document === 'undefined') return 0;

  if (theme !== THEME_TYPES.DARK && theme !== THEME_TYPES.LIGHT) {
    console.warn(`[FrameTheme] updateAllPlatformFrames: invalid theme "${theme}"`);
    return 0;
  }

  // Select every platform context frame currently rendered. buildContextFrame
  // emits <div class="context-frame {platform}-context {theme}-theme"
  //        data-platform="..." data-theme="...">, so this matches all 7.
  const frames = document.querySelectorAll('.context-frame[data-platform]');
  let updated = 0;

  frames.forEach(frame => {
    const platform = frame.getAttribute('data-platform');
    if (!platform) return;

    // Swap the theme class (remove whichever theme class is present)
    frame.classList.remove(`${THEME_TYPES.DARK}-theme`, `${THEME_TYPES.LIGHT}-theme`);
    frame.classList.add(`${theme}-theme`);

    // Update theme attributes so CSS [data-theme='...'] selectors and the
    // theme-subscription system see the new theme.
    frame.setAttribute('data-theme', theme);
    frame.setAttribute('data-frame-theme', theme);

    // Reapply the platform's theme CSS variables for the new theme
    updateFramePlatformVars(frame, theme);
    updated++;
  });

  return updated;
}

/**
 * Export for use in other modules
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    THEME_TYPES,
    initFrameThemeSystem,
    setFrameTheme,
    getFrameTheme,
    toggleFrameTheme,
    generateFrameHTML,
    generateFrameHeader,
    generateFrameFooter,
    generateAvatar,
    generatePostHeader,
    generateLinkPreview,
    getAllFrames,
    getFramesByPlatform,
    applyPlatformTheme,
    updateAllPlatformFrames,
    globalTheme: () => globalTheme
  };
}

// Browser: expose functions to global scope
if (typeof window !== 'undefined') {
  window.FrameTheme = {
    THEME_TYPES,
    initFrameThemeSystem,
    setFrameTheme,
    getFrameTheme,
    toggleFrameTheme,
    generateFrameHTML,
    generateFrameHeader,
    generateFrameFooter,
    generateAvatar,
    generatePostHeader,
    generateLinkPreview,
    getAllFrames,
    getFramesByPlatform,
    applyPlatformTheme,
    updateAllPlatformFrames
  };

  // Auto-initialize with current theme from localStorage or default to dark
  const savedTheme = localStorage.getItem('vista-theme') || 'dark';
  initFrameThemeSystem(savedTheme);
}
