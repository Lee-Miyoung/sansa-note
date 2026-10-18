const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),catalog=JSON.parse(fs.readFileSync(path.join(root,'audio/meditation/catalog.json')));
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium'});try{for(const width of [390,820,412,1440]){
 const page=await browser.newPage({serviceWorkers:'block',viewport:{width,height:1000},hasTouch:width<1000,isMobile:width<1000});const audioRequests=[];
 await page.route('**/*',r=>{const u=new URL(r.request().url()),file=path.join(root,u.pathname==='/'?'index.html':decodeURIComponent(u.pathname));if(/audio\/meditation\/.*\.mp3/.test(u.pathname))audioRequests.push(u.pathname);return u.origin==='https://sansanote.com'&&fs.existsSync(file)&&fs.statSync(file).isFile()?r.fulfill({path:file}):r.abort();});
 await page.addInitScript(()=>{if(!localStorage.getItem('travelDiaryLocalData'))localStorage.setItem('travelDiaryLocalData',JSON.stringify({existing:{name:'조계사',region:'수도권',stage:1,visits:{mine:{verified:true,ts:Date.now(),date:'2026-10-18'}},photos:{}}}));localStorage.setItem('sansaBeatBest','999');});
 await page.goto('https://sansanote.com/');await page.evaluate(()=>startLocalMode());
 const preserved=await page.evaluate(()=>({records:localStorage.getItem('travelDiaryLocalData'),score:localStorage.getItem('sansaBeatBest')}));
 await page.evaluate(()=>openWorryOverlay());await page.locator('[data-emotion=tired]').click();await page.waitForTimeout(180);
 const close=page.locator('#worryOverlay .close-x');width<1000?await close.tap():await close.click();
 assert.equal(await page.locator('#worryOverlay').evaluate(e=>e.classList.contains('show')),false);await page.waitForTimeout(180);
 assert.equal(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('sansaNavigation_v1')).some(r=>r.ids.includes('worryOverlay'))),false);
 await page.goBack();await page.waitForTimeout(180);assert.equal(await page.locator('#worryOverlay').evaluate(e=>e.classList.contains('show')),false);
 await page.goForward();await page.waitForTimeout(180);assert.equal(await page.locator('#worryOverlay').evaluate(e=>e.classList.contains('show')),false);
 await page.evaluate(()=>openWorryOverlay());assert.equal(await page.locator('#worryOverlay').evaluate(e=>e.classList.contains('show')),true);await page.locator('#worryOverlay .close-x').click();
 await page.reload();await page.evaluate(()=>startLocalMode());await page.waitForTimeout(200);assert.equal(await page.locator('#worryOverlay').evaluate(e=>e.classList.contains('show')),false);
 await page.evaluate(()=>openDetail('existing'));await page.locator('#visitNoteInput').fill('저장 전 감상은 보존');page.once('dialog',dialog=>dialog.dismiss());await page.locator('#detailOverlay .close-x').click();assert.equal(await page.locator('#detailOverlay').evaluate(e=>e.classList.contains('show')),true);assert.equal(await page.locator('#visitNoteInput').inputValue(),'저장 전 감상은 보존');await page.locator('#visitNoteInput').fill('');await page.locator('#detailOverlay .close-x').click();

 // Close windows in a different order, including synchronous repeated mouse clicks.
 await page.evaluate(()=>{openMoktakOverlay();openVowOverlay();openMantraOverlay();document.querySelector('#moktakOverlay .close-x').click();document.querySelector('#mantraOverlay .close-x').click();document.querySelector('#vowOverlay .close-x').click();});await page.waitForTimeout(200);
 for(const id of ['moktakOverlay','mantraOverlay','vowOverlay'])assert.equal(await page.locator('#'+id).evaluate(e=>e.classList.contains('show')),false,'rapid close '+id);
 await page.evaluate(()=>{openMoktakOverlay();openVowOverlay();openMantraOverlay();document.querySelector('#mantraOverlay .close-x').click();document.querySelector('#vowOverlay .close-x').click();document.querySelector('#moktakOverlay .close-x').click();});await page.waitForTimeout(200);for(const id of ['moktakOverlay','mantraOverlay','vowOverlay'])assert.equal(await page.locator('#'+id).evaluate(e=>e.classList.contains('show')),false,'reverse close '+id);
 for(let i=0;i<3;i++){await page.evaluate(()=>openBreathOverlay('counting'));await page.locator('#breathOverlay .close-x').click();}
 await page.evaluate(()=>openBreathOverlay('counting'));await page.waitForFunction(()=>document.querySelectorAll('#meditationSound option').length===9);
 assert.equal(await page.evaluate(()=>sansaMeditationSound.activeCount),0);assert.equal(audioRequests.length,0);assert.equal(await page.locator('#meditationSound').inputValue(),'');
 assert((await page.locator('#breathMonk').getAttribute('src')).includes('monk-meditation.png'));await page.locator('#breathMonk').evaluate(e=>e.decode());
 assert.equal(await page.locator('#breathMonk').evaluate(e=>getComputedStyle(e).objectFit),'contain');
 for(const track of catalog){
  await page.locator('#meditationSound').selectOption(track.id);await page.locator('#meditationPlay').click();
  await page.waitForFunction(()=>sansaMeditationSound.media.currentTime>.15&&!sansaMeditationSound.media.paused);
  assert.equal(await page.evaluate(()=>sansaMeditationSound.activeCount),1);assert(await page.evaluate(()=>sansaMeditationSound.media.duration>1));
  await page.locator('#meditationPause').click();const at=await page.evaluate(()=>sansaMeditationSound.media.currentTime);await page.waitForTimeout(150);assert(Math.abs(await page.evaluate(()=>sansaMeditationSound.media.currentTime)-at)<.04);
  await page.locator('#meditationPlay').click();await page.waitForFunction(t=>sansaMeditationSound.media.currentTime>t+.1,at);
  await page.locator('#meditationStop').click();assert.equal(await page.evaluate(()=>sansaMeditationSound.activeCount),0);
 }
 await page.locator('#meditationVolume').evaluate(e=>{e.value='33';e.dispatchEvent(new Event('input'));});assert.equal(await page.evaluate(()=>sansaMeditationSound.media.volume),.33);
 await page.locator('#meditationPlay').click();await page.waitForFunction(()=>sansaMeditationSound.activeCount===1);await page.evaluate(()=>sansaMeditationSound.setDeadline(100));await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>sansaMeditationSound.activeCount),0);
 await page.locator('#meditationPlay').click();await page.waitForFunction(()=>sansaMeditationSound.activeCount===1);await page.evaluate(()=>openMoktakOverlay());await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>sansaMeditationSound.activeCount),0);await page.locator('#moktakOverlay .close-x').click();
 await page.evaluate(async()=>{const a=document.getElementById('playlistAudio');a.src='./audio/meditation/piano.mp3';await a.play();});await page.waitForFunction(()=>!document.getElementById('playlistAudio').paused);
 await page.evaluate(()=>openBreathOverlay('counting'));assert.equal(await page.locator('#meditationSound').inputValue(),'');assert.equal(await page.evaluate(()=>sansaMeditationSound.activeCount),0);assert.equal(await page.locator('#playlistAudio').evaluate(a=>a.paused),true);
 await page.locator('#meditationSound').selectOption('bowl');await page.locator('#meditationSoundPreview').click();await page.waitForFunction(()=>sansaMeditationSound.activeCount===1);await page.waitForTimeout(12100);assert.equal(await page.evaluate(()=>sansaMeditationSound.activeCount),0);await page.clock.install();await page.evaluate(()=>openBreathOverlay('counting'));await page.locator('#breathStartBtn').click();assert.equal(await page.locator('#breathCircle').innerText(),'들이쉬기');assert((await page.locator('#breathRemaining').innerText()).includes('56초'));
 await page.clock.runFor(3500);assert.equal(await page.locator('#breathCircle').innerText(),'내쉬기');assert.equal(await page.locator('#breathMonk').getAttribute('data-phase'),'내쉬기');await page.clock.runFor(52500);assert.equal(await page.locator('#breathCircle').innerText(),'수고했어요');assert.equal(await page.evaluate(()=>sansaMeditationSound.activeCount),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const monkFit=await page.locator('#breathMonk').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return r.left>=p.left&&r.right<=p.right&&r.top>=p.top&&r.bottom<=p.bottom;});assert(monkFit);
 assert.deepEqual(await page.evaluate(()=>({records:localStorage.getItem('travelDiaryLocalData'),score:localStorage.getItem('sansaBeatBest')})),preserved);
 await page.screenshot({path:'/tmp/integrated-breath-'+width+'.png',fullPage:true});
 console.log('PASS',width,'close/touch/saved-state/reopen/rapid order; official monk; unchanged 56s timer; 8 real MP3 decode/play/pause/resume/stop; silence/single audio/deadline/navigation; legacy fixtures unchanged');await page.close();
 }}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
