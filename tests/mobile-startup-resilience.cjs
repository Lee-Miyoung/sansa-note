// Reproduce interrupted mobile entry without contacting production Firebase.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');
const root = path.resolve(__dirname, '..');
const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1';
const fixture = `
window.mockAuthCallbacks=[];window.mockWrites=[];window.mockAccountListeners=[];
const accountRecord={account:{name:'불국사',region:'경상',stage:2,photos:{mine:{url:'https://images.test/account.jpg'}},visits:{v:{date:'2026-10-18',note:'계정 순례'}}}};
const snapshot=value=>({val:()=>value,exists:()=>value!=null});
const makeUser=()=>({uid:'A',email:'a@example.test',displayName:'A'});
window.mockAuth={currentUser:mockCloudMode==='profile-stalled'?makeUser():null,
 setPersistence:async()=>{},getRedirectResult:async()=>null,
 onAuthStateChanged(fn){mockAuthCallbacks.push(fn);if(mockCloudMode==='profile-stalled')queueMicrotask(()=>fn(this.currentUser));return()=>{}}};
window.mockResolveAuth=async()=>{mockAuth.currentUser=makeUser();await Promise.all(mockAuthCallbacks.map(fn=>fn(mockAuth.currentUser)))};
window.mockReleaseAccount=()=>mockAccountListeners.forEach(fn=>fn(snapshot(accountRecord)));
const makeRef=p=>({
 on(event,fn){if(p==='users/A/destinations')mockAccountListeners.push(fn);else fn(snapshot(null));},off(){},
 once:()=>new Promise(()=>{}),get:()=>new Promise(()=>{}),
 child:k=>makeRef(p+'/'+k),update:async patch=>mockWrites.push({path:p,patch}),set:async value=>mockWrites.push({path:p,value})});
window.firebase={apps:[],initializeApp(){this.apps.push({})},auth:()=>mockAuth,database:()=>({ref:makeRef}),storage:()=>({})};
firebase.auth.Auth={Persistence:{LOCAL:'local'}};firebase.database.ServerValue={TIMESTAMP:{'.sv':'timestamp'}};
`;
(async () => {
  const engine = process.env.SANSA_BROWSER === 'webkit' ? webkit : chromium;
  const browser = await engine.launch(engine === chromium ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : (process.env.SANSA_WEBKIT_EXECUTABLE_PATH ? { executablePath: process.env.SANSA_WEBKIT_EXECUTABLE_PATH } : {}));
  try {
    for (const mode of ['sdk-stalled', 'sdk-error', 'auth-pending-idle', 'auth-pending-edit', 'profile-stalled']) {
      const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent, serviceWorkers: 'block' });
      const errors = [];
      let pdfRequests = 0;
      p.on('pageerror', e => errors.push(e.message));
      await p.addInitScript(mode => {
        window.mockCloudMode = mode;
        localStorage.setItem('saved-session-sentinel', 'preserve');
        localStorage.setItem('travelDiaryLocalData', JSON.stringify({ guest: { name: '조계사', stage: 1, photos: { mine: { url: 'https://images.test/guest.jpg' } }, visits: { v: { date: '2026-10-17', note: '기존 기기 순례' } } } }));
      }, mode);
      await p.route('**/*', r => {
        const u = new URL(r.request().url());
        // Keep both font stylesheet connections pending throughout the test.
        if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'cdn.jsdelivr.net') return;
        if (u.hostname === 'www.gstatic.com') {
          if (mode === 'sdk-stalled') return;
          if (mode === 'sdk-error') return r.abort();
          return r.fulfill({ contentType: 'application/javascript', body: u.pathname.includes('firebase-app') ? fixture : '' });
        }
        if (u.hostname === 'cdnjs.cloudflare.com') {
          pdfRequests++;
          return r.fulfill({ contentType: 'application/javascript', body: 'window.jspdf={jsPDF:function(){}}' });
        }
        let file = path.join(root, u.pathname === '/' ? 'index.html' : decodeURIComponent(u.pathname));
        if (process.env.SANSA_STARTUP_BASELINE && u.pathname === '/') file = process.env.SANSA_STARTUP_BASELINE;
        if (u.origin === 'https://sansanote.com' && fs.existsSync(file) && fs.statSync(file).isFile()) return r.fulfill({ path: file });
        return r.abort();
      });
      await p.goto('https://sansanote.com/', { waitUntil: 'commit' });
      // Crucially, never call startLocalMode or wait for window.load in this test.
      await p.waitForFunction(() => document.getElementById('app')?.style.display === 'block', null, { timeout: 5000 });
      const elapsed = await p.evaluate(() => Math.round(performance.now()));
      assert.equal(pdfRequests, 0, 'PDF must not download during home entry');
      if (mode === 'sdk-stalled') {
        await p.evaluate(() => sansaLoadPdf());
        assert.equal(pdfRequests, 1, 'PDF export must load independently of a stalled Firebase SDK');
      }
      assert.equal(await p.evaluate(() => localStorage.getItem('saved-session-sentinel')), 'preserve');
      if (mode.startsWith('auth-pending')) {
        assert.equal(await p.evaluate(() => localMode), true);
        if (mode.endsWith('edit')) {
          await p.evaluate(() => openDetail('guest'));
          await p.locator('#visitNoteInput').fill('계정 전환 전 입력 중인 메모');
        }
        await p.evaluate(() => mockResolveAuth());
        if (mode.endsWith('edit')) {
          assert.equal(await p.evaluate(() => localMode), true, 'an edit must keep its original guest storage destination');
          assert.equal(await p.locator('#visitNoteInput').inputValue(), '계정 전환 전 입력 중인 메모');
          await p.evaluate(() => updateDestination('guest', { notes: '계속 이 기기에 저장' }));
          assert(!await p.evaluate(() => mockWrites.some(w => w.path.startsWith('users/'))));
          assert((await p.locator('#cloudConnectionNotice').innerText()).includes('내 계정 기록'));
        } else {
          assert.equal(await p.evaluate(() => localMode), false);
          assert.equal(await p.evaluate(() => currentUid), 'A');
          assert.equal(await p.evaluate(() => destinations.guest), undefined, 'guest data must not become account data while waiting for remote records');
          await p.evaluate(() => mockReleaseAccount());
          await p.waitForFunction(() => destinations.account?.stage === 2);
          assert.equal(await p.evaluate(() => destinations.account.visits.v.note), '계정 순례');
        }
      } else if (mode === 'profile-stalled') {
        assert.equal(await p.evaluate(() => localMode), false, 'an unresolved profile write must not gate the account home');
        await p.evaluate(() => mockReleaseAccount());
        await p.waitForFunction(() => destinations.account?.stage === 2);
      } else {
        await p.evaluate(() => openPilgrimCollection());
        assert.equal(await p.evaluate(() => guardianCatalog().length), 108);
      }
      const guest = await p.evaluate(() => JSON.parse(localStorage.getItem('travelDiaryLocalData')).guest);
      assert.equal(guest.photos.mine.url, 'https://images.test/guest.jpg');
      assert.equal(guest.visits.v.note, '기존 기기 순례');
      assert.deepEqual(errors, []);
      console.log('PASS', process.env.SANSA_BROWSER || 'chromium', mode, 'interactive home observed at', elapsed + 'ms', 'with pending fonts, preserved local records/session, safe account recovery');
      await p.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
