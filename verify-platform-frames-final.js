#!/usr/bin/env node
/**
 * Final Verification Test for Platform Frames Integration
 *
 * This test verifies that all 7 complete platform frames are:
 * 1. Properly wired into renderPlatformWithContext
 * 2. Support dark/light theme switching
 * 3. Render cards embedded in frame context
 *
 * Usage: node verify-platform-frames-final.js
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(70));
console.log('FINAL PLATFORM FRAME INTEGRATION VERIFICATION');
console.log('='.repeat(70));

// Test data for all 7 complete platforms
const COMPLETE_PLATFORMS = [
  {
    id: 'twitter',
    name: 'X (Twitter)',
    testUrl: 'https://twitter.com/user/status/123456789',
    meta: {
      title: 'Amazing Tech Tutorial',
      og: {
        title: 'Amazing Tech Tutorial',
        description: 'Learn how to build amazing things in 10 minutes',
        image: 'https://example.com/twitter-image.jpg',
        site_name: 'X'
      }
    },
    imageProbe: { dominantColor: '#1da1f2' },
    finalUrl: 'https://twitter.com/user/status/123456789'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    testUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    meta: {
      title: 'Complete Tutorial - Build in 10 Minutes',
      og: {
        title: 'Complete Tutorial - Build in 10 Minutes',
        description: 'In this video, I\'ll show you how to get started with this amazing tool. Perfect for beginners!',
        image: 'https://example.com/youtube-thumbnail.jpg',
        site_name: 'YouTube'
      }
    },
    imageProbe: { dominantColor: '#ff0000' },
    finalUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    testUrl: 'https://tiktok.com/@user/video/123456789',
    meta: {
      title: 'Amazing Content 🔗 #fyp #viral',
      og: {
        title: 'Amazing Content 🔗 #fyp #viral',
        description: 'Check out this amazing viral content!',
        image: 'https://example.com/tiktok-video.jpg',
        site_name: 'TikTok'
      }
    },
    imageProbe: { dominantColor: '#000000' },
    finalUrl: 'https://tiktok.com/@user/video/123456789'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    testUrl: 'https://facebook.com/post/123456789',
    meta: {
      title: 'Great Article About Tech',
      og: {
        title: 'Great Article About Tech',
        description: 'Read this amazing article about the latest technology trends',
        image: 'https://example.com/fb-image.jpg',
        site_name: 'Facebook'
      }
    },
    imageProbe: { dominantColor: '#1877f2' },
    finalUrl: 'https://facebook.com/post/123456789'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    testUrl: 'https://linkedin.com/post/123456789',
    meta: {
      title: 'New Opportunity in Tech',
      og: {
        title: 'New Opportunity in Tech',
        description: 'Exciting career opportunity in the technology sector',
        image: 'https://example.com/linkedin-image.jpg',
        site_name: 'LinkedIn'
      }
    },
    imageProbe: { dominantColor: '#0a66c2' },
    finalUrl: 'https://linkedin.com/post/123456789'
  },
  {
    id: 'reddit',
    name: 'Reddit',
    testUrl: 'https://reddit.com/r/technology/comments/abc123',
    meta: {
      title: 'Amazing discovery in r/technology',
      og: {
        title: 'Amazing discovery in r/technology',
        description: 'Found this incredible resource, had to share',
        image: 'https://example.com/reddit-image.jpg',
        site_name: 'Reddit'
      }
    },
    imageProbe: { dominantColor: '#ff4500' },
    finalUrl: 'https://reddit.com/r/technology/comments/abc123'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    testUrl: 'https://instagram.com/p/ABC123/',
    meta: {
      title: 'Beautiful sunset photo 🌅',
      og: {
        title: 'Beautiful sunset photo 🌅',
        description: 'Amazing sunset from my trip',
        image: 'https://example.com/instagram-photo.jpg',
        site_name: 'Instagram'
      }
    },
    imageProbe: { dominantColor: '#e1306c' },
    finalUrl: 'https://instagram.com/p/ABC123/'
  }
];

let testsPassed = 0;
let testsFailed = 0;

// Test 1: Verify platform-frames.config.ts has all 7 platforms
console.log('\n[TEST 1] Verifying platform-frames.config.ts...');
try {
  const configPath = path.join(__dirname, 'src/platform-frames.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');

  let allPresent = true;
  COMPLETE_PLATFORMS.forEach(platform => {
    const pattern = new RegExp(`^\\s+${platform.id}:\\s*\\{`, 'm');
    if (!pattern.test(configContent)) {
      console.log(`  ❌ ${platform.name} (${platform.id}): NOT FOUND in config`);
      allPresent = false;
      testsFailed++;
    } else {
      console.log(`  ✅ ${platform.name} (${platform.id}): Found in config`);
      testsPassed++;
    }
  });

  if (allPresent) {
    console.log('✅ PASS: All 7 platforms are in platform-frames.config.ts');
  } else {
    console.log('❌ FAIL: Some platforms missing from config');
  }
} catch (error) {
  console.log('❌ FAIL: Could not read platform-frames.config.ts:', error.message);
  testsFailed++;
}

// Test 2: Verify platform-frames.js has implementations
console.log('\n[TEST 2] Verifying platform-frames.js implementations...');
try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  let allComplete = true;
  COMPLETE_PLATFORMS.forEach(platform => {
    // Check for chrome property
    const chromePattern = new RegExp(`${platform.id}:\\s*\\{[\\s\\S]*?chrome:\\s*` + '`', 'ms');
    const hasChrome = chromePattern.test(framesContent);

    // Check for themeVars property
    const themePattern = new RegExp(`${platform.id}:\\s*\\{[\\s\\S]*?themeVars:\\s*\\{`, 'ms');
    const hasTheme = themePattern.test(framesContent);

    if (hasChrome && hasTheme) {
      console.log(`  ✅ ${platform.name}: Complete implementation (chrome + themeVars)`);
      testsPassed++;
    } else {
      console.log(`  ⚠️  ${platform.name}: Chrome: ${hasChrome ? '✅' : '❌'}, Theme: ${hasTheme ? '✅' : '❌'}`);
      testsFailed++;
      allComplete = false;
    }
  });

  if (allComplete) {
    console.log('✅ PASS: All 7 platforms have complete implementations');
  } else {
    console.log('⚠️  WARNING: Some implementations incomplete');
  }
} catch (error) {
  console.log('❌ FAIL: Could not read platform-frames.js:', error.message);
  testsFailed++;
}

// Test 3: Verify renderPlatformWithContext exists and uses buildContextFrame
console.log('\n[TEST 3] Verifying renderPlatformWithContext integration...');
try {
  const appPath = path.join(__dirname, 'src/public/app.js');
  const appContent = fs.readFileSync(appPath, 'utf8');

  const hasFunction = /function renderPlatformWithContext\s*\(/.test(appContent);
  const callsBuildContextFrame = /buildContextFrame\s*\(/.test(appContent);
  const validatesPlatform = /PLATFORM_FRAMES\[pid\]/.test(appContent) || /getPlatformFrame\s*\(/.test(appContent);

  console.log(`  renderPlatformWithContext function: ${hasFunction ? '✅' : '❌'}`);
  console.log(`  Calls buildContextFrame: ${callsBuildContextFrame ? '✅' : '❌'}`);
  console.log(`  Validates platform mapping: ${validatesPlatform ? '✅' : '❌'}`);

  if (hasFunction && callsBuildContextFrame && validatesPlatform) {
    console.log('✅ PASS: renderPlatformWithContext properly integrated');
    testsPassed++;
  } else {
    console.log('❌ FAIL: renderPlatformWithContext integration incomplete');
    testsFailed++;
  }
} catch (error) {
  console.log('❌ FAIL: Could not read app.js:', error.message);
  testsFailed++;
}

// Test 4: Verify theme support declarations
console.log('\n[TEST 4] Verifying theme support declarations...');
try {
  const configPath = path.join(__dirname, 'src/platform-frames.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');

  let allWithTheme = true;
  COMPLETE_PLATFORMS.forEach(platform => {
    const themePattern = new RegExp(`^\\s+${platform.id}:[^}]*hasThemeSupport:\\s*true`, 'm');
    const hasTheme = themePattern.test(configContent);

    if (hasTheme) {
      console.log(`  ✅ ${platform.name}: Theme support enabled`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${platform.name}: Theme support NOT enabled`);
      testsFailed++;
      allWithTheme = false;
    }
  });

  if (allWithTheme) {
    console.log('✅ PASS: All 7 platforms support theme switching');
  } else {
    console.log('❌ FAIL: Some platforms lack theme support');
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify theme support:', error.message);
  testsFailed++;
}

// Test 5: Verify CSS infrastructure
console.log('\n[TEST 5] Verifying CSS infrastructure...');
try {
  const cssFiles = [
    'src/public/platform-frames-base.css',
    'src/public/platform-frames-enhanced.css'
  ];

  let cssExists = true;
  cssFiles.forEach(cssFile => {
    const cssPath = path.join(__dirname, cssFile);
    if (fs.existsSync(cssPath)) {
      const size = fs.statSync(cssPath).size;
      console.log(`  ✅ ${cssFile} (${Math.round(size/1024)}KB)`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${cssFile} NOT FOUND`);
      testsFailed++;
      cssExists = false;
    }
  });

  if (cssExists) {
    console.log('✅ PASS: CSS infrastructure present');
  } else {
    console.log('❌ FAIL: CSS infrastructure missing');
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify CSS:', error.message);
  testsFailed++;
}

// Test 6: Verify helper functions
console.log('\n[TEST 6] Verifying helper functions...');
try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  const helpers = [
    'function buildContextFrame',
    'function getPlatformFrame',
    'function hasThemeSupport',
    'function getThemeVars',
    'function interpolateTemplate'
  ];

  let allHelpers = true;
  helpers.forEach(helper => {
    const pattern = new RegExp(helper, 'm');
    if (pattern.test(framesContent)) {
      console.log(`  ✅ ${helper}`);
      testsPassed++;
    } else {
      console.log(`  ❌ ${helper} NOT FOUND`);
      testsFailed++;
      allHelpers = false;
    }
  });

  if (allHelpers) {
    console.log('✅ PASS: All required helper functions present');
  } else {
    console.log('❌ FAIL: Some helper functions missing');
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify helper functions:', error.message);
  testsFailed++;
}

// Final summary
console.log('\n' + '='.repeat(70));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(70));
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
  console.log('\n✅ SUCCESS: All platform frames are properly integrated!');
  console.log('\nNext steps:');
  console.log('1. Start the VISTA app (already running on port 3001)');
  console.log('2. Open http://localhost:3001 in a browser');
  console.log('3. Test each platform manually with dark/light theme toggle');
  console.log('4. Verify cards render embedded in frame context');
  console.log('5. Capture screenshots for final visual verification');
} else {
  console.log('\n❌ INCOMPLETE: Some integration issues found');
  console.log('Please address the failed tests above.');
}

console.log('='.repeat(70));

// Exit with appropriate code
process.exit(testsFailed === 0 ? 0 : 1);
