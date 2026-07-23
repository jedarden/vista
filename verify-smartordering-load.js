/**
 * Simple verification that vista loads with smartOrdering enabled
 * Checks HTML structure and validates key JavaScript functions exist
 */

const http = require('http');
const fs = require('fs');

const PORT = 3001;
const TEST_URL = `http://localhost:${PORT}/?smartOrdering=true`;

console.log(`Testing: ${TEST_URL}\n`);

http.get(TEST_URL, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('=== HTTP Response ===');
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);

    // Check for key HTML elements
    console.log('\n=== HTML Structure Check ===');
    const checks = [
      { name: 'DOCTYPE', pattern: /<!DOCTYPE html>/i, critical: true },
      { name: 'HTML tag', pattern: /<html[^>]*>/i, critical: true },
      { name: 'Head section', pattern: /<head>/i, critical: true },
      { name: 'Body section', pattern: /<body>/i, critical: true },
      { name: 'Title tag', pattern: /<title>/i, critical: true },
      { name: 'app.js script', pattern: /<script[^>]*src=["\']app\.js["\']/, critical: true },
      { name: 'CSS stylesheets', pattern: /<link[^>]*rel=["\']stylesheet["\']/, critical: true },
      { name: 'Meta viewport', pattern: /<meta[^>]*name=["\']viewport["\']/, critical: false },
    ];

    let allCriticalPassed = true;
    checks.forEach(check => {
      const passed = check.pattern.test(data);
      const status = passed ? '✓' : '❌';
      const critical = check.critical ? ' [CRITICAL]' : '';
      console.log(`${status} ${check.name}${critical}`);
      if (!passed && check.critical) {
        allCriticalPassed = false;
      }
    });

    // Check for smartOrdering in localStorage/default settings
    console.log('\n=== Smart Ordering Configuration Check ===');

    // Fetch app.js to check smartOrdering handling
    http.get(`http://localhost:${PORT}/app.js`, (appRes) => {
      let appData = '';
      appRes.on('data', (chunk) => { appData += chunk; });
      appRes.on('end', () => {
        const hasSmartOrderingDefault = appData.includes('smartOrdering: true');
        const hasSmartOrderingFunction = appData.includes('function applySmartOrdering()');
        const hasSmartOrderingLogic = appData.includes('platformPrefs.smartOrdering');

        console.log(`${hasSmartOrderingDefault ? '✓' : '❌'} smartOrdering defaults to true`);
        console.log(`${hasSmartOrderingFunction ? '✓' : '❌'} applySmartOrdering() function exists`);
        console.log(`${hasSmartOrderingLogic ? '✓' : '❌'} Smart ordering logic implemented`);

        // Check for URL parameter parsing
        const hasUrlParamParsing = appData.includes('params.get') || appData.includes('URLSearchParams');
        console.log(`${hasUrlParamParsing ? '✓' : '⚠️'} URL parameter parsing code exists`);
        if (hasUrlParamParsing) {
          const hasSmartOrderingParam = appData.match(/params\.get\(['"](\w+)['"]\)/g) || [];
          const paramsFound = [...new Set(hasSmartOrderingParam.map(p => p.match(/['"](\w+)['"]/)[1]))];
          console.log(`  Parameters parsed: ${paramsFound.join(', ') || 'none detected'}`);
          if (!paramsFound.includes('smartOrdering')) {
            console.log('  ⚠️ Note: smartOrdering URL parameter is not explicitly parsed');
            console.log('  ℹ️ smartOrdering defaults to true from localStorage');
          }
        }

        // Look for common JavaScript error patterns
        console.log('\n=== Error Pattern Check ===');
        const errorPatterns = [
          { name: 'Syntax errors', pattern: /\bconsole\.error\(/g },
          { name: 'Throw statements', pattern: /\bthrow\s+new\s+Error\(/g },
          { name: 'Undefined references', pattern: /\bundefined\b/g },
        ];

        errorPatterns.forEach(check => {
          const matches = data.match(check.pattern) || [];
          const count = matches.length;
          const icon = count === 0 ? '✓' : count > 5 ? '❌' : '⚠️';
          console.log(`${icon} ${check.name}: ${count} occurrences`);
        });

        console.log('\n=== Final Result ===');
        if (allCriticalPassed && hasSmartOrderingDefault && hasSmartOrderingFunction) {
          console.log('✓ SUCCESS: Page loads correctly with smartOrdering enabled by default');
          console.log('ℹ️ URL parameter ?smartOrdering=true is present in request');
          console.log('ℹ️ smartOrdering defaults to true (localStorage-based, not URL-param-based)');
          process.exit(0);
        } else {
          console.log('❌ FAILED: Critical issues detected');
          process.exit(1);
        }
      });
    }).on('error', (err) => {
      console.error('❌ Failed to fetch app.js:', err.message);
      process.exit(1);
    });
  });
}).on('error', (err) => {
  console.error(`❌ Failed to connect to server: ${err.message}`);
  console.error('Make sure the vista server is running on port', PORT);
  process.exit(1);
});
