#!/usr/bin/env node

/**
 * Simple HTTP server for light theme platform screenshot capture
 *
 * This serves the light theme HTML files so they can be accessed in a browser
 * for manual screenshot capture.
 *
 * Usage: node screenshots/light-theme/serve-light-theme-pages.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8082;
const DIR = __dirname;

const PLATFORMS = [
  { id: 'twitter', name: 'X (Twitter)' },
  { id: 'discord', name: 'Discord' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'telegram', name: 'Telegram' },
  { id: 'signal', name: 'Signal' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'mastodon', name: 'Mastodon' }
];

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Create an index.html for easy navigation
const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Light Theme Platform Screenshots - Bead bf-49z20</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      color: #333;
      padding: 20px;
      min-height: 100vh;
    }
    .header {
      text-align: center;
      background: rgba(255,255,255,0.9);
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    .header h1 { color: #5865f2; margin-bottom: 10px; }
    .header p { color: #666; line-height: 1.6; }
    .platforms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .platform-card {
      background: rgba(255,255,255,0.95);
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, border-color 0.2s;
    }
    .platform-card:hover {
      transform: translateY(-2px);
      border-color: rgba(88, 101, 242, 0.5);
    }
    .platform-card h3 {
      color: #5865f2;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status-badge {
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 12px;
      background: rgba(0,0,0,0.05);
      color: #666;
    }
    .screenshot-link {
      display: block;
      text-align: center;
      padding: 12px;
      background: rgba(88, 101, 242, 0.2);
      color: #333;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 10px;
      transition: all 0.2s;
      border: 1px solid rgba(88, 101, 242, 0.3);
    }
    .screenshot-link:hover {
      background: rgba(88, 101, 242, 0.3);
      color: #000;
      transform: translateY(-1px);
    }
    .screenshot-status {
      font-size: 12px;
      margin-top: 8px;
      text-align: center;
      opacity: 0.7;
    }
    .screenshot-status.captured {
      color: #16a34a;
    }
    .screenshot-status.pending {
      color: #d97706;
    }
    .instructions {
      background: rgba(255,255,255,0.9);
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .instructions h2 { color: #5865f2; margin-bottom: 15px; }
    .instructions ol { margin-left: 20px; line-height: 1.8; }
    .instructions li { margin: 8px 0; }
    .acceptance-criteria {
      background: rgba(22, 163, 74, 0.1);
      border-left: 4px solid #16a34a;
      padding: 15px;
      margin-top: 20px;
      border-radius: 4px;
    }
    .acceptance-criteria h3 { color: #16a34a; margin-bottom: 10px; }
    .acceptance-criteria ul { margin-left: 20px; }
    .acceptance-criteria li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>☀️ Light Theme Platform Screenshots</h1>
    <p><strong>Bead bf-49z20:</strong> Verify platform screenshot quality - RECAPTURING LIGHT THEME</p>
    <p>Serve this directory and capture screenshots of each platform frame</p>
  </div>

  <div class="platforms-grid">
    ${PLATFORMS.map(platform => {
      const screenshotExists = fs.existsSync(path.join(DIR, `${platform.id}-light.png`));
      const statusClass = screenshotExists ? 'captured' : 'pending';
      const statusText = screenshotExists ? '✅ Captured' : '⏳ Pending';

      return `
      <div class="platform-card">
        <h3>
          ${platform.name}
          <span class="status-badge">${platform.id}</span>
        </h3>
        <a href="${platform.id}-light.html" class="screenshot-link">
          📸 Open Platform Frame
        </a>
        <div class="screenshot-status ${statusClass}">
          ${statusText}
        </div>
      </div>
    `}).join('')}
  </div>

  <div class="instructions">
    <h2>📋 Light Theme Screenshot Recapture Instructions</h2>
    <ol>
      <li>Start the server: <code>node serve-light-theme-pages.js</code></li>
      <li>Open http://localhost:8082/ in your browser</li>
      <li>Click on each platform's "Open Platform Frame" link above</li>
      <li>When the platform frame loads, take a screenshot of the frame container</li>
      <li>Save each screenshot as <code>platform-name-light.png</code> in this directory:
        <ul>
          <li><code>twitter-light.png</code></li>
          <li><code>discord-light.png</code></li>
          <li><code>instagram-light.png</code></li>
          <li><code>telegram-light.png</code></li>
          <li><code>signal-light.png</code></li>
          <li><code>whatsapp-light.png</code></li>
          <li><code>mastodon-light.png</code></li>
        </ul>
      </li>
      <li>Refresh this page to see the "✅ Captured" status appear</li>
      <li>Run verification to confirm file sizes are correct (~100KB)</li>
    </ol>

    <div class="acceptance-criteria">
      <h3>✅ Acceptance Criteria</h3>
      <ul>
        <li>Screenshot captured for all 7 platforms in light theme</li>
        <li>All screenshots saved with correct naming convention (platform-name-light.png)</li>
        <li>Screenshot files are valid PNG images (> 80KB, not 2.8KB)</li>
        <li>Each screenshot clearly shows the platform frame UI</li>
        <li>No rendering errors or blank screenshots</li>
        <li>Platform chrome looks realistic and recognizable</li>
      </ul>
    </div>
  </div>

  <div style="text-align: center; margin-top: 20px; opacity: 0.5; font-size: 12px;">
    Generated by Vista Light Theme Screenshot Infrastructure (Bead bf-49z20)
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(DIR, 'index.html'), indexHTML);
console.log('✅ Generated index.html');

server.listen(PORT, () => {
  console.log('☀️ Light Theme Platform Screenshot Server');
  console.log('='.repeat(60));
  console.log(`Server running at: http://localhost:${PORT}/`);
  console.log('');
  console.log('📋 Instructions:');
  console.log('1. Open http://localhost:8082/ in your browser');
  console.log('2. Click each platform link to view the rendered frame');
  console.log('3. Take a screenshot of the platform frame');
  console.log('4. Save as platform-name-light.png in this directory');
  console.log('5. Refresh the index page to see captured status');
  console.log('');
  console.log('🎯 Expected output files:');
  PLATFORMS.forEach(p => console.log(`   ${p.id}-light.png`));
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});
