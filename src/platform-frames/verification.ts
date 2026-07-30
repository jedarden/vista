/**
 * Platform Frames Verification Test
 *
 * Comprehensive test suite to verify all platform frame components
 * are properly implemented and meet acceptance criteria.
 */

import type { FrameContentData, ThemeMode } from '../types/platform-frames';

/**
 * Sample content data for testing
 */
const SAMPLE_CONTENT: FrameContentData = {
  title: 'Amazing Article About Technology',
  description: 'Check out this fascinating article about the latest tech trends and innovations!',
  image: 'https://example.com/image.jpg',
  domain: 'example.com',
  author: 'Tech User',
  username: 'techuser',
  handle: 'techuser',
  timeAgo: '2h',
  likeCount: '42',
  commentCount: '8',
  shareCount: '3',
  viewCount: '1.2K',
  subreddit: 'technology',
  upvotes: '2.4K',
  subscriberCount: '1.2M',
  memberCount: '142K',
  onlineCount: '1.2K',
  music: 'Original Sound - Artist Name',
  hashtags: '#tech #innovation #future',
  headline: 'Software Engineer at Tech Company',
};

/**
 * Test results interface
 */
interface TestResult {
  platformId: string;
  platformName: string;
  componentExists: boolean;
  canRender: boolean;
  canRenderChrome: boolean;
  hasThemeSupport: boolean;
  validatesContent: boolean;
  hasCorrectInterface: boolean;
  overallSuccess: boolean;
  errors: string[];
}

/**
 * Comprehensive verification test for all platform frames
 */
export async function verifyAllPlatformFrames(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const platformIds = ['facebook', 'twitter', 'linkedin', 'reddit', 'youtube', 'instagram', 'tiktok'];

  for (const platformId of platformIds) {
    const result: TestResult = {
      platformId,
      platformName: '',
      componentExists: false,
      canRender: false,
      canRenderChrome: false,
      hasThemeSupport: false,
      validatesContent: false,
      hasCorrectInterface: false,
      overallSuccess: false,
      errors: [],
    };

    try {
      // Dynamic import of platform frame component
      const modulePath = `./platform-frames/${platformId}-frame`;
      const platformModule = await import(modulePath);

      // Get the factory function or default export
      const factoryFn = platformModule[`create${platformId.charAt(0).toUpperCase() + platformId.slice(1)}Frame`] ||
                       platformModule.default;

      if (!factoryFn) {
        result.errors.push(`No factory function found for ${platformId}`);
        continue;
      }

      const component = factoryFn();

      // Set component exists flag
      result.componentExists = true;

      // Set platform name
      result.platformName = component.platformName;

      // Check interface
      result.hasCorrectInterface = !!(
        component.platformId &&
        component.platformName &&
        component.frameType &&
        component.hasThemeSupport !== undefined &&
        component.aspectRatio &&
        component.brandColors &&
        component.layoutPattern &&
        typeof component.render === 'function' &&
        typeof component.renderChrome === 'function' &&
        typeof component.getThemeVars === 'function' &&
        typeof component.validateContent === 'function'
      );

      if (!result.hasCorrectInterface) {
        result.errors.push('Component does not have correct interface');
      }

      // Test render functionality
      try {
        const renderedHtml = component.render(SAMPLE_CONTENT, 'dark');
        result.canRender = typeof renderedHtml === 'string' && renderedHtml.length > 0;

        if (!result.canRender) {
          result.errors.push('Render did not produce valid HTML string');
        }
      } catch (error) {
        result.canRender = false;
        result.errors.push(`Render failed: ${error.message}`);
      }

      // Test render chrome functionality
      try {
        const chromeHtml = component.renderChrome('light');
        result.canRenderChrome = typeof chromeHtml === 'string' && chromeHtml.length > 0;

        if (!result.canRenderChrome) {
          result.errors.push('RenderChrome did not produce valid HTML string');
        }
      } catch (error) {
        result.canRenderChrome = false;
        result.errors.push(`RenderChrome failed: ${error.message}`);
      }

      // Check theme support
      result.hasThemeSupport = component.hasThemeSupport;

      // Test content validation
      try {
        const isValid = component.validateContent(SAMPLE_CONTENT);
        result.validatesContent = typeof isValid === 'boolean';

        if (!result.validatesContent) {
          result.errors.push('ValidateContent did not return boolean');
        }
      } catch (error) {
        result.validatesContent = false;
        result.errors.push(`ValidateContent failed: ${error.message}`);
      }

      // Test theme variables
      try {
        const themeVars = component.getThemeVars('dark');
        const hasValidVars = typeof themeVars === 'object' &&
                           themeVars !== null &&
                           Object.keys(themeVars).length > 0;

        if (!hasValidVars) {
          result.errors.push('GetThemeVars did not return valid variables object');
        }
      } catch (error) {
        result.errors.push(`GetThemeVars failed: ${error.message}`);
      }

      // Calculate overall success
      result.overallSuccess =
        result.componentExists &&
        result.canRender &&
        result.canRenderChrome &&
        result.validatesContent &&
        result.hasCorrectInterface &&
        result.errors.length === 0;

    } catch (error) {
      result.errors.push(`Failed to load component: ${error.message}`);
    }

    results.push(result);
  }

  return results;
}

/**
 * Print verification results to console
 */
export function printVerificationResults(results: TestResult[]): void {
  console.log('\n=== Platform Frames Verification Results ===\n');

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const result of results) {
    if (result.overallSuccess) {
      totalSuccess++;
      console.log(`✅ ${result.platformName} (${result.platformId})`);
      console.log(`   - Component exists: ${result.componentExists}`);
      console.log(`   - Can render: ${result.canRender}`);
      console.log(`   - Can render chrome: ${result.canRenderChrome}`);
      console.log(`   - Validates content: ${result.validatesContent}`);
      console.log(`   - Has correct interface: ${result.hasCorrectInterface}`);
      console.log(`   - Theme support: ${result.hasThemeSupport}`);
    } else {
      totalFailed++;
      console.log(`❌ ${result.platformName} (${result.platformId})`);
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`   - Error: ${error}`);
        });
      }
    }
    console.log('');
  }

  console.log(`Total: ${results.length} platforms`);
  console.log(`Success: ${totalSuccess}`);
  console.log(`Failed: ${totalFailed}`);
  console.log('\n=== Verification Complete ===\n');
}

/**
 * Generate HTML verification page
 */
export async function generateVerificationHTML(): Promise<string> {
  const results = await verifyAllPlatformFrames();

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Platform Frames Verification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .summary {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      min-width: 150px;
    }
    .summary-card.success {
      border-left: 4px solid #24A0ED;
    }
    .summary-card.failed {
      border-left: 4px solid #FF4500;
    }
    .platform-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .platform-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .platform-card.success {
      border-top: 4px solid #24A0ED;
    }
    .platform-card.failed {
      border-top: 4px solid #FF4500;
    }
    .platform-name {
      font-size: 1.2em;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .platform-id {
      color: #666;
      font-size: 0.9em;
      margin-bottom: 15px;
    }
    .test-result {
      display: flex;
      align-items: center;
      margin: 5px 0;
      font-size: 0.9em;
    }
    .test-result.success {
      color: #24A0ED;
    }
    .test-result.failed {
      color: #FF4500;
    }
    .test-icon {
      margin-right: 8px;
    }
    .error-list {
      margin-top: 10px;
      padding: 10px;
      background: #FFF5F5;
      border-radius: 4px;
    }
    .error-item {
      color: #CC3700;
      font-size: 0.85em;
      margin: 3px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Platform Frames Verification</h1>
    <p>Comprehensive test results for all 7 social media platform frame components</p>
  </div>

  <div class="summary">
    <div class="summary-card success">
      <div class="count">${results.filter(r => r.overallSuccess).length}</div>
      <div>Success</div>
    </div>
    <div class="summary-card failed">
      <div class="count">${results.filter(r => !r.overallSuccess).length}</div>
      <div>Failed</div>
    </div>
    <div class="summary-card">
      <div class="count">${results.length}</div>
      <div>Total</div>
    </div>
  </div>

  <div class="platform-grid">`;

  for (const result of results) {
    const statusClass = result.overallSuccess ? 'success' : 'failed';
    const statusIcon = result.overallSuccess ? '✅' : '❌';

    html += `
    <div class="platform-card ${statusClass}">
      <div class="platform-name">${result.platformName}</div>
      <div class="platform-id">ID: ${result.platformId}</div>

      <div class="test-result ${result.componentExists ? 'success' : 'failed'}">
        <span class="test-icon">${result.componentExists ? '✓' : '✗'}</span>
        Component exists
      </div>
      <div class="test-result ${result.canRender ? 'success' : 'failed'}">
        <span class="test-icon">${result.canRender ? '✓' : '✗'}</span>
        Can render
      </div>
      <div class="test-result ${result.canRenderChrome ? 'success' : 'failed'}">
        <span class="test-icon">${result.canRenderChrome ? '✓' : '✗'}</span>
        Can render chrome
      </div>
      <div class="test-result ${result.validatesContent ? 'success' : 'failed'}">
        <span class="test-icon">${result.validatesContent ? '✓' : '✗'}</span>
        Validates content
      </div>
      <div class="test-result ${result.hasCorrectInterface ? 'success' : 'failed'}">
        <span class="test-icon">${result.hasCorrectInterface ? '✓' : '✗'}</span>
        Correct interface
      </div>
      <div class="test-result">
        <span class="test-icon">ℹ️</span>
        Theme support: ${result.hasThemeSupport ? 'Yes' : 'No'}
      </div>`;

    if (result.errors.length > 0) {
      html += `
      <div class="error-list">
        <div class="error-item">${statusIcon} Errors:</div>`;
      for (const error of result.errors) {
        html += `<div class="error-item">• ${error}</div>`;
      }
      html += `</div>`;
    }

    html += `
    </div>`;
  }

  html += `
  </div>
</body>
</html>`;

  return html;
}

// Run verification when executed directly
if (require.main === module) {
  const results = verifyAllPlatformFrames();
  printVerificationResults(results);

  // Generate HTML report
  const html = generateVerificationHTML();
  console.log('HTML verification report generated.');
}
