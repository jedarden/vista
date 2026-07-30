#!/usr/bin/env node

/**
 * Manual Verification Helper for Twitter/X Frame Testing
 *
 * This script starts a simple HTTP server to serve the Twitter/X frame test file
 * and provides instructions for manual screenshot verification.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const TEST_FILE = 'test-twitter-frame.html';

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/test') {
    const filePath = path.join(__dirname, TEST_FILE);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>Test file not found</h1><p>Make sure test-twitter-frame.html exists in the current directory.</p>');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>Error loading test file</h1>');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Not Found</h1><p><a href="/test">Go to Twitter/X Frame Test</a></p>');
  }
});

server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          Twitter/X Frame Manual Verification Server         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running at: http://localhost:${PORT}/test`);
  console.log('');
  console.log('📋 Manual Verification Steps:');
  console.log(`   1. Open http://localhost:${PORT}/test in your browser`);
  console.log('   2. Test Dark Mode (default):');
  console.log('      - Frame should have black background (#000000)');
  console.log('      - Check verified badge is blue (#1d9bf0)');
  console.log('      - Verify link card has correct border radius (16px)');
  console.log('      - Check avatar is circular (border-radius: 50%)');
  console.log('      - Verify text hierarchy (primary white, secondary gray)');
  console.log('   3. Click "☀️ Light Mode" button to switch themes');
  console.log('   4. Test Light Mode:');
  console.log('      - Frame should have white background (#ffffff)');
  console.log('      - Check verified badge is still blue (#1d9bf0)');
  console.log('      - Verify link card contrast is maintained');
  console.log('      - Check text colors swapped correctly');
  console.log('   5. Take screenshots of both themes for documentation');
  console.log('   6. Verify the frame looks like realistic X chrome:');
  console.log('      - Layout matches Twitter/X tweet structure');
  console.log('      - Avatar → Meta → Content → Link Card → Actions flow');
  console.log('      - Card appears embedded, not floating');
  console.log('      - Borders and spacing are consistent with X UI');
  console.log('');
  console.log('✅ Acceptance Criteria:');
  console.log('   [ ] Screenshots captured for both light and dark themes');
  console.log('   [ ] Frame renders with realistic chrome matching X\'s UI');
  console.log('   [ ] Reply, retweet, like, and view counts display correctly');
  console.log('   [ ] No visual bugs or layout issues');
  console.log('   [ ] Manual verification documented in bead notes');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('════════════════════════════════════════════════════════════');
});