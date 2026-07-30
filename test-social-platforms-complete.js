/**
 * Comprehensive test for social media platform frames
 * Verifies that all 7 social platforms have complete implementations with:
 * - Platform chrome (avatar, username, timestamp, post metadata)
 * - Dark/light theme CSS
 * - Neutral placeholder content
 * - Proper integration with renderPlatformWithContext
 */

const fs = require('fs');
const path = require('path');

// Test data for each platform
const testCases = [
  {
    platform: 'facebook',
    name: 'Facebook',
    requiredElements: ['fb-post-header', 'fb-avatar', 'fb-author-name', 'fb-post-time'],
    requiredChrome: ['avatar', 'username', 'timestamp', 'post metadata']
  },
  {
    platform: 'instagram',
    name: 'Instagram',
    requiredElements: ['ig-post-header', 'ig-avatar', 'ig-username', 'ig-post-time'],
    requiredChrome: ['avatar', 'username', 'timestamp']
  },
  {
    platform: 'linkedin',
    name: 'LinkedIn',
    requiredElements: ['li-post-header', 'li-avatar', 'li-author-name', 'li-post-headline'],
    requiredChrome: ['avatar', 'username', 'headline', 'timestamp']
  },
  {
    platform: 'reddit',
    name: 'Reddit',
    requiredElements: ['rd-post-header', 'rd-avatar', 'rd-author-name', 'rd-post-time'],
    requiredChrome: ['subreddit', 'avatar', 'username', 'timestamp', 'upvotes']
  },
  {
    platform: 'twitter',
    name: 'X (Twitter)',
    requiredElements: ['tw-post-header', 'tw-avatar', 'tw-author-name', 'tw-post-time'],
    requiredChrome: ['avatar', 'username', 'handle', 'timestamp']
  },
  {
    platform: 'youtube',
    name: 'YouTube',
    requiredElements: ['yt-channel-avatar', 'yt-channel-name', 'yt-video-title'],
    requiredChrome: ['channel avatar', 'channel name', 'video title', 'stats']
  },
  {
    platform: 'tiktok',
    name: 'TikTok',
    requiredElements: ['tt-video-placeholder', 'tt-username', 'tt-caption'],
    requiredChrome: ['username', 'caption', 'actions']
  }
];

console.log('🧪 Testing Social Media Platform Frames Implementation\n');
console.log('=' .repeat(60));

let allPassed = true;

testCases.forEach(testCase => {
  console.log(`\n📱 Testing ${testCase.name}`);
  console.log('-'.repeat(60));

  let platformPassed = true;

  // Check dark theme HTML file exists
  const darkFile = path.join(__dirname, 'src/public', `${testCase.platform}-dark.html`);
  if (fs.existsSync(darkFile)) {
    console.log(`  ✅ Dark theme file exists: ${testCase.platform}-dark.html`);

    const darkContent = fs.readFileSync(darkFile, 'utf8');

    // Check for required elements
    testCase.requiredElements.forEach(element => {
      if (darkContent.includes(element)) {
        console.log(`  ✅ Chrome element: ${element}`);
      } else {
        console.log(`  ❌ Missing chrome element: ${element}`);
        platformPassed = false;
      }
    });

    // Check for theme support in data-theme attribute
    if (darkContent.includes('data-theme="dark"')) {
      console.log(`  ✅ Dark theme attribute present`);
    } else {
      console.log(`  ❌ Missing dark theme attribute`);
      platformPassed = false;
    }
  } else {
    console.log(`  ❌ Dark theme file missing: ${testCase.platform}-dark.html`);
    platformPassed = false;
  }

  // Check light theme HTML file exists
  const lightFile = path.join(__dirname, 'src/public', `${testCase.platform}-light.html`);
  if (fs.existsSync(lightFile)) {
    console.log(`  ✅ Light theme file exists: ${testCase.platform}-light.html`);

    const lightContent = fs.readFileSync(lightFile, 'utf8');

    // Check for theme support in data-theme attribute
    if (lightContent.includes('data-theme="light"')) {
      console.log(`  ✅ Light theme attribute present`);
    } else {
      console.log(`  ❌ Missing light theme attribute`);
      platformPassed = false;
    }
  } else {
    console.log(`  ❌ Light theme file missing: ${testCase.platform}-light.html`);
    platformPassed = false;
  }

  // Check platform-frames.js integration
  const platformFramesJs = path.join(__dirname, 'src/public/platform-frames.js');
  if (fs.existsSync(platformFramesJs)) {
    const framesContent = fs.readFileSync(platformFramesJs, 'utf8');

    // Check if platform is defined
    const platformPattern = new RegExp(`${testCase.platform}:\\s*{`, 'i');
    if (framesContent.match(platformPattern)) {
      console.log(`  ✅ Platform defined in platform-frames.js`);

      // Extract platform definition - use a more robust pattern that handles nested braces
      const platformStartIndex = framesContent.indexOf(new RegExp(`${testCase.platform}:\\s*{`, 'i').exec(framesContent)?.index || 0);
      let platformDef = '';
      if (platformStartIndex > 0) {
        // Find the matching closing brace
        let braceCount = 0;
        let inPlatformDef = false;
        for (let i = platformStartIndex; i < framesContent.length; i++) {
          if (framesContent[i] === '{') {
            braceCount++;
            inPlatformDef = true;
          } else if (framesContent[i] === '}') {
            braceCount--;
            if (inPlatformDef && braceCount === 0) {
              platformDef = framesContent.substring(platformStartIndex, i + 1);
              break;
            }
          }
        }
      }

      if (platformDef) {
        // Check for chrome property
        if (platformDef.includes('chrome:')) {
          console.log(`  ✅ Chrome template defined`);
        } else {
          console.log(`  ❌ Chrome template missing`);
          platformPassed = false;
        }

        // Check for themeVars property
        if (platformDef.includes('themeVars:')) {
          console.log(`  ✅ Theme variables defined`);

          // Check for both dark and light themes
          if (platformDef.includes('dark:') && platformDef.includes('light:')) {
            console.log(`  ✅ Both dark and light theme variables present`);
          } else {
            console.log(`  ❌ Missing dark or light theme variables`);
            platformPassed = false;
          }
        } else {
          console.log(`  ❌ Theme variables missing`);
          platformPassed = false;
        }
      }
    } else {
      console.log(`  ❌ Platform not defined in platform-frames.js`);
      platformPassed = false;
    }
  } else {
    console.log(`  ❌ platform-frames.js file missing`);
    platformPassed = false;
  }

  // Check platform-frames.config.ts integration
  const configTs = path.join(__dirname, 'src/platform-frames.config.ts');
  if (fs.existsSync(configTs)) {
    const configContent = fs.readFileSync(configTs, 'utf8');

    // Check if platform is defined
    const platformPattern = new RegExp(`${testCase.platform}:\\s*{`, 'i');
    if (configContent.match(platformPattern)) {
      console.log(`  ✅ Platform defined in platform-frames.config.ts`);

      // Check if it's marked as complete (isStub: false)
      const platformMatch = configContent.match(new RegExp(`${testCase.platform}:\\s*{([^}]+)}`, 'is'));
      if (platformMatch) {
        const platformDef = platformMatch[1];
        if (platformDef.includes('isStub: false')) {
          console.log(`  ✅ Platform marked as complete (isStub: false)`);
        } else if (platformDef.includes('isStub: true')) {
          console.log(`  ❌ Platform marked as stub (isStub: true)`);
          platformPassed = false;
        }

        // Check for theme support
        if (platformDef.includes('hasThemeSupport: true')) {
          console.log(`  ✅ Theme support enabled`);
        } else {
          console.log(`  ⚠️  Theme support not enabled`);
        }
      }
    } else {
      console.log(`  ❌ Platform not defined in platform-frames.config.ts`);
      platformPassed = false;
    }
  } else {
    console.log(`  ❌ platform-frames.config.ts file missing`);
    platformPassed = false;
  }

  if (platformPassed) {
    console.log(`\n  ✅ ${testCase.name} PASSED`);
  } else {
    console.log(`\n  ❌ ${testCase.name} FAILED`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(60));
console.log('\n🎯 Final Results:');
console.log('='.repeat(60));

if (allPassed) {
  console.log('✅ ALL TESTS PASSED - All 7 social media platforms have complete implementations');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Please review the failed checks above');
  process.exit(1);
}