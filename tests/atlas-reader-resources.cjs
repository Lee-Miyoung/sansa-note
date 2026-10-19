const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright'),{route}=require('./atlas-fixtures.cjs');
(async()=>{
 for(const d of [{name:'iphone',engine:webkit,width:390,height:844,dpr:3},{name:'ipad',engine:webkit,width:820,height:1180,dpr:2},{name:'galaxy',engine:chromium,width:412,height:915,dpr:2.625}]){
  const b=await d.engine.launch(d.engine===chromium?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{executablePath:'/workspace/.sansa-webkit-run'});
  try{
   const p=await b.newPage({viewport:{width:d.width,height:d.height},deviceScaleFactor:d.dpr,isMobile:true,hasTouch:true,serviceWorkers:'block'});await route(p);
   const requests=[];p.on('request',r=>requests.push(new URL(r.url()).pathname));
   await p.goto('https://sansanote.com'+(process.env.ATLAS_EPISODE_PATH||'/atlas/songgwangsa/'));await p.waitForFunction(()=>window.sansaSecretAtlas);
   assert(!requests.some(u=>/\/images\/(?:scene-|card-)/.test(u)),'landing must not preload story/cards');
   await p.locator('#startAtlas').click();await p.locator('[data-atlas=resume]').click();await p.locator('.atlas-reader figure img').evaluate(im=>im.decode());
   assert(!requests.some(u=>/\/images\/scene-(?:0[2-9]|1[0-2])/.test(u)),'opening scene must not preload the other eleven');
   const image=await p.locator('.atlas-reader figure img').evaluate(im=>({width:im.naturalWidth,src:im.currentSrc}));
   if(d.width<650){assert.equal(image.width,480);assert(image.src.includes('-small.webp'));}
   await p.locator('[data-atlas=fullscreen]').click();await p.screenshot({path:'/tmp/sansa-songgwangsa-'+d.name+'-expanded.png'});
   const liveBefore=await p.evaluate(()=>document.querySelectorAll('*').length);let cdp,before;
   if(d.engine===chromium){cdp=await p.context().newCDPSession(p);await cdp.send('HeapProfiler.collectGarbage');before=await cdp.send('Memory.getDOMCounters');}
   // Rapid changes used to retain image watchdog closures for detached reader DOMs.
   await p.evaluate(()=>{for(let i=0;i<120;i++){const r=sansaSecretAtlas.capture();sansaSecretAtlas.restore({...r,view:{...r.view,page:'reader',scene:i%12}});}});
   await p.locator('.atlas-reader figure img').evaluate(im=>im.decode());await p.waitForLoadState('networkidle');
   assert.equal(await p.locator('#secretAtlasOverlay').count(),1);assert.equal(await p.locator('.atlas-reader figure img').count(),1);
   const liveAfter=await p.evaluate(()=>document.querySelectorAll('*').length);assert(liveAfter<liveBefore+80,'visible DOM must remain bounded');
   let counters;
   if(cdp){await cdp.send('HeapProfiler.collectGarbage');const after=await cdp.send('Memory.getDOMCounters');assert(after.nodes<before.nodes+200,JSON.stringify({before,after}));counters={before,after};}
   await p.locator('[data-atlas=close]').click();
   console.log('PASS',d.name,'no unvisited-scene preloads; 120 scene replacements retain one reader/image; compact retina art;',JSON.stringify({image,liveBefore,liveAfter,counters}));
  }finally{await b.close();}
 }
 // Use the actual native API when available, in addition to the rejected/unsupported API tests.
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{const p=await b.newPage({viewport:{width:1440,height:1000},serviceWorkers:'block'});await route(p);await p.goto('https://sansanote.com'+(process.env.ATLAS_EPISODE_PATH||'/atlas/songgwangsa/'));await p.waitForFunction(()=>window.sansaSecretAtlas);await p.locator('#startAtlas').click();await p.locator('[data-atlas=resume]').click();
  if(await p.evaluate(()=>document.fullscreenEnabled)){
   const state=await p.evaluate(()=>JSON.stringify(SansaAtlasStore.state));await p.locator('[data-atlas=fullscreen]').click();await p.waitForFunction(()=>document.fullscreenElement===document.getElementById('secretAtlasOverlay'));await p.evaluate(()=>document.exitFullscreen());await p.waitForFunction(()=>document.querySelector('[data-atlas=fullscreen]').getAttribute('aria-pressed')==='false');assert.equal(await p.evaluate(()=>JSON.stringify(SansaAtlasStore.state)),state);console.log('PASS native Chromium fullscreen entry/exit preserves progress and resets the toggle');
  }else console.log('SKIP native API unavailable; fallback is covered by atlas-reading-controls');
  // A delayed native request must not re-enter fullscreen after a quick second tap.
  await p.addInitScript(()=>{Object.defineProperty(document,'fullscreenEnabled',{value:true,configurable:true});window.nativeExitCount=0;Element.prototype.requestFullscreen=()=>new Promise(resolve=>window.releaseNativeFullscreen=resolve);document.exitFullscreen=()=>{window.nativeExitCount++;return Promise.resolve();};});
  await p.reload();await p.waitForFunction(()=>window.sansaSecretAtlas);await p.locator('#startAtlas').click();await p.locator('[data-atlas=resume]').click();await p.locator('[data-atlas=fullscreen]').click();await p.locator('[data-atlas=fullscreen]').click();await p.evaluate(()=>releaseNativeFullscreen());await p.waitForFunction(()=>nativeExitCount===1);assert.equal(await p.locator('[data-atlas=fullscreen]').getAttribute('aria-pressed'),'false');console.log('PASS delayed native response after quick toggle exits cleanly');

 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
