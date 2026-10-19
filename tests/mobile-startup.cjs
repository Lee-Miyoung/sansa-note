// Local fixtures only: no production Firebase reads or writes.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const sdk = {
  app: `window.sdkOrder=['app'];window.firebase={apps:[],initializeApp(){this.apps.push({})}};`,
  auth: `sdkOrder.push('auth');if(!firebase.apps)throw Error('app SDK order');
    const mockAuth={currentUser:null,setPersistence:async()=>{},getRedirectResult:async()=>null,
      onAuthStateChanged(fn){queueMicrotask(()=>fn(null));return()=>{}}};
    firebase.auth=()=>mockAuth;firebase.auth.Auth={Persistence:{LOCAL:'local'}};`,
  database: `sdkOrder.push('database');firebase.database=()=>({ref:()=>({on(){},off(){}})});`,
  storage: `sdkOrder.push('storage');firebase.storage=()=>({});`,
  pdf: `sdkOrder.push('pdf');window.jspdf={jsPDF:function(){}};`
};
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  let server;
  try {
    for (const width of [390, 820, 1440]) {
      const p = await browser.newPage({ viewport: { width, height: 844 }, serviceWorkers: 'block' });
      const errors = [];
      p.on('pageerror', e => errors.push(e.message));
      const records = { saved: { name: '조계사', stage: 1, photos: { mine: { url: 'https://images.test/personal.jpg' } }, visits: { one: { date: '2026-10-18', note: '기존 순례 기록' } } } };
      await p.addInitScript(records => localStorage.setItem('travelDiaryLocalData', JSON.stringify(records)), records);
      await p.route('**/*', async r => {
        const u = new URL(r.request().url());
        if (u.hostname === 'www.gstatic.com' || u.hostname === 'cdnjs.cloudflare.com') {
          // Deliberately unequal latency: defer must preserve SDK execution order.
          const key = Object.keys(sdk).find(k => u.pathname.includes('firebase-' + k)) || 'pdf';
          await new Promise(resolve => setTimeout(resolve, key === 'app' ? 700 : 50));
          return r.fulfill({ contentType: 'application/javascript', body: sdk[key] });
        }
        const file = path.join(root, u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname));
        if (u.origin === 'https://sansanote.com' && fs.existsSync(file) && fs.statSync(file).isFile()) return r.fulfill({ path: file });
        return r.abort();
      });
      await p.goto('https://sansanote.com/');
      // No manual startLocalMode: the real DOMContentLoaded/auth path must open home.
      await p.waitForFunction(() => document.getElementById('app').style.display === 'block');
      assert.deepEqual(await p.evaluate(() => sdkOrder), ['app', 'auth', 'database', 'storage']);
      await p.evaluate(() => sansaLoadPdf());
      assert.deepEqual(await p.evaluate(() => sdkOrder), ['app', 'auth', 'database', 'storage', 'pdf']);
      assert.equal(await p.evaluate(() => firebase.apps.length), 1);
      assert.equal(await p.evaluate(() => typeof window.jspdf.jsPDF), 'function');
      // Existing startup enriches temple metadata and seeds the catalog. Personal fields must survive.
      const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('travelDiaryLocalData')).saved);
      for (const key of ['name', 'stage', 'photos', 'visits']) assert.deepEqual(saved[key], records.saved[key]);
      assert.equal(await p.evaluate(() => guardianCatalog().length), 108);
      assert.deepEqual(errors, []);
      console.log('PASS deferred SDK order, automatic guest startup, PDF readiness, 108 cards, saved photos/visits:', width);
      await p.close();
    }
    const requests = [];
    server = http.createServer((req, res) => {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      if (pathname === '/') {
        res.setHeader('Content-Type', 'text/html');
        return res.end('<h1>Offline shell fixture</h1><script>navigator.serviceWorker.register("/sw.js")</script>');
      }
      const file = path.join(root, decodeURIComponent(pathname));
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return res.writeHead(404).end();
      requests.push(pathname);
      res.setHeader('Content-Type', pathname.endsWith('.js') ? 'text/javascript' : 'application/octet-stream');
      res.end(fs.readFileSync(file));
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;
    const context = await browser.newContext();
    const p = await context.newPage();
    await p.goto(origin);
    await p.waitForFunction(() => navigator.serviceWorker.controller);
    assert(!requests.some(url => /\.(mp3|mp4)$/.test(url)), 'install must not download unused media');
    assert(!requests.includes('/index.html'), 'shell must not download twice');
    const size = await p.evaluate(async () => (await (await fetch('/song1.mp3')).arrayBuffer()).byteLength);
    assert.equal(size, fs.statSync(path.join(root, 'song1.mp3')).size);
    let cached = false;
    for (let i = 0; i < 50 && !cached; i++) {
      cached = await p.evaluate(async () => !!(await caches.match('/song1.mp3')));
      if (!cached) await p.waitForTimeout(100);
    }
    assert(cached, 'requested song must actually be in the cache');
    await context.setOffline(true);
    assert.equal(await p.evaluate(async () => (await (await fetch('/song1.mp3')).arrayBuffer()).byteLength), size);
    await p.reload();
    assert.equal(await p.locator('h1').innerText(), 'Offline shell fixture');
    console.log('PASS actual worker: no unused media/duplicate shell at install; requested music caches and plays back offline; offline shell retained');
    await context.close();
  } finally {
    await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
