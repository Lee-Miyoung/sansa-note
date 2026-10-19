const fs = require('node:fs'), assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const { route } = require('./atlas-fixtures.cjs');
const catalog = JSON.parse(fs.readFileSync('scripts/atlas/episodes.json'));
// A release row cannot quietly grow into a story payload.
for (const episode of catalog) {
  assert.deepEqual(Object.keys(episode).sort(), ['href', 'id', 'number', 'temple', 'thumbnail', 'title']);
  assert(Buffer.byteLength(JSON.stringify(episode)) < 512);
}
const publicConfig = JSON.parse(fs.readFileSync('atlas/firebase-config.json'));
const configBlock = fs.readFileSync('index.html', 'utf8').match(/const\s+FIREBASE_CONFIG\s*=\s*(\{[\s\S]*?\});/)[1];
for (const [key, value] of Object.entries(publicConfig)) {
  const match = configBlock.match(new RegExp(key + ':\\s*["\']([^"\']+)'));
  assert(match && match[1] === value, 'small public config must match the existing homepage config');
}
const engine = process.env.SANSA_BROWSER === 'webkit' ? webkit : chromium;
(async () => {
  const browser = await engine.launch(engine === chromium ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : { executablePath: '/workspace/.sansa-webkit-run' });
  try {
    for (const width of [390, 820, 1440]) {
      for (const expanded of [false, true]) {
        const p = await browser.newPage({ viewport: { width, height: 1000 }, hasTouch: width < 1000, serviceWorkers: 'block' });
        const requests = []; p.on('request', r => requests.push(new URL(r.url()).pathname));
        await route(p);
        const list = expanded ? Array.from({ length: 12 }, (_, i) => i < catalog.length ? catalog[i] : {
          id: 'sample-' + String.fromCharCode(97 + i) + '-' + String(i + 1).padStart(3, '0'), number: String(i + 1).padStart(3, '0'),
          temple: '확장 검사', title: '메타데이터만 추가한 회차', href: '/atlas/sample-' + String.fromCharCode(97 + i) + '/',
          thumbnail: '/atlas/sample-' + String.fromCharCode(97 + i) + '/images/cover-small.webp'
        }) : catalog;
        await p.route('**/scripts/atlas/episodes.json', r => r.fulfill({ json: list }));
        await p.goto('https://sansanote.com/');
        await p.waitForFunction(() => document.getElementById('homeAtlasEntry').dataset.catalogReady === 'true');
        await p.evaluate(() => startLocalMode());
        assert.equal(await p.locator('.home-atlas-card').count(), list.length);
        assert.equal(await p.locator('.home-atlas-card img[src]').count(), Math.min(2, list.length));
        await p.locator('#homeAtlasEntry').scrollIntoViewIfNeeded();
        await p.locator('[data-atlas-slide="' + (list.length - 1) + '"]').click();
        await p.waitForFunction(n => { const t = document.getElementById('homeAtlasTrack'); return Math.abs(t.scrollLeft - (n - 1) * t.clientWidth) < 2 && document.getElementById('homeAtlasNext').disabled; }, list.length);
        assert(await p.locator('#homeAtlasNext').isDisabled());
        assert.equal(await p.locator('.home-atlas-card').last().getAttribute('href'), list.at(-1).href);
        await p.locator('[data-atlas-slide="0"]').click();
        await p.waitForFunction(() => document.getElementById('homeAtlasTrack').scrollLeft < 1 && document.getElementById('homeAtlasPrev').disabled);
        assert(await p.locator('#homeAtlasPrev').isDisabled());
        assert(!requests.some(u => /^\/atlas\/(?:[^/]+\/)?(?:content|bootstrap|renderer|store|auth-loader)\.js$/.test(u) || /\/atlas\/.*\/(?:scene-|card-)/.test(u)));
        assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        console.log('PASS', process.env.SANSA_BROWSER || 'chromium', width, list.length, 'episodes: metadata only; bounded thumbnails; navigation and no story preloads');
        await p.close();
      }
    }
    const p = await browser.newPage({ serviceWorkers: 'block' }); await route(p);
    await p.route('**/scripts/atlas/episodes.json', r => r.abort());
    await p.goto('https://sansanote.com/');
    assert.equal(await p.locator('.home-atlas-fallback').getAttribute('href'), '/atlas/');
    console.log('PASS metadata failure preserves ordinary episode-one link');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
