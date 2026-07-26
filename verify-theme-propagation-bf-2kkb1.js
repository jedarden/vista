'use strict';

/**
 * Theme-state propagation & stale-frame verification for bead bf-2kkb1.
 *
 * Sibling test verify-theme-switching-7-platforms-bf-2k0os.js proves that
 * toggling the global theme re-themes EXISTING frames in place. This file
 * proves the other half of the contract — the four acceptance criteria:
 *
 *   1. A context frame rendered AFTER a theme switch is born in the ACTIVE
 *      theme — no second toggle needed (render-after-toggle, driven through
 *      the real app path: theme sourced from cardContextState[pid].theme,
 *      which applyTheme keeps synced to the global theme).
 *   2. After a toggle, ZERO .context-frame[data-platform] elements carry the
 *      previous theme class.
 *   3. document.documentElement data-theme stays in sync with every frame.
 *   4. No FOUC: the in-place re-theme is SYNCHRONOUS (no async settle), and
 *      newly built frames are themed at construction time (the returned HTML
 *      already carries the right class + inline CSS vars before insertion).
 *
 * Run: node verify-theme-propagation-bf-2kkb1.js
 */

const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

// Find a Chrome/Chromium that actually runs in this environment. Puppeteer's
// bundled Chrome is missing system libs on NixOS, so prefer a wrapped build.
function findBrowser() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fs.existsSync('/nix/store')) {
    try {
      const dirs = fs.readdirSync('/nix/store')
        .filter((d) => /-chromium-[0-9]/.test(d) && !d.endsWith('.drv') && !d.includes('unwrapped'));
      for (const d of dirs) {
        const bin = `/nix/store/${d}/bin/chromium`;
        if (fs.existsSync(bin)) return bin;
      }
    } catch (_) { /* ignore */ }
  }
  return undefined; // fall back to Puppeteer's bundled Chrome
}

const PLATFORMS = [
  'facebook', 'twitter', 'linkedin', 'reddit', 'youtube', 'instagram', 'tiktok'
];

const INDEX = 'file://' + path.resolve(__dirname, 'src', 'public', 'index.html');

// Minimal realistic meta payload, shaped like the server's inspection output.
const META = {
  og: {
    title: 'How to Build Better APIs',
    description: 'REST and GraphQL best practices for modern teams.',
    image: 'https://example.com/og.png',
    site_name: 'Example',
  },
  twitter: { card: 'summary_large_image' },
  themeColor: '#3b82f6',
};

let failures = 0;
const check = (label, cond, extra) => {
  const tag = cond ? 'PASS' : 'FAIL';
  if (!cond) failures++;
  console.log(`  [${tag}] ${label}${extra ? ' — ' + extra : ''}`);
};

// Read the per-platform --frame-bg that the runtime defines, so we can assert
// computed styles land on the value declared for the active theme.
const themeVarsFor = (page) => page.evaluate((pids) => {
  const out = {};
  for (const pid of pids) {
    const pf = window.PLATFORM_FRAMES[pid];
    out[pid] = {
      dark: pf && pf.themeVars && pf.themeVars.dark && pf.themeVars.dark['--frame-bg'],
      light: pf && pf.themeVars && pf.themeVars.light && pf.themeVars.light['--frame-bg'],
    };
  }
  return out;
}, PLATFORMS);

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: findBrowser(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // Abort external CDN requests so the test runs fully offline & deterministic.
  const page = await browser.newPage();
  // Wide viewport: the #globalThemeToggle sits at the right edge (x≈1176) of a
  // fixed header, so it falls outside Puppeteer's default 800×600 viewport and
  // clicks silently no-op. 1280px keeps it on-screen and clickable.
  await page.setViewport({ width: 1280, height: 1000 });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.url().startsWith('file://')) return req.continue();
    return req.abort();
  });

  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push(msg.text());
  });

  await page.goto(INDEX, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => typeof window.applyTheme === 'function' &&
           typeof window.renderPlatformWithContext === 'function' &&
           typeof window.FrameTheme === 'object' &&
           typeof window.FrameTheme.updateAllPlatformFrames === 'function' &&
           typeof window.PLATFORM_FRAMES === 'object' &&
           typeof window.getPlatformsWithThemeSupport === 'function',
    { timeout: 15000 }
  );

  const themeVars = await themeVarsFor(page);

  // Pin a deterministic 'dark' baseline. Headless Chrome reports
  // prefers-color-scheme: light by default, so initTheme() starts the page in
  // 'light' — but the phases below assume a 'dark' starting point (toggle →
  // light → dark). Drive the real applyTheme() to set a known baseline BEFORE
  // any frames are rendered, so every assertion's expectation is well-defined
  // regardless of the ambient system color-scheme.
  await page.evaluate(() => window.applyTheme('dark'));
  await page.waitForFunction(
    () => document.documentElement.getAttribute('data-theme') === 'dark' &&
           typeof globalTheme !== 'undefined' && globalTheme === 'dark',
    { timeout: 5000 }
  );

  // Pre-populate cardContextState exactly as the app does when a card is first
  // rendered (theme: globalTheme), so applyTheme's sync loop touches all 7.
  await page.evaluate((pids) => {
    for (const pid of pids) {
      cardContextState[pid] = { context: false, theme: globalTheme };
    }
  }, PLATFORMS);

  // Render one initial DARK context frame per platform into a host. These
  // represent frames that existed BEFORE any toggle.
  await page.evaluate((pids, meta) => {
    const host = document.createElement('div');
    host.id = 'bf-2kkb1-host-init';
    document.body.appendChild(host);
    for (const pid of pids) {
      const html = window.renderPlatformWithContext(
        pid, meta, {}, 'https://example.com/page', cardContextState[pid].theme, '#3b82f6'
      );
      const wrap = document.createElement('div');
      wrap.innerHTML = html;
      host.appendChild(wrap.firstElementChild);
    }
  }, PLATFORMS, META);

  // Snapshot a frame's theme-relevant attributes + computed --frame-bg.
  const snapshot = async () => page.evaluate((pids) => {
    const out = {};
    for (const pid of pids) {
      const frame = document.querySelector(
        `.context-frame[data-platform="${pid}"]`
      );
      if (!frame) { out[pid] = null; continue; }
      out[pid] = {
        hasDarkClass: frame.classList.contains('dark-theme'),
        hasLightClass: frame.classList.contains('light-theme'),
        dataTheme: frame.getAttribute('data-theme'),
        frameBg: getComputedStyle(frame).getPropertyValue('--frame-bg').trim(),
      };
    }
    return out;
  }, PLATFORMS);

  // ── Phase 1: render AFTER a toggle to light ───────────────────────────────
  // The critical path. A frame rendered AFTER the switch must appear in the
  // active theme with NO second toggle. We drive the genuine toggle button and
  // then render new frames through the real app path (theme from
  // cardContextState[pid].theme, which applyTheme keeps synced).
  console.log('\nPhase 1: toggle → light, then render NEW frames (no double-toggle)');
  await page.click('#globalThemeToggle');
  await page.waitForFunction(
    () => document.documentElement.getAttribute('data-theme') === 'light',
    { timeout: 5000 }
  );

  // Prove the sync mechanism: every per-card theme now matches the root.
  const synced = await page.evaluate((pids) => {
    const root = document.documentElement.getAttribute('data-theme');
    return pids.map((pid) => ({ pid, theme: cardContextState[pid] && cardContextState[pid].theme, root }));
  }, PLATFORMS);
  for (const s of synced) {
    check(`sync: ${s.pid}.theme === root`, s.theme === s.root,
      `got "${s.theme}" expected "${s.root}"`);
  }

  // Render NEW frames (these did not exist during the toggle) using the app's
  // real theme source. Insert into a separate host so we assert on the new ones.
  await page.evaluate((pids, meta) => {
    const host = document.createElement('div');
    host.id = 'bf-2kkb1-host-after-light';
    document.body.appendChild(host);
    for (const pid of pids) {
      const html = window.renderPlatformWithContext(
        pid, meta, {}, 'https://example.com/page', cardContextState[pid].theme, '#3b82f6'
      );
      const wrap = document.createElement('div');
      wrap.innerHTML = html;
      host.appendChild(wrap.firstElementChild);
    }
  }, PLATFORMS, META);

  // Assert on the freshly-rendered-after-light frames.
  const afterLight = await page.evaluate((pids) => {
    const host = document.getElementById('bf-2kkb1-host-after-light');
    const out = {};
    for (const pid of pids) {
      const frame = host.querySelector(`.context-frame[data-platform="${pid}"]`);
      if (!frame) { out[pid] = null; continue; }
      out[pid] = {
        hasLightClass: frame.classList.contains('light-theme'),
        hasDarkClass: frame.classList.contains('dark-theme'),
        dataTheme: frame.getAttribute('data-theme'),
        frameBg: getComputedStyle(frame).getPropertyValue('--frame-bg').trim(),
      };
    }
    return out;
  }, PLATFORMS);
  for (const pid of PLATFORMS) {
    const s = afterLight[pid];
    const exp = themeVars[pid];
    check(`${pid}: rendered-after-toggle is light-theme`, s && s.hasLightClass && !s.hasDarkClass);
    check(`${pid}: new frame data-theme=light`, s && s.dataTheme === 'light',
      s && `got "${s.dataTheme}"`);
    check(`${pid}: new frame --frame-bg matches light themeVar`, s && exp && s.frameBg === exp.light,
      s && exp ? `got "${s.frameBg}" expected "${exp.light}"` : '');
  }

  // ── Phase 2: render AFTER a toggle back to dark ───────────────────────────
  console.log('\nPhase 2: toggle → dark, then render NEW frames (no double-toggle)');
  await page.click('#globalThemeToggle');
  await page.waitForFunction(
    () => document.documentElement.getAttribute('data-theme') === 'dark',
    { timeout: 5000 }
  );
  await page.evaluate((pids, meta) => {
    const host = document.createElement('div');
    host.id = 'bf-2kkb1-host-after-dark';
    document.body.appendChild(host);
    for (const pid of pids) {
      const html = window.renderPlatformWithContext(
        pid, meta, {}, 'https://example.com/page', cardContextState[pid].theme, '#3b82f6'
      );
      const wrap = document.createElement('div');
      wrap.innerHTML = html;
      host.appendChild(wrap.firstElementChild);
    }
  }, PLATFORMS, META);
  const afterDark = await page.evaluate((pids) => {
    const host = document.getElementById('bf-2kkb1-host-after-dark');
    const out = {};
    for (const pid of pids) {
      const frame = host.querySelector(`.context-frame[data-platform="${pid}"]`);
      if (!frame) { out[pid] = null; continue; }
      out[pid] = {
        hasDarkClass: frame.classList.contains('dark-theme'),
        hasLightClass: frame.classList.contains('light-theme'),
        dataTheme: frame.getAttribute('data-theme'),
        frameBg: getComputedStyle(frame).getPropertyValue('--frame-bg').trim(),
      };
    }
    return out;
  }, PLATFORMS);
  for (const pid of PLATFORMS) {
    const s = afterDark[pid];
    const exp = themeVars[pid];
    check(`${pid}: rendered-after-toggle is dark-theme`, s && s.hasDarkClass && !s.hasLightClass);
    check(`${pid}: new frame data-theme=dark`, s && s.dataTheme === 'dark',
      s && `got "${s.dataTheme}"`);
    check(`${pid}: new frame --frame-bg matches dark themeVar`, s && exp && s.frameBg === exp.dark,
      s && exp ? `got "${s.frameBg}" expected "${exp.dark}"` : '');
  }

  // ── Phase 3: zero stale-theme frames anywhere in the DOM (criterion 2) ────
  // After the last toggle the active theme is 'dark'. Every .context-frame
  // [data-platform] in the document must carry the dark class and none may
  // carry the previous (light) class.
  console.log('\nPhase 3: no stale-theme frames after toggle');
  const stale = await page.evaluate(() => {
    const root = document.documentElement.getAttribute('data-theme');
    const prevClass = root === 'dark' ? 'light-theme' : 'dark-theme';
    const curClass = root === 'dark' ? 'dark-theme' : 'light-theme';
    const frames = [...document.querySelectorAll('.context-frame[data-platform]')];
    let missingCurrent = 0, carryingPrev = 0;
    frames.forEach((f) => {
      if (!f.classList.contains(curClass)) missingCurrent++;
      if (f.classList.contains(prevClass)) carryingPrev++;
    });
    return { total: frames.length, root, prevClass, curClass, missingCurrent, carryingPrev };
  });
  check(`all ${stale.total} frames carry current theme class "${stale.curClass}"`,
    stale.missingCurrent === 0, stale.missingCurrent ? `${stale.missingCurrent} frame(s) missing it` : '');
  check(`zero frames carry previous theme class "${stale.prevClass}"`,
    stale.carryingPrev === 0, stale.carryingPrev ? `${stale.carryingPrev} frame(s) stale` : '');

  // ── Phase 4: root data-theme in sync with every frame (criterion 3) ───────
  console.log('\nPhase 4: root data-theme in sync with every frame');
  const drift = await page.evaluate(() => {
    const root = document.documentElement.getAttribute('data-theme');
    const frames = [...document.querySelectorAll('.context-frame[data-platform]')];
    let wrong = 0;
    const offenders = [];
    frames.forEach((f) => {
      if (f.getAttribute('data-theme') !== root) {
        wrong++;
        offenders.push(`${f.getAttribute('data-platform')}=${f.getAttribute('data-theme')}`);
      }
    });
    return { total: frames.length, root, wrong, offenders };
  });
  check(`all ${drift.total} frames match root data-theme "${drift.root}"`,
    drift.wrong === 0, drift.wrong ? `drifted: ${drift.offenders.join(', ')}` : '');

  // ── Phase 5: no FOUC ──────────────────────────────────────────────────────
  // (a) In-place re-theme is synchronous: drive applyTheme and read frame
  //     state in the SAME evaluate, before any await/settle. If every frame is
  //     already re-themed at that point, no paintable gap existed in which a
  //     frame could show the old theme.
  console.log('\nPhase 5a: in-place re-theme is synchronous (no async settle)');
  const sync = await page.evaluate(() => {
    const before = document.documentElement.getAttribute('data-theme');
    const target = before === 'dark' ? 'light' : 'dark';
    const curClass = `${target}-theme`; // e.g. light-theme
    // Drive the real toggle path (this is what the button calls).
    window.applyTheme(target);
    // Read IMMEDIATELY — no await, no requestAnimationFrame.
    const frames = [...document.querySelectorAll('.context-frame[data-platform]')];
    let notYet = 0;
    frames.forEach((f) => { if (!f.classList.contains(curClass)) notYet++; });
    // Restore prior state so the rest of the run is unaffected.
    window.applyTheme(before);
    return { target, total: frames.length, notYet };
  });
  check(`applyTheme('${sync.target}') re-themed all ${sync.total} frames synchronously`,
    sync.notYet === 0, sync.notYet ? `${sync.notYet} frame(s) not yet re-themed before settle` : '');

  // (b) Build-time theming: a freshly built frame is born already-themed. The
  //     returned HTML string carries the correct class + inline --frame-bg
  //     BEFORE it is ever inserted into the DOM — so the first paint cannot
  //     show the wrong theme.
  console.log('\nPhase 5b: new frames are themed at construction time (no FOUC on insert)');
  const built = await page.evaluate((pids, meta) => {
    const root = document.documentElement.getAttribute('data-theme');
    const out = {};
    for (const pid of pids) {
      const html = window.renderPlatformWithContext(
        pid, meta, {}, 'https://example.com/page', root, '#3b82f6'
      );
      const expBg = window.PLATFORM_FRAMES[pid] &&
        window.PLATFORM_FRAMES[pid].themeVars &&
        window.PLATFORM_FRAMES[pid].themeVars[root] &&
        window.PLATFORM_FRAMES[pid].themeVars[root]['--frame-bg'];
      out[pid] = {
        hasThemeClass: html.includes(`${root}-theme`),
        hasDataTheme: html.includes(`data-theme="${root}"`),
        hasInlineBg: expBg ? html.includes(`--frame-bg:${expBg}`) : null,
      };
    }
    return out;
  }, PLATFORMS, META);
  for (const pid of PLATFORMS) {
    const b = built[pid];
    check(`${pid}: built HTML carries the active-theme class`, b && b.hasThemeClass,
      b && !b.hasThemeClass ? 'missing theme class in returned HTML' : '');
    check(`${pid}: built HTML has data-theme attr`, b && b.hasDataTheme);
    check(`${pid}: built HTML has inline --frame-bg`, b && b.hasInlineBg);
  }

  await browser.close();

  console.log('\n' + (failures === 0
    ? '✅ ALL CHECKS PASSED — theme state propagates, no stale frames, no FOUC'
    : `❌ ${failures} CHECK(S) FAILED`));

  if (pageErrors.length) {
    console.log('\n(page errors observed — review for real runtime issues):');
    [...new Set(pageErrors)].slice(0, 15).forEach((e) => console.log('  • ' + e));
  }

  process.exit(failures === 0 ? 0 : 1);
})().catch((err) => {
  console.error('FATAL:', err);
  process.exit(2);
});
