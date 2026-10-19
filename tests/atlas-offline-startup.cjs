const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const { route } = require('./atlas-fixtures.cjs');
(async () => {
  const engine = process.env.SANSA_BROWSER === 'webkit' ? webkit : chromium;
  const b = await engine.launch(engine === chromium ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { executablePath: '/workspace/.sansa-webkit-run' });
  try {
    for (const url of ['/atlas/', '/atlas/bulguksa/', ...(process.env.INCLUDE_TONGDOSA ? ['/atlas/tongdosa/'] : [])]) {
      const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, serviceWorkers: 'block' });
      const requests = []; p.on('request', r => requests.push(new URL(r.url()).pathname));
      await route(p); await p.route('https://www.gstatic.com/**', () => {});
      await p.goto('https://sansanote.com' + url, { waitUntil: 'domcontentloaded', timeout: 6000 });
      await p.waitForFunction(() => !document.getElementById('startAtlas').disabled, null, { timeout: 6000 });
      await p.locator('#startAtlas').click(); await p.locator('[data-atlas=resume]').click();
      assert(await p.locator('.atlas-prose').isVisible());
      assert(!requests.includes('/index.html'), 'episode must not download the home app to find config');
      assert.equal(await p.evaluate(() => SansaAtlasStore.uid), 'guest');
      console.log('PASS', process.env.SANSA_BROWSER || 'chromium', url, 'reader works while all Firebase SDK connections remain pending; no home HTML fetch');
      await p.close();
    }
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
