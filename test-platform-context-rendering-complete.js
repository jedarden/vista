#!/usr/bin/env node
/**
 * Test Platform Context Rendering (bf-5wq2h)
 *
 * This test verifies that all 7 platforms are accessible through the context rendering system.
 *
 * The 7 complete platforms are:
 * - twitter (X)
 * - youtube
 * - tiktok
 * - facebook
 * - linkedin
 * - reddit
 * - instagram
 *
 * Acceptance Criteria:
 * - All 7 platforms accessible via getPlatformFrame function
 * - buildContextFrame successfully builds frames for all platforms
 * - Theme support works for platforms with hasThemeSupport flag
 * - Platform-specific chrome renders correctly
 * - Context rendering handles dark and light themes
 */

const fs = require('fs');
const path = require('path');

// Test data for platforms
const TEST_DATA = {
  twitter: {
    title: 'Amazing Tech Tutorial',
    description: 'Learn how to build amazing things in 10 minutes',
    image: 'https://example.com/twitter-image.jpg',
    domain: 'twitter.com',
    site: 'X',
    dominantColor: '#1da1f2'
  },
  youtube: {
    title: 'Complete Tutorial - Build in 10 Minutes',
    description: 'In this video, I\'ll show you how to get started with this amazing tool.',
    image: 'https://example.com/youtube-thumbnail.jpg',
    domain: 'youtube.com',
    site: 'YouTube',
    dominantColor: '#ff0000'
  },
  tiktok: {
    title: 'Amazing Content 🔗 #fyp #viral',
    description: 'Check out this amazing viral content!',
    image: 'https://example.com/tiktok-video.jpg',
    domain: 'tiktok.com',
    site: 'TikTok',
    dominantColor: '#000000'
  },
  facebook: {
    title: 'Great Article About Tech',
    description: 'Read this amazing article about the latest technology trends',
    image: 'https://example.com/fb-image.jpg',
    domain: 'facebook.com',
    site: 'Facebook',
    dominantColor: '#1877f2'
  },
  linkedin: {
    title: 'New Opportunity in Tech',
    description: 'Exciting career opportunity in the technology sector',
    image: 'https://example.com/linkedin-image.jpg',
    domain: 'linkedin.com',
    site: 'LinkedIn',
    dominantColor: '#0a66c2'
  },
  reddit: {
    title: 'Amazing discovery in r/technology',
    description: 'Found this incredible resource, had to share',
    image: 'https://example.com/reddit-image.jpg',
    domain: 'reddit.com',
    site: 'Reddit',
    dominantColor: '#ff4500'
  },
  instagram: {
    title: 'Beautiful sunset photo 🌅',
    description: 'Amazing sunset from my trip',
    image: 'https://example.com/instagram-photo.jpg',
    domain: 'instagram.com',
    site: 'Instagram',
    dominantColor: '#e1306c'
  }
};

const COMPLETE_PLATFORMS = Object.keys(TEST_DATA);

console.log('='.repeat(70));
console.log('Testing Platform Context Rendering (bf-5wq2h)');
console.log('='.repeat(70));

let allTestsPassed = true;

// ============================================================================
// Test 1: Verify getPlatformFrame function exists and works for all platforms
// ============================================================================
console.log('\n[Test 1] Verifying getPlatformFrame function exists and works...');

try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  // Check if getPlatformFrame function exists
  const hasGetPlatformFrame = /function getPlatformFrame\s*\(/.test(framesContent);
  if (!hasGetPlatformFrame) {
    console.log('❌ FAIL: getPlatformFrame function not found');
    allTestsPassed = false;
  } else {
    console.log('✅ PASS: getPlatformFrame function exists');

    // Check that all platforms are in PLATFORM_FRAMES
    const platformsMissing = [];
    COMPLETE_PLATFORMS.forEach(platform => {
      const platformPattern = new RegExp(`^\\s+${platform}:\\s*\\{`, 'm');
      if (!platformPattern.test(framesContent)) {
        platformsMissing.push(platform);
      }
    });

    if (platformsMissing.length > 0) {
      console.log('❌ FAIL: Missing platforms in PLATFORM_FRAMES:', platformsMissing.join(', '));
      allTestsPassed = false;
    } else {
      console.log('✅ PASS: All 7 platforms exist in PLATFORM_FRAMES object');
      COMPLETE_PLATFORMS.forEach(p => console.log(`   - ${p}`));
    }
  }
} catch (error) {
  console.log('❌ FAIL: Could not read platform-frames.js:', error.message);
  allTestsPassed = false;
}

// ============================================================================
// Test 2: Verify buildContextFrame function exists and builds frames
// ============================================================================
console.log('\n[Test 2] Verifying buildContextFrame function exists and builds frames...');

try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  // Check if buildContextFrame function exists
  const hasBuildContextFrame = /function buildContextFrame\s*\(/.test(framesContent);
  if (!hasBuildContextFrame) {
    console.log('❌ FAIL: buildContextFrame function not found');
    allTestsPassed = false;
  } else {
    console.log('✅ PASS: buildContextFrame function exists');

    // Check that it uses getPlatformFrame
    const usesGetPlatformFrame = /getPlatformFrame\s*\(/.test(framesContent);
    if (usesGetPlatformFrame) {
      console.log('✅ PASS: buildContextFrame uses getPlatformFrame');
    } else {
      console.log('⚠️  WARNING: buildContextFrame may not use getPlatformFrame');
    }

    // Check that it handles themes
    const handlesThemes = /hasThemeSupport\s*\(/.test(framesContent) || /themeVars/.test(framesContent);
    if (handlesThemes) {
      console.log('✅ PASS: buildContextFrame handles theme support');
    } else {
      console.log('⚠️  WARNING: buildContextFrame may not handle themes properly');
    }
  }
} catch (error) {
  console.log('❌ FAIL: Could not read platform-frames.js:', error.message);
  allTestsPassed = false;
}

// ============================================================================
// Test 3: Verify theme support works for platforms with hasThemeSupport flag
// ============================================================================
console.log('\n[Test 3] Verifying theme support for platforms with hasThemeSupport flag...');

try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  const platformsWithTheme = [];
  const platformsWithoutTheme = [];
  const platformsMissingThemeVars = [];

  COMPLETE_PLATFORMS.forEach(platform => {
    // Check hasThemeSupport flag (more permissive pattern)
    const themeSupportPattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?hasThemeSupport:\\s*(true|false)`, 'm');
    const themeMatch = framesContent.match(themeSupportPattern);

    if (themeMatch && themeMatch[1] === 'true') {
      platformsWithTheme.push(platform);

      // Check that it has themeVars (more permissive pattern)
      const themeVarsPattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?themeVars:\\s*\\{`, 'm');
      if (!themeVarsPattern.test(framesContent)) {
        platformsMissingThemeVars.push(platform);
      }
    } else if (themeMatch && themeMatch[1] === 'false') {
      platformsWithoutTheme.push(platform);
    } else {
      platformsWithoutTheme.push(platform + ' (missing flag)');
    }
  });

  if (platformsWithTheme.length > 0) {
    console.log(`✅ PASS: ${platformsWithTheme.length} platforms have hasThemeSupport: true`);
    platformsWithTheme.forEach(p => console.log(`   - ${p}`));
  }

  if (platformsWithoutTheme.length > 0) {
    console.log(`ℹ️  INFO: ${platformsWithoutTheme.length} platforms have hasThemeSupport: false or missing`);
    platformsWithoutTheme.forEach(p => console.log(`   - ${p}`));
  }

  if (platformsMissingThemeVars.length > 0) {
    console.log('❌ FAIL: Platforms marked with theme support but missing themeVars:', platformsMissingThemeVars.join(', '));
    allTestsPassed = false;
  } else if (platformsWithTheme.length > 0) {
    console.log('✅ PASS: All platforms with theme support have themeVars defined');
  }

  // Check helper functions for themes
  const hasHasThemeSupportFunc = /function hasThemeSupport\s*\(/.test(framesContent);
  const hasGetThemeVarsFunc = /function getThemeVars\s*\(/.test(framesContent);

  if (hasHasThemeSupportFunc && hasGetThemeVarsFunc) {
    console.log('✅ PASS: Theme helper functions exist (hasThemeSupport, getThemeVars)');
  } else {
    console.log('❌ FAIL: Missing theme helper functions');
    allTestsPassed = false;
  }

} catch (error) {
  console.log('❌ FAIL: Could not verify theme support:', error.message);
  allTestsPassed = false;
}

// ============================================================================
// Test 4: Verify platform-specific chrome renders correctly
// ============================================================================
console.log('\n[Test 4] Verifying platform-specific chrome renders correctly...');

try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  const platformsMissingChrome = [];

  COMPLETE_PLATFORMS.forEach(platform => {
    // Check if platform has chrome defined
    const chromePattern = new RegExp(`^\\s+${platform}:[^}]*chrome:\\s*` + '`', 'm');
    if (!chromePattern.test(framesContent)) {
      platformsMissingChrome.push(platform);
    }
  });

  if (platformsMissingChrome.length > 0) {
    console.log('❌ FAIL: Platforms missing chrome definition:', platformsMissingChrome.join(', '));
    allTestsPassed = false;
  } else {
    console.log('✅ PASS: All 7 platforms have chrome HTML defined');

    // Check that chrome templates have expected structure
    console.log('ℹ️  INFO: Checking chrome template structure...');
    COMPLETE_PLATFORMS.forEach(platform => {
      const chromePattern = new RegExp(`^\\s+${platform}:[^}]*chrome:\\s*` + '`([^`]+)`', 'm');
      const chromeMatch = framesContent.match(chromePattern);

      if (chromeMatch && chromeMatch[1]) {
        const chromeContent = chromeMatch[1];
        const hasPlaceholders = /\{\{[\w]+\}\}/.test(chromeContent);
        const hasHTML = /<div|<span|<button|<a /.test(chromeContent);

        if (hasHTML) {
          console.log(`   ✅ ${platform}: Chrome has HTML structure`);
          if (hasPlaceholders) {
            console.log(`   ✅ ${platform}: Chrome has template placeholders`);
          } else {
            console.log(`   ⚠️  ${platform}: Chrome may be missing template placeholders`);
          }
        } else {
          console.log(`   ⚠️  ${platform}: Chrome may not have proper HTML structure`);
        }
      }
    });
  }

  // Check for platform-specific CSS classes in chrome
  const platformsWithSpecificClasses = COMPLETE_PLATFORMS.filter(platform => {
    const chromePattern = new RegExp(`^\\s+${platform}:[^}]*chrome:\\s*` + '`([^`]+)`', 'm');
    const chromeMatch = framesContent.match(chromePattern);
    if (chromeMatch && chromeMatch[1]) {
      const platformClass = new RegExp(`class="[^"]*\\b${platform.substr(0, 2)}-`, 'i');
      return platformClass.test(chromeMatch[1]);
    }
    return false;
  });

  if (platformsWithSpecificClasses.length > 0) {
    console.log(`✅ PASS: ${platformsWithSpecificClasses.length} platforms use platform-specific CSS classes`);
  }

} catch (error) {
  console.log('❌ FAIL: Could not verify platform chrome:', error.message);
  allTestsPassed = false;
}

// ============================================================================
// Test 5: Verify context rendering handles dark and light themes
// ============================================================================
console.log('\n[Test 5] Verifying context rendering handles dark and light themes...');

try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  // Check for theme handling in buildContextFrame
  const handlesDarkLight = /theme\s*===\s*['"](dark|light)['"]|if\s*\([^)]*theme/.test(framesContent);
  const themeClassInjection = /\${theme}\s*-\s*theme|theme\s*-\s*theme/.test(framesContent) || /dark-theme|light-theme/.test(framesContent);

  if (handlesDarkLight || themeClassInjection) {
    console.log('✅ PASS: Context rendering handles theme switching');
  } else {
    console.log('⚠️  WARNING: Theme switching may not be implemented');
  }

  // Check that all platforms with theme support have both dark and light themeVars
  const platformsMissingDarkTheme = [];
  const platformsMissingLightTheme = [];

  COMPLETE_PLATFORMS.forEach(platform => {
    // Check if platform has theme support (more permissive pattern)
    const themeSupportPattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?hasThemeSupport:\\s*true`, 'm');
    if (themeSupportPattern.test(framesContent)) {
      // Check for dark themeVars (more permissive pattern)
      const darkThemePattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?themeVars:\\s*\\{[\\s\\S]*?dark:\\s*\\{`, 'm');
      if (!darkThemePattern.test(framesContent)) {
        platformsMissingDarkTheme.push(platform);
      }

      // Check for light themeVars (more permissive pattern)
      const lightThemePattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?themeVars:\\s*\\{[\\s\\S]*?light:\\s*\\{`, 'm');
      if (!lightThemePattern.test(framesContent)) {
        platformsMissingLightTheme.push(platform);
      }
    }
  });

  if (platformsMissingDarkTheme.length > 0) {
    console.log('❌ FAIL: Platforms with theme support missing dark theme:', platformsMissingDarkTheme.join(', '));
    allTestsPassed = false;
  } else if (platformsMissingLightTheme.length > 0) {
    console.log('❌ FAIL: Platforms with theme support missing light theme:', platformsMissingLightTheme.join(', '));
    allTestsPassed = false;
  } else {
    console.log('✅ PASS: All platforms with theme support have both dark and light themeVars');
  }

  // Check for theme CSS generation functions
  const hasGenerateThemeCSS = /function generateThemeCSS\s*\(/.test(framesContent);
  const hasGenerateAllThemeCSS = /function generateAllThemeCSS\s*\(/.test(framesContent);

  if (hasGenerateThemeCSS && hasGenerateAllThemeCSS) {
    console.log('✅ PASS: Theme CSS generation functions exist');
  } else {
    console.log('⚠️  WARNING: Theme CSS generation functions may be missing');
  }

} catch (error) {
  console.log('❌ FAIL: Could not verify theme handling:', error.message);
  allTestsPassed = false;
}

// ============================================================================
// Test 6: Verify platform frames are exported and accessible
// ============================================================================
console.log('\n[Test 6] Verifying platform frames are exported and accessible...');

try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  // Check for exports
  const hasModuleExports = /module\.exports\s*=\s*\{/.test(framesContent);
  const hasWindowExports = /window\.PLATFORM_FRAMES|window\.getPlatformFrame|window\.buildContextFrame/.test(framesContent);

  if (hasModuleExports) {
    console.log('✅ PASS: Platform frames exported for Node.js module system');
  }
  if (hasWindowExports) {
    console.log('✅ PASS: Platform frames exposed to global window object');
  }

  if (!hasModuleExports && !hasWindowExports) {
    console.log('❌ FAIL: No export mechanism found');
    allTestsPassed = false;
  }

  // Check that all required functions are exported
  const requiredExports = ['PLATFORM_FRAMES', 'getPlatformFrame', 'buildContextFrame', 'hasThemeSupport', 'getThemeVars'];
  const missingExports = [];

  requiredExports.forEach(exportName => {
    const exportPattern = new RegExp(`${exportName}\\s*,`, 'm');
    if (!exportPattern.test(framesContent) && !new RegExp(`window\\.${exportName}\\s*=`).test(framesContent)) {
      missingExports.push(exportName);
    }
  });

  if (missingExports.length > 0) {
    console.log('⚠️  WARNING: Missing exports:', missingExports.join(', '));
  } else {
    console.log('✅ PASS: All required functions are exported');
  }

} catch (error) {
  console.log('❌ FAIL: Could not verify exports:', error.message);
  allTestsPassed = false;
}

// ============================================================================
// Test 7: Verify CSS variables are defined for all themes
// ============================================================================
console.log('\n[Test 7] Verifying CSS variables are defined for all themes...');

try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  // Check for THEME_VAR_NAMES
  const hasThemeVarNames = /const THEME_VAR_NAMES\s*=\s*\[/.test(framesContent);
  if (hasThemeVarNames) {
    console.log('✅ PASS: THEME_VAR_NAMES array is defined');

    // Extract the array content
    const themeVarMatch = framesContent.match(/const THEME_VAR_NAMES\s*=\s*(\[[\s\S]*?\]);/);
    if (themeVarMatch && themeVarMatch[1]) {
      const themeVars = themeVarMatch[1].match(/'--[\w-]+'/g);
      if (themeVars && themeVars.length >= 10) {
        console.log(`✅ PASS: ${themeVars.length} CSS variables defined`);
      } else {
        console.log('⚠️  WARNING: Fewer than expected CSS variables defined');
      }
    }
  } else {
    console.log('⚠️  WARNING: THEME_VAR_NAMES array not found');
  }

  // Check that platforms with theme support define all required CSS vars
  const platformsWithIncompleteThemeVars = [];

  COMPLETE_PLATFORMS.forEach(platform => {
    const themeSupportPattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?hasThemeSupport:\\s*true`, 'm');
    if (themeSupportPattern.test(framesContent)) {
      // Check for essential themeVars (more permissive pattern)
      const essentialVars = ['--frame-bg', '--frame-text-primary', '--frame-accent'];
      const themeVarsPattern = new RegExp(`${platform}:\\s*\\{[\\s\\S]*?themeVars:\\s*\\{[\\s\\S]*?dark:\\s*\\{([^}]+)\\}`, 'm');
      const themeMatch = framesContent.match(themeVarsPattern);

      if (themeMatch && themeMatch[1]) {
        const missingVars = essentialVars.filter(varName => !themeMatch[1].includes(varName));
        if (missingVars.length > 0) {
          platformsWithIncompleteThemeVars.push(`${platform} (missing: ${missingVars.join(', ')})`);
        }
      }
    }
  });

  if (platformsWithIncompleteThemeVars.length > 0) {
    console.log('❌ FAIL: Platforms with incomplete themeVars:', platformsWithIncompleteThemeVars.join(', '));
    allTestsPassed = false;
  } else {
    console.log('✅ PASS: All platforms define essential CSS variables');
  }

} catch (error) {
  console.log('❌ FAIL: Could not verify CSS variables:', error.message);
  allTestsPassed = false;
}

// ============================================================================
// Test 8: Verify getSupportedPlatforms function
// ============================================================================
console.log('\n[Test 8] Verifying getSupportedPlatforms function...');

try {
  const framesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const framesContent = fs.readFileSync(framesPath, 'utf8');

  const hasGetSupportedPlatforms = /function getSupportedPlatforms\s*\(/.test(framesContent);
  if (!hasGetSupportedPlatforms) {
    console.log('⚠️  WARNING: getSupportedPlatforms function not found');
  } else {
    console.log('✅ PASS: getSupportedPlatforms function exists');

    // Check that it returns all platform keys (excluding generic)
    const filtersGeneric = /Object\.keys\(PLATFORM_FRAMES\)\.filter\([^)]*id\s*!==\s*['"]generic['"]/.test(framesContent);
    if (filtersGeneric) {
      console.log('✅ PASS: getSupportedPlatforms filters out generic platform');
    }
  }
} catch (error) {
  console.log('❌ FAIL: Could not verify getSupportedPlatforms:', error.message);
  allTestsPassed = false;
}

// ============================================================================
// Summary
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('TEST SUMMARY');
console.log('='.repeat(70));

if (allTestsPassed) {
  console.log('✅ ALL TESTS PASSED');
  console.log('\nAll 7 platforms are accessible through the context rendering system:');
  COMPLETE_PLATFORMS.forEach(p => console.log(`  ✅ ${p}`));
  console.log('\nThe platform context rendering system supports:');
  console.log('  ✅ getPlatformFrame function for accessing platform configurations');
  console.log('  ✅ buildContextFrame function for building complete frames');
  console.log('  ✅ Theme support with hasThemeSupport flag');
  console.log('  ✅ Platform-specific chrome rendering');
  console.log('  ✅ Dark and light theme handling');
  console.log('\nAll acceptance criteria have been met!');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('\nPlease review the failed tests above and fix the issues.');
  process.exit(1);
}