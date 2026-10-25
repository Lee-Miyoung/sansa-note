const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{chromium}=require('playwright'),{route}=require('./atlas-fixtures.cjs');
function content(file){const c={window:{}};vm.runInNewContext(fs.readFileSync(file,'utf8'),c);return c.window.SansaAtlasContent;}
const episodes=JSON.parse(fs.readFileSync('scripts/atlas/episodes.json')).map(e=>({url:e.href,data:content(e.href.slice(1)+'content.js')}));
assert.equal(episodes[0].data.id,'haeinsa-001');assert.equal(episodes[1].data.id,'bulguksa-002');assert.equal(episodes[2].data.id,'tongdosa-003');
for(const{data:c}of episodes){assert.equal(c.scenes.length,12);assert.equal(new Set(c.scenes.map(s=>s.art)).size,12);assert.equal(c.quizzes.length,6);assert.equal(c.cards.length,3);assert(c.scenes.every(s=>s.paragraphs.length===3));}
async function answer(p,q){
 if(q.type==='order'||q.type==='sequence'){const order=q.items.map((_,i)=>i);for(let pos=0;pos<q.correct.length;pos++){let at=order.indexOf(q.correct[pos]);while(at>pos){await p.locator('[data-atlas=up][data-index="'+at+'"]').click();[order[at],order[at-1]]=[order[at-1],order[at]];at--;}}}
 else if(q.type==='match'){for(let i=0;i<q.correct.length;i++)await p.locator('[data-match="'+i+'"]').selectOption(String(q.correct[i]));}
 else for(const i of q.correct)await p.locator('[name=atlasAnswer][value="'+i+'"]').check();
 await p.locator('[data-atlas=check]').click();assert(await p.locator('.atlas-answer').evaluate(e=>e.classList.contains('correct')),q.id);
}
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 for(const width of (process.env.SANSA_WIDTHS?process.env.SANSA_WIDTHS.split(',').map(Number):[320,390,412,768,820,1440])){
  const context=await b.newContext({serviceWorkers:'block',viewport:{width,height:1000},hasTouch:width<1000}),p=await context.newPage();await route(p);
  await p.addInitScript(()=>{localStorage.setItem('atlasProtectedFixture',JSON.stringify({pilgrimage:'keep',guardian108:'keep',game:'keep'}));});
  let haeinsaSnapshot;
  for(const {url,data:c}of (process.env.SANSA_CAROUSEL_ONLY?[]:episodes)){
   await p.goto('https://sansanote.com'+url);await p.waitForFunction(()=>window.SansaAtlasStore&&window.sansaSecretAtlas);
   assert.equal(await p.evaluate(()=>SansaAtlasContent.id),c.id);
   const protectedBefore=await p.evaluate(()=>localStorage.getItem('atlasProtectedFixture'));
   await p.locator('#startAtlas').click();assert((await p.locator('.atlas-intro h1').innerText()).includes(c.templeName));
   await p.locator('[data-atlas=resume]').click();const range=p.locator('#atlasSceneRange');await range.focus();await range.press('End');await p.waitForFunction(()=>sansaSecretAtlas.view.scene===11);assert.equal(await p.evaluate(()=>Object.keys(SansaAtlasStore.state.cards).length),0,'jumping alone must not award skipped scenes');await range.press('Home');await p.waitForFunction(()=>sansaSecretAtlas.view.scene===0);
   for(let i=0;i<12;i++){
    assert.equal(await p.evaluate(()=>sansaSecretAtlas.view.scene),i);assert.equal(await p.locator('#atlasSceneRange').inputValue(),String(i+1));
    const prose=await p.locator('.atlas-prose').innerText();assert(prose.length>100&&prose.length<260);assert(!/창작 대사|무념스님이 무엇|사실·해석·창작/.test(prose));assert(await p.locator('.atlas-keyword').count()>0);
    if(c.id==='bulguksa-002'&&[4,5].includes(i))assert(prose.includes('전설'));
    await p.locator('.atlas-reader figure img').evaluate(im=>im.decode());assert.equal(await p.locator('.atlas-image-error').count(),0);
    assert.equal(await p.locator('.atlas-history').getAttribute('open'),null);await p.locator('.atlas-history summary').click();assert(await p.locator('.atlas-history a').count()>0);await p.locator('.atlas-history summary').click();
    if(i===2&&[390,820,1440].includes(width)){await p.locator('#atlasBody').evaluate(e=>e.scrollTop=0);await p.screenshot({path:'/tmp/'+c.id+'-reader-'+width+'.png'});}
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await p.locator('[data-atlas=next]').click();
   }
   assert.equal(await p.evaluate(()=>Object.keys(SansaAtlasStore.state.cards).length),3);
   await p.locator('.atlas-card-grid img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));
   const earned=await p.evaluate(()=>JSON.stringify(SansaAtlasStore.state.cards));
   for(let i=0;i<6;i++){await p.evaluate(i=>{const r=sansaSecretAtlas.capture();sansaSecretAtlas.restore({...r,view:{...r.view,page:'quiz',quiz:i},order:SansaAtlasContent.quizzes[i].items?.map((_,j)=>j)||[],selection:[],feedback:null});},i);await answer(p,c.quizzes[i]);}
   assert.equal(await p.evaluate(()=>JSON.stringify(SansaAtlasStore.state.cards)),earned);
   await p.locator('[data-atlas=note]').click();await p.locator('#atlasNote').fill(c.templeName+'만의 기록');await p.reload();await p.waitForFunction(()=>window.SansaAtlasStore);assert.equal(await p.evaluate(()=>SansaAtlasStore.state.note.text),c.templeName+'만의 기록');assert.equal(await p.evaluate(()=>Object.keys(SansaAtlasStore.state.answers).length),6);
   assert.equal(await p.evaluate(()=>localStorage.getItem('atlasProtectedFixture')),protectedBefore);
   const raw=await p.evaluate(id=>localStorage.getItem('sansaSecretAtlas_v1:guest:'+id),c.id);if(c.id==='haeinsa-001')haeinsaSnapshot=raw;else assert.equal(await p.evaluate(()=>localStorage.getItem('sansaSecretAtlas_v1:guest:haeinsa-001')),haeinsaSnapshot,'Bulguksa must not change Haeinsa');
   await p.locator('#startAtlas').click();await p.locator('[data-atlas=resume]').click();await p.goBack();await p.waitForFunction(()=>sansaSecretAtlas.view.page==='intro');await p.locator('[data-atlas=resume]').click();await p.locator('[data-atlas=close]').click();assert(!await p.locator('#secretAtlasOverlay').evaluate(e=>e.classList.contains('show')));
   if(c.id==='haeinsa-001')haeinsaSnapshot=await p.evaluate(()=>localStorage.getItem('sansaSecretAtlas_v1:guest:haeinsa-001'));
   console.log('PASS episode',width,c.id,'12 scenes, real slider keyboard, 6 answers, 3 cards, independent note/reload, Back/X, images');
  }
  await p.goto('https://sansanote.com/');await p.evaluate(()=>startLocalMode());const track=p.locator('#homeAtlasTrack');await track.scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.getElementById('homeAtlasEntry').dataset.catalogReady==='true');assert.equal(await p.locator('#homeAtlasPage').innerText(),(width>=1100?'1–4':width>=701?'1–3':'1')+' / '+10);await p.locator('#homeAtlasNext').click();await p.waitForFunction(()=>document.querySelector('#homeAtlasTrack').scrollLeft>(document.querySelectorAll('.home-atlas-card')[1].getBoundingClientRect().left-document.querySelectorAll('.home-atlas-card')[0].getBoundingClientRect().left)*.95);assert.equal(await p.locator('[data-atlas-slide="1"]').getAttribute('aria-current'),'true');await p.locator('[data-atlas-slide="0"]').click();await p.waitForFunction(()=>document.querySelector('#homeAtlasTrack').scrollLeft<1);
  if(width<1000){const box=await track.boundingBox(),cdp=await context.newCDPSession(p),start=box.x+box.width*.86,end=box.x+box.width*.12,y=box.y+Math.min(box.height*.5,65);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start,y}]});for(let n=1;n<=12;n++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start+(end-start)*n/12,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForFunction(()=>document.querySelector('#homeAtlasTrack').scrollLeft>(document.querySelectorAll('.home-atlas-card')[1].getBoundingClientRect().left-document.querySelectorAll('.home-atlas-card')[0].getBoundingClientRect().left)*.8);await cdp.detach();}
  else{await track.focus();await track.press('ArrowRight');await p.waitForFunction(()=>document.querySelector('#homeAtlasTrack').scrollLeft>(document.querySelectorAll('.home-atlas-card')[1].getBoundingClientRect().left-document.querySelectorAll('.home-atlas-card')[0].getBoundingClientRect().left)*.8);}
  assert.equal(await p.locator('.home-atlas-card').nth(1).getAttribute('href'),'/atlas/bulguksa/');
  await p.waitForFunction(()=>{const t=document.querySelector('#homeAtlasTrack'),cards=document.querySelectorAll('.home-atlas-card'),i=Number(document.querySelector('.home-atlas-dots [aria-current=true]').dataset.atlasSlide);return Math.abs(t.scrollLeft-Math.min(t.scrollWidth-t.clientWidth,i*(cards[1].getBoundingClientRect().left-cards[0].getBoundingClientRect().left)))<1;});await p.waitForTimeout(200);const previousActive=await p.locator('.home-atlas-dots [aria-current=true]').getAttribute('data-atlas-slide');await p.locator('#homeAtlasPrev').click();await p.waitForFunction(i=>document.querySelector('.home-atlas-dots [aria-current=true]').dataset.atlasSlide===String(Number(i)-1),previousActive);await p.locator('[data-atlas-slide="0"]').click();await p.waitForFunction(()=>document.querySelector('#homeAtlasTrack').scrollLeft<1);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));if([390,820,1440].includes(width))await p.screenshot({path:'/tmp/atlas-carousel-'+width+'.png'});console.log('PASS carousel',width,'next/previous/dots/native touch or keyboard, snap, correct links/no page overflow');
  await context.close();
 }
 // Authenticated adapter uses two paths in one account, then a second account. No real Firebase calls.
 const p=await b.newPage({serviceWorkers:'block'});await route(p);let records;
 for(const [index,{url,data:c}]of episodes.entries()){
  await p.goto('https://sansanote.com'+url);await p.waitForFunction(()=>window.mockSignIn&&window.SansaAtlasStore);
  if(records)await p.evaluate(r=>{window.mockRecords=r},records);
  await p.evaluate(async()=>{await mockSignIn('A');SansaAtlasStore.connect();SansaAtlasStore.note(SansaAtlasContent.templeName+' A');for(let i=0;i<12;i++)SansaAtlasStore.complete(i);await SansaAtlasStore.flush();});
  const snapshot=await p.evaluate(()=>({records:mockRecords,writes:mockWrites}));assert(snapshot.writes.every(x=>x==='users/A/secretAtlas/'+c.id||x.startsWith('users/A/secretAtlas/'+c.id+'/')));
  assert.deepEqual(snapshot.records['users/A/destinations'],{existing:{name:'해인사',visits:{v:{verified:true,ts:100}}}});assert.deepEqual(snapshot.records['users/A/guardianCards'],{keep:true});
  if(records)for(const [path,value] of Object.entries(records))if(path.startsWith('users/A/secretAtlas/'))assert.deepEqual(snapshot.records[path],value,'new episode must not modify an older episode');
  records=snapshot.records;
 }
 await p.goto('https://sansanote.com/atlas/bulguksa/');await p.waitForFunction(()=>window.SansaAtlasStore);await p.evaluate(async records=>{window.mockRecords=records;await mockSignIn('A');SansaAtlasStore.connect();},records);
 await p.evaluate(async()=>{await mockSignIn('B');SansaAtlasStore.connect();SansaAtlasStore.note('불국사 B');await SansaAtlasStore.flush();await mockSignIn('A');SansaAtlasStore.connect();});
 assert.equal(await p.evaluate(()=>SansaAtlasStore.state.note.text),'불국사 A');
 assert.equal(await p.evaluate(()=>mockRecords['users/B/secretAtlas/bulguksa-002'].note.text),'불국사 B');
 assert.equal(await p.evaluate(()=>mockRecords['users/A/secretAtlas/haeinsa-001'].note.text),'해인사 A');
 console.log('PASS authenticated mock A/B, independent episode paths/cards/notes, existing visit/108 fixture unchanged');
 const failed=await b.newPage({serviceWorkers:'block'});await route(failed);await failed.addInitScript(()=>localStorage.setItem('sansaSecretAtlas_v1:guest:haeinsa-001','preserved-old-record'));await failed.route('**/atlas/bulguksa/content.js*',r=>r.abort());await failed.goto('https://sansanote.com/atlas/bulguksa/');assert((await failed.locator('#publicAtlasStatus').innerText()).includes('자료를 불러오지 못'));assert(await failed.locator('#startAtlas').isDisabled());assert.equal(await failed.evaluate(()=>typeof window.SansaAtlasStore),'undefined');assert.equal(await failed.evaluate(()=>localStorage.getItem('sansaSecretAtlas_v1:guest:haeinsa-001')),'preserved-old-record');console.log('PASS missing episode content blocks store/auth startup without touching old Haeinsa key');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
