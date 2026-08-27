'use strict';

/**
 * Page Type Detection Heuristics
 *
 * Detects page types using multiple signals with priority:
 * 1. og:type meta tag (article, product, website, etc.)
 * 2. JSON-LD @type (Recipe, SoftwareApplication, etc.)
 * 3. URL patterns (github.com = Open Source, docs = SaaS, etc.)
 * 4. Content keywords in title/description
 *
 * Returns normalized type strings: 'blog', 'saas', 'recipe', 'opensource',
 * 'portfolio', 'ecommerce', 'website', 'article', 'product', 'other'
 */

/**
 * og:type to normalized type mapping
 */
const OG_TYPE_MAPPING = {
  'article': 'article',
  'blog': 'blog',
  'website': 'website',
  'product': 'product',
  'recipe': 'recipe',
  'video': 'video',
  'music.song': 'music',
  'music.album': 'music',
  'book': 'book',
  'profile': 'profile',
  'business.business': 'business',
  'place': 'place',
  'restaurant': 'restaurant',
};

/**
 * JSON-LD @type to normalized type mapping
 */
const JSON_LD_TYPE_MAPPING = {
  'Article': 'article',
  'BlogPosting': 'blog',
  'NewsArticle': 'article',
  'TechArticle': 'article',
  'Recipe': 'recipe',
  'SoftwareApplication': 'saas',
  'WebApplication': 'saas',
  'MobileApplication': 'saas',
  'Product': 'product',
  'Organization': 'business',
  'Person': 'profile',
  'ProfilePage': 'profile',
  'WebSite': 'website',
  'AboutPage': 'website',
  'ContactPage': 'website',
  'FAQPage': 'website',
  'ItemPage': 'ecommerce',
  'Offer': 'ecommerce',
  'AggregateOffer': 'ecommerce',
  'CollectionPage': 'ecommerce',
};

/**
 * URL pattern to type mappings
 */
const URL_PATTERNS = [
  // Open Source / Development
  {
    pattern: /github\.com|gitlab\.com|bitbucket\.org|sourceforge\.net|codepen\.io/i,
    type: 'opensource',
  },
  {
    pattern: /dev\.to|hashnode\.com|medium\.com|substack\.com/i,
    type: 'blog',
  },
  {
    pattern: /\.github\.io|\.gitlab\.io|\.vercel\.app|\.netlify\.app/i,
    type: 'portfolio',
  },
  // Documentation / SaaS
  {
    pattern: /docs\./i,
    type: 'saas',
  },
  {
    pattern: /app\.|dashboard\.|console\./i,
    type: 'saas',
  },
  {
    pattern: /\.com\/docs|\.org\/docs|\.io\/docs/i,
    type: 'saas',
  },
  // E-commerce
  {
    pattern: /shop|store|product|cart|checkout|order|buy/i,
    type: 'ecommerce',
  },
  {
    pattern: /amazon|ebay|etsy|shopify|woocommerce|magento/i,
    type: 'ecommerce',
  },
  // Recipe sites
  {
    pattern: /allrecipes\.com|food\.network|epicurious|bonappetit|seriouseats/i,
    type: 'recipe',
  },
  {
    pattern: /recipe|cook|baking|chef/i,
    type: 'recipe',
  },
  // Portfolio / Personal
  {
    pattern: /portfolio|personal|about-me|me\.|cv|resume/i,
    type: 'portfolio',
  },
  // Blog patterns
  {
    pattern: /blog|\/blog\/|\/posts\/|\/articles\/|\/journal/i,
    type: 'blog',
  },
];

/**
 * Content keyword patterns for title/description
 */
const CONTENT_KEYWORDS = {
  blog: [
    /blog|post|article|diary|journal|thoughts|musings/i,
    /tutorial|how-to|guide|tips|tricks/i,
  ],
  saas: [
    /software|service|platform|tool|app|application/i,
    /cloud|api|dashboard|analytics|automation/i,
    /subscription|pricing|plans|sign up|get started/i,
  ],
  ecommerce: [
    /shop|store|buy|purchase|order|cart|checkout/i,
    /product|item|deal|discount|offer|sale/i,
    /price|shipping|delivery|inventory/i,
  ],
  recipe: [
    /recipe|cook|baking|ingredient|instruction|preparation/i,
    /cuisine|dish|meal|food|kitchen|chef/i,
  ],
  opensource: [
    /open source|opensource|github|repository|code|fork|pull request/i,
    /library|framework|package|npm|pip|composer/i,
  ],
  portfolio: [
    /portfolio|projects|work|case study|showcase/i,
    /design|developer|engineer|freelance|consultant/i,
  ],
};

/**
 * Detect page type from meta tags and URL
 *
 * @param {Object} meta - Parsed meta tags object from fetcher.js
 * @param {string} url - The page URL
 * @returns {string} Normalized type string
 */
function detectPageType(meta, url) {
  // Priority 1: og:type
  const ogType = detectFromOgType(meta);
  if (ogType) {
    return ogType;
  }

  // Priority 2: JSON-LD
  const jsonLdType = detectFromJsonLd(meta);
  if (jsonLdType) {
    return jsonLdType;
  }

  // Priority 3: URL patterns
  const urlType = detectFromUrl(url);
  if (urlType) {
    return urlType;
  }

  // Priority 4: Content keywords
  const contentType = detectFromContent(meta);
  if (contentType) {
    return contentType;
  }

  // Default fallback
  return 'website';
}

/**
 * Detect type from og:type meta tag
 * Priority: 1 (highest)
 */
function detectFromOgType(meta) {
  const ogType = meta.og?.type;
  if (!ogType) {
    return null;
  }

  const normalized = OG_TYPE_MAPPING[ogType.toLowerCase()];
  if (normalized) {
    return normalized;
  }

  // For unmapped og:type values, return them as-is if they look like known types
  if (['article', 'blog', 'website', 'product', 'video', 'profile'].includes(ogType.toLowerCase())) {
    return ogType.toLowerCase();
  }

  return null;
}

/**
 * Detect type from JSON-LD structured data
 * Priority: 2
 */
function detectFromJsonLd(meta) {
  const jsonLd = meta.jsonLd;
  if (!jsonLd || !Array.isArray(jsonLd) || jsonLd.length === 0) {
    return null;
  }

  // Check each JSON-LD object for @type
  for (const ld of jsonLd) {
    if (!ld || typeof ld !== 'object') {
      continue;
    }

    // Handle both string @type and array @type
    const types = Array.isArray(ld['@type']) ? ld['@type'] : [ld['@type']];

    for (const type of types) {
      if (!type || typeof type !== 'string') {
        continue;
      }

      // Check if this type is in our mapping
      const normalized = JSON_LD_TYPE_MAPPING[type];
      if (normalized) {
        return normalized;
      }

      // For unmapped types, check if it ends with common suffixes
      const lowerType = type.toLowerCase();
      if (lowerType.endsWith('posting') || lowerType.endsWith('article')) {
        return 'article';
      }
      if (lowerType.endsWith('application') || lowerType.endsWith('software')) {
        return 'saas';
      }
    }
  }

  return null;
}

/**
 * Detect type from URL patterns
 * Priority: 3
 */
function detectFromUrl(url) {
  if (!url) {
    return null;
  }

  for (const { pattern, type } of URL_PATTERNS) {
    if (pattern.test(url)) {
      return type;
    }
  }

  return null;
}

/**
 * Detect type from content keywords in title/description
 * Priority: 4 (lowest, fallback)
 */
function detectFromContent(meta) {
  const title = meta.title || '';
  const description = meta.description || '';
  const ogTitle = meta.og?.title || '';
  const ogDesc = meta.og?.description || '';

  // Combine all text content for keyword matching
  const content = [title, description, ogTitle, ogDesc].join(' ').toLowerCase();

  // Score each type based on keyword matches
  const scores = {};
  for (const [type, patterns] of Object.entries(CONTENT_KEYWORDS)) {
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        score += 1;
      }
    }
    if (score > 0) {
      scores[type] = score;
    }
  }

  // Return the type with the highest score
  if (Object.keys(scores).length > 0) {
    const sortedTypes = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    return sortedTypes[0][0];
  }

  return null;
}

/**
 * Get a detailed breakdown of the detection process
 * Useful for debugging and understanding why a type was detected
 *
 * @param {Object} meta - Parsed meta tags object
 * @param {string} url - The page URL
 * @returns {Object} Detailed detection breakdown
 */
function detectPageTypeDetailed(meta, url) {
  const result = {
    detectedType: 'website',
    signals: {
      ogType: null,
      jsonLdTypes: [],
      urlMatch: null,
      contentMatches: [],
    },
    detectionPath: [],
  };

  // Check og:type
  const ogType = detectFromOgType(meta);
  if (ogType) {
    result.detectedType = ogType;
    result.signals.ogType = meta.og?.type;
    result.detectionPath.push('og:type');
    return result;
  }

  // Check JSON-LD
  const jsonLdType = detectFromJsonLd(meta);
  if (jsonLdType) {
    result.detectedType = jsonLdType;
    if (meta.jsonLd && Array.isArray(meta.jsonLd)) {
      for (const ld of meta.jsonLd) {
        if (ld && ld['@type']) {
          result.signals.jsonLdTypes.push(ld['@type']);
        }
      }
    }
    result.detectionPath.push('json-ld');
    return result;
  }

  // Check URL patterns
  const urlType = detectFromUrl(url);
  if (urlType) {
    result.detectedType = urlType;
    result.signals.urlMatch = url;
    result.detectionPath.push('url-pattern');
    return result;
  }

  // Check content keywords
  const contentType = detectFromContent(meta);
  if (contentType) {
    result.detectedType = contentType;
    const title = meta.title || '';
    const description = meta.description || '';
    const ogTitle = meta.og?.title || '';
    const ogDesc = meta.og?.description || '';
    const content = [title, description, ogTitle, ogDesc].join(' ').toLowerCase();

    for (const [type, patterns] of Object.entries(CONTENT_KEYWORDS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          result.signals.contentMatches.push({ type, pattern: pattern.toString() });
        }
      }
    }
    result.detectionPath.push('content-keywords');
    return result;
  }

  // Default fallback
  result.detectionPath.push('default-fallback');
  return result;
}

module.exports = {
  detectPageType,
  detectPageTypeDetailed,
  detectFromOgType,
  detectFromJsonLd,
  detectFromUrl,
  detectFromContent,
  OG_TYPE_MAPPING,
  JSON_LD_TYPE_MAPPING,
  URL_PATTERNS,
  CONTENT_KEYWORDS,
};
