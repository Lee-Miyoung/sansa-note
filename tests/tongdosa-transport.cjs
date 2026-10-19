const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const { chromium } = require('playwright'), root = path.resolve(__dirname, '..');
const episodePath=process.env.ATLAS_EPISODE_PATH||'/atlas/tongdosa/';
const episode=JSON.parse(fs.readFileSync('scripts/atlas/episodes.json')).find(e=>e.href===episodePath);assert(episode,'episode must be in the published catalog');
(async () => {
  const requests = [];
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost'); requests.push(u.pathname + u.search);
    if (u.pathname === '/') { res.setHeader('Content-Type', 'text/html'); return res.end('<h1>Existing root worker fixture</h1><script>navigator.serviceWorker.register("/sw.js")</script>'); }
    const file = path.join(root, decodeURIComponent(u.pathname) + (u.pathname.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    const ext = path.extname(file); res.setHeader('Content-Type', ({ '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.json': 'application/json' })[ext] || 'text/html'); res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errors = []; p.on('pageerror', e => errors.push(e.message));
    await p.route('https://**/*', r => r.abort()); const origin = 'http://127.0.0.1:' + server.address().port;
    await p.goto(origin); await p.waitForFunction(() => navigator.serviceWorker.controller);
    await p.evaluate(async () => {
      localStorage.setItem('old-progress-sentinel', 'preserve');
      await (await caches.open('legacy-runtime')).put('/atlas/store.js?v=20261019-episodes', new Response('throw Error("stale legacy runtime executed")', { headers: { 'Content-Type': 'application/javascript' } }));
    });
    await p.goto(origin + episodePath);
    await p.waitForFunction(() => window.sansaSecretAtlas && navigator.serviceWorker.controller?.scriptURL.endsWith('/atlas/sw.js'));
    await p.locator('#startAtlas').click(); await p.locator('[data-atlas=resume]').click();
    await p.locator('.atlas-reader figure img').evaluate(im => im.decode());
    assert.equal(await p.evaluate(() => SansaAtlasEpisode.id), episode.id);
    assert.equal(await p.evaluate(() => localStorage.getItem('old-progress-sentinel')), 'preserve');
    assert(requests.includes('/atlas/store.js?v=20261019-catalog'));
    assert(!requests.includes('/index.html'));
    assert.deepEqual(errors, []);
    console.log('PASS',episode.id,'actual root→atlas worker transition: stale old runtime bypassed, reader/images usable, no home HTML fetch, old progress retained');
  } finally { await b.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
