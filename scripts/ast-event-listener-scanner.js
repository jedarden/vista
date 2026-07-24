#!/usr/bin/env node
/**
 * AST-based Event Listener Scanner
 * Part of Method 1: AST-Based Event Listener Analysis
 *
 * This script parses app.js and extracts all event listener registrations
 * with their handler functions and line numbers.
 *
 * Usage: node scripts/ast-event-listener-scanner.js
 */

const fs = require('fs');
const path = require('path');

// Simple AST-like parser for event listeners (placeholder for full Babel implementation)
// In production, use @babel/parser, @babel/traverse, @babel/types

function scanEventListeners(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const listeners = [];

  // Pattern 1: Direct addEventListener calls
  const addEventListenerPattern = /(\.addEventListener\(['"`](click|change|input)['"`]\s*,\s*([^)]+)\))/g;

  lines.forEach((line, index) => {
    const matches = [...line.matchAll(addEventListenerPattern)];
    matches.forEach(match => {
      listeners.push({
        line: index + 1,
        event: match[2],
        handler: match[3].trim(),
        pattern: 'addEventListener',
        code: match[1]
      });
    });
  });

  // Pattern 2: Optional chaining addEventListener
  const optionalPattern = /(\?\.addEventListener\(['"`](click|change|input)['"`]\s*,\s*([^)]+)\))/g;

  lines.forEach((line, index) => {
    const matches = [...line.matchAll(optionalPattern)];
    matches.forEach(match => {
      listeners.push({
        line: index + 1,
        event: match[2],
        handler: match[3].trim(),
        pattern: 'optional-chaining',
        code: match[1]
      });
    });
  });

  // Pattern 3: forEach with addEventListener
  const forEachPattern = /forEach\(([^)]+)\)\s*\{[^}]*addEventListener\(['"`](click|change|input)['"`]\s*,\s*([^)]+)\)/g;

  lines.forEach((line, index) => {
    const matches = [...line.matchAll(forEachPattern)];
    matches.forEach(match => {
      listeners.push({
        line: index + 1,
        event: match[2],
        handler: match[3].trim(),
        pattern: 'forEach',
        code: match[0]
      });
    });
  });

  return listeners;
}

function main() {
  const appJsPath = path.join(__dirname, '..', 'src', 'public', 'app.js');
  const listeners = scanEventListeners(appJsPath);

  console.log(JSON.stringify({
    method: 'AST-based Event Listener Scan',
    file: appJsPath,
    timestamp: new Date().toISOString(),
    totalListeners: listeners.length,
    listeners: listeners
  }, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = { scanEventListeners };
