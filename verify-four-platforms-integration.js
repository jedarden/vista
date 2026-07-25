#!/usr/bin/env node

/**
 * Verification script for four platforms integration
 * Checks that all required files, CSS variables, and theme switching functionality are in place
 */

const fs = require('fs');
const path = require('path');

const platforms = ['reddit', 'twitter', 'youtube', 'tiktok'];
const publicDir = path.join(__dirname, 'src/public');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function extractCSSVariables(content) {
  // Match var(--variable-name) but not the fallback values
  const regex = /var\((--[a-zA-Z0-9-]+)/g;
  const variables = new Set();
  let match;
  while ((match = regex.exec(content)) !== null) {
    variables.add(match[1]);
  }
  return Array.from(variables);
}

function checkCSSVariableDefined(cssContent, variable) {
  // Check if variable is defined (either as base or in data-theme selectors)
  const regex = new RegExp(`${variable.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1')}\\s*:`);
  return regex.test(cssContent);
}

function verifyPlatformFrame(platform) {
  const frameFile = path.join(publicDir, `${platform}-frame.html`);
  const frameContent = readFileContent(frameFile);

  if (!frameContent) {
    log(`❌ ${platform}-frame.html not found`, 'red');
    return false;
  }

  log(`\n🔍 Checking ${platform}-frame.html...`, 'cyan');

  let allChecksPassed = true;

  // Check for CSS links
  if (!frameContent.includes('frames-theme.css') || !frameContent.includes('social-platforms-frames.css')) {
    log(`   ❌ Missing CSS file links`, 'red');
    allChecksPassed = false;
  } else {
    log(`   ✅ CSS files linked`, 'green');
  }

  // Check for context-frame class
  if (!frameContent.includes('context-frame') && !frameContent.includes(`${platform}-context`)) {
    log(`   ❌ Missing context-frame class`, 'red');
    allChecksPassed = false;
  } else {
    log(`   ✅ Context frame class present`, 'green');
  }

  // Check for theme toggle button
  if (!frameContent.includes('theme-toggle-btn')) {
    log(`   ❌ Missing theme toggle button`, 'red');
    allChecksPassed = false;
  } else {
    log(`   ✅ Theme toggle button present`, 'green');
  }

  // Check for toggleTheme function
  if (!frameContent.includes('function toggleTheme()')) {
    log(`   ❌ Missing toggleTheme function`, 'red');
    allChecksPassed = false;
  } else {
    log(`   ✅ toggleTheme function present`, 'green');
  }

  // Check for localStorage theme persistence
  if (!frameContent.includes('localStorage.setItem') || !frameContent.includes('vista-theme')) {
    log(`   ❌ Missing localStorage theme persistence`, 'red');
    allChecksPassed = false;
  } else {
    log(`   ✅ Theme persistence implemented`, 'green');
  }

  // Check for data-theme initialization
  if (!frameContent.includes('data-theme')) {
    log(`   ❌ Missing data-theme attribute`, 'red');
    allChecksPassed = false;
  } else {
    log(`   ✅ Data-theme attribute present`, 'green');
  }

  // Check for platform-specific CSS variables
  const usedVariables = extractCSSVariables(frameContent);
  const themeCSS = readFileContent(path.join(publicDir, 'frames-theme.css'));

  if (themeCSS) {
    let missingVariables = [];
    usedVariables.forEach(variable => {
      if (!checkCSSVariableDefined(themeCSS, variable)) {
        missingVariables.push(variable);
      }
    });

    if (missingVariables.length > 0) {
      log(`   ❌ Missing CSS variables: ${missingVariables.slice(0, 3).join(', ')}${missingVariables.length > 3 ? '...' : ''}`, 'red');
      allChecksPassed = false;
    } else {
      log(`   ✅ All CSS variables defined (${usedVariables.length} variables)`, 'green');
    }
  } else {
    log(`   ⚠️  Could not verify CSS variables`, 'yellow');
  }

  return allChecksPassed;
}

function verifyCSSFiles() {
  log('\n📁 Checking CSS files...', 'blue');

  const themeCSS = readFileContent(path.join(publicDir, 'frames-theme.css'));
  const platformsCSS = readFileContent(path.join(publicDir, 'social-platforms-frames.css'));

  if (!themeCSS) {
    log('❌ frames-theme.css not found', 'red');
    return false;
  }
  log('✅ frames-theme.css exists', 'green');

  if (!platformsCSS) {
    log('❌ social-platforms-frames.css not found', 'red');
    return false;
  }
  log('✅ social-platforms-frames.css exists', 'green');

  // Check for platform-specific CSS
  let platformCSSFound = 0;
  platforms.forEach(platform => {
    if (platformsCSS.includes(`.${platform}-context`)) {
      platformCSSFound++;
    }
  });

  if (platformCSSFound === platforms.length) {
    log(`✅ All ${platforms.length} platform CSS implementations found`, 'green');
  } else {
    log(`⚠️  Only ${platformCSSFound}/${platforms.length} platform CSS implementations found`, 'yellow');
  }

  return true;
}

function main() {
  log('\n🚀 Four Platforms Integration Verification', 'blue');
  log('=====================================', 'blue');

  let allPassed = true;

  // Check CSS files
  if (!verifyCSSFiles()) {
    allPassed = false;
  }

  // Check each platform frame
  let platformResults = {};
  platforms.forEach(platform => {
    const passed = verifyPlatformFrame(platform);
    platformResults[platform] = passed;
    if (!passed) allPassed = false;
  });

  // Summary
  log('\n📊 Summary', 'blue');
  log('================', 'blue');

  platforms.forEach(platform => {
    const status = platformResults[platform] ? '✅' : '❌';
    const color = platformResults[platform] ? 'green' : 'red';
    log(`${status} ${platform.charAt(0).toUpperCase() + platform.slice(1)} Frame`, color);
  });

  if (allPassed) {
    log('\n🎉 All checks passed! Four platforms integration is complete.', 'green');
    log('\n✨ Next steps:', 'cyan');
    log('   1. Open test-four-platforms-integration.html in a browser', 'cyan');
    log('   2. Test theme switching functionality', 'cyan');
    log('   3. Verify cards appear embedded in platform context', 'cyan');
    process.exit(0);
  } else {
    log('\n⚠️  Some checks failed. Please review the output above.', 'yellow');
    process.exit(1);
  }
}

// Run verification
main();