const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright'),{route}=require('./atlas-fixtures.cjs');
const episodes=JSON.parse(fs.readFileSync('scripts/atlas/episodes.json'));
const devices=[
 {name:'PC Chromium',engine:chromium,viewport:{width:1440,height:1000},isMobile:false,deviceScaleFactor:1},
 {name:'iPhone Safari WebKit emulation',engine:webkit,viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:3},
 {name:'iPad Safari WebKit emulation',engine:webkit,viewport:{width:820,height:1180},isMobile:true,deviceScaleFactor:2},
 {name:'Galaxy Chrome Chromium emulation',engine:chromium,viewport:{width:412,height:915},isMobile:true,deviceScaleFactor:2.625,userAgent:'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'}
];
async function dockVisible(p){
 const r=await p.evaluate(()=>{const dock=document.querySelector('.atlas-reader-dock'),a=dock.getBoundingClientRect(),body=document.getElementById('atlasBody').getBoundingClientRect();return{display:getComputedStyle(dock).display,hidden:dock.hidden,top:a.top,bottom:a.bottom,left:a.left,right:a.right,w:innerWidth,h:innerHeight,bodyBottom:body.bottom,buttons:[...dock.querySelectorAll('button')].map(b=>b.getBoundingClientRect().height)};});
 assert(!r.hidden&&r.display!=='none');assert(r.top>=0&&r.bottom<=r.h+1&&r.left>=-1&&r.right<=r.w+1,JSON.stringify(r));assert(r.bodyBottom<=r.top+1);assert(r.buttons.every(h=>h>=44));
}
(async()=>{
 for(const d of devices){
  const b=await d.engine.launch(d.engine===chromium?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{executablePath:'/workspace/.sansa-webkit-run'});
  try{
   for(const e of episodes){
    const p=await b.newPage({viewport:d.viewport,isMobile:d.isMobile,deviceScaleFactor:d.deviceScaleFactor,hasTouch:d.isMobile,userAgent:d.userAgent,serviceWorkers:'block'});await route(p);
    const errors=[];p.on('pageerror',e=>errors.push(e.message));
    // Exercise an unavailable/rejected native Fullscreen API: the enlarged reader must still work on iOS.
    await p.addInitScript(()=>Object.defineProperty(document,'fullscreenEnabled',{value:false,configurable:true}));
    await p.goto('https://sansanote.com'+e.href);await p.waitForFunction(()=>window.sansaSecretAtlas);await p.locator('#startAtlas').click();await p.locator('[data-atlas=resume]').click();
    await dockVisible(p);assert(await p.locator('.atlas-reader-dock [data-atlas=prev]').isDisabled());
    await p.evaluate(()=>document.getElementById('atlasBody').scrollTop=100000);await dockVisible(p);
    await p.locator('[data-atlas=next]').click();assert.equal(await p.evaluate(()=>sansaSecretAtlas.view.scene),1);assert.equal(await p.evaluate(()=>Object.keys(SansaAtlasStore.state.completed).length),1);
    const state=await p.evaluate(()=>JSON.stringify(SansaAtlasStore.state));await p.locator('[data-atlas=fullscreen]').click();
    assert.equal(await p.locator('[data-atlas=fullscreen]').getAttribute('aria-pressed'),'true');assert.equal(await p.evaluate(()=>JSON.stringify(SansaAtlasStore.state)),state);await dockVisible(p);
    const box=await p.locator('.atlas-shell').boundingBox();assert(Math.abs(box.width-d.viewport.width)<2&&Math.abs(box.height-d.viewport.height)<2,JSON.stringify(box));assert(!await p.locator('.atlas-bottom').isVisible());
    await p.locator('[data-atlas=font]').click();await dockVisible(p);
    await p.locator('[data-atlas=prev]').click();assert.equal(await p.evaluate(()=>sansaSecretAtlas.view.scene),0);
    await p.locator('[data-atlas=fullscreen]').click();assert.equal(await p.locator('[data-atlas=fullscreen]').getAttribute('aria-pressed'),'false');assert(await p.locator('.atlas-bottom').isVisible());await dockVisible(p);
    await p.locator('#atlasSceneRange').focus();await p.locator('#atlasSceneRange').press('End');assert.equal(await p.evaluate(()=>sansaSecretAtlas.view.scene),11);assert.equal(await p.locator('[data-atlas=next]').innerText(),'카드 보기 →');
    await p.locator('[data-atlas=next]').click();assert.equal(await p.evaluate(()=>sansaSecretAtlas.view.page),'cards');assert.equal(await p.evaluate(()=>Object.keys(SansaAtlasStore.state.cards).length),0,'jumping must not award skipped cards');assert(!await p.locator('.atlas-reader-dock').isVisible());
    await p.locator('[data-atlas=close]').click();assert(!await p.locator('#secretAtlasOverlay').isVisible());assert.deepEqual(errors,[]);
    console.log('PASS',d.name,e.id,'persistent controls at top/bottom; UI-only expanded fallback; safe card gates; close');await p.close();
   }
   // Native request rejection must not generate an unhandled error or erase the expanded layout.
   const p=await b.newPage({viewport:d.viewport,serviceWorkers:'block'});await route(p);
   await p.addInitScript(()=>{Object.defineProperty(document,'fullscreenEnabled',{value:true,configurable:true});Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Unavailable on this device'));});
   await p.goto('https://sansanote.com/atlas/');await p.waitForFunction(()=>window.sansaSecretAtlas);await p.locator('#startAtlas').click();await p.locator('[data-atlas=resume]').click();await p.locator('[data-atlas=fullscreen]').click();await dockVisible(p);assert(await p.locator('#secretAtlasOverlay').evaluate(e=>e.classList.contains('atlas-expanded')));await p.locator('[data-atlas=close]').click();await p.close();
  }finally{await b.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
