const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const {route}=require('./atlas-fixtures.cjs');
const episodes=[['/atlas/','/admin-atlas/images/secret-atlas/','webp'],['/atlas/bulguksa/','/atlas/bulguksa/images/','webp'],['/atlas/tongdosa/','/atlas/tongdosa/images/','svg']];
(async()=>{
 for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
  const b=await engine.launch(engine===chromium?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{executablePath:'/workspace/.sansa-webkit-run'});
  try{
   for(const [url,artBase,ext]of episodes)for(const mode of ['first-fails','small-fails','all-fail']){
    const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:'block'});await route(p);
    await p.addInitScript(()=>localStorage.setItem('protected-art-fixture',JSON.stringify({photo:'keep',visits:'keep',guardian108:'keep'})));
    if(process.env.SANSA_ART_BASELINE)await p.route('**/atlas/renderer.js*',r=>r.fulfill({path:'/tmp/sansa-renderer-before-art-retry.js',contentType:'application/javascript'}));
    const requests=[];let allow=false;
    await p.route('**/*scene-01*',r=>{
     const u=new URL(r.request().url());if(!u.pathname.startsWith(artBase))return r.fallback();
     requests.push(u.pathname+u.search);
     if(!allow&&(mode==='all-fail'||mode==='first-fails'&&requests.length===1||mode==='small-fails'&&u.pathname.endsWith('-small.'+ext)))return r.abort();
     return r.fallback();
    });
    await p.goto('https://sansanote.com'+url);await p.waitForFunction(()=>window.sansaSecretAtlas);await p.locator('#startAtlas').click();await p.locator('[data-atlas=resume]').click();
    const state=await p.evaluate(()=>JSON.stringify(SansaAtlasStore.state));
    if(mode==='all-fail'){
     await p.locator('.atlas-art-retry button').waitFor({timeout:6000});
     assert.equal(requests.length,3,'automatic retries must be bounded');
     allow=true;await p.locator('.atlas-art-retry button').click();
    }
    await p.waitForFunction(()=>{const im=document.querySelector('.atlas-reader figure img');return im?.complete&&im.naturalWidth>0&&!im.classList.contains('atlas-image-error');},null,{timeout:6000});
    assert.equal(await p.locator('.atlas-art-retry').count(),0);
    assert.equal(await p.evaluate(()=>JSON.stringify(SansaAtlasStore.state)),state,'image recovery must not change progress/cards/notes');
    assert.equal(await p.evaluate(()=>localStorage.getItem('protected-art-fixture')),JSON.stringify({photo:'keep',visits:'keep',guardian108:'keep'}));
    assert(requests[0].includes('-small.'+ext),'a 3x-density phone must start with the compact image');
    if(mode==='small-fails')assert(requests.at(-1).startsWith(artBase+'scene-01.'+ext),'missing compact variant falls back to the original');
    console.log('PASS',name,url,mode,'retina phone uses compact art; image recovers; retries bounded; progress and protected records unchanged');await p.close();
   }
   if(name==='webkit'){
    const p=await b.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});await route(p);let allow=false;
    await p.route('**/*scene-01*',r=>allow?r.fallback():undefined);
    await p.goto('https://sansanote.com/atlas/tongdosa/');await p.waitForFunction(()=>window.sansaSecretAtlas);await p.locator('#startAtlas').click();await p.locator('[data-atlas=resume]').click();
    await p.locator('.atlas-art-retry button').waitFor({timeout:14000});allow=true;await p.locator('.atlas-art-retry button').click();
    await p.waitForFunction(()=>document.querySelector('.atlas-reader figure img')?.naturalWidth>0);
    console.log('PASS WebKit pending request without error exposes a working retry control');await p.close();
   }
  }finally{await b.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
