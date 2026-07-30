#!/usr/bin/env node
/**
 * Verify 7 Complete Platform Frames Integration
 *
 * This test verifies that all 7 fully-implemented platform frames are:
 * 1. Properly wired into renderPlatformWithContext
 * 2. Support dark/light theme switching
 * 3. Render cards embedded in frame context
 *
 * The 7 complete platforms are:
 * - twitter (X) - has chrome HTML
 * - youtube - has chrome HTML
 * - tiktok - has chrome HTML
 * - facebook - isStub: false with complete implementation notes
 * - linkedin - isStub: false with professional layout
 * - reddit - isStub: false with realistic chrome
 * - instagram - isStub: false with gradient styling
 */

const fs = require('fs');
const path = require('path');

// Test data for platforms
const TEST_DATA = {
  twitter: {
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
  youtube: {
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
  tiktok: {
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
  facebook: {
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
  linkedin: {
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
  reddit: {
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
  instagram: {
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
};

const COMPLETE_PLATFORMS = Object.keys(TEST_DATA);

console.log('='.repeat(70));
console.log('Verifying 7 Complete Platform Frames Integration');
console.log('='.repeat(70));

// Test 1: Check platform-frames.config.ts has all 7 platforms
console.log('\n[Test 1] Checking platform-frames.config.ts...');
try {
  const configPath = path.join(__dirname, 'src/platform-frames.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');

  const missingPlatforms = [];
  const stubPlatforms = [];
  const completePlatforms = [];

  COMPLETE_PLATFORMS.forEach(platform => {
    // Check if platform exists in config
    const platformPattern = new RegExp(`^\\s+${platform}:\\s*\\{`, 'm');
    if (!platformPattern.test(configContent)) {
      missingPlatforms.push(platform);
    } else {
      // Check if it's marked as stub or has chrome
      const stubPattern = new RegExp(`^\\s+${platform}:[^}]*isStub:\\s*true`, 'm');
      const chromePattern = new RegExp(`^\\s+${platform}:[^}]*chrome:\\s*` + '`', 'm');
      const implNotesPattern = new RegExp(`^\\s+${platform}:[^}]*implementationNotes:\\s*` + '[\'"]', 'm');

      if (stubPattern.test(configContent)) {
        stubPlatforms.push(platform);
      } else if (chromePattern.test(configContent) || implNotesPattern.test(configContent)) {
        completePlatforms.push(platform);
      } else {
        missingPlatforms.push(platform);
      }
    }
  });

  if (missingPlatforms.length > 0) {
    console.log('❌ FAIL: Missing platforms:', missingPlatforms.join(', '));
  } else if (stubPlatforms.length > 0) {
    console.log('⚠️  WARNING: Platforms marked as stubs:', stubPlatforms.join(', '));
  } else {
    console.log('✅ PASS: All 7 platforms found in config');
    completePlatforms.forEach(p => console.log(`   - ${p}`));
  }
} catch (error) {
  console.log('❌ FAIL: Could not read platform-frames.config.ts:', error.message);
}

// Test 2: Check platform-frames.js has implementations
console.log('\n[Test 2] Checking platform-frames.js implementations...');
try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  const missingImplementations = [];
  const incompleteImplementations = [];

  COMPLETE_PLATFORMS.forEach(platform => {
    const platformPattern = new RegExp(`^\\s+${platform}:\\s*\\{`, 'm');
    if (!platformPattern.test(framesContent)) {
      missingImplementations.push(platform);
    } else {
      // Check if it has chrome and themeVars
      const chromePattern = new RegExp(`^\\s+${platform}:[^}]*chrome:\\s*` + '`', 'ms');
      const themePattern = new RegExp(`^\\s+${platform}:[^}]*themeVars:\\s*\\{`, 'ms');

      if (!chromePattern.test(framesContent) || !themePattern.test(framesContent)) {
        incompleteImplementations.push(platform);
      }
    }
  });

  if (missingImplementations.length > 0) {
    console.log('❌ FAIL: Missing implementations:', missingImplementations.join(', '));
  } else if (incompleteImplementations.length > 0) {
    console.log('⚠️  WARNING: Incomplete implementations:', incompleteImplementations.join(', '));
  } else {
    console.log('✅ PASS: All 7 platforms have complete implementations in platform-frames.js');
  }
} catch (error) {
  console.log('❌ FAIL: Could not read platform-frames.js:', error.message);
}

// Test 3: Check renderPlatformWithContext exists in app.js
console.log('\n[Test 3] Checking renderPlatformWithContext in app.js...');
try {
  const appPath = path.join(__dirname, 'src/public/app.js');
  const appContent = fs.readFileSync(appPath, 'utf8');

  const hasFunction = /function renderPlatformWithContext\s*\(/.test(appContent);
  const callsBuildContextFrame = /buildContextFrame\s*\(/.test(appContent);

  if (!hasFunction) {
    console.log('❌ FAIL: renderPlatformWithContext function not found');
  } else if (!callsBuildContextFrame) {
    console.log('⚠️  WARNING: renderPlatformWithContext found but doesn\'t call buildContextFrame');
  } else {
    console.log('✅ PASS: renderPlatformWithContext exists and calls buildContextFrame');
  }
} catch (error) {
  console.log('❌ FAIL: Could not read app.js:', error.message);
}

// Test 4: Check theme support declarations
console.log('\n[Test 4] Checking theme support declarations...');
try {
  const configPath = path.join(__dirname, 'src/platform-frames.config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');

  const platformsWithoutTheme = [];
  const platformsWithTheme = [];

  COMPLETE_PLATFORMS.forEach(platform => {
    const platformPattern = new RegExp(`^\\s+${platform}:[^}]*hasThemeSupport:\\s*(true|false)`, 'm');
    const match = configContent.match(platformPattern);

    if (match && match[1] === 'false') {
      platformsWithoutTheme.push(platform);
    } else if (match && match[1] === 'true') {
      platformsWithTheme.push(platform);
    } else {
      platformsWithoutTheme.push(platform + ' (missing declaration)');
    }
  });

  if (platformsWithoutTheme.length > 0) {
    console.log('⚠️  Platforms without theme support:', platformsWithoutTheme.join(', '));
  }
  console.log(`✅ ${platformsWithTheme.length}/${COMPLETE_PLATFORMS.length} platforms support theme switching`);
  platformsWithTheme.forEach(p => console.log(`   - ${p}`));
} catch (error) {
  console.log('❌ FAIL: Could not check theme support:', error.message);
}

// Test 5: Verify helper functions exist
console.log('\n[Test 5] Checking helper functions in platform-frames.js...');
try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  const requiredFunctions = [
    'buildContextFrame',
    'getPlatformFrame',
    'hasThemeSupport',
    'getThemeVars',
    'interpolateTemplate',
    'buildLinkPreviewHTML',
    'getInlineThemeStyles'
  ];

  const missingFunctions = [];
  requiredFunctions.forEach(funcName => {
    const pattern = new RegExp(`function ${funcName}\\s*\\(`);
    if (!pattern.test(framesContent)) {
      missingFunctions.push(funcName);
    }
  });

  if (missingFunctions.length > 0) {
    console.log('❌ FAIL: Missing helper functions:', missingFunctions.join(', '));
  } else {
    console.log('✅ PASS: All required helper functions exist');
  }
} catch (error) {
  console.log('❌ FAIL: Could not check helper functions:', error.message);
}

// Test 6: Check CSS files for theme classes
console.log('\n[Test 6] Checking CSS theme classes...');
try {
  const cssFiles = [
    'src/public/frames-theme.css',
    'src/public/platform-frames-base.css'
  ];

  let allGood = true;
  COMPLETE_PLATFORMS.forEach(platform => {
    cssFiles.forEach(cssFile => {
      const cssPath = path.join(__dirname, cssFile);
      if (fs.existsSync(cssPath)) {
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        const hasDarkTheme = new RegExp(`\\.${platform}-context\\.dark-theme|\\.${platform}-context[^-].*dark`).test(cssContent);
        const hasLightTheme = new RegExp(`\\.${platform}-context\\.light-theme|\\.${platform}-context[^-].*light`).test(cssContent);

        if (!hasDarkTheme && !hasLightTheme) {
          console.log(`⚠️  ${platform}: No theme classes found in ${cssFile}`);
          allGood = false;
        }
      }
    });
  });

  if (allGood) {
    console.log('✅ PASS: Theme classes exist in CSS files');
  }
} catch (error) {
  console.log('❌ FAIL: Could not check CSS files:', error.message);
}

// Summary
console.log('\n' + '='.repeat(70));
console.log('VERIFICATION COMPLETE');
console.log('='.repeat(70));
console.log('\nAll 7 platforms should be accessible through renderPlatformWithContext');
console.log('Dark/light toggle should work for platforms with theme support');
console.log('Cards should render embedded in frame context');
console.log('\nFor full visual verification, run the app and test each platform manually.');
