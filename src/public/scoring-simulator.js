'use strict';

// =============================================================================
// VISTA Client-Side Scoring Simulator
// Simulates the impact of fixes on platform scores
// =============================================================================

const PLATFORMS = [
  // Social & Microblogging
  { id: 'google', name: 'Google Search', category: 'Social & Microblogging', weight: 10 },
  { id: 'facebook', name: 'Facebook', category: 'Social & Microblogging', weight: 10 },
  { id: 'twitter', name: 'X (Twitter)', category: 'Social & Microblogging', weight: 10 },
  { id: 'linkedin', name: 'LinkedIn', category: 'Social & Microblogging', weight: 9 },
  { id: 'reddit', name: 'Reddit', category: 'Social & Microblogging', weight: 7 },
  { id: 'mastodon', name: 'Mastodon', category: 'Social & Microblogging', weight: 4 },
  { id: 'bluesky', name: 'Bluesky', category: 'Social & Microblogging', weight: 5 },
  { id: 'threads', name: 'Threads', category: 'Social & Microblogging', weight: 6 },
  { id: 'tumblr', name: 'Tumblr', category: 'Social & Microblogging', weight: 3 },
  { id: 'pinterest', name: 'Pinterest', category: 'Social & Microblogging', weight: 5 },
  // Messaging
  { id: 'slack', name: 'Slack', category: 'Messaging', weight: 9 },
  { id: 'discord', name: 'Discord', category: 'Messaging', weight: 8 },
  { id: 'whatsapp', name: 'WhatsApp', category: 'Messaging', weight: 9 },
  { id: 'imessage', name: 'iMessage', category: 'Messaging', weight: 8 },
  { id: 'telegram', name: 'Telegram', category: 'Messaging', weight: 7 },
  { id: 'signal', name: 'Signal', category: 'Messaging', weight: 5 },
  { id: 'teams', name: 'Microsoft Teams', category: 'Messaging', weight: 7 },
  { id: 'googlechat', name: 'Google Chat', category: 'Messaging', weight: 6 },
  { id: 'zoom', name: 'Zoom Chat', category: 'Messaging', weight: 5 },
  { id: 'line', name: 'Line', category: 'Messaging', weight: 4 },
  { id: 'kakaotalk', name: 'KakaoTalk', category: 'Messaging', weight: 3 },
  // Collaboration
  { id: 'notion', name: 'Notion', category: 'Collaboration & Productivity', weight: 6 },
  { id: 'jira', name: 'Jira / Confluence', category: 'Collaboration & Productivity', weight: 5 },
  { id: 'github', name: 'GitHub', category: 'Collaboration & Productivity', weight: 7 },
  { id: 'trello', name: 'Trello', category: 'Collaboration & Productivity', weight: 4 },
  { id: 'figma', name: 'Figma', category: 'Collaboration & Productivity', weight: 4 },
  // Content
  { id: 'medium', name: 'Medium', category: 'Content Platforms', weight: 4 },
  { id: 'substack', name: 'Substack', category: 'Content Platforms', weight: 4 },
  // Email
  { id: 'outlook', name: 'Outlook', category: 'Email', weight: 5 },
  { id: 'gmail', name: 'Gmail', category: 'Email', weight: 6 },
  // RSS
  { id: 'feedly', name: 'Feedly / RSS', category: 'RSS / Readers', weight: 3 },
];

function pointsToGrade(points) {
  if (points >= 95) return 'A+';
  if (points >= 85) return 'A';
  if (points >= 70) return 'B';
  if (points >= 55) return 'C';
  if (points >= 35) return 'D';
  return 'F';
}

function scorePlatform(platformId, meta, imageProbe) {
  const ogTitle = meta.og?.title || meta.title;
  const ogDesc = meta.og?.description || meta.description;
  const ogImage = meta.og?.image;
  const twitterCard = meta.twitter?.card;
  const twitterImage = meta.twitter?.image;
  const imgW = imageProbe?.width;
  const imgH = imageProbe?.height;

  const issues = [];
  const fixes = [];
  let points = 100;

  const hasImage = !!ogImage;
  const imageIsHttps = ogImage && ogImage.startsWith('https://');
  const imageMeetsMin = imgW && imgH && imgW >= 200 && imgH >= 200;
  const imageMeetsRecommended = imgW && imgH && imgW >= 1200 && imgH >= 630;

  switch (platformId) {
    case 'google': {
      if (!meta.title) {
        points -= 50;
        issues.push('Missing <title> tag');
        fixes.push('<title>Your Page Title</title>');
      } else if (meta.title.length > 60) {
        points -= 20;
        issues.push(`Title is ${meta.title.length} chars — truncates at ~60 on Google`);
      }
      if (!meta.description) {
        points -= 30;
        issues.push('Missing <meta name="description">');
        fixes.push('<meta name="description" content="..." />');
      } else if (meta.description.length > 158) {
        points -= 15;
        issues.push(`Description is ${meta.description.length} chars — truncates at ~158 on Google`);
      }
      break;
    }

    case 'facebook':
    case 'threads': {
      if (!ogTitle) { points -= 40; issues.push('Missing og:title'); fixes.push('<meta property="og:title" content="..." />'); }
      else if (ogTitle.length > 60) { points -= 15; issues.push('Title may truncate on Facebook (>60 chars)'); }

      if (!ogDesc) { points -= 20; issues.push('Missing og:description'); fixes.push('<meta property="og:description" content="..." />'); }
      else if (ogDesc.length > 160) { points -= 10; issues.push('Description may truncate on Facebook (>160 chars)'); }

      if (!hasImage) { points -= 30; issues.push('Missing og:image'); fixes.push('<meta property="og:image" content="https://..." />'); }
      else {
        if (!imageIsHttps) { points -= 10; issues.push('og:image should use HTTPS'); }
        if (!imageMeetsMin) { points -= 20; issues.push('Image too small (min 200×200px)'); }
        else if (!imageMeetsRecommended) { points -= 10; issues.push('Image below recommended 1200×630px'); }
      }
      break;
    }

    case 'twitter': {
      const effectiveTitle = meta.twitter?.title || meta.og?.title || meta.title;
      const effectiveDesc = meta.twitter?.description || meta.og?.description || meta.description;
      const effectiveImage = meta.twitter?.image || meta.og?.image;

      if (!twitterCard) { points -= 15; issues.push('Missing twitter:card'); fixes.push('<meta name="twitter:card" content="summary_large_image" />'); }
      if (!effectiveTitle) { points -= 40; issues.push('No title found'); }
      else if (effectiveTitle.length > 70) { points -= 10; issues.push('Title may truncate on X (>70 chars)'); }
      if (!effectiveDesc) { points -= 15; issues.push('No description'); }
      if (!effectiveImage) { points -= 20; issues.push('No image'); fixes.push('<meta name="twitter:image" content="https://..." />'); }
      break;
    }

    case 'linkedin': {
      if (!ogTitle) { points -= 40; issues.push('Missing og:title'); fixes.push('<meta property="og:title" content="..." />'); }
      else if (ogTitle.length > 60) { points -= 15; issues.push('Title may truncate on LinkedIn (>60 chars)'); }
      if (!ogDesc) { points -= 20; issues.push('Missing og:description'); }
      if (!hasImage) { points -= 30; issues.push('Missing og:image'); fixes.push('<meta property="og:image" content="https://..." />'); }
      else if (!imageMeetsRecommended) { points -= 15; issues.push('Image below recommended 1200×627px for LinkedIn'); }
      break;
    }

    case 'reddit': {
      if (!ogTitle && !meta.title) { points -= 50; issues.push('No title'); }
      if (!ogDesc && !meta.description) { points -= 20; issues.push('No description'); }
      if (!hasImage) { points -= 20; issues.push('Missing og:image'); }
      else if (!imageMeetsMin) { points -= 30; issues.push('Image too small for Reddit (min 200×200px)'); }
      break;
    }

    case 'mastodon':
    case 'bluesky':
    case 'medium':
    case 'substack': {
      if (!ogTitle && !meta.title) { points -= 50; issues.push('No title'); }
      if (!hasImage) { points -= 30; issues.push('Missing og:image'); }
      if (!ogDesc && !meta.description) { points -= 20; issues.push('No description'); }
      break;
    }

    case 'tumblr': {
      if (!ogTitle && !meta.title) { points -= 50; issues.push('No title'); }
      if (!hasImage) { points -= 30; issues.push('No image for thumbnail'); }
      break;
    }

    case 'pinterest': {
      if (!hasImage) { points -= 50; issues.push('No og:image'); }
      else {
        if (imgW && imgH && imgW > imgH) {
          points -= 10;
          issues.push('Horizontal image — Pinterest prefers vertical 2:3');
        }
      }
      if (!ogTitle) { points -= 30; issues.push('Missing og:title'); }
      break;
    }

    case 'slack': {
      if (!ogTitle) { points -= 40; issues.push('Missing og:title'); }
      if (!ogDesc) { points -= 20; issues.push('Missing og:description'); }
      if (!hasImage) { points -= 20; issues.push('Missing og:image'); }
      break;
    }

    case 'discord': {
      if (!ogTitle) { points -= 40; issues.push('Missing og:title'); }
      if (!hasImage) { points -= 25; issues.push('Missing og:image'); }
      if (!meta.themeColor) { points -= 5; issues.push('Missing theme-color'); fixes.push('<meta name="theme-color" content="#hexcolor" />'); }
      if (!imageIsHttps) { points -= 15; issues.push('Discord requires HTTPS for og:image'); }
      break;
    }

    case 'whatsapp': {
      if (!ogTitle) { points -= 40; issues.push('Missing og:title'); }
      if (!hasImage) { points -= 30; issues.push('Missing og:image'); }
      else if (!imageIsHttps) { points -= 30; issues.push('WhatsApp ignores HTTP image URLs — use HTTPS'); }
      break;
    }

    case 'imessage': {
      if (!ogTitle && !meta.title) { points -= 50; issues.push('No title'); }
      if (!hasImage) { points -= 40; issues.push('Missing og:image — iMessage shows image prominently'); }
      break;
    }

    case 'telegram': {
      if (!ogTitle && !meta.title) { points -= 50; issues.push('No title'); }
      if (!hasImage) { points -= 30; issues.push('Missing og:image'); }
      if (!ogDesc && !meta.description) { points -= 20; issues.push('No description'); }
      break;
    }

    case 'signal': {
      if (!ogTitle) { points -= 40; issues.push('Missing og:title'); }
      if (!hasImage) { points -= 30; issues.push('Missing og:image'); }
      else if (!imageIsHttps) { points -= 25; issues.push('Signal requires HTTPS for images'); }
      break;
    }

    case 'teams': {
      if (!ogTitle) { points -= 40; issues.push('Missing og:title'); }
      if (!hasImage) { points -= 30; issues.push('Missing og:image'); }
      if (!ogDesc) { points -= 20; issues.push('Missing og:description'); }
      break;
    }

    case 'googlechat':
    case 'zoom':
    case 'line':
    case 'kakaotalk': {
      if (!ogTitle && !meta.title) { points -= 40; issues.push('No title'); }
      if (!hasImage) { points -= 30; issues.push('Missing og:image'); }
      break;
    }

    case 'notion':
    case 'jira':
    case 'github':
    case 'trello':
    case 'figma': {
      if (!ogTitle && !meta.title) { points -= 50; issues.push('No title'); }
      if (!hasImage) { points -= 25; issues.push('Missing og:image'); }
      break;
    }

    case 'outlook':
    case 'gmail': {
      if (!ogTitle) { points -= 35; issues.push('Missing og:title'); }
      if (!ogDesc) { points -= 20; issues.push('Missing og:description'); }
      if (!hasImage) { points -= 25; issues.push('Missing og:image'); }
      else if (!imageIsHttps) { points -= 15; issues.push('Email clients require HTTPS image URLs'); }
      break;
    }

    case 'feedly': {
      if (!hasImage) { points -= 30; issues.push('Missing og:image (Feedly uses this for feed thumbnails)'); }
      if (!ogTitle && !meta.title) { points -= 40; issues.push('No title'); }
      break;
    }
  }

  const grade = pointsToGrade(Math.max(0, points));
  return { grade, score: Math.max(0, points), issues, fixes };
}

function scoreAll(meta, imageProbe) {
  const scores = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;
  const gradeCounts = { 'A+': 0, A: 0, B: 0, C: 0, D: 0, F: 0 };

  for (const platform of PLATFORMS) {
    const result = scorePlatform(platform.id, meta, imageProbe);
    scores[platform.id] = { ...result, platform };

    totalWeightedScore += result.score * platform.weight;
    totalWeight += platform.weight;
    gradeCounts[result.grade]++;
  }

  const avgScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  const overallGrade = pointsToGrade(avgScore);

  return {
    scores,
    overall: { grade: overallGrade, score: Math.round(avgScore) },
    gradeCounts,
  };
}

// =============================================================================
// Fix Simulation Logic
// =============================================================================

/**
 * Map of diagnostic codes to their metadata transformation function
 * Each function takes the current metadata and returns modified metadata
 */
const FIX_SIMULATIONS = {
  'missing-og-image': (meta, imageProbe) => {
    // Simulate adding a proper 1200x630 image
    const newMeta = JSON.parse(JSON.stringify(meta));
    newMeta.og = newMeta.og || {};
    newMeta.og.image = 'https://example.com/image.jpg';
    const newImageProbe = { width: 1200, height: 630, contentType: 'image/jpeg' };
    return { meta: newMeta, imageProbe: newImageProbe || imageProbe };
  },

  'http-image-url': (meta, imageProbe) => {
    const newMeta = JSON.parse(JSON.stringify(meta));
    if (newMeta.og?.image) {
      newMeta.og.image = newMeta.og.image.replace('http://', 'https://');
    }
    return { meta: newMeta, imageProbe };
  },

  'relative-image-url': (meta, imageProbe) => {
    const newMeta = JSON.parse(JSON.stringify(meta));
    if (newMeta.og?.image) {
      newMeta.og.image = 'https://example.com/' + newMeta.og.image;
    }
    return { meta: newMeta, imageProbe };
  },

  'image-too-small': (meta, imageProbe) => {
    const newMeta = JSON.parse(JSON.stringify(meta));
    const newImageProbe = { ...imageProbe, width: 1200, height: 630 };
    return { meta: newMeta, imageProbe: newImageProbe };
  },

  'image-suboptimal-size': (meta, imageProbe) => {
    const newMeta = JSON.parse(JSON.stringify(meta));
    const newImageProbe = { ...imageProbe, width: 1200, height: 630 };
    return { meta: newMeta, imageProbe: newImageProbe };
  },

  'image-too-large-facebook': (meta, imageProbe) => {
    // Simulating compression - still same dimensions but smaller size
    const newMeta = JSON.parse(JSON.stringify(meta));
    const newImageProbe = { ...imageProbe, contentLength: 500 * 1024 }; // 500KB
    return { meta: newMeta, imageProbe: newImageProbe };
  },

  'image-too-large-twitter': (meta, imageProbe) => {
    const newMeta = JSON.parse(JSON.stringify(meta));
    const newImageProbe = { ...imageProbe, contentLength: 500 * 1024 };
    return { meta: newMeta, imageProbe: newImageProbe };
  },

  'image-too-large-whatsapp': (meta, imageProbe) => {
    const newMeta = JSON.parse(JSON.stringify(meta));
    const newImageProbe = { ...imageProbe, contentLength: 250 * 1024 };
    return { meta: newMeta, imageProbe: newImageProbe };
  },

  'missing-title': (meta, imageProbe) => {
    const newMeta = JSON.parse(JSON.stringify(meta));
    newMeta.title = 'Your Page Title';
    newMeta.og = newMeta.og || {};
    newMeta.og.title = 'Your Page Title';
    return { meta: newMeta, imageProbe };
  },

  'missing-twitter-card': (meta, imageProbe) => {
    const newMeta = JSON.parse(JSON.stringify(meta));
    newMeta.twitter = newMeta.twitter || {};
    newMeta.twitter.card = meta.og?.image ? 'summary_large_image' : 'summary';
    return { meta: newMeta, imageProbe };
  },

  'empty-og-tag': (meta, imageProbe) => {
    // This is a general fix - handled by specific tag fixes
    return { meta, imageProbe };
  },

  'og-wrong-attribute': (meta, imageProbe) => {
    // This is structural - doesn't affect our parsed metadata
    return { meta, imageProbe };
  },

  'duplicate-og-title': (meta, imageProbe) => {
    // Structural issue - our parser already handles this
    return { meta, imageProbe };
  },

  'duplicate-og-description': (meta, imageProbe) => {
    return { meta, imageProbe };
  },

  'duplicate-og-image': (meta, imageProbe) => {
    return { meta, imageProbe };
  },

  'duplicate-og-url': (meta, imageProbe) => {
    return { meta, imageProbe };
  },

  'og-url-missing-protocol': (meta, imageProbe) => {
    const newMeta = JSON.parse(JSON.stringify(meta));
    if (newMeta.og?.url) {
      newMeta.og.url = 'https://' + newMeta.og.url;
    }
    return { meta: newMeta, imageProbe };
  },

  'tags-past-32kb': (meta, imageProbe) => {
    // Structural issue - metadata is same, just position changes
    return { meta, imageProbe };
  },

  'tags-past-750kb': (meta, imageProbe) => {
    return { meta, imageProbe };
  },

  'image-slow': (meta, imageProbe) => {
    const newMeta = JSON.parse(JSON.stringify(meta));
    const newImageProbe = { ...imageProbe, responseTime: 500 };
    return { meta: newMeta, imageProbe: newImageProbe };
  },

  'image-wrong-type': (meta, imageProbe) => {
    const newMeta = JSON.parse(JSON.stringify(meta));
    const newImageProbe = { ...imageProbe, contentType: 'image/jpeg' };
    return { meta: newMeta, imageProbe: newImageProbe };
  },

  'wrong-content-type': (meta, imageProbe) => {
    return { meta, imageProbe };
  },

  'cache-control-no-cache': (meta, imageProbe) => {
    return { meta, imageProbe };
  },

  'x-frame-options': (meta, imageProbe) => {
    return { meta, imageProbe };
  },

  'redirect-chain-long': (meta, imageProbe) => {
    return { meta, imageProbe };
  },

  'redirect-warning': (meta, imageProbe) => {
    return { meta, imageProbe };
  },
};

/**
 * Simulate applying a fix and calculate the score delta
 * @param {string} fixCode - The diagnostic code for the fix
 * @param {object} currentMeta - Current metadata
 * @param {object} currentImageProbe - Current image probe data
 * @param {object} currentScoring - Current scoring results
 * @returns {object} - Impact data with platforms improved and grade changes
 */
function simulateFix(fixCode, currentMeta, currentImageProbe, currentScoring) {
  // Get the simulation function for this fix
  const simulate = FIX_SIMULATIONS[fixCode];
  if (!simulate) {
    // Unknown fix - return no impact
    return { platformsImproved: [], gradeChanges: {}, overallDelta: 0 };
  }

  // Apply the fix simulation
  const { meta: newMeta, imageProbe: newImageProbe } = simulate(currentMeta, currentImageProbe);

  // Calculate new scores
  const newScoring = scoreAll(newMeta, newImageProbe);

  // Calculate the delta
  const platformsImproved = [];
  const gradeChanges = {};

  for (const platform of PLATFORMS) {
    const oldResult = currentScoring.scores[platform.id];
    const newResult = newScoring.scores[platform.id];

    if (oldResult.grade !== newResult.grade || newResult.score > oldResult.score) {
      platformsImproved.push({
        id: platform.id,
        name: platform.name,
        from: oldResult.grade,
        to: newResult.grade,
        delta: newResult.score - oldResult.score,
      });
      gradeChanges[platform.id] = { from: oldResult.grade, to: newResult.grade };
    }
  }

  const overallDelta = newScoring.overall.score - currentScoring.overall.score;

  return {
    platformsImproved,
    gradeChanges,
    overallDelta,
    newOverallGrade: newScoring.overall.grade,
  };
}

/**
 * Simulate applying all fixes and calculate total impact
 * @param {Array} fixes - Array of fix objects with code property
 * @param {object} currentMeta - Current metadata
 * @param {object} currentImageProbe - Current image probe data
 * @param {object} currentScoring - Current scoring results
 * @returns {object} - Total impact data
 */
function simulateAllFixes(fixes, currentMeta, currentImageProbe, currentScoring) {
  let meta = { ...currentMeta };
  let imageProbe = { ...currentImageProbe };

  // Apply each fix in sequence
  for (const fix of fixes) {
    const simulate = FIX_SIMULATIONS[fix.code];
    if (simulate) {
      const result = simulate(meta, imageProbe);
      meta = result.meta;
      imageProbe = result.imageProbe;
    }
  }

  // Calculate final scores
  const newScoring = scoreAll(meta, imageProbe);

  // Calculate the delta
  const platformsImproved = [];
  const gradeChanges = {};

  for (const platform of PLATFORMS) {
    const oldResult = currentScoring.scores[platform.id];
    const newResult = newScoring.scores[platform.id];

    if (oldResult.grade !== newResult.grade || newResult.score > oldResult.score) {
      platformsImproved.push({
        id: platform.id,
        name: platform.name,
        from: oldResult.grade,
        to: newResult.grade,
        delta: newResult.score - oldResult.score,
      });
      gradeChanges[platform.id] = { from: oldResult.grade, to: newResult.grade };
    }
  }

  const overallDelta = newScoring.overall.score - currentScoring.overall.score;

  return {
    platformsImproved,
    gradeChanges,
    overallDelta,
    fromOverallGrade: currentScoring.overall.grade,
    toOverallGrade: newScoring.overall.grade,
  };
}

/**
 * Get impact level for a fix based on number of platforms improved
 * @param {number} platformCount - Number of platforms improved
 * @returns {string} - 'high', 'medium', or 'low'
 */
function getImpactLevel(platformCount) {
  if (platformCount >= 5) return 'high';
  if (platformCount >= 2) return 'medium';
  return 'low';
}

/**
 * Format the impact message for a fix
 * @param {object} impact - Impact data from simulateFix
 * @returns {string} - Formatted impact message
 */
function formatImpactMessage(impact) {
  const improved = impact.platformsImproved;
  if (improved.length === 0) return 'No score change expected';

  // Group by grade change
  const byGradeChange = {};
  for (const p of improved) {
    const key = `${p.from} → ${p.to}`;
    if (!byGradeChange[key]) byGradeChange[key] = [];
    byGradeChange[key].push(p.name);
  }

  // Build the message
  const parts = [];
  for (const [change, platforms] of Object.entries(byGradeChange)) {
    if (platforms.length <= 3) {
      parts.push(`${change} on ${platforms.join(', ')}`);
    } else {
      parts.push(`${change} on ${platforms.length} platforms`);
    }
  }

  return parts.join(', ');
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PLATFORMS,
    scoreAll,
    scorePlatform,
    simulateFix,
    simulateAllFixes,
    getImpactLevel,
    formatImpactMessage,
    pointsToGrade,
  };
}
