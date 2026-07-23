/**
 * Theme Toggle Verification Script
 *
 * Verifies that the dark/light mode toggle functionality works correctly
 * across all platform frames with theme support.
 */

const fs = require('fs');
const path = require('path');

// Platforms with theme support (from platform-frames.js)
const PLATFORMS_WITH_THEME = [
  'twitter',
  'linkedin',
  'youtube',
  'slack',
  'discord',
  'tiktok',
  'pinterest',
  'reddit',
  'jira',
  'trello',
  'asana'
];

// Test data
const testData = {
  title: 'Test Article',
  description: 'Test description for theme verification',
  domain: 'example.com',
  image: 'https://example.com/image.jpg'
};

/**
 * Verify theme variables are defined for all platforms
 */
function verifyThemeVariables() {
  console.log('🔍 Verifying theme variables...\n');

  const platformFramesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const content = fs.readFileSync(platformFramesPath, 'utf-8');

  const results = [];

  PLATFORMS_WITH_THEME.forEach(platform => {
    // Check if platform has themeVars defined
    const hasThemeVars = content.includes(`${platform}: {`) &&
                        content.match(new RegExp(`${platform}:.*?themeVars:`, 's'));

    // Check if both dark and light theme vars are defined
    const hasDarkTheme = content.includes(`"${platform}":`) &&
                        content.match(new RegExp(`${platform}:.*?"dark":`, 's'));
    const hasLightTheme = content.includes(`"${platform}":`) &&
                         content.match(new RegExp(`${platform}:.*?"light":`, 's'));

    const passed = hasThemeVars && hasDarkTheme && hasLightTheme;

    results.push({
      platform,
      hasThemeVars,
      hasDarkTheme,
      hasLightTheme,
      passed
    });

    console.log(`  ${passed ? '✅' : '❌'} ${platform}:`);
    console.log(`     - themeVars defined: ${hasThemeVars ? '✓' : '✗'}`);
    console.log(`     - dark theme: ${hasDarkTheme ? '✓' : '✗'}`);
    console.log(`     - light theme: ${hasLightTheme ? '✓' : '✗'}`);
  });

  return results;
}

/**
 * Verify theme toggle implementation in app.js
 */
function verifyThemeToggleImplementation() {
  console.log('\n🔍 Verifying theme toggle implementation...\n');

  const appJsPath = path.join(__dirname, 'src/public/app.js');
  const content = fs.readFileSync(appJsPath, 'utf-8');

  const checks = {
    applyThemeFunction: content.includes('function applyTheme'),
    themeToggleListener: content.includes('globalThemeToggle') && content.includes('addEventListener'),
    localStorageTheme: content.includes('localStorage.getItem(\'vista-theme\')'),
    dataThemeAttribute: content.includes('data-theme'),
    toggleCardThemeFunction: content.includes('function toggleCardTheme'),
    themeToggleIcon: content.includes('theme-icon-light') && content.includes('theme-icon-dark')
  };

  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}: ${passed ? '✓' : '✗'}`);
  });

  return checks;
}

/**
 * Verify frames-theme.js functionality
 */
function verifyFramesThemeModule() {
  console.log('\n🔍 Verifying frames-theme module...\n');

  const framesThemePath = path.join(__dirname, 'src/public/frames-theme.js');
  const content = fs.readFileSync(framesThemePath, 'utf-8');

  const checks = {
    initFrameThemeSystem: content.includes('function initFrameThemeSystem'),
    setFrameTheme: content.includes('function setFrameTheme'),
    applyFrameTheme: content.includes('function applyFrameTheme'),
    updateFramePlatformVars: content.includes('function updateFramePlatformVars'),
    getPlatformThemeVars: content.includes('function getPlatformThemeVars'),
    toggleFrameTheme: content.includes('function toggleFrameTheme'),
    autoInitialize: content.includes('initFrameThemeSystem(savedTheme)'),
    themeTypes: content.includes('THEME_TYPES') && content.includes('DARK') && content.includes('LIGHT')
  };

  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}: ${passed ? '✓' : '✗'}`);
  });

  return checks;
}

/**
 * Verify frame-renderer.js theme integration
 */
function verifyFrameRendererThemeIntegration() {
  console.log('\n🔍 Verifying frame-renderer theme integration...\n');

  const frameRendererPath = path.join(__dirname, 'src/public/frame-renderer.js');
  const content = fs.readFileSync(frameRendererPath, 'utf-8');

  const checks = {
    renderPlatformFrame: content.includes('function renderPlatformFrame'),
    themeParameter: content.includes('theme = \'auto\'') || content.includes('theme = "auto"'),
    applyPlatformTheme: content.includes('function applyPlatformTheme'),
    toggleFrameTheme: content.includes('function toggleFrameTheme'),
    initFrameRenderer: content.includes('function initFrameRenderer'),
    autoInitialize: content.includes('initFrameRenderer(savedTheme)')
  };

  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}: ${passed ? '✓' : '✗'}`);
  });

  return checks;
}

/**
 * Verify each platform has distinct visual identity in both themes
 */
function verifyPlatformVisualIdentity() {
  console.log('\n🔍 Verifying platform visual identity...\n');

  const platformFramesPath = path.join(__dirname, 'src/public/platform-frames.js');
  const content = fs.readFileSync(platformFramesPath, 'utf-8');

  const results = [];
  const accentColors = {};

  PLATFORMS_WITH_THEME.forEach(platform => {
    // Extract accent colors for dark and light themes
    const darkAccentMatch = content.match(new RegExp(
      `${platform}:.*?dark:.*?'--frame-accent':\\s*'([^']+)'`, 's'
    ));
    const lightAccentMatch = content.match(new RegExp(
      `${platform}:.*?light:.*?'--frame-accent':\\s*'([^']+)'`, 's'
    ));

    const darkAccent = darkAccentMatch ? darkAccentMatch[1] : null;
    const lightAccent = lightAccentMatch ? lightAccentMatch[1] : null;

    // Check if accent colors are defined (distinct brand identity)
    const hasAccent = darkAccent && lightAccent;

    // Check if theme has different background colors (ensuring visual distinction)
    const darkBgMatch = content.match(new RegExp(
      `${platform}:.*?dark:.*?'--frame-bg':\\s*'([^']+)'`, 's'
    ));
    const lightBgMatch = content.match(new RegExp(
      `${platform}:.*?light:.*?'--frame-bg':\\s*'([^']+)'`, 's'
    ));

    const darkBg = darkBgMatch ? darkBgMatch[1] : null;
    const lightBg = lightBgMatch ? lightBgMatch[1] : null;

    const hasDistinctBg = darkBg !== lightBg;
    const bgIsDarker = darkBg && lightBg && isColorDarker(darkBg, lightBg);

    const passed = hasAccent && hasDistinctBg && bgIsDarker;

    results.push({
      platform,
      darkAccent,
      lightAccent,
      hasAccent,
      darkBg,
      lightBg,
      hasDistinctBg,
      bgIsDarker,
      passed
    });

    console.log(`  ${passed ? '✅' : '❌'} ${platform}:`);
    console.log(`     - dark accent: ${darkAccent || 'N/A'}`);
    console.log(`     - light accent: ${lightAccent || 'N/A'}`);
    console.log(`     - distinct backgrounds: ${hasDistinctBg ? '✓' : '✗'}`);
    console.log(`     - dark theme darker: ${bgIsDarker ? '✓' : '✗'}`);
  });

  return results;
}

/**
 * Helper function to compare color brightness
 */
function isColorDarker(color1, color2) {
  const brightness1 = getColorBrightness(color1);
  const brightness2 = getColorBrightness(color2);
  return brightness1 < brightness2;
}

/**
 * Calculate perceived brightness of a hex color
 */
function getColorBrightness(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Main verification function
 */
function runVerification() {
  console.log('🎨 Theme Toggle Verification\n');
  console.log('=' .repeat(50));

  const themeVarsResults = verifyThemeVariables();
  const themeToggleResults = verifyThemeToggleImplementation();
  const framesThemeResults = verifyFramesThemeModule();
  const frameRendererResults = verifyFrameRendererThemeIntegration();
  const visualIdentityResults = verifyPlatformVisualIdentity();

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary\n');

  const themeVarsPassed = themeVarsResults.filter(r => r.passed).length;
  const themeTogglePassed = Object.values(themeToggleResults).filter(v => v).length;
  const framesThemePassed = Object.values(framesThemeResults).filter(v => v).length;
  const frameRendererPassed = Object.values(frameRendererResults).filter(v => v).length;
  const visualIdentityPassed = visualIdentityResults.filter(r => r.passed).length;

  console.log(`Theme Variables: ${themeVarsPassed}/${PLATFORMS_WITH_THEME.length} platforms passed`);
  console.log(`Theme Toggle Implementation: ${themeTogglePassed}/${Object.keys(themeToggleResults).length} checks passed`);
  console.log(`Frames Theme Module: ${framesThemePassed}/${Object.keys(framesThemeResults).length} checks passed`);
  console.log(`Frame Renderer Integration: ${frameRendererPassed}/${Object.keys(frameRendererResults).length} checks passed`);
  console.log(`Visual Identity: ${visualIdentityPassed}/${PLATFORMS_WITH_THEME.length} platforms passed`);

  const allPassed = themeVarsPassed === PLATFORMS_WITH_THEME.length &&
                   themeTogglePassed === Object.keys(themeToggleResults).length &&
                   framesThemePassed === Object.keys(framesThemeResults).length &&
                   frameRendererPassed === Object.keys(frameRendererResults).length &&
                   visualIdentityPassed === PLATFORMS_WITH_THEME.length;

  console.log('\n' + '='.repeat(50));
  console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('='.repeat(50));

  process.exit(allPassed ? 0 : 1);
}

// Run verification
runVerification();
