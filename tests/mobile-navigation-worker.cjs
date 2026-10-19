const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
(async () => {
  let delayed = false;
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'scripts/atlas/episodes.json')));
  let catalogCount = catalog.length - 1;
  const timers = new Set();
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/') {
      res.setHeader('Content-Type', 'text/html');
      if (url.searchParams.has('stream')) {
        res.write('<!doctype html><body><h1>Streaming app</h1>' + ' '.repeat(2048));
        const timer = setTimeout(() => { timers.delete(timer); res.end('</body>'); }, 6000);
        timers.add(timer);
        return;
      }
      if (delayed && url.searchParams.has('from')) {
        const timer = setTimeout(() => { timers.delete(timer); res.end('<h1>Refreshed app</h1>'); }, 6000);
        timers.add(timer);
        return;
      }
      return res.end('<h1>Saved app</h1><script>navigator.serviceWorker.register("/sw.js")</script>');
    }
    if (url.pathname === '/scripts/atlas/episodes.json') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(catalog.slice(0, catalogCount)));
    }
    if (url.pathname === '/search.html') {
      res.setHeader('Content-Type', 'text/html');
      return res.end('<h1>Search results fixture</h1><a href="/?from=search">산사노트</a>');
    }
    const file = path.join(root, decodeURIComponent(url.pathname));
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : 'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext();
    const p = await context.newPage();
    const origin = 'http://127.0.0.1:' + server.address().port;
    await p.goto(origin);
    await p.waitForFunction(() => navigator.serviceWorker.controller);
    await p.evaluate(() => localStorage.setItem('record-sentinel', 'keep'));
    assert.equal(await p.evaluate(async () => (await (await fetch('/scripts/atlas/episodes.json')).json()).length), catalog.length - 1);
    catalogCount = catalog.length;
    assert.equal(await p.evaluate(async () => (await (await fetch('/scripts/atlas/episodes.json')).json()).length), catalog.length, 'new metadata must not remain hidden behind an old worker cache');
    const streamingStart = Date.now();
    await p.goto(origin + '/?stream=1', { waitUntil: 'commit', timeout: 3000 });
    await p.locator('h1').waitFor({ timeout: 2000 });
    assert.equal(await p.locator('h1').innerText(), 'Streaming app');
    assert(Date.now() - streamingStart < 3000, 'network HTML must stream before its full body is cached');
    await p.goto(origin + '/search.html');
    delayed = true;
    const start = Date.now();
    await p.locator('a').click({ noWaitAfter: true });
    await p.waitForURL('**/?from=search', { timeout: 4500 });
    await p.waitForLoadState('domcontentloaded');
    assert.equal(await p.locator('h1').innerText(), 'Saved app');
    assert(Date.now() - start < 4500, 'a saved page must open without waiting for the stalled response');
    assert.equal(await p.evaluate(() => localStorage.getItem('record-sentinel')), 'keep');
    let refreshed = false;
    const deadline = Date.now() + 7000;
    while (Date.now() < deadline) {
      refreshed = await p.evaluate(async () => {
        const response = await caches.match('/?from=search');
        return !!response && (await response.text()).includes('Refreshed app');
      });
      if (refreshed) break;
      await p.waitForTimeout(100);
    }
    assert(refreshed, 'the delayed response must actually be stored before checking offline reload');
    await context.setOffline(true);
    await p.reload();
    assert.equal(await p.locator('h1').innerText(), 'Refreshed app');
    console.log('PASS streaming HTML is not held for cache writes; search-result navigation: cached app opens while network stalls, delayed response refreshes cache, offline reload uses refreshed page, local records preserved');
    await context.close();
  } finally {
    await browser.close();
    for (const timer of timers) clearTimeout(timer);
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
