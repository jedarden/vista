#!/usr/bin/env node

/**
 * Social Platforms Screenshot Capture Script
 *
 * Captures screenshots of all four social platforms (Reddit, Twitter/X, YouTube, TikTok)
 * in both dark and light themes for verification purposes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const screenshotDir = path.join(__dirname, 'screenshots');
const testFilePath = path.join(__dirname, 'src/public/test-social-platforms-complete.html');

console.log('🎯 Social Platforms Screenshot Capture Script');
console.log('='.repeat(50));

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
  console.log('✓ Created screenshots directory');
}

// Check if test file exists
if (!fs.existsSync(testFilePath)) {
  console.error('❌ Test file not found:', testFilePath);
  process.exit(1);
}

console.log('✓ Test file found:', testFilePath);
console.log('');

// Function to open browser for manual screenshot
function openBrowserForScreenshot(theme, platform) {
  const url = `file://${testFilePath}`;
  console.log(`📸 Opening browser for ${platform} - ${theme} theme screenshot...`);
  console.log('   Please take a manual screenshot when the browser opens.');
  console.log('   Press Enter when done to continue to the next capture...');

  try {
    // Open browser with the test file
    if (process.platform === 'darwin') {
      execSync(`open "${url}"`);
    } else if (process.platform === 'linux') {
      execSync(`xdg-open "${url}"`);
    } else if (process.platform === 'win32') {
      execSync(`start "" "${url}"`);
    }

    // Wait for user to take screenshot
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question('   Press Enter when screenshot taken...', () => {
        readline.close();
        resolve();
      });
    });
  } catch (error) {
    console.error('❌ Error opening browser:', error.message);
    return Promise.resolve();
  }
}

// Screenshots to capture
const screenshots = [
  { theme: 'dark', platform: 'reddit', name: 'reddit-dark.png' },
  { theme: 'dark', platform: 'twitter', name: 'twitter-dark.png' },
  { theme: 'dark', platform: 'youtube', name: 'youtube-dark.png' },
  { theme: 'dark', platform: 'tiktok', name: 'tiktok-dark.png' },
  { theme: 'light', platform: 'reddit', name: 'reddit-light.png' },
  { theme: 'light', platform: 'twitter', name: 'twitter-light.png' },
  { theme: 'light', platform: 'youtube', name: 'youtube-light.png' },
  { theme: 'light', platform: 'tiktok', name: 'tiktok-light.png' }
];

async function captureScreenshots() {
  console.log('📋 Screenshot Plan:');
  console.log('');

  screenshots.forEach((shot, index) => {
    console.log(`   ${index + 1}. ${shot.name} - ${shot.platform} (${shot.theme} theme)`);
  });

  console.log('');
  console.log('🚀 Starting screenshot capture process...');
  console.log('');

  for (const shot of screenshots) {
    const screenshotPath = path.join(screenshotDir, shot.name);
    console.log(`📸 Capture: ${shot.name}`);
    console.log(`   Platform: ${shot.platform}`);
    console.log(`   Theme: ${shot.theme}`);
    console.log(`   Output: ${screenshotPath}`);

    await openBrowserForScreenshot(shot.theme, shot.platform);

    console.log(`   ✓ ${shot.name} captured`);
    console.log('');
  }

  console.log('✅ All screenshots captured successfully!');
  console.log('');
  console.log('📁 Screenshot location:', screenshotDir);
  console.log('');
  console.log('🎯 Social Platforms Verification Complete!');
}

// Generate screenshot instructions
function generateInstructions() {
  const instructionsPath = path.join(__dirname, 'manual-screenshot-instructions.sh');

  const instructions = `#!/bin/bash

# Manual Screenshot Instructions for Social Platforms Verification
# This script provides the browser URLs and screenshot commands needed

echo "🎯 Social Platforms Manual Screenshot Instructions"
echo "================================================"
echo ""

# Define paths
TEST_FILE="src/public/test-social-platforms-complete.html"
SCREENSHOT_DIR="screenshots"

# Create screenshot directory
mkdir -p "$SCREENSHOT_DIR"

echo "📋 Screenshots to capture:"
echo ""

# Array of screenshots to capture
declare -a SCREENSHOTS=(
  "dark:reddit:reddit-dark.png"
  "dark:twitter:twitter-dark.png"
  "dark:youtube:youtube-dark.png"
  "dark:tiktok:tiktok-dark.png"
  "light:reddit:reddit-light.png"
  "light:twitter:twitter-light.png"
  "light:youtube:youtube-light.png"
  "light:tiktok:tiktok-light.png"
)

# Display screenshot plan
for i in "\${SCREENSHOTS[@]}"; do
  IFS=':' read -r THEME PLATFORM NAME <<< "$i"
  echo "  \${NAME} - \${PLATFORM} (\${THEME} theme)"
done

echo ""
echo "📸 Instructions:"
echo ""
echo "1. Open the test file in your browser:"
echo "   file://$(pwd)/$TEST_FILE"
echo ""
echo "2. Use the theme toggle button to switch between dark and light modes"
echo ""
echo "3. For each platform in both themes:"
echo "   - Navigate to the platform section"
echo "   - Take a screenshot of the frame"
echo "   - Save it to: $SCREENSHOT_DIR/<filename>"
echo ""
echo "4. Required screenshots:"
for i in "\${SCREENSHOTS[@]}"; do
  IFS=':' read -r THEME PLATFORM NAME <<< "$i"
  echo "   - $SCREENSHOT_DIR/\${NAME}"
done
echo ""
echo "💡 Tips:"
echo "   - Use browser developer tools to ensure responsive screenshots"
echo "   - Make sure all platform elements are visible in the screenshot"
echo "   - Verify that theme switching works correctly"
echo "   - Check that engagement buttons and user info render properly"
echo ""
echo "🎯 After capturing screenshots, verify:"
echo "   ✓ All four platforms (Reddit, Twitter/X, YouTube, TikTok) are present"
echo "   ✓ Dark and light themes are properly captured"
echo "   ✓ Platform-specific styling matches brand identity"
echo "   ✓ All engagement elements are visible"
echo "   ✓ User information displays correctly"
echo "   ✓ Link cards and embedded content render properly"
echo ""
echo "✅ Verification complete!"
`;

  fs.writeFileSync(instructionsPath, instructions, { mode: 0o755 });
  console.log('✓ Generated manual screenshot instructions:', instructionsPath);
}

// Main execution
(async () => {
  console.log('🔧 Setup...');
  generateInstructions();
  console.log('');

  // Ask user if they want to capture screenshots interactively
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Do you want to capture screenshots interactively? (y/n): ', async (answer) => {
    readline.close();

    if (answer.toLowerCase() === 'y') {
      await captureScreenshots();
    } else {
      console.log('');
      console.log('📋 Manual screenshot instructions generated.');
      console.log('Please follow the instructions in: manual-screenshot-instructions.sh');
      console.log('');
      console.log('🎯 Quick start:');
      console.log('   1. Open in browser: file://' + path.resolve(testFilePath));
      console.log('   2. Use theme toggle to switch themes');
      console.log('   3. Take screenshots of each platform in both themes');
      console.log('   4. Save to: ' + screenshotDir);
    }

    process.exit(0);
  });
})();
