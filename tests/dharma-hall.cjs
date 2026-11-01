const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {fullRoute}=require('./unified-fixtures.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of (process.env.SANSA_WIDTHS?process.env.SANSA_WIDTHS.split(',').map(Number):[320,390,768,1440])){
   const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});
   await fullRoute(page);const audioRequests=[];
   page.on('request',r=>{if(/\.(mp3|wav)(\?|$)/.test(r.url()))audioRequests.push(r.url())});
   await page.goto('https://sansanote.com/');await page.waitForFunction(()=>window.SansaDharmaHall);
   await page.evaluate(()=>SansaDharmaHall.ready);await page.evaluate(()=>startLocalMode());
   await page.locator('#dharmaHallEntry').click();
   assert(await page.locator('#dharmaHallOverlay').isVisible());
   assert.equal(await page.locator('#hallSound option').count(),5,'only verified audio choices');
   assert.equal(await page.evaluate(()=>SansaDharmaHall.media.paused),true);
   assert.equal(audioRequests.length,0,'entry remains silent and never fetches audio');
   if(width===320){
    await page.evaluate(()=>{closeDharmaHall();openPlaylistOverlay();loadSong(0,true)});
    await page.waitForFunction(()=>!document.querySelector('#playlistAudio').paused&&document.querySelector('#playlistAudio').currentTime>0);
    await page.evaluate(()=>openDharmaHall());
    assert.equal(await page.evaluate(()=>document.querySelector('#playlistAudio').paused),true,'entering hall stops the existing playlist');
    audioRequests.length=0;
   }
   assert.equal(await page.locator('#memberActionDialog').count(),0,'public entry');
   const fit=await page.locator('#dharmaHallOverlay .modal').evaluate(e=>({width:innerWidth,scroll:e.scrollWidth,client:e.clientWidth,children:[...e.querySelectorAll('.hall-modes button,.hall-controls button,.hall-scene')].map(n=>n.getBoundingClientRect().toJSON())}));
   assert(fit.scroll<=fit.client+1,JSON.stringify(fit));
   for(const r of fit.children)assert(r.x>=-1&&r.right<=width+1,JSON.stringify(r));
   await page.locator('[data-mode=ceremony]').click();
   await page.clock.install();await page.locator('#hallPlay').click();
   await page.clock.fastForward(30200);assert.equal(await page.evaluate(()=>SansaDharmaHall.state.stage),1);
   assert.equal(await page.locator('#hallStep').innerText(),'호흡 가다듬기');
   await page.clock.fastForward(10000);assert.equal(await page.evaluate(()=>SansaDharmaHall.state.stage),2);
   await page.locator('#hallOneBow').click();assert.equal(await page.locator('#hallThreeCount').innerText(),'1 / 3배');
   await page.locator('#hallThreeBows').click();assert(await page.locator('#hallMonk').evaluate(e=>e.classList.contains('is-bowing')));
   await page.locator('#hallPause').click();const elapsed=await page.evaluate(()=>SansaDharmaHall.state.elapsed);
   await page.clock.fastForward(20000);assert.equal(await page.evaluate(()=>SansaDharmaHall.state.elapsed),elapsed,'paused timer does not advance');
   await page.locator('#hallPlay').click();await page.clock.fastForward(60000);
   assert.equal(await page.evaluate(()=>SansaDharmaHall.state.stage),3);
   assert.equal(await page.locator('#hallStep').innerText(),'염불 듣기');
   assert.equal(await page.evaluate(()=>SansaDharmaHall.state.three),3);
   await page.clock.fastForward(120000);assert.equal(await page.evaluate(()=>SansaDharmaHall.state.stage),4);
   await page.clock.fastForward(80000);assert.equal(await page.evaluate(()=>SansaDharmaHall.state.running),false);
   assert.equal(await page.evaluate(()=>SansaDharmaHall.state.elapsed),300);
   await page.locator('[data-mode=bows]').click();await page.locator('#hallPace').selectOption('8');
   await page.locator('#hallPlay').click();await page.clock.fastForward(8100);
   assert.equal(await page.evaluate(()=>SansaDharmaHall.state.count),1);
   await page.locator('#hallPause').click();await page.locator('#hallPace').selectOption('0');
   await page.locator('#hallCount').click();assert.equal(await page.evaluate(()=>SansaDharmaHall.state.count),2);
   await page.locator('#hallUndo').click();assert.equal(await page.evaluate(()=>SansaDharmaHall.state.count),1);
   await page.locator('#hallStop').click();assert.equal(await page.evaluate(()=>SansaDharmaHall.state.count),0);
   await page.evaluate(()=>{for(let i=0;i<110;i++)document.querySelector('#hallCount').click()});
   assert.equal(await page.evaluate(()=>SansaDharmaHall.state.count),108);assert(await page.locator('#hallCount').isDisabled());
   await page.locator('#hallClose').click();assert.equal(await page.evaluate(()=>SansaDharmaHall.media.paused),true);
   assert.equal(await page.evaluate(()=>SansaDharmaHall.state.running),false);
   assert.equal(audioRequests.length,0);assert.deepEqual(await page.evaluate(()=>mockWrites),[],'no Firebase writes');
   await page.evaluate(()=>openDharmaHall());await page.clock.fastForward(250);
   await page.screenshot({path:`/tmp/dharma-hall-${width}.png`});
   console.log('PASS',width,'silent guest entry, 4 verified recordings, 7-stage 5-minute practice/pause/completion, adjustable and manual 108 bows, bounded count, exit cleanup, no Firebase writes, responsive fit');
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
