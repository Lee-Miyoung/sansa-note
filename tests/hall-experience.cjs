// Public, beginner-facing flow. Firebase is mocked; recording bytes are real local files.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { fullRoute } = require('./unified-fixtures.cjs');

async function openPage(browser, viewport, clock = false) {
  const page = await browser.newPage({ viewport, serviceWorkers: 'block' });
  await fullRoute(page);
  await page.route('**/audio/dharma-hall/*.mp3', r => {
    const bytes = fs.readFileSync(path.resolve('.' + new URL(r.request().url()).pathname));
    const match = r.request().headers().range?.match(/bytes=(\d+)-(\d*)/);
    if (!match) return r.fulfill({ contentType: 'audio/mpeg', headers: { 'accept-ranges': 'bytes' }, body: bytes });
    const start = +match[1], end = match[2] ? Math.min(+match[2], bytes.length - 1) : bytes.length - 1;
    return r.fulfill({ status: 206, contentType: 'audio/mpeg', headers: {
      'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${bytes.length}`,
      'content-length': String(end - start + 1)
    }, body: bytes.subarray(start, end + 1) });
  });
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  if (clock) await page.clock.install({ time: new Date('2026-11-01T07:02:00+09:00') });
  await page.goto('https://sansanote.com/');
  await page.waitForFunction(() => window.SansaHallUX && window.SansaOnlineSansa);
  await page.evaluate(() => SansaOnlineSansa.ready);
  await page.evaluate(() => startLocalMode());
  return page;
}
const primary = p => p.locator('#hallPrimaryAction').click();
const state = p => p.evaluate(() => SansaDharmaHall.state);
const experience = p => p.evaluate(() => SansaDharmaHall.experience);
async function enter(p, id = 'daewung', options = { kind: 'free', duration: 180 }) {
  await p.evaluate(({ id, options }) => SansaOnlineSansa.enter(id, options), { id, options });
}
async function assertCoreVisible(p) {
  const bounds = await p.evaluate(() => ['hallStepFraction', 'hallStep', 'hallNowAction', 'hallPrimaryAction', 'hallNextStage', 'hallUXTime'].map(id => {
    const e = document.getElementById(id), r = e.getBoundingClientRect();
    return { id, x: r.x, right: r.right, top: r.top, bottom: r.bottom, width: innerWidth, height: innerHeight };
  }));
  for (const r of bounds) assert(r.x >= 0 && r.right <= r.width + 1 && r.top >= 0 && r.bottom <= r.height, JSON.stringify(r));
  assert.equal(await p.locator('.hall-scene').innerText(), '', 'no caption, status or dialogue over the painting');
  assert.equal(await p.locator('.hall-scene #hallMonk,.hall-scene #hallBubble').count(), 0);
}
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 1000 }]) {
      const p = await openPage(browser, viewport, true);
      await enter(p);
      assert(await p.locator('#hallWelcome').isVisible());
      assert.equal(await p.evaluate(() => SansaDharmaHall.media.paused), true);
      await p.locator('#hallExplain').click();
      assert(await p.locator('#hallHelp').isVisible());
      assert((await p.locator('#hallHelp').innerText()).includes('두 손바닥'));
      await p.keyboard.press('Tab');
      assert.equal(await p.evaluate(() => document.activeElement.id), 'hallHelpClose');
      await p.keyboard.press('Escape');
      assert(await p.locator('#dharmaHallOverlay').isVisible(), 'Escape closes help first');
      assert(!await p.locator('#hallHelp').isVisible());
      await p.locator('#hallQuickStart').click();
      await assertCoreVisible(p);
      await p.clock.fastForward(240000);
      assert.equal((await experience(p)).freeStep, 0);
      assert.equal((await state(p)).completed, false, 'suggested duration does not complete free prayer');
      assert.equal((await state(p)).gassho, 0);
      await primary(p);
      assert.equal((await experience(p)).freeStep, 1);
      assert.equal((await state(p)).gassho, 1);
      await assertCoreVisible(p);
      await primary(p);
      assert.equal(await p.locator('#hallPrimaryAction').innerText(), '첫 번째 절 하기');
      await primary(p);
      assert.equal((await state(p)).three, 1);
      assert.equal(await p.locator('#hallPrimaryAction').innerText(), '두 번째 절 하기');
      await p.clock.fastForward(60000);
      assert.equal((await state(p)).three, 1, 'waiting and guidance never invent bows');
      assert.equal((await experience(p)).freeStep, 2);
      await primary(p);
      await p.locator('#hallSecondaryAction').click();
      assert.equal((await state(p)).three, 3);
      assert.equal((await experience(p)).freeStep, 3);
      await assertCoreVisible(p);
      await p.locator('#hallSecondaryAction').click(); // explicit silent path, no playback claim
      assert.equal((await experience(p)).freeStep, 4);
      await p.locator('#hallVow').fill('개인 발원 내용');
      await primary(p);
      assert.equal((await state(p)).vowed, true);
      await primary(p);
      assert(await p.locator('#hallSummary').isVisible());
      const summary = await p.locator('#hallSummary').innerText();
      assert(summary.includes('삼배 참여 3/3회 (앉아서 1회 포함)'));
      assert(summary.includes('염불 실제 청취 0:00'));
      assert(summary.includes('발원 완료'));
      await p.screenshot({ path: `/tmp/hall-guided-summary-${viewport.width}.png` });
      await p.locator('#hallSummaryExit').click();
      assert.equal(await p.locator('#hallVow').inputValue(), '');
      assert.equal(await p.evaluate(() => Object.values(sessionStorage).join('|').includes('개인 발원 내용')), false);
      await enter(p, 'yaksa');
      await primary(p); // return visit: explicit seat
      await p.locator('#hallSkipAction').click();
      assert.equal((await state(p)).gassho, 0);
      assert.equal((await experience(p)).stepResults.arrival, 'skipped');
      await p.locator('#hallSkipAction').click();
      await p.locator('#hallSkipAction').click();
      assert.equal((await state(p)).three, 0);
      assert.equal((await experience(p)).stepResults.bows, 'skipped');
      await primary(p);
      assert.equal(await p.locator('#hallAudioTitle').innerText(), '무음 진행 중');
      assert.equal(await p.locator('#hallAudioTime').innerText(), '— / —');
      assert((await p.locator('#hallGuide').innerText()).includes('준비'));
      assert.deepEqual(await p.evaluate(() => mockWrites), []);
      assert.deepEqual(p.errors, []);
      console.log('PASS public flow', viewport.width, 'onboarding/help, visible core, action-gated free steps, 3 manual bows, seated alternative, honest summary, skipped actions, silent unacquired recording, private vow');
      await p.close();
    }
    const p = await openPage(browser, { width: 390, height: 844 });
    await enter(p);
    await p.evaluate(()=>{const h=structuredClone(SansaOnlineSansa.config.halls[0]);h.image='/images/online-sansa/daewung.webp';h.imageSmall='/images/online-sansa/daewung-small.webp';SansaDharmaHall.openHall(h,{kind:'free',duration:null});});
    assert((await p.locator('.hall-scene>img:first-child').getAttribute('src')).includes('daewung-refined.webp'),'older published bundled artwork is upgraded without a backend write');
    await p.locator('#hallQuickStart').click();
    await p.locator('.hall-options').evaluate(e => e.open = true);
    await p.locator('[data-free-step="3"]').click();
    await primary(p);
    await p.waitForFunction(() => !SansaDharmaHall.media.paused && SansaDharmaHall.experience.listened > 0.5);
    assert.equal(await p.locator('#hallAudioType').innerText(), '염불');
    assert((await p.locator('#hallAudioTitle').innerText()).includes('염불소리1'));
    assert((await p.locator('#hallAudioTime').innerText()).includes('/ 1:59'));
    assert((await p.locator('#hallDockMeta').innerText()).includes('CC BY 4.0'));
    assert((await p.locator('#hallDockCredits').getAttribute('href')).includes('13254274'));
    const before = (await experience(p)).listened;
    await p.locator('#hallAudioSeek').fill('50');
    await p.waitForFunction(() => SansaDharmaHall.media.currentTime > 58 && !SansaDharmaHall.media.seeking);
    assert((await experience(p)).listened - before < 3, 'seeking 59 seconds is not counted as listening');
    await p.locator('#hallAudioPause').click();
    const paused = (await experience(p)).listened;
    await p.waitForTimeout(400);
    assert.equal((await experience(p)).listened, paused);
    await p.locator('#hallAudioPlay').click();
    await p.waitForFunction(() => !SansaDharmaHall.media.paused);
    await p.locator('#hallAudioStop').click();
    assert.equal(await p.evaluate(() => SansaDharmaHall.media.currentTime), 0);
    await p.locator('#hallOpen108').click();
    assert.equal(await p.locator('#hallModeLabel').innerText(), '108배 마음 수행');
    await primary(p);
    assert.equal((await state(p)).count, 1);
    await p.waitForFunction(() => document.getElementById('hallMonk').dataset.bowFrame === '2');
    assert((await p.locator('#hallMonk').getAttribute('src')).includes('monk-prostrate'));
    assert.equal(await p.locator('#hallMonk').evaluate(e => getComputedStyle(e).transform), 'none');
    assert.equal(await p.locator('#hallMonk').evaluate(e => getComputedStyle(e).animationName), 'none');
    assert(await p.locator('#hallMonk').evaluate(e => e.complete && e.naturalWidth > 0));
    await p.screenshot({ path: '/tmp/hall-guided-bow.png' });
    await p.locator('#hallSecondaryAction').click();
    assert.equal((await state(p)).count, 2);
    assert.equal((await experience(p)).accessible108, 1);
    await p.locator('.hall-options').evaluate(e => e.open = true);
    await p.locator('#hallPace').selectOption('8');
    await p.clock.install();
    await p.clock.fastForward(24100);
    assert.equal((await state(p)).count, 2, 'pace guides never count for the user');
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await primary(p);
    assert.equal((await state(p)).count, 3);
    assert((await p.locator('#hallMonk').getAttribute('src')).includes('monk-prayer'));
    await p.locator('#hallFinish108').click();
    assert((await p.locator('#hallSummary').innerText()).includes('108배 참여 3/108회 (합장 대체 1회 포함)'));
    await p.locator('#hallClose').click();
    assert.equal(await p.evaluate(() => SansaDharmaHall.media.paused), true);
    assert.deepEqual(p.errors, []);
    assert.deepEqual(await p.evaluate(() => mockWrites), []);
    await p.close();
    console.log('PASS real audio decode/time/source/pause/resume/stop; seek excluded from actual listening; stable bow frames, reduced motion, 108 manual and seated counting, guidance never counts, exit silence');
    const s = await openPage(browser, { width: 390, height: 844 }, true);
    await enter(s, 'daewung', { kind: 'scheduled', startAt: Date.parse('2026-11-01T07:00:00+09:00'), duration: 300, title: '아침 예불' });
    await s.locator('#hallQuickStart').click();
    assert.equal(await s.locator('#hallModeLabel').innerText(), '정시 예불 참여 중');
    assert.equal(await s.locator('#hallStepFraction').innerText(), '현재 단계 4 / 7');
    assert.equal((await state(s)).three, 0);
    assert.equal((await state(s)).gassho, 0);
    await assertCoreVisible(s);
    await s.evaluate(() => SansaDharmaHall.perform('pause'));
    const elapsed = (await state(s)).elapsed;
    await s.clock.fastForward(30000);
    assert((await state(s)).elapsed >= elapsed + 29);
    assert.equal((await state(s)).three, 0);
    await s.clock.fastForward(160000);
    assert(await s.locator('#hallSummary').isVisible());
    assert((await s.locator('#hallSummary').innerText()).includes('삼배 참여 0/3회'));
    assert.deepEqual(s.errors, []);
    await s.close();
    console.log('PASS scheduled absolute clock and late-stage guidance; no past activity or whole-program listening invented');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
