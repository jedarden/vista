/**
 * Test to understand the renderPreviews execution flow
 */

const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, 'src/public/app.js'), 'utf8');

console.log('=== Analyzing renderPreviews Call Flow ===\n');

// Find all calls to renderPreviews
const calls = [];
const regex = /renderPreviews\(([^)]+)\)/g;
let match;

while ((match = regex.exec(appJs)) !== null) {
  const position = match.index;
  const lines = appJs.substring(0, position).split('\n');
  const lineNumber = lines.length;

  // Get context (previous lines)
  const contextStart = Math.max(0, lines.length - 5);
  const context = lines.slice(contextStart, lines.length).join('\n');

  calls.push({
    lineNumber,
    argument: match[1],
    context: context.trim()
  });
}

console.log(`Found ${calls.length} calls to renderPreviews():\n`);

calls.forEach((call, i) => {
  console.log(`${i + 1}. Line ${call.lineNumber}: renderPreviews(${call.argument})`);
  console.log(`   Context: ${call.context.substring(0, 100)}...`);
  console.log('');
});

// Analyze the hook flow
console.log('=== Analyzing Hook Flow ===\n');

const hookMatch = appJs.match(/\/\/ ── Hook into handleResult for smart ordering ──[\s\S]*?handleResult = function\(data\)[\s\S]*?\};/);
if (hookMatch) {
  console.log('Found handleResult hook:\n');
  console.log(hookMatch[0]);
} else {
  console.log('❌ Could not find handleResult hook');
}

// Find original handleResult
console.log('\n=== Original handleResult Function ===\n');

const originalHandleResultMatch = appJs.match(/async function handleResult\(data\)[\s\S]*?^(?=\n|$)/m);
if (originalHandleResultMatch) {
  // Find renderPreviews call in original
  const originalFunction = originalHandleResultMatch[0];
  const renderCallInOriginal = originalFunction.match(/renderPreviews\(data\)/);
  console.log('Original handleResult contains renderPreviews(data):', !!renderCallInOriginal);

  // Find position of renderPreviews in original handleResult
  if (renderCallInOriginal) {
    const linesBeforeRenderPreviews = originalFunction.substring(0, originalFunction.indexOf(renderCallInOriginal.index)).split('\n');
    console.log(`renderPreviews(data) is called at line ${linesBeforeRenderPreviews.length} within handleResult`);
  }
}

console.log('\n=== Execution Flow Analysis ===\n');

console.log('When a URL is inspected:');
console.log('1. handleResult(data) is called');
console.log('2. The hook intercepts and calls originalHandleResult2(data)');
console.log('3. originalHandleResult2() includes renderPreviews(data) call');
console.log('4. This renders cards with DEFAULT order (no smart ordering yet)');
console.log('5. The hook then schedules applySmartOrdering() with 200ms delay');
console.log('6. After 200ms, applySmartOrdering() executes:');
console.log('   a. Detects page type');
console.log('   b. Gets preferred platform order for that page type');
console.log('   c. Reorders PLATFORM_GROUPS and updates platformPrefs.cardOrder');
console.log('   d. Calls renderPreviews(currentData)');
console.log('7. This SECOND renderPreviews() should use SMART order');

console.log('\n=== Potential Issue ===\n');
console.log('The problem: renderPreviews() is called TWICE:');
console.log('- First: renderPreviews(data) with DEFAULT order');
console.log('- Second: renderPreviews(currentData) with SMART order');
console.log('');
console.log('If the second call is not working, it could be because:');
console.log('1. platformPrefs.cardOrder is not set correctly');
console.log('2. renderPreviews() is not reading platformPrefs.cardOrder');
console.log('3. The DOM is not being rebuilt correctly');
console.log('4. There is a race condition with another code path');
