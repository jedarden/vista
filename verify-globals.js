/**
 * Quick test to verify platformPrefs and applySmartOrdering are available
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Resolve Chromium libraries for NixOS
 */
function resolveChromiumLibs() {
  const legacy = '/home/coding/scratch/libs/extracted/usr/lib/x86_64-linux-gnu';
  if (fs.existsSync(path.join(legacy, 'libglib-2.0.so.0'))) {
    process.env.LD_LIBRARY_PATH =
      legacy + (process.env.LD_LIBRARY_PATH ? ':' : '') + process.env.LD_LIBRARY_PATH;
    return;
  }
  let binary;
  try { binary = chromium.executablePath(); } catch (_) { return; }
  if (!binary || !fs.existsSync(binary)) return;
  const { spawnSync } = require('child_process');
  const ldd = spawnSync('ldd', [binary], { encoding: 'utf8' });
  if (ldd.status !== 0 || !ldd.stdout) return;
  const dirs = new Set();
  for (const line of ldd.stdout.split('\n')) {
    if (!line.includes('not found')) continue;
    const name = line.split('=>')[0].trim();
    if (!name) continue;
    const found = spawnSync('find', ['/nix/store', '-maxdepth', '4', '-name', name],
      { encoding: 'utf8', timeout: 20000 });
    const first = (found.stdout || '').split('\n').find(p => p);
    if (first) dirs.add(path.dirname(first));
  }
  if (dirs.size > 0) {
    process.env.LD_LIBRARY_PATH =
      Array.from(dirs).join(':') +
      (process.env.LD_LIBRARY_PATH ? ':' : '') + process.env.LD_LIBRARY_PATH;
  }
}

resolveChromiumLibs();

async function testGlobals() {
  console.log('Testing if platformPrefs and applySmartOrdering are available...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Navigate to VISTA
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for scripts to load
    console.log('Waiting 5 seconds for scripts to execute...');
    await page.waitForTimeout(5000);

    // Check for globals
    const globals = await page.evaluate(() => {
      return {
        hasPlatformPrefs: typeof window.platformPrefs !== 'undefined',
        hasApplySmartOrdering: typeof window.applySmartOrdering !== 'function',
        platformPrefsValue: window.platformPrefs,
        applySmartOrderingType: typeof window.applySmartOrdering,
        // Check local variables
        localPlatformPrefs: typeof platformPrefs !== 'undefined',
        localApplySmartOrdering: typeof applySmartOrdering !== 'undefined',
      };
    });

    console.log('Globals check result:', JSON.stringify(globals, null, 2));

    if (globals.hasPlatformPrefs) {
      console.log('✅ window.platformPrefs is available');
    } else {
      console.log('❌ window.platformPrefs is NOT available');
    }

    if (globals.hasApplySmartOrdering) {
      console.log('✅ window.applySmartOrdering is available');
    } else {
      console.log('❌ window.applySmartOrdering is NOT available');
    }

    if (globals.localPlatformPrefs) {
      console.log('✅ platformPrefs (local) is available');
    } else {
      console.log('❌ platformPrefs (local) is NOT available');
    }

    if (globals.localApplySmartOrdering) {
      console.log('✅ applySmartOrdering (local) is available');
    } else {
      console.log('❌ applySmartOrdering (local) is NOT available');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testGlobals().catch(console.error);
