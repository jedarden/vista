/**
 * Platform Context Frames Renderer
 *
 * Enhanced rendering engine for platform context frames with support for:
 * - Responsive sizing and layouts
 * - Category-based template selection
 * - Progressive loading
 * - Accessibility improvements
 * - Performance optimization
 */

'use strict';

// ============================================================================
// CATEGORY-BASED FRAME HELPERS
// ============================================================================

/**
 * Platform category templates organized by layout pattern
 */
const CATEGORY_TEMPLATES = {
  // Social feed layouts (posts with engagement metrics)
  social: {
    commonLayout: 'feed',
    responsiveBreakpoints: {
      mobile: 350,
      tablet: 600,
      desktop: 800
    },
    defaultAspectRatio: '1.91:1'
  },

  // Messaging thread layouts (chat bubbles, avatars)
  messaging: {
    commonLayout: 'thread',
    responsiveBreakpoints: {
      mobile: 320,
      tablet: 480,
      desktop: 600
    },
    defaultAspectRatio: 'variable'
  },

  // Developer platform layouts (code comments, issues)
  collaboration: {
    commonLayout: 'documentation',
    responsiveBreakpoints: {
      mobile: 400,
      tablet: 700,
      desktop: 900
    },
    defaultAspectRatio: 'variable'
  },

  // Content platform layouts (articles, media)
  content: {
    commonLayout: 'article',
    responsiveBreakpoints: {
      mobile: 350,
      tablet: 600,
      desktop: 800
    },
    defaultAspectRatio: 'variable'
  },

  // Email client layouts (threaded messages)
  email: {
    commonLayout: 'thread',
    responsiveBreakpoints: {
      mobile: 350,
      tablet: 600,
      desktop: 800
    },
    defaultAspectRatio: 'variable'
  },

  // RSS reader layouts (article lists)
  rss: {
    commonLayout: 'list',
    responsiveBreakpoints: {
      mobile: 350,
      tablet: 600,
      desktop: 800
    },
    defaultAspectRatio: 'variable'
  },

  // Generic fallback
  other: {
    commonLayout: 'card',
    responsiveBreakpoints: {
      mobile: 350,
      tablet: 600,
      desktop: 800
    },
    defaultAspectRatio: 'variable'
  }
};

/**
 * Get platform category information
 * @param {string} platformId - Platform ID
 * @returns {object} Category information
 */
function getPlatformCategoryInfo(platformId) {
  if (typeof window !== 'undefined' && window.PLATFORM_FRAMES) {
    const frame = window.PLATFORM_FRAMES[platformId];
    if (frame) {
      return {
        category: frame.category,
        ...CATEGORY_TEMPLATES[frame.category] || CATEGORY_TEMPLATES.other
      };
    }
  }
  return CATEGORY_TEMPLATES.other;
}

/**
 * Get platforms by category
 * @param {string} category - Category name
 * @returns {string[]} Array of platform IDs in the category
 */
function getPlatformsByCategory(category) {
  if (typeof window !== 'undefined' && window.PLATFORM_FRAMES) {
    return Object.entries(window.PLATFORM_FRAMES)
      .filter(([_, frame]) => frame.category === category)
      .map(([id, _]) => id);
  }
  return [];
}

/**
 * Get all platform categories with their platforms
 * @returns {object} Categories with platform lists
 */
function getAllCategories() {
  const categories = {};
  if (typeof window !== 'undefined' && window.PLATFORM_FRAMES) {
    Object.entries(window.PLATFORM_FRAMES).forEach(([id, frame]) => {
      if (!categories[frame.category]) {
        categories[frame.category] = [];
      }
      categories[frame.category].push(id);
    });
  }
  return categories;
}

// ============================================================================
// RESPONSIVE FRAME RENDERING
// ============================================================================

/**
 * Generate responsive CSS for a platform frame
 * @param {string} platformId - Platform ID
 * @param {string} theme - Theme mode ('dark' or 'light')
 * @returns {string} Responsive CSS
 */
function generateResponsiveCSS(platformId, theme = 'dark') {
  const categoryInfo = getPlatformCategoryInfo(platformId);
  const breakpoints = categoryInfo.responsiveBreakpoints;

  let css = `/* Responsive styles for ${platformId} */\n`;
  css += `.${platformId}-context {\n`;
  css += `  max-width: 100%;\n`;
  css += `  overflow: hidden;\n`;
  css += `}\n\n`;

  // Mobile breakpoint
  css += `@media (max-width: ${breakpoints.tablet - 1}px) {\n`;
  css += `  .${platformId}-context {\n`;
  css += `    font-size: 13px;\n`;
  css += `  }\n`;
  css += `  .${platformId}-context .context-frame-avatar,\n`;
  css += `  .${platformId}-context .context-frame-icon {\n`;
  css += `    width: 32px;\n`;
  css += `    height: 32px;\n`;
  css += `  }\n`;
  css += `}\n\n`;

  // Tablet breakpoint
  css += `@media (min-width: ${breakpoints.tablet}px) and (max-width: ${breakpoints.desktop - 1}px) {\n`;
  css += `  .${platformId}-context {\n`;
  css += `    font-size: 14px;\n`;
  css += `  }\n`;
  css += `}\n\n`;

  // Desktop breakpoint
  css += `@media (min-width: ${breakpoints.desktop}px) {\n`;
  css += `  .${platformId}-context {\n`;
  css += `    font-size: 15px;\n`;
  css += `  }\n`;
  css += `}\n`;

  return css;
}

/**
 * Calculate optimal frame size based on container and content
 * @param {string} platformId - Platform ID
 * @param {HTMLElement} container - Container element
 * @param {object} content - Content data
 * @returns {object} Width and height calculations
 */
function calculateOptimalFrameSize(platformId, container, content) {
  if (!container) {
    return { width: '100%', height: 'auto' };
  }

  const containerWidth = container.clientWidth;
  const categoryInfo = getPlatformCategoryInfo(platformId);
  const breakpoints = categoryInfo.responsiveBreakpoints;

  // Determine breakpoint
  let breakpoint = 'mobile';
  if (containerWidth >= breakpoints.desktop) {
    breakpoint = 'desktop';
  } else if (containerWidth >= breakpoints.tablet) {
    breakpoint = 'tablet';
  }

  // Calculate optimal width
  const maxWidth = Math.min(containerWidth, breakpoints[breakpoint]);

  // Calculate aspect ratio height
  let aspectRatio = categoryInfo.defaultAspectRatio;
  if (typeof window !== 'undefined' && window.PLATFORM_FRAMES) {
    const frame = window.PLATFORM_FRAMES[platformId];
    if (frame && frame.aspectRatio !== 'variable') {
      aspectRatio = frame.aspectRatio;
    }
  }

  let height = 'auto';
  if (aspectRatio !== 'variable' && content.image) {
    // Parse aspect ratio (e.g., "16:9" -> 16/9)
    const [width, heightRatio] = aspectRatio.split(':').map(Number);
    height = (maxWidth * heightRatio) / width;
  }

  return {
    width: `${maxWidth}px`,
    height: typeof height === 'number' ? `${height}px` : height
  };
}

// ============================================================================
// ACCESSIBILITY ENHANCEMENTS
// ============================================================================

/**
 * Add accessibility attributes to a frame element
 * @param {HTMLElement} frameElement - Frame element
 * @param {string} platformId - Platform ID
 * @param {object} content - Content data
 */
function enhanceAccessibility(frameElement, platformId, content) {
  if (!frameElement) return;

  // Add ARIA labels
  const platformName = content.title || 'content';
  frameElement.setAttribute('role', 'article');
  frameElement.setAttribute('aria-label', `Preview of ${platformName} on ${platformId}`);

  // Add aria-live to dynamic content regions
  const dynamicRegions = frameElement.querySelectorAll('[data-dynamic="true"]');
  dynamicRegions.forEach(region => {
    region.setAttribute('aria-live', 'polite');
  });

  // Ensure keyboard navigability
  const interactiveElements = frameElement.querySelectorAll('button, a, [role="button"]');
  interactiveElements.forEach(el => {
    if (!el.getAttribute('tabindex')) {
      el.setAttribute('tabindex', '0');
    }
  });

  // Add aria-hidden to decorative elements
  const decorativeElements = frameElement.querySelectorAll('[data-decorative="true"]');
  decorativeElements.forEach(el => {
    el.setAttribute('aria-hidden', 'true');
  });
}

/**
 * Generate ARIA landmarks for platform frame
 * @param {string} platformId - Platform ID
 * @returns {object} ARIA landmark mappings
 */
function getAriaLandmarks(platformId) {
  const categoryInfo = getPlatformCategoryInfo(platformId);
  const landmarks = {
    header: 'banner',
    main: 'main',
    sidebar: 'complementary',
    navigation: 'navigation',
    footer: 'contentinfo'
  };

  // Adjust landmarks based on platform category
  if (categoryInfo.category === 'messaging') {
    landmarks.main = 'log'; // Chat logs use aria-live
  } else if (categoryInfo.category === 'email') {
    landmarks.main = 'region';
  }

  return landmarks;
}

// ============================================================================
// PERFORMANCE OPTIMIZATION
// ============================================================================

/**
 * Lazy-load images in a frame
 * @param {HTMLElement} frameElement - Frame element
 */
function setupLazyLoading(frameElement) {
  if (!frameElement || !('IntersectionObserver' in window)) {
    return;
  }

  const images = frameElement.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('img-loading');
        img.classList.add('img-loaded');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

/**
 * Debounce frame rendering to prevent excessive updates
 * @param {Function} renderFn - Render function
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced render function
 */
function debounceRender(renderFn, delay = 100) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => renderFn.apply(this, args), delay);
  };
}

/**
 * Cache rendered frames to avoid re-rendering
 */
class FrameCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Generate cache key from render parameters
   * @param {string} platformId - Platform ID
   * @param {object} content - Content data
   * @param {string} theme - Theme mode
   * @returns {string} Cache key
   */
  generateKey(platformId, content, theme) {
    return `${platformId}-${theme}-${JSON.stringify(content)}`;
  }

  /**
   * Get cached frame HTML
   * @param {string} platformId - Platform ID
   * @param {object} content - Content data
   * @param {string} theme - Theme mode
   * @returns {string|null} Cached HTML or null
   */
  get(platformId, content, theme) {
    const key = this.generateKey(platformId, content, theme);
    return this.cache.get(key) || null;
  }

  /**
   * Set cached frame HTML
   * @param {string} platformId - Platform ID
   * @param {object} content - Content data
   * @param {string} theme - Theme mode
   * @param {string} html - HTML to cache
   */
  set(platformId, content, theme, html) {
    const key = this.generateKey(platformId, content, theme);

    // Evict oldest if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, html);
  }

  /**
   * Clear all cached frames
   */
  clear() {
    this.cache.clear();
  }
}

// Global frame cache instance
const frameCache = new FrameCache();

// ============================================================================
// FRAME VALIDATION
// ============================================================================

/**
 * Validate content data before rendering
 * @param {object} content - Content data to validate
 * @returns {object} Validation result with errors and warnings
 */
function validateContent(content) {
  const errors = [];
  const warnings = [];

  if (!content || typeof content !== 'object') {
    errors.push('Content must be an object');
    return { valid: false, errors, warnings };
  }

  // Required fields
  if (!content.title && !content.image) {
    warnings.push('Content missing both title and image');
  }

  // URL validation
  if (content.image && !isValidUrl(content.image)) {
    warnings.push('Image URL may be invalid');
  }

  // Text length validation
  if (content.title && content.title.length > 200) {
    warnings.push('Title unusually long (>200 chars)');
  }

  if (content.description && content.description.length > 500) {
    warnings.push('Description unusually long (>500 chars)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL appears valid
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} html - HTML to sanitize
 * @returns {string} Sanitized HTML
 */
function sanitizeHTML(html) {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

// ============================================================================
// ENHANCED RENDERING
// ============================================================================

/**
 * Build context frame with caching and validation
 * @param {string} platformId - Platform ID
 * @param {object} content - Content data
 * @param {string} theme - Theme mode
 * @param {object} options - Additional options
 * @returns {object} Render result with HTML and metadata
 */
function buildEnhancedFrame(platformId, content, theme = 'dark', options = {}) {
  const {
    useCache = true,
    validate = true,
    accessibility = true,
    responsive = true
  } = options;

  // Validate content
  if (validate) {
    const validation = validateContent(content);
    if (!validation.valid) {
      console.error('Content validation failed:', validation.errors);
      return { html: '', errors: validation.errors };
    }
    if (validation.warnings.length > 0) {
      console.warn('Content validation warnings:', validation.warnings);
    }
  }

  // Check cache
  if (useCache) {
    const cached = frameCache.get(platformId, content, theme);
    if (cached) {
      return { html: cached, cached: true };
    }
  }

  // Build frame
  let html = '';
  if (typeof window !== 'undefined' && window.buildContextFrame) {
    html = window.buildContextFrame(platformId, content, theme);
  }

  // Cache result
  if (useCache && html) {
    frameCache.set(platformId, content, theme, html);
  }

  return { html, cached: false };
}

/**
 * Render frame into container with enhancements
 * @param {HTMLElement} container - Container element
 * @param {string} platformId - Platform ID
 * @param {object} content - Content data
 * @param {string} theme - Theme mode
 * @param {object} options - Additional options
 * @returns {HTMLElement} Rendered frame element
 */
function renderFrame(container, platformId, content, theme = 'dark', options = {}) {
  if (!container) {
    throw new Error('Container element required');
  }

  // Build frame
  const result = buildEnhancedFrame(platformId, content, theme, options);
  if (!result.html) {
    return null;
  }

  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'platform-frame-wrapper';
  wrapper.innerHTML = result.html;

  // Calculate responsive size
  if (options.responsive !== false) {
    const size = calculateOptimalFrameSize(platformId, container, content);
    wrapper.style.width = size.width;
    wrapper.style.height = size.height;
  }

  // Accessibility enhancements
  if (options.accessibility !== false && wrapper.firstElementChild) {
    enhanceAccessibility(wrapper.firstElementChild, platformId, content);
  }

  // Lazy loading
  if (options.lazyLoad !== false) {
    setupLazyLoading(wrapper);
  }

  // Append to container
  container.appendChild(wrapper);

  return wrapper;
}

// ============================================================================
// STATISTICS AND ANALYSIS
// ============================================================================

/**
 * Get platform frame statistics
 * @returns {object} Statistics about platform frames
 */
function getPlatformStats() {
  const stats = {
    totalPlatforms: 0,
    platformsWithThemeSupport: 0,
    byCategory: {},
    commonAspectRatios: {}
  };

  if (typeof window !== 'undefined' && window.PLATFORM_FRAMES) {
    const platforms = window.PLATFORM_FRAMES;
    stats.totalPlatforms = Object.keys(platforms).length;

    Object.entries(platforms).forEach(([id, frame]) => {
      // Theme support
      if (frame.hasThemeSupport) {
        stats.platformsWithThemeSupport++;
      }

      // By category
      if (!stats.byCategory[frame.category]) {
        stats.byCategory[frame.category] = 0;
      }
      stats.byCategory[frame.category]++;

      // Aspect ratios
      if (!stats.commonAspectRatios[frame.aspectRatio]) {
        stats.commonAspectRatios[frame.aspectRatio] = 0;
      }
      stats.commonAspectRatios[frame.aspectRatio]++;
    });
  }

  return stats;
}

/**
 * Analyze frame rendering performance
 * @param {Function} renderFn - Render function to measure
 * @returns {object} Performance metrics
 */
function measurePerformance(renderFn) {
  const startTime = performance.now();
  const result = renderFn();
  const endTime = performance.now();

  return {
    duration: endTime - startTime,
    result
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

const PlatformFramesRenderer = {
  // Category helpers
  getPlatformCategoryInfo,
  getPlatformsByCategory,
  getAllCategories,
  CATEGORY_TEMPLATES,

  // Responsive rendering
  generateResponsiveCSS,
  calculateOptimalFrameSize,

  // Accessibility
  enhanceAccessibility,
  getAriaLandmarks,

  // Performance
  setupLazyLoading,
  debounceRender,
  frameCache,

  // Validation
  validateContent,
  isValidUrl,
  sanitizeHTML,

  // Enhanced rendering
  buildEnhancedFrame,
  renderFrame,

  // Statistics
  getPlatformStats,
  measurePerformance
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlatformFramesRenderer;
}

// Browser: expose to global scope
if (typeof window !== 'undefined') {
  window.PlatformFramesRenderer = PlatformFramesRenderer;
}
