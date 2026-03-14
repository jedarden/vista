'use strict';

/**
 * Platform scoring rules.
 * Returns A+, A, B, C, D, or F for each platform.
 */

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

/**
 * Score a single platform given extracted metadata and image probe data.
 * Returns { grade, score, issues, fixes }.
 */
function scorePlatform(platformId, meta, imageProbe) {
  const ogTitle = meta.og.title || meta.title;
  const ogDesc = meta.og.description || meta.description;
  const ogImage = meta.og.image;
  const twitterCard = meta.twitter.card;
  const twitterImage = meta.twitter.image;
  const imgW = imageProbe?.width;
  const imgH = imageProbe?.height;

  const issues = [];
  const fixes = [];
  let points = 100; // start at 100, deduct

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
      const effectiveTitle = meta.twitter.title || meta.og.title || meta.title;
      const effectiveDesc = meta.twitter.description || meta.og.description || meta.description;
      const effectiveImage = meta.twitter.image || meta.og.image;

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
        // Pinterest prefers vertical 2:3
        if (imgW && imgH && imgW > imgH) {
          points -= 10;
          issues.push('Horizontal image — Pinterest prefers vertical 2:3 (e.g. 1000×1500)');
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
      if (!meta.themeColor) { points -= 5; issues.push('Missing theme-color (sets accent border color)'); fixes.push('<meta name="theme-color" content="#hexcolor" />'); }
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
      // iMessage does NOT use description
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

function pointsToGrade(points) {
  if (points >= 95) return 'A+';
  if (points >= 85) return 'A';
  if (points >= 70) return 'B';
  if (points >= 55) return 'C';
  if (points >= 35) return 'D';
  return 'F';
}

/**
 * Score all platforms and return summary.
 */
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

  const passing = gradeCounts['A+'] + gradeCounts['A'];
  const warning = gradeCounts['B'] + gradeCounts['C'];
  const failing = gradeCounts['D'] + gradeCounts['F'];

  return {
    scores,
    overall: { grade: overallGrade, score: Math.round(avgScore) },
    summary: { passing, warning, failing },
    gradeCounts,
    platforms: PLATFORMS,
  };
}

module.exports = { scoreAll, PLATFORMS };
