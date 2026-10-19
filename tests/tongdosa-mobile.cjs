const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { webkit } = require('playwright'), { route } = require('./atlas-fixtures.cjs');
const c = { window: {} }; vm.runInNewContext(fs.readFileSync('atlas/tongdosa/content.js', 'utf8'), c);
const story = c.window.SansaAtlasContent;
(async () => {
  const b = await webkit.launch({ executablePath: '/workspace/.sansa-webkit-run' });
  try {
    for (const width of [390, 820]) {
      const p = await b.newPage({ viewport: { width, height: 1000 }, hasTouch: true, serviceWorkers: 'block' }); await route(p);
      await p.addInitScript(() => {
        localStorage.setItem('sansaSecretAtlas_v1:guest:haeinsa-001', 'preserved episode 1');
        localStorage.setItem('sansaSecretAtlas_v1:guest:bulguksa-002', 'preserved episode 2');
      });
      await p.goto('https://sansanote.com/atlas/tongdosa/'); await p.waitForFunction(() => window.sansaSecretAtlas);
      await p.locator('#startAtlas').click(); await p.locator('[data-atlas=resume]').click();
      for (let i = 0; i < 12; i++) {
        assert.equal(await p.evaluate(() => sansaSecretAtlas.view.scene), i);
        await p.locator('.atlas-reader figure img').evaluate(im => im.decode());
        assert(await p.locator('.atlas-keyword').count() > 0);
        assert.equal(await p.evaluate(() => Object.keys(SansaAtlasStore.state.cards).length), Math.floor(i / 4));
        await p.locator('[data-atlas=next]').click();
      }
      assert.equal(await p.evaluate(() => Object.keys(SansaAtlasStore.state.cards).length), 3);
      await p.locator('.atlas-card-grid img').evaluateAll(es => Promise.all(es.map(e => e.decode())));
      for (let i = 0; i < 6; i++) {
        const q = story.quizzes[i];
        await p.evaluate(i => { const r = sansaSecretAtlas.capture(); sansaSecretAtlas.restore({ ...r, view: { ...r.view, page: 'quiz', quiz: i }, order: SansaAtlasContent.quizzes[i].items?.map((_, j) => j) || [], selection: [], feedback: null }); }, i);
        if (q.type === 'match') for (let j = 0; j < q.correct.length; j++) await p.locator('[data-match="' + j + '"]').selectOption(String(q.correct[j]));
        else if (q.type !== 'order') for (const j of q.correct) await p.locator('[name=atlasAnswer][value="' + j + '"]').check();
        else {
          const order = q.items.map((_, j) => j);
          for (let pos = 0; pos < q.correct.length; pos++) {
            let at = order.indexOf(q.correct[pos]);
            while (at > pos) { await p.locator('[data-atlas=up][data-index="' + at + '"]').click(); [order[at], order[at - 1]] = [order[at - 1], order[at]]; at--; }
          }
        }
        await p.locator('[data-atlas=check]').click(); assert(await p.locator('.atlas-answer.correct').isVisible());
      }
      await p.locator('[data-atlas=note]').click(); await p.locator('#atlasNote').fill('통도사에서 기억할 마음');
      await p.reload(); await p.waitForFunction(() => window.SansaAtlasStore);
      assert.equal(await p.evaluate(() => SansaAtlasStore.state.note.text), '통도사에서 기억할 마음');
      assert.equal(await p.evaluate(() => Object.keys(SansaAtlasStore.state.cards).length), 3);
      assert.equal(await p.evaluate(() => localStorage.getItem('sansaSecretAtlas_v1:guest:haeinsa-001')), 'preserved episode 1');
      assert.equal(await p.evaluate(() => localStorage.getItem('sansaSecretAtlas_v1:guest:bulguksa-002')), 'preserved episode 2');
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      console.log('PASS WebKit', width, '12 scenes; four-scene card gates; six quizzes; image decoding; notes/cards reload; old episode bytes preserved');
      await p.close();
    }
    const p = await b.newPage({ serviceWorkers: 'block' }); await route(p);
    await p.route('**/tongdosa/content.js*', r => r.fulfill({ path: 'atlas/bulguksa/content.js' }));
    await p.goto('https://sansanote.com/atlas/tongdosa/');
    assert(await p.locator('#startAtlas').isDisabled());
    assert.equal(await p.evaluate(() => typeof window.SansaAtlasStore), 'undefined');
    console.log('PASS mismatched episode content refuses startup without opening a wrong progress namespace');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
