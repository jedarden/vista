const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless:true, executablePath:'/nix/store/7xr3qnq93srn4dgak7qw74dw836wpp1y-chromium-138.0.7204.49/bin/chromium', args:['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport:{width:360,height:780}, deviceScaleFactor:3 });
  const page = await ctx.newPage();
  await page.goto('file:///home/coding/vista/test-twitter-frame.html', {waitUntil:'networkidle'});
  await page.waitForTimeout(300);
  const state = (label) => page.evaluate(() => {
    const f = document.querySelector('.twitter-context');
    return { theme: document.documentElement.getAttribute('data-theme'),
             cls: f && f.className,
             frameBg: f && getComputedStyle(f).backgroundColor,
             bodyBg: getComputedStyle(document.body).backgroundColor,
             btn: !!document.getElementById('themeToggle'),
             btnText: document.getElementById('themeToggle') && document.getElementById('themeToggle').textContent };
  }).then(s => console.log(label, JSON.stringify(s)));
  await state('before:');
  await page.click('#themeToggle');
  await state('after click (0ms):');
  await page.waitForTimeout(200);
  await state('after click (200ms):');
  await browser.close();
})().catch(e=>{console.error('ERR',e.message);process.exit(1)});
