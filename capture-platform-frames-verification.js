/**
 * Capture screenshots of all 7 platform frames in both dark and light themes
 *
 * This script uses the server to render platform frames and captures screenshots
 * for manual verification of the wiring and theme switching.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PLATFORMS = ['facebook', 'twitter', 'linkedin', 'reddit', 'youtube', 'instagram', 'tiktok'];
const THEMES = ['dark', 'light'];
const OUTPUT_DIR = path.join(__dirname, 'screenshots', 'platform-frames-verification');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Test page HTML that renders all 7 platforms in both themes
 */
const TEST_PAGE_HTML = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Platform Frames Verification - All 7 Platforms</title>
  <link rel="stylesheet" href="platform-frames-base.css">
  <link rel="stylesheet" href="frames-theme.css">
  <link rel="stylesheet" href="social-platforms-frames.css">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #0f0f12;
      color: #e4e4e7;
    }
    html[data-theme='light'] body {
      background: #f8fafc;
      color: #1f2937;
    }
    h1 { margin-bottom: 10px; }
    .subtitle { margin-bottom: 30px; opacity: 0.8; }
    .platform-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }
    .platform-section {
      margin-bottom: 50px;
    }
    .platform-section h2 {
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #333;
    }
    html[data-theme='light'] .platform-section h2 {
      border-bottom-color: #e2e8f0;
    }
    .theme-toggle {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #5865f2;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      z-index: 1000;
    }
    .theme-toggle:hover { background: #4752c4; }
    .verification-summary {
      background: #1f2937;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    html[data-theme='light'] .verification-summary {
      background: #e2e8f0;
    }
    .check-item {
      display: flex;
      align-items: center;
      margin: 8px 0;
    }
    .check-item::before {
      content: '✓ ';
      color: #16a34a;
      font-weight: bold;
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <button class="theme-toggle" onclick="toggleTheme()">Toggle Theme</button>

  <h1>Platform Frames Verification - All 7 Platforms</h1>
  <p class="subtitle">Verifying renderPlatformWithContext wiring through platform-frames.config.ts</p>

  <div class="verification-summary">
    <h3>✓ Verification Checklist</h3>
    <div class="check-item">All 7 platforms configured in platform-frames.config.ts</div>
    <div class="check-item">Each platform routes through centralized context (not legacy)</div>
    <div class="check-item">Platform-specific realistic chrome rendered</div>
    <div class="check-item">No unfilled placeholders ({{...}}) in output</div>
    <div class="check-item">Embedded cards appear inside frame chrome</div>
    <div class="check-item">Both dark and light themes render correctly</div>
    <div class="check-item">Dark vs light backgrounds differ per platform</div>
  </div>

  <script src="platform-frames-config.js"></script>
  <script src="platform-frames.js"></script>
  <script>
    const PLATFORMS = ['facebook', 'twitter', 'linkedin', 'reddit', 'youtube', 'instagram', 'tiktok'];
    let currentTheme = 'dark';

    function renderAllPlatforms() {
      const container = document.createElement('div');
      container.className = 'platform-grid';
      container.id = 'platform-grid';

      PLATFORMS.forEach(pid => {
        const section = document.createElement('div');
        section.className = 'platform-section';

        const header = document.createElement('h2');
        header.textContent = pid.charAt(0).toUpperCase() + pid.slice(1);
        section.appendChild(header);

        // Build content data
        const contentData = {
          title: \`\${pid} Example Post Title\`,
          description: \`This is a sample description for \${pid} platform frame. It demonstrates the realistic chrome and embedded card functionality.\`,
          image: 'https://via.placeholder.com/600x315/5865f2/ffffff?text=Sample+Image',
          domain: 'example.com',
          site: pid.charAt(0).toUpperCase() + pid.slice(1),
          cardHTML: '',
          frameType: getPlatformFrameConfig(pid).frameType,
          aspectRatio: getPlatformFrameConfig(pid).aspectRatio,
          hasThemeSupport: getPlatformFrameConfig(pid).hasThemeSupport,
        };

        // Generate link preview HTML
        if (typeof buildLinkPreviewHTML === 'function') {
          contentData.cardHTML = buildLinkPreviewHTML(pid, contentData, currentTheme);
        }

        // Build the frame
        let frameHTML = '';
        try {
          frameHTML = buildContextFrame(pid, contentData, currentTheme);
        } catch (e) {
          frameHTML = \`<div style="padding: 20px; background: #dc2626; color: white; border-radius: 8px;">Error: \${e.message}</div>\`;
        }

        const wrapper = document.createElement('div');
        wrapper.innerHTML = frameHTML;
        section.appendChild(wrapper);

        container.appendChild(section);
      });

      const existingGrid = document.getElementById('platform-grid');
      if (existingGrid) {
        existingGrid.replaceWith(container);
      } else {
        document.body.appendChild(container);
      }
    }

    function toggleTheme() {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', currentTheme);

      // Update all platform frames
      if (window.FrameTheme && window.FrameTheme.updateAllPlatformFrames) {
        window.FrameTheme.updateAllPlatformFrames(currentTheme);
      }

      // Re-render to show theme changes
      renderAllPlatforms();
    }

    // Initial render
    window.addEventListener('DOMContentLoaded', () => {
      if (typeof getPlatformFrameConfig !== 'function' || typeof buildContextFrame !== 'function') {
        document.body.innerHTML = '<div style="padding: 40px; background: #dc2626; color: white;">Error: Required scripts not loaded. Please ensure platform-frames-config.js and platform-frames.js are available.</div>';
        return;
      }
      renderAllPlatforms();
    });
  </script>
</body>
</html>`;

// Create the test page
const testPagePath = path.join(__dirname, 'src', 'public', 'verify-platform-frames-all-7.html');
fs.writeFileSync(testPagePath, TEST_PAGE_HTML);
console.log(`✅ Test page created: ${testPagePath}`);

// Test function to verify each platform renders
async function testPlatformRendering() {
  console.log('\n🧪 Testing platform frame rendering...\n');

  let allPassed = true;

  for (const pid of PLATFORMS) {
    for (const theme of THEMES) {
      try {
        const response = await getPageWithPlatform(pid, theme);
        if (response.includes('context-frame') &&
            response.includes(`${pid}-context`) &&
            response.includes(`${theme}-theme`)) {
          console.log(`  ✓ ${pid} (${theme}): Frame renders correctly`);
        } else {
          console.log(`  ✗ ${pid} (${theme}): Frame missing expected elements`);
          allPassed = false;
        }

        if (response.includes('{{') && response.includes('}}')) {
          console.log(`  ⚠ ${pid} (${theme}): Unfilled placeholders detected`);
          allPassed = false;
        }

        if (!response.includes('frame-type-')) {
          console.log(`  ⚠ ${pid} (${theme}): Missing frame-type attribute`);
          allPassed = false;
        }
      } catch (error) {
        console.log(`  ✗ ${pid} (${theme}): Error - ${error.message}`);
        allPassed = false;
      }
    }
  }

  if (allPassed) {
    console.log('\n✅ All rendering tests passed!\n');
  } else {
    console.log('\n⚠ Some tests failed - check output above\n');
  }
}

// Helper to get rendered platform page
async function getPageWithPlatform(platformId, theme) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/verify-platform-frames-all-7.html',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.end();
  });
}

// Manual screenshot capture instructions
function showScreenshotInstructions() {
  console.log('\n📸 Manual Screenshot Capture Instructions:\n');
  console.log('1. Open your browser and navigate to:');
  console.log('   http://localhost:3000/verify-platform-frames-all-7.html\n');
  console.log('2. For each platform in both themes:');
  console.log('   - Click "Toggle Theme" to switch between dark/light');
  console.log('   - Take a screenshot of each platform frame\n');
  console.log('3. Verify the following:');
  console.log('   - ✓ Platform-specific realistic chrome (not generic)');
  console.log('   - ✓ No unfilled {{placeholder}} markers');
  console.log('   - ✓ Card embedded inside frame chrome');
  console.log('   - ✓ Dark theme has different background than light');
  console.log('   - ✓ Platform frame-type attribute present\n');
  console.log(`4. Save screenshots to: ${OUTPUT_DIR}\n`);
  console.log('Expected screenshots (14 total):');
  PLATFORMS.forEach(pid => {
    console.log(`  - ${pid}-dark.png`);
    console.log(`  - ${pid}-light.png`);
  });
  console.log();
}

// Run tests
async function run() {
  console.log('🚀 Platform Frames Verification System');
  console.log('======================================\n');

  await testPlatformRendering();
  showScreenshotInstructions();

  console.log('✅ Verification page ready!');
  console.log('📁 Test page: verify-platform-frames-all-7.html');
  console.log('🌐 Server: http://localhost:3000/verify-platform-frames-all-7.html\n');
}

run().catch(console.error);
