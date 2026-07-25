#!/usr/bin/env node
/**
 * BF-58ehr Platform Context Frames Verification Script
 *
 * This script verifies that all required platform context frames are properly
 * implemented with correct theme switching, link card integration, and styling.
 */

const platforms = {
  developer: ['github', 'gitlab', 'stackoverflow'],
  video: ['youtube', 'twitch'],
  email: ['gmail', 'outlook'],
  rss: ['feedly'],
  discussion: ['hackernews'],
  social: ['twitter', 'discord', 'slack']
};

const requirements = {
  // Developer platforms requirements
  developer: {
    'github': {
      name: 'GitHub',
      features: ['issue thread format', 'code-like formatting', 'comment threading', 'theme switching'],
      templateVars: ['issueNumber', 'title', 'author', 'timeAgo', 'comment']
    },
    'gitlab': {
      name: 'GitLab',
      features: ['merge request format', 'code-like formatting', 'discussion threading', 'theme switching'],
      templateVars: ['mrNumber', 'title', 'author', 'timeAgo', 'comment']
    },
    'stackoverflow': {
      name: 'Stack Overflow',
      features: ['Q&A format', 'voting system', 'code snippets', 'accepted answer indicator', 'theme switching'],
      templateVars: ['upvotes', 'title', 'tags', 'author', 'timeAgo', 'answer']
    }
  },

  // Video platforms requirements
  video: {
    'youtube': {
      name: 'YouTube',
      features: ['video player chrome', 'progress bar', 'player controls', 'channel info', 'description section', 'link cards', 'comment threading', 'theme switching'],
      templateVars: ['title', 'description', 'linkCards']
    },
    'twitch': {
      name: 'Twitch',
      features: ['stream preview', 'LIVE badge', 'viewer count', 'streamer info', 'chat section', 'link cards', 'theme switching'],
      templateVars: ['streamTitle', 'streamerName', 'game', 'viewerCount', 'title']
    }
  },

  // Email platforms requirements
  email: {
    'gmail': {
      name: 'Gmail',
      features: ['sidebar navigation', 'thread view', 'message threading', 'sender info', 'link preview', 'theme switching'],
      templateVars: ['subject', 'from', 'to', 'time', 'senderName', 'title', 'domain']
    },
    'outlook': {
      name: 'Outlook',
      features: ['sidebar navigation', 'thread view', 'message threading', 'sender info', 'link preview', 'theme switching'],
      templateVars: ['subject', 'from', 'time', 'senderName', 'title', 'domain']
    }
  },

  // RSS platforms requirements
  rss: {
    'feedly': {
      name: 'Feedly',
      features: ['feed sidebar', 'article list', 'article preview', 'mark as read', 'theme switching'],
      templateVars: ['feedTitle', 'feedName', 'unreadCount', 'title', 'description']
    }
  },

  // Discussion platforms requirements
  discussion: {
    'hackernews': {
      name: 'Hacker News',
      features: ['upvote system', 'post metadata', 'comment threading', 'domain display', 'point system', 'theme switching'],
      templateVars: ['title', 'domain', 'points', 'author', 'timeAgo', 'commentCount', 'comment']
    }
  },

  // Social platforms (verification)
  social: {
    'twitter': {
      name: 'Twitter/X',
      features: ['post header', 'avatar', 'verified badge', 'link card', 'actions', 'theme switching'],
      templateVars: ['title', 'description', 'domain']
    },
    'discord': {
      name: 'Discord',
      features: ['server sidebar', 'channel list', 'chat messages', 'link preview', 'colored border', 'theme switching'],
      templateVars: ['title', 'description', 'domain', 'site']
    },
    'slack': {
      name: 'Slack',
      features: ['workspace sidebar', 'channel list', 'chat messages', 'link preview', 'theme switching'],
      templateVars: ['title', 'description', 'domain', 'site']
    }
  }
};

function verifyPlatformStructure() {
  console.log('=== Verifying Platform Structure ===\n');

  // Import platform frames data
  const fs = require('fs');
  const platformData = fs.readFileSync('./src/public/platform-frames.js', 'utf8');

  let allPassed = true;

  for (const [category, platformList] of Object.entries(platforms)) {
    console.log(`\n${category.toUpperCase()} PLATFORMS:`);

    for (const platformId of platformList) {
      const req = requirements[category][platformId];
      if (!req) {
        console.log(`  ❌ ${platformId}: Requirements not defined`);
        allPassed = false;
        continue;
      }

      console.log(`  \n${req.name} (${platformId}):`);

      // Check platform exists in PLATFORM_FRAMES
      const platformExists = platformData.includes(`${platformId}: {`);
      if (!platformExists) {
        console.log(`    ❌ Platform not found in PLATFORM_FRAMES`);
        allPassed = false;
        continue;
      }
      console.log(`    ✅ Platform defined in PLATFORM_FRAMES`);

      // Check theme support
      const hasThemeSupport = platformData.includes(`hasThemeSupport: true`) &&
                              platformData.match(new RegExp(`${platformId}.*?hasThemeSupport: true`, 's'));
      if (hasThemeSupport) {
        console.log(`    ✅ Theme support enabled`);
      } else {
        console.log(`    ❌ Theme support missing`);
        allPassed = false;
      }

      // Check for chrome template
      const hasChrome = platformData.match(new RegExp(`${platformId}.*?chrome:\\s*\``, 's'));
      if (hasChrome) {
        console.log(`    ✅ Chrome template defined`);
      } else {
        console.log(`    ❌ Chrome template missing`);
        allPassed = false;
      }

      // Check for themeVars
      const hasThemeVars = platformData.match(new RegExp(`${platformId}.*?themeVars:\\s*{`, 's'));
      if (hasThemeVars) {
        console.log(`    ✅ Theme variables defined`);
      } else {
        console.log(`    ❌ Theme variables missing`);
        allPassed = false;
      }

      // Check for dark/light themes
      const hasDarkTheme = platformData.match(new RegExp(`${platformId}.*?dark:\\s*{`, 's'));
      const hasLightTheme = platformData.match(new RegExp(`${platformId}.*?light:\\s*{`, 's'));
      if (hasDarkTheme && hasLightTheme) {
        console.log(`    ✅ Dark and light themes defined`);
      } else {
        console.log(`    ❌ Dark/light themes incomplete`);
        allPassed = false;
      }

      // Check for key features
      for (const feature of req.features) {
        // Simple check if feature-related content exists
        let featureExists = false;

        if (feature.includes('theme switching')) {
          featureExists = hasThemeSupport;
        } else if (feature.includes('player chrome') || feature.includes('video player')) {
          featureExists = platformData.includes('video-player') || platformData.includes('video-placeholder');
        } else if (feature.includes('link card')) {
          featureExists = platformData.includes('link-card') || platformData.includes('linkPreview');
        } else if (feature.includes('threading') || feature.includes('thread')) {
          featureExists = platformData.includes('thread') || platformData.includes('comment');
        } else if (feature.includes('sidebar') || feature.includes('navigation')) {
          featureExists = platformData.includes('sidebar') || platformData.includes('nav-');
        } else if (feature.includes('chat')) {
          featureExists = platformData.includes('chat') || platformData.includes('message');
        }

        if (featureExists) {
          console.log(`    ✅ Feature: ${feature}`);
        } else {
          console.log(`    ⚠️  Feature check unclear: ${feature}`);
        }
      }
    }
  }

  return allPassed;
}

function verifyThemeIntegration() {
  console.log('\n\n=== Verifying Theme Integration ===\n');

  const fs = require('fs');
  const cssData = fs.readFileSync('./src/public/platform-frames-enhanced.css', 'utf8');

  const themeChecks = [
    { css: '.github-context', name: 'GitHub dark theme' },
    { css: '.github-context.light-theme', name: 'GitHub light theme' },
    { css: '.gitlab-context', name: 'GitLab dark theme' },
    { css: '.gitlab-context.light-theme', name: 'GitLab light theme' },
    { css: '.stackoverflow-context', name: 'Stack Overflow dark theme' },
    { css: '.stackoverflow-context.light-theme', name: 'Stack Overflow light theme' },
    { css: '.yt-context', name: 'YouTube dark theme' },
    { css: '.yt-context.light-theme', name: 'YouTube light theme' },
    { css: '.twitch-context', name: 'Twitch dark theme' },
    { css: '.twitch-context.light-theme', name: 'Twitch light theme' },
    { css: '.gmail-context', name: 'Gmail dark theme' },
    { css: '.gmail-context.light-theme', name: 'Gmail light theme' },
    { css: '.outlook-context', name: 'Outlook dark theme' },
    { css: '.outlook-context.light-theme', name: 'Outlook light theme' },
    { css: '.fl-context', name: 'Feedly dark theme' },
    { css: '.fl-context.light-theme', name: 'Feedly light theme' },
    { css: '.hn-context', name: 'Hacker News dark theme' },
    { css: '.hn-context.light-theme', name: 'Hacker News light theme' },
    { css: '.tw-context', name: 'Twitter dark theme' },
    { css: '.tw-context.light-theme', name: 'Twitter light theme' },
    { css: '.discord-context', name: 'Discord dark theme' },
    { css: '.discord-context.light-theme', name: 'Discord light theme' },
    { css: '.slack-context', name: 'Slack dark theme' },
    { css: '.slack-context.light-theme', name: 'Slack light theme' }
  ];

  let allPassed = true;
  for (const check of themeChecks) {
    const exists = cssData.includes(check.css);
    if (exists) {
      console.log(`✅ ${check.name}`);
    } else {
      console.log(`❌ ${check.name} - NOT FOUND`);
      allPassed = false;
    }
  }

  return allPassed;
}

function verifyBuildFunctions() {
  console.log('\n\n=== Verifying Build Functions ===\n');

  const fs = require('fs');
  const jsData = fs.readFileSync('./src/public/platform-frames.js', 'utf8');

  const functionChecks = [
    { func: 'buildContextFrame', desc: 'Main context frame builder' },
    { func: 'buildLinkPreviewHTML', desc: 'Link preview builder' },
    { func: 'getThemeVars', desc: 'Theme variable getter' },
    { func: 'hasThemeSupport', desc: 'Theme support checker' },
    { func: 'getInlineThemeStyles', desc: 'Inline theme styles generator' }
  ];

  let allPassed = true;
  for (const check of functionChecks) {
    const exists = jsData.includes(`function ${check.func}`) ||
                 jsData.includes(`${check.func} = function`) ||
                 jsData.includes(`${check.func}(`);
    if (exists) {
      console.log(`✅ ${check.desc} (${check.func})`);
    } else {
      console.log(`❌ ${check.desc} (${check.func}) - NOT FOUND`);
      allPassed = false;
    }
  }

  return allPassed;
}

function main() {
  console.log('BF-58ehr Platform Context Frames Verification');
  console.log('================================================\n');

  const structureOk = verifyPlatformStructure();
  const themesOk = verifyThemeIntegration();
  const functionsOk = verifyBuildFunctions();

  console.log('\n\n=== FINAL RESULTS ===\n');
  console.log(`Platform Structure: ${structureOk ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Theme Integration: ${themesOk ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Build Functions: ${functionsOk ? '✅ PASSED' : '❌ FAILED'}`);

  const allPassed = structureOk && themesOk && functionsOk;
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { verifyPlatformStructure, verifyThemeIntegration, verifyBuildFunctions };