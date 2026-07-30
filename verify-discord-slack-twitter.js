#!/usr/bin/env node

/**
 * Verification script for Discord, Slack, and Twitter context frames
 * Run with: node verify-discord-slack-twitter.js
 */

const fs = require('fs');
const path = require('path');

console.log('Discord, Slack, & Twitter Context Frames Verification');
console.log('='.repeat(60));
console.log('');

// Read the main files
const platformFramesJs = fs.readFileSync('src/public/platform-frames.js', 'utf8');
const styleCss = fs.readFileSync('src/public/style.css', 'utf8');
const enhancedCss = fs.readFileSync('src/public/platform-frames-enhanced.css', 'utf8');

const platforms = [
  { id: 'discord', name: 'Discord', category: 'messaging' },
  { id: 'slack', name: 'Slack', category: 'messaging' },
  { id: 'twitter', name: 'Twitter/X', category: 'social' }
];

let allPassed = true;

platforms.forEach(({ id, name, category }) => {
  console.log(`${name} (${id}):`);

  const issues = [];

  // 1. Check JavaScript implementation
  const platformDef = `${id}: {`;
  if (!platformFramesJs.includes(platformDef)) {
    issues.push('Missing platform definition in PLATFORM_FRAMES');
  }

  // 2. Check chrome template
  if (!platformFramesJs.includes(`${id}:`, platformFramesJs.indexOf('chrome:'))) {
    issues.push('Missing chrome template');
  }

  // 3. Check neutralContent template
  if (!platformFramesJs.includes(`${id}:`, platformFramesJs.indexOf('neutralContent'))) {
    issues.push('Missing neutralContent template');
  }

  // 4. Check theme support
  if (!platformFramesJs.includes('hasThemeSupport: true', platformFramesJs.indexOf(id))) {
    issues.push('Missing hasThemeSupport flag');
  }

  // 5. Check theme variables
  if (!platformFramesJs.includes('themeVars: {', platformFramesJs.indexOf(id))) {
    issues.push('Missing themeVars object');
  }

  // 6. Check dark theme variables
  if (!platformFramesJs.includes('dark: {', platformFramesJs.indexOf(id))) {
    issues.push('Missing dark theme variables');
  }

  // 7. Check light theme variables
  if (!platformFramesJs.includes('light: {', platformFramesJs.indexOf(id))) {
    issues.push('Missing light theme variables');
  }

  // 8. Check CSS implementation
  const contextClass = `${id}-context`;
  if (!styleCss.includes(contextClass) && !enhancedCss.includes(contextClass)) {
    issues.push(`Missing CSS class .${contextClass}`);
  }

  // 9. Check dark theme CSS
  const darkThemeClass = `${contextClass}.dark-theme` ||
                         `${contextContext} .dark-theme`;
  if (!styleCss.includes('dark-theme') && !enhancedCss.includes('dark-theme')) {
    issues.push('Missing dark theme CSS support');
  }

  // 10. Check light theme CSS
  if (!styleCss.includes('light-theme') && !enhancedCss.includes('light-theme')) {
    issues.push('Missing light theme CSS support');
  }

  // 11. Check for link card embedding in chrome
  const chromeIndex = platformFramesJs.indexOf('chrome:', platformFramesJs.indexOf(id));
  const nextSection = platformFramesJs.indexOf(',', chromeIndex);
  const chromeContent = platformFramesJs.substring(chromeIndex, nextSection + 1000);

  if (!chromeContent.includes('{{linkCard}}') && !chromeContent.includes('{{linkPreview}}')) {
    issues.push('Chrome template missing link card placeholder');
  }

  // 12. Check for platform-specific styling elements
  const platformElements = {
    discord: ['discord-sidebar', 'discord-channel', 'discord-message'],
    slack: ['slack-sidebar', 'slack-channel', 'slack-message'],
    twitter: ['tw-post-header', 'tw-post-content']
  };

  if (platformElements[id]) {
    platformElements[id].forEach(element => {
      if (!styleCss.includes(element) && !enhancedCss.includes(element)) {
        issues.push(`Missing platform-specific element: ${element}`);
      }
    });
  }

  const platformPassed = issues.length === 0;
  if (!platformPassed) allPassed = false;

  if (platformPassed) {
    console.log(`  ✓ All checks passed`);
  } else {
    console.log(`  ✗ Issues found:`);
    issues.forEach(issue => {
      console.log(`    - ${issue}`);
    });
  }

  console.log('');
});

console.log('='.repeat(60));
console.log(`Overall: ${allPassed ? 'ALL PLATFORMS PASSED ✓' : 'SOME PLATFORMS FAILED ✗'}`);
console.log('='.repeat(60));

// Additional detailed verification
console.log('\nDetailed Link Card Embedding Check:');
console.log('-'.repeat(60));

platforms.forEach(({ id, name }) => {
  console.log(`\n${name}:`);

  const chromeIndex = platformFramesJs.indexOf('chrome:', platformFramesJs.indexOf(id));
  if (chromeIndex === -1) {
    console.log('  ✗ No chrome template found');
    return;
  }

  // Find the end of the chrome template
  let chromeEnd = platformFramesJs.indexOf('`,', chromeIndex);
  if (chromeEnd === -1) {
    chromeEnd = platformFramesJs.indexOf('\n', chromeIndex + 100);
  }

  const chromeContent = platformFramesJs.substring(chromeIndex, chromeEnd);

  // Check for link card placeholder
  const hasLinkCard = chromeContent.includes('{{linkCard}}') ||
                      chromeContent.includes('{{linkPreview}}') ||
                      chromeContent.includes('{{linkEmbed}}');

  if (hasLinkCard) {
    console.log('  ✓ Link card placeholder present in chrome template');
  } else {
    console.log('  ✗ Link card placeholder missing from chrome template');
    allPassed = false;
  }

  // Check if placeholder is positioned naturally (not at very end)
  const lines = chromeContent.split('\n');
  const lastContentLine = lines.filter(line =>
    line.trim() && !line.includes('{{') && !line.includes('//')
  ).pop();

  if (lastContentLine && lastContentLine.includes('{{')) {
    console.log('  ✓ Link card is embedded in content flow');
  } else if (lastContentLine && !lastContentLine.includes('{{')) {
    console.log('  ⚠ Link card positioning could be more natural');
  }
});

console.log('\n' + '='.repeat(60));

process.exit(allPassed ? 0 : 1);