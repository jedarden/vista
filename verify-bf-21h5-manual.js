/**
 * Manual DOM Reordering Verification for BF-21h5
 *
 * This script creates a test page and provides instructions for manual DOM inspection.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const TEST_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BF-21h5 Manual DOM Reordering Test</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .header h1 { margin: 0 0 10px 0; }
    .test-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .test-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .test-card h3 {
      margin: 0 0 15px 0;
      color: #333;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    .url-section {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 4px;
      margin: 10px 0;
      border-left: 4px solid #007bff;
    }
    .url-section code {
      font-family: monospace;
      background: white;
      padding: 4px 8px;
      border-radius: 3px;
      word-break: break-all;
    }
    .platforms-section {
      margin: 15px 0;
    }
    .platform-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 10px 0;
    }
    .platform-badge {
      background: #007bff;
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-family: monospace;
      font-weight: 600;
    }
    .instructions {
      background: #e3f2fd;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #2196f3;
    }
    .instructions ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .instructions li {
      margin: 8px 0;
    }
    .console-command {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 15px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      overflow-x: auto;
      margin: 10px 0;
    }
    .result-section {
      background: white;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
      border: 2px solid #dee2e6;
    }
    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 15px 0;
    }
    .comparison-column h4 {
      margin: 0 0 10px 0;
      color: #495057;
    }
    .platform-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .platform-list li {
      padding: 6px 10px;
      margin: 3px 0;
      background: #f8f9fa;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
    }
    .platform-list li.match {
      background: #d4edda;
      color: #155724;
    }
    .platform-list li.miss {
      background: #f8d7da;
      color: #721c24;
    }
    .button {
      background: #28a745;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      margin: 5px;
    }
    .button:hover { background: #218838; }
    .button:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
    .summary {
      background: #fff3cd;
      border: 2px solid #ffc107;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .status-pass { color: #28a745; font-weight: bold; }
    .status-fail { color: #dc3545; font-weight: bold; }
    .status-partial { color: #ffc107; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 BF-21h5: DOM Reordering Verification</h1>
    <p>Manual testing to verify platform cards reorder correctly when preferences change</p>
  </div>

  <div class="instructions">
    <h3>📋 Test Instructions</h3>
    <ol>
      <li><strong>Open VISTA application:</strong> <a href="http://localhost:3000" target="_blank">http://localhost:3000</a></li>
      <li><strong>Open DevTools:</strong> Press F12 or right-click → "Inspect Element"</li>
      <li>For each test case below:
        <ul>
          <li>Copy the test URL and paste it into VISTA's URL input field</li>
          <li>Click "Inspect" button and wait for platform cards to load</li>
          <li>Open DevTools Console in VISTA tab</li>
          <li>Paste the provided console command to extract platform order</li>
          <li>Return to this page and click "Verify Result"</li>
        </ul>
      </li>
    </ol>
  </div>

  <div class="test-grid" id="test-container"></div>

  <div class="summary" id="summary" style="display: none;">
    <h3>📊 Test Summary</h3>
    <div id="summary-content"></div>
  </div>

  <script>
    const TEST_CONFIGS = [
      {
        id: 1,
        name: 'Article Page Type',
        url: 'https://blog.example.com/2024/07/my-article',
        pageType: 'article',
        expectedOrder: ['twitter', 'facebook', 'linkedin', 'reddit', 'bluesky', 'threads', 'mastodon'],
        description: 'Blog article should prioritize Twitter, Facebook, LinkedIn, Reddit',
        consoleCommand: \`const platforms = Array.from(document.querySelectorAll('.platform-card'))
  .map(card => card.dataset.platform || card.querySelector('.platform-name')?.textContent?.trim().toLowerCase())
  .filter(p => p);
console.log('Platform order:', platforms.slice(0, 7));\`
      },
      {
        id: 2,
        name: 'Product Page Type',
        url: 'https://shop.example.com/products/awesome-product',
        pageType: 'product',
        expectedOrder: ['pinterest', 'facebook', 'instagram', 'twitter', 'linkedin'],
        description: 'E-commerce product should prioritize Pinterest, Facebook, Instagram, Twitter',
        consoleCommand: \`const platforms = Array.from(document.querySelectorAll('.platform-card'))
  .map(card => card.dataset.platform || card.querySelector('.platform-name')?.textContent?.trim().toLowerCase())
  .filter(p => p);
console.log('Platform order:', platforms.slice(0, 5));\`
      },
      {
        id: 3,
        name: 'General Website',
        url: 'https://example.com',
        pageType: 'website',
        expectedOrder: ['google', 'facebook', 'twitter', 'linkedin', 'slack', 'discord'],
        description: 'Standard website should prioritize Google, Facebook, Twitter, LinkedIn',
        consoleCommand: \`const platforms = Array.from(document.querySelectorAll('.platform-card'))
  .map(card => card.dataset.platform || card.querySelector('.platform-name')?.textContent?.trim().toLowerCase())
  .filter(p => p);
console.log('Platform order:', platforms.slice(0, 6));\`
      }
    ];

    const results = {};

    function createTestCard(config) {
      const card = document.createElement('div');
      card.className = 'test-card';
      card.innerHTML = \`
        <h3>\${config.id}. \${config.name}</h3>
        <p><strong>Description:</strong> \${config.description}</p>
        <p><strong>Page Type:</strong> <code>\${config.pageType}</code></p>

        <div class="url-section">
          <strong>🔗 Test URL:</strong><br>
          <code>\${config.url}</code>
          <button class="button" onclick="copyToClipboard('\${config.url}')" style="margin-left: 10px; padding: 6px 12px; font-size: 12px;">Copy URL</button>
        </div>

        <div class="platforms-section">
          <strong>✅ Expected Platform Order:</strong>
          <div class="platform-badges">
            \${config.expectedOrder.map(p => \`<span class="platform-badge">\${p}</span>\`).join('')}
          </div>
        </div>

        <div class="instructions" style="background: #f8f9fa; border-color: #6c757d;">
          <strong>🖥️ Console Command (run in VISTA tab):</strong>
          <div class="console-command">\${config.consoleCommand}</div>
          <button class="button" onclick="copyCommand(\${config.id})">Copy Command</button>
        </div>

        <div class="result-section">
          <strong>🔍 Enter Your Result:</strong>
          <input type="text" id="input-\${config.id}"
            placeholder="Paste output from console, e.g.: ['twitter', 'facebook', 'linkedin', 'reddit', 'bluesky', 'threads', 'mastodon']"
            style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-family: monospace; margin: 10px 0;">
          <button class="button" onclick="verifyResult(\${config.id})">Verify Result</button>
        </div>

        <div id="result-\${config.id}" style="display: none;"></div>
      \`;
      return card;
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        alert('URL copied to clipboard!');
      });
    }

    function copyCommand(id) {
      const config = TEST_CONFIGS.find(c => c.id === id);
      navigator.clipboard.writeText(config.consoleCommand).then(() => {
        alert('Console command copied to clipboard!');
      });
    }

    function verifyResult(id) {
      const config = TEST_CONFIGS.find(c => c.id === id);
      const input = document.getElementById(\`input-\${config.id}\`).value;
      const resultDiv = document.getElementById(\`result-\${config.id}\`);

      try {
        let actualOrder;
        if (input.includes('[')) {
          // Array format
          const match = input.match(/\\[.*\\]/);
          if (match) {
            actualOrder = JSON.parse(match[0]);
          } else {
            throw new Error('Could not parse array from input');
          }
        } else if (input.includes('(')) {
          // Console.log format: Platform order: (7) ['twitter', 'facebook', ...]
          const match = input.match(/\\((\\d+)\\)\\s*(\\[.*\\])/);
          if (match) {
            actualOrder = JSON.parse(match[2]);
          } else {
            // Try alternate format
            const arrayMatch = input.match(/\\[.*\\]/);
            if (arrayMatch) {
              actualOrder = JSON.parse(arrayMatch[0]);
            } else {
              throw new Error('Could not parse console output');
            }
          }
        } else {
          // Comma-separated
          actualOrder = input.split(',').map(s => s.trim().replace(/['"]/g, ''));
        }

        // Normalize platform names
        actualOrder = actualOrder.map(p => p.toLowerCase().trim());

        // Compare with expected
        const comparison = compareArrays(config.expectedOrder, actualOrder);

        resultDiv.style.display = 'block';
        resultDiv.innerHTML = \`
          <h4>Verification Result</h4>
          <p class="status-\${comparison.passed ? 'pass' : comparison.partial ? 'partial' : 'fail'}">
            \${comparison.passed ? '✅ PASS' : comparison.partial ? '⚠️ PARTIAL' : '❌ FAIL'} -
            \${comparison.matches}/\${comparison.total} platforms match expected order
          </p>

          <div class="comparison-grid">
            <div class="comparison-column">
              <h4>✅ Expected Order:</h4>
              <ul class="platform-list">
                \${comparison.expected.map((p, i) => \`
                  <li class="\${p === comparison.actual[i] ? 'match' : 'miss'}">
                    \${i + 1}. \${p} \${p === comparison.actual[i] ? '✓' : '✗'}
                  </li>
                \`).join('')}
              </ul>
            </div>
            <div class="comparison-column">
              <h4>🔍 Actual Order:</h4>
              <ul class="platform-list">
                \${comparison.actual.map((p, i) => \`
                  <li>\${i + 1}. \${p || '(undefined)'}</li>
                \`).join('')}
              </ul>
            </div>
          </div>

          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Expected platforms in correct position: \${comparison.matches}/\${comparison.total}</li>
            <li>Test URL: <code>\${config.url}</code></li>
            <li>Expected page type: <code>\${config.pageType}</code></li>
          </ul>
        \`;

        // Save result
        results[id] = {
          config: config.name,
          expectedOrder: config.expectedOrder,
          actualOrder: actualOrder,
          matches: comparison.matches,
          total: comparison.total,
          passed: comparison.passed,
          timestamp: new Date().toISOString()
        };

        updateSummary();

      } catch (error) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = \`<p class="status-fail">❌ Error parsing input: \${error.message}</p>\`;
      }
    }

    function compareArrays(expected, actual) {
      const limit = Math.min(expected.length, actual.length);
      const matches = [];

      for (let i = 0; i < limit; i++) {
        matches.push(expected[i] === actual[i]);
      }

      const matchCount = matches.filter(m => m).length;
      const passed = matchCount === expected.length;

      return {
        expected,
        actual: actual.slice(0, expected.length),
        matches: matchCount,
        total: expected.length,
        passed,
        partial: matchCount > 0 && !passed
      };
    }

    function updateSummary() {
      const summaryDiv = document.getElementById('summary');
      const contentDiv = document.getElementById('summary-content');

      const completed = Object.keys(results).length;
      const passed = Object.values(results).filter(r => r.passed).length;
      const partial = Object.values(results).filter(r => r.partial).length;
      const failed = Object.values(results).filter(r => !r.passed && !r.partial).length;

      summaryDiv.style.display = 'block';
      contentDiv.innerHTML = \`
        <p><strong>Completed:</strong> \${completed}/\${TEST_CONFIGS.length} test cases</p>
        <p class="status-pass">✅ Passed: \${passed}</p>
        <p class="status-partial">⚠️ Partial: \${partial}</p>
        <p class="status-fail">❌ Failed: \${failed}</p>
        <button class="button" onclick="exportResults()">Export Results</button>
      \`;
    }

    function exportResults() {
      const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bf-21h5-results-' + new Date().toISOString().split('T')[0] + '.json';
      a.click();
    }

    // Initialize test cards
    const container = document.getElementById('test-container');
    TEST_CONFIGS.forEach(config => {
      container.appendChild(createTestCard(config));
    });
  </script>
</body>
</html>`;

// Create test results directory
const resultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/test') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(TEST_PAGE);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 8081;

server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🔍 BF-21h5 Manual DOM Reordering Verification');
  console.log('='.repeat(60));
  console.log(`\n✅ Test server started on http://localhost:${PORT}/test`);
  console.log('\n📋 Instructions:');
  console.log('1. Open the test page in your browser: http://localhost:8080/test');
  console.log('2. Open VISTA application: http://localhost:3000');
  console.log('3. Follow the step-by-step instructions on the test page');
  console.log('4. For each test case:');
  console.log('   - Copy the test URL to VISTA');
  console.log('   - Run the provided console command in VISTA\'s DevTools');
  console.log('   - Paste the result back to the test page');
  console.log('5. Click "Verify Result" to check if the order matches');
  console.log('\n⏸️  Press Ctrl+C to stop the server\n');
  console.log('='.repeat(60));
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Test server stopped');
  process.exit(0);
});
