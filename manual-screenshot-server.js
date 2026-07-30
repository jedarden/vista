#!/usr/bin/env node

/**
 * Manual Screenshot Server for Light Theme Platforms (Bead bf-4ubla)
 *
 * This script starts a local HTTP server that serves the platform HTML files
 * for manual screenshot capture. Open the provided URL in your browser and
 * take screenshots of each platform.
 *
 * Usage: node manual-screenshot-server.js
 * Then open http://localhost:8080 in your browser
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = 8080;
const OUTPUT_DIR = path.join(__dirname, 'screenshots', 'light-theme');

// 7 platforms as specified in bead bf-4ubla
const PLATFORMS = [
  { id: 'twitter', name: 'X (Twitter)', category: 'Social' },
  { id: 'discord', name: 'Discord', category: 'Messaging' },
  { id: 'instagram', name: 'Instagram', category: 'Social' },
  { id: 'telegram', name: 'Telegram', category: 'Messaging' },
  { id: 'signal', name: 'Signal', category: 'Messaging' },
  { id: 'whatsapp', name: 'WhatsApp', category: 'Messaging' },
  { id: 'mastodon', name: 'Mastodon', category: 'Social' }
];

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.md': 'text/markdown'
};

// Create HTTP server
const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './screenshots/light-theme/index.html';
  }

  // Resolve absolute path
  const absolutePath = path.resolve(filePath);

  // Security check - prevent directory traversal
  if (!absolutePath.startsWith(path.resolve('.'))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(absolutePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('🎯 Manual Screenshot Server (Bead bf-4ubla)');
  console.log('='.repeat(60));
  console.log('');
  console.log('✅ Server running at: http://localhost:' + PORT);
  console.log('');
  console.log('📋 Manual Screenshot Instructions:');
  console.log('');
  console.log('1. Open http://localhost:' + PORT + ' in your browser');
  console.log('2. Click on each platform link to view the rendered frame');
  console.log('3. For each platform, capture a screenshot:');
  console.log('   - Use your browser\'s screenshot function or system screenshot tool');
  console.log('   - Capture just the platform frame (not the entire browser window)');
  console.log('   - Save as: platform-name-light.png');
  console.log('');
  console.log('4. Platforms to capture:');
  PLATFORMS.forEach(platform => {
    console.log(`   - ${platform.id}-light.png (${platform.name} - ${platform.category})`);
  });
  console.log('');
  console.log('5. Save screenshots to:');
  console.log(`   ${OUTPUT_DIR}`);
  console.log('');
  console.log('6. Quick Verification:');
  console.log('   - All 7 screenshots saved as PNG files');
  console.log('   - Files named: platform-name-light.png');
  console.log('   - Each screenshot shows the platform frame UI clearly');
  console.log('   - No blank or corrupted images');
  console.log('');
  console.log('🎯 Acceptance Criteria:');
  console.log('   ✅ Screenshot captured for all 7 platforms in light theme');
  console.log('   ✅ All screenshots saved with correct naming convention');
  console.log('   ✅ Screenshot files are valid PNG images');
  console.log('   ✅ Each screenshot clearly shows the platform frame UI');
  console.log('   ✅ No rendering errors or blank screenshots');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('='.repeat(60));
});