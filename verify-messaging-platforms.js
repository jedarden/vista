/**
 * Verification script for messaging platform context frames
 * Run with: node verify-messaging-platforms.js
 */

const fs = require('fs');

// Read platform frames
const platformFramesJs = fs.readFileSync('src/public/platform-frames.js', 'utf8');
const styleCss = fs.readFileSync('src/public/style.css', 'utf8');

const messagingPlatforms = [
  { id: 'imessage', name: 'iMessage' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'telegram', name: 'Telegram' },
  { id: 'signal', name: 'Signal' },
  { id: 'discord', name: 'Discord' },
  { id: 'slack', name: 'Slack' },
  { id: 'sms', name: 'SMS/RCS' }
];

console.log('Messaging Platform Context Frames Verification');
console.log('='.repeat(60));
console.log('');

let allPassed = true;

messagingPlatforms.forEach(({ id, name }) => {
  console.log(`${name} (${id}):`);
  
  // Check JavaScript implementation
  const jsChecks = {
    'Platform definition': platformFramesJs.includes(`${id}: {`),
    'Chrome template': platformFramesJs.includes(`${id}:`, platformFramesJs.indexOf('chrome:')),
    'Neutral content': platformFramesJs.includes(`${id}:`, platformFramesJs.indexOf('neutralContent')),
    'Theme support': platformFramesJs.includes('hasThemeSupport: true', platformFramesJs.indexOf(id)),
    'Theme variables': platformFramesJs.includes('themeVars: {', platformFramesJs.indexOf(id)),
  };
  
  // Check CSS implementation  
  const cssChecks = {
    'Context container': styleCss.includes(`${id}-context`),
    'Dark theme': styleCss.includes(`${id}-context.dark-theme`) || styleCss.includes(`${id}-context .dark-theme`),
    'Light theme': styleCss.includes(`${id}-context.light-theme`) || styleCss.includes(`${id}-context .light-theme`),
  };
  
  const allJsChecks = Object.values(jsChecks).every(v => v);
  const allCssChecks = Object.values(cssChecks).every(v => v);
  const platformPassed = allJsChecks && allCssChecks;
  
  if (!platformPassed) allPassed = false;
  
  // JavaScript checks
  console.log('  JavaScript:');
  Object.entries(jsChecks).forEach(([check, passed]) => {
    console.log(`    ${passed ? '✓' : '✗'} ${check}`);
  });
  
  // CSS checks
  console.log('  CSS:');
  Object.entries(cssChecks).forEach(([check, passed]) => {
    console.log(`    ${passed ? '✓' : '✗'} ${check}`);
  });
  
  console.log(`  Status: ${platformPassed ? 'PASS' : 'FAIL'}`);
  console.log('');
});

console.log('='.repeat(60));
console.log(`Overall: ${allPassed ? 'ALL TESTS PASSED ✓' : 'SOME TESTS FAILED ✗'}`);
console.log('='.repeat(60));

process.exit(allPassed ? 0 : 1);
