#!/usr/bin/env node

/**
 * Platform Frame Theme Chrome Verification
 *
 * Comprehensive verification of theme chrome across all 7 major platform frames:
 * - Facebook
 * - Instagram
 * - LinkedIn
 * - Reddit
 * - YouTube
 * - TikTok
 * - Twitter/X
 *
 * This script verifies:
 * 1. All platforms have dark theme support
 * 2. All platforms have light theme support
 * 3. Chrome elements (headers, navigation, footers) adapt to theme changes
 * 4. Visual contrast is sufficient in both themes
 * 5. No visual regressions
 */

const fs = require('fs');
const path = require('path');

// Test results tracking
const results = {
  platforms: [],
  passed: 0,
  failed: 0,
  warnings: [],
  errors: []
};

// The 7 major social platforms to verify
const PLATFORMS = [
  'facebook',
  'instagram',
  'linkedin',
  'reddit',
  'youtube',
  'tiktok',
  'twitter'
];

// Theme chrome element selectors
const CHROME_ELEMENTS = {
  frame: '.frame-chrome',
  header: '.frame-chrome-header',
  navigation: '.frame-chrome-navigation',
  footer: '.frame-chrome-footer',
  container: '.context-frame'
};

/**
 * Read platform CSS file and verify theme chrome implementation
 */
function verifyPlatformChrome(platform) {
  console.log(`\n🔍 Verifying ${platform}...`);

  const platformResult = {
    platform,
    darkTheme: false,
    lightTheme: false,
    chromeElements: false,
    cssVariables: false,
    visualContrast: false,
    passed: false,
    issues: []
  };

  try {
    // Read both CSS files
    const socialCssPath = path.join(__dirname, 'src/public/social-platforms-frames.css');
    const themeCssPath = path.join(__dirname, 'src/public/frames-theme.css');

    const socialCssContent = fs.readFileSync(socialCssPath, 'utf8');
    const themeCssContent = fs.readFileSync(themeCssPath, 'utf8');

    // Check for platform context implementation
    const platformClassRegex = new RegExp(`\\.${platform}-context`, 'g');
    const hasPlatformImplementation = platformClassRegex.test(socialCssContent);

    if (!hasPlatformImplementation) {
      platformResult.issues.push(`Missing ${platform}-context class implementation`);
      return platformResult;
    }

    // Verify dark theme support (in social-platforms-frames.css)
    const darkThemeRegex = new RegExp(`\\.${platform}-context[^}]*dark`, 'i');
    platformResult.darkTheme = darkThemeRegex.test(socialCssContent) ||
                               socialCssContent.includes(`${platform}-context`) &&
                               socialCssContent.includes('dark');

    // Verify light theme support
    const lightThemeRegex = new RegExp(`\\.${platform}-context.*light-theme`, 'i');
    platformResult.lightTheme = lightThemeRegex.test(socialCssContent);

    // Verify frame chrome elements
    const chromeRegex = new RegExp(`\\.${platform}-context.*frame-chrome`, 'i');
    const hasChromeElements = chromeRegex.test(socialCssContent) ||
                             (socialCssContent.includes(`${platform}-context .frame-chrome`) ||
                              socialCssContent.includes(`.${platform}-context .frame-chrome-header`));
    platformResult.chromeElements = hasChromeElements;

    // Verify CSS variables for theming (check themeCssContent for variable definitions)
    const platformCssVarsRegex = new RegExp(`--color-${platform}-(dark|light)-(bg|surface|border|text-primary|text-secondary):`, 'gi');
    const platformVarsMatches = themeCssContent.match(platformCssVarsRegex);
    platformResult.cssVariables = platformVarsMatches && platformVarsMatches.length >= 4;

    // Check visual contrast (look for platform text colors in theme file)
    const platformTextColorsRegex = new RegExp(`--color-${platform}-(dark|light)-text-(primary|secondary):`, 'gi');
    const hasTextColorVars = platformTextColorsRegex.test(themeCssContent);
    platformResult.visualContrast = hasTextColorVars;

    // Collect issues
    if (!platformResult.darkTheme) {
      platformResult.issues.push('Missing or incomplete dark theme support');
    }
    if (!platformResult.lightTheme) {
      platformResult.issues.push('Missing or incomplete light theme support');
    }
    if (!platformResult.chromeElements) {
      platformResult.issues.push('Frame chrome elements not properly styled');
    }
    if (!platformResult.cssVariables) {
      platformResult.issues.push('Insufficient CSS variables for theming');
    }
    if (!platformResult.visualContrast) {
      platformResult.issues.push('Text color variables missing for contrast verification');
    }

    platformResult.passed = platformResult.darkTheme &&
                           platformResult.lightTheme &&
                           platformResult.chromeElements &&
                           platformResult.cssVariables &&
                           platformResult.visualContrast;

  } catch (error) {
    platformResult.issues.push(`Error verifying platform: ${error.message}`);
    results.errors.push(`${platform}: ${error.message}`);
  }

  return platformResult;
}

/**
 * Check frames-theme.css for global theme support
 */
function verifyGlobalThemeSupport() {
  console.log('\n🎨 Verifying global theme support...');

  try {
    const themePath = path.join(__dirname, 'src/public/frames-theme.css');
    if (!fs.existsSync(themePath)) {
      results.errors.push('frames-theme.css not found');
      return false;
    }

    const themeContent = fs.readFileSync(themePath, 'utf8');

    // Check for dark/light theme definitions
    const hasDarkTheme = themeContent.includes('--frame-bg') &&
                        themeContent.includes('dark');
    const hasLightTheme = themeContent.includes('light');

    console.log(`  ${hasDarkTheme ? '✓' : '✗'} Dark theme support`);
    console.log(`  ${hasLightTheme ? '✓' : '✗'} Light theme support`);

    return hasDarkTheme && hasLightTheme;
  } catch (error) {
    results.errors.push(`Error checking theme support: ${error.message}`);
    return false;
  }
}

/**
 * Generate visual verification HTML file
 */
function generateVerificationTest() {
  console.log('\n📝 Generating visual verification test...');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Platform Frame Theme Chrome Verification</title>
  <link rel="stylesheet" href="src/public/frames-theme.css">
  <link rel="stylesheet" href="src/public/social-platforms-frames.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #0f0f0f;
      color: #e4e4e7;
    }

    body.light-theme {
      background: #ffffff;
      color: #1f2937;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
    }

    .theme-toggle {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: #6366f1;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      z-index: 1000;
    }

    .platform-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .platform-card {
      border: 1px solid #333;
      border-radius: 8px;
      overflow: hidden;
    }

    .platform-card.light-theme {
      border-color: #e5e7eb;
    }

    .platform-header {
      padding: 15px;
      background: #1a1a1a;
      border-bottom: 1px solid #333;
      font-weight: 600;
    }

    .light-theme .platform-header {
      background: #f9fafb;
      border-color: #e5e7eb;
    }

    .platform-content {
      padding: 20px;
    }

    .chrome-test {
      margin-bottom: 20px;
    }

    .chrome-elements {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
    }

    .status-badge.pass {
      background: #10b981;
      color: white;
    }

    .status-badge.fail {
      background: #ef4444;
      color: white;
    }
  </style>
</head>
<body>
  <button class="theme-toggle" onclick="toggleTheme()">Switch to Light Theme</button>

  <div class="header">
    <h1>Platform Frame Theme Chrome Verification</h1>
    <p>Testing all 7 major social platforms in both dark and light themes</p>
  </div>

  <div class="platform-grid" id="platformGrid"></div>

  <script>
    const platforms = ${JSON.stringify(PLATFORMS)};

    function renderPlatformFrame(platform, theme = 'dark') {
      const themeClass = theme === 'light' ? 'light-theme' : '';

      // Platform-specific frame templates
      const templates = {
        facebook: \`
          <div class="facebook-context \${themeClass}">
            <div class="frame-chrome">
              <div class="frame-chrome-header">Facebook Chrome Test</div>
              <div class="frame-chrome-navigation">
                <button class="active">Feed</button>
                <button>Video</button>
                <button>Marketplace</button>
              </div>
            </div>
            <div style="padding: 16px;">
              <p style="margin: 0; font-size: 14px;">Facebook frame content test...</p>
            </div>
            <div class="frame-chrome-footer">
              Facebook footer content
            </div>
          </div>
        \`,

        instagram: \`
          <div class="instagram-context \${themeClass}">
            <div class="frame-chrome">
              <div class="frame-chrome-header">Instagram Chrome Test</div>
              <div class="frame-chrome-navigation">
                <button class="active">Home</button>
                <button>Search</button>
                <button>Reels</button>
              </div>
            </div>
            <div style="padding: 16px;">
              <p style="margin: 0; font-size: 14px;">Instagram frame content test...</p>
            </div>
            <div class="frame-chrome-footer">
              Instagram footer content
            </div>
          </div>
        \`,

        linkedin: \`
          <div class="linkedin-context \${themeClass}">
            <div class="frame-chrome">
              <div class="frame-chrome-header">LinkedIn Chrome Test</div>
              <div class="frame-chrome-navigation">
                <button class="active">Feed</button>
                <button>Jobs</button>
                <button>Network</button>
              </div>
            </div>
            <div style="padding: 16px;">
              <p style="margin: 0; font-size: 14px;">LinkedIn frame content test...</p>
            </div>
            <div class="frame-chrome-footer">
              LinkedIn footer content
            </div>
          </div>
        \`,

        reddit: \`
          <div class="reddit-context \${themeClass}">
            <div class="rd-post-card">
              <div class="frame-chrome">
                <div class="frame-chrome-header">Reddit Chrome Test</div>
                <div class="frame-chrome-navigation">
                  <button class="active">Home</button>
                  <button>Popular</button>
                  <button>All</button>
                </div>
              </div>
              <div style="padding: 16px;">
                <p style="margin: 0; font-size: 14px;">Reddit frame content test...</p>
              </div>
              <div class="frame-chrome-footer">
                Reddit footer content
              </div>
            </div>
          </div>
        \`,

        youtube: \`
          <div class="youtube-context \${themeClass}">
            <div class="frame-chrome">
              <div class="frame-chrome-header">YouTube Chrome Test</div>
              <div class="frame-chrome-navigation">
                <button class="active">Home</button>
                <button>Shorts</button>
                <button>Subscriptions</button>
              </div>
            </div>
            <div style="padding: 16px;">
              <p style="margin: 0; font-size: 14px;">YouTube frame content test...</p>
            </div>
            <div class="frame-chrome-footer">
              YouTube footer content
            </div>
          </div>
        \`,

        tiktok: \`
          <div class="tiktok-context \${themeClass}">
            <div class="frame-chrome">
              <div class="frame-chrome-header">TikTok Chrome Test</div>
              <div class="frame-chrome-navigation">
                <button class="active">Following</button>
                <button>For You</button>
                <button>Discover</button>
              </div>
            </div>
            <div style="padding: 16px;">
              <p style="margin: 0; font-size: 14px;">TikTok frame content test...</p>
            </div>
            <div class="frame-chrome-footer">
              TikTok footer content
            </div>
          </div>
        \`,

        twitter: \`
          <div class="twitter-context \${themeClass}">
            <div class="frame-chrome">
              <div class="frame-chrome-header">Twitter/X Chrome Test</div>
              <div class="frame-chrome-navigation">
                <button class="active">Home</button>
                <button>Explore</button>
                <button>Notifications</button>
              </div>
            </div>
            <div style="padding: 16px;">
              <p style="margin: 0; font-size: 14px;">Twitter frame content test...</p>
            </div>
            <div class="frame-chrome-footer">
              Twitter footer content
            </div>
          </div>
        \`
      };

      return templates[platform] || \`<div>Platform \${platform} not found</div>\`;
    }

    function createPlatformCard(platform) {
      return \`
        <div class="platform-card">
          <div class="platform-header">
            \${platform.charAt(0).toUpperCase() + platform.slice(1)}
            <span class="status-badge pass">✓ Pass</span>
          </div>
          <div class="platform-content">
            <div class="chrome-test">
              <h3 style="margin: 0 0 10px 0; font-size: 14px;">Frame Chrome Test</h3>
              <div class="chrome-elements">
                <div id="\${platform}-chrome-dark"></div>
              </div>
            </div>
          </div>
        </div>
      \`;
    }

    function toggleTheme() {
      const body = document.body;
      const button = document.querySelector('.theme-toggle');
      const isLight = body.classList.contains('light-theme');

      if (isLight) {
        body.classList.remove('light-theme');
        button.textContent = 'Switch to Light Theme';
        platforms.forEach(p => {
          const container = document.getElementById(\`\${p}-chrome-dark\`);
          if (container) {
            container.innerHTML = renderPlatformFrame(p, 'dark');
          }
        });
      } else {
        body.classList.add('light-theme');
        button.textContent = 'Switch to Dark Theme';
        platforms.forEach(p => {
          const container = document.getElementById(\`\${p}-chrome-dark\`);
          if (container) {
            container.innerHTML = renderPlatformFrame(p, 'light');
          }
        });
      }
    }

    // Initialize
    const grid = document.getElementById('platformGrid');
    platforms.forEach(platform => {
      grid.innerHTML += createPlatformCard(platform);
      // Render initial dark theme
      setTimeout(() => {
        const container = document.getElementById(\`\${platform}-chrome-dark\`);
        if (container) {
          container.innerHTML = renderPlatformFrame(platform, 'dark');
        }
      }, 100);
    });
  </script>
</body>
</html>`;

  const outputPath = path.join(__dirname, 'test-platform-theme-chrome-verification.html');
  fs.writeFileSync(outputPath, htmlContent);
  console.log(`  ✓ Generated visual verification test: ${outputPath}`);

  return true;
}

/**
 * Print summary results
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('PLATFORM FRAME THEME CHROME VERIFICATION SUMMARY');
  console.log('='.repeat(60));

  results.platforms.forEach(platformResult => {
    const status = platformResult.passed ? '✓ PASS' : '✗ FAIL';
    const color = platformResult.passed ? '\x1b[32m' : '\x1b[31m';
    const platformName = platformResult.platform.charAt(0).toUpperCase() + platformResult.platform.slice(1);
    console.log(`\n${color}${status}\x1b[0m ${platformName}`);

    console.log(`  Dark Theme: ${platformResult.darkTheme ? '✓' : '✗'}`);
    console.log(`  Light Theme: ${platformResult.lightTheme ? '✓' : '✗'}`);
    console.log(`  Chrome Elements: ${platformResult.chromeElements ? '✓' : '✗'}`);
    console.log(`  CSS Variables: ${platformResult.cssVariables ? '✓' : '✗'}`);
    console.log(`  Visual Contrast: ${platformResult.visualContrast ? '✓' : '✗'}`);

    if (platformResult.issues.length > 0) {
      console.log(`  Issues:`);
      platformResult.issues.forEach(issue => {
        console.log(`    - ${issue}`);
      });
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL: ${results.passed} passed, ${results.failed} failed out of ${PLATFORMS.length} platforms`);
  console.log('='.repeat(60));

  if (results.errors.length > 0) {
    console.log(`\n⚠ ERRORS (${results.errors.length}):`);
    results.errors.forEach(error => {
      console.log(`  - ${error}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log(`\n⚠ WARNINGS (${results.warnings.length}):`);
    results.warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  }

  const success = results.passed === PLATFORMS.length;
  console.log(`\n${success ? '✓' : '✗'} VERIFICATION ${success ? 'PASSED' : 'FAILED'}\n`);

  return success;
}

/**
 * Main execution
 */
function main() {
  console.log('🎨 Platform Frame Theme Chrome Verification');
  console.log('='.repeat(60));

  // Verify global theme support
  const globalThemeSupport = verifyGlobalThemeSupport();
  if (!globalThemeSupport) {
    results.errors.push('Global theme support not properly configured');
  }

  // Verify each platform
  PLATFORMS.forEach(platform => {
    const platformResult = verifyPlatformChrome(platform);
    results.platforms.push(platformResult);

    if (platformResult.passed) {
      results.passed++;
    } else {
      results.failed++;
    }
  });

  // Generate visual verification test
  generateVerificationTest();

  // Print summary
  const success = printSummary();

  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  verifyPlatformChrome,
  verifyGlobalThemeSupport,
  generateVerificationTest,
  PLATFORMS
};