const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { webkit } = require('playwright'), { route } = require('./atlas-fixtures.cjs');
const c = { window: {} }; vm.runInNewContext(fs.readFileSync('atlas/naksansa/content.js', 'utf8'), c);
const story = c.window.SansaAtlasContent;
(async () => {
  const b = await webkit.launch({ executablePath: '/workspace/.sansa-webkit-run' });
  try {
    for (const width of [390, 820]) {
      const p = await b.newPage({ viewport: { width, height: 1000 }, hasTouch: true, serviceWorkers: 'block' }); await route(p);
      await p.addInitScript(() => {
        localStorage.setItem('sansaSecretAtlas_v1:guest:haeinsa-001', 'preserved episode 1');
        localStorage.setItem('sansaSecretAtlas_v1:guest:bulguksa-002', 'preserved episode 2');localStorage.setItem('sansaSecretAtlas_v1:guest:tongdosa-003','preserved episode 3');
      });
      await p.goto('https://sansanote.com/atlas/naksansa/'); await p.waitForFunction(() => window.sansaSecretAtlas);
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
      await p.locator('[data-atlas=note]').click(); await p.locator('#atlasNote').fill('낙산사에서 기억할 마음');
      await p.reload(); await p.waitForFunction(() => window.SansaAtlasStore);
      assert.equal(await p.evaluate(() => SansaAtlasStore.state.note.text), '낙산사에서 기억할 마음');
      assert.equal(await p.evaluate(() => Object.keys(SansaAtlasStore.state.cards).length), 3);
      assert.equal(await p.evaluate(() => localStorage.getItem('sansaSecretAtlas_v1:guest:haeinsa-001')), 'preserved episode 1');
      assert.equal(await p.evaluate(() => localStorage.getItem('sansaSecretAtlas_v1:guest:bulguksa-002')), 'preserved episode 2');assert.equal(await p.evaluate(() => localStorage.getItem('sansaSecretAtlas_v1:guest:tongdosa-003')), 'preserved episode 3');
      assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      console.log('PASS WebKit', width, '12 scenes; four-scene card gates; six quizzes; image decoding; notes/cards reload; old episode bytes preserved');
      await p.close();
    }
    {
      const p=await b.newPage({serviceWorkers:'block'});await route(p);
      await p.goto('https://sansanote.com/atlas/naksansa/');await p.waitForFunction(()=>window.SansaAtlasStore&&window.mockSignIn);
      const oldIds=['haeinsa-001','bulguksa-002','tongdosa-003','songgwangsa-004'];
      const saved=await p.evaluate(ids=>{
        const out={};for(const id of ids){const raw=SansaAtlasStore.normalize({version:1,position:{scene:7,at:1000},completed:Object.fromEntries(Array.from({length:12},(_,i)=>[i+1,1000])),cards:{'001':1000,'002':1000,'003':1000},answers:{q1:{selection:[1],correct:true,at:1000,attempts:1}},note:{text:'keep '+id,at:1000},lastReadAt:1000});out[id]=JSON.stringify(raw);localStorage.setItem('sansaSecretAtlas_v1:guest:'+id,out[id]);}return out;
      },oldIds);
      await p.evaluate(()=>{SansaAtlasStore.note('episode 5 only');for(let i=0;i<12;i++)SansaAtlasStore.complete(i);});
      assert.equal(await p.evaluate(()=>Object.keys(SansaAtlasStore.state.cards).length),3);
      const guest4=await p.evaluate(()=>localStorage.getItem('sansaSecretAtlas_v1:guest:naksansa-005'));
      await p.evaluate(async()=>{
        mockRecords['users/A/destinations']={wanju:{name:'다른 사찰',visits:{protected:{verified:true,ts:1000}}}};
        for(const id of ['haeinsa-001','bulguksa-002','tongdosa-003','songgwangsa-004'])mockRecords['users/A/secretAtlas/'+id]={note:{text:'cloud keep '+id,at:1000}};
        await mockSignIn('A');SansaAtlasStore.connect();
      });
      assert.equal(await p.evaluate(()=>SansaAtlasStore.verifiedVisit()),null,'Wanju Naksansa is a different temple');
      const protectedCloud=await p.evaluate(()=>JSON.stringify(mockRecords));
      await p.evaluate(async()=>{SansaAtlasStore.note('Naksansa A');await SansaAtlasStore.flush();});
      assert((await p.evaluate(()=>mockWrites)).every(path=>path.startsWith('users/A/secretAtlas/naksansa-005')));
      const before=JSON.parse(protectedCloud),after=await p.evaluate(()=>mockRecords);
      for(const [key,value] of Object.entries(before))if(key!=='users/A/secretAtlas/naksansa-005')assert.deepEqual(after[key],value);
      await p.evaluate(async()=>{await mockSignIn('B');SansaAtlasStore.connect();SansaAtlasStore.note('Naksansa B');await SansaAtlasStore.flush();await mockSignIn('A');SansaAtlasStore.connect();});
      assert.equal(await p.evaluate(()=>SansaAtlasStore.state.note.text),'Naksansa A');
      await p.evaluate(async()=>{await mockSignIn(null);SansaAtlasStore.connect();});
      assert.equal(await p.evaluate(()=>localStorage.getItem('sansaSecretAtlas_v1:guest:naksansa-005')),guest4);
      for(const [url,id] of [['/atlas/','haeinsa-001'],['/atlas/bulguksa/','bulguksa-002'],['/atlas/tongdosa/','tongdosa-003'],['/atlas/songgwangsa/','songgwangsa-004']]){
        await p.goto('https://sansanote.com'+url);await p.waitForFunction(()=>window.SansaAtlasStore);assert.equal(await p.evaluate(()=>Object.keys(SansaAtlasStore.state.cards).length),3);assert.equal(await p.evaluate(()=>SansaAtlasStore.state.position.scene),7);assert.equal(await p.evaluate(()=>SansaAtlasStore.state.note.text),'keep '+id);assert.equal(await p.evaluate(id=>localStorage.getItem('sansaSecretAtlas_v1:guest:'+id),id),saved[id]);
      }
      console.log('PASS realistic old four-episode cards/position/notes restore; A/B/guest isolation; unrelated temple excluded; mock pilgrimage/108 records unchanged');await p.close();
    }
    const p = await b.newPage({ serviceWorkers: 'block' }); await route(p);
    await p.route('**/naksansa/content.js*', r => r.fulfill({ path: 'atlas/bulguksa/content.js' }));
    await p.goto('https://sansanote.com/atlas/naksansa/');
    assert(await p.locator('#startAtlas').isDisabled());
    assert.equal(await p.evaluate(() => typeof window.SansaAtlasStore), 'undefined');
    console.log('PASS mismatched episode content refuses startup without opening a wrong progress namespace');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
