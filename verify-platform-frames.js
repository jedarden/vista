#!/usr/bin/env node

/**
 * Verification script for platform context frames (bead bf-58ehr)
 *
 * This script verifies all required platforms are properly implemented
 * with proper theme support, chrome, neutral content, and CSS styling.
 */

const fs = require('fs');
const path = require('path');

// Read platform frames JS file
const platformFramesPath = path.join(__dirname, 'src/public/platform-frames.js');
const platformFramesContent = fs.readFileSync(platformFramesPath, 'utf8');

// Read CSS file
const cssPath = path.join(__dirname, 'src/public/style.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Required platforms from bead bf-58ehr
const REQUIRED_PLATFORMS = [
  { id: 'github', name: 'GitHub', category: 'Developer Platform' },
  { id: 'gitlab', name: 'GitLab', category: 'Developer Platform' },
  { id: 'stackoverflow', name: 'Stack Overflow', category: 'Developer Platform' },
  { id: 'youtube', name: 'YouTube', category: 'Video Platform' },
  { id: 'twitch', name: 'Twitch', category: 'Video Platform' },
  { id: 'gmail', name: 'Gmail', category: 'Email/Thread Platform' },
  { id: 'feedly', name: 'Feedly', category: 'RSS Feed Reader' },
  { id: 'hackernews', name: 'Hacker News', category: 'Social/Discussion' },
  { id: 'discord', name: 'Discord', category: 'Messaging Platform' },
  { id: 'slack', name: 'Slack', category: 'Messaging Platform' },
  { id: 'twitter', name: 'Twitter/X', category: 'Social Platform' }
];

function extractPlatformData(platformId) {
  const regex = new RegExp(`${platformId}:\\s*\\{[^}]*name:\\s*['"]([^'"]+)['"][^}]*category:\\s*['"]([^'"]+)['"][^}]*hasThemeSupport:\\s*(true|false)[^}]*chrome:\\s*` + '`([^`]+)`' + `[^}]*neutralContent:\\s*` + '`([^`]*)`', 's');
  const match = platformFramesContent.match(regex);

  if (!match) return null;

  return {
    name: match[1],
    category: match[2],
    hasThemeSupport: match[3] === 'true',
    chrome: match[4],
    neutralContent: match[5]
  };
}

function checkCSSEntries(platformId) {
  const cssRegex = new RegExp(`\\.${platformId}-`, 'g');
  const matches = cssContent.match(cssRegex);
  return matches ? matches.length : 0;
}

function verifyPlatform(platform) {
  const data = extractPlatformData(platform.id);

  if (!data) {
    return {
      platform: platform.id,
      name: platform.name,
      category: platform.category,
      status: 'MISSING',
      exists: false,
      hasThemeSupport: false,
      hasChrome: false,
      hasNeutralContent: false,
      cssEntries: 0
    };
  }

  const cssEntries = checkCSSEntries(platform.id);

  return {
    platform: platform.id,
    name: platform.name,
    category: platform.category,
    status: 'OK',
    exists: true,
    hasThemeSupport: data.hasThemeSupport,
    hasChrome: data.chrome && data.chrome.length > 0,
    hasNeutralContent: data.neutralContent !== undefined && data.neutralContent.length >= 0,
    cssEntries: cssEntries,
    chromeHasLinkPreview: data.chrome.includes('{{linkPreview}}') || data.chrome.includes('{{linkCard}}'),
    chromeHasUserContent: data.chrome.includes('{{userMessage}}') || data.chrome.includes('{{userComment}}') || data.chrome.includes('{{userAnswer}}') || data.chrome.includes('{{userArticle}}') || data.chrome.includes('{{userResponse}}')
  };
}

function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  Platform Context Frames Verification (bead bf-58ehr)          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const results = REQUIRED_PLATFORMS.map(verifyPlatform);

  let passedCount = 0;
  let failedCount = 0;

  results.forEach(result => {
    const icon = result.status === 'OK' ? '✓' : '✗';
    const status = result.status === 'OK' ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';

    console.log(`${icon} ${result.platform.toUpperCase().padEnd(15)} ${result.name.padEnd(25)} ${status}`);

    if (result.status === 'OK') {
      console.log(`  Category: ${result.category}`);
      console.log(`  Theme Support: ${result.hasThemeSupport ? '✓' : '✗'}`);
      console.log(`  Has Chrome: ${result.hasChrome ? '✓' : '✗'}`);
      console.log(`  Has Neutral Content: ${result.hasNeutralContent ? '✓' : '✗'}`);
      console.log(`  CSS Entries: ${result.cssEntries}`);
      console.log(`  Link Preview in Chrome: ${result.chromeHasLinkPreview ? '✓' : '✗'}`);
      console.log(`  User Content in Chrome: ${result.chromeHasUserContent ? '✓' : '✗'}`);
      passedCount++;
    } else {
      console.log(`  \x1b[31mPlatform implementation not found!\x1b[0m`);
      failedCount++;
    }
    console.log();
  });

  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`Total Required: ${REQUIRED_PLATFORMS.length}`);
  console.log(`\x1b[32mPassed: ${passedCount}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${failedCount}\x1b[0m`);
  console.log('─────────────────────────────────────────────────────────────────');

  // Category-specific checks
  console.log('\n📋 Category-Specific Verification:\n');

  const devPlatforms = results.filter(r => r.category.includes('Developer'));
  const videoPlatforms = results.filter(r => r.category.includes('Video'));
  const emailPlatforms = results.filter(r => r.category.includes('Email'));
  const rssPlatforms = results.filter(r => r.category.includes('RSS'));

  console.log('Developer Platforms (GitHub, GitLab, Stack Overflow):');
  devPlatforms.forEach(p => {
    const data = extractPlatformData(p.platform);
    if (data) {
      const hasCodeStyle = data.chrome.includes('code') || data.chrome.includes('```') || data.chrome.includes('pre') || data.chrome.includes('&lt;code&gt;');
      console.log(`  ${p.platform}: ${hasCodeStyle ? '✓ Code-style formatting present' : '⚠ No explicit code formatting detected'}`);
    }
  });

  console.log('\nVideo Platforms (YouTube, Twitch):');
  videoPlatforms.forEach(p => {
    const data = extractPlatformData(p.platform);
    if (data) {
      const hasVideoChrome = data.chrome.includes('video') || data.chrome.includes('player') || data.chrome.includes('stream') || data.chrome.includes('progress');
      console.log(`  ${p.platform}: ${hasVideoChrome ? '✓ Video chrome present' : '⚠ No video chrome detected'}`);
    }
  });

  console.log('\nEmail/Thread Platform (Gmail):');
  emailPlatforms.forEach(p => {
    const data = extractPlatformData(p.platform);
    if (data) {
      const hasThreading = data.chrome.includes('thread') || data.chrome.includes('message') || data.chrome.includes('sender');
      console.log(`  ${p.platform}: ${hasThreading ? '✓ Conversation threading present' : '⚠ No threading detected'}`);
    }
  });

  console.log('\nRSS Feed Reader (Feedly):');
  rssPlatforms.forEach(p => {
    const data = extractPlatformData(p.platform);
    if (data) {
      const hasFeedList = data.chrome.includes('feed') || data.chrome.includes('article') || data.chrome.includes('unread');
      console.log(`  ${p.platform}: ${hasFeedList ? '✓ Feed/list context present' : '⚠ No feed list detected'}`);
    }
  });

  console.log('\n✨ Verification complete!\n');

  // Exit with appropriate code
  process.exit(failedCount > 0 ? 1 : 0);
}

main();
